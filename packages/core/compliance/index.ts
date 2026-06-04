/**
 * packages/core/compliance — Public API
 *
 * FRD ownership: F-080 (Compliance & decision audit logging), F-082 (DSAR tooling)
 *
 * FAIL-CLOSED: If the log write fails, the decision is NOT served.
 * This is enforced by the worker queue `q.compliance` (highest priority + DLQ alarm on depth > 0).
 *
 * The decision-log writer MUST be called BEFORE the result is served (F-080.6).
 * Any call to `writeDecisionLog` without a valid `consentRef` throws — no consent = no log = no decision.
 */

export type { DecisionLogEntry, DecisionLogResult } from "./decision-log";
export { writeDecisionLog } from "./decision-log";

export type { DsarExportRequest, DsarDeleteRequest, DsarResult } from "./dsar";
export { exportUserData, deleteUserData } from "./dsar";
