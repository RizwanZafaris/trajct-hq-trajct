# @trajct/contracts

**Rule: NO endpoint exists without a contract here first.**

Zod schemas are the single source of truth. They drive:
1. **Runtime validation** — NestJS pipes in `apps/api` validate against these
2. **TypeScript types** — shared by `apps/api` and `apps/web` (no interface drift)
3. **Generated OpenAPI 3.1** — `docs/api/openapi.json` (run `pnpm contracts:build`)

## Adding a new contract

1. Create or update a schema file in `src/`
2. Export it from `src/index.ts`
3. Add it to `src/openapi-gen.ts` schema map
4. Run `pnpm contracts:build` to regenerate `docs/api/openapi.json`
5. Reference the contract in your API endpoint (NestJS) and web client

## Limits (from FRDs — these are law, don't round)

| Resource | Limit | Source |
|----------|-------|--------|
| Resume file size | 5 MB | FRD §4.1.6 |
| Resume char count | 50,000 chars | FRD §4.1 |
| Diagnostic p95 | ≤ 8s | FRD NFR-001 |
| Auth p95 | ≤ 500ms | FRD NFR-070 |
| Password min length | 12 chars | F-070 |
| Slug max length | 100 chars | F-070 |
