import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

export async function scrapeAutoTrader(query: string, zip?: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_AUTOTRADER;
  if (!taskId) return { success: false, comps: [], source: "AutoTrader" };

  const searchUrl = `https://www.autotrader.com/cars-for-sale/all-cars/${encodeURIComponent(query)}${zip ? `?zip=${zip}` : ""}`;

  try {
    const result = await runApifyTask(taskId, {
      searchUrl,
      maxItems: 12,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "AutoTrader" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      const price = parsePrice(String(item.price || item.listPrice || item.msrp || "0")) || 0;
      return {
        item: (item.title || item.name || item.make && item.model ? `${item.year || ""} ${item.make} ${item.model}`.trim() : "Vehicle").slice(0, 120),
        price,
        date: item.listedDate || item.date ? parseDate(item.listedDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "AutoTrader",
        condition: item.condition || item.type || "As Listed",
        url: item.url || item.link || null,
        location: item.location || item.dealerLocation || (zip ? `Near ${zip}` : null),
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] AutoTrader: ${comps.length} vehicles for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "AutoTrader" };
  } catch (e: any) {
    console.warn("[market-intel] AutoTrader failed:", e.message);
    return { success: false, comps: [], source: "AutoTrader", error: e.message };
  }
}
