import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.LITELLM_BASE_URL
        ? `${process.env.LITELLM_BASE_URL}/openai/v1`
        : undefined,
    })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function parseLooseJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

const PERSONA_PROMPTS: Record<string, string> = {
  openai: `You are an expert in identifying serious collectors and enthusiasts. For this item, identify the COLLECTOR buyer persona and write 3 personalized outreach messages for different platforms. Speak to a collector's passion and expertise. Respond ONLY in valid JSON. No markdown fences. Start with {.`,
  claude: `You are an expert in emotional marketing and gift-giving psychology. For this item, identify the GIFT BUYER persona and write 3 personalized outreach messages. Connect the item to meaningful gift-giving moments. Respond ONLY in valid JSON. No markdown fences. Start with {.`,
  gemini: `You are an expert in resale market dynamics and profit-driven buyers. For this item, identify the RESELLER/FLIPPER persona and write 3 outreach messages focused on profit potential and market value. Respond ONLY in valid JSON. No markdown fences. Start with {.`,
  grok: `You are an expert in local community selling and casual buyers. For this item, identify the LOCAL/CASUAL BUYER persona and write 3 conversational outreach messages for local platforms. Respond ONLY in valid JSON. No markdown fences. Start with {.`,
};

function buildPrompt(item: any, ai: any): string {
  return `Item: ${item.title || "Untitled"}
Category: ${ai?.category || "general"}
Condition: ${item.condition || "Unknown"}
Description: ${item.description || "No description"}
Asking price: $${item.listingPrice || 0}
${ai?.item_name ? `AI identified as: ${ai.item_name}` : ""}

Return JSON:
{
  "persona": {
    "type": "collector|gift_buyer|reseller|local_buyer",
    "name": "Creative persona name (e.g. 'Vintage Enthusiast Sarah')",
    "description": "2-sentence persona description",
    "motivations": ["motivation1", "motivation2"],
    "price_sensitivity": "low|medium|high",
    "best_platforms": ["platform1", "platform2", "platform3"],
    "likelihood_to_buy": 0-100
  },
  "messages": [
    {
      "platform": "ebay|facebook|instagram|etc",
      "subject": "Optional subject line",
      "body": "Ready-to-send outreach message 3-5 sentences",
      "tone": "friendly|professional|casual|enthusiastic",
      "estimated_response_rate": 0-100
    }
  ],
  "outreach_strategy": "One paragraph strategy for reaching this buyer type"
}

Keep response under 2000 tokens. Be specific and actionable.`;
}

async function callOpenAI(prompt: string): Promise<any> {
  if (!openai) throw new Error("No OpenAI key");
  const resp = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [{ role: "system", content: PERSONA_PROMPTS.openai }, { role: "user", content: prompt }],
    text: { format: { type: "text" } },
  });
  return parseLooseJson(resp.output_text) || null;
}

async function callClaude(prompt: string): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10) throw new Error("No Anthropic key");
  const ANTHROPIC_BASE = process.env.LITELLM_BASE_URL
    ? `${process.env.LITELLM_BASE_URL}/anthropic`
    : "https://api.anthropic.com";
  const res = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4096, system: PERSONA_PROMPTS.claude, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  return parseLooseJson(data.content?.[0]?.text || "") || null;
}

async function callGemini(prompt: string): Promise<any> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 10) throw new Error("No Gemini key");
  const GEMINI_BASE = process.env.LITELLM_BASE_URL
    ? `${process.env.LITELLM_BASE_URL}/gemini`
    : "https://generativelanguage.googleapis.com";
  const url = `${GEMINI_BASE}/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: PERSONA_PROMPTS.gemini + "\n\n" + prompt }] }], generationConfig: { maxOutputTokens: 4096 } }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return parseLooseJson(data.candidates?.[0]?.content?.parts?.[0]?.text || "") || null;
}

async function callGrok(prompt: string): Promise<any> {
  const key = process.env.XAI_API_KEY;
  if (!key || key.length < 10) throw new Error("No Grok key");
  const XAI_BASE = process.env.LITELLM_BASE_URL
    ? `${process.env.LITELLM_BASE_URL}/xai/v1`
    : (process.env.XAI_BASE_URL || "https://api.x.ai/v1");
  const res = await fetch(`${XAI_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.XAI_MODEL_TEXT || "grok-3-fast", messages: [{ role: "system", content: PERSONA_PROMPTS.grok }, { role: "user", content: prompt }], max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`Grok ${res.status}`);
  const data = await res.json();
  return parseLooseJson(data.choices?.[0]?.message?.content || "") || null;
}

