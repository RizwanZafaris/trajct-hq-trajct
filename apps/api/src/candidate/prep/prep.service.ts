import { Injectable, Logger } from "@nestjs/common";
import type { PrepSessionRequest, PrepSessionResult } from "@trajct/contracts";

/**
 * F-007 — Company-specific interview prep.
 *
 * Questions are grounded in the company persona (F-052) and cite-marked (F-050).
 * Deep prep uses Frontier tier; standard uses Mid tier (§4.2).
 * Paid feature: entitlement check required before enqueueing.
 */
@Injectable()
export class PrepService {
  private readonly logger = new Logger(PrepService.name);

  async requestPrepSession(req: PrepSessionRequest, userId: string): Promise<{ sessionId: string; jobId: string }> {
    this.logger.log(`Prep session: company=${req.companyId} type=${req.prepType} user=${userId}`);
    // TODO V1:
    // 1. Check entitlement (paid)
    // 2. Fetch company persona (packages/core/engine.getPersona)
    // 3. Enqueue q.ai.frontier job: { type: 'prep.generate', ... }
    // 4. Create prep_sessions row (status: pending)
    throw new Error("F-007 not implemented — V1");
  }

  async getPrepSession(sessionId: string, userId: string): Promise<PrepSessionResult> {
    void userId;
    void sessionId;
    throw new Error("Not implemented");
  }

  async listPrepSessions(userId: string, companyId?: string): Promise<PrepSessionResult[]> {
    void userId;
    void companyId;
    return [];
  }
}
