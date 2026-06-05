/**
 * @trajct/rag — Retrieval-Augmented Generation pipeline.
 *
 * Technical-Methodology §3 defines exactly when RAG is appropriate vs. SQL/scoring.
 * RAG ONLY where a citable corpus exists (personas, user docs, help). Never for matching.
 *
 * Trust wall (F-060): owner_scope + region (+ consent) filters are applied INSIDE the
 * retrieval SQL, never post-hoc. hybridRetrieve THROWS without scope filters.
 */

export type { ChunkMetadata, RetrievalResult } from "./types.js";
export { retrieve, hybridRetrieve, TrustWallFilterError } from "./retrieval.js";
export type { RetrievalQuery } from "./retrieval.js";
export { ingestDocument, chunkDocument } from "./ingest.js";
export type { IngestRequest, Chunk } from "./ingest.js";
