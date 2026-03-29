import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface VideoScript {
  hook: string;
  body: string;
  cta: string;
  fullScript: string;
  hashtags: string[];
  duration: number;
  platform: string;
  voiceDirection: string;
}

export interface ScriptInput {
  itemName: string;
  category: string;
  description?: string;
  priceLow?: number;
  priceHigh?: number;
  condition?: string;
  era?: string;
  material?: string;
  platform: string;
  style?: "professional" | "ugc" | "dramatic" | "casual";
}

export interface ScriptResult {
  success: boolean;
  script: VideoScript | null;
  error?: string;
}

const PLATFORM_SPECS: Record<string, { maxSeconds: number; tone: string }> = {
  tiktok: { maxSeconds: 30, tone: "fast-paced, trendy, hook-first" },
  reels: { maxSeconds: 30, tone: "visually-driven, lifestyle" },
  shorts: { maxSeconds: 60, tone: "informative, search-optimized" },
  facebook: { maxSeconds: 45, tone: "warm, storytelling, community" },
  all: { maxSeconds: 30, tone: "versatile, works across platforms" },
};

/**
 * Generate a video ad script using OpenAI gpt-4o-mini.
 * In demo mode (no API key), returns a mock script.
 */
export async function generateVideoScript(input: ScriptInput): Promise<ScriptResult> {
  const spec = PLATFORM_SPECS[input.platform] ?? PLATFORM_SPECS.all;

  // Demo mode — return mock script
  if (!openai) {
    console.log("[videobot] Script: demo mode — returning mock script");
    return {
      success: true,
      script: {
        hook: `Wait... is this ${input.itemName} actually worth thousands?`,
        body: `This ${input.era || "vintage"} ${input.category?.toLowerCase() || "item"} in ${input.condition || "great"} condition is a hidden gem. ${input.material ? `Made from ${input.material}, ` : ""}it's the kind of find collectors dream about.`,
        cta: `Follow for more rare finds! Link in bio.`,
        fullScript: `Wait... is this ${input.itemName} actually worth thousands? This ${input.era || "vintage"} ${input.category?.toLowerCase() || "item"} in ${input.condition || "great"} condition is a hidden gem. ${input.material ? `Made from ${input.material}, ` : ""}it's the kind of find collectors dream about. Follow for more rare finds! Link in bio.`,
        hashtags: ["#vintage", "#resale", "#thrifting", "#antique", `#${input.category?.toLowerCase().replace(/\s+/g, "") || "find"}`],
        duration: spec.maxSeconds,
        platform: input.platform,
        voiceDirection: "Enthusiastic, slightly breathless, building excitement",
      },
    };
  }

  try {
    console.log(`[videobot] Script: generating ${input.platform} script for "${input.itemName}"`);

    const priceRange = input.priceLow && input.priceHigh
      ? `$${input.priceLow} — $${input.priceHigh}`
      : "unknown";

    const prompt = `Generate a ${spec.maxSeconds}-second video ad script for selling this item on ${input.platform}.

ITEM: ${input.itemName}
CATEGORY: ${input.category || "General"}
${input.description ? `DESCRIPTION: ${input.description}` : ""}
PRICE RANGE: ${priceRange}
CONDITION: ${input.condition || "Good"}
${input.era ? `ERA: ${input.era}` : ""}
${input.material ? `MATERIAL: ${input.material}` : ""}
STYLE: ${input.style || "professional"}
TONE: ${spec.tone}

Return ONLY valid JSON with this exact structure:
{
  "hook": "Opening 3-5 seconds — grab attention immediately",
  "body": "Main content 10-20 seconds — showcase the item, tell its story",
  "cta": "Call to action 3-5 seconds — drive the viewer to act",
  "fullScript": "The complete script as one flowing paragraph",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "duration": ${spec.maxSeconds},
  "platform": "${input.platform}",
  "voiceDirection": "How the narrator should deliver the script (tone, pace, emotion)"
}

RULES:
- Hook MUST create curiosity or surprise in the first 3 seconds
- Body should highlight what makes this item special/valuable
- CTA should feel natural, not salesy
- Hashtags should be relevant and trending
- Write for spoken delivery — short sentences, natural rhythm
- Total word count ~${Math.round(spec.maxSeconds * 2.5)} words (2.5 words per second)`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "You are an expert social media video ad copywriter specializing in resale, vintage, and antique items. You write scripts that stop the scroll and drive sales." },
        { role: "user", content: prompt },
      ],
      max_output_tokens: 1024,
    });

    const text = typeof response.output === "string"
      ? response.output
      : response.output_text || JSON.stringify(response.output);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in script response");
    }

    const script = JSON.parse(jsonMatch[0]) as VideoScript;
    console.log(`[videobot] Script: generated ${script.fullScript?.length || 0} char script for ${input.platform}`);

    return { success: true, script };
  } catch (e: any) {
    console.error("[videobot] Script generation error:", e.message);
    return { success: false, script: null, error: e.message };
  }
}
