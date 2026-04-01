import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { runSaleCompletionChain } from "@/lib/sale-completion/engine";
import { isDemoMode } from "@/lib/bot-mode";
import {
  normalizeTrackingResponse,
  isStatusAdvance,
} from "@/lib/shipping/tracking-normalizer";
import { trackFedExFreight } from "@/lib/shipping/fedex-ltl";
import { trackShipment } from "@/lib/shipping/shipengine-ltl";

const STATUS_ORDER = ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
const DEMO_LOCATIONS = ["Portland, ME", "Hartford, CT", "Newark, NJ", "Distribution Center", "Local Post Office"];

type Params = Promise<{ labelId: string }>;

// ── Live carrier tracking (non-demo mode) ────────────────────────

async function fetchLiveTracking(
  label: { id: string; carrier: string; trackingNumber: string; status: string; statusHistory?: string },
  itemId?: string
): Promise<{ updated: boolean; newStatus?: string; newHistory?: string }> {
  if (isDemoMode() || !label.trackingNumber) {
    return { updated: false };
  }

  let raw: any = null;
  const carrier = label.carrier.toLowerCase();

  try {
    if (carrier.includes("fedex")) {
      raw = await trackFedExFreight(label.trackingNumber);
    } else if (carrier.includes("shipengine")) {
      raw = await trackShipment(carrier, label.trackingNumber);
    }
    // Shippo tracking comes via webhook, not polling
  } catch (e) {
    console.error("[LiveTracking] Carrier API error:", e);
    return { updated: false };
  }

  if (!raw) return { updated: false };

  // Store raw carrier response for data retention (Section 5)
  if (itemId) {
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "CARRIER_TRACKING_RAW",
        payload: JSON.stringify({
          carrier: label.carrier,
          trackingNumber: label.trackingNumber,
          response: raw,
          fetchedAt: new Date().toISOString(),
        }),
      },
    }).catch(() => {});
  }

  // Normalize the response
  const normalized = normalizeTrackingResponse(label.carrier, raw);
  if (!normalized) return { updated: false };

  // Only update if status has advanced
  if (!isStatusAdvance(label.status, normalized.status)) {
    return { updated: false };
  }

  // Build new history entry
  let history: Array<{ status: string; timestamp: string; location?: string }> = [];
  try { history = JSON.parse(label.statusHistory || "[]"); } catch { /* use empty */ }

  history.push({
    status: normalized.status,
    timestamp: normalized.timestamp,
    location: normalized.location || undefined,
  });

  const newHistory = JSON.stringify(history);

  // Update the label in DB
  await prisma.shipmentLabel.update({
    where: { id: label.id },
    data: {
      status: normalized.status,
      statusHistory: newHistory,
    },
  });

  return {
    updated: true,
    newStatus: normalized.status,
    newHistory,
  };
}

// GET — return current tracking info
export async function GET(
  _req: Request,
  { params }: { params: Params }
) {
  const { labelId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const label = await prisma.shipmentLabel.findUnique({ where: { id: labelId } });
  if (!label) return Response.json({ error: "Not found" }, { status: 404 });

  // In live mode, attempt to fetch fresh tracking from carrier
  const liveResult = await fetchLiveTracking(
    {
      id: label.id,
      carrier: label.carrier,
      trackingNumber: label.trackingNumber,
      status: label.status,
      statusHistory: (label as any).statusHistory,
    },
    label.itemId
  );

  const currentStatus = liveResult.updated ? liveResult.newStatus! : label.status;
  const currentHistory = liveResult.updated ? liveResult.newHistory! : ((label as any).statusHistory ?? "[]");

  return Response.json({
    id: label.id,
    status: currentStatus,
    trackingNumber: label.trackingNumber,
    carrier: label.carrier,
    service: label.service,
    statusHistory: currentHistory,
    estimatedDays: (label as any).estimatedDays ?? null,
  });
}

// POST — simulate status update (for demo)
export async function POST(
  req: Request,
  { params }: { params: Params }
) {
  const { labelId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const newStatus = body.status as string;

  if (!newStatus || !STATUS_ORDER.includes(newStatus)) {
    return Response.json({ error: `Invalid status. Must be one of: ${STATUS_ORDER.join(", ")}` }, { status: 400 });
  }

  const label = await prisma.shipmentLabel.findUnique({
    where: { id: labelId },
    include: { item: { select: { id: true, title: true, userId: true } } },
  });
  if (!label) return Response.json({ error: "Not found" }, { status: 404 });

  // Validate transition — new status must be after current
  const currentIdx = STATUS_ORDER.indexOf(label.status);
  const newIdx = STATUS_ORDER.indexOf(newStatus);
  if (newIdx <= currentIdx) {
    return Response.json({ error: `Cannot transition from ${label.status} to ${newStatus}` }, { status: 400 });
  }

  // Append to status history
  let history: Array<{ status: string; timestamp: string; location?: string }> = [];
  try { history = JSON.parse((label as any).statusHistory || "[]"); } catch { /* use empty */ }

  history.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    location: DEMO_LOCATIONS[newIdx] ?? undefined,
  });

  // Update label
  await prisma.shipmentLabel.update({
    where: { id: labelId },
    data: {
      status: newStatus,
      statusHistory: JSON.stringify(history),
    },
  });

  // Auto-mark item COMPLETED on delivery
  if (newStatus === "DELIVERED" && label.item) {
    await prisma.item.update({
      where: { id: label.item.id },
      data: { status: "COMPLETED" },
    }).catch(() => {});

    await prisma.eventLog.create({
      data: {
        itemId: label.item.id,
        eventType: "DELIVERY_CONFIRMED",
        payload: JSON.stringify({ trackingNumber: label.trackingNumber, carrier: label.carrier }),
      },
    }).catch(() => {});

    // Sale completion chain — release funds, notify, log
    await runSaleCompletionChain(label.item.id, label.item.userId, {
      completionType: "CARRIER_DELIVERY",
      deliveredAt: new Date(),
      trackingNumber: label.trackingNumber,
    }).catch((err) => console.error("[SaleCompletion] parcel chain error:", err));
  }

  // Create notification
  if (label.item) {
    const titles: Record<string, string> = {
      PICKED_UP: `${label.item.title || "Item"} picked up by ${label.carrier}`,
      IN_TRANSIT: `${label.item.title || "Item"} in transit`,
      OUT_FOR_DELIVERY: `${label.item.title || "Item"} out for delivery`,
      DELIVERED: `${label.item.title || "Item"} delivered!`,
    };

    await prisma.notification.create({
      data: {
        userId: label.item.userId,
        type: newStatus === "DELIVERED" ? "DELIVERY_CONFIRMED" : "TRACKING_UPDATE",
        title: titles[newStatus] ?? `Tracking update: ${newStatus}`,
        message: DEMO_LOCATIONS[newIdx] ? `Location: ${DEMO_LOCATIONS[newIdx]}` : "Status updated",
        link: `/items/${label.item.id}`,
      },
    }).catch(() => {});
  }

  return Response.json({ ok: true, status: newStatus, statusHistory: history });
}
