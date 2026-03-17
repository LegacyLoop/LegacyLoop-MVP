import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/constants/pricing";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;
    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id && !isDemoMode()) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const tradeEnabled = body.tradeEnabled === true;
    const minCashAdded = body.minCashAdded != null ? Number(body.minCashAdded) : null;

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "TRADE_SETTINGS_UPDATED",
        payload: JSON.stringify({ tradeEnabled, minCashAdded, updatedBy: user.id }),
      },
    });

    return NextResponse.json({ success: true, tradeEnabled, minCashAdded });
  } catch (err: any) {
    console.error("[trade-settings]", err);
    return NextResponse.json({ error: "Failed to update trade settings" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const latest = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "TRADE_SETTINGS_UPDATED" },
      orderBy: { createdAt: "desc" },
    });
    if (!latest) return NextResponse.json({ tradeEnabled: false, minCashAdded: null });
    const data = JSON.parse(latest.payload || "{}");
    return NextResponse.json({ tradeEnabled: data.tradeEnabled ?? false, minCashAdded: data.minCashAdded ?? null });
  } catch {
    return NextResponse.json({ tradeEnabled: false, minCashAdded: null });
  }
}
