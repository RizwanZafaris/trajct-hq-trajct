/**
 * TC-080.2 [FIX R4] — Hash-chain concurrency.
 *
 * N concurrent writeDecisionLog calls must produce a LINEAR chain (no fork). The
 * pg_advisory_xact_lock serializes the read-prev → insert so two writers can never
 * read the same prevHash. verifyChain() re-walks the chain and must report valid.
 *
 * Covers: F-080, architect fix R4
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { writeDecisionLog, verifyChain, __setSql } from "../compliance/decision-log.js";

const DB_URL = process.env["DATABASE_URL"]!;
const N = 25;
const MARK = "tc0802-concurrency";

describe("TC-080.2 chain concurrency (no fork)", () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(() => {
    // A pool with several connections so the writers genuinely contend on the advisory lock.
    sql = postgres(DB_URL, { max: 8 });
    __setSql(sql);
  });

  afterAll(async () => {
    await sql`DELETE FROM compliance_decision_log WHERE inputs_hash = ${MARK}`;
    await sql.end();
  });

  it(`${N} concurrent writes form a linear chain (verifyChain valid)`, async () => {
    const from = new Date(Date.now() - 1000).toISOString();

    const results = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        writeDecisionLog({
          decisionType: "screening",
          accountId: "00000000-0000-0000-0000-000000000001",
          candidateAnonymizedId: `anon-${i}`,
          orgId: "00000000-0000-0000-0000-000000000002",
          inputsHash: MARK,                       // same inputs_hash on purpose (re-screens)
          idempotencyKey: `tc0802-${i}`,          // distinct idempotency keys → N rows
          modelVersion: "claude-opus-4-8",
          promptVersion: "engine.test",
          rationale: `decision ${i}`,
          consentRef: "00000000-0000-0000-0000-000000000003",
          region: "uae",
        })
      )
    );

    // All N wrote a distinct row with a distinct hash (no two share a prevHash → no fork).
    const hashes = new Set(results.map((r) => r.hashChain));
    expect(hashes.size).toBe(N);

    // The full chain over the window verifies linearly.
    const to = new Date(Date.now() + 1000).toISOString();
    const verification = await verifyChain(from, to);
    expect(verification.valid).toBe(true);
    expect(verification.brokenAtSeq).toBeUndefined();

    // Exactly N rows for our marker, with N distinct chain_seq (insertion order).
    const rows = await sql`SELECT count(*)::int AS n, count(DISTINCT chain_seq)::int AS d FROM compliance_decision_log WHERE inputs_hash = ${MARK}`;
    expect(rows[0]!["n"]).toBe(N);
    expect(rows[0]!["d"]).toBe(N);
  });

  it("verifyChain detects a tampered row (chain break)", async () => {
    // Tamper with one row's rationale (as superuser, bypassing the append-only grant)
    // to prove verifyChain actually catches a fork/edit.
    const [victim] = await sql`SELECT id FROM compliance_decision_log WHERE inputs_hash = ${MARK} ORDER BY chain_seq ASC LIMIT 1 OFFSET 5`;
    await sql`UPDATE compliance_decision_log SET rationale = 'TAMPERED' WHERE id = ${victim!["id"] as string}`;

    const from = new Date(Date.now() - 5000).toISOString();
    const to = new Date(Date.now() + 1000).toISOString();
    const verification = await verifyChain(from, to);
    expect(verification.valid).toBe(false);
    expect(verification.brokenAtSeq).toBeDefined();
  });
});
