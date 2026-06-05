import { Injectable, Logger } from "@nestjs/common";
import type { CreateMonitor } from "@trajct/contracts";

/**
 * F-015 — Passive job monitoring + alerts (uses the F-058 discovery adapters).
 * (F-005 Rate-a-job now lives in RateModule — apps/api/src/candidate/rate.)
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
}
