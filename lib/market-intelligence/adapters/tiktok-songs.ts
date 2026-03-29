import { runApifyTask } from "./apify-client";

export interface TikTokSongsResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Scrape TikTok trending audio/songs for video ad background music.
 * Uses Apify task APIFY_TASK_TIKTOK_SONGS.
 */
export async function scrapeTikTokSongs(category?: string): Promise<TikTokSongsResult> {
  const taskId = process.env.APIFY_TASK_TIKTOK_SONGS;
  if (!taskId) {
    console.log("[market-intel] TikTok Songs: no APIFY_TASK_TIKTOK_SONGS configured — skipping");
    return { success: false, data: null, source: "tiktok-songs", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] TikTok Songs: scraping trending audio${category ? ` for category "${category}"` : ""}`);
    const input: Record<string, any> = { maxItems: 10 };
    if (category) input.category = category;
    const result = await runApifyTask(taskId, input, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] TikTok Songs: no results returned");
      return { success: false, data: null, source: "tiktok-songs", error: "No results" };
    }

    console.log(`[market-intel] TikTok Songs: ${result.items.length} trending tracks found`);
    return { success: true, data: result.items, source: "tiktok-songs" };
  } catch (e: any) {
    console.log(`[market-intel] TikTok Songs: error — ${e.message}`);
    return { success: false, data: null, source: "tiktok-songs", error: e.message };
  }
}
