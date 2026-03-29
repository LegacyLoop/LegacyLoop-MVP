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

    // Create a conversation with the offer
    const conversation = await prisma.conversation.create({
      data: {
        itemId: item.id,
        buyerName,
        buyerEmail,
        platform: "legacyloop",
      },
    });

    // Create the offer message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "buyer",
        content: `OFFER: $${Number(amount).toFixed(2)}${message ? `\n\n${message}` : ""}`,
      },
    });

    // Update item status to OFFER_PENDING
    if (item.status !== "SOLD" && item.status !== "OFFER_PENDING") {
      await prisma.item.update({
        where: { id: item.id },
        data: { status: "OFFER_PENDING" },
      });
    }

    // Create structured Offer record
    const offer = await prisma.offer.create({
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
    await prisma.offerEvent.create({
      data: {
        offerId: offer.id,
        actorType: "BUYER",
        action: "SUBMITTED",
        price: Math.round(Number(amount) * 100),
        message: message || null,
      },
    });

    // Add structured offer message to conversation thread
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "buyer",
        content: `OFFER SUBMITTED: ${buyerName} offered $${Number(amount).toFixed(2)} for ${item.title || "item"}. Offer ID: ${offer.id}`,
      },
    });

    // Notify seller (email + in-app via centralized lib)
    try {
      await notifySellerNewOffer({ offer, item, buyerName, buyerEmail, offerAmount: Number(amount) });
    } catch (e) { /* notification is optional */ }

    // Record in event log
    try {
      await prisma.eventLog.create({
        data: {
          itemId: item.id,
          eventType: "offer_received",
          payload: JSON.stringify({ buyerName, amount, buyerEmail, offerId: offer.id }),
        },
      });
    } catch (e) { /* optional */ }

    return NextResponse.json({ ok: true, conversationId: conversation.id, offerId: offer.id });
  } catch (err) {
    console.error("Offer error:", err);
    return NextResponse.json({ error: "Failed to submit offer" }, { status: 500 });
  }
}
