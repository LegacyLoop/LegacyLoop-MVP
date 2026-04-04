import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";

/* ═══════════════════════════════════════════════════════════════════════
   GET /api/receipts/[id]?type=credit|payment|earning|shipping
   Returns structured receipt data for any transaction type
   ═══════════════════════════════════════════════════════════════════════ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch user display name from DB (session only has id/email/tier/heroVerified)
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, displayName: true },
  });
  const userName = fullUser?.displayName || null;

  const { id } = await params;
  const type = req.nextUrl.searchParams.get("type") || "auto";

  // ── Auto-detect or explicit type lookup ──
  if (type === "credit" || type === "auto") {
    const tx = await prisma.creditTransaction.findUnique({
      where: { id },
      include: { userCredits: { select: { userId: true } } },
    });
    if (tx && tx.userCredits.userId === user.id) {
      return NextResponse.json({
        receiptType: "credit",
        id: tx.id,
        date: tx.createdAt.toISOString(),
        description: tx.description,
        type: tx.type,
        amount: tx.amount,
        balance: tx.balance,
        itemId: tx.itemId,
        paymentAmount: tx.paymentAmount,
        user: { id: user.id, email: user.email, name: userName },
      });
    }
    if (type === "credit") return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (type === "payment" || type === "auto") {
    const pl = await prisma.paymentLedger.findUnique({ where: { id } });
    if (pl && pl.userId === user.id) {
      let meta: any = {};
      try { meta = pl.metadata ? JSON.parse(pl.metadata) : {}; } catch {}
      return NextResponse.json({
        receiptType: "payment",
        id: pl.id,
        date: pl.createdAt.toISOString(),
        description: pl.description,
        type: pl.type,
        subtotal: pl.subtotal,
        processingFee: pl.processingFee,
        totalCharged: pl.totalCharged,
        currency: pl.currency,
        status: pl.status,
        squarePaymentId: pl.squarePaymentId,
        metadata: meta,
        user: { id: user.id, email: user.email, name: userName },
      });
    }
    if (type === "payment") return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (type === "earning" || type === "auto") {
    const se = await prisma.sellerEarnings.findUnique({ where: { id } });
    if (se && se.userId === user.id) {
      let itemTitle = "Item";
      const earningItemId = se.itemId;
      if (earningItemId) {
        const item = await prisma.item.findUnique({ where: { id: earningItemId }, select: { title: true } });
        if (item?.title) itemTitle = item.title;
      }
      return NextResponse.json({
        receiptType: "earning",
        id: se.id,
        date: se.createdAt.toISOString(),
        description: `Sale: ${itemTitle}`,
        itemId: se.itemId,
        itemTitle,
        saleAmount: se.saleAmount,
        commissionRate: se.commissionRate,
        commissionAmount: se.commissionAmount,
        netEarnings: se.netEarnings,
        status: se.status,
        paidOutAt: se.paidOutAt?.toISOString() || null,
        user: { id: user.id, email: user.email, name: userName },
      });
    }
    if (type === "earning") return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (type === "shipping" || type === "auto") {
    const sl = await prisma.shipmentLabel.findFirst({
      where: { id, item: { userId: user.id } },
      include: { item: { select: { title: true, userId: true } } },
    });
    if (sl) {
      return NextResponse.json({
        receiptType: "shipping",
        id: sl.id,
        date: sl.createdAt.toISOString(),
        description: `Shipping label: ${sl.carrier} ${sl.service}`,
        carrier: sl.carrier,
        service: sl.service,
        rate: sl.rate,
        trackingNumber: sl.trackingNumber,
        itemTitle: sl.item.title,
        itemId: sl.itemId,
        labelUrl: sl.labelUrl,
        user: { id: user.id, email: user.email, name: userName },
      });
    }
    if (type === "shipping") return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}
