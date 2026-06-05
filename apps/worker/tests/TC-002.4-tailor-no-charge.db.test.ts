/**
 * TC-002.4 [FIX R7/R8] — Fabrication gate + no-charge-on-failure.
 *
 * scan:  scanFabrication flags a company introduced in the résumé but absent from the profile.
 * R8:    a failed build (thin profile / fabrication) → status='failed', ZERO billing_ledger
 *        rows and ZERO usage_events for that build (no charge for halted work).
 * R7:    a successful build writes exactly ONE ledger debit + ONE usage unit — in the worker,
 *        never pre-created.
 *
 * Covers: F-002 FR-002.5/.8, BR-002.1/.5, architect fixes R7, R8, FR-073.4
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { scanFabrication } from "../src/handlers/fabrication-scan.js";
import { runTailor } from "../src/handlers/tailor.js";

const DB_URL = process.env["DATABASE_URL"]!;
const USER = "02020202-0000-0000-0000-000000000002";

const GOOD_PROFILE = "Senior Engineer at Globex. Built payment systems at Globex; led the platform team. Skills: TypeScript, Postgres, Kubernetes. MS Computer Science.";

describe("TC-002.4 fabrication gate + no-charge", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${USER}, 'tc002@test.dev', 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
  });
  afterAll(async () => {
    await sql`DELETE FROM billing_ledger WHERE account_id = ${USER}`;
    await sql`DELETE FROM usage_events WHERE account_id = ${USER}`;
    await sql`DELETE FROM tailored_resumes WHERE user_id = ${USER}`;
    await sql`DELETE FROM candidate_profiles WHERE user_id = ${USER}`;
    await sql`DELETE FROM users WHERE id = ${USER}`;
    await sql.end();
  });

  it("scanFabrication flags an introduced company absent from the profile", async () => {
    const clean = await scanFabrication("Senior Engineer at Globex. Led platform.", GOOD_PROFILE, "k1");
    expect(clean.clean).toBe(true);

    const dirty = await scanFabrication("Senior Engineer at Globex and VP at Initech.", GOOD_PROFILE, "k2");
    expect(dirty.clean).toBe(false);
    expect(dirty.ungrounded.some((u) => /Initech/i.test(u))).toBe(true);
  });

  it("[R8] thin profile → status=failed, NO ledger, NO usage (not charged)", async () => {
    const id = "0a0a0a0a-0000-0000-0000-0000000000f1";
    await sql`INSERT INTO candidate_profiles (id, user_id, parsed_text) VALUES (gen_random_uuid(), ${USER}, 'tiny') ON CONFLICT (user_id) DO UPDATE SET parsed_text='tiny'`;
    await sql`INSERT INTO tailored_resumes (id, user_id, company_id, target_role, status, version) VALUES (${id}, ${USER}, gen_random_uuid(), 'PM', 'processing', 1)`;

    await runTailor({ tailoredResumeId: id, resumeId: "", companyId: "00000000-0000-0000-0000-0000000000c1", targetRole: "PM", userId: USER, idempotencyKey: "tc002-thin" });

    const [tr] = await sql`SELECT status FROM tailored_resumes WHERE id = ${id}`;
    expect(tr!["status"]).toBe("failed");
    const ledger = await sql`SELECT count(*)::int AS n FROM billing_ledger WHERE order_id = ${id}`;
    const usage = await sql`SELECT count(*)::int AS n FROM usage_events WHERE idempotency_key = ${"build-usage:" + id}`;
    expect(ledger[0]!["n"]).toBe(0);   // NO charge for halted work
    expect(usage[0]!["n"]).toBe(0);
  });

  it("[R7] successful build writes exactly ONE ledger debit + ONE usage unit (worker success path)", async () => {
    const id = "0a0a0a0a-0000-0000-0000-0000000000f2";
    await sql`INSERT INTO candidate_profiles (id, user_id, parsed_text) VALUES (gen_random_uuid(), ${USER}, ${GOOD_PROFILE}) ON CONFLICT (user_id) DO UPDATE SET parsed_text=${GOOD_PROFILE}`;
    await sql`INSERT INTO tailored_resumes (id, user_id, company_id, target_role, status, version) VALUES (${id}, ${USER}, gen_random_uuid(), 'Senior Engineer', 'processing', 1)`;

    await runTailor({ tailoredResumeId: id, resumeId: "", companyId: "00000000-0000-0000-0000-0000000000c2", targetRole: "Senior Engineer", userId: USER, idempotencyKey: "tc002-ok" });

    const [tr] = await sql`SELECT status, fabrication_scan_passed, ledger_entry_id FROM tailored_resumes WHERE id = ${id}`;
    expect(tr!["status"]).toBe("completed");
    expect(tr!["fabrication_scan_passed"]).toBe(true);
    expect(tr!["ledger_entry_id"]).toBeTruthy();
    const ledger = await sql`SELECT count(*)::int AS n FROM billing_ledger WHERE order_id = ${id} AND entry_type = 'debit'`;
    const usage = await sql`SELECT count(*)::int AS n FROM usage_events WHERE idempotency_key = ${"build-usage:" + id}`;
    expect(ledger[0]!["n"]).toBe(1);   // charged exactly once, on success
    expect(usage[0]!["n"]).toBe(1);
  });
});
