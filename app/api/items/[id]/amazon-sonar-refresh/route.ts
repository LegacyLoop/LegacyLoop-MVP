/**
 * POST /api/items/[id]/amazon-sonar-refresh
 *
 * Panel-facing live-Amazon-grounded price refresh for AmazonPriceBadge.
 * Calls Sylvia's triage router with complexityHint: "standard" +
 * requiresLiveWeb: true · routes to base sonar alias via LiteLLM
 * Gateway (per PERPLEXITY-SLOTTING-AUDIT 1c04560 row §2.2 P1
 * AmazonPriceBadge recommendation: "Live Amazon comp pull · current-day
 * Amazon price beats stale Rainforest cache for high-velocity SKUs ·
 * highest-priority panel-level wire · visible above-fold on item detail ·
 * investor-demo surface").
 *
 * SylviaMemory rows accumulate AUTOMATICALLY via V2-TELEMETRY-PERSIST
 * wire (every triageAndRoute() call writes 1 row per V2 ratification
 * commit 5bcc45a). This route is the 7TH PRODUCTION CONSUMER of the
 * Sylvia brain stem (Wire G · 1ST PANEL SLOT · after Wire A 5857833
 * admin-pricing-accuracy + Wire B 0039082 AnalyzeBot + Wire C 105c7d0
 * AntiqueBot + Wire D bc4085f ListBot + Wire E bab6e3c CarBot + Wire F
 * e564466 CollectiblesBot) · DOC-AUDIT-FIRST-WIRE-PATTERN candidate
 * progresses 7/8 (Wire H ItemIntelligenceSummary parallel · 8/8
 * ratifies BINDING #17 on Wire H clean fire · CEO scope decision:
 * audit §6 P0+P1 = 8/8 contract = 6 admin wires + 2 panel slots).
 *
 * CMD-AMAZONPRICEBADGE-SONAR-SLOT V18 · 2026-05-06
 * Author: Devin (Senior Dev Engineer · Layer 1) · Round 10 cylinder #1 (Wed AM)
 *
 * SLOT pattern (vs Wire A–F admin-additive WIRE pattern):
 *   (a) Auth boundary: item-owner-or-admin (NOT admin-only) ·
 *       panel-facing surface · users see live-refresh affordance
 *   (b) Same canonical helper: triageAndRoute · same SylviaMemory
 *       physical write · consistent moat-compounding contract
 *   (c) Audit row §2.2 specifies sonar alias (base · cars + Amazon
 *       both well-indexed in standard search · cost-disciplined vs
 *       sonar-pro reserved for graded items Wire F · sonar-deep-research
 *       reserved for rare-item provenance Wire C)
 *
 * In-route hybrid pattern (touching bot-ai-router/config.ts) is banked
 * separately as CMD-AMAZONPRICEBADGE-CONFIG-WIRE-V2 if/when CEO greenlights.
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

    // ── Item lookup with primary photo + owner check (panel SLOT auth:
    //    item-owner-or-admin · prevents cross-item refresh abuse) ──
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
          eventType: "ITEM_AMAZON_SONAR_REFRESH",
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

    // ── Build Amazon-grounded comp pull prompt for Sonar (base alias) ──
    const photoUrl = item.photos[0]?.filePath ?? "(no photo available)";
    const prompt = [
      "You are AmazonPriceBadge — pulling LIVE Amazon comparable pricing",
      "for a resale item. Ground this with current-day Amazon search.",
      "",
      `Title: ${item.title ?? "Unknown"}`,
      `Category: ${item.category ?? "Unknown"}`,
      `Condition: ${item.condition ?? "Unknown"}`,
      `Photo URL: ${photoUrl}`,
      `Description from seller:`,
      item.description ?? "(no description)",
      "",
      "GROUND THIS WITH LIVE AMAZON SEARCH:",
      "  1. SEARCH_TERM: derive the best Amazon search query from title + category",
      "  2. PRICE_RANGE: low/mid/high USD across top 10–25 active Amazon results",
      "  3. RESULT_COUNT: total Amazon results returned",
      "  4. TOP_RESULT: title · price · star_rating · ratings_total · amazon_url",
      "     for the #1 ranked search hit",
      "  5. FRESHNESS_NOTE: cite that this is live-pulled today (no stale cache)",
      "",
      "Return JSON with these fields:",
      "  - searchTerm: string (the query you used)",
      "  - resultCount: number (total Amazon results returned)",
      "  - totalResults: number (same as resultCount or count if facet-paged)",
      "  - priceRange: { low: number, high: number, avg: number, median: number }",
      "  - topResult: { title: string, price: number | null, rating: number | null, ratingsTotal: number | null, link: string }",
      "  - fetchedAt: string (ISO 8601 · timestamp when YOU performed the search)",
      "  - confidence: 0.0 to 1.0 (your confidence the search was on-target)",
      "  - reasoning: 1-2 sentences citing the Amazon URLs",
      "  - sources: array of Amazon URLs cited",
      "",
      "If Amazon yields zero results for this exact item, return resultCount: 0",
      "and reduce confidence below 0.4. If condition mismatch (item is 'used' but",
      "Amazon only has 'new'), note that explicitly in reasoning and reduce",
      "confidence to 0.6 (still useful · just not exact-condition).",
      "",
      "Respond with valid JSON only. No prose outside the JSON object.",
    ].join("\n");

    // ── Sylvia triage call · forceAlias: "sonar" honors audit row §2.2
    //    AmazonPriceBadge P1 recommendation (base sonar alias · Amazon
    //    listings well-indexed in standard search · sonar-pro reserved
    //    for graded items Wire F · sonar-deep-research reserved for
    //    rare-item provenance Wire C · cost-disciplined alias pick) ·
    //    routes via LiteLLM Gateway · SylviaMemory row written
    //    automatically by V2-TELEMETRY-PERSIST wire ──
    const startedAt = Date.now();
    let sylviaResult: Awaited<ReturnType<typeof triageAndRoute>> | null = null;
    let sylviaError: string | null = null;
    try {
      sylviaResult = await triageAndRoute({
        prompt,
        complexityHint: "medium",
        requiresLiveWeb: true,
        forceAlias: "sonar",
        sessionId: `amazon-sonar-${user.id}-${itemId}`,
        // Inherit default cost ceilings (per-call $0.05 · per-session $1.00)
      });
    } catch (err) {
      sylviaError = err instanceof Error ? err.message.slice(0, 200) : "unknown";
    }
    const durationMs = Date.now() - startedAt;

    // ── Telemetry · panel-side EventLog (Sylvia memory row already
    //    persisted automatically via V2-TELEMETRY-PERSIST wire at
    //    lib/sylvia/triage-router.ts:300 · this EventLog row is the
    //    panel-context overlay for cache lookup + AmazonPriceBadge
    //    consumption · two-row pattern preserved) ──
    const payload = {
      itemId,
      userEmail: user.email,
      userId: user.id,
      durationMs,
      result: sylviaResult?.responseText ?? null,
      decision: sylviaResult?.decision ?? null,
      actualCostUsd: sylviaResult?.actualCostUsd ?? null,
      sylviaSessionId: `amazon-sonar-${user.id}-${itemId}`,
      sylviaPromptHash: sylviaResult?.telemetry?.promptHash ?? null,
      error: sylviaError,
      anchor: "CMD-AMAZONPRICEBADGE-SONAR-SLOT",
      sylviaMemoryActive: true, // sentinel: V2 wire writes 1 SylviaMemory row per call
    };
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ITEM_AMAZON_SONAR_REFRESH",
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
    console.error("[/api/items/[id]/amazon-sonar-refresh]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
