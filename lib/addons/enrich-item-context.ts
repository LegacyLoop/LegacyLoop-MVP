import { prisma } from "@/lib/db";

export interface EnrichedItemContext {
  priceSnapshots: { priceLow: number | null; priceHigh: number | null; priceMedian: number | null; source: string; createdAt: Date }[];
  priceDirection: "rising" | "falling" | "stable" | "unknown";
  lowestSnapshot: number | null;
  highestSnapshot: number | null;
  avgMedianPrice: number | null;
  marketComps: { platform: string; price: number; title: string; shipping: number | null }[];
  avgCompPrice: number | null;
  highComp: number | null;
  lowComp: number | null;
  aiConfidence: number | null;
  isAntique: boolean;
  antiqueReason: string | null;
  auctionLow: number | null;
  auctionHigh: number | null;
  authenticityScore: number | null;
  totalOffers: number;
  highestOffer: number | null;
  lowestOffer: number | null;
  avgOffer: number | null;
  offerToAskRatio: number | null;
  hasAcceptedOffer: boolean;
  soldPrice: number | null;
  soldAt: Date | null;
  botResults: {
    priceBot: any;
    reconBot: any;
    antiqueBot: any;
    collectiblesBot: any;
    buyerBot: any;
    megaBot: any;
  };
  dataCompleteness: number;
  enrichedAt: Date;
}

function safeJsonParse(s: any): any {
  if (!s) return null;
  if (typeof s === "object") return s;
  try { return JSON.parse(s); } catch { return null; }
}

export async function enrichItemContext(itemId: string, listingPrice?: number | null): Promise<EnrichedItemContext> {
  const [snapR, compR, aiR, antR, offR, soldR, pbR, rbR, abR, cbR, bbR, mbR] = await Promise.allSettled([
    prisma.priceSnapshot.findMany({ where: { itemId }, orderBy: { createdAt: "desc" }, take: 10, select: { priceLow: true, priceHigh: true, priceMedian: true, source: true, createdAt: true } }),
    prisma.marketComp.findMany({ where: { itemId }, orderBy: { createdAt: "desc" }, take: 5, select: { platform: true, price: true, title: true, shipping: true } }),
    prisma.aiResult.findUnique({ where: { itemId }, select: { confidence: true } }),
    prisma.antiqueCheck.findUnique({ where: { itemId }, select: { isAntique: true, reason: true, auctionLow: true, auctionHigh: true, authenticityScore: true } }),
    prisma.offer.findMany({ where: { itemId }, select: { currentPrice: true, status: true } }),
    prisma.item.findUnique({ where: { id: itemId }, select: { soldPrice: true, soldAt: true } }),
    prisma.eventLog.findFirst({ where: { itemId, eventType: "PRICEBOT_RESULT" }, orderBy: { createdAt: "desc" }, select: { payload: true } }),
    prisma.eventLog.findFirst({ where: { itemId, eventType: "RECONBOT_RESULT" }, orderBy: { createdAt: "desc" }, select: { payload: true } }),
    prisma.eventLog.findFirst({ where: { itemId, eventType: "ANTIQUEBOT_RESULT" }, orderBy: { createdAt: "desc" }, select: { payload: true } }),
    prisma.eventLog.findFirst({ where: { itemId, eventType: "COLLECTIBLESBOT_RESULT" }, orderBy: { createdAt: "desc" }, select: { payload: true } }),
    prisma.eventLog.findFirst({ where: { itemId, eventType: "BUYERBOT_RESULT" }, orderBy: { createdAt: "desc" }, select: { payload: true } }),
    prisma.eventLog.findFirst({ where: { itemId, eventType: { startsWith: "MEGABOT_" } }, orderBy: { createdAt: "desc" }, select: { payload: true } }),
  ]);

  const snapshots = snapR.status === "fulfilled" ? snapR.value : [];
  const comps = compR.status === "fulfilled" ? compR.value : [];
  const ai = aiR.status === "fulfilled" ? aiR.value : null;
  const antique = antR.status === "fulfilled" ? antR.value : null;
  const offers = offR.status === "fulfilled" ? offR.value : [];
  const sold = soldR.status === "fulfilled" ? soldR.value : null;

  const parseBot = (r: PromiseSettledResult<any>) => r.status === "fulfilled" && r.value?.payload ? safeJsonParse(r.value.payload) : null;

  // Price direction
  let priceDirection: "rising" | "falling" | "stable" | "unknown" = "unknown";
  if (snapshots.length >= 2) {
    const newest = snapshots[0].priceMedian || 0;
    const oldest = snapshots[snapshots.length - 1].priceMedian || 0;
    if (oldest > 0) {
      const diff = newest - oldest;
      priceDirection = diff > oldest * 0.05 ? "rising" : diff < -(oldest * 0.05) ? "falling" : "stable";
    }
  }

  const medians = snapshots.map(s => s.priceMedian).filter((v): v is number => v !== null && v > 0);
  const compPrices = comps.map(c => c.price).filter((v): v is number => v != null && v > 0);
  const offerPrices = offers.map(o => o.currentPrice).filter((v): v is number => v != null && v > 0);

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const highestOffer = offerPrices.length ? Math.max(...offerPrices) : null;

  const sections = [snapshots.length > 0, comps.length > 0, ai !== null, antique !== null, offers.length > 0, sold?.soldPrice != null, parseBot(pbR) !== null, parseBot(rbR) !== null];
  const dataCompleteness = Math.round((sections.filter(Boolean).length / sections.length) * 100);

  return {
    priceSnapshots: snapshots,
    priceDirection,
    lowestSnapshot: snapshots.length ? Math.min(...snapshots.map(s => s.priceLow || Infinity).filter(v => v !== Infinity && v > 0)) || null : null,
    highestSnapshot: snapshots.length ? Math.max(...snapshots.map(s => s.priceHigh || 0).filter(v => v > 0)) || null : null,
    avgMedianPrice: avg(medians),
    marketComps: comps,
    avgCompPrice: avg(compPrices),
    highComp: compPrices.length ? Math.max(...compPrices) : null,
    lowComp: compPrices.length ? Math.min(...compPrices) : null,
    aiConfidence: ai?.confidence ?? null,
    isAntique: antique?.isAntique ?? false,
    antiqueReason: antique?.reason ?? null,
    auctionLow: antique?.auctionLow ?? null,
    auctionHigh: antique?.auctionHigh ?? null,
    authenticityScore: antique?.authenticityScore ?? null,
    totalOffers: offers.length,
    highestOffer,
    lowestOffer: offerPrices.length ? Math.min(...offerPrices) : null,
    avgOffer: avg(offerPrices),
    offerToAskRatio: highestOffer && listingPrice && listingPrice > 0 ? Math.round((highestOffer / listingPrice) * 100) / 100 : null,
    hasAcceptedOffer: offers.some(o => o.status === "ACCEPTED"),
    soldPrice: sold?.soldPrice ?? null,
    soldAt: sold?.soldAt ?? null,
    botResults: {
      priceBot: parseBot(pbR),
      reconBot: parseBot(rbR),
      antiqueBot: parseBot(abR),
      collectiblesBot: parseBot(cbR),
      buyerBot: parseBot(bbR),
      megaBot: parseBot(mbR),
    },
    dataCompleteness,
    enrichedAt: new Date(),
  };
}
