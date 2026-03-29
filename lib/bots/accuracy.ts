import { prisma } from "@/lib/db";

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * When an item sells, compare all bot price predictions against the actual sold price.
 * Stores BOT_ACCURACY EventLog with per-bot accuracy metrics.
 */
export async function trackBotAccuracy(itemId: string, soldPrice: number): Promise<void> {
  if (!soldPrice || soldPrice <= 0) return;

  const botPriceExtractors = [
    { eventType: "PRICEBOT_RESULT", bot: "PriceBot", extract: (d: any) => d?.price_validation?.revised_mid || null },
    { eventType: "ANTIQUEBOT_RESULT", bot: "AntiqueBot", extract: (d: any) => d?.valuation?.fair_market_value?.mid || null },
    { eventType: "CARBOT_RESULT", bot: "CarBot", extract: (d: any) => d?.valuation?.private_party_value?.mid || null },
    { eventType: "COLLECTIBLESBOT_RESULT", bot: "CollectiblesBot", extract: (d: any) => d?.raw_value_mid || null },
  ];

  const logs = await prisma.eventLog.findMany({
    where: { itemId, eventType: { in: botPriceExtractors.map(b => b.eventType) } },
    orderBy: { createdAt: "desc" },
  });

  const latestByType = new Map<string, typeof logs[0]>();
  for (const log of logs) {
    if (!latestByType.has(log.eventType)) latestByType.set(log.eventType, log);
  }

  const accuracyResults: { bot: string; predicted: number; actual: number; errorPercent: number; grade: string }[] = [];

  for (const extractor of botPriceExtractors) {
    const log = latestByType.get(extractor.eventType);
    if (!log) continue;
    const data = safeJson(log.payload);
    if (!data) continue;
    const predicted = extractor.extract(data);
    if (!predicted || predicted <= 0) continue;

    const errorPercent = Math.round(Math.abs(predicted - soldPrice) / soldPrice * 100);
    const grade = errorPercent <= 10 ? "A" : errorPercent <= 20 ? "B" : errorPercent <= 35 ? "C" : errorPercent <= 50 ? "D" : "F";

    accuracyResults.push({ bot: extractor.bot, predicted: Math.round(predicted), actual: Math.round(soldPrice), errorPercent, grade });
  }

  if (accuracyResults.length === 0) return;

  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "BOT_ACCURACY",
      payload: JSON.stringify({
        soldPrice: Math.round(soldPrice),
        results: accuracyResults,
        bestBot: accuracyResults.sort((a, b) => a.errorPercent - b.errorPercent)[0]?.bot || null,
        worstBot: accuracyResults.sort((a, b) => b.errorPercent - a.errorPercent)[0]?.bot || null,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log(`[BotAccuracy] Item ${itemId} sold for $${soldPrice}. ${accuracyResults.map(r => `${r.bot}: $${r.predicted} (${r.grade})`).join(", ")}`);
}
