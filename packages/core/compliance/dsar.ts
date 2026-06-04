/**
 * F-082 — DSAR tooling (export / delete).
 * Identity-verified; deletion verified across all stores.
 * Outcome data is anonymized, not deleted (FR-082.3).
 */

export interface DsarExportRequest {
  userId: string;
  verificationToken: string;
  requestId: string;
}

export interface DsarDeleteRequest {
  userId: string;
  verificationToken: string;
  requestId: string;
}

export interface DsarResult {
  requestId: string;
  status: "completed" | "pending" | "failed";
  exportUrl?: string;
  residualPiiCount?: number;
  completedAt?: string;
}

// F-082 — out of Sprint A scope (Platform Sprint W11-12). Real bindings so the
// ESM re-export resolves; bodies throw until implemented.
export function exportUserData(_req: DsarExportRequest): Promise<DsarResult> {
  throw new Error("F-082 DSAR export not implemented — Platform Sprint");
}
export function deleteUserData(_req: DsarDeleteRequest): Promise<DsarResult> {
  throw new Error("F-082 DSAR delete not implemented — Platform Sprint");
}
