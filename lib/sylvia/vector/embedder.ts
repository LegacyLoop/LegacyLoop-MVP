// lib/sylvia/vector/embedder.ts
//
// CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 v2.1 R29 P-WAVE-20-PHASE-3 · 2026-05-18
//
// Embedding adapter · BINDING #10 single egress preserved.
// ALL embedding HTTP routes through LiteLLM Gateway (process.env.LITELLM_GATEWAY_URL).
// NO direct OpenAI fetch. NO direct Ollama fetch. LiteLLM proxies both.
//
// Primary: text-embedding-3-small (1536 dim · OpenAI · ~$0.02 per 1M tokens)
// Fallback: nomic-embed-text (768 dim · Ollama local · $0 · fail-soft on hard fail)

import type { EmbeddingModel, EmbedderConfig } from "./types";

const GATEWAY_URL =
  process.env.LITELLM_GATEWAY_URL ?? "http://localhost:8000";

const DEFAULT_CONFIG: EmbedderConfig = {
  primaryModel: "text-embedding-3-small",
  fallbackModel: "nomic-embed-text",
  failSoft: true,
};

interface GatewayEmbeddingResponse {
  data?: Array<{ embedding?: number[] }>;
}

async function callGatewayEmbed(
  model: EmbeddingModel,
  text: string,
): Promise<Float32Array> {
  const resp = await fetch(`${GATEWAY_URL}/v1/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
  });
  if (!resp.ok) {
    throw new Error(
      `gateway embed ${model}: HTTP ${resp.status} ${resp.statusText}`,
    );
  }
  const json = (await resp.json()) as GatewayEmbeddingResponse;
  const arr = json.data?.[0]?.embedding;
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`gateway embed ${model}: empty response`);
  }
  return Float32Array.from(arr);
}

/**
 * Embed a single text via LiteLLM Gateway · primary→fallback cascade · fail-soft.
 * @returns Float32Array embedding · empty Float32Array(0) on hard fail when failSoft=true.
 */
export async function embed(
  text: string,
  config: EmbedderConfig = DEFAULT_CONFIG,
): Promise<Float32Array> {
  try {
    return await callGatewayEmbed(config.primaryModel, text);
  } catch (primaryErr) {
    if (config.fallbackModel) {
      try {
        return await callGatewayEmbed(config.fallbackModel, text);
      } catch (fallbackErr) {
        if (config.failSoft) {
          console.warn(
            `[sylvia-vector embedder] primary+fallback failed · primary=${primaryErr instanceof Error ? primaryErr.message : "unknown"} fallback=${fallbackErr instanceof Error ? fallbackErr.message : "unknown"}`,
          );
          return new Float32Array(0);
        }
        throw fallbackErr;
      }
    }
    if (config.failSoft) {
      console.warn(
        `[sylvia-vector embedder] primary failed (no fallback) · ${primaryErr instanceof Error ? primaryErr.message : "unknown"}`,
      );
      return new Float32Array(0);
    }
    throw primaryErr;
  }
}

/**
 * Resolve which model produced an embedding from its dimension.
 * Used by telemetry to discriminate primary vs fallback.
 */
export function modelFromDim(dim: number): EmbeddingModel | "unknown" {
  if (dim === 1536) return "text-embedding-3-small";
  if (dim === 768) return "nomic-embed-text";
  return "unknown";
}

export function getDefaultEmbedderConfig(): EmbedderConfig {
  return { ...DEFAULT_CONFIG };
}
