/**
 * ElevenLabs Voice Configuration
 *
 * Auto-selects voice mode based on item category, price, and platform.
 * Voice IDs are pulled from environment variables.
 */

export type VoiceMode = "warm" | "energetic" | "professional" | "casual";

export interface VoiceSettings {
  voiceId: string;
  name: string;
  model: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost: boolean;
  speed: number;
}

export const VOICE_CONFIG: Record<VoiceMode, VoiceSettings> = {
  warm: {
    voiceId: process.env.ELEVENLABS_VOICE_WARM || "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah (Warm)",
    model: "eleven_multilingual_v2",
    stability: 0.55,
    similarityBoost: 0.78,
    style: 0.35,
    speakerBoost: true,
    speed: 1.0,
  },
  energetic: {
    voiceId: process.env.ELEVENLABS_VOICE_ENERGETIC || "TX3LPaxmHKxFdv7VOQHJ",
    name: "Liam (Energetic)",
    model: "eleven_multilingual_v2",
    stability: 0.40,
    similarityBoost: 0.82,
    style: 0.65,
    speakerBoost: true,
    speed: 1.1,
  },
  professional: {
    voiceId: process.env.ELEVENLABS_VOICE_PROFESSIONAL || "onwK4e9ZLuTAKqWW03F9",
    name: "Daniel (Professional)",
    model: "eleven_multilingual_v2",
    stability: 0.70,
    similarityBoost: 0.75,
    style: 0.20,
    speakerBoost: false,
    speed: 0.95,
  },
  casual: {
    voiceId: process.env.ELEVENLABS_VOICE_CASUAL || "jBpfAFnaylXS5xV4xB6e",
    name: "George (Casual)",
    model: "eleven_multilingual_v2",
    stability: 0.45,
    similarityBoost: 0.80,
    style: 0.45,
    speakerBoost: true,
    speed: 1.05,
  },
};

/**
 * Resolve the best voice mode for an item.
 *
 * Priority:
 *   1. Explicit voiceMode from caller
 *   2. Category / price / platform heuristics
 *   3. Default to "warm"
 */
export function resolveVoiceMode(
  voiceMode?: string,
  category?: string,
  listingPrice?: number,
  platform?: string
): VoiceMode {
  // 1. Explicit override
  if (voiceMode && isVoiceMode(voiceMode)) {
    return voiceMode;
  }

  const cat = (category || "").toLowerCase();
  const plat = (platform || "").toLowerCase();

  // 2. Professional: high-value, antiques, jewelry, watches, vehicles
  if (listingPrice && listingPrice >= 500) return "professional";
  if (cat.match(/antique|jewelry|watch|horol|timepiece|vehicle|automobile|fine\s?art|estate|silver|porcelain/)) {
    return "professional";
  }

  // 3. Energetic: electronics, collectibles, sneakers, TikTok, Reels
  if (cat.match(/electronic|collectible|sneaker|card|comic|vinyl|funko|gaming|video\s?game/)) {
    return "energetic";
  }
  if (plat.match(/tiktok|reels/)) {
    return "energetic";
  }

  // 4. Casual: tools, books, garage sale
  if (cat.match(/tool|book|garage|yard\s?sale|household|kitchen|garden/)) {
    return "casual";
  }

  // 5. Default
  return "warm";
}

function isVoiceMode(s: string): s is VoiceMode {
  return s === "warm" || s === "energetic" || s === "professional" || s === "casual";
}
