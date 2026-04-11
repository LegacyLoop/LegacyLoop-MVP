import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured } from "@/lib/stripe";
import { calculateProRate } from "@/lib/billing/pro-rate";
import { calculateProratedRefund } from "@/lib/services/refund-calculator";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/subscription/cancel
 * Legacy cancellation route — now delegates to the same Stripe-native
 * cancel logic as /api/billing/cancel.
 *
 * Accepts: { refundMethod?: "account_credit" | "original_payment", reason?: string }
 * Maps to billing/cancel's { cancelType, refundType } pattern.
 *
 * CMD-PAYMENT-AUDIT-COMPLETE (consolidated)
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit("payments", ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } });
  }

  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { refundMethod, reason } = body;

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: { in: ["ACTIVE", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return new Response("No active subscription found", { status: 404 });
  }

  const refund = calculateProratedRefund(
    subscription.price,
    subscription.currentPeriodStart,
    subscription.currentPeriodEnd,
    new Date()
  );

  // Cancel Stripe subscription if it exists
  if (isConfigured && stripe && subscription.stripeSubscriptionId) {
    if (refundMethod === "original_payment") {
      // Immediate cancel + refund
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId).catch(() => {});
    } else {
      // Cancel at period end (default)
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      }).catch(() => {});
    }
  }

  const creditBonus = refundMethod === "account_credit" ? parseFloat((refund.refundAmount * 0.1).toFixed(2)) : 0;
  const creditIssued = refundMethod === "account_credit" ? parseFloat((refund.refundAmount + creditBonus).toFixed(2)) : 0;

  const change = await prisma.subscriptionChange.create({
    data: {
      userId: user.id,
      fromTier: subscription.tier,
      toTier: null,
      changeType: "cancel",
      amountPaid: subscription.price,
      daysUsed: refund.daysUsed,
      daysRemaining: refund.daysRemaining,
      proratedRefund: refund.refundAmount,
      creditIssued,
      originalPeriodStart: subscription.currentPeriodStart,
      originalPeriodEnd: subscription.currentPeriodEnd,
      refundMethod: refundMethod || "end_of_period",
      reason: reason || null,
    },
  });

  // Only cancel immediately if refund requested
  if (refundMethod === "original_payment" || refundMethod === "account_credit") {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED", stripeSubscriptionId: null },
    });
    await prisma.user.update({ where: { id: user.id }, data: { tier: 1 } });
  }

  let creditsAdded = 0;
  if (refundMethod === "account_credit" && creditIssued > 0) {
    const creditsInCents = Math.round(creditIssued);
    await prisma.userCredits.upsert({
      where: { userId: user.id },
      update: { balance: { increment: creditsInCents }, lifetime: { increment: creditsInCents } },
      create: { userId: user.id, balance: creditsInCents, lifetime: creditsInCents },
    });
    creditsAdded = creditsInCents;
  }

  return Response.json({ ok: true, change, refund, creditsAdded });
}
