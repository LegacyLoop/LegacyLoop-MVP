// lib/sylvia/vector/index.ts
//
// CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 v2.1 R29 P-WAVE-20-PHASE-3 · 2026-05-18
//
// Public API barrel for Sylvia HNSW vector substrate.
// Substrate-only v1 · feature-flag SYLVIA_VECTOR_ENABLED default OFF.
// Phase 4 hybrid memory bridge consumes.

export {
  vectorInsert,
  vectorQuery,
  vectorDelete,
  vectorStats,
  _resetForTest,
  _insertWithEmbedding,
  _queryWithEmbedding,
} from "./coordinator";

export type { VectorQueryOptions } from "./coordinator";

export { embed, modelFromDim, getDefaultEmbedderConfig } from "./embedder";

export { FlatSearchIndex, cosineSimilarity, _globalIndex } from "./hnsw";

export { persistEntry, loadNamespace, persistDelete } from "./storage";

export type {
  VectorNamespace,
  VectorEntry,
  QueryResult,
  VectorIndex,
  VectorStats,
  EmbeddingModel,
  EmbedderConfig,
  VectorEpisodicPayload,
} from "./types";

export { vectorTelemetryEntry } from "./types";
