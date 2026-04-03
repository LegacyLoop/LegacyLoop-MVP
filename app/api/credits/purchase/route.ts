import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { CREDIT_PACK_LIST } from "@/lib/constants/pricing";
import { isConfigured } from "@/lib/square";

const PACKAGES = CREDIT_PACK_LIST.map((p) => ({
  id: p.id,
  name: p.name,
  credits: p.baseCredits,
  bonusCredits: p.bonusCredits,
  price: p.price,
}));

export async function POST(req: NextRequest) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { packageId } = await req.json();
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return new Response("Invalid package", { status: 400 });

  // When Square is configured, redirect to the proper checkout flow
  // so payment is collected before credits are awarded.
  if (isConfigured) {
    return Response.json({
      ok: false,
      redirect: true,
      checkoutUrl: "/api/payments/checkout",
      checkoutBody: { type: "credit_pack", id: `pack_${pkg.price}` },
      message: "Use the checkout flow to purchase credits with payment.",
    }, { status: 303 });
  }

  // ── Production safety: block free credits when Square is misconfigured ──
  const { isDemoMode } = await import("@/lib/bot-mode");
  if (!isDemoMode() && process.env.NODE_ENV === "production") {
    return Response.json({
      ok: false,
      error: "Payment processing is not configured. Please contact support.",
    }, { status: 503 });
  }

  // Demo mode — award credits directly without collecting payment
  const totalAdded = pkg.credits + pkg.bonusCredits;

  // Get or create UserCredits
  let uc = await prisma.userCredits.findUnique({ where: { userId: user.id } });
  if (!uc) {
    uc = await prisma.userCredits.create({
      data: { userId: user.id, balance: 0, lifetime: 0, spent: 0 },
    });
  }

  const newBalance = uc.balance + totalAdded;

  // Update balance
  const updated = await prisma.userCredits.update({
    where: { id: uc.id },
    data: {
      balance: newBalance,
      lifetime: uc.lifetime + totalAdded,
    },
  });

  // Create transaction (marked as demo)
  await prisma.creditTransaction.create({
    data: {
      userCreditsId: uc.id,
      type: "purchase",
      amount: totalAdded,
      balance: newBalance,
      description: `[DEMO] ${pkg.name} — ${pkg.credits} credits${pkg.bonusCredits > 0 ? ` + ${pkg.bonusCredits} bonus` : ""}`,
      paymentAmount: pkg.price,
    },
  });

  return Response.json({ ok: true, demo: true, balance: updated.balance, added: totalAdded });
}
