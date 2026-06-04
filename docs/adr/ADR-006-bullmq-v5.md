# ADR-006 — BullMQ v5 for queue management

**Date:** 2026-06-04  
**Status:** Accepted

## Decision

Use **BullMQ v5** on Redis. The methodology explicitly names BullMQ (§7.2).
Named queues: q.ingest, q.ai.frontier, q.ai.utility, q.embed, q.notify, q.research, q.compliance.

**Temporal is explicitly deferred** until screening orchestration grows multi-day human-in-loop sagas (V2).
