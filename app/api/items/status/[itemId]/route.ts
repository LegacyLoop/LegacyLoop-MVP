import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { populateSoldPrice } from "@/lib/data/populate-intelligence";

// TODO: Returns flow — add RETURN_REQUESTED, RETURNED, REFUNDED to valid statuses.
// Would need validation: only SHIPPED/COMPLETED can transition to RETURN_REQUESTED.
// On RETURN_REQUESTED: generate return label, notify buyer, pause payout.
// On RETURNED: inspect item, process refund, update transaction.
const VALID_STATUSES = ["DRAFT", "ANALYZED", "READY", "LISTED", "INTERESTED", "SOLD", "SHIPPED", "COMPLETED"] as const;
type ItemStatus = typeof VALID_STATUSES[number];

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

  return Response.json({ ok: true, status: updated.status });
}
