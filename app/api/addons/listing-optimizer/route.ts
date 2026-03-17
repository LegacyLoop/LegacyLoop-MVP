import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/constants/pricing";
import OpenAI from "openai";

const PLATFORMS = ["ebay", "facebook_marketplace", "instagram", "tiktok", "etsy", "craigslist", "offerup", "mercari", "poshmark", "legacyloop"];

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function parseLooseJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

const SYSTEM_PROMPT = `You are an elite resale listing optimizer. Your job is to maximize conversion rate, SEO visibility, and buyer psychology for item listings across multiple platforms.

Score the current listing 0-100 and provide an optimized version. Match each platform's tone and format.

Respond ONLY in valid JSON. No markdown fences. Start with {.`;

function buildPrompt(item: any, ai: any): string {
  return `Item: ${item.title || "Untitled"}
Category: ${ai?.category || "general"}
Condition: ${item.condition || "Unknown"}
Current description: ${item.description || "No description"}
Asking price: $${item.listingPrice || 0}
${ai?.item_name ? `AI identified as: ${ai.item_name}` : ""}
${ai?.estimated_value_mid ? `AI estimated value: $${ai.estimated_value_mid}` : ""}

For these platforms: ${PLATFORMS.join(", ")}

Return JSON:
{
  "overall_score": number,
  "platforms": {
    "ebay": { "current_score": number, "optimized_score": number, "title": "optimized title max 80 chars", "description": "2-4 sentences platform-appropriate", "tags": ["5-8 tags"], "hook_line": "attention grabber", "posting_tip": "one tip", "key_improvements": ["improvement 1", "improvement 2"] },
    ... same for each platform ...
  },
  "top_keywords": ["5 best keywords"],
  "estimated_improvement": "1 sentence summary"
}

Keep total response under 3000 tokens. Be concise.`;
}

async function callOpenAI(prompt: string): Promise<any> {
  if (!openai) throw new Error("No OpenAI key");
  const resp = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [{ role: "system", content: SYSTEM_PROMPT + "\n\nYou specialize in professional marketplace copy." }, { role: "user", content: prompt }],
    text: { format: { type: "text" } },
  });
  return parseLooseJson(resp.output_text) || null;
}

async function callClaude(prompt: string): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10) throw new Error("No Anthropic key");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4096, system: SYSTEM_PROMPT + "\n\nYou specialize in emotional storytelling and craftsmanship angles.", messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  return parseLooseJson(data.content?.[0]?.text || "") || null;
}

async function callGemini(prompt: string): Promise<any> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 10) throw new Error("No Gemini key");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\nYou specialize in SEO optimization and search visibility.\n\n" + prompt }] }], generationConfig: { maxOutputTokens: 4096 } }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return parseLooseJson(data.candidates?.[0]?.content?.parts?.[0]?.text || "") || null;
}

