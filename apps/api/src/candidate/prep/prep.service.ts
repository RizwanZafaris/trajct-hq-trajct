import { Injectable, HttpException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import postgres from "postgres";
import { getPersona } from "@trajct/core/engine";
import type { PrepGenerateRequest, PrepBriefResult, PrepBrief, PrepCite, PrepStarMapping } from "@trajct/contracts";

/**
 * F-007 — Company-specific interview prep (API: gate + enqueue; the worker grounds + writes the brief).
 *
 *  - [BR-007.3/FR-007.6] 10 briefs/hour/user, FAIL-CLOSED (limiter down → deny) → 429.
 *  - [§4.7.10] A known company with NO persona → 404 COMPANY_NOT_FOUND (research, then retry). A
 *    free-text target always proceeds (the worker returns a low-confidence general brief — FR-007.4).
 *  - The prep row carries user_id (G3 lesson) so the worker's owner-scoped UPDATE actually writes.
 */

const PREP_LIMIT_PER_HOUR = 10;   // BR-007.3

@Injectable()
export class PrepService {
  private sql: ReturnType<typeof postgres> | null = null;
  private queue: Queue | null = null;
  private redis: Redis | null = null;

  private getSql(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }
  private getQueue(): Queue {
    if (!this.queue) {
      const conn = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", { maxRetriesPerRequest: null, enableReadyCheck: false });
      this.queue = new Queue("q.ai.frontier", { connection: conn });
    }
    return this.queue;
  }
  private getRedis(): Redis {
    if (!this.redis) this.redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", { maxRetriesPerRequest: 2, enableReadyCheck: false });
    return this.redis;
  }

  async requestPrep(req: PrepGenerateRequest, userId: string): Promise<{ sessionId: string; jobId: string; status: "pending" }> {
    await this.enforceRateLimit(userId);   // BR-007.3 (fail-closed)

    // A known company with no persona can't be grounded → research first (§4.7.10). A free-text
    // target is always allowed (worker returns a general, low-confidence brief).
    if (req.companyId && !req.target) {
      const persona = await getPersona({ companyId: req.companyId, requestingUserId: userId }).catch(() => null);
      if (!persona) throw this.err(404, "COMPANY_NOT_FOUND", "We'll research this company — try again shortly.", true);
    }

    const sessionId = randomUUID();
    await this.getSql()`
      INSERT INTO prep_sessions (id, user_id, company_id, target, prep_type, status)
      VALUES (${sessionId}, ${userId}, ${req.companyId ?? null}, ${req.target ?? null}, ${req.prepType}, 'processing')
    `;
    await this.getQueue().add("prep.generate", {
      type: "prep.generate", prepSessionId: sessionId,
      companyId: req.companyId, target: req.target, profileId: req.profileId,
      prepType: req.prepType, userId, idempotencyKey: req.idempotencyKey ?? sessionId,
    }, { jobId: `prep-${sessionId}` });

    return { sessionId, jobId: sessionId, status: "pending" };
  }

  async getPrep(sessionId: string, userId: string): Promise<PrepBriefResult> {
    const [row] = await this.getSql()`
      SELECT id, status, brief, cites, confidence, star_mappings, notes, insider_declined
      FROM prep_sessions WHERE id = ${sessionId} AND user_id = ${userId} LIMIT 1
    `;
    if (!row) throw this.err(404, "NOT_FOUND", "Prep not found.", false);
    return {
      id: row["id"] as string,
      status: row["status"] as PrepBriefResult["status"],
      brief: (row["brief"] as PrepBrief | null) ?? { questions: [], format: "", values: [], frameworks: [] },
      cites: (row["cites"] as PrepCite[] | null) ?? [],
      confidence: (row["confidence"] as PrepBriefResult["confidence"] | null) ?? "low",
      starMappings: (row["star_mappings"] as PrepStarMapping[] | null) ?? [],
      notes: (row["notes"] as string[] | null) ?? [],
      insiderDeclined: (row["insider_declined"] as boolean | null) ?? false,
    };
  }

  private async enforceRateLimit(userId: string): Promise<void> {
    const key = `prep:limit:${userId}`;
    try {
      const n = await this.getRedis().incr(key);
      if (n === 1) await this.getRedis().expire(key, 3600);
      if (n > PREP_LIMIT_PER_HOUR) {
        const ttl = await this.getRedis().ttl(key);
        throw this.err(429, "RATE_LIMITED", "Too many — try again shortly.", true, Math.max(ttl, 1));
      }
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw this.err(429, "RATE_LIMITED", "Too many — try again shortly.", true, 60); // fail-closed
    }
  }

  private err(status: number, code: string, message: string, retryable: boolean, retryAfterSeconds?: number): HttpException {
    const body: Record<string, unknown> = { code, message, retryable };
    if (retryAfterSeconds !== undefined) body["retryAfterSeconds"] = retryAfterSeconds;
    return new HttpException(body, status);
  }
}
