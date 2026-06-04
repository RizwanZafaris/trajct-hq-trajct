/**
 * TC-073.7 — Duplicate (order_id, idempotency_key) billing_ledger insert fails.
 *
 * Proves: the UNIQUE constraint on (order_id, idempotency_key) prevents double-charge
 * under concurrent retry scenarios. The second insert with the same key is rejected
 * by the DB — not by application code — making this invariant tamper-proof.
 *
 * Covers: BR-073.1, AC-073.1.7, FR-073.2, NFR-073.1
 * Also covers TC-073.2 (idempotent retry class).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";

const TEST_DB_URL =
  process.env["DATABASE_URL"] ??
  "postgresql://trajct:trajct_dev_password@localhost:5432/trajct_dev";

describe("TC-073.7 Billing ledger idempotency constraint", () => {
  let sql: ReturnType<typeof postgres>;
  const testUserId = "cccccccc-0000-0000-0000-000000000003";
  const testOrderId = "order-test-tc073";
  const testIdempotencyKey = "idem-key-tc073-abc123";

  beforeAll(async () => {
    sql = postgres(TEST_DB_URL, { max: 2 });

    // Seed a user for FK constraint
    await sql`
      INSERT INTO users (id, email, user_type, password_hash)
      VALUES (${testUserId}, 'billing-test@tc073.test', 'candidate', 'hash')
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    await sql`DELETE FROM billing_ledger WHERE order_id = ${testOrderId}`;
    await sql`DELETE FROM users WHERE id = ${testUserId}`;
    await sql.end();
  });

  it("first insert succeeds", async () => {
    const result = await sql`
      INSERT INTO billing_ledger (account_id, order_id, idempotency_key, entry_type, amount_cents, currency)
      VALUES (${testUserId}, ${testOrderId}, ${testIdempotencyKey}, 'debit', 1000, 'USD')
      RETURNING id
    `;
    expect(result.length).toBe(1);
  });

  it("duplicate (order_id, idempotency_key) insert throws unique constraint violation", async () => {
    await expect(
      sql`
        INSERT INTO billing_ledger (account_id, order_id, idempotency_key, entry_type, amount_cents, currency)
        VALUES (${testUserId}, ${testOrderId}, ${testIdempotencyKey}, 'debit', 1000, 'USD')
      `
    ).rejects.toThrow(/duplicate key|unique constraint/i);
  });

  it("concurrent inserts with the same key: only one succeeds", async () => {
    const concurrentKey = "idem-key-tc073-concurrent";
    const insertFn = async (): Promise<boolean> => {
      try {
        await sql`
          INSERT INTO billing_ledger (account_id, order_id, idempotency_key, entry_type, amount_cents, currency)
          VALUES (${testUserId}, ${testOrderId}, ${concurrentKey}, 'debit', 500, 'USD')
        `;
        return true;
      } catch {
        return false;
      }
    };

    // Fire 5 concurrent inserts — exactly one should succeed
    const results = await Promise.all([insertFn(), insertFn(), insertFn(), insertFn(), insertFn()]);
    const successCount = results.filter(Boolean).length;

    expect(successCount).toBe(1);

    // Cleanup
    await sql`DELETE FROM billing_ledger WHERE idempotency_key = ${concurrentKey}`;
  });

  it("different idempotency key for same order is allowed (separate line item)", async () => {
    const differentKey = "idem-key-tc073-second-line";
    const result = await sql`
      INSERT INTO billing_ledger (account_id, order_id, idempotency_key, entry_type, amount_cents, currency)
      VALUES (${testUserId}, ${testOrderId}, ${differentKey}, 'credit', 1000, 'USD')
      RETURNING id
    `;
    expect(result.length).toBe(1);
    await sql`DELETE FROM billing_ledger WHERE idempotency_key = ${differentKey}`;
  });
});
