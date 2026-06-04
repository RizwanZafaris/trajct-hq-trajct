# Trajct — Technical Methodology & Engineering Operating Model

> How the system in the three FRDs gets built, run, scaled, secured, and paid for.
> Written by a combined Principal Architect / CTO / DevOps / AI Architect / Security Architect / EM lens.
> **Ground truth:** FRD-Candidate (35 features), FRD-Employer (24), FRD-Platform (17). Every decision below is
> derived from constraints those documents already commit you to — trust wall (F-060), halting spend cap (F-077),
> fail-closed decision logging (F-080), region-gated screening (F-034), no auto-reject, idempotent billing (F-073),
> and the outcome loop (F-050/F-051).

---

## 0. The assumptions I'm challenging first

Before any tooling, five assumptions in the brief deserve pushback. Getting these wrong costs more than any stack choice.

**A1 — "We need a vector DB (Pinecone/Qdrant)." Not at MVP.** Your corpus is small (one persona doc set per company, one profile per user). pgvector inside Postgres handles millions of embeddings with HNSW indexes, gives you **joins between embeddings and your relational data** (which your trust wall and consent filters require — you must filter by `consented=true AND region=X` *inside* the similarity query), and is one less system to secure, back up, and pay for. A standalone vector DB becomes worth it only when (a) embedding count > ~10–20M or (b) you need >1k vector QPS. You will hit neither in year one. **Decision: pgvector. Revisit at scale triggers (§15).**

**A2 — "Microservices for AI / workers / API." No.** You are one founder building with AI tools. The FRDs describe one coherent engine, not many services. Distributed systems failure modes (partial deploys, version skew between services, distributed tracing) are the single biggest tax a small team can self-impose. **Decision: a modular monolith with one separately-deployed worker process.** Same codebase, two run targets (`api`, `worker`). Module boundaries enforced in code (folder + lint rules), not network boundaries. You can split modules into services later because the boundaries already exist.

**A3 — "AWS from day one for credibility." Wrong cost/benefit — with one big exception.** PaaS gets you to revenue 3–6 months faster. The exception is **F-034 screening + F-081 data residency**: your own FRD region-gates screening to MENA/APAC and pins data per region (UAE PDPL, KSA PDPL, SG PDPA). PaaS providers mostly run in US/EU regions. This means **the screening product line — not user volume — is your real AWS trigger** (AWS me-central-1 / Bahrain / ap-southeast-1). Candidate product can live on PaaS for a long time. Plan the architecture so the move is a redeploy, not a rewrite (§5, §15).

**A4 — "RAG everywhere."** Half the listed "RAG use cases" are not RAG. Candidate↔job matching is **structured scoring** (consent, region, skills filters + a rubric), not retrieval-augmented generation; using RAG there gives you unauditable rankings, which violates FR-032.2 (explainable rationale) and FR-032.6 (no protected attributes). §3 draws the line precisely.

**A5 — "Pick the best model per task."** The FRDs already commit you to a stronger rule: **eval-gated, interchangeable models routed by task tier with cost ceilings** (F-057, F-077). Model names below are defaults that will be stale in six months; the routing table and eval harness are the durable asset. Build those, not model loyalty.

---

## 1. Git & repository management

### 1.1 Repo structure: **Monorepo** (Turborepo + pnpm)

| Option | Verdict | Why |
|---|---|---|
| Multi-repo | ❌ | Version skew between API contracts, shared types, and the AI layer; PR overhead ×N; AI coding tools work dramatically better with full context in one tree |
| Hybrid | ❌ | All the coordination cost of multi-repo for the one or two repos you split, with none of the benefit at your size |
| **Monorepo** | ✅ | One source of truth for types (a `JobApplication` type used by web, API, and worker), atomic cross-cutting changes (FRD features touch UI+API+worker+schema in one PR), single CI, single dependency graph. This matters doubly because *you build with AI tools*: the agent sees everything. |

```
trajct/
├── apps/
│   ├── web/                 # Next.js — candidate + employer + marketing (one app, route groups)
│   │   └── app/(candidate)/ (employer)/ (admin)/ (marketing)/
│   ├── api/                 # Backend API (Fastify/NestJS) — the modular monolith
│   └── worker/              # BullMQ worker process (same code, different entrypoint)
├── packages/
│   ├── core/                # Domain logic, shared across api+worker
│   │   ├── billing/         # F-073..077 — charges, metering, SPEND CAP
│   │   ├── engine/          # F-050..060 — outcome loop, persona, matching, trust wall
│   │   ├── screening/       # F-034 — isolated module: consent, rubric, region gate
│   │   └── compliance/      # F-080 — decision log writer (fail-closed)
│   ├── ai/                  # LLM gateway, prompts, evals, guardrails (§4)
│   ├── rag/                 # Ingestion, chunking, retrieval, citation (§3)
│   ├── db/                  # Drizzle/Prisma schema + migrations + RLS policies
│   ├── contracts/           # Zod schemas → OpenAPI + shared TS types (single source of truth)
│   ├── ui/                  # Shared shadcn/ui components, design tokens
│   └── config/              # eslint, tsconfig, shared constants (limits from FRDs: 5MB, 50k chars…)
├── infra/                   # IaC: Terraform (AWS-ready) + provider configs (Vercel/Railway now)
├── docs/
│   ├── frd/                 # The three FRDs — the spec AI tools build from
│   ├── adr/                 # Architecture Decision Records (ADR-001-monorepo.md …)
│   ├── runbooks/            # Incident, deploy, restore, cap-breach runbooks
│   └── api/                 # Generated OpenAPI
├── tests/
│   ├── e2e/                 # Playwright — the FRD test cases (TC-xxx) live here, named by ID
│   └── evals/               # AI eval suites (golden sets per task)
└── .github/workflows/       # CI/CD
```

