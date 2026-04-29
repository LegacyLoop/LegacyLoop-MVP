/**
 * ElevenLabs TTS Narration Engine
 *
 * Primary: ElevenLabs text-to-speech with word-level timestamps.
 * Fallback: OpenAI TTS (tts-1 Nova) with estimated timecodes.
 *
 * Returns sentence-level timecodes mapped to photo indices for
 * sync between narration audio and slideshow photos.
 */

import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import { resolveVoiceMode, VOICE_CONFIG, type VoiceMode } from "./voiceConfig";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.LITELLM_BASE_URL
        ? `${process.env.LITELLM_BASE_URL}/openai/v1`
        : undefined,
    })
  : null;

// ─────────────────────────────────────────────
// PUBLIC INTERFACES
// ─────────────────────────────────────────────

export interface SentenceTimecode {
  sentence: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  photoIndex: number;
}

export interface NarrationResult {
  success: boolean;
  audioPath: string | null;
  audioUrl: string | null;
  durationSeconds: number;
  sentenceTimecodes: SentenceTimecode[];
  voiceMode: string;
  voiceName: string;
  cached: boolean;
  error?: string;
}

// ─────────────────────────────────────────────
// ELEVENLABS RESPONSE TYPES
// ─────────────────────────────────────────────

interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface ElevenLabsTimestampResponse {
  audio_base64: string;
  alignment: ElevenLabsAlignment;
}

// ─────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────

/**
 * Generate narration audio with sentence-level timecodes.
 *
 * 1. Try ElevenLabs `/v1/text-to-speech/{voiceId}/with-timestamps`
 * 2. Parse character-level alignment into sentence boundaries
 * 3. Map sentences evenly across photos
 * 4. Fallback to OpenAI TTS with estimated timecodes
 */
export async function generateNarrationWithFallback(
  script: string,
  voiceMode: string | undefined,
  itemId: string,
  outputDir: string,
  photoCount?: number
): Promise<NarrationResult> {
  const resolvedMode = resolveVoiceMode(voiceMode);
  const config = VOICE_CONFIG[resolvedMode];

  // Ensure output directory exists
  const audioDir = outputDir || path.join(process.cwd(), "public", "audio");
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // ── Try ElevenLabs first ──
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  if (elevenLabsKey) {
    try {
      console.log(`[narration] ElevenLabs: generating with voice "${config.name}" (${resolvedMode})`);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}/with-timestamps`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: script,
            model_id: config.model,
            voice_settings: {
              stability: config.stability,
              similarity_boost: config.similarityBoost,
              style: config.style,
              use_speaker_boost: config.speakerBoost,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`ElevenLabs API ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as ElevenLabsTimestampResponse;

      if (!data.audio_base64 || !data.alignment) {
        throw new Error("ElevenLabs response missing audio_base64 or alignment");
      }

      // Save MP3
      const filename = `narration-${itemId}-${Date.now()}.mp3`;
      const filePath = path.join(audioDir, filename);
      const audioBuffer = Buffer.from(data.audio_base64, "base64");
      fs.writeFileSync(filePath, audioBuffer);

      // Parse alignment into sentence timecodes
      const sentenceTimecodes = parseSentenceTimecodes(
        script,
        data.alignment,
        photoCount || 1
      );

      // Calculate total duration from alignment
      const charEndTimes = data.alignment.character_end_times_seconds;
      const totalDuration = charEndTimes.length > 0
        ? charEndTimes[charEndTimes.length - 1]
        : estimateDuration(script);

      const audioUrl = `/audio/${filename}`;
      console.log(`[narration] ElevenLabs: saved ${audioBuffer.length} bytes to ${audioUrl} (~${totalDuration.toFixed(1)}s, ${sentenceTimecodes.length} sentences)`);

      return {
        success: true,
        audioPath: filePath,
        audioUrl,
        durationSeconds: totalDuration,
        sentenceTimecodes,
        voiceMode: resolvedMode,
        voiceName: config.name,
        cached: false,
      };
    } catch (e: any) {
      console.error("[narration] ElevenLabs failed, falling back to OpenAI TTS:", e.message);
    }
  }

  // ── Fallback: OpenAI TTS ──
  return generateOpenAIFallback(script, resolvedMode, config.name, itemId, audioDir, photoCount);
}

// ─────────────────────────────────────────────
// SENTENCE TIMECODE PARSING
// ─────────────────────────────────────────────

/**
 * Parse ElevenLabs character-level alignment into sentence-level timecodes.
 * Sentence boundaries are periods, exclamation marks, and question marks.
 */
