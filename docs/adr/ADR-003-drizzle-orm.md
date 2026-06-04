# ADR-003 — Drizzle ORM for database access

**Date:** 2026-06-04  
**Status:** Accepted  
**Deciders:** Founding engineer

## Context

The methodology specifies "Drizzle/Prisma schema + migrations + RLS policies" (§1.1 tree).
We must choose one.

## Decision

Use **Drizzle ORM** with `drizzle-kit` for migrations. Reasons:
1. Drizzle is SQL-first — it generates the SQL we need to write RLS policies, no ORM magic
2. Fully typed without codegen ceremony — schemas are TypeScript directly
3. Better support for Postgres-specific features (ENUM types, UNIQUE constraints as above)
4. `drizzle-kit` migration tool supports dry-run against shadow DB (CI requirement)
5. Smaller bundle than Prisma — matters for edge/workers

## Consequences

- All schema changes go through Drizzle schema → `drizzle-kit generate` → SQL migration
- RLS policies are raw SQL in `packages/db/src/policies/` (Drizzle doesn't manage them)
- If a Prisma-specific feature is needed later, migration path exists (both use raw SQL underneath)
