/**
 * q.ingest — Resume & document ingestion pipeline.
 *
 * Job types:
 *   resume.parse     → Extract text, word count, language from uploaded file
 *   resume.malware   → ClamAV scan (must pass before text extraction)
 *   resume.embed     → Embed parsed text (enqueues q.embed)
 *   jd.extract       → Extract structured data from a raw JD text or URL
 *
 * Retry policy: max 3 attempts, exponential backoff 2s base.
 * Non-retryable: FILE_REJECTED_SECURITY, NOT_A_RESUME, FILE_LOCKED, FILE_TOO_LARGE
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";

// ---- Job data types --------------------------------------------------------

export interface ResumeParsedJobData {
  type: "resume.parse";
  resumeId: string;
  fileKey: string;
  userId: string;
  idempotencyKey: string;
}

export interface ResumeMalwareJobData {
  type: "resume.malware";
  resumeId: string;
  fileKey: string;
  idempotencyKey: string;
}

export interface JdExtractJobData {
  type: "jd.extract";
  jobPostingId: string;
  jdUrl?: string;
  jdText?: string;
  idempotencyKey: string;
}

export type IngestJobData = ResumeParsedJobData | ResumeMalwareJobData | JdExtractJobData;

// ---- Handler ---------------------------------------------------------------

export function createIngestWorker(): Worker<IngestJobData> {
  const connection = getRedisConnection();

  return new Worker<IngestJobData>(
    QUEUE_NAMES.INGEST,
    async (job: Job<IngestJobData>) => {
      const { type } = job.data;
      console.log(`[ingest] Processing job ${job.id} type=${type}`);

      switch (type) {
        case "resume.parse":
          return handleResumeParse(job.data);
        case "resume.malware":
          return handleMalwareScan(job.data);
        case "jd.extract":
          return handleJdExtract(job.data);
        default:
          throw new Error(`Unknown ingest job type`);
      }
    },
    { connection, concurrency: 10 }
  );
}

async function handleResumeParse(data: ResumeParsedJobData): Promise<{ wordCount: number; charCount: number }> {
  console.log(`[ingest:parse] Resume ${data.resumeId} fileKey=${data.fileKey}`);
  // TODO Sprint 1:
  // 1. Download file from R2 (using fileKey)
  // 2. Extract text based on MIME type (pdf-parse, mammoth for DOCX, plain text)
  // 3. Count words and chars
  // 4. Detect language
  // 5. UPDATE resumes SET parsed_text, word_count, char_count, language, parse_status='parsed'
  // 6. If word_count < 150 → UPDATE status='failed', error_code='RESUME_TOO_SHORT'
  // 7. Enqueue q.ai.utility: { type: 'resume.semantic_check', resumeId, ... }
  throw new Error("resume.parse not implemented — Sprint 1");
}

async function handleMalwareScan(data: ResumeMalwareJobData): Promise<{ clean: boolean }> {
  console.log(`[ingest:malware] Scanning ${data.fileKey}`);
  // TODO Sprint 1: ClamAV scan via clamd socket or HTTP API
  // If infected: UPDATE resumes SET parse_status='failed', error_code='FILE_REJECTED_SECURITY'
  //              + delete from R2
  throw new Error("malware scan not implemented — Sprint 1");
}

async function handleJdExtract(data: JdExtractJobData): Promise<{ jdText: string; skills: string[] }> {
  console.log(`[ingest:jd] Extract JD for posting ${data.jobPostingId}`);
  // TODO Sprint 1: Firecrawl or direct fetch for URL, then AI utility extraction
  throw new Error("jd.extract not implemented — Sprint 1");
}
