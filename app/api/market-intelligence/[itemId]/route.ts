import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "MARKET_INTELLIGENCE_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) return NextResponse.json({ hasResult: false, result: null });
    return NextResponse.json({ hasResult: true, result: safeJson(existing.payload), createdAt: existing.createdAt });
  } catch (e) {
    console.error("[market-intelligence GET]", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const ai = safeJson(item.aiResult?.rawJson);
    const itemName = ai?.item_name || item.title || "Unknown";
    const category = ai?.category || "General";

    const result = await getMarketIntelligence(itemName, category);

    await prisma.eventLog.create({
      data: { itemId, eventType: "MARKET_INTELLIGENCE_RESULT", payload: JSON.stringify(result) },
    });

    return NextResponse.json({ success: true, result });
  } catch (e) {
    console.error("[market-intelligence POST]", e);
    return NextResponse.json({ error: "Market intelligence failed" }, { status: 500 });
  }
}
