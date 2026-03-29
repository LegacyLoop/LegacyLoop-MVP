import type { ScraperResult, MarketComp } from "../types";
import { fetchWithRetry, parsePrice, deduplicateComps } from "../scraper-base";

function getSubdomain(zip?: string): string {
  if (!zip) return "maine";
  const p = zip.slice(0, 3);
  if (["039","040","041","042","043","044","045","046","047","048","049"].includes(p)) return "maine";
  if (p.startsWith("100") || p.startsWith("101")) return "newyork";
  if (p.startsWith("021") || p.startsWith("022")) return "boston";
  return "www";
}

export async function scrapeCraigslistAntiques(query: string, zip?: string): Promise<ScraperResult> {
  try {
    const sub = getSubdomain(zip);
    const url = `https://${sub}.craigslist.org/search/atq?query=${encodeURIComponent(query)}&sort=date`;
    const html = await fetchWithRetry(url);
    if (!html || html.length < 500) return { success: false, comps: [], source: "Craigslist (Antiques)" };
    const comps: MarketComp[] = [];
    const pat = /<span class="label">([^<]{10,120})<\/span>[\s\S]{0,300}?\$([\d,.]+)/gi;
    let m;
    while ((m = pat.exec(html)) !== null && comps.length < 12) {
      const title = m[1]?.trim();
      const price = parsePrice(m[2]);
      if (title && price && price > 0) comps.push({ item: title.slice(0, 120), price, date: new Date().toISOString().slice(0, 10), platform: "Craigslist (Antiques)", condition: "Antique/Vintage", url: `https://${sub}.craigslist.org`, location: zip ? `Near ${zip}` : null });
    }
    console.log(`[market-intel] CL Antiques (${sub}): ${comps.length} for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps: deduplicateComps(comps), source: "Craigslist (Antiques)" };
  } catch (e: any) {
    console.warn("[market-intel] CL Antiques failed:", e.message);
    return { success: false, comps: [], source: "Craigslist (Antiques)", error: e.message };
  }
}
