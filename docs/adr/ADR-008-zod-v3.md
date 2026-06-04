# ADR-008 — Zod v3 for schema validation

**Date:** 2026-06-04  
**Status:** Accepted

## Decision

Use **Zod v3** in `packages/contracts`. The methodology specifies Zod (§2: "Zod schemas in packages/contracts").
`zod-to-json-schema` converts schemas to OpenAPI 3.1 JSON. 

Note: Zod v4 is in beta as of 2026-06-04. Upgrade when stable — no API breakage expected for our schema patterns.
