import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

// GET — list user's notifications (newest first)
export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }))
  );
}

// PATCH — mark notifications as read
export async function PATCH(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { ids, isRead } = body;

  if (ids === "all") {
    await prisma.notification.updateMany({
      where: { userId: user.id },
      data: { isRead: isRead !== false },
    });
    return Response.json({ ok: true });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: "Missing ids" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId: user.id },
    data: { isRead: isRead !== false },
  });

  return Response.json({ ok: true });
}
