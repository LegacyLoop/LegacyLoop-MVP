import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured } from "@/lib/stripe";

/**
 * POST /api/white-glove/cancel
 * Cancels a White Glove booking with refund policy enforcement.
 *
 * Policy:
 *   Within 48 hours of booking: full deposit refund
 *   After 48 hours, before service starts: 50% deposit refund
 *   After service starts (IN_PROGRESS): no refund
 *
 * CMD-WAVE2-WHITE-GLOVE-ESTATE-CARE
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { bookingId, reason } = await req.json();
    if (!bookingId) return NextResponse.json({ error: "Booking ID required" }, { status: 400 });

    const booking = await prisma.whiteGloveBooking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.userId !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
      return NextResponse.json({ error: "Booking cannot be cancelled" }, { status: 400 });
    }

    const now = new Date();
    const hoursSinceBooking = (now.getTime() - booking.createdAt.getTime()) / (1000 * 60 * 60);
    let refundAmount = 0;
    let refundStripeId: string | null = null;

    if (booking.status === "IN_PROGRESS") {
      // Service already started — no refund
      refundAmount = 0;
    } else if (hoursSinceBooking <= 48) {
      // Within 48-hour grace period — full deposit refund
      refundAmount = booking.depositAmount;
    } else {
      // After 48 hours but before service — 50% deposit refund
      refundAmount = Math.round(booking.depositAmount * 0.50 * 100) / 100;
    }

    // Issue Stripe refund if applicable
    if (isConfigured && stripe && refundAmount > 0 && booking.depositStripePaymentId && booking.depositPaid) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.depositStripePaymentId,
          amount: Math.round(refundAmount * 100),
          reason: "requested_by_customer",
        });
        refundStripeId = refund.id;
      } catch (refundErr) {
        console.error("[white-glove/cancel] Refund error:", refundErr);
        // Continue with cancellation even if refund fails — flag in response
      }
    }

    await prisma.whiteGloveBooking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancellationReason: reason || null,
        refundAmount,
        refundStripeId,
      },
    });

    await prisma.userEvent.create({
      data: {
        userId: user.id,
        eventType: "WHITE_GLOVE_CANCELLED",
        metadata: JSON.stringify({ bookingId, tier: booking.tier, refundAmount, hoursSinceBooking: Math.round(hoursSinceBooking), reason }),
      },
    }).catch(() => {});

    const policyNote = booking.status === "IN_PROGRESS"
      ? "Service already in progress — no refund per our cancellation policy."
      : hoursSinceBooking <= 48
        ? "Cancelled within 48-hour grace period — full deposit refund processing."
        : "Cancelled after 48-hour grace period — 50% deposit refund processing.";

    return NextResponse.json({
      ok: true,
      refundAmount,
      refundStripeId,
      policyNote,
      message: refundAmount > 0
        ? `Refund of $${refundAmount.toFixed(2)} processing (3-5 business days).`
        : "Booking cancelled. No refund applicable.",
    });
  } catch (err) {
    console.error("[white-glove/cancel] Error:", err);
    return NextResponse.json({ error: "Cancellation failed." }, { status: 500 });
  }
}
