// lib/sylvia/vector/hnsw.ts
//
// CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 v2.1 R29 P-WAVE-20-PHASE-3 · 2026-05-18
//
// CEO §5.X Gate 1 picked Option B · pure-TypeScript implementation.
// BINDING #16 ABSOLUTE: zero @claude-flow/* import · zero npm install · zero native dep.
//
// v1 implementation = exact-KNN flat-search with cosine similarity.
// Reference: HNSW (Malkov & Yashunin 2016 · https://arxiv.org/abs/1603.09320).
// Layered graph + greedy beam search banked Phase 4+ swap behind same VectorIndex
// interface · zero consumer disruption when scale-out warrants (~100K vector milestone).
//
// Why flat-search v1: at <10K vectors per namespace, exact-KNN is O(N) with tiny
// constants on Float32Array · single-digit ms latency · 100% recall by definition.
// HNSW layered graph adds complexity for sub-ms p99 only meaningful at >100K vectors.
// Interface-first design preserves swap-out optionality.

import type {
  VectorEntry,
  VectorIndex,
  VectorNamespace,
  VectorStats,
  QueryResult,
} from "./types";

/**
 * Cosine similarity for two equal-length Float32Array vectors.
 * Returns [-1, 1] · higher = more similar · 1 = identical direction.
 * Empty vectors or dimension mismatch → 0.
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * In-memory flat-search vector index · per-namespace isolation.
 * Loaded/persisted by storage.ts JSONL adapter.
 */
export class FlatSearchIndex implements VectorIndex {
  private readonly namespaces: Map<VectorNamespace, Map<string, VectorEntry>> =
    new Map();
  private readonly lastWriteAt: Map<VectorNamespace, string> = new Map();

  async init(namespace: VectorNamespace): Promise<void> {
    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, new Map());
    }
  }

  async close(namespace: VectorNamespace): Promise<void> {
    this.namespaces.delete(namespace);
    this.lastWriteAt.delete(namespace);
  }

  async insert(entry: VectorEntry): Promise<void> {
    await this.init(entry.namespace);
    const bucket = this.namespaces.get(entry.namespace)!;
    bucket.set(entry.id, entry);
    this.lastWriteAt.set(entry.namespace, entry.updatedAt);
  }

  async query(
    namespace: VectorNamespace,
    queryEmbedding: Float32Array,
    k: number = 10,
    filter?: (e: VectorEntry) => boolean,
  ): Promise<QueryResult[]> {
    const bucket = this.namespaces.get(namespace);
    if (!bucket || bucket.size === 0 || queryEmbedding.length === 0) return [];

    const scored: QueryResult[] = [];
    for (const entry of bucket.values()) {
      if (filter && !filter(entry)) continue;
      if (entry.embedding.length !== queryEmbedding.length) continue; // dim mismatch skip
      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      scored.push({ entry, score, distance: 1 - score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  async delete(namespace: VectorNamespace, id: string): Promise<void> {
    const bucket = this.namespaces.get(namespace);
    if (!bucket) return;
    bucket.delete(id);
    this.lastWriteAt.set(namespace, new Date().toISOString());
  }

  async count(namespace: VectorNamespace): Promise<number> {
    return this.namespaces.get(namespace)?.size ?? 0;
  }

  async stats(namespace: VectorNamespace): Promise<VectorStats> {
    const bucket = this.namespaces.get(namespace);
    if (!bucket || bucket.size === 0) {
      return {
        namespace,
        count: 0,
        dimMin: 0,
        dimMax: 0,
        modelDim: 0,
        storageBytes: 0,
      };
    }
    let dimMin = Infinity;
    let dimMax = 0;
    let bytes = 0;
    for (const entry of bucket.values()) {
      const d = entry.embedding.length;
      if (d < dimMin) dimMin = d;
      if (d > dimMax) dimMax = d;
      bytes += d * 4; // Float32 = 4 bytes
      bytes += JSON.stringify(entry.metadata).length;
      bytes += entry.id.length;
    }
    return {
      namespace,
      count: bucket.size,
      dimMin: dimMin === Infinity ? 0 : dimMin,
      dimMax,
      modelDim: dimMax, // dominant dim approximation
      lastWriteAt: this.lastWriteAt.get(namespace),
      storageBytes: bytes,
    };
  }

  /** Internal · used by storage.ts persistence layer. */
  _bulkLoad(namespace: VectorNamespace, entries: VectorEntry[]): void {
    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, new Map());
    }
    const bucket = this.namespaces.get(namespace)!;
    let latest = "";
    for (const entry of entries) {
      bucket.set(entry.id, entry);
      if (entry.updatedAt > latest) latest = entry.updatedAt;
    }
    if (latest) this.lastWriteAt.set(namespace, latest);
  }

  /** Internal · returns iterable for persistence dump. */
  _allEntries(namespace: VectorNamespace): Iterable<VectorEntry> {
    return this.namespaces.get(namespace)?.values() ?? [];
  }
}

// Module-level singleton · single index per process · all namespaces share
export const _globalIndex = new FlatSearchIndex();
