import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured, getOrCreateStripeCustomer, createStripeSubscription } from "@/lib/stripe";
import { getOrCreateStripePrice } from "@/lib/stripe-products";
import { ESTATE_CONTRACTS, DISCOUNTS } from "@/lib/constants/pricing";
import { recordPayment } from "@/lib/services/payment-ledger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const VALID_TYPES = ["MONTHLY", "THREE_MONTH", "FULL_RESOLUTION"] as const;
type ContractType = typeof VALID_TYPES[number];

const CONTRACT_MAP: Record<ContractType, { key: keyof typeof ESTATE_CONTRACTS; months: number }> = {
  MONTHLY: { key: "monthly", months: 1 },
  THREE_MONTH: { key: "quarterly", months: 3 },
  FULL_RESOLUTION: { key: "biannual", months: 6 },
};

/**
 * POST /api/estate-care/subscribe
 * Creates an Estate Care Contract.
 * MONTHLY → Stripe Subscription (auto-renews)
 * THREE_MONTH + FULL_RESOLUTION → Stripe PaymentIntent (one-time)
 *
 * CMD-WAVE2-ESTATE-CARE-CONTRACTS
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const rl = checkRateLimit("payments", ip);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const body = await req.json();
    const { contractType, heroesDiscount } = body;

    if (!contractType || !VALID_TYPES.includes(contractType)) {
      return NextResponse.json({ error: "Invalid contract type" }, { status: 400 });
    }

    const isPreLaunch = process.env.PRE_LAUNCH !== "false";
    const isHero = heroesDiscount && (user as any).heroVerified;
    const contractConfig = CONTRACT_MAP[contractType as ContractType];
    const pricing = ESTATE_CONTRACTS[contractConfig.key];

    let amount: number = isPreLaunch ? pricing.preLaunch : pricing.price;
    if (isHero) {
      amount = Math.round(amount * (1 - DISCOUNTS.heroes.whiteGloveDiscount));
    }

    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + contractConfig.months);

    let clientSecret: string | null = null;
    let stripeSubId: string | null = null;
    let stripePaymentId: string | null = null;

    if (isConfigured && stripe) {
      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, displayName: true, stripeCustomerId: true } });
      const stripeCustomerId = fullUser ? await getOrCreateStripeCustomer(fullUser) : null;

      if (contractType === "MONTHLY" && stripeCustomerId) {
        // Recurring subscription via Stripe Billing
        const stripePriceId = await getOrCreateStripePrice("estate_care_monthly", "monthly");

        // If no pre-built price, create a one-off Price for estate care
        if (!stripePriceId) {
          // Fallback: create PaymentIntent instead
          const pi = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            customer: stripeCustomerId,
            receipt_email: user.email,
            description: `${pricing.name} — Estate Care Contract`,
            metadata: { type: "estate_care", userId: user.id, contractType },
          });
          clientSecret = pi.client_secret;
          stripePaymentId = pi.id;
        } else {
          const sub = await createStripeSubscription(stripeCustomerId, stripePriceId, {
            legacyloop_type: "estate_care",
            userId: user.id,
            contractType,
          });
          if (sub) {
            const invoice = sub.latest_invoice as any;
            const pi = invoice?.payment_intent as import("stripe").default.PaymentIntent;
            clientSecret = pi?.client_secret ?? null;
            stripeSubId = sub.id;
            stripePaymentId = pi?.id ?? null;
          }
        }
      } else if (stripeCustomerId) {
        // One-time PaymentIntent for 3-month and full resolution
        const pi = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "usd",
          customer: stripeCustomerId,
          receipt_email: user.email,
          description: `${pricing.name} — Estate Care Contract`,
          metadata: { type: "estate_care", userId: user.id, contractType },
        });
        clientSecret = pi.client_secret;
        stripePaymentId = pi.id;
      }
    } else {
      // Demo mode
      clientSecret = `demo_estate_care_${Date.now()}`;
      stripePaymentId = clientSecret;
    }

    if (stripePaymentId) {
      await recordPayment(user.id, "estate_care", amount, `${pricing.name} — Estate Care`, {
        stripePaymentId,
        metadata: { contractType, heroesDiscount: !!isHero },
      });
    }

    const contract = await prisma.estateCareContract.create({
      data: {
        userId: user.id,
        contractType,
        totalAmount: amount,
        prelaunchPricing: isPreLaunch,
        heroesDiscount: !!isHero,
        stripeSubscriptionId: stripeSubId,
        stripePaymentId,
        status: "ACTIVE",
        endsAt: contractType !== "MONTHLY" ? endsAt : null,
      },
    });

    return NextResponse.json({
      ok: true,
      clientSecret,
      contractId: contract.id,
      contractType,
      amount,
      name: pricing.name,
      ...(stripeSubId ? { subscriptionId: stripeSubId } : {}),
    });
  } catch (err) {
    console.error("[estate-care/subscribe] Error:", err);
    return NextResponse.json({ error: "Failed to create contract." }, { status: 500 });
  }
}
