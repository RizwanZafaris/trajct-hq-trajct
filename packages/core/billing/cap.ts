/**
 * F-077 — Halting spend cap.
 * Atomic Redis Lua reserve→commit pattern. FAIL-CLOSED: if Redis is unreachable,
 * every function throws — we never spend blind (FR-077.8, SR-077.3).
 *
 * State per account: a Redis hash   cap:<account_id>  { ceiling, reserved, committed }
 * Global state:                     cap:global         { ceiling, reserved, committed }
 */

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

export declare function checkCap(req: CapCheckRequest): Promise<CapCheckResult>;
export declare function reserveCap(accountId: string, cost: number, reservationId: string): Promise<void>;
export declare function commitCap(accountId: string, actualCost: number, reservationId: string): Promise<void>;
export declare function releaseCap(accountId: string, reservationId: string): Promise<void>;
