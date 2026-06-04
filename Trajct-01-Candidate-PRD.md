# Product Requirements Document — Trajct **Candidate**

> One of three audience-scoped PRDs (Candidate · Employer · Platform/Internal), bound by a shared F-ID spine
> and the Shared Engine Spec (00). Simpaisa-PM-Framework structure, framework refs removed, Trajct domain.

---

## 1. Document control
| Field | Value |
|---|---|
| PRD title | PRD — Trajct Candidate (job-seeker product) |
| PRD ID | PRD-2026-001-C |
| Version | 0.1.0 (Draft) |
| Status | Draft |
| Owner (Product) | Candidate PM |
| Sponsor | Founder / CPO |
| Approver | CPO (strategic) / HoP (tactical) |
| Reviewers | Eng Lead, Design Lead, Commercial Lead, Compliance PM |
| Paired FRD | FRD-2026-001-C |
| Depends on | Shared Engine Spec (00); Platform PRD (03) for auth/billing/notifications |
| Target launch | Candidate MVP (pilot, ~3 months) |

### 1.1 Revision history
| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-06-03 | Rizwan Zafar | Split from master PRD; candidate-scoped |

### 1.2 Sign-off
| Reviewer | Role | Status |
|---|---|---|
| CPO | Final approver | Pending |
| Candidate PM | Owner | Pending |
| Eng Lead | Feasibility | Pending |
| Design Lead | UX | Pending |
| Compliance PM | Regulatory | Pending |

---

## 2. Problem & opportunity
### 2.1 Problem statement
For most people, looking for a job is a demoralizing black box. They send application after application into the
void and hear nothing back — no feedback, no reason, no idea whether the problem is their résumé, their experience,
the company, or simple bad luck. The rise of AI has made this worse, not better: everyone now has a polished,
AI-written résumé, so the document that was supposed to represent a person has become noise that gets filtered on
keywords. The people who suffer most are often the most capable — those with a career gap, those changing fields,
those relocating, or those who are simply great at the work but poor at selling themselves on paper. They get
rejected before a human ever considers them, and they never learn why.

Even when a candidate does land a real opportunity, the system keeps failing them. Generic interview advice doesn't
fit the specific company they're meeting; they walk in under-prepared because no tool tells them what *this* employer
actually asks and values. After applying, they lose momentum — follow-ups go unsent, offers arrive without context,
and negotiation happens blind. And the strongest path into a company — a warm introduction from someone in their own
network — sits unused, because mapping that network to a target company by hand is too much work.

There is also a quieter, larger population the market ignores entirely: people who are *employed and content but open
to something better*. They will never refresh a job board, yet they would move for the right role at the right
moment. No tool watches the market on their behalf, tracks whether their compensation has fallen behind, or tells
them — and only them — when a genuinely better-fit opportunity appears. For them, the absence of an always-on,
low-effort companion means the best opportunities pass by unseen.

Underlying all of this is a single missing capability: nothing learns. No tool connects what actually happened — who
got the interview, who got the offer, who got hired — back to the advice that produced it, so candidates repeat the
same mistakes and the system never gets smarter. Trajct's candidate product exists to close every part of this gap:
to tell people the honest truth about why they're not getting hired and fix it; to prepare them for the specific role
and carry them to an offer; to position those whose résumé doesn't capture their real value and connect them to the
right people; to watch the market quietly for those who aren't actively searching; and to learn from every outcome so
the next attempt is better than the last.

> **JTBD, in one line:** *When I want a better job — whether I'm stuck, actively searching, or quietly open — I want
> to know the honest truth about my candidacy, be prepared and positioned to win the right role, and never miss the
> right opportunity, so I land a job that fits me — today I can't, because the system is an unaccountable black box
> that judges paper over substance and never learns.*