async function callGrok(prompt: string): Promise<any> {
  const key = process.env.XAI_API_KEY;
  if (!key || key.length < 10) throw new Error("No Grok key");
  const res = await fetch(`${process.env.XAI_BASE_URL || "https://api.x.ai/v1"}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.XAI_MODEL_TEXT || "grok-3-fast", messages: [{ role: "system", content: SYSTEM_PROMPT + "\n\nYou specialize in social media viral angles and trending hooks." }, { role: "user", content: prompt }], max_tokens: 4096 }),
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
      prisma.eventLog.create({ data: { itemId, eventType: "ADDON_ENRICHED", payload: JSON.stringify({ addonType: "optimizer", dataCompleteness: enriched.dataCompleteness, hasComps: enriched.marketComps.length > 0, hasOffers: enriched.totalOffers > 0, hasAntique: enriched.isAntique }) } }).catch(() => {});
    }

    const ai = safeJson(item.aiResult?.rawJson);
    const prompt = buildPrompt(item, ai) + (enriched ? `\nMARKET INTELLIGENCE:\nPrice direction: ${enriched.priceDirection}\nAvg market comp: $${enriched.avgCompPrice || "N/A"}\nOffers received: ${enriched.totalOffers} (highest: $${enriched.highestOffer || "none"})\nOffer-to-ask ratio: ${enriched.offerToAskRatio || "N/A"}\nIs antique: ${enriched.isAntique}\nData completeness: ${enriched.dataCompleteness}%` : "");

    // Log start
    await prisma.eventLog.create({
      data: { itemId, eventType: "OPTIMIZER_STARTED", payload: JSON.stringify({ userId: user.id }) },
    });

    // Run all 4 AIs in parallel
    const results = await Promise.allSettled([
      runWithTimer("openai", () => callOpenAI(prompt)),
      runWithTimer("claude", () => callClaude(prompt)),
      runWithTimer("gemini", () => callGemini(prompt)),
      runWithTimer("grok", () => callGrok(prompt)),
    ]);

    const agents = results.map(r => r.status === "fulfilled" ? r.value : { provider: "unknown", result: null, error: "Promise rejected", ms: 0 });
    const successful = agents.filter(a => a.result?.platforms);

    if (successful.length === 0) {
      return NextResponse.json({ error: "All AI engines failed", agents: agents.map(a => ({ provider: a.provider, error: a.error })) }, { status: 503 });
    }

    // Build consensus: average scores, best titles
    const consensus: any = { platforms: {}, top_keywords: [], estimated_improvement: "" };
    let totalBefore = 0, totalAfter = 0, platformCount = 0;

    for (const plat of PLATFORMS) {
      const platResults = successful.map(a => a.result.platforms?.[plat]).filter(Boolean);
      if (platResults.length === 0) continue;

      const avgBefore = Math.round(platResults.reduce((s: number, p: any) => s + (p.current_score || 0), 0) / platResults.length);
      const avgAfter = Math.round(platResults.reduce((s: number, p: any) => s + (p.optimized_score || 0), 0) / platResults.length);

      // Pick best title (from highest scoring AI)
      const best = platResults.sort((a: any, b: any) => (b.optimized_score || 0) - (a.optimized_score || 0))[0];

      consensus.platforms[plat] = {
        current_score: avgBefore,
        optimized_score: avgAfter,
        title: best.title || "",
        description: best.description || "",
        tags: best.tags || [],
        hook_line: best.hook_line || "",
        posting_tip: best.posting_tip || "",
        key_improvements: best.key_improvements || [],
      };

      totalBefore += avgBefore;
      totalAfter += avgAfter;
      platformCount++;
    }

    const originalScore = platformCount > 0 ? Math.round(totalBefore / platformCount) : 0;
    const optimizedScore = platformCount > 0 ? Math.round(totalAfter / platformCount) : 0;

    // Merge keywords
    const allKw = successful.flatMap(a => a.result.top_keywords || []);
    consensus.top_keywords = [...new Set(allKw)].slice(0, 10);
    consensus.estimated_improvement = successful[0]?.result?.estimated_improvement || `+${optimizedScore - originalScore} point improvement across ${platformCount} platforms`;

    // Log completion
    await prisma.eventLog.create({
      data: { itemId, eventType: "OPTIMIZER_COMPLETED", payload: JSON.stringify({ userId: user.id, originalScore, optimizedScore, improvement: optimizedScore - originalScore, aiCount: successful.length, platforms: platformCount, dataCompleteness: enriched?.dataCompleteness ?? 0 }) },
    });

    return NextResponse.json({
      itemId,
      originalScore,
      optimizedScore,
      improvement: optimizedScore - originalScore,
      platforms: consensus.platforms,
      consensus: { topKeywords: consensus.top_keywords, estimatedImprovement: consensus.estimated_improvement },
      agentResults: agents.map(a => ({ provider: a.provider, score: a.result?.overall_score || null, status: a.result ? "success" : "failed", ms: a.ms, error: a.error })),
      publishHubUrl: `/bots/listbot?item=${itemId}`,
    });
  } catch (err: any) {
    console.error("[listing-optimizer]", err);
    return NextResponse.json({ error: "Optimizer failed" }, { status: 500 });
  }
}
