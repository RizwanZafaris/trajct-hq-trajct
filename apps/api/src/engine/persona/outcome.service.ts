import { Injectable, Logger } from "@nestjs/common";
import type { LogOutcomeRequest } from "@trajct/contracts";

/**
 * F-050 — Outcome logging + cite-markers.
 * Must be called whenever a hiring decision outcome is known.
 * Feeds F-051 (learning loop credit assignment).
 * Anonymized in the DB — real user_id is stored but never returned to employers.
 */
@Injectable()
export class OutcomeService {
  private readonly logger = new Logger(OutcomeService.name);

  async logOutcome(req: LogOutcomeRequest): Promise<{ outcomeId: string }> {
    this.logger.log(`Log outcome: ${req.outcome} for user ${req.userId} at company ${req.companyId}`);
    // TODO Sprint 1:
    // 1. Verify consentRef is valid
    // 2. INSERT INTO outcomes (via packages/core/engine.logOutcome)
    // 3. Enqueue q.research: { type: 'loop.credit_assign', outcomeId, ... } (F-051)
    throw new Error("F-050 not implemented — Sprint 1");
  }

  async getOutcomes(userId: string): Promise<unknown[]> {
    void userId;
    return [];
  }
}
