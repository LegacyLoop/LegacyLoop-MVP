import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { squareClient, isConfigured, SQUARE_LOCATION_ID } from "@/lib/square";
import { recordPayment } from "@/lib/services/payment-ledger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { creditPurchaseEmail, subscriptionUpgradeEmail, itemSoldEmail, orderConfirmationEmail } from "@/lib/email/templates";
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

function getSquareErrorMessage(err: unknown): { message: string; status: number } {
  const sqErr = err as { errors?: { code?: string; category?: string; detail?: string }[] };
  const code = sqErr?.errors?.[0]?.code;
  const category = sqErr?.errors?.[0]?.category;

  if (category === "PAYMENT_METHOD_ERROR") {
    const messages: Record<string, string> = {
      CARD_DECLINED: "Your card was declined. Please try another payment method.",
      CARD_EXPIRED: "Your card has expired. Please use a different card.",
      INSUFFICIENT_FUNDS: "Insufficient funds. Please check your account balance.",
      CVV_FAILURE: "The security code is incorrect. Please check and try again.",
      INVALID_CARD: "The card number is invalid. Please check and try again.",
      GENERIC_DECLINE: "Payment was declined. Please contact your card issuer.",
      ADDRESS_VERIFICATION_FAILURE: "Address verification failed. Check your billing address.",
      INVALID_EXPIRATION: "The card expiration date is invalid.",
      CARD_DECLINED_CALL_ISSUER: "Card declined. Please call your card issuer.",
      CARD_DECLINED_VERIFICATION_REQUIRED: "Additional verification required. Contact your card issuer.",
      TRANSACTION_LIMIT: "This transaction exceeds your card limit.",
    };
    return {
      message: messages[code || ""] || "Payment was declined. Please try another card.",
      status: 402
    };
  }

  if (category === "RATE_LIMIT_ERROR") {
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

    // Require payment source when Square is configured (production safety)
    if (isConfigured && !body.sourceId) {
      return NextResponse.json({ error: "Payment source required" }, { status: 400 });
    }

    // ── Credit Pack Purchase ──────────────────────────────────────────────
    if (type === "credit_pack") {
      const pack = CREDIT_PACKS[id as keyof typeof CREDIT_PACKS];
      if (!pack) {
        return NextResponse.json({ error: "Invalid pack id" }, { status: 400 });
      }

      // Fee absorbed: customer pays flat sticker price, Square takes their cut from it
      const chargeAmount = pack.price;
      const squareFee = calculateProcessingFee(chargeAmount);
      const ourRevenue = Math.round((chargeAmount - squareFee) * 100) / 100;
      const totalCredits = pack.credits + pack.bonus;

      if (isConfigured && squareClient) {
        // Real Square checkout
        try {
          const payment = await squareClient.payments.create({
            sourceId: body.sourceId,
            amountMoney: { amount: BigInt(Math.round(chargeAmount * 100)), currency: "USD" },
            locationId: SQUARE_LOCATION_ID,
            idempotencyKey: `credit_${user.id}_${id}_${Date.now()}`,
            note: `type:credit_pack|userId:${user.id}|credits:${totalCredits}|desc:${pack.label}`,
          });

          await recordPayment(user.id, "credit_pack", chargeAmount, `Credit Pack — ${totalCredits} credits ($${chargeAmount})`, {
            squarePaymentId: payment.payment?.id,
            squareOrderId: payment.payment?.orderId,
            metadata: { packId: id, credits: totalCredits, ourRevenue },
          });
        } catch (sqErr) {
          console.error("Square payment error:", sqErr);
          const { message, status } = getSquareErrorMessage(sqErr);
          return NextResponse.json({ error: message }, { status });
        }
      } else {
        // Demo mode — record payment without Square
        await recordPayment(user.id, "credit_pack", chargeAmount, `Credit Pack — ${totalCredits} credits ($${chargeAmount})`, {
          squarePaymentId: `demo_credit_${Date.now()}`,
          metadata: { packId: id, credits: totalCredits, ourRevenue, demo: true },
          isDemo: true,
        });
      }

      // Fulfill credits
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

      // Send confirmation email (fire-and-forget)
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

      const squareFee = calculateProcessingFee(chargeAmount);
      const ourRevenue = Math.round((chargeAmount - squareFee) * 100) / 100;

      if (isConfigured && squareClient) {
        try {
          const payment = await squareClient.payments.create({
            sourceId: body.sourceId,
            amountMoney: { amount: BigInt(Math.round(chargeAmount * 100)), currency: "USD" },
            locationId: SQUARE_LOCATION_ID,
            idempotencyKey: `custom_credit_${user.id}_${chargeAmount}_${Date.now()}`,
            note: `type:custom_credit|userId:${user.id}|credits:${totalCredits}|rate:${rate}|tier:${tierName}`,
          });
          await recordPayment(user.id, "custom_credit", chargeAmount,
            `Custom Credits — ${totalCredits} credits ($${chargeAmount}) [${tierName} rate]`,
            { squarePaymentId: payment.payment?.id, squareOrderId: payment.payment?.orderId,
              metadata: { credits: totalCredits, rate, tierName, ourRevenue, requestedAmount: amount } });
        } catch (sqErr) {
          console.error("Square payment error:", sqErr);
          const { message, status } = getSquareErrorMessage(sqErr);
          return NextResponse.json({ error: message }, { status });
        }
      } else {
        await recordPayment(user.id, "custom_credit", chargeAmount,
          `Custom Credits — ${totalCredits} credits ($${chargeAmount}) [${tierName} rate]`,
          { squarePaymentId: `demo_custom_${Date.now()}`,
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

      // Send confirmation email (fire-and-forget)
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
      // Fee absorbed: customer pays the flat advertised price
      const chargeAmount = calculateTierPrice(tierKey, billing, true, isHero); // pre-launch

      if (chargeAmount === 0) {
        return NextResponse.json({ error: "Cannot checkout free tier" }, { status: 400 });
      }

      if (isConfigured && squareClient) {
        try {
          const payment = await squareClient.payments.create({
            sourceId: body.sourceId,
            amountMoney: { amount: BigInt(Math.round(chargeAmount * 100)), currency: "USD" },
            locationId: SQUARE_LOCATION_ID,
            idempotencyKey: `sub_${user.id}_${tierKey}_${Date.now()}`,
            note: `type:subscription|userId:${user.id}|tier:${tierKey}|billing:${billing}|desc:${tier.name} ${billing}`,
          });

          await recordPayment(user.id, "subscription", chargeAmount, `${tier.name} plan — ${billing}`, {
            squarePaymentId: payment.payment?.id,
            squareOrderId: payment.payment?.orderId,
            metadata: { tier: tierKey, billing },
          });
        } catch (sqErr) {
          console.error("Square payment error:", sqErr);
          const { message, status } = getSquareErrorMessage(sqErr);
          return NextResponse.json({ error: message }, { status });
        }
      } else {
        await recordPayment(user.id, "subscription", chargeAmount, `${tier.name} plan — ${billing}`, {
          squarePaymentId: `demo_sub_${Date.now()}`,
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

      // Send confirmation email (fire-and-forget)
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

      if (isConfigured && squareClient) {
        try {
          const payment = await squareClient.payments.create({
            sourceId: body.sourceId,
            amountMoney: { amount: BigInt(Math.round(total * 100)), currency: "USD" },
            locationId: SQUARE_LOCATION_ID,
            idempotencyKey: `item_${id}_${user.id}_${Date.now()}`,
            note: `type:item_purchase|userId:${user.id}|itemId:${id}|desc:Purchase of ${item.title || "item"}`,
          });

          await recordPayment(user.id, "item_purchase", subtotal, `Purchase: ${item.title || "Item"}`, {
            squarePaymentId: payment.payment?.id,
            squareOrderId: payment.payment?.orderId,
            metadata: { itemId: id, itemPrice, shippingCost, buyerName: body.buyerName },
          });
        } catch (sqErr) {
          console.error("Square payment error:", sqErr);
          const { message, status } = getSquareErrorMessage(sqErr);
          return NextResponse.json({ error: message }, { status });
        }
      } else {
        await recordPayment(user.id, "item_purchase", subtotal, `Purchase: ${item.title || "Item"}`, {
          squarePaymentId: `demo_item_${Date.now()}`,
          metadata: { itemId: id, itemPrice, shippingCost, buyerName: body.buyerName, demo: true },
          isDemo: true,
        });
      }

      // Mark item as SOLD
      await prisma.item.update({
        where: { id: id },
        data: { status: "SOLD" },
      });

      // First sale bonus: award 25 credits to seller on their first completed sale
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
          const bonusAmount = 25; // DISCOUNTS.firstSale.credits
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

      // Record seller earnings (use seller's tier, not buyer's)
      const { recordEarning } = await import("@/lib/services/payment-ledger");
      const sellerTierKey = ["free", "starter", "plus", "pro"][(item.user?.tier ?? 1) - 1] || "free";
      const isSellerHero = item.user?.heroVerified ?? false;
      await recordEarning(item.userId, item.id, itemPrice, sellerTierKey, isSellerHero);

      // Create notification for seller
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
      } catch (e) { /* notification is optional */ }

      // Send confirmation emails (fire-and-forget)
      const buyerName = body.buyerName || user.email.split("@")[0];
      const buyerEmail = orderConfirmationEmail(buyerName, item.title || "Item", itemPrice, shippingCost, processingFee, total);
      sendEmail({ to: user.email, ...buyerEmail });

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
