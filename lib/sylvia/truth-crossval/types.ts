// lib/sylvia/truth-crossval/types.ts
//
// CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 v2.1 R29 P-WAVE-20-PHASE-8 · 2026-05-18
// ★ M20 SYLVIA TRUTH GATE CROSS-VALIDATE moat + FOUNDATION primitives Phase C/D/E ★
// ★ FINAL WAVE 20 PHASE · brain implant 8/8 ★
//
// Type contract for cross-validation engine.
// GREENFIELD · BINDING #16 ABSOLUTE: zero @claude-flow/* import.
// BINDING #10 ABSOLUTE: consumer-only · synthetic NextRequest pattern · zero new HTTP edge.
// CEO §5.X Gate 1 picked Option A synthetic NextRequest (#46 NEW candidate anchor).

export type CrossvalSource =
  | "consensus"      // M10 4-AI Truth Gate baseline (always-present)
  | "hybrid"         // Phase 4 hybrid recall (vector-first)
  | "graphify"       // Phase 6 community summary
  | "obsidian"       // Phase 5 backlinks summary
  | "swarm"          // Phase 2 swarm classification
  | "swarmActivate"; // Phase 7 activation roster

export interface CrossvalSourceResult {
  source: CrossvalSource;
  answer: string;
  confidence: number;          // 0-100
  latencyMs: number;
  ok: boolean;
  errorReason?: string;
}

export interface CrossvalInput {
  prompt: string;
  context?: {
    customerId?: string;
    itemId?: string;
    platformName?: string;
    namespace?: string;
  };
  sources?: CrossvalSource[];
  stakes?: "low" | "high";
  maxBudgetUsd?: number;       // BINDING #25 cap
  sessionId?: string;
}

export interface CrossvalResult {
  prompt: string;
  agreementScore: number;      // 0-100 aggregate
  consensus: CrossvalSourceResult;
  sources: CrossvalSourceResult[];
  accepted: boolean;
  rejectionReason?: string;
  auditId: string;
  totalLatencyMs: number;
  totalCostUsd: number;
  emittedAt: string;
}

export interface CrossvalEpisodicPayload {
  truth_crossval: "v1";        // sentinel · matches Phase 2-7 + CYL #1 precedents
  operation:
    | "crossval"
    | "validate-corpus"
    | "validate-customer"
    | "validate-item"
    | "validate-consumer";
  agreementScore: number;
  sourcesCount: number;
  accepted: boolean;
  latencyMs: number;
  costUsd: number;
}

// ─── §0.7 FOUNDATION-UP CONSUMER HOOK CONFIGS (#45 LAW-emerging 2/5→3/5) ───

export interface ExternalCorpusValidationConfig {
  corpus: string;
  criteria: "factual" | "pricing" | "provenance" | "all";
  sourceUrl?: string;
  maxBudgetUsd?: number;
}

export interface PerCustomerOutputValidationConfig {
  customerId: string;
  output: string;
  context: "behavior-prediction" | "item-recommendation" | "pricing" | "communication";
  swarmDecisionId?: string;
}

export interface PerItemValuationValidationConfig {
  itemId: string;
  valuation: { priceUsd: number; method: "comp" | "appraisal" | "swarm" };
  sources: string[];
  context: "list" | "sell" | "buy" | "trade";
}

export interface ExternalConsumerQueryValidationConfig {
  consumerId: string;
  authToken: string;
  query: string;
  response: string;
  rateLimitPerHour?: number;
}

export interface ValidationAuditResult {
  accepted: boolean;
  agreementScore: number;
  rejectionReason?: string;
  auditId: string;
}

export interface ExternalConsumerAuditResult extends ValidationAuditResult {
  rateLimitRemaining: number;
}
