# ADR-010 — Boundary-focused ESLint at the root

**Date:** 2026-06-04
**Status:** Accepted
**Context:** Sprint A closure — `pnpm lint` was non-functional (eslint never installed).

## Decision

Install eslint 9 + `@typescript-eslint/*` + `eslint-plugin-boundaries` and add a root
`eslint.config.mjs` (flat config) whose **only error-level rule is the module-boundary /
trust-wall check** (CLAUDE.md §2, F-060). Type-aware and stylistic rules are off.

The engine is modelled as two element types — `core-engine-index` (the public
`packages/core/engine/index.ts`) and `core-engine-internal` (everything else). Importers in
`apps/api`, `apps/worker`, and `apps/web` may reach the index but are **disallowed** from any
internal engine module.

## Rationale

- The trust wall is the security-critical invariant the lint exists to protect. Correctness is
  already enforced by `pnpm typecheck`; re-litigating `no-explicit-any` etc. across pre-existing
  `apps/` code would block the lint gate on debt unrelated to Sprint A.
- Defense in depth: an alias import of a non-exported engine subpath
  (`@trajct/core/engine/outcome-loop`) is already impossible — the package `exports` map only
  publishes `./engine` → `index.ts`. The lint additionally catches the *relative-path*
  circumvention (`../../packages/core/engine/outcome-loop`), which is verified live.
- `eslint-plugin-boundaries` v5 dropped the `specifier` micromatch form used in the original
  shared config; the index-vs-internal element split is the v5-compatible way to express the rule.

## Consequences

- `pnpm lint` is green and meaningfully enforces the trust wall (proven: a relative engine-internal
  import errors with "Engine internals are private (F-060 trust wall)").
- macOS `._*` AppleDouble files (exFAT artifact) are ignored.
- Future: when apps/ debt is paid down, re-enable type-aware rules (`no-floating-promises`,
  `await-thenable`) by adding `parserOptions.project` and a per-app tsconfig include.
