# PR: Trajct Foundation + Sprint 1 — Platform Spine, F-001, F-002, F-030

**Branch:** `main` → `develop`  
**Diff:** 223 files changed, 33,888 insertions  
**Tests:** 19 invariant tests all green (TC-070.1, TC-073.7, TC-077.1, TC-077.4, TC-077.7, TC-080.2)

---

## Summary

Complete foundation scaffold (Steps 1–10) + Sprint 1 implementation (W3–W10) for the Trajct AI hiring platform.

This PR establishes the production-ready monorepo architecture, all feature skeletons, and the implemented working code for the four MVP launch features (platform spine, F-001 diagnostic, F-002 tailor, F-030 JD generation).

---

## What's in this PR

### Foundation (Steps 1–10)

- **Turborepo + pnpm monorepo** — `apps/{web,api,worker}` + `packages/{core,ai,rag,db,contracts,ui,config}`
- **Strict TypeScript** — `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` across all packages
- **ESLint + `eslint-plugin-boundaries`** — lint-enforced module boundaries:
  - `core/*` modules import only via their `index.ts`
  - Engine internals never accessible outside `packages/core/engine`
  - Employer code can only import `CandidatePublicProjection` from the engine (trust wall — F-060)
- **Docker Compose** — `pgvector/pgvector:pg16` (port 5434) + `redis:7` (appendonly yes)
- **GitHub Actions CI** — lint → typecheck → unit tests → migration dry-run → contracts build → build → gitleaks secret scan
- **CODEOWNERS** — `packages/core/{billing,screening,compliance}`, `packages/db`, `packages/ai`

### Database (packages/db)

- **Drizzle ORM schema** — 25 tables across identity, billing, candidate, employer, engine domains
- **Postgres RLS** — all tenant tables have Row Level Security; `nullif(current_setting(...), '')::uuid` safe GUC patterns
- **RLS policies in SQL** (`001_rls_setup.sql`) — `FORCE ROW LEVEL SECURITY` on all tenant tables
- **`app_role` + `app_user`** — least-privilege roles; `REVOKE UPDATE/DELETE` on `audit_log`, `consent_records`, `billing_ledger`
- **Vectors schema** — `vectors.embeddings` with HNSW index (`vector_cosine_ops`)
- **Feature schema** (`002_feature_schema.sql`) — all product tables with RLS enabled

### Platform Spine (F-070, F-071, F-073, F-076, F-077, F-085)

- **Auth (F-070)** — Argon2id signup/login/me/logout, sessions in Postgres, httpOnly cookies, 5-fail lockout, session middleware (`req.userId` / `req.orgId` / `req.orgRole` on every request)
- **Spend cap (F-077)** — Atomic Redis Lua `reserve → commit | release`; FAIL-CLOSED (Redis down → throws, never spends blind). Threshold alerts at 80/95/100%. `resetCapCycle` for billing-period resets
- **Metering (F-076)** — `recordUsageEvent` with `ON CONFLICT (idempotency_key) DO NOTHING`; `getMonthlySpend`
- **Billing (F-073)** — Stripe SDK charge with PSP idempotency key; double-entry ledger (debit + credit rows); `verifyWebhookSignature`; `UNIQUE(order_id, idempotency_key)` prevents double-charge at DB layer
- **Entitlements (F-071)** — `checkEntitlement` server-side; free features always pass; paid features check billing history
- **Feature flags (F-085)** — `checkFeatureFlag` from `feature_flags` table; fail-safe default = `false` (screening always OFF when flag service down)

### AI Gateway (packages/ai)

- **Provider-agnostic gateway** — `Gateway.complete()` + `Gateway.embed()` with OpenRouter adapter
- **Pre-hook: atomicCapReserve** — FAIL-CLOSED, Lua CAS, concurrent-safe
- **Post-hook: writeUsageEvent** — idempotent, structured log
- **Post-hook: decisionLog** — throws `DecisionLogMissingConsentError` if `consentRef` absent (F-080 fail-closed stub)
- **`getGateway()` singleton** — used across api and worker

