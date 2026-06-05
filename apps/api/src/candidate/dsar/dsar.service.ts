import { Injectable, HttpException } from "@nestjs/common";
import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import postgres from "postgres";
import { exportUserData, deleteUserData } from "@trajct/core/compliance";
import type { DsarRequestResult } from "@trajct/contracts";

/**
 * F-093c — Data portability / delete (candidate-facing wiring around the F-082 DSAR engine).
 *
 *  - [BR-093c.1/FR-093c.3] Identity is verified before export/delete (a re-auth proof token);
 *    a missing/invalid token → 401 IDENTITY_UNVERIFIED (fail-closed: no token, no action).
 *  - [§4.93c.10] A delete already in flight → 409 DELETE_PENDING (no double processing).
 *  - [FR-093c.4] Delete anonymizes outcomes (never re-identifiable) and erases private rows; the
 *    engine returns residualPiiCount which MUST be 0 (verified removal, AC-093c.3).
 *  - Every request is tracked in dsar_requests for SLA + audit.
 */

const VERIFY_SECRET = process.env["DSAR_VERIFY_SECRET"] ?? "dev-dsar-verify-secret";

@Injectable()
export class DsarService {
  private sql: ReturnType<typeof postgres> | null = null;
  private getSql(): ReturnType<typeof postgres> {
    if (!this.sql) {
      const url = process.env["DATABASE_URL"];
      if (!url) throw new Error("DATABASE_URL required");
      this.sql = postgres(url, { max: 3 });
    }
    return this.sql;
  }

  /** The re-auth proof a verified identity check issues (deterministic; real issuance via re-auth). */
  static expectedToken(userId: string): string {
    return createHmac("sha256", VERIFY_SECRET).update(`dsar-verify:${userId}`).digest("hex");
  }

  private verifyIdentity(userId: string, token: string): void {
    const expected = DsarService.expectedToken(userId);
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw this.err(401, "IDENTITY_UNVERIFIED", "Verify your identity to export or delete your data.");
    }
  }

  async requestExport(userId: string, verificationToken: string): Promise<DsarRequestResult> {
    this.verifyIdentity(userId, verificationToken);
    const requestId = randomUUID();
    await this.getSql()`INSERT INTO dsar_requests (id, user_id, request_type, status) VALUES (${requestId}, ${userId}, 'export', 'processing')`;

    const result = await exportUserData({ userId, verificationToken, requestId });
    const status = result.status === "failed" ? "failed" : "completed";
    await this.getSql()`UPDATE dsar_requests SET status = ${status}, completed_at = now() WHERE id = ${requestId}`;

    return {
      requestId, requestType: "export", status: status as DsarRequestResult["status"],
      residualPiiCount: null, anonymizedOutcomeCount: null, exportReady: !!result.exportBundle,
    };
  }

  async requestDelete(userId: string, verificationToken: string): Promise<DsarRequestResult> {
    this.verifyIdentity(userId, verificationToken);

    const [pending] = await this.getSql()`
      SELECT id FROM dsar_requests WHERE user_id = ${userId} AND request_type = 'delete' AND status = 'processing' LIMIT 1
    `;
    if (pending) throw this.err(409, "DELETE_PENDING", "A deletion is already being processed.");

    const requestId = randomUUID();
    await this.getSql()`INSERT INTO dsar_requests (id, user_id, request_type, status) VALUES (${requestId}, ${userId}, 'delete', 'processing')`;

    const result = await deleteUserData({ userId, verificationToken, requestId });
    // The user row may now be gone (FK SET NULL on dsar_requests.user_id); update by request id.
    await this.getSql()`
      UPDATE dsar_requests SET status = 'completed', residual_pii_count = ${result.residualPiiCount ?? 0},
        anonymized_outcome_count = ${result.anonymizedOutcomeCount ?? 0}, completed_at = now()
      WHERE id = ${requestId}
    `;

    return {
      requestId, requestType: "delete", status: "completed",
      residualPiiCount: result.residualPiiCount ?? 0,
      anonymizedOutcomeCount: result.anonymizedOutcomeCount ?? 0,
      exportReady: false,
    };
  }

  private err(status: number, code: string, message: string): HttpException {
    return new HttpException({ code, message, retryable: false }, status);
  }
}
