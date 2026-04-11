import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured } from "@/lib/stripe";
import { getOrCreateStripePrice } from "@/lib/stripe-products";
import { calculateProRate } from "@/lib/billing/pro-rate";
import { PLANS, TIER_NUMBER_TO_KEY, calculateTierPrice } from "@/lib/constants/pricing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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

    const { newTier } = await req.json().catch(() => ({ newTier: null }));
    if (!newTier || newTier >= user.tier) return NextResponse.json({ error: "Invalid downgrade tier" }, { status: 400 });
    if (newTier < 1) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

    const sub = await prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
    if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

    const newTierKey = TIER_NUMBER_TO_KEY[newTier] || "free";
    const newPlanKey = LEGACY_TO_PLAN[newTierKey] || "FREE";
    const newPlan = PLANS[newPlanKey];
    if (!newPlan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const isHero = (user as any).heroVerified ?? false;
    const newPrice = calculateTierPrice(newTierKey, "monthly", true, isHero);
    const proRate = calculateProRate(sub.price, new Date(sub.currentPeriodStart), newPrice);

    // ── Stripe path: update existing subscription with proration ──
    if (isConfigured && stripe && sub.stripeSubscriptionId) {
      try {
        const stripePriceId = await getOrCreateStripePrice(newTierKey, "monthly");
        if (!stripePriceId) {
          return NextResponse.json({ error: "Pricing configuration error." }, { status: 500 });
        }

        const existingSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
        const itemId = existingSub.items.data[0]?.id;

        if (itemId) {
          // Stripe creates a negative proration (credit applied to next invoice)
          await stripe.subscriptions.update(sub.stripeSubscriptionId, {
            items: [{ id: itemId, price: stripePriceId }],
            proration_behavior: "create_prorations",
            metadata: { userId: user.id, tier: newTierKey.toUpperCase(), billingPeriod: "monthly", legacyloop_type: "subscription" },
          });
        }

        // Downgrade to free = cancel Stripe subscription entirely
        if (newTier === 1) {
          await stripe.subscriptions.cancel(sub.stripeSubscriptionId).catch(() => {});
        }
      } catch (stripeErr) {
        console.error("Stripe downgrade error:", stripeErr);
        // Fall through to DB update — Stripe failure shouldn't block downgrade
      }
    }

    // ── DB update (always runs — demo + live) ──
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        tier: newTierKey.toUpperCase(),
        price: newPrice,
        commission: newPlan.commission,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        ...(newTier === 1 ? { stripeSubscriptionId: null, status: "CANCELLED" } : {}),
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { tier: newTier } });

    // Issue platform credits for unused portion (demo mode + as goodwill in live)
    if (proRate.creditsEquivalent > 0) {
      let uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
      if (!uc) uc = await prisma.userCredits.create({ data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 } });
      await prisma.userCredits.update({ where: { id: uc.id }, data: { balance: uc.balance + proRate.creditsEquivalent, lifetime: uc.lifetime + proRate.creditsEquivalent } });
      await prisma.creditTransaction.create({ data: { userCreditsId: uc.id, type: "refund", amount: proRate.creditsEquivalent, balance: uc.balance + proRate.creditsEquivalent, description: `Downgrade credit (${proRate.daysRemaining} days unused on ${sub.tier})` } });
    }

    await prisma.userEvent.create({
      data: { userId: user.id, eventType: "SUBSCRIPTION_DOWNGRADED", metadata: JSON.stringify({ fromTier: sub.tier, toTier: newTierKey.toUpperCase(), credited: proRate.creditForUnused, creditsIssued: proRate.creditsEquivalent }) },
    });

    return NextResponse.json({ success: true, newPlan: newPlan.name, creditsIssued: proRate.creditsEquivalent, credited: proRate.creditForUnused, effectiveNow: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Downgrade failed" }, { status: 500 });
  }
}
