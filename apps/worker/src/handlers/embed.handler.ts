/**
 * q.embed — Embedding generation for the RAG pipeline.
 *
 * Job types:
 *   embed.chunk    → generic RAG chunk (from packages/rag ingestDocument)
 *   embed.resume   → resume text (owner_scope=user)
 *   embed.jd       → job description (owner_scope=org)
 *   embed.persona  → persona doc chunk (owner_scope=global)
 *
 * Trust wall: owner_scope + owner_id + region set correctly per source.
 * Idempotent: content_hash dedups re-embedding of unchanged text.
 */

import { Worker, type Job } from "bullmq";
import { createHash } from "crypto";
import postgres from "postgres";
import { QUEUE_NAMES, getRedisConnection } from "../queues.js";
import { gateway, SYSTEM_ACCOUNT_ID } from "../gateway.js";

let _sql: ReturnType<typeof postgres> | null = null;
function sql(): ReturnType<typeof postgres> {
  if (!_sql) _sql = postgres(process.env["DATABASE_URL"] ?? "postgresql://trajct:trajct_dev_password@localhost:5434/trajct_dev", { max: 4 });
  return _sql;
}

export interface EmbedChunkJobData {
  type: "embed.chunk";
  docId: string; chunkIndex: number; content: string; contentHash: string;
  ownerScope: "user" | "org" | "global"; ownerId: string | null;
  region: string; docType: string; consentRef: string | null; ingestedAt: string;
}
export interface EmbedResumeJobData { type: "embed.resume"; resumeId: string; userId: string; region: string; content?: string; idempotencyKey: string; }
export interface EmbedJdJobData { type: "embed.jd"; jobPostingId: string; orgId: string; region: string; content?: string; idempotencyKey: string; }
export interface EmbedPersonaJobData { type: "embed.persona"; companyId: string; documentText: string; region: string; idempotencyKey: string; }

export type EmbedJobData = EmbedChunkJobData | EmbedResumeJobData | EmbedJdJobData | EmbedPersonaJobData;

export function createEmbedWorker(): Worker<EmbedJobData> {
  const connection = getRedisConnection();
  return new Worker<EmbedJobData>(
    QUEUE_NAMES.EMBED,
    async (job: Job<EmbedJobData>) => {
      const { type } = job.data;
      console.log(`[embed] Job ${job.id} type=${type}`);
      switch (type) {
        case "embed.chunk":   return handleEmbedChunk(job.data);
        case "embed.resume":  return handleEmbedResume(job.data);
        case "embed.jd":      return handleEmbedJd(job.data);
        case "embed.persona": return handleEmbedPersona(job.data);
        default: throw new Error(`Unknown embed job type`);
      }
    },
    { connection, concurrency: 20 }
  );
}

/** Embed a text and write one vectors.embeddings row with trust-wall scope. */
async function storeEmbedding(opts: {
  text: string; ownerScope: string; ownerId: string | null; region: string;
  docType: string; sourceRef: string; consentRef: string | null;
  metadata: Record<string, unknown>; idempotencyKey: string;
}): Promise<void> {
  const contentHash = createHash("sha256").update(opts.text).digest("hex");

  // Idempotency: skip if an identical chunk already embedded for this owner.
  const existing = await sql()`
    SELECT id FROM vectors.embeddings
    WHERE content_hash = ${contentHash} AND owner_scope = ${opts.ownerScope}
      AND (owner_id = ${opts.ownerId}::uuid OR (${opts.ownerId}::uuid IS NULL AND owner_id IS NULL))
    LIMIT 1
  `;
  if (existing.length > 0) {
    console.log(`[embed] skip — already embedded (${contentHash.slice(0, 12)})`);
    return;
  }

  const embedRes = await gateway().embed({
    texts: [opts.text],
    accountId: SYSTEM_ACCOUNT_ID,
    idempotencyKey: opts.idempotencyKey,
  });
  const vec = embedRes.embeddings[0];
  if (!vec) throw new Error("no embedding returned");

  await sql()`
    INSERT INTO vectors.embeddings
      (owner_scope, owner_id, region, doc_type, embedding_model_version, embedding,
       content_hash, source_ref, consent_ref, metadata)
    VALUES
      (${opts.ownerScope}, ${opts.ownerId}::uuid, ${opts.region}, ${opts.docType},
       ${embedRes.modelVersion}, ${`[${vec.join(",")}]`}::vector,
       ${contentHash}, ${opts.sourceRef}, ${opts.consentRef}::uuid,
       ${sql().json({ ...opts.metadata, content: opts.text, contentHash })})
  `;
  console.log(`[embed] stored ${opts.docType} ${opts.sourceRef} (${contentHash.slice(0, 12)})`);
}

async function handleEmbedChunk(d: EmbedChunkJobData): Promise<void> {
  await storeEmbedding({
    text: d.content, ownerScope: d.ownerScope, ownerId: d.ownerId, region: d.region,
    docType: d.docType, sourceRef: `${d.docId}:${d.chunkIndex}`, consentRef: d.consentRef,
    metadata: { docId: d.docId, chunkIndex: d.chunkIndex, ingestedAt: d.ingestedAt },
    idempotencyKey: `embed:${d.docId}:${d.chunkIndex}`,
  });
}

async function handleEmbedResume(d: EmbedResumeJobData): Promise<void> {
  let text = d.content;
  if (!text) {
    const [row] = await sql()`SELECT parsed_text FROM resumes WHERE id = ${d.resumeId} AND user_id = ${d.userId} LIMIT 1`;
    text = (row?.["parsed_text"] as string | undefined) ?? "";
  }
  if (!text) { console.warn(`[embed:resume] no text for ${d.resumeId}`); return; }
  await storeEmbedding({
    text, ownerScope: "user", ownerId: d.userId, region: d.region, docType: "resume",
    sourceRef: `resume:${d.resumeId}`, consentRef: null,
    metadata: { resumeId: d.resumeId }, idempotencyKey: d.idempotencyKey,
  });
}

async function handleEmbedJd(d: EmbedJdJobData): Promise<void> {
  let text = d.content;
  if (!text) {
    const [row] = await sql()`SELECT COALESCE(edited_jd, generated_jd) AS jd FROM job_postings WHERE id = ${d.jobPostingId} LIMIT 1`;
    text = (row?.["jd"] as string | undefined) ?? "";
  }
  if (!text) { console.warn(`[embed:jd] no text for ${d.jobPostingId}`); return; }
  await storeEmbedding({
    text, ownerScope: "org", ownerId: d.orgId, region: d.region, docType: "jd",
    sourceRef: `jd:${d.jobPostingId}`, consentRef: null,
    metadata: { jobPostingId: d.jobPostingId }, idempotencyKey: d.idempotencyKey,
  });
}

async function handleEmbedPersona(d: EmbedPersonaJobData): Promise<void> {
  await storeEmbedding({
    text: d.documentText, ownerScope: "global", ownerId: d.companyId, region: d.region, docType: "persona",
    sourceRef: `persona:${d.companyId}`, consentRef: null,
    metadata: { companyId: d.companyId }, idempotencyKey: d.idempotencyKey,
  });
}
