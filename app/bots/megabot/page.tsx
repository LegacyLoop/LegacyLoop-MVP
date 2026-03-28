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

      {/* ═══ PREMIUM HERO HEADER ═══ */}
      <div style={{
        borderRadius: "1rem",
        padding: "3px",
        background: "linear-gradient(135deg, #8b5cf6, #6d28d9, #8b5cf6)",
        boxShadow: "0 4px 24px rgba(139,92,246,0.2)",
        marginBottom: "1.5rem",
      }}>
        <div style={{
          borderRadius: "calc(1rem - 3px)",
          padding: "1.5rem 2rem",
          background: "var(--bg-card-solid, #fff)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "14px",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.6rem", flexShrink: 0,
                boxShadow: "0 4px 16px rgba(139,92,246,0.3)",
              }}>⚡</div>
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: 0 }}>
                  MegaBot Console
                </h1>
                <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--text-muted)", margin: "0.15rem 0 0 0" }}>
                  4-Engine AI Consensus — OpenAI + Claude + Gemini + Grok in parallel
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{
                padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.58rem", fontWeight: 700,
                background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#8b5cf6",
              }}>
                PREMIUM
              </span>
              <span style={{
                padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.58rem", fontWeight: 700,
                background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.25)", color: "#00bcd4",
              }}>
                4 AI Engines
              </span>
              <span style={{
                padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.58rem", fontWeight: 700,
                background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.25)", color: "#4caf50",
              }}>
                Multi-Agent
              </span>
            </div>
          </div>
          {/* Metrics strip */}
          <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-default)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Items: <strong style={{ color: "#8b5cf6", fontWeight: 800 }}>{serialized.length}</strong>
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Analyzed: <strong style={{ color: "#8b5cf6", fontWeight: 800 }}>{serialized.filter(i => i.hasAnalysis).length}</strong>
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              With Valuation: <strong style={{ color: "#8b5cf6", fontWeight: 800 }}>{serialized.filter(i => i.valuation).length}</strong>
            </span>
          </div>
        </div>
      </div>

      <Suspense><MegaBotClient items={serialized} /></Suspense>
    </div>
  );
}