### 2.1.5 Coverage check — every candidate feature maps to the problem
> The problem statement spans four jobs the product must do: **get unstuck**, **win the specific role**, **stay ahead
> without searching**, and **be seen for who you really are**. Every feature traces to one of them.
| Cluster | Job | Features |
|---|---|---|
| C-A Get unstuck | Diagnose + fix | F-001, F-002, F-003, F-004, F-005, F-006 |
| C-B Win the role | Prepare + convert | F-007, F-008, F-009, F-010, F-020, F-021, F-022, F-026 |
| C-C Stay ahead | Passive / always-on | F-015, F-016, F-017, F-018, F-096c |
| C-D Be seen | Positioning + network | F-011, F-012, F-013, F-014, F-019, F-023, F-024, F-025 |
| Cross-cutting | Access + trust + support | F-027, F-090c, F-091c, F-093c, F-098c, F-099c, F-100c, F-101c |
> Result: no orphan features — every candidate feature serves a stated cluster.

### 2.2 Evidence
| Evidence | Source |
|---|---|
| Candidates' #1 frustration is silence — no feedback on rejections | Persona interviews |
| AI-written résumés are now indistinguishable; tailoring alone no longer differentiates a candidate | Market shift |
| Warm intros materially raise callback odds; most candidates don't use their network | Hiring data |
| jobHunt already demonstrates honest diagnosis + tailoring + outcome learning | Codebase |

### 2.3 Size of opportunity
| Dimension | Value | Basis |
|---|---|---|
| Addressable | ~2–4M reachable tech job-seekers/yr (English markets) | Labor data |
| Revenue | Candidate Pro ~$29/mo (A/B $39) | Subscription |
| Strategic | Candidate outcomes feed the moat that powers the employer side | Founder |

### 2.4 Why now
AI commoditized résumé generation → honesty + outcome-learning are the only durable candidate differentiators.

### 2.5 Cost of inaction
The loop's data lead compounds; a late start = a permanent moat deficit. Commodity tools win the undifferentiated market.

---

## 3. Target users & personas (candidate side)
### 3.1 Primary persona
| Field | Value |
|---|---|
| Name | Maya — stalled mid-career switcher |
| Context | Employed, ~8 yrs tech, has target companies, time-poor, skeptical |
| Goals | Better role without full-time hunting; alerted when something better appears |
| Frustrations | Applications vanish; doesn't know why |
| Tech fluency | High (●●●), uses platforms weekly |
| Success metric | Interviews landed |

### 3.2 Secondary personas
- **David** — laid-off (anxious, urgent) → gentle tone, fast value, prominent trial.
- **Priya** — fresher (thin network, mobile) → first-résumé help, norms education.
- **Sara** — happily-employed passive looker → passive monitoring, alert quality.
- **Tariq** — dissatisfied + relocation → location/visa filtering.
- **Khalid** — returner/career-gap → gap-framing.
- **Lena** — industry career-changer → skill-translation.
- **The hidden gem** — capable, poor on paper → substance over polish (served via employer screening).

### 3.3 Anti-personas
- Mass-auto-apply seekers (against quality principle).
- Live-interview cheaters (against integrity principle).

### 3.4 Journey — current
Apply blindly → silence → no feedback → repeat → demoralized.
### 3.5 Journey — future
Diagnose → fix → prepare → monitor → convert → log outcome → advice improves.

---

## 4. Strategic context
### 4.1 North Star alignment
| North Star | How this PRD moves it |
|---|---|
| Successful outcomes per cycle | Interviews landed per active candidate, improving as the loop learns |

### 4.2 OKR linkage
| Objective | KR | Contribution |
|---|---|---|
| Billable candidate product | First paying candidates | Ships diagnosis→fix→monitor |
| Prove the moat | Advice-quality lift over time | Captures + learns from outcomes |

### 4.3 Competitive context
| Competitor | Approach | Gap we exploit |
|---|---|---|
| Teal/Rezi/Kickresume | Résumé tools | No honesty, no loop, no monitoring |
| Jobright | Match + auto-apply | Volume over quality; shallow referrals |
| Final Round | Interview copilot | Interview-only; no diagnosis/monitoring |

### 4.4 Strategic bets
- Candidates pay for *honesty* over *another résumé tool*.
- Passive monitoring converts a 3-month tool into a multi-year companion (fixes LTV).

---

## 5. Goals, non-goals & success metrics
### 5.1 Goals
- **G1** Measurably more interviews for active candidates.
- **G2** Diagnosis→fix paid conversion meets target.
- **G3** Between-search retention via monitoring (career-companion LTV).

