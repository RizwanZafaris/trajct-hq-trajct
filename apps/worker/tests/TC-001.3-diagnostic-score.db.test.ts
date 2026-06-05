/**
 * TC-001.3 — Diagnostic scoring writeback (mock mode, no LLM keys).
 *
 * runDiagnosticScore produces a banded result, keeps only reasons whose evidence_ref is
 * resolvable in the résumé, attaches cite-markers, and writes the completed result back to
 * the Redis diag blob.
 *
 * Covers: F-001 FR-001.3/.4, BR-001.6/.9, F-050
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Redis } from "ioredis";
import { runDiagnosticScore } from "../src/handlers/diagnostic-score.js";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";
const TOKEN = "11111111-2222-3333-4444-000000010003";

const RESUME = "Senior engineer with experience building payment systems, leading teams, and shipping reliably across many quarters of measurable impact.";

describe("TC-001.3 diagnostic scoring writeback", () => {
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 });
    // Seed the processing blob the service would have written.
    await redis.set(`diag:${TOKEN}`, JSON.stringify({
      status: "processing", userId: null, resumeText: RESUME,
      jdText: "Senior Platform Engineer", jdConfidence: "high", createdAt: new Date().toISOString(),
    }), "EX", 3600);
  });

  afterAll(async () => { await redis.del(`diag:${TOKEN}`); await redis.quit(); });

  it("writes a completed, banded result with resolvable-evidence reasons", async () => {
    await runDiagnosticScore({
      diagToken: TOKEN, resumeText: RESUME, jdText: "Senior Platform Engineer",
      jdConfidence: "high", context: null, userId: null, idempotencyKey: "tc0013",
    });

    const blob = JSON.parse((await redis.get(`diag:${TOKEN}`))!);
    expect(blob.status).toBe("completed");

    const r = blob.result;
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(r.band);
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.reasons.length).toBeLessThanOrEqual(7);
    // Every reason carries an evidence_ref and a cite-marker citation exists.
    for (const reason of r.reasons) expect(reason.evidence_ref).toBeTruthy();
    expect(r.citations.length).toBe(r.reasons.length);
    expect(r.dimensions.length).toBe(6);
  });

  it("context changes tone only — score is deterministic in mock mode", async () => {
    await redis.set(`diag:${TOKEN}`, JSON.stringify({
      status: "processing", userId: null, resumeText: RESUME, jdText: "Senior Platform Engineer", jdConfidence: "high", createdAt: new Date().toISOString(),
    }), "EX", 3600);
    await runDiagnosticScore({
      diagToken: TOKEN, resumeText: RESUME, jdText: "Senior Platform Engineer",
      jdConfidence: "high", context: "laid_off", userId: null, idempotencyKey: "tc0013b",
    });
    const blob = JSON.parse((await redis.get(`diag:${TOKEN}`))!);
    expect(blob.result.score).toBe(62); // mock dims all 62 → weighted avg 62, regardless of context
  });
});
