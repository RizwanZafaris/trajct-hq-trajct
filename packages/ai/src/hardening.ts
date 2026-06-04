/**
 * F-057 — Hardened gateway internals: per-provider circuit breaker + jittered retry.
 * Port of jobHunt/agents/llm_hardening.py.
 *
 * Circuit breaker: after N consecutive failures for a provider, open the circuit
 * (skip straight to fallback) for a cooldown window. Half-open after cooldown.
 */

const THRESHOLD = parseInt(process.env["AI_CIRCUIT_BREAKER_THRESHOLD"] ?? "3", 10);
const COOLDOWN_MS = parseInt(process.env["AI_CIRCUIT_BREAKER_COOLDOWN_SECONDS"] ?? "60", 10) * 1000;

interface BreakerState {
  failures: number;
  openedAtMs: number | null;
}

const breakers = new Map<string, BreakerState>();

function state(provider: string): BreakerState {
  let s = breakers.get(provider);
  if (!s) {
    s = { failures: 0, openedAtMs: null };
    breakers.set(provider, s);
  }
  return s;
}

/** True if the circuit is OPEN (provider should be skipped). nowMs is injectable for tests. */
export function isCircuitOpen(provider: string, nowMs: number): boolean {
  const s = state(provider);
  if (s.openedAtMs === null) return false;
  if (nowMs - s.openedAtMs >= COOLDOWN_MS) {
    // Half-open: allow one trial through
    s.openedAtMs = null;
    s.failures = 0;
    return false;
  }
  return true;
}

export function recordSuccess(provider: string): void {
  const s = state(provider);
  s.failures = 0;
  s.openedAtMs = null;
}

/** Record a failure; opens the circuit at the threshold. nowMs injectable for tests. */
export function recordFailure(provider: string, nowMs: number): void {
  const s = state(provider);
  s.failures += 1;
  if (s.failures >= THRESHOLD) {
    s.openedAtMs = nowMs;
  }
}

/** Reset all breakers (test helper). */
export function resetBreakers(): void {
  breakers.clear();
}

/** Jittered exponential backoff delay in ms for attempt n (0-indexed). */
export function backoffMs(attempt: number, jitter: number): number {
  const base = Math.min(8000, 250 * 2 ** attempt);
  return Math.floor(base * (0.5 + jitter * 0.5));
}
