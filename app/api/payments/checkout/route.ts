import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { stripe, isConfigured, getOrCreateStripeCustomer, createStripeSubscription } from "@/lib/stripe";
import { getOrCreateStripePrice } from "@/lib/stripe-products";
import { recordPayment } from "@/lib/services/payment-ledger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { creditPurchaseEmail, subscriptionUpgradeEmail, itemSoldEmail, orderConfirmationEmail } from "@/lib/email/templates";
import { n8nPaymentReceived, n8nSmsAlert } from "@/lib/n8n";
import { handleSoldTransition } from "@/lib/pricing/feedback-loop-hook";
import {
  calculateProcessingFee,
  calculateTotalWithFee,
  CREDIT_PACKS,
  TIERS,
  TIER_KEY_TO_NUMBER,
  calculateTierPrice,
  calculateCustomCredits,
  CUSTOM_CREDIT_MINIMUM,
  CUSTOM_CREDIT_MAXIMUM,
  calculateCommission,
} from "@/lib/constants/pricing";

function getStripeErrorMessage(err: unknown): { message: string; status: number } {
  const stripeErr = err as { type?: string; code?: string; decline_code?: string; message?: string };
  const declineCode = stripeErr?.decline_code;

  if (stripeErr?.type === "StripeCardError") {
    const messages: Record<string, string> = {
      card_declined: "Your card was declined. Please try another payment method.",
      expired_card: "Your card has expired. Please use a different card.",
      insufficient_funds: "Insufficient funds. Please check your account balance.",
      incorrect_cvc: "The security code is incorrect. Please check and try again.",
      incorrect_number: "The card number is invalid. Please check and try again.",
      generic_decline: "Payment was declined. Please contact your card issuer.",
      processing_error: "A processing error occurred. Please try again.",
      do_not_honor: "Card declined. Please call your card issuer.",
    };
    return {
      message: messages[declineCode || ""] || stripeErr?.message || "Payment was declined. Please try another card.",
      status: 402,
    };
  }

  if (stripeErr?.type === "StripeRateLimitError") {
    return { message: "Too many payment attempts. Please wait a moment.", status: 429 };
  }

  return { message: "Payment processing failed. Please try again.", status: 500 };
}

