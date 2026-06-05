/**
 * TC-005 (db+redis) — rate-a-job end-to-end (dev scoring, no LLM keys).
 *
 * .1  happy path (pasted JD) → 6-dim rating + band + token; .9 idempotent re-rate → same token
 * .3  non-job page → 422 NOT_A_JOB_POSTING
 * .6  21st rating in an hour → 429 RATE_LIMITED
 * .7  SSRF URL (169.254.169.254 metadata) → blocked (422 EXTRACT_FAILED)
 * .8  bad URL → 400 BAD_URL
 * .4  save → job_ratings row
 *
 * Covers: F-005 FR-005.1/.2/.4/.5/.6, BR-005.1/.3/.4, SR-005.1
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { Redis } from "ioredis";
import { RateService } from "../src/candidate/rate/rate.service.js";

const DB_URL = process.env["DATABASE_URL"]!;
const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";
const USER = "05050505-0000-0000-0000-000000000005";
const RLUSER = "05050505-0000-0000-0000-0000000000a5";

const PROFILE = "Senior Engineer at Globex. Built payment systems at Globex; led the platform team. Skills: TypeScript, Postgres, Kubernetes. 5 years experience.";
const JOB = [
  "Senior Engineer at Stripe",
  "Responsibilities: lead the platform team and build payment systems.",
  "Requirements: 5 years of experience with TypeScript and Postgres.",
  "We are hiring. Apply now. Benefits included.",
].join("\n");
const NEWS = "Breaking: the city council voted this morning on a new park budget. Residents gathered downtown to celebrate the announcement.";

async function outcome(fn: () => Promise<unknown>): Promise<{ status: number; code: string }> {
  try { await fn(); return { status: 200, code: "NO_ERROR" }; }
  catch (e) {
    const ex = e as { getStatus?: () => number; response?: { code?: string } };
    return { status: ex.getStatus?.() ?? 0, code: ex.response?.code ?? "UNKNOWN" };
  }
}

describe("TC-005 rate-a-job", () => {
  let sql: ReturnType<typeof postgres>;
  let redis: Redis;
  const svc = new RateService();

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 });
    for (const u of [USER, RLUSER]) {
      await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${u}, ${u + "@test.dev"}, 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
      await sql`INSERT INTO candidate_profiles (id, user_id, parsed_text) VALUES (gen_random_uuid(), ${u}, ${PROFILE}) ON CONFLICT (user_id) DO UPDATE SET parsed_text = ${PROFILE}`;
      await redis.del(`rate:limit:${u}`);
    }
  });
  afterAll(async () => {
    for (const u of [USER, RLUSER]) {
      await redis.del(`rate:limit:${u}`);
      await sql`DELETE FROM job_ratings WHERE user_id = ${u}`;
      await sql`DELETE FROM candidate_profiles WHERE user_id = ${u}`;
      await sql`DELETE FROM users WHERE id = ${u}`;
    }
    await redis.quit();
    await sql.end();
  });

  it(".1 pasted JD → 6-dimension rating + band + token (AC-005.1.1)", async () => {
    const r = await svc.rate({ jdText: JOB }, USER);
    expect(r.dimensions).toHaveLength(6);
    expect(["A", "B", "C", "D", "F"]).toContain(r.overallBand);
    expect(r.overallScore).toBeGreaterThan(0);                  // NFR-005.3
    expect(r.rateToken).toMatch(/^[0-9a-f-]{36}$/);
    for (const d of r.dimensions) expect(d.explanation.length).toBeGreaterThan(0); // FR-005.7

    // Held ephemerally — readable by token.
    const held = await svc.getRating(r.rateToken);
    expect(held.rateToken).toBe(r.rateToken);
  });

  it(".9 idempotent re-rate of the same JD → same token (within TTL)", async () => {
    const a = await svc.rate({ jdText: JOB }, USER);
    const b = await svc.rate({ jdText: JOB }, USER);
    expect(b.rateToken).toBe(a.rateToken);
  });

  it(".3 non-job page → 422 NOT_A_JOB_POSTING", async () => {
    expect(await outcome(() => svc.rate({ jdText: NEWS }, USER))).toEqual({ status: 422, code: "NOT_A_JOB_POSTING" });
  });

  it(".8 bad URL → 400 BAD_URL (BR-005.4)", async () => {
    expect(await outcome(() => svc.rate({ jobUrl: "ftp://example.com/x" }, USER))).toEqual({ status: 400, code: "BAD_URL" });
  });

  it(".7 SSRF metadata URL → blocked → 422 EXTRACT_FAILED (SR-005.1)", async () => {
    expect(await outcome(() => svc.rate({ jobUrl: "http://169.254.169.254/latest/meta-data/" }, USER)))
      .toEqual({ status: 422, code: "EXTRACT_FAILED" });
  });

  it(".6 21st rating in an hour → 429 RATE_LIMITED (BR-005.3)", async () => {
    await redis.set(`rate:limit:${RLUSER}`, "20", "EX", 3600);  // already at the cap this window
    expect(await outcome(() => svc.rate({ jdText: JOB }, RLUSER))).toEqual({ status: 429, code: "RATE_LIMITED" });
  });

  it(".4 save → job_ratings row (FR-005.4)", async () => {
    const r = await svc.rate({ jdText: JOB }, USER);
    const saved = await svc.saveRating(r.rateToken, USER);
    expect(saved.saved).toBe(true);
    const [row] = await sql`SELECT fit_score, band FROM job_ratings WHERE id = ${saved.ratingId} AND user_id = ${USER}`;
    expect(row!["fit_score"]).toBe(r.overallScore);
    expect(row!["band"]).toBe(r.overallBand);
  });
});
