/**
 * F-071 — Plans, entitlements & feature gating.
 * Server-side only. Client trust is never accepted (FR-071.2).
 */

export interface EntitlementCheck {
  accountId: string;
  feature: string;
}

export interface EntitlementResult {
  entitled: boolean;
  quotaRemaining?: number;
}

export declare function checkEntitlement(check: EntitlementCheck): Promise<EntitlementResult>;
