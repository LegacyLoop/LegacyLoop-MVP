import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import { BOT_CREDIT_COSTS } from "@/lib/constants/pricing";

/* ═══════════════════════════════════════════════════════════════════════
   GET  — Return chat history for this item
   POST — Ask Claude a question about the item's intelligence data
   ═══════════════════════════════════════════════════════════════════════ */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const logs = await prisma.eventLog.findMany({
    where: { itemId, eventType: "INTELLIGENCE_CHAT" },
    orderBy: { createdAt: "asc" },
    select: { payload: true, createdAt: true },
    take: 50,
  });

  const messages = logs
    .map((l) => {
      try {
        return l.payload ? JSON.parse(l.payload) : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = body?.question?.trim();
  if (!question || question.length < 2) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Question too long (max 500 chars)" }, { status: 400 });
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // ── Credit check ──
  const creditCost = BOT_CREDIT_COSTS.intelligenceChat;
  const credits = await prisma.userCredits.findUnique({ where: { userId: user.id } });
  if (!credits || credits.balance < creditCost) {
    return NextResponse.json(
      { error: `Insufficient credits — need ${creditCost} cr (have ${credits?.balance ?? 0})` },
      { status: 402 }
    );
  }

  // ── Gather enrichment context ──
  const enrichment = await getItemEnrichmentContext(itemId);

  // ── Load recent chat history for context continuity ──
  const recentLogs = await prisma.eventLog.findMany({
    where: { itemId, eventType: "INTELLIGENCE_CHAT" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { payload: true },
  });

  const history = recentLogs
    .reverse()
    .flatMap((l) => {
      try {
        if (!l.payload) return [];
        const m = JSON.parse(l.payload);
        return [
          { role: "user" as const, content: m.question },
          { role: "assistant" as const, content: m.answer },
        ];
      } catch {
        return [];
      }
    });

  // ── Call Claude ──
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 });
  }

  const systemPrompt = `You are LegacyLoop's AI assistant helping a seller understand their item's intelligence data. You have access to ALL bot analysis results, market comps, pricing data, and enrichment info for this specific item.

Rules:
- Be concise: 2-4 sentences max per answer
- Be practical and specific — cite actual data points when possible
- Speak like a knowledgeable friend, not a corporate bot
- If the data doesn't cover their question, say so honestly
- Never make up prices or data — only reference what's in the context below
- If they ask about something no bot has analyzed yet, suggest which bot to run

═══ ALL ITEM INTELLIGENCE DATA ═══
${enrichment.contextBlock || "No enrichment data available yet. Suggest running AI Analysis first."}
═══ END DATA ═══`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 512,
        temperature: 0.3,
        system: systemPrompt,
        messages: [...history, { role: "user", content: question }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Claude API ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const answer =
      (data.content || [])
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text || "")
        .join("") || "I couldn't generate an answer right now. Please try again.";

    // ── Deduct credits ──
    await prisma.$transaction([
      prisma.userCredits.update({
        where: { userId: user.id },
        data: { balance: { decrement: creditCost }, spent: { increment: creditCost } },
      }),
      prisma.creditTransaction.create({
        data: {
          userCreditsId: credits.id,
          amount: -creditCost,
          type: "spend",
          description: "Intelligence chat question",
          balance: credits.balance - creditCost,
          itemId,
        },
      }),
    ]);

    // ── Store Q&A in EventLog ──
    const timestamp = new Date().toISOString();
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "INTELLIGENCE_CHAT",
        payload: JSON.stringify({ question, answer, timestamp }),
      },
    });

    return NextResponse.json({ answer, timestamp });
  } catch (err: any) {
    console.error("[IntelligenceChat] Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Chat failed" },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
