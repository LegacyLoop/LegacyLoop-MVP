import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { recordPayment } from "@/lib/services/payment-ledger";
import { n8nRenewalReminder } from "@/lib/n8n";
import { sendEmail } from "@/lib/email/send";
import { whiteGloveBookingConfirmEmail } from "@/lib/email/templates";
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

      // Update ledger status to completed + capture receipt URL
      if (existing) {
        let receiptUrl: string | null = null;
        if (stripe && pi.latest_charge) {
          try {
            const charge = await stripe.charges.retrieve(pi.latest_charge as string);
            receiptUrl = charge.receipt_url ?? null;
          } catch { /* receipt URL is nice-to-have, not critical */ }
        }
        await prisma.paymentLedger.update({
          where: { id: existing.id },
          data: { status: "completed", ...(receiptUrl ? { receiptUrl } : {}) },
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

      // ── White Glove deposit confirmed ──
      if (paymentType === "white_glove_deposit") {
        const bookingId = pi.metadata?.bookingId;
        if (!bookingId) {
          // Find by stripePaymentId
          const booking = await prisma.whiteGloveBooking.findFirst({
            where: { depositStripePaymentId: pi.id },
          });
          if (booking) {
            await prisma.whiteGloveBooking.update({
              where: { id: booking.id },
              data: { depositPaid: true, depositPaidAt: new Date(), status: "BOOKED" },
            }).catch(() => {});

            // Send booking confirmation email
            const bookingUser = await prisma.user.findUnique({ where: { id: booking.userId }, select: { email: true, displayName: true } });
            if (bookingUser?.email) {
              const name = bookingUser.displayName?.split(" ")[0] ?? "there";
              const emailContent = whiteGloveBookingConfirmEmail(name, booking.tier, booking.depositAmount, booking.balanceAmount, booking.totalAmount);
              sendEmail({ to: bookingUser.email, ...emailContent });
            }
          }
        }
      }

      // ── White Glove balance confirmed ──
      if (paymentType === "white_glove_balance") {
        const bId = pi.metadata?.bookingId;
        if (bId) {
          await prisma.whiteGloveBooking.update({
            where: { id: bId },
            data: { balancePaid: true, balancePaidAt: new Date(), balanceStripePaymentId: pi.id, status: "COMPLETED", completedAt: new Date() },
          }).catch(() => {});
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

    // ── invoice.payment_succeeded (subscription creation + renewal) ─────
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;
      const stripeSubId = invoice.subscription as string | undefined;
      const customerId = invoice.customer as string;
      const billingReason = invoice.billing_reason as string;

      if (stripeSubId) {
        // Find user by stripeCustomerId
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, email: true, displayName: true },
        });

        if (user) {
          // Extract period from invoice lines
          const lineItem = invoice.lines?.data?.[0];
          const periodEnd = lineItem?.period?.end
            ? new Date(lineItem.period.end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const periodStart = lineItem?.period?.start
            ? new Date(lineItem.period.start * 1000)
            : new Date();

          // Extract tier from subscription metadata
          const subMeta = invoice.subscription_details?.metadata || {};
          const tier = subMeta.tier || "STARTER";
          const billingPeriod = subMeta.billingPeriod || "monthly";
          const tierMap: Record<string, number> = { free: 1, starter: 2, plus: 3, pro: 4 };
          const tierNumber = tierMap[tier.toLowerCase()] ?? 1;
          const price = (invoice.amount_paid ?? 0) / 100;

          // Update or create subscription record
          const existingSub = await prisma.subscription.findFirst({
            where: { userId: user.id, status: { in: ["ACTIVE", "PAST_DUE"] } },
          });

          if (existingSub) {
            await prisma.subscription.update({
              where: { id: existingSub.id },
              data: {
                status: "ACTIVE",
                tier: tier.toUpperCase(),
                price,
                billingPeriod,
                stripeSubscriptionId: stripeSubId,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
              },
            }).catch(() => {});
          } else {
            await prisma.subscription.create({
              data: {
                userId: user.id,
                status: "ACTIVE",
                tier: tier.toUpperCase(),
                price,
                billingPeriod,
                stripeSubscriptionId: stripeSubId,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
              },
            }).catch(() => {});
          }

          // Update user tier
          await prisma.user.update({
            where: { id: user.id },
            data: { tier: tierNumber },
          }).catch(() => {});

          // Fire WF21 on renewal (not first payment)
          // Fire WF21 on subscription renewal (not estate care)
          if (billingReason === "subscription_cycle" && subMeta.legacyloop_type !== "estate_care") {
            const firstName = user.displayName?.split(" ")[0] ?? "there";
            n8nRenewalReminder(user.email, firstName, tier, periodEnd.toISOString(), price);
          }

          // Estate Care monthly renewal — confirm contract still active
          if (subMeta.legacyloop_type === "estate_care" && stripeSubId) {
            await prisma.estateCareContract.updateMany({
              where: { stripeSubscriptionId: stripeSubId, status: "ACTIVE" },
              data: { updatedAt: new Date() },
            }).catch(() => {});
          }
        }
      }
    }

    // ── invoice.payment_failed ────────────────────────────────────────────
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as any;
      const stripeSubId = invoice.subscription as string | undefined;
      const customerId = invoice.customer as string;

      if (stripeSubId) {
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        });

        if (user) {
          // Mark subscription as PAST_DUE
          await prisma.subscription.updateMany({
            where: { userId: user.id, stripeSubscriptionId: stripeSubId },
            data: { status: "PAST_DUE" },
          }).catch(() => {});

          // Create notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "PAYMENT_FAILED",
              title: "Payment Failed",
              message: "Your subscription payment failed. Please update your payment method to keep your plan active.",
              link: "/subscription",
            },
          }).catch(() => {});
        }
      }
    }

    // ── customer.subscription.deleted ─────────────────────────────────────
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      });

      if (user) {
        // Cancel subscription in DB
        await prisma.subscription.updateMany({
          where: { userId: user.id, stripeSubscriptionId: sub.id },
          data: { status: "CANCELLED" },
        }).catch(() => {});

        // Downgrade to free tier
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: 1 },
        }).catch(() => {});

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "SUBSCRIPTION_CANCELLED",
            title: "Subscription Cancelled",
            message: "Your subscription has been cancelled. You've been moved to the Free plan.",
            link: "/pricing",
          },
        }).catch(() => {});
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
