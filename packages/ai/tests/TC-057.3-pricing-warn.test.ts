/**
 * TC-057.3 [R10] — pricing estimateCostCents WARNs on unknown-model fallback.
 *
 * Silent default pricing is how cost drift hides. A known model must NOT warn;
 * an unknown model MUST warn and use the safe default rate.
 *
 * Covers: F-057, architect fix R10
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { estimateCostCents, computeCostUsd } from "../src/pricing.js";

describe("TC-057.3 pricing WARN on unknown model", () => {
  afterEach(() => vi.restoreAllMocks());

  it("known model → no WARN", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cents = estimateCostCents("claude-haiku-4-5", 1000, 500);
    expect(cents).toBeGreaterThan(0);
    expect(warn).not.toHaveBeenCalled();
  });

  it("unknown model → WARN + safe default rate applied", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cents = estimateCostCents("totally-made-up-model-v9", 1_000_000, 1_000_000);
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/unknown model/i);
    // Default rate is mid-tier (3.0 in / 15.0 out per 1M) → (3 + 15) USD → 1800 cents.
    expect(cents).toBe(1800);
  });

  it("computeCostUsd is monotonic in tokens", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = computeCostUsd("claude-opus-4-8", 1000, 1000);
    const b = computeCostUsd("claude-opus-4-8", 2000, 2000);
    expect(b).toBeGreaterThan(a);
  });
});
