# Product Requirements Document — Trajct **Platform / Internal**

> One of three audience-scoped PRDs (Candidate · Employer · Platform/Internal), bound by a shared F-ID spine and the
> Shared Engine Spec (00). This PRD owns the foundation both external sides depend on, and the surfaces the internal
> Trajct teams operate. Simpaisa-PM-Framework structure, framework refs removed, Trajct domain.

---

## 1. Document control
| Field | Value |
|---|---|
| PRD title | PRD — Trajct Platform / Internal |
| PRD ID | PRD-2026-001-P |
| Version | 0.1.0 (Draft) |
| Status | Draft |
| Owner (Product) | Platform PM |
| Sponsor | Founder / CPO / CTO |
| Approver | CPO / HoP / CTO |
| Reviewers | Eng Lead, CISO delegate, Compliance PM, Finance, Ops Lead |
| Paired FRD | FRD-2026-001-P |
| Serves | Candidate PRD (01) + Employer PRD (02) + internal teams |
| Target launch | Spine (auth/billing/usage/trust) lands with candidate MVP |

### 1.1 Revision history
| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-06-03 | Rizwan Zafar | Split from master PRD; platform/internal-scoped |

### 1.2 Sign-off
| Reviewer | Role | Status |
|---|---|---|
| CPO/CTO | Final approver | Pending |
| Platform PM | Owner | Pending |
| Eng Lead | Feasibility | Pending |
| CISO delegate | Security | Pending |
| Compliance PM | Regulatory | Pending |
| Finance | Billing/margin | Pending |

---

## 2. Problem & opportunity
### 2.1 Problem statement
A two-sided AI product cannot exist without a foundation that, today, does not exist as a product surface — and that
foundation is what this PRD owns. The first and most urgent problem is safety: the moment a second paying customer
joins, every user's data must be completely isolated from every other's, and candidate-private data must be walled
off from employers absolutely. Today that isolation is enforced only in application code, with no real account, SSO,
or role layer beneath it — which means onboarding a second tenant risks leaking one customer's data into another's.
For a business whose entire value rests on trust, that is existential.

The second problem is money, and it is unusually sharp for an AI product. Inference is the dominant variable cost,
and Trajct deliberately gives away two free tiers (candidate diagnosis and employer JD) — meaning it gives away
compute. Without a way to meter every action, bill correctly across subscriptions and usage, and *halt* spend before
any account crosses into loss, success itself becomes dangerous: more usage simply means more money lost. Today there
is no metering and no halting cap, so margin is unprotected.

The third problem is operating blind. The platform runs AI generations whose cost and quality can drift silently; a
model change can quietly start hallucinating, or a runaway loop can quietly burn money, and no one would know until a
user complained. There is no observability, no cost or quality dashboard, no feature-flag control, and no incident
tooling — so the team would learn about problems from customers rather than catching them first.

The fourth problem is that the internal teams who run Trajct have no product to run it with. Operations,
finance, compliance, the PM, and support each have a real job — managing accounts, billing and margin, consent and
audit and data rights, deciding what to build from usage data, resolving tickets — and today every one of those jobs
means digging through raw database tables. Treating these internal teams as first-class users, with real consoles, is
the difference between a hobby project and an operable business; and building those hooks now (rather than bolting
them on later) is the difference between a clean architecture and a painful retrofit. Trajct's platform/internal
product exists to solve all four: let users in safely, get paid and stay profitable, operate with confidence, and run
the business legally and intelligently — and in doing so, to power the internal flywheel where usage and cost and
quality data continuously make the AI cheaper and better, accelerating both external products.

> **JTBD, in one line:** *When we run a two-sided AI product, we want to let users in safely, get paid and stay
> profitable, operate with full visibility, and run the business legally and intelligently, so the company scales
> without leaking data or money — today we can't, because the foundation (isolation, billing, usage caps,
> observability, and internal consoles) doesn't exist as a product surface.*

