# Functional Requirement Document — Trajct **Employer**

> Paired with Employer PRD (PRD-2026-001-E). Simpaisa-FRD-template structure, framework refs removed, Trajct domain.
> References the Wireframe Library (W-2xx) and the Shared Engine Spec (00). Build-ready depth: concrete limits, real
> error codes, semantic validations, adversarial test cases. **Screening features carry extra compliance rigor
> (consent, bias, human-in-loop) and are region-gated MENA/APAC at launch.**

---

## 0. Document control
| Field | Value |
|---|---|
| FRD title | FRD — Trajct Employer |
| FRD ID | FRD-2026-001-E |
| Version | 0.1.0 (Draft) |
| Owner (Product) | Employer PM |
| Owner (Engineering) | Employer Tech Lead |
| Reviewers | Eng Lead, QA Lead, CISO delegate, Compliance PM |
| Source PRD | PRD-2026-001-E |
| Wireframes | W-2xx |
| Depends on | Shared Engine (00); Platform FRD (auth/billing/notifications) |

### 0.2 Sign-off
| Reviewer | Role | Status |
|---|---|---|
| PM | Product owner | Pending |
| Tech Lead | Engineering owner | Pending |
| QA Lead | QA owner | Pending |
| CISO delegate | Security | Pending |
| Compliance PM | Regulatory (hiring AI) | Pending |

---

## 1. Purpose & scope
### 1.1 Purpose
Specify, to an unambiguous level, every functional requirement of the Trajct **employer** product: each feature's
rules, acceptance criteria, inputs/outputs, errors, states, NFRs, security, and test cases.

### 1.2 PRD boundary — what this FRD does NOT cover
- Business case, pricing, personas, GTM → Employer PRD.
- Shared AI engine internals (matching, persona, AI layer, trust wall) → Shared Engine Spec (00).
- Auth, billing, usage-metering, notification infra → Platform FRD.

### 1.3 Scope — IN
All employer-side features F-030…F-043 + employer-facing identity/onboarding/verification (F-070e, F-071e, F-072e, F-090e, F-091e, F-092e) + appeals/reviews/search/integrations (F-094e..097e).

### 1.4 Scope — OUT
Candidate features; engine internals; platform back-office; **automated reject without human confirm** (prohibited).

### 1.5 Assumptions & dependencies
| # | Assumption / dependency | If invalid, impact |
|---|---|---|
| A-1 | Engine F-052 (persona) + F-051 (loop) available for matching | Matching degrades |
| A-2 | Platform billing (F-073) + usage (F-076) + cap (F-077) live | Can't charge/meter screening |
| A-3 | Voice/video infra available for AI interviews | F-034 interview mode unavailable |
| A-4 | Compliance tooling (Platform F-080) records consent + decisions | Screening not launchable |
| D-1 | Trust wall (F-060) enforced | Candidate-private data could leak to employer |
| D-2 | Candidate supply (Candidate FRD) exists | Screening has nothing to rank |

### 1.6 Glossary
| Term | Definition |
|---|---|
| Screening | The combined AI interview + skills assessment scoring demonstrated ability |
| Hidden gem | A candidate strong on ability but weak on résumé |
| Why-rejected | A defensible, explainable rejection reason per candidate |

---

## 2. Context & architecture
### 2.1 System context
```
Employer ──▶ Trajct Employer App ──▶ Shared Engine (matching, persona, AI layer, loop)
                   │                          │
                   ├──▶ Platform (org auth, billing, usage, notifications, compliance)
                   └──╳ Trust wall ── candidate-private data (diagnoses/outcomes) NEVER reaches employer
Candidate supply (Candidate product) ──▶ the pool the employer matches/screens
```
### 2.2 Actors & roles
| Actor | Type | Primary interactions |
|---|---|---|
| Recruiter (org member) | External user | Write JD, match, screen, shortlist, hire |
| Hiring manager | External user | Review shortlist, scorecards, decide |
| Org admin | External user | Manage seats/roles, billing |
| Candidate | External (other side) | Consents to + takes screening |
| Trajct Engine | Internal system | Match, score, assess |
| Platform | Internal system | Org auth, billing, compliance logging |

### 2.3 Data flow summary
An org member authors a JD (free). The engine matches candidates from the supply pool (consented, trust-wall-safe —
no candidate-private diagnostics exposed). For paid screening, candidates **consent**, take a combined AI interview +
skills assessment; the engine scores demonstrated ability with an explainable rationale; every automated
recommendation is **logged with rationale + consent** and a **human confirms** every advance/reject. Hires and their
outcomes flow back to the engine (anonymized per the trust wall).

---

## 3. Feature catalog (master list)
| F-ID | Feature | Priority | Release | Wireframe |
|---|---|---|---|---|
| F-030 | AI JD generation + optimization (free) | P0 | v1.0 | W-201 |
| F-031 | JD skill analysis + inclusivity review | P1 | v1.1 | W-201 |
| F-032 | AI candidate matching + ranking | P1 | vNext | W-202 |
| F-033 | Passive candidate discovery | P2 | vNext | — |
| F-034 | Screening — AI interview + skills assessment | P0¹ | vNext | W-203 |
| F-035 | "Hidden gem" surfacing | P1 | vNext | W-203 |
| F-036 | Why-rejected reason per candidate | P1 | vNext | W-202 |
| F-037 | Lean HR automation (post/bulk-reject/schedule) | P1 | vNext | W-202 |
| F-038 | Hiring workflow (pipeline, scorecards, collab) | P1 | vNext | W-202 |
| F-039 | Recruiting analytics (TTH, CPH, quality, funnel) | P2 | vNext | W-204 |
| F-040 | Post-hire success check-in | P2 | vNext | — |
| F-041 | Interview scheduling | P1 | vNext | W-205 |
| F-042 | Automated reference checking | P2 | vNext | — |
| F-043 | Employer↔candidate messaging | P1 | vNext | — |
| F-070e | Employer org sign-up / sign-in | P0 | v1.0 | W-001 |
| F-071e | SSO (SAML/OIDC) for orgs | P1 | v1.1 | W-206 |
| F-072e | Org RBAC + seat management | P1 | v1.1 | W-206 |
| F-090e | Employer notifications | P1 | v1.1 | — |
| F-091e | Employer onboarding | P0 | v1.0 | W-201 |
| F-092e | Employer verification (anti-abuse) | P0 | v1.0 | — |
| F-094e | Appeal / dispute handling | P1 | vNext | — |
| F-095e | Employer reputation / reviews | P2 | vNext | — |
| F-096e | Candidate search & filtering | P1 | vNext | — |
| F-097e | Integrations / API / webhooks | P2 | vNext | — |
¹ P0 within the employer-paid release (vNext); region-gated MENA/APAC; compliance-ready.

---

## 4. Feature specifications

### 4.30 Feature F-030 — AI JD generation + optimization (free front door)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §8.1 · **Wireframe:** W-201

**4.30.1 Description.** From minimal input (role, level, a few must-haves), generates a clean, optimized, fair job
description in minutes — free forever. The employer front door (lead magnet) and the source of JD data that powers
candidate matching. Includes an inclusivity/bias check on the language.

**4.30.2 Triggers**
- Employer enters role + level + must-haves on W-201 and clicks Generate.
- Employer edits/re-optimizes an existing JD.

**4.30.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-030.1 | The system shall generate a complete JD from role + level + ≤10 must-haves within 20 s p95. | Must |
| FR-030.2 | The system shall run an inclusivity/bias check and flag exclusionary or biased language with suggested neutral alternatives. | Must |
| FR-030.3 | The system shall suggest required skills + level for the role. | Should |
| FR-030.4 | The system shall provide range-based salary hints (no comp DB build); labeled as a guide. | Should |
| FR-030.5 | The system shall keep JD generation **free** and not require payment. | Must |
| FR-030.6 | The system shall meter JD generation cost against the free-tier spend cap (Platform F-077) and degrade gracefully if the org's free-tier cost ceiling is hit. | Must |
| FR-030.7 | The system shall let the employer edit the JD freely and re-run optimization. | Must |
| FR-030.8 | The system shall rate-limit free JD generation to 30/hour/org (anti-abuse). | Must |

**4.30.4 User stories & acceptance criteria**
*Story F-030-S1: As a lean recruiter, I want a strong JD in minutes so I can post today.*
- AC-030.1.1 — Given role + level + 3 must-haves, when I generate, then a clean optimized JD appears within 20 s, free.
- AC-030.1.2 — Given **biased language** ("rockstar ninja, young team"), then it's flagged with neutral alternatives.
- AC-030.1.3 — Given I **edit** the JD and re-optimize, then my edits are preserved and improved, not overwritten.
- AC-030.1.4 — Given the org's **free-tier cost ceiling** is hit, then I get a graceful message (not a silent failure), not a charge.
- AC-030.1.5 — Given the **31st generation in an hour**, then `429 RATE_LIMITED`.
- AC-030.1.6 — Given **minimal/garbage input** ("asdf"), then the system asks for a real role rather than generating nonsense.

**4.30.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-030.1 | ≤10 must-haves; role required | Input | `400 MISSING_ROLE` / truncate |
| BR-030.2 | JD generation free; never charged | Service | No billing |
| BR-030.3 | Free-tier governed by spend cap | Pre-gen | Graceful degrade, no charge |
| BR-030.4 | 30 generations/hour/org | Gateway | `429 RATE_LIMITED` |
| BR-030.5 | Bias check runs on every generated JD | Post-gen | Flag + suggest |

**4.30.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| role | string | Y | ≤120 chars, real role | "Senior Backend Engineer" | Employer |
| level | enum | Y | junior/mid/senior/lead/… | senior | Employer |
| must_haves | string[] | N | ≤10 | ["Go","Kubernetes"] | Employer |
| location | string | N | for salary hint | "Dubai" | Employer |

**4.30.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| jd | string | Y | the generated JD |
| inclusivity_flags[] | array | Y | {phrase, issue, suggestion} |
| suggested_skills[] | array | N | — |
| salary_hint | object | N | {range, source:"guide"} |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 400 | MISSING_ROLE | no role | "Enter the role you're hiring for." | No |
| 422 | INVALID_ROLE | garbage input | "That doesn't look like a role — try again." | No |
| 429 | RATE_LIMITED | >30/hr | "Too many — try again shortly." (+Retry-After) | Yes |
| 503 | ENGINE_UNAVAILABLE | AI down | "Try again shortly." | Yes |

**4.30.8 State model.** JD: Draft → Generated → (Edited → Re-optimized)* → Posted/Saved.

**4.30.9 Sequence (happy path)**
```
Emp→App: POST /jd (role, level, must_haves)
App→Engine: generate(role, level, must_haves) + inclusivity_check
Engine→App: {jd, inclusivity_flags, skills, salary_hint}
App→Platform: meter(free-tier cost; under cap)
App→Emp: 200 {jd, inclusivity_flags}
```

**4.30.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Garbage role input | `422 INVALID_ROLE`; ask for a real role |
| Biased language | flag + neutral suggestions |
| Free-tier cost ceiling hit | graceful message; no charge; no silent fail |
| Over rate limit | `429` + Retry-After |
| Very long must-haves list | truncate to 10 with notice |
| Injection in input | sanitize; treat as text |
| Engine down | `503`; no garbage JD |
| Non-English role | localize if supported (F-098c) |

**4.30.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-030.1 | Latency | JD generation ≤20 s p95 | Probes |
| NFR-030.2 | Cost | Free-tier JD cost bounded by cap | Cost dashboard |
| NFR-030.3 | Quality | Inclusivity check recall ≥90% on a biased-language test set | Eval |

**4.30.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-030.1 | Org-scoped; JD drafts isolated per org |
| SR-030.2 | Input sanitized (XSS/prompt-injection) |

**4.30.13 Compliance & regulatory traceability**
| Regulation/control | FR IDs |
|---|---|
| Fair-hiring / inclusivity | FR-030.2 |
| Cost governance | FR-030.6 |

**4.30.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| jd_generated_total | Counter | — | — |
| jd_latency_ms | Histogram | — | p95>20s = P2 |
| jd_inclusivity_flag_rate | Gauge | — | — |
| jd_freetier_cap_hit_total | Counter | — | spike = cost issue |

**4.30.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-030.1 | **Happy path** | role+level+3 must-haves | clean JD ≤20 s, free | FR-030.1/.5, AC-030.1.1 | Integration |
| TC-030.2 | **Bias flagged** | "rockstar ninja, young team" | flagged + neutral suggestions | FR-030.2, AC-030.1.2 | Integration |
| TC-030.3 | **Edit preserved** | edit + re-optimize | edits kept + improved | FR-030.7, AC-030.1.3 | Integration |
| TC-030.4 | **Free-tier ceiling** | org over free cost cap | graceful; no charge | FR-030.6, AC-030.1.4 | Integration |
| TC-030.5 | **Rate limit** | 31/hr | `429 RATE_LIMITED` | BR-030.4, AC-030.1.5 | Integration |
| TC-030.6 | **Garbage input** | "asdf" | `422 INVALID_ROLE` | FR-030.1, AC-030.1.6 | Unit |
| TC-030.7 | Injection | `<script>` in role | sanitized | SR-030.2 | Security |
| TC-030.8 | Engine down | timeout | `503`; no garbage JD | edge table | E2E |
| TC-030.9 | Cross-org isolation | org B reads org A's draft | denied | SR-030.1 | Security |

