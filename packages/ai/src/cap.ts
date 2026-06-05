/**
 * F-077 — Atomic spend cap enforcement using Redis Lua.
 *
 * FAIL-CLOSED: if Redis is unreachable, EVERY function throws CapRedisUnavailableError.
 * We never spend blind (FR-077.8, SR-077.3, TC-077.7).
 *
 * Pattern: reserve → (work) → commit OR release
 * The Lua script ensures atomicity: concurrent calls near the cap can't race past it (TC-077.4).
 *
 * Cap counters per key:
 *   cap:account:<accountId>  → {ceiling, committed, reserved, res:<reservationId>}
 *   cap:global               → {ceiling, committed, reserved, res:<reservationId>}
 *
 * These keys use AOF persistence (appendonly yes in docker-compose).
 * Reconcile against Postgres usage_events hourly (cron job — F-076).
 */

import type { Redis } from "ioredis";

export class CapRedisUnavailableError extends Error {
  constructor() {
    super("Redis unavailable — spend cap cannot be enforced. Refusing AI call. (fail-closed, F-077)");
    this.name = "CapRedisUnavailableError";
  }
}

export class CapExceededError extends Error {
  readonly remaining: number;
  readonly scope: "account" | "global";
  constructor(remaining: number, scope: "account" | "global" = "account") {
    super(`Spend cap exceeded (${scope}). Remaining: ${remaining} cents.`);
    this.name = "CapExceededError";
    this.remaining = remaining;
    this.scope = scope;
  }
}

// ---------------------------------------------------------------------------
// Lua scripts — atomic compare-and-set
// ---------------------------------------------------------------------------

const RESERVE_LUA = `
local key = KEYS[1]
local ceiling = tonumber(ARGV[1])
local cost = tonumber(ARGV[2])
local rid = ARGV[3]
local committed = tonumber(redis.call('HGET', key, 'committed') or '0')
local reserved  = tonumber(redis.call('HGET', key, 'reserved')  or '0')
local total = committed + reserved
if total + cost > ceiling then
  return {0, ceiling - total}
end
redis.call('HSET', key, 'reserved', reserved + cost)
redis.call('HSET', key, 'res:' .. rid, cost)
return {1, ceiling - (total + cost)}
`;

const COMMIT_LUA = `
local key = KEYS[1]
local rid  = ARGV[1]
local actual = tonumber(ARGV[2])
local rcost = tonumber(redis.call('HGET', key, 'res:' .. rid) or '0')
local reserved  = tonumber(redis.call('HGET', key, 'reserved')  or '0')
local committed = tonumber(redis.call('HGET', key, 'committed') or '0')
redis.call('HDEL', key, 'res:' .. rid)
redis.call('HSET', key, 'reserved',  math.max(0, reserved - rcost))
redis.call('HSET', key, 'committed', committed + actual)
return 1
`;

const RELEASE_LUA = `
local key = KEYS[1]
local rid  = ARGV[1]
local rcost = tonumber(redis.call('HGET', key, 'res:' .. rid) or '0')
local reserved = tonumber(redis.call('HGET', key, 'reserved') or '0')
redis.call('HDEL', key, 'res:' .. rid)
redis.call('HSET', key, 'reserved', math.max(0, reserved - rcost))
return 1
`;

const HEADROOM_LUA = `
local key = KEYS[1]
local committed = tonumber(redis.call('HGET', key, 'committed') or '0')
local reserved  = tonumber(redis.call('HGET', key, 'reserved')  or '0')
local ceiling   = tonumber(redis.call('HGET', key, 'ceiling')   or ARGV[1])
return ceiling - committed - reserved
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function accountKey(accountId: string): string {
  return `cap:account:${accountId}`;
}
const GLOBAL_KEY = "cap:global";

/**
 * Atomically reserve projected cost before spending. FAIL-CLOSED.
 * @throws CapRedisUnavailableError — Redis is down
 * @throws CapExceededError — cap would be exceeded
 */
export async function atomicCapReserve(
  redis: Redis,
  accountId: string,
  projectedCostCents: number,
  reservationId: string,
  accountCeilingCents: number,
  globalCeilingCents: number
): Promise<void> {
  try {
    const acctResult = (await redis.eval(
      RESERVE_LUA, 1, accountKey(accountId),
      String(accountCeilingCents), String(projectedCostCents), reservationId
    )) as [number, number];

    if (acctResult[0] === 0) {
      throw new CapExceededError(acctResult[1] ?? 0, "account");
    }

    const globalResult = (await redis.eval(
      RESERVE_LUA, 1, GLOBAL_KEY,
      String(globalCeilingCents), String(projectedCostCents), reservationId
    )) as [number, number];

    if (globalResult[0] === 0) {
      // Release account reservation we just took
      await redis.eval(RELEASE_LUA, 1, accountKey(accountId), reservationId);
      throw new CapExceededError(globalResult[1] ?? 0, "global");
    }
  } catch (err) {
    if (err instanceof CapExceededError) throw err;
    throw new CapRedisUnavailableError();
  }
}

/** Commit actual spend after successful work. Logs on failure but doesn't throw. */
export async function commitCapSpend(
  redis: Redis,
  accountId: string,
  actualCostCents: number,
  reservationId: string
): Promise<void> {
  try {
    await Promise.all([
      redis.eval(COMMIT_LUA, 1, accountKey(accountId), reservationId, String(actualCostCents)),
      redis.eval(COMMIT_LUA, 1, GLOBAL_KEY, reservationId, String(actualCostCents)),
    ]);
  } catch {
    console.error(`[cap] Commit failed for reservation ${reservationId} — needs offline reconciliation`);
  }
}

/** Release reservation without committing (on error / no-charge cases). */
export async function releaseCapReservation(
  redis: Redis,
  accountId: string,
  reservationId: string
): Promise<void> {
  try {
    await Promise.all([
      redis.eval(RELEASE_LUA, 1, accountKey(accountId), reservationId),
      redis.eval(RELEASE_LUA, 1, GLOBAL_KEY, reservationId),
    ]);
  } catch {
    console.error(`[cap] Release failed for reservation ${reservationId}`);
  }
}

/** Get remaining headroom for an account. Returns Infinity if Redis unavailable (fail-open — for display only). */
export async function getCapHeadroom(
  redis: Redis,
  accountId: string,
  ceilingCents: number
): Promise<{ account: number; global: number }> {
  try {
    const [acct, glob] = await Promise.all([
      redis.eval(HEADROOM_LUA, 1, accountKey(accountId), String(ceilingCents)) as Promise<number>,
      redis.eval(HEADROOM_LUA, 1, GLOBAL_KEY, String(ceilingCents)) as Promise<number>,
    ]);
    return { account: Number(acct), global: Number(glob) };
  } catch {
    return { account: Infinity, global: Infinity };
  }
}

/** Reset cap for a new billing cycle (called by cron or billing webhook). */
export async function resetCapCycle(redis: Redis, accountId: string): Promise<void> {
  await redis.hdel(accountKey(accountId), "committed", "reserved");
}