### 2.1.5 Coverage check — every platform feature maps to the problem
> The problem statement spans four jobs the platform must do: **let users in safely (access + isolation)**, **get
> paid & stay profitable (monetization + margin)**, **operate with confidence (reliability + observability)**, and
> **run the business & stay legal (operations + compliance + decisioning)**. Every feature traces to one.
| Cluster | Job | Features |
|---|---|---|
| P-A Access & isolation | Let users in safely | F-070, F-071, F-072, F-060(engine), F-092p |
| P-B Monetization & margin | Get paid, stay profitable | F-073, F-074, F-075, F-076, F-077 |
| P-C Reliability & observability | Operate with confidence | F-079, F-083, F-084, F-086 |
| P-D Operations & compliance | Run the business, stay legal | F-078, F-080, F-081, F-082, F-085 |
> Result: no orphan features — every platform feature serves a stated cluster.

### 2.2 Evidence
| Evidence | Source |
|---|---|
| AI inference is the dominant variable cost; free tiers give away compute | Cost model |
| Two-sided platform requires hard tenant isolation + a trust wall before user #2 | Security audit (jobHunt) |
| Internal teams (ops/finance/tech-ops/compliance/PM/support) have no console today | Gap analysis |
| Regulators will require consent, logging, bias audits, data rights | Compliance review |

### 2.3 Size of opportunity
| Dimension | Value | Basis |
|---|---|---|
| Enables | Every paying account on both sides | Foundation |
| Protects | Margin (spend caps), trust (isolation), legality (compliance) | Risk avoidance |
| Strategic | The internal flywheel: usage→insight→cheaper/better AI→faster external loops | Founder |

### 2.4 Why now
You cannot onboard a second paying tenant safely without isolation, billing, and the trust wall — this is the literal gate to monetization.

### 2.5 Cost of inaction
A data-leak or runaway-cost incident is existential for a trust-based two-sided business; without the internal loop, COGS rises with scale.

---

## 3. Target users & personas (internal)
### 3.1 Primary persona
| Field | Value |
|---|---|
| Name | Technical Operations |
| Context | Keeps the platform reliable, secure, observable, cost-controlled |
| Goals | Zero data incidents; margin-positive; fast incident recovery |
| Frustrations | No cost/quality visibility; manual ops |
| Tech fluency | High (●●●) |
| Success metric | Uptime, COGS-per-action, MTTR |

### 3.2 Secondary personas
- **Operations** → admin console, account management, impersonation, content/persona ops.
- **Finance** → billing, usage→revenue, per-account margin, invoices/tax.
- **Compliance / Trust** → consent records, decision logs, data export/delete, bias-audit exports.
- **Product Manager** → feature-usage/adoption/funnel/cohort/A-B analytics.
- **Customer Success / Support** → account/usage visibility, impersonation, health-score/churn-risk.

### 3.3 Anti-personas
- External users (they consume the platform via the Candidate/Employer products, not these consoles).

### 3.4 Journey — current
Manual, console-less; data in raw tables; no cost/quality visibility; isolation app-code-only.
### 3.5 Journey — future
Observe (usage/cost/quality) → decide (PM/ops) → tune/ship → operate → margin + quality improve → both external loops accelerate.

---

## 4. Strategic context
### 4.1 North Star
| North Star | How this PRD moves it |
|---|---|
| Successful outcomes per cycle at positive cost-per-outcome | Drives the *cost-per-outcome* half: cheaper/better AI, no waste |

### 4.2 OKR linkage
| Objective | KR | Contribution |
|---|---|---|
| Safely multi-tenant + billable | Isolation enforced; payments live; margin-positive | Auth, RLS, billing, usage cap |
| Operate with confidence | Observability + incident recovery | Tech-ops tooling, dashboards |

### 4.3 Competitive context
N/A externally — this is the foundation. Internally, the bar is "best-in-class AI-platform ops": cost governance,
eval gates, observability that competitors building single-sided tools don't need at this depth.

### 4.4 Strategic bets
- The internal loop is a real flywheel (more usage → more data → cheaper/better AI → faster external loops).
- Building admin/finance/compliance consoles *now* (not bolted on later) avoids a painful retrofit.

---

## 5. Goals, non-goals & success metrics
### 5.1 Goals
- **G1** Complete per-tenant isolation + the trust wall before tenant #2.
- **G2** Payments + usage metering + halting spend cap → every account margin-positive (free tiers governed).
- **G3** Observability + compliance tooling so incidents are caught early and decisions are auditable.
- **G4** Internal teams operate via real consoles, not raw data.

