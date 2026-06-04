# @trajct/core/billing

**FRD ownership:** F-073 · F-074 · F-075 · F-076 · F-077

## Modules (all private — import only from `index.ts`)

| Module | Feature | Description |
|--------|---------|-------------|
| `cap` | F-077 | Atomic halting spend cap — Redis Lua reserve/commit, fail-closed |
| `metering` | F-076 | Idempotent usage event recording |
| `charge` | F-073 | PSP charge with idempotency + ledger write |
| `entitlements` | F-071 | Server-side plan/entitlement gating |

## Critical invariants (from FRD)

- **Fail-closed cap** (FR-077.8): If Redis is unreachable, `checkCap` throws — never spends blind.
- **Idempotency** (FR-073.2 / FR-076.2): Every charge and usage event carries an `idempotency_key`.
- **No charge for failed work** (FR-073.4 / FR-077.4): `commitCap` is only called after successful work; errors call `releaseCap`.
- **Double-entry ledger** (FR-073.7): Each charge produces one debit row + one credit row.

## Test cases to keep green

TC-073.2 (idempotent retry) · TC-073.7 (concurrent race) · TC-077.1 (cap halt) ·
TC-077.4 (concurrency safe) · TC-077.7 (fail-closed)
