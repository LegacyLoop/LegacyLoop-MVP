import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

/**
 * TCGPlayer Apify adapter — deeper data than built-in scraper.
 * Covers: Pokemon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Lorcana,
 * sports cards (Topps, Panini), and 80+ other TCGs.
 */
export async function scrapeTcgplayerApify(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_TCGPLAYER;
  if (!taskId) return { success: false, comps: [], source: "TCGPlayer (Apify)" };

  try {
    const result = await runApifyTask(taskId, {
      keyword: query,
      maxItems: 15,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "TCGPlayer (Apify)" };

    const comps: MarketComp[] = result.items.slice(0, 15).map((item: any) => {
      const price = parsePrice(
        String(item.price || item.marketPrice || item.midPrice || item.lowPrice || "0")
      ) || 0;
      return {
        item: (item.name || item.title || item.productName || item.fullName || "TCG Listing").slice(0, 120),
        price,
        date: item.lastUpdated || item.date
          ? parseDate(item.lastUpdated || item.date)
          : new Date().toISOString().slice(0, 10),
        platform: "TCGPlayer",
        condition: item.condition || item.printing || "Near Mint",
        url: item.url || item.productUrl || item.link || null,
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] TCGPlayer (Apify): ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "TCGPlayer (Apify)" };
  } catch (e: any) {
    console.warn("[market-intel] TCGPlayer (Apify) failed:", e.message);
    return { success: false, comps: [], source: "TCGPlayer (Apify)", error: e.message };
  }
}
