/**
 * F-057 — OpenRouter safety fallback rail.
 * Port of jobHunt/agents/llm_fallback.py — _OPENROUTER_MODEL_MAP verbatim.
 *
 * Every primary provider call MUST fall back to OpenRouter on a retriable failure
 * (429/5xx/timeout/network). If OPENROUTER_API_KEY is absent → the original error
 * propagates (NEVER silently degrade).
 */

import { openrouterProvider } from "./providers/index.js";
import { ProviderError } from "./types.js";
import type { RawChatRequest, RawChatResult } from "./types.js";

/** Map a direct model id → its OpenRouter "provider/model" id. (verbatim from llm_fallback.py) */
export const OPENROUTER_MODEL_MAP: Record<string, string> = {
  // Anthropic
  "claude-opus-4-8":            "anthropic/claude-opus-4-5",
  "claude-opus-4-5-20251101":   "anthropic/claude-opus-4-5",
  "claude-opus-4-5":            "anthropic/claude-opus-4-5",
  "claude-sonnet-4-6":          "anthropic/claude-sonnet-4-6",
  "claude-sonnet-4-5":          "anthropic/claude-sonnet-4-5",
  "claude-haiku-4-5-20251001":  "anthropic/claude-haiku-4-5",
  "claude-haiku-4-5":           "anthropic/claude-haiku-4-5",
  // OpenAI
  "gpt-5":       "openai/gpt-5",
  "gpt-4.1":     "openai/gpt-4.1",
  "gpt-4o":      "openai/gpt-4o",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "o1":          "openai/o1",
  // Google
  "gemini-2.5-pro":   "google/gemini-2.5-pro",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-3.0-pro":   "google/gemini-3.0-pro",
  // DeepSeek
  "deepseek-chat":     "deepseek/deepseek-chat",
  "deepseek-reasoner": "deepseek/deepseek-reasoner",
  // Moonshot
  "kimi-k2.6": "moonshot/kimi-k2.6",
  "kimi-k2.5": "moonshot/kimi-k2.5",
};

export function openRouterModelFor(model: string): string | undefined {
  return OPENROUTER_MODEL_MAP[model];
}

export function openRouterAvailable(): boolean {
  return !!process.env["OPENROUTER_API_KEY"];
}

/**
 * Run a chat via OpenRouter as the fallback. Maps the model id to provider/model form.
 * @throws if OPENROUTER_API_KEY is absent (caller should surface the original error instead).
 */
export async function chatViaOpenRouter(req: RawChatRequest): Promise<RawChatResult> {
  if (!openRouterAvailable()) {
    throw new ProviderError("openrouter", 401, "OPENROUTER_API_KEY not set — cannot fall back", false);
  }
  const mapped = openRouterModelFor(req.model);
  if (!mapped) {
    throw new ProviderError("openrouter", 400, `No OpenRouter mapping for model ${req.model}`, false);
  }
  return openrouterProvider.chat({ ...req, model: mapped });
}
