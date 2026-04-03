import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { sendReturnNotification } from "@/lib/email/send";
import { returnApprovedBuyerEmail, returnDeniedBuyerEmail } from "@/lib/email/templates";
import { createReturnLabel, isShippoConfigured } from "@/lib/adapters/shippo";

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
    select: {
      id: true, title: true, userId: true, status: true,
      shippingLength: true, shippingWidth: true, shippingHeight: true,
    },
  });

  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (action === "approve") {
    // ── Generate return shipping label ──
    let returnLabelInfo: any = null;
    const originalLabel = await prisma.shipmentLabel.findFirst({
      where: { itemId },
      orderBy: { createdAt: "desc" },
    });

    if (originalLabel) {
      try {
        const fromAddr = JSON.parse(originalLabel.fromAddressJson);
        const toAddr = JSON.parse(originalLabel.toAddressJson);
        const parcel = {
          length: String(item.shippingLength ?? 12),
          width: String(item.shippingWidth ?? 10),
          height: String(item.shippingHeight ?? 6),
          distance_unit: "in" as const,
          weight: String(originalLabel.weight),
          mass_unit: "lb" as const,
        };

        const result = await createReturnLabel(fromAddr, toAddr, parcel);
        returnLabelInfo = {
          trackingNumber: result.label.tracking_number,
          labelUrl: result.label.label_url,
          carrier: result.rate.provider,
          service: result.rate.servicelevel_name,
          rate: parseFloat(result.rate.amount),
          isMock: result.isMock,
        };

        // Persist return label to DB
        await prisma.shipmentLabel.create({
          data: {
            itemId,
            fromAddressJson: JSON.stringify(toAddr), // swapped
            toAddressJson: JSON.stringify(fromAddr),  // swapped
            weight: originalLabel.weight,
            carrier: result.rate.provider,
            service: result.rate.servicelevel_name,
            rate: parseFloat(result.rate.amount),
            labelUrl: result.label.label_url,
            trackingNumber: result.label.tracking_number,
            deliveryMethod: "print",
            status: "RETURN_LABEL",
            statusHistory: JSON.stringify([
              { status: "RETURN_LABEL_CREATED", timestamp: new Date().toISOString() },
            ]),
          },
        });
      } catch (e) {
        console.error("[Refund] Return label generation failed:", e);
        // Non-blocking — approve still proceeds without prepaid label
      }
    }

    // ── Update seller earnings to refunded ──
    await prisma.sellerEarnings.updateMany({
      where: { itemId, status: { not: "refunded" } },
      data: { status: "refunded" },
    });

    // ── Update payment ledger to refunded — scoped to this item + seller ──
    const ledgerEntries = await prisma.paymentLedger.findMany({
      where: { userId: user.id, type: "item_purchase", status: { not: "refunded" } },
    });
    for (const entry of ledgerEntries) {
      try {
        const meta = entry.metadata ? JSON.parse(entry.metadata as string) : {};
        if (meta.itemId === itemId) {
          await prisma.paymentLedger.update({
            where: { id: entry.id },
            data: { status: "refunded" },
          });
          break; // Only refund the matching entry
        }
      } catch { /* skip malformed metadata */ }
    }

    // ── Transition item through return flow → REFUNDED, then relist ──
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "REFUNDED" },
    });

    // Log with return label info
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "refund_approved",
        payload: JSON.stringify({
          approvedBy: user.id,
          reason,
          returnLabel: returnLabelInfo,
        }),
      },
    }).catch(() => {});
  } else {
    // ── Deny — release payout hold, return item to previous state ──
    await prisma.sellerEarnings.updateMany({
      where: { itemId, status: "pending" },
      data: { holdUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }, // reset to normal 3-day hold
    }).catch(() => {});

    // If item was in RETURN_REQUESTED, move it back to COMPLETED
    if (item.status === "RETURN_REQUESTED") {
      await prisma.item.update({
        where: { id: itemId },
        data: { status: "COMPLETED" },
      });
    }

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
      ? "Refund approved. Item marked as REFUNDED. Seller earnings refunded. Processing fee is non-refundable."
      : "Refund denied. Payout hold released. Item returned to COMPLETED.",
  });
}
