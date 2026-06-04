/**
 * F-057 — Provider-agnostic AI gateway.
 *
 * Pre-hooks (enforced before EVERY call):
 *   1. atomicCapReserve — FAIL-CLOSED (Redis down → refuse call, never spend blind)
 *
 * Post-hooks (enforced after EVERY call):
 *   2. writeUsageEvent — idempotent (idempotency_key)
 *   3. decisionLog — THROWS if called without consent_ref on compliance tasks (fail-closed)
 *
 * This file wraps OpenRouter as the primary provider.
 * Provider adapters live in src/adapters/.
 */

import IORedis from "ioredis";
import {
  atomicCapReserve,
  commitCapSpend,
  releaseCapReservation,
  CapRedisUnavailableError,
  CapExceededError,
} from "./cap.js";
import type { CompletionRequest, CompletionResult, EmbedRequest, EmbedResult, LlmProvider } from "./types.js";
import { OpenRouterAdapter } from "./adapters/openrouter.js";

export { CapRedisUnavailableError, CapExceededError };

const ACCOUNT_CEILING_CENTS = parseInt(process.env["CAP_PAID_TIER_MONTHLY_CENTS"] ?? "5000", 10);
const GLOBAL_CEILING_CENTS = parseInt(process.env["CAP_GLOBAL_MONTHLY_CENTS"] ?? "100000", 10);

export class DecisionLogMissingConsentError extends Error {
  constructor() {
    super("decisionLog called without consentRef. No decision can be logged or served without consent. (F-080, fail-closed)");
    this.name = "DecisionLogMissingConsentError";
  }
}

export class Gateway {
  private readonly provider: LlmProvider;
  private readonly redis: IORedis;

  constructor(redis: IORedis, provider?: LlmProvider) {
    this.redis = redis;
    this.provider = provider ?? new OpenRouterAdapter();
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const reservationId = `res:${req.idempotencyKey}`;

    // PRE-HOOK 1: Atomic cap reserve — FAIL-CLOSED
    await atomicCapReserve(
      this.redis,
      req.accountId,
      req.projectedCostCents,
      reservationId,
      ACCOUNT_CEILING_CENTS,
      GLOBAL_CEILING_CENTS
    );

    let result: CompletionResult;
    try {
      result = await this.provider.complete(req);
    } catch (err) {
      // Release reservation on failure — never charge for failed work (F-073.4)
      await releaseCapReservation(this.redis, req.accountId, reservationId);
      throw err;
    }

    // POST-HOOK 1: Commit actual spend
    await commitCapSpend(this.redis, req.accountId, result.actualCostCents, reservationId);

    // POST-HOOK 2: Write usage event (idempotent)
    await this.writeUsageEvent(req, result);

    // POST-HOOK 3: Decision log — THROWS if compliance task lacks consent
    if (req.consentRef !== undefined) {
      await this.decisionLog(req, result);
    }

    return result;
  }

  async embed(req: EmbedRequest): Promise<EmbedResult> {
    const reservationId = `res:${req.idempotencyKey}`;

    await atomicCapReserve(
      this.redis,
      req.accountId,
      req.projectedCostCents,
      reservationId,
      ACCOUNT_CEILING_CENTS,
      GLOBAL_CEILING_CENTS
    );

    let result: EmbedResult;
    try {
      result = await this.provider.embed(req);
    } catch (err) {
      await releaseCapReservation(this.redis, req.accountId, reservationId);
      throw err;
    }

    await commitCapSpend(this.redis, req.accountId, result.actualCostCents, reservationId);
    await this.writeUsageEvent({ ...req, task: "embed", taskTier: "embed", messages: [], consentRef: undefined, maxTokens: undefined, temperature: undefined }, { ...result, content: "", provider: this.provider.name, durationMs: 0, inputTokens: result.inputTokens, outputTokens: 0, promptVersion: "embed-v1", modelVersion: result.modelVersion });

    return result;
  }

  private async writeUsageEvent(req: CompletionRequest | EmbedRequest, result: CompletionResult): Promise<void> {
    // TODO: call packages/core/billing recordUsageEvent (idempotent by idempotencyKey)
    // Stub: log to console until DB is wired
    console.log(`[gateway] usage event: account=${req.accountId} task=${(req as CompletionRequest).task ?? "embed"} cost=${result.actualCostCents}c model=${result.modelVersion}`);
  }

  /**
   * POST-HOOK 3: Decision log — fail-closed placeholder.
   * THROWS if called without consentRef (by design — no consent = no log = no decision).
   * Real implementation writes to audit_log via packages/core/compliance.
   */
  private async decisionLog(req: CompletionRequest, result: CompletionResult): Promise<void> {
    if (!req.consentRef) {
      throw new DecisionLogMissingConsentError();
    }
    // TODO: call writeDecisionLog from packages/core/compliance
    console.log(`[gateway] decision log: consent=${req.consentRef} model=${result.modelVersion}`);
  }
}
