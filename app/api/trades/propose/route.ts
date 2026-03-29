import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    const body = await req.json().catch(() => null);
    if (!body?.itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
    if (!Array.isArray(body.proposedItems) || body.proposedItems.length === 0) {
      return NextResponse.json({ error: "At least one trade item is required" }, { status: 400 });
    }
    for (const item of body.proposedItems) {
      if (!item.title || !item.estimatedValue || Number(item.estimatedValue) <= 0) {
        return NextResponse.json({ error: "Each trade item needs a title and estimated value > 0" }, { status: 400 });
      }
    }

    const item = await prisma.item.findUnique({ where: { id: body.itemId }, select: { userId: true, title: true, status: true } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const TRADE_ALLOWED = ["LISTED", "INTERESTED", "READY", "ANALYZED"];
    if (!TRADE_ALLOWED.includes(item.status)) {
      return NextResponse.json({ error: `Trades are not available for items with status "${item.status}". Item must be listed or ready.` }, { status: 400 });
    }

    // Check minCashAdded from seller trade settings
    const settingsLog = await prisma.eventLog.findFirst({
      where: { itemId: body.itemId, eventType: "TRADE_SETTINGS_UPDATED" },
      orderBy: { createdAt: "desc" },
    });
    if (settingsLog) {
      try {
        const settings = JSON.parse(settingsLog.payload || "{}");
        const minCash = Number(settings.minCashAdded) || 0;
        if (minCash > 0 && (Number(body.cashAdded) || 0) < minCash) {
          return NextResponse.json({ error: `This seller requires at least $${minCash} cash added to any trade.`, minCashRequired: minCash }, { status: 400 });
        }
      } catch { /* settings parse error — proceed */ }
    }

    const totalValue = body.proposedItems.reduce((sum: number, i: any) => sum + Number(i.estimatedValue), 0) + (Number(body.cashAdded) || 0);

    const log = await prisma.eventLog.create({
      data: {
        itemId: body.itemId,
        eventType: "TRADE_PROPOSED",
        payload: JSON.stringify({
          proposerId: user?.id || null,
          proposerName: body.buyerName || user?.email || "Anonymous",
          proposerEmail: body.buyerEmail || user?.email || null,
          proposedItems: body.proposedItems,
          cashAdded: Number(body.cashAdded) || 0,
          totalValue: Math.round(totalValue * 100) / 100,
          buyerNote: body.buyerNote || null,
          status: "PENDING",
        }),
      },
    });

    // Notification event for seller
    await prisma.eventLog.create({
      data: {
        itemId: body.itemId,
        eventType: "TRADE_NOTIFICATION",
        payload: JSON.stringify({
          tradeId: log.id,
          message: `New trade proposal received (${body.proposedItems.length} item${body.proposedItems.length > 1 ? "s" : ""}, ~$${Math.round(totalValue)})`,
        }),
      },
    });

    return NextResponse.json({ success: true, tradeId: log.id, message: "Trade proposal sent! The seller will review your offer." });
  } catch (err: any) {
    console.error("[trades/propose]", err);
    return NextResponse.json({ error: "Failed to submit trade proposal" }, { status: 500 });
  }
}
