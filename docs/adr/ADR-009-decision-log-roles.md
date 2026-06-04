# ADR-009 — Three Postgres roles for the compliance decision log

**Date:** 2026-06-04
**Status:** Accepted
**Context:** Sprint A closure, architect fix R1

## Context

The architect review (defect #1, CRITICAL) found that `compliance_decision_log` had RLS
enabled with **no policy** — a deny-all that would make every `INSERT` fail. Because serving
a hiring decision is blocked on the log write (F-080.6, fail-closed), this would have blocked
**every automated decision platform-wide, permanently**.

The fix requires role-targeted RLS policies. The methodology was silent on *how many* roles.

## Decision

Three NOLOGIN Postgres roles, created in `002b_engine_roles.sql`:

| Role | Purpose | Decision-log grant |
|------|---------|--------------------|
| `trajct_app` | application write path | `INSERT` (policy `decision_log_insert`); `UPDATE`/`DELETE` revoked |
| `trajct_compliance` | audit-read path (compliance console) | `SELECT` (policy `decision_log_read_compliance`) |
| `trajct_engine` | credit assignment reads outcomes incl. anonymized rows | `SELECT` on `outcome_events` |

The runtime application login (`app_role` / `app_user`) is granted membership in
`trajct_app` + `trajct_engine`, so the role-targeted policies apply to it.
`trajct_compliance` is **deliberately not** granted to `app_role`.

## Rationale (why three, not one)

The trust wall (F-060) demands the **write path and the audit-read path be separable**.
A single role that could both append decisions and read the full decision history would mean a
compromised app credential leaks every hiring decision ever made. Splitting them means a
compromised `trajct_app` can append (and append-only — `UPDATE`/`DELETE` revoked) but can never
read the log back; only the separate `trajct_compliance` credential can.

Append-only is enforced by **two independent mechanisms** (defense in depth):
1. No `UPDATE`/`DELETE` policies exist for any role.
2. Explicit `REVOKE UPDATE, DELETE` at the grant level.

## Consequences

- `writeDecisionLog` generates the row `id` client-side and does **not** use `INSERT … RETURNING`
  (a `RETURNING` would require a `SELECT` policy that `trajct_app` deliberately lacks).
- Runtime currently connects as the `trajct` superuser (bypasses RLS); the role infrastructure is
  in place and verified via `SET ROLE` so the app can be switched to least-privilege without schema
  changes. Switching the connection role is a Platform-sprint task.
- Verified by TC-080.3 (append-only as `trajct_app`) and the DoD psql probes.
