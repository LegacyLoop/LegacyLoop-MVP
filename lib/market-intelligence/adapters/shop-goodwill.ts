import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice, deduplicateComps } from "../scraper-base";

export async function scrapeShopGoodwill(query: string): Promise<ScraperResult> {
  try {
    const url = `https://shopgoodwill.com/categories/listing?st=${encodeURIComponent(query)}&p=1&ps=12&o=1`;
    const html = await fetchWithRetry(url);
    if (!html || html.length < 500) return { success: false, comps: [], source: "ShopGoodwill" };
    const comps: MarketComp[] = [];
    const pattern = /<a[^>]*title="([^"]{10,120})"[^>]*>[\s\S]{0,500}?\$([\d,.]+)/gi;
    let m;
    while ((m = pattern.exec(html)) !== null && comps.length < 12) {
      const title = m[1]?.trim();
      const price = parsePrice(m[2]);
      if (title && price && price > 0 && price < 50000 && !/shipping|fee/i.test(title)) {
        comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "ShopGoodwill", condition: "Auction", url: "https://shopgoodwill.com" });
      }
    }
    if (comps.length === 0) {
      const fallback = /"title"\s*:\s*"([^"]{10,120})"[\s\S]{0,300}?"price"\s*:\s*"?([\d.]+)"?/gi;
      while ((m = fallback.exec(html)) !== null && comps.length < 12) {
        const title = m[1]?.trim();
        const price = parsePrice(m[2]);
        if (title && price && price > 0) comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "ShopGoodwill", condition: "Auction", url: "https://shopgoodwill.com" });
      }
    }
    console.log(`[market-intel] ShopGoodwill: ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps: deduplicateComps(comps), source: "ShopGoodwill" };
  } catch (e: any) {
    console.warn("[market-intel] ShopGoodwill failed:", e.message);
    return { success: false, comps: [], source: "ShopGoodwill", error: e.message };
  }
}
