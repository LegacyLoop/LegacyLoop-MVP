import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isOfferExpired, getOfferExpiry } from "@/lib/offers/expiry";
import { notifyBuyerCountered } from "@/lib/offers/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { offerId } = await params;
    const body = await req.json().catch(() => ({}));
    const { counterPrice, message } = body;

    if (!counterPrice || Number(counterPrice) <= 0) {
      return NextResponse.json({ error: "Counter price must be greater than 0" }, { status: 400 });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { item: { select: { id: true, title: true, userId: true } } },
    });

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    if (offer.sellerId !== user.id) return NextResponse.json({ error: "Not your offer" }, { status: 403 });

    if (isOfferExpired(offer)) {
      await prisma.offer.update({ where: { id: offerId }, data: { status: "EXPIRED" } });
      return NextResponse.json({ error: "Offer has expired" }, { status: 400 });
    }

    if (offer.status !== "PENDING" && offer.status !== "COUNTERED") {
      return NextResponse.json({ error: `Cannot counter offer with status: ${offer.status}` }, { status: 400 });
    }

    const counterPriceCents = Math.round(Number(counterPrice) * 100);

    // Update offer
    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: "COUNTERED",
        currentPrice: counterPriceCents,
        round: offer.round + 1,
        expiresAt: getOfferExpiry(),
      },
    });

    // OfferEvent
    await prisma.offerEvent.create({
      data: {
        offerId,
        actorType: "SELLER",
        action: "COUNTERED",
        price: counterPriceCents,
        message: message || null,
      },
    });

    // Message in conversation thread
    if (offer.conversationId) {
      try {
        await prisma.message.create({
          data: {
            conversationId: offer.conversationId,
            sender: "seller",
            content: `COUNTER OFFER: Seller countered at $${Number(counterPrice).toFixed(2)}. Awaiting buyer response.${message ? `\n\n${message}` : ""}`,
          },
        });
      } catch (e) { /* non-fatal */ }
    }

    // EventLog
    try {
      await prisma.eventLog.create({
        data: {
          itemId: offer.itemId,
          eventType: "offer_countered",
          payload: JSON.stringify({ offerId, counterPrice: counterPriceCents, round: updated.round, buyerName: offer.buyerName }),
        },
      });
    } catch (e) { /* non-fatal */ }

    // Notify buyer with magic link
    try {
      await notifyBuyerCountered({
        offer: updated,
        item: offer.item,
        buyerName: offer.buyerName,
        buyerEmail: offer.buyerEmail,
        counterPrice: Number(counterPrice),
      });
    } catch (e) { /* non-fatal */ }

    return NextResponse.json({ success: true, offer: updated });
  } catch (e: any) {
    console.error("[offer-counter]", e);
    return NextResponse.json({ error: "Failed to counter offer" }, { status: 500 });
  }
}
