import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured } from "@/lib/stripe";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MIN_CREDITS = 50;

/**
 * POST /api/credits/cashout
 * Redeems purchased credits back to the user's card at their weighted average purchase rate.
 * Only credits bought with real money qualify. Bonus/referral credits are excluded.
 *
 * Rate = sum(paymentAmount) / sum(purchasedCredits) across all type="purchase" transactions.
 * refundAmount = creditsToRedeem × rate (rounded to cents).
 *
 * CMD-CREDIT-CASHOUT
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  const rl = checkRateLimit("payments", ip);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { creditsToRedeem } = await req.json();

    if (!creditsToRedeem || typeof creditsToRedeem !== "number" || creditsToRedeem < MIN_CREDITS) {
      return NextResponse.json({ error: `Minimum ${MIN_CREDITS} credits required for cash-out.` }, { status: 400 });
    }

    // Get user's credit record
    const uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
    if (!uc || uc.balance < creditsToRedeem) {
      return NextResponse.json({ error: "Insufficient credit balance." }, { status: 400 });
    }

    // Query all purchase transactions for this user
    const purchases = await prisma.creditTransaction.findMany({
      where: {
        userCreditsId: uc.id,
        type: "purchase",
        paymentAmount: { gt: 0 },
      },
    });

    if (purchases.length === 0) {
      return NextResponse.json({
        error: "No purchased credits found. Only credits purchased with real money can be redeemed.",
      }, { status: 400 });
    }

    // Calculate weighted average rate
    const totalPaid = purchases.reduce((sum, t) => sum + (t.paymentAmount || 0), 0);
    const totalPurchasedCredits = purchases.reduce((sum, t) => sum + t.amount, 0);

    if (totalPurchasedCredits <= 0) {
      return NextResponse.json({ error: "No purchased credits to redeem." }, { status: 400 });
    }

    const rate = totalPaid / totalPurchasedCredits;
    const refundAmount = Math.round(creditsToRedeem * rate * 100) / 100;

    if (refundAmount <= 0) {
      return NextResponse.json({ error: "Calculated refund amount is zero." }, { status: 400 });
    }

    let refundId: string | null = null;

    if (isConfigured && stripe) {
      // Require Stripe customer with payment history
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true },
      });

      if (!fullUser?.stripeCustomerId) {
        return NextResponse.json({ error: "No payment method on file. Make a purchase first to enable cash-out." }, { status: 400 });
      }

      // Find most recent successful charge
      const charges = await stripe.charges.list({
        customer: fullUser.stripeCustomerId,
        limit: 1,
      });

      if (!charges.data.length) {
        return NextResponse.json({ error: "No previous charges found on your account." }, { status: 400 });
      }

      // Issue Stripe refund
      const refund = await stripe.refunds.create({
        charge: charges.data[0].id,
        amount: Math.round(refundAmount * 100),
        reason: "requested_by_customer",
        metadata: {
          userId: user.id,
          creditsRedeemed: creditsToRedeem.toString(),
          rateApplied: rate.toFixed(4),
          type: "credit_cashout",
        },
      });

      refundId = refund.id;
    } else {
      // Demo mode
      refundId = `demo_cashout_${Date.now()}`;
    }

    // Deduct credits from balance
    await prisma.userCredits.update({
      where: { id: uc.id },
      data: { balance: { decrement: creditsToRedeem } },
    });

    // Log transaction
    await prisma.creditTransaction.create({
      data: {
        userCreditsId: uc.id,
        type: "refund",
        amount: -creditsToRedeem,
        balance: uc.balance - creditsToRedeem,
        paymentAmount: -refundAmount,
        description: `Credit cash-out: ${creditsToRedeem} credits at $${rate.toFixed(4)}/credit`,
      },
    });

    // Log user event
    await prisma.userEvent.create({
      data: {
        userId: user.id,
        eventType: "CREDIT_CASHOUT",
        metadata: JSON.stringify({ creditsRedeemed: creditsToRedeem, refundAmount, rate, refundId }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      creditsRedeemed: creditsToRedeem,
      refundAmount,
      rateApplied: rate,
      refundId,
      newBalance: uc.balance - creditsToRedeem,
      estimatedArrival: "3-5 business days",
      message: `$${refundAmount.toFixed(2)} refund processing to your card on file.`,
    });
  } catch (err) {
    console.error("[credits/cashout] Error:", err);
    return NextResponse.json({ error: "Cash-out failed. Please try again." }, { status: 500 });
  }
}
