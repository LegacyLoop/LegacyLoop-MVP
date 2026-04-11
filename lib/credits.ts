/**
 * Credit management engine for LegacyLoop.
 * Handles balance checks, deductions, and free tier logic.
 */

import { prisma } from "@/lib/db";
import { BOT_CREDIT_COSTS, CREDIT_PACKS } from "@/lib/constants/pricing";

export interface CreditCheckResult {
  hasEnough: boolean;
  balance: number;
  cost: number;
  shortfall: number;
}

export interface CreditDeductResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

/** Check if user has enough credits for a cost */
export async function checkCredits(userId: string, cost: number): Promise<CreditCheckResult> {
  try {
    const uc = await prisma.userCredits.findUnique({ where: { userId } });
    const balance = uc?.balance ?? 0;
    return {
      hasEnough: balance >= cost,
      balance,
      cost,
      shortfall: Math.max(0, cost - balance),
    };
  } catch (err) {
    console.error("[credits] checkCredits error:", err);
    return { hasEnough: false, balance: 0, cost, shortfall: cost };
  }
}

/** Deduct credits from user balance with transaction safety */
export async function deductCredits(
  userId: string,
  cost: number,
  description: string,
  itemId?: string
): Promise<CreditDeductResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Re-check balance inside transaction (race protection)
      let uc = await tx.userCredits.findUnique({ where: { userId } });
      if (!uc) {
        uc = await tx.userCredits.create({
          data: { userId, balance: 0, lifetime: 0, spent: 0 },
        });
      }

      if (uc.balance < cost) {
        return { success: false, newBalance: uc.balance, error: "Insufficient credits" };
      }

      const newBalance = uc.balance - cost;

      await tx.userCredits.update({
        where: { id: uc.id },
        data: {
          balance: newBalance,
          spent: uc.spent + cost,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userCreditsId: uc.id,
          type: "spend",
          amount: -cost,
          balance: newBalance,
          description,
          itemId: itemId ?? null,
        },
      });

      return { success: true, newBalance };
    });

    // Auto-reload check (fire-and-forget — never blocks the deduction)
    if (result.success) {
      void checkAutoReload(userId, result.newBalance).catch(() => {});
    }

    return result;
  } catch (err: any) {
    console.error("[credits] deductCredits error:", err);
    return { success: false, newBalance: 0, error: err?.message ?? "Credit deduction failed" };
  }
}

/** Refund credits back to user balance (e.g. when all agents fail) */
export async function refundCredits(
  userId: string,
  amount: number,
  description: string,
  itemId?: string
): Promise<CreditDeductResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      let uc = await tx.userCredits.findUnique({ where: { userId } });
      if (!uc) {
        uc = await tx.userCredits.create({
          data: { userId, balance: 0, lifetime: 0, spent: 0 },
        });
      }

      const newBalance = uc.balance + amount;

      await tx.userCredits.update({
        where: { id: uc.id },
        data: {
          balance: newBalance,
          spent: Math.max(0, uc.spent - amount),
        },
      });

      await tx.creditTransaction.create({
        data: {
          userCreditsId: uc.id,
          type: "refund",
          amount: amount,
          balance: newBalance,
          description,
          itemId: itemId ?? null,
        },
      });

      return { success: true, newBalance };
    });

    return result;
  } catch (err: any) {
    console.error("[credits] refundCredits error:", err);
    return { success: false, newBalance: 0, error: err?.message ?? "Credit refund failed" };
  }
}

/** Add credits to a user's balance (bonus, referral, purchase fulfillment, etc.)
 * Upserts UserCredits + creates CreditTransaction. Fire-and-forget safe. */
export async function addCredits(
  userId: string,
  amount: number,
  description: string,
  type: string = "bonus",
): Promise<CreditDeductResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      let uc = await tx.userCredits.findUnique({ where: { userId } });
      if (!uc) {
        uc = await tx.userCredits.create({
          data: { userId, balance: 0, lifetime: 0, spent: 0 },
        });
      }

      const newBalance = uc.balance + amount;

      await tx.userCredits.update({
        where: { id: uc.id },
        data: { balance: newBalance, lifetime: uc.lifetime + amount },
      });

      await tx.creditTransaction.create({
        data: {
          userCreditsId: uc.id,
          type,
          amount,
          balance: newBalance,
          description,
        },
      });

      return { success: true, newBalance };
    });

    return result;
  } catch (err: any) {
    console.error("[credits] addCredits error:", err);
    return { success: false, newBalance: 0, error: err?.message ?? "Credit addition failed" };
  }
}

/** Check if user still has their free first AnalyzeBot run available */
export async function isFreeAnalysisAvailable(userId: string): Promise<boolean> {
  try {
    const priorRun = await prisma.eventLog.findFirst({
      where: {
        eventType: { in: ["AI_ANALYSIS", "ANALYZE_COMPLETE", "ANALYZEBOT_RESULT"] },
        item: { userId },
      },
    });
    return !priorRun;
  } catch (err) {
    console.error("[credits] isFreeAnalysisAvailable error:", err);
    return false; // Fail closed — assume used
  }
}

