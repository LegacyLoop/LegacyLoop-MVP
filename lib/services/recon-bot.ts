/**
 * Recon Bot — Market Intelligence Engine
 *
 * Generates realistic mock market data for the demo.
 * In production, these functions would call real marketplace APIs/scrapers.
 * The DB schema is production-ready; only the data source changes.
 */

import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";
import type { RainforestEnrichmentData } from "@/lib/adapters/rainforest";
import { getMarketIntelligence } from "@/lib/market-intelligence/aggregator";
import { searchEbayComps } from "@/lib/adapters/ebay";
import type { MarketComp } from "@/lib/market-intelligence/types";

// ─── Real scraper → MockCompetitor conversion ────────────────────────────────

function scraperCompsToMockCompetitors(comps: MarketComp[], category: string): MockCompetitor[] {
  return comps.map((c, i) => ({
    id: `${c.platform.toLowerCase().replace(/\s+/g, "_")}_${i}`,
    platform: c.platform,
    title: (c.item || "").slice(0, 120),
    category,
    condition: normalizeCondition(c.condition),
    location: c.location || "Online",
    price: c.price,
    status: (calculateDaysAgo(c.date) > 90 ? "SOLD" : "ACTIVE") as "ACTIVE" | "SOLD",
    daysAgo: calculateDaysAgo(c.date),
    daysToSell: null,
    url: c.url || "#",
    views: 0,
    saves: 0,
    isReal: true,
  }));
}

function normalizeCondition(raw: string): string {
  const lower = (raw || "").toLowerCase();
  if (lower.includes("excellent") || lower.includes("mint") || lower.includes("new")) return "Excellent";
  if (lower.includes("very good") || lower.includes("great")) return "Very Good";
  if (lower.includes("good") || lower.includes("used")) return "Good";
  return "Fair";
}

function calculateDaysAgo(dateStr: string): number {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  } catch {
    return 0;
  }
}

// ─── Mock data pools ──────────────────────────────────────────────────────────

const PLATFORMS = [
  "Facebook Marketplace",
  "eBay",
  "Craigslist",
  "Mercari",
  "OfferUp",
];

const MAINE_LOCATIONS = [
  "Portland, ME",
  "Bangor, ME",
  "Augusta, ME",
  "Lewiston, ME",
  "Brunswick, ME",
  "Biddeford, ME",
  "Waterville, ME",
  "Auburn, ME",
  "Scarborough, ME",
  "South Portland, ME",
];

const CONDITIONS = ["Excellent", "Very Good", "Good", "Fair"];

// ─── Deterministic pseudo-random (seed-based so same item = same competitors) ─

function seededRand(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297 + 233) * 49279;
  return x - Math.floor(x);
}

// ─── Mock competitor generator ────────────────────────────────────────────────

export interface MockCompetitor {
  id: string;
  platform: string;
  title: string;
  category: string;
  condition: string;
  location: string;
  price: number;
  status: "ACTIVE" | "SOLD";
  daysAgo: number;
  daysToSell: number | null;
  url: string;
  views: number;
  saves: number;
  image?: string;
  isReal?: boolean;
}

export function generateMockCompetitors(
  itemTitle: string,
  category: string,
  targetPrice: number
): MockCompetitor[] {
  const seed = itemTitle.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const count = 8 + Math.floor(seededRand(seed, 0) * 8); // 8–15

  const listings: MockCompetitor[] = [];

  for (let i = 0; i < count; i++) {
    const r = seededRand(seed, i + 1);
    const r2 = seededRand(seed, i + 100);
    const r3 = seededRand(seed, i + 200);

    // Price variance 70%–130% of target
    const variance = 0.7 + r * 0.6;
    const price = Math.max(5, Math.round(targetPrice * variance));

    const isSold = r2 < 0.28;
    const platform = PLATFORMS[Math.floor(r3 * PLATFORMS.length)];
    const location =
      MAINE_LOCATIONS[Math.floor(r * MAINE_LOCATIONS.length)];
    const condition = CONDITIONS[Math.floor(r2 * CONDITIONS.length)];
    const daysAgo = Math.floor(r3 * 28) + 1;

    listings.push({
      id: `mock_${i}`,
      platform,
      title: `${itemTitle} – ${condition}`,
      category,
      condition,
      location,
      price,
      status: isSold ? "SOLD" : "ACTIVE",
      daysAgo,
      daysToSell: isSold ? Math.floor(r * 14) + 1 : null,
      url: "#",
      views: Math.floor(r * 240) + 8,
      saves: Math.floor(r2 * 35),
    });
  }

  return listings.sort((a, b) => a.price - b.price);
}

