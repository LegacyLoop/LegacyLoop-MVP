// lib/sylvia/vector/coordinator.ts
//
// CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 v2.1 R29 P-WAVE-20-PHASE-3 · 2026-05-18
//
// Public API surface · feature-flag gated.
// Mirrors Phase 2 swarm/coordinator.ts pattern (BINDING #16 clone-not-modify).
// Telemetry via BINDING #31 sentinel: eventType="triage" + payload.vector="v1".

import { randomUUID } from "node:crypto";
import type {
  VectorNamespace,
  VectorEntry,
  QueryResult,
  VectorStats,
  VectorEpisodicPayload,
} from "./types";
import { _globalIndex } from "./hnsw";
import { embed, modelFromDim } from "./embedder";
import { persistEntry, loadNamespace, persistDelete } from "./storage";
import { appendEpisodic } from "../memory";

function isVectorEnabled(): boolean {
  return process.env.SYLVIA_VECTOR_ENABLED === "1";
}

const loadedNamespaces = new Set<VectorNamespace>();

async function ensureLoaded(namespace: VectorNamespace): Promise<void> {
  if (loadedNamespaces.has(namespace)) return;
  await _globalIndex.init(namespace);
  await loadNamespace(namespace);
  loadedNamespaces.add(namespace);
}

function classifierForDim(dim: number): "primary" | "fallback" | "stub" {
  if (dim === 1536) return "primary";
  if (dim === 768) return "fallback";
  return "stub";
}

async function safeEmit(
  payload: VectorEpisodicPayload,
  sessionId: string,
): Promise<void> {
  try {
    await appendEpisodic({
      timestamp: new Date().toISOString(),
      sessionId,
      eventType: "triage",
      payload: payload as unknown as Record<string, unknown>,
      source: "direct",
    });
  } catch (err) {
    console.warn(
      `[sylvia-vector] episodic emit failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

export async function vectorInsert(
  namespace: VectorNamespace,
  text: string,
  metadata: Record<string, unknown> = {},
  sessionId?: string,
): Promise<{ id: string; insertedAt: string }> {
  const insertedAt = new Date().toISOString();
  const id = randomUUID();

  if (!isVectorEnabled()) {
    return { id, insertedAt }; // flag OFF · zero behavior delta · stub return
  }

  const t0 = Date.now();
  await ensureLoaded(namespace);
  const embedding = await embed(text);
  const entry: VectorEntry = {
    id,
    namespace,
    embedding,
    metadata,
    createdAt: insertedAt,
    updatedAt: insertedAt,
  };
  await _globalIndex.insert(entry);
  await persistEntry(entry);
  const latencyMs = Date.now() - t0;

  if (sessionId) {
    await safeEmit(
      {
        vector: "v1",
        op: "insert",
        namespace,
        latencyMs,
        modelDim: embedding.length,
        classifier: classifierForDim(embedding.length),
      },
      sessionId,
    );
  }

  return { id, insertedAt };
}

export interface VectorQueryOptions {
  k?: number;
  filter?: (e: VectorEntry) => boolean;
  sessionId?: string;
}

export async function vectorQuery(
  namespace: VectorNamespace,
  queryText: string,
  options: VectorQueryOptions = {},
): Promise<QueryResult[]> {
  if (!isVectorEnabled()) return [];

  const t0 = Date.now();
  await ensureLoaded(namespace);
  const queryEmbedding = await embed(queryText);
  const hits = await _globalIndex.query(
    namespace,
    queryEmbedding,
    options.k ?? 10,
    options.filter,
  );
  const latencyMs = Date.now() - t0;

  if (options.sessionId) {
    await safeEmit(
      {
        vector: "v1",
        op: "query",
        namespace,
        hits: hits.length,
        latencyMs,
        modelDim: queryEmbedding.length,
        classifier: classifierForDim(queryEmbedding.length),
      },
      options.sessionId,
    );
  }

  return hits;
}

export async function vectorDelete(
  namespace: VectorNamespace,
  id: string,
  sessionId?: string,
): Promise<void> {
  if (!isVectorEnabled()) return;

  const t0 = Date.now();
  await ensureLoaded(namespace);
  await _globalIndex.delete(namespace, id);
  await persistDelete(namespace, id);
  const latencyMs = Date.now() - t0;

  if (sessionId) {
    await safeEmit(
      {
        vector: "v1",
        op: "delete",
        namespace,
        latencyMs,
        modelDim: 0,
        classifier: "stub",
      },
      sessionId,
    );
  }
}

export async function vectorStats(
  namespace: VectorNamespace,
): Promise<VectorStats> {
  await ensureLoaded(namespace);
  return _globalIndex.stats(namespace);
}

/** Test-only · clears global index. Used by smoke harness only. */
export function _resetForTest(): void {
  loadedNamespaces.clear();
}

/** Test-only · direct insert with pre-computed embedding (bypasses LiteLLM). */
export async function _insertWithEmbedding(
  namespace: VectorNamespace,
  id: string,
  embedding: Float32Array,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await _globalIndex.init(namespace);
  await _globalIndex.insert({
    id,
    namespace,
    embedding,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/** Test-only · direct query with pre-computed embedding (bypasses LiteLLM). */
export async function _queryWithEmbedding(
  namespace: VectorNamespace,
  queryEmbedding: Float32Array,
  k: number = 3,
): Promise<QueryResult[]> {
  return _globalIndex.query(namespace, queryEmbedding, k);
}
