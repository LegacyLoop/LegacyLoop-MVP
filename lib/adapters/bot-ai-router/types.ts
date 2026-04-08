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

// ─── BuyerBot hybrid (Step 5 Round A) ────────────────────────────
//
// CMD-BUYERBOT-HYBRID-5A
//
// BuyerBot is the second hybrid bot after ListBot. Pattern mirrors
// ListBotHybridInput / ListBotHybridResult (which live in index.ts
// alongside their runner). These two interfaces are placed here in
// types.ts because the BuyerBot route consumer (Round B) will import
// them from the public router surface and we want them visible to
// every future hybrid-bot migration in Steps 6-13.
// ──────────────────────────────────────────────────────────────────

/**
 * Input shape for routeBuyerBotHybrid().
 * Mirrors ListBotHybridInput pattern from Step 3 but adds
 * specialty-item secondary gating + apifyCostUsd tracking.
 *
 * CMD-BUYERBOT-HYBRID-5A — Step 5 Round A
 */
export interface BuyerBotHybridInput {
  /** Item ID for EventLog correlation */
  itemId: string;
  /** Photo path(s) — accepts string or string[] for multi-photo bots */
  photoPath: string | string[];
  /** Raw system prompt for Grok primary (BuyerBot's full assembled
   *  prompt including spec context, enrichment, web pre-pass, etc.) */
  buyerPrompt: string;
  /** Optional Claude secondary prompt — only used when
   *  shouldRunSecondary=true. Typically the same as buyerPrompt
   *  with an appended collector-tone refinement directive. */
  collectorContext?: string;
  /** Pre-evaluated by caller. When true, Claude secondary fires
   *  in parallel with Grok primary. When false, only Grok runs.
   *  Caller is responsible for trigger evaluation (specialty_item:
   *  is_antique || is_collectible || is_vehicle). */
  shouldRunSecondary: boolean;
  /** Caller-tracked Apify scraper spend for this BuyerBot call.
   *  Persisted in BOT_AI_ROUTING EventLog payload via the
   *  apifyCostUsd field added in Step 4.8. */
  apifyCostUsd?: number;
  /** Optional logging skip flag for tests. Default false. */
  skipLogging?: boolean;
}

/**
 * Output shape for routeBuyerBotHybrid().
 * Returns RAW JSON results (NOT AiAnalysis-shaped) so BuyerBot's
 * existing payload schema (buyer_profiles, hot_leads,
 * platform_opportunities, outreach_strategies) is preserved
 * unchanged when consumed by BuyerFinderPanel.
 */
export interface BuyerBotHybridResult {
  /** Grok primary result with raw JSON payload */
  primary: ProviderRunResult & { rawResult: any };
  /** Claude secondary result — only present when shouldRunSecondary
   *  was true AND Claude succeeded. May be undefined. */
  secondary?: ProviderRunResult & { rawResult: any };
  /** Estimated USD cost for the run (sum of providers attempted) */
  costUsd: number;
  /** Actual USD cost from token metering (Step 3 carry-over) */
  actualCostUsd: number;
  /** Total wall-clock latency in milliseconds */
  latencyMs: number;
  /** True if all providers (primary + fallbacks + secondary) failed.
   *  Caller should return a 422 error to the user when degraded. */
  degraded: boolean;
  /** Last error message when degraded=true */
  error?: string;
}

// ─── ReconBot hybrid (Step 6 Round A) ────────────────────────────
//
// CMD-RECONBOT-API-A
//
// ReconBot is the third hybrid bot after ListBot (Step 3) and
// BuyerBot (Step 5). Pattern mirrors the Step 5 hybrid input/result
// pair but adds an opt-in `enableGrounding` flag for Gemini's
// native Google Search grounding tool — the first hybrid runner
// to consume real-time web data through the router layer. Step 8
// CarBot (also Gemini-primary) inherits the grounding capability
// for free when its router migration lands.
// ──────────────────────────────────────────────────────────────────

/**
 * Input shape for routeReconBotHybrid().
 * Mirrors BuyerBotHybridInput pattern from Step 5 Round A but
 * adds optional Gemini grounding flag for real-time market
 * intelligence via Google Search.
 *
 * Caller is responsible for:
 *  • Pre-evaluating shouldRunSecondary using config.triggers
 *    (specifically the high_disagreement trigger — caller maps
 *    result.price_intelligence.market_average → synthetic
 *    estimated_value_mid before passing signals through)
 *  • Tracking apifyCostUsd from any scraper calls fired prior
 *    to invoking the router
 *  • Setting enableGrounding=true to opt into real-time Google
 *    Search results in Gemini's response (default off)
 *
 * CMD-RECONBOT-API-A — Step 6 Round A
 */
