/**
 * Google Gemini provider — Generative Language API (fetch-based, no SDK).
 */

import { ProviderError, isRetriableStatus } from "../types.js";
import type { RawProvider, RawChatRequest, RawChatResult } from "../types.js";

export class GoogleProvider implements RawProvider {
  readonly name = "google";

  serves(model: string): boolean {
    return model.startsWith("gemini-");
  }

  private apiKey(): string {
    const key = process.env["GOOGLE_API_KEY"];
    if (!key) throw new ProviderError(this.name, 401, "GOOGLE_API_KEY not set", false);
    return key;
  }

  async chat(req: RawChatRequest): Promise<RawChatResult> {
    const systemMsgs = req.messages.filter((m) => m.role === "system").map((m) => m.content);
    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: req.maxTokens,
        temperature: req.temperature,
        ...(req.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    };
    if (systemMsgs.length) body["systemInstruction"] = { parts: [{ text: systemMsgs.join("\n\n") }] };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${this.apiKey()}`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    const content =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    return {
      content,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      model: req.model,
    };
  }
}
