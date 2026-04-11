import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured } from "@/lib/stripe";

/**
 * POST /api/estate-care/cancel
 * Cancels an Estate Care Contract.
 * MONTHLY: cancel_at_period_end (Stripe handles)
 * THREE_MONTH / FULL_RESOLUTION: DB update only (one-time, no Stripe sub)
 *
 * CMD-WAVE2-ESTATE-CARE-CONTRACTS
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { contractId } = await req.json();
    if (!contractId) return NextResponse.json({ error: "Contract ID required" }, { status: 400 });

    const contract = await prisma.estateCareContract.findUnique({ where: { id: contractId } });
    if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    if (contract.userId !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    if (contract.status === "CANCELLED") return NextResponse.json({ error: "Already cancelled" }, { status: 400 });

    // MONTHLY with Stripe subscription — cancel at period end
    if (contract.stripeSubscriptionId && isConfigured && stripe) {
      await stripe.subscriptions.update(contract.stripeSubscriptionId, {
        cancel_at_period_end: true,
      }).catch(() => {});

      await prisma.userEvent.create({
        data: {
          userId: user.id,
          eventType: "ESTATE_CARE_CANCEL_SCHEDULED",
          metadata: JSON.stringify({ contractId, contractType: contract.contractType }),
        },
      }).catch(() => {});

      return NextResponse.json({
        ok: true,
        message: "Your monthly estate care will cancel at the end of the current billing period. No further charges.",
        cancelType: "end_of_period",
      });
    }

    // ONE-TIME contracts (THREE_MONTH / FULL_RESOLUTION) — DB update only
    await prisma.estateCareContract.update({
      where: { id: contractId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await prisma.userEvent.create({
      data: {
        userId: user.id,
        eventType: "ESTATE_CARE_CANCELLED",
        metadata: JSON.stringify({ contractId, contractType: contract.contractType }),
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      message: "Estate care contract cancelled.",
      cancelType: "immediate",
    });
  } catch (err) {
    console.error("[estate-care/cancel] Error:", err);
    return NextResponse.json({ error: "Cancellation failed." }, { status: 500 });
  }
}
