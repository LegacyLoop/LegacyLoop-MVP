import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.LITELLM_BASE_URL
        ? `${process.env.LITELLM_BASE_URL}/openai/v1`
        : undefined,
    })
  : null;

export interface NarrationResult {
  success: boolean;
  audioUrl: string | null;
  duration: number;
  error?: string;
}

/**
 * Generate TTS narration from a script using OpenAI TTS.
 * Saves the MP3 to public/audio/ and returns the URL path.
 */
export async function generateNarration(
  script: string,
  itemId: string
): Promise<NarrationResult> {
  if (!openai) {
    console.log("[videobot] Narration: no OpenAI API key — skipping TTS");
    return { success: false, audioUrl: null, duration: 0, error: "OpenAI not configured" };
  }

  try {
    const audioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const filename = `narration-${itemId}-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, filename);

    console.log(`[videobot] Narration: generating TTS for ${script.length} chars`);

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: script,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Estimate duration: ~150 words per minute for TTS
    const wordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    const audioUrl = `/audio/${filename}`;
    console.log(`[videobot] Narration: saved ${buffer.length} bytes to ${audioUrl} (~${estimatedDuration}s)`);

    return { success: true, audioUrl, duration: estimatedDuration };
  } catch (e: any) {
    console.error("[videobot] Narration error:", e.message);
    return { success: false, audioUrl: null, duration: 0, error: e.message };
  }
}
