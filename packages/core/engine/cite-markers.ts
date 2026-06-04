/**
 * F-050 — Cite-markers.
 * Every AI-generated artifact carries cite:knowledge_id refs linking it to the evidence
 * that drove it. Anti-hallucination substrate AND the outcome-loop credit feed.
 *
 * Markers are appended to content as a trailing fenced JSON block so they travel with
 * the artifact and can be parsed back out for credit assignment (F-051).
 */

import postgres from "postgres";

export interface CiteMarker {
  knowledgeId: string;
  docType: "persona" | "jd" | "user-doc" | "help" | "outcome";
  sourceRef: string;
  confidence: number;
  region?: string | undefined;
}

export interface ArtifactWithCitations {
  artifactId: string;
  content: string;
  citations: CiteMarker[];
  modelVersion: string;
  promptVersion: string;
  generatedAt: string;
}

const CITE_BLOCK_RE = /\n<!--cite-markers\n([\s\S]*?)\n-->/;

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

/** Attach cite-markers to content as a trailing JSON comment block. */
export function attachCiteMarkers(content: string, markers: CiteMarker[]): ArtifactWithCitations {
  const block = `\n<!--cite-markers\n${JSON.stringify(markers)}\n-->`;
  return {
    artifactId: "",
    content: content + block,
    citations: markers,
    modelVersion: "",
    promptVersion: "",
    generatedAt: new Date().toISOString(),
  };
}

/** Parse cite-markers back out of artifact content (used by F-051 credit assignment). */
export function extractCiteMarkers(content: string): CiteMarker[] {
  const m = CITE_BLOCK_RE.exec(content);
  if (!m?.[1]) return [];
  try {
    return JSON.parse(m[1]) as CiteMarker[];
  } catch {
    return [];
  }
}

/** Resolve a cite-marker to its knowledge_refs row (or null). */
export async function resolveCiteMarker(knowledgeId: string): Promise<CiteMarker | null> {
  const sql = getSql();
  const [row] = await sql`
    SELECT knowledge_id, doc_type, source_ref, confidence, region
    FROM knowledge_refs WHERE knowledge_id = ${knowledgeId} LIMIT 1
  `;
  if (!row) return null;
  return {
    knowledgeId: row.knowledge_id as string,
    docType: row.doc_type as CiteMarker["docType"],
    sourceRef: (row.source_ref as string | null) ?? "",
    confidence: parseFloat((row.confidence as string | null) ?? "0"),
    region: (row.region as string | null) ?? undefined,
  };
}

/** Upsert a knowledge ref (called when an artifact is generated). */
export async function upsertKnowledgeRef(marker: CiteMarker): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO knowledge_refs (knowledge_id, doc_type, source_ref, confidence, region)
    VALUES (${marker.knowledgeId}, ${marker.docType}, ${marker.sourceRef}, ${marker.confidence}, ${marker.region ?? "global"})
    ON CONFLICT (knowledge_id) DO UPDATE SET
      source_ref = EXCLUDED.source_ref,
      confidence = EXCLUDED.confidence,
      updated_at = NOW()
  `;
}
