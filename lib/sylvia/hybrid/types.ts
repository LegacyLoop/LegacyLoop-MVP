// lib/sylvia/hybrid/types.ts
//
// CMD-SYLVIA-HYBRID-MEMORY-INTEGRATION V20 v2.1 R29 P-WAVE-20-PHASE-4 · 2026-05-18
// ★ BINDING #38 RATIFY FIRE · DOC-EMPIRICAL-CITE-MANDATORY 4/5 → 5/5 ★
//
// Type contract for hybrid memory recall bridge.
// GREENFIELD · BINDING #16 ABSOLUTE: zero @claude-flow/* import.
// CEO §5.X Gate 1 picked Option A: vector-first w/ keyword fallback (Manus pattern).
//
// §0.7 DESIGN-ANTICIPATION (BINDING #42 cand 2/5→3/5):
// HybridScope = VectorNamespace passthrough · honors all 8 Phase 3 patterns
// (swarm/customer/item/platform/skill/episode/pattern/global).

import type { VectorNamespace } from "../vector";

export type HybridScope = VectorNamespace;

export type HybridMode =
  | "vector-first"      // Option A · Devin RECOMMENDED · Manus-class default
  | "keyword-first"     // Option B · backward-compat
  | "always-hybrid";    // Option C · maximum recall (RRF merge)

export type HybridSource =
  | "vector"            // vector-first path · primary hit
  | "vector-fallback"   // keyword-first found nothing · vector ran as fallback
  | "keyword"           // keyword-first path · primary hit
  | "keyword-fallback"  // vector-first score below threshold · keyword ran
  | "hybrid-merged"     // always-hybrid RRF rank fusion
  | "legacy";           // feature-flag OFF · legacy keyword-only path

export interface HybridQueryRequest {
  query: string;
  scope: HybridScope;
  limit?: number;
  mode?: HybridMode;
  sessionId?: string;
  vectorScoreThreshold?: number; // default 0.7 · vector-first fallback trigger
}

export interface HybridResult {
  source: HybridSource;
  id: string;
  score: number;
  content: string;
  metadata?: Record<string, unknown>;
}

export type HybridPath =
  | "vector"
  | "keyword"
  | "vector-fallback"
  | "keyword-fallback"
  | "hybrid-merged"
  | "legacy";

export interface HybridEpisodicPayload {
  hybrid: "v1";              // sentinel · matches Phase 2 swarm + Phase 3 vector + CYL #1 router
  mode: HybridMode;
  pathUsed: HybridPath;
  hits: number;
  latencyMs: number;
  scope: HybridScope;
}
