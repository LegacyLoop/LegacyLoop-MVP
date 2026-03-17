import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { runSaleCompletionChain } from "@/lib/sale-completion/engine";

const PICKUP_STATUSES = ["INVITE_SENT", "CONFIRMED", "EN_ROUTE", "HANDED_OFF", "COMPLETED"] as const;

function isValidTransition(from: string | null, to: string): boolean {
  if (!from) return to === "INVITE_SENT";
  const fromIdx = PICKUP_STATUSES.indexOf(from as any);
  const toIdx = PICKUP_STATUSES.indexOf(to as any);
  return fromIdx >= 0 && toIdx >= 0 && toIdx === fromIdx + 1;
}

function generateHandoffCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** GET /api/shipping/pickup/[itemId] — get full pickup status + config */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        userId: true,
        status: true,
        title: true,
        listingPrice: true,
        saleZip: true,
        pickupStatus: true,
        pickupConfirmedAt: true,
        pickupCompletedAt: true,
        pickupLocation: true,
        pickupNotes: true,
        pickupInviteSentAt: true,
        pickupScheduledAt: true,
        pickupTimeSlots: true,
        pickupBuyerTimeSlot: true,
        pickupBuyerMessage: true,
        pickupContactMethod: true,
        pickupPaymentMethod: true,
        pickupHandoffCode: true,
        pickupConfirmedBy: true,
        pickupRadius: true,
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const safeJson = (s: string | null) => { if (!s) return null; try { return JSON.parse(s); } catch { return s; } };

    return NextResponse.json({
      itemId: item.id,
      status: item.pickupStatus,
      confirmedAt: item.pickupConfirmedAt?.toISOString() ?? null,
      completedAt: item.pickupCompletedAt?.toISOString() ?? null,
      inviteSentAt: item.pickupInviteSentAt?.toISOString() ?? null,
      scheduledAt: item.pickupScheduledAt?.toISOString() ?? null,
      location: safeJson(item.pickupLocation),
      notes: item.pickupNotes,
      timeSlots: safeJson(item.pickupTimeSlots),
      buyerTimeSlot: item.pickupBuyerTimeSlot,
      buyerMessage: item.pickupBuyerMessage,
      contactMethod: item.pickupContactMethod,
      paymentMethod: item.pickupPaymentMethod,
      handoffCode: item.pickupHandoffCode,
      confirmedBy: item.pickupConfirmedBy,
      radius: item.pickupRadius,
      saleZip: item.saleZip,
      price: (item as any).listingPrice ?? null,
    });
  } catch (e) {
    console.error("[shipping/pickup GET]", e);
    return NextResponse.json({ error: "Failed to fetch pickup status" }, { status: 500 });
  }
}

