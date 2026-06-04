# Two-Sided MVP — Build Plan & Roadmap

> **Decision locked:** Build both sides (seeker + employer). Screening/interview features launch
> **MENA + APAC first** (no high-risk AI-hiring regulation). **JD writing is free forever** (lead magnet);
> **screening + interviews are paid/usage** from day one. Seeker side = $29/mo trial-led.
> Solo founder, AI-assisted. Evolves the existing jobHunt codebase.

| | |
|---|---|
| Owner | Rizwan Zafar |
| Status | Build plan v1 |
| Scope | Two-sided career platform — seeker + employer |
| Founder reality | Solo, AI-assisted |
| Code base | jobHunt (FastAPI · Supabase/pgvector · Next.js 15 · Redis+RQ · LangGraph 5-LLM router) |

---

## 0. The strategy in one paragraph

A two-sided AI hiring + career platform. The **seeker side** (evolved jobHunt) helps candidates win with
honest diagnostics, tailored resumes, prep, and a learning loop. The **employer side** gets recruiters in
free with AI **JD writing**, then monetizes the high-value **screening tests** and **AI interviews** on
usage-based pricing — launched in MENA/APAC to sidestep EU/US hiring-AI regulation while it's young.
Candidate flow from the seeker side is what makes the employer side valuable — that's the two-sided flywheel.

---

## 1. Guardrails (non-negotiable — these stop the predictable failures)

1. **Parallel intent, sequenced execution.** "Both at once" still ships in an internal order, or nothing is ever done enough to test. Order below.
2. **JD free forever, screening/interviews paid.** No trial clock to expire. JD is the lead magnet + the data source that feeds matching.
3. **Compliance-ready from day one, even where not required.** Log every automated decision, keep a human-in-the-loop step, store candidate consent, avoid biometric storage. This makes the future EU/US expansion a config change, not a rewrite.
4. **Get money + signal early.** Ship the seeker diagnosis and employer JD writing as standalone chargeable/lead slices in month 2–3 — don't wait 9 months for validation.
5. **Trust wall between sides.** The seeker product is "on the candidate's side"; the employer product filters candidates. Keep candidate-private data (outcomes, diagnoses) walled off from employers. Never sell candidate weaknesses to employers.

---

## 2. Build order (the sequence inside "both at once")

Ranked by *value-per-week-of-effort* and *risk*. Earlier = cheaper, safer, faster feedback.

| Wave | What | Why here | Effort (solo) | Reuse |
|---|---|---|---|---|
| **W1** | **Employer JD writing + optimization** | Lowest risk, fast, gets recruiters in free, generates JD data | ~2 weeks | Partial (LLM + prompts) |
| **W2** | **Seeker MVP** — diagnosis + tailored resume + auth/paywall | Your moat + first revenue; ~60% already built | ~6 weeks | High (G2, G5, scoring) |
| **W3** | **Shared spine** — multi-tenant isolation, billing, usage metering | Both sides need it; the SaaS-blocker work | ~3 weeks | Partial (migrations 043–045 started) |
| **W4** | **Employer screening tests** (paid, MENA/APAC) | High value, harder; needs candidate flow from W2 to matter | ~8–10 weeks | New |
| **W5** | **Candidate-practice mock interview** (seeker-side) | Low-risk interview value; retention for seekers | ~4 weeks | Partial (G3 interview studio) |
| **W6** | **Employer-eval AI interview** (paid, MENA/APAC) | Highest value + highest complexity; build last | ~8–12 weeks | New |
| **W7** | **Minimal employer ATS** — pipeline + scorecards | So screening/interview results go somewhere | ~4 weeks | New |

> Total realistic solo timeline to the *full* two-sided product: **~6–9 months.** But W1+W2 put a chargeable
> product in market by ~month 2–3 — that's the part that protects you.

---

## 3. The two products, feature by feature

### 3.1 Seeker side (evolved jobHunt)
| Feature | Build | Notes |
|---|---|---|
| Honest diagnostic ("why you're ghosted") | New (repackages G5 scoring) | The acquisition hook |
| Per-company tailored resume | Reuse — G2 engine | The paywalled fix |
| ATS score / fit grade | Reuse — G5 | Part of diagnosis |
| Interview prep + outcome logging | Reuse — G3 | Turns on the learning loop |
| Candidate-practice mock interview | Partial — extends G3 | W5; low-risk |
| Assisted referrals (consented, no scraping) | Partial — referral graph | V1; CSV import later |
| Auth + paywall + account | New | Shared spine |

