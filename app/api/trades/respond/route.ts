import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/constants/pricing";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body?.tradeId || !body?.action) return NextResponse.json({ error: "tradeId and action required" }, { status: 400 });
    if (!["ACCEPT", "DECLINE", "COUNTER"].includes(body.action)) {
      return NextResponse.json({ error: "action must be ACCEPT, DECLINE, or COUNTER" }, { status: 400 });
    }

    const tradeLog = await prisma.eventLog.findUnique({ where: { id: body.tradeId } });
    if (!tradeLog || tradeLog.eventType !== "TRADE_PROPOSED") {
      return NextResponse.json({ error: "Trade proposal not found" }, { status: 404 });
    }

    const item = await prisma.item.findUnique({ where: { id: tradeLog.itemId }, select: { userId: true, id: true } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id && !isDemoMode()) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const proposal = JSON.parse(tradeLog.payload || "{}");

    await prisma.eventLog.create({
      data: {
        itemId: tradeLog.itemId,
        eventType: "TRADE_RESPONDED",
        payload: JSON.stringify({
          tradeId: body.tradeId,
          action: body.action,
          sellerNote: body.sellerNote || null,
          counterItems: body.counterItems || null,
          counterCash: body.counterCash || null,
          respondedBy: user.id,
        }),
      },
    });

    if (body.action === "ACCEPT") {
      const soldPrice = Math.round(proposal.totalValue || 0);
      await prisma.item.update({
        where: { id: tradeLog.itemId },
        data: { status: "SOLD", soldPrice, soldAt: new Date() },
      });
      await prisma.eventLog.create({
        data: {
          itemId: tradeLog.itemId,
          eventType: "SOLD_PRICE_CAPTURED",
          payload: JSON.stringify({
            soldPrice,
            soldVia: "trade",
            tradeId: body.tradeId,
            proposedItems: proposal.proposedItems,
            cashAdded: proposal.cashAdded,
          }),
        },
      });
    }

    const messages: Record<string, string> = {
      ACCEPT: "Trade accepted! The item has been marked as sold.",
      DECLINE: "Trade declined.",
      COUNTER: "Counter-proposal sent to buyer.",
    };

    return NextResponse.json({ success: true, action: body.action, message: messages[body.action] });
  } catch (err: any) {
    console.error("[trades/respond]", err);
    return NextResponse.json({ error: "Failed to respond to trade" }, { status: 500 });
  }
}
