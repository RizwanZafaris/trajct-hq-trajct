/**
 * OpenRouter adapter (primary provider — F-057).
 * Routes to the right model per task tier. Model names are placeholders;
 * the tiers are the contract (Technical-Methodology §4.2).
 */

import type { CompletionRequest, CompletionResult, EmbedRequest, EmbedResult, LlmProvider } from "../types.js";

const TIER_MODELS: Record<string, string> = {
  frontier: "anthropic/claude-sonnet-4-5",
  mid:      "anthropic/claude-haiku-4-5",
  utility:  "mistralai/mistral-small",
  embed:    "openai/text-embedding-3-small",
};

export class OpenRouterAdapter implements LlmProvider {
  name = "openrouter";

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env["OPENROUTER_API_KEY"] ?? "";
    this.baseUrl = process.env["OPENROUTER_BASE_URL"] ?? "https://openrouter.ai/api/v1";
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const model = TIER_MODELS[req.taskTier] ?? TIER_MODELS["utility"] ?? "mistralai/mistral-small";
    const startMs = Date.now();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://trajct.com",
        "X-Title": "Trajct",
      },
      body: JSON.stringify({
        model,
        messages: req.messages,
        max_tokens: req.maxTokens ?? 2048,
        temperature: req.temperature ?? 0.3,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number };
      model: string;
    };

    const inputTokens = data.usage.prompt_tokens;
    const outputTokens = data.usage.completion_tokens;

    // Cost estimation — actual costs vary per model; reconcile with usage events
    const actualCostCents = Math.ceil((inputTokens * 0.003 + outputTokens * 0.015) / 1000 * 100);

    return {
      content: data.choices[0]?.message.content ?? "",
      modelVersion: data.model ?? model,
      promptVersion: "v1",
      inputTokens,
      outputTokens,
      actualCostCents,
      provider: "openrouter",
      durationMs: Date.now() - startMs,
    };
  }

  async embed(req: EmbedRequest): Promise<EmbedResult> {
    const model = req.modelVersion ?? TIER_MODELS["embed"] ?? "openai/text-embedding-3-small";

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: req.texts }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter embed error ${response.status}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[] }>;
      usage: { prompt_tokens: number };
      model: string;
    };

    return {
      embeddings: data.data.map((d) => d.embedding),
      modelVersion: data.model ?? model,
      inputTokens: data.usage.prompt_tokens,
      actualCostCents: Math.ceil(data.usage.prompt_tokens * 0.00002 * 100),
    };
  }
}