### 5.2 Non-goals
- No external-user features (those live in Candidate/Employer PRDs).
- No premature enterprise SSO complexity beyond what employer orgs need.

### 5.3 Success metrics
| ID | Metric | Type | @30d | @90d | Source |
|---|---|---|---|---|---|
| MP-1 | Cross-tenant data incidents | Guardrail | 0 | 0 | Security |
| MP-2 | Margin-negative paying accounts | Guardrail | 0 | 0 | Finance |
| MP-3 | COGS per action (trend) | Output | baseline | ↓ | Cost dashboard |
| MP-4 | MTTR for P1 incidents | Output | ≤1h | ≤1h | Incident tooling |
| MP-5 | Automated decisions without human confirm | Guardrail | 0 | 0 | Audit log |
| MP-6 | Spend-cap-hit handled gracefully (no silent failures) | Guardrail | 100% | 100% | Usage system |

### 5.4 Learning goals
- Which model-routing/caching strategy cuts COGS most without quality loss? Which free-tier limits hold margin without hurting activation?

---

## 6. Solution approach
### 6.1 Summary
A multi-tenant platform spine (auth/SSO/RBAC, billing/payments, usage metering + halting spend cap, complete tenant
isolation + the trust wall) plus internal operator surfaces (admin, finance, tech-ops, compliance, product analytics,
support). It serves both external products and embodies the internal flywheel: observe usage/cost/quality → decide →
tune → operate → the AI gets cheaper and better → both external loops accelerate.

### 6.2 Alternatives considered
| Alternative | Why not |
|---|---|
| App-code-only isolation | Insufficient; a leak is existential |
| Bolt on admin/finance later | Painful retrofit; data model must carry hooks now |
| Alert-only cost control | Doesn't protect margin; need a halting cap |

### 6.3 Conceptual model
The **internal flywheel**: Observe → Decide → Improve → Operate, turning every external interaction's
usage/cost/quality data into better, cheaper AI and fresher knowledge — accelerating the Candidate and Employer loops.

### 6.4 Design principles
Isolation is non-negotiable · every account profitable (cap halts) · internal users are first-class (real consoles) ·
compliance-ready by design (logs, consent, data rights) · observable and recoverable.

---

## 7. Feature catalog (platform/internal) — PRD ↔ FRD bridge
| F-ID | Feature | Rationale | Persona | Pri | Release | FRD ref |
|---|---|---|---|---|---|---|
| F-070 | Sign-up / sign-in (candidate + employer org) | Accounts | all | P0 | v1.0 | §4.70 |
| F-071 | SSO (Google/MS; SAML/OIDC for orgs) | Frictionless / enterprise login | Grace | P1 | v1.1 | §4.71 |
| F-072 | Org RBAC + seat management | Recruiter roles | Reem | P1 | v1.1 | §4.72 |
| F-073 | Payment processing (subs + usage + one-off) | Get paid | Finance | P0 | v1.0 | §4.73 |
| F-074 | Plans & entitlements (quotas, trials, gating) | Monetization mechanics | Finance | P0 | v1.0 | §4.74 |
| F-075 | Invoices/refunds/tax/dunning + finance reporting | Finance ops | Finance | P1 | v1.1 | §4.75 |
| F-076 | Usage metering (ledger + quota display) | Bill + show usage | Tech Ops | P0 | v1.0 | §4.76 |
| F-077 | Per-account halting spend cap | Margin protection | Tech Ops | P0 | v1.0 | §4.77 |
| F-078 | Admin console (ops) | Run the business | Operations | P1 | v1.1 | §4.78 |
| F-079 | Technical-ops tooling (cost, observability, flags, queue) | Reliable & cheap | Tech Ops | P1 | v1.1 | §4.79 |
| F-080 | Compliance/trust tooling (logs, consent, export/delete, audit) | Defensible & legal | Compliance | P0 | v1.0 | §4.80 |
| F-081 | Content/persona ops (corpus, quality, freshness queues) | Curate the brain | Operations | P1 | v1.1 | §4.81 |
| F-082 | Product analytics (usage/adoption/funnel/cohort/A-B) | Decide what to build | PM | P1 | v1.1 | §4.82 |
| F-083 | Support tooling (account view, impersonation, health/churn) | Resolve + retain | Support | P1 | v1.1 | §4.83 |
| F-084 | Notification & messaging infrastructure (email/SMS/push delivery) | Powers all alerts + comms on both sides | Tech Ops | P0 | v1.0 | §4.84 |
| F-085 | Help-center / knowledge-base system | Backs in-product help for all users | Operations | P1 | v1.1 | §4.85 |
| F-086 | Audit log / activity history (security + support) | Who-did-what across the platform | Tech Ops | P1 | v1.1 | §4.86 |
| F-092p | Trust & safety platform (fraud/abuse engine) | Cross-side abuse prevention | Trust & Safety | P0 | v1.0 | §4.92 |

