# Screening Launch Gate Checklist

**This checklist must be completed before enabling `screening_enabled` for any region.**
See Technical-Methodology §9 (V2 scope) and packages/core/screening/README.md.

## Gate items (all must be ✅ before flag flip)

- [ ] **TC-080.1–TC-080.6** all green in CI (compliance logging)
- [ ] **Data residency confirmed**: screening data is in AWS me-central-1 (UAE/KSA) or ap-southeast-1 (SG/MY), NOT Neon/Supabase
- [ ] **Bias audit** (F-034.8): selection-rate parity computed and within acceptable range for target market
- [ ] **Consent capture** (F-034.2): tested end-to-end — no assessment without a valid consent record
- [ ] **No biometric templates** storage confirmed (FR-034.5) — verified by storage audit test
- [ ] **Media lifecycle** configured: assessment media deletes ≤30 days post-transcription
- [ ] **Pentest** completed for screening flow (see Technical-Methodology §8)
- [ ] **`screening_auto_decision_total` metric** wired and alerting (tripwire — pages on any > 0)
- [ ] **Legal review** of consent text per region (UAE PDPL, KSA PDPL, SG PDPA)
- [ ] Human approval from: PM, Tech Lead, CISO delegate, Compliance PM

## Region-by-region status

| Region | Flag key | Status | Gate passed | Approved by |
|--------|----------|--------|-------------|-------------|
| UAE | `screening_enabled:uae` | OFF | ❌ | — |
| KSA | `screening_enabled:ksa` | OFF | ❌ | — |
| SG | `screening_enabled:sg` | OFF | ❌ | — |
