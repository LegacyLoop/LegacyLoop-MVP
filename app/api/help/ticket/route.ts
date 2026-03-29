import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession().catch(() => null);
    const body = await req.json();
    const { name, email, subject, message, category, itemId } = body;

    if (!message || !email) {
      return NextResponse.json({ error: "Email and message are required" }, { status: 400 });
    }

    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;

    await prisma.eventLog.create({
      data: {
        itemId: itemId || "HELP_SYSTEM",
        eventType: "SUPPORT_TICKET",
        payload: JSON.stringify({
          ticketId, userId: user?.id || null, name: name || "Anonymous", email,
          subject: subject || "Support Request", message: message.slice(0, 5000),
          category: category || "general", status: "open", createdAt: new Date().toISOString(),
        }),
      },
    });

    sendEmail({
      to: email,
      subject: `[LegacyLoop] We got your message! (${ticketId})`,
      html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#00bcd4">We've received your support request</h2><p>Hi ${name || "there"},</p><p>Thanks for reaching out! Your ticket ID is <strong>${ticketId}</strong>.</p><p>We'll get back to you within 24 hours. Support hours: Mon-Sat, 8am-8pm EST.</p><p><strong>Your message:</strong></p><blockquote style="border-left:3px solid #00bcd4;padding-left:12px;color:#666">${message.slice(0, 500)}</blockquote><p style="color:#999;font-size:12px">LegacyLoop — support@legacy-loop.com</p></div>`,
    }).catch(() => null);

    sendEmail({
      to: "support@legacy-loop.com",
      subject: `[New Ticket] ${ticketId}: ${subject || "Support Request"}`,
      html: `<div style="font-family:-apple-system,sans-serif;padding:20px"><h3>New Support Ticket: ${ticketId}</h3><p><strong>From:</strong> ${name || "Anonymous"} (${email})</p><p><strong>Category:</strong> ${category || "general"}</p><p><strong>User ID:</strong> ${user?.id || "not logged in"}</p>${itemId ? `<p><strong>Item:</strong> ${itemId}</p>` : ""}<p><strong>Message:</strong></p><blockquote style="border-left:3px solid #00bcd4;padding-left:12px">${message.slice(0, 2000)}</blockquote></div>`,
    }).catch(() => null);

    return NextResponse.json({ success: true, ticketId });
  } catch (e) {
    console.error("[help/ticket]", e);
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 });
  }
}
