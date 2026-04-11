import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured, getOrCreateStripeCustomer } from "@/lib/stripe";
import { calculateWhiteGlovePrice } from "@/lib/constants/pricing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const VALID_TIERS = ["essentials", "professional", "legacy"];
const VALID_TYPES = ["ESTATE_SALE", "NEIGHBORHOOD_BUNDLE"];

/**
 * POST /api/white-glove/book
 * Creates a White Glove booking with 60% deposit via Stripe PaymentIntent.
 * 40% balance collected on service completion.
 *
 * CMD-WAVE2-WHITE-GLOVE-ESTATE-CARE
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const rl = checkRateLimit("payments", ip);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const body = await req.json();
    const { tier, serviceType, scheduledDate, clientNotes, heroesDiscount } = body;

    if (!tier || !VALID_TIERS.includes(tier.toLowerCase())) {
      return NextResponse.json({ error: "Invalid service tier" }, { status: 400 });
    }
    if (!serviceType || !VALID_TYPES.includes(serviceType)) {
      return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
    }

    const isPreLaunch = process.env.PRE_LAUNCH !== "false";
    const isHero = heroesDiscount && (user as any).heroVerified;
    const totalAmount = calculateWhiteGlovePrice(tier, isPreLaunch, isHero);
    const depositAmount = Math.round(totalAmount * 0.60 * 100) / 100;
    const balanceAmount = Math.round(totalAmount * 0.40 * 100) / 100;

    let clientSecret: string | null = null;
    let stripePaymentId: string | null = null;

    if (isConfigured && stripe) {
      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, displayName: true, stripeCustomerId: true } });
      const stripeCustomerId = fullUser ? await getOrCreateStripeCustomer(fullUser) : null;

      const pi = await stripe.paymentIntents.create({
        amount: Math.round(depositAmount * 100),
        currency: "usd",
        ...(stripeCustomerId ? { customer: stripeCustomerId, receipt_email: user.email } : {}),
        description: `LegacyLoop White Glove ${tier.charAt(0).toUpperCase() + tier.slice(1)} — Booking Deposit (60%)`,
        metadata: {
          type: "white_glove_deposit",
          userId: user.id,
          tier: tier.toLowerCase(),
          serviceType,
          totalAmount: totalAmount.toString(),
          balanceAmount: balanceAmount.toString(),
        },
      });

      clientSecret = pi.client_secret;
      stripePaymentId = pi.id;
    } else {
      clientSecret = `demo_wg_deposit_${Date.now()}`;
      stripePaymentId = clientSecret;
    }

    const booking = await prisma.whiteGloveBooking.create({
      data: {
        userId: user.id,
        tier: tier.toUpperCase(),
        serviceType,
        totalAmount,
        depositAmount,
        balanceAmount,
        status: "PENDING_DEPOSIT",
        heroesDiscount: !!isHero,
        scheduledAt: scheduledDate ? new Date(scheduledDate) : null,
        clientNotes: clientNotes || null,
        depositStripePaymentId: stripePaymentId,
      },
    });

    return NextResponse.json({
      ok: true,
      clientSecret,
      bookingId: booking.id,
      depositAmount,
      balanceAmount,
      totalAmount,
      tier: tier.toUpperCase(),
      heroesDiscount: !!isHero,
    });
  } catch (err) {
    console.error("[white-glove/book] Error:", err);
    return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}