**Rule that makes this work:** `packages/core` modules may not import each other except through their public `index.ts`; enforced with `eslint-plugin-boundaries`. The trust wall (F-060) is a module boundary *and* a database boundary — `engine` exposes a `CandidatePublicProjection` type and nothing else to employer-side code. A lint failure is cheaper than a sev-1.

### 1.2 Branching: **trunk-based, short-lived branches**

GitFlow is wrong for a team of 1–5 shipping daily. Use:

- `main` = always deployable; protected; every merge auto-deploys to **staging**.
- Branches: `feat/F-001-diagnostic-upload`, `fix/F-073-webhook-race` — **named by FRD F-ID** so every commit traces to spec.
- Life span ≤ 2 days. Bigger features ship behind **feature flags (F-085)**, dark.
- No `develop`, no release branches. Releases are **tags** on main: `v1.3.0` → production deploy.

### 1.3 PR rules, review, commits, versioning

| Practice | Standard |
|---|---|
| PR size | ≤ ~400 lines diff; split otherwise. AI-generated code reviews badly in bulk. |
| PR template | Must link F-ID + list which TC-xxx tests cover it. No F-ID = no merge (CI check). |
| Review | Solo phase: AI review (Claude Code `/review`, CodeRabbit) + **self-review checklist** (security, trust-wall, cap, idempotency). First hire onward: 1 human approval on `core/billing`, `core/screening`, `core/compliance`, `db/` — these four paths are CODEOWNERS-protected forever. |
| Commits | Conventional Commits: `feat(engine): F-052 persona freshness check`. Enables auto-changelog + semver. |
| Versioning | SemVer via changesets; API versioned at the URL (`/v1/`) only when a breaking change ships (F-097e.6). |
| Promotion | PR → CI green → merge to `main` → auto-deploy **staging** → smoke E2E suite → manual `Promote` (tag) → **production** → canary checks (error rate, p95, `double_charge_total`, `overspend_beyond_cap_total`) → auto-rollback on breach. |

### 1.4 CI/CD pipeline (GitHub Actions)

```
on PR:        lint → typecheck → unit (core) → contract tests (zod↔OpenAPI) → build
              → migration dry-run against shadow DB → secret-scan (gitleaks, SR-086.4)
              → AI eval smoke set (20 goldens, fails on groundedness regression)
on main:      all above → deploy staging → Playwright E2E (TC-xxx critical path: TC-001.x upload
              abuse, TC-073.2 idempotency, TC-077.1 cap halt) → notify
on tag v*:    deploy prod (canary) → principle-metric watch 15 min → full traffic | rollback
nightly:      full AI eval suite (golden sets) → cost report → dependency audit → DB backup verify
```

The **eval gate in CI is non-negotiable** — your FRD NFRs say "eval-gated model/prompt changes." A prompt edit is a deploy; it goes through the same pipeline as code.

---

## 2. Tech stack

One language end-to-end. **TypeScript everywhere** — not because TS is the best at everything, but because (a) one type system spanning UI↔API↔worker eliminates the largest bug class at integration seams, (b) you are one person, and (c) AI codegen quality is highest in the TS/Node ecosystem. Python enters later only as a thin evaluation/ML sidecar if needed.

