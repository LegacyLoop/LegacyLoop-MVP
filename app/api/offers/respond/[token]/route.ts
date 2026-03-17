import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOfferExpired, getOfferExpiry } from "@/lib/offers/expiry";
import { notifySellerBuyerResponded } from "@/lib/offers/notify";

/**
 * GET /api/offers/respond/[token]
 * Fetch offer state for buyer magic link — no auth required
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const offer = await prisma.offer.findUnique({
      where: { buyerToken: token },
      include: {
        item: {
          select: {
            id: true, title: true, description: true, listingPrice: true,
            photos: { orderBy: { order: "asc" }, take: 3, select: { filePath: true, isPrimary: true, caption: true } },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    const expired = isOfferExpired(offer);

    // Auto-expire if needed
    if (expired && offer.status !== "EXPIRED" && offer.status !== "ACCEPTED" && offer.status !== "DECLINED") {
      await prisma.offer.update({ where: { id: offer.id }, data: { status: "EXPIRED" } });
      // Return item to LISTED
      try {
        await prisma.item.update({ where: { id: offer.itemId }, data: { status: "LISTED" } });
      } catch (e) { /* non-fatal */ }
    }

    return NextResponse.json({
      expired: expired && offer.status !== "ACCEPTED",
      offer: {
        id: offer.id,
        status: expired && offer.status !== "ACCEPTED" && offer.status !== "DECLINED" ? "EXPIRED" : offer.status,
        currentPrice: offer.currentPrice,
        originalPrice: offer.originalPrice,
        round: offer.round,
        expiresAt: offer.expiresAt,
        buyerName: offer.buyerName,
        createdAt: offer.createdAt,
      },
      item: offer.item,
      events: offer.events.map((e) => ({
        id: e.id,
        actorType: e.actorType,
        action: e.action,
        price: e.price,
        message: e.message,
        createdAt: e.createdAt,
      })),
    });
  } catch (e: any) {
    console.error("[offer-respond GET]", e);
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
  }
}

/**
 * POST /api/offers/respond/[token]
 * Buyer responds to offer via magic link — no auth required
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json().catch(() => ({}));
    const { action, counterPrice, message } = body;

    if (!action || !["ACCEPT", "DECLINE", "COUNTER"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const offer = await prisma.offer.findUnique({
      where: { buyerToken: token },
      include: { item: { select: { id: true, title: true, userId: true } } },
    });

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    // Check expiry
    if (isOfferExpired(offer)) {
      if (offer.status !== "EXPIRED" && offer.status !== "ACCEPTED" && offer.status !== "DECLINED") {
        await prisma.offer.update({ where: { id: offer.id }, data: { status: "EXPIRED" } });
        try {
          await prisma.item.update({ where: { id: offer.itemId }, data: { status: "LISTED" } });
        } catch (e) { /* non-fatal */ }
      }
      return NextResponse.json({ error: "Offer has expired" }, { status: 400 });
    }

    // Validate current status allows response
    if (offer.status !== "PENDING" && offer.status !== "COUNTERED") {
      return NextResponse.json({ error: `Cannot respond to offer with status: ${offer.status}` }, { status: 400 });
    }

    if (action === "ACCEPT") {
      await prisma.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });

      await prisma.offerEvent.create({
        data: { offerId: offer.id, actorType: "BUYER", action: "ACCEPTED", price: offer.currentPrice, message: message || null },
      });

      await prisma.item.update({ where: { id: offer.itemId }, data: { status: "INTERESTED" } });

      if (offer.conversationId) {
        try {
          await prisma.message.create({
            data: { conversationId: offer.conversationId, sender: "buyer", content: `OFFER ACCEPTED: Buyer accepted $${(offer.currentPrice / 100).toFixed(2)}.` },
          });
        } catch (e) { /* non-fatal */ }
      }

      try {
        await prisma.eventLog.create({
          data: { itemId: offer.itemId, eventType: "offer_accepted_by_buyer", payload: JSON.stringify({ offerId: offer.id, price: offer.currentPrice }) },
        });
      } catch (e) { /* non-fatal */ }

      try {
        await notifySellerBuyerResponded({ offer, item: offer.item, buyerName: offer.buyerName, action: "ACCEPTED" });
      } catch (e) { /* non-fatal */ }

      const priceInDollars = (offer.currentPrice / 100).toFixed(2);
      return NextResponse.json({
        success: true,
        action: "ACCEPTED",
        checkoutUrl: `/store/${offer.sellerId}/item/${offer.itemId}?offeredPrice=${priceInDollars}`,
      });
    }

    if (action === "DECLINE") {
      await prisma.offer.update({ where: { id: offer.id }, data: { status: "DECLINED" } });

      await prisma.offerEvent.create({
        data: { offerId: offer.id, actorType: "BUYER", action: "DECLINED", price: offer.currentPrice, message: message || null },
      });

      await prisma.item.update({ where: { id: offer.itemId }, data: { status: "LISTED" } });

      if (offer.conversationId) {
        try {
          await prisma.message.create({
            data: { conversationId: offer.conversationId, sender: "buyer", content: "OFFER WITHDRAWN: Buyer declined the counter offer." },
          });
        } catch (e) { /* non-fatal */ }
      }

      try {
        await prisma.eventLog.create({
          data: { itemId: offer.itemId, eventType: "offer_declined_by_buyer", payload: JSON.stringify({ offerId: offer.id, price: offer.currentPrice }) },
        });
      } catch (e) { /* non-fatal */ }

      try {
        await notifySellerBuyerResponded({ offer, item: offer.item, buyerName: offer.buyerName, action: "DECLINED" });
      } catch (e) { /* non-fatal */ }

      return NextResponse.json({ success: true, action: "DECLINED" });
    }

    if (action === "COUNTER") {
      if (!counterPrice || Number(counterPrice) <= 0) {
        return NextResponse.json({ error: "Counter price must be greater than 0" }, { status: 400 });
      }

      const counterPriceCents = Math.round(Number(counterPrice) * 100);

      const updated = await prisma.offer.update({
        where: { id: offer.id },
        data: {
          status: "COUNTERED",
          currentPrice: counterPriceCents,
          round: offer.round + 1,
          expiresAt: getOfferExpiry(),
        },
      });

      await prisma.offerEvent.create({
        data: { offerId: offer.id, actorType: "BUYER", action: "COUNTERED", price: counterPriceCents, message: message || null },
      });

      if (offer.conversationId) {
        try {
          await prisma.message.create({
            data: { conversationId: offer.conversationId, sender: "buyer", content: `COUNTER OFFER: Buyer countered at $${Number(counterPrice).toFixed(2)}.${message ? `\n\n${message}` : ""}` },
          });
        } catch (e) { /* non-fatal */ }
      }

      try {
        await prisma.eventLog.create({
          data: { itemId: offer.itemId, eventType: "offer_countered_by_buyer", payload: JSON.stringify({ offerId: offer.id, counterPrice: counterPriceCents, round: updated.round }) },
        });
      } catch (e) { /* non-fatal */ }

      try {
        await notifySellerBuyerResponded({ offer: updated, item: offer.item, buyerName: offer.buyerName, action: "COUNTERED", counterPrice: Number(counterPrice) });
      } catch (e) { /* non-fatal */ }

      return NextResponse.json({ success: true, action: "COUNTERED", offer: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    console.error("[offer-respond POST]", e);
    return NextResponse.json({ error: "Failed to process response" }, { status: 500 });
  }
}
