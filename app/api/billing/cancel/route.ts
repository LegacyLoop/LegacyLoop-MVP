import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { calculateProRate } from "@/lib/billing/pro-rate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit("payments", ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) } });
    }

    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { refundType } = await req.json().catch(() => ({ refundType: "none" }));
    if (!["credits", "cash", "none"].includes(refundType)) return NextResponse.json({ error: "Invalid refund type" }, { status: 400 });

    const sub = await prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
    if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

    const proRate = calculateProRate(sub.price, new Date(sub.currentPeriodStart));
    let refundAmount = 0;

    if (refundType === "credits") {
      // Add platform credits
      let uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
      if (!uc) uc = await prisma.userCredits.create({ data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 } });
      await prisma.userCredits.update({ where: { id: uc.id }, data: { balance: uc.balance + proRate.creditsEquivalent, lifetime: uc.lifetime + proRate.creditsEquivalent } });
      await prisma.creditTransaction.create({ data: { userCreditsId: uc.id, type: "REFUND", amount: proRate.creditsEquivalent, balance: uc.balance + proRate.creditsEquivalent, description: `Subscription cancellation refund (${proRate.daysRemaining} days)` } });
      refundAmount = proRate.creditsEquivalent;
    } else if (refundType === "cash") {
      refundAmount = proRate.cashRefundAmount;
      // Stripe refund would go here in production
    }

    await prisma.subscription.update({ where: { id: sub.id }, data: { status: "CANCELLED" } });
    await prisma.user.update({ where: { id: user.id }, data: { tier: 1 } }); // Drop to free

    const eventType = refundType === "credits" ? "SUBSCRIPTION_CANCELLED_CREDITS" : refundType === "cash" ? "SUBSCRIPTION_CANCELLED_CASH" : "SUBSCRIPTION_CANCELLED_NOREFUND";
    await prisma.userEvent.create({
      data: { userId: user.id, eventType, metadata: JSON.stringify({ tier: sub.tier, daysRemaining: proRate.daysRemaining, refundAmount, refundType }) },
    });

    return NextResponse.json({ success: true, refundType, refundAmount, effectiveDate: sub.currentPeriodEnd });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
  }
}
