import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { sendReturnNotification } from "@/lib/email/send";
import { returnApprovedBuyerEmail, returnDeniedBuyerEmail } from "@/lib/email/templates";

type Params = Promise<{ itemId: string }>;

/**
 * PATCH /api/refunds/[itemId] — Seller approves or denies a refund
 * Body: { action: "approve" | "deny", reason?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  const user = await authAdapter.getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await params;
  const body = await req.json();
  const { action, reason } = body;

  if (!["approve", "deny"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, title: true, userId: true, status: true },
  });

  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (action === "approve") {
    // Update seller earnings to refunded
    await prisma.sellerEarnings.updateMany({
      where: { itemId, status: { not: "refunded" } },
      data: { status: "refunded" },
    });

    // Update payment ledger to refunded
    const ledgerEntries = await prisma.paymentLedger.findMany({
      where: { type: "item_purchase" },
    });
    for (const entry of ledgerEntries) {
      try {
        const meta = entry.metadata ? JSON.parse(entry.metadata) : {};
        if (meta.itemId === itemId) {
          await prisma.paymentLedger.update({
            where: { id: entry.id },
            data: { status: "refunded" },
          });
          break;
        }
      } catch { /* skip */ }
    }

    // Reset item status
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "LISTED" },
    });

    // Log
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "refund_approved",
        payload: JSON.stringify({ approvedBy: user.id, reason }),
      },
    }).catch(() => {});
  } else {
    // Deny — just log
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "refund_denied",
        payload: JSON.stringify({ deniedBy: user.id, reason }),
      },
    }).catch(() => {});
  }

  // Notify (generic notification — buyer would get email in prod)
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: action === "approve" ? "REFUND_APPROVED" : "REFUND_DENIED",
      title: action === "approve" ? "Refund Approved" : "Refund Denied",
      message: action === "approve"
        ? `Refund approved for "${item.title || "item"}". The item has been relisted.`
        : `Refund denied for "${item.title || "item"}".${reason ? ` Reason: ${reason}` : ""}`,
      link: `/items/${item.id}`,
    },
  }).catch(() => {});

  // Send email to buyer (if email exists in original refund request)
  try {
    const refundLog = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "refund_requested" },
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    });
    const refundPayload = refundLog?.payload ? JSON.parse(refundLog.payload) : null;
    if (refundPayload?.buyerEmail) {
      if (action === "approve") {
        await sendReturnNotification(refundPayload.buyerEmail, `Return approved — ${item.title}`, returnApprovedBuyerEmail(item.title || "your item", refundPayload.refundAmount || 0));
      } else {
        await sendReturnNotification(refundPayload.buyerEmail, `Return request update — ${item.title}`, returnDeniedBuyerEmail(item.title || "your item", reason || ""));
      }
    }
  } catch { /* email non-critical */ }

  return NextResponse.json({
    ok: true,
    action,
    message: action === "approve"
      ? "Refund approved. Item relisted. Processing fee is non-refundable."
      : "Refund denied.",
  });
}
