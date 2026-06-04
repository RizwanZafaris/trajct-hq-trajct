# Trajct — Repo Setup & Claude Code Foundation Prompt

> Part 1: how to name and configure the repos (do this by hand, 15 minutes).
> Part 2: the copy-paste prompt that makes Claude Code scaffold the entire foundation.

---

## Part 1 — Repo setup (manual, before Claude Code)

### 1.1 You need TWO repos, not one

| Repo | Name | What it holds | Why separate |
|---|---|---|---|
| Product | **`trajct`** | The platform monorepo — everything in the Technical Methodology §1.1 tree | The thing Hermes builds |
| Orchestrator | **`hermes`** | The agent harness (scheduler, Governor, dashboard) | The thing that builds it. Different lifecycle, different deploy target (your Linux server), and you never want a junior agent able to edit its own Governor |

Naming rules applied: lowercase, no hyphens needed, matches the product working name (rename later is a 5-minute GitHub operation — don't overthink it). Org: create a GitHub **organization** (e.g. `trajct-hq`) rather than personal repos — you'll need org-level fine-grained tokens, CODEOWNERS, and team permissions for the agent org later.

### 1.2 GitHub configuration for `trajct` (do in this order)

```bash
# 1. Create (private)
gh repo create trajct-hq/trajct --private --description "Trajct — AI hiring & career platform"

# 2. Copy the spec set into docs/frd/ BEFORE the first scaffold commit —
#    Claude Code builds FROM these files:
#    Trajct-00-Shared-Engine.md, Trajct-FRD-Candidate.md, Trajct-FRD-Employer.md,
#    Trajct-FRD-Platform.md, Trajct-Wireframes.md, Trajct-Technical-Methodology.md

# 3. Branch protection on main (after first push):
#    - Require PR before merge, require status checks: lint, typecheck, test, build
#    - Require linear history; no force-push; no direct pushes (including admins)

# 4. CODEOWNERS (protected paths — the human gate):
#    packages/core/billing/     @YOUR_GITHUB_USERNAME
#    packages/core/screening/   @YOUR_GITHUB_USERNAME
#    packages/core/compliance/  @YOUR_GITHUB_USERNAME
#    packages/db/               @YOUR_GITHUB_USERNAME

# 5. Repo secrets (Settings → Secrets → Actions): none yet — CI needs no cloud
#    secrets for the foundation; add DATABASE_URL etc. when staging deploy lands.
```

### 1.3 Local prerequisites on the machine running Claude Code

Node 22+, pnpm 9+, Docker (for local Postgres+Redis via compose), git, and the repo cloned with `docs/frd/` populated.

---

## Part 2 — The Claude Code prompt (copy everything below the line)

Run from the empty `trajct` repo root (with `docs/frd/` already containing the six spec files).
Recommended: `claude` with Opus/Sonnet, plan mode first (`shift+tab`) so you can review the plan before it executes.

---

```
You are the founding platform engineer of Trajct, an AI hiring & career-acceleration platform.
Your job in this session: scaffold the COMPLETE foundation of the product monorepo — structure,
tooling, CI, database core, contracts, and the platform spine skeletons — exactly per the
architecture documents in this repo. You write the skeleton and the guardrails; feature logic
comes later from the FRDs.

## Source of truth (READ THESE FIRST, in this order)
1. docs/frd/Trajct-Technical-Methodology.md  — the architecture you must implement, especially
   §1 (repo structure), §2 (stack), §4 (LLM gateway), §7 (async), §8 (security invariants)
2. docs/frd/Trajct-FRD-Platform.md           — F-070..F-086 specs (the spine you're skeletoning)
3. docs/frd/Trajct-00-Shared-Engine.md       — engine concepts (cite-markers, trust wall)
Do NOT invent architecture. Where the methodology decides something, that decision is final.
Where it's silent, choose the boring option and record it in docs/adr/.

## Stack (fixed — do not substitute)
TypeScript everywhere · Turborepo + pnpm workspaces · Next.js 15 App Router (apps/web, route
groups (candidate)/(employer)/(admin)/(marketing)) · NestJS (apps/api) · BullMQ worker
(apps/worker, same code different entrypoint) · Postgres 16 + pgvector via Drizzle ORM ·
Redis · Zod contracts in packages/contracts generating OpenAPI · Tailwind + shadcn/ui ·
Vitest (unit) + Playwright (e2e) · GitHub Actions CI · Docker Compose for local dev.

## Build, in this exact order (commit after each step, conventional commits, branch per step,
## but you may merge your own PRs in this foundation session only)

STEP 1 — Workspace skeleton
- Turborepo + pnpm workspace with the EXACT tree from Technical-Methodology §1.1:
  apps/{web,api,worker}, packages/{core,ai,rag,db,contracts,ui,config}, infra/, docs/, tests/{e2e,evals}
- packages/core contains EMPTY but typed module folders: billing/, engine/, screening/, compliance/
  each with index.ts (public API only) and README.md stating its FRD ownership (F-IDs).
- Root configs: tsconfig (strict, no implicit any), eslint with eslint-plugin-boundaries enforcing:
  (a) core modules import each other ONLY via package index, (b) NOTHING outside core/engine may
  import engine internals, (c) employer-side code may import ONLY CandidatePublicProjection types.
- .editorconfig, .gitignore, .nvmrc (22), LICENSE placeholder, root README explaining the tree.

STEP 2 — Local dev environment
- docker-compose.yml: postgres:16 with pgvector extension, redis:7 with appendonly yes.
- .env.example with every variable the foundation needs (DATABASE_URL, REDIS_URL,
  OPENROUTER_API_KEY, STRIPE_SECRET_KEY placeholder, DOPPLER note). NEVER commit real secrets.
- pnpm scripts: dev (all apps), db:up, db:migrate, db:studio, test, lint, typecheck, build.

STEP 3 — Database core (packages/db)
- Drizzle schema for the identity + tenancy spine ONLY (FRD F-070/F-072e):
  users, orgs, org_memberships(role enum: admin|recruiter|hiring_manager|viewer), sessions,
  audit_log (append-only: no UPDATE/DELETE in app role grants), consent_records,
  usage_events (idempotency_key UNIQUE), billing_ledger (double-entry: debit/credit rows,
  UNIQUE(order_id, idempotency_key)), jobs_queue_status, feature_flags.
- Postgres ROW LEVEL SECURITY enabled on every tenant table; policies scoped by org_id/user_id
  from a session-set GUC (app.current_user_id / app.current_org_id). Write the policies in SQL
  migration files, not just ORM config.
- A vectors schema with one example table (embeddings: id, owner_scope enum(user|org|global),
  owner_id, region, model_version, embedding vector(1536), metadata jsonb) + HNSW index.
- Migration runner wired to CI dry-run against a shadow DB.
- CRITICAL TEST (write it now): tests proving (a) cross-tenant SELECT returns zero rows under RLS,
  (b) audit_log rejects UPDATE/DELETE, (c) duplicate (order_id, idempotency_key) insert fails.
  These are FRD TC-070.1, TC-080.2-class, TC-073.7-class — name the test files after the TC IDs.

STEP 4 — Contracts (packages/contracts)
- Zod schemas + a build step generating OpenAPI 3.1 json into docs/api/.
- Define the first contracts from the FRD §4.x.6/.7 I/O tables VERBATIM (field names, limits,
  error codes): auth (signup/login/session), org (create/invite/role), and the F-001 diagnostic
  request/response INCLUDING its full error union (FILE_TOO_LARGE, UNSUPPORTED_FORMAT,
  NOT_A_RESUME, PARSE_FAILED, FILE_LOCKED, RESUME_TOO_SHORT, FILE_REJECTED_SECURITY,
  RATE_LIMITED, ENGINE_UNAVAILABLE) as a typed discriminated union shared by api and web.
- Rule, documented in the package README: NO endpoint exists without a contract here first.

STEP 5 — API app (apps/api, NestJS)
- Modules mirroring packages/core; global pipes validating every request against contracts.
- Auth: Better Auth (or equivalent self-hosted) with Argon2id, sessions in Postgres, login
  rate-limit (5 fails → lockout) — FRD F-070 skeleton with working signup/login/me endpoints.
- Guards: RbacGuard reading org_memberships; AuditInterceptor writing audit_log on mutating
  routes; per-route rate limiting backed by Redis (fail-CLOSED if Redis unreachable — F-078.5).
- Health endpoints (/healthz, /readyz) and a typed error filter mapping domain errors to the
  FRD error-code format: { code, message, retryable }.

STEP 6 — Worker app (apps/worker, BullMQ)
- Named queues per Methodology §7: q.ingest, q.ai.frontier, q.ai.utility, q.embed, q.notify,
  q.research, q.compliance (highest priority).
- Job-status table integration (Postgres is the record, Redis the transport), idempotency-key
  pattern on every handler, exponential backoff + typed retryable/non-retryable errors,
  dead-letter queues with an alert hook (q.compliance DLQ depth > 0 logs CRITICAL).
- One real demo job end-to-end: a no-op echo job enqueued via API, processed, status visible.

STEP 7 — AI gateway skeleton (packages/ai)
- Provider-agnostic interface: complete(req) with adapters for OpenRouter (primary) and a stub
  for direct providers. NO real prompt logic yet.
- Pre-hooks (implement for real, they're the point): atomicCapReserve(account, projectedCost)
  using Redis Lua reserve→commit, FAIL-CLOSED (Redis down ⇒ refuse the call, never spend blind);
  post-hooks: writeUsageEvent (idempotent) and a stub decisionLog(ctx) that THROWS if called
  without consent_ref (fail-closed placeholder for F-080).
- A spend-cap unit test: N concurrent fake calls near the cap never exceed it (TC-077.4-class).

STEP 8 — Web app (apps/web)
- Next.js with the four route groups, shared packages/ui (Tailwind + shadcn init, a basic
  design-token file), auth pages wired to the API (signup/login/logout working end-to-end),
  an authed dashboard shell per portal, and a /healthz page. No feature UI yet.

STEP 9 — CI/CD (.github/workflows)
- ci.yml on PR: install → lint → typecheck → unit tests → contracts build → migration dry-run
  (spin postgres service container) → build all → gitleaks secret scan. Block merge on any failure.
- main.yml: ci + placeholder deploy step (echo) + Playwright smoke (the auth e2e + RLS test).
- PR template requiring: F-ID, TC-IDs covered, "touches protected paths? yes/no".
- CODEOWNERS file for packages/core/{billing,screening,compliance} and packages/db.

STEP 10 — Documentation + handoff
- CLAUDE.md at repo root for all future agent sessions: the architecture rules (module
  boundaries, trust wall, fail-closed cap, contract-first, FRD as spec, conventional commits,
  ≤400-line PRs, never touch protected paths without flagging), how to run everything locally,
  and where the FRDs live.
- docs/adr/ADR-001..00N for every decision you made where the methodology was silent.
- Final verification: pnpm lint && pnpm typecheck && pnpm test && pnpm build all green,
  docker-compose up + dev servers boot, signup→login→dashboard works in the browser,
  the echo job round-trips, and ALL step-3/7 invariant tests pass. Print a summary table of
  what exists, what's stubbed, and the exact next tasks (Sprint 1: F-073 billing, F-076
  metering, F-077 cap — per Methodology §12 weeks 3–4).

## Hard rules for this session
- FRD limits are law: copy exact numbers (5 MB, 50k chars, rate limits, error codes) — never round.
- Fail closed everywhere a guard exists (cap, rate limit, RLS, decision log).
- No real secrets anywhere; .env.example only.
- If a step's tests fail, fix before proceeding — do not stack broken steps.
- Anything ambiguous: choose boring, write an ADR, continue. Ask me only if two FRD
  requirements genuinely conflict.
```

---

## Part 3 — After the prompt finishes (your checklist)

1. `pnpm test` locally yourself — trust but verify the invariant tests (RLS, cap concurrency, ledger uniqueness).
2. Push, confirm CI is green, then turn ON the branch protection from §1.2 (it was off so the foundation could land).
3. Tag `v0.1.0-foundation`.
4. Repeat the same pattern for the **`hermes`** repo (its build prompt is the next deliverable — Phase 0 of the Agent-Team Guide).
5. Sprint 1 begins: feed Claude Code the Platform FRD sections for F-073/F-076/F-077 — the foundation's stubs are shaped to receive exactly those.