/**
 * Unified Checkout API
 * POST /api/payments/checkout
 *
 * Body: { type: "credit_pack" | "subscription" | "item_purchase", id: string, ...extras }
 *
 * For credit_pack: id = "pack_25" | "pack_50" | "pack_100" | "pack_200"
 * For subscription: id = "starter" | "plus" | "pro", billing?: "monthly" | "annual"
 * For item_purchase: id = itemId, shippingCost?: number, offeredPrice?: number
 *
 * When Stripe is configured: creates a PaymentIntent, returns { clientSecret }
 * When Stripe is NOT configured: runs in demo mode (no real charge)
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const { allowed, resetIn } = checkRateLimit("payments", `${user.id}_${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many payment attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    // Get or create Stripe customer for this user (persists to DB)
    const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, displayName: true, stripeCustomerId: true } });
    const stripeCustomerId = (isConfigured && fullUser) ? await getOrCreateStripeCustomer(fullUser) : null;

    // ── Credit Pack Purchase ──────────────────────────────────────────────
    if (type === "credit_pack") {
      const pack = CREDIT_PACKS[id as keyof typeof CREDIT_PACKS];
      if (!pack) {
        return NextResponse.json({ error: "Invalid pack id" }, { status: 400 });
      }

      const chargeAmount = pack.price;
      const processingFee = calculateProcessingFee(chargeAmount);
      const ourRevenue = Math.round((chargeAmount - processingFee) * 100) / 100;
      const totalCredits = pack.credits + pack.bonus;

      if (isConfigured && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(chargeAmount * 100),
            currency: "usd",
            ...(stripeCustomerId ? { customer: stripeCustomerId, receipt_email: user.email } : {}),
            metadata: { type: "credit_pack", userId: user.id, packId: id, credits: String(totalCredits) },
            description: `Credit Pack — ${totalCredits} credits`,
          });

          await recordPayment(user.id, "credit_pack", chargeAmount, `Credit Pack — ${totalCredits} credits ($${chargeAmount})`, {
            stripePaymentId: paymentIntent.id,
            metadata: { packId: id, credits: totalCredits, ourRevenue },
          });

          // Return clientSecret so frontend can confirm payment
          return NextResponse.json({
            ok: true,
            type: "credit_pack",
            clientSecret: paymentIntent.client_secret,
            charged: chargeAmount,
            credits: totalCredits,
          });
        } catch (stripeErr) {
          console.error("Stripe payment error:", stripeErr);
          const { message, status } = getStripeErrorMessage(stripeErr);
          return NextResponse.json({ error: message }, { status });
        }
      } else {
        // Demo mode — record payment without Stripe
        await recordPayment(user.id, "credit_pack", chargeAmount, `Credit Pack — ${totalCredits} credits ($${chargeAmount})`, {
          stripePaymentId: `demo_credit_${Date.now()}`,
          metadata: { packId: id, credits: totalCredits, ourRevenue, demo: true },
          isDemo: true,
        });
      }

      // Fulfill credits (in demo mode, fulfills immediately; in Stripe mode, webhook confirms)
      let uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
      if (!uc) {
        uc = await prisma.userCredits.create({
          data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 },
        });
      }
      const newBalance = uc.balance + totalCredits;
      await prisma.userCredits.update({
        where: { id: uc.id },
        data: { balance: newBalance, lifetime: uc.lifetime + totalCredits },
      });
      await prisma.creditTransaction.create({
        data: {
          userCreditsId: uc.id,
          type: "purchase",
          amount: totalCredits,
          balance: newBalance,
          description: `Credit Pack — ${totalCredits} credits ($${chargeAmount})`,
          paymentAmount: chargeAmount,
        },
      });

      const cpName = user.email.split("@")[0];
      const cpEmail = creditPurchaseEmail(cpName, totalCredits, newBalance, chargeAmount);
      sendEmail({ to: user.email, ...cpEmail });

      return NextResponse.json({
        ok: true,
        type: "credit_pack",
        charged: chargeAmount,
        credits: totalCredits,
        balance: newBalance,
      });
    }

    // ── Custom Credit Purchase ────────────────────────────────────────────
    if (type === "custom_credit") {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount < CUSTOM_CREDIT_MINIMUM || amount > CUSTOM_CREDIT_MAXIMUM) {
        return NextResponse.json(
          { error: `Amount must be between $${CUSTOM_CREDIT_MINIMUM} and $${CUSTOM_CREDIT_MAXIMUM.toLocaleString()}` },
          { status: 400 }
        );
      }

      const chargeAmount = Math.round(amount * 100) / 100;
      const { credits: totalCredits, rate, tierName } = calculateCustomCredits(chargeAmount);

      if (totalCredits <= 0) {
        return NextResponse.json({ error: "Invalid credit calculation" }, { status: 400 });
      }

      const processingFee = calculateProcessingFee(chargeAmount);
      const ourRevenue = Math.round((chargeAmount - processingFee) * 100) / 100;

      if (isConfigured && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(chargeAmount * 100),
            currency: "usd",
            ...(stripeCustomerId ? { customer: stripeCustomerId, receipt_email: user.email } : {}),
            metadata: { type: "custom_credit", userId: user.id, credits: String(totalCredits), rate: String(rate), tierName },
            description: `Custom Credits — ${totalCredits} credits [${tierName}]`,
          });
          await recordPayment(user.id, "custom_credit", chargeAmount,
            `Custom Credits — ${totalCredits} credits ($${chargeAmount}) [${tierName} rate]`,
            { stripePaymentId: paymentIntent.id,
              metadata: { credits: totalCredits, rate, tierName, ourRevenue, requestedAmount: amount } });

          return NextResponse.json({
            ok: true,
            type: "custom_credit",
            clientSecret: paymentIntent.client_secret,
            charged: chargeAmount,
            credits: totalCredits,
            rate,
            tierName,
          });
        } catch (stripeErr) {
          console.error("Stripe payment error:", stripeErr);
          const { message, status } = getStripeErrorMessage(stripeErr);
          return NextResponse.json({ error: message }, { status });
        }
      } else {
        await recordPayment(user.id, "custom_credit", chargeAmount,
          `Custom Credits — ${totalCredits} credits ($${chargeAmount}) [${tierName} rate]`,
          { stripePaymentId: `demo_custom_${Date.now()}`,
            metadata: { credits: totalCredits, rate, tierName, ourRevenue, requestedAmount: amount, demo: true },
            isDemo: true });
      }

      let uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
      if (!uc) {
        uc = await prisma.userCredits.create({ data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 } });
      }
      const newBalance = uc.balance + totalCredits;
      await prisma.userCredits.update({
        where: { id: uc.id },
        data: { balance: newBalance, lifetime: uc.lifetime + totalCredits },
      });
      await prisma.creditTransaction.create({
        data: {
          userCreditsId: uc.id, type: "purchase", amount: totalCredits, balance: newBalance,
          description: `Custom Credits — ${totalCredits} credits ($${chargeAmount}) [${tierName} rate]`,
          paymentAmount: chargeAmount,
        },
      });

      const ccName = user.email.split("@")[0];
      const ccEmail = creditPurchaseEmail(ccName, totalCredits, newBalance, chargeAmount);
      sendEmail({ to: user.email, ...ccEmail });

      return NextResponse.json({
        ok: true, type: "custom_credit",
        charged: chargeAmount, credits: totalCredits, rate, tierName, balance: newBalance,
      });
    }

    // ── Subscription Upgrade ──────────────────────────────────────────────
    if (type === "subscription") {
      const tierKey = id.toLowerCase();
      const tier = TIERS[tierKey];
      if (!tier) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
      }

      const billing = body.billing || "monthly";
      const isHero = user.heroVerified ?? false;
      const chargeAmount = calculateTierPrice(tierKey, billing, true, isHero);

      if (chargeAmount === 0) {
        return NextResponse.json({ error: "Cannot checkout free tier" }, { status: 400 });
      }

      if (isConfigured && stripe && stripeCustomerId) {
        try {
          const stripePriceId = await getOrCreateStripePrice(tierKey, billing as "monthly" | "annual");
          if (!stripePriceId) {
            return NextResponse.json({ error: "Pricing configuration error." }, { status: 500 });
          }

          // Create recurring Stripe Subscription (not one-time PaymentIntent)
          const subscription = await createStripeSubscription(stripeCustomerId, stripePriceId, {
            legacyloop_type: "subscription",
            userId: user.id,
            tier: tierKey.toUpperCase(),
            billingPeriod: billing,
          });

          if (!subscription) {
            return NextResponse.json({ error: "Could not create subscription." }, { status: 500 });
          }

          const invoice = subscription.latest_invoice as any;
          const pi = invoice?.payment_intent as import("stripe").default.PaymentIntent;
          const clientSecret = pi?.client_secret;

          if (pi?.id) {
            await recordPayment(user.id, "subscription", chargeAmount, `${tier.name} plan — ${billing}`, {
              stripePaymentId: pi.id,
              metadata: { tier: tierKey, billing, stripeSubscriptionId: subscription.id },
            });
          }

          return NextResponse.json({
            ok: true,
            type: "subscription",
            clientSecret,
            subscriptionId: subscription.id,
            tier: tierKey,
            tierName: tier.name,
            charged: chargeAmount,
            billing,
          });
        } catch (stripeErr) {
          console.error("Stripe subscription error:", stripeErr);
          const { message, status } = getStripeErrorMessage(stripeErr);
          return NextResponse.json({ error: message }, { status });
        }
      } else {
        await recordPayment(user.id, "subscription", chargeAmount, `${tier.name} plan — ${billing}`, {
          stripePaymentId: `demo_sub_${Date.now()}`,
          metadata: { tier: tierKey, billing, demo: true },
          isDemo: true,
        });
      }

      // Update user tier
      const tierNumber = TIER_KEY_TO_NUMBER[tierKey] ?? 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { tier: tierNumber },
      });

      // Update or create subscription record
      const now = new Date();
      const periodEnd = new Date(now);
      if (billing === "annual") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const existingSub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
      });
      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            tier: tierKey.toUpperCase(),
            price: chargeAmount,
            billingPeriod: billing === "annual" ? "annual" : "monthly",
            currentPeriodEnd: periodEnd,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            tier: tierKey.toUpperCase(),
            status: "ACTIVE",
            price: chargeAmount,
            billingPeriod: billing === "annual" ? "annual" : "monthly",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      const subName = user.email.split("@")[0];
      const subEmail = subscriptionUpgradeEmail(subName, tier.name, chargeAmount, billing);
      sendEmail({ to: user.email, ...subEmail });

      return NextResponse.json({
        ok: true,
        type: "subscription",
        tier: tierKey,
        tierName: tier.name,
        charged: chargeAmount,
        billing,
        periodEnd: periodEnd.toISOString(),
      });
    }

    // ── Item Purchase (Buy Now) ───────────────────────────────────────────
    if (type === "item_purchase") {
      const item = await prisma.item.findUnique({
        where: { id: id },
        include: { valuation: true, user: true },
      });

      if (!item || !["LISTED", "INTERESTED", "ANALYZED", "READY"].includes(item.status)) {
        return NextResponse.json({ error: "Item not available for purchase" }, { status: 400 });
      }

      const listingPrice = (item as any).listingPrice
        ? Number((item as any).listingPrice)
        : item.valuation
          ? Math.round((item.valuation.low + item.valuation.high) / 2)
          : null;

      const itemPrice = body.offeredPrice ?? listingPrice;
      if (!itemPrice || itemPrice <= 0) {
        return NextResponse.json({ error: "No valid price for this item" }, { status: 400 });
      }

      const shippingCost = body.shippingCost ?? 0;
      const subtotal = itemPrice + shippingCost;
      const { processingFee, total } = calculateTotalWithFee(subtotal);

      if (isConfigured && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100),
            currency: "usd",
            ...(stripeCustomerId ? { customer: stripeCustomerId, receipt_email: user.email } : {}),
            metadata: {
              type: "item_purchase",
              userId: user.id,
              itemId: id,
              sellerId: item.userId,
              itemPrice: String(itemPrice),
              shippingCost: String(shippingCost),
            },
            description: `Purchase: ${item.title || "Item"}`,
          });

          await recordPayment(user.id, "item_purchase", subtotal, `Purchase: ${item.title || "Item"}`, {
            stripePaymentId: paymentIntent.id,
            metadata: { itemId: id, itemPrice, shippingCost, buyerName: body.buyerName },
          });

          return NextResponse.json({
            ok: true,
            type: "item_purchase",
            clientSecret: paymentIntent.client_secret,
            itemId: id,
            itemTitle: item.title,
            itemPrice,
            shippingCost,
            subtotal,
            processingFee,
            total,
          });
        } catch (stripeErr) {
          console.error("Stripe payment error:", stripeErr);
          const { message, status } = getStripeErrorMessage(stripeErr);
          return NextResponse.json({ error: message }, { status });
        }
      } else {
        await recordPayment(user.id, "item_purchase", subtotal, `Purchase: ${item.title || "Item"}`, {
          stripePaymentId: `demo_item_${Date.now()}`,
          metadata: { itemId: id, itemPrice, shippingCost, buyerName: body.buyerName, demo: true },
          isDemo: true,
        });
      }

      // Mark item as SOLD (with mirror for feedback-loop fast path)
      const soldPriceUsd = typeof itemPrice === "number" && itemPrice > 0
        ? Math.round(itemPrice)
        : undefined;
      const soldAt = new Date();
      await prisma.item.update({
        where: { id: id },
        data: {
          status: "SOLD",
          ...(soldPriceUsd != null ? { soldPrice: soldPriceUsd, soldAt } : {}),
        },
      });

      // CMD-PRICING-FEEDBACK-LOOP-V1c: fire accuracy compute
      await handleSoldTransition(id, {
        soldPrice: soldPriceUsd,
        soldAt,
        source: "payments_checkout",
        mirrorToItem: false, // mirrored above
      });

      // First sale bonus: award 25 credits to seller
      try {
        const priorSales = await prisma.item.count({
          where: { userId: item.userId, status: { in: ["SOLD", "SHIPPED", "COMPLETED"] }, id: { not: item.id } },
        });
        if (priorSales === 0) {
          let sellerCredits = await prisma.userCredits.findUnique({ where: { userId: item.userId } });
          if (!sellerCredits) {
            sellerCredits = await prisma.userCredits.create({
              data: { userId: item.userId, balance: 0, lifetime: 0, spent: 0 },
            });
          }
          const bonusAmount = 25;
          await prisma.userCredits.update({
            where: { userId: item.userId },
            data: { balance: { increment: bonusAmount }, lifetime: { increment: bonusAmount } },
          });
          await prisma.creditTransaction.create({
            data: { userCreditsId: sellerCredits.id, type: "bonus", amount: bonusAmount, balance: sellerCredits.balance + bonusAmount, description: "First sale bonus — congratulations!" },
          });
          await prisma.notification.create({
            data: { userId: item.userId, type: "BONUS", title: "First Sale Bonus!", message: `You earned ${bonusAmount} credits for your first sale!`, link: "/credits" },
          }).catch(() => {});
        }
      } catch { /* sale must not fail if bonus fails */ }

      // Record seller earnings
      const { recordEarning } = await import("@/lib/services/payment-ledger");
      const sellerTierKey = ["free", "starter", "plus", "pro"][(item.user?.tier ?? 1) - 1] || "free";
      const isSellerHero = item.user?.heroVerified ?? false;
      await recordEarning(item.userId, item.id, itemPrice, sellerTierKey, isSellerHero);

      // Notification for seller
      try {
        await prisma.notification.create({
          data: {
            userId: item.userId,
            type: "SALE",
            title: "Item Sold!",
            message: `${item.title || "Your item"} was purchased for $${itemPrice.toFixed(2)}`,
            link: `/items/${item.id}`,
          },
        });
      } catch { /* notification is optional */ }

      // Emails (fire-and-forget)
      const buyerName = body.buyerName || user.email.split("@")[0];
      const buyerEmail = orderConfirmationEmail(buyerName, item.title || "Item", itemPrice, shippingCost, processingFee, total);
      sendEmail({ to: user.email, ...buyerEmail });

      // n8n webhooks (fire-and-forget)
      n8nPaymentReceived(itemPrice, user.email, item.title || "Item", "item_purchase");
      n8nSmsAlert(`SALE: $${itemPrice.toFixed(2)} — ${item.title || "Item"}`);

      // Email seller about sale
      if (item.user?.email) {
        const sellerName = (item.user as any).displayName || item.user.email.split("@")[0];
        const sellerTier = ["free", "starter", "plus", "pro"][(item.user.tier ?? 1) - 1] || "free";
        const isHero = item.user.heroVerified ?? false;
        try {
          const comm = calculateCommission(itemPrice, sellerTier, isHero);
          const soldEmail = itemSoldEmail(sellerName, item.title || "Item", itemPrice, comm.commissionAmount, comm.netEarnings, item.id);
          sendEmail({ to: item.user.email, ...soldEmail });
        } catch { /* commission calc failed — skip email */ }
      }

      return NextResponse.json({
        ok: true,
        type: "item_purchase",
        itemId: id,
        itemTitle: item.title,
        itemPrice,
        shippingCost,
        subtotal,
        processingFee,
        total,
      });
    }

    return NextResponse.json({ error: "Invalid checkout type" }, { status: 400 });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
