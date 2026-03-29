import { prisma } from "@/lib/db";
import { generateVideoScript, type VideoScript, type ScriptInput } from "./script-generator";
import { generateNarration } from "./narration";
import { assembleVideo } from "./assembly";
import { scrapeTikTokAds } from "@/lib/market-intelligence/adapters/tiktok-ads";
import { scrapeFbAdsLibrary } from "@/lib/market-intelligence/adapters/fb-ads-library";
import { scrapeSocialTrends } from "@/lib/market-intelligence/adapters/social-trends";
import { scrapeTikTokSongs } from "@/lib/market-intelligence/adapters/tiktok-songs";
import { generateAiVideoAd } from "@/lib/market-intelligence/adapters/ai-video-ads";
import { isDemoMode } from "@/lib/bot-mode";

export interface VideoPipelineInput {
  itemId: string;
  itemName: string;
  category: string;
  description?: string;
  priceLow?: number;
  priceHigh?: number;
  condition?: string;
  era?: string;
  material?: string;
  photos: string[];
  platform: string;
  tier: "standard" | "pro" | "mega";
}

export interface VideoPipelineResult {
  success: boolean;
  videoUrl: string | null;
  script: VideoScript | null;
  narrationUrl: string | null;
  intelligence: {
    tiktokAds: any;
    fbAds: any;
    socialTrends: any;
    trendingAudio: any;
  } | null;
  steps: PipelineStep[];
  totalDurationMs: number;
  error?: string;
  _isDemo?: boolean;
}

export interface PipelineStep {
  name: string;
  status: "pending" | "running" | "done" | "skipped" | "error";
  durationMs: number;
  error?: string;
}

function logStep(itemId: string, step: string, payload: Record<string, any>) {
  prisma.eventLog.create({
    data: {
      itemId,
      eventType: "VIDEOBOT_STEP",
      payload: JSON.stringify({ step, ...payload, timestamp: new Date().toISOString() }),
    },
  }).catch(() => null);
}

/**
 * Run the full video ad pipeline.
 *
 * Tiers:
 *   standard — FFmpeg assembly only (local processing)
 *   pro      — Apify AI video generation
 *   mega     — 4-AI script consensus + full Apify pipeline
 *
 * Demo mode returns mock result without calling any external APIs.
 * 120s timeout on the entire pipeline.
 */
export async function runVideoPipeline(input: VideoPipelineInput): Promise<VideoPipelineResult> {
  const startTime = Date.now();
  const steps: PipelineStep[] = [];

  // Demo mode — return mock result
  if (isDemoMode()) {
    console.log(`[videobot] Pipeline: demo mode for item ${input.itemId}`);
    return {
      success: true,
      videoUrl: null,
      script: {
        hook: `Wait... is this ${input.itemName} actually worth thousands?`,
        body: `This ${input.era || "vintage"} ${input.category?.toLowerCase() || "item"} is a hidden gem. ${input.material ? `Crafted from ${input.material}, ` : ""}it's the kind of find collectors dream about.`,
        cta: "Follow for more rare finds! Link in bio.",
        fullScript: `Wait... is this ${input.itemName} actually worth thousands? This ${input.era || "vintage"} ${input.category?.toLowerCase() || "item"} is a hidden gem. ${input.material ? `Crafted from ${input.material}, ` : ""}it's the kind of find collectors dream about. Follow for more rare finds! Link in bio.`,
        hashtags: ["#vintage", "#resale", "#thrifting", "#antique", `#${input.category?.toLowerCase().replace(/\s+/g, "") || "find"}`],
        duration: 30,
        platform: input.platform,
        voiceDirection: "Enthusiastic, slightly breathless, building excitement",
      },
      narrationUrl: null,
      intelligence: {
        tiktokAds: { _demo: true, count: 5 },
        fbAds: { _demo: true, count: 3 },
        socialTrends: { _demo: true, trending: true },
        trendingAudio: { _demo: true, tracks: 2 },
      },
      steps: [
        { name: "Intelligence Gathering", status: "done", durationMs: 120 },
        { name: "Script Generation", status: "done", durationMs: 450 },
        { name: "Video Assembly", status: "skipped", durationMs: 0 },
        { name: "Narration (TTS)", status: "skipped", durationMs: 0 },
        { name: "Final Assembly", status: "done", durationMs: 80 },
      ],
      totalDurationMs: Date.now() - startTime,
      _isDemo: true,
    };
  }

  // ── Timeout wrapper ──
  const timeoutMs = 120_000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Pipeline timeout (120s)")), timeoutMs)
  );

  try {
    const result = await Promise.race([
      runPipelineSteps(input, steps, startTime),
      timeoutPromise,
    ]);
    return result;
  } catch (e: any) {
    console.error("[videobot] Pipeline error:", e.message);
    return {
      success: false,
      videoUrl: null,
      script: null,
      narrationUrl: null,
      intelligence: null,
      steps,
      totalDurationMs: Date.now() - startTime,
      error: e.message,
    };
  }
}