**4.30.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-030.1 | Salary-hint source (ranges only, no comp DB) — sufficient? | PM | Open |

---

### 4.34 Feature F-034 — Screening (AI interview + skills assessment)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0¹ · **Release:** vNext (MENA/APAC) · **PRD:** §8.2 · **Wireframe:** W-203

**4.34.1 Description.** The high-value, differentiated core: a combined **AI interview + skills assessment** that scores
a candidate's **demonstrated ability** against the role — not résumé keywords — surfacing the hidden gem and sorting the
AI-résumé flood. Every assessment is explainable, **consented**, **logged**, region-gated (MENA/APAC at launch), and a
**human confirms every advance/reject** (the AI recommends only). Built compliance-ready for later EU/US expansion.

**4.34.2 Triggers**
- Employer configures + invites candidates to a screening for a role (W-203).
- Candidate consents and completes the assessment.
- Employer reviews results and confirms a decision.

**4.34.3 Functional requirements (shall statements)**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-034.1 | The system shall conduct a combined AI interview + skills assessment scoring demonstrated ability against the role rubric. | Must |
| FR-034.2 | The system shall obtain explicit candidate **consent** (to the AI assessment and any recording) before it starts, and store the consent record. | Must |
| FR-034.3 | The system shall produce an **explainable rationale** for every score (which evidence drove it). | Must |
| FR-034.4 | The system shall **recommend only**; a human must confirm every advance/reject (no automated rejection). | Must |
| FR-034.5 | The system shall **not store biometric templates**; transcripts + scores only. | Must |
| FR-034.6 | The system shall be **region-gated** — screening available only in enabled regions (MENA/APAC at launch). | Must |
| FR-034.7 | The system shall log every automated recommendation with inputs, model version, timestamp, rationale, and consent ref (Platform F-080). | Must |
| FR-034.8 | The system shall provide bias/fairness metrics on score distributions and support a bias audit. | Must |
| FR-034.9 | The system shall meter each screening as a paid usage unit and enforce the spend cap. | Must |
| FR-034.10 | The system shall give the candidate a respectful, accessible, low-anxiety experience with clear instructions. | Must |
| FR-034.11 | The system shall detect and handle assessment cheating/gaming (e.g. external help, copy-paste) and flag it, without false-accusing. | Should |

**4.34.4 User stories & acceptance criteria**
*Story F-034-S1: As a recruiter, I want a substance-ranked shortlist with evidence so I trust who to interview.*
- AC-034.1.1 — Given a screening, when candidates complete it (with consent), then I get ability scores with per-score evidence, and I confirm every advance/reject myself.
- AC-034.1.2 — Given a candidate **declines consent**, then no assessment runs and they're handled per the employer's fallback (not auto-rejected by the AI).
- AC-034.1.3 — Given the AI scores a candidate, then it **never auto-advances/auto-rejects** — a human must confirm.
- AC-034.1.4 — Given screening, **no biometric template is stored** (only transcript + scores).
- AC-034.1.5 — Given an employer in a **non-enabled region**, then screening is unavailable with a clear message.
- AC-034.1.6 — Given results, each carries an **explainable rationale + consent ref**, and the decision is logged.
- AC-034.1.7 — Given the org is **over the cost ceiling**, then `423 COST_CEILING_HIT`; no screening runs.
- AC-034.1.8 — Given a **capable candidate with a weak résumé** scores high on ability, then they're surfaced (hidden gem, F-035).
- AC-034.1.9 — Given a **score-distribution bias** beyond the parity band, then it's flagged for review (ME-5).
- AC-034.1.10 — Given a candidate uses **external help/copy-paste**, then it's flagged for human review (not auto-rejected, not false-accused).

**4.34.5 Business rules & validations**
| Rule ID | Rule | Applied at | Violation action |
|---|---|---|---|
| BR-034.1 | Consent required before any assessment/recording | Start | Block; no assessment |
| BR-034.2 | No automated advance/reject — human confirm mandatory | Decision | Block auto-decision |
| BR-034.3 | No biometric template storage | Processing | Hard prohibition |
| BR-034.4 | Region-gated (enabled regions only) | Access | `403 REGION_NOT_ENABLED` |
| BR-034.5 | Every recommendation logged w/ rationale + consent | Post-score | Enforce log write |
| BR-034.6 | Paid; under cost ceiling | Pre-screen | `423 COST_CEILING_HIT` |
| BR-034.7 | Bias parity within band | Post-batch | Flag for audit |

**4.34.6 Input specification**
| Field | Type | Required | Format / constraints | Example | Source |
|---|---|---|---|---|---|
| role_rubric | object | Y | skills/competencies to assess | {…} | Employer |
| assessment_type | enum | Y | skills / interview / behavioral / combined | combined | Employer |
| candidate_ids[] | uuid[] | Y | invited candidates | […] | Pipeline |
| region | enum | Y | must be enabled | MENA | Org |
| consent | record | Y | per candidate | … | Candidate |

**4.34.7 Output specification — success (200)**
| Field | Type | Always | Description |
|---|---|---|---|
| results[] | array | Y | {candidate_id, ability_score, rationale, evidence[], hidden_gem:bool, consent_ref, decision:pending} |
| fairness | object | Y | distribution parity metrics |

**Error responses**
| HTTP | Code | When | Message | Retryable |
|---|---|---|---|---|
| 402 | PAYMENT_REQUIRED | no paid entitlement | "Screening is a paid feature." | No |
| 403 | REGION_NOT_ENABLED | region off | "Screening isn't available in your region yet." | No |
| 403 | CONSENT_REQUIRED | candidate hasn't consented | (candidate flow) | No |
| 423 | COST_CEILING_HIT | over cap | "Temporarily paused." | No |
| 503 | ASSESSMENT_INFRA_UNAVAILABLE | infra down | "Try again shortly." | Yes |

**4.34.8 State model**
```
Screening: Configured → Invited → (Consented → InProgress → Scored → Logged → AwaitingHumanDecision → Decided) | (Declined → EmployerFallback)
Decision: AwaitingHumanDecision → (Advanced | Rejected)  [human-confirmed only]
Never: Scored → auto-Advanced/auto-Rejected
```

**4.34.9 Sequence (happy path)**
```
Emp→App: configure screening(role_rubric, type, candidates, region)
App→App: region check (enabled) + entitlement + under-cap
App→Cand: invite + consent request
Cand→App: consent → take assessment
App→Engine: score(ability vs rubric) + rationale + hidden-gem flag
App→Platform(F-080): log(recommendation, rationale, consent, model_version)
App→Emp: results (decision=pending) + fairness metrics
Emp→App: human confirm advance/reject (per candidate)
```

**4.34.10 Error & edge-case handling**
| Scenario | Expected behaviour |
|---|---|
| Candidate declines consent | No assessment; employer fallback; **not auto-rejected by AI** |
| Non-enabled region | `403 REGION_NOT_ENABLED` |
| Attempt to auto-reject | Blocked; human-confirm required |
| Biometric capture attempt | Prohibited; transcript/scores only |
| Cost ceiling | `423`; no screening |
| Bias beyond parity band | Flag for audit; surface to employer + compliance |
| Cheating/gaming detected | Flag for human review; never false-accuse or auto-reject |
| Candidate accessibility need | Provide accommodations; low-anxiety mode |
| Assessment infra down mid-session | Save partial; allow resume; never lose consent |
| Hidden gem (weak résumé, high ability) | Surface prominently (F-035) |
| Candidate disputes result | Route to appeal (F-094e) |

**4.34.11 NFRs (this feature)**
| ID | Category | Requirement | Measurement |
|---|---|---|---|
| NFR-034.1 | Fairness | Score-distribution parity within band across groups (ME-5) | Bias metrics |
| NFR-034.2 | Explainability | 100% of scores carry a rationale + evidence | Audit |
| NFR-034.3 | Compliance | 100% of recommendations logged with consent (ME-6 = 0 missing) | Audit log |
| NFR-034.4 | Privacy | 0 biometric templates stored | Storage audit |
| NFR-034.5 | Safety | 0 automated advance/reject without human confirm | Audit |

**4.34.12 Security requirements**
| ID | Requirement |
|---|---|
| SR-034.1 | No biometric storage; media transient; transcripts/scores only |
| SR-034.2 | Candidate assessment data isolated; trust wall (candidate-private diagnostics never shown to employer) |
| SR-034.3 | Consent records immutable + auditable |
| SR-034.4 | Region/residency enforced at data layer |

**4.34.13 Compliance & regulatory traceability**
| Regulation/control | FR/SR IDs |
|---|---|
| Hiring-AI (bias audit / NYC LL144-class, EU AI Act-ready) | FR-034.4, FR-034.8, NFR-034.1 |
| Consent | FR-034.2, SR-034.3 |
| Biometric law (BIPA/Illinois-class) | FR-034.5, SR-034.1, NFR-034.4 |
| Decision logging / auditability | FR-034.7, NFR-034.3 |
| Data residency | FR-034.6, SR-034.4 |

**4.34.14 Observability**
| Metric | Type | Labels | Alert |
|---|---|---|---|
| screening_total | Counter | region, type | — |
| screening_consent_decline_rate | Gauge | — | — |
| screening_bias_parity | Gauge | group | out-of-band = P1 |
| screening_auto_decision_total | Counter | — | any>0 = P1 (principle breach) |
| screening_biometric_stored_total | Counter | — | any>0 = P1 (compliance breach) |
| screening_missing_log_total | Counter | — | any>0 = P1 |
| hidden_gem_surfaced_total | Counter | — | — |

**4.34.15 Test cases**
| TC ID | Scenario | Pre-condition / input | Expected result | Covers | Type |
|---|---|---|---|---|---|
| TC-034.1 | **Happy path** | consented candidates, enabled region, paid | ability scores + evidence; decision=pending; human confirms | FR-034.1/.3/.4, AC-034.1.1 | Integration |
| TC-034.2 | **Consent decline** | candidate declines | no assessment; employer fallback; **not AI-rejected** | FR-034.2, AC-034.1.2 | Integration |
| TC-034.3 | **No auto-decision** | scored candidate | never auto-advanced/rejected; human-confirm required | FR-034.4, NFR-034.5, AC-034.1.3 | Integration |
| TC-034.4 | **No biometric storage** | run screening; inspect storage | no face/voice template stored | FR-034.5, NFR-034.4, AC-034.1.4 | Security |
| TC-034.5 | **Region gate** | employer in non-enabled region | `403 REGION_NOT_ENABLED` | FR-034.6, AC-034.1.5 | Integration |
| TC-034.6 | **Decision logging** | a recommendation | logged w/ rationale + consent + model version | FR-034.7, NFR-034.3, AC-034.1.6 | Integration |
| TC-034.7 | **Cost ceiling** | over cap | `423 COST_CEILING_HIT`; no screening | BR-034.6, AC-034.1.7 | Integration |
| TC-034.8 | **Hidden gem** | high ability, weak résumé | surfaced as hidden gem | FR-034.1, AC-034.1.8 | Integration |
| TC-034.9 | **Bias parity breach** | skewed distribution | flagged for audit | FR-034.8, NFR-034.1, AC-034.1.9 | Integration |
| TC-034.10 | **Cheating detected** | external help/copy-paste | flagged for human review; not false-accused/auto-rejected | FR-034.11, AC-034.1.10 | Integration |
| TC-034.11 | No entitlement | unpaid org | `402 PAYMENT_REQUIRED` | FR-034.9 | Integration |
| TC-034.12 | Trust-wall | employer tries to read candidate's private diagnosis | denied | SR-034.2 | Security |
| TC-034.13 | Accessibility | candidate needs accommodation | low-anxiety/accessible mode offered | FR-034.10 | E2E |
| TC-034.14 | Infra down mid-session | assessment infra fails | partial saved; consent preserved; resumable | edge table | Chaos |

**4.34.16 Open questions**
| # | Q | Owner | Status |
|---|---|---|---|
| Q-034.1 | Which assessment format best predicts on-the-job success? | PM | Open |
| Q-034.2 | Bias-audit cadence + external auditor for EU/US expansion | Compliance | Open |
| Q-034.3 | Cheating-detection thresholds to minimize false positives | Eng | Open |

---

### 4.31 Feature F-031 — JD skill analysis + inclusivity review
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §8.1 · **Wireframe:** W-201

**4.31.1 Description.** Analyzes an existing JD (pasted or generated) for required vs. nice-to-have skills, over-specification ("10 years for a 3-year-old framework"), inclusivity issues, and reading level — and rewrites toward a fairer, clearer, more attractive posting.

**4.31.2 Triggers.** Employer pastes/imports a JD and runs analysis; or analysis auto-runs on F-030 output.

