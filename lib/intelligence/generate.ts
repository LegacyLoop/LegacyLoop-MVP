import { getItemEnrichmentContext } from "@/lib/enrichment";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════════════════════
   Intelligence Result — structured output from Claude synthesis
   ═══════════════════════════════════════════════════════════════════════ */

export interface IntelligenceResult {
  summary: string;
  pricingIntel: {
    recommendedLow: number;
    recommendedHigh: number;
    sweetSpot: number;
    confidence: string;
    reasoning: string;
    quickSalePrice: number;
    premiumPrice: number;
    sources: string[];
  };
  conditionAssessment: string;
  marketPosition: {
    demand: string;
    trend: string;
    competition: string;
    insight: string;
  };
  sellingStrategy: {
    bestApproach: string;
    bestPlatform: string;
    reasoning: string;
    alternativePlatforms: string[];
    timing: string;
  };
  keyInsights: string[];
  nextSteps: { step: string; reason: string; priority: string }[];
  alerts: { type: string; message: string }[];
}

/* ═══════════════════════════════════════════════════════════════════════
   Generate intelligence via Claude
   ═══════════════════════════════════════════════════════════════════════ */

export async function generateIntelligence(
  itemId: string,
  opts: {
    status?: string;
    listingPrice?: number | null;
    saleMethod?: string | null;
    photoCount?: number;
    saleZip?: string | null;
  }
): Promise<IntelligenceResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10) throw new Error("ANTHROPIC_API_KEY not configured");

  // Gather ALL enrichment data from every bot, scraper, and DB source
  const enrichment = await getItemEnrichmentContext(itemId);
  if (!enrichment.contextBlock || enrichment.contextBlock.length < 50) {
    throw new Error("Insufficient data — run AI Analysis first");
  }

  const prompt = buildPrompt(enrichment.contextBlock, opts);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

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
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: "{" },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Claude API ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    let raw = (data.content || [])
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text || "")
      .join("");

    // Prepend the prefill brace
    raw = raw.trim();
    if (!raw.startsWith("{")) raw = "{" + raw;
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Failed to parse Claude response");

    return JSON.parse(match[0]) as IntelligenceResult;
  } finally {
    clearTimeout(timeout);
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Prompt builder — sends full enrichment context to Claude
   ═══════════════════════════════════════════════════════════════════════ */

function buildPrompt(
  contextBlock: string,
  opts: {
    status?: string;
    listingPrice?: number | null;
    saleMethod?: string | null;
    photoCount?: number;
    saleZip?: string | null;
  }
): string {
  return `You are the Senior Intelligence Analyst for LegacyLoop, an AI-powered resale platform. Your job is to synthesize ALL available data about a seller's item into clear, actionable intelligence.

You are analyzing a REAL item for a REAL person. Be practical, specific, and honest. Speak like a knowledgeable friend helping them sell — no jargon, no fluff.

═══ ALL AVAILABLE ITEM DATA (from AI analysis, bot runs, scrapers, market comps) ═══
${contextBlock}
═══ END ITEM DATA ═══

CURRENT STATUS: ${opts.status || "UNKNOWN"}
LISTING PRICE: ${opts.listingPrice ? `$${opts.listingPrice}` : "Not set yet"}
SALE METHOD: ${opts.saleMethod || "Not chosen yet"}
PHOTOS UPLOADED: ${opts.photoCount ?? 0}
SELLER LOCATION: ${opts.saleZip || "Unknown"}

PRICING RULES — CRITICAL:
- Base ALL pricing on the ACTUAL comparable sales, bot analyses, and market data above.
- The recommended range must be TIGHT — ideally 15-20% spread. No lazy $50-$500 ranges.
- "sweetSpot" = the realistic price where THIS item, in THIS condition, sells within 1-2 weeks.
- "quickSalePrice" = 10-15% below sweet spot for a fast sale (1-3 days).
- "premiumPrice" = patient seller price for collectors/specialty buyers (3-6 week timeline).
- Factor in: actual condition (cosmetic AND functional), completeness, maker/brand, age/era, current demand.
- If selling locally: consider the local market multiplier and demand level.
- If selling nationally: factor in shipping costs impacting what buyers will pay.
- If data is limited, set confidence to "low" and explain exactly what data is missing.
- NEVER invent prices. Every dollar amount must trace back to actual data above.

Return ONLY valid JSON (no markdown fences, no text outside the JSON):
{
  "summary": "1-2 sentence plain-English assessment — what is this item and how is it positioned in the market right now",
  "pricingIntel": {
    "recommendedLow": 0,
    "recommendedHigh": 0,
    "sweetSpot": 0,
    "confidence": "high or medium or low",
    "reasoning": "Cite the specific comps, bot data, and market signals that informed your pricing",
    "quickSalePrice": 0,
    "premiumPrice": 0,
    "sources": ["list each data source — e.g. 'eBay sold comps avg $X', 'Amazon retail $Y', 'PriceBot revised estimate $Z'"]
  },
  "conditionAssessment": "Plain English: what condition is this item in? How does condition affect the price compared to mint/excellent examples?",
  "marketPosition": {
    "demand": "high or moderate or low",
    "trend": "rising or stable or declining",
    "competition": "heavy or moderate or light",
    "insight": "The single most important market observation for this seller"
  },
  "sellingStrategy": {
    "bestApproach": "local or national or auction or specialty",
    "bestPlatform": "The specific platform name (eBay, Facebook Marketplace, Etsy, Chairish, etc.)",
    "reasoning": "Why this platform is best for THIS specific item",
    "alternativePlatforms": ["2-3 other platforms worth listing on"],
    "timing": "Should they sell now or wait? Any seasonal factors?"
  },
  "keyInsights": ["3-5 bullet points — the most important things this seller needs to know"],
  "nextSteps": [
    {"step": "Specific action", "reason": "Why it matters", "priority": "high or medium or low"}
  ],
  "alerts": [
    {"type": "warning or opportunity or tip", "message": "Short actionable alert"}
  ]
}`;
}

/* ═══════════════════════════════════════════════════════════════════════
   Cache management — read/check staleness of cached intelligence
   ═══════════════════════════════════════════════════════════════════════ */

export async function getCachedIntelligence(itemId: string): Promise<{
  result: IntelligenceResult | null;
  cachedAt: string | null;
  isStale: boolean;
}> {
  const cached = await prisma.eventLog.findFirst({
    where: { itemId, eventType: "INTELLIGENCE_RESULT" },
    orderBy: { createdAt: "desc" },
    select: { payload: true, createdAt: true },
  });

  if (!cached?.payload) return { result: null, cachedAt: null, isStale: false };

  // Check if ANY bot has produced new results since this intelligence was generated
  const newerBotResult = await prisma.eventLog.findFirst({
    where: {
      itemId,
      eventType: {
        in: [
          "PRICEBOT_RESULT", "ANTIQUEBOT_RESULT", "COLLECTIBLESBOT_RESULT",
          "BUYERBOT_RESULT", "LISTBOT_RESULT", "RECONBOT_RESULT",
          "CARBOT_RESULT", "SHIPBOT_RESULT",
          "RAINFOREST_RESULT", "ANALYZED", "ANALYZED_FORCE",
        ],
      },
      createdAt: { gt: cached.createdAt },
    },
    select: { id: true },
  });

  // Also check MegaBot results (they use prefix-based event types)
  const newerMegaBot = await prisma.eventLog.findFirst({
    where: {
      itemId,
      eventType: { startsWith: "MEGABOT_" },
      createdAt: { gt: cached.createdAt },
    },
    select: { id: true },
  });

  try {
    const result = JSON.parse(cached.payload) as IntelligenceResult;
    return {
      result,
      cachedAt: cached.createdAt.toISOString(),
      isStale: !!(newerBotResult || newerMegaBot),
    };
  } catch {
    return { result: null, cachedAt: null, isStale: false };
  }
}
