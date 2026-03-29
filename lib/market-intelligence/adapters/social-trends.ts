import { runApifyTask } from "./apify-client";

export interface SocialTrendsResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Scrape social media trending data for market intelligence.
 * Uses Apify task APIFY_TASK_SOCIAL_TRENDS.
 */
export async function scrapeSocialTrends(query: string): Promise<SocialTrendsResult> {
  const taskId = process.env.APIFY_TASK_SOCIAL_TRENDS;
  if (!taskId) {
    console.log("[market-intel] Social Trends: no APIFY_TASK_SOCIAL_TRENDS configured — skipping");
    return { success: false, data: null, source: "social-trends", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] Social Trends: scraping trending data for "${query.slice(0, 50)}"`);
    const result = await runApifyTask(taskId, { searchQuery: query, maxItems: 20 }, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] Social Trends: no results returned");
      return { success: false, data: null, source: "social-trends", error: "No results" };
    }

    console.log(`[market-intel] Social Trends: ${result.items.length} trending items found`);
    return { success: true, data: result.items, source: "social-trends" };
  } catch (e: any) {
    console.log(`[market-intel] Social Trends: error — ${e.message}`);
    return { success: false, data: null, source: "social-trends", error: e.message };
  }
}
