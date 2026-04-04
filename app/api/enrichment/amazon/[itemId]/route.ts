import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { searchAmazon, buildSearchTerm } from "@/lib/adapters/rainforest";
import type { RainforestEnrichmentData } from "@/lib/adapters/rainforest";
import { populateFromRainforest } from "@/lib/data/populate-intelligence";

const CACHE_HOURS = 24;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/** GET /api/enrichment/amazon/[itemId] — return cached Rainforest data */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    const cached = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "RAINFOREST_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!cached) {
      return NextResponse.json({ success: false, data: null });
    }

    const data = safeJson(cached.payload) as RainforestEnrichmentData | null;
    // Backfill totalResults for older cached data that predates the field
    if (data && !data.totalResults) {
      data.totalResults = data.resultCount;
    }
    return NextResponse.json({ success: true, data, cachedAt: cached.createdAt });
  } catch (e) {
    console.error("[enrichment/amazon GET]", e);
    return NextResponse.json({ error: "Failed to fetch Amazon data" }, { status: 500 });
  }
}

/** POST /api/enrichment/amazon/[itemId] — search Amazon via Rainforest and cache */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    // Verify item ownership
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, userId: true, title: true },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    // 24-hour cache check
    const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000);
    const recent = await prisma.eventLog.findFirst({
      where: {
        itemId,
        eventType: "RAINFOREST_RESULT",
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      console.log(`[Rainforest] Using cached result for ${itemId} (${Math.round((Date.now() - recent.createdAt.getTime()) / 3600000)}h old)`);
      const cachedData = safeJson(recent.payload) as RainforestEnrichmentData | null;
      return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    // Build search term from AI analysis if available
    let searchTerm = item.title || "item";
    const aiResult = await prisma.aiResult.findUnique({ where: { itemId } });
    if (aiResult) {
      const ai = safeJson(aiResult.rawJson);
      if (ai) {
        searchTerm = buildSearchTerm(
          ai.item_name || item.title || "item",
          ai.category,
          ai.brand
        );
      }
    }

    // Call Rainforest API
    const amazonData = await searchAmazon(searchTerm).catch(() => null);

    if (!amazonData) {
      return NextResponse.json({ success: false, message: "No Amazon data found" });
    }

    // Store to EventLog
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "RAINFOREST_RESULT",
        payload: JSON.stringify(amazonData),
      },
    });

    console.log(`[Rainforest] Stored ${amazonData.resultCount} results for ${itemId}`);

    // Fire-and-forget: populate PriceSnapshot from Rainforest data
    populateFromRainforest(itemId, amazonData as unknown as Record<string, unknown>).catch(() => null);

    return NextResponse.json({ success: true, data: amazonData, cached: false });
  } catch (e) {
    console.error("[enrichment/amazon POST]", e);
    return NextResponse.json({ error: "Failed to fetch Amazon data" }, { status: 500 });
  }
}
