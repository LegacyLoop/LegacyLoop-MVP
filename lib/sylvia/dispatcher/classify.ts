// lib/sylvia/dispatcher/classify.ts
//
// CMD-SYLVIA-TRUTH-GATE-DISPATCHER V19 · R24 P0 · 2026-05-08
//
// Stakes classifier · returns "low" | "high".
//
// Two-stage:
//   1. Regex preflight (zero token cost) — covers the obvious cases
//   2. Haiku LLM fallback (counts toward per-question budget) when
//      preflight is ambiguous
//
// "high" routes to 4-AI consensus; "low" routes to single-agent path.

import { triageAndRoute } from "@/lib/sylvia";

export type Stakes = "low" | "high";

const HIGH_RX = /\b(price|worth|valu|appraisal|comp|sold|legal|medical|tax|investment|antique|collectible|vintage|rare)\w*/i;
const LOW_RX = /^(hi|hello|hey|thanks|what does|explain|help|how do i|how can i)\b/i;

/**
 * Regex preflight. Returns null when ambiguous so caller falls through
 * to LLM classification.
 */
export function preflightStakes(question: string): Stakes | null {
  const trimmed = question.trim();
  if (LOW_RX.test(trimmed)) return "low";
  if (HIGH_RX.test(trimmed)) return "high";
  return null;
}

/**
 * Full classifier · regex preflight + Haiku fallback.
 * Cost: $0 for preflight match · ~$0.0002 for Haiku call.
 */
export async function classifyStakes(question: string, sessionId: string): Promise<{
  stakes: Stakes;
  source: "preflight" | "llm";
  costUsd: number;
}> {
  const pre = preflightStakes(question);
  if (pre) return { stakes: pre, source: "preflight", costUsd: 0 };

  const result = await triageAndRoute({
    prompt: `Classify this user question by financial/factual stakes. Return ONE word: HIGH (pricing/valuation/advice/factual claims) or LOW (chat/explanation/lookup/help). Question: ${question}`,
    forceAlias: "claude-haiku-4-5",
    complexityHint: "simple",
    sessionId,
    stream: false,
  });

  const verdict = result.responseText.trim().toUpperCase();
  const stakes: Stakes = verdict.startsWith("HIGH") ? "high" : "low";
  return { stakes, source: "llm", costUsd: result.actualCostUsd };
}
