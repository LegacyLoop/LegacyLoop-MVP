import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import MegaBotClient from "./MegaBotClient";

export const metadata = { title: "MegaBot — LegacyLoop" };

export default async function MegaBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      aiResult: true,
      valuation: true,
      antiqueCheck: true,
      marketComps: { take: 8 },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = rawItems.map((item) => ({
    id: item.id,
    title: item.title || `Item #${item.id.slice(0, 6)}`,
    status: item.status,
    photo: item.photos[0]?.filePath ?? null,
    hasAnalysis: !!item.aiResult,
    aiResult: item.aiResult?.rawJson ?? null,
    valuation: item.valuation ? {
      low: item.valuation.low,
      high: item.valuation.high,
      confidence: item.valuation.confidence,
      source: item.valuation.source,
      rationale: item.valuation.rationale,
      localLow: item.valuation.localLow,
      localHigh: item.valuation.localHigh,
      localSource: item.valuation.localSource,
      onlineLow: item.valuation.onlineLow,
      onlineHigh: item.valuation.onlineHigh,
      onlineSource: item.valuation.onlineSource,
      onlineRationale: item.valuation.onlineRationale,
    } : null,
    antique: item.antiqueCheck ? {
      isAntique: item.antiqueCheck.isAntique,
      reason: item.antiqueCheck.reason,
      auctionLow: item.antiqueCheck.auctionLow,
      auctionHigh: item.antiqueCheck.auctionHigh,
    } : null,
    compsCount: item.marketComps.length,
  }));

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "MegaBot Analysis" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(0,188,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🤖</div>
        <div>
          <h1 className="h2">MegaBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Multi-agent power-up — orchestrates OpenAI, Claude, Gemini, and Grok across all specialist bots</p>
        </div>
      </div>
      <Suspense><MegaBotClient items={serialized} /></Suspense>
    </div>
  );
}
