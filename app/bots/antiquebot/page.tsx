import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import AntiqueBotClient from "./AntiqueBotClient";

export const metadata = { title: "AntiqueBot — LegacyLoop" };

export default async function AntiqueBotPage() {
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
        where: { eventType: "ANTIQUEBOT_RESULT" },
        orderBy: { createdAt: "desc" },
        take: 1,
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
      antiqueBotResult: item.eventLogs[0]?.payload ?? null,
      antiqueBotRunAt: item.eventLogs[0]?.createdAt?.toISOString() ?? null,
      antique: item.antiqueCheck ? {
        isAntique: item.antiqueCheck.isAntique,
        auctionLow: item.antiqueCheck.auctionLow,
        auctionHigh: item.antiqueCheck.auctionHigh,
        reason: item.antiqueCheck.reason,
      } : null,
      category: ai?.category || "general",
      era: ai?.era || null,
      maker: ai?.maker || ai?.brand || null,
      material: ai?.material || null,
      valuationMid: item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : null,
    };
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "AntiqueBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🏺</div>
        <div>
          <h1 className="h2">AntiqueBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>The Antique Specialist — authentication, history, valuation, and collector market deep-dives</p>
        </div>
      </div>
      <Suspense><AntiqueBotClient items={serialized} /></Suspense>
    </div>
  );
}
