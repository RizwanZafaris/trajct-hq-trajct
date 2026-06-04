# @trajct/core/screening

**FRD ownership:** F-034 · F-035 · F-036

## Launch gate — READ BEFORE TOUCHING THIS MODULE

Screening is NOT MVP. It MUST NOT go live until all of these are true:
1. **F-080 compliance logging** is wired and tested (TC-080.1–.6 green)
2. **F-081 data residency** confirmed — screening data must be in AWS in-region (me-central-1/Bahrain for MENA, ap-southeast-1 for APAC), NOT PaaS
3. **Bias audit** (F-034.8) passed for the target market
4. **Consent record** (F-034.2) captured before any assessment begins
5. **`screening_enabled` feature flag** set for the region (default: OFF everywhere)

A human must review and approve each checklist item before the flag is turned on per region.

## Key constraints (from FRD)

- No auto-decision (FR-034.6 / `screening_auto_decision_total` tripwire)
- No biometric templates (FR-034.5)
- Assessment media deleted ≤30 days post-transcription
- Every evaluation writes to audit_log BEFORE result is served (F-080.6)

## Test cases

TC-034.x · TC-080.4 (fail-closed log) · TC-096e.3 (no protected attributes in ranking)
