/**
 * lib/adapters/bot-ai-router/config.ts
 * ─────────────────────────────────────────────────────────────────
 * BOT_AI_CONFIG — the central mapping of bot → best-fit AI.
 *
 * Source of truth: LegacyLoop bot-to-AI assignment doc (April 2026).
 * Each entry pairs a bot with its strongest specialist provider, an
 * optional secondary, the conditions that promote the secondary, and
 * a cost tier that bounds maximum spend per call.
 *
 * Editing this file is the safest way to retune routing — every
 * change is data-only, no logic edits required.
 *
 * CMD-AIROUTER-001 — Step 2
 * ─────────────────────────────────────────────────────────────────
 */

import type { BotAIConfig, BotName } from "./types";

/**
 * Per-bot routing configuration.
 *
 * Notes:
 *  • analyzebot uses OpenAI for reliable structured extraction; Gemini
 *    backstops on low-confidence or high-value items.
 *  • pricebot uses OpenAI for organized comp-style output; Gemini
 *    secondary adds market trend / location awareness on $500+ items
 *    or specialty categories.
 *  • photobot uses OpenAI for structured visual scoring; Gemini if
 *    primary confidence is shaky.
 *  • buyerbot uses Grok for buyer psychology + hook writing; Claude
 *    backs it up on antique/collectible/vehicle specialty items.
 *  • reconbot uses Gemini for research-style market scanning; Grok
 *    secondary kicks in when bots disagree by >20%.
 *  • listbot is HYBRID — Claude for structured marketplace copy AND
 *    Grok for native social posts. ALWAYS runs both. Premium tier.
 *  • antiquebot uses Claude for craftsmanship + provenance; OpenAI on
 *    borderline grading (condition_score 4-6).
 *  • collectiblesbot uses Claude for nuanced grading; OpenAI on
 *    borderline grading.
 *  • carbot uses Gemini for vehicle market reasoning; OpenAI on rare
 *    vehicles (pre-1980 OR < 30k miles).
 *  • megabot is a NO-OP at the router level — it continues to call
 *    runMegabot() directly so its 4-AI consensus contract stays
 *    untouched.
 */
export const BOT_AI_CONFIG: Record<BotName, BotAIConfig> = {
  analyzebot: {
    primary: "openai",
    secondary: "gemini",
    triggers: ["low_confidence", "high_value"],
    costTier: "budget",
  },
  pricebot: {
    primary: "openai",
    secondary: "gemini",
    triggers: ["high_value", "specialty_item", "live_web_needed"],
    costTier: "balanced",
    // CMD-PERPLEXITY-BOT-WIRING: Sonar fallback for volatile categories
    // (Antiques · Collectibles · Vehicles · Watches) · advisor I3.
    // Primary/secondary preserved for non-live-web calls.
    liveWebProvider: "perplexity",
  },
  photobot: {
    primary: "openai",
    secondary: "gemini",
    triggers: ["low_confidence"],
    costTier: "budget",
  },
  buyerbot: {
    primary: "grok",
    secondary: "claude",
    triggers: ["specialty_item", "live_web_needed"],
    costTier: "balanced",
    // CMD-S35-PERPLEXITY-RE-ANCHORED V18 (R15 P2 · 2026-05-06):
    // Sonar live-web grounding for current-day buyer-intent signals.
    // Closes R13 P2 deferral · advisor I3 · investor Moat #1+#8 compound.
    liveWebProvider: "perplexity",
  },
  reconbot: {
    primary: "gemini",
    secondary: "grok",
    triggers: ["high_disagreement", "live_web_needed"],
    costTier: "balanced",
    // CMD-PERPLEXITY-BOT-WIRING: Sonar deep-research for live market
    // intel · advisor I3 · Cyl 7 scraper-cleaning foundation. Grok
    // fallback on high_disagreement preserved.
    liveWebProvider: "perplexity",
  },
  listbot: {
    primary: "claude",
    secondary: "grok",
    triggers: ["always", "live_web_needed"], // hybrid bot — both providers always run
    costTier: "premium",
    // CMD-S35-PERPLEXITY-RE-ANCHORED V18 (R15 P2 · 2026-05-06):
    // Sonar live-web grounding for specialty marketplace tone (antiques ·
    // collectibles · vehicles). Specialty-tone gate at caller-wire.
    liveWebProvider: "perplexity",
  },
  antiquebot: {
    primary: "claude",
    secondary: "openai",
    triggers: ["borderline_grading", "live_web_needed"],
    costTier: "balanced",
    // CMD-S35-PERPLEXITY-RE-ANCHORED V18 (R15 P2 · 2026-05-06):
    // Sonar live-web grounding for auction-house intel + provenance
    // currency. Always-fire on antique scans · advisor I3.
    liveWebProvider: "perplexity",
  },
  collectiblesbot: {
    primary: "claude",
    secondary: "openai",
    triggers: ["borderline_grading", "live_web_needed"],
    costTier: "balanced",
    // CMD-S35-PERPLEXITY-RE-ANCHORED V18 (R15 P2 · 2026-05-06):
    // Sonar live-web grounding for graded collectible secondary market
    // (PSA/BGS/CGC pricing currency). Always-fire on collectible scans.
    liveWebProvider: "perplexity",
  },
  carbot: {
    primary: "gemini",
    secondary: "openai",
    triggers: ["rare_vehicle", "live_web_needed"],
    costTier: "balanced",
    // CMD-S35-PERPLEXITY-RE-ANCHORED V18 (R15 P2 · 2026-05-06):
    // Sonar live-web grounding for daily-volatile vehicle markets
    // (KBB/NADA/BAT recent comps). Always-fire on vehicle scans.
    liveWebProvider: "perplexity",
  },
  // CMD-VIDEOBOT-CORE-A: Grok primary for viral content + social hooks.
  // OpenAI secondary on high_value items for structured script quality.
  // Premium tier — VideoBot is the highest-revenue bot in the fleet.
  videobot: {
    primary: "grok",
    secondary: "openai",
    triggers: ["high_value"],
    costTier: "premium",
  },
  megabot: {
    primary: "openai", // placeholder — router defers to runMegabot()
    secondary: null,
    triggers: [],
    costTier: "premium",
  },
};

/**
 * Look up the config for a bot. Throws if the bot name is unknown —
 * fail-loud here is intentional, since a missing config means a
 * routing bug that should never reach production.
 */
export function getBotConfig(botName: BotName): BotAIConfig {
  const config = BOT_AI_CONFIG[botName];
  if (!config) {
    throw new Error(`[bot-ai-router] No config for bot: ${botName}`);
  }
  return config;
}
