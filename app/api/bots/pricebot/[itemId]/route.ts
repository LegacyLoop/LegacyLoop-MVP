import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import { populateFromPriceBot } from "@/lib/data/populate-intelligence";
import { logUserEvent } from "@/lib/data/user-events";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * GET /api/bots/pricebot/[itemId]
 * Retrieve existing PriceBot result for an item
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "PRICEBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json({ hasResult: false, result: null });
    }

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
    });
  } catch (e) {
    console.error("[pricebot GET]", e);
    return NextResponse.json({ error: "Failed to fetch PriceBot result" }, { status: 500 });
  }
}

/**
 * POST /api/bots/pricebot/[itemId]
 * Run dedicated PriceBot pricing deep-dive on an item
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    // ── Tier + Credit Gate ──
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "priceBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access PriceBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "PRICEBOT");
      const cost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run PriceBot.", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "PriceBot re-run" : "PriceBot run", itemId);
    }

    // Fetch item with analysis data
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        aiResult: true,
        valuation: true,
        antiqueCheck: true,
        photos: { orderBy: { order: "asc" }, take: 6 },
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    const ai = safeJson(item.aiResult?.rawJson);
    const v = item.valuation;

    if (!ai || !v) {
      return NextResponse.json({ error: "Run AI analysis first" }, { status: 400 });
    }

    // Build context from existing analysis
    const itemName = ai.item_name || item.title || "Unknown item";
    const category = ai.category || "General";
    const material = ai.material || "Unknown";
    const era = ai.era || "Unknown";
    const conditionScore = ai.condition_score || 7;
    const conditionLabel = conditionScore >= 8 ? "Excellent" : conditionScore >= 5 ? "Good" : "Fair";
    const estimatedLow = Math.round(v.low);
    const estimatedHigh = Math.round(v.high);
    const estimatedMid = v.mid ? Math.round(v.mid) : Math.round((v.low + v.high) / 2);
    const pricingRationale = v.rationale || "No rationale available";
    const sellerZip = item.saleZip || "04901";
    const isAntique = item.antiqueCheck?.isAntique || false;

    // ── CROSS-BOT ENRICHMENT ──
    const enrichment = await getItemEnrichmentContext(itemId, "pricebot").catch(() => null);
    const enrichmentPrefix = enrichment?.hasEnrichment ? enrichment.contextBlock + "\n\n" : "";

    // ── AMAZON ENRICHMENT FROM RAINFOREST ──
    let amazonContext = "";
    try {
      const rainforestLog = await prisma.eventLog.findFirst({
        where: { itemId: item.id, eventType: "RAINFOREST_RESULT" },
        orderBy: { createdAt: "desc" },
        select: { payload: true },
      });
      if (rainforestLog?.payload) {
        const amazon = JSON.parse(rainforestLog.payload);
        const topProducts = (amazon.products || amazon.topProducts || []).slice(0, 3);
        amazonContext = `\n\nAMAZON MARKET DATA (from Rainforest API — real data):
Search term: ${amazon.searchTerm || "N/A"}
Results found: ${amazon.resultCount || amazon.result_count || 0}
New retail price range: $${amazon.priceLow ?? amazon.price_low ?? "?"} — $${amazon.priceHigh ?? amazon.price_high ?? "?"}
Average retail: $${amazon.priceAvg ?? amazon.price_avg ?? "?"}
${topProducts.map((p: any, i: number) => `Product ${i + 1}: ${p.title || p.name || "N/A"} — $${p.price ?? "?"} (${p.rating ?? "?"} stars, ${p.reviews ?? "?"} reviews)`).join("\n")}
NOTE: These are NEW retail prices. Used/secondhand items typically sell for 30-70% of retail depending on condition. Use this Amazon data as an ANCHOR for bounding the used price.`;
      }
    } catch { /* non-critical */ }

    // ── PRICEBOT PROMPT ──
    const systemPrompt = enrichmentPrefix + `You are a world-class resale pricing analyst and market researcher with 20 years of experience in antiques, collectibles, electronics, furniture, and general resale. You have been given an item that has ALREADY been identified by another AI. Your ONLY job is pricing — go as deep as possible.

You are analyzing: ${itemName} — ${category} — ${material} — ${era} — ${conditionLabel} (${conditionScore}/10)

The general analysis already estimated: $${estimatedLow} — $${estimatedHigh} (mid: $${estimatedMid})

Your job is to VALIDATE, REFINE, or CHALLENGE that estimate with deeper pricing research. Be specific. Be accurate. Use real-world market knowledge.

Return a JSON object with ALL of the following fields:

{
  "price_validation": {
    "agrees_with_estimate": boolean,
    "revised_low": number,
    "revised_mid": number,
    "revised_high": number,
    "revision_reasoning": "Why you agree or disagree with the original estimate. Be specific."
  },
  "comparable_sales": [
    {
      "platform": "eBay | Etsy | Facebook Marketplace | Auction House | Craigslist | Mercari | Other",
      "item_description": "Exact description of the comparable item sold",
      "sold_price": number,
      "sold_date": "approximate date or range",
      "condition_compared": "Better | Similar | Worse",
      "relevance": "High | Medium | Low",
      "notes": "Any differences that affect comparison"
    }
  ],
  "market_analysis": {
    "demand_level": "Hot | Strong | Moderate | Weak | Dead",
    "demand_trend": "Rising | Stable | Declining",
    "demand_reasoning": "Why demand is at this level right now",
    "supply_level": "Scarce | Low | Moderate | Saturated | Flooded",
    "supply_reasoning": "How many of these are currently available for sale",
    "market_saturation": "How many active listings exist for similar items",
    "seasonal_factors": "Does this sell better at certain times of year?",
    "category_health": "Overall health of this category in the resale market"
  },
  "platform_pricing": {
    "ebay": {
      "recommended_list_price": number,
      "expected_sell_price": number,
      "avg_days_to_sell": number,
      "fees_percentage": number,
      "seller_net_after_fees": number,
      "tips": "eBay-specific selling tips"
    },
    "facebook_marketplace": { "recommended_list_price": number, "expected_sell_price": number, "avg_days_to_sell": number, "fees_percentage": number, "seller_net_after_fees": number, "tips": "" },
    "etsy": { "recommended_list_price": number, "expected_sell_price": number, "avg_days_to_sell": number, "fees_percentage": number, "seller_net_after_fees": number, "tips": "" },
    "craigslist": { "recommended_list_price": number, "expected_sell_price": number, "avg_days_to_sell": number, "fees_percentage": number, "seller_net_after_fees": number, "tips": "" },
    "mercari": { "recommended_list_price": number, "expected_sell_price": number, "avg_days_to_sell": number, "fees_percentage": number, "seller_net_after_fees": number, "tips": "" },
    "offerup": { "recommended_list_price": number, "expected_sell_price": number, "avg_days_to_sell": number, "fees_percentage": number, "seller_net_after_fees": number, "tips": "" },
    "antique_shop_consignment": { "recommended_price": number, "typical_consignment_cut": "percentage", "seller_net": number, "tips": "" },
    "auction_house": { "estimated_hammer_price": number, "buyers_premium": "percentage", "sellers_commission": "percentage", "seller_net": number, "recommended_reserve": number, "tips": "" },
    "best_platform": "Which platform is best for THIS specific item and why"
  },
  "regional_pricing": {
    "seller_location": "${sellerZip}",
    "local_market_strength": "Strong | Average | Weak",
    "local_price_estimate": number,
    "best_us_market": { "city": "", "why": "", "price_premium": "", "estimated_price": number },
    "worst_us_market": { "city": "", "why": "", "price_discount": "", "estimated_price": number },
    "ship_vs_local_verdict": "Should seller ship to better market or sell locally?"
  },
  "price_factors": {
    "value_adders": [{ "factor": "", "impact": "", "explanation": "" }],
    "value_reducers": [{ "factor": "", "impact": "", "explanation": "" }],
    "condition_sensitivity": "High | Medium | Low",
    "condition_price_curve": "What would this be worth at 10/10 condition?"
  },
  "negotiation_guide": {
    "list_price": number,
    "minimum_accept": number,
    "sweet_spot": number,
    "first_offer_expect": "",
    "counter_strategy": "",
    "urgency_factor": "",
    "bundle_opportunity": ""
  },
  "price_decay": {
    "holds_value": boolean,
    "decay_rate": "",
    "best_time_to_sell": "",
    "worst_time_to_sell": "",
    "appreciation_potential": ""
  },
  "rarity_assessment": {
    "rarity_level": "Common | Uncommon | Rare | Very Rare | Unique",
    "production_numbers": "",
    "currently_available": "",
    "collector_interest": "",
    "rarity_impact_on_price": ""
  },
  "confidence": {
    "overall_confidence": number,
    "data_quality": "",
    "uncertainty_factors": [],
    "how_to_improve": []
  },
  "executive_summary": "A 4-6 sentence plain-language summary for a senior citizen. No jargon. Clear advice. Include recommended list price, where to sell, expected timeline. Be warm, honest, and helpful."
}

IMPORTANT:
- Be SPECIFIC with comparables. Use real platform knowledge.
- eBay fees ~13.25%, FB Marketplace 0% local or ~6% shipped, Etsy ~6.5%, Mercari ~10%.
- Seller is in ZIP ${sellerZip}. Factor in local demand.
${isAntique ? "- This IS an antique: consider auction houses, specialty dealers, collector markets." : ""}
- If uncertain: say so. Don't fabricate sales.
- All prices in USD, realistic for 2024-2025 US resale market.
- Provide 5-12 comparable sales.
- pricing_rationale from general analysis: "${pricingRationale}"
${amazonContext}

WEB SEARCH INSTRUCTIONS:
If you have web search capability, USE IT to find REAL pricing data:
1. Search eBay for "${itemName} sold" to find actual completed sales
2. Search "${itemName} price" to find current market listings
3. Search Facebook Marketplace, Poshmark, Mercari for active listings
4. Search auction results if the item appears antique or collectible
For EVERY comparable sale, include the source platform and whether it was "sold" or "listed" (active/asking price).
If you cannot find real comparables via search, provide your best AI estimate and note lower confidence.

Include a "web_sources" array in your response with objects like {"url": "...", "title": "..."} for pages you found during research. If no web search was performed, return an empty array.`;

    let pricebotResult: any;

    if (openai) {
      // ── REAL OpenAI call ──
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);
      try {
        // Build photo content for the prompt
        const photoContent: any[] = [];
        for (const photo of item.photos) {
          // For local file paths, describe them instead of sending as images
          photoContent.push(`[Photo: ${photo.filePath}${photo.caption ? ` — ${photo.caption}` : ""}]`);
        }

        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          instructions: systemPrompt,
          input: `Analyze the pricing for this item in detail. Item photos available: ${photoContent.join(", ")}. Return ONLY valid JSON.`,
          tools: [{ type: "web_search_preview" as any }],
        }, { signal: controller.signal });

        const text = typeof response.output === "string"
          ? response.output
          : response.output_text || JSON.stringify(response.output);

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          pricebotResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON in response");
        }

        // Extract web search citations from response output
        const webSources: Array<{ url: string; title: string }> = [];
        try {
          const outputArr = Array.isArray(response.output) ? response.output : [];
          for (const outItem of outputArr) {
            // Check for web_search_call results
            if ((outItem as any).type === "web_search_call" && Array.isArray((outItem as any).results)) {
              for (const r of (outItem as any).results) {
                if (r.url && r.title) webSources.push({ url: r.url, title: r.title });
              }
            }
            // Also check message content for URL annotations
            if ((outItem as any).type === "message" && Array.isArray((outItem as any).content)) {
              for (const c of (outItem as any).content) {
                if (c.annotations) {
                  for (const ann of c.annotations) {
                    if (ann.type === "url_citation" && ann.url) {
                      webSources.push({ url: ann.url, title: ann.title || ann.url });
                    }
                  }
                }
              }
            }
          }
        } catch { /* citation extraction non-critical */ }

        // Add web sources to result
        if (!pricebotResult.web_sources) pricebotResult.web_sources = [];
        if (webSources.length > 0) {
          pricebotResult.web_sources = [...webSources, ...(pricebotResult.web_sources || [])];
        }
      } catch (aiErr: any) {
        console.error("[pricebot] OpenAI error:", aiErr);
        return NextResponse.json({ error: `PriceBot AI analysis failed: ${aiErr?.message ?? String(aiErr)}` }, { status: 422 });
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      // ── DEMO MODE ──
      pricebotResult = generateDemoResult(itemName, category, material, era, conditionScore, estimatedLow, estimatedMid, estimatedHigh, sellerZip, isAntique);
      pricebotResult._isDemo = true;
    }

    // Validate all expected fields exist — set null if missing
    const requiredTopLevel = [
      "price_validation", "comparable_sales", "market_analysis", "platform_pricing",
      "regional_pricing", "price_factors", "negotiation_guide", "price_decay",
      "rarity_assessment", "confidence", "executive_summary",
    ];
    for (const key of requiredTopLevel) {
      if (pricebotResult[key] === undefined) pricebotResult[key] = null;
    }

    // Store in EventLog
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "PRICEBOT_RESULT",
        payload: JSON.stringify(pricebotResult),
      },
    });

    // Also log the run event
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "PRICEBOT_RUN",
        payload: JSON.stringify({ userId: user.id, timestamp: new Date().toISOString() }),
      },
    });

    // Fire-and-forget: create structured PriceSnapshot via populate function
    populateFromPriceBot(itemId, pricebotResult as Record<string, unknown>).catch(() => null);

    // Fire-and-forget: log user event
    logUserEvent(user.id, "BOT_RUN", { itemId, metadata: { botType: "PRICEBOT", success: true } }).catch(() => null);

    return NextResponse.json({
      success: true,
      result: pricebotResult,
      isDemo: !!pricebotResult._isDemo,
    });
  } catch (e) {
    console.error("[pricebot POST]", e);
    return NextResponse.json({ error: "PriceBot analysis failed" }, { status: 500 });
  }
}

