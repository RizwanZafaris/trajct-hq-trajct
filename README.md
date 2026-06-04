# Trajct — AI Hiring & Career Acceleration Platform

Monorepo for the Trajct platform. One coherent system powering both the candidate and employer
flywheels through a shared AI engine, outcome loop, and compliance backbone.

## Repository tree

```
trajct/
├── apps/
│   ├── web/        Next.js 15 — candidate + employer + admin + marketing (route groups)
│   ├── api/        NestJS — modular monolith backend
│   └── worker/     BullMQ worker (same codebase as api, different entrypoint)
├── packages/
│   ├── core/
│   │   ├── billing/     F-073..077 — charges, metering, SPEND CAP (fail-closed)
│   │   ├── engine/      F-050..060 — outcome loop, persona, trust wall
│   │   ├── screening/   F-034 — region-gated screening (NOT MVP — read README)
│   │   └── compliance/  F-080/082 — decision log writer (fail-closed), DSAR
│   ├── ai/         LLM gateway — provider-agnostic, pre/post hooks, cap integration
│   ├── rag/        Ingestion, chunking, retrieval, cite-markers
│   ├── db/         Drizzle schema + migrations + RLS policies
│   ├── contracts/  Zod schemas → OpenAPI 3.1 (contract-first: no endpoint without a schema)
│   ├── ui/         Tailwind + shadcn/ui components + design tokens
│   └── config/     Shared tsconfig, eslint, constants (FRD limits: 5MB, 50k chars...)
├── infra/          Terraform (AWS-ready from day one)
├── docs/
│   ├── frd/        The three FRDs + Technical Methodology — the spec everything builds from
│   ├── adr/        Architecture Decision Records
│   ├── runbooks/   Incident, deploy, restore, cap-breach runbooks
│   └── api/        Generated OpenAPI JSON
├── tests/
│   ├── e2e/        Playwright (TC-xxx named files)
│   └── evals/      AI eval golden sets
└── .github/workflows/
```

## Quick start

```bash
# Prerequisites: Node ≥22, pnpm ≥9, Docker
corepack enable
pnpm install

# Start local infra (Postgres + Redis)
pnpm db:up

# Run migrations
pnpm db:migrate

# Start all apps in dev mode
pnpm dev
```

## Key architectural rules (enforced by CI)

1. **Contract-first**: No endpoint ships without a Zod schema in `packages/contracts`.
2. **FRD-as-spec**: Every PR links an F-ID. Every test links a TC-ID.
3. **Fail-closed everywhere a guard exists**: cap (F-077), rate limit (F-078), RLS (F-070), decision log (F-080).
4. **Trust wall sacred** (F-060): Employer code imports ONLY `CandidatePublicProjection` from the engine. Lint enforces this.
5. **≤400-line PRs**: Split bigger changes into feature-flagged increments.
6. **Never touch** `packages/core/{billing,screening,compliance}` or `packages/db` without CODEOWNERS approval.

## Source of truth

- `docs/frd/Trajct-Technical-Methodology.md` — architecture, stack, module rules
- `docs/frd/Trajct-FRD-Platform.md` — F-070..F-086 (platform spine)
- `docs/frd/Trajct-00-Shared-Engine.md` — F-050..F-060 (engine)
- `docs/frd/Trajct-FRD-Candidate.md` — candidate product FRD
- `docs/frd/Trajct-FRD-Employer.md` — employer product FRD
- `docs/adr/` — every architectural decision where the methodology was silent
- `CLAUDE.md` — rules and context for AI coding sessions

## Principle metrics (alert on any > 0)

| Metric | Meaning |
|--------|---------|
| `double_charge_total` | Billing integrity breach — P1 |
| `overspend_beyond_cap_total` | Spend cap violation — P1 |
| `trustwall_leak_total` | Trust wall breach — sev-1, release-blocking |
| `decision_without_log_total` | Compliance failure — P1 |
| `fail_open_events_total` | Cap/rate-limit guard failed open — P1 |
