/**
 * TC-080.1 — Compliance decision log (immutable, fail-closed, idempotent).
 *
 * - writeDecisionLog without consentRef → ConsentMissingError
 * - valid entry → returns logId + hashChain
 * - [R3] duplicate idempotency_key → idempotent (returns existing); repeat decision with
 *   the SAME inputs_hash but a DIFFERENT idempotency_key is a NEW row (legitimate re-screen)
 * - app_role has NO UPDATE/DELETE on compliance_decision_log (append-only)
 *
 * Covers: F-080, architect fix R3
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { writeDecisionLog, ConsentMissingError, __setSql } from "../compliance/decision-log.js";

const DB_URL = process.env["DATABASE_URL"]!;

describe("TC-080.1 Decision log", () => {
  let sql: ReturnType<typeof postgres>;
  const inputsHash = "tc0801-" + "a".repeat(57); // 64 chars

  beforeAll(() => {
    sql = postgres(DB_URL, { max: 2 });
    __setSql(sql);
  });

  afterAll(async () => {
    await sql`DELETE FROM compliance_decision_log WHERE inputs_hash = ${inputsHash}`;
    await sql.end();
  });

  const baseEntry = {
    decisionType: "screening" as const,
    accountId: "00000000-0000-0000-0000-000000000001",
    candidateAnonymizedId: "anon-xyz",
    orgId: "00000000-0000-0000-0000-000000000002",
    inputsHash,
    idempotencyKey: "tc0801-idem-1",
    modelVersion: "claude-opus-4-8",
    promptVersion: "engine.persona_synth",
    rationale: "Strong demonstrated ability across required dimensions.",
    consentRef: "00000000-0000-0000-0000-000000000003",
    region: "uae",
  };

  it("throws ConsentMissingError without consentRef", async () => {
    await expect(
      writeDecisionLog({ ...baseEntry, consentRef: "" })
    ).rejects.toBeInstanceOf(ConsentMissingError);
  });

  it("writes a valid entry with a hash chain", async () => {
    const result = await writeDecisionLog(baseEntry);
    expect(result.logId).toBeTruthy();
    expect(result.hashChain).toMatch(/^[0-9a-f]{64}$/);
  });

  it("[R3] duplicate idempotency_key is idempotent (returns existing)", async () => {
    const a = await writeDecisionLog(baseEntry);
    const b = await writeDecisionLog(baseEntry);
    expect(b.logId).toBe(a.logId);
  });

  it("[R3] same inputs_hash, different idempotency_key → NEW row (legitimate re-screen)", async () => {
    const a = await writeDecisionLog({ ...baseEntry, idempotencyKey: "tc0801-idem-A" });
    const b = await writeDecisionLog({ ...baseEntry, idempotencyKey: "tc0801-idem-B" });
    expect(b.logId).not.toBe(a.logId);
    const rows = await sql`SELECT count(*)::int AS n FROM compliance_decision_log WHERE inputs_hash = ${inputsHash}`;
    expect(rows[0]!["n"]).toBeGreaterThanOrEqual(3); // base + A + B
  });

  it("app_role cannot UPDATE or DELETE the decision log (append-only)", async () => {
    const upd = await sql`SELECT has_table_privilege('app_role', 'compliance_decision_log', 'UPDATE') AS x`;
    const del = await sql`SELECT has_table_privilege('app_role', 'compliance_decision_log', 'DELETE') AS x`;
    const ins = await sql`SELECT has_table_privilege('app_role', 'compliance_decision_log', 'INSERT') AS x`;
    expect(upd[0]!["x"]).toBe(false);
    expect(del[0]!["x"]).toBe(false);
    expect(ins[0]!["x"]).toBe(true);
  });
});
