import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/offers/active
 * List active offers for the authenticated seller.
 * Query params:
 *   ?all=true — include expired/declined/accepted too
 *   ?itemId=X — filter to a specific item
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = req.nextUrl;
    const showAll = url.searchParams.get("all") === "true";
    const itemId = url.searchParams.get("itemId");

    const where: any = { sellerId: user.id };

    if (!showAll) {
      where.status = { in: ["PENDING", "COUNTERED"] };
    }

    if (itemId) {
      where.itemId = itemId;
    }

    const offers = await prisma.offer.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            title: true,
            listingPrice: true,
            photos: { take: 1, orderBy: { order: "asc" }, select: { filePath: true } },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      offers: offers.map((o) => ({
        id: o.id,
        itemId: o.itemId,
        itemTitle: o.item.title,
        itemPhoto: o.item.photos[0]?.filePath || null,
        listingPrice: o.item.listingPrice,
        buyerName: o.buyerName,
        buyerEmail: o.buyerEmail,
        status: o.status,
        currentPrice: o.currentPrice,
        originalPrice: o.originalPrice,
        round: o.round,
        expiresAt: o.expiresAt,
        conversationId: o.conversationId,
        createdAt: o.createdAt,
        events: o.events.map((e) => ({
          id: e.id,
          actorType: e.actorType,
          action: e.action,
          price: e.price,
          message: e.message,
          createdAt: e.createdAt,
        })),
      })),
    });
  } catch (e: any) {
    console.error("[offers-active]", e);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}
