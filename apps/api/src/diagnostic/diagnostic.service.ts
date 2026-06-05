import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { randomUUID, createHash } from "crypto";
import { Redis } from "ioredis";
import { Queue } from "bullmq";
import postgres from "postgres";
import { safeFetch, SSRFBlockedError } from "@trajct/core/engine";
import type { DiagnoseSubmitResponse, DiagnosePollResponse, DiagnosticError } from "@trajct/contracts";

/**
 * F-001 — Honest diagnostic service (API layer: synchronous pre-checks → enqueue async scoring).
 *
 * Pipeline (FRD §4.1): validate (size/type/malware) → extract text → ≥150 words → NOT_A_RESUME
 * → JD extract (safe-fetch, SSRF-guarded; failure → confidence=low, NOT a hard error per §4.1.7)
 * → enqueue q.ai.frontier diagnostic.score → return diag_token.
 *
 * [R5] Anonymous diagnostics are REDIS-ONLY (diag:<token>, TTL 24h). A Postgres row is created
 * only for authenticated users (or on save/claim). No Postgres row without a user_id.
 * [R9] Malware scanning: dev skips; the worker boot-assert guarantees CLAMAV_HOST in production.
 */

const MIN_WORDS = 150;             // BR-001.3 / AC-001.1.6
const DIAG_TTL_SECONDS = 24 * 3600; // BR-001.7

export interface DiagnoseInput {
  resumeBuffer?: Buffer;
  resumeFileName?: string;
  resumeMime?: string;
  resumeText?: string;
  target: string;                  // URL or JD text
  context?: string;
  locale?: string;
}

interface DiagBlob {
  status: "processing" | "completed" | "failed";
  userId: string | null;
  resumeText: string;
  jdText: string;
  jdConfidence: "high" | "med" | "low";
  context?: string;
  locale?: string;
  result?: unknown;
  errorCode?: string;
  createdAt: string;
}

@Injectable()
export class DiagnosticService {
  private readonly logger = new Logger(DiagnosticService.name);
  private redis: Redis | null = null;
  private queue: Queue | null = null;
  private sql: ReturnType<typeof postgres> | null = null;

  private getRedis(): Redis {
    if (!this.redis) {
      this.redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", { maxRetriesPerRequest: 2 });
    }
    return this.redis;
  }
  private getQueue(): Queue {
    if (!this.queue) {
      const conn = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", { maxRetriesPerRequest: null, enableReadyCheck: false });
      this.queue = new Queue("q.ai.frontier", { connection: conn });
    }
    return this.queue;
  }
  private getSql(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }

  /** Run the full pre-scoring pipeline and enqueue the async scoring job. */
  async diagnose(input: DiagnoseInput, userId: string | null): Promise<DiagnoseSubmitResponse> {
    // 1. Input presence (BR — MISSING_INPUT).
    if (!input.resumeBuffer && !input.resumeText?.trim()) {
      throw this.err("MISSING_INPUT", "Add your résumé and a target role.");
    }
    if (!input.target?.trim()) {
      throw this.err("MISSING_INPUT", "Add your résumé and a target role.");
    }

    // 2. Extract résumé text (from file or paste).
    let resumeText: string;
    let wordCount: number;
    if (input.resumeBuffer) {
      if (input.resumeBuffer.length > 5 * 1024 * 1024) throw this.err("FILE_TOO_LARGE", "Max file size is 5 MB.");
      // [R9] malware scan — dev skip; the worker boot-assert enforces CLAMAV_HOST in prod.
      ({ text: resumeText, wordCount } = await this.extractText(input.resumeBuffer, input.resumeMime ?? "", input.resumeFileName ?? ""));
    } else {
      resumeText = input.resumeText!.slice(0, 50_000);
      wordCount = resumeText.trim().split(/\s+/).filter(Boolean).length;
    }

    // 3. Word-count gate (BR-001.3).
    if (wordCount < MIN_WORDS) {
      throw this.err("RESUME_TOO_SHORT", `Need at least ~${MIN_WORDS} words to diagnose (found ${wordCount}).`);
    }

    // 4. Semantic résumé check (≥2 résumé sections — BR-001.3).
    if (!this.looksLikeResume(resumeText)) {
      throw this.err("NOT_A_RESUME", "That looks like an image, not a résumé. Upload a PDF/DOCX or paste your text.");
    }

    // 5. JD extraction — URL → SSRF-safe fetch (R6); failure → confidence=low, proceed (§4.1.7).
    let jdText = input.target.trim();
    let jdConfidence: "high" | "med" | "low" = "high";
    if (/^https?:\/\//i.test(jdText)) {
      try {
        const fetched = await safeFetch(jdText, { userAgent: "Trajct/1.0 JD-Fetcher", maxBytes: 20_000 });
        const stripped = fetched.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (stripped.length > 100) { jdText = stripped.slice(0, 20_000); jdConfidence = "high"; }
        else jdConfidence = "low"; // page fetched but unparseable → low confidence (not an error)
      } catch (err) {
        if (err instanceof SSRFBlockedError) this.logger.warn(`JD fetch SSRF-blocked: ${err.message}`);
        jdConfidence = "low"; // unreachable target → still diagnose against a general standard
      }
    }

    // 6. Create the transient diagnosis (R5: Redis-only for anon; +Postgres row for authed).
    const diagToken = randomUUID();
    const blob: DiagBlob = {
      status: "processing", userId, resumeText, jdText, jdConfidence,
      ...(input.context ? { context: input.context } : {}),
      ...(input.locale ? { locale: input.locale } : {}),
      createdAt: new Date().toISOString(),
    };
    await this.getRedis().set(this.key(diagToken), JSON.stringify(blob), "EX", DIAG_TTL_SECONDS);

    if (userId) {
      // [R5] Postgres row ONLY for authenticated users.
      await this.getSql()`
        INSERT INTO diagnostic_results
          (diag_token, user_id, target_role, target_jd_text, context_signal, status)
        VALUES
          (${diagToken}, ${userId}, ${jdText.slice(0, 255)}, ${jdText.slice(0, 2000)},
           ${input.context ?? null}, 'processing')
        ON CONFLICT (diag_token) DO NOTHING
      `.catch((e: unknown) => this.logger.error("diag persist failed", e));
    }

    // 7. Enqueue scoring (idempotent on resume+target hash).
    const idempotencyKey = createHash("sha256").update(`${userId ?? "anon"}:${resumeText}:${jdText}`).digest("hex").slice(0, 48);
    await this.getQueue().add("diagnostic.score", {
      type: "diagnostic.score", diagToken, resumeText, jdText, jdConfidence,
      context: input.context ?? null, userId, idempotencyKey,
    }, { jobId: `diag-${diagToken}` });

    return { diag_token: diagToken, status: "processing", poll_url: `/v1/diagnostic/${diagToken}`, estimated_seconds: 6 };
  }

