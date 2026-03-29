import { runApifyTask } from "./apify-client";

export interface AiAdMusicResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Generate AI background music for video ads via Apify.
 * Uses Apify task APIFY_TASK_AI_AD_MUSIC.
 */
export async function generateAdMusic(
  mood: string,
  category: string
): Promise<AiAdMusicResult> {
  const taskId = process.env.APIFY_TASK_AI_AD_MUSIC;
  if (!taskId) {
    console.log("[market-intel] AI Ad Music: no APIFY_TASK_AI_AD_MUSIC configured — skipping");
    return { success: false, data: null, source: "ai-ad-music", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] AI Ad Music: generating ${mood} music for "${category}"`);
    const result = await runApifyTask(taskId, { mood, category, durationSeconds: 30, format: "mp3" }, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] AI Ad Music: no results returned");
      return { success: false, data: null, source: "ai-ad-music", error: "No results" };
    }

    const musicUrl = result.items[0]?.musicUrl || result.items[0]?.url || null;
    console.log(`[market-intel] AI Ad Music: music generated${musicUrl ? ` — ${musicUrl.slice(0, 80)}` : ""}`);
    return { success: true, data: { musicUrl, raw: result.items[0] }, source: "ai-ad-music" };
  } catch (e: any) {
    console.log(`[market-intel] AI Ad Music: error — ${e.message}`);
    return { success: false, data: null, source: "ai-ad-music", error: e.message };
  }
}
