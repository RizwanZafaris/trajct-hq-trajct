# Product Requirements Document — Trajct

> Two-sided AI hiring & career-acceleration platform. PRD written in the Simpaisa-PM-Framework structure
> (framework-specific T## references removed), adapted to Trajct's hiring/career domain.

---

## 1. Document control

| Field | Value |
|---|---|
| PRD title | PRD — Trajct (AI Hiring & Career Platform) |
| PRD ID | PRD-2026-001 |
| Version | 0.1.0 (Draft) |
| Status | Draft |
| Owner (Product) | Rizwan Zafar, Founder/PM |
| Sponsor / Exec owner | Founder / CPO |
| Approver | CPO (strategic) / Head of Product (tactical) |
| Reviewers | Engineering Lead, Design Lead, Commercial Lead, Ops Lead, Security/CISO delegate, Compliance PM, Finance |
| Paired FRD | FRD-2026-001 |
| Foundation | jobHunt (live single-user system) |
| Target launch | Pilot in ~3 months (candidate MVP + free employer JD) |
| Epic | TRAJCT-0001 |

### 1.1 Revision history
| Version | Date | Author | Summary of change |
|---|---|---|---|
| 0.1.0 | 2026-06-03 | Rizwan Zafar | Initial draft in framework template; full feature catalog (~78), incl. senior-PM gap features |

### 1.2 Sign-off
| Reviewer | Role | Status |
|---|---|---|
| CPO | Final approver | Pending |
| PM | Product owner | Pending |
| Eng Lead | Engineering feasibility | Pending |
| Design Lead | UX viability | Pending |
| Commercial Lead | Business case | Pending |
| Security delegate | Security viability | Pending |
| Compliance PM | Regulatory viability | Pending |

---

## 2. Problem & opportunity

### 2.1 Problem statement (JTBD)
**Candidate:** *When I am job-hunting and getting ignored, I want to know the honest truth about why and fix it, so I can land the right role — today I can't, because no tool tells me what's actually wrong; they only flatter me.*

**Employer:** *When I'm hiring and drowning in AI-written resumes, I want to find people who can actually do the work, so I can hire well fast — today I can't, because resumes have become noise and I have no fair way to judge real ability.*

### 2.2 Evidence that this problem matters
| Evidence | Source |
|---|---|
| AI made résumé generation free → employers now receive floods of polished, indistinguishable applications | Market shift, 2024–2026 |
| Job-seekers report applications "vanishing" with zero feedback; the #1 frustration is not knowing *why* | Discovery / persona interviews (jobHunt) |
| Referral hiring is rising as employers cut costs; warm intros materially raise callback odds | Industry hiring data |
| A working single-user system (jobHunt) already demonstrates the AI core: 5-model router, RAG, fit-scoring, outcome learning | Existing codebase |

### 2.3 Size of opportunity
| Dimension | Value | Basis |
|---|---|---|
| Addressable users (SAM) | ~2–4M reachable tech job-seekers/yr (English markets) + lean employers | Labor-market estimate |
| Revenue opportunity | Candidate Pro $29/mo + employer usage (screening/interviews) | Two-sided model |
| Volume opportunity | Diagnoses, tailored builds, screens, interviews per cycle | Per-action metering |
| Strategic value (non-$) | The outcome-learning dataset = a compounding moat; MENA/APAC-first defuses AI-hiring regulation | Founder |

### 2.4 Why now
AI commoditized résumé generation, which (a) flooded employers — raising the value of substance-based screening, and (b) commoditized résumé tools — raising the value of honesty and outcome-learning. The two things AI can't commoditize — honest judgment and outcome-grounded learning — are exactly Trajct's wedge. MENA/APAC markets currently lack EU-AI-Act-style hiring-AI restrictions, opening a launch window for the assessment product.

### 2.5 Cost of inaction
The outcome-learning moat compounds with time and data; a later start means a permanent data deficit versus any competitor who starts the loop first. Commodity résumé tools continue to win the un-differentiated market while no one owns "truth over paper."

---

## 3. Target users & personas

> Full 21-persona set with rich profiles (age, tech-fluency, platform frequency, goals, frustrations, needs)
> is maintained in the Trajct persona library. Primary + key secondaries summarized here.

### 3.1 Primary persona
| Field | Value |
|---|---|
| Name | Maya — the stalled mid-career switcher |
| Role | Employed mid-level tech professional (PM/eng/data/design), ~8 yrs experience |
| Context | Has target companies; time-poor; has tried other tools; skeptical |
| Goals | Land a better role without quitting to job-hunt; know when something better appears |
| Frustrations today | Applications vanish with no feedback; doesn't know *why*; generic tools don't help |
| Tech fluency | High (●●●); uses other platforms weekly |
| Success metric | Interviews landed; time-to-better-offer |

### 3.2 Secondary personas (needs that shape requirements)
- **David** — laid-off professional (anxious, time-critical, daily intense use). Shapes: gentle tone, urgency, fast value, prominent trial.
- **Priya** — fresher/early-career (thin network, mobile-first). Shapes: first-resume help, norms education.
- **Sara** — happily-employed passive looker (rare use). Shapes: passive monitoring, alert quality.
- **Tariq** — dissatisfied + relocation seeker. Shapes: location/visa filtering.
- **Reem** — lean recruiter (drowning in AI résumés). Shapes: fast JD, substance screening, bulk actions.
- **Yusuf** — startup founder hiring first staff (no process). Shapes: radically self-serve.
- **Nadia** — SME HR generalist (no time). Shapes: automation of post/reject/schedule; rejection reasons.
- **Ahmed** — high-volume agency recruiter. Shapes: bulk screening + why-rejected reasons.
- **Sofia** — DEI/compliance lead. Shapes: explainability, consent, audit.
- **The hidden gem** — capable, poor on paper. Shapes: substance-based assessment, fairness.
- **Internal:** Operations, Finance, Technical Ops, Compliance/Trust, Product Manager, Customer Success.

### 3.3 Anti-personas (explicit non-users)
- People seeking **mass auto-apply** (against our quality principle).
- People seeking **live-interview cheating** (against our integrity principle).
- **Tier-3 micro one-off hirers** who won't engage with structured screening (use free JD only).

### 3.4 User journey — current state (candidate)
Apply blindly → silence → no feedback → repeat → demoralized. (No tool closes the loop.)

### 3.5 User journey — future state (this PRD)
Diagnose (honest truth) → fix (tailored) → prepare (company-specific) → monitor (passive) → convert (follow-up/offer) → log outcome → advice improves. Employer: free JD → screen (substance) → hire → success signal → better matching.

---

## 4. Strategic context

### 4.1 North Star alignment
| North Star | Current | Target after pilot | Lift attributable |
|---|---|---|---|
| Successful outcomes per cycle (interviews landed / successful hires, at positive cost-per-outcome) | baseline (single-user) | first cohort improving | the learning loop turning on |

### 4.2 OKR / objective linkage
| Objective | Key result | How this PRD contributes |
|---|---|---|
| Become a billable, two-sided platform | First paying candidates + active free-JD employers | Ships the candidate MVP + employer free-JD front door |
| Prove the moat | Measurable advice/match quality lift as data accumulates | Instruments the outcome-learning loop from day one |
| Margin-positive per account | Every paying account gross-margin positive | Usage metering + halting spend cap |

### 4.3 Competitive / market context
| Competitor | Their approach | Gap we exploit |
|---|---|---|
| Teal / Rezi / Kickresume | Résumé tools (one stage) | No outcome loop; no honesty; no employer side |
| Jobright | Matching + auto-apply | Volume over quality; shallow referrals; no screening |
| Final Round | Interview copilot (one stage) | Interview-only; no diagnosis/monitoring/employer |
| Greenhouse/Lever/Ashby | ATS workflow | No AI assessment; no candidate side; no learning brain |
| HireVue | AI screening | Single-sided; no candidate flywheel feeding it |

### 4.4 Strategic bets this PRD makes
- **Bet 1:** Candidates will pay for *honesty* ("why you're failing") more than for *another résumé tool*.
- **Bet 2:** Free JD writing creates a real employer pipeline into paid screening (the two-sided unlock).
- **Bet 3:** The outcome-learning loop measurably improves outcomes as data accumulates (the moat compounds).

---

## 5. Goals, non-goals & success metrics

### 5.1 Goals
- **G1** — Candidates measurably improve outcomes (more interviews) and will pay for the diagnosis→fix.
- **G2** — Employers actively use free JD writing and convert to paid, substance-based screening.
- **G3** — The outcome-learning loop demonstrably lifts advice/match quality as data grows.
- **G4** — Every paying account is gross-margin positive (incl. cost-bounded free tiers).
- **G5** — Operate trustworthily & compliance-ready on both sides (honesty, consent, explainability, human-in-loop).

### 5.2 Non-goals (explicit exclusions)
- **Not** building mass auto-apply — against principle, permanent.
- **Not** building live-interview assistance/cheating — against principle, permanent.
- **Not** launching AI screening in EU/US first — MENA/APAC lead; deferred until compliance matures.
- **Not** building a public job board in v1 — deferred.
- **Not** the full enterprise ATS — lean workflow only in early releases.

### 5.3 Success metrics (AI-product stack)
| Metric ID | Metric | Type | Current | Target @30d | Target @90d | Source |
|---|---|---|---|---|---|---|
| M-1 | Activation: visitor → completed diagnosis | Output | — | 50% | 60% | Product analytics |
| M-2 | Diagnosis → paid conversion | Output | — | 5% | 8% | Billing |
| M-3 | Groundedness / citation rate (AI quality) | Guardrail | — | ≥95% | ≥98% | Eval harness |
| M-4 | Fabrication rate in user-facing output | Guardrail | — | <1% | ~0% | Eval + review |
| M-5 | Gross margin per paying account | Guardrail | — | positive | positive | Finance |
| M-6 | Free-JD active employers → paid screening conv. | Output | — | — | trend↑ | Product analytics |
| M-7 | Advice/match quality lift over time | Output | — | baseline | measurable↑ | Loop instrumentation |
| M-8 | Interviews landed per active candidate | Output | — | baseline | ↑ | Outcome logging |

**Counter-metrics (must not regress):** cross-tenant data incidents = 0; automated decisions without human confirm = 0; assessments missing rationale/consent = 0; P95 generation latency within target; existing-user NPS must not drop.

### 5.4 Learning goals
- Does the diagnostic-led framing convert better than résumé-led? (A/B at launch.)
- Will employers convert from free JD to paid screening, and at what rate?
- How much outcome volume is needed before the loop's lift is statistically visible?

---

## 6. Solution approach

### 6.1 Solution summary
Trajct delivers a two-sided AI product joined by one outcome-learning engine. Candidates get an honest diagnostic, per-company tailoring, company-specific interview prep, passive monitoring, and late-funnel conversion help. Employers get free AI JD writing as the front door, then paid substance-based screening (AI interview + skills assessment), and a lean hiring workflow. Every interaction feeds an outcome-learning loop that makes advice and matching sharper over time. We chose this two-sided-with-shared-brain approach over single-sided tools because the cross-side data flywheel is the only durable, compounding moat; we reject auto-apply and interview-cheating because trust is the entire business.

### 6.2 Alternatives considered
| Alternative | Why not |
|---|---|
| Candidate-only résumé tool | Commoditized; no moat; short LTV |
| Employer-only ATS/screening | No candidate supply; cold-start; needs the flywheel |
| Auto-apply / volume play | Against principle; erodes trust; regulatory/ToS risk |
| Buy/white-label an ATS | Loses the differentiated AI core we already have |

### 6.3 Conceptual model
Three interlocking flywheels — **Candidate** (Diagnose→Prepare→Monitor→Convert→Outcome→Improve), **Employer** (JD→Attract→Screen→Hire→Succeed→better matching), **Internal** (Observe→Decide→Improve→Operate) — sharing one brain whose hub value is **"truth over paper."** Each loop feeds the others; if any stalls, the system stalls.

### 6.4 Design principles for this release
- **Truth over paper** — judge substance, not polish, on both sides.
- **Honest, never harsh; tone adapts** to the user's emotional state (gentler for laid-off/fresher).
- **Explainable everywhere; human-in-the-loop** on every consequential action.
- **Instrument the loop from day one** — capture outcome/cite data even before the learning is live.
- **Every account profitable** — spend metered and capped, free tiers included.

---

## 7. Feature catalog (master list) — PRD ↔ FRD bridge

> Stable Feature IDs carried unchanged into the FRD. Priority: P0 launch-blocking · P1 important · P2 deferrable.
> Release: v1.0 (MVP) · v1.1 (V1) · vNext (V2+). FRD ref points to the FRD feature section.

### 7.1 Candidate features
| F-ID | Feature name | Business rationale (1 line) | Primary persona | Priority | Release | FRD ref |
|---|---|---|---|---|---|---|
| F-001 | Honest diagnostic ("why you're ghosted" + fit/ATS score) | The acquisition hook; truth in 60s | Maya | P0 | v1.0 | FRD §4.1 |
| F-002 | Per-company tailored résumé & cover letter | The paid fix | Maya | P0 | v1.0 | FRD §4.2 |
| F-003 | Career profile builder (ingest docs → master profile) | Substrate for all features | Maya | P0 | v1.0 | FRD §4.3 |
| F-004 | Chat-driven résumé editing (quick/section/full rebuild) | No manual editing | Maya | P0 | v1.0 | FRD §4.4 |
| F-005 | Rate any job by URL / pasted JD | Score jobs found anywhere | Maya | P0 | v1.0 | FRD §4.5 |
| F-006 | Résumé editor: templates, parse, export (PDF/DOCX) | Build/keep multiple versions | Maya | P1 | v1.1 | FRD §4.6 |
| F-007 | Company-specific interview prep (expected Qs, answers, format) | Know the room | Maya | P0 | v1.0 | FRD §4.7 |
| F-008 | Mock interviews (AI voice/video) + feedback | Rehearse with feedback | Maya | P1 | v1.1 | FRD §4.8 |
| F-009 | Live interview tutor (chat) | Ask anything during prep | Maya | P1 | v1.1 | FRD §4.9 |
| F-010 | STAR story bank → JD mapping | Reusable evidence | Maya | P1 | v1.1 | FRD §4.10 |
| F-011 | LinkedIn profile optimization | Profile works as hard as résumé | Maya | P1 | v1.1 | FRD §4.11 |
| F-012 | LinkedIn post generation + scheduling | Build presence over time | Maya | P1 | v1.1 | FRD §4.12 |
| F-013 | Outreach drafting (intro/HM/cold) + networking tracking | Warm > cold | Maya | P1 | v1.1 | FRD §4.13 |
| F-014 | Warm-intro / people-at-target-companies graph | Shortest referral path | Maya | P1 | v1.1 | FRD §4.14 |
| F-015 | Passive target-company monitoring + alerts | Always-on retention | Sara/Maya | P0 | v1.0 | FRD §4.15 |
| F-016 | Salary / market-value tracking | Know your worth | Maya | P1 | v1.1 | FRD §4.16 |
| F-017 | Skill-gap analysis + learning path | Close the gap to target | Lena | P2 | v1.1 | FRD §4.17 |
| F-018 | Application tracker + analytics | Manage the search | Maya | P1 | v1.1 | FRD §4.18 |
| F-019 | Proof-point / achievement library | Reusable quantified wins | Maya | P1 | v1.1 | FRD §4.19 |
| F-020 | Follow-up cadence drafts | Keep the conversation alive | David | P1 | v1.1 | FRD §4.20 |
| F-021 | Application form-assist (HITL) | Fill forms with cited answers | David | P1 | v1.1 | FRD §4.21 |
| F-022 | Offer evaluation + negotiation | The right decision | Maya | P1 | v1.1 | FRD §4.22 |
| F-023 | Relocation / target-location & visa signals | For relocation seekers | Tariq | P2 | v1.1 | FRD §4.23 |
| F-024 | Gap-framing & skill-translation | Returners & career-changers | Khalid/Lena | P2 | v1.1 | FRD §4.24 |

### 7.2 Employer features
| F-ID | Feature name | Business rationale | Primary persona | Priority | Release | FRD ref |
|---|---|---|---|---|---|---|
| F-030 | AI JD generation + optimization (free) | Employer front door / lead magnet | Reem/Yusuf | P0 | v1.0 | FRD §4.30 |
| F-031 | JD skill analysis + inclusivity review | Better, fairer JDs | Sofia | P1 | v1.1 | FRD §4.31 |
| F-032 | AI candidate matching + ranking | Right people surfaced | Reem | P1 | vNext | FRD §4.32 |
| F-033 | Passive candidate discovery | Find non-applicants | Grace | P2 | vNext | FRD §4.33 |
| F-034 | Screening — AI interview + skills assessment | Substance over paper (paid) | Reem | P0¹ | vNext | FRD §4.34 |
| F-035 | "Hidden gem" surfacing | Find ability under poor résumés | Reem | P1 | vNext | FRD §4.35 |
| F-036 | Why-rejected reason per candidate | Defensible rejections | Ahmed | P1 | vNext | FRD §4.36 |
| F-037 | Lean HR automation (post / bulk-reject / schedule) | Remove the busywork | Nadia | P1 | vNext | FRD §4.37 |
| F-038 | Hiring workflow (pipeline, scorecards, collaboration) | Hold results, decide together | Grace | P1 | vNext | FRD §4.38 |
| F-039 | Recruiting analytics (TTH, CPH, quality, funnel) | See what works | Grace | P2 | vNext | FRD §4.39 |
| F-040 | Post-hire success check-in | Ground-truth on what predicts success | — | P2 | vNext | FRD §4.40 |
¹ P0 *within the employer-paid release* (vNext), region-gated to MENA/APAC, compliance-ready.

### 7.3 Shared brain / engine
| F-ID | Feature name | Business rationale | Priority | Release | FRD ref |
|---|---|---|---|---|---|
| F-050 | Outcome logging + cite-markers | The moat's fuel | P0 | v1.0 | FRD §4.50 |
| F-051 | Outcome-learning loop (credit assignment, persona evolution) | Advice/match improves | P1 | v1.1 | FRD §4.51 |
| F-052 | Per-company persona synthesis (deep research) | Makes "per-company" real | P0 | v1.0 | FRD §4.52 |
| F-053 | Company enrichment layer (firmographic + hiring intel) | Richer company knowledge | P1 | v1.1 | FRD §4.53 |
| F-054 | Company-knowledge freshness + news tracking | Never stale | P1 | v1.1 | FRD §4.54 |
| F-055 | Per-user voice calibration | Sounds like the user, not AI | P1 | v1.1 | FRD §4.55 |
| F-056 | High-fit auto-prep journey | Auto-prepare on a high-fit role | P2 | v1.1 | FRD §4.56 |
| F-057 | Provider-agnostic AI layer (multi-model + fallback) | Cost/quality control | P0 | v1.0 | FRD §4.57 |
| F-058 | Multi-source job discovery + source-adapter framework | The job feed backbone | P0 | v1.0 | FRD §4.58 |
| F-059 | Ghost-posting / legitimacy filter | Only real opportunities | P1 | v1.1 | FRD §4.59 |
| F-060 | Trust wall (candidate-private data never to employers) | Two-sided trust | P0 | v1.0 | FRD §4.60 |

### 7.4 Platform, identity, billing & operations
| F-ID | Feature name | Business rationale | Priority | Release | FRD ref |
|---|---|---|---|---|---|
| F-070 | Sign-up / sign-in (candidate + employer org) | Accounts | P0 | v1.0 | FRD §4.70 |
| F-071 | SSO (Google/MS; SAML/OIDC for orgs) | Frictionless / enterprise login | P1 | v1.1 | FRD §4.71 |
| F-072 | Org RBAC + seat management | Recruiter roles | P1 | v1.1 | FRD §4.72 |
| F-073 | Payment processing (subs + usage + one-off) | Get paid | P0 | v1.0 | FRD §4.73 |
| F-074 | Plans & entitlements (quotas, trials, gating) | Monetization mechanics | P0 | v1.0 | FRD §4.74 |
| F-075 | Invoices / refunds / tax / dunning + finance reporting | Finance ops | P1 | v1.1 | FRD §4.75 |
| F-076 | Usage metering (ledger + quota display) | Bill + show usage | P0 | v1.0 | FRD §4.76 |
| F-077 | Per-account halting spend cap | Margin protection | P0 | v1.0 | FRD §4.77 |
| F-078 | Admin console (ops) | Run the business | P1 | v1.1 | FRD §4.78 |
| F-079 | Technical-ops tooling (cost, observability, flags, queue) | Keep it reliable & cheap | P1 | v1.1 | FRD §4.79 |
| F-080 | Compliance/trust tooling (logs, consent, export/delete, audit) | Defensible & legal | P0 | v1.0 | FRD §4.80 |
| F-081 | Content/persona ops (corpus, quality, freshness queues) | Curate the brain | P1 | v1.1 | FRD §4.81 |
| F-082 | Product analytics (usage/adoption/funnel/cohort/A-B) | Decide what to build | P1 | v1.1 | FRD §4.82 |

### 7.5 Cross-cutting & senior-PM gap features (added this pass)
| F-ID | Feature name | Business rationale | Priority | Release | FRD ref |
|---|---|---|---|---|---|
| F-090 | Notifications system (email/push/in-app + preferences/digest) | Every persona needs it; powers alerts/retention | P0 | v1.0 | FRD §4.90 |
| F-091 | Onboarding / first-run (guided setup, targets, tutorial) | Activation depends on it | P0 | v1.0 | FRD §4.91 |
| F-092 | Trust & safety / anti-abuse (fake-employer, gaming, fraud) | Protects a two-sided marketplace | P0 | v1.0 | FRD §4.92 |
| F-093 | Data portability & delete-my-data (candidate-facing) | GDPR/PDPB right; trust | P0 | v1.0 | FRD §4.93 |
| F-094 | Appeal / dispute flow (AI-screening rejection) | Fairness for the screening product | P1 | vNext | FRD §4.94 |
| F-095 | Reviews & ratings (two-sided trust layer) | Marketplace trust | P2 | vNext | FRD §4.95 |
| F-096 | Search & filtering (jobs / candidates) | Basic discovery primitive | P1 | v1.1 | FRD §4.96 |
| F-097 | Integrations / API / webhooks (HRIS/ATS export) | Employer stickiness | P2 | vNext | FRD §4.97 |
| F-098 | Localization / multi-language (Arabic + MENA/APAC) | Required for launch geography | P1 | v1.1 | FRD §4.98 |
| F-099 | Invite / referral / virality loop | Cheapest growth channel | P2 | v1.1 | FRD §4.99 |

**Priority legend:** P0 = launch-blocking · P1 = important (ship without only with approval) · P2 = nice-to-have, deferrable.

---

## 8. Feature details (business view) — exemplars

> One block per feature (the PRD-level business/user/UX view). FRD expands each into functional detail.
> Exemplars below for the flagship P0 features; remaining features follow the identical block structure.

### 8.1 Feature F-001 — Honest diagnostic
**Owner:** PM · **Priority:** P0 · **Release:** v1.0 · **Paired FRD:** §4.1

**8.1.1 User problem this feature solves**
> "Every application disappears and I have no idea why." — Maya, persona interview. Candidates get zero
> actionable feedback; they can't improve because they don't know what's wrong.

**8.1.2 Proposed user experience**
- Candidate pastes/uploads a résumé + a target role (one step, no signup wall).
- Within seconds: an overall fit/ATS score + "the 5 specific reasons you're getting ghosted," worst offender highlighted, each reason specific + fixable + evidenced.
- CTA: "Want the rewritten version that fixes all 5?" → signup/paywall → the fix (F-002).
- Tone adapts: gentler for laid-off/fresher, direct for employed.
- Wireframes: [Figma link]

**8.1.3 Key user scenarios (business-level stories)**
- As a candidate, I want the honest reasons I'm not getting interviews, so I can fix them.
- As a laid-off candidate, I want that truth delivered as an action plan (not a verdict), so I keep momentum.

**8.1.4 Success criteria**
| Criterion | Measurement |
|---|---|
| ≥50% of visitors complete a diagnosis | Product analytics (M-1) |
| Diagnosis names a non-obvious, specific issue | Qual review + override rate |
| Diagnosis → paid conversion meets target | Billing (M-2) |

**8.1.5 Assumptions & dependencies**
- Profile builder (F-003) and per-company persona (F-052) provide grounding.
- AI layer (F-057) and groundedness instrumentation (M-3) in place.

**8.1.6 Out of scope for this feature**
- Auto-applying after diagnosis; live-interview help.

**8.1.7 Open product questions**
| # | Question | Owner |
|---|---|---|
| Q-001.1 | Diagnostic-led vs résumé-led first impression — which converts? (A/B) | PM |
| Q-001.2 | How harsh is "too harsh" for the laid-off persona? | PM + Design |

### 8.2 Feature F-030 — AI JD generation (free employer front door)
**Owner:** PM · **Priority:** P0 · **Release:** v1.0 · **Paired FRD:** §4.30

**8.2.1 User problem** — Reem/Yusuf/Nadia need a good JD fast with zero process; writing one is slow and they're not experts.
**8.2.2 UX** — Minimal input (role, level, a few must-haves) → a clean, optimized JD in minutes; free forever; the relief win that gets employers in the door and generates JD data for matching.
**8.2.3 Stories** — As a lean recruiter, I want a strong JD in minutes so I can post today.
**8.2.4 Success** — Active free-JD employers; free-JD → paid-screening conversion (M-6).
**8.2.5 Dependencies** — AI layer (F-057); org accounts (F-070); spend cap on the free tier (F-077).
**8.2.6 Out of scope** — Paid screening (F-034, separate release).
**8.2.7 Open Qs** — Range-based salary hints only (no comp DB) — sufficient?

> *(Remaining feature blocks F-002…F-099 follow this identical structure; the FRD expands each into full functional detail.)*

---

## 9. Prioritization & phasing

### 9.1 Prioritization method — RICE (illustrative for flagship features)
| Feature | Reach | Impact | Confidence | Effort | RICE | Rank |
|---|---|---|---|---|---|---|
| F-001 Diagnostic | high | 3 | 0.9 | 2 | high | 1 |
| F-030 Free JD | high | 3 | 0.9 | 1 | high | 2 |
| F-002 Tailored fix | high | 3 | 0.85 | 3 | high | 3 |
| F-052 Persona synthesis | med | 3 | 0.8 | 4 | med | 4 |

### 9.2 Release phasing
| Release | Features | Gate |
|---|---|---|
| **v1.0 (MVP)** | F-001..005, F-007, F-015, F-050, F-052, F-057, F-058, F-060, F-070, F-073, F-074, F-076, F-077, F-080, F-090, F-091, F-092, F-093, F-030 | Launch-gate scorecard |
| **v1.1 (V1)** | Remaining P1 candidate + engine + platform features; F-096, F-098, F-099 | Launch-gate |
| **vNext (V2+)** | Employer screening/interviews/ATS/analytics (F-032..040), F-094, F-095, F-097 | Compliance + launch-gate |

### 9.3 MVP cut-line rationale
MVP = the candidate honesty loop (diagnose→fix→prepare→monitor→log) + the free employer front door + the platform spine (auth, billing, usage cap, trust, notifications, onboarding, anti-abuse, data rights). This is the smallest set that (a) delivers a real candidate win, (b) opens the employer pipeline cheaply, and (c) instruments the moat. If late, the **employer screening stack (vNext) is what's cut first** — it depends on candidate flow and revenue we don't yet have.

---

## 10. Commercial & pricing

### 10.1 Business model impact
| Dimension | Change |
|---|---|
| Revenue | Candidate Pro ~$29/mo (A/B $39); employer usage-based (screening/interviews); JD free |
| Pricing change | New: candidate subscription + employer usage tiers |
| Cost change | + AI inference (dominant variable), + voice/video infra (vNext); metered + capped |
| Unit economics | Every account margin-positive via price floors above per-action COGS |

### 10.2 Go-to-market
| Channel | Approach | Owner |
|---|---|---|
| Candidates | SEO/content ("why am I getting ghosted"), free diagnosis as viral hook, communities | Marketing |
| Employers | Free JD as lead magnet, direct/founder sales, recruiter communities, agencies | Commercial |
| Virality | In-product invite/referral loop (F-099) | Product |

### 10.3 Pricing (if changing)
| Tier | Price | Features | Target segment |
|---|---|---|---|
| Candidate Free | $0 | Diagnosis, limited monitoring | All candidates (funnel) |
| Candidate Pro | $29/mo (A/B $39) | Full lifecycle | Active seekers (Maya/David) |
| Employer Free | $0 | JD writing | All employers (funnel) |
| Employer Usage | per-action | Screening, interviews | Reem/Nadia/Grace |

---

## 11. Risks & mitigations
| Risk ID | Risk | L | I | Mitigation | Owner |
|---|---|---|---|---|---|
| R-1 | Two-sided cold-start (no liquidity either side) | M | H | Candidate-first creates supply; free-JD pulls employers cheaply | PM |
| R-2 | Loop cold-start (needs data to be smart) | M | M | Per-user personalization works at N=1; seed with existing corpus | PM |
| R-3 | AI cost burn from free tiers | M | H | Spend cap governs free tiers; cheaper models + caching | Tech Ops |
| R-4 | Screening fairness / bias (recreates the bias we fight) | M | H | Substance-based design; bias metrics; human-in-loop; audit hooks | Compliance |
| R-5 | Future EU/US regulation on hiring AI | M | M | MENA/APAC-first; compliance-ready design = config flip later | Compliance |
| R-6 | Trust-wall breach (candidate data to employers) | L | H | Hard data wall; isolation tests; treat as release-blocker | Security |
| R-7 | Anti-abuse: fake employers harvest candidate data | M | H | Trust & safety (F-092); employer verification; rate limits | Trust & Safety |

---

## 12. Dependencies & cross-team asks
### 12.1 Teams/services we depend on
| Dependency | What we need | Status |
|---|---|---|
| LLM providers | Multi-model access + fallback | In place (jobHunt) |
| Payment provider (Stripe) | Subscriptions + usage billing | To integrate |
| Voice/video infra | AI interview runtime (vNext) | Later |
| Comp-data partner | Salary bands (buy not build) | To source |

### 12.2 Teams we impact
| Team | Impact | Action |
|---|---|---|
| Support/Success | New ticket types (billing, screening) | Enablement + runbook |
| Sales/Commercial | New employer tier to sell | Battlecard + enablement |

---

## 13. Compliance, security & privacy (product-level view)
| Item | Answer |
|---|---|
| Regulations touching this | Data-protection (GDPR/PDPB-class), hiring-AI rules (EU AI Act / NYC LL144 — avoided at launch via MENA/APAC), employment law |
| New personal data collected? | Candidate résumés, profiles, outcomes; employer org data; (screening: consented assessment data) |
| Data retention requirements? | Per-region; user-controlled export/delete (F-093) |
| Cross-border data flows? | Region-aware; data residency controls (F-080) |
| New consent required? | Yes — screening/recording consent; network-import consent |
| Security review required? | Yes — multi-tenant isolation, trust wall, threat model |

---

## 14. Operational readiness (product-level view)
| Item | Answer |
|---|---|
| New on-call requirements | On-call for the payment + AI-generation paths |
| New support tooling | Admin console + impersonation (F-078); billing/screening macros |
| New ops dashboards | Cost/quality/usage dashboards (F-079, F-082) |
| Training needed | Support enablement on diagnosis/screening; CSM briefing |
| Runbook owner | Ops Lead |

---

## 15. Launch plan

### 15.1 Launch approach
Private beta (candidate diagnosis + free JD) → public beta → GA, feature-flagged with % rollout; employer screening (vNext) launches MENA/APAC-first behind its own flag.

### 15.2 Launch milestones
| Milestone | Owner | Exit criteria |
|---|---|---|
| Private beta (candidate MVP + free JD) | PM + Eng | Real users, 0 P0 bugs, trust-wall verified |
| Public beta | PM + Marketing | Activation + conversion targets trending |
| GA / v1.0 | CPO | Launch-gate signed; margin-positive verified |
| 30/90-day health review | PM | Outcome + retention metrics reviewed |

### 15.3 Launch comms
| Audience | Channel | Message |
|---|---|---|
| Candidates | SEO + communities | "Find out why you're getting ghosted." |
| Employers | Sales + communities | "Find real ability under the résumé flood." |
| Internal | All-hands | Two-sided launch + the trust principles |

### 15.4 Rollback / kill-switch criteria
- Cross-tenant data exposure = immediate rollback.
- Fabrication rate spike in user-facing output = feature-flag off.
- Margin-negative runaway (cap failure) = halt the affected path.
- Regulatory hold = immediate rollback in the affected region.

---

## 16. Open questions / decisions pending
| # | Type | Description | Owner | Status |
|---|---|---|---|---|
| 1 | Q | Diagnostic-led vs résumé-led hook framing | PM | Open (A/B at launch) |
| 2 | Q | Candidate price: $29 vs $39 | PM | Open (A/B) |
| 3 | D | Which single channel sources the first paying cohort | PM | Open |
| 4 | Q | Comp-data partner selection | PM + Finance | Open |
| 5 | D | Employer verification depth for anti-abuse (F-092) | Trust & Safety | Open |

---

## 17. Traceability matrix (PRD ↔ FRD ↔ metrics ↔ tests)
> The bridge table. Every catalog feature traces to its goal, success metric, FRD section, release, and launch gate.
> (Illustrative head; full matrix maintained alongside the FRD.)

| F-ID | Feature | Goal | Metric | PRD §8 | FRD §4 | Priority | Release |
|---|---|---|---|---|---|---|---|
| F-001 | Honest diagnostic | G1 | M-1, M-2 | §8.1 | §4.1 | P0 | v1.0 |
| F-030 | Free JD writing | G2 | M-6 | §8.2 | §4.30 | P0 | v1.0 |
| F-050 | Outcome logging | G3 | M-7 | — | §4.50 | P0 | v1.0 |
| F-034 | Screening | G2 | M-6 | — | §4.34 | P0¹ | vNext |
| F-073 | Payments | G4 | M-5 | — | §4.73 | P0 | v1.0 |
| F-090 | Notifications | G1 | M-1 | — | §4.90 | P0 | v1.0 |
| F-092 | Trust & safety | G5 | counter | — | §4.92 | P0 | v1.0 |
| F-093 | Data portability | G5 | counter | — | §4.93 | P0 | v1.0 |

---

## 18. Appendices
### 18.1 Related documents
| Doc | Purpose |
|---|---|
| Paired FRD (FRD-2026-001) | Functional detail per feature |
| Vision Document | Strategic frame |
| Lean Canvas / Business Model Canvas | Business model |
| BRD | Business requirements (BR-IDs) |
| Feature Flywheel | Interconnections |
| Feature Coverage Matrix | FRD↔jobHunt reconciliation |

### 18.2 Glossary (PRD-specific)
| Term | Definition |
|---|---|
| Truth over paper | Judging substance over résumé polish — the platform's unifying value |
| The loop | The outcome-learning engine that ties results back to advice/matching |
| Trust wall | Hard separation keeping candidate-private data away from employers |
| Hidden gem | A candidate strong on ability but weak on self-presentation |

---

*Version 0.1.0 (Draft) — PRD Template structure (framework refs removed) — Domain: Trajct (AI Hiring & Career). ~78 features cataloged; senior-PM gap pass applied. Next: paired FRD, feature-by-feature, in release batches.*
