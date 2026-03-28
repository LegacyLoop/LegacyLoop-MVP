import type { ScraperResult } from "../types";

const DISCOGS_UA = "LegacyLoop/1.0 (+https://legacyloop.com)";

// Rate limiter for Discogs (60 req/min)
let lastDiscogsReq = 0;
async function discogsRateWait() {
  const wait = Math.max(0, 1100 - (Date.now() - lastDiscogsReq));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastDiscogsReq = Date.now();
}

export async function queryDiscogs(query: string): Promise<ScraperResult> {
  try {
    await discogsRateWait();

    // Step 1: Search for release
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=5`;
    const controller1 = new AbortController();
    const t1 = setTimeout(() => controller1.abort(), 10000);
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": DISCOGS_UA },
      signal: controller1.signal,
    });
    clearTimeout(t1);
    if (!searchRes.ok) throw new Error(`Discogs search ${searchRes.status}`);
    const searchData = await searchRes.json();

    const results = searchData.results || [];
    if (results.length === 0) {
      return { success: false, comps: [], source: "Discogs", error: "No results" };
    }

    const comps: ScraperResult["comps"] = [];

    // Step 2: Get marketplace stats for top 3 releases
    for (const release of results.slice(0, 3)) {
      await discogsRateWait();
      const statsUrl = `https://api.discogs.com/marketplace/stats/${release.id}`;
      const controller2 = new AbortController();
      const t2 = setTimeout(() => controller2.abort(), 10000);
      try {
        const statsRes = await fetch(statsUrl, {
          headers: { "User-Agent": DISCOGS_UA },
          signal: controller2.signal,
        });
        clearTimeout(t2);
        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (stats.lowest_price?.value || stats.median_price?.value) {
            comps.push({
              item: release.title || query,
              price: stats.median_price?.value || stats.lowest_price?.value || 0,
              date: new Date().toISOString().slice(0, 10),
              platform: "Discogs",
              condition: "Median Market Price",
              url: `https://www.discogs.com/sell/release/${release.id}`,
            });
            if (stats.lowest_price?.value && stats.lowest_price.value !== stats.median_price?.value) {
              comps.push({
                item: `${release.title || query} (lowest)`,
                price: stats.lowest_price.value,
                date: new Date().toISOString().slice(0, 10),
                platform: "Discogs",
                condition: "Lowest Available",
              });
            }
          }
        }
      } catch {
        clearTimeout(t2);
      }
    }

    console.log(`[market-intel] Discogs: ${comps.length} comps for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "Discogs" };
  } catch (e: any) {
    console.warn("[market-intel] Discogs failed:", e.message);
    return { success: false, comps: [], source: "Discogs", error: e.message };
  }
}
