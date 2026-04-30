import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { helpArticles } from "@/lib/help-articles";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.LITELLM_BASE_URL
        ? `${process.env.LITELLM_BASE_URL}/openai/v1`
        : undefined,
    })
  : null;

function buildKnowledgeBase(): string {
  return helpArticles.map(a =>
    `## ${a.title} (Category: ${a.category})\n${a.summary}\n${a.content}`
  ).join("\n\n---\n\n");
}

const SYSTEM_PROMPT = `You are LegacyLoop's AI Help Assistant — a friendly, patient, and knowledgeable support agent for an estate resale platform. Your users are often seniors (60+) who may not be tech-savvy. Be warm, clear, and never condescending.

GOLDEN RULES:
1. SIMPLE LANGUAGE — No jargon. Say "click the blue button" not "navigate to the CTA element"
2. STEP BY STEP — Break answers into numbered steps. One action per step.
3. REASSURING — Say things like "Don't worry, this is easy" and "You're doing great"
4. HONEST — If you don't know something, say "I'm not sure about that — let me connect you with our support team" and suggest they use the contact form
5. SHORT — Keep answers under 200 words unless the question requires a walkthrough
6. SPECIFIC — Reference exact button names, page names, and menu locations in the app

ABOUT LEGACYLOOP:
- AI-powered resale platform for estate sales, antiques, collectibles, vehicles, and everyday items
- 11 AI bots analyze, price, list, find buyers, and manage shipping
- 42 marketplace scrapers provide real pricing data
- 4 subscription tiers: Free, DIY Seller ($10/mo), Power Seller ($25/mo), Estate Manager ($75/mo)
- Credits system for add-on services
- White-Glove estate services (3 tiers: Essentials $1,750, Professional $3,500, Legacy $7,000)
- Connected platforms: Facebook, Instagram, eBay, Craigslist, Uncle Henry's, OfferUp, Mercari, Poshmark, Etsy, Nextdoor
- Heroes discount: 25% off for military, law enforcement, fire/EMS

ESCALATION:
- If the user is frustrated, confused after 2 exchanges, or asks to talk to a human → say "I understand — let me connect you with our support team. You can reach us at support@legacy-loop.com or call (207) 555-0127 (Mon-Sat, 8am-8pm EST)."
- Never argue. Always validate their frustration first.

KNOWLEDGE BASE:
${buildKnowledgeBase()}

If a question isn't covered, give your best general answer and recommend they contact support.
Return answers in plain text. Use numbered steps for how-to questions.`;

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession().catch(() => null);
    const body = await req.json();
    const { message, conversationHistory } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json({
        reply: "Thanks for your question! Our AI assistant is being set up. In the meantime, browse our Help Center articles or contact us at support@legacy-loop.com or (207) 555-0127.",
        isDemo: true,
      });
    }

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-12)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message.slice(0, 2000) });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: messages,
        max_output_tokens: 1000,
      }, { signal: controller.signal });

      const reply = typeof response.output === "string"
        ? response.output
        : response.output_text || "I'm sorry, I had trouble generating a response. Please try again or contact support@legacy-loop.com.";

      prisma.eventLog.create({
        data: {
          itemId: "HELP_SYSTEM",
          eventType: "HELP_CHAT",
          payload: JSON.stringify({ userId: user?.id || "anonymous", question: message.slice(0, 500), replyLength: reply.length, timestamp: new Date().toISOString() }),
        },
      }).catch(() => null);

      return NextResponse.json({ reply, isDemo: false });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (e: any) {
    console.error("[help/chat]", e);
    return NextResponse.json({
      reply: "I'm having a moment — please try again in a few seconds. If this keeps happening, contact us at support@legacy-loop.com or (207) 555-0127.",
      error: true,
    });
  }
}
