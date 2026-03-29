import { runApifyTask } from "./apify-client";

export interface YouTubeResult {
  success: boolean;
  videos: { title: string; views: number; likes: number; channelName: string; url: string; publishedAt: string }[];
  totalViews: number;
  demandSignal: "high" | "moderate" | "low" | "none";
}

export async function scrapeYoutube(query: string, _category?: string): Promise<YouTubeResult> {
  const taskId = process.env.APIFY_TASK_YOUTUBE;
  const empty: YouTubeResult = { success: false, videos: [], totalViews: 0, demandSignal: "none" };
  if (!taskId) return empty;

  try {
    const result = await runApifyTask(taskId, { searchKeywords: [query], maxItems: 10 }, 30000);
    if (!result.success) return empty;

    const videos = result.items.map((v: any) => ({
      title: (v.title || v.name || "").slice(0, 120),
      views: v.viewCount || v.views || 0,
      likes: v.likeCount || v.likes || 0,
      channelName: v.channelName || v.channel || v.ownerChannelName || "",
      url: v.url || (v.id ? `https://youtube.com/watch?v=${v.id}` : ""),
      publishedAt: v.publishedAt || v.date || "",
    })).slice(0, 10);

    const totalViews = videos.reduce((s: number, v: any) => s + v.views, 0);

    let demandSignal: YouTubeResult["demandSignal"] = "none";
    if (totalViews > 100000) demandSignal = "high";
    else if (totalViews > 10000) demandSignal = "moderate";
    else if (totalViews > 1000) demandSignal = "low";

    console.log(`[market-intel] YouTube: ${videos.length} videos, ${totalViews.toLocaleString()} views → ${demandSignal} for "${query.slice(0, 40)}"`);
    return { success: true, videos, totalViews, demandSignal };
  } catch (e: any) {
    console.warn("[market-intel] YouTube failed:", e.message);
    return empty;
  }
}
