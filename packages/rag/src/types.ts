/**
 * RAG pipeline types — Technical-Methodology §3.2.
 */

export interface ChunkMetadata {
  docId: string;
  ownerScope: "user" | "org" | "global";
  ownerId?: string;
  companyId?: string;
  region: string;
  language: string;
  docType: "persona" | "jd" | "user-doc" | "help" | "outcome";
  sourceUrl?: string;
  ingestedAt: string;
  contentHash: string;
  consentRef?: string;
}

export interface RetrievalResult {
  chunkId: string;
  content: string;
  score: number;
  metadata: ChunkMetadata;
  citeMarker: string;
}
