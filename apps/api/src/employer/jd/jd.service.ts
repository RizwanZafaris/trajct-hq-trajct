import { Injectable, Logger } from "@nestjs/common";
import type { GenerateJdRequest, GeneratedJd, PublishJdRequest, AnalyzeJdRequest } from "@trajct/contracts";

/**
 * F-030 — AI JD generation + optimization (FREE — no auth required).
 * F-031 — JD skill analysis + inclusivity review.
 *
 * F-030 is the employer "front door" (lead magnet). Free tier, metered against
 * the org's free-tier spend cap (F-077). Inclusivity check (F-031) runs on every
 * generation and every edit.
 *
 * Limit: generation ≤ 20s p95 (FR-030.1).
 */
@Injectable()
export class JdService {
  private readonly logger = new Logger(JdService.name);

  async generateJd(req: GenerateJdRequest, orgId: string): Promise<{ jobPostingId: string; jobId: string; pollUrl: string }> {
    this.logger.log(`Generate JD: ${req.title} (${req.level}) for org ${orgId}`);
    // TODO Sprint 1 (W10):
    // 1. Spend cap check (free tier — FR-030.6)
    // 2. Enqueue q.ai.frontier job: { type: 'jd.generate', ... }
    // 3. Create job_postings row (status: draft)
    // 4. Run inclusivity check in same job (FR-030.2)
    throw new Error("F-030 not implemented — Sprint 1 (W10)");
  }

  async getJdStatus(jobPostingId: string, orgId: string): Promise<GeneratedJd> {
    void orgId;
    void jobPostingId;
    throw new Error("Not implemented");
  }

  async publishJd(jobPostingId: string, req: PublishJdRequest, orgId: string): Promise<{ publishedAt: string }> {
    this.logger.log(`Publish JD ${jobPostingId} for org ${orgId}`);
    // TODO: UPDATE job_postings SET status='published', published_at=now()
    //       screeningEnabled is always false at this stage (gate not passed)
    void req;
    throw new Error("Not implemented");
  }

  async analyzeJd(req: AnalyzeJdRequest, orgId: string): Promise<{
    requiredSkills: string[];
    niceToHaveSkills: string[];
    seniorityBand: string;
    inclusivityFlags: object[];
    improvementSuggestions: string[];
  }> {
    this.logger.log(`Analyze JD for org ${orgId}`);
    void req;
    throw new Error("F-031 not implemented — V1");
  }

  async listJds(orgId: string): Promise<unknown[]> {
    void orgId;
    return [];
  }

  async updateJd(jobPostingId: string, editedJd: string, orgId: string): Promise<void> {
    void jobPostingId;
    void editedJd;
    void orgId;
    // TODO: UPDATE job_postings SET edited_jd=editedJd + re-run inclusivity check
  }
}
