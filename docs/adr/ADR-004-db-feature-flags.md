# ADR-004 — Database-backed feature flags at MVP

**Date:** 2026-06-04  
**Status:** Accepted  
**Deciders:** Founding engineer

## Context

The methodology mentions feature flags (F-085) for region-gating screening and kill-switches,
but doesn't specify the implementation (build vs. provider). Open question Q-085.1.

## Decision

Use a **`feature_flags` Postgres table** backed by a Redis TTL cache at MVP. No external provider.
Reasons:
1. Zero additional cost/dependency at MVP
2. Sufficient for the MVP use cases: a handful of flags (screening_enabled, etc.)
3. Auditable by default (flag changes go through normal DB write → audit_log)
4. Kill-switch propagation: invalidate Redis cache on flag write (bounded TTL ≤ 30s)

## Consequences

- `feature_flags` table in `packages/db` schema
- Flag evaluation reads from Redis (with DB fallback on miss)
- Flag changes via admin console (F-079) write to DB + invalidate cache
- Scaling trigger: when flag count > 50 or real-time propagation becomes a bottleneck,
  migrate to PostHog Feature Flags (already in the stack for analytics) or GrowthBook