| Layer | Choice | Why this, why not the alternative |
|---|---|---|
| Web (all portals) | **Next.js 15 (App Router)** — one app, route groups `(candidate)/(employer)/(admin)` | Three separate apps = three deploys, three auth integrations. Route groups give separate layouts/middleware (employer routes check org RBAC) with one codebase. Split the employer portal out only if enterprise white-labeling demands it. |
| UI | **Tailwind + shadcn/ui** | Owned code, not a dependency; themeable; AI tools generate it fluently. |
| State | **TanStack Query** (server state) + Zustand (sparse client state) | Your app is 90% server-state; Redux is ceremony you don't need. |
| API | **NestJS** on Node (alternatively Fastify+tRPC if you stay TS-only clients) | You need structure a team can inherit: modules, guards (RBAC F-072e), interceptors (audit log F-080), DI for the LLM gateway. Nest's opinions replace conventions you'd otherwise have to write down. |
| Contracts | **Zod schemas in `packages/contracts`** → generate OpenAPI + client types | The FRD input/output tables (§4.x.6/.7) transcribe directly into Zod. One definition drives validation, docs, and types. |
| Auth | **Better Auth** (or Auth.js) self-hosted, *not* Clerk/Auth0 | Auth is entangled with your trust wall and tenancy — you need org membership, RBAC, and sessions in *your* Postgres so RLS policies can reference them. SaaS auth = your most sensitive joins live outside your DB. Argon2id, MFA, SSO (SAML via BoxyHQ/ssoready when F-071e ships). |
| RBAC | **Postgres RLS + app-level policy layer** (CASL) | Defense in depth: RLS makes cross-tenant reads *impossible at the DB* (TC-070.1), CASL makes intent readable in code. The trust wall is an RLS policy, not an `if` statement. |
| Payments | **Stripe** primary; **Tap/Telr or local PSP adapter** for MENA (mada, wallets — Q-073.2) | Build the `billing` module against an internal `PaymentProvider` port from day one; Stripe is implementation #1. Idempotency keys + ledger per F-073. |
| Notifications | **Resend** (email) + **Novu** (orchestration/prefs/digests, F-090c/e) | Novu gives you per-category prefs, digests, and suppression without building notification infra. |
| File upload | **Presigned uploads → Cloudflare R2** (S3 API) + scan worker (ClamAV container) | R2 = zero egress fees (resume downloads, exports). The FRD upload pipeline (size→type→malware→semantic NOT_A_RESUME) runs as a worker chain. |
| Matching service | **In-process module** (`core/engine`) — SQL prefilter + scoring + LLM rationale | Not a service. §3 explains the retrieval/scoring split. |
| Queue/Workers | **BullMQ on Redis** | §7. |
| Search | **Postgres FTS + pg_trgm** now → Typesense/Meilisearch at trigger | Job/candidate search at MVP volume is a Postgres query with the consent/region WHERE clause. Elasticsearch is a scale-stage tool. |
| Analytics | **PostHog** (product) + Postgres → DuckDB/ClickHouse later | PostHog self-capture covers funnels, feature flags overlap, session replay. Don't build a warehouse before you have data volume. |
| Hosting (MVP) | **Vercel** (web) + **Railway** (api, worker, Redis) + **Neon or Supabase** (Postgres+pgvector) + **R2** | §5. |
| IaC | **Terraform from week 1**, even for PaaS resources where providers exist | The AWS migration (§15) is then a provider swap + new modules, not archaeology. |
| Secrets | Provider-native now (Vercel/Railway encrypted env) via **Doppler** as the single source | One place to rotate; syncs everywhere; SR-086 (no secrets in code; gitleaks in CI). |
| Monitoring | **Sentry** (errors+traces) + **Better Stack/Grafana Cloud** (metrics, alerts, status page F-084) + **Langfuse** (LLM observability) | The FRD principle metrics (`double_charge_total`, `overspend_beyond_cap_total`, `trustwall_leak_total`, `decision_without_log_total`) are first-class custom metrics with page-on-any>0 alerts (F-083). |

---

## 3. RAG strategy — where retrieval helps and where it lies

### 3.1 The decision rule

> **Use RAG when the answer must be grounded in a specific document corpus and quoted back with citations.
> Use SQL/scoring when the answer is a ranking or decision over structured entities.
> Use plain LLM (no retrieval) when the task is transformation of input already in the prompt.**

Applying it to the brief's list:

| Use case | Verdict | Mechanism |
|---|---|---|
| Resume analysis (F-001) | **Not RAG** | The résumé is *in the prompt*. Extraction + rubric scoring vs the persona. RAG adds noise. |
| Candidate↔job / JD matching (F-032) | **Not RAG — hybrid retrieval + structured scoring** | Stage 1: SQL prefilter (consent, region, availability, hard skills) → Stage 2: pgvector similarity as *one feature* → Stage 3: deterministic rubric score → Stage 4: LLM writes the *rationale only*. The score must be reproducible and auditable (F-080, FR-032.6); a raw RAG answer is neither. |
| Company knowledge base / persona (F-052) | **RAG — the flagship case** | Persona research docs, hiring patterns, news (F-054) are a true corpus; tailoring (F-002) and prep (F-007) retrieve from it with **cite-markers (F-050)**. |
| Interview question generation (F-007/F-034) | **RAG over persona + role rubric** | Questions cite which persona evidence motivated them — feeds explainability. |
| Recruiter notes / scorecards (F-038) | **Not RAG at MVP** | Structured fields + FTS. RAG over free-text notes is a V2 nicety. |
| Career coaching on uploaded docs (F-027) | **RAG, per-user corpus** | Strictly user-scoped collection; the trust wall means these embeddings are *candidate-private* — RLS on the embedding table. |
| Regional job-market insights | **RAG over curated sources, V2** | Don't index the open web; index a curated, licensed set or skip it. |
| Executive target-company research (F-013/F-014) | **RAG over persona corpus** | Same pipeline as F-052. |

### 3.2 Pipeline spec

| Concern | Decision |
|---|---|
| What's indexed | Persona research docs (per company), JD corpus, user-uploaded docs (per-user collections), help-center articles (F-100c). **Never indexed:** other users' résumés into a shared space, candidate diagnostics (trust wall), anything non-consented. |
| Chunking | Structure-aware, not fixed-size: split on headings/sections, target 300–500 tokens, 10–15% overlap, **never split a table or a bullet list mid-item**. Résumés chunk by section (experience entry = chunk). |
| Metadata per chunk | `{doc_id, owner_scope (user/org/global), company_id?, region, language, doc_type, source_url, ingested_at, content_hash, consent_ref?}`. `owner_scope` + `region` are *mandatory* — they are the trust-wall and residency filters applied **in the retrieval WHERE clause**, not post-hoc. |
| Embeddings | Behind the gateway like any model: default a current top multilingual model (Arabic matters for MENA — verify benchmark on Arabic before launch); store `embedding_model_version` per row so re-embedding is a migration, not a mystery. |
| Retrieval | Hybrid: pgvector HNSW (top-40) + Postgres FTS (top-40) → reciprocal rank fusion → cross-encoder/LLM rerank to top-6 → context budget cap. Filters (scope/region/consent) inside the SQL. |
| Anti-hallucination | (1) Retrieval-or-refuse: below similarity floor → "insufficient evidence," never invent (FRD: honest degradation). (2) Generation constrained to cite chunk IDs. (3) Post-gen groundedness check (the F-002 fabrication scan generalized): claims without a supporting chunk are stripped or the gen fails with `409 GENERATION_QUALITY` — and is **not charged** (FR-002.8). |
| Citations | The FRD already designed this: **cite-markers (F-050)** — every artifact carries `cite:knowledge_id` refs. UI renders them as expandable evidence. This doubles as the outcome-loop substrate: credit assignment (F-051) needs to know *which* knowledge drove the artifact. |
| Evaluation | Golden set per corpus: (q, expected-chunks, expected-answer). Metrics: recall@k, MRR, groundedness (LLM-judge + spot-check), citation precision. Run nightly + on any chunking/embedding/prompt change. Regression > threshold blocks the deploy. |
| When SQL beats RAG | Any question answerable by a WHERE clause: "candidates with Go + Dubai + open-to-work," quota balances, application status, analytics. If the user's question maps to columns, RAG is slower, costlier, and wrong more often. |

