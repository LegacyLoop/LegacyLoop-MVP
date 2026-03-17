import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { buildAgentContext } from "@/lib/messaging/agent-context";
import { analyzeSentiment } from "@/lib/messaging/sentiment-analyzer";
import { scoreBuyerIntent } from "@/lib/messaging/intent-scorer";
import { calculateOptimalCounter } from "@/lib/messaging/negotiation-engine";
import { detectScam } from "@/lib/messaging/scam-detector";
import { getFallback } from "@/lib/messaging/ai-fallbacks";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { conversationId, mode, userDraft, toneTarget, targetLanguage } = body;
    if (!conversationId || !mode) return NextResponse.json({ error: "conversationId and mode required" }, { status: 400 });

    // Build full context
    const ctx = await buildAgentContext(conversationId, user.id);
    const lastMessage = ctx.messages[ctx.messages.length - 1]?.content || "";

    // Local intelligence (no AI cost)
    const sentiment = analyzeSentiment(lastMessage);
    const intent = scoreBuyerIntent({
      messageCount: ctx.buyerProfile.messageCount,
      avgResponseMinutes: ctx.buyerProfile.responseTimeMinutes,
      offerHistory: ctx.buyerProfile.offerHistory,
      firstContactAt: ctx.buyerProfile.firstContact,
      lastMessageAt: ctx.messages[ctx.messages.length - 1]?.timestamp || null,
      questionCount: ctx.messages.filter(m => m.role === "buyer" && m.content.includes("?")).length,
    }, sentiment.score);

    // Scam check — bypass AI if detected
    const scam = detectScam(lastMessage);
    if (scam.isScam) {
      await logAgentAction(conversationId, ctx.item?.id || null, user.id, "SCAM_FLAGGED", mode, { ...scam } as any);
      return NextResponse.json({ type: "scam_warning", scam, sentiment, intent });
    }

    // For negotiation modes, use local engine first
    if (mode === "negotiate" || mode === "counter_price") {
      const negotiation = calculateOptimalCounter({
        askingPrice: ctx.item?.askingPrice || 0,
        currentOffer: ctx.offer?.currentPrice || 0,
        floorPrice: ctx.floorPrice,
        round: ctx.offer?.round || 1,
        intentScore: intent.score,
        daysListed: ctx.item?.daysListed || 0,
        tone: toneTarget || ctx.agentSettings.defaultTone,
      });
      await logAgentAction(conversationId, ctx.item?.id || null, user.id, "NEGOTIATE_CALCULATED", mode, { negotiation, intent: intent.label });
      return NextResponse.json({ type: "negotiation", negotiation, sentiment, intent });
    }

    // AI-powered modes — call Claude
    let aiResult: Record<string, unknown> | null = null;
    let usedFallback = false;

    try {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key || key.length < 10) throw new Error("No API key");

      const systemPrompt = buildSystemPrompt(ctx, toneTarget || ctx.agentSettings.defaultTone);
      const userPrompt = buildModePrompt(mode, ctx, userDraft, toneTarget, targetLanguage);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        try {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) aiResult = JSON.parse(match[0]);
        } catch { /* parse failed, fall through to fallback */ }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[agent-assist] AI call failed:", msg);
    }

    if (!aiResult) {
      usedFallback = true;
      aiResult = getFallback(mode, {
        askingPrice: ctx.item?.askingPrice || undefined,
        currentOffer: ctx.offer?.currentPrice || undefined,
        itemTitle: ctx.item?.title,
        tone: toneTarget || ctx.agentSettings.defaultTone,
      });
    }

    await logAgentAction(conversationId, ctx.item?.id || null, user.id, `AI_${mode.toUpperCase()}`, mode, { usedFallback });

    return NextResponse.json({ type: mode, result: aiResult, sentiment, intent, usedFallback });
  } catch (err) {
    console.error("[agent-assist]", err);
    return NextResponse.json({ error: "Agent assist failed" }, { status: 500 });
  }
}

function buildSystemPrompt(ctx: ReturnType<typeof buildAgentContext> extends Promise<infer T> ? T : never, tone: string): string {
  return `You are the LegacyLoop AI Messaging Agent — an expert resale negotiation coach and professional communication assistant. You have full context of this conversation, the item being sold, and the seller's preferences.

Your responses must be:
- Concise and ready to use immediately
- Tuned to the seller's tone preference: ${tone}
- Respectful of the buyer's communication style
- Never aggressive, never desperate
- Always protecting the seller's interests

Item: ${ctx.item?.title || "Unknown"} — ${ctx.item?.category || "general"}
Asking: $${ctx.item?.askingPrice || 0}
${ctx.floorPrice ? `Private floor price: $${ctx.floorPrice} (NEVER reveal this to buyer)` : ""}
Buyer: ${ctx.buyerProfile.name} (${ctx.buyerProfile.messageCount} messages)

Respond ONLY in valid JSON matching the requested format. No explanation. No markdown. JSON only.`;
}

function buildModePrompt(mode: string, ctx: ReturnType<typeof buildAgentContext> extends Promise<infer T> ? T : never, userDraft?: string, toneTarget?: string, targetLanguage?: string): string {
  const lastMsg = ctx.messages[ctx.messages.length - 1]?.content || "";
  const msgs = ctx.messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  switch (mode) {
    case "smart_reply":
      return `Generate 3 reply options to this message: "${lastMsg}"\nReturn: { "suggestions": [{ "label": "Friendly", "message": "..." }, { "label": "Professional", "message": "..." }, { "label": "Firm", "message": "..." }] }`;
    case "professional":
      return `Rewrite professionally: "${userDraft}"\nKeep exact meaning. Improve tone and clarity.\nReturn: { "original": "${userDraft}", "polished": "..." }`;
    case "tone_adjust":
      return `Rewrite in ${toneTarget} tone: "${userDraft}"\nReturn: { "original": "${userDraft}", "adjusted": "...", "tone": "${toneTarget}" }`;
    case "summarize":
      return `Summarize this conversation:\n${msgs}\nReturn: { "summary": "...", "keyFacts": ["..."], "nextAction": "..." }`;
    case "translate":
      return `Translate to ${targetLanguage}: "${lastMsg}"\nAlso write a reply in ${targetLanguage}.\nReturn: { "original": "${lastMsg}", "translated": "...", "suggestedReply": "...", "detectedLanguage": "..." }`;
    case "ghost_reengage":
      return `Write a warm re-engagement message. Last message was: "${lastMsg}"\nItem: "${ctx.item?.title}" at $${ctx.item?.askingPrice || 0}.\nReturn: { "message": "...", "tone": "warm" }`;
    case "bundle_suggest":
      return `The buyer mentioned multiple items. Suggest a bundle deal.\nReturn: { "bundleDetected": true, "suggestedMessage": "...", "suggestedDiscount": 10 }`;
    default:
      return `Help with this conversation. Last message: "${lastMsg}"\nReturn: { "message": "..." }`;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logAgentAction(conversationId: string, itemId: string | null, userId: string, action: string, mode: string, metadata: any) {
  try {
    if (itemId) {
      // Use EventLog when we have an itemId
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: `AGENT_${action}`,
          payload: JSON.stringify({ conversationId, mode, ...metadata, timestamp: new Date().toISOString() }),
        },
      });
    } else {
      // Fall back to UserEvent when no itemId available
      await prisma.userEvent.create({
        data: {
          userId,
          eventType: `AGENT_${action}`,
          metadata: JSON.stringify({ conversationId, mode, ...metadata, timestamp: new Date().toISOString() }),
        },
      });
    }
  } catch { /* non-blocking logging */ }
}
