/**
 * packages/core/billing — Public API
 *
 * FRD ownership: F-073 (Billing & payments), F-074 (Invoicing), F-075 (Dunning/refunds),
 *               F-076 (Usage metering), F-077 (Halting spend cap)
 *
 * Exports only what api/ and worker/ need. Internal modules are private.
 * See README.md for architecture notes.
 */

// Spend cap
export type { CapCheckRequest, CapCheckResult } from "./cap";
export { checkCap, reserveCap, commitCap, releaseCap } from "./cap";

// Usage metering
export type { UsageEvent } from "./metering";
export { recordUsageEvent } from "./metering";

// Billing charge
export type { ChargeRequest, ChargeResult } from "./charge";
export { initiateCharge } from "./charge";

// Entitlements
export type { EntitlementCheck, EntitlementResult } from "./entitlements";
export { checkEntitlement } from "./entitlements";
