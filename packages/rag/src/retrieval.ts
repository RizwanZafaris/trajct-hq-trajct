/**
 * Hybrid retrieval: pgvector HNSW (top-40) + Postgres FTS (top-40)
 * → reciprocal rank fusion → rerank to top-6 → context budget cap.
 *
 * Trust wall: ownerScope + region filters applied INSIDE the SQL.
 * Never retrieve without these filters — they ARE the trust wall.
 *
 * Skeleton — implemented in Sprint 2 when RAG is needed for F-052 persona.
 */

import type { RetrievalResult } from "./types.js";

export interface RetrievalQuery {
  text: string;
  ownerScope: "user" | "org" | "global";
  ownerId?: string;
  region: string;
  docTypes?: string[];
  limit?: number;
}

export declare function retrieve(query: RetrievalQuery): Promise<RetrievalResult[]>;
export declare function hybridRetrieve(query: RetrievalQuery): Promise<RetrievalResult[]>;
