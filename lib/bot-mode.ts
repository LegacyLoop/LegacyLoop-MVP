/**
 * Bot Mode Configuration
 *
 * BOT_MODE env var controls whether bots use mock/demo data or live APIs.
 *
 * Values:
 *   "demo"  — Default. Uses hardcoded mock data for all bot systems.
 *             Safe for demos, development, and investor presentations.
 *   "live"  — Connects to real APIs (requires API keys + platform credentials).
 *             NOT YET IMPLEMENTED. When ready, swap the data sources in:
 *               - lib/services/recon-bot.ts  → real scraper/API calls
 *               - api/bots/activate/[itemId] → real buyer discovery APIs
 *               - lib/adapters/multi-ai.ts   → already live (Claude/Gemini/OpenAI/Grok)
 *
 * Live Mode API Connection Points (for future implementation):
 *   1. Facebook Marketplace API → buyer scanning
 *   2. eBay Browse API (already partially built in lib/adapters/ebay.ts)
 *   3. Craigslist scraper → competitor/buyer discovery
 *   4. Reddit API → r/Antiques, r/FlippingForProfit monitoring
 *   5. Mercari/OfferUp/Poshmark APIs → cross-platform listing
 *   6. Nextdoor API → local buyer matching
 *
 * To switch: Set BOT_MODE=live in .env and implement the adapters above.
 */

export type BotMode = "demo" | "live";

export const BOT_MODE: BotMode =
  (process.env.BOT_MODE as BotMode) ?? "demo";

export function isDemoMode(): boolean {
  return BOT_MODE === "demo";
}

export function isLiveMode(): boolean {
  return BOT_MODE === "live";
}
