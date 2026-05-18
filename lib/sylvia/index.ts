/**
 * Sylvia · Public API surface
 *
 * CMD-SYLVIA-TRIAGE-ROUTER-V1 · V18 · 2026-05-03
 *
 * V1 exports the triage router only. V2 will add memory layer (Spec 3),
 * tools (advisor S3 banked), and skills (advisor S4 banked).
 *
 * Importers consume this barrel:
 *   import { triageAndRoute, type TriageTask } from "@/lib/sylvia";
 */

export {
  triageAndRoute,
  classifyComplexity,
  _resetSessionCostMap,
  _getSessionCostUsd,
} from "./triage-router";

export type {
  TaskComplexity,
  ModelAlias,
  TriageTask,
  TriageDecision,
  TriageResult,
  TriageTelemetry,
} from "./types";

// CMD-SYLVIA-COLLECTIVE-MEMORY-V1 · V18 · 2026-05-03
// Memory layer (Spec 3) · persisted triage telemetry · cross-agent
// context recall · pairs with V2-TELEMETRY-PERSIST (banked) for
// auto-record on every triageAndRoute call.

export {
  recordTriage,
  recallSimilar,
  getSessionStats,
  pruneOld,
} from "./memory";

export type { RecordTriageInput, RecallSimilarOpts } from "./memory";

// CMD-RUFLO-CONCEPT-EXTRACT V20 · Wave 20 Phase 2 · 2026-05-18
// Swarm orchestration substrate · feature-flag SYLVIA_SWARM_ENABLED default OFF.
export * as swarm from "./swarm";

// CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 · Wave 20 Phase 3 · 2026-05-18
// HNSW vector RECALL ENGINE substrate · feature-flag SYLVIA_VECTOR_ENABLED default OFF.
export * as vector from "./vector";

// CMD-SYLVIA-HYBRID-MEMORY-INTEGRATION V20 · Wave 20 Phase 4 · 2026-05-18
// Hybrid recall decision engine · feature-flag SYLVIA_HYBRID_MEMORY_ENABLED default OFF.
export * as hybrid from "./hybrid";

// CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 · Wave 20 Phase 5 · 2026-05-18
// Brain externalization · vault sync · feature-flag SYLVIA_OBSIDIAN_ENABLED default OFF.
export * as obsidian from "./obsidian";

// CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 · Wave 20 Phase 6 · 2026-05-18
// Self-introspecting graph + Phase C/D/E foundation hooks · feature-flag SYLVIA_GRAPHIFY_ENABLED default OFF.
export * as graphify from "./graphify";

// CMD-SYLVIA-15-AGENT-TOPOLOGY-ACTIVATE V20 · Wave 20 Phase 7 · 2026-05-18
// Autonomous swarm activation + 3 NEW Phase D/E hooks · feature-flag SYLVIA_SWARM_ACTIVATE_ENABLED default OFF.
export * as swarmActivate from "./swarm-activate";

// CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 · Wave 20 Phase 8 of 8 · FINAL · 2026-05-18
// ★ M20 cross-validation + 4 Phase C/D/E hooks · feature-flag SYLVIA_TRUTH_CROSSVAL_ENABLED default OFF ★
export * as truthCrossval from "./truth-crossval";
