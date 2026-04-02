// SECURITY: Square webhook signature verification is REQUIRED in all environments.
// Set SQUARE_WEBHOOK_SIGNATURE_KEY in your environment variables.
// In demo mode without the key, webhooks are rejected for safety.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordPayment } from "@/lib/services/payment-ledger";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const eventType = body.type;

    // ── Webhook Signature Validation — REQUIRED in all environments ──
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!signatureKey) {
      // No signature key configured — reject webhook to prevent forged payments
      console.error(
        "[Square Webhook] SQUARE_WEBHOOK_SIGNATURE_KEY not set.",
        process.env.SQUARE_ENVIRONMENT === "production"
          ? "CRITICAL: Production webhooks are being rejected!"
          : "Set the key in .env to process Square webhooks."
      );
      return NextResponse.json(
        { error: "Webhook signature key not configured" },
        { status: 500 }
      );
    }

    const { WebhooksHelper } = await import("square");
    const signatureHeader = request.headers.get("x-square-hmacsha256-signature") || "";
    const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/square`;
    let isValid = false;
    try {
      isValid = await WebhooksHelper.verifySignature({
        requestBody: rawBody,
        signatureHeader,
        signatureKey,
        notificationUrl,
      });
    } catch (e) {
      console.error("[Square Webhook] Signature verification error:", e);
    }
    if (!isValid) {
      console.warn("[Square Webhook] Invalid signature — rejecting:", eventType);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

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

      // Validate userId exists in our database
      if (userId) {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        if (!userExists) {
          console.error("Webhook userId not found in database:", userId);
          return NextResponse.json({ received: true, message: "Unknown user" }, { status: 200 });
        }
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
