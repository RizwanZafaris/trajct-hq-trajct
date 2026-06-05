import { Injectable, HttpException } from "@nestjs/common";
import { randomUUID, createHash } from "crypto";
import { Redis } from "ioredis";
import postgres from "postgres";
import { safeFetch, SSRFBlockedError } from "@trajct/core/engine";
import { scoreToBand } from "@trajct/contracts";
import type { RateJobRequest, RateJobResult, RateDimension, SaveRatingResult } from "@trajct/contracts";

/**
 * F-005 — Rate-a-job by URL/JD (synchronous; FRD §4.5.9). The candidate pastes any job URL or
 * JD text; we extract the JD, assert it IS a job, score 6 grounded dimensions vs the profile, and
 * hold the rating ephemerally (rate_token, TTL 24 h) until saved.
 *
 * Guards:
 *  - [SR-005.1] URL fetch goes through the SSRF-hardened safeFetch (private/loopback/metadata IPs
 *    are blocked); a blocked or dead URL → 422 EXTRACT_FAILED with a paste-the-JD fallback.
 *  - [BR-005.3/FR-005.6] 20 ratings/hour/user, FAIL-CLOSED (limiter down → deny) → 429.
 *  - [BR-005.1/FR-005.5] Non-job content → 422 NOT_A_JOB_POSTING.
 *  - [NFR-005.3] A real job never yields a blank/zero rating; every dimension has an explanation.
 */

const RATE_LIMIT_PER_HOUR = 20;       // BR-005.3
const JD_MAX_CHARS = 20000;           // FR-005.1
const TOKEN_TTL_SECONDS = 86400;      // BR-005.2: 24 h

@Injectable()
export class RateService {
  private sql: ReturnType<typeof postgres> | null = null;
  private redis: Redis | null = null;

  private getSql(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }
  private getRedis(): Redis {
    if (!this.redis) {
      this.redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", { maxRetriesPerRequest: 2, enableReadyCheck: false });
    }
    return this.redis;
  }

  async rate(req: RateJobRequest, userId: string): Promise<RateJobResult> {
    // BR-005.4 — URL must be http(s) and ≤2,048 chars.
    if (req.jobUrl !== undefined) {
      let u: URL | null = null;
      try { u = new URL(req.jobUrl); } catch { u = null; }
      if (!u || (u.protocol !== "http:" && u.protocol !== "https:") || req.jobUrl.length > 2048) {
        throw this.err(400, "BAD_URL", "Enter a valid job link.", false);
      }
    }

    await this.enforceRateLimit(userId);                       // BR-005.3 (fail-closed)

    // Extract the JD (URL via SSRF-safe fetch, or pasted text).
    let raw: string;
    let truncated = false;
    if (req.jobUrl) {
      try {
        const fetched = await safeFetch(req.jobUrl, { timeoutMs: 6000, maxBytes: 2 * 1024 * 1024 });
        if (fetched.statusCode >= 400) throw new Error(`status ${fetched.statusCode}`);
        raw = stripHtml(fetched.text);
      } catch (e) {
        // SSRF-blocked, dead, login-walled, or JS-only → honest error + paste fallback (AC-005.1.2/.5).
        void (e instanceof SSRFBlockedError);
        throw this.err(422, "EXTRACT_FAILED", "Couldn't open that link — paste the JD instead.", false);
      }
    } else {
      raw = stripHtml(req.jdText ?? "");
    }

    const jd = raw.trim();
    if (jd.length > JD_MAX_CHARS) { truncated = true; }       // truncate-with-notice (edge table)
    const jdClipped = jd.slice(0, JD_MAX_CHARS);

    // BR-005.1 / FR-005.5 — it must actually be a job posting.
    if (!looksLikeJob(jdClipped)) {
      throw this.err(422, "NOT_A_JOB_POSTING", "That doesn't look like a job posting.", false);
    }

    // Idempotent within TTL (content hash) — same JD re-rated returns the cached rating.
    const contentHash = createHash("sha256").update(`${userId}|${jdClipped}`).digest("hex");
    const idemKey = `rate:idem:${userId}:${contentHash}`;
    const cachedToken = await this.getRedis().get(idemKey).catch(() => null);
    if (cachedToken) {
      const cached = await this.getRedis().get(`rate:result:${cachedToken}`).catch(() => null);
      if (cached) return JSON.parse(cached) as RateJobResult;
    }

    const profileText = await this.profileText(userId);
    const dimensions = scoreDimensions(jdClipped, profileText);   // grounded, never blank (NFR-005.3)
    const overallScore = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
    const { company, role } = parseHeadline(jdClipped);

    const result: RateJobResult = {
      rateToken: randomUUID(),
      overallBand: scoreToBand(overallScore),
      overallScore,
      dimensions,
      company,
      role,
      truncated,
    };

    // Ephemeral hold (BR-005.2): rate_token TTL 24 h; candidate-private (Redis, no row until saved).
    await this.getRedis().set(`rate:result:${result.rateToken}`, JSON.stringify(result), "EX", TOKEN_TTL_SECONDS).catch(() => {});
    await this.getRedis().set(idemKey, result.rateToken, "EX", TOKEN_TTL_SECONDS, "NX").catch(() => {});
    return result;
  }

