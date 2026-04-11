import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured, getOrCreateStripeCustomer } from "@/lib/stripe";
import { sendEmail } from "@/lib/email/send";
import { whiteGloveBalanceDueEmail } from "@/lib/email/templates";

/**
 * POST /api/white-glove/complete
 * Marks a White Glove service as complete and creates PaymentIntent for 40% balance + add-ons.
 * Called by admin or service team after estate work is done.
 *
 * CMD-WAVE2-WHITE-GLOVE-ESTATE-CARE
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { bookingId, addOns } = body;

    if (!bookingId) return NextResponse.json({ error: "Booking ID required" }, { status: 400 });

    const booking = await prisma.whiteGloveBooking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!["BOOKED", "IN_PROGRESS"].includes(booking.status)) {
      return NextResponse.json({ error: "Booking is not in a completable state" }, { status: 400 });
    }

    // Calculate add-ons
    const addOnsList: { name: string; amount: number }[] = Array.isArray(addOns) ? addOns : [];
    const addOnsTotal = addOnsList.reduce((sum, a) => sum + (a.amount || 0), 0);
    const finalBalance = Math.round((booking.balanceAmount + addOnsTotal) * 100) / 100;

    let clientSecret: string | null = null;

    if (isConfigured && stripe && finalBalance > 0) {
      const fullUser = await prisma.user.findUnique({ where: { id: booking.userId }, select: { id: true, email: true, displayName: true, stripeCustomerId: true } });
      const stripeCustomerId = fullUser ? await getOrCreateStripeCustomer(fullUser) : null;

      const pi = await stripe.paymentIntents.create({
        amount: Math.round(finalBalance * 100),
        currency: "usd",
        ...(stripeCustomerId ? { customer: stripeCustomerId, receipt_email: fullUser?.email } : {}),
        description: `LegacyLoop White Glove ${booking.tier} — Balance Due`,
        metadata: {
          type: "white_glove_balance",
          userId: booking.userId,
          bookingId: booking.id,
          tier: booking.tier,
          addOnsTotal: addOnsTotal.toString(),
        },
      });
      clientSecret = pi.client_secret;
    } else {
      clientSecret = `demo_wg_balance_${Date.now()}`;
    }

    await prisma.whiteGloveBooking.update({
      where: { id: bookingId },
      data: {
        status: "IN_PROGRESS",
        addOnsTotal,
        addOnsDetail: addOnsList.length > 0 ? JSON.stringify(addOnsList) : null,
      },
    });

    // Send balance due email
    const bookingUser = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true, displayName: true } });
    if (bookingUser?.email) {
      const name = bookingUser.displayName?.split(" ")[0] ?? "there";
      const emailContent = whiteGloveBalanceDueEmail(name, booking.tier, booking.balanceAmount, addOnsList, finalBalance);
      sendEmail({ to: bookingUser.email, ...emailContent });
    }

    return NextResponse.json({
      ok: true,
      clientSecret,
      bookingId,
      baseBalance: booking.balanceAmount,
      addOnsTotal,
      finalBalance,
    });
  } catch (err) {
    console.error("[white-glove/complete] Error:", err);
    return NextResponse.json({ error: "Failed to process completion." }, { status: 500 });
  }
}
