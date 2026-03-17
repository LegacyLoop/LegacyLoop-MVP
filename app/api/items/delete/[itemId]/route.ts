import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  // Delete all related records first (cascade order)
  await prisma.eventLog.deleteMany({ where: { itemId } });
  await prisma.marketComp.deleteMany({ where: { itemId } });
  await prisma.aiResult.deleteMany({ where: { itemId } });
  await prisma.valuation.deleteMany({ where: { itemId } });
  await prisma.antiqueCheck.deleteMany({ where: { itemId } });
  await prisma.itemPhoto.deleteMany({ where: { itemId } });

  // Delete messages in conversations first
  const convs = await prisma.conversation.findMany({ where: { itemId } });
  for (const conv of convs) {
    await prisma.message.deleteMany({ where: { conversationId: conv.id } });
  }
  await prisma.conversation.deleteMany({ where: { itemId } });

  await prisma.item.delete({ where: { id: itemId } });

  return Response.json({ ok: true });
}