async function runWithTimer(name: string, fn: () => Promise<any>): Promise<{ provider: string; result: any; error: string | null; ms: number }> {
  const start = Date.now();
  try {
    const result = await fn();
    return { provider: name, result, error: null, ms: Date.now() - start };
  } catch (e: any) {
    return { provider: name, result: null, error: e.message || "Error", ms: Date.now() - start };
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await req.json().catch(() => ({ itemId: null }));
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true, valuation: true, photos: { take: 1 } },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id && !isDemoMode()) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    // Enrich with full LegacyLoop data signals
    const { enrichItemContext } = await import("@/lib/addons/enrich-item-context");
    const enriched = await enrichItemContext(itemId, item.listingPrice).catch(() => null);

    if (enriched) {
      prisma.eventLog.create({ data: { itemId, eventType: "ADDON_ENRICHED", payload: JSON.stringify({ addonType: "outreach", dataCompleteness: enriched.dataCompleteness, hasComps: enriched.marketComps.length > 0, hasOffers: enriched.totalOffers > 0 }) } }).catch(() => {});
    }

    const ai = safeJson(item.aiResult?.rawJson);
    const prompt = buildPrompt(item, ai) + (enriched ? `\nBUYER INTELLIGENCE:\nOffers: ${enriched.totalOffers} total, highest $${enriched.highestOffer || "none"}, avg $${enriched.avgOffer || "none"}\nOffer-to-ask: ${enriched.offerToAskRatio || "N/A"}\nIs antique: ${enriched.isAntique}\nPrice direction: ${enriched.priceDirection}\nAvg market comp: $${enriched.avgCompPrice || "N/A"}\nData completeness: ${enriched.dataCompleteness}%` : "");

    // Log start
    await prisma.eventLog.create({
      data: { itemId, eventType: "OUTREACH_BLAST_STARTED", payload: JSON.stringify({ userId: user.id }) },
    });

    // Run all 4 AIs in parallel
    const results = await Promise.allSettled([
      runWithTimer("openai", () => callOpenAI(prompt)),
      runWithTimer("claude", () => callClaude(prompt)),
      runWithTimer("gemini", () => callGemini(prompt)),
      runWithTimer("grok", () => callGrok(prompt)),
    ]);

    const agents = results.map(r => r.status === "fulfilled" ? r.value : { provider: "unknown", result: null, error: "Promise rejected", ms: 0 });
    const successful = agents.filter(a => a.result?.persona);

    if (successful.length === 0) {
      return NextResponse.json({ error: "All AI engines failed", agents: agents.map(a => ({ provider: a.provider, error: a.error })) }, { status: 503 });
    }

    // Build combined result: collect all personas and messages
    const personas = successful.map(a => ({
      ...a.result.persona,
      provider: a.provider,
      strategy: a.result.outreach_strategy || "",
      messages: a.result.messages || [],
    }));

    // Rank all messages by estimated_response_rate (descending)
    const allMessages = successful.flatMap(a =>
      (a.result.messages || []).map((m: any) => ({
        ...m,
        provider: a.provider,
        personaType: a.result.persona?.type || "unknown",
        personaName: a.result.persona?.name || "Unknown Persona",
      }))
    ).sort((a: any, b: any) => (b.estimated_response_rate || 0) - (a.estimated_response_rate || 0));

    // Find top persona (highest likelihood_to_buy)
    const topPersona = personas.reduce((best, p) =>
      (p.likelihood_to_buy || 0) > (best.likelihood_to_buy || 0) ? p : best
    , personas[0]);

    // Build overall strategy summary
    const overallStrategy = successful.map(a =>
      `${a.result.persona?.type || "unknown"}: ${a.result.outreach_strategy || ""}`
    ).join("\n\n");

    // Log completion
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "OUTREACH_BLAST_COMPLETED",
        payload: JSON.stringify({
          userId: user.id,
          personaCount: personas.length,
          messageCount: allMessages.length,
          topPersonaType: topPersona?.type || null,
          aiCount: successful.length,
        }),
      },
    });

    return NextResponse.json({
      itemId,
      personas,
      messages: allMessages,
      topPersona,
      overallStrategy,
      totalMessages: allMessages.length,
      agentResults: agents.map(a => ({
        provider: a.provider,
        personaType: a.result?.persona?.type || null,
        personaName: a.result?.persona?.name || null,
        likelihood: a.result?.persona?.likelihood_to_buy || null,
        status: a.result ? "success" : "failed",
        ms: a.ms,
        error: a.error,
      })),
    });
  } catch (err: any) {
    console.error("[buyer-outreach]", err);
    return NextResponse.json({ error: "Outreach blast failed" }, { status: 500 });
  }
}
