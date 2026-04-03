import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateBuyerToken, getOfferExpiry } from "@/lib/offers/expiry";
import { notifySellerNewOffer } from "@/lib/offers/notify";

/**
 * POST /api/offers — Submit a buyer offer on an item
 * No auth required (buyers don't have accounts)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, buyerName, buyerEmail, amount, message } = body;

    if (!itemId || !buyerName || !buyerEmail || !amount || amount <= 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, title: true, userId: true, status: true },
    });

    if (!item || !["LISTED", "INTERESTED", "ANALYZED", "READY"].includes(item.status)) {
      return NextResponse.json({ error: "Item not available" }, { status: 400 });
    }

    // ── Transactional offer creation — all or nothing ──
    const result = await prisma.$transaction(async (tx) => {
      // Create a conversation with the offer
      const conversation = await tx.conversation.create({
        data: {
          itemId: item.id,
          buyerName,
          buyerEmail,
          platform: "legacyloop",
        },
      });

      // Create the offer message
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          sender: "buyer",
          content: `OFFER: $${Number(amount).toFixed(2)}${message ? `\n\n${message}` : ""}`,
        },
      });

      // Update item status to OFFER_PENDING
      if (item.status !== "SOLD" && item.status !== "OFFER_PENDING") {
        await tx.item.update({
          where: { id: item.id },
          data: { status: "OFFER_PENDING" },
        });
      }

      // Create structured Offer record
      const offer = await tx.offer.create({
        data: {
          itemId: item.id,
          sellerId: item.userId,
          conversationId: conversation.id,
          buyerName,
          buyerEmail,
          buyerToken: generateBuyerToken(),
          status: "PENDING",
          currentPrice: Math.round(Number(amount) * 100),
          originalPrice: Math.round(Number(amount) * 100),
          round: 1,
          expiresAt: getOfferExpiry(body.expiryHours ? Number(body.expiryHours) : undefined),
        },
      });

      // Create OfferEvent for data collection
      await tx.offerEvent.create({
        data: {
          offerId: offer.id,
          actorType: "BUYER",
          action: "SUBMITTED",
          price: Math.round(Number(amount) * 100),
          message: message || null,
        },
      });

      // Add structured offer message to conversation thread
      await tx.message.create({
        data: {
          conversationId: conversation.id,
          sender: "buyer",
          content: `OFFER SUBMITTED: ${buyerName} offered $${Number(amount).toFixed(2)} for ${item.title || "item"}. Offer ID: ${offer.id}`,
        },
      });

      // Record in event log
      await tx.eventLog.create({
        data: {
          itemId: item.id,
          eventType: "offer_received",
          payload: JSON.stringify({ buyerName, amount, buyerEmail, offerId: offer.id }),
        },
      });

      return { conversationId: conversation.id, offerId: offer.id, offer };
    });

    // Notify seller OUTSIDE transaction (non-critical, fire-and-forget)
    try {
      await notifySellerNewOffer({ offer: result.offer, item, buyerName, buyerEmail, offerAmount: Number(amount) });
    } catch { /* notification is optional */ }

    return NextResponse.json({ ok: true, conversationId: result.conversationId, offerId: result.offerId });
  } catch (err) {
    console.error("Offer error:", err);
    return NextResponse.json({ error: "Failed to submit offer" }, { status: 500 });
  }
}
