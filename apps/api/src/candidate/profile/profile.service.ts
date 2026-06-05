import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import postgres from "postgres";
import { apiGateway, hasLlmKeys } from "../../common/gateway.js";
import {
  mergeExperience, mergeSkills, mergeKeywords, mergeEducation, generateRecommendations,
  type ExtractedDoc,
} from "./profile-merge.js";
import type {
  ProfileUpsert, Profile, BuildProfileResult, DocResult, ExperienceItem, EducationItem, ProfileErrorCode,
} from "@trajct/contracts";

/**
 * F-003 — Career profile builder.
 * Per-doc pipeline (Promise.allSettled — item failure never fails the batch, NFR-003.3):
 *   size/type → extract → classify (career doc?) → NER (roles/dates/skills/education).
 * Merge: de-dup roles on (company, role, start); surface conflicts (FR-003.7, never auto-pick);
 * union+normalize skills; heuristic recommendations (FR-003.5). UPSERT one master profile/user.
 */

const MAX_DOCS = 10;            // BR-003.1
const SYSTEM_ACCOUNT = "00000000-0000-0000-0000-0000000000aa";

export interface ProfileDoc {
  buffer: Buffer;
  fileName: string;
  mime: string;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private sql: ReturnType<typeof postgres> | null = null;
  private queue: Queue | null = null;

  private getSql(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }
  private getQueue(): Queue {
    if (!this.queue) {
      const conn = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", { maxRetriesPerRequest: null, enableReadyCheck: false });
      this.queue = new Queue("q.embed", { connection: conn });
    }
    return this.queue;
  }

  /** Build (or rebuild) the master profile from documents + pasted text. */
  async buildProfile(userId: string, docs: ProfileDoc[], pastedText?: string): Promise<BuildProfileResult> {
    if (docs.length > MAX_DOCS) throw this.err("TOO_MANY_DOCS", "Up to 10 documents.");
    if (docs.length === 0 && !pastedText?.trim()) throw this.err("MISSING_INPUT", "Add at least one document or pasted text.");

    const docResults: DocResult[] = [];
    const extracted: ExtractedDoc[] = [];

    // Per-doc pipeline — item errors are recorded, never thrown (NFR-003.3).
    const settled = await Promise.allSettled(
      docs.map(async (doc) => {
        if (doc.buffer.length > 5 * 1024 * 1024) return { fileName: doc.fileName, errorCode: "UNSUPPORTED_FORMAT" as const };
        const text = await this.extractText(doc.buffer, doc.mime, doc.fileName).catch(() => null);
        if (!text) return { fileName: doc.fileName, errorCode: "PARSE_FAILED" as const };
        const result = await this.classifyAndExtract(text, userId);
        if (!result.isCareerDoc) return { fileName: doc.fileName, errorCode: "NOT_A_CAREER_DOC" as const };
        return { fileName: doc.fileName, extracted: result.extracted };
      })
    );
    for (const s of settled) {
      if (s.status === "fulfilled" && "extracted" in s.value && s.value.extracted) {
        extracted.push(s.value.extracted);
        docResults.push({ fileName: s.value.fileName, status: "processed", errorCode: null });
      } else if (s.status === "fulfilled" && "errorCode" in s.value) {
        docResults.push({ fileName: s.value.fileName, status: "skipped", errorCode: s.value.errorCode });
      } else {
        docResults.push({ fileName: "unknown", status: "skipped", errorCode: "PARSE_FAILED" });
      }
    }

    // Pasted text → one more extracted doc.
    if (pastedText?.trim()) {
      const r = await this.classifyAndExtract(pastedText, userId);
      if (r.isCareerDoc) extracted.push(r.extracted);
    }

    // Merge (FR-003.3 dedup + FR-003.7 conflicts).
    const { experience, conflicts } = mergeExperience(extracted);
    const skills = mergeSkills(extracted);
    const keywords = mergeKeywords(extracted);
    const education = mergeEducation(extracted);
    const summaryPresent = extracted.some((d) => d.keywords.some((k) => /summary|objective|profile/i.test(k)));
    const recommendations = generateRecommendations(experience, skills, summaryPresent);

    // UPSERT one master profile per user.
    const sql = this.getSql();
    const [row] = await sql`
      INSERT INTO candidate_profiles
        (id, user_id, skills, experience, education, keywords, recommendations, conflicts, parsed_text, updated_at)
      VALUES
        (${randomUUID()}, ${userId}, ${sql.json(skills)}, ${sql.json(experience as never)}, ${sql.json(education as never)},
         ${sql.json(keywords)}, ${sql.json(recommendations)}, ${sql.json(conflicts as never)},
         ${pastedText?.slice(0, 20000) ?? null}, now())
      ON CONFLICT (user_id) DO UPDATE SET
        skills = EXCLUDED.skills, experience = EXCLUDED.experience, education = EXCLUDED.education,
        keywords = EXCLUDED.keywords, recommendations = EXCLUDED.recommendations, conflicts = EXCLUDED.conflicts,
        updated_at = now()
      RETURNING id
    `;
    const profileId = row!["id"] as string;

    // Embed for RAG (async, best-effort).
    await this.getQueue().add("embed.resume", {
      type: "embed.resume", resumeId: profileId, userId, region: "global",
      content: extracted.flatMap((d) => d.experience.flatMap((e) => e.bullets)).join("\n").slice(0, 8000),
      idempotencyKey: `embed-profile-${profileId}`,
    }, { jobId: `embed-profile-${profileId}` }).catch(() => undefined);

    return { profile_id: profileId, experience, skills, keywords, education, recommendations, conflicts, doc_results: docResults };
  }

