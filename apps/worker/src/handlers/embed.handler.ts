/**
 * q.embed — Embedding generation for RAG pipeline.
 *
 * Job types:
 *   embed.resume      → Embed parsed resume text (stored in vectors.embeddings)
 *   embed.jd          → Embed job description
 *   embed.persona     → Embed company persona document chunks
 *
 * Trust wall in embeddings: owner_scope + owner_id + region set correctly.
 * Model version is stored per row so re-embedding is a migration, not a mystery.
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";

export interface EmbedResumeJobData {
  type: "embed.resume";
  resumeId: string;
  userId: string;
  region: string;
  idempotencyKey: string;
}

export interface EmbedJdJobData {
  type: "embed.jd";
  jobPostingId: string;
  orgId: string;
  region: string;
  idempotencyKey: string;
}

export interface EmbedPersonaJobData {
  type: "embed.persona";
  companyId: string;
  documentText: string;
  region: string;
  idempotencyKey: string;
}

export type EmbedJobData = EmbedResumeJobData | EmbedJdJobData | EmbedPersonaJobData;

export function createEmbedWorker(): Worker<EmbedJobData> {
  const connection = getRedisConnection();

  return new Worker<EmbedJobData>(
    QUEUE_NAMES.EMBED,
    async (job: Job<EmbedJobData>) => {
      const { type } = job.data;
      console.log(`[embed] Job ${job.id} type=${type}`);

      switch (type) {
        case "embed.resume":  return handleEmbedResume(job.data);
        case "embed.jd":      return handleEmbedJd(job.data);
        case "embed.persona": return handleEmbedPersona(job.data);
        default: throw new Error(`Unknown embed job type`);
      }
    },
    { connection, concurrency: 20 }  // embeddings are cheap — high concurrency
  );
}

async function handleEmbedResume(data: EmbedResumeJobData): Promise<void> {
  console.log(`[embed:resume] Embed resume ${data.resumeId}`);
  // TODO Sprint 1:
  // 1. Fetch parsed_text from resumes WHERE id = resumeId
  // 2. Gateway.embed({ texts: [parsedText], ... })
  // 3. INSERT INTO vectors.embeddings (owner_scope='user', owner_id=userId, region, ...)
  // 4. Store content_hash to detect re-embedding needs
  throw new Error("Not implemented — Sprint 1");
}

async function handleEmbedJd(data: EmbedJdJobData): Promise<void> {
  console.log(`[embed:jd] Embed JD ${data.jobPostingId}`);
  throw new Error("Not implemented — Sprint 1");
}

async function handleEmbedPersona(data: EmbedPersonaJobData): Promise<void> {
  console.log(`[embed:persona] Embed persona chunk for company ${data.companyId}`);
  throw new Error("Not implemented — Sprint 1");
}