### 5.2 Non-goals
- No auto-apply. No live-interview help. No employer features (separate PRD).

### 5.3 Success metrics
| ID | Metric | Type | @30d | @90d | Source |
|---|---|---|---|---|---|
| MC-1 | Visitor → completed diagnosis | Output | 50% | 60% | Analytics |
| MC-2 | Diagnosis → paid conversion | Output | 5% | 8% | Billing |
| MC-3 | Between-search retention (hired users) | Output | baseline | ↑ | Cohorts |
| MC-4 | Interviews landed / active candidate | Output | baseline | ↑ | Outcome log |
| MC-5 | Alert relevance (engaged / sent) | Guardrail | ≥40% | ≥55% | Analytics |
| MC-6 | Fabrication rate in candidate output | Guardrail | <1% | ~0 | Eval (engine) |

### 5.4 Learning goals
- Diagnostic-led vs résumé-led framing (A/B). Price $29 vs $39 (A/B). Alert cadence that retains vs annoys.

---

## 6. Solution approach
### 6.1 Summary
A candidate career-companion: honest diagnostic (hook) → per-company tailored fix → company-specific prep →
passive monitoring (retention) → late-funnel conversion (follow-up/offer) → outcome logging that feeds the engine.
Chosen over a plain résumé tool because honesty + the loop are the only durable differentiators.

### 6.2 Alternatives considered
| Alternative | Why not |
|---|---|
| Plain résumé builder | Commoditized; short LTV |
| Bulk auto-apply | Against principle; erodes trust |

### 6.3 Conceptual model
The **candidate flywheel**: Diagnose → Prepare → Monitor → Convert → Outcome → Improve, feeding (and fed by) the
shared engine. Hub value: **truth over paper.**

### 6.4 Design principles
Honest never harsh (tone adapts to emotional state) · explainable everywhere · instrument the loop from day one ·
first win in 60 seconds · accessible + mobile-first.

---

## 7. Feature catalog (candidate) — PRD ↔ FRD bridge
| F-ID | Feature | Rationale | Persona | Pri | Release | FRD ref |
|---|---|---|---|---|---|---|
| F-001 | Honest diagnostic + fit/ATS score | The hook | Maya | P0 | v1.0 | §4.1 |
| F-002 | Per-company tailored résumé/cover letter | The paid fix | Maya | P0 | v1.0 | §4.2 |
| F-003 | Career profile builder | Substrate | Maya | P0 | v1.0 | §4.3 |
| F-004 | Chat-driven résumé editing | No manual editing | Maya | P0 | v1.0 | §4.4 |
| F-005 | Rate any job by URL/JD | Score jobs found anywhere | Maya | P0 | v1.0 | §4.5 |
| F-006 | Résumé editor: templates/parse/export | Multiple versions | Maya | P1 | v1.1 | §4.6 |
| F-007 | Company-specific interview prep | Know the room | Maya | P0 | v1.0 | §4.7 |
| F-008 | Mock interviews (voice/video) | Rehearse | Maya | P1 | v1.1 | §4.8 |
| F-009 | Live interview tutor (chat) | Ask anything | Maya | P1 | v1.1 | §4.9 |
| F-010 | STAR story bank → JD mapping | Reusable evidence | Maya | P1 | v1.1 | §4.10 |
| F-011 | LinkedIn profile optimization | Profile works hard | Maya | P1 | v1.1 | §4.11 |
| F-012 | LinkedIn post generation + scheduling | Build presence | Maya | P1 | v1.1 | §4.12 |
| F-013 | Outreach drafting + networking tracking | Warm > cold | Maya | P1 | v1.1 | §4.13 |
| F-014 | Warm-intro / people-at-targets graph | Shortest referral | Maya | P1 | v1.1 | §4.14 |
| F-015 | Passive target-company monitoring + alerts | Retention engine | Sara | P0 | v1.0 | §4.15 |
| F-016 | Salary / market-value tracking | Know your worth | Maya | P1 | v1.1 | §4.16 |
| F-017 | Skill-gap + learning path | Close the gap | Lena | P2 | v1.1 | §4.17 |
| F-018 | Application tracker + analytics | Manage the search | Maya | P1 | v1.1 | §4.18 |
| F-019 | Proof-point / achievement library | Reusable wins | Maya | P1 | v1.1 | §4.19 |
| F-020 | Follow-up cadence drafts | Keep convo alive | David | P1 | v1.1 | §4.20 |
| F-021 | Application form-assist (HITL) | Cited answers | David | P1 | v1.1 | §4.21 |
| F-022 | Offer evaluation + negotiation | Right decision | Maya | P1 | v1.1 | §4.22 |
| F-023 | Relocation / location & visa signals | Relocation seekers | Tariq | P2 | v1.1 | §4.23 |
| F-024 | Gap-framing & skill-translation | Returners/changers | Khalid | P2 | v1.1 | §4.24 |
| F-025 | Portfolio / work-samples builder | Prove ability when résumé is weak (substance) | hidden gem/Priya | P1 | v1.1 | §4.25 |
| F-026 | Candidate interview scheduling / calendar | Juggle multiple rounds without chaos | David/Maya | P1 | v1.1 | §4.26 |
| F-027 | Career coach / encouragement surface | Support for anxious/laid-off users | David | P2 | v1.1 | §4.27 |
| F-090c | Candidate notifications & preferences | Alerts/digest | all | P0 | v1.0 | §4.90 |
| F-091c | Candidate onboarding / first-run | Activation | all | P0 | v1.0 | §4.91 |
| F-093c | Data portability / delete-my-data | Trust + legal right | all | P0 | v1.0 | §4.93 |
| F-096c | Job search & filtering | Discovery | all | P1 | v1.1 | §4.96 |
| F-098c | Localization (Arabic + MENA/APAC) | Launch geography | all | P1 | v1.1 | §4.98 |
| F-099c | Invite / referral loop | Virality | all | P2 | v1.1 | §4.99 |
| F-100c | Help center / in-product help | Self-serve support | all | P1 | v1.1 | §4.100 |
| F-101c | Employer↔candidate messaging (candidate side) | In-platform comms | all | P1 | vNext | §4.101 |

