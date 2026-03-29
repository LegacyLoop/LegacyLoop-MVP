import { runApifyTask } from "./apify-client";

export interface AiVoiceoverResult {
  success: boolean;
  data: any;
  source: string;
  error?: string;
}

/**
 * Generate AI voiceover audio from a script via Apify.
 * Uses Apify task APIFY_TASK_AI_VOICEOVER.
 */
export async function generateApifyVoiceover(script: string): Promise<AiVoiceoverResult> {
  const taskId = process.env.APIFY_TASK_AI_VOICEOVER;
  if (!taskId) {
    console.log("[market-intel] AI Voiceover: no APIFY_TASK_AI_VOICEOVER configured — skipping");
    return { success: false, data: null, source: "ai-voiceover", error: "Task ID not configured" };
  }

  try {
    console.log(`[market-intel] AI Voiceover: generating voiceover (${script.length} chars)`);
    const result = await runApifyTask(taskId, { script, voice: "nova", format: "mp3" }, 60000);

    if (!result.success || result.items.length === 0) {
      console.log("[market-intel] AI Voiceover: no results returned");
      return { success: false, data: null, source: "ai-voiceover", error: "No results" };
    }

    const audioUrl = result.items[0]?.audioUrl || result.items[0]?.url || null;
    console.log(`[market-intel] AI Voiceover: audio generated${audioUrl ? ` — ${audioUrl.slice(0, 80)}` : ""}`);
    return { success: true, data: { audioUrl, raw: result.items[0] }, source: "ai-voiceover" };
  } catch (e: any) {
    console.log(`[market-intel] AI Voiceover: error — ${e.message}`);
    return { success: false, data: null, source: "ai-voiceover", error: e.message };
  }
}
