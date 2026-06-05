/**
 * TC-057.1 — OpenRouter safety fallback rail.
 *
 * - Primary provider throws 429 (retriable) → fallback fires via OpenRouter
 * - Primary provider throws 400 (non-retriable) → fallback does NOT fire, error propagates
 * - OPENROUTER_API_KEY absent + primary fails → original error surfaced
 * - usedFallback=true when OpenRouter served the call
 *
 * Covers: F-057, FR-057 (provider-agnostic, multi-model + fallback)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProviderError } from "../src/types.js";

describe("TC-057.1 Gateway OpenRouter fallback", () => {
  const origEnv = { ...process.env };

  beforeEach(async () => {
    const { resetBreakers } = await import("../src/hardening.js");
    resetBreakers();
  });

  afterEach(() => {
    process.env = { ...origEnv };
    vi.restoreAllMocks();
  });

  it("retriable 429 from primary → falls back to OpenRouter (usedFallback=true)", async () => {
    process.env["OPENROUTER_API_KEY"] = "sk-or-test";
    const providers = await import("../src/providers/index.js");
    const { route } = await import("../src/router.js");

    // anthropic serves claude-* → make it throw 429
    vi.spyOn(providers.anthropicProvider, "chat").mockRejectedValue(
      new ProviderError("anthropic", 429, "rate limited", true)
    );
    // OpenRouter fallback returns a good result
    vi.spyOn(providers.openrouterProvider, "chat").mockResolvedValue({
      content: "fallback-ok", inputTokens: 10, outputTokens: 5, model: "anthropic/claude-opus-4-5",
    });

    const result = await route({
      model: "claude-opus-4-8",
      messages: [{ role: "user", content: "hi" }],
      maxTokens: 100, temperature: 0.3, jsonMode: false, timeoutMs: 5000,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.provider).toBe("openrouter");
    expect(result.content).toBe("fallback-ok");
  });

  it("non-retriable 400 from primary → NO fallback, error propagates", async () => {
    process.env["OPENROUTER_API_KEY"] = "sk-or-test";
    const providers = await import("../src/providers/index.js");
    const { route } = await import("../src/router.js");

    vi.spyOn(providers.anthropicProvider, "chat").mockRejectedValue(
      new ProviderError("anthropic", 400, "bad request", false)
    );
    const orSpy = vi.spyOn(providers.openrouterProvider, "chat");

    await expect(
      route({
        model: "claude-opus-4-8",
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 100, temperature: 0.3, jsonMode: false, timeoutMs: 5000,
      })
    ).rejects.toBeInstanceOf(ProviderError);

    expect(orSpy).not.toHaveBeenCalled();
  });

  it("OPENROUTER_API_KEY absent + primary fails (retriable) → original error surfaced", async () => {
    delete process.env["OPENROUTER_API_KEY"];
    const providers = await import("../src/providers/index.js");
    const { route } = await import("../src/router.js");

    const original = new ProviderError("anthropic", 503, "unavailable", true);
    vi.spyOn(providers.anthropicProvider, "chat").mockRejectedValue(original);

    await expect(
      route({
        model: "claude-opus-4-8",
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 100, temperature: 0.3, jsonMode: false, timeoutMs: 5000,
      })
    ).rejects.toBe(original);
  });

  it("primary success → usedFallback=false", async () => {
    const providers = await import("../src/providers/index.js");
    const { route } = await import("../src/router.js");

    vi.spyOn(providers.anthropicProvider, "chat").mockResolvedValue({
      content: "primary-ok", inputTokens: 8, outputTokens: 4, model: "claude-opus-4-8",
    });

    const result = await route({
      model: "claude-opus-4-8",
      messages: [{ role: "user", content: "hi" }],
      maxTokens: 100, temperature: 0.3, jsonMode: false, timeoutMs: 5000,
    });

    expect(result.usedFallback).toBe(false);
    expect(result.provider).toBe("anthropic");
  });
});
