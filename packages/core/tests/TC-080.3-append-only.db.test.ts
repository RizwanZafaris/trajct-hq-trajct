/**
 * TC-080.3 [FIX R1] — Decision log append-only as trajct_app.
 *
 * Under SET ROLE trajct_app (the application write role): INSERT succeeds (insert policy +
 * grant), UPDATE and DELETE are rejected (no grant, no policy). Proves the RLS policy set
 * actually WORKS — the original "RLS enabled with no policy" would have denied INSERT too.
 *
 * Covers: F-080, architect fix R1
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const DB_URL = process.env["DATABASE_URL"]!;
const IDEM = "tc0803-append-only";

describe("TC-080.3 append-only as trajct_app", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(() => { sql = postgres(DB_URL, { max: 2 }); });
  afterAll(async () => {
    await sql`DELETE FROM compliance_decision_log WHERE idempotency_key = ${IDEM}`;
    await sql.end();
  });

  it("INSERT succeeds, UPDATE and DELETE are denied under SET ROLE trajct_app", async () => {
    // Reserve a single dedicated connection so SET ROLE sticks across statements.
    const c = await sql.reserve();
    try {
      await c`SET ROLE trajct_app`;

      // INSERT — must succeed (insert policy WITH CHECK true + INSERT grant).
      await c`
        INSERT INTO compliance_decision_log
          (decision_type, account_id, candidate_anonymized_id, org_id, inputs_hash,
           idempotency_key, model_version, prompt_version, rationale, consent_ref, region, hash_chain)
        VALUES ('screening', gen_random_uuid(), 'anon-803', gen_random_uuid(), 'ih-803',
                ${IDEM}, 'm', 'p', 'rationale', gen_random_uuid(), 'uae', 'chain-803')
      `;

      // UPDATE — must be denied (no UPDATE grant / no policy).
      let updateDenied = false;
      try {
        await c`UPDATE compliance_decision_log SET rationale = 'tampered' WHERE idempotency_key = ${IDEM}`;
      } catch (err) {
        updateDenied = /permission denied/i.test(err instanceof Error ? err.message : String(err));
      }
      expect(updateDenied).toBe(true);

      // DELETE — must be denied.
      let deleteDenied = false;
      try {
        await c`DELETE FROM compliance_decision_log WHERE idempotency_key = ${IDEM}`;
      } catch (err) {
        deleteDenied = /permission denied/i.test(err instanceof Error ? err.message : String(err));
      }
      expect(deleteDenied).toBe(true);

      await c`RESET ROLE`;
    } finally {
      c.release();
    }

    // The row is still there (the mutations were rejected).
    const rows = await sql`SELECT count(*)::int AS n FROM compliance_decision_log WHERE idempotency_key = ${IDEM}`;
    expect(rows[0]!["n"]).toBe(1);
  });
});
