# CLAUDE.md — Trajct AI Coding Session Rules

**Every AI coding session MUST read this file before writing any code.**
The FRDs are the spec. This file is the operating contract.

---

## 1. Source of truth hierarchy

1. `docs/frd/Trajct-Technical-Methodology.md` — architecture, stack, boundaries
2. `docs/frd/Trajct-FRD-Platform.md` — F-070..F-086 platform features
3. `docs/frd/Trajct-FRD-Candidate.md` — candidate product
4. `docs/frd/Trajct-FRD-Employer.md` — employer product
5. `docs/frd/Trajct-00-Shared-Engine.md` — F-050..F-060 engine
6. `docs/adr/` — decisions where the methodology was silent
7. **This file** — coding session rules

When the FRD and any other document conflict, **the FRD wins**.

---

## 2. Module boundary rules (ENFORCED BY LINT — do not bypass)

```
packages/core/*  →  import ONLY via package index (index.ts)
                     never via internal paths (billing/cap.ts directly)

packages/core/engine  →  the only public export for employer-side code
                          is CandidatePublicProjection (trust wall F-060)

employer-side code  →  MUST NOT import engine internals
                        MUST NOT import candidate-private types
```

Violations caught by `eslint-plugin-boundaries`. A lint failure here is a sev-1 trust wall breach.

---

## 3. Fail-closed invariants (NEVER bypass)

| Guard | What happens if it's unavailable |
|-------|----------------------------------|
| Spend cap (F-077) | Redis down → **throw** `CapRedisUnavailableError` — never spend |
| Rate limit (F-078) | Limiter down → **deny** the request |
| Postgres RLS | Session missing GUC → query returns zero rows |
| Decision log (F-080) | Log write fails → **do not serve** the decision |
| Screening region flag (F-085) | Flag svc down → **default to off** (never enable screening by default) |

---

## 4. Contract-first rule

**No endpoint exists without a Zod schema in `packages/contracts` first.**

Steps for a new endpoint:
1. Define schema in `packages/contracts/src/`
2. Export from `src/index.ts`
3. Add to `src/openapi-gen.ts`
4. Run `pnpm contracts:build`
5. Write the NestJS controller/service
6. Wire validation pipe (already global in AppModule)

---

## 5. FRD limits — copy exactly, never round

| Resource | Limit | Source |
|----------|-------|--------|
| Resume file | 5 MB | FRD §4.1.6 |
| Resume chars | 50,000 | FRD §4.1 |
| Auth p95 | ≤ 500ms | NFR-070 |
| Diagnostic p95 | ≤ 8s | NFR-001 |
| Login failures before lockout | 5 | FR-070.5, AC-070.1.3 |
| Cap check p95 | ≤ 20ms | NFR-077.3 |
| Rate limit overhead | ≤ 5ms | NFR-078 |

---

## 6. PR rules

- **≤ 400 lines diff** — split larger changes
- **Must link F-ID** in PR title or body (CI checks this)
- **Must list TC-IDs** covered in PR description
- **Conventional commits**: `feat(engine): F-052 persona v1`
- **Branch naming**: `feat/F-052-persona-v1`, `fix/F-073-webhook-race`
- **Protected paths** need CODEOWNERS approval: `packages/core/{billing,screening,compliance}`, `packages/db/`, `packages/ai/`

---

## 7. Test case naming

All test files must be named by TC-ID:
- `TC-070.1-rls-cross-tenant.test.ts`
- `TC-077.4-cap-concurrency.test.ts`
- `TC-073.7-billing-idempotency.test.ts`

---

## 8. Screening launch gate

**NEVER enable screening in production without ALL of these:**
1. F-080 compliance logging wired + TC-080.1–.6 green in CI
2. F-081 data residency confirmed (AWS in-region, not PaaS)
3. Bias audit (F-034.8) passed for the target market
4. Consent capture (F-034.2) wired and tested
5. `screening_enabled` feature flag OFF by default; per-region opt-in only

This is in the release checklist (`docs/runbooks/screening-launch-gate.md`).

---

## 9. Principle metrics — any > 0 is a P1/sev-1

| Metric | Meaning |
|--------|---------|
| `double_charge_total` | Billing integrity breach |
| `overspend_beyond_cap_total` | Spend cap violated |
| `trustwall_leak_total` | Trust wall breach → sev-1, release-blocking |
| `decision_without_log_total` | Compliance failure |
| `fail_open_events_total` | Guard failed open |

---

## 10. How to run locally

```bash
# Prerequisites: Node ≥22, pnpm ≥9, Docker
pnpm install

# Start Postgres + Redis
pnpm db:up

# Enable pgvector + run init
docker exec trajct_postgres psql -U trajct -d trajct_dev \
  -f /packages/db/src/init/000_extensions.sql

# Run migrations
pnpm db:migrate

# Apply RLS policies
docker exec trajct_postgres psql -U trajct -d trajct_dev \
  -f /packages/db/src/policies/001_rls_setup.sql

# Start all apps
pnpm dev

# Run tests
pnpm test

# Run type checks
pnpm typecheck

# Lint
pnpm lint

# Generate OpenAPI
pnpm contracts:build
```

---

## 11. Where the FRDs live

```
docs/frd/
├── Trajct-Technical-Methodology.md   — architecture, stack, CI rules
├── Trajct-FRD-Platform.md            — F-070..F-086 platform
├── Trajct-FRD-Candidate.md           — candidate product F-001..F-033
├── Trajct-FRD-Employer.md            — employer product F-030..F-097e
└── Trajct-00-Shared-Engine.md        — shared engine F-050..F-060

docs/adr/
├── ADR-001-eslint-flat-config.md
├── ADR-002-better-auth.md
├── ADR-003-drizzle-orm.md
├── ADR-004-db-feature-flags.md
├── ADR-005-nestjs-v10.md
├── ADR-006-bullmq-v5.md
├── ADR-007-vitest.md
└── ADR-008-zod-v3.md
```