---

## 4. LLM model strategy — the gateway is the product asset

### 4.1 Architecture

```
caller (api/worker) → packages/ai
   ├── PromptRegistry      versioned templates (in-repo, code-reviewed, eval-gated)
   ├── Router              task → tier → model (config-driven, flag-overridable F-085)
   ├── Gateway             provider adapters: Anthropic | OpenAI | Google | Mistral | Bedrock/self-host
   │     ├── pre:  capCheck(F-077, atomic reserve) → PII/log policy → injection guard
   │     ├── exec: timeout, retries(jittered), circuit breaker per provider, fallback chain
   │     └── post: usage event (F-076, idempotent) → groundedness/guardrail checks
   │                → decision-log write where applicable (F-080, FAIL-CLOSED) → trace (Langfuse)
   └── Evals               golden sets, LLM-judge, CI gate
```

Build vs buy: **LiteLLM (self-hosted) or OpenRouter is acceptable as the wire-level adapter**, but the pre/post hooks above are *yours* — no off-the-shelf gateway enforces your spend cap atomically, writes your fail-closed compliance log, or knows your trust wall. Wrap, don't adopt wholesale.

### 4.2 Routing by task tier (models are placeholders; the tiers are the contract)

| Tier | Tasks | Default | Fallback | Why |
|---|---|---|---|---|
| **Frontier** (quality-critical, user-paid, compliance-adjacent) | Tailored résumé (F-002), screening evaluation (F-034), interview rationale, executive coaching (F-027 deep), offer eval (F-022) | Claude Sonnet-class | GPT-class → Gemini-class | These outputs are charged, audited, or feed hiring decisions. Quality failure = refund + trust damage. |
| **Mid** (high-volume, quality-sensitive) | Diagnostic scoring (F-001), JD generation (F-030), interview prep (F-007), LinkedIn (F-011/012), mock interview turns (F-008), test generation | Smaller frontier (Haiku/Flash-class) | Mid-tier alt provider | 8s p95 budget on F-001 forces a fast model; rubric structure compensates. |
| **Utility** (extraction, classification, cheap) | Resume parsing, JD parsing, NOT_A_RESUME semantic check, inclusivity classifier (F-030.2), routing/intents, summarization | Cheapest capable (Haiku/Flash/Mistral-small) | Open-weight (Llama on Bedrock) | Volume lives here; this tier is where free-tier costs are won or lost (FR-077.7). |
| **Embeddings** | All embedding generation | Current best multilingual | Alt provider | Versioned per §3. |

Rules: free tier is pinned to Utility/Mid + aggressive caching; paid tiers unlock Frontier (user-tier model access). **Fallback ≠ silent downgrade** on compliance-relevant tasks — screening evaluation may fail honestly (`503`) but never falls back to a model that hasn't passed its eval gate; that's an F-080 audit problem (model_version is logged).

### 4.3 The non-negotiables (all already FRD requirements — restated as engineering)

- **Atomic cap reserve before every call** (F-077.8) — Redis Lua/INCR with reserve-commit; fail-closed if Redis is down.
- **One usage event per call, idempotent** (F-076.2) — keyed by request idempotency key.
- **Token + cost tracking per account per task** → the cost dashboard is week-1 infrastructure, not a later nicety.
- **Audit logging:** every screening/matching recommendation writes `{inputs_hash, prompt_version, model_version, rationale, consent_ref, region, ts}` to the append-only log **before the result is served** (F-080.6).
- **Safety controls:** prompt-injection guard on any user-supplied document entering a prompt (résumés and JDs are *hostile inputs* — TC-031.3); output moderation on coach/messaging; distress safe-routing hook (F-027/F-092p).
- **Prompts are code:** in-repo, versioned, PR-reviewed, eval-gated. A prompt registry SaaS is optional sugar; the repo is the source of truth.

---

## 5. Infrastructure strategy

### 5.1 Options compared

