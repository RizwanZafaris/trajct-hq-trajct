import { Injectable, Logger, ForbiddenException } from "@nestjs/common";
import type { RunMatchingRequest, MatchedCandidate, CandidateDecision } from "@trajct/contracts";

/**
 * F-032 — AI candidate matching + ranking.
 *
 * TRUST WALL (F-060):
 *   - Only CandidatePublicProjection fields are visible to employers
 *   - Real user_id is NEVER returned to employers (anonymizedId only)
 *   - Candidate-private data (diagnostics, weaknesses, raw scores) never appear here
 *
 * F-035 — Hidden gem surfacing (high ability, weak resume).
 * F-036 — Why-rejected reason per candidate (required on reject).
 *
 * No automated decisions (FR-034.6):
 *   - `makeDecision` requires a human actor + reason
 *   - `screening_auto_decision_total` metric pages on any > 0
 */
@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  async runMatching(req: RunMatchingRequest, orgId: string): Promise<{ runId: string; jobId: string }> {
    this.logger.log(`Run matching: job=${req.jobPostingId} org=${orgId}`);
    // TODO V1:
    // 1. Check entitlement (matching is a paid employer feature)
    // 2. Check cap
    // 3. Enqueue q.ai.frontier job: { type: 'matching.run', jobPostingId, orgId, ... }
    // 4. Return polling reference
    throw new Error("F-032 not implemented — V1");
  }

  async getMatchingResults(jobPostingId: string, orgId: string): Promise<MatchedCandidate[]> {
    // TODO: SELECT matching_results WHERE job_posting_id AND org_id
    //       Return ONLY CandidatePublicProjection fields — trust wall enforced here
    void jobPostingId;
    void orgId;
    return [];
  }

  async makeDecision(decision: CandidateDecision, orgId: string, actorUserId: string): Promise<void> {
    this.logger.log(`Decision: ${decision.decision} for match ${decision.matchId} by ${actorUserId}`);
    // CRITICAL: This is a HUMAN decision. Never call this from an automated path.
    // The screening_auto_decision_total tripwire monitors for any automated calls.
    // TODO: UPDATE matching_results + write audit_log + trigger pipeline move
    void orgId;
    void actorUserId;
    throw new Error("Not implemented");
  }
}