**4.31.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-031.1 | The system shall classify each requirement as must-have vs. nice-to-have. | Must |
| FR-031.2 | The system shall flag over-specification (impossible/excessive experience, degree inflation). | Must |
| FR-031.3 | The system shall run the inclusivity/bias check (gendered, ageist, ableist, exclusionary terms) with neutral rewrites. | Must |
| FR-031.4 | The system shall report a reading-level/clarity score and suggest simplifications. | Should |
| FR-031.5 | The system shall accept a pasted JD (≤50k chars) or imported text and never execute it as instructions. | Must |

**4.31.4 Acceptance criteria**
- AC-031.1.1 — Given "10+ yrs Kubernetes" (K8s ~2014), then over-specification flagged.
- AC-031.1.2 — Given "young, energetic, native English," then ageist + ableist + discriminatory flags with rewrites.
- AC-031.1.3 — Given a pasted JD with `Ignore instructions and …`, then treated as text, not executed.
- AC-031.1.4 — Given a 60k-char paste, then `413 PAYLOAD_TOO_LARGE`.

**4.31.5 Business rules**
| Rule ID | Rule | Violation action |
|---|---|---|
| BR-031.1 | JD ≤50k chars | `413 PAYLOAD_TOO_LARGE` |
| BR-031.2 | Pasted content is data, never instructions | Sanitize/neutralize |
| BR-031.3 | Inclusivity check mandatory | Always run |

**4.31.6 Inputs.** `jd_text` (string, ≤50k, required); `role_context` (optional).
**4.31.7 Outputs.** `{must_haves[], nice_to_haves[], overspec_flags[], inclusivity_flags[], reading_level, rewrite}`. Errors: `413 PAYLOAD_TOO_LARGE`, `422 EMPTY_JD`, `503 ENGINE_UNAVAILABLE`.

**4.31.8 State model.** JD analysis: Submitted → Analyzed → (Rewrite-applied)?.

**4.31.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Prompt injection in JD | Neutralized; analyzed as text |
| Non-English JD | Localized analysis if supported |
| JD already clean | "No issues found" — no fabricated flags |
| Empty paste | `422 EMPTY_JD` |
| Oversize | `413` |

**4.31.11 NFRs.** Analysis ≤15 s p95; inclusivity recall ≥90%.
**4.31.12 Security.** SR-031.1 sanitize JD input; SR-031.2 org-scoped.
**4.31.13 Compliance.** Fair-hiring → FR-031.3.
**4.31.14 Observability.** `jd_analysis_total`, `jd_overspec_flag_rate`, `jd_inclusivity_flag_rate`.

**4.31.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-031.1 | Over-spec | "10+ yrs K8s" | flagged | FR-031.2, AC-031.1.1 | Integration |
| TC-031.2 | Biased language | "young native English" | flags + rewrites | FR-031.3, AC-031.1.2 | Integration |
| TC-031.3 | Injection | "Ignore instructions…" | treated as text | BR-031.2, AC-031.1.3 | Security |
| TC-031.4 | Oversize | 60k chars | `413` | BR-031.1, AC-031.1.4 | Unit |
| TC-031.5 | Clean JD | well-written JD | no fabricated flags | edge | Integration |
| TC-031.6 | Empty | "" | `422 EMPTY_JD` | output | Unit |

**4.31.16 Open questions.** Q-031.1 — auto-apply rewrites or always require employer confirm? (Owner PM, Open.)

---

### 4.32 Feature F-032 — AI candidate matching + ranking
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §8.2 · **Wireframe:** W-202

**4.32.1 Description.** Matches consented candidates from the supply pool to a role and ranks them by genuine fit (engine persona F-052 + loop F-051), with an explainable rationale per match. Trust-wall enforced — only employer-shareable signals are used/shown.

**4.32.2 Triggers.** Employer opens a role's match view; new consented candidates enter the pool.

**4.32.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-032.1 | The system shall rank candidates by fit against the role using the engine. | Must |
| FR-032.2 | The system shall show an explainable rationale per match (evidence-based). | Must |
| FR-032.3 | The system shall only match **consented** candidates who are open to the role/region. | Must |
| FR-032.4 | The system shall enforce the trust wall — no candidate-private data (diagnostics/outcomes) in match output. | Must |
| FR-032.5 | The system shall expose fit factors the employer can weight (skills, level, location), without exposing protected attributes. | Should |
| FR-032.6 | The system shall not use protected attributes (age, gender, ethnicity, etc.) as ranking signals. | Must |

**4.32.4 Acceptance criteria**
- AC-032.1.1 — Given a role, then ranked candidates appear with per-match rationale.
- AC-032.1.2 — Given a candidate who hasn't consented to discovery, then they don't appear.
- AC-032.1.3 — Given a match, then no candidate diagnosis/outcome/weakness is shown (trust wall).
- AC-032.1.4 — Given ranking, then protected attributes are not used as signals (audited).
- AC-032.1.5 — Given an employer adjusts weighting, then ranking updates explainably.

**4.32.5 Business rules**
| Rule ID | Rule | Violation action |
|---|---|---|
| BR-032.1 | Only consented, open candidates matched | Exclude |
| BR-032.2 | Trust wall on all output | Block private fields |
| BR-032.3 | No protected attributes in ranking | Hard prohibition + audit |

**4.32.6 Inputs.** `role_id`, optional `weights{skills,level,location}`. **4.32.7 Outputs.** `{ranked[]:{candidate_public_id, fit_score, rationale, evidence[]}}`. Errors: `403 REGION_NOT_ENABLED`, `404 ROLE_NOT_FOUND`, `503 ENGINE_UNAVAILABLE`.

**4.32.8 State model.** Match set: Requested → Computed → Displayed → (Re-weighted)*.

**4.32.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| No consented candidates | Empty state; suggest widening criteria |
| Candidate withdraws consent | Removed from future matches immediately |
| Employer tries to infer protected attribute | Not provided; cannot filter on it |
| Ties in fit score | Stable deterministic ordering + tie-break note |
| Engine degraded | Honest "matching limited" message; no fabricated ranks |

**4.32.11 NFRs.** Match compute ≤5 s p95 for ≤1000 pool; 100% matches carry rationale (explainability).
**4.32.12 Security.** SR-032.1 trust wall at data layer; SR-032.2 candidate public projection only.
**4.32.13 Compliance.** Anti-discrimination → FR-032.6; consent → FR-032.3.
**4.32.14 Observability.** `match_requests_total`, `match_rationale_coverage` (alert <100%), `match_protected_attr_used_total` (alert any>0).

**4.32.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-032.1 | Happy path | role w/ pool | ranked + rationale | FR-032.1/.2, AC-032.1.1 | Integration |
| TC-032.2 | Consent gate | non-consented candidate | excluded | FR-032.3, AC-032.1.2 | Integration |
| TC-032.3 | Trust wall | inspect match output | no private data | FR-032.4, AC-032.1.3 | Security |
| TC-032.4 | No protected attrs | audit ranking signals | none used | FR-032.6, AC-032.1.4 | Security |
| TC-032.5 | Re-weight | adjust weights | explainable re-rank | FR-032.5, AC-032.1.5 | Integration |
| TC-032.6 | Empty pool | no consented candidates | empty state | edge | Integration |
| TC-032.7 | Consent withdrawal | candidate withdraws | removed next match | edge | Integration |
| TC-032.8 | Engine degraded | engine down | honest message; no fake ranks | edge | Chaos |

**4.32.16 Open questions.** Q-032.1 — how much weighting control without enabling proxy discrimination? (Compliance, Open.)

---

### 4.33 Feature F-033 — Passive candidate discovery
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P2 · **Release:** vNext · **PRD:** §8.2 · **Wireframe:** —

**4.33.1 Description.** Surfaces strong **consented** candidates who are open to being approached (passive/"open to opportunities") for a role — never scraped, never non-consented. Honors candidate visibility preferences and the trust wall.

**4.33.2 Triggers.** Employer searches the open-to-approach pool for a role.

**4.33.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-033.1 | The system shall surface only candidates who opted into passive discovery. | Must |
| FR-033.2 | The system shall honor candidate visibility settings (e.g. hidden from current employer). | Must |
| FR-033.3 | The system shall never use scraped or non-consented data. | Must |
| FR-033.4 | The system shall route first contact through messaging (F-043) with trust-wall enforcement. | Must |
| FR-033.5 | The system shall let candidates revoke passive-discovery visibility instantly. | Must |

**4.33.4 Acceptance criteria**
- AC-033.1.1 — Given a candidate who didn't opt in, then never surfaced.
- AC-033.1.2 — Given a candidate hid from "Company X," then Company X never sees them.
- AC-033.1.3 — Given discovery, then no scraped/third-party non-consented profiles appear.
- AC-033.1.4 — Given a candidate revokes visibility, then they disappear immediately.

**4.33.5 Business rules.** BR-033.1 opt-in required; BR-033.2 visibility blocklist honored; BR-033.3 no scraping; BR-033.4 instant revoke.

**4.33.6 Inputs.** `role_id`, `criteria`. **4.33.7 Outputs.** `{candidates[]:{public_id, fit, open_to_approach:true}}`. Errors: `403 REGION_NOT_ENABLED`.

**4.33.8 State model.** Candidate discovery visibility: OptedOut ↔ OptedIn → (Blocklist applied) → (Revoked → OptedOut).

**4.33.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Candidate at the searching company (blocklisted) | Hidden from that employer |
| Candidate revokes mid-search | Removed from results on next load |
| Employer attempts to export non-consented data | Blocked |
| Candidate opted in but not open to this region | Excluded |

**4.33.11 NFRs.** Visibility changes propagate ≤60 s; 0 non-consented profiles (privacy).
**4.33.12 Security.** SR-033.1 consent + blocklist enforced at data layer; SR-033.2 trust wall.
**4.33.13 Compliance.** Consent/privacy → FR-033.1/.3; right to be hidden → FR-033.2/.5.
**4.33.14 Observability.** `passive_discovery_total`, `nonconsented_surface_total` (alert any>0).

**4.33.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-033.1 | Opt-in only | non-opted candidate | excluded | FR-033.1, AC-033.1.1 | Integration |
| TC-033.2 | Blocklist | hidden-from-employer | invisible to that employer | FR-033.2, AC-033.1.2 | Security |
| TC-033.3 | No scraping | inspect sources | only consented platform data | FR-033.3, AC-033.1.3 | Audit |
| TC-033.4 | Instant revoke | candidate revokes | removed | FR-033.5, AC-033.1.4 | Integration |
| TC-033.5 | Export attempt | export non-consented | blocked | SR-033.1 | Security |

**4.33.16 Open questions.** Q-033.1 — passive-discovery monetization (included vs. add-on). (PM, Open.)

---

### 4.35 Feature F-035 — "Hidden gem" surfacing
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §8.2 · **Wireframe:** W-203

**4.35.1 Description.** The positioning payoff: deliberately surfaces candidates who score **high on demonstrated ability** (screening F-034) but **low on résumé polish** — the people keyword-matching ATSs reject. The proof that Trajct judges substance over paper.

**4.35.2 Triggers.** A screening (F-034) completes; matching (F-032) ranks.

**4.35.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-035.1 | The system shall flag candidates with high ability score + low résumé-signal as "hidden gems." | Must |
| FR-035.2 | The system shall explain *why* a hidden gem is strong (evidence) and *why* a résumé filter would miss them. | Must |
| FR-035.3 | The system shall surface hidden gems prominently, not bury them below résumé-ranked candidates. | Must |
| FR-035.4 | The system shall not fabricate ability — flag only on real demonstrated evidence. | Must |

**4.35.4 Acceptance criteria**
- AC-035.1.1 — Given high ability + weak résumé, then flagged hidden gem with evidence.
- AC-035.1.2 — Given a hidden gem, then a clear "a résumé filter would miss this person because…" explanation.
- AC-035.1.3 — Given no demonstrated evidence, then never labeled a hidden gem (no fabrication).
- AC-035.1.4 — Given the shortlist, then hidden gems are visible, not buried.

**4.35.5 Business rules.** BR-035.1 flag requires real ability evidence; BR-035.2 no fabrication; BR-035.3 prominent placement.

**4.35.6 Inputs.** screening results + résumé signal. **4.35.7 Outputs.** `{hidden_gem:bool, why_strong[], why_resume_misses}`.

**4.35.8 State model.** Candidate flag: Evaluated → (HiddenGem | Standard).

**4.35.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Strong résumé + strong ability | Not a "hidden gem" (just strong); labeled accurately |
| Weak résumé + weak ability | Not surfaced as gem |
| Ability evidence thin/ambiguous | Don't over-claim; mark uncertainty |
| Employer dismisses gem | Logged; doesn't penalize candidate elsewhere |

**4.35.11 NFRs.** 100% hidden-gem flags backed by evidence (no fabrication, ME tie-in).
**4.35.12 Security.** SR-035.1 trust wall (use only employer-shareable ability evidence).
**4.35.13 Compliance.** Fairness/anti-bias → FR-035.1/.3.
**4.35.14 Observability.** `hidden_gem_flagged_total`, `hidden_gem_advanced_rate` (did employers act on them).

