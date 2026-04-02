import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { populateSoldPrice } from "@/lib/data/populate-intelligence";

const VALID_STATUSES = ["DRAFT", "ANALYZED", "READY", "LISTED", "INTERESTED", "SOLD", "SHIPPED", "COMPLETED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"] as const;
type ItemStatus = typeof VALID_STATUSES[number];

// Only SHIPPED/COMPLETED can transition into the returns flow
const RETURN_ENTRY_STATUSES: ItemStatus[] = ["SHIPPED", "COMPLETED"];
const RETURN_TRANSITIONS: Record<string, ItemStatus[]> = {
  RETURN_REQUESTED: ["RETURNED", "LISTED"],  // seller can confirm return arrived, or cancel and relist
  RETURNED: ["REFUNDED", "LISTED"],          // seller inspects and refunds, or relists if no issue
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { status, listingPrice } = body;

  if (status && !VALID_STATUSES.includes(status as ItemStatus)) {
    return new Response("Invalid status", { status: 400 });
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  // ── Return-flow transition validation ──
  if (status === "RETURN_REQUESTED" && !RETURN_ENTRY_STATUSES.includes(item.status as ItemStatus)) {
    return new Response("Only SHIPPED or COMPLETED items can enter the returns flow", { status: 400 });
  }
  if (status === "RETURNED" && item.status !== "RETURN_REQUESTED") {
    return new Response("Item must be in RETURN_REQUESTED before marking RETURNED", { status: 400 });
  }
  if (status === "REFUNDED" && item.status !== "RETURNED") {
    return new Response("Item must be in RETURNED before marking REFUNDED", { status: 400 });
  }

  const data: any = {};
  if (status) data.status = status;
  if (listingPrice !== undefined) data.listingPrice = listingPrice === null ? null : Number(listingPrice);

  const updated = await prisma.item.update({ where: { id: itemId }, data });

  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "STATUS_CHANGE",
      payload: JSON.stringify({ from: item.status, to: status ?? item.status }),
    },
  });

  // Capture sold price when item transitions to SOLD
  if (status === "SOLD" && item.status !== "SOLD") {
    const price = updated.listingPrice ?? item.listingPrice;
    if (price != null && price > 0) {
      populateSoldPrice(itemId, price, new Date()).catch(() => null);
    }
  }

  // ── Pause payout when return is requested ──
  if (status === "RETURN_REQUESTED") {
    // Extend holdUntil to far future so payout is frozen while return is in progress
    await prisma.sellerEarnings.updateMany({
      where: { itemId, status: { in: ["pending", "available"] } },
      data: { status: "pending", holdUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    }).catch(() => {});

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "RETURN_REQUESTED",
        title: "Return Requested",
        message: `A return has been requested for "${item.title || "your item"}". Payout is on hold until resolved.`,
        link: `/items/${itemId}`,
      },
    }).catch(() => {});
  }

  // ── Release or refund payout based on return outcome ──
  if (status === "REFUNDED") {
    await prisma.sellerEarnings.updateMany({
      where: { itemId },
      data: { status: "refunded" },
    }).catch(() => {});

    await prisma.paymentLedger.updateMany({
      where: { type: "item_purchase" },
      data: { status: "refunded" },
    }).catch(() => {});
  }

  return Response.json({ ok: true, status: updated.status });
}
