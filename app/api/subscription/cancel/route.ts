import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { calculateProratedRefund } from "@/lib/services/refund-calculator";

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { refundMethod, reason } = body;

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
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
      refundMethod: refundMethod || "original_payment",
      reason: reason || null,
    },
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "CANCELLED" },
  });

  let creditsAdded = 0;
  if (refundMethod === "account_credit" && creditIssued > 0) {
    const creditsInCents = Math.round(creditIssued); // 1 credit = $1 for demo
    await prisma.userCredits.upsert({
      where: { userId: user.id },
      update: {
        balance: { increment: creditsInCents },
        lifetime: { increment: creditsInCents },
      },
      create: {
        userId: user.id,
        balance: creditsInCents,
        lifetime: creditsInCents,
      },
    });
    creditsAdded = creditsInCents;
  }

  return Response.json({ ok: true, change, refund, creditsAdded });
}
