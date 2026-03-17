import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

type Params = Promise<{ itemId: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) return new Response("Not found", { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { story } = body;

  await prisma.item.update({
    where: { id: itemId },
    data: { story: story ? String(story).trim() : null },
  });

  return Response.json({ ok: true });
}
