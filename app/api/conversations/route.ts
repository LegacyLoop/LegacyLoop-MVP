import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { newBuyerMessageEmail } from "@/lib/email/templates";

// ─── Bot/Platform helpers ──────────────────────────────────────────────────

const BOT_PATTERNS = [
  /\b(auto[-\s]?message|automated reply|bot)\b/i,
  /\b(buy wholesale|bulk order|resell)\b/i,
  /http[s]?:\/\//,
  /\b(click here|follow this link)\b/i,
  /[A-Z]{6,}/,
];

const PLATFORM_MAP: { pattern: RegExp; name: string }[] = [
  { pattern: /facebook\.com|fb\.com|fb marketplace|facebook marketplace/i, name: "Facebook Marketplace" },
  { pattern: /craigslist\.org|craigslist/i, name: "Craigslist" },
  { pattern: /ebay\.com|ebay/i, name: "eBay" },
  { pattern: /offerup|offer up/i, name: "OfferUp" },
  { pattern: /nextdoor\.com|nextdoor/i, name: "Nextdoor" },
  { pattern: /instagram\.com|@\w+ on instagram/i, name: "Instagram" },
  { pattern: /etsy\.com|etsy/i, name: "Etsy" },
];

export function scoreBuyer(name: string, message: string): { score: number; flags: string[] } {
  const flags: string[] = [];
  let deductions = 0;

  for (const p of BOT_PATTERNS) {
    if (p.test(message)) { flags.push("Suspicious message pattern"); deductions += 18; break; }
  }
  if (/^\d+$/.test(name.trim())) { flags.push("Numeric-only name"); deductions += 25; }
  if (name.trim().length < 3) { flags.push("Very short name"); deductions += 12; }
  if (message.trim().length < 8) { flags.push("Very short message"); deductions += 10; }
  if (message.trim().length > 600) { flags.push("Unusually long (template risk)"); deductions += 10; }

  return { score: Math.max(0, Math.min(100, 100 - deductions)), flags };
}

export function extractPlatform(name: string, message: string): string {
  const combined = `${name} ${message}`;
  for (const { pattern, name: pName } of PLATFORM_MAP) {
    if (pattern.test(combined)) return pName;
  }
  return "direct";
}

// ─── GET — list conversations for user ────────────────────────────────────

export async function GET(req: Request) {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const userItems = await prisma.item.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const itemIds = userItems.map((i) => i.id);

  const url = new URL(req.url);
  const itemId = url.searchParams.get("itemId");

  const where = itemId && itemIds.includes(itemId)
    ? { itemId }
    : { itemId: { in: itemIds } };

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      item: { select: { id: true, title: true, aiResult: { select: { rawJson: true } }, photos: { take: 1 } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(conversations);
}

// ─── POST — create a new conversation + first message (no auth — buyers) ──

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { itemId, buyerName, buyerEmail, firstMessage } = body;

  if (!itemId || !buyerName || !firstMessage) {
    return new Response("Missing itemId, buyerName, or firstMessage", { status: 400 });
  }

  // Item must exist and be publicly visible
  const PUBLIC_STATUSES = ["LISTED", "ANALYZED", "READY", "INTERESTED", "OFFER_PENDING"];
  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, status: true, userId: true, title: true } });
  if (!item || !PUBLIC_STATUSES.includes(item.status)) {
    return new Response("Item not found or not available", { status: 404 });
  }

  const { score, flags } = scoreBuyer(buyerName, firstMessage);
  const platform = extractPlatform(buyerName, firstMessage);

  const conversation = await prisma.conversation.create({
    data: {
      itemId,
      buyerName: String(buyerName).trim(),
      buyerEmail: buyerEmail ? String(buyerEmail).trim() : null,
      platform,
      botScore: score,
    },
    include: { messages: true },
  });

  // First message from buyer
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "buyer",
      content: String(firstMessage).trim(),
    },
  });

  // ── Notify seller: in-app notification + email ──────────────────────────
  try {
    const seller = await prisma.user.findUnique({ where: { id: item.userId }, select: { id: true, email: true, displayName: true } });
    if (seller) {
      // In-app notification
      await prisma.notification.create({
        data: {
          userId: seller.id,
          type: "NEW_MESSAGE",
          title: `New message from ${String(buyerName).trim()}`,
          message: String(firstMessage).trim().slice(0, 120),
          link: `/messages?itemId=${itemId}`,
        },
      });

      // Email notification to seller
      if (seller.email) {
        const itemTitle = item.title || "Untitled Item";
        const convUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://legacy-loop.com"}/messages?itemId=${itemId}`;
        const emailData = newBuyerMessageEmail(
          seller.displayName || "Seller",
          String(buyerName).trim(),
          itemTitle,
          String(firstMessage).trim(),
          convUrl
        );
        sendEmail({ to: seller.email, subject: emailData.subject, html: emailData.html }).catch(() => {});
      }
    }
  } catch (notifErr) {
    console.error("[CONV] Notification failed (non-blocking):", notifErr);
  }

  return Response.json({ ok: true, conversationId: conversation.id, botScore: score, flags, platform });
}
