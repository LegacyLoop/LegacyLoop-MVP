// lib/sylvia/vector/types.ts
//
// CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 v2.1 R29 P-WAVE-20-PHASE-3 · 2026-05-18
//
// Type contract for HNSW vector substrate. GREENFIELD.
// BINDING #16 ABSOLUTE: zero @claude-flow/* import.
// CEO §5.X Gate 1 picked Option B (pure-TS · zero native dep).

import type { EpisodicEntry } from "../memory-types";

export type VectorNamespace =
  | `swarm:${string}`        // Phase 7 swarm task recall
  | `customer:${string}`     // Phase D CCL per-user
  | `item:${string}`         // Phase D MPMA UIS per-item
  | `platform:${string}`     // Phase D MPMA per-platform
  | `skill:${string}`        // §8 Semantic memory migration target
  | `episode:${string}`      // §7 Episodic memory hybrid
  | `pattern:${string}`      // §5 Pattern engine consumer
  | "global";                 // default catchall

export interface VectorEntry {
  id: string;
  namespace: VectorNamespace;
  embedding: Float32Array;   // dim depends on model (1536 OpenAI · 768 Nomic)
  metadata: Record<string, unknown>;
  createdAt: string;          // ISO8601
  updatedAt: string;
}

export interface QueryResult {
  entry: VectorEntry;
  score: number;              // cosine similarity 0.0-1.0
  distance: number;           // 1 - cosine similarity
}

export interface VectorIndex {
  init(namespace: VectorNamespace): Promise<void>;
  close(namespace: VectorNamespace): Promise<void>;
  insert(entry: VectorEntry): Promise<void>;
  query(
    namespace: VectorNamespace,
    queryEmbedding: Float32Array,
    k?: number,
    filter?: (e: VectorEntry) => boolean,
  ): Promise<QueryResult[]>;
  delete(namespace: VectorNamespace, id: string): Promise<void>;
  count(namespace: VectorNamespace): Promise<number>;
  stats(namespace: VectorNamespace): Promise<VectorStats>;
}

export interface VectorStats {
  namespace: VectorNamespace;
  count: number;
  dimMin: number;
  dimMax: number;
  modelDim: number;
  lastWriteAt?: string;
  storageBytes: number;
}

export type EmbeddingModel =
  | "text-embedding-3-small"
  | "text-embedding-ada-002"
  | "nomic-embed-text";

export interface EmbedderConfig {
  primaryModel: EmbeddingModel;
  fallbackModel: EmbeddingModel | null;
  failSoft: boolean;
}

export interface VectorEpisodicPayload {
  vector: "v1";              // sentinel · matches Phase 2 swarm + CYL #1 router precedents
  op: "insert" | "query" | "delete";
  namespace: VectorNamespace;
  hits?: number;             // query-only
  latencyMs: number;
  modelDim: number;
  classifier: "primary" | "fallback" | "stub";
}

/**
 * Helper · constructs sylvia_episodic row via existing surface.
 * BINDING #31 push-back replacement (eventType="triage" + payload.vector sentinel).
 */
export function vectorTelemetryEntry(
  payload: VectorEpisodicPayload,
  sessionId: string,
): EpisodicEntry {
  return {
    timestamp: new Date().toISOString(),
    sessionId,
    eventType: "triage",      // reuse existing union value · payload sentinel discriminates
    payload: payload as unknown as Record<string, unknown>,
    source: "direct",
  };
}