async function runPipelineSteps(
  input: VideoPipelineInput,
  steps: PipelineStep[],
  startTime: number
): Promise<VideoPipelineResult> {
  let intelligence: VideoPipelineResult["intelligence"] = null;
  let script: VideoScript | null = null;
  let narrationUrl: string | null = null;
  let videoUrl: string | null = null;

  // ── Step 1: Intelligence Gathering (Apify scrapers) ──
  const step1Start = Date.now();
  const step1: PipelineStep = { name: "Intelligence Gathering", status: "running", durationMs: 0 };
  steps.push(step1);

  try {
    if (input.tier === "pro" || input.tier === "mega") {
      console.log(`[videobot] Pipeline step 1: intelligence gathering (${input.tier})`);
      logStep(input.itemId, "intelligence", { tier: input.tier, status: "started" });

      const [tiktokAds, fbAds, socialTrends, trendingAudio] = await Promise.all([
        scrapeTikTokAds(input.itemName).catch(() => ({ success: false, data: null, source: "tiktok-ads" })),
        scrapeFbAdsLibrary(input.itemName).catch(() => ({ success: false, data: null, source: "fb-ads-library" })),
        scrapeSocialTrends(input.category).catch(() => ({ success: false, data: null, source: "social-trends" })),
        scrapeTikTokSongs(input.category).catch(() => ({ success: false, data: null, source: "tiktok-songs" })),
      ]);

      intelligence = { tiktokAds: tiktokAds.data, fbAds: fbAds.data, socialTrends: socialTrends.data, trendingAudio: trendingAudio.data };
      step1.status = "done";
    } else {
      step1.status = "skipped";
    }
  } catch (e: any) {
    step1.status = "error";
    step1.error = e.message;
    logStep(input.itemId, "intelligence", { error: e.message });
  }
  step1.durationMs = Date.now() - step1Start;

  // ── Step 2: Script Generation ──
  const step2Start = Date.now();
  const step2: PipelineStep = { name: "Script Generation", status: "running", durationMs: 0 };
  steps.push(step2);

  try {
    console.log(`[videobot] Pipeline step 2: script generation`);
    logStep(input.itemId, "script", { platform: input.platform, tier: input.tier });

    const scriptInput: ScriptInput = {
      itemName: input.itemName,
      category: input.category,
      description: input.description,
      priceLow: input.priceLow,
      priceHigh: input.priceHigh,
      condition: input.condition,
      era: input.era,
      material: input.material,
      platform: input.platform,
      style: input.tier === "mega" ? "dramatic" : "professional",
    };

    const scriptResult = await generateVideoScript(scriptInput);
    if (scriptResult.success && scriptResult.script) {
      script = scriptResult.script;
      step2.status = "done";
    } else {
      step2.status = "error";
      step2.error = scriptResult.error || "Script generation failed";
    }
  } catch (e: any) {
    step2.status = "error";
    step2.error = e.message;
    logStep(input.itemId, "script", { error: e.message });
  }
  step2.durationMs = Date.now() - step2Start;

  // ── Step 3: Video Assembly ──
  const step3Start = Date.now();
  const step3: PipelineStep = { name: "Video Assembly", status: "running", durationMs: 0 };
  steps.push(step3);

  try {
    if (input.tier === "pro" || input.tier === "mega") {
      // Pro/Mega: try Apify AI video generation first
      console.log(`[videobot] Pipeline step 3: AI video assembly (${input.tier})`);
      logStep(input.itemId, "assembly", { mode: "ai", tier: input.tier });

      const aiVideo = await generateAiVideoAd(input.photos, script?.fullScript || input.itemName);
      if (aiVideo.success && aiVideo.data?.videoUrl) {
        videoUrl = aiVideo.data.videoUrl;
        step3.status = "done";
      } else {
        // Fallback to FFmpeg
        console.log("[videobot] AI video failed — falling back to FFmpeg assembly");
        const assembly = await assembleVideo({
          photos: input.photos,
          overlayText: script?.hook || input.itemName,
          outputDir: "",
          itemId: input.itemId,
          duration: script?.duration || 30,
        });
        videoUrl = assembly.videoUrl;
        step3.status = assembly.success ? "done" : "error";
        if (!assembly.success) step3.error = assembly.error;
      }
    } else {
      // Standard: FFmpeg only
      console.log("[videobot] Pipeline step 3: FFmpeg assembly (standard)");
      logStep(input.itemId, "assembly", { mode: "ffmpeg" });

      const assembly = await assembleVideo({
        photos: input.photos,
        overlayText: script?.hook || input.itemName,
        outputDir: "",
        itemId: input.itemId,
        duration: script?.duration || 30,
      });
      videoUrl = assembly.videoUrl;
      step3.status = assembly.success ? "done" : "error";
      if (!assembly.success) step3.error = assembly.error;
    }
  } catch (e: any) {
    step3.status = "error";
    step3.error = e.message;
    logStep(input.itemId, "assembly", { error: e.message });
  }
  step3.durationMs = Date.now() - step3Start;

  // ── Step 4: Narration (TTS) ──
  const step4Start = Date.now();
  const step4: PipelineStep = { name: "Narration (TTS)", status: "running", durationMs: 0 };
  steps.push(step4);

  try {
    if (script?.fullScript) {
      console.log("[videobot] Pipeline step 4: TTS narration");
      logStep(input.itemId, "narration", { scriptLength: script.fullScript.length });

      const narration = await generateNarration(script.fullScript, input.itemId);
      if (narration.success) {
        narrationUrl = narration.audioUrl;
        step4.status = "done";
      } else {
        step4.status = "error";
        step4.error = narration.error;
      }
    } else {
      step4.status = "skipped";
    }
  } catch (e: any) {
    step4.status = "error";
    step4.error = e.message;
    logStep(input.itemId, "narration", { error: e.message });
  }
  step4.durationMs = Date.now() - step4Start;

  // ── Step 5: Final Assembly (combine video + narration if both exist) ──
  const step5Start = Date.now();
  const step5: PipelineStep = { name: "Final Assembly", status: "running", durationMs: 0 };
  steps.push(step5);

  try {
    if (videoUrl && narrationUrl) {
      // Re-assemble with narration audio
      console.log("[videobot] Pipeline step 5: final assembly with narration");
      const narrationPath = narrationUrl.startsWith("/")
        ? require("path").join(process.cwd(), "public", narrationUrl)
        : narrationUrl;

      const finalAssembly = await assembleVideo({
        photos: input.photos,
        narrationPath,
        overlayText: script?.hook || input.itemName,
        outputDir: "",
        itemId: input.itemId,
        duration: script?.duration || 30,
      });
      if (finalAssembly.success && finalAssembly.videoUrl) {
        videoUrl = finalAssembly.videoUrl;
      }
      step5.status = "done";
    } else {
      step5.status = "skipped";
    }
  } catch (e: any) {
    step5.status = "error";
    step5.error = e.message;
    logStep(input.itemId, "final-assembly", { error: e.message });
  }
  step5.durationMs = Date.now() - step5Start;

  const totalDurationMs = Date.now() - startTime;
  console.log(`[videobot] Pipeline complete: ${totalDurationMs}ms, video=${!!videoUrl}, script=${!!script}, narration=${!!narrationUrl}`);

  return {
    success: !!(script || videoUrl),
    videoUrl,
    script,
    narrationUrl,
    intelligence,
    steps,
    totalDurationMs,
  };
}