### F-001 Diagnostic (W5–7)

- **PDF extraction** — `pdf-parse` with FILE_LOCKED detection (password-protected PDFs)
- **DOCX extraction** — `mammoth`
- **Plain text** — direct paste via `/upload/text` endpoint
- **Word count guard** — ≥150 words (FR-001.2, AC-001.1.6)
- **NOT_A_RESUME heuristic** — checks contact block + experience + education + skills sections
- **AI scoring** — OpenRouter `claude-haiku-4-5` (mid tier, 8s budget) with structured JSON response
- **Cite-markers** — every reason carries `citeMarker` (F-050)
- **Mock mode** — returns realistic mock diagnostic when `OPENROUTER_API_KEY` not set (dev-friendly)
- **Rate limiting** — `ThrottlerModule` 10/hr IP unauthenticated, 30/hr authenticated (FR-001.9)
- **Routes** — `POST /v1/diagnostic/upload` (multipart) + `POST /v1/diagnostic/upload/text` + `GET /v1/diagnostic/:id`

### F-002 Tailored Résumé (W8–9)

- **Entitlement check** — `checkEntitlement({ feature: "resume.tailor" })` before any work (FR-071.2)
- **Cap reserve** — atomic reserve before frontier AI call; release on any failure (FR-073.4, FR-077.4)
- **Frontier AI** — OpenRouter `claude-sonnet-4-5`; persona-grounded prompt
- **Fabrication scan** — heuristic gate: generated text must not balloon vs source; returns `fabricationScanPassed` flag
- **No-charge on failure** — cap released and billing skipped if fabrication scan fails (FR-073.4)

### F-030 JD Generation + F-031 Inclusivity Review (W10)

- **Free, no auth required** — `POST /v1/employer/jds` (FR-030.5)
- **AI generation** — OpenRouter `claude-haiku-4-5`; role + level + must-haves → complete JD
- **Inclusivity check (F-031)** — heuristic bias patterns: `ninja/rockstar`, gendered terms (`aggressive`, `manpower`), age-coded language (`digital native`, `recent grad`), `culture fit`
- **Skill + seniority extraction** — regex-based for Sprint 1; AI-backed in V1
- **Mock mode** — structured placeholder JD when API key not set

### All Feature Skeletons (packages/contracts + apps/api + apps/worker + apps/web)

- **Zod contracts** — 15 schema files covering all FRD features; discriminated error union for F-001 errors
- **OpenAPI 3.1** — generated from contracts (`pnpm contracts:build`)
- **NestJS API modules** — candidate (`resume`, `profile`, `prep`, `tracker`, `linkedin`) + employer (`jd`, `matching`, `pipeline`) + engine (`persona`, `outcomes`, `discovery`)
- **BullMQ handlers** — 7 queues, 8 workers: `ingest`, `ai-frontier`, `ai-utility`, `embed`, `notify`, `research`, `compliance` (highest priority, DLQ alarm wired)
- **Next.js pages** — candidate and employer portals with all feature routes
- **DB schema** — `002_feature_schema.sql`: 15 candidate tables + 5 employer tables + company_personas + discovered_jobs + notifications

---

## Invariant tests (all green ✅)

| TC ID | What it proves | Tests |
|-------|---------------|-------|
| TC-070.1 | Cross-tenant RLS: org A can never see org B data (DB layer, not app code) | 3 |
| TC-073.7 | Billing ledger idempotency: concurrent inserts with same key → only one succeeds | 4 |
| TC-077.1 | Cap halt: account at 100% → `CapExceededError`, no spend | 3 |
| TC-077.4 | Cap concurrency: N parallel near-cap calls never exceed ceiling | 4 |
| TC-077.7 | Cap fail-closed: Redis unavailable → `CapRedisUnavailableError`, never spends blind | 1 |
| TC-080.2 | Audit log append-only: `app_role` has no UPDATE or DELETE on `audit_log` | 5 |
| **Total** | | **20** |

---

## Architecture decisions (docs/adr/)

