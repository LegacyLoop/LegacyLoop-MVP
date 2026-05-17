// lib/sylvia/router-types.ts
//
// CMD-SYLVIA-AI-ROUTER-V1 V20 v2.1 R29 P76 · Wave 19 Slot B KEYSTONE · 2026-05-17
//
// Type contract for the 3-tier cost-class router. Greenfield · ZERO existing
// substrate mutation. Pairs with router.ts (consumer of triage-router.ts via
// import · BINDING #10 single egress preserved · BINDING #16 clone-not-modify).

import type { ModelAlias } from "./types";

export type Tier = "T1" | "T2" | "T3";

export interface TierPolicy {
  tier: Tier;
  aliases: ModelAlias[]; // ordered cheap-first cascade within tier
  costCeilingPerCallUsd: number;
  costCeilingPerSessionUsd: number;
  description: string;
}

export type RouteClassifier =
  | "complexity-rule"
  | "pattern-hint"
  | "force-alias"
  | "force-tier"
  | "fallback";

export interface RouteDecision {
  tier: Tier;
  chosenAlias: ModelAlias;
  rationale: string; // human-readable explanation
  classifier: RouteClassifier;
  fallbackCascade: ModelAlias[];
  estimatedCostUsd: number;
  policySnapshot: TierPolicy;
}

export interface RouteTask {
  prompt: string;
  context?: string;
  sessionId?: string;
  forceTier?: Tier; // CEO override · skip auto-classify
  forceAlias?: ModelAlias; // bypass tier · pass through to triageAndRoute
  requiresLiveWeb?: boolean;
  requiresLocal?: boolean;
}
