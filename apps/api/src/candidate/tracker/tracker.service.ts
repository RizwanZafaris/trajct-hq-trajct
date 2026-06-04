import { Injectable, Logger } from "@nestjs/common";
import type { CreateApplication, UpdateApplication, Application } from "@trajct/contracts";

/**
 * F-018 — Application tracker.
 * Every status change should trigger an F-050 outcome event when relevant.
 * F-020 follow-up cadences are auto-generated on status transitions.
 */
@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  async createApplication(data: CreateApplication, userId: string): Promise<Application> {
    this.logger.log(`Create application: ${data.roleTitle} at ${data.companyName}`);
    // TODO V1: INSERT INTO job_applications ...
    throw new Error("F-018 not implemented — V1");
  }

  async updateApplication(id: string, data: UpdateApplication, userId: string): Promise<Application> {
    this.logger.log(`Update application ${id} → ${data.status}`);
    // TODO V1:
    // 1. UPDATE job_applications
    // 2. If outcomeType set → log outcome (F-050) via engine
    // 3. If hired/rejected → cancel pending follow-ups
    void userId;
    throw new Error("Not implemented");
  }

  async listApplications(userId: string): Promise<Application[]> {
    void userId;
    return [];
  }

  async getApplication(id: string, userId: string): Promise<Application> {
    void id;
    void userId;
    throw new Error("Not implemented");
  }

  async deleteApplication(id: string, userId: string): Promise<void> {
    void id;
    void userId;
  }

  /** Draft follow-up message for the application (F-020) */
  async requestFollowUp(applicationId: string, step: number, userId: string): Promise<{ draft: string }> {
    this.logger.log(`Follow-up step ${step} for application ${applicationId}`);
    void userId;
    throw new Error("F-020 not implemented — V1");
  }
}
