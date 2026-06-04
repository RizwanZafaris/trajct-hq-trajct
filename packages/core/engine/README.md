# @trajct/core/engine

**FRD ownership:** F-050 · F-051 · F-052 · F-053 · F-054 · F-055 · F-056 · F-057 · F-060

## Trust wall (F-060) — THE MOST IMPORTANT INVARIANT

The engine's `index.ts` is the **only thing employer-side code may import**.
Internal modules are private. This is enforced by:
1. `eslint-plugin-boundaries` — lint failure on any internal import from outside
2. Postgres RLS — employer roles cannot SELECT candidate-private tables
3. `CandidatePublicProjection` — the only type that crosses the boundary

A trust wall breach is **sev-1, release-blocking** (see docs/runbooks/).

## Modules (all private — import only from `index.ts`)

| Module | Feature | Description |
|--------|---------|-------------|
| `trust-wall` | F-060 | CandidatePublicProjection type; trust wall enforcement |
| `cite-markers` | F-050 | Artifact citation substrate |
| `outcome` | F-050/F-051 | Outcome logging + credit assignment |
| `persona` | F-052 | Per-company persona synthesis |

## Metrics to keep at zero (pages on any > 0)

`trustwall_leak_total` · `decision_without_log_total`
