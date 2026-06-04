/**
 * Anthropic provider — Messages API (fetch-based, no SDK).
 * Anthropic uses a distinct wire format (system separated, content blocks).
 */

import { ProviderError, isRetriableStatus } from "../types.js";
import type { RawProvider, RawChatRequest, RawChatResult } from "../types.js";

export class AnthropicProvider implements RawProvider {
  readonly name = "anthropic";

  serves(model: string): boolean {
    return model.startsWith("claude-");
  }

  private apiKey(): string {
    const key = process.env["ANTHROPIC_API_KEY"];
    if (!key) throw new ProviderError(this.name, 401, "ANTHROPIC_API_KEY not set", false);
    return key;
  }

  async chat(req: RawChatRequest): Promise<RawChatResult> {
    // Anthropic separates the system prompt from the message turns.
    const systemMsgs = req.messages.filter((m) => m.role === "system").map((m) => m.content);
    const turns = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: req.model,
      max_tokens: req.maxTokens,
      temperature: req.temperature,
      messages: turns,
    };
    if (systemMsgs.length) body["system"] = systemMsgs.join("\n\n");

    let resp: Response;
    try {
      resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey(),
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(req.timeoutMs),
      });
    } catch (err) {
      throw new ProviderError(this.name, 503, err instanceof Error ? err.message : "network error", true);
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new ProviderError(this.name, resp.status, text.slice(0, 200), isRetriableStatus(resp.status));
    }

    const data = (await resp.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };

    const content = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");

    return {
      content,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      model: data.model ?? req.model,
    };
  }
}
