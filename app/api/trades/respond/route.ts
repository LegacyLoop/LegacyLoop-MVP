import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/constants/pricing";
import { sendTradeNotification } from "@/lib/email/send";
import { tradeAcceptedEmail, tradeDeclinedEmail, tradeCounteredEmail } from "@/lib/email/templates";

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

    // Create counter-proposal event so buyer can see it
    if (body.action === "COUNTER" && (body.counterItems?.length > 0 || body.counterCash)) {
      await prisma.eventLog.create({
        data: {
          itemId: tradeLog.itemId,
          eventType: "TRADE_COUNTER_PROPOSED",
          payload: JSON.stringify({
            originalTradeId: body.tradeId,
            counterItems: body.counterItems || [],
            counterCash: Number(body.counterCash) || 0,
            counterTotal: (body.counterItems || []).reduce((s: number, i: any) => s + (Number(i.estimatedValue) || 0), 0) + (Number(body.counterCash) || 0),
            sellerNote: body.sellerNote || null,
            proposedBy: user.id,
          }),
        },
      });
    }

    // Create in-app notification for buyer
    if (proposal.proposerEmail || proposal.proposerId) {
      const buyerMsg = body.action === "ACCEPT" ? `Your trade proposal was accepted!`
        : body.action === "DECLINE" ? `Your trade proposal was declined.`
        : `The seller sent a counter-proposal — check the details.`;
      await prisma.notification.create({
        data: {
          userId: proposal.proposerId || "unknown",
          title: `Trade ${body.action.toLowerCase()}`,
          message: buyerMsg,
          type: "trade",
          link: `/items/${tradeLog.itemId}`,
        },
      }).catch(() => {}); // Non-critical — don't fail the response

      // Send trade email notification to buyer
      if (proposal.proposerEmail) {
        try {
          const itemRecord = await prisma.item.findUnique({ where: { id: tradeLog.itemId }, select: { title: true } });
          const itemTitle = itemRecord?.title || "your item";
          if (body.action === "ACCEPT") {
            await sendTradeNotification(proposal.proposerEmail, `Trade Accepted — ${itemTitle}`, tradeAcceptedEmail(itemTitle, proposal.totalValue || 0));
          } else if (body.action === "DECLINE") {
            await sendTradeNotification(proposal.proposerEmail, `Trade Declined — ${itemTitle}`, tradeDeclinedEmail(itemTitle));
          } else if (body.action === "COUNTER") {
            await sendTradeNotification(proposal.proposerEmail, `Counter-Proposal — ${itemTitle}`, tradeCounteredEmail(itemTitle, Number(body.counterCash) || 0, body.sellerNote || null));
          }
        } catch { /* email is non-critical */ }
      }
    }

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
