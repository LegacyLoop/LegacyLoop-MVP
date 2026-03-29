import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { getItemEnrichmentContext } from "@/lib/enrichment";
import {
  generateMockCompetitors,
  analyzeMarket,
  generateAlerts,
} from "@/lib/services/recon-bot";
import { logUserEvent } from "@/lib/data/user-events";
import { isDemoMode, canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * GET /api/bots/reconbot/[itemId]
 * Retrieve existing ReconBot result for an item
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item || item.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "RECONBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) return NextResponse.json({ hasResult: false, result: null });

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
    });
  } catch (e) {
    console.error("[reconbot GET]", e);
    return NextResponse.json({ error: "Failed to fetch ReconBot result" }, { status: 500 });
  }
}

/**
 * POST /api/bots/reconbot/[itemId]
 * Run ReconBot competitive intelligence scan
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
      if (!canUseBotOnTier(user.tier, "reconBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access ReconBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "RECONBOT");
      const cost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", message: "Not enough credits to run ReconBot.", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "ReconBot re-run" : "ReconBot run", itemId);
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        aiResult: true,
        valuation: true,
        antiqueCheck: true,
        photos: { orderBy: { order: "asc" }, take: 4 },
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    // Auto-stop: don't run for sold items
    if (item.status === "SOLD" || item.status === "SHIPPED" || item.status === "COMPLETED") {
      return NextResponse.json({ error: "Item already sold — ReconBot stopped" }, { status: 400 });
    }

    const ai = safeJson(item.aiResult?.rawJson);
    const v = item.valuation;

    if (!ai || !v) {
      return NextResponse.json({ error: "Run AI analysis first" }, { status: 400 });
    }

    const itemName = ai.item_name || item.title || "Unknown item";
    const category = ai.category || "General";
    const material = ai.material || "Unknown";
    const era = ai.era || ai.estimated_age || "Unknown";
    const condScore = ai.condition_score || 5;
    const condLabel = condScore >= 8 ? "Excellent" : condScore >= 5 ? "Good" : "Fair";
    const lowPrice = Math.round(v.low);
    const highPrice = Math.round(v.high);
    const midPrice = v.mid ? Math.round(v.mid) : Math.round((v.low + v.high) / 2);
    const sellerZip = item.saleZip || "04901";
    const isAntique = item.antiqueCheck?.isAntique || false;
    const listingPrice = (item as any).listingPrice ?? null;

    // Check if previous scan exists (update scan vs initial scan)
    const prevScan = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "RECONBOT_RESULT" },
      orderBy: { createdAt: "desc" },
    });
    const isUpdate = !!prevScan;

    // ── CROSS-BOT ENRICHMENT ──
    const enrichment = await getItemEnrichmentContext(itemId, "reconbot").catch(() => null);
    const enrichmentPrefix = enrichment?.hasEnrichment ? enrichment.contextBlock + "\n\n" : "";

    // ── AMAZON MARKET CONTEXT ──
    let amazonContext = "";
    try {
      const amazonLog = await prisma.eventLog.findFirst({
        where: { itemId, eventType: "RAINFOREST_RESULT" },
        orderBy: { createdAt: "desc" },
        select: { payload: true, createdAt: true },
      });
      if (amazonLog?.payload) {
        const ad = JSON.parse(amazonLog.payload);
        const ageDays = Math.round((Date.now() - new Date(amazonLog.createdAt).getTime()) / 86400000);
        const staleNote = ageDays > 7 ? ` (${ageDays} days old — may be stale)` : "";
        if (ad.averagePrice || ad.priceRange || ad.topResult) {
          amazonContext = `\n\nAMAZON MARKET DATA${staleNote}:\n`;
          if (ad.priceRange) amazonContext += `Price range: $${ad.priceRange.low}–$${ad.priceRange.high} (avg $${Math.round(ad.priceRange.avg || (ad.priceRange.low + ad.priceRange.high) / 2)})\n`;
          else if (ad.averagePrice) amazonContext += `Average price: $${ad.averagePrice}\n`;
          if (ad.resultCount) amazonContext += `Listings found: ${ad.resultCount}\n`;
          if (ad.topResult?.title) amazonContext += `Top result: ${ad.topResult.title} at $${ad.topResult.price || "N/A"}\n`;
        }
      }
    } catch { /* non-critical */ }

    // ── REAL COMPETITOR LISTINGS FROM SCRAPERS ──
    let realCompContext = "";
    try {
      const marketIntel = await getMarketIntelligence(itemName, category, sellerZip);
      if (marketIntel?.comps?.length > 0) {
        console.log(`[ReconBot] ${marketIntel.comps.length} real competitors from ${marketIntel.sources?.join(", ")}`);
        realCompContext = `\n\nREAL COMPETITOR LISTINGS (scraped from actual marketplaces — NOT AI-generated):
${marketIntel.comps.slice(0, 15).map((c: any, i: number) =>
  `${i + 1}. [${c.platform}] "${c.item}" — $${c.price}${c.location ? ` (${c.location})` : ""}${c.condition ? ` [${c.condition}]` : ""}`
).join("\n")}
Median: $${marketIntel.median} | Range (25th-75th): $${marketIntel.low}–$${marketIntel.high} | Trend: ${marketIntel.trend}
Sources: ${marketIntel.sources?.join(", ")}

CRITICAL: These are REAL listings scraped from actual marketplaces. Use them as your competitor_listings data. Do NOT invent fictional competitors when real data is available. Analyze these REAL prices for your price_intelligence and strategic_recommendations.`;
      }
    } catch {
      console.log("[ReconBot] Market intelligence unavailable — AI will estimate competitors");
    }

    // ── RECONBOT PROMPT ──
    const systemPrompt = enrichmentPrefix + amazonContext + realCompContext + `You are a world-class competitive intelligence analyst specializing in resale markets. You monitor every marketplace continuously — eBay, Facebook Marketplace, Craigslist, Mercari, OfferUp, Etsy, Ruby Lane, auction houses, and local shops. Your job is to provide a comprehensive competitive scan.

You are scanning for: ${itemName} — ${category} — ${material} — ${era} — ${condLabel} (${condScore}/10)
Seller location: ZIP ${sellerZip} (Maine, USA)
Estimated value: $${lowPrice} — $${highPrice} (mid: $${midPrice})
${listingPrice ? `Current listing price: $${listingPrice}` : "Not yet listed"}
${isUpdate ? "This is an UPDATE scan — compare to previous market conditions and highlight changes." : "This is the INITIAL scan — provide a comprehensive baseline analysis."}

Return a JSON object with ALL of the following:

{
  "scan_summary": {
    "scan_type": "${isUpdate ? "update" : "initial"}",
    "total_competitors_found": number,
    "active_listings": number,
    "recently_sold": number,
    "price_position": "Underpriced | Well-Priced | Overpriced | Not Listed",
    "market_heat": "Hot | Warm | Cool | Cold",
    "overall_threat_level": "Low | Moderate | High | Critical",
    "headline": "One-sentence market summary"
  },

  "competitor_listings": [
    {
      "platform": "eBay | Facebook | Craigslist | Mercari | OfferUp | Etsy | Ruby Lane | Auction",
      "title": "Listing title",
      "price": number,
      "condition": "Excellent | Very Good | Good | Fair | Poor",
      "location": "City, State",
      "days_listed": number,
      "views": number,
      "saves_watchers": number,
      "status": "Active | Sold | Pending",
      "sold_price": null,
      "sold_days": null,
      "threat_level": "Low | Medium | High",
      "notes": "Why this competitor matters"
    }
  ],

  "price_intelligence": {
    "market_average": number,
    "market_median": number,
    "lowest_active": number,
    "highest_active": number,
    "avg_sold_price": number,
    "price_trend": "Rising | Stable | Falling",
    "price_trend_pct": "e.g. +5% or -3%",
    "optimal_price": number,
    "undercut_price": number,
    "premium_price": number,
    "price_position_detail": "Where the seller sits vs competition and why"
  },

  "market_dynamics": {
    "supply_level": "Scarce | Low | Moderate | High | Flooded",
    "demand_signals": "What indicates buyer demand right now",
    "avg_days_to_sell": number,
    "sell_through_rate": "X% of listings sell within 30 days",
    "new_listings_per_week": number,
    "market_velocity": "Fast | Medium | Slow",
    "seasonal_outlook": "Current seasonal impact on sales"
  },

  "platform_breakdown": [
    {
      "platform": "Platform name",
      "active_count": number,
      "avg_price": number,
      "avg_days_to_sell": number,
      "competition_level": "Low | Medium | High",
      "opportunity": "Why or why not to list here",
      "recommended_price": number
    }
  ],

  "alerts": [
    {
      "type": "PRICE_DROP | NEW_COMPETITOR | SIMILAR_SOLD | MARKET_SHIFT | OPPORTUNITY | UNDERCUT_ALERT",
      "severity": "LOW | MEDIUM | HIGH | URGENT",
      "title": "Alert headline",
      "message": "Detailed alert message",
      "suggested_action": "What to do about it",
      "data": {}
    }
  ],

  "competitive_advantages": [
    {
      "advantage": "What sets this item apart",
      "impact": "How it affects selling potential",
      "leverage_tip": "How to use this advantage in listings"
    }
  ],

  "competitive_disadvantages": [
    {
      "disadvantage": "Where competitors have an edge",
      "impact": "How this hurts selling potential",
      "mitigation": "How to overcome or minimize this"
    }
  ],

  "strategic_recommendations": [
    {
      "priority": "Immediate | This Week | This Month",
      "action": "What to do",
      "reasoning": "Why this matters",
      "expected_impact": "What improvement to expect"
    }
  ],

  "sold_tracker": [
    {
      "platform": "Where it sold",
      "title": "What sold",
      "sold_price": number,
      "days_to_sell": number,
      "condition": "Item condition",
      "sold_date": "Approximate date",
      "takeaway": "What this sale means for the seller"
    }
  ],

  "market_forecast": {
    "short_term": "Next 2 weeks outlook",
    "medium_term": "Next 1-3 months outlook",
    "best_window": "Optimal selling window",
    "risk_factors": ["What could hurt the market"],
    "upside_factors": ["What could help the market"]
  },

  "executive_summary": "4-6 sentence plain-language summary for a senior citizen. Current competitive position, biggest threats, biggest opportunities, and exactly what to do next. Be warm, specific, and actionable."
}

IMPORTANT:
- Generate 8-15 realistic competitor listings across multiple platforms.
- Generate 3-5 actionable alerts based on market conditions.
- Generate 3-6 sold items with real takeaways.
- Include 3-5 strategic recommendations with priority levels.
- All prices in USD for 2024-2025 market.
- Seller is in Maine — factor in New England regional demand.
${isAntique ? "- This IS an antique: include auction houses, specialty dealers, collector markets in analysis." : ""}
- Be SPECIFIC with competitor details. Use realistic titles, prices, and platform behaviors.
- If price position can't be determined (not listed), recommend an optimal listing price.`;

    let reconbotResult: any;
    let webSources: Array<{ url: string; title: string }> = [];

    if (openai) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);
      try {
        const photoDescs = item.photos.map((p) =>
          `[Photo: ${p.filePath}${p.caption ? ` — ${p.caption}` : ""}]`
        );

        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          instructions: systemPrompt,
          input: `Run a comprehensive competitive intelligence scan for this item. Photos: ${photoDescs.join(", ")}. Return ONLY valid JSON.`,
          tools: [{ type: "web_search_preview" } as any],
        }, { signal: controller.signal });

        const text = typeof response.output === "string"
          ? response.output
          : response.output_text || JSON.stringify(response.output);

        // Extract web sources
        webSources = [];
        try {
          const outputArr = Array.isArray(response.output) ? response.output : [];
          for (const outItem of outputArr) {
            if ((outItem as any).type === "web_search_call" && Array.isArray((outItem as any).results)) {
              for (const r of (outItem as any).results) {
                if (r.url && r.title) webSources.push({ url: r.url, title: r.title });
              }
            }
            if ((outItem as any).type === "message" && Array.isArray((outItem as any).content)) {
              for (const c of (outItem as any).content) {
                if (c.annotations) {
                  for (const ann of c.annotations) {
                    if (ann.type === "url_citation" && ann.url) webSources.push({ url: ann.url, title: ann.title || ann.url });
                  }
                }
              }
            }
          }
        } catch { /* non-critical */ }

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          reconbotResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON in response");
        }
      } catch (aiErr: any) {
        console.error("[reconbot] OpenAI error:", aiErr);
        return NextResponse.json({ error: `ReconBot AI analysis failed: ${aiErr?.message ?? String(aiErr)}` }, { status: 422 });
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      reconbotResult = generateDemoResult(itemName, category, material, era, condScore, lowPrice, midPrice, highPrice, sellerZip, isAntique, listingPrice, isUpdate);
      reconbotResult._isDemo = true;
    }

    // Validate expected fields
    const requiredKeys = [
      "scan_summary", "competitor_listings", "price_intelligence", "market_dynamics",
      "platform_breakdown", "alerts", "competitive_advantages", "competitive_disadvantages",
      "strategic_recommendations", "sold_tracker", "market_forecast", "executive_summary",
    ];
    for (const key of requiredKeys) {
      if (reconbotResult[key] === undefined) reconbotResult[key] = null;
    }
    if (webSources && webSources.length > 0) reconbotResult.web_sources = webSources;

    // Store in EventLog
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "RECONBOT_RESULT",
        payload: JSON.stringify(reconbotResult),
      },
    });

    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "RECONBOT_RUN",
        payload: JSON.stringify({ userId: user.id, timestamp: new Date().toISOString(), scanType: isUpdate ? "update" : "initial" }),
      },
    });

    // Also activate/update the ReconBot DB model for persistent tracking
    try {
      const existingBot = await prisma.reconBot.findFirst({ where: { itemId, userId: user.id } });
      const competitors = generateMockCompetitors(itemName, category, midPrice);
      const analysis = analyzeMarket(competitors, listingPrice);
      const alerts = generateAlerts(competitors, analysis, listingPrice);

      if (existingBot) {
        await prisma.reconBot.update({
          where: { id: existingBot.id },
          data: {
            isActive: true,
            competitorCount: analysis.competitorCount,
            lowestPrice: analysis.lowestPrice,
            highestPrice: analysis.highestPrice,
            averagePrice: analysis.averagePrice,
            medianPrice: analysis.medianPrice,
            latestCompetitorsJson: JSON.stringify(competitors),
            currentStatus: analysis.currentStatus,
            recommendation: analysis.recommendation,
            confidenceScore: analysis.confidenceScore,
            lastScan: new Date(),
            nextScan: new Date(Date.now() + 6 * 60 * 60 * 1000),
            scansCompleted: { increment: 1 },
            alertsSent: { increment: alerts.length },
          },
        });
      } else {
        const bot = await prisma.reconBot.create({
          data: {
            itemId,
            userId: user.id,
            isActive: true,
            competitorCount: analysis.competitorCount,
            lowestPrice: analysis.lowestPrice,
            highestPrice: analysis.highestPrice,
            averagePrice: analysis.averagePrice,
            medianPrice: analysis.medianPrice,
            latestCompetitorsJson: JSON.stringify(competitors),
            currentStatus: analysis.currentStatus,
            recommendation: analysis.recommendation,
            confidenceScore: analysis.confidenceScore,
            lastScan: new Date(),
            nextScan: new Date(Date.now() + 6 * 60 * 60 * 1000),
            scansCompleted: 1,
            alertsSent: alerts.length,
          },
        });
        if (alerts.length > 0) {
          await prisma.reconAlert.createMany({
            data: alerts.map((a) => ({ ...a, reconBotId: bot.id })),
          });
        }
      }
    } catch (dbErr) {
      console.error("[reconbot] DB sync error (non-fatal):", dbErr);
    }

    // Fire-and-forget: log user event
    logUserEvent(user.id, "BOT_RUN", { itemId, metadata: { botType: "RECONBOT", success: true } }).catch(() => null);

    return NextResponse.json({
      success: true,
      result: reconbotResult,
      isDemo: !!reconbotResult._isDemo,
    });
  } catch (e) {
    console.error("[reconbot POST]", e);
    return NextResponse.json({ error: "ReconBot scan failed" }, { status: 500 });
  }
}