// ─── Amazon real data supplement ──────────────────────────────────────────────

function amazonToCompetitors(
  amazonData: RainforestEnrichmentData,
  category: string,
  maxResults = 5
): MockCompetitor[] {
  return amazonData.results
    .filter((r) => r.price != null && r.price > 0)
    .slice(0, maxResults)
    .map((r, i) => ({
      id: `amazon_${r.asin || i}`,
      platform: "Amazon",
      title: r.title.slice(0, 120),
      category,
      condition: "New",
      location: "Online (Amazon)",
      price: r.price!,
      status: "ACTIVE" as const,
      daysAgo: 0,
      daysToSell: null,
      url: r.link,
      views: r.ratingsTotal ?? 0,
      saves: 0,
      image: r.image,
      isReal: true,
    }));
}

async function getAmazonCompetitors(
  itemId: string,
  category: string
): Promise<MockCompetitor[]> {
  try {
    const event = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "RAINFOREST_RESULT" },
      orderBy: { createdAt: "desc" },
    });
    if (!event?.payload) return [];
    const data = JSON.parse(event.payload) as RainforestEnrichmentData;
    const competitors = amazonToCompetitors(data, category);
    if (competitors.length > 0) {
      console.log(`[ReconBot] Supplementing with ${competitors.length} real Amazon listings`);
    }
    return competitors;
  } catch {
    return [];
  }
}

// ─── Market analysis ──────────────────────────────────────────────────────────

export interface MarketAnalysis {
  competitorCount: number;
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  medianPrice: number | null;
  currentStatus: string;
  recommendation: string;
  confidenceScore: number;
}

export function analyzeMarket(
  competitors: MockCompetitor[],
  userPrice: number | null
): MarketAnalysis {
  const active = competitors.filter((c) => c.status === "ACTIVE");

  if (active.length === 0) {
    return {
      competitorCount: competitors.length,
      lowestPrice: null,
      highestPrice: null,
      averagePrice: null,
      medianPrice: null,
      currentStatus: "NO_COMPETITORS",
      recommendation:
        "No similar items found on monitored platforms. Your pricing is unchallenged — you may be able to price higher.",
      confidenceScore: 0.5,
    };
  }

  const prices = active.map((c) => c.price).sort((a, b) => a - b);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const median = prices[Math.floor(prices.length / 2)];
  const lowest = prices[0];
  const highest = prices[prices.length - 1];

  let status = "PRICED_WELL";
  let recommendation = "";

  if (!userPrice || userPrice === 0) {
    status = "NOT_PRICED";
    recommendation = `Market average is $${Math.round(avg)} across ${active.length} active listings. Set your listing price to attract buyers.`;
  } else if (userPrice > avg * 1.2) {
    const pct = Math.round((userPrice / avg - 1) * 100);
    const suggested = Math.round(avg * 1.05);
    status = "TOO_HIGH";
    recommendation = `Your asking price is ${pct}% above the market average ($${Math.round(avg)}). Lowering to $${suggested} would put you in the competitive zone and attract more buyers.`;
  } else if (userPrice < avg * 0.8) {
    const pct = Math.round((1 - userPrice / avg) * 100);
    const suggested = Math.round(avg * 0.93);
    status = "TOO_LOW";
    recommendation = `You're priced ${pct}% below market average ($${Math.round(avg)}). You could raise to $${suggested} without losing buyers and earn more from this sale.`;
  } else {
    status = "PRICED_WELL";
    recommendation = `Your price is competitive. ${active.length} similar active listings average $${Math.round(avg)} — you're priced right in the sweet spot.`;
  }

  return {
    competitorCount: competitors.length,
    lowestPrice: lowest,
    highestPrice: highest,
    averagePrice: avg,
    medianPrice: median,
    currentStatus: status,
    recommendation,
    confidenceScore: 0.76 + (active.length / (active.length + 8)) * 0.18,
  };
}