**Shared dependencies (specced in Engine 00):** F-050 outcome logging, F-051 loop, F-052 persona synthesis,
F-055 voice, F-057 AI layer, F-058 discovery, F-059 legitimacy filter, F-060 trust wall.

---

## 8. Feature details (business view) — flagship exemplars
### 8.1 F-001 — Honest diagnostic
**8.1.1 Problem** — "Every application disappears and I have no idea why." Candidates can't improve without knowing what's wrong.
**8.1.2 UX** — Paste résumé + target role (no wall) → seconds later: fit/ATS score + "5 reasons you're ghosted," worst highlighted, each specific+fixable+evidenced → CTA to the paid fix. Tone adapts by persona.
**8.1.3 Stories** — As a candidate, I want the honest reasons I'm ignored, so I can fix them. As David, I want it as an action plan, not a verdict.
**8.1.4 Success** — MC-1 activation, MC-2 conversion, non-obvious specificity (override rate).
**8.1.5 Dependencies** — Engine F-052 persona, F-057 AI layer, F-003 profile.
**8.1.6 Out of scope** — Auto-apply; live help.
**8.1.7 Open Qs** — Diagnostic-led vs résumé-led (A/B); harshness ceiling for laid-off.

### 8.2 F-015 — Passive monitoring + alerts
**8.2.1 Problem** — Sara/Maya won't refresh job boards but will keep a tool that watches for them.
**8.2.2 UX** — Set targets once → loop-personalized alerts when a fitting role opens, each explaining *why* it fits. Rare, relevant, snoozable.
**8.2.3 Success** — MC-3 retention, MC-5 alert relevance.
**8.2.4 Dependencies** — Engine F-058 discovery, F-059 legitimacy, F-051 loop; F-090c notifications.
**8.2.5 Out of scope** — Auto-apply on alerts.

> *(F-002…F-099c follow the same block structure; the FRD expands each.)*

---

## 9. Prioritization & phasing
### 9.1 RICE (illustrative)
| Feature | Reach | Impact | Conf | Effort | Rank |
|---|---|---|---|---|---|
| F-001 | high | 3 | 0.9 | 2 | 1 |
| F-015 | high | 3 | 0.85 | 2 | 2 |
| F-002 | high | 3 | 0.85 | 3 | 3 |

