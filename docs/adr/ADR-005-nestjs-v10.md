# ADR-005 — NestJS v10 for API framework

**Date:** 2026-06-04  
**Status:** Accepted

## Decision

Use **NestJS v10** with Fastify adapter (not Express). Reasons:
1. Fastify adapter: 2–3× throughput over Express, built-in schema validation
2. NestJS modules map directly to `packages/core` modules (billing, engine, screening, compliance)
3. Guards (RbacGuard), Interceptors (AuditInterceptor), Pipes (ZodValidationPipe) are built-in patterns
4. DI container makes gateway/Redis injection testable
5. The methodology explicitly names NestJS (§2)
