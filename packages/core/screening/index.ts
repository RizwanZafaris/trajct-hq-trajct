/**
 * packages/core/screening — Public API
 *
 * FRD ownership: F-034 (Region-gated screening), F-035 (Assessment), F-036 (Bias audit)
 *
 * LAUNCH GATE: This module MUST NOT be called in production until:
 *   1. F-080 compliance logging is wired (audit_log write before result serve)
 *   2. F-081 data residency is confirmed (AWS in-region, not PaaS)
 *   3. Bias audit (F-034.8) has passed for the target region
 *   4. Consent record (F-034.2) is captured before any assessment
 *
 * Region-gate: all functions check the `screening_enabled` feature flag for the region.
 * If the flag is off, they throw ScreeningRegionDisabledError — not silently skip.
 */

export type { ScreeningRequest, ScreeningResult } from "./screening.js";
export { evaluateScreening, ScreeningRegionDisabledError, ScreeningGatedError } from "./screening.js";

export type { ConsentRecord } from "./consent.js";
export { captureConsent, verifyConsent } from "./consent.js";
