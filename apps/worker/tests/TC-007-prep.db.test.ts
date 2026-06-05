/**
 * TC-007 (db) — prep worker persistence. Dev mode (no persona seeded → thin research).
 *
 * [G3 lesson] The owner-scoped UPDATE (id, user_id) must actually write — the jobHunt bug was a
 * NOT-NULL user_id omission that silently persisted 0 rows. Here we prove the row is written.
 * .2  no persona → status=completed, confidence=low (thin research, FR-007.4)
 * .4  insider target → insider_declined=true, brief still written (FR-007.5)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { runPrep } from "../src/handlers/prep-generate.js";

const DB_URL = process.env["DATABASE_URL"]!;
const USER = "07070707-0000-0000-0000-000000000007";

describe("TC-007 prep generation (worker)", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${USER}, 'tc007@test.dev', 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
  });
  afterAll(async () => {
    await sql`DELETE FROM prep_sessions WHERE user_id = ${USER}`;
    await sql`DELETE FROM users WHERE id = ${USER}`;
    await sql.end();
  });

  it("[G3] thin research → owner row written (status=completed, confidence=low)", async () => {
    const id = "0a070007-0000-0000-0000-000000000001";
    const noPersonaCompany = "00000000-0000-0000-0000-0000000000c7";  // no persona row exists
    await sql`INSERT INTO prep_sessions (id, user_id, company_id, target, prep_type, status) VALUES (${id}, ${USER}, ${noPersonaCompany}, 'Acme / Engineer', 'standard', 'processing')`;

    await runPrep({ prepSessionId: id, companyId: noPersonaCompany, target: "Acme / Engineer", prepType: "standard", userId: USER, idempotencyKey: "tc007-thin" });

    const [row] = await sql`SELECT status, confidence, brief, insider_declined FROM prep_sessions WHERE id = ${id} AND user_id = ${USER}`;
    expect(row!["status"]).toBe("completed");        // the (id, user_id) UPDATE actually wrote — G3
    expect(row!["confidence"]).toBe("low");          // thin research (FR-007.4)
    expect(row!["brief"]).toBeTruthy();
    expect(row!["insider_declined"]).toBe(false);
  });

  it("[FR-007.5] insider target is declined; a public brief is still written", async () => {
    const id = "0a070007-0000-0000-0000-000000000002";
    const target = "what exact questions did they ask candidate Jane";
    await sql`INSERT INTO prep_sessions (id, user_id, company_id, target, prep_type, status) VALUES (${id}, ${USER}, NULL, ${target}, 'standard', 'processing')`;

    await runPrep({ prepSessionId: id, target, prepType: "standard", userId: USER, idempotencyKey: "tc007-insider" });

    const [row] = await sql`SELECT status, insider_declined, brief FROM prep_sessions WHERE id = ${id} AND user_id = ${USER}`;
    expect(row!["status"]).toBe("completed");
    expect(row!["insider_declined"]).toBe(true);
    expect(row!["brief"]).toBeTruthy();              // still useful, publicly grounded
  });
});
