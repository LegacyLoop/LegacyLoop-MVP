import { runApifyTask } from "./apify-client";

export interface VideoScriptApifyResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Generate a video ad script via Apify AI task.
 * Uses Apify task APIFY_TASK_VIDEO_SCRIPT.
 */
export async function scrapeVideoScript(itemData: Record<string, any>): Promise<VideoScriptApifyResult> {
  const taskId = process.env.APIFY_TASK_VIDEO_SCRIPT;
  if (!taskId) {
    console.log("[market-intel] Video Script Apify: no APIFY_TASK_VIDEO_SCRIPT configured — skipping");
    return { success: false, data: null, source: "video-script-apify", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] Video Script Apify: generating script for "${(itemData.itemName || "item").slice(0, 50)}"`);
    const result = await runApifyTask(taskId, { itemData }, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] Video Script Apify: no results returned");
      return { success: false, data: null, source: "video-script-apify", error: "No results" };
    }

    console.log("[market-intel] Video Script Apify: script generated successfully");
    return { success: true, data: result.items[0] ?? result.items, source: "video-script-apify" };
  } catch (e: any) {
    console.log(`[market-intel] Video Script Apify: error — ${e.message}`);
    return { success: false, data: null, source: "video-script-apify", error: e.message };
  }
}
