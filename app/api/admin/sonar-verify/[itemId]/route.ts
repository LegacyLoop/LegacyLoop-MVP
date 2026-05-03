/**
 * POST /api/admin/sonar-verify/[itemId]
 *
 * Admin-only Sonar deep-research verification of an item's price.
 * Calls the existing routePriceBotHybrid with enableLiveWeb=true ·
 * captures Sonar's live-web price opinion · logs to EventLog
 * (eventType=ADMIN_SONAR_VERIFY) · returns the verification result.
 *
 * CMD-ADMIN-PRICING-ACCURACY-SONAR-WIRE V18 · 2026-05-03
 * Author: Pam (Cowork · Layer 1)
 *
 * Inherits canonical hybrid-runner pattern from PriceBot
 * (app/api/bots/pricebot/[itemId]/route.ts L551). The admin context
 * always opts into Sonar primary regardless of item-property
 * predicates — the pricebot config (liveWebProvider="perplexity" +
 * live_web_needed trigger) gates whether Sonar swap fires; passing
 * enableLiveWeb=true with that config in place activates the swap.
 *
 * Reuse > rebuild · DOC-TELEMETRY-LOCK preserved by definition
 * (Sonar request routes through bot-ai-router → LiteLLM Gateway).
 *
 * Query params:
 *   ?force=1 — bypass 24h EventLog cache · force fresh Sonar call.
 */

import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { isAdmin } from "@/lib/constants/admin";
import { prisma } from "@/lib/db";
import { routePriceBotHybrid } from "@/lib/adapters/bot-ai-router";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h cache · revisit per cyl §11

const ADMIN_VERIFY_PROMPT = `You are a Sonar deep-research price verifier
for LegacyLoop's admin team. Use live-web evidence to estimate the
current fair-market price of the provided item. Return JSON with the
following shape:

{
  "estimatedFairMarketUsd": number,
  "lowEndUsd": number,
  "highEndUsd": number,
  "confidence": "low" | "medium" | "high",
  "reasoning": "1-3 sentences citing observed listings/sources",
  "sourceCount": number,
  "verifiedAt": "ISO timestamp"
}

Bias toward sold-listings over asking-prices. Cite the live web · do
not guess. If insufficient public market data exists, set confidence
to "low" and explain in reasoning.`;

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

    // ── Item lookup with photos (matching PriceBot's photoUrls pattern) ──
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        title: true,
        category: true,
        condition: true,
        description: true,
        photos: {
          orderBy: { order: "asc" },
          select: { filePath: true },
        },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const photoUrls = item.photos.slice(0, 4).map((p) => p.filePath);
    if (photoUrls.length === 0) {
      return NextResponse.json(
        { error: "Item has no photos · Sonar verify requires at least one" },
        { status: 400 },
      );
    }

    // ── Cache check (skip if ?force=1) ──
    if (!force) {
      const cached = await prisma.eventLog.findFirst({
        where: {
          itemId,
          eventType: "ADMIN_SONAR_VERIFY",
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

    // ── Build admin-verify pricing prompt with item context ──
    const itemContext = `ITEM CONTEXT:
- Title: ${item.title ?? "Untitled"}
- Category: ${item.category ?? "Unknown"}
- Condition: ${item.condition ?? "Unknown"}
- Description: ${item.description ?? "None"}
`;
    const pricingPrompt = `${ADMIN_VERIFY_PROMPT}\n\n${itemContext}`;

    // ── Sonar deep-research call via routePriceBotHybrid ──
    // enableLiveWeb=true + pricebot config (liveWebProvider="perplexity"
    // + live_web_needed trigger) → Sonar swap fires per index.ts:2659.
    // routePriceBotHybrid NEVER throws to its caller (per L2583 contract).
    const startedAt = Date.now();
    const hybridRun = await routePriceBotHybrid({
      itemId: item.id,
      photoPath: photoUrls,
      pricingPrompt,
      enableLiveWeb: true,
      timeoutMs: 90_000,
      maxTokens: 16_384,
    });
    const durationMs = Date.now() - startedAt;

    const sonarError =
      hybridRun.degraded || !hybridRun.mergedResult
        ? hybridRun.error ?? "all providers degraded"
        : null;

    // ── Telemetry · EventLog write (mirrors PriceBot LIVE_WEB_REQUESTED) ──
    const payload = {
      itemId,
      adminEmail: user.email,
      durationMs,
      result: hybridRun.mergedResult ?? null,
      primaryProvider: hybridRun.primary?.provider ?? null,
      mergedStrategy: hybridRun.mergedStrategy,
      degraded: hybridRun.degraded,
      costUsd: hybridRun.costUsd,
      actualCostUsd: hybridRun.actualCostUsd,
      tokens: hybridRun.tokens,
      error: sonarError,
      anchor: "CMD-ADMIN-PRICING-ACCURACY-SONAR-WIRE",
    };
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "ADMIN_SONAR_VERIFY",
        payload: JSON.stringify(payload),
      },
    });

    if (sonarError) {
      return NextResponse.json(
        { source: "live", error: sonarError, durationMs, payload },
        { status: 502 },
      );
    }

    return NextResponse.json({
      source: "live",
      durationMs,
      result: hybridRun.mergedResult,
      primaryProvider: hybridRun.primary?.provider ?? null,
      mergedStrategy: hybridRun.mergedStrategy,
      costUsd: hybridRun.costUsd,
      tokens: hybridRun.tokens,
    });
  } catch (error) {
    console.error("[/api/admin/sonar-verify]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
