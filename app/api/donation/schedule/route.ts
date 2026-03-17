import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { itemIds, charity, pickupDate, timeWindow, address, accessNotes } = body;

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return new Response("No items selected", { status: 400 });
  }
  if (!charity || !pickupDate) {
    return new Response("Missing charity or pickup date", { status: 400 });
  }

  // Verify items belong to user
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds }, userId: user.id },
  });

  if (items.length === 0) {
    return new Response("No valid items found", { status: 400 });
  }

  const payload = JSON.stringify({ charity, pickupDate, timeWindow, address, accessNotes });

  for (const item of items) {
    await prisma.eventLog.create({
      data: {
        itemId: item.id,
        eventType: "DONATION_SCHEDULED",
        payload,
      },
    });

    await prisma.item.update({
      where: { id: item.id },
      data: { status: "COMPLETED" },
    });
  }

  return Response.json({ ok: true, itemsScheduled: items.length });
}
