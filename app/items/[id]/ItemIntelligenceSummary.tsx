"use client";
import { useState } from "react";
import type { EnrichedItemContext } from "@/lib/addons/enrich-item-context";

interface Props {
  itemId: string;
  status: string;
  aiData: any;
  valuation: any;
  antique: any;
  enriched: EnrichedItemContext | null;
  engagement: { totalViews: number; inquiries: number; buyersFound: number; documentCount: number };
  shippingData: { weight: number | null; isFragile: boolean; preference: string; aiShippingDifficulty: string | null };
  saleMethod: string;
  listingPrice: number | null;
  hasPhotos: boolean;
  photoCount: number;
  isAntique: boolean;
  isCollectible: boolean;
  authenticityScore: number | null;
}

type Section = "market" | "ready" | "sell" | "alerts" | "action";

export default function ItemIntelligenceSummary(props: Props) {
  const { itemId, status, aiData, valuation, enriched, engagement, shippingData, saleMethod, listingPrice, hasPhotos, photoCount, isAntique, isCollectible, authenticityScore } = props;

  // Compute readiness
  const readinessChecks = [
    { ok: photoCount > 0, label: "Photos uploaded", fix: `/items/${itemId}/edit` },
    { ok: photoCount >= 3, label: "3+ photos", fix: `/items/${itemId}/edit` },
    { ok: !!aiData, label: "AI analysis complete", fix: `/items/${itemId}` },
    { ok: !!valuation, label: "Valuation exists", fix: `/items/${itemId}` },
    { ok: !!listingPrice, label: "Listing price set", fix: null },
    { ok: shippingData.weight != null, label: "Shipping info complete", fix: `/items/${itemId}/edit` },
    { ok: saleMethod !== "BOTH", label: "Sale method chosen", fix: null },
    { ok: (enriched?.dataCompleteness ?? 0) > 25, label: "Bot analysis run", fix: null },
    { ok: engagement.documentCount > 0, label: "Documents uploaded", fix: null },
    { ok: !!(aiData?.summary || aiData?.item_name), label: "Description exists", fix: null },
  ];
  const readinessScore = readinessChecks.filter(c => c.ok).length;
  const readinessColor = readinessScore >= 8 ? "#22c55e" : readinessScore >= 5 ? "#f59e0b" : "#ef4444";

  // Compute warnings
  const warnings: { type: "error" | "warning" | "success"; msg: string }[] = [];
  if (photoCount < 3) warnings.push({ type: "warning", msg: "Add more photos — listings with 4+ photos sell 2x faster" });
  if (!listingPrice && (status === "ANALYZED" || status === "READY")) warnings.push({ type: "error", msg: "Set a price before listing" });
  if (enriched?.priceDirection === "falling") warnings.push({ type: "warning", msg: "Market prices are falling — price competitively" });
  if (shippingData.isFragile) warnings.push({ type: "warning", msg: "Fragile item — needs careful packaging" });
  if (enriched?.demandLevel === "Strong" || enriched?.demandLevel === "High") warnings.push({ type: "success", msg: "Strong demand detected — price confidently" });
  if (isAntique) warnings.push({ type: "success", msg: "Antique verified — consider auction or specialty platforms" });
  if (engagement.inquiries > 0) warnings.push({ type: "success", msg: `${engagement.inquiries} buyer inquiries — check your messages` });
  if ((enriched?.totalOffers ?? 0) > 0) warnings.push({ type: "success", msg: `${enriched?.totalOffers} offers received — highest $${Math.round((enriched?.highestOffer ?? 0) / 100)}` });

  // Compute next action
  const getNextAction = () => {
    if (status === "DRAFT" && !hasPhotos) return { icon: "📸", msg: "Upload photos to get started", href: `/items/${itemId}/edit` };
    if (status === "DRAFT" && hasPhotos && !aiData) return { icon: "🧠", msg: "Run AI Analysis — free and takes 30 seconds", href: null };
    if ((status === "ANALYZED" || status === "READY") && !listingPrice) return { icon: "💰", msg: `Set your listing price${valuation ? ` — AI suggests $${Math.round(valuation.low || 0)}–$${Math.round(valuation.high || 0)}` : ""}`, href: null };
    if ((status === "ANALYZED" || status === "READY") && readinessScore < 7) return { icon: "📋", msg: `Complete your listing — ${10 - readinessScore} items still needed`, href: null };
    if ((status === "ANALYZED" || status === "READY") && readinessScore >= 7) return { icon: "📢", msg: "You're ready! Mark as Listed to go live", href: null };
    if (status === "LISTED" && engagement.totalViews === 0) return { icon: "📊", msg: "Boost visibility — run BuyerBot or share your listing", href: `/bots/buyerbot?item=${itemId}` };
    if (status === "LISTED" && engagement.inquiries > 0) return { icon: "💬", msg: "Check your messages — buyers are interested", href: "/messages" };
    if (status === "INTERESTED") return { icon: "🤝", msg: `Review your offers — highest is $${Math.round((enriched?.highestOffer ?? 0) / 100)}`, href: null };
    if (status === "SOLD") return { icon: "📦", msg: "Ship your item within 3 days for best rating", href: null };
    if (status === "SHIPPED") return { icon: "📬", msg: "Your item is on its way — mark complete when delivered", href: null };
    if (status === "COMPLETED") return { icon: "🎉", msg: `All done! Your earnings: $${Math.round((enriched?.soldPrice ?? 0) * 0.9825)}`, href: "/dashboard" };
    return null;
  };
  const nextAction = getNextAction();

  // Overall score (0-100)
  const overallScore = Math.min(100, Math.round(
    (readinessScore * 6) +
    (enriched?.dataCompleteness ?? 0) * 0.2 +
    (engagement.totalViews > 0 ? 10 : 0) +
    ((enriched?.totalOffers ?? 0) > 0 ? 10 : 0)
  ));
  const scoreColor = overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#f59e0b" : "#ef4444";

  const defaultSection: Section = warnings.some(w => w.type === "error") ? "alerts" : "action";
  const [activeSection, setActiveSection] = useState<Section>(defaultSection);

  const sections: { key: Section; icon: string; label: string }[] = [
    { key: "market", icon: "📊", label: "Market" },
    { key: "ready", icon: "✅", label: "Ready" },
    { key: "sell", icon: "🏪", label: "Sell" },
    { key: "alerts", icon: "⚠️", label: "Alerts" },
    { key: "action", icon: "🎯", label: "Action" },
  ];

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "1rem", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>🧠</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Item Intelligence</span>
        </div>
        <div style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 800, color: scoreColor, background: `${scoreColor}15`, border: `1px solid ${scoreColor}30` }}>
          {overallScore}/100
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-default)" }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
            flex: 1, padding: "0.55rem 0.35rem", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.1rem",
            background: activeSection === s.key ? "rgba(0,188,212,0.06)" : "transparent",
            borderBottom: activeSection === s.key ? "2px solid var(--accent)" : "2px solid transparent",
            border: "none", borderTop: "none", borderLeft: "none", borderRight: "none",
            cursor: "pointer", transition: "all 0.15s",
            color: activeSection === s.key ? "var(--accent)" : "var(--text-muted)",
          }}>
            <span style={{ fontSize: "0.85rem" }}>{s.icon}</span>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0.85rem 1rem" }}>
        {/* MARKET POSITION */}
        {activeSection === "market" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
            {valuation && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" as const }}>
                <div>
                  <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>Value Range</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>${Math.round(valuation.low || 0)} — ${Math.round(valuation.high || 0)}</div>
                </div>
                {enriched?.priceDirection && enriched.priceDirection !== "unknown" && (
                  <div style={{ padding: "0.25rem 0.5rem", borderRadius: "0.35rem", background: enriched.priceDirection === "rising" ? "rgba(34,197,94,0.08)" : enriched.priceDirection === "falling" ? "rgba(239,68,68,0.08)" : "var(--ghost-bg)", border: `1px solid ${enriched.priceDirection === "rising" ? "rgba(34,197,94,0.2)" : enriched.priceDirection === "falling" ? "rgba(239,68,68,0.2)" : "var(--border-default)"}` }}>
                    <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, color: "var(--text-muted)", fontWeight: 700 }}>Trend</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: enriched.priceDirection === "rising" ? "#22c55e" : enriched.priceDirection === "falling" ? "#ef4444" : "var(--text-secondary)" }}>{enriched.priceDirection === "rising" ? "↑ Rising" : enriched.priceDirection === "falling" ? "↓ Falling" : "→ Stable"}</div>
                  </div>
                )}
                {enriched?.demandLevel && (
                  <div style={{ padding: "0.25rem 0.5rem", borderRadius: "0.35rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, color: "var(--text-muted)", fontWeight: 700 }}>Demand</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: enriched.demandLevel === "Strong" || enriched.demandLevel === "High" ? "#22c55e" : "#f59e0b" }}>{enriched.demandLevel}</div>
                  </div>
                )}
              </div>
            )}
            {(enriched?.totalOffers ?? 0) > 0 && (
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                📨 {enriched?.totalOffers} offer{(enriched?.totalOffers ?? 0) !== 1 ? "s" : ""} received — highest ${Math.round((enriched?.highestOffer ?? 0) / 100)}{enriched?.offerToAskRatio ? ` (${Math.round(enriched.offerToAskRatio * 100)}% of ask)` : ""}
              </div>
            )}
            {isAntique && <div style={{ fontSize: "0.68rem", color: "#f59e0b", fontWeight: 600 }}>🏺 Antique detected{authenticityScore ? ` — authenticity score: ${authenticityScore}` : ""}</div>}
            {isCollectible && <div style={{ fontSize: "0.68rem", color: "#8b5cf6", fontWeight: 600 }}>⭐ Collectible detected</div>}
          </div>
        )}

        {/* READINESS SCORE */}
        {activeSection === "ready" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: readinessColor }}>{readinessScore}/10</div>
              <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "var(--ghost-bg)", overflow: "hidden" }}>
                <div style={{ width: `${readinessScore * 10}%`, height: "100%", borderRadius: "3px", background: readinessColor, transition: "width 0.3s" }} />
              </div>
            </div>
            {readinessChecks.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0", fontSize: "0.68rem" }}>
                <span style={{ color: c.ok ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{c.ok ? "✅" : "❌"}</span>
                <span style={{ color: c.ok ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: c.ok ? 400 : 600 }}>{c.label}</span>
                {!c.ok && c.fix && <a href={c.fix} style={{ fontSize: "0.58rem", color: "var(--accent)", textDecoration: "none", marginLeft: "auto" }}>Fix →</a>}
              </div>
            ))}
          </div>
        )}

        {/* SELL PATH */}
        {activeSection === "sell" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
            {enriched?.bestPlatform && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)" }}>
                <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, color: "var(--accent)", fontWeight: 700 }}>Best Platform</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)" }}>🏆 {enriched.bestPlatform}</div>
              </div>
            )}
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {valuation?.localHigh && valuation?.onlineHigh ? (
                valuation.onlineHigh > valuation.localHigh * 1.15
                  ? "📦 Ship nationally for best price — online markets pay more for this item."
                  : "🤝 Sell locally for faster sale — local demand is strong in your area."
              ) : "Set your sale method to get platform recommendations."}
            </div>
            {enriched?.targetBuyerProfiles && enriched.targetBuyerProfiles.length > 0 && (
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                🎯 Target buyers: {enriched.targetBuyerProfiles.join(", ")}
              </div>
            )}
          </div>
        )}

        {/* WARNINGS */}
        {activeSection === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.35rem" }}>
            {warnings.length > 0 ? warnings.map((w, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.5rem",
                borderRadius: "0.35rem", fontSize: "0.68rem",
                background: w.type === "error" ? "rgba(239,68,68,0.06)" : w.type === "warning" ? "rgba(245,158,11,0.06)" : "rgba(34,197,94,0.06)",
                color: w.type === "error" ? "#ef4444" : w.type === "warning" ? "#f59e0b" : "#22c55e",
                border: `1px solid ${w.type === "error" ? "rgba(239,68,68,0.15)" : w.type === "warning" ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)"}`,
              }}>
                {w.type === "error" ? "❌" : w.type === "warning" ? "⚠️" : "🟢"} {w.msg}
              </div>
            )) : (
              <div style={{ textAlign: "center" as const, padding: "1rem", fontSize: "0.78rem", color: "#22c55e" }}>
                ✅ No warnings — your item is in great shape
              </div>
            )}
          </div>
        )}

        {/* NEXT ACTION */}
        {activeSection === "action" && nextAction && (
          <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", textAlign: "center" as const }}>
            <div style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>{nextAction.icon}</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>{nextAction.msg}</div>
            {nextAction.href && (
              <a href={nextAction.href} style={{
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 700,
                background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                textDecoration: "none", minHeight: "44px",
              }}>
                Take Action →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