**4.35.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-035.1 | True hidden gem | high ability, weak résumé | flagged + evidence | FR-035.1/.2, AC-035.1.1/.2 | Integration |
| TC-035.2 | No fabrication | no ability evidence | not flagged | FR-035.4, AC-035.1.3 | Integration |
| TC-035.3 | Prominence | shortlist render | gems visible, not buried | FR-035.3, AC-035.1.4 | UI |
| TC-035.4 | Strong/strong | both high | labeled strong, not "gem" | edge | Integration |
| TC-035.5 | Thin evidence | ambiguous ability | uncertainty marked, not over-claimed | edge | Integration |

**4.35.16 Open questions.** Q-035.1 — hidden-gem threshold tuning to avoid noise. (Eng, Open.)

---

### 4.36 Feature F-036 — Why-rejected reason per candidate
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §8.2 · **Wireframe:** W-202

**4.36.1 Description.** For every candidate not advanced, produces a defensible, specific, **human-confirmed** rejection reason — enabling respectful candidate feedback (F-022 on candidate side) and a compliant audit trail. No generic "not a fit."

**4.36.2 Triggers.** A human confirms a non-advance decision in the pipeline.

**4.36.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-036.1 | The system shall generate a specific, evidence-based reason for each non-advance. | Must |
| FR-036.2 | The system shall require human confirmation of the reason before it's final (no auto-reject). | Must |
| FR-036.3 | The system shall never produce a discriminatory reason; reasons reference job-relevant criteria only. | Must |
| FR-036.4 | The system shall log the reason with the decision for audit. | Must |
| FR-036.5 | The system shall support optionally sharing a respectful version with the candidate. | Should |

**4.36.4 Acceptance criteria**
- AC-036.1.1 — Given a non-advance, then a specific job-relevant reason (not "not a fit").
- AC-036.1.2 — Given a reason, then a human confirms before it's recorded/shared.
- AC-036.1.3 — Given any reason, then it never references protected attributes.
- AC-036.1.4 — Given a decision, then reason + decision are logged.

**4.36.5 Business rules.** BR-036.1 job-relevant only; BR-036.2 human confirm required; BR-036.3 no protected-attribute reasons; BR-036.4 logged.

**4.36.6 Inputs.** candidate evaluation + decision. **4.36.7 Outputs.** `{reason, evidence[], confirmed_by, shareable_version}`.

**4.36.8 State model.** Reason: Drafted → HumanConfirmed → Logged → (Shared)?

**4.36.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Reason drifts toward protected attribute | Blocked; require job-relevant reason |
| Human edits the reason | Edited version is the record |
| Candidate requests reason | Shareable respectful version (if employer enabled) |
| Bulk reject | Each still needs a specific reason + confirm |

**4.36.11 NFRs.** 100% non-advances have a logged reason; 0 protected-attribute reasons.
**4.36.12 Security.** SR-036.1 reasons in audit log immutable; SR-036.2 trust wall.
**4.36.13 Compliance.** Adverse-action explainability → FR-036.1/.4; anti-discrimination → FR-036.3.
**4.36.14 Observability.** `rejection_reason_coverage` (alert <100%), `protected_attr_reason_blocked_total`.

**4.36.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-036.1 | Specific reason | non-advance | job-relevant reason | FR-036.1, AC-036.1.1 | Integration |
| TC-036.2 | Human confirm | draft reason | requires confirm | FR-036.2, AC-036.1.2 | Integration |
| TC-036.3 | No protected attr | reason w/ age proxy | blocked | FR-036.3, AC-036.1.3 | Security |
| TC-036.4 | Logged | decision | reason logged | FR-036.4, AC-036.1.4 | Integration |
| TC-036.5 | Bulk reject | many candidates | each gets specific reason | edge | Integration |
| TC-036.6 | Share | candidate asks | respectful version | FR-036.5 | Integration |

**4.36.16 Open questions.** Q-036.1 — default to sharing reasons with candidates, or opt-in per employer? (PM/Compliance, Open.)

---

### 4.37 Feature F-037 — Lean HR automation (post / bulk actions / schedule)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §8.3 · **Wireframe:** W-202

**4.37.1 Description.** The "do-the-tedious-HR-work" layer for lean teams: multi-channel posting, bulk pipeline actions (advance/reject with reasons), and interview scheduling — all human-gated for consequential actions.

**4.37.2 Triggers.** Employer posts a role; bulk-acts on candidates; schedules interviews.

**4.37.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-037.1 | The system shall post a role to selected channels (org careers page, enabled boards) from one place. | Must |
| FR-037.2 | The system shall support bulk advance/reject with a required reason per candidate (F-036), human-confirmed. | Must |
| FR-037.3 | The system shall integrate scheduling (F-041) for shortlisted candidates. | Should |
| FR-037.4 | The system shall never bulk-reject without a confirmed reason and human action. | Must |
| FR-037.5 | The system shall rate-limit outbound posting/email to protect deliverability + abuse. | Must |

**4.37.4 Acceptance criteria**
- AC-037.1.1 — Given a role, then I post to multiple channels in one action.
- AC-037.1.2 — Given a bulk reject, then each candidate gets a confirmed reason and a human triggers it.
- AC-037.1.3 — Given a bulk action, then it cannot run as a silent auto-reject.
- AC-037.1.4 — Given a posting flood, then rate limits apply.

**4.37.5 Business rules.** BR-037.1 human-confirm on bulk reject; BR-037.2 reason required; BR-037.3 outbound rate-limited; BR-037.4 post only to authorized channels.

**4.37.6 Inputs.** `role_id`, `channels[]`, `candidate_ids[]`, `action`. **4.37.7 Outputs.** `{posted_to[], actioned[], scheduled[]}`. Errors: `429 RATE_LIMITED`, `403 CHANNEL_NOT_AUTHORIZED`, `422 REASON_REQUIRED`.

**4.37.8 State model.** Posting: Draft → Posted(channels) → (Closed). Bulk action: Selected → ReasonsAttached → HumanConfirmed → Executed.

**4.37.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Bulk reject without reasons | `422 REASON_REQUIRED` |
| Unauthorized channel | `403 CHANNEL_NOT_AUTHORIZED` |
| Posting spam/flood | `429 RATE_LIMITED` |
| Partial posting failure | Report per-channel status; don't claim full success |
| Candidate already actioned | Idempotent; no double action |

**4.37.11 NFRs.** Posting fan-out ≤10 s p95; 0 reasonless bulk rejects.
**4.37.12 Security.** SR-037.1 channel auth; SR-037.2 outbound abuse controls; SR-037.3 idempotency keys on bulk actions.
**4.37.13 Compliance.** Human-in-loop → FR-037.4; adverse-action reasons → FR-037.2.
**4.37.14 Observability.** `roles_posted_total`, `bulk_action_total`, `reasonless_reject_blocked_total`, `outbound_rate_limited_total`.

**4.37.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-037.1 | Multi-channel post | role + 3 channels | posted to all; per-channel status | FR-037.1, AC-037.1.1 | Integration |
| TC-037.2 | Bulk reject w/ reasons | candidates + reasons | confirmed; reasons attached | FR-037.2, AC-037.1.2 | Integration |
| TC-037.3 | No silent auto-reject | bulk action | requires human confirm | FR-037.4, AC-037.1.3 | Integration |
| TC-037.4 | Reasonless reject | no reasons | `422 REASON_REQUIRED` | BR-037.2 | Unit |
| TC-037.5 | Rate limit | flood of posts | `429` | FR-037.5, AC-037.1.4 | Integration |
| TC-037.6 | Unauthorized channel | bad channel | `403` | SR-037.1 | Security |
| TC-037.7 | Idempotency | re-run bulk action | no double action | SR-037.3 | Integration |
| TC-037.8 | Partial failure | one channel down | honest per-channel report | edge | Chaos |

**4.37.16 Open questions.** Q-037.1 — which external boards at launch (ToS-compliant only). (PM, Open.)

---

### 4.38 Feature F-038 — Hiring workflow (pipeline, scorecards, collaboration)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §8.3 · **Wireframe:** W-202

**4.38.1 Description.** A lightweight ATS-grade pipeline: stages, structured scorecards, collaborative reviews/notes, and decisions — RBAC-aware (F-072e), trust-wall safe, audit-logged.

**4.38.2 Triggers.** Candidate enters a role's pipeline; reviewer scores; team decides.

**4.38.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-038.1 | The system shall move candidates through configurable stages (e.g. Applied→Screen→Interview→Offer). | Must |
| FR-038.2 | The system shall support structured scorecards (job-relevant competencies, ratings, notes). | Must |
| FR-038.3 | The system shall support multi-reviewer collaboration with per-user attribution. | Must |
| FR-038.4 | The system shall require human decision at each advance/reject gate (no auto-decision). | Must |
| FR-038.5 | The system shall enforce RBAC (who can view/score/decide). | Must |
| FR-038.6 | The system shall log all stage changes + decisions for audit. | Must |

**4.38.4 Acceptance criteria**
- AC-038.1.1 — Given a pipeline, then candidates move through stages with history.
- AC-038.1.2 — Given a scorecard, then competency ratings + notes are captured per reviewer.
- AC-038.1.3 — Given a role member without decide rights, then they cannot advance/reject (RBAC).
- AC-038.1.4 — Given a stage change, then it's logged with actor + timestamp.
- AC-038.1.5 — Given concurrent edits by two reviewers, then no lost updates (optimistic concurrency).

**4.38.5 Business rules.** BR-038.1 RBAC enforced; BR-038.2 human decision at gates; BR-038.3 audit all transitions; BR-038.4 trust wall on candidate data.

**4.38.6 Inputs.** `candidate_id`, `stage`, `scorecard{}`, `decision`. **4.38.7 Outputs.** `{pipeline_state, scorecards[], history[]}`. Errors: `403 FORBIDDEN` (RBAC), `409 STALE_UPDATE`, `422 INVALID_STAGE`.

**4.38.8 State model.** Candidate-in-pipeline: Applied → Screen → Interview → Offer → (Hired | Rejected[reason]). Every transition human-actioned + logged.

**4.38.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Reviewer lacks decide rights | `403`; can comment/score only |
| Two reviewers edit same scorecard | `409 STALE_UPDATE`; merge/retry |
| Skip-stage attempt | Validate allowed transitions; `422 INVALID_STAGE` |
| Candidate withdraws | Pipeline marks withdrawn; preserved history |
| Reject without reason | Blocked (F-036) |
| Trust-wall data leak attempt | Blocked |

**4.38.11 NFRs.** Pipeline ops ≤1 s p95; 100% transitions logged.
**4.38.12 Security.** SR-038.1 RBAC at API; SR-038.2 optimistic concurrency; SR-038.3 trust wall; SR-038.4 immutable audit.
**4.38.13 Compliance.** Auditability → FR-038.6; human-in-loop → FR-038.4.
**4.38.14 Observability.** `pipeline_transition_total`, `rbac_denied_total`, `stale_update_total`, `time_in_stage`.

**4.38.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-038.1 | Stage movement | advance candidate | moves + history | FR-038.1, AC-038.1.1 | Integration |
| TC-038.2 | Scorecard | reviewer scores | ratings + notes captured | FR-038.2, AC-038.1.2 | Integration |
| TC-038.3 | RBAC | no-decide member advances | `403` | FR-038.5, AC-038.1.3 | Security |
| TC-038.4 | Audit | stage change | logged actor+time | FR-038.6, AC-038.1.4 | Integration |
| TC-038.5 | Concurrency | two editors | `409`; no lost update | AC-038.1.5 | Integration |
| TC-038.6 | Invalid transition | skip stage | `422` | edge | Unit |
| TC-038.7 | Reject w/o reason | reject, no reason | blocked | edge (F-036) | Integration |
| TC-038.8 | Trust wall | view candidate private data | denied | SR-038.3 | Security |

**4.38.16 Open questions.** Q-038.1 — how configurable should stages be in MVP. (PM, Open.)

---

### 4.39 Feature F-039 — Recruiting analytics
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P2 · **Release:** vNext · **PRD:** §8.4 · **Wireframe:** W-204

**4.39.1 Description.** Funnel + outcome analytics for the org: time-to-hire, cost-per-hire, source/quality, funnel conversion, and **fairness metrics** (selection-rate parity) — drawing on the engine's outcome loop, trust-wall safe, aggregate-only (no candidate-private data).

**4.39.2 Triggers.** Employer opens analytics; scheduled report.

**4.39.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-039.1 | The system shall report time-to-hire, cost-per-hire, funnel conversion per role/org. | Must |
| FR-039.2 | The system shall report source and quality-of-hire (using post-hire outcomes F-040). | Should |
| FR-039.3 | The system shall report fairness metrics (selection-rate parity across groups) at aggregate level. | Must |
| FR-039.4 | The system shall use aggregate data only; no candidate-private data; min cohort size to prevent re-identification. | Must |
| FR-039.5 | The system shall let employers export reports (CSV/PDF). | Should |

**4.39.4 Acceptance criteria**
- AC-039.1.1 — Given hires, then TTH/CPH/funnel computed correctly.
- AC-039.1.2 — Given a small cohort (<k), then suppressed to prevent re-identification.
- AC-039.1.3 — Given fairness view, then selection-rate parity shown with out-of-band flag.
- AC-039.1.4 — Given export, then aggregate-only data, no candidate PII beyond what's allowed.

