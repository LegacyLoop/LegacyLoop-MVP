/**
 * POST /api/admin/analyzebot-sonar-verify/[itemId]
 *
 * Admin-only Sonar live-web verification of an item's identification.
 * Calls Sylvia's triage router with complexityHint:"specialized" +
 * requiresLiveWeb:true · routes to sonar-reasoning-pro via LiteLLM
 * Gateway · captures Sonar's identification opinion · logs to EventLog.
 *
 * SylviaMemory rows accumulate AUTOMATICALLY via V2-TELEMETRY-PERSIST
 * wire (every triageAndRoute() call writes 1 row per V2 ratification
 * commit 5bcc45a). This route is the FIRST PRODUCTION CONSUMER of the
 * Sylvia brain stem · validates Spec 2 + Spec 3 + V2 wire end-to-end.
 *
 * CMD-ANALYZEBOT-SONAR-WIRE V18 · 2026-05-03
 * Author: Pam (Cowork · Layer 1)
 *
 * Inherits canonical Wire A pattern (admin verify route · auth-gated ·
 * 24h EventLog cache · ?force=1 bypass) · with Sylvia's triageAndRoute
 * as the egress (vs Wire A's bot-ai-router routePriceBotHybrid). Wire B
 * uses Sylvia because AnalyzeBot's existing route (916 lines) uses
 * aiAdapter direct, NOT bot-ai-router · forcing it through bot-ai-
 * router would be OUT OF SCOPE per ADDITIVE-ONLY doctrine.
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
          eventType: "ADMIN_ANALYZEBOT_SONAR_VERIFY",
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

    // ── Build identification prompt for Sonar ──
    const photoUrl = item.photos[0]?.filePath ?? "(no photo available)";
    const prompt = [
      "Identify this resale item using current live-web sources.",
      "",
      `Title: ${item.title ?? "Unknown"}`,
      `Category: ${item.category ?? "Unknown"}`,
      `Condition: ${item.condition ?? "Unknown"}`,
      `Photo URL: ${photoUrl}`,
      `Description from seller:`,
      item.description ?? "(no description)",
      "",
      "Return JSON with these fields:",
      "  - identification: { category, subcategory, maker, model, era }",
      "  - estimated_value_usd: { low, mid, high }",
      "  - confidence: 0.0 to 1.0",
      "  - reasoning: 1-3 sentences citing live-web evidence",
      "  - sources: array of URLs cited",
      "",
      "Respond with valid JSON only. No prose outside the JSON object.",
    ].join("\n");

    // ── Sylvia triage call (specialized → sonar-reasoning-pro cascade
    //    per Spec 2 §3.2 · routes via LiteLLM Gateway · SylviaMemory
    //    row written automatically by V2-TELEMETRY-PERSIST wire) ──
    const startedAt = Date.now();
    let sylviaResult: Awaited<ReturnType<typeof triageAndRoute>> | null = null;
    let sylviaError: string | null = null;
    try {
      sylviaResult = await triageAndRoute({
        prompt,
        complexityHint: "specialized",
        requiresLiveWeb: true,
        sessionId: `admin-analyzebot-verify-${user.id}`,
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
      sylviaSessionId: `admin-analyzebot-verify-${user.id}`,
      sylviaPromptHash: sylviaResult?.telemetry?.promptHash ?? null,
      error: sylviaError,
      anchor: "CMD-ANALYZEBOT-SONAR-WIRE",
      sylviaMemoryActive: true, // sentinel: V2 wire writes 1 SylviaMemory row per call
    };
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ADMIN_ANALYZEBOT_SONAR_VERIFY",
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
    console.error("[/api/admin/analyzebot-sonar-verify]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