  async getProfile(userId: string): Promise<Profile | null> {
    const [row] = await this.getSql()`SELECT * FROM candidate_profiles WHERE user_id = ${userId} LIMIT 1`;
    return row ? (row as unknown as Profile) : null;
  }

  async upsertProfile(data: ProfileUpsert, userId: string): Promise<{ profileId: string }> {
    const sql = this.getSql();
    const [row] = await sql`
      INSERT INTO candidate_profiles (id, user_id, headline, summary, skills, updated_at)
      VALUES (${randomUUID()}, ${userId}, ${data.headline ?? null}, ${data.summary ?? null}, ${sql.json(data.skills ?? [])}, now())
      ON CONFLICT (user_id) DO UPDATE SET
        headline = COALESCE(EXCLUDED.headline, candidate_profiles.headline),
        summary = COALESCE(EXCLUDED.summary, candidate_profiles.summary),
        skills = EXCLUDED.skills, updated_at = now()
      RETURNING id
    `;
    return { profileId: row!["id"] as string };
  }

  // ---------------------------------------------------------------------------

  private async classifyAndExtract(text: string, userId: string): Promise<{ isCareerDoc: boolean; extracted: ExtractedDoc }> {
    // Heuristic career-doc gate first (cheap; FR-003.6).
    const careerSignals = /\b(experience|employment|education|skills|university|degree|résumé|resume|cv|curriculum vitae|portfolio)\b/i.test(text);
    if (!careerSignals) return { isCareerDoc: false, extracted: emptyExtract() };

    if (!hasLlmKeys()) return { isCareerDoc: true, extracted: mockExtract(text) };

    try {
      const resp = await apiGateway().complete({
        task: "profile.ner",
        taskTier: "utility",
        accountId: userId || SYSTEM_ACCOUNT,
        idempotencyKey: `profile-ner-${userId}-${text.length}-${text.slice(0, 40)}`,
        jsonMode: true,
        maxTokens: 1500,
        messages: [
          { role: "system", content: NER_SYSTEM },
          { role: "user", content: text.slice(0, 12000) },
        ],
      });
      return { isCareerDoc: true, extracted: parseExtract(resp.content) };
    } catch (err) {
      this.logger.warn(`NER failed, using heuristic extract: ${err instanceof Error ? err.message : err}`);
      return { isCareerDoc: true, extracted: mockExtract(text) };
    }
  }

