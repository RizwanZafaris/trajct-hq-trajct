import { Injectable, Logger } from "@nestjs/common";
import type { LinkedInOptimizeRequest, LinkedInPostRequest } from "@trajct/contracts";

/**
 * F-011 — LinkedIn profile optimization.
 * F-012 — LinkedIn post generation + scheduling.
 *
 * F-055 voice calibration: if user has voice_samples in profile, inject into prompt.
 * Both are paid Mid-tier AI features.
 */
@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);

  async optimizeProfile(req: LinkedInOptimizeRequest, userId: string): Promise<{
    optimizationId: string;
    optimizedText: string;
    improvementNotes: string[];
  }> {
    this.logger.log(`LinkedIn optimize section=${req.section} for ${userId}`);
    throw new Error("F-011 not implemented — V1");
  }

  async generatePost(req: LinkedInPostRequest, userId: string): Promise<{
    postId: string;
    content: string;
    hook: string;
    cta: string;
    hashtags: string[];
  }> {
    this.logger.log(`LinkedIn post: "${req.topic}" tone=${req.tone} for ${userId}`);
    throw new Error("F-012 not implemented — V1");
  }

  async schedulPost(postId: string, scheduledAt: string, userId: string): Promise<void> {
    this.logger.log(`Schedule post ${postId} at ${scheduledAt}`);
    void userId;
    // TODO: UPDATE linkedin_posts SET status='scheduled', scheduled_at=scheduledAt
    //       + enqueue q.notify job for the scheduled time
  }

  async listPosts(userId: string): Promise<unknown[]> {
    void userId;
    return [];
  }
}
