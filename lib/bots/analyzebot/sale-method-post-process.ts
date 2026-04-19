/**
 * AnalyzeBot Sale Method Post-Process (V9b)
 *
 * Runtime null-out of national-scope regional_* fields when the seller
 * context indicates saleMethod=LOCAL_PICKUP. Belt-and-suspenders layer
 * enforcing the contract documented in skill pack 21 — if the LLM
 * ignores the schema instruction and returns a national city anyway,
 * this helper overwrites the mask.
 *
 * Paired module: lib/bots/skills/analyzebot/21-sale-method-discipline.md
 *
 * Added: CMD-BOT-ENGINE-CANONIZE-SALE-METHOD (April 18, 2026)
 * Extracted from: lib/adapters/ai.ts inline null-out block
 *                 (shipped by CMD-SALE-METHOD-FOUNDATION 1463bec)
 */

import type { AiAnalysis } from "@/lib/types";

/**
 * National-scope regional_* fields that must be nulled on LOCAL_PICKUP.
 * Radius-aware local_* fields (regional_local_best_city, _best_why,
 * _demand, _reasoning) are intentionally absent — they SHOULD fire
 * for LOCAL_PICKUP items so Intelligence can recommend Augusta/Bangor
 * etc. within the seller's radius.
 */
export const LOCAL_PICKUP_NATIONAL_FIELDS: Array<keyof AiAnalysis> = [
  "regional_best_city",
  "regional_best_state",
  "regional_best_price_low",
  "regional_best_price_high",
  "regional_best_why",
  "regional_ship_or_local",
  "regional_national_best_city",
  "regional_national_best_state",
];

/**
 * Detect LOCAL_PICKUP context from the seller data block threaded by
 * analyze/route.ts. Uses a regex because the label is a stable string
 * contract ("Sale method: LOCAL_PICKUP"). CMD-AI-ADAPTER-SALE-METHOD-
 * PARAM (banked) would upgrade this to a typed parameter.
 */
export function isLocalPickupContext(context: string | undefined): boolean {
  if (!context) return false;
  return /Sale method:\s*LOCAL_PICKUP/i.test(context);
}

/**
 * Null-out national-scope regional fields when saleMethod=LOCAL_PICKUP.
 * Preserves radius-aware local fields. Mutates in-place and returns
 * the same reference. Returns the input unchanged when not LOCAL_PICKUP.
 *
 * Logs nulled-field count to console for observability. EventLog-level
 * telemetry is banked as CMD-AI-NULL-OUT-TELEMETRY.
 */
export function applyLocalPickupDiscipline<T extends AiAnalysis | null | undefined>(
  analysis: T,
  context: string | undefined,
): T {
  if (!analysis) return analysis;
  if (!isLocalPickupContext(context)) return analysis;

  const nulledFields: string[] = [];
  for (const field of LOCAL_PICKUP_NATIONAL_FIELDS) {
    if ((analysis as AiAnalysis)[field] != null) {
      nulledFields.push(field);
      (analysis as unknown as Record<string, unknown>)[field] = null;
    }
  }

  if (nulledFields.length > 0) {
    console.log(
      `[ANALYZEBOT_LOCAL_PICKUP_DISCIPLINE] nulled ${nulledFields.length} national regional_* field(s): ${nulledFields.join(", ")}`,
    );
  }

  return analysis;
}
