// CMD-W26-C · Messenger/Graph rate-limit backoff (Peg §5.9 · 60% cap).
//
// Meta returns X-Business-Use-Case-Usage / X-App-Usage / X-Page-Usage headers
// describing how much of the rate budget is consumed. Policy: proactively back
// off once utilisation crosses 60% — long before Meta hard-throttles (190/4/17/
// 32/613) — to keep the messaging surface healthy under load.
//
// Reuses the canonical header parser from lib/meta/graph.ts (BINDING #16 — no
// re-implementation of the parse).

import { parseUsage, type GraphUsage } from "@/lib/meta/graph";

export const BACKOFF_UTIL_PCT = 60;

export interface BackoffDecision {
  /** Whether the caller should pause/slow before the next call. */
  backoff: boolean;
  /** Observed worst-case utilisation percent (0 when no headers present). */
  utilPct: number;
  /** Suggested wait in ms before retrying (0 when no backoff needed). */
  waitMs: number;
  /** Reason string for logs/telemetry. */
  reason: string;
}

/**
 * Decide whether to back off based on Meta usage headers.
 *
 * @param headers   response headers from a Graph/Send call
 * @param capPct    utilisation threshold (default 60%)
 */
export function decideBackoff(headers: Headers, capPct: number = BACKOFF_UTIL_PCT): BackoffDecision {
  const usage: GraphUsage | null = parseUsage(headers);
  if (!usage) {
    return { backoff: false, utilPct: 0, waitMs: 0, reason: "no usage headers" };
  }

  // Meta's explicit throttle signal always wins.
  if (usage.estimatedRegainMinutes > 0) {
    return {
      backoff: true,
      utilPct: usage.percent,
      waitMs: usage.estimatedRegainMinutes * 60_000,
      reason: `throttled · regain in ${usage.estimatedRegainMinutes}m`,
    };
  }

  if (usage.percent >= capPct) {
    // Scale wait with how far over the cap we are (cap → 1×, 100% → ~4×).
    const over = Math.max(0, usage.percent - capPct);
    const waitMs = Math.min(60_000, 1_000 + over * 150);
    return {
      backoff: true,
      utilPct: usage.percent,
      waitMs,
      reason: `utilisation ${usage.percent}% ≥ ${capPct}% cap`,
    };
  }

  return { backoff: false, utilPct: usage.percent, waitMs: 0, reason: `utilisation ${usage.percent}% ok` };
}
