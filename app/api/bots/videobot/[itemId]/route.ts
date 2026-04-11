import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { canUseBotOnTier, canUseVideoBotTier, BOT_CREDIT_COSTS, TIER_NAMES } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
import { runVideoPipeline } from "@/lib/video/pipeline";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";
// CMD-VIDEOBOT-CORE-A: skill pack + spec context + web pre-pass
import { loadSkillPack } from "@/lib/bots/skill-loader";
import { buildItemSpecContext } from "@/lib/bots/item-spec-context";
import { summarizeSpecContext } from "@/lib/bots/spec-guards";
import { runWebSearchPrepass } from "@/lib/bots/web-search-prepass";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * GET /api/bots/videobot/[itemId]
 * Retrieve existing VideoBot result for an item
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "VIDEOBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json({ hasResult: false, result: null });
    }

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
    });
  } catch (e) {
    console.error("[videobot GET]", e);
    return NextResponse.json({ error: "Failed to fetch VideoBot result" }, { status: 500 });
  }
}

/**
 * POST /api/bots/videobot/[itemId]
 * Run VideoBot video ad pipeline on an item
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    // Parse request body
    let body: { tier?: string; platform?: string; voiceMode?: string } = {};
    try {
      body = await _req.json();
    } catch {
      // default values
    }
    const tier = (body.tier || "standard") as "standard" | "pro" | "mega";
    const platform = body.platform || "all";

    // ── Tier + Credit Gate ──
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "videoBot")) {
        return NextResponse.json(
          { error: "upgrade_required", message: "Upgrade your plan to access VideoBot.", upgradeUrl: "/pricing?upgrade=true" },
          { status: 403 }
        );
      }

      // Sub-tier level gate: Standard=DIY+, Pro=Power+, MegaBot=Estate only
      const levelMap: Record<string, "standard" | "pro" | "megabot"> = { standard: "standard", pro: "pro", mega: "megabot" };
      const mappedLevel = levelMap[tier] ?? "standard";
      if (!canUseVideoBotTier(user.tier, mappedLevel)) {
        const tierNames: Record<string, string> = { standard: "DIY Seller", pro: "Power Seller", megabot: "Estate Manager" };
        return NextResponse.json(
          { error: "upgrade_required", message: `VideoBot ${tier.charAt(0).toUpperCase() + tier.slice(1)} requires ${tierNames[mappedLevel]} plan.`, requiredTier: tierNames[mappedLevel], currentTier: TIER_NAMES[user.tier] ?? "Free", upgradeUrl: "/subscription" },
          { status: 403 }
        );
      }

      // Tiered credit costs — higher tiers get lower rates
      const TIERED_COSTS: Record<string, Record<number, number>> = {
        standard: { 2: 8, 3: 6, 4: 5 },  // DIY=8, Power=6, Estate=5
        pro:      { 3: 15, 4: 12 },       // Power=15, Estate=12
        mega:     { 4: 25 },              // Estate=25
      };
      const tierCosts = TIERED_COSTS[tier];
      let cost = tierCosts?.[user.tier] ?? BOT_CREDIT_COSTS.videoBotStandard;

      // Re-run discount: 50% off if the user has run VideoBot on this item before
      const isRerun = await hasPriorBotRun(user.id, itemId, "VIDEOBOT_RESULT");
      if (isRerun) {
        cost = Math.ceil(cost * 0.5);
      }

      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json(
          { error: "insufficient_credits", message: "Not enough credits to run VideoBot.", balance: cc.balance, required: cost, buyUrl: "/credits" },
          { status: 402 }
        );
      }
      await deductCredits(user.id, cost, `VideoBot ${tier} run${isRerun ? " (re-run 50% off)" : ""}`, itemId);
    }

    // Fetch item with analysis data
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        aiResult: true,
        valuation: true,
        antiqueCheck: true,
        photos: { orderBy: { order: "asc" }, take: 6 },
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const ai = safeJson(item.aiResult?.rawJson);
    const v = item.valuation;

    if (!ai || !v) {
      return NextResponse.json({ error: "Run AI analysis first" }, { status: 400 });
    }

    // Build enrichment context
    const itemName = ai.item_name || item.title || "Unknown item";
    const category = ai.category || "General";
    const material = ai.material || undefined;
    const era = ai.era || undefined;
    const conditionScore = ai.condition_score || 7;
    const conditionLabel = conditionScore >= 8 ? "Excellent" : conditionScore >= 5 ? "Good" : "Fair";
    const photoPaths = item.photos.map((p) => p.filePath);

    // CMD-VIDEOBOT-CORE-A: skill pack + spec context + web pre-pass
    const skillPack = loadSkillPack("videobot");
    const specCtx = await buildItemSpecContext(itemId, { item, user });
    const specSummary = summarizeSpecContext(specCtx);
    const skillPackPrefix = skillPack.systemPromptBlock
      ? skillPack.systemPromptBlock + "\n\n"
      : "";

    // CMD-VIDEOBOT-CORE-A: web search pre-pass for trending content
    const { webEnrichment: trendWebEnrichment } = await runWebSearchPrepass(
      openai,
      `${itemName} ${category}`,
      category,
      item.saleZip || "04901",
    );

    // ── Gather enrichment + market intelligence (non-blocking failures) ──
    // Note: Video-specific scrapers (TikTok Ads, FB Ads Library, Social Trends, TikTok Songs, AI Video Ads)
    // are called internally by the video pipeline in lib/video/pipeline.ts
    const [enrichment, marketIntel] = await Promise.all([
      getItemEnrichmentContext(itemId, "videobot").catch(() => null),
      getMarketIntelligence(
        itemName,
        category,
        item.saleZip || "04901",
        undefined, // phase1Only
        undefined, // isMegaBot
        "videobot", // CMD-SCRAPER-WIRING-C2
      ).catch(() => null),
    ]);

    // Build photo context from AI analysis
    const photoContext = ai.photo_quality_score
      ? `${item.photos.length} photos, quality ${ai.photo_quality_score}/10`
      : `${item.photos.length} photos`;

    // ── Demo mode fast path ──
    if (isDemoMode()) {
      const demoResult = {
        _isDemo: true,
        success: true,
        videoUrl: null,
        script: {
          hook: `Wait... is this ${itemName} actually worth thousands?`,
          body: `This ${era || "vintage"} ${category.toLowerCase()} in ${conditionLabel.toLowerCase()} condition is a hidden gem. ${material ? `Made from ${material}, ` : ""}it's the kind of find collectors dream about.`,
          cta: "Follow for more rare finds! Link in bio.",
          fullScript: `Wait... is this ${itemName} actually worth thousands? This ${era || "vintage"} ${category.toLowerCase()} in ${conditionLabel.toLowerCase()} condition is a hidden gem. ${material ? `Made from ${material}, ` : ""}it's the kind of find collectors dream about. Follow for more rare finds! Link in bio.`,
          hashtags: ["#vintage", "#resale", "#thrifting", "#antique", `#${category.toLowerCase().replace(/\s+/g, "")}`],
          duration: 30,
          platform,
          voiceDirection: "Enthusiastic, slightly breathless, building excitement",
        },
        narrationUrl: null,
        intelligence: { tiktokAds: { _demo: true }, fbAds: { _demo: true }, socialTrends: { _demo: true }, trendingAudio: { _demo: true } },
        steps: [
          { name: "Intelligence Gathering", status: "done", durationMs: 120 },
          { name: "Script Generation", status: "done", durationMs: 450 },
          { name: "Video Assembly", status: "skipped", durationMs: 0 },
          { name: "Narration (ElevenLabs TTS)", status: "skipped", durationMs: 0 },
          { name: "Final Assembly", status: "done", durationMs: 80 },
        ],
        totalDurationMs: 650,
        tier,
        platform,
        voiceMode: body.voiceMode || "warm",
        voiceName: "demo",
      };

      // Store in EventLog
      await prisma.eventLog.create({
        data: { itemId, eventType: "VIDEOBOT_RESULT", payload: JSON.stringify(demoResult) },
      });
      await prisma.eventLog.create({
        data: { itemId, eventType: "VIDEOBOT_RUN", payload: JSON.stringify({ userId: user.id, tier, platform, timestamp: new Date().toISOString() }) },
      });

      return NextResponse.json({ success: true, result: demoResult, isDemo: true });
    }

    // ── Run pipeline ──
    const pipelineResult = await runVideoPipeline({
      itemId,
      itemName,
      category,
      description: item.description || undefined,
      priceLow: v.low ? Math.round(v.low) : undefined,
      priceHigh: v.high ? Math.round(v.high) : undefined,
      condition: conditionLabel,
      era,
      material,
      photos: photoPaths,
      platform,
      tier,
      // CMD-VIDEOBOT-CORE-A: prepend skill pack + spec context + trend web enrichment
      // to the enrichment context so the script generator sees all context.
      enrichmentContext: [
        skillPackPrefix,
        specCtx.promptBlock ? specCtx.promptBlock + "\n\n" : "",
        trendWebEnrichment || "",
        enrichment?.hasEnrichment ? enrichment.contextBlock : "",
      ].filter(Boolean).join("") || undefined,
      marketContext: marketIntel?.comps?.length ? `${marketIntel.comps.length} real comparables, median $${marketIntel.median}` : undefined,
      photoContext,
      brand: ai.maker || ai.brand || undefined,
      voiceMode: body.voiceMode || undefined,
      sellerZip: item.saleZip || undefined,
    });

    // Store in EventLog (includes voice info)
    const resultPayload = {
      ...pipelineResult,
      tier,
      platform,
      itemName,
      category,
      voiceMode: pipelineResult.voiceMode,
      voiceName: pipelineResult.voiceName,
      hasEnrichment: !!enrichment?.hasEnrichment,
      hasMarketIntel: !!(marketIntel?.comps?.length),
      marketCompCount: marketIntel?.comps?.length || 0,
    };

    await prisma.eventLog.create({
      data: { itemId, eventType: "VIDEOBOT_RESULT", payload: JSON.stringify(resultPayload) },
    });
    // CMD-VIDEOBOT-CORE-A: extended VIDEOBOT_RUN telemetry
    try {
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "VIDEOBOT_RUN",
          payload: JSON.stringify({
            userId: user.id,
            timestamp: new Date().toISOString(),
            tier,
            platform,
            voiceMode: pipelineResult.voiceMode,
            voiceName: pipelineResult.voiceName,
            skillPackVersion: skillPack.version,
            skillPackCount: skillPack.skillNames.length,
            skillPackChars: skillPack.totalChars,
            specSummary,
            hasEnrichment: !!enrichment?.hasEnrichment,
            hasMarketIntel: !!(marketIntel?.comps?.length),
            hasTrendWebEnrichment: !!trendWebEnrichment,
            pipelineSuccess: pipelineResult.success,
            videoGenerated: !!pipelineResult.videoUrl,
            narrationGenerated: !!pipelineResult.narrationUrl,
            scriptGenerated: !!pipelineResult.script,
            totalDurationMs: pipelineResult.totalDurationMs,
            publishReady: !!(pipelineResult.videoUrl && pipelineResult.script),
            isDemo: false,
          }),
        },
      });
    } catch (logErr) {
      console.warn("[videobot] VIDEOBOT_RUN log write failed (non-critical):", logErr);
    }

    return NextResponse.json({
      success: pipelineResult.success,
      result: resultPayload,
      isDemo: false,
    });
  } catch (e) {
    console.error("[videobot POST]", e);
    return NextResponse.json({ error: "VideoBot analysis failed" }, { status: 500 });
  }
}
