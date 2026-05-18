// lib/sylvia/graphify/index.ts
//
// CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 v2.1 R29 P-WAVE-20-PHASE-6 · 2026-05-18
// ★ M18 SELF-INTROSPECTING GRAPH + FOUNDATION PRIMITIVE for Phase C/D/E ★
//
// Public API barrel · feature-flag SYLVIA_GRAPHIFY_ENABLED default OFF.
// CEO §5.X Gate 1 picked Option B Leiden (foundation-up · build right first time).

export {
  buildGraph,
  queryGraph,
  getStats,
  isGraphifyEnabled,
} from "./coordinator";

export type { BuildGraphOptions } from "./coordinator";

export { buildGraphFromVault, countVaultNotes } from "./graph-builder";

export { detectCommunities } from "./community-detect";

export {
  computeCentrality,
  pickGodNodes,
  detectSurprisingConnections,
} from "./god-nodes";

export {
  snapshotToJson,
  communityToMarkdown,
  summaryLogLine,
} from "./emitter";

// ★ FOUNDATION-UP consumer hooks for Phase C/D/E (#45 NEW · CEO Mon PM directive) ★
export {
  graphIngestExternalCorpus,
  createPerCustomerGraph,
  createPerItemProvenanceGraph,
  graphQueryExternalConsumer,
} from "./consumer-hooks";

export type {
  GraphNamespace,
  GraphAlgorithm,
  GraphNode,
  GraphEdge,
  EdgeType,
  Community,
  GraphSnapshot,
  GraphifyEpisodicPayload,
  ExternalCorpusEntry,
  CustomerGraphConfig,
  ItemProvenanceConfig,
  ExternalConsumerQuery,
} from "./types";
