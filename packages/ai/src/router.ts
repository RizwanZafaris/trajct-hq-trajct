/**
 * F-057 — LLMRouter: resolves tier→model→provider, dispatches with the OpenRouter
 * safety fallback and per-provider circuit breaker. Pure dispatch — no cap/metering
 * (those live in the Gateway pre/post hooks).
 */

import { resolvePrimaryProvider, openrouterProvider } from "./providers/index.js";
import { chatViaOpenRouter, openRouterAvailable } from "./fallback.js";
import { isCircuitOpen, recordSuccess, recordFailure } from "./hardening.js";
import { ProviderError } from "./types.js";
import type { RawChatRequest, RawChatResult, RawEmbedResult } from "./types.js";

export interface RouterResult extends RawChatResult {
  provider: string;
  usedFallback: boolean;
}

/** monotonic clock — overridable in tests via the `now` param of route(). */
function defaultNow(): number {
  // Date.now() is unavailable in workflow scripts but fine in app/test runtime.
  return Date.now();
}

/**
 * Route a chat request to its primary provider; on a retriable failure (or open
 * circuit), fall back to OpenRouter. On a non-retriable failure, propagate.
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

  if (!circuitOpen) {
    try {
      const r = await primary.chat(req);
      recordSuccess(primary.name);
      return { ...r, provider: primary.name, usedFallback: false };
    } catch (err) {
      const provErr = err instanceof ProviderError ? err : new ProviderError(primary.name, 500, String(err), true);
      // Non-retriable (e.g. 400 bad request, missing key) → do NOT fall back.
      if (!provErr.retriable) throw provErr;
      recordFailure(primary.name, nowFn());
      // fall through to OpenRouter
      if (!openRouterAvailable()) throw provErr; // never silently degrade
    }
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
