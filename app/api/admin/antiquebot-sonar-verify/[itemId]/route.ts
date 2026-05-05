/**
 * POST /api/admin/antiquebot-sonar-verify/[itemId]
 *
 * Admin-only Sonar deep-research verification of an item's rare-item
 * provenance. Calls Sylvia's triage router with complexityHint:
 * "specialized" + requiresLiveWeb:true · routes to sonar-deep-research
 * via LiteLLM Gateway (per PERPLEXITY-SLOTTING-AUDIT 1c04560 row §1
 * AntiqueBot recommendation: "Rare-item provenance lookups need
 * authoritative current sources — auction house archives · provenance
 * databases. Rare items are the high-value tail — every accuracy
 * point here lifts realized sale price meaningfully.") · captures
 * Sonar's provenance opinion · logs to EventLog.
 *
 * SylviaMemory rows accumulate AUTOMATICALLY via V2-TELEMETRY-PERSIST
 * wire (every triageAndRoute() call writes 1 row per V2 ratification
 * commit 5bcc45a). This route is the 3RD PRODUCTION CONSUMER of the
 * Sylvia brain stem (Wire C · after Wire A 5857833 admin-pricing-
 * accuracy + Wire B 0039082 AnalyzeBot) · DOC-AUDIT-FIRST-WIRE-
 * PATTERN candidate progresses 3/8 → projection 8/8 ratifies BINDING
 * when all wire cylinders ship clean.
 *
 * CMD-ANTIQUEBOT-SONAR-WIRE V18 · 2026-05-05
 * Author: Pam (Cowork · Layer 1) · Round 7 cylinder #1 (Tue PM)
 *
 * Inherits canonical Wire B pattern (admin verify route · auth-gated ·
 * 24h EventLog cache · ?force=1 bypass) · with Sylvia's triageAndRoute
 * as the egress. Wire C reuses Wire B's admin-additive pattern
 * because:
 *   (a) ADDITIVE-ONLY doctrine — zero touch to existing AntiqueBot
 *       route at app/api/bots/antiquebot/[itemId]/route.ts
 *   (b) Activates SylviaMemory accumulation on every admin verify ·
 *       moat compounds physically with each call (3rd consumer)
 *   (c) Audit row §1 specifies sonar-deep-research alias (multi-source
 *       citation chains for rare-item provenance · same alias ReconBot
 *       hybrid runner uses · proven in production)
 *
 * In-route hybrid pattern (touching bot-ai-router/config.ts) is banked
 * separately as CMD-ANTIQUEBOT-CONFIG-WIRE-V2 if/when CEO greenlights.
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
          eventType: "ADMIN_ANTIQUEBOT_SONAR_VERIFY",
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

    // ── Build rare-item provenance prompt for Sonar deep-research ──
    const photoUrl = item.photos[0]?.filePath ?? "(no photo available)";
    const prompt = [
      "Verify the rare-item provenance and current market value of this",
      "resale item using authoritative live-web sources (auction house",
      "archives · provenance databases · specialist dealer listings).",
      "",
      `Title: ${item.title ?? "Unknown"}`,
      `Category: ${item.category ?? "Unknown"}`,
      `Condition: ${item.condition ?? "Unknown"}`,
      `Photo URL: ${photoUrl}`,
      `Description from seller:`,
      item.description ?? "(no description)",
      "",
      "Return JSON with these fields:",
      "  - provenance: { maker, era, originRegion, knownProductionRun }",
      "  - identification: { category, subcategory, model }",
      "  - estimated_value_usd: { low, mid, high, recentComps }",
      "  - rarity: 'common' | 'uncommon' | 'rare' | 'museum_grade'",
      "  - confidence: 0.0 to 1.0",
      "  - reasoning: 1-3 sentences citing authoritative sources",
      "  - sources: array of URLs cited (auction houses · provenance DBs)",
      "",
      "Respond with valid JSON only. No prose outside the JSON object.",
    ].join("\n");

    // ── Sylvia triage call · forceAlias: "sonar-deep-research" honors
    //    audit row §1 AntiqueBot recommendation explicitly (Sylvia's
    //    cascade for "specialized" complexity defaults to sonar-
    //    reasoning-pro · forceAlias overrides for multi-source
    //    citation chains required by rare-item provenance lookups) ·
    //    routes via LiteLLM Gateway · SylviaMemory row written
    //    automatically by V2-TELEMETRY-PERSIST wire ──
    const startedAt = Date.now();
    let sylviaResult: Awaited<ReturnType<typeof triageAndRoute>> | null = null;
    let sylviaError: string | null = null;
    try {
      sylviaResult = await triageAndRoute({
        prompt,
        complexityHint: "specialized",
        requiresLiveWeb: true,
        forceAlias: "sonar-deep-research",
        sessionId: `admin-antiquebot-verify-${user.id}`,
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
      sylviaSessionId: `admin-antiquebot-verify-${user.id}`,
      sylviaPromptHash: sylviaResult?.telemetry?.promptHash ?? null,
      error: sylviaError,
      anchor: "CMD-ANTIQUEBOT-SONAR-WIRE",
      sylviaMemoryActive: true, // sentinel: V2 wire writes 1 SylviaMemory row per call
    };
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ADMIN_ANTIQUEBOT_SONAR_VERIFY",
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
    console.error("[/api/admin/antiquebot-sonar-verify]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
