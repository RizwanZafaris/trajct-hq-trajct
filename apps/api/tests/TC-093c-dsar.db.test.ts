/**
 * TC-093c (db) — DSAR export/delete (candidate wiring around the F-082 engine).
 * .3 identity check (401 IDENTITY_UNVERIFIED) · .1 export (machine-readable bundle)
 * .2/.4 delete: verified removal (residualPii=0) + outcomes anonymized (not destroyed)
 * .5 re-request during processing → 409 DELETE_PENDING
 * Covers FR-093c.1/.2/.3/.4, BR-093c.1, AC-093c.1/.2/.3/.4.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { DsarService } from "../src/candidate/dsar/dsar.service.js";

const DB_URL = process.env["DATABASE_URL"]!;
const EXPUSER = "093c093c-0000-0000-0000-0000000000e1";
const DELUSER = "093c093c-0000-0000-0000-0000000000d1";
const VUSER = "093c093c-0000-0000-0000-0000000000f1";
const PUSER = "093c093c-0000-0000-0000-0000000000a1";
const OUTCOME_CO = "00000000-0000-0000-0000-0000000093cc";

async function outcome(fn: () => Promise<unknown>): Promise<{ status: number; code: string }> {
  try { await fn(); return { status: 200, code: "NO_ERROR" }; }
  catch (e) {
    const ex = e as { getStatus?: () => number; response?: { code?: string } };
    return { status: ex.getStatus?.() ?? 0, code: ex.response?.code ?? "UNKNOWN" };
  }
}

describe("TC-093c dsar", () => {
  let sql: ReturnType<typeof postgres>;
  const svc = new DsarService();
  let delRequestId = "";

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    for (const u of [EXPUSER, DELUSER, VUSER, PUSER]) {
      await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${u}, ${u + "@test.dev"}, 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
    }
    // DELUSER gets candidate-private data + an outcome event (to prove erase + anonymize).
    await sql`INSERT INTO resumes (id, user_id) VALUES (gen_random_uuid(), ${DELUSER})`;
    await sql`INSERT INTO candidate_profiles (id, user_id) VALUES (gen_random_uuid(), ${DELUSER}) ON CONFLICT (user_id) DO NOTHING`;
    await sql`INSERT INTO resume_versions (id, resume_id, user_id, version_no, content) VALUES (gen_random_uuid(), gen_random_uuid(), ${DELUSER}, 1, 'private')`;
    await sql`INSERT INTO outcome_events (user_id, company_id, outcome, consent_ref) VALUES (${DELUSER}, ${OUTCOME_CO}, 'interview', gen_random_uuid())`;
  });
  afterAll(async () => {
    await sql`DELETE FROM outcome_events WHERE company_id = ${OUTCOME_CO}`;
    // dsar_requests: by id for the deleted user (its user_id was nulled), by user_id for survivors.
    if (delRequestId) await sql`DELETE FROM dsar_requests WHERE id = ${delRequestId}`;
    for (const u of [EXPUSER, DELUSER, VUSER, PUSER]) {
      await sql`DELETE FROM dsar_requests WHERE user_id = ${u}`;
      await sql`DELETE FROM resume_versions WHERE user_id = ${u}`;
      await sql`DELETE FROM candidate_profiles WHERE user_id = ${u}`;
      await sql`DELETE FROM resumes WHERE user_id = ${u}`;
      await sql`DELETE FROM users WHERE id = ${u}`;
    }
    await sql.end();
  });

  it(".3 invalid identity token → 401 IDENTITY_UNVERIFIED (BR-093c.1)", async () => {
    expect(await outcome(() => svc.requestExport(VUSER, "wrong-token"))).toEqual({ status: 401, code: "IDENTITY_UNVERIFIED" });
    expect(await outcome(() => svc.requestDelete(VUSER, "wrong-token"))).toEqual({ status: 401, code: "IDENTITY_UNVERIFIED" });
  });

  it(".1 export → machine-readable bundle ready (AC-093c.1)", async () => {
    const token = DsarService.expectedToken(EXPUSER);
    const r = await svc.requestExport(EXPUSER, token);
    expect(r.requestType).toBe("export");
    expect(r.exportReady).toBe(true);
    const [row] = await sql`SELECT status FROM dsar_requests WHERE id = ${r.requestId}`;
    expect(row!["status"]).toBe("completed");
  });

  it(".2/.4 delete → verified removal (residualPii=0) + outcomes anonymized (AC-093c.2/.3/.4)", async () => {
    const token = DsarService.expectedToken(DELUSER);
    const r = await svc.requestDelete(DELUSER, token);
    delRequestId = r.requestId;

    expect(r.residualPiiCount).toBe(0);                 // verified removal — no residual PII
    expect((r.anonymizedOutcomeCount ?? 0)).toBeGreaterThanOrEqual(1);

    // User row gone (no financial records → hard delete); private rows gone.
    const [u] = await sql`SELECT count(*)::int AS n FROM users WHERE id = ${DELUSER}`;
    expect(u!["n"]).toBe(0);
    const [v] = await sql`SELECT count(*)::int AS n FROM resume_versions WHERE user_id = ${DELUSER}`;
    expect(v!["n"]).toBe(0);

    // Outcome retained but anonymized (user_id NULL) — the loop's moat, never re-identifiable.
    const [o] = await sql`SELECT user_id, anonymized_at FROM outcome_events WHERE company_id = ${OUTCOME_CO} LIMIT 1`;
    expect(o!["user_id"]).toBeNull();
    expect(o!["anonymized_at"]).toBeTruthy();
  });

  it(".5 re-request while a delete is processing → 409 DELETE_PENDING", async () => {
    await sql`INSERT INTO dsar_requests (id, user_id, request_type, status) VALUES (gen_random_uuid(), ${PUSER}, 'delete', 'processing')`;
    const token = DsarService.expectedToken(PUSER);
    expect(await outcome(() => svc.requestDelete(PUSER, token))).toEqual({ status: 409, code: "DELETE_PENDING" });
  });
});
