/**
 * POST /api/admin/carbot-sonar-verify/[itemId]
 *
 * Admin-only Sonar live-web verification of a vehicle listing.
 * Calls Sylvia's triage router with complexityHint: "specialized"
 * + requiresLiveWeb:true · routes to sonar via LiteLLM Gateway
 * (per PERPLEXITY-SLOTTING-AUDIT 1c04560 row §1+§9 CarBot P1
 * recommendation: VIN-decode validation + KBB private-party / NADA
 * retail / Bring-A-Trailer recent sold / Cars.com active asks ·
 * recent comps + carfax-style title-history confidence + NHTSA
 * open-recall lookup · cars are well-indexed in standard web search
 * so base sonar alias is sufficient · sonar-deep-research is reserved
 * for rare-item provenance per Wire C · cost-disciplined alias pick
 * matches audit cost-gate note) · captures Sonar's vehicle pricing
 * opinion · logs to EventLog.
 *
 * SylviaMemory rows accumulate AUTOMATICALLY via V2-TELEMETRY-PERSIST
 * wire (every triageAndRoute() call writes 1 row per V2 ratification
 * commit 5bcc45a). This route is the 5TH PRODUCTION CONSUMER of the
 * Sylvia brain stem (Wire E · after Wire A 5857833 admin-pricing-
 * accuracy + Wire B 0039082 AnalyzeBot + Wire C 105c7d0 AntiqueBot
 * + Wire D bc4085f ListBot) · DOC-AUDIT-FIRST-WIRE-PATTERN candidate
 * progresses 5/8 → projection 8/8 ratifies BINDING when all wire
 * cylinders ship clean (3 from BINDING after this commit · Wire F
 * CollectiblesBot landing parallel Round 9 advances to 6/8).
 *
 * CMD-CARBOT-SONAR-WIRE V18 · 2026-05-05
 * Author: Devin (Senior Dev Engineer · Layer 1) · Round 9 cylinder #1 (Tue PM)
 *
 * Cloned byte-for-byte from Wire D bc4085f (admin verify route ·
 * auth-gated · 24h EventLog cache · ?force=1 bypass · explicit
 * forceAlias honoring audit recommendation) · with Sylvia's
 * triageAndRoute as the egress. Wire E reuses Wire D's admin-additive
 * pattern because:
 *   (a) ADDITIVE-ONLY doctrine — zero touch to existing CarBot
 *       route at app/api/bots/carbot/[itemId]/route.ts (premium
 *       hybrid Claude+Grok always · triggers:["always"])
 *   (b) Activates SylviaMemory accumulation on every admin verify ·
 *       moat compounds physically with each call (5th consumer)
 *   (c) Audit row §1+§9 specifies sonar alias (base alias sufficient
 *       for vehicle indexing · cost-disciplined vs sonar-pro · cars
 *       are well-indexed in standard search vs collectibles which
 *       need authoritative sources via sonar-pro per Wire F)
 *
 * In-route hybrid pattern (touching bot-ai-router/config.ts) is banked
 * separately as CMD-CARBOT-CONFIG-WIRE-V2 if/when CEO greenlights.
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
          eventType: "ADMIN_CARBOT_SONAR_VERIFY",
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

    // ── Build vehicle-pricing verification prompt for Sonar ──
    const photoUrl = item.photos[0]?.filePath ?? "(no photo available)";
    const prompt = [
      "You are CarBot — verifying a vehicle listing for a high-trust",
      "resale platform. Ground this verification with live-web search of",
      "authoritative vehicle-pricing sources (KBB private-party / NADA",
      "retail / Bring-A-Trailer recent sold / Cars.com active asks) and",
      "NHTSA recall data.",
      "",
      `Title: ${item.title ?? "Unknown"}`,
      `Category: ${item.category ?? "Unknown"}`,
      `Condition: ${item.condition ?? "Unknown"}`,
      `Photo URL: ${photoUrl}`,
      `Description from seller:`,
      item.description ?? "(no description)",
      "",
      "GROUND THIS VERIFICATION WITH LIVE WEB SEARCH:",
      "  1. VIN_VALIDATION: confirm year/make/model/trim matches VIN if",
      "     provided · flag mismatches",
      "  2. PRICING_FRESHNESS: KBB private-party / NADA retail / Bring-A-",
      "     Trailer recent sold / Cars.com active asks · cite at least 3",
      "     sources with URLs",
      "  3. RECENT_COMPS: 5-10 recently-sold or actively-listed vehicles",
      "     (same year ±2 · same model · similar mileage ±20%) · include",
      "     sale prices + dates + URLs",
      "  4. TITLE_HISTORY_CONFIDENCE: any salvage/rebuilt/lemon flags",
      "     surfacing in standard searches · note absence of negative",
      "     signals if clean",
      "  5. RECALLS_OPEN: NHTSA open recalls for this VIN/year/model ·",
      "     cite NHTSA campaign IDs if found",
      "",
      "Return JSON with these fields:",
      "  - vin_validation: { match: 'exact'|'close'|'mismatch'|'unknown', evidence: string }",
      "  - pricing_freshness: { kbb_private_party_usd: { low: number, mid: number, high: number, source_url: string }, nada_retail_usd: { low: number, mid: number, high: number, source_url: string }, bring_a_trailer_recent: array of { price: number, date: string, url: string }, cars_com_active_asks: array of { price: number, url: string } }",
      "  - recent_comps: array of { year: number, model: string, miles: number, price: number, date: string, url: string }",
      "  - title_history_confidence: 'clean'|'flag_review'|'unknown'",
      "  - recalls_open: array of { campaign_id: string, summary: string, remedy: string }",
      "  - confidence: 0.0 to 1.0",
      "  - reasoning: 1-3 sentences citing live-web evidence",
      "  - sources: array of URLs cited (KBB · NADA · Bring-A-Trailer · Cars.com · NHTSA)",
      "",
      "If web search yields zero comps, return empty arrays + reduce",
      "confidence below 0.5. If VIN mismatch, reduce confidence below 0.4",
      "regardless of pricing.",
      "",
      "Respond with valid JSON only. No prose outside the JSON object.",
    ].join("\n");

    // ── Sylvia triage call · forceAlias: "sonar" honors audit row
    //    §1+§9 CarBot P1 recommendation explicitly (Sylvia's cascade
    //    for "specialized" complexity defaults to sonar-reasoning-pro ·
    //    forceAlias overrides to base sonar alias for vehicles · cars
    //    are well-indexed in standard web search · sonar-pro reserved
    //    for graded collectibles (Wire F) where authoritative sources
    //    matter · sonar-deep-research reserved for rare-item provenance
    //    (Wire C AntiqueBot) · cost-disciplined alias pick) · routes
    //    via LiteLLM Gateway · SylviaMemory row written automatically
    //    by V2-TELEMETRY-PERSIST wire ──
    const startedAt = Date.now();
    let sylviaResult: Awaited<ReturnType<typeof triageAndRoute>> | null = null;
    let sylviaError: string | null = null;
    try {
      sylviaResult = await triageAndRoute({
        prompt,
        complexityHint: "specialized",
        requiresLiveWeb: true,
        forceAlias: "sonar",
        sessionId: `admin-carbot-verify-${user.id}`,
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
      sylviaSessionId: `admin-carbot-verify-${user.id}`,
      sylviaPromptHash: sylviaResult?.telemetry?.promptHash ?? null,
      error: sylviaError,
      anchor: "CMD-CARBOT-SONAR-WIRE",
      sylviaMemoryActive: true, // sentinel: V2 wire writes 1 SylviaMemory row per call
    };
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ADMIN_CARBOT_SONAR_VERIFY",
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
    console.error("[/api/admin/carbot-sonar-verify]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
