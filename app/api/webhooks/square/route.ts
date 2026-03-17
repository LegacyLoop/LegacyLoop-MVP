import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordPayment } from "@/lib/services/payment-ledger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.type;

    // TODO: Validate webhook signature when SQUARE_WEBHOOK_SIGNATURE_KEY is configured
    // For now, process all events in sandbox

    if (eventType === "payment.completed") {
      const payment = body.data?.object?.payment;
      if (!payment)
        return NextResponse.json({ received: true }, { status: 200 });

      const squarePaymentId = payment.id;

      // Idempotency check — never double-process
      const existing = await prisma.paymentLedger.findUnique({
        where: { squarePaymentId },
      });
      if (existing) {
        return NextResponse.json(
          { received: true, message: "Already processed" },
          { status: 200 }
        );
      }

      // Extract metadata from the payment note or order reference
      const note = payment.note || "";
      const amountCents = Number(payment.amountMoney?.amount ?? 0);
      const amountDollars = amountCents / 100;

      // Determine payment type from note/metadata
      let paymentType = "unknown";
      let description = "Square payment";
      let userId: string | null = null;
      let metadata: Record<string, unknown> = {};

      // Parse note format: "type:value|userId:value|..."
      if (note) {
        const parts = note.split("|");
        for (const part of parts) {
          const [key, val] = part.split(":");
          if (key === "type") paymentType = val;
          if (key === "userId") userId = val;
          if (key === "desc") description = val;
          metadata[key] = val;
        }
      }

      // Only record if we have a userId
      if (userId) {
        await recordPayment(userId, paymentType, amountDollars, description, {
          squarePaymentId,
          squareOrderId: payment.orderId,
          metadata,
        });

        // Fulfill based on type
        if (paymentType === "credit_pack") {
          const credits = Number(metadata.credits ?? 0);
          if (credits > 0) {
            const uc = await prisma.userCredits.findUnique({
              where: { userId },
            });
            if (uc) {
              await prisma.userCredits.update({
                where: { userId },
                data: {
                  balance: { increment: credits },
                  lifetime: { increment: credits },
                },
              });
              await prisma.creditTransaction.create({
                data: {
                  userCreditsId: uc.id,
                  type: "purchase",
                  amount: credits,
                  balance: uc.balance + credits,
                  description: `Purchased ${credits} credits`,
                  paymentAmount: amountDollars,
                },
              });
            }
          }
        }

        if (paymentType === "subscription") {
          const tier = String(metadata.tier ?? "STARTER");
          // Update or create subscription
          const existingSub = await prisma.subscription.findFirst({
            where: { userId, status: "ACTIVE" },
          });
          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: { tier, price: amountDollars, status: "ACTIVE" },
            });
          }
        }
      }
    }

    if (eventType === "payment.failed") {
      // Log failure for monitoring
      const payment = body.data?.object?.payment;
      console.error("Square payment failed:", payment?.id);
    }

    if (eventType === "refund.completed") {
      const refund = body.data?.object?.refund;
      const paymentId = refund?.paymentId;
      if (paymentId) {
        const ledgerEntry = await prisma.paymentLedger.findUnique({
          where: { squarePaymentId: paymentId },
        });
        if (ledgerEntry) {
          await prisma.paymentLedger.update({
            where: { id: ledgerEntry.id },
            data: { status: "refunded" },
          });
        }
      }
    }

    // Always return 200 immediately so Square doesn't retry
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    // Still return 200 so Square doesn't retry
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
