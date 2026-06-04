/**
 * Document ingestion pipeline.
 * Structure-aware chunking: splits on headings/sections, target 300–500 tokens,
 * 10–15% overlap, never splits mid-table or mid-bullet-list.
 *
 * Skeleton — implemented when F-052 persona synthesis is built.
 */

import type { ChunkMetadata } from "./types.js";

export interface IngestRequest {
  content: string;
  metadata: Omit<ChunkMetadata, "contentHash" | "ingestedAt">;
}

export declare function ingestDocument(req: IngestRequest): Promise<{ chunkCount: number; docId: string }>;
