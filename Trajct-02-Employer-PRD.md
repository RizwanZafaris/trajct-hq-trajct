# Product Requirements Document — Trajct **Employer**

> One of three audience-scoped PRDs (Candidate · Employer · Platform/Internal), bound by a shared F-ID spine and
> the Shared Engine Spec (00). Simpaisa-PM-Framework structure, framework refs removed, Trajct domain.

---

## 1. Document control
| Field | Value |
|---|---|
| PRD title | PRD — Trajct Employer (hiring product) |
| PRD ID | PRD-2026-001-E |
| Version | 0.1.0 (Draft) |
| Status | Draft |
| Owner (Product) | Employer PM |
| Sponsor | Founder / CPO |
| Approver | CPO / HoP |
| Reviewers | Eng Lead, Design Lead, Commercial Lead, Compliance PM, CISO delegate |
| Paired FRD | FRD-2026-001-E |
| Depends on | Shared Engine (00); Platform PRD (03) for org auth/billing/RBAC |
| Target launch | Free JD at candidate-MVP launch; paid screening vNext (MENA/APAC-first) |

### 1.1 Revision history
| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-06-03 | Rizwan Zafar | Split from master PRD; employer-scoped |

### 1.2 Sign-off
| Reviewer | Role | Status |
|---|---|---|
| CPO | Final approver | Pending |
| Employer PM | Owner | Pending |
| Eng Lead | Feasibility | Pending |
| Compliance PM | Regulatory (hiring AI) | Pending |
| CISO delegate | Security | Pending |

---

## 2. Problem & opportunity
### 2.1 Problem statement
Hiring has quietly broken for the people who do it. A lean recruiter, a startup founder making their first hires, or
an HR generalist wearing every hat at a small company all face the same wall: they need to find the right person, but
they are not staffed, tooled, or trained like a large enterprise talent team. It starts at the very first step —
writing a job description. A good JD is slow to write and easy to get wrong, and getting it wrong (unclear, biased,
unappealing) poisons the entire funnel before a single application arrives.

Then the applications arrive — and that is where it gets worse. AI has flooded every role with polished, AI-written
résumés that all look excellent and tell the employer almost nothing. The document that was supposed to signal
ability has become noise. Employers cannot tell who is actually good, so they fall back on gut feel and keyword
matching — which is slow, biased, and systematically filters out capable people who simply present poorly on paper.
The result is expensive mis-hires on one side and lost talent on the other, and no employer has a fair, defensible
way to judge what actually matters: whether a person can do the work.

For the lean teams who are Trajct's first customers, the operational burden compounds the judgment problem. Posting
roles, rejecting candidates (and explaining why, defensibly), scheduling interview rounds, tracking who's where —
this busywork consumes their week, and the lightweight, do-it-for-me workflow that would absorb it doesn't exist
because the big ATS platforms are built for enterprises with dedicated recruiters. Meanwhile, every hiring decision
carries growing legal and fairness weight: regulators and candidates increasingly demand that decisions be
explainable, consented, and auditable — and the AI tools entering the market are opaque black boxes that make that
impossible. Worst of all, nothing closes the loop: no system tells an employer which of their past hires actually
succeeded, so they never learn what good looks like.

Trajct's employer product exists to fix this end to end: to help any employer open a role well with a strong, fair JD
for free; to judge real ability instead of paper through substance-based screening that surfaces the capable people
résumés hide; to absorb the repetitive workflow so hiring doesn't eat the week; and to make every decision
explainable, consented, auditable, and — over time — smarter, by learning which hires actually worked.

> **JTBD, in one line:** *When I need to hire, I want to open the role well, judge real ability rather than paper,
> run the process without it consuming me, and decide fairly and defensibly, so I hire the right person fast — today
> I can't, because résumés have become noise, I have no fair way to assess ability, and the workflow and tooling
> assume a big recruiting team I don't have.*

