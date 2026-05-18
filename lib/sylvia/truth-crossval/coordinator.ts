// lib/sylvia/truth-crossval/coordinator.ts
//
// CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 v2.1 R29 P-WAVE-20-PHASE-8 · 2026-05-18
//
// Public API · re-exports validator + bridge + aggregator + consumer hooks.
// BINDING #10 ABSOLUTE: consumer-only · zero new HTTP edge.

export { crossValidate, isTruthCrossvalEnabled } from "./validator";

export {
  callM10Consensus,
} from "./consensus-bridge";
export type {
  ConsensusBridgeOptions,
  ConsensusBridgeResult,
} from "./consensus-bridge";

export { computeAgreement, pairwiseJaccard, AGREEMENT_THRESHOLD } from "./aggregator";
export type { AggregateResult } from "./aggregator";

// ★ FOUNDATION-UP consumer hooks · #45 LAW-emerging 2/5→3/5 ratchet ★
export {
  validateExternalCorpus,
  validatePerCustomerOutput,
  validatePerItemValuation,
  validateExternalConsumerQuery,
} from "./consumer-hooks";

export async function getCrossvalStats(): Promise<{
  enabled: boolean;
  flagName: string;
  sourcesSupported: number;
  consumerHooksRegistered: number;
}> {
  return {
    enabled: process.env.SYLVIA_TRUTH_CROSSVAL_ENABLED === "1",
    flagName: "SYLVIA_TRUTH_CROSSVAL_ENABLED",
    sourcesSupported: 6, // consensus + hybrid + graphify + obsidian + swarm + swarmActivate
    consumerHooksRegistered: 4,
  };
}
