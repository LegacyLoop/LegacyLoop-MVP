/**
 * lib/adapters/bot-ai-router/provider-selector.ts
 * ─────────────────────────────────────────────────────────────────
 * Trigger evaluation + provider selection logic.
 *
 * Pure functions — no I/O, no state. Given a router input + the
 * primary provider's result + the bot's config, decides which
 * triggers fired and whether to run the secondary provider.
 *
 * Triggers (all 7):
 *   • low_confidence     primary.confidence < 0.70
 *   • high_value         estimatedValue >= $500
 *   • specialty_item     antique || collectible || vehicle
 *   • high_disagreement  delta vs prior valuation > 20%
 *   • borderline_grading condition_score in 4..6
 *   • rare_vehicle       carYear < 1980 || mileage < 30000
 *   • always             hybrid bots (listbot)
 *
 * CMD-AIROUTER-001 — Step 2
 * ─────────────────────────────────────────────────────────────────
 */

import type { AiAnalysis } from "@/lib/types";
import {
  canAffordSecondary,
  estimateProviderCost,
} from "./cost-tracker";
import type {
  BotAIConfig,
  ProviderName,
  RouterInput,
  TriggerName,
} from "./types";

// ─── Threshold constants (centralized for tuning) ──────────────

export const LOW_CONFIDENCE_THRESHOLD = 0.70;
export const HIGH_VALUE_THRESHOLD_USD = 500;
export const HIGH_DISAGREEMENT_RATIO = 0.20;
export const BORDERLINE_GRADE_MIN = 4;
export const BORDERLINE_GRADE_MAX = 6;
export const RARE_VEHICLE_YEAR_MAX = 1980;
export const RARE_VEHICLE_MILEAGE_MAX = 30_000;

// ─── Trigger evaluation ────────────────────────────────────────

/**
 * Evaluate every trigger configured for this bot against the input
 * + primary result. Returns the list of triggers that fired.
 *
 * Pure function — safe to call repeatedly.
 */
export function evaluateTriggers(
  input: RouterInput,
  primaryResult: AiAnalysis | null,
  config: BotAIConfig,
): TriggerName[] {
  const fired: TriggerName[] = [];
  const signals = input.signals ?? {};

  for (const trigger of config.triggers) {
    switch (trigger) {
      case "low_confidence": {
        const conf = primaryResult?.confidence ?? 1;
        if (conf < LOW_CONFIDENCE_THRESHOLD) fired.push("low_confidence");
        break;
      }

      case "high_value": {
        // Check both the input signal AND the primary's own estimate
        const value = signals.estimatedValue ?? primaryResult?.estimated_value_mid ?? 0;
        if ((value ?? 0) >= HIGH_VALUE_THRESHOLD_USD) fired.push("high_value");
        break;
      }

      case "specialty_item": {
        const flags = signals.flags ?? {};
        const isSpecialty =
          flags.antique === true ||
          flags.collectible === true ||
          flags.vehicle === true ||
          primaryResult?.is_antique === true ||
          (primaryResult as any)?.is_collectible === true ||
          primaryResult?.category?.toLowerCase() === "vehicles";
        if (isSpecialty) fired.push("specialty_item");
        break;
      }

      case "high_disagreement": {
        const prior = signals.priorValuation;
        const current = primaryResult?.estimated_value_mid;
        if (prior != null && current != null && prior > 0) {
          const max = Math.max(prior, current);
          const ratio = Math.abs(prior - current) / max;
          if (ratio > HIGH_DISAGREEMENT_RATIO) fired.push("high_disagreement");
        }
        break;
      }

      case "borderline_grading": {
        const score = signals.conditionScore ?? primaryResult?.condition_score;
        if (
          score != null &&
          score >= BORDERLINE_GRADE_MIN &&
          score <= BORDERLINE_GRADE_MAX
        ) {
          fired.push("borderline_grading");
        }
        break;
      }

      case "rare_vehicle": {
        const year = signals.carYear ?? primaryResult?.vehicle_year;
        const miles = signals.mileage ?? primaryResult?.vehicle_mileage;
        const yearOk = typeof year === "number" && year < RARE_VEHICLE_YEAR_MAX;
        const milesOk = typeof miles === "number" && miles < RARE_VEHICLE_MILEAGE_MAX;
        if (yearOk || milesOk) fired.push("rare_vehicle");
        break;
      }

      case "always": {
        fired.push("always");
        break;
      }
    }
  }

  return fired;
}

// ─── Provider selection ────────────────────────────────────────

export interface SelectedProviders {
  primary: ProviderName;
  secondary: ProviderName | null;
}

/**
 * Decide which providers should run. Honors options.forceProvider
 * for tests + admin tools.
 */
export function selectProviders(
  config: BotAIConfig,
  input: RouterInput,
): SelectedProviders {
  if (input.options?.forceProvider) {
    return { primary: input.options.forceProvider, secondary: null };
  }
  return { primary: config.primary, secondary: config.secondary };
}

/**
 * Should the secondary provider actually run? All four conditions
 * must hold:
 *   1. Config has a secondary
 *   2. Caller didn't pass skipSecondary
 *   3. At least one trigger fired
 *   4. Adding secondary stays under tier ceiling AND hard ceiling
 */
export function shouldRunSecondary(
  config: BotAIConfig,
  input: RouterInput,
  triggersFired: TriggerName[],
  currentCost: number,
): boolean {
  if (!config.secondary) return false;
  if (input.options?.skipSecondary) return false;
  if (triggersFired.length === 0) return false;
  return canAffordSecondary(config.costTier, currentCost, config.secondary);
}

// ─── Fallback chain ────────────────────────────────────────────

/**
 * The graceful fallback chain (Option A). When the primary fails:
 *   primary → secondary → openai → claude → gemini → grok
 *
 * Returns providers to try AFTER the failed one, in order, with
 * duplicates removed.
 */
export function fallbackChain(
  failedProvider: ProviderName,
  alreadyTried: ProviderName[] = [],
): ProviderName[] {
  const fullChain: ProviderName[] = ["openai", "claude", "gemini", "grok"];
  const tried = new Set<ProviderName>([failedProvider, ...alreadyTried]);
  return fullChain.filter((p) => !tried.has(p));
}