// ─── Alert generator ──────────────────────────────────────────────────────────

export interface AlertData {
  alertType: string;
  severity: string;
  title: string;
  message: string;
  actionable: boolean;
  suggestedAction?: string;
  triggerDataJson: string;
}

export function generateAlerts(
  competitors: MockCompetitor[],
  analysis: MarketAnalysis,
  userPrice: number | null
): AlertData[] {
  const alerts: AlertData[] = [];

  if (analysis.currentStatus === "TOO_HIGH" && analysis.averagePrice) {
    alerts.push({
      alertType: "PRICE_TOO_HIGH",
      severity: "HIGH",
      title: "Your price may be too high",
      message: analysis.recommendation,
      actionable: true,
      suggestedAction: `Lower to $${Math.round(analysis.averagePrice * 1.05)}`,
      triggerDataJson: JSON.stringify({ averagePrice: analysis.averagePrice }),
    });
  }

  if (analysis.currentStatus === "TOO_LOW" && analysis.averagePrice) {
    alerts.push({
      alertType: "PRICE_TOO_LOW",
      severity: "MEDIUM",
      title: "You may be underpricing",
      message: analysis.recommendation,
      actionable: true,
      suggestedAction: `Raise to $${Math.round(analysis.averagePrice * 0.93)}`,
      triggerDataJson: JSON.stringify({ averagePrice: analysis.averagePrice }),
    });
  }

  const recentSold = competitors.filter(
    (c) => c.status === "SOLD" && c.daysAgo <= 7
  );
  if (recentSold.length > 0) {
    const avgSold =
      recentSold.reduce((s, c) => s + c.price, 0) / recentSold.length;
    alerts.push({
      alertType: "SIMILAR_SOLD",
      severity: "MEDIUM",
      title: `${recentSold.length} similar item${recentSold.length > 1 ? "s" : ""} sold this week`,
      message: `Recent sold listings averaged $${Math.round(avgSold)}. Demand is active — good time to adjust your listing visibility.`,
      actionable: true,
      suggestedAction: "Mark as Listed to boost visibility",
      triggerDataJson: JSON.stringify({
        count: recentSold.length,
        avgSoldPrice: Math.round(avgSold),
      }),
    });
  }

  const newLow = competitors.filter(
    (c) =>
      c.status === "ACTIVE" &&
      analysis.averagePrice != null &&
      c.price < analysis.averagePrice * 0.85 &&
      c.daysAgo <= 3
  );
  if (newLow.length > 0) {
    alerts.push({
      alertType: "COMPETITOR_LOWER_PRICE",
      severity: "MEDIUM",
      title: `${newLow.length} new low-priced listing${newLow.length > 1 ? "s" : ""} appeared`,
      message: `${newLow.length} competitor listing${newLow.length > 1 ? "s" : ""} appeared in the last 3 days priced at $${newLow[0].price} — below market average.`,
      actionable: true,
      suggestedAction: "Review your pricing",
      triggerDataJson: JSON.stringify({ lowestNewPrice: newLow[0].price }),
    });
  }

  // ── NEW ALERT: OPTIMAL_PRICE ──
  // Triggers when userPrice is between 100-110% of market average
  if (analysis.currentStatus === "PRICED_WELL" && userPrice && analysis.averagePrice) {
    const ratio = userPrice / analysis.averagePrice;
    if (ratio >= 1.0 && ratio <= 1.1) {
      alerts.push({
        alertType: "OPTIMAL_PRICE",
        severity: "LOW",
        title: "Priced Optimally",
        message: `Your price of $${userPrice} is positioned perfectly within the market sweet spot (100-110% of average $${Math.round(analysis.averagePrice)}). This balances maximum margin with fast sell-through.`,
        actionable: false,
        suggestedAction: "Hold current price — market sweet spot",
        triggerDataJson: JSON.stringify({
          userPrice,
          marketAverage: Math.round(analysis.averagePrice),
          ratio: Math.round(ratio * 100) / 100,
        }),
      });
    }
  }

  // ── NEW ALERT: SUPPLY_SHORTAGE ──
  // Triggers when competitor count is very low (rare item opportunity)
  if (analysis.competitorCount !== null && analysis.competitorCount < 3 && analysis.competitorCount >= 0) {
    alerts.push({
      alertType: "SUPPLY_SHORTAGE",
      severity: "MEDIUM",
      title: "Low Market Supply",
      message: `Only ${analysis.competitorCount} active competitor${analysis.competitorCount === 1 ? "" : "s"} found. Low supply may indicate rarity or seasonal scarcity. Consider pricing at a premium above average.`,
      actionable: true,
      suggestedAction: analysis.averagePrice
        ? `Consider pricing at $${Math.round(analysis.averagePrice * 1.15)} (15% above average) due to scarcity`
        : "Price at a premium — limited competition",
      triggerDataJson: JSON.stringify({
        competitorCount: analysis.competitorCount,
        averagePrice: analysis.averagePrice,
      }),
    });
  }

  // ── NEW ALERT: MARKET_SHIFT ──
  // Triggers when recently sold items show significantly different pricing than active listings
  const activeCompetitors = competitors.filter((c) => c.status === "ACTIVE");
  const soldCompetitors = competitors.filter((c) => c.status === "SOLD");
  if (activeCompetitors.length >= 3 && soldCompetitors.length >= 3) {
    const activeAvg = activeCompetitors.reduce((sum, c) => sum + c.price, 0) / activeCompetitors.length;
    const soldAvg = soldCompetitors.reduce((sum, c) => sum + c.price, 0) / soldCompetitors.length;
    const shiftPct = Math.abs(activeAvg - soldAvg) / soldAvg;
    if (shiftPct > 0.15) {
      const direction = activeAvg > soldAvg ? "rising" : "falling";
      alerts.push({
        alertType: "MARKET_SHIFT",
        severity: "MEDIUM",
        title: `Market Prices ${direction === "rising" ? "Rising" : "Falling"}`,
        message: `Active listings average $${Math.round(activeAvg)} while recent sales averaged $${Math.round(soldAvg)}. Market is ${direction} by ${Math.round(shiftPct * 100)}%. ${direction === "rising" ? "Consider listing higher to capture the trend" : "Price competitively to sell before further drops"}.`,
        actionable: true,
        suggestedAction: direction === "rising"
          ? `List at $${Math.round(activeAvg * 1.05)}`
          : `List at $${Math.round(soldAvg * 0.95)}`,
        triggerDataJson: JSON.stringify({
          activeAvg: Math.round(activeAvg),
          soldAvg: Math.round(soldAvg),
          shiftPct: Math.round(shiftPct * 100),
          direction,
        }),
      });
    }
  }

  return alerts;
}

