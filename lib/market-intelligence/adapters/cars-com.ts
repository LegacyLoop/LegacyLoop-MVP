import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

export async function scrapeCarsCom(query: string, zip?: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_CARS_COM;
  if (!taskId) return { success: false, comps: [], source: "Cars.com" };

  const searchUrl = `https://www.cars.com/shopping/results/?keyword=${encodeURIComponent(query)}${zip ? `&zip=${zip}` : ""}`;

  try {
    const result = await runApifyTask(taskId, {
      url: searchUrl,
      maxItems: 12,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "Cars.com" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      const price = parsePrice(String(item.price || item.listPrice || "0")) || 0;
      return {
        item: (item.title || item.name || item.heading || "Vehicle").slice(0, 120),
        price,
        date: item.listedDate || item.date ? parseDate(item.listedDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "Cars.com",
        condition: item.condition || item.stockType || "As Listed",
        url: item.url || item.link || null,
        location: item.dealerLocation || item.location || (zip ? `Near ${zip}` : null),
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] Cars.com: ${comps.length} vehicles for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Cars.com" };
  } catch (e: any) {
    console.warn("[market-intel] Cars.com failed:", e.message);
    return { success: false, comps: [], source: "Cars.com", error: e.message };
  }
}
