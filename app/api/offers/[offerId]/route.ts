import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isOfferExpired } from "@/lib/offers/expiry";

/**
 * GET /api/offers/[offerId]
 * Fetch full offer detail for the authenticated seller.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { offerId } = await params;

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            description: true,
            listingPrice: true,
            status: true,
            photos: { orderBy: { order: "asc" }, take: 4, select: { filePath: true, isPrimary: true, caption: true } },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    if (offer.sellerId !== user.id) return NextResponse.json({ error: "Not your offer" }, { status: 403 });

    const expired = isOfferExpired(offer);

    return NextResponse.json({
      offer: {
        id: offer.id,
        itemId: offer.itemId,
        buyerName: offer.buyerName,
        buyerEmail: offer.buyerEmail,
        status: expired && !["ACCEPTED", "DECLINED", "EXPIRED"].includes(offer.status) ? "EXPIRED" : offer.status,
        currentPrice: offer.currentPrice,
        originalPrice: offer.originalPrice,
        round: offer.round,
        expiresAt: offer.expiresAt,
        conversationId: offer.conversationId,
        createdAt: offer.createdAt,
        expired,
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
    console.error("[offer-detail]", e);
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
  }
}
