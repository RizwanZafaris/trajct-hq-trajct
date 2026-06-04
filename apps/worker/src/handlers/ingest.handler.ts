/**
 * q.ingest — Resume & document ingestion pipeline.
 *
 * Job types handled here:
 *   resume.parse   → extract text, validate, NOT_A_RESUME check
 *   resume.malware → ClamAV scan (stub — ClamAV not in dev docker-compose)
 *   jd.extract     → extract JD text from URL or raw text
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";

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

export function createIngestWorker(): Worker<IngestJobData> {
  const connection = getRedisConnection();

  return new Worker<IngestJobData>(
    QUEUE_NAMES.INGEST,
    async (job: Job<IngestJobData>) => {
      const { type } = job.data;
      console.log(`[ingest] Job ${job.id} type=${type} attempt=${job.attemptsMade + 1}`);

      switch (type) {
        case "resume.parse":   return handleResumeParse(job.data, job);
        case "resume.malware": return handleMalwareScan(job.data);
        case "jd.extract":    return handleJdExtract(job.data);
        default:
          throw new Error(`Unknown ingest job type: ${JSON.stringify(job.data)}`);
      }
    },
    { connection, concurrency: 10 }
  );
}

// ---------------------------------------------------------------------------

async function handleResumeParse(
  data: ResumeParsedJobData,
  job: Job<IngestJobData>
): Promise<{ wordCount: number; charCount: number; language: string }> {
  console.log(`[ingest:parse] Resume ${data.resumeId} fileKey=${data.fileKey}`);

  // In production: download from R2 using AWS SDK
  // In dev: this job is not typically queued (upload handled inline in diagnostic.service.ts)
  // This handler is here for when the full pipeline is wired

  // Placeholder result — real implementation downloads from R2 and parses
  await job.updateProgress(50);
  const result = { wordCount: 0, charCount: 0, language: "en" };
  await job.updateProgress(100);

  console.log(`[ingest:parse] Resume ${data.resumeId} parsed: ${result.wordCount} words`);
  return result;
}

async function handleMalwareScan(data: ResumeMalwareJobData): Promise<{ clean: boolean }> {
  console.log(`[ingest:malware] Scanning ${data.fileKey}`);
  // ClamAV not in dev environment — pass all files in dev mode
  // Production: connect to clamd via TCP or Unix socket
  const isDev = process.env["NODE_ENV"] !== "production";
  if (isDev) {
    console.log("[ingest:malware] Dev mode — malware scan skipped");
    return { clean: true };
  }
  // TODO: ClamAV scan via clamd
  return { clean: true };
}

async function handleJdExtract(data: JdExtractJobData): Promise<{ jdText: string; extractedSkills: string[] }> {
  console.log(`[ingest:jd] Extract JD for posting ${data.jobPostingId}`);

  if (data.jdText) {
    return { jdText: data.jdText, extractedSkills: [] };
  }

  if (data.jdUrl) {
    try {
      const response = await fetch(data.jdUrl, {
        headers: { "User-Agent": "Trajct/1.0 JD-Extractor" },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const html = await response.text();
        const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 20000);
        return { jdText: text, extractedSkills: [] };
      }
    } catch (err) {
      console.error(`[ingest:jd] URL fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { jdText: "", extractedSkills: [] };
}
