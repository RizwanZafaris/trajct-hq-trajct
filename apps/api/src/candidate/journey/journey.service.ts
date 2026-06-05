import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import postgres from "postgres";
import { Queue } from "bullmq";
import IORedis from "ioredis";

/**
 * F-056 — High-fit auto-prep journey saga.
 * When a role crosses JOURNEY_MIN_SCORE, orchestrate the full prep package
 * (tailor + prep + people-finder) as independent, deduplicated jobs.
 *
 * Dedup gate: UNIQUE(user_id, job_id) on journeys — one journey per (user, job).
 */
@Injectable()
export class JourneyService {
  private readonly logger = new Logger(JourneyService.name);
  private readonly minScore = parseInt(process.env["JOURNEY_MIN_SCORE"] ?? "90", 10);
  private sql: ReturnType<typeof postgres> | null = null;
  private aiQueue: Queue | null = null;

  private db(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }

  private queue(): Queue {
    if (!this.aiQueue) {
      const conn = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
        maxRetriesPerRequest: null, enableReadyCheck: false,
      });
      this.aiQueue = new Queue("q.ai.frontier", { connection: conn });
    }
    return this.aiQueue;
  }

  /**
   * Maybe start a journey for a high-fit role. Returns the journeyId if started,
   * or null if below threshold or already exists (dedup).
   */
  async maybeEnqueueJourney(userId: string, jobId: string, fitScore: number): Promise<string | null> {
    if (fitScore < this.minScore) return null;

    const journeyId = randomUUID();
    // Dedup gate: INSERT ... ON CONFLICT DO NOTHING on UNIQUE(user_id, job_id).
    const rows = await this.db()`
      INSERT INTO journeys (id, user_id, job_id, fit_score, status)
      VALUES (${journeyId}, ${userId}, ${jobId}, ${fitScore}, 'pending')
      ON CONFLICT (user_id, job_id) DO NOTHING
      RETURNING id
    `;

    if (rows.length === 0) {
      this.logger.log(`Journey dedup: ${userId}/${jobId} already exists`);
      return null;
    }

    await this.queue().add(
      "journey.orchestrate",
      { type: "journey.orchestrate", journeyId, userId, jobId, idempotencyKey: `journey-${journeyId}` },
      { jobId: `journey-${journeyId}` } // BullMQ jobId must not contain ':'
    );
    this.logger.log(`Journey ${journeyId} started for ${userId}/${jobId} (fit=${fitScore})`);
    return journeyId;
  }

  async getJourney(journeyId: string, userId: string): Promise<unknown> {
    const [row] = await this.db()`SELECT * FROM journeys WHERE id = ${journeyId} AND user_id = ${userId} LIMIT 1`;
    return row ?? null;
  }
}
