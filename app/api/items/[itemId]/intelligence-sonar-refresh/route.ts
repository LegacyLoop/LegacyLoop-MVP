/**
 * POST /api/items/[id]/intelligence-sonar-refresh
 *
 * Panel-facing live-web validation overlay for ItemIntelligenceSummary.
 * Aggregates 3-bot foundation (AnalyzeBot AiResult + PriceBot Valuation
 * + ReconBot ReconAlert) and validates against current market state via
 * Sonar-pro (per PERPLEXITY-SLOTTING-AUDIT 1c04560 row §2.3 P1
 * ItemIntelligenceSummary recommendation: "Aggregates intel from
 * multiple bots — live-web overlay validates the aggregate against
 * current market state").
 *
 * Pre-req MET at HEAD 08f67fc:
 *   · PriceBot Sonar wired (lib/adapters/bot-ai-router/config.ts L62 ·
 *     liveWebProvider:"perplexity" · sonar alias)
 *   · ReconBot Sonar wired (config.ts L84 · sonar-deep-research)
 *   · AnalyzeBot Wire B verifier shipped (commit 0039082 · admin verify)
 *
 * SylviaMemory rows accumulate AUTOMATICALLY via V2-TELEMETRY-PERSIST
 * wire (commit 5bcc45a). This route is the 8TH PRODUCTION CONSUMER of
 * the Sylvia brain stem (Wire H · 2ND PANEL SLOT · after Wire A
 * 5857833 + Wire B 0039082 + Wire C 105c7d0 + Wire D bc4085f + Wire E
 * bab6e3c + Wire F e564466 + Wire G f2e4715 AmazonPriceBadge SLOT) ·
 * 🎯 THIS COMMIT RATIFIES DOC-AUDIT-FIRST-WIRE-PATTERN BINDING #17 ·
 * audit §6 P0+P1 = 8/8 contract = 6 admin wires + 2 panel slots ·
 * audit IS the contract per CEO Wed AM scope decision.
 *
 * CMD-ITEMINTELLIGENCESUMMARY-SONAR-SLOT V18 · 2026-05-06
 * Author: Devin (Senior Dev Engineer · Layer 1) · Round 10 cylinder #2 (Wed AM)
 *
 * SLOT pattern (vs Wire A–F admin-additive WIRE pattern):
 *   (a) Auth boundary: item-owner-or-admin (NOT admin-only)
 *   (b) Same canonical helper: triageAndRoute · same SylviaMemory write
 *   (c) Audit row §2.3 specifies sonar-pro alias (3-bot foundation
 *       aggregation requires multi-source validation · base sonar
 *       insufficient · sonar-deep-research over-budget · sonar-pro is
 *       the cost-balanced sweet spot · matches Wire D ListBot precedent)
 *
 * In-route hybrid pattern banked separately as
 * CMD-ITEMINTELLIGENCESUMMARY-CONFIG-WIRE-V2 if/when CEO greenlights.
 *
 * Query params:
 *   ?force=1 — bypass 24h EventLog cache · force fresh Sonar call.
 */

import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { isAdmin } from "@/lib/constants/admin";
import { prisma } from "@/lib/db";
import { triageAndRoute } from "@/lib/sylvia";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h · matches Wire A

