/**
 * Credit management engine for LegacyLoop.
 * Handles balance checks, deductions, and free tier logic.
 */

import { prisma } from "@/lib/db";
import { BOT_CREDIT_COSTS } from "@/lib/constants/pricing";

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
