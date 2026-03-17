import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

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

const ANALYSIS_PROMPTS: Record<string, string> = {
  openai: "You are an expert resale market analyst specializing in pricing strategy. Analyze this inventory for pricing accuracy and revenue optimization. Respond ONLY in valid JSON. No markdown fences. Start with {.",
  claude: "You are an expert in identifying hidden value and storytelling opportunities in resale items. Analyze for narrative potential and emotional value. Respond ONLY in valid JSON. No markdown fences. Start with {.",
  gemini: "You are an expert in SEO and search demand for resale marketplaces. Analyze for search visibility, demand trends, and optimal timing. Respond ONLY in valid JSON. No markdown fences. Start with {.",
  grok: "You are an expert in social media resale trends and viral potential. Analyze for social selling opportunities and trending items. Respond ONLY in valid JSON. No markdown fences. Start with {.",
};

function buildInventoryPrompt(items: any[]): string {
  const summary = items.map(i => {
    const ai = safeJson(i.aiResult?.rawJson);
    return `- ${i.title || "Untitled"} | ${ai?.category || "unknown"} | ${i.condition || "?"} | $${i.listingPrice || 0} | ${i.status} | ${Math.round((Date.now() - new Date(i.createdAt).getTime()) / 86400000)}d listed`;
  }).join("\n");

  return `FULL INVENTORY (${items.length} items):\n${summary}\n\nAnalyze ALL items. Return JSON with:\n{\n  "inventory_health_score": 0-100,\n  "top_opportunities": [{ "title": "...", "action": "...", "impact": "$X", "priority": 1-3 }],\n  "price_adjustments": [{ "title": "...", "current": X, "recommended": X, "reasoning": "..." }],\n  "category_trends": [{ "category": "...", "trend": "rising|stable|falling", "insight": "..." }],\n  "recommendations": [{ "priority": 1-3, "action": "...", "impact": "...", "items": ["..."] }],\n  "revenue_potential": X,\n  "summary": "3-4 sentence executive summary"\n}\n\nKeep response under 3000 tokens. Be specific with item names.`;
}

async function callOpenAI(prompt: string, systemPrompt: string): Promise<any> {
  if (!openai) throw new Error("No OpenAI key");
  const resp = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
    text: { format: { type: "text" } },
  });
  return parseLooseJson(resp.output_text) || null;
}

async function callClaude(prompt: string, systemPrompt: string): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10) throw new Error("No Anthropic key");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4096, system: systemPrompt, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  return parseLooseJson(data.content?.[0]?.text || "") || null;
}

async function callGemini(prompt: string, systemPrompt: string): Promise<any> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 10) throw new Error("No Gemini key");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\n" + prompt }] }], generationConfig: { maxOutputTokens: 4096 } }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return parseLooseJson(data.candidates?.[0]?.content?.parts?.[0]?.text || "") || null;
}

