/**
 * F-057 — Model pricing table.
 * Ported VERBATIM from jobHunt/agents/llm_router.py PRICING_PER_1M.
 * Values are (inputUsdPer1M, outputUsdPer1M).
 *
 * The routing TABLE is the durable asset, not the model names (Technical-Methodology §0-A5).
 * Models resolve from env at call time so a model swap is a config change, not a code change.
 */

export type TaskTier = "frontier" | "mid" | "utility" | "embed";

/** (inputUsdPer1M, outputUsdPer1M) */
export const PRICING_PER_1M: Record<string, [number, number]> = {
  // Anthropic
  "claude-opus-4-8":            [15.0, 75.0], // env-default alias (same tier as opus-4-5)
  "claude-opus-4-5-20251101":   [15.0, 75.0],
  "claude-opus-4-5":            [15.0, 75.0],
  "claude-sonnet-4-6":          [3.0, 15.0],
  "claude-sonnet-4-5":          [3.0, 15.0],
  "claude-haiku-4-5-20251001":  [0.80, 4.0],
  "claude-haiku-4-5":           [0.80, 4.0],
  // OpenAI
  "gpt-5":                      [5.0, 20.0],
  "gpt-4.1":                    [2.0, 8.0],
  "gpt-4o":                     [2.50, 10.0],
  "gpt-4o-mini":                [0.15, 0.60],
  "o1":                         [15.0, 60.0],
  "text-embedding-3-small":     [0.02, 0.0],
  "text-embedding-3-large":     [0.13, 0.0],
  // Google
  "gemini-2.5-pro":             [1.25, 5.0],
  "gemini-2.5-flash":           [0.30, 2.50],
  "gemini-3.0-pro":             [2.0, 8.0],
  // DeepSeek
  "deepseek-chat":              [0.27, 1.10],
  "deepseek-reasoner":          [0.55, 2.19],
  // Moonshot Kimi
  "kimi-k2.6":                  [0.95, 4.0],
  "kimi-k2.5":                  [0.60, 3.0],
  "moonshot-v1-128k":           [2.0, 5.0],
  // OpenRouter (provider/model format, +5% markup)
  "anthropic/claude-opus-4-5":       [15.75, 78.75],
  "anthropic/claude-sonnet-4-6":     [3.15, 15.75],
  "anthropic/claude-sonnet-4-5":     [3.15, 15.75],
  "anthropic/claude-haiku-4-5":      [0.84, 4.20],
  "openai/gpt-5":                    [5.25, 21.0],
  "openai/gpt-4.1":                  [2.10, 8.40],
  "openai/gpt-4o":                   [2.625, 10.50],
  "openai/gpt-4o-mini":              [0.1575, 0.63],
  "google/gemini-2.5-pro":           [1.31, 5.25],
  "google/gemini-2.5-flash":         [0.315, 2.625],
  "deepseek/deepseek-chat":          [0.284, 1.155],
  "deepseek/deepseek-reasoner":      [0.578, 2.30],
  "moonshot/kimi-k2.6":              [1.0, 4.20],
  "moonshot/kimi-k2.5":              [0.63, 3.15],
};

/** Safe fallback price for an unrecognized model — assume mid-tier so we never under-reserve. */
const FALLBACK_PRICE: [number, number] = [3.0, 15.0];

/** Resolve the configured model for a tier, from env (overridable without code change). */
export function modelForTier(tier: TaskTier): string {
  switch (tier) {
    case "frontier": return process.env["AI_GATEWAY_FRONTIER_MODEL"] ?? "claude-opus-4-8";
    case "mid":      return process.env["AI_GATEWAY_MID_MODEL"]      ?? "claude-sonnet-4-6";
    case "utility":  return process.env["AI_GATEWAY_UTILITY_MODEL"]  ?? "claude-haiku-4-5";
    case "embed":    return process.env["AI_GATEWAY_EMBED_MODEL"]    ?? "text-embedding-3-small";
  }
}

/**
 * [REVIEW NOTE — R10] Model IDs and prices in PRICING_PER_1M are forward-dated.
 * VERIFY EVERY PRICE against the live provider pricing page before launch.
 * Silent default pricing is how cost drift hides — hence the WARN below.
 */

/** Resolve (inputUsdPer1M, outputUsdPer1M), logging a WARN when an unknown model
 *  falls back to the safe default rate (R10 — never let cost drift hide). */
function rateFor(model: string): [number, number] {
  const rate = PRICING_PER_1M[model];
  if (!rate) {
    console.warn(`[pricing] WARN unknown model "${model}" — using default rate ${FALLBACK_PRICE[0]}/${FALLBACK_PRICE[1]} per 1M. Add it to PRICING_PER_1M.`);
    return FALLBACK_PRICE;
  }
  return rate;
}

/** Compute USD cost for a completion given token counts. */
export function computeCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const [inP, outP] = rateFor(model);
  return (inputTokens / 1_000_000) * inP + (outputTokens / 1_000_000) * outP;
}

/**
 * Estimate cost in integer cents (rounded up). Used for pre-spend estimation and
 * post-spend metering. Logs a WARN on unknown-model fallback (R10).
 */
export function estimateCostCents(model: string, inputTokens: number, outputTokens: number): number {
  return usdToCents(computeCostUsd(model, inputTokens, outputTokens));
}

/** USD → integer cents (rounded up so we never under-reserve against the cap). */
export function usdToCents(usd: number): number {
  return Math.ceil(usd * 100);
}

/**
 * Estimate projected cost in cents BEFORE the call (for the cap reserve).
 * Uses a conservative token estimate: ~4 chars/token in, assume output ≈ maxTokens.
 */
export function estimateProjectedCents(model: string, promptChars: number, maxTokens: number): number {
  const estInputTokens = Math.ceil(promptChars / 4);
  return usdToCents(computeCostUsd(model, estInputTokens, maxTokens));
}
