# ADR-002 — Better Auth over Auth.js for authentication

**Date:** 2026-06-04  
**Status:** Accepted  
**Deciders:** Founding engineer

## Context

The methodology names "Better Auth (or Auth.js) self-hosted" (§2). We must choose.
Auth is entangled with our trust wall and tenancy — sessions must be in our Postgres
so RLS policies can reference them. Auth0/Clerk are ruled out (§2 explains why).

## Decision

Use **Better Auth** v1.x. Reasons:
1. First-class Postgres adapter — sessions, accounts table structure maps cleanly to our schema
2. Built-in Argon2id support (FR-070.2)
3. Actively maintained with better TypeScript DX than Auth.js as of 2026
4. MFA, SSO (BoxyHQ adapter), organization support via plugins

## Consequences

- `apps/api` depends on `better-auth`
- Session table structure aligns with Better Auth's schema (may need a migration shim)
- If Better Auth changes license or drops Postgres support, switch cost is one module change
- Auth.js remains a valid fallback with no architecture changes required
