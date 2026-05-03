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
