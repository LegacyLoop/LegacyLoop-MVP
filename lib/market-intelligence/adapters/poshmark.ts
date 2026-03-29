import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice, deduplicateComps } from "../scraper-base";

export async function scrapePoshmark(query: string): Promise<ScraperResult> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://poshmark.com/search?query=${encoded}&type=listings&src=dir`;

    const html = await fetchWithRetry(url);
    if (!html || html.length < 500) return { success: false, comps: [], source: "Poshmark" };

    const comps: MarketComp[] = [];

    // Pattern 1: JSON-LD product data
    const jsonLdPattern = /"@type"\s*:\s*"Product"[\s\S]*?"name"\s*:\s*"([^"]+)"[\s\S]*?"price"\s*:\s*"?([\d.]+)"?/gi;
    let match;
    while ((match = jsonLdPattern.exec(html)) !== null && comps.length < 12) {
      const title = match[1]?.trim();
      const price = parsePrice(match[2]);
      if (title && price && price > 0 && price < 10000) {
        comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "Poshmark", condition: "As Listed", url: "https://poshmark.com" });
      }
    }

    // Pattern 2: tile card data attributes
    if (comps.length === 0) {
      const tilePattern = /title="([^"]{10,120})"[\s\S]{0,500}?\$([\d,.]+)/gi;
      while ((match = tilePattern.exec(html)) !== null && comps.length < 12) {
        const title = match[1]?.trim();
        const price = parsePrice(match[2]);
        if (title && price && price > 0 && price < 10000 && !/shipping|fee|tax/i.test(title)) {
          comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "Poshmark", condition: "As Listed", url: "https://poshmark.com" });
        }
      }
    }

    // Pattern 3: generic link+price
    if (comps.length === 0) {
      const genericPattern = /<a[^>]*>([^<]{10,80})<\/a>[\s\S]{0,300}?\$([\d,.]+)/gi;
      while ((match = genericPattern.exec(html)) !== null && comps.length < 12) {
        const title = match[1]?.trim().replace(/<[^>]+>/g, "");
        const price = parsePrice(match[2]);
        if (title && price && price > 0 && price < 10000 && !/shipping|fee|tax|cart/i.test(title)) {
          comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "Poshmark", condition: "As Listed", url: "https://poshmark.com" });
        }
      }
    }

    console.log(`[market-intel] Poshmark: ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps: deduplicateComps(comps), source: "Poshmark" };
  } catch (e: any) {
    console.warn("[market-intel] Poshmark failed:", e.message);
    return { success: false, comps: [], source: "Poshmark", error: e.message };
  }
}
