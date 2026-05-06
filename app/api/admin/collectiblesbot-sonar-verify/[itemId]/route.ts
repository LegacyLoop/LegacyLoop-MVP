/**
 * POST /api/admin/collectiblesbot-sonar-verify/[itemId]
 *
 * Admin-only Sonar live-web verification of a graded collectible.
 * Calls Sylvia's triage router with complexityHint: "specialized"
 * + requiresLiveWeb:true · routes to sonar-pro via LiteLLM Gateway
 * (per PERPLEXITY-SLOTTING-AUDIT 1c04560 row §1+§8 CollectiblesBot
 * recommendation: PSA / Beckett / CGC / BGS pop reports · weekly
 * grading market-value reports · recent auction comps from Heritage
 * Auctions / Goldin / eBay · counterfeit + grading-discrepancy flags ·
 * cost-balanced sonar-pro NOT sonar-deep-research · graded items have
 * known authoritative sources so deep-research is over-budget) ·
 * captures Sonar's grading verification opinion · logs to EventLog.
 *
 * SylviaMemory rows accumulate AUTOMATICALLY via V2-TELEMETRY-PERSIST
 * wire (every triageAndRoute() call writes 1 row per V2 ratification
 * commit 5bcc45a). This route is the 6TH PRODUCTION CONSUMER of the
 * Sylvia brain stem (Wire F · after Wire A 5857833 admin-pricing-
 * accuracy + Wire B 0039082 AnalyzeBot + Wire C 105c7d0 AntiqueBot
 * + Wire D bc4085f ListBot + Wire E parallel Round 9 #1 CarBot) ·
 * DOC-AUDIT-FIRST-WIRE-PATTERN candidate progresses 6/8 → projection
 * 8/8 ratifies BINDING when all wire cylinders ship clean (2 from
 * BINDING after this commit).
 *
 * CMD-COLLECTIBLESBOT-SONAR-WIRE V18 · 2026-05-05
 * Author: Devin (Senior Dev Engineer · Layer 1) · Round 9 cylinder #2 (Tue PM)
 *
 * Cloned byte-for-byte from Wire D bc4085f (admin verify route ·
 * auth-gated · 24h EventLog cache · ?force=1 bypass · explicit
 * forceAlias honoring audit recommendation) · with Sylvia's
 * triageAndRoute as the egress. Wire F reuses Wire D's admin-additive
 * pattern because:
 *   (a) ADDITIVE-ONLY doctrine — zero touch to existing CollectiblesBot
 *       route at app/api/bots/collectiblesbot/[itemId]/route.ts
 *   (b) Activates SylviaMemory accumulation on every admin verify ·
 *       moat compounds physically with each call (6th consumer)
 *   (c) Audit row §1+§8 specifies sonar-pro alias (balanced live-web
 *       + reasoning at moderate cost · graded items have known
 *       authoritative sources · cost-ceiling discipline matches Wire D)
 *
 * In-route hybrid pattern (touching bot-ai-router/config.ts) is banked
 * separately as CMD-COLLECTIBLESBOT-CONFIG-WIRE-V2 if/when CEO greenlights.
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
    if (!isAdmin(user.email)) {
      return NextResponse.json(
        { error: "Forbidden — admin only" },
        { status: 403 },
      );
    }

    // ── Validate ──
    const { itemId } = await ctx.params;
    if (!itemId) {
      return NextResponse.json({ error: "itemId required" }, { status: 400 });
    }

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    // ── Item lookup with primary photo (per ItemPhoto schema:510-517 ·
    //    filePath + order fields verified at fire time · NOT url +
    //    displayOrder per spec best-guess) ──
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
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

    // ── Cache check (skip if ?force=1) ──
    if (!force) {
      const cached = await prisma.eventLog.findFirst({
        where: {
          itemId,
          eventType: "ADMIN_COLLECTIBLESBOT_SONAR_VERIFY",
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

    // ── Build collectible-grading verification prompt for Sonar pro ──
    const photoUrl = item.photos[0]?.filePath ?? "(no photo available)";
    const prompt = [
      "You are CollectiblesBot — verifying a graded collectible for a",
      "high-trust resale platform. Ground this verification with live-web",
      "search of authoritative grading sources (PSA / Beckett / CGC / BGS)",
      "and recent auction-house comps (Heritage Auctions · Goldin · eBay ·",
      "MyComicShop · etc.).",
      "",
      `Title: ${item.title ?? "Unknown"}`,
      `Category: ${item.category ?? "Unknown"}`,
      `Condition: ${item.condition ?? "Unknown"}`,
      `Photo URL: ${photoUrl}`,
      `Description from seller:`,
      item.description ?? "(no description)",
      "",
      "GROUND THIS VERIFICATION WITH LIVE WEB SEARCH:",
      "  1. GRADING_CONFIRMATION: PSA pop report count for the exact card/grade ·",
      "     CGC certification check · BGS auth · Beckett serial lookup",
      "  2. WEEKLY_MARKET_VALUE: PSA Auction Prices Realized last 30 days ·",
      "     Beckett OPG monthly · CGC market reports · cite at least 3 sources",
      "  3. RECENT_COMPS: 5-10 recently-sold of same card · same grade ± 1 ·",
      "     include sale prices + dates + auction-house URLs",
      "  4. COUNTERFEIT_FLAGS: known re-holder operations · grading discrepancies",
      "     between services · authentication concerns",
      "  5. POPULATION_PRESSURE: low pop counts increase value · high pop counts",
      "     depress · note pop count + grade rank",
      "",
      "Return JSON with these fields:",
      "  - grading_confirmation: { service: 'PSA'|'BGS'|'CGC'|'Beckett'|'unknown', cert_lookup: 'verified'|'unverifiable'|'flag_review', pop_report_count: number, evidence_url: string }",
      "  - weekly_market_value_usd: { low: number, mid: number, high: number, psa_apr_avg_30d: number, beckett_opg_value: number, source_urls: string[] }",
      "  - recent_comps: array of { grade: string, service: string, price: number, date: string, auction_house: string, url: string }",
      "  - counterfeit_flags: 'clean'|'flag_review'|'unknown'",
      "  - population_pressure: { pop_count: number, grade_rank: 'low'|'mid'|'high'|'top', value_impact: 'depressing'|'neutral'|'premium' }",
      "  - confidence: 0.0 to 1.0",
      "  - reasoning: 1-3 sentences citing live-web evidence",
      "  - sources: array of URLs cited (PSA · Beckett · CGC · BGS · auction houses)",
      "",
      "If web search yields zero comps for this exact grade, expand to ±1",
      "grade and reduce confidence below 0.6. If counterfeit_flags =",
      "flag_review, reduce confidence below 0.4 regardless of comps.",
      "",
      "Respond with valid JSON only. No prose outside the JSON object.",
    ].join("\n");

    // ── Sylvia triage call · forceAlias: "sonar-pro" honors audit row
    //    §1+§8 CollectiblesBot recommendation explicitly (Sylvia's
    //    cascade for "specialized" complexity defaults to sonar-
    //    reasoning-pro · forceAlias overrides to sonar-pro for balanced
    //    live-web + reasoning at moderate cost · graded items have
    //    known authoritative sources (PSA / Beckett / CGC / BGS) so
    //    sonar-deep-research is over-budget · cost-ceiling discipline
    //    matches Wire D ListBot precedent) · routes via LiteLLM Gateway
    //    · SylviaMemory row written automatically by V2-TELEMETRY-
    //    PERSIST wire ──
    const startedAt = Date.now();
    let sylviaResult: Awaited<ReturnType<typeof triageAndRoute>> | null = null;
    let sylviaError: string | null = null;
    try {
      sylviaResult = await triageAndRoute({
        prompt,
        complexityHint: "specialized",
        requiresLiveWeb: true,
        forceAlias: "sonar-pro",
        sessionId: `admin-collectiblesbot-verify-${user.id}`,
        // Inherit default cost ceilings (per-call $0.05 · per-session $1.00)
      });
    } catch (err) {
      sylviaError = err instanceof Error ? err.message.slice(0, 200) : "unknown";
    }
    const durationMs = Date.now() - startedAt;

    // ── Telemetry · admin-side EventLog (Sylvia memory row already
    //    persisted automatically via V2-TELEMETRY-PERSIST wire at
    //    lib/sylvia/triage-router.ts:300 · this EventLog row is the
    //    admin-context overlay for cache lookup + admin-UI rendering) ──
    const payload = {
      itemId,
      adminEmail: user.email,
      durationMs,
      result: sylviaResult?.responseText ?? null,
      decision: sylviaResult?.decision ?? null,
      actualCostUsd: sylviaResult?.actualCostUsd ?? null,
      sylviaSessionId: `admin-collectiblesbot-verify-${user.id}`,
      sylviaPromptHash: sylviaResult?.telemetry?.promptHash ?? null,
      error: sylviaError,
      anchor: "CMD-COLLECTIBLESBOT-SONAR-WIRE",
      sylviaMemoryActive: true, // sentinel: V2 wire writes 1 SylviaMemory row per call
    };
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ADMIN_COLLECTIBLESBOT_SONAR_VERIFY",
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
    console.error("[/api/admin/collectiblesbot-sonar-verify]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
