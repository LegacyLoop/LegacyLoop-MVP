import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isOfferExpired } from "@/lib/offers/expiry";
import { notifyBuyerAccepted } from "@/lib/offers/notify";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { offerId } = await params;

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
      return NextResponse.json({ error: `Cannot accept offer with status: ${offer.status}` }, { status: 400 });
    }

    // Update offer
    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status: "ACCEPTED" },
    });

    // OfferEvent
    await prisma.offerEvent.create({
      data: {
        offerId,
        actorType: "SELLER",
        action: "ACCEPTED",
        price: offer.currentPrice,
      },
    });

    // Update item status
    await prisma.item.update({
      where: { id: offer.itemId },
      data: { status: "INTERESTED" },
    });

    // Message in conversation thread
    if (offer.conversationId) {
      try {
        await prisma.message.create({
          data: {
            conversationId: offer.conversationId,
            sender: "seller",
            content: `OFFER ACCEPTED: Seller accepted $${(offer.currentPrice / 100).toFixed(2)}. Sale pending.`,
          },
        });
      } catch (e) { /* non-fatal */ }
    }

    // EventLog
    try {
      await prisma.eventLog.create({
        data: {
          itemId: offer.itemId,
          eventType: "offer_accepted",
          payload: JSON.stringify({ offerId, price: offer.currentPrice, buyerName: offer.buyerName }),
        },
      });
    } catch (e) { /* non-fatal */ }

    // Notify buyer
    try {
      await notifyBuyerAccepted({
        offer: updated,
        item: offer.item,
        buyerName: offer.buyerName,
        buyerEmail: offer.buyerEmail,
        sellerId: offer.sellerId,
      });
    } catch (e) { /* non-fatal */ }

    const priceInDollars = (offer.currentPrice / 100).toFixed(2);
    return NextResponse.json({
      success: true,
      offer: updated,
      checkoutUrl: `/store/${offer.sellerId}/item/${offer.itemId}?offeredPrice=${priceInDollars}`,
    });
  } catch (e: any) {
    console.error("[offer-accept]", e);
    return NextResponse.json({ error: "Failed to accept offer" }, { status: 500 });
  }
}