export async function POST(
  req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  try {
    // ── Auth ──
    const user = await authAdapter.getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Validate ──
    const { itemId } = await ctx.params;
    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    // ── Item lookup with primary photo + owner check (panel SLOT auth) ──
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        userId: true,
        title: true,
        category: true,
        condition: true,
        description: true,
        photos: {
          select: { filePath: true },
          take: 1,
          orderBy: { order: "asc" },
        },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (!isAdmin(user.email) && item.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden — item-owner or admin only" },
        { status: 403 },
      );
    }

    // ── Cache check (skip if ?force=1) ──
    if (!force) {
      const cached = await prisma.eventLog.findFirst({
        where: {
          itemId,
          eventType: "ITEM_INTELLIGENCE_SONAR_REFRESH",
          createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
        },
        orderBy: { createdAt: "desc" },
      });
      if (cached) {
        const parsed = cached.payload ? JSON.parse(cached.payload) : null;
        return NextResponse.json({
          source: "cache",
          cachedAt: cached.createdAt,
          ...parsed,
        });
      }
    }

    // ── Gather 3-bot foundation (AnalyzeBot + PriceBot + ReconBot) ──
    const [aiResult, valuation, reconAlert] = await Promise.all([
      prisma.aiResult.findFirst({
        where: { itemId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.valuation.findFirst({
        where: { itemId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.reconAlert.findFirst({
        where: { reconBot: { itemId } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // ── Build 3-bot validation prompt for Sonar pro ──
    const photoUrl = item.photos[0]?.filePath ?? "(no photo available)";
    const prompt = [
      "You are validating an aggregated intelligence summary against current",
      "market state. The platform has run 3 specialized bots on this item:",
      "AnalyzeBot (identification) · PriceBot (valuation) · ReconBot (market",
      "intelligence). Your job is to OVERLAY these aggregates with current-day",
      "live-web evidence and report concordance or divergence.",
      "",
      `Title: ${item.title ?? "Unknown"}`,
      `Category: ${item.category ?? "Unknown"}`,
      `Condition: ${item.condition ?? "Unknown"}`,
      `Photo URL: ${photoUrl}`,
      "",
      "3-BOT FOUNDATION (already-computed bot output):",
      `  AnalyzeBot AiResult: ${aiResult ? JSON.stringify({ id: aiResult.id, createdAt: aiResult.createdAt }) : "(no AnalyzeBot output)"}`,
      `  PriceBot Valuation: ${valuation ? JSON.stringify({ id: valuation.id, confidence: valuation.confidence }) : "(no PriceBot output)"}`,
      `  ReconBot ReconAlert: ${reconAlert ? JSON.stringify({ id: reconAlert.id, createdAt: reconAlert.createdAt }) : "(no ReconBot output)"}`,
      "",
      "GROUND THIS WITH CURRENT-DAY LIVE-WEB EVIDENCE:",
      "  1. IDENTIFICATION_VALIDATION: confirm AnalyzeBot's category/title is",
      "     consistent with current marketplace listings · flag mismatches",
      "  2. PRICING_VALIDATION: PriceBot's recommended range vs current",
      "     marketplace ask + recent sold range · cite at least 3 URLs",
      "  3. MARKET_POSITION: ReconBot's demand/trend assessment vs current-week",
      "     activity · recent price direction · platform best-fit",
      "  4. KEY_INSIGHTS_OVERLAY: any current-week intel the 3 bots missed",
      "     (trending events · supply shocks · seasonal demand shifts)",
      "  5. CONFIDENCE_OVERALL: how confident are you the 3-bot aggregate",
      "     reflects today's market reality · cite reasoning",
      "",
      "Return JSON with these fields:",
      "  - identification_validation: { match: 'concordant'|'partial'|'divergent'|'unknown', evidence: string }",
      "  - pricing_validation: { current_market_low: number, current_market_high: number, current_market_median: number, divergence_from_pricebot: 'low'|'mid'|'high', source_urls: string[] }",
      "  - market_position: { current_demand: 'rising'|'stable'|'falling'|'unknown', best_platform_today: string, evidence: string }",
      "  - key_insights_overlay: string[] (current-week intel the 3-bot foundation may have missed)",
      "  - confidence_overall: 0.0 to 1.0",
      "  - reasoning: 2-4 sentences citing live-web evidence",
      "  - sources: array of URLs cited (≥3 required for high confidence)",
      "",
      "If the 3-bot foundation is missing critical fields (null/undefined for",
      "any of the 3), reduce confidence below 0.5 and note which bot didn't",
      "produce data. If live-web evidence directly contradicts the 3-bot",
      "aggregate, set divergence_from_pricebot accordingly and reduce",
      "confidence below 0.6.",
      "",
      "Respond with valid JSON only. No prose outside the JSON object.",
    ].join("\n");

    // ── Sylvia triage call · forceAlias: "sonar-pro" honors audit row
    //    §2.3 ItemIntelligenceSummary P1 recommendation ──
    const startedAt = Date.now();
    let sylviaResult: Awaited<ReturnType<typeof triageAndRoute>> | null = null;
    let sylviaError: string | null = null;
    try {
      sylviaResult = await triageAndRoute({
        prompt,
        complexityHint: "specialized",
        requiresLiveWeb: true,
        forceAlias: "sonar-pro",
        sessionId: `intelligence-sonar-${user.id}-${itemId}`,
      });
    } catch (err) {
      sylviaError = err instanceof Error ? err.message.slice(0, 200) : "unknown";
    }
    const durationMs = Date.now() - startedAt;

    // ── Telemetry · panel-side EventLog ──
    const payload = {
      itemId,
      userEmail: user.email,
      userId: user.id,
      durationMs,
      result: sylviaResult?.responseText ?? null,
      decision: sylviaResult?.decision ?? null,
      actualCostUsd: sylviaResult?.actualCostUsd ?? null,
      sylviaSessionId: `intelligence-sonar-${user.id}-${itemId}`,
      sylviaPromptHash: sylviaResult?.telemetry?.promptHash ?? null,
      error: sylviaError,
      anchor: "CMD-ITEMINTELLIGENCESUMMARY-SONAR-SLOT",
      sylviaMemoryActive: true,
      threeBotFoundation: {
        analyzeBot: aiResult ? aiResult.id : null,
        priceBot: valuation ? valuation.id : null,
        reconBot: reconAlert ? reconAlert.id : null,
      },
    };
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ITEM_INTELLIGENCE_SONAR_REFRESH",
        payload: JSON.stringify(payload),
      },
    });

    if (sylviaError) {
      return NextResponse.json(
        { source: "live", error: sylviaError, durationMs },
        { status: 502 },
      );
    }

    return NextResponse.json({
      source: "live",
      durationMs,
      result: sylviaResult?.responseText ?? null,
      decision: sylviaResult?.decision ?? null,
      actualCostUsd: sylviaResult?.actualCostUsd ?? null,
      sylviaMemoryActive: true,
    });
  } catch (error) {
    console.error("[/api/items/[id]/intelligence-sonar-refresh]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
