/**
 * F-050 — Cite-markers.
 * Every AI-generated artifact carries cite:knowledge_id refs linking it to the evidence
 * that drove it. This is both the anti-hallucination substrate and the outcome-loop feed.
 */

export interface CiteMarker {
  knowledgeId: string;
  docType: "persona" | "jd" | "user-doc" | "help" | "outcome";
  sourceRef: string;
  confidence: number;
  region?: string;
}

export interface ArtifactWithCitations {
  artifactId: string;
  content: string;
  citations: CiteMarker[];
  modelVersion: string;
  promptVersion: string;
  generatedAt: string;
}

export declare function attachCiteMarkers(content: string, markers: CiteMarker[]): ArtifactWithCitations;
export declare function resolveCiteMarker(knowledgeId: string): Promise<CiteMarker | null>;
