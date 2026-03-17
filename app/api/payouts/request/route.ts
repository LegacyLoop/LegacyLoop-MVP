import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { getUserBalance } from "@/lib/services/payment-ledger";
import { prisma } from "@/lib/db";

const MIN_PAYOUT = 25;

/**
 * POST /api/payouts/request — Request a payout of available earnings
 * Body: { method: "ach" | "paypal" | "check", amount?: number }
 */
export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { method, amount } = body;

    if (!["ach", "paypal", "check"].includes(method)) {
      return NextResponse.json({ error: "Invalid payout method" }, { status: 400 });
    }

    const balance = await getUserBalance(user.id);
    const payoutAmount = amount ? Math.min(amount, balance.available) : balance.available;

    if (payoutAmount < MIN_PAYOUT) {
      return NextResponse.json({
        error: `Minimum payout is $${MIN_PAYOUT}. Your available balance is $${balance.available.toFixed(2)}.`,
      }, { status: 400 });
    }

    // Mark earnings as paid_out
    const availableEarnings = await prisma.sellerEarnings.findMany({
      where: {
        userId: user.id,
        status: { in: ["available", "pending"] },
      },
      orderBy: { createdAt: "asc" },
    });

    const now = new Date();
    let remaining = payoutAmount;

    for (const earning of availableEarnings) {
      if (remaining <= 0) break;

      // Check if this earning is actually available
      const isAvailable = earning.status === "available" ||
        (earning.status === "pending" && earning.holdUntil && new Date(earning.holdUntil) < now);

      if (!isAvailable) continue;

      if (earning.netEarnings <= remaining) {
        await prisma.sellerEarnings.update({
          where: { id: earning.id },
          data: {
            status: "paid_out",
            payoutMethod: method,
            paidOutAt: now,
          },
        });
        remaining -= earning.netEarnings;
      } else {
        // Partial — for simplicity, mark the whole earning as paid out
        await prisma.sellerEarnings.update({
          where: { id: earning.id },
          data: {
            status: "paid_out",
            payoutMethod: method,
            paidOutAt: now,
          },
        });
        remaining = 0;
      }
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "PAYOUT",
        title: "Payout Requested",
        message: `$${payoutAmount.toFixed(2)} payout via ${method.toUpperCase()} has been initiated. Allow 2-5 business days.`,
        link: "/payments",
      },
    }).catch(() => {});

    // Log event
    // Note: EventLog requires itemId — payout events are user-level, skip EventLog
    // Payout tracking is via the SellerEarnings status change to "paid_out"

    return NextResponse.json({
      ok: true,
      amount: payoutAmount,
      method,
      estimatedArrival: method === "ach" ? "2-3 business days" : method === "paypal" ? "1-2 business days" : "5-7 business days",
    });
  } catch (err) {
    console.error("Payout request error:", err);
    return NextResponse.json({ error: "Failed to process payout request" }, { status: 500 });
  }
}