**Shared dependencies (Engine 00):** F-057 AI layer (cost governance flows through it), F-060 trust wall (enforced here),
all engine features whose cost/quality this PRD governs and observes.

---

## 8. Feature details (business view) — flagship exemplars
### 8.1 F-077 — Per-account halting spend cap
**8.1.1 Problem** — AI inference is the dominant variable cost; two free tiers give away compute; a runaway loop or tenant can spend unbounded $.
**8.1.2 UX (operator + system)** — Pre-call budget gate keyed on account; raises BudgetExceeded *before* spend. Distinguishes "quota exhausted" (friendly upsell) from "cost ceiling hit" (rare; support path). Governs free tiers too.
**8.1.3 Stories** — As Tech Ops, I want every account's spend capped so no account ever goes margin-negative. As Finance, I want to see which accounts approach their ceiling.
**8.1.4 Success** — MP-2 zero margin-negative accounts; MP-6 graceful handling.
**8.1.5 Dependencies** — Engine F-057 AI layer; F-076 metering; F-074 entitlements.
**8.1.6 Out of scope** — External pricing display (Candidate/Employer PRDs).

### 8.2 F-080 — Compliance/trust tooling
**8.2.1 Problem** — Regulators and fairness require consent, decision logs, data rights, bias audits; none exist as tooling today.
**8.2.2 UX (compliance operator)** — Searchable decision logs, consent records, data export/delete request handling, bias-audit exports, region/residency controls.
**8.2.3 Stories** — As Compliance, I want every automated assessment's rationale + consent on record so we pass an audit. As a user (via Candidate/Employer), I want to export or delete my data.
**8.2.4 Success** — MP-1, MP-5 = 0; data-rights requests fulfilled within SLA.
**8.2.5 Dependencies** — Engine F-060 trust wall; isolation; screening (Employer F-034) emits logs/consent.
**8.2.6 Out of scope** — The candidate-facing export/delete UI (Candidate F-093c) — this is the back-office side.

> *(Remaining platform feature blocks follow this structure; the FRD expands each.)*

---

## 9. Prioritization & phasing
### 9.1 RICE (illustrative)
| Feature | Reach | Impact | Conf | Effort | Rank |
|---|---|---|---|---|---|
| F-070 auth | all | 3 | 0.95 | 2 | 1 |
| F-077 spend cap | all | 3 | 0.9 | 2 | 2 |
| F-073 payments | all | 3 | 0.9 | 3 | 3 |
| F-080 compliance | all | 3 | 0.85 | 3 | 4 |

### 9.2 Release phasing
| Release | Platform features |
|---|---|
| v1.0 (MVP spine) | F-070, F-073, F-074, F-076, F-077, F-080, F-092p |
| v1.1 | F-071, F-072, F-075, F-078, F-079, F-081, F-082, F-083 |
| vNext | enterprise SSO depth, advanced analytics, integrations support |

### 9.3 MVP cut-line rationale
The v1.0 spine is the non-negotiable foundation: accounts, payments, usage metering, the halting spend cap, the trust
wall + isolation, and compliance logging. Without these you cannot safely or profitably onboard a paying user. The
operator consoles (admin/finance/tech-ops dashboards) are V1 — needed before scale, not before the first user.

---

