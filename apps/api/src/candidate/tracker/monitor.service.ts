import { Injectable, HttpException } from "@nestjs/common";
import { randomUUID } from "crypto";
import postgres from "postgres";
import type { CreateMonitor } from "@trajct/contracts";

/**
 * F-015 — Passive job monitoring config (the alert pipeline runs in the worker cron and applies
 * decideAlert from @trajct/core/engine). Config only here: targets, threshold, cap, snooze/pause.
 *
 *  - [BR-015.1] ≤20 companies, ≤10 roles → 400 TARGET_LIMIT (exact code).
 *  - [BR-015.6/FR-015.5] snooze/pause/resume NEVER delete target setup — they flip flags only.
 *  - Monitors are candidate-private (RLS); the row carries user_id.
 */
@Injectable()
export class MonitorService {
  private sql: ReturnType<typeof postgres> | null = null;
  private getSql(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }

  async createMonitor(data: CreateMonitor, userId: string): Promise<{ monitorId: string }> {
    if ((data.targetCompanies?.length ?? 0) > 20 || (data.targetRoles?.length ?? 0) > 10) {
      throw this.err(400, "TARGET_LIMIT", "Up to 20 companies and 10 roles.");
    }
    const monitorId = randomUUID();
    await this.getSql()`
      INSERT INTO job_monitors
        (id, user_id, query_name, keywords, target_companies, target_roles, locations, filters,
         fit_threshold, cap_mode, alert_cap_per_day, frequency, is_active, paused)
      VALUES
        (${monitorId}, ${userId}, ${data.queryName}, ${this.getSql().json(data.keywords as never)},
         ${this.getSql().json(data.targetCompanies as never)}, ${this.getSql().json(data.targetRoles as never)},
         ${this.getSql().json(data.locations as never)}, ${this.getSql().json(data.filters as never)},
         ${data.fitThreshold}, ${data.capMode}, ${data.alertCapPerDay}, ${data.frequency}, true, false)
    `;
    return { monitorId };
  }

  async listMonitors(userId: string): Promise<unknown[]> {
    const rows = await this.getSql()`
      SELECT id, query_name, target_companies, target_roles, fit_threshold, cap_mode,
             alert_cap_per_day, is_active, paused, snooze_until, created_at
      FROM job_monitors WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    return [...rows];
  }

  async deleteMonitor(monitorId: string, userId: string): Promise<void> {
    await this.getSql()`DELETE FROM job_monitors WHERE id = ${monitorId} AND user_id = ${userId}`;
  }

  /** FR-015.5 — snooze for a window; targets are preserved. */
  async snooze(monitorId: string, userId: string, snoozeUntil: string): Promise<{ monitorId: string; snoozeUntil: string }> {
    await this.getSql()`
      UPDATE job_monitors SET snooze_until = ${snoozeUntil}, updated_at = now()
      WHERE id = ${monitorId} AND user_id = ${userId}
    `;
    return { monitorId, snoozeUntil };
  }

  /** FR-015.5/BR-015.6 — pause/resume flips a flag only; setup is never lost. */
  async setPaused(monitorId: string, userId: string, paused: boolean): Promise<{ monitorId: string; paused: boolean }> {
    await this.getSql()`
      UPDATE job_monitors SET paused = ${paused}, updated_at = now()
      WHERE id = ${monitorId} AND user_id = ${userId}
    `;
    return { monitorId, paused };
  }

  private err(status: number, code: string, message: string): HttpException {
    return new HttpException({ code, message, retryable: false }, status);
  }
}