### 2.1.5 Coverage check — every employer feature maps to the problem
> The problem statement spans four jobs the product must do: **open the role well (attract)**, **judge real ability
> (screen)**, **run the hire (workflow)**, and **hire fairly & learn (trust + improvement)**. Every feature traces to one.
| Cluster | Job | Features |
|---|---|---|
| E-A Open the role | Attract | F-030, F-031, F-032, F-033 |
| E-B Judge ability | Screen | F-034, F-035, F-036, F-042 |
| E-C Run the hire | Workflow | F-037, F-038, F-041, F-043, F-090e, F-096e |
| E-D Hire fairly + learn | Trust + improve | F-039, F-040, F-094e, F-095e, F-097e, F-092e |
| Cross-cutting | Access | F-070e, F-071e, F-072e, F-091e |
> Result: no orphan features — every employer feature serves a stated cluster.

### 2.2 Evidence
| Evidence | Source |
|---|---|
| AI résumé flood makes paper an unreliable signal | Market shift |
| Capable candidates with weak résumés get filtered out (lost talent) | Persona interviews |
| Lean teams (SME/startup/agency) lack structured assessment | Segment research |
| Referral/screening shift as employers cut cost-per-hire | Hiring data |

### 2.3 Size of opportunity
| Dimension | Value | Basis |
|---|---|---|
| Addressable | SMEs, startups, agencies first; enterprises later | Segment |
| Revenue | Usage-based screening/interviews; JD free (lead magnet) | Two-sided model |
| Strategic | Employer signals feed the moat + give candidates portable proof | Founder |

### 2.4 Why now
AI résumé flood raises the value of substance-based screening; MENA/APAC lacks EU-AI-Act-style restrictions → launch window.

### 2.5 Cost of inaction
Without an honest screening layer, employers stay stuck with résumé roulette; the candidate-supply flywheel goes unmonetized.

---

## 3. Target users & personas (employer side)
### 3.1 Primary persona
| Field | Value |
|---|---|
| Name | Reem — lean recruiter |
| Context | SME/startup/agency; no big ATS; drowning in AI résumés |
| Goals | Fill roles fast with real signal; bias-free shortlist |
| Frustrations | Can't tell who's good from paper |
| Tech fluency | Medium (●●○); in hiring tools daily |
| Success metric | Time-to-quality-shortlist |

### 3.2 Secondary personas
- **Omar** — non-HR hiring manager → substance-ranked shortlist, low jargon.
- **Yusuf** — startup founder, first hires → radically self-serve.
- **Nadia** — SME HR generalist, no time → automate post/reject/schedule.
- **Ahmed** — high-volume agency → bulk screening + why-rejected reasons.
- **Grace** — TA lead → analytics, collaboration, scorecards.
- **Sofia** — DEI/compliance lead → explainable, consented, auditable.

### 3.3 Anti-personas
- Employers wanting opaque, un-auditable auto-reject (against fairness/compliance).
- Tier-3 one-off hirers who only use free JD (fine — funnel).

### 3.4 Journey — current
Post → résumé flood → gut-screen → slow, biased, expensive mis-hires.
### 3.5 Journey — future
Free JD → match → screen (substance) → hire → success signal → better matching next time.

---

## 4. Strategic context
### 4.1 North Star
| North Star | How this PRD moves it |
|---|---|
| Successful outcomes per cycle | Successful hires per employer + time-to-quality-shortlist↓ |

### 4.2 OKR linkage
| Objective | KR | Contribution |
|---|---|---|
| Monetize the employer side | Free-JD → paid-screening conversion | Free JD front door → paid screening |
| Differentiate on substance | Hidden-gem surfaced rate | Substance-based assessment |

### 4.3 Competitive context
| Competitor | Approach | Gap we exploit |
|---|---|---|
| Greenhouse/Lever/Ashby | ATS workflow | No AI assessment; no candidate side; no brain |
| HireVue | AI screening | Single-sided; no candidate flywheel feeding it |
| LinkedIn Recruiter | Sourcing | No substance assessment; expensive |

### 4.4 Strategic bets
- Free JD writing creates a real employer pipeline into paid screening.
- Employers will pay for *substance over paper* (assessment), not keyword matching.
- MENA/APAC-first lets assessment launch before regulation forces a compliance program.

---

## 5. Goals, non-goals & success metrics
### 5.1 Goals
- **G1** Active free-JD employers convert to paid screening.
- **G2** Screening surfaces real ability (incl. the hidden gem) faster than résumé review.
- **G3** Every paid employer account margin-positive.

