import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

/**
 * Courtyard.io Apify adapter — fractional collectibles marketplace.
 * Specializes in: sports cards, Pokemon, trading cards, memorabilia.
 * Courtyard tokenizes physical collectibles for fractional ownership.
 * Prices may represent fractional shares — adapter normalizes to full card value.
 */
export async function scrapeCourtyard(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_COURTYARD;
  if (!taskId) return { success: false, comps: [], source: "Courtyard.io" };

  try {
    const result = await runApifyTask(taskId, {
      keyword: query,
      maxItems: 12,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "Courtyard.io" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      let price = parsePrice(
        String(item.price || item.totalValue || item.marketCap || item.lastSale || "0")
      ) || 0;

      // Courtyard may return per-share pricing — normalize to full asset value
      if (item.totalShares && item.pricePerShare) {
        const fullValue = (parsePrice(String(item.pricePerShare)) || 0) * Number(item.totalShares);
        if (fullValue > price) price = fullValue;
      }

      return {
        item: (item.name || item.title || item.cardName || item.assetName || "Courtyard Listing").slice(0, 120),
        price,
        date: item.lastSaleDate || item.listedDate || item.date
          ? parseDate(item.lastSaleDate || item.listedDate || item.date)
          : new Date().toISOString().slice(0, 10),
        platform: "Courtyard.io",
        condition: item.condition || item.grade || "Graded",
        url: item.url || item.link || item.assetUrl || null,
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] Courtyard.io: ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Courtyard.io" };
  } catch (e: any) {
    console.warn("[market-intel] Courtyard.io failed:", e.message);
    return { success: false, comps: [], source: "Courtyard.io", error: e.message };
  }
}
