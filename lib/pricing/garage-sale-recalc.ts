/**
 * Garage Sale Auto-Recalculation — LegacyLoop
 *
 * Fetches all enrichment data for an item, builds GarageSaleOptions,
 * calls the V2 engine, saves prices, and logs for audit.
 *
 * CMD-GARAGE-SALE-ENGINE-V2
 */

import { prisma } from "@/lib/db";
import { calculateGarageSaleV8Prices, type GarageSaleV8Prices, type GarageSaleV8Options, calculateGarageSalePrices, type GarageSalePrices, type GarageSaleOptions } from "./garage-sale";

function safeJson(raw: string | null | undefined): any {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function recalcGarageSalePrices(itemId: string): Promise<GarageSaleV8Prices | null> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      valuation: true,
      antiqueCheck: true,
      aiResult: true,
      marketComps: { select: { id: true } },
    },
  });

  if (!item) return null;

  const v = item.valuation;
  const marketMid = (v as any)?.mid ?? (v ? Math.round((v.low + v.high) / 2) : 0);
  if (marketMid <= 0) return null;

  // Parse AI data
  const ai = safeJson(item.aiResult?.rawJson ?? null);
  const category = ai?.category || (item as any).category || "";
  const condition = ai?.condition_guess || (item as any).condition || "good";
  const zip = (item as any).saleZip || null;

  // Fetch latest demand score + collectibles data
  const [demandLog, collectiblesLog] = await Promise.all([
    prisma.eventLog.findFirst({
      where: { itemId, eventType: "DEMAND_SCORE" },
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    }).catch(() => null),
    prisma.eventLog.findFirst({
      where: { itemId, eventType: "COLLECTIBLESBOT_RESULT" },
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    }).catch(() => null),
  ]);
  const demandData = safeJson(demandLog?.payload ?? null);
  const collectData = safeJson(collectiblesLog?.payload ?? null);

  // Build enriched options
  const antique = item.antiqueCheck;
  const options: GarageSaleOptions = {
    isAntique: antique?.isAntique ?? false,
    authenticityScore: antique?.authenticityScore ?? undefined,
    auctionLow: antique?.auctionLow ?? undefined,
    auctionHigh: antique?.auctionHigh ?? undefined,
    demandScore: typeof demandData?.score === "number" ? demandData.score : undefined,
    confidenceScore: ai?.pricing_confidence ?? (v?.confidence ?? undefined),
    conditionScore: ai?.condition_score ?? undefined,
    brand: ai?.brand ?? undefined,
    marketCompsCount: item.marketComps.length,
    isCollectible: collectData?.isCollectible ?? (ai?.is_collectible ?? false),
    collectiblesScore: collectData?.overall_score ?? collectData?.collectiblesScore ?? undefined,
    collectiblesGrade: collectData?.grade ?? collectData?.psaGrade ?? undefined,
  };

  const v8Options: GarageSaleV8Options = {
    ...options,
    saleMethod: (item as any).saleMethod || "BOTH",
    shippingDifficulty: (item as any).aiShippingDifficulty || undefined,
    itemTitle: item.title || undefined,
  };

  const prices = calculateGarageSaleV8Prices(marketMid, category, condition, zip, v8Options);

  // Save to item record (V8 mapping: LIST→High, ACCEPT→Price, FLOOR→Quick)
  await prisma.item.update({
    where: { id: itemId },
    data: {
      garageSalePrice: prices.acceptPrice,
      garageSalePriceHigh: prices.listPrice,
      quickSalePrice: prices.floorPrice,
      quickSalePriceHigh: prices.quickSalePriceHigh,
      garageSaleCalcAt: new Date(),
    },
  });

  // Audit log
  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "GARAGE_SALE_V8_CALC",
      payload: JSON.stringify({
        ...prices,
        optionsUsed: v8Options,
        marketMid,
        v8: true,
      }),
    },
  }).catch(() => {});

  return prices;
}
