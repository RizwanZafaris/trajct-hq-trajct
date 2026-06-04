# @trajct/core/compliance

**FRD ownership:** F-080 · F-082

## Decision log — THE SECOND MOST IMPORTANT INVARIANT

`writeDecisionLog` must be called **before** the result is served (F-080.6).
If the log write fails, the decision is NOT served (fail-closed, BR-080.1).

- Decision log is **append-only** — no UPDATE or DELETE permissions granted to the app role
- Every entry has a hash chain column for tamper-evidence (F-080.2)
- Calling `writeDecisionLog` without a `consentRef` throws — by design

## DSAR tooling (F-082)

Deletion must be verified across ALL stores: Postgres, vectors schema, Redis, R2.
`deleteUserData` returns a `DsarResult` with `residualPiiCount` — this MUST be 0 (TC-082.6).
Outcome data is anonymized, not deleted (FR-082.3 — the loop survives without PII).

## Metrics to keep at zero (pages on any > 0)

`decision_without_log_total` · `log_tamper_detected_total` · `deletion_residual_pii_total`
