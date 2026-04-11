import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured, getOrCreateStripeCustomer, createStripeSubscription } from "@/lib/stripe";
import { getOrCreateStripePrice } from "@/lib/stripe-products";
import { calculateProRate } from "@/lib/billing/pro-rate";
import { PLANS, TIER_NUMBER_TO_KEY, calculateTierPrice } from "@/lib/constants/pricing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordPayment } from "@/lib/services/payment-ledger";

/** Map legacy tier keys (from TIER_NUMBER_TO_KEY) to PLANS keys */
const LEGACY_TO_PLAN: Record<string, keyof typeof PLANS> = {
  free: "FREE",
  starter: "DIY_SELLER",
  plus: "POWER_SELLER",
  pro: "ESTATE_MANAGER",
};

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit("payments", ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } });
    }

    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newTier, billing } = await req.json().catch(() => ({ newTier: null, billing: "monthly" }));
    if (!newTier || newTier <= user.tier) return NextResponse.json({ error: "Invalid upgrade tier" }, { status: 400 });

    const sub = await prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
    if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

    const newTierKey = TIER_NUMBER_TO_KEY[newTier] || "free";
    const newPlanKey = LEGACY_TO_PLAN[newTierKey] || "FREE";
    const newPlan = PLANS[newPlanKey];
    if (!newPlan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const billingPeriod = billing === "annual" ? "annual" : "monthly";
    const isHero = (user as any).heroVerified ?? false;
    const newPrice = calculateTierPrice(newTierKey, billingPeriod, true, isHero);
    const proRate = calculateProRate(sub.price, new Date(sub.currentPeriodStart), newPrice);
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // When Stripe is configured — use Stripe Billing
    if (isConfigured && stripe && newPrice > 0) {
      try {
        const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, displayName: true, stripeCustomerId: true } });
        const stripeCustomerId = fullUser ? await getOrCreateStripeCustomer(fullUser) : null;

        if (!stripeCustomerId) {
          return NextResponse.json({ error: "Could not create payment customer. Please try again." }, { status: 500 });
        }

        const stripePriceId = await getOrCreateStripePrice(newTierKey, billingPeriod as "monthly" | "annual");
        if (!stripePriceId) {
          return NextResponse.json({ error: "Pricing configuration error. Please contact support." }, { status: 500 });
        }

        // ── PATH A: Update existing Stripe subscription (prorated) ──
        if (sub.stripeSubscriptionId) {
          const existingSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
          const itemId = existingSub.items.data[0]?.id;

          if (itemId) {
            const updatedSub = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
              items: [{ id: itemId, price: stripePriceId }],
              proration_behavior: "create_prorations",
              metadata: { userId: user.id, tier: newTierKey.toUpperCase(), billingPeriod, legacyloop_type: "subscription" },
            });

            // Update local DB immediately (Stripe handles billing)
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { tier: newTierKey.toUpperCase(), price: newPrice, billingPeriod, stripeSubscriptionId: updatedSub.id },
            }).catch(() => {});
            await prisma.user.update({ where: { id: user.id }, data: { tier: newTier } }).catch(() => {});

            await prisma.userEvent.create({
              data: { userId: user.id, eventType: "SUBSCRIPTION_UPGRADED", metadata: JSON.stringify({ fromTier: sub.tier, toTier: newTierKey.toUpperCase(), prorated: true }) },
            }).catch(() => {});

            return NextResponse.json({
              success: true,
              newPlan: newPlan.name,
              charged: newPrice,
              credited: proRate.creditForUnused,
              prorated: true,
              effectiveNow: true,
              nextBillingDate: new Date(((updatedSub as any).current_period_end ?? 0) * 1000).toISOString(),
            });
          }
        }

        // ── PATH B: New Stripe subscription (from free tier or no existing sub) ──
        const subscription = await createStripeSubscription(stripeCustomerId, stripePriceId, {
          legacyloop_type: "subscription",
          userId: user.id,
          tier: newTierKey.toUpperCase(),
          billingPeriod,
        });

        if (!subscription) {
          return NextResponse.json({ error: "Could not create subscription. Please try again." }, { status: 500 });
        }

        const invoice = subscription.latest_invoice as any;
        const pi = invoice?.payment_intent as import("stripe").default.PaymentIntent;
        const clientSecret = pi?.client_secret;

        if (!clientSecret) {
          return NextResponse.json({ error: "Payment setup incomplete. Please try again." }, { status: 500 });
        }

        await recordPayment(user.id, "subscription", newPrice, `${newPlan.name} plan — ${billingPeriod}`, {
          stripePaymentId: pi.id,
          metadata: { tier: newTierKey.toUpperCase(), billingPeriod, stripeSubscriptionId: subscription.id, fromTier: sub.tier },
        });

        return NextResponse.json({
          success: true,
          clientSecret,
          subscriptionId: subscription.id,
          newPlan: newPlan.name,
          charged: newPrice,
          credited: proRate.creditForUnused,
          pendingConfirmation: true,
        });
      } catch (stripeErr) {
        console.error("Stripe subscription error:", stripeErr);
        return NextResponse.json({ error: "Payment processing failed. Please try again." }, { status: 500 });
      }
    }

    // Demo mode or $0 upgrade — activate immediately
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { tier: newTierKey.toUpperCase(), price: newPrice, billingPeriod, commission: newPlan.commission, currentPeriodStart: now, currentPeriodEnd: periodEnd },
    });

    await prisma.user.update({ where: { id: user.id }, data: { tier: newTier } });

    await prisma.userEvent.create({
      data: { userId: user.id, eventType: "SUBSCRIPTION_UPGRADED", metadata: JSON.stringify({ fromTier: sub.tier, toTier: newTierKey.toUpperCase(), charged: proRate.upgradeCharge, credited: proRate.creditForUnused }) },
    });

    return NextResponse.json({ success: true, newPlan: newPlan.name, charged: proRate.upgradeCharge, credited: proRate.creditForUnused, effectiveNow: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
  }
}