// ── Demo Result Generator ──────────────────────────────────────────────────

function generateDemoResult(
  itemName: string, category: string, material: string, era: string,
  condScore: number, low: number, mid: number, high: number,
  zip: string, isAntique: boolean, listingPrice: number | null, isUpdate: boolean
) {
  const condLabel = condScore >= 8 ? "Excellent" : condScore >= 5 ? "Good" : "Fair";
  const pricePosition = !listingPrice ? "Not Listed" : listingPrice > high * 1.1 ? "Overpriced" : listingPrice < low * 0.9 ? "Underpriced" : "Well-Priced";
  const cat = category.toLowerCase();

  const platforms = ["eBay", "Facebook", "Craigslist", "Mercari", "OfferUp"];
  if (isAntique) platforms.push("Ruby Lane", "Auction");
  if (cat.includes("furniture") || cat.includes("decor")) platforms.push("Etsy");

  // Generate competitor listings
  const competitors: any[] = [];
  const competitorCount = 8 + Math.floor(Math.random() * 7);
  for (let i = 0; i < competitorCount; i++) {
    const plat = platforms[i % platforms.length];
    const variance = 0.65 + Math.random() * 0.7;
    const price = Math.round(mid * variance);
    const isSold = Math.random() < 0.3;
    const locations = ["Portland, ME", "Bangor, ME", "Boston, MA", "Manchester, NH", "Burlington, VT", "Providence, RI", "New York, NY", "Hartford, CT"];
    const conditions = ["Excellent", "Very Good", "Good", "Fair"];

    competitors.push({
      platform: plat,
      title: `${itemName} ${conditions[i % 4]} condition`,
      price,
      condition: conditions[i % 4],
      location: locations[i % locations.length],
      days_listed: Math.floor(Math.random() * 28) + 1,
      views: Math.floor(Math.random() * 300) + 10,
      saves_watchers: Math.floor(Math.random() * 40),
      status: isSold ? "Sold" : "Active",
      sold_price: isSold ? Math.round(price * 0.92) : null,
      sold_days: isSold ? Math.floor(Math.random() * 21) + 1 : null,
      threat_level: price < mid * 0.85 ? "High" : price < mid ? "Medium" : "Low",
      notes: price < mid * 0.85
        ? "Significantly underpricing the market — could pull buyers away"
        : price > mid * 1.15
          ? "Priced above market — less competitive"
          : "Similar pricing — direct competitor",
    });
  }

  const activePrices = competitors.filter((c) => c.status === "Active").map((c) => c.price).sort((a, b) => a - b);
  const soldPrices = competitors.filter((c) => c.status === "Sold").map((c) => c.sold_price).filter(Boolean);
  const avgActive = activePrices.length ? Math.round(activePrices.reduce((a, b) => a + b, 0) / activePrices.length) : mid;
  const medianActive = activePrices.length ? activePrices[Math.floor(activePrices.length / 2)] : mid;
  const avgSold = soldPrices.length ? Math.round(soldPrices.reduce((a: number, b: number) => a + b, 0) / soldPrices.length) : Math.round(mid * 0.92);

  return {
    _isDemo: true,
    scan_summary: {
      scan_type: isUpdate ? "update" : "initial",
      total_competitors_found: competitors.length,
      active_listings: competitors.filter((c) => c.status === "Active").length,
      recently_sold: competitors.filter((c) => c.status === "Sold").length,
      price_position: pricePosition,
      market_heat: isAntique ? "Warm" : competitors.length > 12 ? "Hot" : "Warm",
      overall_threat_level: activePrices.some((p) => p < mid * 0.8) ? "Moderate" : "Low",
      headline: `${competitors.filter((c) => c.status === "Active").length} active competitors found across ${platforms.length} platforms — market is ${isAntique ? "steady with collector interest" : "moderately active"}`,
    },

    competitor_listings: competitors,

    price_intelligence: {
      market_average: avgActive,
      market_median: medianActive,
      lowest_active: activePrices[0] || Math.round(mid * 0.65),
      highest_active: activePrices[activePrices.length - 1] || Math.round(mid * 1.35),
      avg_sold_price: avgSold,
      price_trend: "Stable",
      price_trend_pct: "+2%",
      optimal_price: Math.round(mid * 1.02),
      undercut_price: Math.round(avgActive * 0.92),
      premium_price: Math.round(high * 1.05),
      price_position_detail: listingPrice
        ? `At $${listingPrice}, you're ${listingPrice > avgActive ? `$${listingPrice - avgActive} above` : `$${avgActive - listingPrice} below`} the market average of $${avgActive}. ${pricePosition === "Well-Priced" ? "You're in the competitive zone." : pricePosition === "Overpriced" ? "Consider lowering to attract more buyers." : "You could raise your price and still be competitive."}`
        : `Market average is $${avgActive}. We recommend listing at $${Math.round(mid * 1.02)} for optimal positioning.`,
    },

    market_dynamics: {
      supply_level: competitors.length > 12 ? "Moderate" : "Low",
      demand_signals: `${soldPrices.length} recent sales in the past month, average sell time of ${Math.floor(Math.random() * 10 + 7)} days. ${isAntique ? "Collector search volume is up 8% this quarter." : "Seasonal demand is at average levels."}`,
      avg_days_to_sell: Math.floor(Math.random() * 10 + 8),
      sell_through_rate: `${Math.floor(Math.random() * 20 + 45)}%`,
      new_listings_per_week: Math.floor(Math.random() * 5 + 2),
      market_velocity: "Medium",
      seasonal_outlook: "Spring is traditionally strong for resale. Expect increased buyer activity through May.",
    },

    platform_breakdown: [
      { platform: "eBay", active_count: Math.floor(competitors.length * 0.35), avg_price: Math.round(mid * 0.98), avg_days_to_sell: 14, competition_level: "Medium", opportunity: "Largest buyer pool. Best for reaching national collectors", recommended_price: Math.round(mid * 1.05) },
      { platform: "Facebook Marketplace", active_count: Math.floor(competitors.length * 0.25), avg_price: Math.round(mid * 0.85), avg_days_to_sell: 6, competition_level: "High", opportunity: "Fastest sales but lower prices. Great for quick local turnaround", recommended_price: Math.round(mid * 0.95) },
      { platform: "Craigslist", active_count: Math.floor(competitors.length * 0.15), avg_price: Math.round(mid * 0.78), avg_days_to_sell: 10, competition_level: "Low", opportunity: "Less competition but smaller audience. Good secondary channel", recommended_price: Math.round(mid * 0.88) },
      { platform: "Mercari", active_count: Math.floor(competitors.length * 0.1), avg_price: Math.round(mid * 0.9), avg_days_to_sell: 9, competition_level: "Low", opportunity: "Growing platform with younger buyers. Good for shipped items", recommended_price: Math.round(mid * 0.95) },
      ...(isAntique ? [
        { platform: "Ruby Lane", active_count: 3, avg_price: Math.round(mid * 1.15), avg_days_to_sell: 25, competition_level: "Low" as const, opportunity: "Premium antique marketplace. Higher prices but slower sales", recommended_price: Math.round(high) },
      ] : []),
    ],

    alerts: [
      {
        type: "NEW_COMPETITOR",
        severity: "MEDIUM",
        title: `${Math.floor(Math.random() * 3 + 2)} new listings appeared this week`,
        message: `New competitors have listed similar ${cat} items. The lowest new listing is priced at $${Math.round(mid * 0.75)} on Facebook Marketplace.`,
        suggested_action: "Review your pricing to stay competitive. Consider highlighting your item's unique features in the listing.",
        data: { newListingsCount: Math.floor(Math.random() * 3 + 2) },
      },
      ...(soldPrices.length > 0 ? [{
        type: "SIMILAR_SOLD" as const,
        severity: "MEDIUM" as const,
        title: `${soldPrices.length} similar items sold recently`,
        message: `Recent sales averaged $${avgSold}. This confirms active buyer demand in your category.`,
        suggested_action: `Price at or slightly above $${avgSold} to capture this demand.`,
        data: { avgSoldPrice: avgSold },
      }] : []),
      {
        type: "OPPORTUNITY",
        severity: "LOW",
        title: "Spring selling season is strong",
        message: "Buyer activity typically peaks in March-May. Now is a good time to list or refresh your listing with new photos.",
        suggested_action: "If not yet listed, list now. If already listed, refresh photos and bump the listing.",
        data: {},
      },
      ...(listingPrice && listingPrice > avgActive * 1.15 ? [{
        type: "PRICE_DROP" as const,
        severity: "HIGH" as const,
        title: "Your price is above market average",
        message: `At $${listingPrice}, you're ${Math.round(((listingPrice / avgActive) - 1) * 100)}% above the market average of $${avgActive}. This may be reducing buyer interest.`,
        suggested_action: `Consider lowering to $${Math.round(avgActive * 1.05)} to improve competitiveness.`,
        data: { currentPrice: listingPrice, marketAvg: avgActive },
      }] : []),
    ],

    competitive_advantages: [
      { advantage: `${condLabel} condition — above average for the market`, impact: `Justifies a ${condScore >= 8 ? "15-20%" : "5-10%"} premium over similar items`, leverage_tip: "Highlight condition in your listing title and include close-up photos" },
      { advantage: `${material} construction`, impact: `${material} is sought-after in the ${cat} category and adds perceived value`, leverage_tip: `Mention "${material}" in the first line of your listing description` },
      ...(isAntique ? [{ advantage: `Authentic ${era} antique`, impact: "Collectors pay 20-40% premiums for verified antiques", leverage_tip: "Include era, maker marks, and provenance details to attract serious collectors" }] : []),
      { advantage: "Maine location — New England charm", impact: "Items from New England carry nostalgia and authenticity appeal", leverage_tip: "Mention the New England provenance — buyers associate it with quality estate pieces" },
    ],

    competitive_disadvantages: [
      { disadvantage: "Some competitors offer free shipping", impact: "Free shipping listings get 30% more clicks on average", mitigation: "Consider offering free shipping and building the cost into the price, or offer local pickup as an advantage" },
      { disadvantage: `${competitors.filter((c) => c.price < mid * 0.85).length} competitors priced significantly lower`, impact: "Price-sensitive buyers may choose cheaper alternatives first", mitigation: "Differentiate on condition, photos, and description quality rather than competing on price alone" },
    ],

    strategic_recommendations: [
      { priority: "Immediate", action: listingPrice ? "Refresh your listing with updated photos and description" : `List at $${Math.round(mid * 1.02)} on eBay and Facebook Marketplace simultaneously`, reasoning: listingPrice ? "Active listings get more views when refreshed" : "Multi-platform listing maximizes exposure", expected_impact: "20-30% increase in buyer inquiries within the first week" },
      { priority: "This Week", action: `Join and post in 2-3 Facebook groups for ${cat} enthusiasts in New England`, reasoning: "Group posts reach targeted buyers who actively collect this category", expected_impact: "Direct messages from interested buyers within 48 hours" },
      { priority: "This Week", action: `Set your price at $${Math.round(mid * 1.05)} with 'Best Offer' enabled`, reasoning: `Market data shows the sweet spot is $${Math.round(mid * 0.95)}–$${Math.round(mid * 1.1)}. Starting slightly above with negotiation room optimizes final sale price`, expected_impact: `Expected sale price of $${Math.round(mid * 0.95)}–$${mid} after negotiation` },
      { priority: "This Month", action: "Add 2-3 lifestyle photos showing the item in a room setting", reasoning: "Lifestyle photos increase perceived value and help buyers envision the item in their home", expected_impact: "10-15% higher final sale price based on platform data" },
    ],

    sold_tracker: [
      { platform: "eBay", title: `${itemName} — ${condLabel}`, sold_price: Math.round(mid * 0.95), days_to_sell: 11, condition: condLabel, sold_date: "2 weeks ago", takeaway: "Sold near market average — confirms pricing is realistic" },
      { platform: "Facebook", title: `Vintage ${category} local pickup`, sold_price: Math.round(mid * 0.78), days_to_sell: 3, condition: "Good", sold_date: "1 week ago", takeaway: "Quick local sale at lower price — speed vs price tradeoff" },
      { platform: "Etsy", title: `${era} ${material} ${category}`, sold_price: Math.round(mid * 1.12), days_to_sell: 19, condition: "Very Good", sold_date: "3 weeks ago", takeaway: "Etsy commands premium for vintage/antique items — worth listing there" },
      ...(isAntique ? [{ platform: "Auction", title: `${itemName} at estate auction`, sold_price: Math.round(mid * 1.25), days_to_sell: 28, condition: "Good", sold_date: "1 month ago", takeaway: "Auction achieved above-market price due to competitive bidding" }] : []),
      { platform: "Mercari", title: `${category} ${material}`, sold_price: Math.round(mid * 0.85), days_to_sell: 8, condition: "Fair", sold_date: "10 days ago", takeaway: "Lower condition drove price down — your better condition justifies higher price" },
    ],

    market_forecast: {
      short_term: `Stable to slightly improving. ${isAntique ? "Collector interest remains strong heading into spring auction season." : "Buyer activity is picking up as spring approaches."}`,
      medium_term: `Expect ${isAntique ? "steady appreciation of 3-5% as collector demand grows" : "stable prices with normal seasonal fluctuations"} over the next 1-3 months.`,
      best_window: "Next 2-4 weeks — spring buying season is ramping up and competition hasn't peaked yet.",
      risk_factors: [
        "New competitors listing at deep discounts could pressure prices down",
        "Economic uncertainty may reduce discretionary spending on non-essentials",
      ],
      upside_factors: [
        "Spring cleaning season drives both sellers (competition) and buyers (opportunity)",
        isAntique ? "Growing millennial interest in vintage/antique items" : "Category is trending on social media resale communities",
        "Tax refund season means more buyer spending power",
      ],
    },

    executive_summary: `We found ${competitors.filter((c) => c.status === "Active").length} active competitors for your ${itemName} across ${platforms.length} platforms. ${pricePosition === "Not Listed" ? `The market average is $${avgActive} — we recommend listing at $${Math.round(mid * 1.02)} to be competitive.` : `At ${listingPrice ? "$" + listingPrice : "your current price"}, you're ${pricePosition.toLowerCase()}.`} ${soldPrices.length} similar items sold recently, averaging $${avgSold}, which confirms buyer demand is active. Your biggest advantage is the ${condLabel.toLowerCase()} condition and ${material} construction. We recommend ${listingPrice ? "refreshing your listing with updated photos this week" : "listing on eBay and Facebook Marketplace simultaneously"} for the best results. Spring is a great time to sell — don't wait too long.`,
  };
}
