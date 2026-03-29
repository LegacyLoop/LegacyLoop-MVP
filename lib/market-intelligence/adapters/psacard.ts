import { runApifyTask } from "./apify-client";
import type { ScraperResult, MarketComp } from "../types";
import { parsePrice, parseDate } from "../scraper-base";

/**
 * PSAcard.com Apify adapter — graded card auction/sales history.
 * Closest equivalent to Beckett's BGS database for graded card values.
 * Returns actual PSA auction results with grades and sold prices.
 */
export async function scrapePsaCard(query: string): Promise<ScraperResult> {
  const taskId = process.env.APIFY_TASK_PSACARD;
  if (!taskId || taskId === "PASTE_PSACARD_TASK_ID") return { success: false, comps: [], source: "PSAcard" };

  try {
    const result = await runApifyTask(taskId, {
      keyword: query,
      maxItems: 15,
    }, 30000);

    if (!result.success) return { success: false, comps: [], source: "PSAcard" };

    const comps: MarketComp[] = result.items.slice(0, 15).map((item: any) => {
      const price = parsePrice(
        String(item.price || item.soldPrice || item.salePrice || item.auctionPrice || "0")
      ) || 0;

      const grade = item.grade || item.psaGrade || item.certification?.grade || "";
      const gradeLabel = grade ? `PSA ${grade}` : "Graded";

      return {
        item: (item.name || item.title || item.cardName || item.description || "PSA Card").slice(0, 120),
        price,
        date: item.saleDate || item.auctionDate || item.date || item.soldDate
          ? parseDate(item.saleDate || item.auctionDate || item.date || item.soldDate)
          : new Date().toISOString().slice(0, 10),
        platform: "PSAcard",
        condition: gradeLabel,
        url: item.url || item.link || item.lotUrl || null,
      };
    }).filter((c: MarketComp) => c.price > 0);

    console.log(`[market-intel] PSAcard: ${comps.length} graded card sales for "${query.slice(0, 40)}"`);
    return { success: comps.length > 0, comps, source: "PSAcard" };
  } catch (e: any) {
    console.warn("[market-intel] PSAcard failed:", e.message);
    return { success: false, comps: [], source: "PSAcard", error: e.message };
  }
}