| ADR | Decision |
|-----|----------|
| ADR-001 | ESLint flat config (`eslint.config.mjs`) |
| ADR-002 | Better Auth over Auth.js (manual Argon2id in Sprint 1) |
| ADR-003 | Drizzle ORM over Prisma |
| ADR-004 | DB-backed feature flags at MVP |
| ADR-005 | NestJS v10 with Fastify adapter |
| ADR-006 | BullMQ v5 for queue management |
| ADR-007 | Vitest for unit testing |
| ADR-008 | Zod v3 for schema validation |

---

## Security invariants enforced (all from Technical-Methodology §8)

| Invariant | Layer 1 (structural) | Layer 2 (behavioral) |
|-----------|---------------------|---------------------|
| Trust wall (F-060) | Postgres RLS: employer roles cannot SELECT candidate-private tables | `CandidatePublicProjection` type + lint rule |
| No overspend (F-077) | Atomic Redis reserve, fail-closed | Gateway refuses without reserve token |
| No double-charge (F-073) | DB UNIQUE(order_id, idempotency_key) | Stripe PSP idempotency key |
| Decision-before-log (F-080) | Stub throws `DecisionLogMissingConsentError` | Compliance queue DLQ alarm |

---

## What's NOT in this PR (explicitly deferred per roadmap)

- [ ] Screening (F-034) — launch gate checklist must pass first; `screening_enabled` flag is `false` everywhere
- [ ] Drizzle Kit migration runner (blocked by ESM/CJS loader issue — SQL init files used instead)
- [ ] R2 presigned file upload (uses inline buffer for Sprint 1; wire in W11)
- [ ] Persist diagnostic results to DB (`diagnostic_results` table exists; `UPDATE` call stubbed)
- [ ] Real persona fetch for F-002 tailor (stub returns placeholder; wire in W11)
- [ ] DSAR export/delete (F-082) — structure in place, implementation in W11-12
- [ ] Better Auth SSO / MFA flows (F-071e) — V1.1
- [ ] Email verification (Resend wired but not called)

---

## How to test locally

```bash
# Prerequisites: Node ≥22, pnpm, Colima (Docker)
pnpm install

# Start Postgres (port 5434) + Redis
DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock" docker compose up -d postgres redis

# Run schema init + RLS policies
psql -h 127.0.0.1 -p 5434 -U trajct -d trajct_dev -f packages/db/src/init/000_extensions.sql
psql -h 127.0.0.1 -p 5434 -U trajct -d trajct_dev -f packages/db/src/init/001_schema.sql
psql -h 127.0.0.1 -p 5434 -U trajct -d trajct_dev -f packages/db/src/policies/001_rls_setup.sql
psql -h 127.0.0.1 -p 5434 -U trajct -d trajct_dev -f packages/db/src/init/002_feature_schema.sql

# Run invariant tests
pnpm --filter @trajct/ai test           # TC-077.x (7 tests)
pnpm --filter @trajct/db test           # TC-070.1, TC-073.7, TC-080.2 (12 tests)

# Test F-001 diagnostic (paste mode, no API key needed)
curl -X POST http://localhost:3001/v1/diagnostic/upload/text \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Your resume text here...", "targetUrl": ""}'
```

---

## Sprint 2 (next — per roadmap §12 W11–12)

- [ ] Persist diagnostic results → `diagnostic_results` table
- [ ] Wire persona fetch → `packages/core/engine.getPersona()`
- [ ] R2 presigned upload + malware scan
- [ ] DSAR basic export/delete (F-082)
- [ ] Backup + restore rehearsal
- [ ] Private beta: 25–50 candidates + 5–10 employers
- [ ] First paid conversions (F-002 paywall live)

---

## Reviewers

Per `CODEOWNERS`:
- `packages/core/{billing,screening,compliance}` → `@trajct/platform-eng`
- `packages/db/` → `@trajct/platform-eng`
- `packages/ai/` → `@trajct/platform-eng`
- `packages/core/screening/` → additionally `@trajct/compliance`

---

🤖 Generated with [Claude Code](https://claude.ai/claude-code)
