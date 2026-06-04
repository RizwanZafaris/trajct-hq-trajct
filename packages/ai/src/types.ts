/**
 * Provider-agnostic AI layer types (F-057).
 * Models are placeholders — the tiers are the contract (Technical-Methodology §4.2).
 */

export type TaskTier = "frontier" | "mid" | "utility" | "embed";

export interface CompletionRequest {
  task: string;
  taskTier: TaskTier;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  accountId: string;
  idempotencyKey: string;
  /** Projected cost in USD cents — used for pre-spend cap check */
  projectedCostCents: number;
  /** Required for compliance-adjacent tasks (F-080) */
  consentRef?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  content: string;
  modelVersion: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  actualCostCents: number;
  provider: string;
  durationMs: number;
}

export interface EmbedRequest {
  texts: string[];
  accountId: string;
  idempotencyKey: string;
  projectedCostCents: number;
  modelVersion?: string;
}

export interface EmbedResult {
  embeddings: number[][];
  modelVersion: string;
  inputTokens: number;
  actualCostCents: number;
}

/** Provider adapter interface */
export interface LlmProvider {
  name: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
  embed(req: EmbedRequest): Promise<EmbedResult>;
}