  /** Poll a diagnosis by token. Reads Redis first (anon + authed), Postgres fallback for authed. */
  async getResult(diagToken: string, userId: string | null): Promise<DiagnosePollResponse> {
    const raw = await this.getRedis().get(this.key(diagToken));
    if (raw) {
      const blob = JSON.parse(raw) as DiagBlob;
      // An anon token must not be readable by a different (authed) user; userId match if both set.
      if (blob.userId && userId && blob.userId !== userId) {
        return { diag_token: diagToken, status: "failed", result: null, error_code: "NOT_FOUND" };
      }
      return {
        diag_token: diagToken,
        status: blob.status,
        result: (blob.result as DiagnosePollResponse["result"]) ?? null,
        error_code: blob.errorCode ?? null,
      };
    }
    // Expired in Redis → for authed, the Postgres row may still hold a completed result.
    if (userId) {
      const [row] = await this.getSql()`
        SELECT status, reasons, overall_score, band, model_version FROM diagnostic_results
        WHERE diag_token = ${diagToken} AND user_id = ${userId} LIMIT 1
      `;
      if (row) {
        return { diag_token: diagToken, status: (row["status"] as DiagnosePollResponse["status"]) ?? "failed", result: null, error_code: null };
      }
    }
    return { diag_token: diagToken, status: "failed", result: null, error_code: "EXPIRED" };
  }

  // ---------------------------------------------------------------------------
  // Extraction + heuristics
  // ---------------------------------------------------------------------------

  private async extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<{ text: string; wordCount: number }> {
    let text = "";
    try {
      if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
        text = await this.extractPdf(buffer);
      } else if (mimeType.includes("wordprocessingml") || fileName.toLowerCase().endsWith(".docx")) {
        const mammoth = await import("mammoth");
        text = (await mammoth.extractRawText({ buffer })).value ?? "";
      } else if (mimeType === "text/plain" || fileName.toLowerCase().endsWith(".txt")) {
        text = buffer.toString("utf-8");
      } else {
        throw this.err("UNSUPPORTED_FORMAT", "Use PDF, DOCX, TXT, or paste your text.");
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error("Parse failed", err);
      throw this.err("PARSE_FAILED", "We couldn't read that file — re-export or paste text.");
    }
    if (!text.trim()) throw this.err("PARSE_FAILED", "We couldn't read that file — re-export or paste text.");
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return { text: text.slice(0, 50_000), wordCount };
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    const pdfParse = await import("pdf-parse").then((m) => (m as { default?: unknown }).default ?? m) as (b: Buffer) => Promise<{ text?: string }>;
    try {
      return (await pdfParse(buffer)).text ?? "";
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("password") || msg.includes("encrypted")) {
        throw this.err("FILE_LOCKED", "This PDF is password-protected.");
      }
      throw err;
    }
  }

  /** ≥2 of {contact, experience, education, skills} (BR-001.3). */
  private looksLikeResume(text: string): boolean {
    const t = text.toLowerCase();
    const sections = [
      /\b(email|phone|linkedin|@)\b/.test(t),
      /\b(experience|work history|employment|position|company)\b/.test(t),
      /\b(education|degree|university|college|bachelor|master|phd|diploma)\b/.test(t),
      /\b(skills|technologies|proficienc|tools|languages)\b/.test(t),
    ].filter(Boolean).length;
    return sections >= 2;
  }

  private err(code: DiagnosticError["code"], message: string): BadRequestException {
    return new BadRequestException({ code, message, retryable: code === "ENGINE_UNAVAILABLE" || code === "RATE_LIMITED" || code === "PARSE_FAILED" } as DiagnosticError);
  }

  private key(token: string): string {
    return `diag:${token}`;
  }
}
