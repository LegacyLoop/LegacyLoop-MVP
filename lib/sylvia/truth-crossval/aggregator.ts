// lib/sylvia/truth-crossval/aggregator.ts
//
// CMD-SYLVIA-TRUTH-GATE-CROSSVALIDATE V20 v2.1 R29 P-WAVE-20-PHASE-8 · 2026-05-18
//
// Aggregate cross-val sources · compute agreement score · DEFENSIVE FALLBACK
// when substrate sources thin (Phase 4 RISK + Phase 6 §12 RISK inherited).
//
// v1: token-overlap Jaccard pairwise mean.
// R30+ banked: swap to embedding-cosine via Phase 3 RuVector embedder.

import type { CrossvalSourceResult } from "./types";

export const AGREEMENT_THRESHOLD = 70; // Truth Gate parity

export interface AggregateResult {
  agreementScore: number;
  accepted: boolean;
  rejectionReason?: string;
}

export function computeAgreement(
  sources: CrossvalSourceResult[],
): AggregateResult {
  const ok = sources.filter(
    (s) => s.ok && s.answer.trim().length > 0,
  );

  if (ok.length === 0) {
    return {
      agreementScore: 0,
      accepted: false,
      rejectionReason: "no-ok-sources",
    };
  }

  if (ok.length === 1) {
    // Defensive: single source · accept M10 consensus alone if present
    const hasConsensus = ok[0].source === "consensus";
    return {
      agreementScore: hasConsensus ? ok[0].confidence : 0,
      accepted: hasConsensus,
      rejectionReason: hasConsensus
        ? undefined
        : "insufficient-substrate-sources",
    };
  }

  // Pairwise Jaccard on token sets · mean → percentage
  const scores: number[] = [];
  for (let i = 0; i < ok.length; i++) {
    for (let j = i + 1; j < ok.length; j++) {
      scores.push(pairwiseJaccard(ok[i].answer, ok[j].answer));
    }
  }
  const mean =
    scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1);
  const agreementScore = Math.round(mean * 100);
  const accepted = agreementScore >= AGREEMENT_THRESHOLD;
  return {
    agreementScore,
    accepted,
    rejectionReason: accepted
      ? undefined
      : `agreement-${agreementScore}-below-${AGREEMENT_THRESHOLD}`,
  };
}

export function pairwiseJaccard(a: string, b: string): number {
  const toks = (s: string) =>
    new Set(s.toLowerCase().split(/\W+/).filter(Boolean));
  const A = toks(a);
  const B = toks(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}
