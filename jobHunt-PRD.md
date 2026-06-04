# jobHunt — Product Requirements Document (PRD)

> **One line:** jobHunt helps tech professionals land their dream job at their dream company — with AI that finds the right roles, tailors a resume per company, prepares them for the interview, and warms up the outreach. No auto-apply. No interview cheating.

| | |
|---|---|
| **Document owner** | Rizwan Zafar |
| **Status** | Draft v1 — for review |
| **Last updated** | 2026-06-02 |
| **Audience** | Founding team + build team · advisors / investors |
| **Stage** | Live single-user system → preparing 3-month paid pilot |
| **Headline goal** | **200 paying customers within 3 months of launch** |

---

## 1. Summary

jobHunt is an AI job-landing platform for people with a technical background who want to land a specific role at a specific company — not just "a job somewhere." It runs the search end to end: it finds and scores roles at the user's target companies, builds a resume tailored to each company, prepares the user for the interview, and helps warm up outreach.

It is deliberately **not** a spray-and-pray tool. We do not auto-apply on the user's behalf, and we do not help anyone cheat in a live interview. The product is built on a principle of **quality over volume**: a smaller number of deeply-prepared, well-introduced applications beats hundreds of generic ones.

A working single-user version is already live in production (FastAPI + Supabase + Next.js, an 18-graph LangGraph agent system, a 5-model LLM router). This PRD defines what we turn that into for a **paid, multi-tenant pilot** and how we judge success.

---

## 2. Problem

Job hunting for technical roles is broken in a specific way:

- **Generic applications don't land.** Candidates send the same resume to 200 roles. ATS filters and recruiters reject most on sight because nothing is tailored to the company.
- **Tailoring properly is expensive and slow.** Researching a company, rewriting a resume for it, and preparing for its interview style takes hours per application — so people don't do it, or do it badly.
- **The best path in is a warm introduction — and people don't use their network.** A referral dramatically raises callback odds, but candidates rarely map their own network to their target companies.
- **Existing tools push the wrong behavior.** Auto-apply tools optimize for volume; interview "copilots" optimize for cheating. Both erode trust and, increasingly, get candidates flagged or blacklisted.

**The gap:** there is no tool that helps a serious candidate do the *high-effort, high-quality* version of a job search — research, tailoring, warm intros, real preparation — at a fraction of the time cost, without crossing ethical lines.

---

## 3. Vision

> A more deliberate way to land your dream job. Fewer applications, each one researched, tailored, personally introduced, and genuinely prepared for — with an AI that gets sharper from every interview you take.

We are building the tool a thoughtful, ambitious candidate would use to win a *specific* role they care about — the opposite of mass auto-apply.

---

## 4. Target users

### Primary persona — "The targeted switcher"
- Tech background (engineering, product, data, design, adjacent technical roles).
- Mid-to-senior; has a shortlist of dream companies in mind.
- Currently employed or recently transitioning; time-poor, quality-conscious.
- Willing to pay because the outcome (a better role) is worth far more than the subscription.
- **Initial beachhead:** senior product / fintech-payments roles (where the existing 68-company research dataset already gives us depth), expanding outward to broader tech.

### Secondary persona — "The experienced learner"
- Has real experience and wants to *grow into* a stronger role, not game one.
- Opts in for genuine interview preparation and skill framing.
- Explicitly **not** someone looking for live-interview shortcuts — we will not serve that demand.

### Non-users (who we are not for)
- People who want hundreds of applications fired off automatically.
- People who want real-time answers fed to them during a live interview.

---

## 5. Goals & success metrics

### 5.1 Headline pilot goal
**200 paying customers within 3 months of launch.**

### 5.2 Success metrics (judged at end of pilot)

| Tier | Metric | Target | Why it matters |
|---|---|---|---|
| **Primary** | Paying customers | **200** | Proves people will pay for this at all — the core pilot bar. |
| Supporting | Activation rate (signup → first tailored resume) | ≥ 60% | Proves onboarding delivers value fast. |
| Supporting | Week-4 retention | ≥ 40% | Proves it's worth keeping, not just trying. |
| Supporting | Interviews reported per active user | trend up | Proves the product actually works. |
| Guardrail | Gross margin per paying user | **positive** | Proves the unit economics hold (protected by the per-user spend cap already built). |
| Guardrail | Support load per user | low / manageable | Proves it scales without 1:1 hand-holding. |

