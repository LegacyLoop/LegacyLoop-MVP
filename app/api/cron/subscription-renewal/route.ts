import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { n8nRenewalReminder } from "@/lib/n8n";

export const maxDuration = 120;

/**
 * POST /api/cron/subscription-renewal
 * Safety net cron — runs daily at 9am UTC.
 *
 * Primary renewal is handled by Stripe Billing (invoice.payment_succeeded webhook).
 * This cron serves two purposes:
 *   1. Catch any PAST_DUE subscriptions and send reminders
 *   2. Fire WF21 for demo-mode subscriptions that don't go through Stripe
 *
 * CMD-STRIPE-SUBSCRIPTION-AUTO-RENEW (repurposed from notification-only)
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON/subscription-renewal] CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const providedSecret = authHeader?.replace("Bearer ", "") || cronHeader || querySecret || "";
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Notify PAST_DUE subscriptions (payment failed, needs user action)
    const pastDueSubs = await prisma.subscription.findMany({
      where: { status: "PAST_DUE" },
      include: { user: { select: { id: true, email: true, displayName: true } } },
    });

    let pastDueNotified = 0;
    for (const sub of pastDueSubs) {
      await prisma.notification.create({
        data: {
          userId: sub.user.id,
          type: "PAYMENT_REMINDER",
          title: "Payment Past Due",
          message: "Your subscription payment is past due. Update your payment method to avoid losing access.",
          link: "/subscription",
        },
      }).catch(() => {});
      pastDueNotified++;
    }

    // 2. Demo-mode renewals (no stripeSubscriptionId = not managed by Stripe)
    const demoExpired = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        stripeSubscriptionId: null,
        currentPeriodEnd: { gte: oneDayAgo, lte: now },
      },
      include: { user: { select: { email: true, displayName: true } } },
    });

    let demoNotified = 0;
    for (const sub of demoExpired) {
      const firstName = sub.user.displayName?.split(" ")[0] ?? "there";
      n8nRenewalReminder(sub.user.email, firstName, sub.tier, sub.currentPeriodEnd.toISOString(), sub.price);
      demoNotified++;
    }

    console.log(`[CRON/subscription-renewal] past_due=${pastDueNotified} demo_expired=${demoNotified}`);
    return NextResponse.json({ ok: true, pastDueNotified, demoNotified });
  } catch (err) {
    console.error("[CRON/subscription-renewal] Error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
