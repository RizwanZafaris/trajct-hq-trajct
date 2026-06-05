/**
 * OpenAI-compatible provider base.
 * Used by: OpenAI, DeepSeek, Moonshot, OpenRouter — all expose /chat/completions.
 * Fetch-based (no SDK dependency) — robust, mockable, identical wire format.
 */

import { ProviderError, isRetriableStatus } from "../types.js";
import type { RawProvider, RawChatRequest, RawChatResult, RawEmbedResult } from "../types.js";

export interface OpenAICompatConfig {
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  servesPrefixes: string[];
  extraHeaders?: Record<string, string>;
}

export class OpenAICompatibleProvider implements RawProvider {
  readonly name: string;
  private readonly baseUrl: string;
  private readonly apiKeyEnv: string;
  private readonly servesPrefixes: string[];
  private readonly extraHeaders: Record<string, string>;

  constructor(cfg: OpenAICompatConfig) {
    this.name = cfg.name;
    this.baseUrl = cfg.baseUrl;
    this.apiKeyEnv = cfg.apiKeyEnv;
    this.servesPrefixes = cfg.servesPrefixes;
    this.extraHeaders = cfg.extraHeaders ?? {};
  }

  serves(model: string): boolean {
    return this.servesPrefixes.some((p) => model.startsWith(p));
  }

  private apiKey(): string {
    const key = process.env[this.apiKeyEnv];
    if (!key) throw new ProviderError(this.name, 401, `${this.apiKeyEnv} not set`, false);
    return key;
  }

  async chat(req: RawChatRequest): Promise<RawChatResult> {
    const body: Record<string, unknown> = {
      model: req.model,
      messages: req.messages,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
    };
    if (req.jsonMode) body["response_format"] = { type: "json_object" };

    let resp: Response;
    try {
      resp = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey()}`,
          "Content-Type": "application/json",
          ...this.extraHeaders,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(req.timeoutMs),
      });
    } catch (err) {
      // Network error / timeout → retriable (fall back to OpenRouter)
      throw new ProviderError(this.name, 503, err instanceof Error ? err.message : "network error", true);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new ProviderError(this.name, resp.status, text.slice(0, 200), isRetriableStatus(resp.status));
    }

    const data = (await resp.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };

    return {
      content: data.choices[0]?.message.content ?? "",
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      model: data.model ?? req.model,
    };
  }

  async embed(model: string, texts: string[], timeoutMs: number): Promise<RawEmbedResult> {
    let resp: Response;
    try {
      resp = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey()}`,
          "Content-Type": "application/json",
          ...this.extraHeaders,
        },
        body: JSON.stringify({ model, input: texts }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new ProviderError(this.name, 503, err instanceof Error ? err.message : "network error", true);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new ProviderError(this.name, resp.status, text.slice(0, 200), isRetriableStatus(resp.status));
    }

    const data = (await resp.json()) as {
      data: Array<{ embedding: number[] }>;
      usage?: { prompt_tokens?: number };
      model?: string;
    };

    return {
      embeddings: data.data.map((d) => d.embedding),
      inputTokens: data.usage?.prompt_tokens ?? 0,
      model: data.model ?? model,
    };
  }
}