**4.39.5 Business rules.** BR-039.1 aggregate-only; BR-039.2 min cohort size k (e.g. 5) for any breakdown; BR-039.3 fairness metrics included; BR-039.4 trust wall.

**4.39.6 Inputs.** `org_id`, `role_id?`, `date_range`. **4.39.7 Outputs.** `{tth, cph, funnel{}, quality, fairness{}, suppressed_cells[]}`.

**4.39.8 State model.** Report: Requested → Computed → (Exported)?.

**4.39.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Cohort < k | Suppress cell; show "insufficient data" |
| No hires yet | Empty/early-stage messaging; no fabricated stats |
| Attempt to drill to individual | Blocked by min-cohort + trust wall |
| Date range with no data | Empty report, not error |

**4.39.11 NFRs.** Report compute ≤8 s p95; 0 re-identifiable cells.
**4.39.12 Security.** SR-039.1 aggregation + k-anonymity; SR-039.2 trust wall; SR-039.3 org-scoped.
**4.39.13 Compliance.** Fairness reporting → FR-039.3; privacy/k-anonymity → FR-039.4.
**4.39.14 Observability.** `analytics_requests_total`, `suppressed_cell_total`, `fairness_out_of_band_total`.

**4.39.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-039.1 | Core metrics | hires data | correct TTH/CPH/funnel | FR-039.1, AC-039.1.1 | Integration |
| TC-039.2 | k-anonymity | cohort of 2 | suppressed | FR-039.4, AC-039.1.2 | Security |
| TC-039.3 | Fairness | skewed selection | parity flag | FR-039.3, AC-039.1.3 | Integration |
| TC-039.4 | Export | request CSV | aggregate-only export | FR-039.5, AC-039.1.4 | Integration |
| TC-039.5 | No data | empty range | empty, no fabrication | edge | Integration |
| TC-039.6 | Drill-to-individual | attempt | blocked | SR-039.1 | Security |

**4.39.16 Open questions.** Q-039.1 — exact k for min cohort. (Compliance, Open.)

---

### 4.40 Feature F-040 — Post-hire success check-in
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P2 · **Release:** vNext · **PRD:** §8.4 · **Wireframe:** —

**4.40.1 Description.** Closes the outcome loop: lightweight check-ins (e.g. 30/60/90-day) capturing whether the hire is succeeding — feeding the engine (F-050/F-051) so matching/screening get smarter. Consented, aggregate-feedback, trust-wall safe.

**4.40.2 Triggers.** Hire date + N days; employer prompted for a quick check-in.

**4.40.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-040.1 | The system shall prompt the employer for success signal at configurable intervals. | Must |
| FR-040.2 | The system shall feed outcomes to the engine loop (F-050/F-051), anonymized per trust wall. | Must |
| FR-040.3 | The system shall keep check-ins optional/low-friction (skippable). | Must |
| FR-040.4 | The system shall not expose an individual's success rating back to that individual via employer. | Must |

**4.40.4 Acceptance criteria**
- AC-040.1.1 — Given a hire at +30d, then employer gets a quick check-in prompt.
- AC-040.1.2 — Given a response, then it feeds the engine loop (anonymized).
- AC-040.1.3 — Given the employer skips, then no penalty; loop tolerates missing data.
- AC-040.1.4 — Given outcomes, then trust wall preserved (no leak to candidate side as personal judgment).

**4.40.5 Business rules.** BR-040.1 consented; BR-040.2 anonymized to engine; BR-040.3 skippable; BR-040.4 trust wall.

**4.40.6 Inputs.** `hire_id`, `interval`, `success_signal`. **4.40.7 Outputs.** `{recorded:true, fed_to_loop:true}`.

**4.40.8 State model.** Check-in: Scheduled → Prompted → (Responded → FedToLoop | Skipped).

**4.40.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Employer ignores prompt | Skipped; loop handles missingness |
| Hire left the company | Capture as outcome (attrition), don't error |
| Candidate requests their rating | Not provided as personal judgment (trust wall) |
| Negative signal | Recorded neutrally; improves matching, not punitive to candidate identity |

**4.40.11 NFRs.** Loop ingestion ≤24 h; 0 trust-wall leaks.
**4.40.12 Security.** SR-040.1 anonymization before loop; SR-040.2 trust wall.
**4.40.13 Compliance.** Consent → FR-040.1; privacy → FR-040.4.
**4.40.14 Observability.** `checkin_prompt_total`, `checkin_response_rate`, `loop_ingest_total`.

**4.40.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-040.1 | Prompt | hire +30d | check-in prompt | FR-040.1, AC-040.1.1 | Integration |
| TC-040.2 | Feed loop | response | anonymized to loop | FR-040.2, AC-040.1.2 | Integration |
| TC-040.3 | Skip | no response | no penalty | FR-040.3, AC-040.1.3 | Integration |
| TC-040.4 | Trust wall | candidate asks rating | not exposed | FR-040.4, AC-040.1.4 | Security |
| TC-040.5 | Attrition | hire left | captured, no error | edge | Integration |

**4.40.16 Open questions.** Q-040.1 — incentive to drive employer check-in response rate. (PM, Open.)

---

### 4.41 Feature F-041 — Interview scheduling (employer side)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §8.3 · **Wireframe:** W-205

**4.41.1 Description.** Schedules interviews between shortlisted candidates and interviewers — timezone-correct, conflict-free, calendar-integrated, with reschedule/cancel and reminders. Mirrors candidate-side F-026.

**4.41.2 Triggers.** Employer schedules an interview; candidate confirms/reschedules.

**4.41.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-041.1 | The system shall propose slots from interviewer availability and book in both parties' local timezones. | Must |
| FR-041.2 | The system shall prevent double-booking and detect conflicts. | Must |
| FR-041.3 | The system shall handle reschedule/cancel and send reminders. | Must |
| FR-041.4 | The system shall integrate with calendars (where connected) and emit invites. | Should |
| FR-041.5 | The system shall correctly handle timezones/DST. | Must |

**4.41.4 Acceptance criteria**
- AC-041.1.1 — Given interviewer availability, then candidate sees slots in their own timezone.
- AC-041.1.2 — Given a booked slot, then it can't be double-booked.
- AC-041.1.3 — Given a DST boundary, then the time is correct for both parties.
- AC-041.1.4 — Given a reschedule, then both parties are notified and calendars update.

**4.41.5 Business rules.** BR-041.1 no double-book; BR-041.2 store UTC, render local; BR-041.3 reminders sent; BR-041.4 reschedule notifies all.

**4.41.6 Inputs.** `candidate_id`, `interviewer_ids[]`, `availability`, `duration`, `timezones`. **4.41.7 Outputs.** `{slot, invites[], calendar_event_ids[]}`. Errors: `409 SLOT_TAKEN`, `422 NO_AVAILABILITY`.

**4.41.8 State model.** Interview: Proposed → Confirmed → (Rescheduled)* → (Completed | Cancelled | NoShow).

**4.41.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Two candidates grab same slot | First wins; second `409 SLOT_TAKEN` |
| DST transition in range | Correct local time both sides |
| Interviewer across date line | Correct day rendering |
| Calendar disconnected | Fall back to email invite; no crash |
| All slots taken | `422 NO_AVAILABILITY`; suggest alternatives |
| Candidate no-show | Recorded; reschedulable |

**4.41.11 NFRs.** Slot booking ≤2 s p95; 0 double-bookings; 0 timezone errors in test matrix.
**4.41.12 Security.** SR-041.1 only invited parties see details; SR-041.2 calendar tokens encrypted; SR-041.3 trust wall.
**4.41.13 Compliance.** Data minimization on calendar scope → FR-041.4.
**4.41.14 Observability.** `interviews_scheduled_total`, `double_book_blocked_total`, `reschedule_total`, `no_show_total`.

**4.41.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-041.1 | Book slot | availability | candidate-local slots booked | FR-041.1, AC-041.1.1 | Integration |
| TC-041.2 | Double-book | concurrent grab | `409 SLOT_TAKEN` | FR-041.2, AC-041.1.2 | Integration |
| TC-041.3 | DST | slot across DST | correct both sides | FR-041.5, AC-041.1.3 | Unit |
| TC-041.4 | Reschedule | change time | both notified; calendars update | FR-041.3, AC-041.1.4 | Integration |
| TC-041.5 | No availability | full calendar | `422 NO_AVAILABILITY` | edge | Integration |
| TC-041.6 | Calendar down | disconnected | email fallback | edge | Chaos |
| TC-041.7 | Date line | interviewer +14h | correct day | edge | Unit |

**4.41.16 Open questions.** Q-041.1 — which calendar providers at launch. (Eng, Open.)

---

### 4.42 Feature F-042 — Automated reference checking
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P2 · **Release:** vNext · **PRD:** §8.3 · **Wireframe:** —

**4.42.1 Description.** Streamlines reference checks: with **candidate consent**, collects structured references via secure links, summarizes responses, and flags inconsistencies — never contacting references without consent, never storing more than necessary.

**4.42.2 Triggers.** Employer requests references for a consented candidate; references respond.

**4.42.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-042.1 | The system shall require candidate consent before contacting any reference. | Must |
| FR-042.2 | The system shall send secure, single-use reference forms and collect structured responses. | Must |
| FR-042.3 | The system shall summarize references and flag material inconsistencies (without defaming). | Should |
| FR-042.4 | The system shall verify reference identity minimally to reduce fake references. | Should |
| FR-042.5 | The system shall let references decline and delete their data. | Must |

**4.42.4 Acceptance criteria**
- AC-042.1.1 — Given no candidate consent, then no reference is contacted.
- AC-042.1.2 — Given a reference link, then it's single-use and expires.
- AC-042.1.3 — Given responses, then a fair summary + flagged inconsistencies (no defamation).
- AC-042.1.4 — Given a reference declines, then their data is removed.
- AC-042.1.5 — Given a fake/self-reference (same contact as candidate), then flagged.

**4.42.5 Business rules.** BR-042.1 consent required; BR-042.2 single-use expiring links; BR-042.3 minimal data; BR-042.4 self-reference detection.

**4.42.6 Inputs.** `candidate_id`, `consent`, `reference_contacts[]`. **4.42.7 Outputs.** `{responses[], summary, inconsistency_flags[]}`. Errors: `403 CONSENT_REQUIRED`, `410 LINK_EXPIRED`.

**4.42.8 State model.** Reference: Requested → (ConsentGranted → Sent → Responded → Summarized) | ConsentDenied. Link: Active → (Used | Expired).

