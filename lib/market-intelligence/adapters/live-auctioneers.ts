import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice, parseDate, deduplicateComps } from "../scraper-base";

export async function scrapeLiveAuctioneers(query: string): Promise<ScraperResult> {
  try {
    const url = `https://www.liveauctioneers.com/search/?keyword=${encodeURIComponent(query)}&sort=-relevance&status=archive`;
    const html = await fetchWithRetry(url);
    if (!html || html.length < 500) return { success: false, comps: [], source: "LiveAuctioneers" };
    const comps: MarketComp[] = [];
    const pattern = /class="[^"]*item[_-]?title[^"]*"[^>]*>([^<]{10,120})<[\s\S]{0,500}?\$([\d,.]+)/gi;
    let m;
    while ((m = pattern.exec(html)) !== null && comps.length < 12) {
      const title = m[1]?.trim();
      const price = parsePrice(m[2]);
      if (title && price && price > 0) comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "LiveAuctioneers", condition: "Auction Result", url: "https://www.liveauctioneers.com" });
    }
    if (comps.length === 0) {
      const fb = /<a[^>]*>([^<]{10,100})<\/a>[\s\S]{0,300}?\$([\d,.]+)/gi;
      while ((m = fb.exec(html)) !== null && comps.length < 12) {
        const title = m[1]?.trim().replace(/<[^>]+>/g, "");
        const price = parsePrice(m[2]);
        if (title && price && price > 0 && price < 500000 && !/shipping|cart|fee/i.test(title)) comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "LiveAuctioneers", condition: "Auction Result", url: "https://www.liveauctioneers.com" });
      }
    }
    console.log(`[market-intel] LiveAuctioneers: ${comps.length} results for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps: deduplicateComps(comps), source: "LiveAuctioneers" };
  } catch (e: any) {
    console.warn("[market-intel] LiveAuctioneers failed:", e.message);
    return { success: false, comps: [], source: "LiveAuctioneers", error: e.message };
  }
}
