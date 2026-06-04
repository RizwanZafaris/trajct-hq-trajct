import { Injectable, Logger } from "@nestjs/common";
import type { JobDiscoveryQuery } from "@trajct/contracts";

/**
 * F-058 — Multi-source job discovery + source-adapter framework.
 * F-059 — Ghost-posting / legitimacy filter.
 * Adapters: linkedin|indeed|greenhouse|lever|workday|ashby|smartrecruiters|icims
 */
@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  async discoverJobs(req: JobDiscoveryQuery): Promise<{ jobId: string; matchesFound: number }> {
    this.logger.log(`Job discovery: ${req.adapters.join(",")} keywords=${req.keywords.join(",")}`);
    // TODO V1:
    // 1. For each adapter in req.adapters → enqueue q.research job
    // 2. Results flow into discovered_jobs table
    // 3. F-059 legitimacy filter runs in same job
    throw new Error("F-058 not implemented — V1");
  }

  async searchDiscovered(query: string, filters: object, userId: string): Promise<unknown[]> {
    // TODO: SELECT from discovered_jobs WHERE legitimacy_tier != 'ghost' + FTS/pgvector
    void query;
    void filters;
    void userId;
    return [];
  }
}
