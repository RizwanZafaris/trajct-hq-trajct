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

export declare function exportUserData(req: DsarExportRequest): Promise<DsarResult>;
export declare function deleteUserData(req: DsarDeleteRequest): Promise<DsarResult>;
