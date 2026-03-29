import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

export async function scrapeStockX(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_STOCKX;
  if (!taskId) return { success: false, comps: [], source: "StockX" };

  try {
    const result = await runApifyTask(taskId, {
      keyword: query,
      maxItems: 12,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "StockX" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      const price = parsePrice(String(item.price || item.lastSale || item.lowestAsk || "0")) || 0;
      return {
        item: (item.title || item.name || item.productName || item.shortDescription || "Listing").slice(0, 120),
        price,
        date: item.lastSaleDate || item.date ? parseDate(item.lastSaleDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "StockX",
        condition: item.condition || "New",
        url: item.url || item.link || null,
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] StockX: ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "StockX" };
  } catch (e: any) {
    console.warn("[market-intel] StockX failed:", e.message);
    return { success: false, comps: [], source: "StockX", error: e.message };
  }
}
