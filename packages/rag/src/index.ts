/**
 * @trajct/rag — Retrieval-Augmented Generation pipeline.
 *
 * Technical-Methodology §3 defines exactly when RAG is appropriate vs. SQL/scoring.
 * Read §3.1 before adding any RAG use case.
 *
 * Pipeline: ingest → chunk → embed → store → retrieve → rerank → generate with citations
 *
 * Trust wall: owner_scope + region filters are applied INSIDE the SQL query, not post-hoc.
 * See Technical-Methodology §3.2 (Metadata per chunk / Retrieval).
 */

export type { ChunkMetadata, RetrievalResult } from "./types.js";
export { retrieve, hybridRetrieve } from "./retrieval.js";
export { ingestDocument } from "./ingest.js";
