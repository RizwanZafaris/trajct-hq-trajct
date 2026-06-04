/**
 * packages/core/compliance — Public API
 *
 * FRD ownership: F-080 (Compliance & decision audit logging), F-082 (DSAR tooling)
 *
 * FAIL-CLOSED: If the log write fails, the decision is NOT served.
 * Enforced by the worker queue `q.compliance` (highest priority + DLQ alarm on depth > 0).
 * `writeDecisionLog` without a valid `consentRef` throws — no consent = no log = no decision.
 */

export type { DecisionLogEntry, DecisionLogResult } from "./decision-log.js";
export { writeDecisionLog, DecisionLogWriteError, ConsentMissingError } from "./decision-log.js";

export type { DsarExportRequest, DsarDeleteRequest, DsarResult } from "./dsar.js";
export { exportUserData, deleteUserData } from "./dsar.js";
