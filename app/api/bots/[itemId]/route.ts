/**
 * GET /api/bots/[itemId]
 * Returns active BuyerBot + leads for an item (owner only).
 */
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

type Params = Promise<{ itemId: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const bot = await prisma.buyerBot.findFirst({
    where: { itemId, isActive: true },
    include: { leads: { orderBy: { matchScore: "desc" } } },
  });

  return Response.json({ ok: true, bot: bot ?? null, leads: bot?.leads ?? [] });
}
