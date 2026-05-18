// lib/sylvia/hybrid/merge.ts
//
// CMD-SYLVIA-HYBRID-MEMORY-INTEGRATION V20 v2.1 R29 P-WAVE-20-PHASE-4 · 2026-05-18
//
// Reciprocal Rank Fusion (RRF) score-weighted merge for "always-hybrid" mode.
// Reference: Cormack et al. 2009 (https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
// Score formula: RRF(d) = sum over rankers of 1 / (k + rank_i(d))
// k=60 standard literature constant · biases toward top-ranked items from any source.

import type { HybridResult } from "./types";

const RRF_K = 60;

interface RankedItem {
  id: string;
  rank: number; // 1-based
  source: HybridResult["source"];
  score: number;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fuse two ranked candidate lists into single ranked list via RRF.
 * Both inputs sorted by score descending. Duplicate IDs across lists
 * accumulate RRF score · highest fused score wins.
 */
export function rrfMerge(
  vectorHits: HybridResult[],
  keywordHits: HybridResult[],
  limit: number,
): HybridResult[] {
  const ranked: RankedItem[][] = [
    vectorHits.map((h, i) => ({ ...h, rank: i + 1 })),
    keywordHits.map((h, i) => ({ ...h, rank: i + 1 })),
  ];

  const fused: Map<string, { item: HybridResult; rrfScore: number }> = new Map();

  for (const list of ranked) {
    for (const item of list) {
      const contribution = 1 / (RRF_K + item.rank);
      const existing = fused.get(item.id);
      if (existing) {
        existing.rrfScore += contribution;
      } else {
        fused.set(item.id, {
          item: {
            source: "hybrid-merged",
            id: item.id,
            score: item.score,
            content: item.content,
            metadata: item.metadata,
          },
          rrfScore: contribution,
        });
      }
    }
  }

  return Array.from(fused.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, limit)
    .map((f) => ({
      ...f.item,
      score: f.rrfScore, // expose RRF score for caller visibility
    }));
}

/** Test-only · expose RRF constant for smoke harness. */
export function _getRrfK(): number {
  return RRF_K;
}