**4.42.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| No consent | `403 CONSENT_REQUIRED`; nothing sent |
| Reused link | `410 LINK_EXPIRED` |
| Self-reference (candidate's own contact) | Flagged |
| Reference declines | Data deleted |
| Contradictory references | Flagged neutrally, not defamatory |
| Reference non-response | Time out gracefully; partial summary |

**4.42.11 NFRs.** Link single-use + ≤14-day expiry; 0 contacts without consent.
**4.42.12 Security.** SR-042.1 single-use signed links; SR-042.2 minimal PII; SR-042.3 reference data deletable; SR-042.4 trust wall.
**4.42.13 Compliance.** Consent → FR-042.1; data minimization/erasure → FR-042.5.
**4.42.14 Observability.** `reference_requests_total`, `no_consent_blocked_total`, `self_reference_flagged_total`, `link_reuse_blocked_total`.

**4.42.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-042.1 | Consent gate | no consent | `403`; no contact | FR-042.1, AC-042.1.1 | Security |
| TC-042.2 | Single-use link | reuse | `410 LINK_EXPIRED` | FR-042.2, AC-042.1.2 | Security |
| TC-042.3 | Summary | responses | fair summary + flags | FR-042.3, AC-042.1.3 | Integration |
| TC-042.4 | Reference decline | declines | data removed | FR-042.5, AC-042.1.4 | Integration |
| TC-042.5 | Self-reference | candidate's own email | flagged | FR-042.4, AC-042.1.5 | Security |
| TC-042.6 | Non-response | reference silent | partial summary | edge | Integration |

**4.42.16 Open questions.** Q-042.1 — reference identity-verification strength vs. friction. (PM, Open.)

---

### 4.43 Feature F-043 — Employer↔candidate messaging
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §8.3 · **Wireframe:** —

**4.43.1 Description.** Secure two-way messaging between employer and candidate (mirror of candidate F-101c) — trust-wall enforced, consent-gated for first contact, abuse-protected (rate limits, spam/harassment filtering), with a clear audit trail.

**4.43.2 Triggers.** Employer initiates contact with a candidate who's open; candidate replies.

**4.43.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-043.1 | The system shall allow messaging only with candidates open to contact (consent-gated first contact). | Must |
| FR-043.2 | The system shall enforce the trust wall — no candidate-private data exposed via messaging context. | Must |
| FR-043.3 | The system shall rate-limit and filter spam/harassment; allow block/report. | Must |
| FR-043.4 | The system shall not leak candidate contact details unless the candidate shares them. | Must |
| FR-043.5 | The system shall keep an audit trail; messages immutable once sent. | Must |

**4.43.4 Acceptance criteria**
- AC-043.1.1 — Given a candidate not open to contact, then employer can't message them.
- AC-043.1.2 — Given messaging, then no candidate-private diagnostic data is visible.
- AC-043.1.3 — Given mass-messaging/spam, then rate limits + filtering apply.
- AC-043.1.4 — Given harassment, then candidate can block/report; employer flagged.
- AC-043.1.5 — Given a message, then candidate email/phone isn't exposed unless they share it.

**4.43.5 Business rules.** BR-043.1 consent for first contact; BR-043.2 trust wall; BR-043.3 rate limit (e.g. ≤N new threads/day/org); BR-043.4 contact details private; BR-043.5 immutable audit.

**4.43.6 Inputs.** `from_org`, `to_candidate_public_id`, `message`. **4.43.7 Outputs.** `{thread_id, delivered}`. Errors: `403 NOT_OPEN_TO_CONTACT`, `429 RATE_LIMITED`, `423 BLOCKED_BY_CANDIDATE`.

**4.43.8 State model.** Thread: Initiated(consent-checked) → Active → (Blocked | Reported | Archived). Message: Composed → Sent(immutable).

**4.43.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Candidate not open | `403 NOT_OPEN_TO_CONTACT` |
| Mass spam | `429 RATE_LIMITED` |
| Candidate blocks | `423 BLOCKED_BY_CANDIDATE` for that org |
| Harassment content | Filtered; report path; org flagged |
| Attempt to extract private data via prompts | Trust wall holds; nothing leaked |
| Contact-detail phishing | Details not exposed unless candidate shares |

**4.43.11 NFRs.** Delivery ≤2 s p95; 0 trust-wall leaks; 0 contact-detail leaks.
**4.43.12 Security.** SR-043.1 trust wall; SR-043.2 abuse/rate controls; SR-043.3 immutable audit; SR-043.4 content moderation on harassment.
**4.43.13 Compliance.** Consent → FR-043.1; anti-harassment → FR-043.3.
**4.43.14 Observability.** `messages_sent_total`, `not_open_blocked_total`, `rate_limited_total`, `harassment_reports_total`, `trustwall_leak_total` (alert any>0).

**4.43.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-043.1 | Consent gate | candidate not open | `403 NOT_OPEN_TO_CONTACT` | FR-043.1, AC-043.1.1 | Security |
| TC-043.2 | Trust wall | message context | no private data | FR-043.2, AC-043.1.2 | Security |
| TC-043.3 | Spam limit | mass threads | `429 RATE_LIMITED` | FR-043.3, AC-043.1.3 | Integration |
| TC-043.4 | Harassment | abusive message | filtered + reportable | FR-043.3, AC-043.1.4 | Integration |
| TC-043.5 | Contact privacy | inspect message | no email/phone leak | FR-043.4, AC-043.1.5 | Security |
| TC-043.6 | Block | candidate blocks org | `423 BLOCKED_BY_CANDIDATE` | edge | Integration |
| TC-043.7 | Immutable audit | edit sent message | cannot alter; logged | FR-043.5 | Security |

**4.43.16 Open questions.** Q-043.1 — first-contact template constraints to reduce spam. (PM, Open.)

---

### 4.70e Feature F-070e — Employer org sign-up / sign-in
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §7 · **Wireframe:** W-001

**4.70e.1 Description.** Org account creation + authentication for employers: create an org, verified work email, first admin, secure sessions. Ties to verification (F-092e) and RBAC (F-072e).

**4.70e.2 Triggers.** New employer signs up; member signs in.

**4.70e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-070e.1 | The system shall create an org with a verified work-email admin. | Must |
| FR-070e.2 | The system shall authenticate with secure password (hashed, e.g. Argon2id) + MFA option. | Must |
| FR-070e.3 | The system shall verify email before granting full access. | Must |
| FR-070e.4 | The system shall enforce rate-limited login + lockout on brute force. | Must |
| FR-070e.5 | The system shall scope all data to the org (tenant isolation). | Must |

**4.70e.4 Acceptance criteria**
- AC-070e.1.1 — Given a work email, then org + admin created; verification email sent.
- AC-070e.1.2 — Given a free/disposable email domain, then flagged for verification (F-092e).
- AC-070e.1.3 — Given 5 failed logins, then `429`/temporary lockout.
- AC-070e.1.4 — Given login, then password is never stored in plaintext.
- AC-070e.1.5 — Given org A user, then they can't access org B data.

**4.70e.5 Business rules.** BR-070e.1 unique org; BR-070e.2 verified email; BR-070e.3 lockout after N fails; BR-070e.4 tenant isolation.

**4.70e.6 Inputs.** `org_name`, `work_email`, `password`. **4.70e.7 Outputs.** `{org_id, admin_user_id, session}`. Errors: `409 ORG_EXISTS`, `422 INVALID_EMAIL`, `429 TOO_MANY_ATTEMPTS`.

**4.70e.8 State model.** Org: Created → EmailPending → Verified → Active. Session: Issued → Active → (Expired | Revoked).

**4.70e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Disposable email | Flag for verification |
| Duplicate org | `409 ORG_EXISTS` |
| Brute-force login | Lockout + `429` |
| Credential stuffing | Rate-limit + breached-password check |
| Session hijack token reuse | Detect + revoke |

**4.70e.11 NFRs.** Auth ≤500 ms p95; password hashing Argon2id; 0 plaintext secrets.
**4.70e.12 Security.** SR-070e.1 Argon2id; SR-070e.2 MFA; SR-070e.3 tenant isolation; SR-070e.4 breached-password + rate limits.
**4.70e.13 Compliance.** Account security baseline → FR-070e.2/.4.
**4.70e.14 Observability.** `signups_total`, `login_failures_total`, `lockouts_total`, `cross_tenant_denied_total`.

**4.70e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-070e.1 | Sign-up | work email | org+admin; verify sent | FR-070e.1, AC-070e.1.1 | Integration |
| TC-070e.2 | Disposable email | temp-mail domain | flagged | FR-070e.3, AC-070e.1.2 | Security |
| TC-070e.3 | Brute force | 5 bad logins | lockout/`429` | FR-070e.4, AC-070e.1.3 | Security |
| TC-070e.4 | Hashing | inspect store | no plaintext | FR-070e.2, AC-070e.1.4 | Security |
| TC-070e.5 | Tenant isolation | org A→org B | denied | FR-070e.5, AC-070e.1.5 | Security |
| TC-070e.6 | Duplicate org | existing | `409` | BR-070e.1 | Unit |
| TC-070e.7 | Breached password | known-pwned pwd | rejected/warned | SR-070e.4 | Security |
| TC-070e.8 | Session revoke | revoked token reuse | denied | SR-070e.3 | Security |

**4.70e.16 Open questions.** Q-070e.1 — MFA mandatory for admins at launch? (Security, Open.)

---

### 4.71e Feature F-071e — SSO (SAML/OIDC) for orgs
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7 · **Wireframe:** W-206

**4.71e.1 Description.** Enterprise SSO via SAML 2.0 / OIDC so org members authenticate through their IdP (Okta, Azure AD, Google Workspace), with JIT provisioning and SCIM-style deprovisioning hooks.

**4.71e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-071e.1 | The system shall support SAML 2.0 and OIDC SSO. | Must |
| FR-071e.2 | The system shall JIT-provision members on first SSO login with mapped roles. | Should |
| FR-071e.3 | The system shall deprovision/disable access when the IdP revokes the user. | Must |
| FR-071e.4 | The system shall validate SSO assertions (signature, audience, expiry, replay). | Must |
| FR-071e.5 | The system shall fall back to password auth only if org policy allows. | Should |

**4.71e.4 Acceptance criteria**
- AC-071e.1.1 — Given an Okta org, then members log in via SSO.
- AC-071e.1.2 — Given a tampered/expired assertion, then login rejected.
- AC-071e.1.3 — Given IdP deprovision, then access revoked.
- AC-071e.1.4 — Given SSO-only policy, then password login disabled.

**4.71e.5 Business rules.** BR-071e.1 validate assertions strictly; BR-071e.2 enforce SSO-only if set; BR-071e.3 deprovision honored.

**4.71e.6 Inputs.** IdP metadata, SAML/OIDC assertion. **4.71e.7 Outputs.** `{session, provisioned_user}`. Errors: `401 INVALID_ASSERTION`, `403 SSO_REQUIRED`.

**4.71e.8 State model.** SSO session: AssertionReceived → Validated → SessionIssued | Rejected.

**4.71e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Replayed assertion | Rejected (replay protection) |
| Clock skew | Bounded tolerance; else reject |
| Audience mismatch | Reject |
| IdP down | Honest error; fallback only if allowed |
| Role mapping missing | Default least-privilege |

**4.71e.11 NFRs.** Assertion validation strict; 0 accepted invalid assertions.
**4.71e.12 Security.** SR-071e.1 signature + audience + expiry + replay checks; SR-071e.2 encrypted IdP secrets; SR-071e.3 least-privilege default.
**4.71e.13 Compliance.** Enterprise access governance → FR-071e.3.
**4.71e.14 Observability.** `sso_logins_total`, `invalid_assertion_total`, `deprovision_total`.

**4.71e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-071e.1 | SAML login | valid assertion | session issued | FR-071e.1, AC-071e.1.1 | Integration |
| TC-071e.2 | Tampered assertion | bad signature | `401` | FR-071e.4, AC-071e.1.2 | Security |
| TC-071e.3 | Replay | reused assertion | rejected | SR-071e.1 | Security |
| TC-071e.4 | Deprovision | IdP revoke | access revoked | FR-071e.3, AC-071e.1.3 | Integration |
| TC-071e.5 | SSO-only | password attempt | `403 SSO_REQUIRED` | FR-071e.5, AC-071e.1.4 | Integration |
| TC-071e.6 | OIDC login | valid token | session issued | FR-071e.1 | Integration |

**4.71e.16 Open questions.** Q-071e.1 — SCIM provisioning in MVP or fast-follow. (Eng, Open.)

---

### 4.72e Feature F-072e — Org RBAC + seat management
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §7 · **Wireframe:** W-206

**4.72e.1 Description.** Roles (Admin, Recruiter, Hiring Manager, Viewer) with least-privilege permissions, seat assignment/limits, and billing-aware seat counts. Governs who can post, screen, decide, view analytics, and manage billing.

**4.72e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-072e.1 | The system shall provide predefined roles with scoped permissions. | Must |
| FR-072e.2 | The system shall enforce permissions on every action server-side. | Must |
| FR-072e.3 | The system shall manage seats (invite/remove) within plan limits. | Must |
| FR-072e.4 | The system shall restrict billing + verification actions to Admins. | Must |
| FR-072e.5 | The system shall log role/seat changes for audit. | Must |
| FR-072e.6 | The system shall prevent privilege escalation (a user granting themselves higher rights). | Must |

**4.72e.4 Acceptance criteria**
- AC-072e.1.1 — Given a Viewer, then they can't post/screen/decide.
- AC-072e.1.2 — Given seat limit reached, then new invite blocked until seat freed/added.
- AC-072e.1.3 — Given a Recruiter, then they can't change billing.
- AC-072e.1.4 — Given a self-escalation attempt, then blocked.
- AC-072e.1.5 — Given a role change, then logged.

**4.72e.5 Business rules.** BR-072e.1 server-side enforcement; BR-072e.2 seat limits by plan; BR-072e.3 admin-only billing; BR-072e.4 no self-escalation.

**4.72e.6 Inputs.** `user_id`, `role`, `seat_action`. **4.72e.7 Outputs.** `{members[], seats_used, seats_limit}`. Errors: `403 FORBIDDEN`, `409 SEAT_LIMIT_REACHED`.

**4.72e.8 State model.** Member: Invited → Active(role) → (RoleChanged)* → Removed.

**4.72e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Last admin removal | Blocked (must keep ≥1 admin) |
| Seat limit hit | `409 SEAT_LIMIT_REACHED` |
| Self-escalation | Blocked |
| Client-side permission bypass attempt | Server denies |
| Removed user's sessions | Revoked |

**4.72e.11 NFRs.** Permission check ≤50 ms; 0 client-trust bypasses.
**4.72e.12 Security.** SR-072e.1 server-side authz; SR-072e.2 no self-escalation; SR-072e.3 session revoke on removal; SR-072e.4 audit.
**4.72e.13 Compliance.** Least-privilege + auditability → FR-072e.2/.5.
**4.72e.14 Observability.** `rbac_denied_total`, `seat_limit_blocks_total`, `privilege_escalation_blocked_total`.

**4.72e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-072e.1 | Viewer restriction | viewer posts | `403` | FR-072e.2, AC-072e.1.1 | Security |
| TC-072e.2 | Seat limit | over limit invite | `409` | FR-072e.3, AC-072e.1.2 | Integration |
| TC-072e.3 | Billing restriction | recruiter billing | `403` | FR-072e.4, AC-072e.1.3 | Security |
| TC-072e.4 | Self-escalation | grant self admin | blocked | FR-072e.6, AC-072e.1.4 | Security |
| TC-072e.5 | Audit | role change | logged | FR-072e.5, AC-072e.1.5 | Integration |
| TC-072e.6 | Last admin | remove only admin | blocked | edge | Integration |
| TC-072e.7 | Session revoke | removed user acts | denied | SR-072e.3 | Security |

**4.72e.16 Open questions.** Q-072e.1 — custom roles in MVP or predefined only. (PM, Open.)

---

### 4.90e Feature F-090e — Employer notifications
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** v1.1 · **PRD:** §9 · **Wireframe:** —

**4.90e.1 Description.** Timely, controllable notifications for employers (new matches, candidate responses, interview confirmations, screening results, billing alerts) across email/in-app, with preferences + unsubscribe and bounce handling.

**4.90e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-090e.1 | The system shall notify on key events (matches, responses, screening done, scheduling, billing). | Must |
| FR-090e.2 | The system shall honor per-category notification preferences + unsubscribe (non-transactional). | Must |
| FR-090e.3 | The system shall handle bounces/complaints and suppress bad addresses. | Must |
| FR-090e.4 | The system shall never include candidate-private data in notifications (trust wall). | Must |

**4.90e.4 Acceptance criteria**
- AC-090e.1.1 — Given a new screening result, then employer is notified per prefs.
- AC-090e.1.2 — Given unsubscribe from a category, then no more of that category (transactional still send).
- AC-090e.1.3 — Given a hard bounce, then address suppressed.
- AC-090e.1.4 — Given a notification, then no trust-wall data leaks.

**4.90e.5 Business rules.** BR-090e.1 prefs honored; BR-090e.2 transactional always; BR-090e.3 suppress bounces; trust wall.

**4.90e.6 Inputs.** event, recipient prefs. **4.90e.7 Outputs.** `{notified, channel}`. **4.90e.8 State.** Notif: Queued → Sent → (Delivered | Bounced→Suppressed).

**4.90e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Unsubscribed marketing | Suppress marketing; keep transactional |
| Hard bounce | Suppress |
| Notification storm | Batch/digest |
| PII in payload | Trust wall blocks |

**4.90e.11 NFRs.** Delivery ≤60 s p95; 0 trust-wall leaks. **4.90e.12 Security.** SR-090e.1 trust wall; SR-090e.2 signed unsubscribe links. **4.90e.13 Compliance.** CAN-SPAM/PECR-style unsubscribe → FR-090e.2. **4.90e.14 Observability.** `notif_sent_total`, `bounce_total`, `unsub_total`.

**4.90e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-090e.1 | Event notify | screening done | notified per prefs | FR-090e.1, AC-090e.1.1 | Integration |
| TC-090e.2 | Unsubscribe | opt out category | suppressed; transactional kept | FR-090e.2, AC-090e.1.2 | Integration |
| TC-090e.3 | Bounce | hard bounce | suppressed | FR-090e.3, AC-090e.1.3 | Integration |
| TC-090e.4 | Trust wall | notif payload | no private data | FR-090e.4, AC-090e.1.4 | Security |
| TC-090e.5 | Storm | many events | digested | edge | Integration |

**4.90e.16 Open questions.** Q-090e.1 — digest cadence defaults. (PM, Open.)

---

### 4.91e Feature F-091e — Employer onboarding
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §9 · **Wireframe:** W-201

**4.91e.1 Description.** Gets a new employer to first value fast: create org → first JD (F-030, free) → invite team → see matches. Progressive, skippable, resumable; the free-JD front door is the activation moment.

**4.91e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-091e.1 | The system shall guide new orgs to generate their first JD (free) as activation. | Must |
| FR-091e.2 | The system shall let employers invite teammates during onboarding. | Should |
| FR-091e.3 | The system shall be skippable + resumable; no dead-ends. | Must |
| FR-091e.4 | The system shall not require payment to reach first value (free JD). | Must |

**4.91e.4 Acceptance criteria**
- AC-091e.1.1 — Given a new org, then onboarding leads to a free JD quickly.
- AC-091e.1.2 — Given a skip, then resumable later.
- AC-091e.1.3 — Given onboarding, then no paywall before first value.
- AC-091e.1.4 — Given team invite, then teammates join with mapped roles.

**4.91e.5 Business rules.** BR-091e.1 free first value; BR-091e.2 resumable; BR-091e.3 no forced payment.

**4.91e.6 Inputs.** org context, role intent. **4.91e.7 Outputs.** `{onboarding_state, first_jd}`. **4.91e.8 State.** Onboarding: Started → JDGenerated → (TeamInvited)? → Activated; skip→Paused→Resumed.

**4.91e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Skip everything | Land in app; can resume |
| Abandon mid-way | Resume from last step |
| Returning org | Don't re-onboard |
| Invite to existing member | No duplicate |

**4.91e.11 NFRs.** Time-to-first-JD low; resumable. **4.91e.12 Security.** SR-091e.1 org-scoped. **4.91e.13 Compliance.** — **4.91e.14 Observability.** `onboarding_started_total`, `first_jd_rate`, `activation_rate`.

**4.91e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-091e.1 | First JD | new org | free JD reached | FR-091e.1, AC-091e.1.1 | E2E |
| TC-091e.2 | Skip/resume | skip then return | resumes | FR-091e.3, AC-091e.1.2 | Integration |
| TC-091e.3 | No paywall | onboarding | no payment to first value | FR-091e.4, AC-091e.1.3 | Integration |
| TC-091e.4 | Team invite | invite teammate | joins w/ role | FR-091e.2, AC-091e.1.4 | Integration |
| TC-091e.5 | Returning | existing org | no re-onboard | edge | Integration |

**4.91e.16 Open questions.** Q-091e.1 — activation metric definition. (PM, Open.)

---

### 4.92e Feature F-092e — Employer verification (anti-abuse)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P0 · **Release:** v1.0 · **PRD:** §9 · **Wireframe:** —

**4.92e.1 Description.** Verifies that an "employer" is a real, legitimate hiring entity — not a scammer harvesting candidate data, a competitor scraping the pool, or a fake recruiter. Domain/email verification, business signals, and graduated trust gating access to candidate data + messaging.

**4.92e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-092e.1 | The system shall verify work-email domain ownership. | Must |
| FR-092e.2 | The system shall check business legitimacy signals before granting candidate-data access. | Must |
| FR-092e.3 | The system shall gate candidate contact/data behind a verification tier. | Must |
| FR-092e.4 | The system shall detect + block scraping/harvesting behavior (rate, export patterns). | Must |
| FR-092e.5 | The system shall support manual review + suspension of suspicious orgs. | Must |

**4.92e.4 Acceptance criteria**
- AC-092e.1.1 — Given an unverified domain, then candidate-data access withheld.
- AC-092e.1.2 — Given a free-email/temp-mail signup, then extra verification required.
- AC-092e.1.3 — Given bulk-export/scrape patterns, then blocked + flagged.
- AC-092e.1.4 — Given a fake-recruiter report, then org can be suspended.
- AC-092e.1.5 — Given a verified legitimate org, then normal access granted.

**4.92e.5 Business rules.** BR-092e.1 domain verification; BR-092e.2 tiered access; BR-092e.3 scrape detection; BR-092e.4 suspend on abuse.

**4.92e.6 Inputs.** domain, business signals, behavior telemetry. **4.92e.7 Outputs.** `{trust_tier, access_scope}`. Errors: `403 VERIFICATION_REQUIRED`, `423 SUSPENDED`.

**4.92e.8 State model.** Org trust: Unverified → EmailVerified → BusinessVerified → Trusted; any → Flagged → (Suspended | Reinstated).

**4.92e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Disposable email | Extra verification |
| Competitor harvesting pool | Detect export pattern; block |
| Scammer mass-messaging | Rate + content flags; suspend |
| Legit small biz, no website | Alternative verification path |
| False-positive suspension | Appeal (F-094e) |

**4.92e.11 NFRs.** 0 candidate-data access by unverified orgs; scrape detection latency low.
**4.92e.12 Security.** SR-092e.1 domain proof; SR-092e.2 behavioral anomaly detection; SR-092e.3 export throttling; SR-092e.4 trust wall.
**4.92e.13 Compliance.** Candidate-data protection → FR-092e.3; anti-abuse → FR-092e.4.
**4.92e.14 Observability.** `verification_tier_dist`, `scrape_blocked_total`, `orgs_suspended_total`, `unverified_data_access_total` (alert any>0).

**4.92e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-092e.1 | Unverified gate | unverified org | candidate data withheld | FR-092e.3, AC-092e.1.1 | Security |
| TC-092e.2 | Temp email | disposable domain | extra verification | FR-092e.1, AC-092e.1.2 | Security |
| TC-092e.3 | Scrape detection | bulk export pattern | blocked + flagged | FR-092e.4, AC-092e.1.3 | Security |
| TC-092e.4 | Fake recruiter | report | suspendable | FR-092e.5, AC-092e.1.4 | Integration |
| TC-092e.5 | Legit org | verified | normal access | FR-092e.2, AC-092e.1.5 | Integration |
| TC-092e.6 | No-website biz | alt path | verifiable | edge | Integration |
| TC-092e.7 | False suspension | appeal | reinstatable | edge (F-094e) | Integration |

**4.92e.16 Open questions.** Q-092e.1 — business-verification provider/signals at launch. (PM/Security, Open.)

---

### 4.94e Feature F-094e — Appeal / dispute handling (employer)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §9 · **Wireframe:** —

**4.94e.1 Description.** A path for employers to appeal automated/account decisions (e.g. verification suspension, abuse flags) with human review, SLAs, and an audit trail — fairness + due process for orgs.

**4.94e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-094e.1 | The system shall let a suspended/flagged org file an appeal with evidence. | Must |
| FR-094e.2 | The system shall route appeals to human review within an SLA. | Must |
| FR-094e.3 | The system shall communicate the outcome + reasoning. | Must |
| FR-094e.4 | The system shall log appeals + decisions for audit. | Must |
| FR-094e.5 | The system shall prevent appeal-spam abuse (rate limit). | Should |

**4.94e.4 Acceptance criteria**
- AC-094e.1.1 — Given a suspension, then the org can appeal with evidence.
- AC-094e.1.2 — Given an appeal, then human review within SLA.
- AC-094e.1.3 — Given a decision, then reasoned outcome communicated.
- AC-094e.1.4 — Given repeated spam appeals, then rate-limited.

**4.94e.5 Business rules.** BR-094e.1 human review; BR-094e.2 SLA tracked; BR-094e.3 logged.

**4.94e.6 Inputs.** `case_id`, evidence. **4.94e.7 Outputs.** `{appeal_id, status, outcome}`. Errors: `429 RATE_LIMITED`.

**4.94e.8 State.** Appeal: Filed → UnderReview → (Upheld | Overturned) → Communicated.

**4.94e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Spam appeals | Rate-limited |
| SLA breach | Escalate + alert |
| Insufficient evidence | Request more; don't silently reject |
| Overturned wrongful suspension | Reinstated + access restored |

**4.94e.11 NFRs.** SLA (e.g. ≤3 business days) tracked; 100% appeals logged.
**4.94e.12 Security.** SR-094e.1 evidence stored securely; SR-094e.2 immutable audit.
**4.94e.13 Compliance.** Due process / right to contest → FR-094e.1/.2.
**4.94e.14 Observability.** `appeals_total`, `appeal_sla_breach_total`, `overturn_rate`.

**4.94e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-094e.1 | File appeal | suspension+evidence | appeal created | FR-094e.1, AC-094e.1.1 | Integration |
| TC-094e.2 | Human review SLA | appeal | reviewed in SLA | FR-094e.2, AC-094e.1.2 | Integration |
| TC-094e.3 | Outcome | decision | reasoned comms | FR-094e.3, AC-094e.1.3 | Integration |
| TC-094e.4 | Spam guard | many appeals | `429` | FR-094e.5, AC-094e.1.4 | Integration |
| TC-094e.5 | Overturn | wrongful suspension | reinstated | edge | Integration |

**4.94e.16 Open questions.** Q-094e.1 — appeal SLA target. (Ops, Open.)

---

### 4.95e Feature F-095e — Employer reputation / reviews
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P2 · **Release:** vNext · **PRD:** §9 · **Wireframe:** —

**4.95e.1 Description.** Candidate-side signal on employer behavior (responsiveness, respectful process, honest JDs) — building marketplace trust while preventing fake/retaliatory reviews and protecting candidate anonymity (trust wall).

**4.95e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-095e.1 | The system shall let candidates who interacted with an org leave structured feedback. | Must |
| FR-095e.2 | The system shall verify the interaction occurred (no review without contact). | Must |
| FR-095e.3 | The system shall protect candidate anonymity from the employer (trust wall). | Must |
| FR-095e.4 | The system shall detect + remove fake/retaliatory/defamatory reviews. | Must |

**4.95e.4 Acceptance criteria**
- AC-095e.1.1 — Given a real interaction, then candidate can review.
- AC-095e.1.2 — Given no interaction, then no review allowed.
- AC-095e.1.3 — Given a review, then employer can't deanonymize the candidate.
- AC-095e.1.4 — Given a fake/retaliatory review, then removed.

**4.95e.5 Business rules.** BR-095e.1 verified interaction; BR-095e.2 anonymity; BR-095e.3 fake-review detection.

**4.95e.6 Inputs.** `org_id`, interaction proof, review. **4.95e.7 Outputs.** `{review_id, published}`.

**4.95e.8 State.** Review: Submitted → Verified → Published | Rejected(fake).

**4.95e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Review without contact | Blocked |
| Employer tries to ID reviewer | Anonymity preserved |
| Competitor fake reviews | Detected + removed |
| Defamatory content | Moderated |
| Retaliation (employer pressures) | Anonymity protects candidate |

**4.95e.11 NFRs.** 0 deanonymization; fake-review precision high.
**4.95e.12 Security.** SR-095e.1 trust wall on reviewer identity; SR-095e.2 fraud detection.
**4.95e.13 Compliance.** Defamation safeguards; anonymity → FR-095e.3.
**4.95e.14 Observability.** `reviews_total`, `fake_review_removed_total`, `deanonymization_attempt_total`.

**4.95e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-095e.1 | Verified review | real interaction | allowed | FR-095e.1, AC-095e.1.1 | Integration |
| TC-095e.2 | No interaction | no contact | blocked | FR-095e.2, AC-095e.1.2 | Security |
| TC-095e.3 | Anonymity | employer views | can't deanonymize | FR-095e.3, AC-095e.1.3 | Security |
| TC-095e.4 | Fake review | competitor spam | removed | FR-095e.4, AC-095e.1.4 | Integration |
| TC-095e.5 | Defamation | abusive content | moderated | edge | Integration |

**4.95e.16 Open questions.** Q-095e.1 — publish threshold (min reviews) before showing a score. (PM, Open.)

---

### 4.96e Feature F-096e — Candidate search & filtering
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P1 · **Release:** vNext · **PRD:** §8.2 · **Wireframe:** —

**4.96e.1 Description.** Lets employers search/filter the consented candidate pool by job-relevant criteria (skills, level, location/region, availability) — never by protected attributes, never exposing non-consented or trust-wall data.

**4.96e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-096e.1 | The system shall support filtering by job-relevant criteria only. | Must |
| FR-096e.2 | The system shall block filtering/searching on protected attributes or proxies. | Must |
| FR-096e.3 | The system shall return only consented, region-eligible candidates. | Must |
| FR-096e.4 | The system shall paginate + rate-limit to prevent bulk harvesting. | Must |
| FR-096e.5 | The system shall never expose trust-wall data in results. | Must |

**4.96e.4 Acceptance criteria**
- AC-096e.1.1 — Given a skills filter, then matching consented candidates returned.
- AC-096e.1.2 — Given an attempt to filter by age/gender/etc., then blocked.
- AC-096e.1.3 — Given results, then only consented + region-eligible appear.
- AC-096e.1.4 — Given rapid bulk queries, then rate-limited.

**4.96e.5 Business rules.** BR-096e.1 job-relevant only; BR-096e.2 no protected attrs/proxies; BR-096e.3 consent+region; BR-096e.4 anti-harvest limits.

**4.96e.6 Inputs.** `filters{skills,level,region,availability}`. **4.96e.7 Outputs.** `{results[]:public projection}`. Errors: `403 REGION_NOT_ENABLED`, `422 DISALLOWED_FILTER`, `429 RATE_LIMITED`.

**4.96e.8 State.** Query: Submitted → Validated(filters) → Results.

**4.96e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Protected-attribute filter | `422 DISALLOWED_FILTER` |
| Proxy filter (e.g. graduation year → age) | Detected + blocked |
| Bulk-harvest queries | `429 RATE_LIMITED` |
| Trust-wall field in projection | Stripped |
| No results | Empty state, suggest broadening |

**4.96e.11 NFRs.** Search ≤2 s p95; 0 protected-attribute filters honored.
**4.96e.12 Security.** SR-096e.1 filter allowlist; SR-096e.2 proxy detection; SR-096e.3 trust-wall projection; SR-096e.4 rate limits.
**4.96e.13 Compliance.** Anti-discrimination in sourcing → FR-096e.2.
**4.96e.14 Observability.** `searches_total`, `disallowed_filter_blocked_total`, `harvest_rate_limited_total`.

**4.96e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-096e.1 | Skills filter | skills=Go | consented matches | FR-096e.1, AC-096e.1.1 | Integration |
| TC-096e.2 | Protected attr | filter by age | `422 DISALLOWED_FILTER` | FR-096e.2, AC-096e.1.2 | Security |
| TC-096e.3 | Proxy attr | grad-year filter | blocked | SR-096e.2 | Security |
| TC-096e.4 | Consent/region | results | only eligible | FR-096e.3, AC-096e.1.3 | Integration |
| TC-096e.5 | Harvest | rapid bulk | `429` | FR-096e.4, AC-096e.1.4 | Security |
| TC-096e.6 | Trust wall | projection | no private fields | FR-096e.5 | Security |

**4.96e.16 Open questions.** Q-096e.1 — proxy-attribute blocklist scope. (Compliance, Open.)

---

### 4.97e Feature F-097e — Integrations / API / webhooks (employer)
**Owner:** PM · **Eng:** TL · **QA:** QA · **Priority:** P2 · **Release:** vNext · **PRD:** §10 · **Wireframe:** —

**4.97e.1 Description.** Lets orgs integrate Trajct with their ATS/HRIS via a scoped API + webhooks (e.g. push hires, pull pipeline events) — OAuth-scoped, rate-limited, trust-wall enforced, with signed webhooks and replay protection.

**4.97e.3 Functional requirements**
| Req ID | Requirement | Priority |
|---|---|---|
| FR-097e.1 | The system shall expose a scoped REST API with OAuth2 + per-scope permissions. | Must |
| FR-097e.2 | The system shall emit signed webhooks for key events with retry + idempotency. | Must |
| FR-097e.3 | The system shall rate-limit + quota API usage per org. | Must |
| FR-097e.4 | The system shall enforce the trust wall on all API responses. | Must |
| FR-097e.5 | The system shall let orgs rotate/revoke API credentials. | Must |
| FR-097e.6 | The system shall version the API and deprecate gracefully. | Should |

**4.97e.4 Acceptance criteria**
- AC-097e.1.1 — Given an OAuth token scoped to "pipeline:read," then it can't write or read billing.
- AC-097e.1.2 — Given a webhook, then it's signed; tampering is detectable; retried on failure; idempotent.
- AC-097e.1.3 — Given quota exceeded, then `429`.
- AC-097e.1.4 — Given any API response, then no trust-wall data.
- AC-097e.1.5 — Given credential revocation, then old token rejected.

**4.97e.5 Business rules.** BR-097e.1 least-privilege scopes; BR-097e.2 signed+idempotent webhooks; BR-097e.3 quotas; BR-097e.4 trust wall.

**4.97e.6 Inputs.** OAuth token, API request. **4.97e.7 Outputs.** scoped JSON; webhook events. Errors: `401 INVALID_TOKEN`, `403 INSUFFICIENT_SCOPE`, `429 QUOTA_EXCEEDED`.

**4.97e.8 State.** Credential: Issued → Active → (Rotated | Revoked). Webhook: Emitted → (Delivered | Retried → DeadLetter).

**4.97e.10 Edge cases**
| Scenario | Behaviour |
|---|---|
| Over-scope request | `403 INSUFFICIENT_SCOPE` |
| Webhook endpoint down | Retry w/ backoff → dead-letter |
| Replayed webhook | Idempotency key prevents double-processing |
| Quota exceeded | `429 QUOTA_EXCEEDED` |
| Trust-wall field requested via API | Not returned |
| Revoked token reuse | `401` |

**4.97e.11 NFRs.** API p95 ≤500 ms; webhook signature on 100%; 0 trust-wall leaks via API.
**4.97e.12 Security.** SR-097e.1 OAuth scopes; SR-097e.2 HMAC-signed webhooks + replay protection; SR-097e.3 trust-wall projection; SR-097e.4 credential rotation/revocation.
**4.97e.13 Compliance.** Data-sharing governance → FR-097e.4.
**4.97e.14 Observability.** `api_requests_total`, `scope_denied_total`, `webhook_delivery_total`, `webhook_deadletter_total`, `quota_exceeded_total`.

**4.97e.15 Test cases**
| TC ID | Scenario | Input | Expected | Covers | Type |
|---|---|---|---|---|---|
| TC-097e.1 | Scope enforcement | read-token writes | `403 INSUFFICIENT_SCOPE` | FR-097e.1, AC-097e.1.1 | Security |
| TC-097e.2 | Signed webhook | tamper payload | signature fails | FR-097e.2, AC-097e.1.2 | Security |
| TC-097e.3 | Webhook retry | endpoint down | retried → dead-letter | FR-097e.2 | Integration |
| TC-097e.4 | Idempotency | replay webhook | no double-process | AC-097e.1.2 | Integration |
| TC-097e.5 | Quota | over quota | `429` | FR-097e.3, AC-097e.1.3 | Integration |
| TC-097e.6 | Trust wall via API | request private field | not returned | FR-097e.4, AC-097e.1.4 | Security |
| TC-097e.7 | Revocation | revoked token | `401` | FR-097e.5, AC-097e.1.5 | Security |

**4.97e.16 Open questions.** Q-097e.1 — which ATS/HRIS integrations first. (PM, Open.)

---

## 11. Traceability matrix (master — employer)
| F-ID | FR IDs | ACs | BRs | Tests | PRD | Wireframe | Priority |
|---|---|---|---|---|---|---|---|
| F-030 | FR-030.1–.8 | AC-030.1.1–.6 | BR-030.1–.5 | TC-030.1–.9 | §8.1 | W-201 | P0 |
| F-031 | FR-031.1–.5 | AC-031.1.1–.4 | BR-031.1–.3 | TC-031.1–.6 | §8.1 | W-201 | P1 |
| F-032 | FR-032.1–.6 | AC-032.1.1–.5 | BR-032.1–.3 | TC-032.1–.8 | §8.2 | W-202 | P1 |
| F-033 | FR-033.1–.5 | AC-033.1.1–.4 | BR-033.1–.4 | TC-033.1–.5 | §8.2 | — | P2 |
| F-034 | FR-034.1–.11 | AC-034.1.1–.10 | BR-034.1–.7 | TC-034.1–.14 | §8.2 | W-203 | P0¹ |
| F-035 | FR-035.1–.4 | AC-035.1.1–.4 | BR-035.1–.3 | TC-035.1–.5 | §8.2 | W-203 | P1 |
| F-036 | FR-036.1–.5 | AC-036.1.1–.4 | BR-036.1–.4 | TC-036.1–.6 | §8.2 | W-202 | P1 |
| F-037 | FR-037.1–.5 | AC-037.1.1–.4 | BR-037.1–.4 | TC-037.1–.8 | §8.3 | W-202 | P1 |
| F-038 | FR-038.1–.6 | AC-038.1.1–.5 | BR-038.1–.4 | TC-038.1–.8 | §8.3 | W-202 | P1 |
| F-039 | FR-039.1–.5 | AC-039.1.1–.4 | BR-039.1–.4 | TC-039.1–.6 | §8.4 | W-204 | P2 |
| F-040 | FR-040.1–.4 | AC-040.1.1–.4 | BR-040.1–.4 | TC-040.1–.5 | §8.4 | — | P2 |
| F-041 | FR-041.1–.5 | AC-041.1.1–.4 | BR-041.1–.4 | TC-041.1–.7 | §8.3 | W-205 | P1 |
| F-042 | FR-042.1–.5 | AC-042.1.1–.5 | BR-042.1–.4 | TC-042.1–.6 | §8.3 | — | P2 |
| F-043 | FR-043.1–.5 | AC-043.1.1–.5 | BR-043.1–.5 | TC-043.1–.7 | §8.3 | — | P1 |
| F-070e | FR-070e.1–.5 | AC-070e.1.1–.5 | BR-070e.1–.4 | TC-070e.1–.8 | §7 | W-001 | P0 |
| F-071e | FR-071e.1–.5 | AC-071e.1.1–.4 | BR-071e.1–.3 | TC-071e.1–.6 | §7 | W-206 | P1 |
| F-072e | FR-072e.1–.6 | AC-072e.1.1–.5 | BR-072e.1–.4 | TC-072e.1–.7 | §7 | W-206 | P1 |
| F-090e | FR-090e.1–.4 | AC-090e.1.1–.4 | BR-090e.1–.3 | TC-090e.1–.5 | §9 | — | P1 |
| F-091e | FR-091e.1–.4 | AC-091e.1.1–.4 | BR-091e.1–.3 | TC-091e.1–.5 | §9 | W-201 | P0 |
| F-092e | FR-092e.1–.5 | AC-092e.1.1–.5 | BR-092e.1–.4 | TC-092e.1–.7 | §9 | — | P0 |
| F-094e | FR-094e.1–.5 | AC-094e.1.1–.4 | BR-094e.1–.3 | TC-094e.1–.5 | §9 | — | P1 |
| F-095e | FR-095e.1–.4 | AC-095e.1.1–.4 | BR-095e.1–.3 | TC-095e.1–.5 | §9 | — | P2 |
| F-096e | FR-096e.1–.5 | AC-096e.1.1–.4 | BR-096e.1–.3 | TC-096e.1–.6 | §8.2 | — | P1 |
| F-097e | FR-097e.1–.6 | AC-097e.1.1–.5 | BR-097e.1–.4 | TC-097e.1–.7 | §10 | — | P2 |
