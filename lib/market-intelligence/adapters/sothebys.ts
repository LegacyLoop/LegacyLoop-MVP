import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";
import {
  checkActorKillSwitch,
  buildBlockedScraperResult,
} from "../scraper-killswitch";

export async function scrapeSothebys(query: string): Promise<ScraperResult> {
  // ─── KILL SWITCH GUARD (CMD-SCRAPER-KILLSWITCH-A) ───
  // Sotheby's Search Scraper is dangerous_cost — pay-per-usage with
  // UNKNOWN ceiling. Hard-blocked until a per-bot allowlist + cost
  // ceiling is wired in CMD-SCRAPER-CEILINGS-D.
  const __ks = checkActorKillSwitch("powerai/sothebys-search-scraper");
  if (__ks.blocked) {
    return buildBlockedScraperResult("powerai/sothebys-search-scraper") as any;
  }
  // ───────────────────────────────────────────────────
  const taskId = process.env.APIFY_TASK_SOTHEBYS;
  if (!taskId) return { success: false, comps: [], source: "Sotheby's" };

  try {
    const result = await runApifyTask(taskId, {
      keyword: query,
      maxItems: 8,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "Sotheby's" };

    const comps: MarketComp[] = result.items.slice(0, 8).map((item: any) => {
      const price = parsePrice(String(item.price || item.hammerPrice || item.estimateHigh || item.soldPrice || "0")) || 0;
      return {
        item: (item.title || item.name || item.lotTitle || item.description || "Auction Lot").slice(0, 120),
        price,
        date: item.saleDate || item.auctionDate || item.date ? parseDate(item.saleDate || item.auctionDate || item.date) : new Date().toISOString().slice(0, 10),
        platform: "Sotheby's",
        condition: item.condition || "Auction Result",
        url: item.url || item.link || null,
        location: item.saleLocation || item.location || null,
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] Sotheby's: ${comps.length} lots for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Sotheby's" };
  } catch (e: any) {
    console.warn("[market-intel] Sotheby's failed:", e.message);
    return { success: false, comps: [], source: "Sotheby's", error: e.message };
  }
}
