import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/credits/balance
 * Returns the authenticated user's current credit balance.
 * Used by CreditPurchaseModal to refresh balance after purchase.
 *
 * CMD-STRIPE-CUSTOMER-PERSIST
 */
export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uc = await prisma.userCredits.findUnique({
    where: { userId: user.id },
    select: { balance: true, lifetime: true, spent: true },
  });

  return NextResponse.json({
    balance: uc?.balance ?? 0,
    lifetime: uc?.lifetime ?? 0,
    spent: uc?.spent ?? 0,
  });
}
