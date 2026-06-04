import { Injectable, Logger } from "@nestjs/common";
import type { AnalyticsQuery } from "@trajct/contracts";

/**
 * F-039 — Recruiting analytics (TTH, CPH, quality, funnel, bias).
 * Reads from recruiting_analytics snapshots (pre-computed nightly by worker).
 * Bias metrics (selection-rate parity) computed from matching_results + screening_sessions.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  async getAnalytics(req: AnalyticsQuery, orgId: string): Promise<object> {
    this.logger.log(`Analytics: org=${orgId} period=${req.periodStart}..${req.periodEnd}`);
    // TODO V2: SELECT from recruiting_analytics + compute bias metrics
    throw new Error("F-039 not implemented — V2");
  }
}
