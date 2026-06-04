# Functional Requirement Document — Trajct **Platform / Internal**

> Paired with Platform/Internal PRD (PRD-2026-001-P). Simpaisa-FRD-template structure, framework refs removed, Trajct domain.
> References the Wireframe Library (W-3xx) and the Shared Engine Spec (00). Build-ready depth: concrete limits, real
> error codes, semantic validations, adversarial test cases. **Extra rigor on payments (idempotency / no double-charge),
> the halting spend cap (margin protection), compliance/decision logging, and trust & safety.**

---

## 0. Document control
| Field | Value |
|---|---|
| FRD title | FRD — Trajct Platform / Internal |
| FRD ID | FRD-2026-001-P |
| Version | 0.1.0 (Draft) |
| Owner (Product) | Platform PM |
| Owner (Engineering) | Platform Tech Lead |
| Reviewers | Eng Lead, QA Lead, CISO delegate, Compliance PM, Finance |
| Source PRD | PRD-2026-001-P |
| Wireframes | W-3xx |
| Consumed by | Candidate FRD + Employer FRD (auth, billing, usage, notifications, compliance) |

### 0.2 Sign-off
| Reviewer | Role | Status |
|---|---|---|
| PM | Product owner | Pending |
| Tech Lead | Engineering owner | Pending |
| QA Lead | QA owner | Pending |
| CISO delegate | Security | Pending |
| Compliance PM | Regulatory | Pending |
| Finance | Billing integrity / margin | Pending |

---

## 1. Purpose & scope
### 1.1 Purpose
Specify every functional requirement of the Trajct **platform/internal** layer — the shared backbone both products
depend on: identity & org management, billing & monetization, usage metering, the **halting spend cap** (the
margin-protection kill-switch), compliance & decision logging, trust & safety, admin/back-office, observability, and
incident response.

### 1.2 PRD boundary — what this FRD does NOT cover
- Business model, pricing strategy, GTM → Platform PRD.
- Engine internals (matching/persona/AI routing/trust wall) → Shared Engine Spec (00).
- Candidate/Employer product features → their FRDs.

### 1.3 Scope — IN
F-070…F-086 (platform services) + F-092p (trust & safety). Specifically: billing/payments, plans/entitlements, usage
metering, spend cap, invoicing, tax, dunning, refunds, admin console, audit/compliance logging, data residency, DSAR
tooling, observability, incident response, feature flags, rate-limit/abuse infra, status page.

### 1.4 Scope — OUT
End-user-facing product flows; engine ML; **auto-charging beyond authorized amounts**; **spending past the cap** (both prohibited).

### 1.5 Assumptions & dependencies
| # | Assumption / dependency | If invalid, impact |
|---|---|---|
| A-1 | A PSP (e.g. Stripe-class) is integrated | Can't charge |
| A-2 | Engine routes all generation through the AI layer (F-057) | Metering/cap can't see spend |
| D-1 | Trust wall (F-060) enforced | Compliance/audit could expose private data |
| D-2 | Both product FRDs call these services | Platform is the single backbone |

### 1.6 Glossary
| Term | Definition |
|---|---|
| Spend cap | A hard, halting per-account/global ceiling on AI cost that stops generation when hit |
| Entitlement | What a plan/account is allowed to do (features, quotas) |
| DSAR | Data Subject Access Request (export/delete) |
| Idempotency key | A token ensuring a payment/op executes at most once |

---

## 2. Context & architecture
### 2.1 System context
```
Candidate App ─┐                                   ┌─ PSP (payments)
Employer App  ─┼──▶ PLATFORM ──▶ services: ────────┤─ Tax/invoicing
Engine (F-057)─┘    (auth/org, billing, usage,     ├─ Email/SMS (notifications)
                     spend-cap, compliance,         └─ Observability/SIEM
                     trust&safety, admin)
                          │
                     Audit/compliance store (immutable) · Data-residency partitions
```
### 2.2 Actors & roles
| Actor | Type | Interactions |
|---|---|---|
| End user (candidate/employer) | External | Pays, consumes metered features |
| Org admin | External | Manages billing, seats |
| Trajct ops/admin | Internal | Back-office, support, suspensions |
| Compliance officer | Internal | Audits decisions, handles DSARs |
| Engine | Internal system | Reports cost for metering/cap |
| PSP / Tax / Email | External system | Payments, invoices, delivery |

### 2.3 Data flow summary
Every consequential, metered action (generation, screening) reports cost to **usage metering (F-076)**, which checks the
**spend cap (F-077)** *before* the spend commits; if over cap, the action halts honestly (no silent overspend, no
surprise bill). Paid actions go through **billing (F-073)** with **idempotency** so a retry never double-charges. Every
automated decision is written to the **immutable compliance log (F-080)** with rationale + consent. Abuse and harmful
content route through **trust & safety (F-092p)**. Admins act through an audited **back-office (F-079)**.

---

## 3. Feature catalog (master list)
| F-ID | Feature | Priority | Release | Wireframe |
|---|---|---|---|---|
| F-070 | Identity & org/tenant management (shared) | P0 | v1.0 | W-301 |
| F-071 | Plans, entitlements & feature gating | P0 | v1.0 | W-302 |
| F-073 | Billing & payments | P0 | v1.0 | W-302 |
| F-074 | Invoicing, tax & receipts | P1 | v1.1 | W-302 |
| F-075 | Dunning, refunds & chargebacks | P1 | v1.1 | — |
| F-076 | Usage metering & quotas | P0 | v1.0 | W-303 |
| F-077 | Halting spend cap (margin kill-switch) | P0 | v1.0 | W-303 |
| F-078 | Rate limiting & abuse prevention (shared infra) | P0 | v1.0 | — |
| F-079 | Admin / back-office console | P1 | v1.1 | W-304 |
| F-080 | Compliance & decision audit logging | P0 | v1.0 | — |
| F-081 | Data residency & tenant isolation | P0 | v1.0 | — |
| F-082 | DSAR tooling (export / delete) shared | P0 | v1.0 | — |
| F-083 | Observability, metrics & alerting | P0 | v1.0 | W-305 |
| F-084 | Incident response & status page | P1 | v1.1 | W-305 |
| F-085 | Feature flags & config | P1 | v1.0 | — |
| F-086 | Secrets, key management & encryption | P0 | v1.0 | — |
| F-092p | Trust & safety (abuse, harmful content, fraud) | P0 | v1.0 | — |

---

## 4. Feature specifications

### 4.73 Feature F-073 — Billing & payments
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8.1 · **Wireframe:** W-302

**4.73.1 Description.** Charges users for paid features (candidate subscriptions, employer screening/usage) through a PSP,
**correctly and exactly once** — never double-charging, never charging beyond an authorized amount, never charging for
failed work. The financial-integrity core of the business.

**4.73.2 Triggers.** User subscribes/upgrades; metered usage bills; renewal; one-off purchase.

**4.73.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-073.1 | The system shall process payments via a PCI-compliant PSP; card data never touches Trajct servers (tokenized). | Must |
| FR-073.2 | The system shall make every charge **idempotent** (idempotency key) so retries never double-charge. | Must |
| FR-073.3 | The system shall only charge authorized amounts; never exceed the user-agreed price/quota. | Must |
| FR-073.4 | The system shall not charge for failed/halted work (e.g. generation that errored or hit the cap). | Must |
| FR-073.5 | The system shall reconcile PSP webhooks to internal state (payment succeeded/failed/disputed). | Must |
| FR-073.6 | The system shall handle currency + region per data-residency. | Should |
| FR-073.7 | The system shall record an auditable billing ledger entry per charge. | Must |
| FR-073.8 | The system shall support strong customer authentication (3DS/SCA) where required. | Must |

**4.73.4 User stories & acceptance criteria**
*Story F-073-S1: As a user, I want to be charged exactly what I agreed, once.*
- AC-073.1.1 — Given a successful payment, then exactly one charge for the agreed amount; ledger entry written.
- AC-073.1.2 — Given a **client retry / double-submit**, then idempotency prevents a second charge.
- AC-073.1.3 — Given a **generation that failed or hit the cap**, then no charge.
- AC-073.1.4 — Given a **PSP webhook says failed**, then access reflects unpaid; no service granted.
- AC-073.1.5 — Given card data, then it **never** hits Trajct servers (tokenized at PSP).
- AC-073.1.6 — Given **SCA required**, then 3DS challenge completes before charge.
- AC-073.1.7 — Given a **race** (two concurrent charges for one order), then only one succeeds.

**4.73.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-073.1 | Idempotency key per charge | Charge | Reject duplicate; return original result |
| BR-073.2 | Charge ≤ authorized amount | Charge | Block overcharge |
| BR-073.3 | No charge for failed/halted work | Post-work | Skip billing |
| BR-073.4 | Card data tokenized; never stored | Always | PCI boundary |
| BR-073.5 | Ledger entry per charge | Charge | Enforce write |
| BR-073.6 | Webhook→state reconciliation | Async | Reconcile + alert on mismatch |

