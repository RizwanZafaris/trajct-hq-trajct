/**
 * TC-077.1 — Account cap halt: when account is at 100%, generation is halted.
 * TC-077.7 — Fail safe: Redis unavailable → halt (fail-closed), not spend blind.
 *
 * Covers: FR-077.1/.2/.3, AC-077.1.1, NFR-077.2, SR-077.3
 */

import { describe, it, expect, vi } from "vitest";
import type IORedis from "ioredis";

describe("TC-077.1 Cap halt + TC-077.7 Fail-closed", () => {
  it("TC-077.1 — account at 100% cap halts with CapExceededError", async () => {
    const { atomicCapReserve, CapExceededError } = await import("../src/cap.js");

    // Redis mock that simulates a full account (committed = ceiling)
    const fullAccountRedis = {
      eval: vi.fn().mockImplementation(async (_script: string, _n: number, key: string, ceiling: string) => {
        if (String(key).includes("account")) {
          // Account at 100%: committed=ceiling, reserved=0 → no headroom
          return [0, 0]; // [allowed=0, remaining=0]
        }
        return [1, 1000]; // global has headroom
      }),
    } as unknown as IORedis;

    await expect(
      atomicCapReserve(fullAccountRedis, "testUser", 100, "rid-1", 1000, 5000)
    ).rejects.toBeInstanceOf(CapExceededError);
  });

  it("TC-077.7 — Redis unavailable → CapRedisUnavailableError (fail-closed)", async () => {
    const { atomicCapReserve, CapRedisUnavailableError } = await import("../src/cap.js");

    const brokenRedis = {
      eval: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    } as unknown as IORedis;

    await expect(
      atomicCapReserve(brokenRedis, "testUser", 100, "rid-2", 1000, 5000)
    ).rejects.toBeInstanceOf(CapRedisUnavailableError);
  });

  it("no-charge on halt: releaseCapReservation cleans up after failed work", async () => {
    const { releaseCapReservation } = await import("../src/cap.js");

    const released: string[] = [];
    const trackingRedis = {
      eval: vi.fn().mockImplementation(async (_script: string, _n: number, key: string, rid: string) => {
        released.push(`${key}:${rid}`);
        return 1;
      }),
    } as unknown as IORedis;

    await releaseCapReservation(trackingRedis, "testUser", "rid-3");
    expect(released.length).toBe(2); // account key + global key
    expect(released.some(k => k.includes("account"))).toBe(true);
    expect(released.some(k => k.includes("global"))).toBe(true);
  });
});
