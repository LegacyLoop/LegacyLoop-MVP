// lib/sylvia/dispatcher/index.ts
//
// CMD-SYLVIA-TRUTH-GATE-DISPATCHER V19 · R24 P0 · 2026-05-08
//
// Public surface re-exports for the Sylvia dispatcher.

export { verifySylviaInternalSecret, type SylviaAuthResult } from "./auth";
export { classifyStakes, preflightStakes, type Stakes } from "./classify";
export {
  computeAgreement,
  type ProviderResponse,
  type AgreementResult,
  type PairScore,
} from "./agreement";
export { BudgetTracker, type BudgetExceeded } from "./budget";
