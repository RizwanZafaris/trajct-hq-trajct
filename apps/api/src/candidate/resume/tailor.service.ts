import { Injectable, Logger, PaymentRequiredException } from "@nestjs/common";
import type { TailorRequest, TailorResponse, TailorResult } from "@trajct/contracts";

/**
 * F-002 — Tailored résumé generation (paid).
 *
 * Paywall: entitlement check + cap check before enqueueing (FR-073.4).
 * Fabrication scan: generated text must pass groundedness check before serving (FR-002.8).
 * No charge for failed/halted work (FR-073.4).
 * Decision log: not required for tailoring (no hiring decision); cite-markers required (F-050).
 */
@Injectable()
export class TailorService {
  private readonly logger = new Logger(TailorService.name);

  async requestTailor(req: TailorRequest, userId: string): Promise<TailorResponse> {
    this.logger.log(`Tailor request: resume=${req.resumeId} company=${req.companyId} user=${userId}`);
    // TODO Sprint 1 (W8-9):
    // 1. Check entitlement (paid feature — FR-071.2)
    // 2. Check spend cap via packages/ai atomicCapReserve (fail-closed)
    // 3. Check idempotency_key in tailored_resumes table
    // 4. Fetch persona (packages/core/engine.getPersona)
    // 5. Enqueue q.ai.frontier job: { type: 'resume.tailor', ... }
    // 6. Create ledger debit reservation (released on failure)
    throw new Error("F-002 not implemented — Sprint 1");
  }

  async getTailorResult(tailoredResumeId: string, userId: string): Promise<TailorResult> {
    void userId;
    // TODO: SELECT from tailored_resumes WHERE id = tailoredResumeId AND user_id = userId
    throw new Error("Not implemented");
  }

  /** Download tailored resume — generates presigned R2 URL (short-TTL) */
  async getDownloadUrl(tailoredResumeId: string, userId: string): Promise<{ url: string; expiresAt: string }> {
    void tailoredResumeId;
    void userId;
    // TODO: generate presigned R2 URL (15-min TTL max)
    throw new Error("Not implemented");
  }
}