export interface ReconBotHybridInput {
  /** Item ID for EventLog correlation */
  itemId: string;
  /** Photo path(s) — accepts string or string[] for multi-photo */
  photoPath: string | string[];
  /** Raw system prompt for Gemini primary (ReconBot's full
   *  assembled prompt: enrichmentPrefix + specialtyBotContext +
   *  amazonContext + realCompContext + boilerplate) */
  reconPrompt: string;
  /** Optional Grok secondary prompt — only used when
   *  shouldRunSecondary=true. Typically the same as reconPrompt
   *  with an appended cultural-interpretation refinement
   *  directive for high-disagreement market scenarios. */
  culturalContext?: string;
  /** Pre-evaluated by caller. When true, Grok secondary fires
   *  in parallel with Gemini primary. When false, only Gemini
   *  runs. Caller responsibility to evaluate the
   *  high_disagreement trigger using ReconBot's market_average
   *  field as the synthetic estimated_value_mid. */
  shouldRunSecondary: boolean;
  /** Caller-tracked Apify scraper spend for this ReconBot call.
   *  Persisted in BOT_AI_ROUTING EventLog payload via the
   *  apifyCostUsd field added in Step 4.8. ReconBot becomes
   *  the second bot to populate this field after BuyerBot. */
  apifyCostUsd?: number;
  /** Enable Gemini's native Google Search grounding tool.
   *  Default false — opt-in only. When true, Gemini runs with
   *  tools: [{ google_search: {} }] on first attempt and falls
   *  back to plain JSON if grounding fails or returns empty.
   *  Grounding citations are extracted into the result's
   *  geminiWebSources field. Reserved for ReconBot (Step 6)
   *  and CarBot (Step 8) — both Gemini-primary bots that
   *  benefit from real-time web data. */
  enableGrounding?: boolean;
  /** Optional logging skip flag for tests. Default false. */
  skipLogging?: boolean;
}

/**
 * Output shape for routeReconBotHybrid().
 * Returns RAW JSON results (NOT AiAnalysis-shaped) so ReconBot's
 * existing payload schema (scan_summary, competitor_listings,
 * price_intelligence, market_dynamics, platform_breakdown,
 * alerts, competitive_advantages, competitive_disadvantages,
 * strategic_recommendations, sold_tracker, market_forecast,
 * executive_summary) is preserved unchanged when consumed by
 * ReconBotPanel.
 *
 * geminiWebSources is populated when enableGrounding=true and
 * the dual-attempt grounding pattern returned at least one
 * citation chunk. Empty array otherwise.
 */
export interface ReconBotHybridResult {
  /** Gemini primary result with raw JSON payload */
  primary: ProviderRunResult & { rawResult: any };
  /** Grok secondary result — only present when shouldRunSecondary
   *  was true AND Grok succeeded. Best-effort, may be undefined. */
  secondary?: ProviderRunResult & { rawResult: any };
  /** Real-time Google Search citations from Gemini grounding.
   *  Only populated when enableGrounding=true on the input.
   *  Caller is responsible for merging this into the result's
   *  web_sources field (ReconBot route does this in Round 6B). */
  geminiWebSources: Array<{ url: string; title: string }>;
  /** Estimated USD cost for the run (sum of providers attempted) */
  costUsd: number;
  /** Actual USD cost from token metering (Step 3 carry-over) */
  actualCostUsd: number;
  /** Total wall-clock latency in milliseconds */
  latencyMs: number;
  /** True if all providers (primary + fallbacks + secondary)
   *  failed. Caller should return a 422 error to the user when
   *  degraded. */
  degraded: boolean;
  /** Last error message when degraded=true */
  error?: string;
}

// ─── AntiqueBot hybrid (Step 7 Round A) ──────────────────────────
//
// CMD-ANTIQUEBOT-CORE-A
//
// AntiqueBot is the fourth hybrid bot after ListBot (Step 3),
// BuyerBot (Step 5), and ReconBot (Step 6). Pattern mirrors the
// proven Step 5/6 hybrid input/result pair but with a Claude
// primary (museum-grade authentication + provenance reasoning)
// and an OpenAI secondary (collector-opinion backup) that fires
// when the primary's authentication.confidence < threshold.
// ──────────────────────────────────────────────────────────────────

