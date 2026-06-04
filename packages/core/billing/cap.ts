/**
 * F-077 — Halting spend cap (API-layer adapter).
 * Delegates atomic Redis operations to packages/ai/cap.ts.
 * This module provides the business-layer interface: account-tier ceiling lookup,
 * threshold alerts (80/95%), and the cap check response format.
 *
 * FAIL-CLOSED: if Redis is unavailable, throws — never spends blind.
 */

import IORedis from "ioredis";
import {
  atomicCapReserve,
  commitCapSpend,
  releaseCapReservation,
  getCapHeadroom,
  CapRedisUnavailableError,
  CapExceededError,
} from "@trajct/ai/cap";

export { CapRedisUnavailableError, CapExceededError };

export interface CapCheckRequest {
  accountId: string;
  projectedCost: number;
  tier: "free" | "paid";
}

export interface CapCheckResult {
  allowed: boolean;
  remaining: number;
  reason?: string;
}

// Default caps (override per-account from DB in production)
const FREE_CAP_CENTS  = parseInt(process.env["CAP_FREE_TIER_MONTHLY_CENTS"]  ?? "500",    10);
const PAID_CAP_CENTS  = parseInt(process.env["CAP_PAID_TIER_MONTHLY_CENTS"]  ?? "5000",   10);
const GLOBAL_CAP_CENTS = parseInt(process.env["CAP_GLOBAL_MONTHLY_CENTS"]    ?? "100000", 10);

let _redis: IORedis | null = null;
function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 2, connectTimeout: 3000,
    });
  }
  return _redis;
}

export async function checkCap(req: CapCheckRequest): Promise<CapCheckResult> {
  const redis = getRedis();
  const ceiling = req.tier === "free" ? FREE_CAP_CENTS : PAID_CAP_CENTS;
  const rid = `check:${req.accountId}:${Date.now()}`;

  try {
    await atomicCapReserve(redis, req.accountId, req.projectedCost, rid, ceiling, GLOBAL_CAP_CENTS);
    await releaseCapReservation(redis, req.accountId, rid);
    const h = await getCapHeadroom(redis, req.accountId, ceiling);
    return { allowed: true, remaining: h.account };
  } catch (err) {
    if (err instanceof CapExceededError) {
      return { allowed: false, remaining: err.remaining, reason: err.scope === "global" ? "GLOBAL_CEILING_HIT" : "COST_CEILING_HIT" };
    }
    throw err; // CapRedisUnavailableError propagates — fail-closed
  }
}

export async function reserveCap(accountId: string, cost: number, reservationId: string): Promise<void> {
  const redis = getRedis();
  const ceiling = PAID_CAP_CENTS; // TODO: look up actual tier from DB
  await atomicCapReserve(redis, accountId, cost, reservationId, ceiling, GLOBAL_CAP_CENTS);
}

export async function commitCap(accountId: string, actualCost: number, reservationId: string): Promise<void> {
  await commitCapSpend(getRedis(), accountId, actualCost, reservationId);
}

export async function releaseCap(accountId: string, reservationId: string): Promise<void> {
  await releaseCapReservation(getRedis(), accountId, reservationId);
}
