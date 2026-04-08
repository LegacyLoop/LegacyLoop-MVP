import { runApifyTask } from "./apify-client";
import { checkAndBuildBlocked } from "../killswitch-typed-wrapper";

export interface AiVideoAdsResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Generate an AI video ad from images and a script via Apify.
 * Uses Apify task APIFY_TASK_AI_VIDEO_ADS.
 */
export async function generateAiVideoAd(
  images: string[],
  script: string
): Promise<AiVideoAdsResult> {
  // ─── KILL SWITCH GUARD — typed wrapper (CMD-SCRAPER-TIERS-B) ───
  // AI Video Ads Generator is dangerous_cost — $500 per 1,000 results.
  const blocked = checkAndBuildBlocked<AiVideoAdsResult>(
    "peaceful_pushpins/ai-video-ads-generator",
    { success: false, data: null, source: "ai-video-ads" },
  );
  if (blocked) return blocked;
  // ──────────────────────────────────────────────────────────────
  const taskId = process.env.APIFY_TASK_AI_VIDEO_ADS;
  if (!taskId) {
    console.log("[market-intel] AI Video Ads: no APIFY_TASK_AI_VIDEO_ADS configured — skipping");
    return { success: false, data: null, source: "ai-video-ads", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] AI Video Ads: generating video ad from ${images.length} image(s)`);
    const result = await runApifyTask(taskId, { images, script, format: "mp4", aspectRatio: "9:16" }, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] AI Video Ads: no results returned");
      return { success: false, data: null, source: "ai-video-ads", error: "No results" };
    }

    const videoUrl = result.items[0]?.videoUrl || result.items[0]?.url || null;
    console.log(`[market-intel] AI Video Ads: video generated${videoUrl ? ` — ${videoUrl.slice(0, 80)}` : ""}`);
    return { success: true, data: { videoUrl, raw: result.items[0] }, source: "ai-video-ads" };
  } catch (e: any) {
    console.log(`[market-intel] AI Video Ads: error — ${e.message}`);
    return { success: false, data: null, source: "ai-video-ads", error: e.message };
  }
}
