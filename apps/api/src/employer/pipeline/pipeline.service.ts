import { Injectable, Logger } from "@nestjs/common";
import type { PipelineStageCreate, MoveCandidateSchema, SubmitScorecard, BulkAction } from "@trajct/contracts";

/**
 * F-038 — Hiring workflow (pipeline, scorecards, collaboration).
 * F-037 — Bulk actions.
 *
 * Every stage move and decision is written to audit_log (AuditInterceptor handles this globally).
 * Scorecards from multiple reviewers aggregate to a team view.
 */
@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  async createStage(req: PipelineStageCreate, jobPostingId: string, orgId: string): Promise<{ stageId: string }> {
    this.logger.log(`Create stage "${req.name}" for job ${jobPostingId}`);
    void orgId;
    throw new Error("F-038 not implemented — V1");
  }

  async getBoard(jobPostingId: string, orgId: string): Promise<{ stages: object[]; cards: object[] }> {
    void jobPostingId;
    void orgId;
    return { stages: [], cards: [] };
  }

  async moveCandidate(req: { cardId: string; targetStageId: string; note?: string }, orgId: string, actorId: string): Promise<void> {
    this.logger.log(`Move card ${req.cardId} to stage ${req.targetStageId} by ${actorId}`);
    void orgId;
    throw new Error("Not implemented");
  }

  async submitScorecard(req: SubmitScorecard, orgId: string, reviewerId: string): Promise<void> {
    this.logger.log(`Scorecard by ${reviewerId} for card ${req.cardId}`);
    void orgId;
    throw new Error("Not implemented");
  }

  async bulkAction(req: BulkAction, orgId: string, actorId: string): Promise<{ processed: number; failed: number }> {
    this.logger.log(`Bulk ${req.action} on ${req.cardIds.length} cards by ${actorId}`);
    void orgId;
    throw new Error("F-037 not implemented — V1");
  }
}