**4.73.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| account_id | uuid | Y | — | … | Session |
| order | object | Y | {sku, amount, currency} | … | App |
| idempotency_key | string | Y | unique per logical charge | uuid | App |
| payment_token | string | Y | PSP token (no PAN) | tok_… | PSP SDK |

**4.73.7 Output specification — success (200/201)**
| Field | Type | Always | Description |
|---|---|---|---|
| charge_id | string | Y | — |
| status | enum | Y | succeeded/requires_action/failed |
| ledger_entry_id | string | Y | — |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 402 | PAYMENT_FAILED | declined | "Payment failed — check your card." | Yes |
| 409 | DUPLICATE_CHARGE | idempotency replay | (returns original) | No |
| 422 | AMOUNT_MISMATCH | amount > authorized | "Amount mismatch." | No |
| 423 | SCA_REQUIRED | 3DS needed | (triggers challenge) | Yes |
| 502 | PSP_UNAVAILABLE | PSP down | "Try again shortly." | Yes |

**4.73.8 State model**
```
Charge: Initiated → (RequiresAction→Authenticated)? → Authorized → Captured → Settled
                 ↘ Failed   ↘ Disputed→(Won|Lost)
Idempotency: Key(new)→Processing→Result(stored); Key(seen)→ReturnStored (no re-charge)
```

**4.73.9 Sequence (happy path)**
```
App→Platform: POST /charge (order, idempotency_key, payment_token)
Platform: check idempotency_key (new)
Platform→PSP: create charge (token, amount) [+3DS if SCA]
PSP→Platform: succeeded
Platform: write ledger + store idempotency result
Platform→App: 201 {charge_id, status:succeeded}
PSP→Platform(webhook): payment_intent.succeeded → reconcile
```

**4.73.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Double-submit / network retry | Idempotency returns original; no second charge |
| Failed/halted generation | No charge (BR-073.3) |
| Card declined | `402 PAYMENT_FAILED`; no access |
| Amount tampered (client sends higher/lower) | Server uses authoritative price; `422` if mismatch |
| SCA required | `423 SCA_REQUIRED` → 3DS |
| PSP webhook lost/late | Reconciliation job resolves; alert on mismatch |
| Concurrent charges (race) | DB-level unique on (order, idempotency); one wins |
| Refund after dispute | Handled via F-075 |
| Currency/region mismatch | Resolve per residency; don't silently convert wrong |
| Partial capture | Capture ≤ authorized only |

**4.73.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-073.1 | Integrity | 0 double-charges | Ledger audit |
| NFR-073.2 | Integrity | 0 charges for failed/halted work | Ledger vs. work audit |
| NFR-073.3 | Security | PCI-DSS SAQ-A boundary (no PAN on Trajct) | Pentest/audit |
| NFR-073.4 | Reliability | Webhook reconciliation lag ≤5 min p95 | Recon dashboard |
| NFR-073.5 | Latency | Charge p95 ≤3 s (excl. 3DS) | Probes |

**4.73.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-073.1 | Tokenized payments; no PAN/CVV stored |
| SR-073.2 | Idempotency + server-authoritative pricing |
| SR-073.3 | Webhook signature verification + replay protection |
| SR-073.4 | Ledger immutable + reconciled |

**4.73.13 Compliance & regulatory traceability**
| Regulation/control | FR/SR IDs |
|---|---|
| PCI-DSS | FR-073.1, SR-073.1, NFR-073.3 |
| SCA / PSD2 | FR-073.8 |
| Financial auditability | FR-073.7, SR-073.4 |

**4.73.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| charges_total | Counter | status | — |
| double_charge_total | Counter | — | any>0 = P1 |
| charge_for_failed_work_total | Counter | — | any>0 = P1 |
| webhook_reconciliation_lag | Histogram | — | p95>5min = P2 |
| psp_error_total | Counter | code | spike = P2 |

**4.73.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-073.1 | **Happy path** | valid order + token | one charge; ledger written | FR-073.1/.7, AC-073.1.1 | Integration |
| TC-073.2 | **Idempotent retry** | same idempotency key twice | one charge; original returned | FR-073.2, AC-073.1.2 | Integration |
| TC-073.3 | **No charge for failed work** | generation hit cap/errored | no charge | FR-073.4, AC-073.1.3 | Integration |
| TC-073.4 | **Webhook failed** | PSP says failed | unpaid; no access | FR-073.5, AC-073.1.4 | Integration |
| TC-073.5 | **No PAN on server** | inspect storage/logs | no card data | FR-073.1, AC-073.1.5 | Security |
| TC-073.6 | **SCA** | 3DS required | challenge then charge | FR-073.8, AC-073.1.6 | Integration |
| TC-073.7 | **Concurrent race** | two charges, one order | exactly one succeeds | BR-073.1, AC-073.1.7 | Concurrency |
| TC-073.8 | **Amount tamper** | client amount > authorized | `422 AMOUNT_MISMATCH` | BR-073.2 | Security |
| TC-073.9 | **PSP down** | PSP 5xx | `502`; retryable; no partial state | edge | Chaos |
| TC-073.10 | **Replayed webhook** | duplicate webhook | processed once | SR-073.3 | Security |
| TC-073.11 | **Refund/dispute** | chargeback | routed to F-075; ledger consistent | edge | Integration |

**4.73.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-073.1 | PSP choice + regional acquirers for MENA/APAC | Finance | Open |
| Q-073.2 | Local payment methods (e.g. mada, wallets) at launch | PM | Open |

---

### 4.77 Feature F-077 — Halting spend cap (margin kill-switch)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8.2 · **Wireframe:** W-303

**4.77.1 Description.** The margin-protection guarantee: a **hard, halting** ceiling on AI/compute cost — per account
*and* global — that **stops generation when hit** rather than silently bleeding money. The single most important
unit-economics safeguard; "honest degradation over surprise bankruptcy."

**4.77.2 Triggers.** Any metered generation/screening; cost accrues toward a cap; cap reached.

**4.77.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-077.1 | The system shall enforce a hard cost ceiling per account and a global ceiling. | Must |
| FR-077.2 | The system shall check projected cost **before** committing a generation; if it would exceed the cap, **halt** and do not spend. | Must |
| FR-077.3 | The system shall degrade honestly at the cap (clear message), never silently overspend or silently fail. | Must |
| FR-077.4 | The system shall not charge users for halted work (ties to F-073.4). | Must |
| FR-077.5 | The system shall alert ops as accounts/global approach thresholds (e.g. 80/95/100%). | Must |
| FR-077.6 | The system shall let ops adjust caps (audited) and reset per cycle. | Must |
| FR-077.7 | The system shall apply cheaper models/caching on free tiers to extend headroom (engine F-057). | Should |
| FR-077.8 | The cap shall be evaluated atomically to prevent concurrent-request overspend. | Must |

**4.77.4 User stories & acceptance criteria**
*Story F-077-S1: As the founder, I want a guarantee that spend can't run away.*
- AC-077.1.1 — Given an account at its cap, when it requests generation, then it's **halted** with an honest message; **no spend**.
- AC-077.1.2 — Given the **global cap** is hit, then new generation halts platform-wide gracefully; ops alerted.
- AC-077.1.3 — Given a halted generation, then **no charge** to the user.
- AC-077.1.4 — Given **concurrent requests** near the cap, then atomic check prevents overspend beyond the cap.
- AC-077.1.5 — Given 80/95% thresholds, then ops alerted **before** the hard stop.
- AC-077.1.6 — Given a new billing cycle, then caps reset per policy.
- AC-077.1.7 — Given a free-tier account, then cheaper models/caching extend its headroom.

**4.77.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-077.1 | Pre-spend projected-cost check | Before generation | Halt if over |
| BR-077.2 | Hard stop at 100% (no overspend) | Cap eval | Block |
| BR-077.3 | No charge for halted work | Billing | Skip |
| BR-077.4 | Atomic cap decrement | Concurrency | Serialize/CAS |
| BR-077.5 | Threshold alerts 80/95/100% | Monitoring | Notify ops |
| BR-077.6 | Cap changes audited | Admin | Log |

**4.77.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| account_id | uuid | Y | — | … | Session |
| projected_cost | number | Y | estimated cost of the op | 0.42 | Engine (F-057) |
| tier | enum | Y | free/paid | paid | Account |

**4.77.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| allowed | bool | Y | proceed or halt |
| remaining | number | Y | headroom |
| reason | string | N | if halted |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 423 | COST_CEILING_HIT | account cap reached | "Temporarily paused to protect quality — resets next cycle." | No (until reset) |
| 423 | GLOBAL_CEILING_HIT | global cap reached | "Service is busy — try again shortly." | Yes (later) |

**4.77.8 State model**
```
Account budget: Open(<80%) → Warned(80–95%) → Critical(95–100%) → Halted(100%) → (CycleReset→Open)
Generation: Requested → CapCheck → (Allowed→Spend→Decrement | Halted→NoSpend)
```