  /** Read a held rating by token (404 once expired). */
  async getRating(token: string): Promise<RateJobResult> {
    const cached = await this.getRedis().get(`rate:result:${token}`).catch(() => null);
    if (!cached) throw this.err(404, "NOT_FOUND", "This rating expired — rate the job again.", false);
    return JSON.parse(cached) as RateJobResult;
  }

  /** FR-005.4 — save a held rating into the candidate's pipeline (→ job_ratings, F-018). */
  async saveRating(token: string, userId: string): Promise<SaveRatingResult> {
    const r = await this.getRating(token);
    const ratingId = randomUUID();
    await this.getSql()`
      INSERT INTO job_ratings (id, user_id, job_url, jd_text, fit_score, band, reasons, model_version)
      VALUES (${ratingId}, ${userId}, ${null}, ${null}, ${r.overallScore}, ${r.overallBand},
              ${this.getSql().json(r.dimensions as never)}, ${"rate-v1"})
    `;
    return { ratingId, saved: true };
  }

  // ----- helpers ----------------------------------------------------------
  private async enforceRateLimit(userId: string): Promise<void> {
    const key = `rate:limit:${userId}`;
    try {
      const n = await this.getRedis().incr(key);
      if (n === 1) await this.getRedis().expire(key, 3600);
      if (n > RATE_LIMIT_PER_HOUR) {
        const ttl = await this.getRedis().ttl(key);
        throw this.err(429, "RATE_LIMITED", "Too many — try again shortly.", true, Math.max(ttl, 1));
      }
    } catch (e) {
      if (e instanceof HttpException) throw e;
      // [F-078] limiter unavailable → DENY (fail-closed), never wave through.
      throw this.err(429, "RATE_LIMITED", "Too many — try again shortly.", true, 60);
    }
  }

  private async profileText(userId: string): Promise<string> {
    const [p] = await this.getSql()`SELECT parsed_text FROM candidate_profiles WHERE user_id = ${userId} LIMIT 1`;
    return ((p?.["parsed_text"] as string | null) ?? "").trim();
  }

  private err(status: number, code: string, message: string, retryable: boolean, retryAfterSeconds?: number): HttpException {
    const body: Record<string, unknown> = { code, message, retryable };
    if (retryAfterSeconds !== undefined) body["retryAfterSeconds"] = retryAfterSeconds;
    return new HttpException(body, status);
  }
}

// --- pure helpers (exported for unit tests) --------------------------------

