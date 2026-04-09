import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice, deduplicateComps } from "../scraper-base";

/**
 * Beckett Marketplace free HTML scraper.
 * CMD-COLLECTIBLESBOT-CORE-A — Step 8 Round A
 *
 * Mirrors the rubylane.ts pattern: free Tier 1 built-in, no Apify
 * cost, two-pattern regex with generic fallback, deduplicated
 * output. Beckett is the industry-standard price guide for sports
 * cards + TCG + graded comics — parity coverage with PriceCharting
 * and PSACard. When beckett.com changes DOM, scraper degrades
 * silently and returns success=false (FLAG-CB-3 monitoring).
 */
export async function scrapeBeckettHtml(query: string): Promise<ScraperResult> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://www.beckett.com/marketplace/search?q=${encoded}`;

    const html = await fetchWithRetry(url);
    if (!html || html.length < 500) return { success: false, comps: [], source: "Beckett" };

    const comps: MarketComp[] = [];

    // Pattern 1: marketplace-item structured blocks (Beckett listing card)
    const listingPattern = /class="marketplace-item[^"]*"[\s\S]*?title="([^"]+)"[\s\S]*?\$([\d,.]+)/gi;
    let match;
    while ((match = listingPattern.exec(html)) !== null && comps.length < 12) {
      const title = match[1]?.trim();
      const price = parsePrice(match[2]);
      if (title && price && price > 0) {
        comps.push({
          item: title.slice(0, 120),
          price,
          date: new Date().toISOString().slice(0, 10),
          platform: "Beckett",
          condition: "Graded/Collector",
          url: "https://www.beckett.com/marketplace",
        });
      }
    }

    // Pattern 2: generic link+price fallback (when DOM shifts)
    if (comps.length === 0) {
      const fallbackPattern = /<a[^>]*>([^<]{8,100})<\/a>[\s\S]{0,200}?\$([\d,.]+)/gi;
      while ((match = fallbackPattern.exec(html)) !== null && comps.length < 12) {
        const title = match[1]?.trim().replace(/<[^>]+>/g, "");
        const price = parsePrice(match[2]);
        if (title && price && price > 0 && price < 100000 && !/shipping|cart|checkout|fee|sign.?in|register/i.test(title)) {
          comps.push({
            item: title.slice(0, 120),
            price,
            date: new Date().toISOString().slice(0, 10),
            platform: "Beckett",
            condition: "Graded/Collector",
            url: "https://www.beckett.com/marketplace",
          });
        }
      }
    }

    console.log(`[market-intel] Beckett: ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps: deduplicateComps(comps), source: "Beckett" };
  } catch (e: any) {
    console.warn("[market-intel] Beckett failed:", e.message);
    return { success: false, comps: [], source: "Beckett", error: e.message };
  }
}