// ── Demo Result Generator ──────────────────────────────────────────────────

function generateDemoResult(
  itemName: string, category: string, material: string, era: string,
  conditionScore: number, low: number, mid: number, high: number,
  zip: string, isAntique: boolean
) {
  const revisedLow = Math.round(low * 0.95);
  const revisedMid = Math.round(mid * 1.02);
  const revisedHigh = Math.round(high * 1.08);

  return {
    _isDemo: true,
    price_validation: {
      agrees_with_estimate: true,
      revised_low: revisedLow,
      revised_mid: revisedMid,
      revised_high: revisedHigh,
      revision_reasoning: `The original estimate of $${low}–$${high} is reasonable for a ${conditionScore >= 8 ? "excellent" : conditionScore >= 5 ? "good" : "fair"} condition ${category.toLowerCase()}. Slight upward revision based on current market demand for ${material} items from the ${era} era.`,
    },
    comparable_sales: [
      { platform: "eBay", item_description: `Similar ${itemName} in ${conditionScore >= 7 ? "good" : "fair"} condition`, sold_price: Math.round(mid * 0.92), sold_date: "February 2025", condition_compared: "Similar", relevance: "High", notes: "Comparable item with similar age and materials" },
      { platform: "eBay", item_description: `${category} ${material} piece, slightly newer`, sold_price: Math.round(mid * 1.1), sold_date: "January 2025", condition_compared: "Better", relevance: "High", notes: "Better condition but same style" },
      { platform: "Facebook Marketplace", item_description: `${itemName} local pickup`, sold_price: Math.round(mid * 0.78), sold_date: "March 2025", condition_compared: "Similar", relevance: "Medium", notes: "Local sale, no shipping, lower price typical" },
      { platform: "Etsy", item_description: `Vintage ${category.toLowerCase()} ${material}`, sold_price: Math.round(mid * 1.15), sold_date: "December 2024", condition_compared: "Better", relevance: "Medium", notes: "Etsy commands premium for vintage items" },
      { platform: "Mercari", item_description: `${category} from ${era} era`, sold_price: Math.round(mid * 0.85), sold_date: "January 2025", condition_compared: "Worse", relevance: "Medium", notes: "Lower condition drove price down" },
      ...(isAntique ? [
        { platform: "Auction House", item_description: `${itemName} at regional auction`, sold_price: Math.round(mid * 1.3), sold_date: "November 2024", condition_compared: "Similar" as const, relevance: "High" as const, notes: "Auction achieved premium due to collector bidding" },
        { platform: "Other", item_description: `Antique dealer consignment sale`, sold_price: Math.round(mid * 1.05), sold_date: "October 2024", condition_compared: "Similar" as const, relevance: "Medium" as const, notes: "Specialty dealer sale" },
      ] : []),
    ],
    market_analysis: {
      demand_level: isAntique ? "Strong" : "Moderate",
      demand_trend: "Stable",
      demand_reasoning: `${category} items in this condition see ${isAntique ? "consistent collector interest" : "moderate consumer demand"} in the current market.`,
      supply_level: isAntique ? "Low" : "Moderate",
      supply_reasoning: `Approximately ${isAntique ? "15-25" : "50-100"} similar items currently listed across major platforms.`,
      market_saturation: `${isAntique ? "Low" : "Moderate"} — ${isAntique ? "fewer than 30" : "50-80"} active listings nationally`,
      seasonal_factors: "Spring and fall tend to be strongest for resale; holiday season can boost gift-worthy items.",
      category_health: `The ${category.toLowerCase()} resale market is ${isAntique ? "healthy with growing collector interest" : "stable with consistent turnover"}.`,
    },
    platform_pricing: {
      ebay: { recommended_list_price: Math.round(high * 1.05), expected_sell_price: Math.round(mid * 0.95), avg_days_to_sell: 14, fees_percentage: 13.25, seller_net_after_fees: Math.round(mid * 0.95 * 0.8675), tips: `Use auction format for rare items, Buy It Now for common. Include ${material} in title.` },
      facebook_marketplace: { recommended_list_price: Math.round(mid * 1.1), expected_sell_price: Math.round(mid * 0.82), avg_days_to_sell: 7, fees_percentage: 0, seller_net_after_fees: Math.round(mid * 0.82), tips: "Price 10% above target for negotiation room. Local pickup means no fees and no shipping hassle." },
      etsy: { recommended_list_price: Math.round(high), expected_sell_price: Math.round(mid * 1.05), avg_days_to_sell: 21, fees_percentage: 6.5, seller_net_after_fees: Math.round(mid * 1.05 * 0.935), tips: "Etsy buyers pay premium for vintage. Use keywords like 'vintage', 'antique', 'retro' in tags." },
      craigslist: { recommended_list_price: Math.round(mid), expected_sell_price: Math.round(mid * 0.75), avg_days_to_sell: 10, fees_percentage: 0, seller_net_after_fees: Math.round(mid * 0.75), tips: "Post with good photos. Meet in public place. Cash only." },
      mercari: { recommended_list_price: Math.round(mid * 1.05), expected_sell_price: Math.round(mid * 0.88), avg_days_to_sell: 12, fees_percentage: 10, seller_net_after_fees: Math.round(mid * 0.88 * 0.9), tips: "Mercari's Smart Pricing can help move items faster. Offer free shipping to attract buyers." },
      offerup: { recommended_list_price: Math.round(mid * 1.05), expected_sell_price: Math.round(mid * 0.8), avg_days_to_sell: 8, fees_percentage: 0, seller_net_after_fees: Math.round(mid * 0.8), tips: "Local-focused. Good photos sell fast. Respond quickly to messages." },
      antique_shop_consignment: { recommended_price: Math.round(high * 1.1), typical_consignment_cut: "40-50%", seller_net: Math.round(high * 1.1 * 0.55), tips: "Best for high-value antiques. Shop handles all sales and display." },
      auction_house: { estimated_hammer_price: Math.round(mid * 1.2), buyers_premium: "20-25%", sellers_commission: "10-15%", seller_net: Math.round(mid * 1.2 * 0.875), recommended_reserve: Math.round(low * 0.9), tips: isAntique ? "Regional auction houses are best for antiques. Set reserve at 80% of low estimate." : "Auction houses typically prefer items valued over $200." },
      best_platform: `For this ${category.toLowerCase()}, ${isAntique ? "eBay or a regional auction house" : "eBay"} will likely yield the best return. ${isAntique ? "Collector audience drives competitive bidding." : "Largest buyer pool with best search visibility."}`,
    },
    regional_pricing: {
      seller_location: zip,
      local_market_strength: "Average",
      local_price_estimate: Math.round(mid * 0.85),
      best_us_market: { city: "New York, NY", why: "Highest concentration of collectors and resale buyers", price_premium: "+20-35%", estimated_price: Math.round(mid * 1.25) },
      worst_us_market: { city: "Rural Midwest", why: "Lower population density and less collector activity", price_discount: "-25-35%", estimated_price: Math.round(mid * 0.7) },
      ship_vs_local_verdict: mid > 75 ? "Ship to a broader market. The shipping cost is justified by the higher sale price you'll achieve online." : "Sell locally. Shipping costs would eat into margins on this price point.",
    },
    price_factors: {
      value_adders: [
        { factor: `${material} construction`, impact: `+$${Math.round(mid * 0.1)}`, explanation: `${material} is desirable in the ${category.toLowerCase()} market` },
        { factor: `${era} era piece`, impact: `+${isAntique ? "15-25%" : "5-10%"}`, explanation: `Items from the ${era} era ${isAntique ? "command collector premiums" : "have nostalgic appeal"}` },
        ...(conditionScore >= 8 ? [{ factor: "Excellent condition", impact: "+10-15%", explanation: "Above-average condition for age adds meaningful value" }] : []),
      ],
      value_reducers: [
        ...(conditionScore < 6 ? [{ factor: "Below-average condition", impact: `-${Math.round(mid * 0.15)}`, explanation: "Wear reduces buyer willingness to pay full price" }] : []),
        { factor: "Market competition", impact: "-5-10%", explanation: "Multiple similar items available can pressure prices down" },
      ],
      condition_sensitivity: isAntique ? "High" : "Medium",
      condition_price_curve: `At 10/10 condition, this would be worth approximately $${Math.round(high * 1.3)} — about ${Math.round(((high * 1.3) / mid - 1) * 100)}% more than current estimate.`,
    },
    negotiation_guide: {
      list_price: Math.round(high * 1.05),
      minimum_accept: Math.round(low * 0.9),
      sweet_spot: revisedMid,
      first_offer_expect: `Buyers will likely offer $${Math.round(low * 0.7)}–$${Math.round(low * 0.85)}, about 20-30% below asking.`,
      counter_strategy: `Counter at $${Math.round(mid * 0.95)}. Show comparable sales to justify your price. Be prepared to meet in the middle around $${revisedMid}.`,
      urgency_factor: "No strong time pressure. Take your time to get the right price.",
      bundle_opportunity: `If you have other ${category.toLowerCase()} items, bundling could increase total sale value by 10-15%.`,
    },
    price_decay: {
      holds_value: isAntique,
      decay_rate: isAntique ? "Slow — antiques tend to hold or gain value" : "Moderate — expect 5-10% annual decline for used goods",
      best_time_to_sell: "Spring (March-May) when buyers are most active and spending increases.",
      worst_time_to_sell: "Late January-February, post-holiday spending lull.",
      appreciation_potential: isAntique ? `Yes — ${category} antiques from the ${era} era have shown 3-5% annual appreciation in collector markets.` : "Unlikely to appreciate. Sell sooner rather than later for best return.",
    },
    rarity_assessment: {
      rarity_level: isAntique ? "Uncommon" : "Common",
      production_numbers: isAntique ? "Limited production — exact numbers unknown" : "Mass-produced item",
      currently_available: isAntique ? "Fewer than 25 similar items listed nationally" : "50-100+ similar items available",
      collector_interest: isAntique ? "Active collector community — specialty forums and auction followings" : "General consumer interest, no dedicated collector base",
      rarity_impact_on_price: isAntique ? "Rarity adds 15-25% premium above comparable mass-produced items" : "Common availability means price is driven by condition and convenience, not rarity",
    },
    confidence: {
      overall_confidence: 72,
      data_quality: "Demo mode — based on category averages and market models. Real PriceBot uses live market data.",
      uncertainty_factors: [
        "Demo mode — not using live comparable data",
        "Condition assessment based on score only, not visual inspection",
        "Local market conditions may vary from national averages",
      ],
      how_to_improve: [
        "Add more photos showing condition details, marks, and labels",
        "Check eBay's sold listings for exact comparables",
        "Get a professional appraisal for high-value antiques",
        "Research the specific maker/brand for more accurate pricing",
      ],
    },
    executive_summary: `Based on our analysis, your ${itemName} is worth approximately $${revisedLow} to $${revisedHigh}, with a sweet spot around $${revisedMid}. ${isAntique ? "As an antique, it has strong collector interest." : ""} We recommend listing on ${isAntique ? "eBay with an auction format" : "eBay at $" + Math.round(high * 1.05)} for the best return. ${mid > 75 ? "Shipping to national buyers is worthwhile at this price point." : "Consider local pickup to maximize your net earnings."} Expect to sell within ${isAntique ? "2-3 weeks" : "1-2 weeks"} at the right price.`,
  };
}