// ─── Activation & scanning ────────────────────────────────────────────────────

export async function activateReconBot(
  itemId: string,
  userId: string,
  platforms: string[]
): Promise<string> {
  // Upsert: if already exists, reactivate
  const existing = await prisma.reconBot.findFirst({ where: { itemId, userId } });

  let botId: string;

  if (existing) {
    await prisma.reconBot.update({
      where: { id: existing.id },
      data: { isActive: true, platformsJson: JSON.stringify(platforms) },
    });
    botId = existing.id;
  } else {
    const bot = await prisma.reconBot.create({
      data: {
        itemId,
        userId,
        platformsJson: JSON.stringify(platforms),
        isActive: true,
        nextScan: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    });
    botId = bot.id;
  }

  // Run first scan immediately
  await runScan(botId);
  return botId;
}

export async function runScan(botId: string): Promise<void> {
  const bot = await prisma.reconBot.findUnique({
    where: { id: botId },
    include: { item: { include: { valuation: true } } },
  });
  if (!bot || !bot.isActive) return;

  const item = bot.item as any;
  const valuation = item.valuation;
  const targetPrice = valuation
    ? (valuation.low + valuation.high) / 2
    : item.listingPrice ?? 150;

  const userPrice: number | null = item.listingPrice ?? null;
  const title = item.title ?? "Item";

  // Pull category from AiResult if available
  let category = "General";
  const aiResult = await prisma.aiResult.findUnique({ where: { itemId: item.id } });
  if (aiResult) {
    try {
      const parsed = JSON.parse(aiResult.rawJson);
      category = parsed.category ?? "General";
    } catch {
      // ignore
    }
  }

  // In demo mode, use mock data. In live mode, call real scrapers + eBay API.
  let scrapedCompetitors: MockCompetitor[];

  if (isDemoMode()) {
    scrapedCompetitors = generateMockCompetitors(title, category, targetPrice);
  } else {
    try {
      // Phase 1: Real market intelligence from 49 scraper adapters (phase1Only = cheap)
      const marketIntel = await getMarketIntelligence(title, category, item.saleZip ?? undefined, true);
      if (marketIntel?.comps && marketIntel.comps.length >= 3) {
        scrapedCompetitors = scraperCompsToMockCompetitors(marketIntel.comps, category);
        console.log(`[ReconBot] Real scrapers: ${scrapedCompetitors.length} competitors from ${marketIntel.sources?.join(", ") || "various"}`);
      } else {
        throw new Error(`Only ${marketIntel?.comps?.length ?? 0} comps found — insufficient`);
      }
    } catch (scraperErr: any) {
      console.warn(`[ReconBot] Scrapers returned insufficient data (${scraperErr?.message}) — using mock fallback`);
      scrapedCompetitors = generateMockCompetitors(title, category, targetPrice);
    }

    // Supplement with FREE eBay active listings (current competitors, not sold history)
    try {
      const activeEbayComps = await searchEbayComps(title, 8);
      if (activeEbayComps.length > 0) {
        const ebayActiveCompetitors: MockCompetitor[] = activeEbayComps.map((ec, i) => ({
          id: `ebay_active_${i}`,
          platform: "eBay (Active)",
          title: ec.title.slice(0, 120),
          category,
          condition: "As Listed",
          location: "Online",
          price: ec.price + (ec.shipping ?? 0),
          status: "ACTIVE" as const,
          daysAgo: 0,
          daysToSell: null,
          url: ec.url,
          views: 0,
          saves: 0,
          isReal: true,
        }));
        scrapedCompetitors = [...ebayActiveCompetitors, ...scrapedCompetitors];
        console.log(`[ReconBot] eBay active listings: +${activeEbayComps.length} competitors (FREE)`);
      }
    } catch (ebayErr: any) {
      console.warn(`[ReconBot] eBay active listing supplement failed (non-fatal): ${ebayErr?.message}`);
    }
  }

  // Supplement with real Amazon listings if available (prepend so they appear first)
  const amazonCompetitors = await getAmazonCompetitors(item.id, category).catch(() => []);
  const competitors = [...amazonCompetitors, ...scrapedCompetitors];
  const analysis = analyzeMarket(competitors, userPrice);
  const newAlerts = generateAlerts(competitors, analysis, userPrice);

  // Clear unread/undismissed old alerts from this bot
  await prisma.reconAlert.deleteMany({
    where: { reconBotId: botId, viewed: false, dismissed: false },
  });

  // Update bot
  await prisma.reconBot.update({
    where: { id: botId },
    data: {
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
      alertsSent: { increment: newAlerts.length },
    },
  });

  // Create new alerts
  if (newAlerts.length > 0) {
    await prisma.reconAlert.createMany({
      data: newAlerts.map((a) => ({ ...a, reconBotId: botId })),
    });
  }
}
