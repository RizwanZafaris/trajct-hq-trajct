# Trajct — Shared Engine Specification

> **The single source of truth for the AI engine that powers all three PRDs** (Candidate, Employer, Platform/Internal).
> The Candidate and Employer PRDs *reference* these features as dependencies rather than re-specifying them.
> This is what makes Trajct one coherent system, not three disconnected products.

| Field | Value |
|---|---|
| Doc | Shared Engine Spec (00) |
| Version | 0.1.0 (Draft) |
| Referenced by | Candidate PRD (01), Employer PRD (02), Platform/Internal PRD (03) |
| Foundation | jobHunt live codebase |

---

## Why this document exists

Three convictions sit underneath the whole platform, and all three live here, not in any one side's PRD:

1. **The loop is the company.** Outcomes (who got an interview, who got hired, who succeeded) flow back to the advice and matching that produced them. This is the moat — the one asset competitors can't buy or scrape.
2. **"Truth over paper" is one engine, two directions.** The same interview-intelligence and fit-scoring that helps a candidate prepare is what assesses a candidate for an employer. Built once, pointed both ways.
3. **The trust wall is sacred.** Candidate-private data (diagnoses, weaknesses, outcomes) must never reach employers. The engine enforces this at the data layer, not by policy.

---

## Shared engine features (F-050 – F-060)

### F-050 — Outcome logging + cite-markers `P0 · v1.0`
The substrate of the moat. Every AI-generated artifact (résumé, brief, assessment) carries cite-markers linking it
to the knowledge/evidence used. Candidates and employers log outcomes (interview win/loss, offer, hire, success).
**Must ship from day one even before the learning is live** — you cannot learn from data you never captured.
- *Inputs:* generated artifact + evidence refs; outcome events.
- *Outputs:* an attributable outcome record per cycle.
- *Consumed by:* Candidate (diagnosis/tailoring quality), Employer (matching/screening), Internal (analytics).
- *jobHunt:* `outcome_to_persona`, `cite:knowledge_id`.

### F-051 — Outcome-learning loop (credit assignment + persona evolution) `P1 · v1.1`
Propagates Bayesian credit from logged outcomes back to the knowledge/advice that drove them; personas evolve
(measured, versioned). Personalizes per-user (works at N=1); cross-user intelligence compounds.
- *Consumed by:* both sides — sharper candidate advice AND better employer matching.
- *jobHunt:* `outcome_to_persona`, `persona_versions`, `persona_synthesizer`.

### F-052 — Per-company persona synthesis (deep research) `P0 · v1.0`
Builds and maintains a rich, evidence-grounded persona per target company (how they hire, what they value,
success/failure patterns) via a multi-source deep-research pipeline that evolves as outcomes accumulate.
**This is what makes "per-company" tailoring and prep genuinely company-specific** rather than generic AI.
- *Consumed by:* Candidate (tailoring F-002, prep F-007), Employer (matching F-032).
- *jobHunt:* `persona_synthesizer`, `persona_deep_research`, `company_agent`.

### F-053 — Company enrichment layer `P1 · v1.1`
Enriches company knowledge with firmographic + hiring-intel signals (size, funding, open roles, hiring momentum).
- *jobHunt:* `apollo_enrich`.

### F-054 — Company-knowledge freshness + news tracking `P1 · v1.1`
Nightly re-research of stale companies; weekly recency/news checks per company/persona.
- *jobHunt:* `boss_agent`, `persona_news_check`.

### F-055 — Per-user voice calibration `P1 · v1.1`
Injects the user's own writing samples so generated content sounds like them, not generic AI.
- *Consumed by:* Candidate résumé/posts/outreach.
- *jobHunt:* `g11` voice, `voice_injector`, `linkedin_voice_extractor`.

### F-056 — High-fit auto-prep journey `P2 · v1.1`
When a role crosses a high score threshold, orchestrate the full prep package automatically (guard-railed, deduped).
- *jobHunt:* `journey`.

### F-057 — Provider-agnostic AI layer (multi-model + fallback) `P0 · v1.0`
Routes each task to the right model with cost/quality control, circuit-breaking, and fallback. The cost-governance
backbone — every generation flows through here so spend caps and metering apply.
- *Consumed by:* everything.
- *jobHunt:* `llm_router`, `llm_fallback`, `llm_breaker_redis`, `llm_hardening`.

### F-058 — Multi-source job discovery + source-adapter framework `P0 · v1.0`
Discovers jobs across many sources via a pluggable, typed, testable adapter framework; normalizes into one schema.
The backbone of the candidate job feed and monitoring.
- *Consumed by:* Candidate (monitoring F-015, rate-by-URL F-005).
- *jobHunt:* `job_scout_agent`, `career_page_scraper`, `firecrawl`, `jd_extractor`.

### F-059 — Ghost-posting / legitimacy filter `P1 · v1.1`
Detects and filters ghost/stale/recycled/low-legitimacy postings; tags each role with a legitimacy tier.
- *jobHunt:* `legitimacy_agent`, `job_validator`, `job_validation`.

### F-060 — Trust wall `P0 · v1.0`
Enforces, at the data and access layer, that candidate-private data (diagnoses, outcomes, weaknesses) is never
exposed or sold to employers. A breach is a release-blocking incident.
- *Consumed by:* the boundary between Candidate and Employer PRDs.

---

## Engine NFRs (apply to all three PRDs)

| Area | Requirement |
|---|---|
| AI quality | Groundedness ≥95%→98%; fabrication rate <1%→~0; eval-gated model/prompt changes |
| Explainability | Every score/match/assessment exposes a real rationale (target 100%) |
| Cost | Every generation metered per account; halting spend cap; cheaper models + caching on free tiers |
| Trust | Human-in-the-loop on every consequential action; honest degradation on model/data failure |
| Reliability | No lost work on restart; recoverable; observable |
| Isolation | Complete per-tenant isolation; the trust wall enforced in data + access |

---

## How the engine binds the three flywheels

```
CANDIDATE loop ──(outcomes, profiles)──▶ ENGINE ◀──(hiring signals, screening)── EMPLOYER loop
       ▲                                   │                                          ▲
       └──────(sharper advice)─────────────┴────────(better matching)─────────────────┘
                                           │
                                  INTERNAL loop (observe → tune → cheaper/better AI)
```

Every feature in the Candidate and Employer PRDs that says *"depends on the engine"* points here. Change the engine
once; both sides inherit it. That single-source design is the difference between a coherent platform and three
products wearing the same logo.

---

*Shared Engine Spec v0.1.0 — referenced by PRDs 01 (Candidate), 02 (Employer), 03 (Platform/Internal).*
