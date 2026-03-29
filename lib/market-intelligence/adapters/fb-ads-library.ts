import { runApifyTask } from "./apify-client";

export interface FbAdsLibraryResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Scrape Meta/Facebook Ads Library for competitor ad intelligence.
 * Uses Apify task APIFY_TASK_FB_ADS_LIBRARY.
 */
export async function scrapeFbAdsLibrary(query: string): Promise<FbAdsLibraryResult> {
  const taskId = process.env.APIFY_TASK_FB_ADS_LIBRARY;
  if (!taskId) {
    console.log("[market-intel] FB Ads Library: no APIFY_TASK_FB_ADS_LIBRARY configured — skipping");
    return { success: false, data: null, source: "fb-ads-library", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] FB Ads Library: scraping Meta ads for "${query.slice(0, 50)}"`);
    const result = await runApifyTask(taskId, { searchQuery: query, maxItems: 15 }, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] FB Ads Library: no results returned");
      return { success: false, data: null, source: "fb-ads-library", error: "No results" };
    }

    console.log(`[market-intel] FB Ads Library: ${result.items.length} ads found`);
    return { success: true, data: result.items, source: "fb-ads-library" };
  } catch (e: any) {
    console.log(`[market-intel] FB Ads Library: error — ${e.message}`);
    return { success: false, data: null, source: "fb-ads-library", error: e.message };
  }
}