> **North-star (post-pilot):** *Dream-role interviews secured per active user.* Revenue and retention follow from real outcomes.

### 5.3 Explicit non-goals for the pilot
- Not building auto-apply.
- Not building live-interview assistance.
- Not going broad across every job category — stay in tech, lead with the fintech/payments wedge.
- Not optimizing for a huge free tier — the goal is *paid* validation.

---

## 6. Scope

### 6.1 In scope (the pilot product)

| # | Capability | What the user gets | Status today |
|---|---|---|---|
| 1 | **Targeted discovery** | Finds & scores roles at the user's dream companies; A–F fit grade; ghost-posting filter. | Live (single-user) |
| 2 | **Company-tailored resume** | A resume built specifically for that company/role via a multi-model engine. | Live |
| 3 | **Interview preparation** | Concept ladder, likely topics, practice & tutoring tuned to the company. | Live |
| 4 | **Warm outreach / referrals** | Maps the user's network to find the shortest warm-intro path to each target; drafts the message. | Live |
| 5 | **Follow-up & offer help** | Follow-up cadence drafts; offer evaluation & negotiation framing. | Live |
| 6 | **Onboarding** | Self-serve first run: import network, pick targets, see first scored role + first resume. | In progress |
| 7 | **Accounts, plans & billing** | Sign up, pick a plan, pay, see usage. | To build (pilot-critical) |
| 8 | **Usage metering + spend cap** | Per-user usage tracking and a hard cost ceiling so every user stays profitable. | Partially built (cap + margin report exist) |

### 6.2 Explicitly out of scope (now and by principle)

| Excluded | Reason |
|---|---|
| **Auto-apply** | Erodes quality and trust; against our core thesis. *Permanent exclusion.* |
| **Live-interview cheating / real-time answer feeding** | Ethically wrong, risks getting users blacklisted. *Permanent exclusion.* |
| Non-tech job categories | Focus the pilot; depth beats breadth. *Deferred.* |
| Native mobile apps | Web-first for pilot. *Deferred.* |
| Team/B2B (selling to recruiters/coaches) | Possible later; not pilot scope. *Deferred.* |

---

## 7. Product principles

1. **Quality over volume.** Ten deliberate applications, not two hundred generic ones.
2. **Earn the interview honestly.** We prepare people; we never cheat for them.
3. **The user's network is an asset.** Warm intros beat cold applications.
4. **Learn from real outcomes.** Every logged result makes the next application better.
5. **Every paying user is profitable.** Cost is metered and capped per user — no loss-making accounts.

---

## 8. Key user journeys

### 8.1 First-run (onboarding)
1. Sign up (Google / email).
2. Import resume + LinkedIn network (one-time).
3. Pick dream companies / target criteria.
4. See first graded roles and one tailored resume **within the first session** (activation moment).
5. Prompt to upgrade when free-trial value is felt.

### 8.2 Core loop (returning user)
1. Open "Today" — ranked, graded roles at target companies.
2. Pick a role → generate the company-tailored resume.
3. See the warm-intro path → send the drafted introduction.
4. Prepare for the interview in the studio.
5. Log the outcome → the system sharpens the next build.

### 8.3 Convert & decide
1. Follow-up drafts keep the conversation alive.
2. On an offer → offer evaluation + negotiation framing.

---

## 9. Functional requirements (pilot)

**Discovery**
- Surface roles only at/aligned to the user's chosen targets, scored A–F across multiple fit dimensions.
- Filter out ghost/recycled postings before display.

**Tailored resume**
- Generate a per-company resume on demand; allow quick tweak / section rebuild / full rebuild.
- Keep generation cost bounded per build.

**Interview prep**
- Provide company-tuned topics, a difficulty ladder, and practice/tutoring.
- Capture the interview outcome (win/loss/feedback).

**Outreach / referral**
- Import the user's network; compute warm-intro paths to targets; draft the intro message.

**Follow-up & offer**
- Generate follow-up drafts on a cadence; evaluate offers with market + negotiation context.

