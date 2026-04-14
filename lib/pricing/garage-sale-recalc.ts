/**
 * Garage Sale Auto-Recalculation — LegacyLoop
 *
 * Fetches all enrichment data for an item, builds GarageSaleOptions,
 * calls the V2 engine, saves prices, and logs for audit.
 *
 * CMD-GARAGE-SALE-ENGINE-V2
 */

import { prisma } from "@/lib/db";
import { calculateGarageSalePrices, type GarageSalePrices, type GarageSaleOptions } from "./garage-sale";

function safeJson(raw: string | null | undefined): any {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function recalcGarageSalePrices(itemId: string): Promise<GarageSalePrices | null> {
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

  // Fetch latest demand score
  const demandLog = await prisma.eventLog.findFirst({
    where: { itemId, eventType: "DEMAND_SCORE" },
    orderBy: { createdAt: "desc" },
    select: { payload: true },
  }).catch(() => null);
  const demandData = safeJson(demandLog?.payload ?? null);

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
  };

  const prices = calculateGarageSalePrices(marketMid, category, condition, zip, options);

  // Save to item record
  await prisma.item.update({
    where: { id: itemId },
    data: {
      garageSalePrice: prices.garageSalePrice,
      garageSalePriceHigh: prices.garageSalePriceHigh,
      quickSalePrice: prices.quickSalePrice,
      quickSalePriceHigh: prices.quickSalePriceHigh,
      garageSaleCalcAt: new Date(),
    },
  });

  // Audit log
  await prisma.eventLog.create({
    data: {
      itemId,
      eventType: "GARAGE_SALE_RECALC",
      payload: JSON.stringify({
        ...prices,
        optionsUsed: options,
        marketMid,
      }),
    },
  }).catch(() => {});

  return prices;
}
