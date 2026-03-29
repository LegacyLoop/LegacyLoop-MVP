import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { PROCESSING_FEE } from "@/lib/constants/pricing";
import crypto from "crypto";
import { sendReturnNotification } from "@/lib/email/send";
import { returnRequestedSellerEmail, returnRequestedBuyerEmail } from "@/lib/email/templates";

/**
 * POST /api/refunds — Buyer requests a return/refund
 * Body: { itemId, reason, description? }
 *
 * GET /api/refunds — Get refund requests for logged-in user (as seller)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, reason, description, buyerEmail } = body;

    if (!itemId || !reason) {
      return NextResponse.json({ error: "Missing itemId or reason" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, title: true, userId: true, status: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.status !== "SOLD" && item.status !== "SHIPPED" && item.status !== "COMPLETED") {
      return NextResponse.json({ error: "Item is not in a refundable state" }, { status: 400 });
    }

    // Find the payment ledger entry for this item
    const ledgerEntries = await prisma.paymentLedger.findMany({
      where: { type: "item_purchase" },
      orderBy: { createdAt: "desc" },
    });

    // Find the matching entry by checking metadata
    let matchedLedger = null;
    for (const entry of ledgerEntries) {
      try {
        const meta = entry.metadata ? JSON.parse(entry.metadata) : {};
        if (meta.itemId === itemId) {
          matchedLedger = entry;
          break;
        }
      } catch { /* skip */ }
    }

    // Find seller earnings for this item
    const sellerEarning = await prisma.sellerEarnings.findFirst({
      where: { itemId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate refund: processing fee is NON-REFUNDABLE
    const saleAmount = sellerEarning?.saleAmount ?? matchedLedger?.subtotal ?? 0;
    const processingFee = matchedLedger?.processingFee ?? Math.round(saleAmount * PROCESSING_FEE.rate * 100) / 100;
    const refundAmount = saleAmount; // Refund item price only, NOT the processing fee

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: item.userId,
        type: "REFUND_REQUEST",
        title: "Refund Requested",
        message: `A buyer has requested a refund for "${item.title || "your item"}" ($${refundAmount.toFixed(2)}). Reason: ${reason}`,
        link: `/items/${item.id}`,
      },
    }).catch(() => {});

    // Generate return token for buyer magic link
    const returnToken = crypto.randomBytes(32).toString("hex");

    // Log the event
    await prisma.eventLog.create({
      data: {
        itemId: item.id,
        eventType: "refund_requested",
        payload: JSON.stringify({
          reason,
          description,
          buyerEmail,
          buyerName: body.buyerName || null,
          returnToken,
          saleAmount,
          processingFee,
          refundAmount,
          processingFeeNote: "NON-REFUNDABLE",
          requestedAt: new Date().toISOString(),
        }),
      },
    }).catch(() => {});

    // Send email notifications (non-critical)
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${APP_URL}/returns/${returnToken}`;
    try {
      if (item.userId) {
        await sendReturnNotification(
          buyerEmail || "",
          `Return request submitted — ${item.title}`,
          returnRequestedBuyerEmail(item.title || "your item", reason, refundAmount)
        );
      }
      // Notify seller via email (seller email from user record)
      const seller = await prisma.user.findUnique({ where: { id: item.userId }, select: { email: true } });
      if (seller?.email) {
        await sendReturnNotification(
          seller.email,
          `Return requested for ${item.title}`,
          returnRequestedSellerEmail(item.title || "item", buyerEmail || "Unknown buyer", reason, refundAmount, returnUrl)
        );
      }
    } catch { /* email non-critical */ }

    return NextResponse.json({
      ok: true,
      refundAmount,
      processingFee,
      processingFeeRefunded: false,
      note: "Processing fee is non-refundable per our terms.",
    });
  } catch (err) {
    console.error("Refund request error:", err);
    return NextResponse.json({ error: "Failed to process refund request" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get refund-related events for seller's items
  const sellerItems = await prisma.item.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const itemIds = sellerItems.map((i) => i.id);

  if (itemIds.length === 0) {
    return NextResponse.json({ refunds: [] });
  }

  const refundEvents = await prisma.eventLog.findMany({
    where: {
      itemId: { in: itemIds },
      eventType: { in: ["refund_requested", "refund_approved", "refund_denied"] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    refunds: refundEvents.map((e) => ({
      id: e.id,
      itemId: e.itemId,
      type: e.eventType,
      data: e.payload ? JSON.parse(e.payload) : {},
      createdAt: e.createdAt,
    })),
  });
}
