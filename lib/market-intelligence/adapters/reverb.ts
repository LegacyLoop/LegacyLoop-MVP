import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice, deduplicateComps } from "../scraper-base";

export async function scrapeReverb(query: string): Promise<ScraperResult> {
  const encoded = encodeURIComponent(query);

  // Try Reverb's public API first (HAL+JSON)
  try {
    const apiUrl = `https://api.reverb.com/api/listings?query=${encoded}&per_page=12&sort=price&state=ended`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const apiRes = await fetch(apiUrl, {
      headers: {
        "Accept": "application/hal+json",
        "Accept-Version": "3.0",
        "User-Agent": "LegacyLoop/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const listings = data.listings || data._embedded?.listings || [];
      const comps: MarketComp[] = listings.map((l: any) => {
        const price = parseFloat(String(l.price?.amount || l.price || "0")) || 0;
        return {
          item: (l.title || l.make_model || "Listing").slice(0, 120),
          price,
          date: l.sold_date || l.created_at || new Date().toISOString().slice(0, 10),
          platform: "Reverb",
          condition: l.condition?.display_name || l.condition || "As Listed",
          url: l._links?.web?.href || l.link || "https://reverb.com",
          location: l.seller?.region || null,
        };
      }).filter((c: MarketComp) => c.price > 0).slice(0, 12);

      if (comps.length > 0) {
        console.log(`[market-intel] Reverb API: ${comps.length} listings for "${query.slice(0, 40)}"`);
        return { success: true, comps, source: "Reverb" };
      }
    }
  } catch { /* API failed — try HTML fallback */ }

  // HTML fallback — marketplace search page
  try {
    const htmlUrl = `https://reverb.com/marketplace?query=${encoded}&sort=price`;
    const html = await fetchWithRetry(htmlUrl);
    if (!html || html.length < 500) return { success: false, comps: [], source: "Reverb" };

    const comps: MarketComp[] = [];

    // JSON embedded in page
    const listingPattern = /"name"\s*:\s*"([^"]{5,120})"[\s\S]{0,300}?"price"\s*:\s*"?([\d.]+)"?/gi;
    let match;
    while ((match = listingPattern.exec(html)) !== null && comps.length < 12) {
      const title = match[1]?.trim();
      const price = parsePrice(match[2]);
      if (title && price && price > 0 && price < 50000) {
        comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "Reverb", condition: "As Listed", url: "https://reverb.com" });
      }
    }

    // Fallback: HTML card patterns
    if (comps.length === 0) {
      const cardPattern = /<a[^>]*>([^<]{10,100})<\/a>[\s\S]{0,300}?\$([\d,.]+)/gi;
      while ((match = cardPattern.exec(html)) !== null && comps.length < 12) {
        const title = match[1]?.trim().replace(/<[^>]+>/g, "");
        const price = parsePrice(match[2]);
        if (title && price && price > 0 && price < 50000 && !/shipping|cart|fee/i.test(title)) {
          comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "Reverb", condition: "As Listed", url: "https://reverb.com" });
        }
      }
    }

    console.log(`[market-intel] Reverb HTML: ${comps.length} listings for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps: deduplicateComps(comps), source: "Reverb" };
  } catch (e: any) {
    console.warn("[market-intel] Reverb failed:", e.message);
    return { success: false, comps: [], source: "Reverb", error: e.message };
  }
}
