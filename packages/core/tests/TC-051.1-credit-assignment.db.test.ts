/**
 * TC-051.1 — Credit assignment.
 *
 * - interview_win → +0.05 spread across cited knowledge (clamped ≤1.0)
 * - offer/hire → +0.10
 * - rejection → -0.01 (clamped ≥0.0)
 * - outcome_events.credit_assigned = true after processing (idempotent re-run = no-op)
 *
 * Covers: F-051
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { logOutcome, __setSql as setOutcomeSql } from "../engine/outcome.js";
import { assignCredit, CREDIT_DELTA, __setSql as setLoopSql } from "../engine/outcome-loop.js";

const DB_URL = process.env["DATABASE_URL"]!;
const USER = "eeeeeeee-0000-0000-0000-0000000051a1";
const COMPANY = "eeeeeeee-0000-0000-0000-0000000051b2";

async function scoreOf(sql: ReturnType<typeof postgres>, knowledgeId: string): Promise<number> {
  const [row] = await sql`SELECT outcome_score FROM knowledge_refs WHERE knowledge_id = ${knowledgeId}`;
  return parseFloat(String(row!["outcome_score"]));
}

describe("TC-051.1 Credit assignment", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    setOutcomeSql(sql);
    setLoopSql(sql);
    await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${USER}, 'tc051@test.dev', 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
    await sql`DELETE FROM knowledge_refs WHERE knowledge_id LIKE 'k-051-%'`;
  });

  afterAll(async () => {
    await sql`DELETE FROM outcome_events WHERE user_id = ${USER}`;
    await sql`DELETE FROM knowledge_refs WHERE knowledge_id LIKE 'k-051-%'`;
    await sql`DELETE FROM users WHERE id = ${USER}`;
    await sql.end();
  });

  it("interview_win spreads +0.05 across 2 cited knowledge atoms", async () => {
    const rec = await logOutcome({
      userId: USER, companyId: COMPANY, outcome: "interview_win",
      artifactIds: [], citeMarkers: ["k-051-a", "k-051-b"],
      consentRef: "00000000-0000-0000-0000-0000000000c1", idempotencyKey: "tc051-win",
    });
    const result = await assignCredit(rec.id);

    expect(result.knowledgeUpdated).toBe(2);
    expect(result.delta).toBe(CREDIT_DELTA["interview_win"]);
    // 0.5 prior + (0.05 / 2) = 0.525
    expect(await scoreOf(sql, "k-051-a")).toBeCloseTo(0.525, 3);
    expect(await scoreOf(sql, "k-051-b")).toBeCloseTo(0.525, 3);
  });

  it("offer → +0.10 and triggers persona evolution", async () => {
    const rec = await logOutcome({
      userId: USER, companyId: COMPANY, outcome: "offer",
      artifactIds: [], citeMarkers: ["k-051-c"],
      consentRef: "00000000-0000-0000-0000-0000000000c1", idempotencyKey: "tc051-offer",
    });
    const result = await assignCredit(rec.id);
    expect(result.triggeredPersonaEvolve).toBe(true);
    // 0.5 + 0.10 = 0.60
    expect(await scoreOf(sql, "k-051-c")).toBeCloseTo(0.60, 3);
  });

  it("rejection → -0.01 (clamped ≥ 0)", async () => {
    const rec = await logOutcome({
      userId: USER, companyId: COMPANY, outcome: "rejection",
      artifactIds: [], citeMarkers: ["k-051-d"],
      consentRef: "00000000-0000-0000-0000-0000000000c1", idempotencyKey: "tc051-rej",
    });
    await assignCredit(rec.id);
    // 0.5 - 0.01 = 0.49
    expect(await scoreOf(sql, "k-051-d")).toBeCloseTo(0.49, 3);
  });

  it("marks credit_assigned and is idempotent on re-run", async () => {
    const rec = await logOutcome({
      userId: USER, companyId: COMPANY, outcome: "interview_win",
      artifactIds: [], citeMarkers: ["k-051-e"],
      consentRef: "00000000-0000-0000-0000-0000000000c1", idempotencyKey: "tc051-idem",
    });
    await assignCredit(rec.id);
    const second = await assignCredit(rec.id); // re-run → no-op
    expect(second.knowledgeUpdated).toBe(0);

    const [row] = await sql`SELECT credit_assigned FROM outcome_events WHERE id = ${rec.id}`;
    expect(row!["credit_assigned"]).toBe(true);
  });
});
