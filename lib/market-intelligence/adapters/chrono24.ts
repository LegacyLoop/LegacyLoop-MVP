import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

export async function scrapeChrono24(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_CHRONO24;
  if (!taskId) return { success: false, comps: [], source: "Chrono24" };

  try {
    const result = await runApifyTask(taskId, {
      keyword: query,
      maxItems: 12,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "Chrono24" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      const price = parsePrice(String(item.price || item.listPrice || item.askingPrice || "0")) || 0;
      return {
        item: (item.title || item.name || item.watchName || item.brand && item.model ? `${item.brand} ${item.model}`.trim() : "Watch").slice(0, 120),
        price,
        date: item.listedDate || item.date ? parseDate(item.listedDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "Chrono24",
        condition: item.condition || "As Listed",
        url: item.url || item.link || null,
        location: item.dealerLocation || item.location || null,
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] Chrono24: ${comps.length} watches for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Chrono24" };
  } catch (e: any) {
    console.warn("[market-intel] Chrono24 failed:", e.message);
    return { success: false, comps: [], source: "Chrono24", error: e.message };
  }
}
