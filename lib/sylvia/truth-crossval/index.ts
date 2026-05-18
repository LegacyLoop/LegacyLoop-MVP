// lib/sylvia/truth-crossval/index.ts
//
// CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 v2.1 R29 P-WAVE-20-PHASE-8 · 2026-05-18
// ★ M20 SYLVIA TRUTH GATE CROSS-VALIDATE + FOUNDATION primitives Phase C/D/E ★
// ★ FINAL WAVE 20 PHASE · brain implant 8/8 ★
//
// Public API barrel · feature-flag SYLVIA_TRUTH_CROSSVAL_ENABLED default OFF.
// CEO §5.X Gate 1 picked Option A synthetic NextRequest (BINDING #10 ABSOLUTE).

export {
  crossValidate,
  isTruthCrossvalEnabled,
  callM10Consensus,
  computeAgreement,
  pairwiseJaccard,
  AGREEMENT_THRESHOLD,
  getCrossvalStats,
  validateExternalCorpus,
  validatePerCustomerOutput,
  validatePerItemValuation,
  validateExternalConsumerQuery,
} from "./coordinator";

export type {
  ConsensusBridgeOptions,
  ConsensusBridgeResult,
  AggregateResult,
} from "./coordinator";

export type {
  CrossvalInput,
  CrossvalResult,
  CrossvalSourceResult,
  CrossvalSource,
  CrossvalEpisodicPayload,
  ExternalCorpusValidationConfig,
  PerCustomerOutputValidationConfig,
  PerItemValuationValidationConfig,
  ExternalConsumerQueryValidationConfig,
  ValidationAuditResult,
  ExternalConsumerAuditResult,
} from "./types";
