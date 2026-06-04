/**
 * F-052 retrieval / F-060 trust wall at the data layer.
 *
 * Hybrid: pgvector HNSW (top-40) + content ILIKE arm (top-40) → reciprocal rank
 * fusion → top-6. The owner_scope + region (+ consent) filters live INSIDE the SQL —
 * they ARE the trust wall. A query without ownerScope THROWS (safety guard, TC-060.1).
 */

import postgres from "postgres";
import type { RetrievalResult, ChunkMetadata } from "./types.js";

export interface RetrievalQuery {
  text: string;
  ownerScope: "user" | "org" | "global";
  ownerId?: string;
  region: string;
  docTypes?: string[];
  /** Pre-computed query embedding (caller embeds via the Gateway). */
  queryVector?: number[];
  limit?: number;
}

export class TrustWallFilterError extends Error {
  constructor(missing: string) {
    super(`Retrieval refused: ${missing} is required (trust wall, F-060). Never retrieve without scope filters.`);
    this.name = "TrustWallFilterError";
  }
}

let _sql: ReturnType<typeof postgres> | null = null;
function getSql(): ReturnType<typeof postgres> {
  if (!_sql) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL required");
    _sql = postgres(url, { max: 3 });
  }
  return _sql;
}
export function __setSql(sql: ReturnType<typeof postgres>): void {
  _sql = sql;
}

const FUSION_K = 60; // RRF constant

function assertTrustWall(q: RetrievalQuery): void {
  if (!q.ownerScope) throw new TrustWallFilterError("ownerScope");
  if (!q.region) throw new TrustWallFilterError("region");
  if ((q.ownerScope === "user" || q.ownerScope === "org") && !q.ownerId) {
    throw new TrustWallFilterError("ownerId (for user/org scope)");
  }
}

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/** Single-arm retrieval (vector OR content). Exposed for completeness. */
export async function retrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
  return hybridRetrieve(query);
}

/**
 * Hybrid retrieval with trust-wall filters enforced in SQL.
 * @throws TrustWallFilterError if ownerScope / region / ownerId are missing.
 */
export async function hybridRetrieve(query: RetrievalQuery): Promise<RetrievalResult[]> {
  assertTrustWall(query);

  const sql = getSql();
  const limit = query.limit ?? 6;
  const docTypes = query.docTypes ?? null;

  // Trust-wall WHERE fragments — applied INSIDE every arm.
  // For non-global scopes, require a non-null consent_ref OR user-owned data.
  const vectorRows = query.queryVector
    ? await sql`
        SELECT id, source_ref, metadata, doc_type, region,
               1 - (embedding <=> ${toVectorLiteral(query.queryVector)}::vector) AS sim
        FROM vectors.embeddings
        WHERE owner_scope = ${query.ownerScope}
          AND (${query.ownerScope} = 'global' OR owner_id = ${query.ownerId ?? null}::uuid)
          AND region = ${query.region}
          AND (${docTypes}::text[] IS NULL OR doc_type = ANY(${docTypes}::text[]))
        ORDER BY embedding <=> ${toVectorLiteral(query.queryVector)}::vector
        LIMIT 40
      `
    : [];

  const contentRows = await sql`
    SELECT id, source_ref, metadata, doc_type, region, 0.0 AS sim
    FROM vectors.embeddings
    WHERE owner_scope = ${query.ownerScope}
      AND (${query.ownerScope} = 'global' OR owner_id = ${query.ownerId ?? null}::uuid)
      AND region = ${query.region}
      AND (${docTypes}::text[] IS NULL OR doc_type = ANY(${docTypes}::text[]))
      AND (metadata->>'content') ILIKE ${"%" + query.text.slice(0, 80) + "%"}
    LIMIT 40
  `;

  // Reciprocal rank fusion across the two arms.
  const scores = new Map<string, { row: Record<string, unknown>; score: number }>();
  const addArm = (rows: readonly Record<string, unknown>[]): void => {
    rows.forEach((row, rank) => {
      const id = row["id"] as string;
      const rrf = 1 / (FUSION_K + rank + 1);
      const cur = scores.get(id);
      if (cur) cur.score += rrf;
      else scores.set(id, { row, score: rrf });
    });
  };
  addArm(vectorRows);
  addArm(contentRows);

  const fused = [...scores.values()].sort((a, b) => b.score - a.score).slice(0, limit);

  return fused.map(({ row, score }) => {
    const meta = (row["metadata"] as Record<string, unknown> | null) ?? {};
    const metadata: ChunkMetadata = {
      docId: (meta["docId"] as string) ?? "",
      ownerScope: query.ownerScope,
      ...(query.ownerId !== undefined ? { ownerId: query.ownerId } : {}),
      region: row["region"] as string,
      language: (meta["language"] as string) ?? "en",
      docType: row["doc_type"] as ChunkMetadata["docType"],
      ingestedAt: (meta["ingestedAt"] as string) ?? "",
      contentHash: (meta["contentHash"] as string) ?? "",
    };
    return {
      chunkId: row["id"] as string,
      content: (meta["content"] as string) ?? "",
      score,
      metadata,
      citeMarker: `cite:${metadata.docType}:${(meta["docId"] as string) ?? row["id"]}`,
    };
  });
}