  private async extractText(buffer: Buffer, mime: string, fileName: string): Promise<string> {
    if (mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
      const pdfParse = await import("pdf-parse").then((m) => (m as { default?: unknown }).default ?? m) as (b: Buffer) => Promise<{ text?: string }>;
      return (await pdfParse(buffer)).text ?? "";
    }
    if (mime.includes("wordprocessingml") || fileName.toLowerCase().endsWith(".docx")) {
      const mammoth = await import("mammoth");
      return (await mammoth.extractRawText({ buffer })).value ?? "";
    }
    if (mime === "text/plain" || fileName.toLowerCase().endsWith(".txt")) return buffer.toString("utf-8");
    throw this.err("UNSUPPORTED_FORMAT", "PDF/DOCX/TXT only.");
  }

  private err(code: ProfileErrorCode["code"], message: string): BadRequestException {
    return new BadRequestException({ code, message, retryable: code === "ENGINE_UNAVAILABLE" } as ProfileErrorCode);
  }
}

// ---------------------------------------------------------------------------

const NER_SYSTEM = `Extract structured career data from the document. Reply ONLY with strict JSON:
{
  "experience": [{"role":"...","company":"...","start":"YYYY-MM|YYYY|null","end":"YYYY-MM|YYYY|null","bullets":["..."]}],
  "skills": ["..."],
  "keywords": ["..."],
  "education": [{"degree":"...","institution":"...","year":"YYYY|null"}]
}
Use null for present/unknown dates. Extract ONLY facts present in the document — never invent.`;

function emptyExtract(): ExtractedDoc {
  return { experience: [], skills: [], keywords: [], education: [] };
}

function parseExtract(raw: string): ExtractedDoc {
  try {
    const j = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")) as Partial<ExtractedDoc>;
    return {
      experience: (j.experience ?? []).map((e) => ({
        role: String((e as ExperienceItem).role ?? ""), company: String((e as ExperienceItem).company ?? ""),
        start: (e as ExperienceItem).start ?? null, end: (e as ExperienceItem).end ?? null,
        bullets: ((e as ExperienceItem).bullets ?? []).map(String),
      })),
      skills: (j.skills ?? []).map(String),
      keywords: (j.keywords ?? []).map(String),
      education: (j.education ?? []).map((e) => ({
        degree: String((e as EducationItem).degree ?? ""), institution: String((e as EducationItem).institution ?? ""),
        year: (e as EducationItem).year ?? null,
      })),
    };
  } catch {
    return emptyExtract();
  }
}

/** Deterministic heuristic extract (dev / NER-down fallback). */
function mockExtract(text: string): ExtractedDoc {
  const skills: string[] = [];
  for (const m of text.matchAll(/\b(javascript|typescript|python|node\.?js|postgres(?:ql)?|kubernetes|sql|react|product management)\b/gi)) {
    skills.push(m[0]);
  }
  // Naive single-experience capture: first "Role at Company" pattern.
  const roleMatch = /([A-Z][\w ]+?)\s+(?:at|@)\s+([A-Z][\w .&]+)/.exec(text);
  const experience = roleMatch
    ? [{ role: roleMatch[1]!.trim(), company: roleMatch[2]!.trim(), start: null, end: null, bullets: [text.slice(0, 200)] }]
    : [];
  const eduMatch = /(B\.?S\.?|M\.?S\.?|Bachelor|Master|PhD)[\w .]*?(?:in|of)?[\w .]*?,?\s+([A-Z][\w .]+University|[A-Z][\w .]+College)/.exec(text);
  const education = eduMatch ? [{ degree: eduMatch[1]!.trim(), institution: eduMatch[2]!.trim(), year: null }] : [];
  return { experience, skills: [...new Set(skills)], keywords: ["experience", "skills"], education };
}