function parseSentenceTimecodes(
  script: string,
  alignment: ElevenLabsAlignment,
  photoCount: number
): SentenceTimecode[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;

  // Find sentence boundary indices in the original script
  const sentenceBoundaries: number[] = [];
  for (let i = 0; i < script.length; i++) {
    if (script[i] === "." || script[i] === "!" || script[i] === "?") {
      // Skip ellipses and decimal numbers
      if (script[i] === "." && i + 1 < script.length && script[i + 1] === ".") continue;
      if (script[i] === "." && i > 0 && /\d/.test(script[i - 1]) && i + 1 < script.length && /\d/.test(script[i + 1])) continue;
      sentenceBoundaries.push(i);
    }
  }

  // If no sentence boundaries found, treat the whole script as one sentence
  if (sentenceBoundaries.length === 0) {
    sentenceBoundaries.push(script.length - 1);
  }

  // Build sentences with time ranges from alignment data
  const sentences: SentenceTimecode[] = [];
  let sentenceStart = 0;

  for (const boundaryIdx of sentenceBoundaries) {
    const sentenceText = script.slice(sentenceStart, boundaryIdx + 1).trim();
    if (!sentenceText) {
      sentenceStart = boundaryIdx + 1;
      continue;
    }

    // Find the corresponding alignment timestamps
    // Map script character position to alignment array position
    const alignStart = Math.min(sentenceStart, characters.length - 1);
    const alignEnd = Math.min(boundaryIdx, characters.length - 1);

    const startTime = alignStart >= 0 && alignStart < character_start_times_seconds.length
      ? character_start_times_seconds[alignStart]
      : sentences.length > 0
        ? sentences[sentences.length - 1].endSeconds
        : 0;

    const endTime = alignEnd >= 0 && alignEnd < character_end_times_seconds.length
      ? character_end_times_seconds[alignEnd]
      : startTime + estimateDuration(sentenceText);

    sentences.push({
      sentence: sentenceText,
      startSeconds: startTime,
      endSeconds: endTime,
      durationSeconds: Math.max(0.1, endTime - startTime),
      photoIndex: 0, // assigned below
    });

    sentenceStart = boundaryIdx + 1;
  }

  // Handle any trailing text after the last sentence boundary
  const trailing = script.slice(sentenceStart).trim();
  if (trailing) {
    const lastEnd = sentences.length > 0 ? sentences[sentences.length - 1].endSeconds : 0;
    const trailingDuration = estimateDuration(trailing);
    sentences.push({
      sentence: trailing,
      startSeconds: lastEnd,
      endSeconds: lastEnd + trailingDuration,
      durationSeconds: trailingDuration,
      photoIndex: 0,
    });
  }

  // Map sentences to photo indices (distribute evenly)
  if (sentences.length > 0 && photoCount > 0) {
    const sentencesPerPhoto = Math.max(1, Math.ceil(sentences.length / photoCount));
    for (let i = 0; i < sentences.length; i++) {
      sentences[i].photoIndex = Math.min(
        Math.floor(i / sentencesPerPhoto),
        photoCount - 1
      );
    }
  }

  return sentences;
}

// ─────────────────────────────────────────────
// OPENAI TTS FALLBACK
// ─────────────────────────────────────────────

async function generateOpenAIFallback(
  script: string,
  voiceMode: string,
  voiceName: string,
  itemId: string,
  audioDir: string,
  photoCount?: number
): Promise<NarrationResult> {
  if (!openai) {
    console.log("[narration] No OpenAI API key — returning empty narration result");
    return {
      success: false,
      audioPath: null,
      audioUrl: null,
      durationSeconds: 0,
      sentenceTimecodes: [],
      voiceMode,
      voiceName: "none",
      cached: false,
      error: "Neither ElevenLabs nor OpenAI API keys are configured",
    };
  }

  try {
    console.log(`[narration] OpenAI TTS fallback: generating with Nova voice`);

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: script,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `narration-${itemId}-${Date.now()}.mp3`;
    const filePath = path.join(audioDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Estimate timecodes at ~2.5 words/second
    const totalDuration = estimateDuration(script);
    const sentenceTimecodes = buildEstimatedTimecodes(script, totalDuration, photoCount || 1);

    const audioUrl = `/audio/${filename}`;
    console.log(`[narration] OpenAI TTS: saved ${buffer.length} bytes to ${audioUrl} (~${totalDuration.toFixed(1)}s)`);

    return {
      success: true,
      audioPath: filePath,
      audioUrl,
      durationSeconds: totalDuration,
      sentenceTimecodes,
      voiceMode,
      voiceName: "Nova (OpenAI fallback)",
      cached: false,
    };
  } catch (e: any) {
    console.error("[narration] OpenAI TTS fallback error:", e.message);
    return {
      success: false,
      audioPath: null,
      audioUrl: null,
      durationSeconds: 0,
      sentenceTimecodes: [],
      voiceMode,
      voiceName: "none",
      cached: false,
      error: `OpenAI TTS fallback failed: ${e.message}`,
    };
  }
}

// ─────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Estimate audio duration from text at ~2.5 words/second.
 */
function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return wordCount / 2.5;
}

/**
 * Build estimated sentence timecodes when real alignment is not available.
 * Splits script into sentences and distributes across time proportionally.
 */
function buildEstimatedTimecodes(
  script: string,
  totalDuration: number,
  photoCount: number
): SentenceTimecode[] {
  // Split into sentences
  const rawSentences = script
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawSentences.length === 0) return [];

  const totalWords = script.split(/\s+/).filter(Boolean).length;
  let elapsed = 0;

  const timecodes: SentenceTimecode[] = rawSentences.map((sentence) => {
    const words = sentence.split(/\s+/).filter(Boolean).length;
    const proportion = totalWords > 0 ? words / totalWords : 1 / rawSentences.length;
    const duration = proportion * totalDuration;

    const tc: SentenceTimecode = {
      sentence,
      startSeconds: elapsed,
      endSeconds: elapsed + duration,
      durationSeconds: duration,
      photoIndex: 0, // assigned below
    };

    elapsed += duration;
    return tc;
  });

  // Map sentences to photo indices (distribute evenly)
  if (photoCount > 0) {
    const sentencesPerPhoto = Math.max(1, Math.ceil(timecodes.length / photoCount));
    for (let i = 0; i < timecodes.length; i++) {
      timecodes[i].photoIndex = Math.min(
        Math.floor(i / sentencesPerPhoto),
        photoCount - 1
      );
    }
  }

  return timecodes;
}