async function callGrok(prompt: string, systemPrompt: string): Promise<any> {
  const key = process.env.XAI_API_KEY;
  if (!key || key.length < 10) throw new Error("No Grok key");
  const res = await fetch(`${process.env.XAI_BASE_URL || "https://api.x.ai/v1"}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.XAI_MODEL_TEXT || "grok-3-fast", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }], max_tokens: 4096 }),
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

// POST: Generate new report
export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.item.findMany({
      where: { userId: user.id },
      include: { aiResult: true, valuation: true, photos: { take: 1 } },
      orderBy: { createdAt: "desc" },
    });

    if (items.length === 0) return NextResponse.json({ error: "No items to analyze" }, { status: 400 });

    // Enrich all items in parallel
    const { enrichItemContext } = await import("@/lib/addons/enrich-item-context");
    const enrichedMap = new Map<string, any>();
    await Promise.allSettled(
      items.map(async (item) => {
        try {
          const e = await enrichItemContext(item.id, item.listingPrice);
          enrichedMap.set(item.id, e);
        } catch { enrichedMap.set(item.id, null); }
      })
    );

    prisma.userEvent.create({ data: { userId: user.id, eventType: "ADDON_ENRICHED", metadata: JSON.stringify({ addonType: "market-report", itemCount: items.length, enrichedCount: enrichedMap.size, avgCompleteness: Math.round([...enrichedMap.values()].filter(Boolean).reduce((s: number, e: any) => s + (e?.dataCompleteness || 0), 0) / Math.max(enrichedMap.size, 1)) }) } }).catch(() => {});

    // Log start
    await prisma.userEvent.create({
      data: { userId: user.id, eventType: "REPORT_GENERATE_STARTED", metadata: JSON.stringify({ itemCount: items.length }) },
    });

    const prompt = buildInventoryPrompt(items) + (enrichedMap.size > 0 ? `\nENRICHED SIGNALS:\nItems with offers: ${items.filter(i => (enrichedMap.get(i.id)?.totalOffers ?? 0) > 0).length}\nItems with market comps: ${items.filter(i => (enrichedMap.get(i.id)?.marketComps?.length ?? 0) > 0).length}\nAntiques: ${items.filter(i => enrichedMap.get(i.id)?.isAntique).length}\nRising prices: ${items.filter(i => enrichedMap.get(i.id)?.priceDirection === "rising").length}` : "");

    // Run all 4 AIs with angle-specific system prompts
    const results = await Promise.allSettled([
      runWithTimer("openai", () => callOpenAI(prompt, ANALYSIS_PROMPTS.openai)),
      runWithTimer("claude", () => callClaude(prompt, ANALYSIS_PROMPTS.claude)),
      runWithTimer("gemini", () => callGemini(prompt, ANALYSIS_PROMPTS.gemini)),
      runWithTimer("grok", () => callGrok(prompt, ANALYSIS_PROMPTS.grok)),
    ]);

    const agents = results.map(r => r.status === "fulfilled" ? r.value : { provider: "unknown", result: null, error: "Promise rejected", ms: 0 });
    const successful = agents.filter(a => a.result);

    if (successful.length === 0) {
      return NextResponse.json({ error: "All AI engines failed", agents: agents.map(a => ({ provider: a.provider, error: a.error })) }, { status: 503 });
    }

    // Build master report from consensus
    const scores = successful.map(a => a.result.inventory_health_score || 0).filter(Boolean);
    const healthScore = scores.length ? Math.round(scores.reduce((s: number, v: number) => s + v, 0) / scores.length) : 50;

    const allOpportunities = successful.flatMap(a => a.result.top_opportunities || []);
    const allAdjustments = successful.flatMap(a => a.result.price_adjustments || []);
    const allTrends = successful.flatMap(a => a.result.category_trends || []);
    const allRecs = successful.flatMap(a => a.result.recommendations || []);

    const totalEstValue = items.reduce((s: number, i: any) => s + (i.valuation ? Math.round((i.valuation.low + i.valuation.high) / 2) : (i.listingPrice || 0)), 0);
    const revenuePotential = successful.map(a => a.result.revenue_potential || 0).filter(Boolean);
    const avgRevenue = revenuePotential.length ? Math.round(revenuePotential.reduce((s: number, v: number) => s + v, 0) / revenuePotential.length) : totalEstValue;

    const report = {
      reportDate: new Date().toISOString(),
      inventoryHealthScore: healthScore,
      totalItems: items.length,
      totalEstimatedValue: totalEstValue,
      revenuePotential: avgRevenue,
      revenueGap: avgRevenue - totalEstValue,
      topOpportunities: allOpportunities.slice(0, 5),
      priceAdjustments: allAdjustments.slice(0, 8),
      categoryTrends: allTrends.slice(0, 6),
      recommendations: allRecs.sort((a: any, b: any) => (a.priority || 3) - (b.priority || 3)).slice(0, 6),
      summaries: successful.map(a => ({ provider: a.provider, summary: a.result.summary || "", ms: a.ms })),
      agentResults: agents.map(a => ({ provider: a.provider, score: a.result?.inventory_health_score || null, status: a.result ? "success" : "failed", ms: a.ms })),
    };

    // Cache report
    await prisma.userEvent.create({
      data: { userId: user.id, eventType: "MARKET_REPORT_CACHED", metadata: JSON.stringify(report) },
    });

    // Log completion
    await prisma.userEvent.create({
      data: { userId: user.id, eventType: "REPORT_COMPLETED", metadata: JSON.stringify({ healthScore, itemCount: items.length, opportunities: allOpportunities.length, revenueGap: report.revenueGap, aiCount: successful.length }) },
    });

    return NextResponse.json(report);
  } catch (err: any) {
    console.error("[market-report]", err);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}

// GET: Fetch cached report
export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cached = await prisma.userEvent.findFirst({
      where: { userId: user.id, eventType: "MARKET_REPORT_CACHED" },
      orderBy: { createdAt: "desc" },
    });

    if (!cached?.metadata) return NextResponse.json({ noReport: true });
    return NextResponse.json({ ...safeJson(cached.metadata), cachedAt: cached.createdAt });
  } catch {
    return NextResponse.json({ noReport: true });
  }
}
