import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import BuyerBotClient from "./BuyerBotClient";

export const metadata = { title: "BuyerBot — LegacyLoop" };

export default async function BuyerBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      aiResult: true,
      valuation: true,
      buyerBots: { include: { leads: true } },
      eventLogs: {
        where: { eventType: { in: ["BUYERBOT_RESULT", "BUYERBOT_RUN", "MEGABOT_BUYERBOT"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, eventType: true, payload: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = rawItems.map((item) => {
    const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    const totalLeads = item.buyerBots.reduce((s, b) => s + b.leads.length, 0);
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
      leadCount: totalLeads,
      buyerBotResult: (() => {
        const evt = item.eventLogs.find((ev: any) => ev.eventType === "BUYERBOT_RESULT" || ev.eventType === "MEGABOT_BUYERBOT");
        return evt?.payload ?? null;
      })(),
      buyerBotRunAt: (() => {
        const evt = item.eventLogs.find((ev: any) => ev.eventType === "BUYERBOT_RESULT" || ev.eventType === "MEGABOT_BUYERBOT");
        return evt?.createdAt?.toISOString() ?? null;
      })(),
      buyerHistory: item.eventLogs
        .filter((ev: any) => ["BUYERBOT_RESULT", "BUYERBOT_RUN", "MEGABOT_BUYERBOT"].includes(ev.eventType))
        .map((ev: any) => ({ id: ev.id, type: ev.eventType, createdAt: ev.createdAt.toISOString() })),
      lastScannedAt: (() => {
        const evt = item.eventLogs.find((ev: any) => ["BUYERBOT_RESULT", "MEGABOT_BUYERBOT"].includes(ev.eventType));
        return evt?.createdAt?.toISOString() ?? null;
      })(),
      activeLeads: (() => {
        const bot = item.buyerBots?.[0];
        if (!bot?.leads) return [];
        return bot.leads.map((lead: any) => ({
          id: lead.id, buyerName: lead.buyerName, platform: lead.platform,
          location: lead.location, maxBudget: lead.maxBudget, urgency: lead.urgency,
          matchScore: lead.matchScore, outreachStatus: lead.outreachStatus,
        }));
      })(),
      botActive: !!item.buyerBots?.[0]?.isActive,
      botBuyersFound: item.buyerBots?.[0]?.buyersFound ?? 0,
    };
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "BuyerBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(233,30,99,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🎯</div>
        <div>
          <h1 className="h2">BuyerBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Aggressive buyer search — finds targeted buyers across all networks</p>
        </div>
      </div>
      <Suspense><BuyerBotClient items={serialized} /></Suspense>
    </div>
  );
}
