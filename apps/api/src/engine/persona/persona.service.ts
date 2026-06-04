import { Injectable, Logger } from "@nestjs/common";
import type { PersonaSynthesisRequest, CompanyPersona } from "@trajct/contracts";

/**
 * F-052 — Per-company persona synthesis (deep research).
 * Called by both candidate (tailoring/prep) and employer (matching) via packages/core/engine.
 * Deep research enqueued on q.research (lowest priority — background, long-running).
 * Freshness: nightly refresh check (F-054); freshness_score drives staleness alerts.
 */
@Injectable()
export class PersonaService {
  private readonly logger = new Logger(PersonaService.name);

  async getOrSynthesize(req: PersonaSynthesisRequest): Promise<CompanyPersona | null> {
    this.logger.log(`Get/synthesize persona: ${req.companyName} (${req.companyId})`);
    // TODO Sprint 1:
    // 1. Check company_personas table for freshness_score > 0.3 — return cached
    // 2. If stale or forceRefresh → enqueue q.research: { type: 'persona.synthesize', companyId, ... }
    // 3. Return existing (possibly stale) or null if first time
    throw new Error("F-052 not implemented — Sprint 1");
  }

  async getPersona(companyId: string): Promise<CompanyPersona | null> {
    void companyId;
    return null;
  }

  async refreshPersona(companyId: string): Promise<{ jobId: string }> {
    this.logger.log(`Refresh persona: ${companyId}`);
    // TODO: Enqueue q.research job
    throw new Error("Not implemented");
  }
}
