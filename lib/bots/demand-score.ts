import { prisma } from "@/lib/db";

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

const DEMAND_LEVEL_MAP: Record<string, number> = {
  hot: 95, strong: 80, high: 80, trending: 75, viral: 95,
  moderate: 55, warm: 60, medium: 55,
  weak: 30, cool: 35, low: 25, thin: 20,
  dead: 5, cold: 10, none: 0,
  rising: 70, stable: 50, declining: 30,
};

function textToScore(text: string): number {
  const lower = (text || "").toLowerCase().trim();
  return DEMAND_LEVEL_MAP[lower] ?? 50;
}

/**
 * Calculate unified demand score (0-100) from all bot signals.
 * Stores as DEMAND_SCORE EventLog.
 */
export async function calculateDemandScore(itemId: string): Promise<number> {
  const logs = await prisma.eventLog.findMany({
    where: {
      itemId,
      eventType: { in: ["PRICEBOT_RESULT", "RECONBOT_RESULT", "COLLECTIBLESBOT_RESULT", "ANTIQUEBOT_RESULT", "CARBOT_RESULT", "BUYERBOT_RESULT"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const latestByType = new Map<string, any>();
  for (const log of logs) {
    if (!latestByType.has(log.eventType)) {
      latestByType.set(log.eventType, safeJson(log.payload));
    }
  }

  const signals: { source: string; score: number; weight: number }[] = [];

  const priceBot = latestByType.get("PRICEBOT_RESULT");
  if (priceBot) {
    const dl = priceBot.market_analysis?.demand_level || priceBot.demand_level;
    if (dl) signals.push({ source: "PriceBot", score: textToScore(dl), weight: 0.30 });
  }

  const reconBot = latestByType.get("RECONBOT_RESULT");
  if (reconBot) {
    const mh = reconBot.scan_summary?.market_heat || reconBot.market_heat;
    if (mh) signals.push({ source: "ReconBot", score: textToScore(mh), weight: 0.20 });
  }

  const collectBot = latestByType.get("COLLECTIBLESBOT_RESULT");
  if (collectBot?.demand_trend) {
    signals.push({ source: "CollectiblesBot", score: textToScore(collectBot.demand_trend), weight: 0.15 });
  }

  const antiqueBot = latestByType.get("ANTIQUEBOT_RESULT");
  if (antiqueBot?.collector_market?.collector_demand) {
    signals.push({ source: "AntiqueBot", score: textToScore(antiqueBot.collector_market.collector_demand), weight: 0.10 });
  }

  const buyerBot = latestByType.get("BUYERBOT_RESULT");
  if (buyerBot) {
    const hotLeads = (buyerBot.hot_leads || []).length;
    const profiles = (buyerBot.buyer_profiles || []).length;
    const buyerScore = Math.min(100, hotLeads * 20 + profiles * 10);
    signals.push({ source: "BuyerBot", score: buyerScore, weight: 0.15 });
  }

  const engagement = await prisma.itemEngagementMetrics.findUnique({ where: { itemId } });
  if (engagement) {
    const engScore = Math.min(100, (engagement.totalViews || 0) * 0.3 + (engagement.inquiries || 0) * 5);
    signals.push({ source: "Engagement", score: Math.round(engScore), weight: 0.10 });
  }

  if (signals.length === 0) return 50;

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const rawScore = signals.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight;
  const finalScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "DEMAND_SCORE",
      payload: JSON.stringify({
        score: finalScore,
        signals,
        calculatedAt: new Date().toISOString(),
        label: finalScore >= 80 ? "Hot" : finalScore >= 60 ? "Strong" : finalScore >= 40 ? "Moderate" : finalScore >= 20 ? "Weak" : "Cold",
      }),
    },
  }).catch(() => null);

  console.log(`[DemandScore] Item ${itemId}: ${finalScore}/100 from ${signals.length} signals`);
  return finalScore;
}
