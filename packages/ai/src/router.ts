/**
 * F-057 — LLMRouter: resolves tier→model→provider, dispatches with the OpenRouter
 * safety fallback and per-provider circuit breaker. Pure dispatch — no cap/metering
 * (those live in the Gateway pre/post hooks).
 */

import { resolvePrimaryProvider, openrouterProvider } from "./providers/index.js";
import { chatViaOpenRouter, openRouterAvailable } from "./fallback.js";
import { isCircuitOpen, recordSuccess, recordFailure, backoffMs } from "./hardening.js";
import { ProviderError } from "./types.js";
import type { RawChatRequest, RawChatResult, RawEmbedResult } from "./types.js";

export interface RouterResult extends RawChatResult {
  provider: string;
  usedFallback: boolean;
}

/** Up to 2 retries on the primary before falling back to OpenRouter (env-overridable). */
const MAX_RETRIES = parseInt(process.env["AI_MAX_RETRIES"] ?? "2", 10);

/** monotonic clock — overridable in tests via the `now` param of route(). */
function defaultNow(): number {
  // Date.now() is unavailable in workflow scripts but fine in app/test runtime.
  return Date.now();
}

/** No real delay under Vitest so retry tests stay fast. */
async function sleep(ms: number): Promise<void> {
  if (process.env["VITEST"]) return;
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Route a chat request to its primary provider with ≤2 retries on retriable errors,
 * then the OpenRouter safety fallback. Non-retriable (4xx) failures propagate immediately
 * and never trigger the fallback or count against the circuit breaker.
 */
export async function route(
  req: RawChatRequest,
  nowFn: () => number = defaultNow
): Promise<RouterResult> {
  const primary = resolvePrimaryProvider(req.model);

  // If the model is already a provider/model id, go straight to OpenRouter.
  if (!primary) {
    if (req.model.includes("/")) {
      const r = await openrouterProvider.chat(req);
      return { ...r, provider: "openrouter", usedFallback: true };
    }
    throw new ProviderError("router", 400, `No provider serves model ${req.model}`, false);
  }

  const circuitOpen = isCircuitOpen(primary.name, nowFn());
  let lastErr: ProviderError | null = null;

  if (!circuitOpen) {
    // Attempt the primary up to (1 + MAX_RETRIES) times on retriable failures.
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const r = await primary.chat(req);
        recordSuccess(primary.name);
        return { ...r, provider: primary.name, usedFallback: false };
      } catch (err) {
        const provErr = err instanceof ProviderError ? err : new ProviderError(primary.name, 500, String(err), true);
        // Non-retriable (400/401/403/404, missing key, HTTP 500) → propagate, no fallback, no breaker hit.
        if (!provErr.retriable) throw provErr;
        lastErr = provErr;
        if (attempt < MAX_RETRIES) await sleep(backoffMs(attempt, 0.5));
      }
    }
    // Exhausted retries on a retriable error → one breaker failure, then fall back.
    recordFailure(primary.name, nowFn());
    if (!openRouterAvailable()) throw lastErr ?? new ProviderError(primary.name, 503, "exhausted retries", true);
  } else if (!openRouterAvailable()) {
    // Circuit open and no fallback available → surface a clear error.
    throw new ProviderError(primary.name, 503, "circuit open, no OpenRouter fallback", true);
  }

  // Fallback rail
  const r = await chatViaOpenRouter(req);
  return { ...r, provider: "openrouter", usedFallback: true };
}

/** Embeddings route directly to the model's provider (OpenAI for text-embedding-*). */
export async function routeEmbed(
  model: string,
  texts: string[],
  timeoutMs: number
): Promise<RawEmbedResult> {
  const primary = resolvePrimaryProvider(model);
  if (primary?.embed) {
    return primary.embed(model, texts, timeoutMs);
  }
  // Fallback to OpenRouter embeddings if mapped
  if (openRouterAvailable() && openrouterProvider.embed) {
    return openrouterProvider.embed(model, texts, timeoutMs);
  }
  throw new ProviderError("router", 400, `No embedding provider for model ${model}`, false);
}
