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

/**
 * Unified demo mode check — single source of truth.
 * Returns true if ANY of these env vars indicate demo mode:
 *   BOT_MODE=demo (primary), DEMO_MODE=true, NEXT_PUBLIC_DEMO_MODE=true
 */
export function isDemoMode(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.BOT_MODE === "demo") return true;
  if (process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  // Default to demo when BOT_MODE is not explicitly set to "live"
  if (!process.env.BOT_MODE || process.env.BOT_MODE !== "live") return true;
  return false;
}
