import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { sendBuyerOutreach } from "@/lib/email/send";
import { buyerOutreachEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { itemId, to, subject, message, channel, leadProfile } = body;

    if (!itemId || !message) {
      return NextResponse.json({ error: "itemId and message required" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, title: true, userId: true },
    });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    let messageId: string | null = null;

    if (channel === "email" && to) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const itemUrl = `${appUrl}/store/${user.id}/item/${itemId}`;
      const html = buyerOutreachEmail(message, item.title || "Item", itemUrl);
      const sent = await sendBuyerOutreach(to, subject || `About: ${item.title}`, html);
      messageId = sent ? `sg_${Date.now()}` : null;

      if (!sent) {
        return NextResponse.json({ error: "Email send failed" }, { status: 500 });
      }
    }

    // Log outreach event
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "OUTREACH_SENT",
        payload: JSON.stringify({
          channel: channel || "email",
          recipient: to || null,
          subject: subject || null,
          leadProfile: leadProfile || null,
          messagePreview: message.slice(0, 200),
          messageId,
          sentAt: new Date().toISOString(),
          userId: user.id,
        }),
      },
    });

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: `Outreach sent via ${channel || "email"}`,
        message: `Message sent${to ? ` to ${to}` : ""} about "${item.title}"`,
        type: "OUTREACH",
        link: `/items/${itemId}`,
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true, messageId, channel });
  } catch (e) {
    console.error("[outreach/send]", e);
    return NextResponse.json({ error: "Failed to send outreach" }, { status: 500 });
  }
}