### 3.2 Employer side
| Feature | Pricing | Risk | Build |
|---|---|---|---|
| **JD writing + optimization** | **Free forever** | None | W1 |
| JD salary/skill suggestions | Free | None (use ranges, not a comp DB) | W1 |
| **Screening tests** (skills/behavioral) | **Paid / usage** | Regulated elsewhere → MENA/APAC first | W4 |
| **AI interview (employer eval)** | **Paid / usage** | High → MENA/APAC + compliance-ready | W6 |
| Candidate matching / ranking | Paid | Medium → human-in-loop, logged | W4 |
| Minimal ATS (pipeline, scorecards, scheduling) | Paid | Low | W7 |

---

## 4. Monetization model

| Audience | Tier | Price | Mechanism |
|---|---|---|---|
| Seeker | Free diagnosis | $0 | Lead magnet — the aha screen |
| Seeker | Pro | $29/mo (A/B $39) | Trial-led; tailored resume + prep + loop |
| Employer | JD writing | **Free forever** | Lead magnet + data source |
| Employer | Screening | Usage-based | Per test / per candidate screened |
| Employer | AI interview | Usage-based | Per interview conducted |
| Employer | ATS | Included with paid usage | Holds results |

**Margin guardrail (carry from prior work):** every paid action's price floor sits above measured per-action
COGS (LLM + infra + any external API). Per-tenant spend cap halts runaway usage. The "every paying account
profitable" rule holds on both sides.

---

## 5. Compliance-ready design (build now, even for MENA/APAC launch)

Even though MENA/APAC don't mandate it today, design the screening/interview features so EU/US expansion is a
config flip, not a rebuild:

- **Decision logging:** every automated score/recommendation is stored with inputs + model version + timestamp.
- **Human-in-the-loop:** an employer human must confirm any reject/advance — the AI *recommends*, never *decides*.
- **Consent capture:** candidate consents to AI screening/recording before it runs; store the consent record.
- **No biometric storage:** avoid storing face/voice biometrics (BIPA/Illinois landmine); process transient, store transcripts/scores only.
- **Bias-audit hooks:** structure scoring so an independent bias audit (NYC LL144) can be run later without re-architecting.
- **Data residency:** keep tenant data region-aware so you can honor residency rules per market.

---

## 6. The shared spine (both sides depend on it)

From the existing scalability work — finish these before either side onboards strangers:
- Multi-tenant isolation: per-user/org JWT auth, RLS enforced, composite-key tenancy (043/044 started).
- Billing + usage metering (Stripe), per-tenant spend cap (budget_gate started).
- Reliability: durable queue (done), observability (Sentry/OTel scaffolded), /ready probe.
- Org model: employers are **orgs** (multiple recruiter seats), seekers are **users** — the data model must support both from the start.

---

## 7. Timeline (solo, realistic)

```
Month 1   ──  W1 JD writing (employer lead magnet live)  ·  start W2 seeker
Month 2   ──  W2 seeker diagnosis+resume LIVE + chargeable  ·  W3 spine (auth/billing/isolation)
Month 3   ──  Seeker Pro selling · employers using free JD · FIRST REVENUE + SIGNAL
Month 4-5 ──  W4 screening tests (paid, MENA/APAC)  ·  W5 candidate-practice mock
Month 6-7 ──  W6 employer-eval AI interview (paid)  ·  W7 minimal ATS
Month 7+  ──  Iterate on conversion; consider EU/US compliance for expansion
```

**Milestone that de-risks everything:** by end of Month 3 you have paying seekers + free-JD employers +
real market feedback. If that traction isn't there, you fix it *before* sinking months into W4–W7.

---

## 8. Risks (two-sided specific)

| Risk | Severity | Mitigation |
|---|---|---|
| Two-sided cold-start (no liquidity either side) | HIGH | Seeker side first creates candidate flow that makes employer side valuable; JD-free gets employers in cheap |
| 6–9 mo solo build with no feedback | HIGH | W1+W2 ship chargeable by month 2–3; never go dark for 9 months |
| Screening quality bar (bad result loses the employer) | HIGH | Human-in-loop; launch screening only when genuinely good; start narrow (one role type) |
| Trust conflict (helping candidates vs. filtering them) | MED | Hard data wall; never expose candidate-private diagnostics to employers |
| Future EU/US regulation when you expand | MED | Compliance-ready design now makes expansion a config flip |
| Solo capacity across two products | HIGH | Sequenced execution; AI-assisted build; consider a contractor for the screening pipeline |

---

## 9. The one test that validates this plan

> Get **free-JD employers actively using it** AND **paying seekers** by end of Month 3.
> Employer JD usage proves the lead magnet works; paying seekers prove the moat works; together they prove the
> two-sided flywheel can spin. Only then is it worth the months of W4–W7 screening/interview build.
