/**
 * TC-001.10 [FIX R5] — Anonymous diagnostics are Redis-only.
 *
 * - anonymous diagnose → diag_token returned; Redis blob exists; NO Postgres row (invariant #10)
 * - authenticated diagnose → Redis blob AND a diagnostic_results row (user_id set)
 *
 * Covers: F-001 BR-001.7, architect fix R5, invariant #10
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Redis } from "ioredis";
import postgres from "postgres";
import { DiagnosticService } from "../src/diagnostic/diagnostic.service.js";

const DB_URL = process.env["DATABASE_URL"]!;
const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";
const USER = "01010101-0000-0000-0000-000000000010";

const RESUME = `Jane Roe
jane@example.com | linkedin.com/in/janeroe
Experience: Staff Engineer at Globex building payment systems and leading a platform team.
Education: MS Computer Science.
Skills: TypeScript, Postgres, distributed systems, Kubernetes, mentoring.
` + "delivered measurable platform improvements across several quarters. ".repeat(30);

describe("TC-001.10 anonymous diagnostics are Redis-only", () => {
  let sql: ReturnType<typeof postgres>;
  let redis: Redis;
  const svc = new DiagnosticService();
  const tokens: string[] = [];

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 });
    await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${USER}, 'tc00110@test.dev', 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
  });

  afterAll(async () => {
    for (const t of tokens) await redis.del(`diag:${t}`);
    await sql`DELETE FROM diagnostic_results WHERE user_id = ${USER}`;
    await sql`DELETE FROM users WHERE id = ${USER}`;
    await redis.quit();
    await sql.end();
  });

  it("anonymous → Redis blob present, ZERO Postgres rows", async () => {
    const res = await svc.diagnose({ resumeText: RESUME, target: "Senior Platform Engineer at a fintech" }, null);
    tokens.push(res.diag_token);

    expect(res.status).toBe("processing");
    const blob = await redis.get(`diag:${res.diag_token}`);
    expect(blob).toBeTruthy();
    expect(JSON.parse(blob!).userId).toBeNull();

    // [R5] No Postgres row for an anonymous diagnosis.
    const rows = await sql`SELECT count(*)::int AS n FROM diagnostic_results WHERE diag_token = ${res.diag_token}`;
    expect(rows[0]!["n"]).toBe(0);
  });

  it("authenticated → Redis blob AND a Postgres row (user_id set)", async () => {
    const res = await svc.diagnose({ resumeText: RESUME, target: "Senior Platform Engineer" }, USER);
    tokens.push(res.diag_token);

    const blob = await redis.get(`diag:${res.diag_token}`);
    expect(blob).toBeTruthy();

    const rows = await sql`SELECT user_id, status FROM diagnostic_results WHERE diag_token = ${res.diag_token}`;
    expect(rows.length).toBe(1);
    expect(rows[0]!["user_id"]).toBe(USER);
    expect(rows[0]!["status"]).toBe("processing");
  });
});
