import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { calculateUpgradeCredit } from "@/lib/services/refund-calculator";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const TIER_PRICES: Record<string, number> = {
  FREE: 0,
  STARTER: 20,
  PLUS: 49,
  PRO: 99,
};

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit("payments", ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } });
  }

  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { newTier } = body;

  if (!newTier || !TIER_PRICES[newTier]) {
    return new Response("Invalid tier", { status: 400 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
  });

  if (!subscription) {
    return new Response("No active subscription found", { status: 404 });
  }

  const newTierPrice = TIER_PRICES[newTier];
  const { creditFromCurrent, amountDue } = calculateUpgradeCredit(
    subscription.price,
    subscription.currentPeriodStart,
    subscription.currentPeriodEnd,
    newTierPrice
  );

  const now = new Date();
  const nextPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const change = await prisma.subscriptionChange.create({
    data: {
      userId: user.id,
      fromTier: subscription.tier,
      toTier: newTier,
      changeType: "upgrade",
      amountPaid: subscription.price,
      daysUsed: Math.round((now.getTime() - subscription.currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)),
      daysRemaining: Math.round((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      proratedRefund: creditFromCurrent,
      creditIssued: 0,
      originalPeriodStart: subscription.currentPeriodStart,
      originalPeriodEnd: subscription.currentPeriodEnd,
      refundMethod: "credit_applied",
    },
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      tier: newTier,
      price: newTierPrice,
      currentPeriodStart: now,
      currentPeriodEnd: nextPeriodEnd,
    },
  });

  return Response.json({ ok: true, amountDue, creditApplied: creditFromCurrent, change });
}
