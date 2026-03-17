/**
 * PATCH /api/bots/lead/[leadId]
 * Update outreachStatus of a BuyerLead. Auth required.
 */
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

type Params = Promise<{ leadId: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { leadId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { outreachStatus } = body as { outreachStatus: string };
  const VALID_STATUSES = ["PENDING", "CONTACTED", "REPLIED", "INTERESTED", "NOT_INTERESTED", "CLOSED"];
  if (!outreachStatus || !VALID_STATUSES.includes(outreachStatus)) {
    return new Response(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`, { status: 400 });
  }

  const lead = await prisma.buyerLead.findUnique({
    where: { id: leadId },
    include: { bot: { include: { item: true } } },
  });
  if (!lead || lead.bot.item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const updated = await prisma.buyerLead.update({
    where: { id: leadId },
    data: {
      outreachStatus,
      contactedAt: outreachStatus === "CONTACTED" && !lead.contactedAt ? new Date() : lead.contactedAt,
    },
  });

  return Response.json({ ok: true, lead: updated });
}
