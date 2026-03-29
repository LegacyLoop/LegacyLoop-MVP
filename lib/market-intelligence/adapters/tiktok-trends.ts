import { runApifyTask } from "./apify-client";

export interface TikTokTrendResult {
  success: boolean;
  isTrending: boolean;
  videoCount: number;
  totalViews: number;
  topHashtags: string[];
  demandSignal: "viral" | "trending" | "moderate" | "low" | "none";
}

export async function checkTikTokTrend(query: string): Promise<TikTokTrendResult> {
  const taskId = process.env.APIFY_TASK_TIKTOK;
  const empty: TikTokTrendResult = { success: false, isTrending: false, videoCount: 0, totalViews: 0, topHashtags: [], demandSignal: "none" };
  if (!taskId) return empty;

  try {
    const result = await runApifyTask(taskId, {
      searchQueries: [query],
      maxItems: 10,
    }, 30000);

    if (!result.success || result.items.length === 0) return empty;

    const videos = result.items;
    const totalViews = videos.reduce((sum: number, v: any) => sum + (v.playCount || v.views || 0), 0);
    const videoCount = videos.length;
    const topHashtags = [
      ...new Set(
        videos
          .flatMap((v: any) => (v.hashtags || []).map((h: any) => (typeof h === "string" ? h : h.name)))
          .filter(Boolean)
      ),
    ].slice(0, 5) as string[];

    let demandSignal: TikTokTrendResult["demandSignal"] = "none";
    if (totalViews > 1_000_000) demandSignal = "viral";
    else if (totalViews > 100_000) demandSignal = "trending";
    else if (totalViews > 10_000) demandSignal = "moderate";
    else if (videoCount > 3) demandSignal = "low";

    console.log(`[market-intel] TikTok: ${videoCount} videos, ${totalViews.toLocaleString()} views → ${demandSignal} for "${query.slice(0, 40)}"`);

    return {
      success: true,
      isTrending: demandSignal === "viral" || demandSignal === "trending",
      videoCount,
      totalViews,
      topHashtags,
      demandSignal,
    };
  } catch (e: any) {
    console.warn("[market-intel] TikTok trends failed:", e.message);
    return empty;
  }
}