export function stripHtml(s: string): string {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** BR-005.1 — heuristic job-posting detector (≥2 distinct signals). */
export function looksLikeJob(text: string): boolean {
  const t = text.toLowerCase();
  const signals = [
    /responsibilit/, /requirement/, /qualif/, /we(?:'| a)re (?:looking|hiring)/, /you(?:'ll| will)\b/,
    /years? of experience/, /\bapply\b/, /job description/, /what you'?ll do/, /about the role/,
    /\bbenefits\b/, /\bsalary\b/, /full[- ]time/, /part[- ]time/, /\brole\b/, /\bteam\b.*\bhiring\b/,
  ];
  let hits = 0;
  for (const re of signals) if (re.test(t)) hits++;
  return hits >= 2;
}

const STOP = new Set(["the","a","an","and","or","of","to","in","for","with","on","at","by","is","are","be","as","we","you","our","your","this","that","will","have","has","they","their"]);
function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w))
  );
}
function overlapRatio(jd: Set<string>, prof: Set<string>): number {
  if (jd.size === 0) return 0;
  let hit = 0;
  for (const w of jd) if (prof.has(w)) hit++;
  return hit / jd.size;
}

/**
 * Deterministic, grounded 6-dimension scoring (dev default). Each dimension scores 0–100 with a
 * NON-EMPTY explanation derived from the actual JD↔profile overlap — a real job never scores blank.
 */
export function scoreDimensions(jd: string, profileText: string): RateDimension[] {
  const jdTok = tokens(jd);
  const profTok = tokens(profileText);
  const cov = overlapRatio(jdTok, profTok);                 // shared vocabulary fraction
  const shared = [...jdTok].filter((w) => profTok.has(w)).slice(0, 6);
  const missing = [...jdTok].filter((w) => !profTok.has(w) && /^[a-z][a-z0-9+#.]{2,}$/.test(w)).slice(0, 6);
  const has = (re: RegExp) => re.test(profileText.toLowerCase());

  const base = Math.round(40 + cov * 55);                   // floor 40 so a real job is never "blank"
  const seniorityJd = /senior|staff|principal|lead|director|head of/i.test(jd);
  const seniorityProf = /senior|staff|principal|lead|director|head of/i.test(profileText);

  const mk = (name: RateDimension["name"], score: number, explanation: string): RateDimension => ({
    name, score: Math.max(0, Math.min(100, Math.round(score))), explanation,
  });

  return [
    mk("role_alignment", base, shared.length
      ? `Your background overlaps the role on ${shared.slice(0, 4).join(", ")}.`
      : `Limited keyword overlap with the role — review the JD's core focus before applying.`),
    mk("stack_coverage", 35 + cov * 60, missing.length
      ? `You cover much of the stack; gaps to check: ${missing.slice(0, 4).join(", ")}.`
      : `Your skills cover the stack named in this JD.`),
    mk("evidence", has(/\d/) ? 78 : 55, has(/\d/)
      ? `Your profile has quantified outcomes that map to this role's expectations.`
      : `Add quantified results to strengthen evidence for this role.`),
    mk("seniority", seniorityJd === seniorityProf ? 80 : 55,
      seniorityJd === seniorityProf
        ? `The seniority signalled in the JD matches your profile.`
        : `Seniority mismatch — the JD and your profile signal different levels.`),
    mk("logistics", 70, `Confirm location/remote and work-authorisation fit against the posting.`),
    mk("learning_curve", Math.round(90 - missing.length * 8),
      missing.length
        ? `Expect to ramp on ${missing.slice(0, 3).join(", ")}.`
        : `Low ramp — the role stays close to what you already do.`),
  ];
}

/** Best-effort company/role from the JD head (null when unclear). */
export function parseHeadline(jd: string): { company: string | null; role: string | null } {
  const firstLine = (jd.split("\n").find((l) => l.trim().length > 0) ?? "").trim();
  const role = firstLine.length > 0 && firstLine.length <= 120 ? firstLine.replace(/\s+at\s+.*$/i, "").trim() : null;
  const at = /\bat\s+([A-Z][A-Za-z0-9&.\- ]{1,60})/.exec(firstLine);
  return { company: at?.[1]?.trim() ?? null, role: role || null };
}