/** Check if a bot has been run before on this item by this user */
export async function hasPriorBotRun(
  userId: string,
  itemId: string,
  botEventName: string
): Promise<boolean> {
  try {
    const prior = await prisma.eventLog.findFirst({
      where: {
        itemId,
        item: { userId },
        eventType: { contains: botEventName },
      },
    });
    return !!prior;
  } catch (err) {
    console.error("[credits] hasPriorBotRun error:", err);
    return false; // Fail open — charge first-run price
  }
}

/** Check if auto-reload should fire after a deduction */
async function checkAutoReload(userId: string, currentBalance: number): Promise<void> {
  const uc = await prisma.userCredits.findUnique({ where: { userId } });
  if (!uc || !uc.autoReloadEnabled) return;
  if (currentBalance >= uc.autoReloadThreshold) return;

  await triggerAutoReload(userId, uc);
}

/** Execute an auto-reload: charge Stripe, add credits, notify user */
async function triggerAutoReload(userId: string, uc: { id: string; autoReloadPackId: string; balance: number }): Promise<void> {
  const { stripe, isConfigured } = await import("@/lib/stripe");
  const { n8nSmsAlert } = await import("@/lib/n8n");
  const { sendEmail } = await import("@/lib/email/send");

  const pack = CREDIT_PACKS[uc.autoReloadPackId as keyof typeof CREDIT_PACKS];
  if (!pack) return;

  const totalCredits = pack.credits + pack.bonus;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, displayName: true, stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    // No card on file — disable auto-reload
    await prisma.userCredits.update({
      where: { id: uc.id },
      data: { autoReloadEnabled: false, autoReloadFailedAt: new Date() },
    });
    return;
  }

  if (!isConfigured || !stripe) {
    // Demo mode — simulate success
    const newBalance = uc.balance + totalCredits;
    await prisma.userCredits.update({ where: { id: uc.id }, data: { balance: newBalance, lifetime: { increment: totalCredits } } });
    await prisma.creditTransaction.create({
      data: { userCreditsId: uc.id, type: "purchase", amount: totalCredits, balance: newBalance, description: `[DEMO] Auto-reload — ${pack.label} (${totalCredits} credits)`, paymentAmount: pack.price },
    });
    return;
  }

  try {
    // Get default payment method
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
      limit: 1,
    });

    if (!paymentMethods.data.length) {
      await prisma.userCredits.update({ where: { id: uc.id }, data: { autoReloadEnabled: false, autoReloadFailedAt: new Date() } });
      n8nSmsAlert(`LegacyLoop: Auto-reload failed for ${user.email} — no payment method.`);
      return;
    }

    // Charge card
    const pi = await stripe.paymentIntents.create({
      amount: Math.round(pack.price * 100),
      currency: "usd",
      customer: user.stripeCustomerId,
      payment_method: paymentMethods.data[0].id,
      confirm: true,
      off_session: true,
      description: `LegacyLoop Auto-Reload — ${pack.label}`,
      receipt_email: user.email,
      metadata: { type: "auto_reload", userId, packId: uc.autoReloadPackId, creditsAdded: String(totalCredits) },
    });

    if (pi.status === "succeeded") {
      const newBalance = uc.balance + totalCredits;
      await prisma.userCredits.update({ where: { id: uc.id }, data: { balance: newBalance, lifetime: { increment: totalCredits } } });
      await prisma.creditTransaction.create({
        data: { userCreditsId: uc.id, type: "purchase", amount: totalCredits, balance: newBalance, description: `Auto-reload — ${pack.label} (${totalCredits} credits)`, paymentAmount: pack.price },
      });

      const cardLast4 = paymentMethods.data[0].card?.last4 ?? "****";
      n8nSmsAlert(`LegacyLoop: Auto-reload complete. ${totalCredits} credits added. $${pack.price} charged to card ending ${cardLast4}.`);

      // Email notification (fire-and-forget)
      sendEmail({
        to: user.email,
        subject: `LegacyLoop — Auto-Reload: ${totalCredits} Credits Added`,
        html: `<p>Hi ${user.displayName?.split(" ")[0] ?? "there"},</p><p>Your credit balance was low, so we auto-reloaded <strong>${totalCredits} credits</strong> ($${pack.price}) to your account.</p><p>New balance: <strong>${newBalance} credits</strong></p><p>Card charged: ending ${cardLast4}</p><p>You can manage auto-reload in your <a href="https://app.legacy-loop.com/credits">Credits Settings</a>.</p>`,
      });
    }
  } catch (chargeErr) {
    console.error("[auto-reload] Charge failed:", chargeErr);
    await prisma.userCredits.update({ where: { id: uc.id }, data: { autoReloadEnabled: false, autoReloadFailedAt: new Date() } });

    n8nSmsAlert(`LegacyLoop: Auto-reload failed for ${user.email}. Please update payment method.`);
    sendEmail({
      to: user.email,
      subject: "LegacyLoop — Auto-Reload Failed",
      html: `<p>Hi ${user.displayName?.split(" ")[0] ?? "there"},</p><p>Your auto-reload payment failed. We've paused auto-reload on your account.</p><p>Please <a href="https://app.legacy-loop.com/credits">update your payment method</a> and re-enable auto-reload.</p>`,
    });
  }
}

/** Get current credit balance for a user */
export async function getCreditBalance(userId: string): Promise<number> {
  try {
    const uc = await prisma.userCredits.findUnique({ where: { userId } });
    return uc?.balance ?? 0;
  } catch (err) {
    console.error("[credits] getCreditBalance error:", err);
    return 0;
  }
}
