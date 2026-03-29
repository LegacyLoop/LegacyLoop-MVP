import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

export async function scrapeEbayMotors(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_EBAY;
  if (!taskId) return { success: false, comps: [], source: "eBay Motors" };
  try {
    const url = `https://www.ebay.com/sch/Cars-Trucks/6001/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`;
    const result = await runApifyTask(taskId, { urls: [{ url }], maxItems: 12 }, 30000);
    if (!result.success) return { success: false, comps: [], source: "eBay Motors" };
    const comps: MarketComp[] = result.items.slice(0, 12).map((i: any) => ({
      item: (i.title || i.name || "Vehicle").slice(0, 120),
      price: parsePrice(String(i.price || i.soldPrice || "0")) || 0,
      date: i.soldDate || i.date ? parseDate(i.soldDate || i.date) : new Date().toISOString().slice(0, 10),
      platform: "eBay Motors",
      condition: i.condition || "As Listed",
      url: i.url || i.link || null,
    })).filter((c: MarketComp) => c.price > 0);
    console.log(`[market-intel] eBay Motors: ${comps.length} vehicles for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "eBay Motors" };
  } catch (e: any) {
    console.warn("[market-intel] eBay Motors failed:", e.message);
    return { success: false, comps: [], source: "eBay Motors", error: e.message };
  }
}
