import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { recordPayment } from "@/lib/services/payment-ledger";
import { n8nRenewalReminder } from "@/lib/n8n";
import type Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events with signature verification.
 * CRITICAL: Uses req.text() not req.json() — Stripe signature needs raw body.
 *
 * CMD-STRIPE-PRODUCTION
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || !sig || !stripe) {
      console.error("[Stripe Webhook] Missing webhook secret, signature, or Stripe client");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // ── payment_intent.succeeded ──────────────────────────────────────────
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const userId = pi.metadata?.userId;
      const paymentType = pi.metadata?.type || "unknown";

      if (!userId) {
        console.warn("[Stripe Webhook] No userId in metadata:", pi.id);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Idempotency check
      const existing = await prisma.paymentLedger.findUnique({
        where: { stripePaymentId: pi.id },
      });
      if (existing && existing.status === "completed") {
        return NextResponse.json({ received: true, message: "Already processed" }, { status: 200 });
      }

      // Update ledger status to completed
      if (existing) {
        await prisma.paymentLedger.update({
          where: { id: existing.id },
          data: { status: "completed" },
        });
      }

      // Fulfill based on type
      if (paymentType === "credit_pack" || paymentType === "custom_credit") {
        const credits = Number(pi.metadata?.credits ?? 0);
        if (credits > 0) {
          const uc = await prisma.userCredits.findUnique({ where: { userId } });
          if (uc) {
            await prisma.userCredits.update({
              where: { userId },
              data: { balance: { increment: credits }, lifetime: { increment: credits } },
            });
          }
        }
      }

      if (paymentType === "item_purchase") {
        const itemId = pi.metadata?.itemId;
        if (itemId) {
          await prisma.item.update({
            where: { id: itemId },
            data: { status: "SOLD" },
          }).catch(() => {});
        }
      }

      // Finalize subscription upgrade after payment succeeds
      if (paymentType === "subscription" || paymentType === "subscription_upgrade") {
        const targetTier = pi.metadata?.tier || pi.metadata?.toTier;
        const billingPeriod = pi.metadata?.billingPeriod || "monthly";
        if (targetTier) {
          const tierMap: Record<string, number> = { free: 1, starter: 2, plus: 3, pro: 4 };
          const tierNumber = tierMap[targetTier.toLowerCase()] ?? 1;
          const now = new Date();
          const periodEnd = new Date(now);
          if (billingPeriod === "annual") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          // Update user tier
          await prisma.user.update({
            where: { id: userId },
            data: { tier: tierNumber },
          }).catch(() => {});

          // Update or create subscription
          const existingSub = await prisma.subscription.findFirst({
            where: { userId, status: "ACTIVE" },
          });
          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: { tier: targetTier.toUpperCase(), price: pi.amount / 100, billingPeriod, currentPeriodStart: now, currentPeriodEnd: periodEnd },
            }).catch(() => {});
          } else {
            await prisma.subscription.create({
              data: { userId, tier: targetTier.toUpperCase(), status: "ACTIVE", price: pi.amount / 100, billingPeriod, currentPeriodStart: now, currentPeriodEnd: periodEnd },
            }).catch(() => {});
          }
        }
      }
    }

    // ── payment_intent.payment_failed ─────────────────────────────────────
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.error("[Stripe Webhook] Payment failed:", pi.id, pi.last_payment_error?.message);

      if (pi.metadata?.userId) {
        await prisma.paymentLedger.updateMany({
          where: { stripePaymentId: pi.id },
          data: { status: "failed" },
        }).catch(() => {});
      }
    }

    // ── invoice.payment_succeeded (subscription renewal) ──────────────────
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Find user by Stripe customer ID in metadata
      if ((invoice as any).subscription && invoice.billing_reason === "subscription_cycle") {
        // This is a renewal — fire WF21
        const sub = await prisma.subscription.findFirst({
          where: { status: "ACTIVE" },
          include: { user: { select: { email: true, displayName: true } } },
        });

        if (sub) {
          const firstName = sub.user.displayName?.split(" ")[0] ?? "there";
          n8nRenewalReminder(
            sub.user.email,
            firstName,
            sub.tier,
            sub.currentPeriodEnd.toISOString(),
            sub.price,
          );
        }
      }
    }

    // ── charge.refunded ───────────────────────────────────────────────────
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const piId = charge.payment_intent as string;
      if (piId) {
        await prisma.paymentLedger.updateMany({
          where: { stripePaymentId: piId },
          data: { status: "refunded" },
        }).catch(() => {});
      }
    }

    // Always return 200 so Stripe doesn't retry
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
