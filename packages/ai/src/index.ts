/**
 * @trajct/ai — provider-agnostic LLM gateway (F-057).
 * The gateway is the product asset: cap-gated, fallback-railed, metered, model-from-config.
 */

export { Gateway, getGateway, DecisionLogMissingConsentError, CapRedisUnavailableError, CapExceededError } from "./gateway.js";
export type { UsageSink } from "./gateway.js";

export {
  atomicCapReserve, commitCapSpend, releaseCapReservation, getCapHeadroom, resetCapCycle,
} from "./cap.js";

export { route, routeEmbed } from "./router.js";
export { OPENROUTER_MODEL_MAP, openRouterModelFor, openRouterAvailable, chatViaOpenRouter } from "./fallback.js";
export { PRICING_PER_1M, modelForTier, computeCostUsd, usdToCents, estimateProjectedCents, estimateCostCents } from "./pricing.js";
export {
  isCircuitOpen, recordSuccess, recordFailure, resetBreakers, backoffMs,
} from "./hardening.js";
export { resolvePrimaryProvider, PRIMARY_PROVIDERS } from "./providers/index.js";

export { ProviderError, isRetriableStatus } from "./types.js";
export type {
  CompletionRequest, CompletionResult, GatewayRequest, GatewayResponse,
  EmbedRequest, EmbedResult, TaskTier, ChatMessage, ChatRole,
  RawProvider, RawChatRequest, RawChatResult, RawEmbedResult,
} from "./types.js";
