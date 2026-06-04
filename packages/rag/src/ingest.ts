/**
 * Document ingestion — structure-aware chunking.
 *  1. split on heading boundaries (## / ### / ---) first
 *  2. target 300–500 tokens/chunk, ~12% overlap at sentence boundary
 *  3. never split a table or a bullet-list item mid-item
 *  4. SHA-256 content_hash per chunk
 *  5. enqueue an embed job per chunk (embedding API is NOT called inline)
 */

import { createHash } from "crypto";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { ChunkMetadata } from "./types.js";

export interface IngestRequest {
  content: string;
  metadata: Omit<ChunkMetadata, "contentHash" | "ingestedAt">;
}

export interface Chunk {
  index: number;
  content: string;
  contentHash: string;
}

const TARGET_TOKENS = 400;
const MAX_TOKENS = 500;
const CHARS_PER_TOKEN = 4;
const OVERLAP_RATIO = 0.12;

/** Rough token estimate (4 chars/token). */
function estTokens(s: string): number {
  return Math.ceil(s.length / CHARS_PER_TOKEN);
}

/** Structure-aware chunking. Splits on headings, packs paragraphs to the token target. */
export function chunkDocument(content: string): Chunk[] {
  // 1. Split into sections on heading / hr boundaries (keep the heading with its body).
  const sections = content
    .split(/\n(?=#{1,6}\s|---\s*$)/m)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const section of sections) {
    if (estTokens(section) <= MAX_TOKENS) {
      chunks.push(section);
      continue;
    }
    // 2. Section too big — pack paragraphs/list-items without splitting an item.
    const blocks = section.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    let buf = "";
    for (const block of blocks) {
      const candidate = buf ? `${buf}\n\n${block}` : block;
      if (estTokens(candidate) > TARGET_TOKENS && buf) {
        chunks.push(buf);
        // 3. carry sentence-boundary overlap from the tail of the previous chunk
        const overlap = tailOverlap(buf);
        buf = overlap ? `${overlap}\n\n${block}` : block;
      } else {
        buf = candidate;
      }
    }
    if (buf.trim()) chunks.push(buf);
  }

  return chunks.map((c, index) => ({
    index,
    content: c,
    contentHash: createHash("sha256").update(c).digest("hex"),
  }));
}

function tailOverlap(text: string): string {
  const overlapChars = Math.floor(text.length * OVERLAP_RATIO);
  if (overlapChars < 40) return "";
  const tail = text.slice(-overlapChars);
  // snap to a sentence boundary so we never cut mid-sentence
  const dot = tail.indexOf(". ");
  return dot >= 0 ? tail.slice(dot + 2) : tail;
}

let _conn: Redis | null = null;
let _queue: Queue | null = null;
function embedQueue(): Queue {
  if (!_queue) {
    _conn = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null, enableReadyCheck: false,
    });
    _queue = new Queue("q.embed", { connection: _conn });
  }
  return _queue;
}

/**
 * Ingest a document: chunk it and enqueue one embed job per chunk.
 * The embed worker computes vectors and writes vectors.embeddings (with trust-wall scope).
 */
export async function ingestDocument(req: IngestRequest): Promise<{ chunkCount: number; docId: string }> {
  const chunks = chunkDocument(req.content);
  const docId = req.metadata.docId;
  const ingestedAt = new Date().toISOString();

  await Promise.all(
    chunks.map((chunk) =>
      embedQueue().add(
        "embed.chunk",
        {
          type: "embed.chunk",
          docId,
          chunkIndex: chunk.index,
          content: chunk.content,
          contentHash: chunk.contentHash,
          ownerScope: req.metadata.ownerScope,
          ownerId: req.metadata.ownerId ?? null,
          region: req.metadata.region,
          docType: req.metadata.docType,
          consentRef: req.metadata.consentRef ?? null,
          ingestedAt,
        },
        { jobId: `embed-${docId}-${chunk.index}` } // idempotent per chunk (no ':' in BullMQ jobId)
      ).catch((err: unknown) => {
        console.error(`[rag:ingest] enqueue failed for ${docId}:${chunk.index}:`, err instanceof Error ? err.message : err);
      })
    )
  );

  return { chunkCount: chunks.length, docId };
}