**Accounts & billing (pilot-critical, to build)**
- Self-serve signup, plan selection, payment, subscription management, usage visibility.
- Free trial with a hard quota; Pro (~$49/mo); usage-based Power tier.

**Trust & safety (must enforce)**
- No auto-apply pathway exists in the product.
- No live-interview assistance feature exists.
- Clear data ownership: user can export and delete their data.

---

## 10. Non-functional requirements

- **Multi-tenant isolation:** every user's data fully isolated (enforced, not app-code-only).
- **Reliability:** no lost work on deploy/restart; recover stuck jobs automatically.
- **Performance:** key screens load fast; long AI jobs run async with progress.
- **Cost control:** per-user spend cap that *halts* before a user goes margin-negative.
- **Observability:** errors and key metrics monitored before onboarding strangers.
- **Privacy/compliance:** privacy policy, terms, data export/delete; secrets secured.

---

## 11. Pricing (pilot)

| Plan | Price | For | Notes |
|---|---|---|---|
| **Trial** | Free | First look | Hard quota, no card. Conversion funnel, not a destination. |
| **Pro** | ~$49/mo | Active seekers | Full lifecycle; primary paid tier. |
| **Power** | Usage-based | Heavy users | Metered per action; margin protected by the spend cap. |

> Price floors are set above measured per-action cost (target ≥60% gross margin). The "every user profitable" guardrail is enforced in code, not assumed.

---

## 12. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Can't reach 200 paid in 3 months | Medium | Lead with the senior/fintech wedge where $49 is trivial vs. salary; tight ICP; referral incentives; warm-start onboarding. |
| Users expect auto-apply | Medium | Position clearly as a *quality* tool; make the warm-intro + tailoring value obvious in onboarding. |
| Demand for interview cheating | Medium | Refuse by design and in messaging; turn it into a trust differentiator. |
| Unit economics go negative under heavy use | Medium | Per-user metered cost + hard spend cap (built); margin report flags loss-makers. |
| Multi-tenant data leak | High impact | Close the tenant-isolation gaps (auth/RLS, composite keys) **before** any 2nd paying user. |
| Build scope too large for 3 months | High | Cut to the critical path: billing + onboarding + isolation + the already-working core loop. |

---

## 13. Roadmap to the pilot (next ~12 weeks)

| Phase | Window | Focus | Exit criteria |
|---|---|---|---|
| **0 · Harden** | Weeks 1–3 | Tenant isolation (auth/RLS, composite keys), reliability, observability | A 2nd user is safely isolatable; nothing lost on deploy |
| **1 · Monetize** | Weeks 3–6 | Billing (Stripe), plans/entitlements, usage metering, spend cap finished | A stranger can sign up, pay, and use the product end to end |
| **2 · Onboard** | Weeks 5–8 | Self-serve onboarding, activation flow, account/usage UI | New user reaches first tailored resume in one session |
| **3 · Launch & fill** | Weeks 8–12 | Marketing site, GTM to the wedge ICP, invite + convert | **200 paying customers** |
| **Throughout** | — | E2E test harness, support path, feedback loop | Green end-to-end; outcomes being logged |

---

## 14. Open questions

- Exact ICP for launch marketing: lead senior-PM/fintech only, or open to all senior tech from day one?
- Trial shape: time-limited, quota-limited, or both?
- Annual plan at launch, or monthly only for the pilot?
- Which single channel do we bet on to source the first 200 (LinkedIn, communities, referrals)?
- Refund / satisfaction guarantee to lower the paid barrier during the pilot?

---

## 15. Appendix — what already exists (credibility)

A working single-user production system underpins this PRD:
- **Backend:** FastAPI on Railway; Redis + RQ durable job queue.
- **Data:** Supabase Postgres + pgvector; multi-tenant schema (isolation enforcement in progress).
- **Agents:** 18 LangGraph workflows (discovery, resume, interview, outreach, follow-up, offer).
- **AI:** 5-model LLM router with per-call cost tracking and a per-user spend cap.
- **Frontend:** Next.js 15 on Vercel.
- **Differentiators already built:** outcome-conditioned learning loop, warm-intro referral graph, three-source company research.

This is not a concept — it's a working product being prepared to charge its first 200 customers.
