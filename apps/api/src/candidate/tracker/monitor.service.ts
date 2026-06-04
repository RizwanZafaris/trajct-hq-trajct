import { Injectable, Logger } from "@nestjs/common";
import type { CreateMonitor, RateJobRequest, RateJobResult } from "@trajct/contracts";

/**
 * F-015 — Passive job monitoring + alerts.
 * F-005 — Rate-a-job by URL/JD.
 * Both use the job discovery adapter framework (F-058) under the hood.
 */
@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  async createMonitor(data: CreateMonitor, userId: string): Promise<{ monitorId: string }> {
    this.logger.log(`Create monitor: "${data.queryName}" for ${userId}`);
    // TODO V1: INSERT INTO job_monitors + schedule BullMQ repeatable job
    throw new Error("F-015 not implemented — V1");
  }

  async listMonitors(userId: string): Promise<unknown[]> {
    void userId;
    return [];
  }

  async deleteMonitor(monitorId: string, userId: string): Promise<void> {
    void monitorId;
    void userId;
    // TODO: Cancel repeatable BullMQ job + soft-delete row
  }

  async rateJob(req: RateJobRequest, userId: string): Promise<RateJobResult> {
    this.logger.log(`Rate job for user ${userId}`);
    // TODO V1: JD extract → score vs resume → return fit score + reasons
    throw new Error("F-005 not implemented — V1");
  }
}
