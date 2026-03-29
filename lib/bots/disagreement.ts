import { prisma } from "@/lib/db";

interface BotPrice {
  bot: string;
  mid: number;
  low: number;
  high: number;
  source: string;
}

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * Check for cross-bot pricing disagreements after any bot writes a result.
 * Logs BOT_DISAGREEMENT EventLog if any two bots differ by >30%.
 * Non-blocking — call with .catch(() => null).
 */
export async function checkBotDisagreement(itemId: string): Promise<void> {
  const botPriceExtractors: { eventType: string; bot: string; extract: (data: any) => BotPrice | null }[] = [
    { eventType: "PRICEBOT_RESULT", bot: "PriceBot", extract: (d) => {
      const pv = d?.price_validation;
      if (!pv?.revised_mid) return null;
      return { bot: "PriceBot", mid: pv.revised_mid, low: pv.revised_low || pv.revised_mid * 0.8, high: pv.revised_high || pv.revised_mid * 1.2, source: "price_validation.revised_mid" };
    }},
    { eventType: "ANTIQUEBOT_RESULT", bot: "AntiqueBot", extract: (d) => {
      const fmv = d?.valuation?.fair_market_value;
      if (!fmv?.mid) return null;
      return { bot: "AntiqueBot", mid: fmv.mid, low: fmv.low || fmv.mid * 0.7, high: fmv.high || fmv.mid * 1.3, source: "valuation.fair_market_value.mid" };
    }},
    { eventType: "CARBOT_RESULT", bot: "CarBot", extract: (d) => {
      const pp = d?.valuation?.private_party_value;
      if (!pp?.mid) return null;
      return { bot: "CarBot", mid: pp.mid, low: pp.low || pp.mid * 0.85, high: pp.high || pp.mid * 1.15, source: "valuation.private_party_value.mid" };
    }},
    { eventType: "COLLECTIBLESBOT_RESULT", bot: "CollectiblesBot", extract: (d) => {
      if (!d?.raw_value_mid) return null;
      return { bot: "CollectiblesBot", mid: d.raw_value_mid, low: d.raw_value_low || d.raw_value_mid * 0.7, high: d.raw_value_high || d.raw_value_mid * 1.3, source: "raw_value_mid" };
    }},
  ];

  const logs = await prisma.eventLog.findMany({
    where: { itemId, eventType: { in: botPriceExtractors.map(b => b.eventType) } },
    orderBy: { createdAt: "desc" },
  });

  const latestByType = new Map<string, typeof logs[0]>();
  for (const log of logs) {
    if (!latestByType.has(log.eventType)) latestByType.set(log.eventType, log);
  }

  const prices: BotPrice[] = [];
  for (const extractor of botPriceExtractors) {
    const log = latestByType.get(extractor.eventType);
    if (!log) continue;
    const data = safeJson(log.payload);
    if (!data) continue;
    const price = extractor.extract(data);
    if (price && price.mid > 0) prices.push(price);
  }

  if (prices.length < 2) return;

  const disagreements: { botA: string; botB: string; priceA: number; priceB: number; diffPercent: number }[] = [];
  for (let i = 0; i < prices.length; i++) {
    for (let j = i + 1; j < prices.length; j++) {
      const a = prices[i];
      const b = prices[j];
      const maxPrice = Math.max(a.mid, b.mid);
      const diffPercent = Math.round(Math.abs(a.mid - b.mid) / maxPrice * 100);
      if (diffPercent > 30) {
        disagreements.push({ botA: a.bot, botB: b.bot, priceA: a.mid, priceB: b.mid, diffPercent });
      }
    }
  }

  if (disagreements.length > 0) {
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "BOT_DISAGREEMENT",
        payload: JSON.stringify({
          timestamp: new Date().toISOString(),
          botPrices: prices,
          disagreements,
          summary: disagreements.map(d => `${d.botA} ($${d.priceA}) vs ${d.botB} ($${d.priceB}) — ${d.diffPercent}% diff`).join("; "),
        }),
      },
    });
    console.log(`[BotDisagreement] ${disagreements.length} conflict(s) for item ${itemId}`);
  }
}
