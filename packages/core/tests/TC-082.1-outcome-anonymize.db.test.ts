/**
 * TC-082.1 [FIX R2] — Outcome anonymization on account deletion.
 *
 * Two guarantees:
 *   (a) Schema-level: a raw user removal nulls user_id but the outcome row SURVIVES
 *       (FK ON DELETE SET NULL) — the moat is never destroyed.
 *   (b) DSAR-level: deleteUserData anonymizes outcomes FIRST (user_id NULL + anonymized_at
 *       set), erases private rows, and reports residualPiiCount = 0.
 *
 * Covers: F-082, FR-082.3, architect fix R2
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { logOutcome, __setSql as setOutcomeSql } from "../engine/outcome.js";
import { deleteUserData, __setSql as setDsarSql } from "../compliance/dsar.js";

const DB_URL = process.env["DATABASE_URL"]!;
const U1 = "82828282-0000-0000-0000-000000000001"; // schema-level (raw delete)
const U2 = "82828282-0000-0000-0000-000000000002"; // DSAR-level
const COMPANY = "82828282-0000-0000-0000-0000000000c1";

describe("TC-082.1 outcome anonymization", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 3 });
    setOutcomeSql(sql);
    setDsarSql(sql);
    for (const u of [U1, U2]) {
      await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${u}, ${u + "@t.dev"}, 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
    }
  });

  afterAll(async () => {
    await sql`DELETE FROM outcome_events WHERE company_id = ${COMPANY}`;
    await sql`DELETE FROM users WHERE id IN (${U1}, ${U2})`;
    await sql.end();
  });

  it("(a) raw user removal → outcome survives with user_id NULL (FK SET NULL)", async () => {
    await logOutcome({
      userId: U1, companyId: COMPANY, outcome: "hire",
      artifactIds: [], citeMarkers: ["k-082-a"],
      consentRef: "00000000-0000-0000-0000-0000000000c1", idempotencyKey: "tc082-raw",
    });
    await sql`DELETE FROM users WHERE id = ${U1}`;
    const [row] = await sql`SELECT user_id FROM outcome_events WHERE idempotency_key = 'tc082-raw'`;
    expect(row).toBeDefined();
    expect(row!["user_id"]).toBeNull();
  });

  it("(b) deleteUserData anonymizes FIRST (user_id NULL + anonymized_at set), residualPii = 0", async () => {
    await logOutcome({
      userId: U2, companyId: COMPANY, outcome: "offer",
      artifactIds: [], citeMarkers: ["k-082-b"],
      consentRef: "00000000-0000-0000-0000-0000000000c1", idempotencyKey: "tc082-dsar",
    });

    const result = await deleteUserData({ userId: U2, verificationToken: "verified", requestId: "req-082" });

    expect(result.status).toBe("completed");
    expect(result.residualPiiCount).toBe(0);
    expect(result.anonymizedOutcomeCount).toBeGreaterThanOrEqual(1);

    // The outcome row survives, anonymized (user_id NULL + anonymized_at set).
    const [row] = await sql`SELECT user_id, anonymized_at FROM outcome_events WHERE idempotency_key = 'tc082-dsar'`;
    expect(row).toBeDefined();
    expect(row!["user_id"]).toBeNull();
    expect(row!["anonymized_at"]).not.toBeNull();

    // The user row is gone (no retained financial records for this test user).
    const [u] = await sql`SELECT count(*)::int AS n FROM users WHERE id = ${U2}`;
    expect(u!["n"]).toBe(0);
  });
});
