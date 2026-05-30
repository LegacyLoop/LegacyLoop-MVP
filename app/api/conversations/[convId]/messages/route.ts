import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { sellerRepliedEmail } from "@/lib/email/templates";
import { sendMetaMessage } from "@/lib/messaging/meta/send";
import type { MetaPlatform } from "@/lib/messaging/meta/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ convId: string }> }
) {
  const { convId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    include: { item: { select: { userId: true, title: true, id: true } } },
  });

  if (!conv || conv.item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { content, sender = "seller" } = body;

  if (!content) return new Response("Missing content", { status: 400 });

  const msg = await prisma.message.create({
    data: {
      conversationId: convId,
      sender: String(sender),
      content: String(content).trim(),
      isRead: true,
    },
  });

  // ── Meta Send API · forward seller reply to FB/IG buyer ───────────────
  // conv.buyerName carries the PSID/IGSID (set by ingest). Fire-and-forget so
  // a Meta API hiccup never blocks the in-app reply UX. BINDING #10 not
  // triggered — this is a platform messaging call, not an AI call.
  if (
    sender === "seller" &&
    (conv.platform === "facebook" || conv.platform === "instagram") &&
    conv.buyerName
  ) {
    void sendMetaMessage({
      platform: conv.platform as MetaPlatform,
      recipientId: conv.buyerName,
      text: String(content).trim(),
    })
      .then((r) => {
        if (!r.ok) console.error(`[meta-send] ${conv.platform} ${r.status} ${r.errorMessage ?? ""}`);
      })
      .catch((e: unknown) =>
        console.error("[meta-send] threw:", e instanceof Error ? e.message : String(e)),
      );
  }

  // ── Email buyer when seller replies ──────────────────────────────────
  if (sender === "seller" && conv.buyerEmail) {
    try {
      const sellerUser = await prisma.user.findUnique({ where: { id: user.id }, select: { displayName: true } });
      const itemTitle = conv.item.title || "Untitled Item";
      const itemUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://legacy-loop.com"}/store/${conv.item.userId}/item/${conv.item.id}`;
      const emailData = sellerRepliedEmail(
        conv.buyerName || "Buyer",
        sellerUser?.displayName || "Seller",
        itemTitle,
        String(content).trim(),
        itemUrl
      );
      sendEmail({ to: conv.buyerEmail, subject: emailData.subject, html: emailData.html }).catch(() => {});
    } catch (emailErr) {
      console.error("[MSG] Buyer email notification failed (non-blocking):", emailErr);
    }
  }

  return Response.json(msg);
}

// Mark messages as read
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ convId: string }> }
) {
  const { convId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    include: { item: { select: { userId: true } } },
  });

  if (!conv || conv.item.userId !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  await prisma.message.updateMany({
    where: { conversationId: convId, sender: "buyer", isRead: false },
    data: { isRead: true },
  });

  return Response.json({ ok: true });
}