/** POST /api/shipping/pickup/[itemId] — advance pickup status with config */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    const body = await req.json();
    const {
      action, location, notes, confirmedDate,
      timeSlots, contactMethod, paymentMethod, radius,
      buyerTimeSlot, buyerMessage, handoffCode,
    } = body;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true, userId: true, status: true, title: true,
        pickupStatus: true, pickupHandoffCode: true, listingPrice: true,
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    let targetStatus: string;
    if (action === "advance") {
      const currentIdx = item.pickupStatus ? PICKUP_STATUSES.indexOf(item.pickupStatus as any) : -1;
      if (currentIdx >= PICKUP_STATUSES.length - 1) {
        return NextResponse.json({ error: "Already completed" }, { status: 400 });
      }
      targetStatus = PICKUP_STATUSES[currentIdx + 1];
    } else if (action === "set" && body.status) {
      targetStatus = body.status;
    } else {
      return NextResponse.json({ error: "action required: 'advance' or 'set'" }, { status: 400 });
    }

    if (!isValidTransition(item.pickupStatus, targetStatus)) {
      return NextResponse.json({ error: `Invalid transition: ${item.pickupStatus ?? "null"} → ${targetStatus}` }, { status: 400 });
    }

    const updateData: any = { pickupStatus: targetStatus };

    // INVITE_SENT — store all pre-sale config
    if (targetStatus === "INVITE_SENT") {
      updateData.pickupInviteSentAt = new Date();
      if (location) updateData.pickupLocation = typeof location === "string" ? location : JSON.stringify(location);
      if (notes) updateData.pickupNotes = notes;
      if (timeSlots) updateData.pickupTimeSlots = typeof timeSlots === "string" ? timeSlots : JSON.stringify(timeSlots);
      if (contactMethod) updateData.pickupContactMethod = contactMethod;
      if (paymentMethod) updateData.pickupPaymentMethod = paymentMethod;
      if (radius != null) updateData.pickupRadius = Number(radius);
    }

    // CONFIRMED — store buyer response + generate handoff code
    if (targetStatus === "CONFIRMED") {
      updateData.pickupConfirmedAt = confirmedDate ? new Date(confirmedDate) : new Date();
      updateData.pickupScheduledAt = confirmedDate ? new Date(confirmedDate) : new Date();
      updateData.pickupHandoffCode = generateHandoffCode();
      if (buyerTimeSlot) updateData.pickupBuyerTimeSlot = buyerTimeSlot;
      if (buyerMessage) updateData.pickupBuyerMessage = buyerMessage;
      updateData.pickupConfirmedBy = "seller";
    }

    // EN_ROUTE — no special fields needed
    if (targetStatus === "EN_ROUTE") {
      // Status tracking only
    }

    // HANDED_OFF — verify handoff code if provided
    if (targetStatus === "HANDED_OFF") {
      if (handoffCode && item.pickupHandoffCode && handoffCode !== item.pickupHandoffCode) {
        return NextResponse.json({ error: "Handoff code does not match" }, { status: 400 });
      }
      updateData.status = "SHIPPED";
      updateData.pickupConfirmedBy = "both";
    }

    // COMPLETED — finalize
    if (targetStatus === "COMPLETED") {
      updateData.pickupCompletedAt = new Date();
      updateData.status = "COMPLETED";
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "PICKUP_STATUS_CHANGE",
        payload: JSON.stringify({
          from: item.pickupStatus,
          to: targetStatus,
          timestamp: new Date().toISOString(),
          userId: user.id,
        }),
      },
    }).catch(() => {});

    // Notifications — all 5 pickup statuses
    const pickupNotifications: Record<string, { type: string; title: string; message: string }> = {
      INVITE_SENT: {
        type: "TRACKING_UPDATE",
        title: `Pickup scheduled: ${item.title || "your item"}`,
        message: "Pickup invite has been sent. Waiting for buyer to confirm a time slot.",
      },
      CONFIRMED: {
        type: "TRACKING_UPDATE",
        title: `Pickup confirmed: ${item.title || "your item"}`,
        message: `Meetup confirmed${confirmedDate ? ` for ${new Date(confirmedDate).toLocaleDateString()}` : ""}. Handoff code generated.`,
      },
      EN_ROUTE: {
        type: "TRACKING_UPDATE",
        title: `Buyer en route: ${item.title || "your item"}`,
        message: "The buyer is on their way to the meetup location.",
      },
      HANDED_OFF: {
        type: "TRACKING_UPDATE",
        title: `Item handed off: ${item.title || "your item"}`,
        message: "Waiting for buyer to confirm receipt.",
      },
      COMPLETED: {
        type: "SALE_COMPLETE",
        title: `Pickup complete: ${item.title || "your item"}`,
        message: "Both parties confirmed. Transaction is complete!",
      },
    };

    const notif = pickupNotifications[targetStatus];
    if (notif) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          link: `/items/${itemId}`,
        },
      }).catch(() => {});
    }

    // Sale completion chain — fires only on terminal status
    if (targetStatus === "COMPLETED") {
      await runSaleCompletionChain(itemId, item.userId, {
        completionType: "PICKUP_HANDOFF",
        deliveredAt: new Date(),
        handoffCode: updated.pickupHandoffCode ?? undefined,
      }).catch((err) => console.error("[SaleCompletion] pickup chain error:", err));
    }

    return NextResponse.json({
      success: true,
      pickupStatus: targetStatus,
      confirmedAt: updated.pickupConfirmedAt?.toISOString() ?? null,
      completedAt: updated.pickupCompletedAt?.toISOString() ?? null,
      handoffCode: updated.pickupHandoffCode,
    });
  } catch (e) {
    console.error("[shipping/pickup POST]", e);
    return NextResponse.json({ error: "Failed to update pickup status" }, { status: 500 });
  }
}
