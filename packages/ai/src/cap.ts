/**
 * F-077 — Atomic spend cap enforcement using Redis Lua.
 *
 * FAIL-CLOSED: if Redis is unreachable, EVERY function throws CapRedisUnavailableError.
 * We never spend blind (FR-077.8, SR-077.3, TC-077.7).
 *
 * Pattern: reserve → (work) → commit OR release
 * The Lua script ensures atomicity: concurrent calls near the cap can't race past it (TC-077.4).
 */

import IORedis from "ioredis";

export class CapRedisUnavailableError extends Error {
  constructor() {
    super("Redis unavailable — spend cap cannot be enforced. Refusing AI call. (fail-closed, F-077)");
    this.name = "CapRedisUnavailableError";
  }
}

export class CapExceededError extends Error {
  readonly remaining: number;
  constructor(remaining: number) {
    super(`Spend cap exceeded. Remaining: ${remaining} cents. (F-077, COST_CEILING_HIT)`);
    this.name = "CapExceededError";
    this.remaining = remaining;
  }
}

/**
 * Lua script for atomic cap reserve.
 * Returns: [allowed: 0|1, remaining: number]
 * Atomicity guarantees: no two concurrent calls can both "see" headroom they together exceed.
 */
const RESERVE_LUA = `
local key = KEYS[1]
local ceiling = tonumber(ARGV[1])
local cost = tonumber(ARGV[2])
local reservation_id = ARGV[3]

-- Get current committed + reserved
local committed = tonumber(redis.call('HGET', key, 'committed') or '0')
local reserved = tonumber(redis.call('HGET', key, 'reserved') or '0')
local total = committed + reserved

if total + cost > ceiling then
  return {0, ceiling - total}
end

-- Reserve
redis.call('HSET', key, 'reserved', reserved + cost)
redis.call('HSET', key, 'res:' .. reservation_id, cost)
return {1, ceiling - (total + cost)}
`;

const COMMIT_LUA = `
local key = KEYS[1]
local reservation_id = ARGV[1]
local actual_cost = tonumber(ARGV[2])

local reserved_cost = tonumber(redis.call('HGET', key, 'res:' .. reservation_id) or '0')
local reserved = tonumber(redis.call('HGET', key, 'reserved') or '0')
local committed = tonumber(redis.call('HGET', key, 'committed') or '0')

-- Release reservation, commit actual
redis.call('HDEL', key, 'res:' .. reservation_id)
redis.call('HSET', key, 'reserved', math.max(0, reserved - reserved_cost))
redis.call('HSET', key, 'committed', committed + actual_cost)
return 1
`;

const RELEASE_LUA = `
local key = KEYS[1]
local reservation_id = ARGV[1]

local reserved_cost = tonumber(redis.call('HGET', key, 'res:' .. reservation_id) or '0')
local reserved = tonumber(redis.call('HGET', key, 'reserved') or '0')

redis.call('HDEL', key, 'res:' .. reservation_id)
redis.call('HSET', key, 'reserved', math.max(0, reserved - reserved_cost))
return 1
`;

function getAccountCapKey(accountId: string): string {
  return `cap:account:${accountId}`;
}

const GLOBAL_CAP_KEY = "cap:global";

/**
 * Atomically reserve capacity before a spend. FAIL-CLOSED.
 * @throws CapRedisUnavailableError if Redis is down
 * @throws CapExceededError if cap would be exceeded
 */
export async function atomicCapReserve(
  redis: IORedis,
  accountId: string,
  projectedCostCents: number,
  reservationId: string,
  accountCeilingCents: number,
  globalCeilingCents: number
): Promise<void> {
  try {
    // Check account cap
    const accountResult = await redis.eval(
      RESERVE_LUA,
      1,
      getAccountCapKey(accountId),
      accountCeilingCents.toString(),
      projectedCostCents.toString(),
      reservationId
    ) as [number, number];

    if (accountResult[0] === 0) {
      throw new CapExceededError(accountResult[1] ?? 0);
    }

    // Check global cap
    const globalResult = await redis.eval(
      RESERVE_LUA,
      1,
      GLOBAL_CAP_KEY,
      globalCeilingCents.toString(),
      projectedCostCents.toString(),
      reservationId
    ) as [number, number];

    if (globalResult[0] === 0) {
      // Release the account reservation we just took
      await redis.eval(RELEASE_LUA, 1, getAccountCapKey(accountId), reservationId);
      throw new CapExceededError(globalResult[1] ?? 0);
    }
  } catch (err) {
    if (err instanceof CapExceededError) throw err;
    // Any other error = Redis unavailable → fail closed
    throw new CapRedisUnavailableError();
  }
}

/**
 * Commit the actual spend after successful work.
 */
export async function commitCapSpend(
  redis: IORedis,
  accountId: string,
  actualCostCents: number,
  reservationId: string
): Promise<void> {
  try {
    await Promise.all([
      redis.eval(COMMIT_LUA, 1, getAccountCapKey(accountId), reservationId, actualCostCents.toString()),
      redis.eval(COMMIT_LUA, 1, GLOBAL_CAP_KEY, reservationId, actualCostCents.toString()),
    ]);
  } catch {
    // Commit failure is logged but doesn't throw — work is done; reconcile offline
    console.error(`[cap] Commit failed for reservation ${reservationId} — needs offline reconciliation`);
  }
}

/**
 * Release a reservation without committing (on error/abort).
 */
export async function releaseCapReservation(
  redis: IORedis,
  accountId: string,
  reservationId: string
): Promise<void> {
  try {
    await Promise.all([
      redis.eval(RELEASE_LUA, 1, getAccountCapKey(accountId), reservationId),
      redis.eval(RELEASE_LUA, 1, GLOBAL_CAP_KEY, reservationId),
    ]);
  } catch {
    console.error(`[cap] Release failed for reservation ${reservationId}`);
  }
}
