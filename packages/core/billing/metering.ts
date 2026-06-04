/**
 * F-076 — Usage metering.
 * One event per action, idempotent by idempotency_key (FR-076.2).
 */

export interface UsageEvent {
  accountId: string;
  action: string;
  cost: number;
  idempotencyKey: string;
  modelVersion?: string;
  taskTier?: "frontier" | "mid" | "utility" | "embed";
  metadata?: Record<string, unknown>;
}

export declare function recordUsageEvent(event: UsageEvent): Promise<{ usageId: string; quotaRemaining: number }>;
