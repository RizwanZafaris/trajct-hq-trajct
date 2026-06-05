/**
 * TC-015 (db) — monitor config. Targets, limits, snooze/pause never lose setup.
 * Covers BR-015.1 (TARGET_LIMIT), FR-015.1 (persist), FR-015.5/BR-015.6 (snooze/pause preserve setup).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { MonitorService } from "../src/candidate/tracker/monitor.service.js";
import { CreateMonitorSchema } from "@trajct/contracts";

const DB_URL = process.env["DATABASE_URL"]!;
const USER = "01515015-0000-0000-0000-000000000015";

async function outcome(fn: () => Promise<unknown>): Promise<{ status: number; code: string }> {
  try { await fn(); return { status: 200, code: "NO_ERROR" }; }
  catch (e) {
    const ex = e as { getStatus?: () => number; response?: { code?: string } };
    return { status: ex.getStatus?.() ?? 0, code: ex.response?.code ?? "UNKNOWN" };
  }
}

describe("TC-015 monitor config", () => {
  let sql: ReturnType<typeof postgres>;
  const svc = new MonitorService();

  beforeAll(async () => {
    sql = postgres(DB_URL, { max: 2 });
    await sql`INSERT INTO users (id, email, user_type, password_hash) VALUES (${USER}, 'tc015@test.dev', 'candidate', 'h') ON CONFLICT (id) DO NOTHING`;
  });
  afterAll(async () => {
    await sql`DELETE FROM job_alerts WHERE user_id = ${USER}`;
    await sql`DELETE FROM job_monitors WHERE user_id = ${USER}`;
    await sql`DELETE FROM users WHERE id = ${USER}`;
    await sql.end();
  });

  it("[BR-015.1] >20 companies → 400 TARGET_LIMIT", async () => {
    const over = {
      queryName: "x", keywords: [], targetCompanies: Array.from({ length: 21 }, (_, i) => `Co${i}`),
      targetRoles: [], locations: [], filters: {}, fitThreshold: "B" as const, capMode: "instant" as const,
      alertCapPerDay: 5, frequency: "daily" as const,
    };
    expect(await outcome(() => svc.createMonitor(over, USER))).toEqual({ status: 400, code: "TARGET_LIMIT" });
  });

  it("[FR-015.1] valid monitor persists with user_id; [FR-015.5] snooze + pause preserve setup", async () => {
    const data = CreateMonitorSchema.parse({ queryName: "PM at fintechs", targetCompanies: ["Stripe", "Visa"], targetRoles: ["Senior PM"], fitThreshold: "A" });
    const { monitorId } = await svc.createMonitor(data, USER);

    let [row] = await sql`SELECT user_id, target_roles, fit_threshold, paused, snooze_until FROM job_monitors WHERE id = ${monitorId}`;
    expect(row!["user_id"]).toBe(USER);
    expect(row!["fit_threshold"]).toBe("A");
    expect(row!["paused"]).toBe(false);

    // Snooze: window set, targets intact (BR-015.6).
    await svc.snooze(monitorId, USER, "2026-07-01T00:00:00.000Z");
    // Pause: flag flips, setup preserved.
    await svc.setPaused(monitorId, USER, true);
    [row] = await sql`SELECT target_roles, paused, snooze_until FROM job_monitors WHERE id = ${monitorId}`;
    expect(row!["paused"]).toBe(true);
    expect(row!["snooze_until"]).toBeTruthy();
    expect(row!["target_roles"]).toEqual(["Senior PM"]);   // never lost

    // Resume preserves it all too.
    await svc.setPaused(monitorId, USER, false);
    [row] = await sql`SELECT paused, target_roles FROM job_monitors WHERE id = ${monitorId}`;
    expect(row!["paused"]).toBe(false);
    expect(row!["target_roles"]).toEqual(["Senior PM"]);
  });
});
