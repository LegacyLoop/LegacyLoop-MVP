import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import CollectiblesBotClient from "./CollectiblesBotClient";

export const metadata = { title: "CollectiblesBot — LegacyLoop" };

export default async function CollectiblesBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" } },
      aiResult: true,
      valuation: true,
      antiqueCheck: true,
      eventLogs: {
        where: { eventType: "COLLECTIBLESBOT_RESULT" },
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
      photos: item.photos.map((p) => ({ id: p.id, filePath: p.filePath })),
      hasAnalysis: !!item.aiResult,
      aiResult: item.aiResult?.rawJson ?? null,
      collectiblesBotResult: item.eventLogs[0]?.payload ?? null,
      collectiblesBotRunAt: item.eventLogs[0]?.createdAt?.toISOString() ?? null,
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
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "CollectiblesBot" }]} />
      <Suspense fallback={
        <div style={{
          padding: "3rem", textAlign: "center",
          background: "rgba(15,15,25,0.6)", backdropFilter: "blur(12px)",
          borderRadius: "14px", border: "1px solid rgba(139,92,246,0.15)",
        }}>
          <div style={{ width: "2rem", height: "2rem", border: "3px solid rgba(139,92,246,0.2)", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 0.75rem" }} />
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading CollectiblesBot...</div>
        </div>
      }>
        <CollectiblesBotClient items={serialized} />
      </Suspense>
    </div>
  );
}
