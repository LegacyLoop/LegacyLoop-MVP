import { runApifyTask } from "./apify-client";

export interface TikTokAdsResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Scrape TikTok ad creatives for competitor intelligence.
 * Uses Apify task APIFY_TASK_TIKTOK_ADS.
 */
export async function scrapeTikTokAds(query: string): Promise<TikTokAdsResult> {
  const taskId = process.env.APIFY_TASK_TIKTOK_ADS;
  if (!taskId) {
    console.log("[market-intel] TikTok Ads: no APIFY_TASK_TIKTOK_ADS configured — skipping");
    return { success: false, data: null, source: "tiktok-ads", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] TikTok Ads: scraping ad creatives for "${query.slice(0, 50)}"`);
    const result = await runApifyTask(taskId, { searchQuery: query, maxItems: 15 }, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] TikTok Ads: no results returned");
      return { success: false, data: null, source: "tiktok-ads", error: "No results" };
    }

    console.log(`[market-intel] TikTok Ads: ${result.items.length} ad creatives found`);
    return { success: true, data: result.items, source: "tiktok-ads" };
  } catch (e: any) {
    console.log(`[market-intel] TikTok Ads: error — ${e.message}`);
    return { success: false, data: null, source: "tiktok-ads", error: e.message };
  }
}
