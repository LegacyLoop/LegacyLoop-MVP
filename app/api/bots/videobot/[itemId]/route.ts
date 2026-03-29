import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
import { runVideoPipeline } from "@/lib/video/pipeline";

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
    let body: { tier?: string; platform?: string } = {};
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

      const creditCostMap: Record<string, number> = {
        standard: BOT_CREDIT_COSTS.videoBotStandard,
        pro: BOT_CREDIT_COSTS.videoBotPro,
        mega: BOT_CREDIT_COSTS.megaBotVideo,
      };
      const cost = creditCostMap[tier] ?? BOT_CREDIT_COSTS.videoBotStandard;

      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json(
          { error: "insufficient_credits", message: "Not enough credits to run VideoBot.", balance: cc.balance, required: cost, buyUrl: "/credits" },
          { status: 402 }
        );
      }
      await deductCredits(user.id, cost, `VideoBot ${tier} run`, itemId);
    }

    // Fetch item with analysis data
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        aiResult: true,
        valuation: true,
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
          { name: "Narration (TTS)", status: "skipped", durationMs: 0 },
          { name: "Final Assembly", status: "done", durationMs: 80 },
        ],
        totalDurationMs: 650,
        tier,
        platform,
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
    });

    // Store in EventLog
    const resultPayload = {
      ...pipelineResult,
      tier,
      platform,
      itemName,
      category,
    };

    await prisma.eventLog.create({
      data: { itemId, eventType: "VIDEOBOT_RESULT", payload: JSON.stringify(resultPayload) },
    });
    await prisma.eventLog.create({
      data: { itemId, eventType: "VIDEOBOT_RUN", payload: JSON.stringify({ userId: user.id, tier, platform, timestamp: new Date().toISOString() }) },
    });

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
