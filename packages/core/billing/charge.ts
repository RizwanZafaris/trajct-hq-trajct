/**
 * F-073 — Billing & payments.
 * Idempotent charge via PSP adapter. Never double-charges (FR-073.2).
 * Never charges for failed/halted work (FR-073.4).
 */

export interface ChargeRequest {
  accountId: string;
  order: { sku: string; amount: number; currency: string };
  idempotencyKey: string;
  paymentToken: string;
}

export interface ChargeResult {
  chargeId: string;
  status: "succeeded" | "requires_action" | "failed";
  ledgerEntryId: string;
}

export declare function initiateCharge(req: ChargeRequest): Promise<ChargeResult>;