### 5.2 Non-goals
- No automated reject without human confirm. No EU/US screening launch first. No full enterprise ATS in early releases.

### 5.3 Success metrics
| ID | Metric | Type | @30d | @90d | Source |
|---|---|---|---|---|---|
| ME-1 | Active free-JD employers | Output | baseline | ↑ | Analytics |
| ME-2 | Free-JD → paid-screening conversion | Output | — | trend↑ | Billing |
| ME-3 | Time-to-quality-shortlist | Output | baseline | ↓ | Product |
| ME-4 | Hidden-gem surfaced rate | Output | — | ↑ | Screening |
| ME-5 | Screening fairness / bias parity | Guardrail | within band | within band | Bias metrics |
| ME-6 | Assessments missing rationale/consent | Guardrail | 0 | 0 | Audit log |

### 5.4 Learning goals
- Will lean employers trust AI screening enough to pay? Which assessment format predicts success best? Does why-rejected reduce candidate complaints?

---

## 6. Solution approach
### 6.1 Summary
Free AI JD writing is the employer front door (lead magnet + data source). Paid, substance-based screening
(AI interview + skills assessment) judges demonstrated ability — surfacing the hidden gem and sorting the résumé
flood — with explainability, consent, and human-in-the-loop. A lean hiring workflow holds results; analytics show
what works. Launch screening MENA/APAC-first, built compliance-ready.

### 6.2 Alternatives considered
| Alternative | Why not |
|---|---|
| Résumé-ranking only | The keyword matching we're trying to move beyond |
| Full enterprise ATS | Too heavy; not the differentiator; cold-start |
| Launch screening in EU/US | Regulatory burden too high pre-revenue |

### 6.3 Conceptual model
The **employer flywheel**: JD → Attract → Screen → Hire → Succeed → better matching, fed by (and feeding) the shared
engine. Hub value: **truth over paper** (find ability under the polish).

