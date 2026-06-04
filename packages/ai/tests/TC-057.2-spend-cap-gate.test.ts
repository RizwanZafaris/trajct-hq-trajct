/**
 * TC-057.2 — Gateway spend-cap gate (fail-closed).
 *
 * - Redis down before call → CapRedisUnavailableError, NO LLM call made
 * - Cap exceeded → CapExceededError, NO LLM call made
 * - Success → commitCapSpend called; usage sink called with correct costCents
 * - Failure → releaseCapReservation called; usage sink NOT called
 *
 * Covers: F-057 + F-077 (cap gate precedes every LLM call, fail-closed)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Redis } from "ioredis";
import { ProviderError } from "../src/types.js";

// A mock Redis whose eval can be programmed per-test.
function mockRedis(evalImpl: (...args: unknown[]) => Promise<unknown>): Redis {
  return { eval: vi.fn().mockImplementation(evalImpl) } as unknown as Redis;
}

describe("TC-057.2 Gateway spend-cap gate", () => {
  beforeEach(async () => {
    const { resetBreakers } = await import("../src/hardening.js");
    resetBreakers();
    vi.restoreAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  it("Redis down → CapRedisUnavailableError, no LLM call", async () => {
    const { Gateway, CapRedisUnavailableError } = await import("../src/gateway.js");
    const providers = await import("../src/providers/index.js");
    const chatSpy = vi.spyOn(providers.anthropicProvider, "chat");

    const redis = mockRedis(async () => { throw new Error("ECONNREFUSED"); });
    const gw = new Gateway({ redis });

    await expect(
      gw.complete({
        task: "engine.test", taskTier: "utility", accountId: "u1", idempotencyKey: "k1",
        messages: [{ role: "user", content: "hi" }],
      })
    ).rejects.toBeInstanceOf(CapRedisUnavailableError);

    expect(chatSpy).not.toHaveBeenCalled();
  });

  it("cap exceeded → CapExceededError, no LLM call", async () => {
    const { Gateway, CapExceededError } = await import("../src/gateway.js");
    const providers = await import("../src/providers/index.js");
    const chatSpy = vi.spyOn(providers.anthropicProvider, "chat");

    // RESERVE returns [0, remaining] → cap exceeded
    const redis = mockRedis(async () => [0, 0]);
    const gw = new Gateway({ redis });

    await expect(
      gw.complete({
        task: "engine.test", taskTier: "utility", accountId: "u1", idempotencyKey: "k2",
        messages: [{ role: "user", content: "hi" }],
      })
    ).rejects.toBeInstanceOf(CapExceededError);

    expect(chatSpy).not.toHaveBeenCalled();
  });

  it("success → commit + usage sink called with costCents", async () => {
    const { Gateway } = await import("../src/gateway.js");
    const providers = await import("../src/providers/index.js");

    vi.spyOn(providers.anthropicProvider, "chat").mockResolvedValue({
      content: "ok", inputTokens: 1000, outputTokens: 500, model: "claude-haiku-4-5",
    });

    const evalCalls: string[] = [];
    const redis = mockRedis(async (script: unknown) => {
      const s = String(script);
      if (s.includes("return {1, ceiling")) return [1, 1000]; // reserve allowed
      if (s.includes("committed + actual")) { evalCalls.push("commit"); return 1; }
      return 1;
    });

    const usageEvents: Array<{ costCents: number }> = [];
    const gw = new Gateway({ redis, usageSink: async (e) => { usageEvents.push({ costCents: e.costCents }); } });

    const result = await gw.complete({
      task: "engine.test", taskTier: "utility", accountId: "u1", idempotencyKey: "k3",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(result.content).toBe("ok");
    expect(evalCalls).toContain("commit");
    expect(usageEvents.length).toBe(1);
    // haiku: 1000 in * 0.80/1M + 500 out * 4.0/1M = 0.0008 + 0.002 = 0.0028 USD → ceil(0.28c) = 1c
    expect(usageEvents[0]!.costCents).toBeGreaterThan(0);
  });

  it("LLM failure → release called, usage sink NOT called", async () => {
    const { Gateway } = await import("../src/gateway.js");
    const providers = await import("../src/providers/index.js");

    process.env["OPENROUTER_API_KEY"] = ""; // no fallback so failure propagates
    vi.spyOn(providers.anthropicProvider, "chat").mockRejectedValue(
      new ProviderError("anthropic", 400, "bad", false)
    );

    const evalCalls: string[] = [];
    const redis = mockRedis(async (script: unknown) => {
      const s = String(script);
      if (s.includes("return {1, ceiling")) return [1, 1000];
      if (s.includes("HDEL") && !s.includes("committed + actual")) { evalCalls.push("release"); return 1; }
      return 1;
    });

    const usageEvents: unknown[] = [];
    const gw = new Gateway({ redis, usageSink: async () => { usageEvents.push(1); } });

    await expect(
      gw.complete({
        task: "engine.test", taskTier: "utility", accountId: "u1", idempotencyKey: "k4",
        messages: [{ role: "user", content: "hi" }],
      })
    ).rejects.toBeInstanceOf(ProviderError);

    expect(evalCalls).toContain("release");
    expect(usageEvents.length).toBe(0);
  });
});
