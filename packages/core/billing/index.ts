/**
 * packages/core/billing — Public API
 *
 * FRD ownership: F-073 (Billing), F-074 (Invoicing), F-075 (Dunning/refunds),
 *               F-076 (Usage metering), F-077 (Halting spend cap)
 */

export { checkCap, reserveCap, commitCap, releaseCap, CapRedisUnavailableError, CapExceededError } from "./cap.js";
export type { CapCheckRequest, CapCheckResult } from "./cap.js";

export { recordUsageEvent, getMonthlySpend } from "./metering.js";
export type { UsageEvent, UsageEventResult } from "./metering.js";

export { initiateCharge, verifyWebhookSignature } from "./charge.js";
export type { ChargeRequest, ChargeResult } from "./charge.js";

export { checkEntitlement, checkFeatureFlag } from "./entitlements.js";
export type { EntitlementCheck, EntitlementResult } from "./entitlements.js";
