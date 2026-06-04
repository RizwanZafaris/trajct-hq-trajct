import { Injectable, Logger } from "@nestjs/common";
import type { DiagnosticUploadRequest, DiagnosticUploadResponse, DiagnosticResult } from "@trajct/contracts";

/**
 * F-001 — Diagnostic upload service skeleton.
 * The upload enqueues a job in q.ingest; the result is polled via job ID.
 * p95 ≤ 8s — implemented as streaming job held for up to 10s before poll fallback.
 */
@Injectable()
export class DiagnosticService {
  private readonly logger = new Logger(DiagnosticService.name);

  async enqueueUpload(
    req: DiagnosticUploadRequest,
    fileBuffer: Buffer,
    userId: string
  ): Promise<DiagnosticUploadResponse> {
    this.logger.log(`Diagnostic upload: ${req.fileName} (${req.fileSizeBytes} bytes) for user ${userId}`);
    // TODO: implement in Sprint 1 (Weeks 5-7)
    // 1. Size check (≤5MB, from contract)
    // 2. MIME type validation
    // 3. ClamAV scan (via worker q.ingest)
    // 4. Semantic NOT_A_RESUME check
    // 5. Enqueue in BullMQ q.ingest
    // 6. Create jobs_queue_status row
    // 7. Return polling URL
    void fileBuffer;
    throw new Error("F-001 not implemented yet — Sprint 1 (Weeks 5-7)");
  }

  async getResult(diagnosticId: string, userId: string): Promise<DiagnosticResult> {
    void userId;
    this.logger.log(`Poll diagnostic: ${diagnosticId}`);
    throw new Error("F-001 not implemented yet — Sprint 1 (Weeks 5-7)");
  }
}
