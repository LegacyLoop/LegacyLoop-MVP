// Pinterest demand-intel arm — typed shapes.
// W25-META-L4 · Track A · cross-platform demand signal (FREE tier).
// ToS 2026: Pinterest data must NOT be persisted long-term. All shapes below
// are derived/transient signals, never raw Pinterest payloads written to disk/DB.

/** Pinterest Trends region codes we support (Standard free tier). */
export type PinterestRegion = "US" | "CA" | "GB" | "AU" | "DE" | "FR";

/** Trend direction over the lookback window. */
export type DemandTrend = "rising" | "steady" | "falling" | "unknown";

/** A single derived demand signal for a category/keyword. */
export interface PinterestDemandSignal {
  /** Normalized category/keyword queried. */
  category: string;
  region: PinterestRegion;
  /** 0–100 relative interest score (Pinterest Trends index). null = no data. */
  interestScore: number | null;
  trend: DemandTrend;
  /** Related rising keywords (capped, derived — not raw payload). */
  relatedKeywords: string[];
  /** ISO timestamp the signal was computed. */
  computedAt: string;
  /** Source/availability flag for graceful degrade. */
  source: "pinterest-trends" | "unavailable";
  /** Human-readable reason when source=unavailable. */
  note?: string;
}

/** Result envelope from the client — never throws to callers. */
export interface PinterestDemandResult {
  ok: boolean;
  signal: PinterestDemandSignal;
  /** True when no Pinterest token configured (build-structure-only mode). */
  tokenMissing: boolean;
  /** True when a per-category / global rate limit was hit. */
  rateLimited: boolean;
}