## 10. Commercial & pricing (platform view)
Not a revenue surface itself — it *enables* and *protects* revenue. Owns: the metering + entitlement engine behind
both external pricing models, and the margin guardrail (price floors above per-action COGS; halting cap).
| Dimension | Platform role |
|---|---|
| Revenue | Billing engine for candidate subs + employer usage |
| Cost | Owns COGS governance (routing, caching, caps) |
| Unit economics | Enforces per-account margin-positive |

---

## 11. Risks & mitigations (platform)
| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| RP-1 | Tenant isolation breach / trust-wall leak | L | H | Enforced isolation + RLS; trust wall in data layer; isolation tests; release-blocker |
| RP-2 | Runaway AI cost (free tiers) | M | H | Halting spend cap governs free tiers; cheaper models + caching |
| RP-3 | No observability → learn of issues from users | M | M | OTel/Sentry, dashboards, alerts, /ready probe |
| RP-4 | Compliance gap (consent/logs/data rights) | M | H | Compliance tooling (F-080) built in v1.0; audit hooks |
| RP-5 | Infra SPOF (Redis/DB) | M | H | Managed HA Redis (AOF), connection pooler |

---

## 12. Dependencies & cross-PRD asks
| Dependency | From/To | Note |
|---|---|---|
| Serves | Candidate (01) + Employer (02) | Auth, billing, usage, notifications infra, trust wall |
| Engine | Engine 00 | Governs/observes engine cost + quality |
| Payment provider | Stripe | Subscriptions + usage billing |
| Infra | Managed Redis, pooler, hosting | HA + scale |

---

## 13. Compliance, security & privacy (platform — the back office)
| Item | Answer |
|---|---|
| Isolation | Complete per-tenant; trust wall enforced in data + access |
| Consent | Captured + stored for screening/recording; retrievable |
| Decision logs | Every automated decision logged with inputs, model version, timestamp, rationale |
| Data rights | Export + delete request handling (back-office for Candidate F-093c) |
| No biometric storage | Transcripts/scores only |
| Region | Data residency + region-gating controls |

---

## 14. Operational readiness (platform)
| Item | Answer |
|---|---|
| On-call | Payments + AI-generation paths; incident tooling |
| Dashboards | Cost, quality, usage, fairness, queue health |
| Feature flags | Per-feature, per-region rollout control |
| Runbook | Ops Lead owns; incident response defined |

---

## 15. Launch plan (platform)
The v1.0 spine ships *with* the candidate MVP (it's the gate to charging anyone). Consoles roll out in v1.1.
Kill-switch criteria: isolation/trust-wall breach = immediate rollback; margin-negative runaway = halt affected path;
regulatory hold = region rollback.

---

## 16. Open questions
| # | Q | Owner | Status |
|---|---|---|---|
| 1 | Managed Redis / pooler vendor + HA topology | Tech Ops | Open |
| 2 | Free-tier limits that hold margin without hurting activation | PM + Finance | Open |
| 3 | Enterprise SSO scope for early employer orgs | Platform PM | Open |

---

## 17. Traceability (platform head)
| F-ID | Goal | Metric | PRD §8 | FRD §4 | Pri | Release |
|---|---|---|---|---|---|---|
| F-077 spend cap | G2 | MP-2,6 | §8.1 | §4.77 | P0 | v1.0 |
| F-080 compliance | G3 | MP-1,5 | §8.2 | §4.80 | P0 | v1.0 |
| F-070 auth | G1 | MP-1 | — | §4.70 | P0 | v1.0 |
| F-092p trust & safety | G1 | RP-? | — | §4.92 | P0 | v1.0 |

---

## 18. Appendices
**Related:** Shared Engine (00) · Candidate PRD (01) · Employer PRD (02) · BRD · Vision · Flywheel · Coverage Matrix.
**Glossary (platform-specific):** *Trust wall* = data-layer separation of candidate-private data from employers ·
*Spend cap* = pre-call halting budget gate per account · *Entitlement* = what a plan unlocks · *Internal flywheel* =
observe→decide→improve→operate loop that makes the AI cheaper + better over time.

---
*PRD-2026-001-P v0.1.0 — Platform/Internal. Serves Candidate (01) + Employer (02); governs Engine (00).*
