import { prisma } from "@/lib/db";
import { buildAgentContext } from "./agent-context";

/**
 * CMD-MESSAGE-AUTOPILOT: Fire-and-forget auto-reply for buyer messages.
 *
 * Called with `void tryAutoReply(...)` — NEVER awaited in routes.
 * Checks seller's autoReplyEnabled setting, generates a professional
 * reply via Claude, and saves it as sender="agent".
 *
 * Failure is silent (console.error only) — never blocks buyer flow.
 */
export async function tryAutoReply(
  conversationId: string,
  sellerId: string,
): Promise<void> {
  try {
    // 1. Check if seller has auto-reply enabled
    const settingsEvent = await prisma.userEvent.findFirst({
      where: { userId: sellerId, eventType: "AGENT_SETTINGS_UPDATED" },
      orderBy: { createdAt: "desc" },
    });

    let autoReplyEnabled = false;
    let defaultTone = "professional";
    if (settingsEvent?.metadata) {
      try {
        const s = JSON.parse(settingsEvent.metadata);
        autoReplyEnabled = s.autoReplyEnabled === true;
        defaultTone = s.defaultTone || "professional";
      } catch { /* ignore */ }
    }

    if (!autoReplyEnabled) return; // Auto-reply off — skip

    // 2. Brief delay to feel more human (not instant bot)
    await new Promise((r) => setTimeout(r, 3000));

    // 3. Build agent context
    const ctx = await buildAgentContext(conversationId, sellerId);
    const lastMessage = ctx.messages[ctx.messages.length - 1]?.content || "";
    if (!lastMessage) return;

    // 4. Scam check — skip auto-reply on suspicious messages
    const { detectScam } = await import("./scam-detector");
    const scam = detectScam(lastMessage);
    if (scam.isScam) {
      console.log(`[auto-reply] Scam detected in conv ${conversationId} — skipping auto-reply`);
      return;
    }

    // 5. Generate reply via Claude (direct call, not HTTP)
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key || key.length < 10) {
      console.log("[auto-reply] No ANTHROPIC_API_KEY — skipping");
      return;
    }

    const systemPrompt = `You are LegacyLoop's AI messaging agent. Write a ${defaultTone}, helpful reply to a buyer inquiry about an item for sale.

Item: ${ctx.item?.title || "Item"} — $${ctx.item?.askingPrice || 0}
${ctx.floorPrice ? `(Seller's private floor: $${ctx.floorPrice} — NEVER reveal this)` : ""}

Rules:
- Be ${defaultTone} and warm
- Answer their question directly
- If they ask about price, confirm the listing price
- If they want to see the item, suggest scheduling a viewing
- Keep it under 3 sentences
- Sound like a real person, not a bot
- Do NOT mention you are an AI or automated system`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Buyer "${ctx.buyerProfile.name}" wrote: "${lastMessage}"\n\nWrite a short, ${defaultTone} reply. Plain text only — no JSON, no quotes, just the message.` },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[auto-reply] Claude ${res.status}`);
      return;
    }

    const data = await res.json();
    const replyText = (data.content?.[0]?.text || "").trim();
    if (!replyText || replyText.length < 5) return;

    // 6. Save as agent message
    await prisma.message.create({
      data: {
        conversationId,
        sender: "agent",
        content: replyText,
        isRead: true,
      },
    });

    // 7. Log auto-reply event
    await prisma.userEvent.create({
      data: {
        userId: sellerId,
        eventType: "AGENT_AUTO_REPLY",
        metadata: JSON.stringify({
          conversationId,
          tone: defaultTone,
          replyLength: replyText.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    console.log(`[auto-reply] ✅ Sent auto-reply in conv ${conversationId} (${replyText.length} chars, ${defaultTone} tone)`);
  } catch (err: any) {
    // Fire-and-forget — log but never throw
    console.error("[auto-reply] Failed:", err.message);
  }
}