### 6.4 Design principles
Radically self-serve + low-jargon (most users aren't recruiters) · substance over paper · explainable + consented +
human-decides · bulk-first for high-volume · respectful, accessible candidate screening experience.

---

## 7. Feature catalog (employer) — PRD ↔ FRD bridge
| F-ID | Feature | Rationale | Persona | Pri | Release | FRD ref |
|---|---|---|---|---|---|---|
| F-030 | AI JD generation + optimization (free) | Front door / lead magnet | Reem/Yusuf | P0 | v1.0 | §4.30 |
| F-031 | JD skill analysis + inclusivity review | Better, fairer JDs | Sofia | P1 | v1.1 | §4.31 |
| F-032 | AI candidate matching + ranking | Right people surfaced | Reem | P1 | vNext | §4.32 |
| F-033 | Passive candidate discovery | Find non-applicants | Grace | P2 | vNext | §4.33 |
| F-034 | Screening — AI interview + skills assessment | Substance over paper (paid) | Reem | P0¹ | vNext | §4.34 |
| F-035 | "Hidden gem" surfacing | Ability under poor résumés | Reem | P1 | vNext | §4.35 |
| F-036 | Why-rejected reason per candidate | Defensible rejections | Ahmed | P1 | vNext | §4.36 |
| F-037 | Lean HR automation (post/bulk-reject/schedule) | Remove busywork | Nadia | P1 | vNext | §4.37 |
| F-038 | Hiring workflow (pipeline, scorecards, collab) | Hold results, decide together | Grace | P1 | vNext | §4.38 |
| F-039 | Recruiting analytics (TTH, CPH, quality, funnel) | See what works | Grace | P2 | vNext | §4.39 |
| F-040 | Post-hire success check-in | Ground-truth on success | — | P2 | vNext | §4.40 |
| F-041 | Interview scheduling (calendar sync, self-schedule, rounds) | Coordinate rounds without chaos | Nadia | P1 | vNext | §4.41 |
| F-042 | Automated reference checking | Verify ability beyond the interview | Reem | P2 | vNext | §4.42 |
| F-043 | Employer↔candidate messaging (employer side) | In-platform comms | all | P1 | vNext | §4.43 |
| F-070e | Employer org sign-up / sign-in | Org accounts | all | P0 | v1.0 | §4.70 |
| F-071e | SSO (SAML/OIDC) for orgs | Enterprise login | Grace | P1 | v1.1 | §4.71 |
| F-072e | Org RBAC + seat management | Recruiter roles | Reem | P1 | v1.1 | §4.72 |
| F-090e | Employer notifications | New-candidate / stage alerts | all | P1 | v1.1 | §4.90 |
| F-091e | Employer onboarding | First JD in one session | all | P0 | v1.0 | §4.91 |
| F-092e | Employer verification (anti-abuse) | Block fake employers harvesting data | all | P0 | v1.0 | §4.92 |
| F-094e | Appeal / dispute handling (employer view) | Respond to candidate appeals | Sofia | P1 | vNext | §4.94 |
| F-095e | Employer reputation / reviews | Two-sided trust | all | P2 | vNext | §4.95 |
| F-096e | Candidate search & filtering | Find candidates | Reem | P1 | vNext | §4.96 |
| F-097e | Integrations / API / webhooks (HRIS/ATS) | Push hires out; stickiness | Grace | P2 | vNext | §4.97 |

**Shared dependencies (Engine 00):** F-051 loop, F-052 persona synthesis, F-053 enrichment, F-057 AI layer,
F-060 trust wall (enforces candidate-private data never reaches employers).
¹ P0 *within the employer-paid release* (vNext), region-gated MENA/APAC, compliance-ready.

---

## 8. Feature details (business view) — flagship exemplars
### 8.1 F-030 — AI JD generation (free front door)
**8.1.1 Problem** — Reem/Yusuf/Nadia need a strong JD fast, aren't experts, have no process.
**8.1.2 UX** — Minimal input (role, level, must-haves) → clean optimized JD in minutes; free forever; the relief win that gets employers in and generates JD data for matching.
**8.1.3 Stories** — As a lean recruiter, I want a strong JD in minutes so I can post today.
**8.1.4 Success** — ME-1 active free-JD employers; ME-2 conversion.
**8.1.5 Dependencies** — Engine F-057 AI layer; Platform F-070e org accounts; spend cap on free tier.
**8.1.6 Out of scope** — Paid screening (F-034, vNext).
**8.1.7 Open Qs** — Range-based salary hints only (no comp DB) — sufficient?

### 8.2 F-034 — Screening (AI interview + skills assessment)
**8.2.1 Problem** — Employers can't tell real ability from polished résumés; capable-but-poorly-presented people get lost.
**8.2.2 UX** — Invite candidates to a combined AI interview + skills assessment; results scored on demonstrated ability with explainable evidence + consent record; a human confirms every advance/reject; hidden gems flagged.
**8.2.3 Stories** — As Reem, I want a substance-ranked shortlist with evidence so I trust who to interview. As Sofia, I want every decision explainable and consented.
**8.2.4 Success** — ME-3 time-to-shortlist↓, ME-4 hidden-gem rate, ME-5 fairness, ME-6 rationale/consent=0 missing.
**8.2.5 Dependencies** — Engine F-051/F-052; Platform billing/usage; voice/video infra; compliance tooling (Platform F-080).
**8.2.6 Out of scope** — Fully automated reject; EU/US launch.
**8.2.7 Open Qs** — Which assessment format best predicts on-the-job success? Verification depth before screening counts?

> *(Remaining employer feature blocks follow this structure; the FRD expands each.)*

---

## 9. Prioritization & phasing
### 9.1 RICE (illustrative)
| Feature | Reach | Impact | Conf | Effort | Rank |
|---|---|---|---|---|---|
| F-030 | high | 3 | 0.9 | 1 | 1 |
| F-034 | med | 3 | 0.7 | 5 | 2 |
| F-037 | med | 3 | 0.75 | 3 | 3 |

### 9.2 Release phasing
| Release | Employer features |
|---|---|
| v1.0 (MVP) | F-030 (free JD), F-070e, F-091e, F-092e |
| v1.1 | F-031, F-071e, F-072e, F-090e |
| vNext (MENA/APAC, compliance-ready) | F-032..040, F-094e, F-095e, F-096e, F-097e |

### 9.3 MVP cut-line rationale
Employer MVP is *only* the free JD front door + org accounts + onboarding + anti-abuse. The paid screening stack
is vNext — it depends on candidate flow and revenue, and on the compliance-ready build. **If the program is late,
the screening stack is what's cut first.**

---

## 10. Commercial & pricing (employer)
| Tier | Price | Features | Segment |
|---|---|---|---|
| Free | $0 | JD writing | All employers (funnel) |
| Usage | per-action | Screening, interviews | Reem/Nadia/Grace |
| Org / seats | subscription (later) | ATS + analytics bundle | Scaling teams |

GTM: free JD as lead magnet → direct/founder sales → recruiter communities & agency partnerships.

---

## 11. Risks & mitigations (employer)
| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| RE-1 | Lean employers won't trust AI screening | M | H | Start free JD; explainability; human-in-loop; case studies |
| RE-2 | Screening bias recreates the problem we fight | M | H | Substance design; bias metrics; audit hooks; human-decides |
| RE-3 | Regulatory shift (EU/US hiring AI) | M | M | MENA/APAC-first; compliance-ready = config flip |
| RE-4 | Fake employers harvest candidate data | M | H | Employer verification (F-092e); trust wall; rate limits |
| RE-5 | No candidate supply → screening has nothing to rank | M | H | Candidate-MVP first builds the supply flywheel |

---

## 12. Dependencies & cross-PRD asks
| Dependency | From | Need |
|---|---|---|
| Shared engine | Engine 00 | Matching, persona synthesis, AI layer, trust wall |
| Org auth/billing/RBAC | Platform 03 | Org accounts, usage billing, seats |
| Candidate supply | Candidate PRD 01 | The people the employer product ranks/screens |
| Voice/video infra | external | AI interview runtime (vNext) |

---

## 13. Compliance, security & privacy (employer view)
| Item | Answer |
|---|---|
| Regulations | Hiring-AI rules (avoided at launch via MENA/APAC), employment law, data protection |
| Personal data | Employer org data; (screening) consented candidate assessment data only — no biometric storage |
| Consent | Candidate consents to screening/recording before it runs |
| Decisions | Every automated assessment logged with rationale + consent; human confirms advance/reject |
| Security review | Yes — trust wall, isolation, threat model |

---

## 14. Operational readiness (employer view)
| Item | Answer |
|---|---|
| Support | Employer onboarding + screening support macros |
| Dashboards | Employer funnel, screening quality, fairness |
| On-call | AI-interview path (vNext) |

---

## 15. Launch plan (employer)
Free JD ships with the candidate MVP. Paid screening = separate vNext launch, MENA/APAC-first, behind its own flag,
private→public→GA. Kill-switch: bias-metric breach = screening flag off; consent/rationale gap = halt; data-wall breach = rollback.

---

## 16. Open questions
| # | Q | Owner | Status |
|---|---|---|---|
| 1 | Employer verification depth (anti-abuse) | Trust & Safety | Open |
| 2 | Which assessment format predicts success best | Employer PM | Open |
| 3 | Pricing model for screening (per-candidate vs per-seat) | PM + Finance | Open |

---

## 17. Traceability (employer head)
| F-ID | Goal | Metric | PRD §8 | FRD §4 | Pri | Release |
|---|---|---|---|---|---|---|
| F-030 | G1 | ME-1,2 | §8.1 | §4.30 | P0 | v1.0 |
| F-034 | G2 | ME-3,4,5 | §8.2 | §4.34 | P0¹ | vNext |
| F-092e | G3 | RE-4 | — | §4.92 | P0 | v1.0 |

---

## 18. Appendices
**Related:** Shared Engine (00) · Candidate PRD (01) · Platform PRD (03) · BRD · Vision · Flywheel · Coverage Matrix.
**Glossary (employer-specific):** *Screening* = AI interview + skills assessment scoring demonstrated ability ·
*Hidden gem* = candidate strong on ability, weak on résumé · *Why-rejected* = defensible, explainable rejection reason.

---
*PRD-2026-001-E v0.1.0 — Employer. Bound to Engine 00 + Platform 03 + Candidate 01 by shared F-IDs.*
