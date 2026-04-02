/**
 * Bot Mode Configuration
 *
 * BOT_MODE env var controls whether bots use mock/demo data or live APIs.
 *
 * Values:
 *   "demo"  — Uses hardcoded mock data for all bot systems.
 *             Safe for demos, development, and investor presentations.
 *   "live"  — Default (when BOT_MODE is unset). Connects to real APIs
 *             (requires API keys + platform credentials).
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
 * Returns true ONLY when explicitly opted in via env vars:
 *   BOT_MODE=demo, DEMO_MODE=true, or NEXT_PUBLIC_DEMO_MODE=true
 *
 * When no env var is set, defaults to LIVE (production behavior).
 */
export function isDemoMode(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.BOT_MODE === "demo") {
    console.warn("[LegacyLoop] Running in DEMO mode (BOT_MODE=demo). No charges or limits enforced.");
    return true;
  }
  if (process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    console.warn("[LegacyLoop] Running in DEMO mode (DEMO_MODE/NEXT_PUBLIC_DEMO_MODE=true). No charges or limits enforced.");
    return true;
  }
  return false;
}