### 9.2 Release phasing
| Release | Candidate features |
|---|---|
| v1.0 (MVP) | F-001..005, F-007, F-015, F-090c, F-091c, F-093c (+ engine P0) |
| v1.1 | F-006, F-008..014, F-016, F-018..024, F-096c, F-098c, F-099c |
| vNext | depth + integrations |

### 9.3 MVP cut-line rationale
MVP = diagnose→fix→prepare→monitor→log, plus onboarding/notifications/data-rights. Smallest set that delivers a
real win and instruments the moat. If late, cut V1 depth features, never the diagnostic or monitoring.

---

## 10. Commercial & pricing (candidate)
| Tier | Price | Features | Segment |
|---|---|---|---|
| Free | $0 | Diagnosis, limited monitoring | Funnel |
| Pro | $29/mo (A/B $39) | Full lifecycle | Maya/David |

GTM: SEO ("why am I getting ghosted"), free diagnosis as viral hook, communities, invite loop (F-099c).

---

## 11. Risks & mitigations (candidate)
| ID | Risk | L | I | Mitigation |
|---|---|---|---|---|
| RC-1 | Diagnosis feels harsh → churn (esp. David) | M | H | Tone adapts; action-plan framing; trial-first |
| RC-2 | Alert irrelevance trains users to ignore | M | M | Loop-personalized; quality bar; snooze |
| RC-3 | Short LTV (hired = churned) | M | H | Passive monitoring → career-companion |
| RC-4 | Fabricated résumé content | L | H | Engine groundedness/eval; cite-markers |

---

## 12. Dependencies & cross-PRD asks
| Dependency | From | Need |
|---|---|---|
| Shared engine | Engine 00 | Loop, persona synthesis, AI layer, discovery, trust wall |
| Auth/billing/notifications | Platform 03 | Sign-up, payments, notification infra |
| Trust wall | Engine 00 | Candidate data never reaches employers |

---

## 13. Compliance, security & privacy (candidate view)
| Item | Answer |
|---|---|
| Personal data collected | Résumés, profiles, outcomes, (consented) network data |
| Retention/rights | User-controlled export + delete (F-093c) |
| Consent | Network-import consent; no scraping |
| Region | Localized + residency-aware |

---

## 14. Operational readiness (candidate view)
| Item | Answer |
|---|---|
| Support tooling | Account view + impersonation (Platform) for diagnosis/billing issues |
| Dashboards | Candidate activation/retention (product analytics) |

---

## 15. Launch plan (candidate)
Private beta (diagnosis) → public beta → GA, % rollout. Milestones: real users + 0 P0 + trust-wall verified → activation/conversion trending → GA.
Kill-switch: fabrication spike = flag off; data-wall breach = rollback.

---

## 16. Open questions
| # | Q | Owner | Status |
|---|---|---|---|
| 1 | Diagnostic-led vs résumé-led hook | PM | A/B at launch |
| 2 | $29 vs $39 | PM | A/B |
| 3 | Acquisition channel for first cohort | PM | Open |

---

## 17. Traceability (candidate head)
| F-ID | Goal | Metric | PRD §8 | FRD §4 | Pri | Release |
|---|---|---|---|---|---|---|
| F-001 | G1 | MC-1,2 | §8.1 | §4.1 | P0 | v1.0 |
| F-015 | G3 | MC-3,5 | §8.2 | §4.15 | P0 | v1.0 |
| F-002 | G2 | MC-2 | — | §4.2 | P0 | v1.0 |

---

## 18. Appendices
**Related:** Shared Engine (00) · Employer PRD (02) · Platform PRD (03) · BRD · Vision · Flywheel · Coverage Matrix.
**Glossary (candidate-specific):** *Diagnosis* = the honest "why you're ghosted" output · *Monitor* = passive
target-company watching · *Convert* = late-funnel (follow-up/offer) help.

---
*PRD-2026-001-C v0.1.0 — Candidate. Bound to Engine 00 + Platform 03 by shared F-IDs.*