/**
 * Input shape for routeAntiqueBotHybrid().
 *
 * Caller is responsible for:
 *  • Pre-evaluating shouldRunSecondary if forcing the OpenAI
 *    secondary regardless of confidence (typically false — let
 *    the threshold gate decide)
 *  • Tracking apifyCostUsd from any scraper calls fired prior
 *    to invoking the router
 *  • Setting authConfidenceThreshold (default 80) — primary
 *    confidence below this triggers the OpenAI secondary
 *
 * CMD-ANTIQUEBOT-CORE-A — Step 7 Round A
 */
export interface AntiqueBotHybridInput {
  /** Item ID for EventLog correlation */
  itemId: string;
  /** Photo path(s) — accepts string or string[] for multi-photo */
  photoPath: string | string[];
  /** Raw appraisal prompt — passed AS-IS to Claude primary
   *  (and to the OpenAI secondary if it fires). Should include
   *  the full assembled prompt: skill pack + spec context +
   *  enrichment + market intel + appraisal instructions. */
  appraisalPrompt: string;
  /** Force the OpenAI secondary to run regardless of primary
   *  confidence. Default false — the confidence threshold gate
   *  drives secondary firing automatically. */
  shouldRunSecondary?: boolean;
  /** Primary confidence threshold (1-100). When the primary
   *  result's authentication.confidence is BELOW this number,
   *  the OpenAI secondary fires for a collector-opinion backup
   *  pass. Default 80. */
  authConfidenceThreshold?: number;
  /** Override timeout for both primary and secondary calls.
   *  Defaults to HYBRID_DEFAULTS.TIMEOUT_MS. */
  timeoutMs?: number;
  /** Override max output tokens for both primary and secondary.
   *  Defaults to HYBRID_DEFAULTS.MAX_TOKENS. */
  maxTokens?: number;
  /** Caller-tracked Apify scraper spend for this AntiqueBot call.
   *  Persisted in BOT_AI_ROUTING EventLog payload via the
   *  apifyCostUsd field added in Step 4.8. AntiqueBot becomes
   *  the third bot to populate this field after BuyerBot and
   *  ReconBot. */
  apifyCostUsd?: number;
  /** Optional logging skip flag for tests. Default false. */
  skipLogging?: boolean;
}

/**
 * Output shape for routeAntiqueBotHybrid().
 * Returns RAW JSON results (NOT AiAnalysis-shaped) so AntiqueBot's
 * existing payload schema (authentication, identification,
 * historical_context, condition_assessment, valuation,
 * collector_market, selling_strategy, documentation,
 * provenance_chain, exhibition_potential, value_projections,
 * executive_summary) is preserved unchanged when consumed by
 * AntiqueEvalPanel.
 *
 * mergedResult contains the fused output: primary as base, with
 * secondary's higher-confidence authentication overlay if both
 * succeeded. mergedStrategy reports which path was taken so
 * downstream telemetry can audit consensus quality.
 */
export interface AntiqueBotHybridResult {
  /** Claude primary result with raw JSON payload */
  primary: ProviderRunResult & { rawResult: any };
  /** OpenAI secondary result — only present when fired AND
   *  succeeded. Best-effort: secondary failure does NOT mark
   *  the run degraded. */
  secondary?: ProviderRunResult & { rawResult: any };
  /** Merged final result. primary as base, with secondary's
   *  higher-confidence authentication block overlaid if both
   *  succeeded. Falls back to primary alone or secondary alone
   *  per mergedStrategy. */
  mergedResult: any;
  /** Authentication confidence (1-100) read from the primary
   *  result. Used by callers to size confidence bands. */
  primaryConfidence: number;
  /** True if the OpenAI secondary fired (either because primary
   *  confidence was below threshold OR caller forced it). */
  secondaryTriggered: boolean;
  /** Merge strategy taken:
   *   - "primary_only":      primary OK, secondary did not fire
   *   - "merged_consensus":  both OK, fused
   *   - "degraded":          primary failed, fallback or secondary used,
   *                          or both failed (caller checks .degraded) */
  mergedStrategy: "primary_only" | "merged_consensus" | "degraded";
  /** Estimated USD cost for the run (sum of providers attempted) */
  costUsd: number;
  /** Actual USD cost from token metering (Step 3 carry-over) */
  actualCostUsd: number;
  /** Aggregated token usage across primary + secondary */
  tokens: { input: number; output: number; total: number };
  /** Total wall-clock latency in milliseconds */
  latencyMs: number;
  /** True if all providers (primary + fallbacks + secondary)
   *  failed. Caller should return a 422 error to the user when
   *  degraded. */
  degraded: boolean;
  /** Last error message when degraded=true */
  error?: string;
}
