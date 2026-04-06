/**
 * lib/adapters/bot-ai-router/types.ts
 * ─────────────────────────────────────────────────────────────────
 * Foundational types for the per-bot AI router.
 *
 * This module defines the contracts used by every bot to route its
 * AI calls to the best-fit provider, with secondary triggers, cost
 * ceilings, and graceful fallback. It is a non-invasive WRAPPER
 * around the locked lib/adapters/multi-ai.ts.
 *
 * CMD-AIROUTER-001 — Step 2
 * ─────────────────────────────────────────────────────────────────
 */

import type { AiAnalysis } from "@/lib/types";

// ─── Core enums ──────────────────────────────────────────────────

/** All 10 LegacyLoop bots that can route through this layer. */
export type BotName =
  | "analyzebot"
  | "pricebot"
  | "photobot"
  | "buyerbot"
  | "reconbot"
  | "listbot"
  | "antiquebot"
  | "collectiblesbot"
  | "carbot"
  | "megabot";

/** AI providers wired into multi-ai.ts. */
export type ProviderName = "openai" | "claude" | "gemini" | "grok";

/** Cost tiers — bound the maximum spend per single routeBotAI() call. */
export type CostTier = "budget" | "balanced" | "premium";

/** Conditions that can promote a secondary AI to also run. */
export type TriggerName =
  | "low_confidence"
  | "high_value"
  | "specialty_item"
  | "high_disagreement"
  | "borderline_grading"
  | "rare_vehicle"
  | "always";

// ─── Config shape (config.ts populates this) ─────────────────────

export interface BotAIConfig {
  /** First-choice provider for this bot. */
  primary: ProviderName;
  /** Optional secondary provider — runs only if a trigger fires. */
  secondary: ProviderName | null;
  /** Conditions under which the secondary provider runs. */
  triggers: TriggerName[];
  /** Maximum spend tier for this bot's routeBotAI() invocations. */
  costTier: CostTier;
}

// ─── Router input/output ────────────────────────────────────────

/**
 * Input passed to routeBotAI(). The router needs enough signal to
 * evaluate triggers (estimated value, specialty flags, prior valuation,
 * condition score, vehicle metadata) without coupling to the full
 * item record.
 */
export interface RouterInput {
  botName: BotName;
  itemId: string;
  /** Photo path(s) — string or array — passed straight to provider runners. */
  photoPath: string | string[];
  /** Optional context string baked into the prompt. */
  context?: string;
  /** Trigger-evaluation signals. All optional. */
  signals?: {
    estimatedValue?: number | null;
    flags?: {
      antique?: boolean;
      collectible?: boolean;
      vehicle?: boolean;
    };
    priorValuation?: number | null;
    conditionScore?: number | null;
    carYear?: number | null;
    mileage?: number | null;
  };
  /** Caller overrides — useful for tests + admin tools. */
  options?: {
    forceProvider?: ProviderName;
    skipSecondary?: boolean;
    skipLogging?: boolean;
  };
}

/**
 * Per-call token usage captured from a provider's response.
 * CARRY-OVER FIX (Step 3): real metering replaces flat estimates.
 */
export interface TokenUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

/** Single-provider execution outcome. */
export interface ProviderRunResult {
  provider: ProviderName;
  result: AiAnalysis | null;
  error: string | null;
  durationMs: number;
  /** Real token counts captured from the provider response (when available). */
  tokens?: TokenUsage;
  /** Real USD cost computed from tokens × per-1k rates (when available). */
  actualCostUsd?: number;
}

/** Final routed result returned to the bot route. */
export interface RoutedAIResult {
  /** Primary provider's outcome — always present unless all attempts failed. */
  primary: ProviderRunResult;
  /** Secondary provider outcome — only present if a trigger fired and budget allowed. */
  secondary?: ProviderRunResult;
  /** Merged consensus AiAnalysis. Falls back to primary.result when no secondary. */
  merged: AiAnalysis | null;
  /** Providers that returned a successful result. */
  providersUsed: ProviderName[];
  /** Every provider attempted, including failures and fallbacks. */
  providersAttempted: ProviderName[];
  /** Estimated USD cost of this call (sum of attempted providers). */
  costUsd: number;
  /** Real USD cost from token metering (sum across providers, when captured). */
  actualCostUsd?: number;
  /** Wall-clock latency from routeBotAI() entry to return. */
  latencyMs: number;
  /** Triggers that fired during selection. */
  triggersFired: TriggerName[];
  /** True if the router walked the fallback chain past primary+secondary. */
  fallbackUsed: boolean;
  /** True if all providers failed and the caller is getting a degraded response. */
  degraded: boolean;
  /** Last error message when degraded === true. */
  error?: string;
}
