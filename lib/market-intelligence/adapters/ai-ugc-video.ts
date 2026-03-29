import { runApifyTask } from "./apify-client";

export interface AiUgcVideoResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Generate a UGC-style video from product images via Apify AI.
 * Uses Apify task APIFY_TASK_AI_UGC_VIDEO.
 */
export async function generateUgcVideo(images: string[]): Promise<AiUgcVideoResult> {
  const taskId = process.env.APIFY_TASK_AI_UGC_VIDEO;
  if (!taskId) {
    console.log("[market-intel] AI UGC Video: no APIFY_TASK_AI_UGC_VIDEO configured — skipping");
    return { success: false, data: null, source: "ai-ugc-video", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] AI UGC Video: generating UGC video from ${images.length} image(s)`);
    const result = await runApifyTask(taskId, { images, style: "ugc", aspectRatio: "9:16" }, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] AI UGC Video: no results returned");
      return { success: false, data: null, source: "ai-ugc-video", error: "No results" };
    }

    const videoUrl = result.items[0]?.videoUrl || result.items[0]?.url || null;
    console.log(`[market-intel] AI UGC Video: video generated${videoUrl ? ` — ${videoUrl.slice(0, 80)}` : ""}`);
    return { success: true, data: { videoUrl, raw: result.items[0] }, source: "ai-ugc-video" };
  } catch (e: any) {
    console.log(`[market-intel] AI UGC Video: error — ${e.message}`);
    return { success: false, data: null, source: "ai-ugc-video", error: e.message };
  }
}