| | A: PaaS (Vercel+Railway+Neon/Supabase+pgvector) | B: AWS day one | C: Hybrid (PaaS + AWS for specific workloads) |
|---|---|---|---|
| Speed to MVP | **Weeks** | Months (VPC, IAM, ECS, RDS, CI plumbing) | Weeks + drag |
| Cost @ MVP | ~$100–400/mo | ~$800–2,500/mo + your time (the real cost) | Middle |
| Scalability | Fine to ~10–50k MAU / moderate worker load | Unlimited | Fine |
| Security | Good defaults; SOC2 on providers; **but limited region choice** | Full control, every region incl. **me-central-1, Bahrain, ap-southeast-1** | Targeted |
| Hiring | Anyone can operate it | Needs real DevOps competency | Mixed |
| Ops complexity | Near zero | High | Two mental models |
| Fatal flaw | **Data residency for screening (F-081/F-034)** | You spend your first 90 days on plumbing instead of the funnel | Premature complexity if adopted too early |

### 5.2 Recommendation by stage

| Stage | Choice |
|---|---|
| **MVP (now)** | **Option A**, candidate product + free employer JD only. Vercel (web), Railway (api+worker+Redis), Neon/Supabase Postgres+pgvector, R2, Stripe, Doppler, Sentry. Terraform-managed where possible. |
| **Seed / screening launch** | **Option C, deliberately**: keep candidate product on PaaS; deploy the **screening + compliance stack (screening module, decision log, residency-pinned Postgres) to AWS me-central-1** (or Bahrain) the moment paid screening goes live in MENA. This is a *compliance* move (F-081), not a scale move — your FRD will not let you launch screening with assessment data sitting in a US-region PaaS. |
| **Enterprise-ready** | AWS for everything customer-data-bearing; PaaS may remain for marketing site. SSO, VPC peering / PrivateLink answers for enterprise security reviews, SOC 2 Type II underway. |
| **Scale** | Full AWS: ECS/EKS, RDS Postgres (+read replicas), ElastiCache, SQS or Redis-on-ECS for queues, OpenSearch/Typesense, S3, CloudFront. Multi-region active data residency. |

### 5.3 Exact migration triggers (any ONE fires the move for the affected workload)

| Trigger | Threshold | What moves |
|---|---|---|
| **Screening launch in a region-gated market** | First paid screening customer | Screening module + decision log + assessment data → AWS in-region. **This will fire first.** |
| Enterprise security review | First customer requiring VPC/private networking/SOC2-with-residency | Employer data plane |
| Infra cost crossover | PaaS bill > ~$3,000/mo sustained | API+workers → ECS (PaaS compute premium exceeds DevOps time cost) |
| Background AI volume | Worker fleet > ~10 concurrent dedicated instances or queue depth chronically > 5 min | Workers → ECS autoscaling / spot |
| DB pressure | Postgres > ~500GB, or need read replicas/PITR beyond provider tier | → RDS/Aurora |
| Latency | p95 API budget misses attributable to PaaS region distance from MENA users | API → in-region |
| User volume | > ~50k MAU | Holistic review |
| Compliance cert | SOC 2 Type II / ISO 27001 audit demands infra control evidence PaaS can't produce | Affected systems |

**What makes the move cheap:** Docker images for api/worker from day one (Railway runs them; ECS runs the same images), Terraform from day one, S3-compatible storage from day one, Postgres everywhere (Neon → RDS is `pg_dump`/logical replication), BullMQ→ (stays on Redis/ElastiCache). The migration is reconfiguration, not rewrite — *that property is the architecture decision*.

---

## 6. Database & data strategy

### 6.1 Placement (confirming and correcting the brief's table)

| Store | Holds | Notes |
|---|---|---|
| **PostgreSQL** (primary) | users, orgs, memberships, roles, subscriptions, entitlements, jobs, applications, pipeline stages, scorecards, candidate/employer profiles, interview records (metadata + transcript refs), payments **ledger**, consent records, usage events, quotas, **decision audit log**, notifications prefs | RLS everywhere. Decision log = append-only table (no UPDATE/DELETE grants) + hash chain column (F-080.2). Ledger double-entry style. |
| **pgvector** (in the same Postgres) | résumé/profile/JD/persona/interview-answer/help-doc embeddings | Separate logical schema `vectors.*`; rows carry `owner_scope/region/consent` for in-query filtering. *Not* Pinecone (§0-A1). |
| **Object storage (R2 → S3)** | résumé files (original + parsed JSON), generated PDFs, portfolio files, audio/video assessment media (**transient per F-034.5 — lifecycle-delete after transcript extraction; no biometric templates ever**), exports (DSAR), attachments | Bucket-per-class with lifecycle policies; presigned access only; region-pinned buckets for screening media. |
| **Redis** | sessions, cache (persona hot cache, diagnostic results), rate-limit counters (F-078), **BullMQ queues**, **spend-cap atomic counters (F-077)**, idempotency keys (24h TTL) | Cap counters are the one Redis dataset that must be durable-ish: AOF on, and reconcile against Postgres usage_events hourly. |
| **Search** | Postgres FTS now; Typesense when search QPS/relevance demands | — |
| **Analytics** | PostHog (events) + nightly Postgres → Parquet on R2, queried by DuckDB | A real warehouse (ClickHouse) only at scale stage. |

### 6.2 Retention, deletion, protection

