/**
 * Provider registry. The five primary providers + the OpenRouter safety rail.
 * Each is fetch-based (no SDK) so the gateway has zero install-time provider deps.
 */

import { AnthropicProvider } from "./anthropic.js";
import { GoogleProvider } from "./google.js";
import { OpenAICompatibleProvider } from "./openai-compatible.js";
import type { RawProvider } from "../types.js";

export const openaiProvider = new OpenAICompatibleProvider({
  name: "openai",
  baseUrl: "https://api.openai.com/v1",
  apiKeyEnv: "OPENAI_API_KEY",
  servesPrefixes: ["gpt-", "o1", "text-embedding-"],
});

export const deepseekProvider = new OpenAICompatibleProvider({
  name: "deepseek",
  baseUrl: process.env["DEEPSEEK_BASE_URL"] ?? "https://api.deepseek.com/v1",
  apiKeyEnv: "DEEPSEEK_API_KEY",
  servesPrefixes: ["deepseek-"],
});

export const moonshotProvider = new OpenAICompatibleProvider({
  name: "moonshot",
  baseUrl: process.env["MOONSHOT_BASE_URL"] ?? "https://api.moonshot.ai/v1",
  apiKeyEnv: "MOONSHOT_API_KEY",
  servesPrefixes: ["kimi-", "moonshot-"],
});

export const anthropicProvider = new AnthropicProvider();
export const googleProvider = new GoogleProvider();

/** OpenRouter — the safety fallback rail. Serves the provider/model namespace. */
export const openrouterProvider = new OpenAICompatibleProvider({
  name: "openrouter",
  baseUrl: process.env["OPENROUTER_BASE_URL"] ?? "https://openrouter.ai/api/v1",
  apiKeyEnv: "OPENROUTER_API_KEY",
  servesPrefixes: ["anthropic/", "openai/", "google/", "deepseek/", "moonshot/"],
  extraHeaders: {
    "HTTP-Referer": process.env["OPENROUTER_SITE_URL"] ?? "https://trajct.app",
    "X-Title": process.env["OPENROUTER_APP_NAME"] ?? "Trajct",
  },
});

/** Primary providers, in resolution order. OpenRouter is NOT here — it's the fallback only. */
export const PRIMARY_PROVIDERS: RawProvider[] = [
  anthropicProvider,
  openaiProvider,
  googleProvider,
  deepseekProvider,
  moonshotProvider,
];

/** Resolve the primary provider that serves a model, or undefined. */
export function resolvePrimaryProvider(model: string): RawProvider | undefined {
  return PRIMARY_PROVIDERS.find((p) => p.serves(model));
}
