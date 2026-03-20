/**
 * Payment Ledger Service
 * Records all financial transactions and seller earnings.
 * Processing fee (3.5%) split 50/50 — 1.75% buyer, 1.75% seller.
 */
import { prisma } from "@/lib/db";
import {
  calculateProcessingFee,
  calculateCommission,
} from "@/lib/constants/pricing";

// ── Record a payment (buyer-side transaction) ───────────────────────────────

export async function recordPayment(
  userId: string,
  type: string,
  subtotal: number,
  description: string,
  options?: {
    squarePaymentId?: string;
    squareOrderId?: string;
    metadata?: Record<string, unknown>;
    isDemo?: boolean;
  }
) {
  const processingFee = calculateProcessingFee(subtotal, "buyer");
  try {
    return await prisma.paymentLedger.create({
      data: {
        userId,
        type,
        subtotal,
        processingFee,
        totalCharged: Math.round((subtotal + processingFee) * 100) / 100,
        description,
        status: "completed",
        squarePaymentId: options?.squarePaymentId,
        squareOrderId: options?.squareOrderId,
        metadata: options?.metadata
          ? JSON.stringify(options.metadata)
          : null,
        isDemo: options?.isDemo ?? false,
      },
    });
  } catch (error) {
    console.error("Failed to record payment:", error);
    return null;
  }
}

// ── Record a seller earning ─────────────────────────────────────────────────

export async function recordEarning(
  userId: string,
  itemId: string,
  saleAmount: number,
  userTier: string,
  isHero: boolean
) {
  const breakdown = calculateCommission(saleAmount, userTier, isHero);
  try {
    return await prisma.sellerEarnings.create({
      data: {
        userId,
        itemId,
        saleAmount: breakdown.saleAmount,
        commissionRate: breakdown.commissionRate,
        commissionAmount: breakdown.commissionAmount,
        netEarnings: breakdown.netEarnings,
        status: "pending",
        holdUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3-day hold
      },
    });
  } catch (error) {
    console.error("Failed to record earning:", error);
    return null;
  }
}

// ── Get user's balance (available, pending, totals) ─────────────────────────

export async function getUserBalance(userId: string) {
  try {
    const earnings = await prisma.sellerEarnings.findMany({
      where: { userId },
    });
    const now = new Date();

    const available = earnings
      .filter(
        (e) =>
          e.status === "available" ||
          (e.status === "pending" && e.holdUntil && e.holdUntil < now)
      )
      .reduce((sum, e) => sum + e.netEarnings, 0);

    const pending = earnings
      .filter(
        (e) =>
          e.status === "pending" && e.holdUntil && e.holdUntil >= now
      )
      .reduce((sum, e) => sum + e.netEarnings, 0);

    const totalEarned = earnings
      .filter((e) => e.status !== "refunded")
      .reduce((sum, e) => sum + e.netEarnings, 0);

    const totalCommissions = earnings
      .filter((e) => e.status !== "refunded")
      .reduce((sum, e) => sum + e.commissionAmount, 0);

    return {
      available: Math.round(available * 100) / 100,
      pending: Math.round(pending * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalCommissions: Math.round(totalCommissions * 100) / 100,
    };
  } catch (error) {
    console.error("Failed to get balance:", error);
    return { available: 0, pending: 0, totalEarned: 0, totalCommissions: 0 };
  }
}

// ── Get user's transaction history ──────────────────────────────────────────

export async function getUserTransactions(userId: string, limit = 50) {
  try {
    return await prisma.paymentLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return [];
  }
}

// ── Get user's earnings history ─────────────────────────────────────────────

export async function getUserEarnings(userId: string, limit = 50) {
  try {
    return await prisma.sellerEarnings.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to get earnings:", error);
    return [];
  }
}
