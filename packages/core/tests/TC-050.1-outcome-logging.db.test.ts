/**
 * TC-050.1 — Outcome logging.
 *
 * - logOutcome with valid consentRef → OutcomeRecord with id
 * - missing consentRef → throws (consent required)
 * - duplicate idempotency_key → returns the same row (ON CONFLICT)
 *
 * Covers: F-050
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { logOutcome, getOutcome, OutcomeConsentMissingError, __setSql } from "../engine/outcome.js";

const DB_URL = process.env["DATABASE_URL"]!;
const USER = "dddddddd-0000-0000-0000-0000000050a1";
const COMPANY = "dddddddd-0000-0000-0000-0000000050b2";

describe("TC-050.1 Outcome logging", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    __setSql(sql);
    await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${USER}, 'tc050@test.dev', 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
  });

  afterAll(async () => {
    await sql`DELETE FROM outcome_events WHERE user_id = ${USER}`;
    await sql`DELETE FROM users WHERE id = ${USER}`;
    await sql.end();
  });

  it("logs an outcome with consent and returns a record", async () => {
    const rec = await logOutcome({
      userId: USER, companyId: COMPANY, jobId: undefined,
      outcome: "interview_win", artifactIds: [], citeMarkers: ["k-050-1"],
      consentRef: "00000000-0000-0000-0000-0000000000c1",
      idempotencyKey: "tc050-key-1",
    });
    expect(rec.id).toBeTruthy();
    expect(rec.outcome).toBe("interview_win");
    expect(rec.creditAssigned).toBe(false);

    const fetched = await getOutcome(rec.id);
    expect(fetched?.id).toBe(rec.id);
  });

  it("throws without consentRef", async () => {
    await expect(
      logOutcome({
        userId: USER, companyId: COMPANY, outcome: "offer",
        artifactIds: [], citeMarkers: [], consentRef: "",
      })
    ).rejects.toBeInstanceOf(OutcomeConsentMissingError);
  });

  it("duplicate idempotency_key → same row (no double count)", async () => {
    const a = await logOutcome({
      userId: USER, companyId: COMPANY, outcome: "hire",
      artifactIds: [], citeMarkers: ["k-050-2"],
      consentRef: "00000000-0000-0000-0000-0000000000c1",
      idempotencyKey: "tc050-dup",
    });
    const b = await logOutcome({
      userId: USER, companyId: COMPANY, outcome: "hire",
      artifactIds: [], citeMarkers: ["k-050-2"],
      consentRef: "00000000-0000-0000-0000-0000000000c1",
      idempotencyKey: "tc050-dup",
    });
    expect(b.id).toBe(a.id);

    const count = await sql`SELECT COUNT(*)::int AS n FROM outcome_events WHERE idempotency_key = 'tc050-dup'`;
    expect(count[0]!["n"]).toBe(1);
  });
});
