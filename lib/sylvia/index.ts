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
