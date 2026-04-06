/**
 * lib/adapters/bot-ai-router/cost-tracker.ts
 * ─────────────────────────────────────────────────────────────────
 * Per-call cost estimator + ceiling enforcer.
 *
 * The router exists to PROTECT margin. Today's headroom is ~98.7%
 * (revenue $3.57 vs cost $0.047 per call). This file caps spend so
 * one runaway routing decision can't blow that math.
 *
 * Estimates are based on average token usage (~4,500 tokens/call).
 * Real metering is a Step 2.1 follow-up; for now estimates are
 * intentionally conservative (lean high) to keep ceilings honest.
 *
 * In-memory only — single-instance Vercel deploys are fine for MVP.
 * Move to Redis when we run multi-instance.
 *
 * CMD-AIROUTER-001 — Step 2
 * ─────────────────────────────────────────────────────────────────
 */

import type { CostTier, ProviderName, TokenUsage } from "./types";

// ─── Cost ceilings (USD per single routeBotAI call) ────────────

/** Budget tier: ~one cheap provider only (1cr bots). */
export const TIER_BUDGET_USD = 0.008;

/** Balanced tier: primary + conditional secondary (2cr bots). */
export const TIER_BALANCED_USD = 0.020;

/** Premium tier: primary + secondary always (hybrid bots). */
export const TIER_PREMIUM_USD = 0.050;

/**
 * Hard ceiling — 2% of $3.57 revenue floor. NO call may exceed this.
 * If a routing decision would push past this, the secondary is
 * dropped and the call proceeds with primary only.
 */
export const HARD_CEILING_USD = 0.071;

// ─── Per-provider estimated cost per call ───────────────────────

/**
 * Estimated USD cost per single provider call. Based on:
 *  • OpenAI gpt-4o-mini @ 4.5k tokens (in+out) ≈ $0.0025
 *  • Anthropic Claude Haiku 4.5 @ 4.5k tokens   ≈ $0.0044
 *  • Google Gemini 2.5 Flash @ 4.5k tokens      ≈ $0.00125
 *  • xAI Grok-4 @ 4.5k tokens                   ≈ $0.0025
 *
 * These are estimates until token metering ships. They lean high
 * to keep margin protection conservative.
 */
const PROVIDER_COST_USD: Record<ProviderName, number> = {
  openai: 0.0025,
  claude: 0.0044,
  gemini: 0.00125,
  grok: 0.0025,
};

/** Lookup the cost ceiling for a given tier. */
export function getCeilingForTier(tier: CostTier): number {
  switch (tier) {
    case "budget":
      return TIER_BUDGET_USD;
    case "balanced":
      return TIER_BALANCED_USD;
    case "premium":
      return TIER_PREMIUM_USD;
  }
}

/** Estimate the cost of a single provider call. */
export function estimateProviderCost(provider: ProviderName): number {
  return PROVIDER_COST_USD[provider] ?? 0.005;
}

/**
 * Estimate the cumulative cost of running a list of providers.
 * Used both for the running tally during a call and the up-front
 * affordability check.
 */
export function estimateRunCost(providers: ProviderName[]): number {
  return providers.reduce((sum, p) => sum + estimateProviderCost(p), 0);
}

/**
 * Decide whether the secondary provider can be added without
 * blowing the tier ceiling OR the global hard ceiling.
 *
 * Returns true if BOTH constraints hold:
 *   1. currentCost + secondaryCost ≤ tier ceiling
 *   2. currentCost + secondaryCost ≤ HARD_CEILING_USD
 */
export function canAffordSecondary(
  tier: CostTier,
  currentCost: number,
  secondaryProvider: ProviderName,
): boolean {
  const projected = currentCost + estimateProviderCost(secondaryProvider);
  const tierCeiling = getCeilingForTier(tier);
  return projected <= tierCeiling && projected <= HARD_CEILING_USD;
}

/** Hard global ceiling check — used as the final safety net. */
export function isOverHardCeiling(totalCost: number): boolean {
  return totalCost > HARD_CEILING_USD;
}

// ─── Real token metering (CARRY-OVER FIX from Step 2) ─────────

/**
 * Per-1k-token rates in USD. Lean conservative (slightly high) so
 * margin protection stays honest until real metering proves cheaper.
 *
 * Sources (April 2026):
 *   • OpenAI gpt-4o-mini    in $0.00015 / out $0.0006
 *   • Anthropic Haiku 4.5   in $0.001   / out $0.005
 *   • Google Gemini 2.5 Fl  in $0.000075 / out $0.0003
 *   • xAI Grok-4            in $0.0005  / out $0.0015
 */
export const TOKEN_RATES_PER_1K: Record<ProviderName, { input: number; output: number }> = {
  openai: { input: 0.00015,  output: 0.0006 },
  claude: { input: 0.001,    output: 0.005 },
  gemini: { input: 0.000075, output: 0.0003 },
  grok:   { input: 0.0005,   output: 0.0015 },
};

/**
 * Compute the REAL USD cost of a single provider call from captured
 * token usage. Falls back to the flat estimate when usage is missing.
 *
 * Always returns a positive number — never throws.
 */
export function computeActualCost(
  provider: ProviderName,
  tokens?: TokenUsage,
): number {
  if (!tokens || (tokens.inputTokens == null && tokens.outputTokens == null)) {
    return estimateProviderCost(provider);
  }
  const rates = TOKEN_RATES_PER_1K[provider];
  if (!rates) return estimateProviderCost(provider);
  const inK = (tokens.inputTokens ?? 0) / 1000;
  const outK = (tokens.outputTokens ?? 0) / 1000;
  const cost = inK * rates.input + outK * rates.output;
  return Number(cost.toFixed(6));
}
