import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { runSaleCompletionChain } from "@/lib/sale-completion/engine";

const LTL_STATUSES = ["QUOTE_ACCEPTED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const;

function isValidTransition(from: string | null, to: string): boolean {
  if (!from) return to === "QUOTE_ACCEPTED";
  const fromIdx = LTL_STATUSES.indexOf(from as any);
  const toIdx = LTL_STATUSES.indexOf(to as any);
  return fromIdx >= 0 && toIdx >= 0 && toIdx === fromIdx + 1;
}

function generateBolNumber(): string {
  const prefix = "BOL";
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function generateProNumber(): string {
  // Standard PRO number format: carrier prefix + 9 digits
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return digits;
}

/** GET /api/shipping/ltl/[itemId] — get LTL freight status */
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
        ltlStatus: true,
        ltlCarrierName: true,
        ltlTrackingNumber: true,
        ltlBolNumber: true,
        ltlPickupDate: true,
        ltlDeliveryDate: true,
        ltlQuoteJson: true,
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    return NextResponse.json({
      itemId: item.id,
      status: item.ltlStatus,
      carrier: item.ltlCarrierName,
      trackingNumber: item.ltlTrackingNumber,
      bolNumber: item.ltlBolNumber,
      pickupDate: item.ltlPickupDate?.toISOString() ?? null,
      deliveryDate: item.ltlDeliveryDate?.toISOString() ?? null,
      quote: item.ltlQuoteJson ? (() => { try { return JSON.parse(item.ltlQuoteJson!); } catch { return null; } })() : null,
    });
  } catch (e) {
    console.error("[shipping/ltl GET]", e);
    return NextResponse.json({ error: "Failed to fetch LTL status" }, { status: 500 });
  }
}

/** POST /api/shipping/ltl/[itemId] — advance LTL freight status */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { itemId } = await params;

    const body = await req.json();
    const { action, carrier, pickupDate, quote, deliveryDate } = body;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        userId: true,
        status: true,
        title: true,
        ltlStatus: true,
        ltlBolNumber: true,
        ltlTrackingNumber: true,
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    // Determine the target status
    let targetStatus: string;
    if (action === "advance") {
      const currentIdx = item.ltlStatus ? LTL_STATUSES.indexOf(item.ltlStatus as any) : -1;
      if (currentIdx >= LTL_STATUSES.length - 1) {
        return NextResponse.json({ error: "Already delivered" }, { status: 400 });
      }
      targetStatus = LTL_STATUSES[currentIdx + 1];
    } else if (action === "set" && body.status) {
      targetStatus = body.status;
    } else {
      return NextResponse.json({ error: "action required: 'advance' or 'set'" }, { status: 400 });
    }

    if (!isValidTransition(item.ltlStatus, targetStatus)) {
      return NextResponse.json({ error: `Invalid transition: ${item.ltlStatus ?? "null"} → ${targetStatus}` }, { status: 400 });
    }

    // Build update data
    const updateData: any = { ltlStatus: targetStatus };

    if (targetStatus === "QUOTE_ACCEPTED") {
      updateData.ltlBolNumber = generateBolNumber();
      if (carrier) updateData.ltlCarrierName = carrier;
      if (quote) updateData.ltlQuoteJson = typeof quote === "string" ? quote : JSON.stringify(quote);
    }

    if (targetStatus === "PICKUP_SCHEDULED") {
      updateData.ltlTrackingNumber = item.ltlTrackingNumber || `PRO-${generateProNumber()}`;
      if (pickupDate) updateData.ltlPickupDate = new Date(pickupDate);
      if (carrier) updateData.ltlCarrierName = carrier;
    }

    if (targetStatus === "PICKED_UP") {
      updateData.status = "SHIPPED";
      if (!updateData.ltlPickupDate) updateData.ltlPickupDate = new Date();
    }

    if (targetStatus === "DELIVERED") {
      updateData.status = "COMPLETED";
      updateData.ltlDeliveryDate = deliveryDate ? new Date(deliveryDate) : new Date();
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
    });

    // Log the event
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "LTL_STATUS_CHANGE",
        payload: JSON.stringify({
          from: item.ltlStatus,
          to: targetStatus,
          carrier: updated.ltlCarrierName,
          bolNumber: updated.ltlBolNumber,
          trackingNumber: updated.ltlTrackingNumber,
          timestamp: new Date().toISOString(),
          userId: user.id,
        }),
      },
    }).catch(() => {});

    // Notifications — all 5 LTL statuses
    const ltlNotifications: Record<string, { type: string; title: string; message: string }> = {
      QUOTE_ACCEPTED: {
        type: "TRACKING_UPDATE",
        title: `Freight quote accepted: ${item.title || "your item"}`,
        message: `BOL# ${updated.ltlBolNumber} generated. Select a pickup date to proceed.`,
      },
      PICKUP_SCHEDULED: {
        type: "TRACKING_UPDATE",
        title: `Freight pickup scheduled: ${item.title || "your item"}`,
        message: `Pickup scheduled${pickupDate ? ` for ${new Date(pickupDate).toLocaleDateString()}` : ""}. BOL#: ${updated.ltlBolNumber}`,
      },
      PICKED_UP: {
        type: "TRACKING_UPDATE",
        title: `Freight picked up: ${item.title || "your item"}`,
        message: `Carrier ${updated.ltlCarrierName || "freight"} has picked up your item. PRO#: ${updated.ltlTrackingNumber}`,
      },
      IN_TRANSIT: {
        type: "TRACKING_UPDATE",
        title: `Freight in transit: ${item.title || "your item"}`,
        message: `${updated.ltlCarrierName || "Carrier"} is moving your item to the destination. PRO#: ${updated.ltlTrackingNumber}`,
      },
      DELIVERED: {
        type: "SALE_COMPLETE",
        title: `Freight delivered: ${item.title || "your item"}`,
        message: "LTL freight delivery confirmed. Transaction is complete!",
      },
    };

    const notif = ltlNotifications[targetStatus];
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
    if (targetStatus === "DELIVERED") {
      await runSaleCompletionChain(itemId, item.userId, {
        completionType: "LTL_DELIVERED",
        deliveredAt: new Date(),
        bolNumber: updated.ltlBolNumber ?? undefined,
      }).catch((err) => console.error("[SaleCompletion] ltl chain error:", err));
    }

    return NextResponse.json({
      success: true,
      ltlStatus: targetStatus,
      bolNumber: updated.ltlBolNumber,
      trackingNumber: updated.ltlTrackingNumber,
      carrier: updated.ltlCarrierName,
      pickupDate: updated.ltlPickupDate?.toISOString() ?? null,
      deliveryDate: updated.ltlDeliveryDate?.toISOString() ?? null,
    });
  } catch (e) {
    console.error("[shipping/ltl POST]", e);
    return NextResponse.json({ error: "Failed to update LTL status" }, { status: 500 });
  }
}
