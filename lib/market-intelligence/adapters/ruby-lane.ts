import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice, deduplicateComps } from "../scraper-base";

export async function scrapeRubyLane(query: string): Promise<ScraperResult> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://www.rubylane.com/search?query=${encoded}&sort=price`;

    const html = await fetchWithRetry(url);
    if (!html || html.length < 500) return { success: false, comps: [], source: "Ruby Lane" };

    const comps: MarketComp[] = [];

    // Pattern 1: item-card structured blocks
    const listingPattern = /class="item-card"[\s\S]*?title="([^"]+)"[\s\S]*?\$([\d,.]+)/gi;
    let match;
    while ((match = listingPattern.exec(html)) !== null && comps.length < 12) {
      const title = match[1]?.trim();
      const price = parsePrice(match[2]);
      if (title && price && price > 0) {
        comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "Ruby Lane", condition: "Antique/Vintage", url: "https://www.rubylane.com" });
      }
    }

    // Pattern 2: generic link+price fallback
    if (comps.length === 0) {
      const fallbackPattern = /<a[^>]*>([^<]{8,100})<\/a>[\s\S]{0,200}?\$([\d,.]+)/gi;
      while ((match = fallbackPattern.exec(html)) !== null && comps.length < 12) {
        const title = match[1]?.trim().replace(/<[^>]+>/g, "");
        const price = parsePrice(match[2]);
        if (title && price && price > 0 && price < 100000 && !/shipping|cart|checkout|fee/i.test(title)) {
          comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "Ruby Lane", condition: "Antique/Vintage", url: "https://www.rubylane.com" });
        }
      }
    }

    console.log(`[market-intel] Ruby Lane: ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps: deduplicateComps(comps), source: "Ruby Lane" };
  } catch (e: any) {
    console.warn("[market-intel] Ruby Lane failed:", e.message);
    return { success: false, comps: [], source: "Ruby Lane", error: e.message };
  }
}
