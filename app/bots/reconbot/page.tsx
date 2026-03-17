import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import ReconBotClient from "./ReconBotClient";

export const metadata = { title: "ReconBot — LegacyLoop" };

export default async function ReconBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      aiResult: true,
      valuation: true,
      reconBots: { include: { alerts: { where: { dismissed: false }, orderBy: { createdAt: "desc" } } } },
      eventLogs: {
        where: { eventType: "RECONBOT_RESULT" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = rawItems.map((item) => {
    const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    const bot = item.reconBots[0] || null;
    return {
      id: item.id,
      title: item.title || `Item #${item.id.slice(0, 6)}`,
      status: item.status,
      photo: item.photos[0]?.filePath ?? null,
      hasAnalysis: !!item.aiResult,
      aiResult: item.aiResult?.rawJson ?? null,
      category: ai?.category || "General",
      valuation: item.valuation ? {
        low: item.valuation.low,
        mid: item.valuation.mid ?? Math.round((item.valuation.low + item.valuation.high) / 2),
        high: item.valuation.high,
        confidence: item.valuation.confidence,
      } : null,
      reconBotResult: item.eventLogs[0]?.payload ?? null,
      reconBotRunAt: item.eventLogs[0]?.createdAt?.toISOString() ?? null,
      reconBot: bot ? {
        isActive: bot.isActive,
        competitorCount: bot.competitorCount,
        lowestPrice: bot.lowestPrice,
        averagePrice: bot.averagePrice,
        currentStatus: bot.currentStatus,
        recommendation: bot.recommendation,
        confidenceScore: bot.confidenceScore,
        scansCompleted: bot.scansCompleted,
        lastScan: bot.lastScan?.toISOString() ?? null,
        nextScan: bot.nextScan?.toISOString() ?? null,
        alertCount: bot.alerts.length,
      } : null,
    };
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "ReconBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🔍</div>
        <div>
          <h1 className="h2">ReconBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Continuous competitive intelligence — monitors competitors, prices, and market shifts</p>
        </div>
      </div>
      <Suspense><ReconBotClient items={serialized} /></Suspense>
    </div>
  );
}
