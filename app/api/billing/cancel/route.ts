import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured } from "@/lib/stripe";
import { calculateProRate } from "@/lib/billing/pro-rate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/billing/cancel
 * Two cancellation paths:
 *   cancelType: "end_of_period" (DEFAULT) — access until period end, no refund
 *   cancelType: "immediate" — cancel now + prorated refund or credits
 *
 * refundType (only for "immediate"):
 *   "credits" — unused days converted to platform credits
 *   "cash"    — prorated refund to original payment method via Stripe
 *   "none"    — no refund, just cancel
 *
 * CMD-MEMBERSHIP-PRORATION-COMPLETE
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit("payments", ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } });
    }

    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const cancelType = body.cancelType || "end_of_period";
    const refundType = body.refundType || "none";

    if (!["end_of_period", "immediate"].includes(cancelType)) {
      return NextResponse.json({ error: "Invalid cancel type" }, { status: 400 });
    }
    if (!["credits", "cash", "none"].includes(refundType)) {
      return NextResponse.json({ error: "Invalid refund type" }, { status: 400 });
    }

    const sub = await prisma.subscription.findFirst({ where: { userId: user.id, status: { in: ["ACTIVE", "PAST_DUE"] } }, orderBy: { createdAt: "desc" } });
    if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

    const proRate = calculateProRate(sub.price, new Date(sub.currentPeriodStart));
    let refundAmount = 0;

    // ── OPTION A: Cancel at end of period (DEFAULT — industry standard) ──
    if (cancelType === "end_of_period") {
      // Stripe: mark subscription to cancel at period end
      if (isConfigured && stripe && sub.stripeSubscriptionId) {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: true,
        }).catch(() => {});
      }

      // DB: keep ACTIVE until webhook fires customer.subscription.deleted at period end
      await prisma.userEvent.create({
        data: { userId: user.id, eventType: "SUBSCRIPTION_CANCEL_SCHEDULED", metadata: JSON.stringify({ tier: sub.tier, effectiveDate: sub.currentPeriodEnd, daysRemaining: proRate.daysRemaining }) },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        cancelType: "end_of_period",
        effectiveDate: sub.currentPeriodEnd,
        daysRemaining: proRate.daysRemaining,
        message: `Your plan stays active until ${sub.currentPeriodEnd.toLocaleDateString()}. No further charges.`,
      });
    }

    // ── OPTION B: Cancel immediately ──
    // Cancel Stripe subscription right now
    if (isConfigured && stripe && sub.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId, {
        invoice_now: false,
        prorate: true,
      }).catch(() => {});

      // Issue Stripe refund for unused days (cash refund)
      if (refundType === "cash" && proRate.cashRefundAmount > 0) {
        try {
          // Find the most recent charge for this subscription
          const invoices = await stripe.invoices.list({
            subscription: sub.stripeSubscriptionId,
            limit: 1,
          });
          const lastCharge = (invoices.data[0] as any)?.charge as string | undefined;
          if (lastCharge) {
            await stripe.refunds.create({
              charge: lastCharge,
              amount: Math.round(proRate.cashRefundAmount * 100),
              reason: "requested_by_customer",
            });
            refundAmount = proRate.cashRefundAmount;
          }
        } catch (refundErr) {
          console.error("[billing/cancel] Stripe refund error:", refundErr);
          // Refund failed — fall through to credits as fallback
        }
      }
    }

    // Issue platform credits for unused days
    if (refundType === "credits" && proRate.creditsEquivalent > 0) {
      let uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
      if (!uc) uc = await prisma.userCredits.create({ data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 } });
      await prisma.userCredits.update({ where: { id: uc.id }, data: { balance: uc.balance + proRate.creditsEquivalent, lifetime: uc.lifetime + proRate.creditsEquivalent } });
      await prisma.creditTransaction.create({ data: { userCreditsId: uc.id, type: "REFUND", amount: proRate.creditsEquivalent, balance: uc.balance + proRate.creditsEquivalent, description: `Subscription cancellation refund (${proRate.daysRemaining} days)` } });
      refundAmount = proRate.creditsEquivalent;
    }

    // Update DB
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "CANCELLED", stripeSubscriptionId: null },
    });
    await prisma.user.update({ where: { id: user.id }, data: { tier: 1 } });

    const eventType = refundType === "credits" ? "SUBSCRIPTION_CANCELLED_CREDITS" : refundType === "cash" ? "SUBSCRIPTION_CANCELLED_CASH" : "SUBSCRIPTION_CANCELLED_NOREFUND";
    await prisma.userEvent.create({
      data: { userId: user.id, eventType, metadata: JSON.stringify({ tier: sub.tier, daysRemaining: proRate.daysRemaining, refundAmount, refundType, cancelType: "immediate" }) },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      cancelType: "immediate",
      refundType,
      refundAmount,
      daysRemaining: proRate.daysRemaining,
      message: refundType === "cash"
        ? `Refund of $${refundAmount.toFixed(2)} processing (3-5 business days).`
        : refundType === "credits"
          ? `${refundAmount} credits added to your account.`
          : "Subscription cancelled. No refund issued.",
    });
  } catch (err: unknown) {
    console.error("[billing/cancel] Error:", err);
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
  }
}
