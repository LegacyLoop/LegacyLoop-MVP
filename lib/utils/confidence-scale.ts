/**
 * CMD-CONFIDENCE-SCALE-NORMALIZE V18: confidence-scale helper
 *
 * The platform uses TWO valid confidence scales by intent:
 *   - 0-1   identification confidence (AiAnalysis.confidence per types.ts:20)
 *   - 0-100 pricing/consensus confidence (AiAnalysis.pricing_confidence
 *           per types.ts:42 · ItemDocument.confidenceScore per
 *           prisma/schema.prisma:1064)
 *
 * Schema fields are annotated at their source (prisma/schema.prisma)
 * but consumers historically wrote inline ternary `value > 1 ? value :
 * value * 100` to be safe. These helpers replace that pattern with a
 * named, tested function. Existing ternary sites are NOT migrated by
 * this cylinder — see CMD-CONFIDENCE-TERNARY-MIGRATE-V18 (banked).
 *
 * Both helpers accept ANY input scale (0-1 OR 0-100 OR null/undefined)
 * and return the requested scale. They are idempotent under repeated
 * application: toPct(toPct(x)) === toPct(x).
 *
 * Audit: lib/types.ts L20+L42 documents the two scales. Schema
 * comments at L427, L526, L539, L546, L553, L716, L869, L1064, L1082
 * carry per-field scale tags as of HEAD b52432f.
 */

/**
 * Coerce a confidence value (0-1 OR 0-100 OR null) to a 0-100 integer.
 * Heuristic: values strictly greater than 1 are already 0-100; values
 * in [0, 1] are fractional and get scaled by 100. Result is rounded
 * and clamped to [0, 100]. Null/undefined passes through.
 */
export function toPct(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const scaled = value > 1 ? value : value * 100;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

/**
 * Coerce a confidence value (0-1 OR 0-100 OR null) to a 0-1 float.
 * Heuristic: values strictly greater than 1 are 0-100 and get divided
 * by 100; values in [0, 1] are already fractional. Result is clamped
 * to [0, 1]. Null/undefined passes through.
 */
export function toFraction(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const scaled = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, scaled));
}
