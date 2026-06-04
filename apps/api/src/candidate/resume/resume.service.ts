import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import type { ResumeUploadMeta, Resume } from "@trajct/contracts";

/**
 * F-001 / F-002 / F-003 — Resume management service.
 *
 * Upload pipeline (FR-001.1, FR-001.10):
 *   1. Size check (≤5 MB) — enforced by contract
 *   2. MIME type validation
 *   3. ClamAV malware scan (via q.ingest worker)
 *   4. Text extraction + word count (≥150 words for valid resume — FR-001.2)
 *   5. NOT_A_RESUME semantic check (via AI utility tier)
 *   6. Store parsed text, file key in DB
 */
@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  async uploadResume(
    meta: ResumeUploadMeta,
    fileBuffer: Buffer,
    userId: string
  ): Promise<{ resumeId: string; jobId: string; pollUrl: string }> {
    this.logger.log(`Upload: ${meta.fileName} (${meta.fileSizeBytes}B) for ${userId}`);
    // TODO Sprint 1 (W5-7):
    // 1. Upload raw file to R2 (presigned, private bucket)
    // 2. Enqueue q.ingest job: { type: 'resume.parse', resumeId, fileKey, userId }
    // 3. Create jobs_queue_status row (idempotency_key = meta.idempotencyKey)
    // 4. Return { resumeId, jobId, pollUrl }
    void fileBuffer;
    throw new BadRequestException("F-001 upload not wired — Sprint 1");
  }

  async getResume(resumeId: string, userId: string): Promise<Resume> {
    this.logger.log(`Get resume ${resumeId} for ${userId}`);
    // TODO: SELECT from resumes WHERE id = resumeId AND user_id = userId (RLS also enforces)
    throw new Error("Not implemented");
  }

  async listResumes(userId: string): Promise<Resume[]> {
    void userId;
    // TODO: SELECT * FROM resumes WHERE user_id = userId AND is_active = true
    return [];
  }

  async deleteResume(resumeId: string, userId: string): Promise<void> {
    this.logger.log(`Delete resume ${resumeId} for ${userId}`);
    // TODO: Soft-delete (is_active = false) + queue R2 object deletion
    void resumeId;
  }

  /** Validates resume word count ≥ 150 (FR-001.2, AC-001.1.6) */
  validateWordCount(wordCount: number): void {
    if (wordCount < 150) {
      throw new BadRequestException({
        code: "RESUME_TOO_SHORT",
        message: "Need at least ~150 words to diagnose.",
        retryable: false,
      });
    }
  }
}
