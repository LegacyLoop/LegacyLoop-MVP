import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";
import {
  checkActorKillSwitch,
  buildBlockedScraperResult,
} from "../scraper-killswitch";

export async function scrapeCarGurus(query: string, zip?: string): Promise<ScraperResult> {
  // ─── KILL SWITCH GUARD (CMD-SCRAPER-KILLSWITCH-A) ───
  // Cargurus Scraper is monthly-subscription only ($29/mo + usage).
  const __ks = checkActorKillSwitch("lexis-solutions/cargurus-com");
  if (__ks.blocked) {
    return buildBlockedScraperResult("lexis-solutions/cargurus-com") as any;
  }
  // ───────────────────────────────────────────────────
  const taskId = process.env.APIFY_TASK_CARGURUS;
  if (!taskId) return { success: false, comps: [], source: "CarGurus" };

  const searchUrl = `https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?keyword=${encodeURIComponent(query)}${zip ? `&zip=${zip}` : ""}`;

  try {
    const result = await runApifyTask(taskId, {
      url: searchUrl,
      maxItems: 12,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "CarGurus" };

    const comps: MarketComp[] = result.items.slice(0, 12).map((item: any) => {
      const price = parsePrice(String(item.price || item.listPrice || item.expectedPrice || "0")) || 0;
      return {
        item: (item.title || item.name || item.listingTitle || "Vehicle").slice(0, 120),
        price,
        date: item.listedDate || item.date ? parseDate(item.listedDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "CarGurus",
        condition: item.condition || item.dealRating || "As Listed",
        url: item.url || item.link || null,
        location: item.dealerLocation || item.location || (zip ? `Near ${zip}` : null),
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] CarGurus: ${comps.length} vehicles for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "CarGurus" };
  } catch (e: any) {
    console.warn("[market-intel] CarGurus failed:", e.message);
    return { success: false, comps: [], source: "CarGurus", error: e.message };
  }
}
