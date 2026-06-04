# Claude Code — Two-Sided MVP Build Prompt (multi-agent)

Paste the block below into Claude Code (Opus) at the root of the jobHunt repo. It orchestrates multiple
sub-agents to build the two-sided MVP per the Two-Sided Build Plan, in the safe execution order, without
breaking the live single-user system.

---

```
ROLE
You are the lead engineer + orchestrator turning jobHunt (a working single-user AI job-hunt system:
FastAPI/Railway · Supabase Postgres+pgvector · Next.js 15/Vercel · Redis+RQ · LangGraph 5-LLM router)
into a TWO-SIDED AI hiring + career platform — a seeker side (evolved jobHunt) and an employer side
(JD writing + screening + AI interviews). Solo founder, AI-assisted. Do NOT break the live system:
every change is backward-compatible, migration-gated, flagged to current behavior by default, and tested.

NON-NEGOTIABLE GUARDRAILS
1. Parallel intent, SEQUENCED execution. Build in the wave order below — don't half-build everything.
2. Employer JD writing is FREE FOREVER (lead magnet). Screening + AI interviews are PAID/usage. No trial clock.
3. Screening + AI-interview features launch MENA/APAC-first, but are built COMPLIANCE-READY:
   - log every automated score/recommendation (inputs + model version + timestamp),
   - human-in-the-loop: the AI RECOMMENDS, an employer human DECIDES (never auto-reject),
   - capture candidate consent before any screening/recording,
   - DO NOT store biometrics; keep transcripts/scores only,
   - structure scoring so an independent bias audit can run later without re-architecting,
   - keep tenant data region-aware.
4. TRUST WALL: candidate-private data (diagnoses, outcomes, weaknesses) must NEVER be exposed to employers.
5. Every paid action stays margin-positive: price floor above measured per-action COGS; per-tenant spend cap halts runaway usage.
6. Org model: employers are ORGS (multiple recruiter seats); seekers are USERS. Support both from the start.

ORCHESTRATION
Spin up these subagents; you own the dependency graph, integration, and final sign-off. Print the dependency
graph before starting. Each agent reads relevant files first, states paths, makes the change, adds a
failing-then-passing test, keeps the suite green, opens ONE PR per concern, and reports diffs.
  - AGENT A — Shared spine (multi-tenant isolation, org/user model, auth/JWT, billing, usage metering, spend cap)
  - AGENT B — Seeker side (diagnosis screen, tailored resume, prep, paywall) — reuses G2/G3/G5
  - AGENT C — Employer JD (free JD writing + optimization)
  - AGENT D — Employer screening (paid, MENA/APAC, compliance-ready)
  - AGENT E — Interviews (candidate-practice mock = seeker; employer-eval = paid, compliance-ready)
  - AGENT F — Minimal employer ATS (pipeline, scorecards, scheduling) to hold results
  - AGENT G — QA + full-stack end-to-end test harness (runs LAST)

REQUIRED READING (all agents): docs/AUDIT_360_SYNTHESIS.md, docs/SCALABILITY.md, docs/SCALABILITY_BUILD_PLAN.md,
README.md, the Two-Sided Build Plan, and the Strategy & MVP Brief (incl. the two-sided revision).

DB RULES: every schema change is a NEW idempotent migration in db/migrations/ (2026_06_XX_0NN_*.sql) with
APPLY + rollback notes; never edit applied migrations; default new columns/flags to preserve single-user behavior.

=== WAVE 1 — EMPLOYER JD WRITING (AGENT C) — fast, free, low-risk, gets recruiters in ===
- AI JD generator + JD optimizer + skill-requirement suggestions + (range-based) salary hints. NO comp database.
- Org model scaffold (employers as orgs with seats) — coordinate with AGENT A.
- Free forever; no paywall. This is the lead magnet and the JD data source for matching.
- Tests: JD generation quality smoke + org-scoped data isolation.

=== WAVE 2 — SEEKER MVP (AGENT B) — the moat + first revenue (≈60% reuse) ===
- Honest diagnostic screen: paste resume + target role → "5 reasons you're getting ghosted" + fit/ATS score (repackage G5).
- Per-company tailored resume (reuse G2) as the PAID fix.
- Paywall placement: AFTER the free diagnosis, BEFORE the fix (note both lead-framings for an A/B test).
- Interview prep + outcome logging (reuse G3) to feed the per-user learning loop.
- Tests: activation flow (upload → diagnosis ≤ a few seconds), paywall gate, loop personalization at N=1.

=== WAVE 3 — SHARED SPINE (AGENT A) — both sides depend on it ===
- Multi-tenant isolation: end-user/org JWT auth, RLS enforced, composite-key tenancy (continue 043/044/045 pattern).
- Billing (Stripe): seeker $29/mo trial-led; employer usage-based for screening/interviews; JD free.
- Usage metering: usage_events per action → usage_summary; per-tenant spend cap (budget_gate) that HALTS.
- Tests: two-tenant isolation (user/org B sees nothing of A even via raw SQL); margin-guard (every paid action margin-positive); budget-gate halt.

=== WAVE 4 — EMPLOYER SCREENING (AGENT D) — paid, MENA/APAC, compliance-ready ===
- Skills + behavioral screening tests; candidate matching/ranking (RECOMMEND only).
- Compliance-ready: decision logging, human-in-loop confirm, consent capture, no biometrics, bias-audit hooks, region flag.
- Start narrow (one role type) to hit a high quality bar before broadening.
- Tests: a screening run logs a decision record + requires human confirm; consent stored; trust-wall test (no candidate-private seeker data leaks to employer).

=== WAVE 5 — CANDIDATE-PRACTICE MOCK INTERVIEW (AGENT E, seeker-side) — low risk ===
- Maya rehearses; AI gives feedback. Extends G3. Seeker retention feature. No employer exposure.
- Tests: practice session runs; feedback generated; no data crosses the trust wall.

=== WAVE 6 — EMPLOYER-EVAL AI INTERVIEW (AGENT E, paid) — highest value + complexity, build last ===
- Employer-side AI interview, MENA/APAC, fully compliance-ready (consent, logging, human-decides, no biometric storage).
- Tests: interview produces a transcript + score record with consent + human-confirm gate; region-gated.

=== WAVE 7 — MINIMAL EMPLOYER ATS (AGENT F) ===
- Candidate pipeline + scorecards + interview scheduling so screening/interview results land somewhere.
- Tests: results flow into the pipeline; org-scoped; scorecard CRUD isolated per org.

=== FINAL — QA + E2E HARNESS (AGENT G) — runs last, depends on ALL ===
Write one runnable end-to-end harness (make e2e / npm script, CI-runnable, non-zero exit on failure) that verifies:
- Two-tenant + two-sided isolation (seeker A, seeker B, employer org, all walled).
- Trust wall: assert NO candidate-private data (diagnosis/outcomes) is reachable from any employer endpoint.
- Seeker lifecycle: diagnosis → paywall → tailored resume → prep → outcome log → loop personalizes next build.
- Employer lifecycle: JD (free) → screening (paid, logged, human-confirm, consent) → AI interview (paid, region-gated) → results in ATS.
- Billing/metering: paid action → usage_event → invoice line; spend cap halts; margin-guard passes.
- Compliance asserts: every automated employer decision has a stored record + consent + human-in-loop step; no biometric stored.
- Reliability: kill worker / drop Redis mid-job → recovery, no lost work.
Produce a PASS/FAIL summary.

DELIVERABLE
After each wave: PRs opened, migrations (APPLY/rollback), Stripe objects, tests vs baseline, anything deferred + why,
and the integrated status. Your final go/no-go: "two-sided, isolated, compliant-ready, billable, margin-positive,
trust-walled, and green end-to-end." Begin by printing the dependency graph, then start WAVE 1.
```

---

## Notes before you run it

- **This is months of work, not a session.** Claude Code will progress wave by wave; it won't finish all
  seven in one run. That's expected — the prompt sequences it so partial progress is always shippable.
- **Run Wave 1 + Wave 2 to a finish first.** Those put a chargeable product in market (~month 2–3). Validate
  before pouring time into Waves 4–7.
- **The compliance-ready guardrails are cheap now and expensive later.** Don't let an agent skip them "to move
  faster" — that's the rebuild trap.
- **If you want to go faster,** tell Claude Code to "do Waves 1–3 only and stop for review" — that's the
  minimum two-sided slice (free JD + paying seekers + the shared spine) that tests the flywheel.
