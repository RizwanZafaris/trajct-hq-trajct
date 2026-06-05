import { Injectable, ConflictException, HttpException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import postgres from "postgres";
import { checkEntitlement, checkCap } from "@trajct/core/billing";
import type { TailorRequest, TailorResponse, TailorResult } from "@trajct/contracts";

/**
 * F-002 — Per-company tailored résumé (API: gate + enqueue; the worker generates + scans + bills).
 *
 * Pre-gen gates (FR-002.2/.4, BR-002.2/.3/.4):
 *   entitlement → 402 PAYMENT_REQUIRED · quota=0 → 409 QUOTA_EXCEEDED · over cap → 423 COST_CEILING_HIT
 * [R7] The billing ledger debit is NOT written here — it is written ONLY in the worker success
 * path (commitCapSpend). A failed/halted build leaves zero ledger rows (FR-073.4).
 */

const ESTIMATED_TAILOR_COST_CENTS = 50;

@Injectable()
export class TailorService {
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
      this.queue = new Queue("q.ai.frontier", { connection: conn });
    }
    return this.queue;
  }

  async requestTailor(req: TailorRequest, userId: string): Promise<TailorResponse> {
    // FR-002.2 / BR-002.2 — entitlement.
    const entitlement = await checkEntitlement({ accountId: userId, feature: "resume.tailor" });
    if (!entitlement.entitled) {
      throw new HttpException({ code: "PAYMENT_REQUIRED", message: "Tailored résumé requires a paid plan.", retryable: false }, 402);
    }
    // BR-002.3 — quota (upsell, not a hard error).
    if (entitlement.quotaRemaining !== undefined && entitlement.quotaRemaining <= 0) {
      throw new ConflictException({ code: "QUOTA_EXCEEDED", message: "You've used all your builds this cycle — upgrade for more.", retryable: false });
    }
    // FR-002.4 / BR-002.4 — halting spend cap (no gen, no charge). FAIL-CLOSED on Redis down.
    const cap = await checkCap({ accountId: userId, projectedCost: ESTIMATED_TAILOR_COST_CENTS, tier: entitlement.tier ?? "paid" });
    if (!cap.allowed) {
      throw new HttpException({ code: cap.reason ?? "COST_CEILING_HIT", message: "Temporarily paused to protect quality — resets next cycle.", retryable: false }, 423);
    }

    const tailoredResumeId = randomUUID();

    // [R7] Create the artifact row WITHOUT a ledger entry. The debit is the worker's job on success.
    await this.getSql()`
      INSERT INTO tailored_resumes (id, user_id, resume_id, company_id, target_role, target_jd_text, status, version)
      VALUES (${tailoredResumeId}, ${userId}, ${req.resumeId}, ${req.companyId}, ${req.targetRole},
              ${req.targetJdText ?? null}, 'processing', 1)
    `;

    await this.getQueue().add("resume.tailor", {
      type: "resume.tailor", tailoredResumeId, resumeId: req.resumeId, companyId: req.companyId,
      targetRole: req.targetRole, targetJdText: req.targetJdText ?? null, userId,
      ledgerEntryId: "", idempotencyKey: req.idempotencyKey,
    }, { jobId: `tailor-${tailoredResumeId}` });

    return {
      tailoredResumeId, jobId: tailoredResumeId, status: "pending",
      pollUrl: `/v1/candidate/resumes/tailored/${tailoredResumeId}`,
      estimatedSeconds: 45, ledgerEntryId: null,
    };
  }

  async getTailorResult(tailoredResumeId: string, userId: string): Promise<TailorResult> {
    const [row] = await this.getSql()`
      SELECT id, status, generated_text, fabrication_scan_passed, citations, model_version, version
      FROM tailored_resumes WHERE id = ${tailoredResumeId} AND user_id = ${userId} LIMIT 1
    `;
    if (!row) {
      return { id: tailoredResumeId, status: "failed", generatedText: null, generatedFileUrl: null, fabricationScanPassed: null, citations: [], modelVersion: null, version: 1 };
    }
    return {
      id: row["id"] as string,
      status: row["status"] as TailorResult["status"],
      generatedText: (row["generated_text"] as string | null) ?? null,
      generatedFileUrl: null,
      fabricationScanPassed: (row["fabrication_scan_passed"] as boolean | null) ?? null,
      citations: ((row["citations"] as Array<{ knowledgeId: string; sourceRef: string }> | null) ?? []),
      modelVersion: (row["model_version"] as string | null) ?? null,
      version: (row["version"] as number | null) ?? 1,
    };
  }

  async getDownloadUrl(tailoredResumeId: string, userId: string): Promise<{ url: string; expiresAt: string }> {
    void tailoredResumeId; void userId;
    throw new Error("F-002 R2 download — Platform sprint (presigned URL)");
  }
}
