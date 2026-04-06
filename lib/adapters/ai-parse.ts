/**
 * lib/adapters/ai-parse.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared loose-JSON parser for ALL new AI adapter code.
 *
 * CARRY-OVER FIX (Step 2 → Step 3):
 *   The drift risk between multi-ai.ts and bot-ai-router/index.ts
 *   is eliminated for all NEW code. multi-ai.ts (LOCKED) keeps its
 *   private copy until a future un-locking command. Every other
 *   adapter MUST import parseLooseJson from this file.
 *
 * Behavior matches multi-ai.ts.parseLooseJson() byte-for-byte so
 * downstream JSON shapes stay consistent.
 *
 * CMD-LISTBOT-HYBRID-001 — Step 3
 * ─────────────────────────────────────────────────────────────────
 */

import type { AiAnalysis } from "@/lib/types";

/**
 * Parse loose JSON returned by an LLM. Strips markdown fences,
 * extracts the first { ... } block, and validates that the result
 * has the minimum AiAnalysis fields. Returns null on any failure.
 */
export function parseLooseJson(text: string): AiAnalysis | null {
  let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed.item_name || !parsed.category) return null;
    return {
      item_name: String(parsed.item_name ?? "Unknown Item"),
      category: String(parsed.category ?? "Other"),
      brand: parsed.brand ?? null,
      model: parsed.model ?? null,
      maker: parsed.maker ?? null,
      material: parsed.material ?? null,
      era: parsed.era ?? null,
      style: parsed.style ?? null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 15) : [],
      condition_guess: String(parsed.condition_guess ?? "Unknown"),
      condition_score: Number(parsed.condition_score ?? 6),
      condition_cosmetic: Number(parsed.condition_cosmetic ?? 6),
      condition_functional: Number(parsed.condition_functional ?? 6),
      condition_details: String(parsed.condition_details ?? ""),
      markings: parsed.markings ?? null,
      dimensions_estimate: parsed.dimensions_estimate ?? null,
      completeness: parsed.completeness ?? null,
      notes: String(parsed.notes ?? ""),
      confidence: Number(parsed.confidence ?? 0.7),
      subcategory: parsed.subcategory ?? null,
      country_of_origin: parsed.country_of_origin ?? null,
      visible_issues: Array.isArray(parsed.visible_issues) ? parsed.visible_issues : [],
      positive_notes: Array.isArray(parsed.positive_notes) ? parsed.positive_notes : [],
      restoration_potential: parsed.restoration_potential ?? null,
      estimated_value_low: parsed.estimated_value_low != null ? Number(parsed.estimated_value_low) : null,
      estimated_value_mid: parsed.estimated_value_mid != null ? Number(parsed.estimated_value_mid) : null,
      estimated_value_high: parsed.estimated_value_high != null ? Number(parsed.estimated_value_high) : null,
      pricing_confidence: parsed.pricing_confidence != null ? Number(parsed.pricing_confidence) : null,
      pricing_rationale: parsed.pricing_rationale ?? null,
      comparable_description: parsed.comparable_description ?? null,
      value_drivers: Array.isArray(parsed.value_drivers) ? parsed.value_drivers : [],
      is_antique: parsed.is_antique ?? null,
      estimated_age_years: parsed.estimated_age_years != null ? Number(parsed.estimated_age_years) : null,
      antique_markers: Array.isArray(parsed.antique_markers) ? parsed.antique_markers : [],
      appraisal_recommended: parsed.appraisal_recommended ?? null,
      potential_value_if_authenticated:
        parsed.potential_value_if_authenticated != null
          ? Number(parsed.potential_value_if_authenticated)
          : null,
      recommended_title: parsed.recommended_title ?? null,
      recommended_description: parsed.recommended_description ?? null,
      best_platforms: Array.isArray(parsed.best_platforms) ? parsed.best_platforms : [],
      photo_quality_score: parsed.photo_quality_score != null ? Number(parsed.photo_quality_score) : null,
      photo_improvement_tips: Array.isArray(parsed.photo_improvement_tips) ? parsed.photo_improvement_tips : [],
      summary: parsed.summary ?? null,
      is_collectible: parsed.is_collectible ?? null,
      vehicle_year: parsed.vehicle_year ?? null,
      vehicle_make: parsed.vehicle_make ?? null,
      vehicle_model: parsed.vehicle_model ?? null,
      vehicle_mileage: parsed.vehicle_mileage ?? null,
      vin_visible: parsed.vin_visible ?? null,
      vehicle_transmission: parsed.vehicle_transmission ?? null,
      vehicle_fuel_type: parsed.vehicle_fuel_type ?? null,
      vehicle_engine: parsed.vehicle_engine ?? null,
      vehicle_drivetrain: parsed.vehicle_drivetrain ?? null,
      weight_estimate_lbs: parsed.weight_estimate_lbs != null ? Number(parsed.weight_estimate_lbs) : null,
      shipping_difficulty: parsed.shipping_difficulty ?? null,
      shipping_notes: parsed.shipping_notes ?? null,
      regional_best_city: parsed.regional_best_city ?? null,
      regional_best_state: parsed.regional_best_state ?? null,
      regional_best_price_low: parsed.regional_best_price_low != null ? Number(parsed.regional_best_price_low) : null,
      regional_best_price_high: parsed.regional_best_price_high != null ? Number(parsed.regional_best_price_high) : null,
      regional_best_why: parsed.regional_best_why ?? null,
      regional_local_demand: parsed.regional_local_demand ?? null,
      regional_local_reasoning: parsed.regional_local_reasoning ?? null,
      regional_ship_or_local: parsed.regional_ship_or_local ?? null,
      regional_local_best_city: parsed.regional_local_best_city ?? null,
      regional_local_best_why: parsed.regional_local_best_why ?? null,
      regional_national_best_city: parsed.regional_national_best_city ?? null,
      regional_national_best_state: parsed.regional_national_best_state ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Loose JSON parser for arbitrary AI outputs (NOT AiAnalysis-shaped).
 * Used by hybrid bots whose responses don't fit AiAnalysis (e.g.
 * ListBot's 13-platform listings shape). Returns the raw parsed
 * object or null.
 */
export function parseAnyLooseJson(text: string): any | null {
  if (!text) return null;
  let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