| Policy | Rule (sourced from FRDs) |
|---|---|
| Retention | Decision logs: regulatory retention per region (Q-080.1, default 3–5y, immutable). Assessment raw media: delete ≤30 days post-transcription (or per consent), transcripts retained. Inactive free accounts: notify → anonymize at 24 months. Payment records: 7y (tax). |
| Deletion (F-082) | Identity-verified DSAR → orchestrated delete across Postgres, vectors, R2, Redis, logs → **verified-removal scan** (TC-082.6: residual PII = 0) → confirmation. Outcome data **anonymized, not deleted** (the loop survives, FR-082.3). Backups: deletion register replayed on any restore. Legal hold exempts with logged reason. |
| Encryption | TLS 1.2+ everywhere; AES-256 at rest (provider-level now, KMS CMKs on AWS); column-level (pgcrypto/app-layer) for: consent records, assessment transcripts, tokens. Secrets only in Doppler/KMS (SR-086). |
| Backups | Automated daily snapshots + WAL/PITR (Neon/Supabase built-in; RDS later). **Weekly restore test in CI** — an untested backup is a rumor. R2 versioning on. |
| DR | RPO ≤ 1h (PITR), RTO ≤ 4h MVP → ≤ 1h at scale. Runbook in `docs/runbooks/restore.md`, rehearsed quarterly. Region failure plan documented once screening is multi-region. |

---

## 7. Async processing strategy

### 7.1 Sync vs async — the rule

> **Synchronous only if: p95 < 3s, no external fan-out, and the user is blocked waiting on the answer.** Everything else is a job with a status the client polls/streams.

| Sync | Async (job) |
|---|---|
| Auth, CRUD, entitlement/cap checks, search queries, rate-a-job quick score (cached persona) | Resume parse→scan→validate chain (F-001 upload), embedding generation, tailored résumé build (F-002 — streamed progress), persona deep research (F-052), JD parse, matching batch (F-032), screening evaluation (F-034), transcription, all email/notifications, LinkedIn content gen, bulk actions (F-037), report/export generation (F-039/F-082), analytics rollups, outcome-loop credit assignment (F-051) |

Borderline: **F-001 diagnostic** has an 8s p95 budget — implement as a job but hold the HTTP connection/stream for up to ~10s before degrading to polling; users get the "fast" feel without sync fragility.

### 7.2 Mechanics

