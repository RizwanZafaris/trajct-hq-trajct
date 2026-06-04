/**
 * Provider-agnostic AI layer types (F-057).
 * The tiers are the contract; model names resolve from env (Technical-Methodology §4.2).
 */

export type { TaskTier } from "./pricing.js";
import type { TaskTier } from "./pricing.js";

export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// ---------------------------------------------------------------------------
// Public gateway request/response
// ---------------------------------------------------------------------------

export interface CompletionRequest {
  task: string;
  taskTier: TaskTier;
  messages: ChatMessage[];
  accountId: string;
  idempotencyKey: string;
  /** Projected cost in USD cents — used for the pre-spend cap check. If omitted, gateway estimates. */
  projectedCostCents?: number;
  /** Required for compliance-adjacent tasks (F-080). */
  consentRef?: string;
  maxTokens?: number;
  temperature?: number;
  /** Force JSON output where the provider supports it. */
  jsonMode?: boolean;
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
  /** True when the OpenRouter safety fallback served this call. */
  usedFallback: boolean;
}

/** Alias used by the sprint spec — same shape as CompletionResult. */
export type GatewayResponse = CompletionResult;
export type GatewayRequest = CompletionRequest;

export interface EmbedRequest {
  texts: string[];
  accountId: string;
  idempotencyKey: string;
  projectedCostCents?: number;
  modelVersion?: string;
}

export interface EmbedResult {
  embeddings: number[][];
  modelVersion: string;
  inputTokens: number;
  actualCostCents: number;
}

// ---------------------------------------------------------------------------
// Raw provider interface (wire-level adapters in providers/*)
// ---------------------------------------------------------------------------

export interface RawChatRequest {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  jsonMode: boolean;
  timeoutMs: number;
}

export interface RawChatResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface RawEmbedResult {
  embeddings: number[][];
  inputTokens: number;
  model: string;
}

/** A wire-level provider. Throws ProviderError (with retriable flag) on failure. */
export interface RawProvider {
  name: string;
  /** Which model-name prefixes this provider serves (e.g. "claude-", "gpt-"). */
  serves(model: string): boolean;
  chat(req: RawChatRequest): Promise<RawChatResult>;
  embed?(model: string, texts: string[], timeoutMs: number): Promise<RawEmbedResult>;
}

export class ProviderError extends Error {
  readonly status: number;
  readonly retriable: boolean;
  readonly provider: string;
  constructor(provider: string, status: number, message: string, retriable: boolean) {
    super(`[${provider}] ${status}: ${message}`);
    this.name = "ProviderError";
    this.provider = provider;
    this.status = status;
    this.retriable = retriable;
  }
}

/** Retriable conditions that trigger the OpenRouter fallback rail (per llm_fallback.py). */
export function isRetriableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || status === 408;
}
