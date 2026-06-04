/**
 * F-057 — Provider-agnostic AI gateway. The ONE public API all consumers call.
 *
 * Pre-hook (ALL calls):  atomicCapReserve — FAIL-CLOSED (Redis down → throw, never spend blind)
 * Dispatch:              router (primary provider → OpenRouter fallback → circuit breaker)
 * Post-hook (success):   commitCapSpend + recordUsageEvent (idempotent)
 * Post-hook (failure):   releaseCapReservation, then re-throw (no charge for failed work)
 * Post-hook (compliance): decisionLog throws if consentRef missing (fail-closed F-080 stub)
 *
 * Model is resolved from tier via env — a model swap is a config change, not code (§0-A5).
 */

import { Redis } from "ioredis";
import {
  atomicCapReserve, commitCapSpend, releaseCapReservation,
  CapRedisUnavailableError, CapExceededError,
} from "./cap.js";
import { route, routeEmbed } from "./router.js";
import { modelForTier, computeCostUsd, usdToCents, estimateProjectedCents } from "./pricing.js";
import type { CompletionRequest, CompletionResult, EmbedRequest, EmbedResult, ChatMessage } from "./types.js";

export { CapRedisUnavailableError, CapExceededError };

export class DecisionLogMissingConsentError extends Error {
  constructor() {
    super("decisionLog called without consentRef. No decision can be logged or served without consent. (F-080, fail-closed)");
    this.name = "DecisionLogMissingConsentError";
  }
}

/** Optional metering sink — injected so packages/ai never imports packages/core (boundary rule). */
export type UsageSink = (event: {
  accountId: string;
  action: string;
  costCents: number;
  idempotencyKey: string;
  modelVersion: string;
  taskTier: string;
}) => Promise<void>;

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 2, connectTimeout: 3000,
    });
  }
  return _redis;
}

const FRONTIER_TIMEOUT = parseInt(process.env["AI_FRONTIER_TIMEOUT_SECONDS"] ?? "30", 10) * 1000;
const UTILITY_TIMEOUT  = parseInt(process.env["AI_UTILITY_TIMEOUT_SECONDS"]  ?? "10", 10) * 1000;

export class Gateway {
  private readonly redis: Redis;
  private readonly accountCeilingCents: number;
  private readonly globalCeilingCents: number;
  private readonly usageSink?: UsageSink;

  constructor(opts?: { redis?: Redis; usageSink?: UsageSink }) {
    this.redis = opts?.redis ?? getRedis();
    if (opts?.usageSink) this.usageSink = opts.usageSink;
    this.accountCeilingCents = parseInt(process.env["CAP_PAID_TIER_MONTHLY_CENTS"] ?? "5000", 10);
    this.globalCeilingCents  = parseInt(process.env["CAP_GLOBAL_MONTHLY_CENTS"]    ?? "100000", 10);
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const model = modelForTier(req.taskTier);
    const maxTokens = req.maxTokens ?? (req.taskTier === "frontier" ? 4096 : 2048);
    const timeoutMs = req.taskTier === "frontier" || req.taskTier === "mid" ? FRONTIER_TIMEOUT : UTILITY_TIMEOUT;

    const promptChars = req.messages.reduce((n, m) => n + m.content.length, 0);
    const projectedCents = req.projectedCostCents ?? estimateProjectedCents(model, promptChars, maxTokens);

    const rid = `res:${req.idempotencyKey}`;

    // PRE-HOOK: atomic cap reserve — FAIL-CLOSED (throws CapRedisUnavailableError / CapExceededError)
    await atomicCapReserve(this.redis, req.accountId, projectedCents, rid, this.accountCeilingCents, this.globalCeilingCents);

    const start = Date.now();
    let result: Awaited<ReturnType<typeof route>>;
    try {
      result = await route({
        model,
        messages: req.messages as ChatMessage[],
        maxTokens,
        temperature: req.temperature ?? 0.3,
        jsonMode: req.jsonMode ?? false,
        timeoutMs,
      });
    } catch (err) {
      // No charge for failed work (FR-073.4) — release the reservation and re-throw.
      await releaseCapReservation(this.redis, req.accountId, rid);
      throw err;
    }

    const actualCostCents = usdToCents(computeCostUsd(result.model, result.inputTokens, result.outputTokens));

    // POST-HOOK: commit actual spend
    await commitCapSpend(this.redis, req.accountId, actualCostCents, rid);

    // POST-HOOK: idempotent usage event
    await this.writeUsage(req, result.model, actualCostCents);

    // POST-HOOK: decision log (fail-closed) for compliance tasks
    if (req.consentRef !== undefined) {
      this.decisionLog(req);
    }

    return {
      content: result.content,
      modelVersion: result.model,
      promptVersion: req.task,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      actualCostCents,
      provider: result.provider,
      durationMs: Date.now() - start,
      usedFallback: result.usedFallback,
    };
  }

  async embed(req: EmbedRequest): Promise<EmbedResult> {
    const model = req.modelVersion ?? modelForTier("embed");
    const chars = req.texts.reduce((n, t) => n + t.length, 0);
    const projectedCents = req.projectedCostCents ?? estimateProjectedCents(model, chars, 0);

    const rid = `res:${req.idempotencyKey}`;
    await atomicCapReserve(this.redis, req.accountId, projectedCents, rid, this.accountCeilingCents, this.globalCeilingCents);

    let result;
    try {
      result = await routeEmbed(model, req.texts, UTILITY_TIMEOUT);
    } catch (err) {
      await releaseCapReservation(this.redis, req.accountId, rid);
      throw err;
    }

    const actualCostCents = usdToCents(computeCostUsd(result.model, result.inputTokens, 0));
    await commitCapSpend(this.redis, req.accountId, actualCostCents, rid);
    await this.writeUsage(
      { task: "embed", taskTier: "embed", messages: [], accountId: req.accountId, idempotencyKey: req.idempotencyKey },
      result.model, actualCostCents
    );

    return {
      embeddings: result.embeddings,
      modelVersion: result.model,
      inputTokens: result.inputTokens,
      actualCostCents,
    };
  }

  private async writeUsage(req: CompletionRequest, model: string, costCents: number): Promise<void> {
    if (this.usageSink) {
      try {
        await this.usageSink({
          accountId: req.accountId,
          action: req.task,
          costCents,
          idempotencyKey: req.idempotencyKey,
          modelVersion: model,
          taskTier: req.taskTier,
        });
        return;
      } catch {
        // Never crash the gateway on metering failure — log for reconciliation.
        console.error(`[gateway] usage sink failed for ${req.idempotencyKey}`);
      }
    }
    console.log(JSON.stringify({
      level: "usage", accountId: req.accountId, action: req.task,
      costCents, idempotencyKey: req.idempotencyKey, modelVersion: model, taskTier: req.taskTier,
    }));
  }

  private decisionLog(req: CompletionRequest): void {
    if (!req.consentRef) throw new DecisionLogMissingConsentError();
    console.log(JSON.stringify({ level: "decision_log", task: req.task, consentRef: req.consentRef }));
  }
}

let _gateway: Gateway | null = null;
export function getGateway(usageSink?: UsageSink): Gateway {
  if (!_gateway) _gateway = new Gateway(usageSink ? { usageSink } : undefined);
  return _gateway;
}
