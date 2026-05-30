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
  // CMD-W25-META-L1 · botId now nullable (Lead-Ads leads have no bot owner).
  // Guard: if bot present, owner-check via bot.item.userId; if absent (lead-ad
  // path), require the new owner-of-item check via the lead's itemId.
  if (!lead) {
    return new Response("Not found", { status: 404 });
  }
  let authorized = false;
  if (lead.bot) {
    authorized = lead.bot.item.userId === user.id;
  } else {
    const item = await prisma.item.findUnique({ where: { id: lead.itemId }, select: { userId: true } });
    authorized = !!item && item.userId === user.id;
  }
  if (!authorized) {
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
