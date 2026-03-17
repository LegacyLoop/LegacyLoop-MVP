import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import PriceBotClient from "./PriceBotClient";

export const metadata = { title: "PriceBot — LegacyLoop" };

export default async function PriceBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      aiResult: true,
      valuation: true,
      antiqueCheck: true,
      eventLogs: {
        where: { eventType: "PRICEBOT_RESULT" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = rawItems.map((item) => ({
    id: item.id,
    title: item.title || `Item #${item.id.slice(0, 6)}`,
    status: item.status,
    photo: item.photos[0]?.filePath ?? null,
    hasAnalysis: !!item.valuation,
    aiResult: item.aiResult?.rawJson ?? null,
    priceBotResult: item.eventLogs[0]?.payload ?? null,
    priceBotRunAt: item.eventLogs[0]?.createdAt?.toISOString() ?? null,
    valuation: item.valuation ? {
      low: item.valuation.low,
      mid: item.valuation.mid,
      high: item.valuation.high,
      confidence: item.valuation.confidence,
      source: item.valuation.source,
      rationale: item.valuation.rationale,
      localLow: item.valuation.localLow,
      localMid: item.valuation.localMid,
      localHigh: item.valuation.localHigh,
      localConfidence: item.valuation.localConfidence,
      localSource: item.valuation.localSource,
      onlineLow: item.valuation.onlineLow,
      onlineMid: item.valuation.onlineMid,
      onlineHigh: item.valuation.onlineHigh,
      onlineConfidence: item.valuation.onlineConfidence,
      onlineSource: item.valuation.onlineSource,
      onlineRationale: item.valuation.onlineRationale,
      bestMarketLow: item.valuation.bestMarketLow,
      bestMarketMid: item.valuation.bestMarketMid,
      bestMarketHigh: item.valuation.bestMarketHigh,
      bestMarketCity: item.valuation.bestMarketCity,
      sellerNetLocal: item.valuation.sellerNetLocal,
      sellerNetNational: item.valuation.sellerNetNational,
      sellerNetBestMarket: item.valuation.sellerNetBestMarket,
      recommendation: item.valuation.recommendation,
    } : null,
    antique: item.antiqueCheck ? {
      isAntique: item.antiqueCheck.isAntique,
      auctionLow: item.antiqueCheck.auctionLow,
      auctionHigh: item.antiqueCheck.auctionHigh,
    } : null,
  }));

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "PriceBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(76,175,80,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>💰</div>
        <div>
          <h1 className="h2">PriceBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Deep pricing intelligence — market analysis, adjustments, and earnings projections</p>
        </div>
      </div>
      <Suspense><PriceBotClient items={serialized} /></Suspense>
    </div>
  );
}