**4.77.9 Sequence (happy path + halt)**
```
Engine→Platform: capCheck(account, projected_cost)
Platform: atomic: remaining ≥ projected_cost ?
   yes → reserve cost → allowed=true → (engine generates) → commit actual cost
   no  → allowed=false, 423 COST_CEILING_HIT → engine halts, no spend, no charge
Platform→ops: alert if crossing 80/95/100%
```

**4.77.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Account at cap | Halt; honest message; no spend; no charge |
| Global cap hit | Platform-wide graceful halt; ops paged |
| Concurrent requests near cap | Atomic reserve; total never exceeds cap |
| Estimate < actual cost | Reconcile; tighten estimate; never let drift breach cap materially |
| Cap misconfigured to 0 | Fail safe (halt) not fail open |
| Cost-reporting outage (engine can't report) | Fail safe: halt rather than spend blind |
| Free-tier heavy user | Cheaper models/caching; then halt |
| Cap reset timing | Reset only on cycle boundary; audited |

**4.77.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-077.1 | Integrity | 0 overspend beyond cap (incl. under concurrency) | Cost audit |
| NFR-077.2 | Safety | Fail safe (halt) on any cap/cost-system failure | Chaos test |
| NFR-077.3 | Latency | Cap check ≤20 ms p95 (in the hot path) | Probes |
| NFR-077.4 | Honesty | 0 silent overspends or silent failures | Audit |

**4.77.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-077.1 | Cap evaluation tamper-proof; client cannot bypass |
| SR-077.2 | Cap changes authenticated + audited |
| SR-077.3 | Fail-closed on cost-system failure |

**4.77.13 Compliance & regulatory traceability**
| Control | FR IDs |
|---|---|
| Financial prudence / no surprise billing | FR-077.3/.4 |

**4.77.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| spend_current | Gauge | account, global | 80/95/100% thresholds |
| cap_halt_total | Counter | scope | spike = investigate |
| overspend_beyond_cap_total | Counter | — | any>0 = P1 (integrity breach) |
| cap_check_latency_ms | Histogram | — | p95>20ms = P2 |
| fail_open_events_total | Counter | — | any>0 = P1 (must fail closed) |

**4.77.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-077.1 | **Account cap halt** | account at 100% | `423 COST_CEILING_HIT`; no spend | FR-077.1/.2, AC-077.1.1 | Integration |
| TC-077.2 | **Global cap halt** | global at 100% | platform halt; ops alerted | FR-077.1, AC-077.1.2 | Integration |
| TC-077.3 | **No charge on halt** | halted op | no charge | FR-077.4, AC-077.1.3 | Integration |
| TC-077.4 | **Concurrency** | N parallel near cap | total ≤ cap (atomic) | FR-077.8, NFR-077.1, AC-077.1.4 | Concurrency |
| TC-077.5 | **Threshold alerts** | cross 80/95% | ops alerted before halt | FR-077.5, AC-077.1.5 | Integration |
| TC-077.6 | **Cycle reset** | new cycle | cap resets | FR-077.6, AC-077.1.6 | Integration |
| TC-077.7 | **Fail safe** | cost system down | halt (fail closed), not spend blind | NFR-077.2, SR-077.3 | Chaos |
| TC-077.8 | **Cap bypass attempt** | client forges allowed=true | server denies | SR-077.1 | Security |
| TC-077.9 | **Free-tier headroom** | free heavy user | cheaper models/caching then halt | FR-077.7, AC-077.1.7 | Integration |
| TC-077.10 | **Estimate drift** | actual > estimate | reconciled; no material breach | edge | Integration |

**4.77.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-077.1 | Default per-account caps by tier | Finance/PM | Open |
| Q-077.2 | Global cap value + headroom buffer | Finance | Open |

---

### 4.70 Feature F-070 — Identity & org/tenant management (shared)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7 · **Wireframe:** W-301

**4.70.1 Description.** The shared identity backbone for both products: users, orgs/tenants, sessions, MFA, password/credential security, and strict tenant isolation. Candidate accounts and employer orgs both sit on it.

**4.70.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-070.1 | The system shall manage users, orgs, and memberships with unique identities. | Must |
| FR-070.2 | The system shall hash credentials (Argon2id) and support MFA. | Must |
| FR-070.3 | The system shall isolate all data per tenant (no cross-tenant access). | Must |
| FR-070.4 | The system shall issue secure, revocable sessions with expiry + rotation. | Must |
| FR-070.5 | The system shall rate-limit auth and detect credential stuffing / breached passwords. | Must |

**4.70.4 Acceptance criteria**
- AC-070.1.1 — Given org A user, then no access to org B data.
- AC-070.1.2 — Given credentials, then stored only as Argon2id hashes.
- AC-070.1.3 — Given 5 failed logins, then lockout/`429`.
- AC-070.1.4 — Given logout/revoke, then session invalidated everywhere.
- AC-070.1.5 — Given a breached password, then rejected/warned.

**4.70.5 Business rules.** BR-070.1 unique identity; BR-070.2 tenant isolation; BR-070.3 lockout after N fails; BR-070.4 session rotation.

**4.70.6 Inputs.** credentials, session token. **4.70.7 Outputs.** `{user_id, org_id, session}`. Errors: `401 INVALID_CREDENTIALS`, `429 TOO_MANY_ATTEMPTS`, `403 CROSS_TENANT_DENIED`.

**4.70.8 State.** Session: Issued → Active → (Rotated)* → (Expired | Revoked).

**4.70.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Cross-tenant access | `403 CROSS_TENANT_DENIED` |
| Brute force | Lockout + `429` |
| Token replay after logout | Rejected |
| Breached password at signup | Rejected/warned |
| Concurrent sessions | Allowed + individually revocable |

**4.70.11 NFRs.** Auth ≤500 ms p95; 0 cross-tenant leaks; 0 plaintext secrets.
**4.70.12 Security.** SR-070.1 Argon2id; SR-070.2 tenant isolation at data layer; SR-070.3 session revocation; SR-070.4 breached-password + rate limits.
**4.70.13 Compliance.** Account security baseline.
**4.70.14 Observability.** `auth_attempts_total`, `cross_tenant_denied_total` (alert any>0), `lockouts_total`.

**4.70.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-070.1 | Tenant isolation | org A→org B | `403` | FR-070.3, AC-070.1.1 | Security |
| TC-070.2 | Hashing | inspect store | Argon2id only | FR-070.2, AC-070.1.2 | Security |
| TC-070.3 | Brute force | 5 fails | lockout/`429` | FR-070.5, AC-070.1.3 | Security |
| TC-070.4 | Session revoke | logout then reuse | invalidated | FR-070.4, AC-070.1.4 | Security |
| TC-070.5 | Breached pwd | pwned password | rejected | FR-070.5, AC-070.1.5 | Security |

**4.70.16 Open questions.** Q-070.1 — MFA mandatory scope. (Security, Open.)

---

### 4.71 Feature F-071 — Plans, entitlements & feature gating
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8.1 · **Wireframe:** W-302

**4.71.1 Description.** Defines plans (free/paid tiers, employer screening packs), the entitlements each grants (features + quotas), and **server-side gating** so paid features are never accessible without entitlement — and downgrades/expiries revoke access cleanly.

**4.71.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-071.1 | The system shall map plans → entitlements (features + quotas). | Must |
| FR-071.2 | The system shall enforce entitlement checks **server-side** on every gated action. | Must |
| FR-071.3 | The system shall revoke entitlements on downgrade/expiry/non-payment. | Must |
| FR-071.4 | The system shall keep free-tier value intact (free JD, diagnostic) without payment. | Must |
| FR-071.5 | The system shall handle plan changes mid-cycle (proration handled in billing). | Should |

**4.71.4 Acceptance criteria**
- AC-071.1.1 — Given no entitlement, then a paid feature returns `402`.
- AC-071.1.2 — Given a client bypass attempt, then server denies.
- AC-071.1.3 — Given expiry/non-payment, then access revoked.
- AC-071.1.4 — Given free tier, then free features still work.

**4.71.5 Business rules.** BR-071.1 server-side gating; BR-071.2 revoke on expiry; BR-071.3 free value preserved.

**4.71.6 Inputs.** `account_id`, `feature`. **4.71.7 Outputs.** `{entitled:bool, quota_remaining}`. Errors: `402 PAYMENT_REQUIRED`, `403 NOT_ENTITLED`.

**4.71.8 State.** Entitlement: Granted → (QuotaConsumed)* → (Revoked | Renewed).

**4.71.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Client forges entitlement | Server denies |
| Expiry mid-session | Next gated action blocked |
| Downgrade | Higher-tier features revoked |
| Quota exhausted | `403 NOT_ENTITLED` / upsell |
| Grace period (dunning) | Per policy; then revoke |

**4.71.11 NFRs.** Entitlement check ≤30 ms; 0 client-trust bypasses.
**4.71.12 Security.** SR-071.1 server-authoritative entitlements; SR-071.2 audited plan changes.
**4.71.13 Compliance.** —
**4.71.14 Observability.** `entitlement_denied_total`, `gating_bypass_blocked_total`, `quota_exhausted_total`.

**4.71.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-071.1 | No entitlement | paid feature, free user | `402` | FR-071.2, AC-071.1.1 | Security |
| TC-071.2 | Client bypass | forged flag | denied | FR-071.2, AC-071.1.2 | Security |
| TC-071.3 | Expiry revoke | expired plan | access revoked | FR-071.3, AC-071.1.3 | Integration |
| TC-071.4 | Free value | free features | work | FR-071.4, AC-071.1.4 | Integration |
| TC-071.5 | Quota | exhausted | `403`/upsell | edge | Integration |

**4.71.16 Open questions.** Q-071.1 — grace-period length on non-payment. (PM, Open.)

---

### 4.74 Feature F-074 — Invoicing, tax & receipts
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §8.1 · **Wireframe:** W-302

**4.74.1 Description.** Generates compliant invoices/receipts, computes tax (VAT/GST per region — MENA/APAC first), and stores immutable financial records. Correctness and regional tax compliance are the bar.

**4.74.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-074.1 | The system shall generate an invoice/receipt per transaction. | Must |
| FR-074.2 | The system shall compute applicable tax (VAT/GST) by region + customer type (B2B reverse-charge where relevant). | Must |
| FR-074.3 | The system shall store immutable financial records for the required retention period. | Must |
| FR-074.4 | The system shall support valid tax IDs (e.g. TRN/VAT number) on B2B invoices. | Should |
| FR-074.5 | The system shall localize invoice currency + format. | Should |

**4.74.4 Acceptance criteria**
- AC-074.1.1 — Given a charge, then a correct invoice with line items + tax.
- AC-074.1.2 — Given a UAE B2C sale, then 5% VAT applied; given valid B2B reverse-charge, then handled correctly.
- AC-074.1.3 — Given an invoice, then it's immutable + retained.
- AC-074.1.4 — Given a tax ID, then validated + shown.

**4.74.5 Business rules.** BR-074.1 tax by region/type; BR-074.2 immutable records; BR-074.3 retention period; BR-074.4 tax-ID validation.

**4.74.6 Inputs.** charge, region, customer_type, tax_id?. **4.74.7 Outputs.** `{invoice_id, pdf_url, tax_amount}`. Errors: `422 INVALID_TAX_ID`.

**4.74.8 State.** Invoice: Generated → Finalized(immutable) → (Sent | Voided→CreditNote).

**4.74.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Invalid tax ID | `422`; treat as B2C |
| Region with no VAT | No tax line |
| Refund | Credit note, not edit |
| Currency mismatch | Correct per residency |
| Retroactive tax-rate change | Apply rate at transaction date |

**4.74.11 NFRs.** Invoice generation ≤5 s; 0 mutable finalized invoices; tax accuracy 100% on test matrix.
**4.74.12 Security.** SR-074.1 immutable store; SR-074.2 access-controlled financial docs.
**4.74.13 Compliance.** VAT/GST (UAE, KSA, SG, etc.) → FR-074.2; record retention → FR-074.3.
**4.74.14 Observability.** `invoices_total`, `tax_computation_error_total`, `invoice_immutability_violation_total` (alert any>0).

**4.74.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-074.1 | Invoice | charge | correct invoice + tax | FR-074.1, AC-074.1.1 | Integration |
| TC-074.2 | VAT/reverse-charge | UAE B2C / B2B | 5% / reverse-charge | FR-074.2, AC-074.1.2 | Integration |
| TC-074.3 | Immutable | edit finalized | blocked; retained | FR-074.3, AC-074.1.3 | Security |
| TC-074.4 | Tax ID | valid TRN | validated + shown | FR-074.4, AC-074.1.4 | Integration |
| TC-074.5 | Invalid tax ID | bad TRN | `422`; B2C | edge | Unit |
| TC-074.6 | Refund | credit note | not an edit | edge | Integration |

**4.74.16 Open questions.** Q-074.1 — tax engine (build vs. provider) for multi-region. (Finance, Open.)

---

### 4.75 Feature F-075 — Dunning, refunds & chargebacks
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §8.1 · **Wireframe:** —

**4.75.1 Description.** Handles failed-payment retries (dunning), refunds, and chargeback/dispute lifecycle — recovering revenue gracefully, refunding correctly, and keeping the ledger consistent under disputes.

**4.75.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-075.1 | The system shall retry failed payments on a schedule with user notification (dunning). | Must |
| FR-075.2 | The system shall process refunds (full/partial) with ledger + invoice/credit-note consistency. | Must |
| FR-075.3 | The system shall handle chargebacks/disputes (evidence submission, state transitions). | Must |
| FR-075.4 | The system shall revoke entitlements on terminal non-payment after grace. | Must |
| FR-075.5 | The system shall prevent refund abuse (limits, audit). | Should |

**4.75.4 Acceptance criteria**
- AC-075.1.1 — Given a failed charge, then dunning retries + notifies; access continues during grace.
- AC-075.1.2 — Given a refund, then ledger + credit note consistent; no negative drift.
- AC-075.1.3 — Given a chargeback, then dispute lifecycle tracked; entitlement adjusted.
- AC-075.1.4 — Given terminal non-payment, then access revoked after grace.
- AC-075.1.5 — Given repeated refund abuse, then flagged/limited.

**4.75.5 Business rules.** BR-075.1 dunning schedule; BR-075.2 ledger consistency on refund; BR-075.3 grace then revoke; BR-075.4 refund-abuse limits.

**4.75.6 Inputs.** failed charge / refund request / dispute webhook. **4.75.7 Outputs.** `{dunning_state | refund_id | dispute_state}`. Errors: `409 ALREADY_REFUNDED`, `422 REFUND_NOT_ALLOWED`.

**4.75.8 State.** Dunning: Failed → Retry(1..n) → (Recovered | Terminal→Revoked). Refund: Requested → Processed → LedgerUpdated. Dispute: Opened → EvidenceSubmitted → (Won | Lost).

**4.75.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Double refund | `409 ALREADY_REFUNDED` |
| Refund > charge | `422 REFUND_NOT_ALLOWED` |
| Dispute on already-refunded | Reconcile; no double credit |
| Dunning success on last retry | Recover; keep access |
| Refund-abuse pattern | Flag/limit |

**4.75.11 NFRs.** 0 ledger inconsistencies post-refund/dispute; dunning notifications timely.
**4.75.12 Security.** SR-075.1 refund authorization; SR-075.2 dispute evidence stored securely; SR-075.3 audit.
**4.75.13 Compliance.** Consumer refund rights; financial auditability.
**4.75.14 Observability.** `dunning_recovery_rate`, `refunds_total`, `chargebacks_total`, `ledger_inconsistency_total` (alert any>0).

**4.75.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-075.1 | Dunning | failed charge | retries + notify; grace access | FR-075.1, AC-075.1.1 | Integration |
| TC-075.2 | Refund | refund request | ledger + credit note consistent | FR-075.2, AC-075.1.2 | Integration |
| TC-075.3 | Chargeback | dispute webhook | lifecycle tracked | FR-075.3, AC-075.1.3 | Integration |
| TC-075.4 | Terminal non-pay | exhausted retries | revoke after grace | FR-075.4, AC-075.1.4 | Integration |
| TC-075.5 | Double refund | refund twice | `409` | edge | Unit |
| TC-075.6 | Refund abuse | repeated refunds | flagged/limited | FR-075.5, AC-075.1.5 | Integration |

**4.75.16 Open questions.** Q-075.1 — dunning retry cadence + grace length. (Finance, Open.)

---

### 4.76 Feature F-076 — Usage metering & quotas
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8.2 · **Wireframe:** W-303

**4.76.1 Description.** Accurately meters every billable/consumable action (generations, screenings, API calls), tracks per-account cost + quota, and feeds both the **spend cap (F-077)** and **billing (F-073)**. The measurement layer the economics depend on.

**4.76.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-076.1 | The system shall record a usage event per metered action with cost + account + timestamp. | Must |
| FR-076.2 | The system shall meter accurately (no under/over-counting) and idempotently (no double-count on retry). | Must |
| FR-076.3 | The system shall track quotas and expose remaining headroom. | Must |
| FR-076.4 | The system shall feed usage to the spend cap (F-077) and to billing (F-073). | Must |
| FR-076.5 | The system shall reconcile metered cost against actual provider cost. | Should |

**4.76.4 Acceptance criteria**
- AC-076.1.1 — Given a generation, then exactly one usage event with correct cost.
- AC-076.1.2 — Given a retry of the same op, then it's not double-counted.
- AC-076.1.3 — Given a quota, then remaining is accurate.
- AC-076.1.4 — Given usage, then the cap + billing see it.

**4.76.5 Business rules.** BR-076.1 one event per action (idempotent); BR-076.2 accurate cost; BR-076.3 quota tracking; BR-076.4 feed cap+billing.

**4.76.6 Inputs.** `account_id`, `action`, `cost`, `idempotency_key`. **4.76.7 Outputs.** `{usage_id, quota_remaining}`.

**4.76.8 State.** Usage event: Recorded → (Reconciled). Quota: Available → Consumed → (Reset).

**4.76.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Retry same op | Idempotent; no double count |
| Metered < actual cost | Reconcile; correct drift |
| Concurrent metering | Atomic; consistent totals |
| Metering outage | Buffer + replay; never lose events; fail-safe to cap |
| Quota reset boundary | Reset only on cycle |

**4.76.11 NFRs.** Metering accuracy ≥99.9%; 0 double-counts; event durability (no loss).
**4.76.12 Security.** SR-076.1 tamper-proof events; SR-076.2 account-scoped.
**4.76.13 Compliance.** Billing accuracy.
**4.76.14 Observability.** `usage_events_total`, `double_count_total` (alert any>0), `metering_drift`, `metering_lost_events_total` (alert any>0).

**4.76.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-076.1 | Meter once | one generation | one event, correct cost | FR-076.1/.2, AC-076.1.1 | Integration |
| TC-076.2 | Idempotent | retry | no double count | FR-076.2, AC-076.1.2 | Integration |
| TC-076.3 | Quota | consume | accurate remaining | FR-076.3, AC-076.1.3 | Integration |
| TC-076.4 | Feed cap+billing | usage | both see it | FR-076.4, AC-076.1.4 | Integration |
| TC-076.5 | Concurrency | parallel meter | consistent totals | edge | Concurrency |
| TC-076.6 | Outage | metering down | buffered/replayed; no loss | edge | Chaos |

**4.76.16 Open questions.** Q-076.1 — metering granularity (per-token vs per-call). (Eng, Open.)

---

### 4.78 Feature F-078 — Rate limiting & abuse prevention (shared infra)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8.3 · **Wireframe:** —

**4.78.1 Description.** Shared rate-limiting + abuse infrastructure both products use: per-IP/account/endpoint limits, burst control, bot detection, and graduated responses — protecting cost, fairness, and availability.

**4.78.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-078.1 | The system shall apply configurable rate limits per IP, account, and endpoint. | Must |
| FR-078.2 | The system shall return `429` with `Retry-After` when limits are exceeded. | Must |
| FR-078.3 | The system shall detect + throttle bot/abuse patterns (velocity, fingerprint). | Must |
| FR-078.4 | The system shall protect expensive endpoints (generation, screening) with stricter limits. | Must |
| FR-078.5 | The system shall fail safe (limit) rather than fail open under uncertainty. | Must |

**4.78.4 Acceptance criteria**
- AC-078.1.1 — Given over-limit requests, then `429` + `Retry-After`.
- AC-078.1.2 — Given a bot flood, then throttled/blocked.
- AC-078.1.3 — Given expensive endpoints, then stricter limits apply.
- AC-078.1.4 — Given the limiter being uncertain/unavailable, then fail safe (limit).

**4.78.5 Business rules.** BR-078.1 per-IP/account/endpoint limits; BR-078.2 stricter on costly endpoints; BR-078.3 fail-closed; BR-078.4 bot detection.

**4.78.6 Inputs.** request metadata. **4.78.7 Outputs.** allow/deny + `Retry-After`. Errors: `429 RATE_LIMITED`.

**4.78.8 State.** Limiter window: Counting → (UnderLimit→Allow | OverLimit→Deny) → Reset.

**4.78.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Distributed flood (many IPs) | Account/endpoint limits + anomaly detection |
| Shared NAT (many users one IP) | Account-level limits avoid false positives |
| Limiter datastore down | Fail safe (limit) |
| Legit burst | Burst allowance within reason |
| Scraper rotating IPs | Fingerprint + behavior detection |

**4.78.11 NFRs.** Limiter overhead ≤5 ms; fail-closed; high availability.
**4.78.12 Security.** SR-078.1 fail-closed; SR-078.2 bot/anomaly detection; SR-078.3 can't be bypassed client-side.
**4.78.13 Compliance.** Availability/abuse protection.
**4.78.14 Observability.** `rate_limited_total`, `bot_blocked_total`, `limiter_fail_open_total` (alert any>0).

**4.78.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-078.1 | Over limit | flood | `429` + Retry-After | FR-078.2, AC-078.1.1 | Integration |
| TC-078.2 | Bot flood | velocity attack | throttled/blocked | FR-078.3, AC-078.1.2 | Security |
| TC-078.3 | Costly endpoint | generation spam | stricter limit | FR-078.4, AC-078.1.3 | Integration |
| TC-078.4 | Fail safe | limiter down | fail closed | FR-078.5, AC-078.1.4 | Chaos |
| TC-078.5 | Shared NAT | many users 1 IP | account-level, no false block | edge | Integration |
| TC-078.6 | IP rotation | rotating scraper | fingerprint-detected | edge | Security |

**4.78.16 Open questions.** Q-078.1 — default limits per endpoint/tier. (Eng, Open.)

---

### 4.79 Feature F-079 — Admin / back-office console
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §9 · **Wireframe:** W-304

**4.79.1 Description.** Internal console for ops/support/compliance: look up accounts, assist users, manage suspensions/verification (F-092e), adjust caps (F-077), handle DSARs (F-082) — every action **least-privilege + audited**, trust-wall enforced even for staff.

**4.79.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-079.1 | The system shall let authorized staff search accounts + view permitted support info. | Must |
| FR-079.2 | The system shall enforce internal RBAC (support vs. compliance vs. admin). | Must |
| FR-079.3 | The system shall audit-log every admin action (who/what/when/why). | Must |
| FR-079.4 | The system shall enforce the trust wall even for staff (no casual access to candidate-private data; break-glass only, logged). | Must |
| FR-079.5 | The system shall support impersonation only with consent/break-glass + full audit. | Should |

**4.79.4 Acceptance criteria**
- AC-079.1.1 — Given a support agent, then they see support-permitted fields only.
- AC-079.1.2 — Given any admin action, then it's audit-logged.
- AC-079.1.3 — Given staff accessing candidate-private data, then break-glass + logged (not casual).
- AC-079.1.4 — Given impersonation, then consented/break-glass + audited.

**4.79.5 Business rules.** BR-079.1 internal RBAC; BR-079.2 audit all; BR-079.3 trust wall + break-glass; BR-079.4 impersonation governed.

**4.79.6 Inputs.** staff action. **4.79.7 Outputs.** permitted view/action result. Errors: `403 FORBIDDEN`.

**4.79.8 State.** Admin action: Requested → AuthzChecked → Executed → Logged.

**4.79.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Over-privilege action | `403` |
| Access candidate-private data | Break-glass + log |
| Impersonation without basis | Blocked |
| Bulk export by staff | Restricted + audited |
| Insider-threat pattern | Anomaly-flagged |

**4.79.11 NFRs.** 100% admin actions audited; least-privilege.
**4.79.12 Security.** SR-079.1 internal RBAC; SR-079.2 immutable admin audit; SR-079.3 break-glass; SR-079.4 insider-threat detection.
**4.79.13 Compliance.** Auditability; staff access governance.
**4.79.14 Observability.** `admin_actions_total`, `breakglass_total`, `staff_privacy_access_total`.

**4.79.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-079.1 | Support scope | agent view | permitted fields only | FR-079.2, AC-079.1.1 | Security |
| TC-079.2 | Audit | admin action | logged | FR-079.3, AC-079.1.2 | Integration |
| TC-079.3 | Break-glass | private data access | break-glass + log | FR-079.4, AC-079.1.3 | Security |
| TC-079.4 | Impersonation | impersonate | consented/break-glass + audit | FR-079.5, AC-079.1.4 | Security |
| TC-079.5 | Over-privilege | unauthorized action | `403` | FR-079.2 | Security |

**4.79.16 Open questions.** Q-079.1 — break-glass approval workflow. (Security, Open.)

---

### 4.80 Feature F-080 — Compliance & decision audit logging
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §9 · **Wireframe:** —

**4.80.1 Description.** The immutable, queryable record of every automated **hiring decision/recommendation** (screening, matching, rejection) with inputs, model version, rationale, consent, timestamp — the backbone of hiring-AI compliance (bias audits, adverse-action explainability, regulator requests). **Screening cannot launch without it.**

**4.80.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-080.1 | The system shall log every automated recommendation/decision with inputs, model version, rationale, consent ref, timestamp, region. | Must |
| FR-080.2 | The system shall make logs immutable + tamper-evident. | Must |
| FR-080.3 | The system shall support bias-audit queries (selection rates by group, aggregate). | Must |
| FR-080.4 | The system shall retain logs per regulatory retention; support regulator export. | Must |
| FR-080.5 | The system shall enforce the trust wall in logs (no leaking candidate-private data beyond decision context). | Must |
| FR-080.6 | The system shall guarantee no decision is served without a corresponding log entry. | Must |

**4.80.4 Acceptance criteria**
- AC-080.1.1 — Given a screening recommendation, then a complete immutable log entry exists.
- AC-080.1.2 — Given a tamper attempt, then detectable (tamper-evident).
- AC-080.1.3 — Given a bias audit, then selection-rate parity computable from logs.
- AC-080.1.4 — Given a decision with no log write, then the decision is **not served** (fail-closed).
- AC-080.1.5 — Given a regulator request, then logs exportable for the period/region.

**4.80.5 Business rules.** BR-080.1 log-or-don't-decide (fail closed); BR-080.2 immutable/tamper-evident; BR-080.3 retention; BR-080.4 trust wall.

**4.80.6 Inputs.** decision event {inputs, model_version, rationale, consent, region}. **4.80.7 Outputs.** `{log_id}`. Errors: `500 LOG_WRITE_FAILED` → decision halted.

**4.80.8 State.** Log entry: Written(append-only) → (Queried | Exported). Never updated/deleted within retention.

**4.80.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Log store down | Fail closed — don't serve the decision |
| Tamper attempt | Hash chain detects |
| Bias query small cohort | k-anonymity suppression |
| Retention expiry | Lawful deletion only after period |
| Trust-wall data in rationale | Minimized to decision-relevant only |

**4.80.11 NFRs.** 100% decisions logged (ME-6 = 0 missing); tamper-evident (hash chain); write before serve.
**4.80.12 Security.** SR-080.1 append-only + hash chain; SR-080.2 access-controlled; SR-080.3 trust wall; SR-080.4 fail-closed.
**4.80.13 Compliance.** NYC LL144-class bias audit, EU AI Act-ready, adverse-action → FR-080.1/.3/.4.
**4.80.14 Observability.** `decisions_logged_total`, `decision_without_log_total` (alert any>0 = P1), `log_tamper_detected_total` (alert any>0 = P1).

**4.80.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-080.1 | Complete log | recommendation | full immutable entry | FR-080.1, AC-080.1.1 | Integration |
| TC-080.2 | Tamper-evident | alter a log | detected | FR-080.2, AC-080.1.2 | Security |
| TC-080.3 | Bias audit | query logs | parity computable | FR-080.3, AC-080.1.3 | Integration |
| TC-080.4 | Fail closed | log write fails | decision not served | FR-080.6, AC-080.1.4 | Chaos |
| TC-080.5 | Regulator export | period/region | exportable | FR-080.4, AC-080.1.5 | Integration |
| TC-080.6 | Trust wall | inspect log | no excess private data | FR-080.5 | Security |

**4.80.16 Open questions.** Q-080.1 — retention period per region. (Compliance, Open.)

---

### 4.81 Feature F-081 — Data residency & tenant isolation
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §9 · **Wireframe:** —

**4.81.1 Description.** Stores/processes data in the correct region (MENA/APAC first) and isolates every tenant's data — supporting regional compliance and the screening region-gate (F-034), with the trust wall enforced across regions.

**4.81.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-081.1 | The system shall store/process data in the account's designated region. | Must |
| FR-081.2 | The system shall isolate tenant data (no cross-tenant access). | Must |
| FR-081.3 | The system shall prevent data from leaving its region except via lawful, logged transfer. | Must |
| FR-081.4 | The system shall enforce the trust wall across regions. | Must |

**4.81.4 Acceptance criteria**
- AC-081.1.1 — Given a MENA account, then data resides in the MENA region.
- AC-081.1.2 — Given tenant A, then tenant B can't access its data.
- AC-081.1.3 — Given a cross-region transfer, then lawful + logged or blocked.
- AC-081.1.4 — Given the trust wall, then it holds across regions.

**4.81.5 Business rules.** BR-081.1 region pinning; BR-081.2 tenant isolation; BR-081.3 no unlawful egress; BR-081.4 trust wall.

**4.81.6 Inputs.** account region, data ops. **4.81.7 Outputs.** region-correct storage. Errors: `403 REGION_VIOLATION`.

**4.81.8 State.** Data: Created(region-pinned) → Processed(in-region) → (LawfulTransfer→logged).

**4.81.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Cross-region query | Blocked or lawful+logged |
| Tenant boundary probe | Denied |
| Backup/replication | In-region or compliant |
| Region misconfig | Fail safe (block) |

**4.81.11 NFRs.** 0 unlawful cross-region egress; 0 cross-tenant leaks.
**4.81.12 Security.** SR-081.1 region partitioning; SR-081.2 tenant isolation; SR-081.3 egress controls; SR-081.4 trust wall.
**4.81.13 Compliance.** Regional data-protection (UAE PDPL, KSA PDPL, Singapore PDPA, etc.) → FR-081.1/.3.
**4.81.14 Observability.** `cross_region_egress_total` (alert any unlawful>0), `cross_tenant_denied_total`.

**4.81.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-081.1 | Residency | MENA account | data in MENA | FR-081.1, AC-081.1.1 | Integration |
| TC-081.2 | Tenant isolation | A→B | denied | FR-081.2, AC-081.1.2 | Security |
| TC-081.3 | Egress control | cross-region | lawful+logged or blocked | FR-081.3, AC-081.1.3 | Security |
| TC-081.4 | Trust wall cross-region | private data | held | FR-081.4, AC-081.1.4 | Security |
| TC-081.5 | Region misconfig | bad config | fail safe block | edge | Chaos |

**4.81.16 Open questions.** Q-081.1 — region list + DC partners at launch. (Eng/Compliance, Open.)

---

### 4.82 Feature F-082 — DSAR tooling (export / delete) — shared
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §9 · **Wireframe:** —

**4.82.1 Description.** Shared engine behind candidate F-093c and employer data rights: identity-verified export and verified deletion across all stores, with outcome-data anonymization (preserve the loop without personal data), within SLA.

**4.82.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-082.1 | The system shall export a user's data (verified identity) in a portable format within SLA. | Must |
| FR-082.2 | The system shall delete a user's data across all stores on verified request, with verified removal. | Must |
| FR-082.3 | The system shall anonymize (not delete) aggregate outcome data so the loop survives without PII. | Must |
| FR-082.4 | The system shall track DSAR SLAs and alert on breach. | Must |
| FR-082.5 | The system shall require identity verification to prevent unauthorized export/delete. | Must |

**4.82.4 Acceptance criteria**
- AC-082.1.1 — Given a verified export request, then complete export within SLA.
- AC-082.1.2 — Given a verified delete, then data removed from all stores (verified) + confirmation.
- AC-082.1.3 — Given deletion, then outcome data is anonymized, not orphaned with PII.
- AC-082.1.4 — Given an unverified requester, then export/delete denied.
- AC-082.1.5 — Given SLA risk, then alert.

**4.82.5 Business rules.** BR-082.1 identity verification; BR-082.2 verified cross-store deletion; BR-082.3 outcome anonymization; BR-082.4 SLA tracked.

**4.82.6 Inputs.** verified request. **4.82.7 Outputs.** `{export | deletion_confirmation}`. Errors: `403 IDENTITY_UNVERIFIED`, `423 SLA_AT_RISK`.

**4.82.8 State.** DSAR: Requested → IdentityVerified → (Exported | Deleted+Anonymized) → Confirmed.

**4.82.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Unverified requester | `403 IDENTITY_UNVERIFIED` |
| Data in backups | Deletion propagates per policy/retention |
| Outcome data | Anonymized, retained |
| Legal-hold data | Exempt with reason |
| SLA breach risk | Alert + escalate |

**4.82.11 NFRs.** Deletion verified across stores (0 residual PII); SLA met; export complete.
**4.82.12 Security.** SR-082.1 identity verification; SR-082.2 cross-store deletion proof; SR-082.3 anonymization irreversibility.
**4.82.13 Compliance.** GDPR/PDPL right-to-erasure & portability → FR-082.1/.2.
**4.82.14 Observability.** `dsar_requests_total`, `deletion_residual_pii_total` (alert any>0), `dsar_sla_breach_total`.

**4.82.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-082.1 | Export | verified request | complete export in SLA | FR-082.1, AC-082.1.1 | Integration |
| TC-082.2 | Delete verified | verified request | removed all stores + confirm | FR-082.2, AC-082.1.2 | Integration |
| TC-082.3 | Outcome anonymized | delete | anonymized, loop survives | FR-082.3, AC-082.1.3 | Integration |
| TC-082.4 | Unverified | no identity | `403` | FR-082.5, AC-082.1.4 | Security |
| TC-082.5 | SLA | near breach | alert | FR-082.4, AC-082.1.5 | Integration |
| TC-082.6 | Residual PII | post-delete scan | 0 residual | FR-082.2 | Security |

**4.82.16 Open questions.** Q-082.1 — backup deletion vs. retention reconciliation. (Eng/Compliance, Open.)

---

### 4.83 Feature F-083 — Observability, metrics & alerting
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §10 · **Wireframe:** W-305

**4.83.1 Description.** Metrics, logs, traces, and alerting across the platform — including the **product-principle alerts** (overspend, double-charge, trust-wall leak, missing decision log, auto-decision) that must page immediately. You can't run AI economics or compliance blind.

**4.83.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-083.1 | The system shall collect metrics/logs/traces with PII-safe redaction. | Must |
| FR-083.2 | The system shall alert on SLO breaches + principle-violation metrics (overspend, double-charge, trust-wall leak, missing log, auto-decision). | Must |
| FR-083.3 | The system shall provide dashboards for cost, latency, errors, fairness, integrity. | Must |
| FR-083.4 | The system shall not log secrets or candidate-private data. | Must |

**4.83.4 Acceptance criteria**
- AC-083.1.1 — Given a P1 principle-breach metric (>0), then immediate page.
- AC-083.1.2 — Given logs, then no secrets/PII.
- AC-083.1.3 — Given an SLO breach, then alert.
- AC-083.1.4 — Given dashboards, then cost/latency/errors/fairness visible.

**4.83.5 Business rules.** BR-083.1 PII-safe logging; BR-083.2 principle alerts page; BR-083.3 SLO alerting.

**4.83.6 Inputs.** telemetry. **4.83.7 Outputs.** dashboards, alerts.

**4.83.8 State.** Alert: Normal → Warning → Critical→Paged → Resolved.

**4.83.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Secret in a log line | Redacted/blocked |
| Alert storm | Dedupe/group |
| Telemetry pipeline down | Self-monitored; fallback alert |
| Principle metric >0 | Immediate page |

**4.83.11 NFRs.** Alert latency low; 0 secrets/PII in logs.
**4.83.12 Security.** SR-083.1 log redaction; SR-083.2 access-controlled dashboards.
**4.83.13 Compliance.** Privacy-by-design logging.
**4.83.14 Observability.** (self) `alerts_fired_total`, `secret_in_log_blocked_total`, `slo_breach_total`.

**4.83.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-083.1 | Principle page | double-charge metric >0 | immediate page | FR-083.2, AC-083.1.1 | Integration |
| TC-083.2 | Log redaction | secret in log | redacted | FR-083.4, AC-083.1.2 | Security |
| TC-083.3 | SLO alert | latency breach | alert | FR-083.2, AC-083.1.3 | Integration |
| TC-083.4 | Dashboards | open | metrics visible | FR-083.3, AC-083.1.4 | UI |
| TC-083.5 | PII in trace | candidate data | redacted | FR-083.4 | Security |

**4.83.16 Open questions.** Q-083.1 — on-call rotation for solo→small team. (Eng, Open.)

---

### 4.84 Feature F-084 — Incident response & status page
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §10 · **Wireframe:** W-305

**4.84.1 Description.** Declare/manage incidents (esp. trust-wall breach, overspend, data incident, outage), communicate via a public status page, and run blameless postmortems. A trust-wall breach is a **release-blocking, sev-1** class.

**4.84.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-084.1 | The system shall support incident declaration with severity + the special sev-1 classes (trust-wall breach, data incident, overspend). | Must |
| FR-084.2 | The system shall post status updates publicly during incidents. | Should |
| FR-084.3 | The system shall capture timeline + drive a blameless postmortem. | Must |
| FR-084.4 | The system shall trigger breach-notification workflows where legally required. | Must |

**4.84.4 Acceptance criteria**
- AC-084.1.1 — Given a trust-wall breach, then sev-1 + breach workflow.
- AC-084.1.2 — Given an incident, then status page updated.
- AC-084.1.3 — Given resolution, then postmortem produced.
- AC-084.1.4 — Given a reportable breach, then notification workflow triggered within legal window.

**4.84.5 Business rules.** BR-084.1 sev classes incl. trust-wall=sev-1; BR-084.2 status comms; BR-084.3 postmortem; BR-084.4 breach-notify.

**4.84.6 Inputs.** incident signal. **4.84.7 Outputs.** incident record, status updates, postmortem.

**4.84.8 State.** Incident: Declared → Mitigating → Resolved → Postmortem.

**4.84.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Trust-wall breach | Sev-1; halt affected flow; notify |
| Overspend event | Sev-1; cap review |
| Data breach | Legal notification workflow |
| False alarm | Downgrade + note |

**4.84.11 NFRs.** Breach-notification within legal window; postmortem for every sev-1/2.
**4.84.12 Security.** SR-084.1 incident data access-controlled; SR-084.2 breach evidence preserved.
**4.84.13 Compliance.** Breach notification (PDPL/GDPR) → FR-084.4.
**4.84.14 Observability.** `incidents_total`, `sev1_total`, `breach_notifications_total`, `mttr`.

**4.84.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-084.1 | Trust-wall breach | breach signal | sev-1 + breach workflow | FR-084.1, AC-084.1.1 | Integration |
| TC-084.2 | Status page | incident | public update | FR-084.2, AC-084.1.2 | Integration |
| TC-084.3 | Postmortem | resolution | postmortem | FR-084.3, AC-084.1.3 | Process |
| TC-084.4 | Breach notify | reportable breach | workflow in window | FR-084.4, AC-084.1.4 | Process |

**4.84.16 Open questions.** Q-084.1 — status-page provider. (Eng, Open.)

---

### 4.85 Feature F-085 — Feature flags & config
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.0 · **PRD:** §10 · **Wireframe:** —

**4.85.1 Description.** Flag-controlled rollout (region-gating screening F-034, % rollouts, kill-switches) + safe runtime config, audited. The mechanism behind MENA/APAC region-gating and rapid kill of a misbehaving feature.

**4.85.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-085.1 | The system shall gate features by flag (region, tier, %, per-account). | Must |
| FR-085.2 | The system shall provide instant kill-switches for risky features. | Must |
| FR-085.3 | The system shall evaluate flags server-side (no client trust). | Must |
| FR-085.4 | The system shall audit flag/config changes. | Must |

**4.85.4 Acceptance criteria**
- AC-085.1.1 — Given region-gate flag, then screening only in enabled regions.
- AC-085.1.2 — Given a kill-switch, then feature disabled instantly.
- AC-085.1.3 — Given a client flag override attempt, then server authoritative.
- AC-085.1.4 — Given a flag change, then audited.

**4.85.5 Business rules.** BR-085.1 server-side eval; BR-085.2 kill-switch; BR-085.3 audit.

**4.85.6 Inputs.** flag context. **4.85.7 Outputs.** `{enabled:bool}`.

**4.85.8 State.** Flag: Off → On(scope) → (Killed).

**4.85.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Flag service down | Fail safe to safe default (e.g. screening off) |
| Client override | Ignored |
| Stale cached flag | Bounded TTL; kill-switch propagates fast |

**4.85.11 NFRs.** Flag eval ≤10 ms; kill-switch propagation fast; fail-safe defaults.
**4.85.12 Security.** SR-085.1 server-side; SR-085.2 audited; SR-085.3 fail-safe.
**4.85.13 Compliance.** Region-gating enforcement → FR-085.1.
**4.85.14 Observability.** `flag_eval_total`, `killswitch_activations_total`, `flag_service_fail_safe_total`.

**4.85.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-085.1 | Region gate | flag off region | screening unavailable | FR-085.1, AC-085.1.1 | Integration |
| TC-085.2 | Kill-switch | activate | instant disable | FR-085.2, AC-085.1.2 | Integration |
| TC-085.3 | Client override | forge flag | server authoritative | FR-085.3, AC-085.1.3 | Security |
| TC-085.4 | Audit | flag change | logged | FR-085.4, AC-085.1.4 | Integration |
| TC-085.5 | Service down | flag svc fails | safe default | edge | Chaos |

**4.85.16 Open questions.** Q-085.1 — flag system (build vs. provider). (Eng, Open.)

---

### 4.86 Feature F-086 — Secrets, key management & encryption
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §9 · **Wireframe:** —

**4.86.1 Description.** Manages secrets/keys and enforces encryption in transit + at rest across the platform — protecting credentials, candidate data, payment tokens, and the audit log. Foundational security.

**4.86.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-086.1 | The system shall encrypt data at rest (AES-256) and in transit (TLS 1.2+). | Must |
| FR-086.2 | The system shall store secrets in a managed KMS/secret store (never in code/repos). | Must |
| FR-086.3 | The system shall support key rotation + revocation. | Must |
| FR-086.4 | The system shall scope secret access least-privilege + audited. | Must |

**4.86.4 Acceptance criteria**
- AC-086.1.1 — Given data at rest, then AES-256 encrypted.
- AC-086.1.2 — Given a secret, then it's in KMS, not in code/logs.
- AC-086.1.3 — Given key rotation, then performed without data loss.
- AC-086.1.4 — Given secret access, then least-privilege + audited.

**4.86.5 Business rules.** BR-086.1 encrypt at rest/in transit; BR-086.2 KMS-only secrets; BR-086.3 rotation; BR-086.4 least-privilege.

**4.86.6 Inputs.** key/secret ops. **4.86.7 Outputs.** managed keys/secrets.

**4.86.8 State.** Key: Active → (Rotated → OldDeprecated) → Revoked.

**4.86.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Secret in repo (scan) | Blocked/alerted |
| Key compromise | Rotate + revoke; re-encrypt |
| Plaintext at rest (scan) | Flagged P1 |
| Expired TLS cert | Auto-renew/alert |

**4.86.11 NFRs.** 0 plaintext sensitive data at rest; 0 secrets in code/logs.
**4.86.12 Security.** SR-086.1 AES-256/TLS; SR-086.2 KMS; SR-086.3 rotation/revocation; SR-086.4 secret-scanning in CI.
**4.86.13 Compliance.** Encryption baseline for data-protection regimes.
**4.86.14 Observability.** `secret_in_repo_blocked_total` (alert any>0), `plaintext_at_rest_total` (alert any>0), `key_rotations_total`.

**4.86.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-086.1 | Encryption at rest | inspect storage | AES-256 | FR-086.1, AC-086.1.1 | Security |
| TC-086.2 | Secret in KMS | inspect code/logs | none present; KMS holds | FR-086.2, AC-086.1.2 | Security |
| TC-086.3 | Rotation | rotate key | no data loss | FR-086.3, AC-086.1.3 | Integration |
| TC-086.4 | Least-privilege | secret access | scoped + audited | FR-086.4, AC-086.1.4 | Security |
| TC-086.5 | Secret-scan CI | commit a secret | blocked | SR-086.4 | Security |

**4.86.16 Open questions.** Q-086.1 — KMS provider per region. (Security, Open.)

---

### 4.92p Feature F-092p — Trust & safety (abuse, harmful content, fraud)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §9 · **Wireframe:** —

**4.92p.1 Description.** Platform-wide trust & safety: detect/handle abuse, harassment, harmful content, fraud, and scams across both products — protecting candidates from predatory "employers," employers from fraud, and the platform from misuse. Includes the **distress safe-routing** hook (candidate coach F-027) and harassment handling in messaging (F-043/F-101c).

**4.92p.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-092p.1 | The system shall detect + act on abuse/harassment/harmful content (filter, warn, suspend, report). | Must |
| FR-092p.2 | The system shall detect fraud/scams (fake jobs, fake recruiters, data harvesting) and protect users. | Must |
| FR-092p.3 | The system shall provide report/block flows for users, with human review. | Must |
| FR-092p.4 | The system shall safe-route signals of user distress to appropriate resources (no clinical claims), per candidate coach policy. | Must |
| FR-092p.5 | The system shall not over-block legitimate use (precision) and shall support appeals (F-094e / candidate appeal). | Must |
| FR-092p.6 | The system shall escalate child-safety / illegal-content signals appropriately. | Must |

**4.92p.4 Acceptance criteria**
- AC-092p.1.1 — Given harassment in messaging, then filtered + reportable + actionable.
- AC-092p.1.2 — Given a fake-job/scam pattern, then flagged + users protected.
- AC-092p.1.3 — Given a user report, then human review + outcome.
- AC-092p.1.4 — Given distress signals, then safe-routing to resources (no diagnosis).
- AC-092p.1.5 — Given a false-positive block, then appealable + reversible.
- AC-092p.1.6 — Given illegal/child-safety content, then escalated per policy.

**4.92p.5 Business rules.** BR-092p.1 harmful-content action; BR-092p.2 fraud detection; BR-092p.3 human review on reports; BR-092p.4 distress safe-routing; BR-092p.5 appeals; BR-092p.6 illegal-content escalation.

**4.92p.6 Inputs.** content, behavior signals, reports. **4.92p.7 Outputs.** `{action, case_id}`. Errors: `423 SUSPENDED`.

**4.92p.8 State.** Case: Detected/Reported → Reviewed → (Actioned | Dismissed) → (Appealed→Re-reviewed)?.

**4.92p.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Predatory employer | Detect + protect candidate + suspend |
| Mass harassment | Filter + block + report |
| Fake recruiter harvesting | Tie to F-092e; suspend |
| Distress in coach/messages | Safe-route; no clinical claim |
| False positive | Appeal + reverse |
| Illegal content | Escalate per legal policy |
| Coordinated abuse ring | Cross-account detection |

**4.92p.11 NFRs.** High precision (low false-positive); rapid action on sev abuse; 100% reports human-reviewed.
**4.92p.12 Security.** SR-092p.1 content moderation; SR-092p.2 fraud/anomaly detection; SR-092p.3 trust wall in T&S tooling; SR-092p.4 evidence preserved.
**4.92p.13 Compliance.** Online-safety obligations; child-safety escalation → FR-092p.6.
**4.92p.14 Observability.** `ts_cases_total`, `harassment_actioned_total`, `fraud_flagged_total`, `false_positive_appeal_overturn_rate`, `distress_safe_route_total`.

**4.92p.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-092p.1 | Harassment | abusive message | filtered + reportable + action | FR-092p.1, AC-092p.1.1 | Integration |
| TC-092p.2 | Scam/fake job | fraud pattern | flagged + users protected | FR-092p.2, AC-092p.1.2 | Integration |
| TC-092p.3 | Report flow | user report | human review + outcome | FR-092p.3, AC-092p.1.3 | Integration |
| TC-092p.4 | Distress routing | distress signal | safe-route, no diagnosis | FR-092p.4, AC-092p.1.4 | Safety |
| TC-092p.5 | False positive | legit flagged | appeal + reverse | FR-092p.5, AC-092p.1.5 | Integration |
| TC-092p.6 | Illegal content | child-safety signal | escalated | FR-092p.6, AC-092p.1.6 | Safety |
| TC-092p.7 | Abuse ring | coordinated accounts | cross-account detection | edge | Security |

**4.92p.16 Open questions.** Q-092p.1 — moderation tooling/provider + escalation partners by region. (PM/Legal, Open.)

---

## 11. Traceability matrix (master — platform/internal)
| F-ID | FR IDs | ACs | BRs | Tests | PRD | Wireframe | Priority |
|---|---|---|---|---|---|---|---|
| F-070 | FR-070.1–.5 | AC-070.1.1–.5 | BR-070.1–.4 | TC-070.1–.5 | §7 | W-301 | P0 |
| F-071 | FR-071.1–.5 | AC-071.1.1–.4 | BR-071.1–.3 | TC-071.1–.5 | §8.1 | W-302 | P0 |
| F-073 | FR-073.1–.8 | AC-073.1.1–.7 | BR-073.1–.6 | TC-073.1–.11 | §8.1 | W-302 | P0 |
| F-074 | FR-074.1–.5 | AC-074.1.1–.4 | BR-074.1–.4 | TC-074.1–.6 | §8.1 | W-302 | P1 |
| F-075 | FR-075.1–.5 | AC-075.1.1–.5 | BR-075.1–.4 | TC-075.1–.6 | §8.1 | — | P1 |
| F-076 | FR-076.1–.5 | AC-076.1.1–.4 | BR-076.1–.4 | TC-076.1–.6 | §8.2 | W-303 | P0 |
| F-077 | FR-077.1–.8 | AC-077.1.1–.7 | BR-077.1–.6 | TC-077.1–.10 | §8.2 | W-303 | P0 |
| F-078 | FR-078.1–.5 | AC-078.1.1–.4 | BR-078.1–.4 | TC-078.1–.6 | §8.3 | — | P0 |
| F-079 | FR-079.1–.5 | AC-079.1.1–.4 | BR-079.1–.4 | TC-079.1–.5 | §9 | W-304 | P1 |
| F-080 | FR-080.1–.6 | AC-080.1.1–.5 | BR-080.1–.4 | TC-080.1–.6 | §9 | — | P0 |
| F-081 | FR-081.1–.4 | AC-081.1.1–.4 | BR-081.1–.4 | TC-081.1–.5 | §9 | — | P0 |
| F-082 | FR-082.1–.5 | AC-082.1.1–.5 | BR-082.1–.4 | TC-082.1–.6 | §9 | — | P0 |
| F-083 | FR-083.1–.4 | AC-083.1.1–.4 | BR-083.1–.3 | TC-083.1–.5 | §10 | W-305 | P0 |
| F-084 | FR-084.1–.4 | AC-084.1.1–.4 | BR-084.1–.4 | TC-084.1–.4 | §10 | W-305 | P1 |
| F-085 | FR-085.1–.4 | AC-085.1.1–.4 | BR-085.1–.3 | TC-085.1–.5 | §10 | — | P1 |
| F-086 | FR-086.1–.4 | AC-086.1.1–.4 | BR-086.1–.4 | TC-086.1–.5 | §9 | — | P0 |
| F-092p | FR-092p.1–.6 | AC-092p.1.1–.6 | BR-092p.1–.6 | TC-092p.1–.7 | §9 | — | P0 |
