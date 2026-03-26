import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import AnalyzeBotClient from "./AnalyzeBotClient";

export const metadata = { title: "AnalyzeBot — LegacyLoop" };

export default async function AnalyzeBotPage() {
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
        where: { eventType: { in: ["ANALYZED", "ANALYZED_FORCE", "MEGABOT_ANALYZEBOT"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, eventType: true, payload: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = rawItems.map((item) => {
    const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    return {
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
      } : null,
      valuationMid: item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : null,
      valuationRationale: item.valuation?.onlineRationale ?? null,
      valuationSource: item.valuation?.source ?? null,
      antique: item.antiqueCheck ? {
        isAntique: item.antiqueCheck.isAntique,
        auctionLow: item.antiqueCheck.auctionLow,
        auctionHigh: item.antiqueCheck.auctionHigh,
      } : null,
      isAntique: item.antiqueCheck?.isAntique ?? false,
      auctionLow: item.antiqueCheck?.auctionLow ?? null,
      auctionHigh: item.antiqueCheck?.auctionHigh ?? null,
      antiqueScore: (() => { try { const r = JSON.parse(item.antiqueCheck?.reason ?? "{}"); return r.score ?? null; } catch { return null; } })(),
      antiqueMarkers: (() => { try { const r = JSON.parse(item.antiqueCheck?.reason ?? "{}"); return r.markers ?? []; } catch { return []; } })(),
      analysisHistory: item.eventLogs.map((ev: any) => ({
        id: ev.id,
        type: ev.eventType,
        createdAt: ev.createdAt.toISOString(),
        payload: (() => { try { return JSON.parse(ev.payload ?? "{}"); } catch { return null; } })(),
      })),
      lastAnalyzedAt: item.eventLogs[0]?.createdAt?.toISOString() ?? null,
    };
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "AnalyzeBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(0,188,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🧠</div>
        <div>
          <h1 className="h2">AnalyzeBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Comprehensive AI identification, condition assessment, and valuation</p>
        </div>
      </div>
      <Suspense><AnalyzeBotClient items={serialized} /></Suspense>
    </div>
  );
}