| Concern | Decision |
|---|---|
| Queue tech | **BullMQ on Redis.** Right-sized: delayed jobs, priorities, rate limiting, repeatables, DLQ semantics, great TS DX. SQS/Temporal are answers to problems you don't have yet (Temporal becomes interesting when screening orchestration grows multi-day human-in-loop sagas — V2 consideration). |
| Worker architecture | One `apps/worker` deployment, multiple named queues: `q.ingest` (parsing/scanning), `q.ai.frontier`, `q.ai.utility`, `q.embed`, `q.notify`, `q.research` (persona, low priority), `q.compliance` (decision-log writes, **highest priority**). Per-queue concurrency = cost knob; AI queues sized to cap headroom. |
| Idempotency | Every job carries an idempotency key (usually the request's); handlers are idempotent by design (the FRD billing/metering tests TC-073.2/TC-076.2 enforce this). |
| Retries | Exponential backoff + jitter, max 3–5; **typed errors decide retryability** (the FRD error tables' `Retryable` column is literally this config). Non-retryable (`NOT_A_RESUME`, `402`) → fail fast to user. |
| DLQ | Per queue; alert on depth > 0 for `q.compliance` (P1 — a stuck decision-log write means decisions aren't being served, by design), depth > N for others; weekly DLQ review runbook. |
| Status tracking | `jobs` table in Postgres (`id, type, status, progress, result_ref, error_code, idempotency_key`) — source of truth for the UI; Redis is transport, not record. |
| Client updates | SSE/WebSocket for streamed generations; polling fallback. Webhooks (signed, retried, idempotent — F-097e.2) for org integrations. |
| Scheduled | BullMQ repeatables: persona freshness nightly (F-054), monitoring scans (F-015), cap-vs-ledger reconciliation hourly, digest sends, retention sweeps, backup-verify. |
| Eventing | In-process domain events now (`outcome.recorded`, `hire.confirmed`, `screening.scored`) on a typed bus with a transactional outbox table → consumers are queue jobs. This *is* event-driven architecture at the right size; Kafka is a scale-stage tool. The outbox matters: an outcome event must never be lost (it's the moat). |

---

## 8. Security & compliance model

Defense in depth, with the four FRD invariants as the spine — each enforced at **two independent layers**:

| Invariant | Layer 1 (structural) | Layer 2 (behavioral) | Tripwire (pages on any>0) |
|---|---|---|---|
| Trust wall (F-060) | Postgres RLS: employer roles physically cannot select candidate-private tables; vectors carry scope | `CandidatePublicProjection` type at module boundary; lint rule; serializer allowlists | `trustwall_leak_total` (canary queries in prod probing as employer role) |
| No overspend (F-077) | Atomic Redis reserve, fail-closed | Gateway refuses calls without a reserve token | `overspend_beyond_cap_total`, `fail_open_events_total` |
| No double-charge (F-073) | DB unique (order, idempotency_key) | PSP idempotency keys | `double_charge_total` |
| Decision-before-log never (F-080) | Log write in the same transaction/saga as result persistence; serve blocked on log ack | Worker `q.compliance` priority + DLQ alarm | `decision_without_log_total` |

The rest, by domain:

- **AuthN:** Argon2id, MFA (mandatory for org admins + Trajct staff), breached-password check, session rotation, device revocation. SSO (F-071e) with strict assertion validation incl. replay.
- **AuthZ/RBAC:** server-side only (FR-072e.2); CASL policies tested per role; no self-escalation; last-admin protection; staff console least-privilege + break-glass with immutable audit (F-079).
- **Resume privacy:** files private-bucket, presigned short-TTL; parsed content RLS'd; embeddings scoped; candidate visibility/blocklist (F-033) enforced in the data layer.
- **Recording consent:** consent record (immutable, F-034.2) captured *before* media capture; media transient; **no biometric templates** (BIPA-class, FR-034.5) — verified by a storage-audit test, not a promise.
- **AI transparency & bias:** every recommendation carries rationale + model/prompt version (explainability NFR); selection-rate parity computed per batch (F-034.8/F-039.3) with out-of-band flags; protected attributes & proxies excluded from ranking features (FR-032.6, TC-096e.3) — enforce with an allowlisted feature set, audited; **human confirms every advance/reject** (no code path exists for auto-decision — `screening_auto_decision_total` is a tripwire).
- **GDPR/PDPL-class rights:** consent ledger, purpose limitation, DSAR export/delete (F-082) with SLA tracking, residency (F-081), breach-notification runbook within legal windows (F-084).
- **Abuse:** layered rate limits (F-078, fail-closed), employer verification tiers gating candidate data (F-092e), scrape/export anomaly detection, content moderation + report/human-review + distress safe-routing (F-092p), upload pipeline (size→MIME→ClamAV→semantic) treating every file as hostile.
- **Posture cadence:** gitleaks in CI; dependency audit nightly; pentest before screening launch; SOC 2 Type I at first enterprise pipeline, Type II at enterprise stage.

---

## 9. MVP scope — the smallest thing that proves the business

**The thesis to prove first:** candidates will *pay* for diagnose→fix, and the free JD draws employers. Screening is the big prize but carries the heaviest compliance/infra load — it is **deliberately not MVP**.

| Phase | Features (F-IDs) | Value | Complexity | Risk | Rationale |
|---|---|---|---|---|---|
| **MVP (weeks 1–12)** | Platform spine: F-070, F-071, **F-073, F-076, F-077** (billing+metering+cap), F-078, **F-080** (log core), F-083, F-085, F-086 · Candidate funnel: **F-001 → F-002**, F-003, F-052 (persona v1), F-057 (gateway), F-050 (cite-markers + outcome capture), F-091c, F-090c (transactional), F-093c (basic export/delete) · Employer hook: **F-030** (free JD), F-070e, F-091e, F-092e (email/domain tier) | Revenue + supply + the data moat's substrate | High but contained | Funnel conversion is the existential risk — test it earliest | Cap/billing/log are in MVP **because retrofitting financial integrity and compliance logging is 10× the cost of building them first**, and F-050 must exist before there are outcomes to capture |
| **V1 (months 4–6)** | F-005 rate-a-job, F-007 prep, F-008 mock interviews, F-011 LinkedIn, F-018 tracker, F-015 monitoring (+F-058/F-059), F-020 follow-up, F-004 chat-edit, F-031 JD analysis, F-032 matching v1, F-096e search, F-099c referral, F-100c help | Retention + engagement + employer pull | Medium | Feature breadth vs. focus | Deepens both sides on the proven funnel |
| **V2 (months 7–12)** | **F-034 screening + F-035 + F-036 (with AWS in-region move, F-081 full, bias audit)**, F-038 pipeline, F-041/F-026 scheduling, F-043/F-101c messaging, F-037 bulk, F-022 offer eval, F-027 coach, F-051 learning loop v1, F-094e appeals, F-092p full T&S | The differentiated paid employer product | **Highest** (compliance + infra + assessment science) | Regulatory; assessment validity | Launch only with consent/log/bias/residency stack complete — the FRD blocks it otherwise, correctly |
| **Enterprise** | F-071e SSO, F-072e advanced RBAC, F-097e API/webhooks, F-039 analytics, F-042 references, F-095e reviews, F-033 passive discovery, SOC 2 II, white-label | Expansion revenue | Medium | Sales-led timing | Build against signed demand, not speculation |

**Explicitly delayed and why:** Kubernetes (nothing needs it), microservices (§0-A2), standalone vector DB (§0-A1), Elasticsearch, data warehouse, Temporal, multi-region active-active, native mobile apps (responsive web first), custom roles, voice/video infra beyond what screening V2 needs.

---

## 10. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| T1 | AI cost per free user exceeds plan → margin burn | High | High | Cap (F-077) is MVP; utility-tier models + caching on free; cost dashboard week 1; per-feature unit-cost budget in CI report |
| T2 | Fabrication/quality failure in paid résumé → refunds, trust | Medium | High | Grounding scan (FR-002.8), eval gates, no-charge-on-fail, human-visible citations |
| T3 | Trust-wall breach | Low | **Existential** | Dual-layer enforcement + prod canary probes + sev-1 runbook (F-084) |
| T4 | Screening launches before compliance stack ready | Medium | Severe (regulatory) | F-080/F-081/bias-audit are hard launch gates in the release checklist; region flag default-off |
| T5 | Solo-founder bus factor / AI-generated code debt | High | Medium | FRD-as-spec + TC-xxx test suite *is* the mitigation: the tests encode intent a future team can trust; CODEOWNERS paths reviewed by a human from hire #1 |
| T6 | PaaS residency dead-end discovered late | Medium | High | Trigger table (§5.3) decided *now*; Docker+Terraform from day one keep the door open |
| T7 | Provider/model deprecation or price shock | Medium | Medium | Gateway + eval harness make switching a config change + eval run |
| C1 | Cost: token spend grows superlinearly with engagement | High | High | Same as T1 + per-tier routing + nightly cost report with anomaly alert |
| C2 | Cost: PaaS premium at scale | Medium | Low | §5.3 crossover trigger |
| S1 | Scale: Postgres becomes the bottleneck (vectors + FTS + OLTP in one box) | Medium (12–18mo) | Medium | It's a *good* problem: read replicas → extract vectors/search at the §5.3 thresholds; schemas already separated |
| S2 | Scale: queue starvation between cheap and frontier AI jobs | Medium | Medium | Separate queues + concurrency budgets from day one |

---

## 11. Team structure

| Stage | Team | Notes |
|---|---|---|
| Now → MVP | Founder + AI tooling (Claude Code agents per module) + fractional security/compliance reviewer (contract, pre-screening-launch pentest + DPIA) | The FRD test cases are your QA team: CI runs them |
| Post-revenue (first 2 hires) | 1 **product engineer** (full-stack TS — owns candidate funnel) + 1 **founding engineer, platform/AI** (owns gateway, workers, billing/cap, infra) | Hire generalists; the monolith demands no specialists |
| Seed (5–7) | +1 product eng (employer side), +1 AI/ML eng (evals, screening science, bias), +1 designer, +0.5 DevOps (or contracted for the AWS move), +compliance counsel (retained) | The AI/ML hire gates screening launch quality |
| Series A | Squads by flywheel: Candidate, Employer/Screening, Platform/Engine; first EM; dedicated security | Mirrors the three-FRD structure — the docs are the org chart |

---

## 12. 90-day delivery roadmap

| Weeks | Deliverable | Exit criteria |
|---|---|---|
| 1–2 | Monorepo scaffold, CI/CD, Terraform, auth+orgs+RLS, Doppler, Sentry, contracts package, deploy pipeline to staging+prod | Hello-world through full pipeline; RLS cross-tenant test (TC-070.1) green |
| 3–4 | **Platform spine:** billing (Stripe, idempotent ledger), metering, **spend cap (atomic, fail-closed)**, rate limiting, flags, gateway v1 (2 providers + fallback + Langfuse) | TC-073.2 (idempotent retry), TC-073.7 (race), TC-077.1/.4/.7 (cap halt, concurrency, fail-closed) green in CI |
| 5–7 | **F-001 diagnostic:** upload pipeline (size→type→ClamAV→semantic), persona v1 (F-052), scoring + reasons, cite-markers, free flow + rate limits | The 20 TC-001.x cases green incl. selfie/corrupt/EICAR/429; p95 ≤ 8s on staging |
| 8–9 | **F-002 paid fix:** profile (F-003), tailored generation with fabrication scan, paywall, quota, no-charge-on-fail; decision-log core (F-080) wired | TC-002.2/.3/.9/.13 green; first end-to-end paid conversion on staging |
| 10 | **F-030 employer free JD** + org onboarding + verification tier 1; inclusivity check | TC-030.x green |
| 11 | Hardening: DSAR basic export/delete (F-082), backups+restore test, eval suite to ~100 goldens, load test (k6: 50 concurrent diagnostics under cap), security self-audit + gitleaks/dep-audit clean | Restore rehearsal done; principle-metric alerts firing in chaos test |
| 12 | **Private beta:** 25–50 candidates + 5–10 employers (MENA network), PostHog funnels, weekly cost report | First paid customers; funnel + unit-cost data → V1 go/no-go |

---

## 13. Final blueprint (one page)

> **Monorepo** (Turborepo, pnpm, TypeScript end-to-end) · **Next.js** web (route-grouped portals) · **NestJS modular monolith** + **BullMQ worker** (same image, two run targets) · **Postgres+pgvector+RLS** (Neon/Supabase) as the single data brain · **Redis** for queues/cache/cap-counters · **R2** object storage · **Stripe** behind a payment port · **Zod contracts** as the single schema source.
>
> **AI:** one gateway (`packages/ai`) wrapping all providers with pre-hooks (atomic cap reserve, injection guard) and post-hooks (idempotent metering, groundedness scan, fail-closed decision log, traces). Three routing tiers (frontier/mid/utility) + embeddings, all eval-gated in CI. **RAG only where a citable corpus exists** (personas, user docs, help); **structured scoring, never RAG, for matching**; cite-markers on every artifact feed the outcome loop.
>
> **Infra:** PaaS now (Vercel+Railway+Neon+R2), Docker+Terraform from day one. **The first AWS move is compliance-driven, not scale-driven:** screening + decision log + assessment data go to AWS in-region (me-central-1/Bahrain) the day paid screening launches. Cost crossover ($3k/mo), enterprise reviews, and worker volume are the later triggers.
>
> **Process:** trunk-based, F-ID-named branches, conventional commits, CODEOWNERS on billing/screening/compliance/db, eval+TC-xxx gates in CI, tag-to-prod with canary watch on the four principle metrics (`double_charge`, `overspend`, `trustwall_leak`, `decision_without_log` — any > 0 pages).
>
> **Sequence:** platform spine (billing+cap+log) → F-001 free diagnostic → F-002 paid fix → F-030 free JD → beta → V1 engagement features → **screening only when the compliance stack and AWS region are ready.**
>
> The FRDs are the spec; the TC-xxx suite is the contract; this document is the operating model. Build in that order.
