import { redirect } from "next/navigation";
import Link from "next/link";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata = { title: "Bot Hub — LegacyLoop" };

const BOTS = [
  {
    id: "megabot",
    name: "MegaBot",
    icon: "🤖",
    desc: "Multi-agent power-up — enhance any bot with OpenAI, Claude, Gemini, and Grok in parallel",
    detail: "Not a standalone bot. Activate MegaBot from any specialist bot below to get 4 independent AI perspectives merged into a Master Summary.",
    color: "#00bcd4",
    route: "/bots/megabot",
    badge: "Power-Up",
  },
  {
    id: "analyzebot",
    name: "AnalyzeBot",
    icon: "🧠",
    desc: "Comprehensive item analysis — identification, condition, pricing, and listing suggestions",
    detail: "The core analysis specialist. Identifies items, assesses condition, estimates pricing, suggests listings, and scores photo quality.",
    color: "#00bcd4",
    route: "/bots/analyzebot",
  },
  {
    id: "pricebot",
    name: "PriceBot",
    icon: "💰",
    desc: "Deep pricing intelligence — market analysis, adjustments, and earnings projections",
    detail: "Local vs national vs best market pricing with condition adjustments, location multipliers, and dual earnings breakdown.",
    color: "#4caf50",
    route: "/bots/pricebot",
  },
  {
    id: "listbot",
    name: "ListBot",
    icon: "📝",
    desc: "Listing optimization — AI-generated titles, descriptions, keywords, and auto-distribution",
    detail: "Generates marketplace-ready titles, engaging descriptions, SEO keywords, platform recommendations, and cross-platform auto-posting.",
    color: "#ff9800",
    route: "/bots/listbot",
  },
  {
    id: "buyerbot",
    name: "BuyerBot",
    icon: "🎯",
    desc: "Aggressive buyer search — finds targeted buyers across all networks and platforms",
    detail: "Scans marketplaces, social media, and forums for active buyers matching your item. Lead scoring, outreach templates, and activity tracking.",
    color: "#e91e63",
    route: "/bots/buyerbot",
    badge: "New",
  },
  {
    id: "shipbot",
    name: "Shipping Center",
    icon: "📦",
    desc: "Shipping intelligence — carrier comparisons, AI-suggested packaging, and LTL freight detection",
    detail: "AI-suggested box sizes, weight estimates, USPS/UPS/FedEx rate comparison, packaging tips, and LTL freight detection.",
    color: "#9c27b0",
    route: "/bots/shipbot",
  },
  {
    id: "stylebot",
    name: "PhotoBot",
    icon: "📷",
    desc: "Visual presentation — photo quality, lighting, staging tips to attract more buyers",
    detail: "AI-scored photo quality, lighting analysis, staging tips, before/after improvements, and platform-specific advice.",
    color: "#f06292",
    route: "/bots/stylebot",
  },
  {
    id: "carbot",
    name: "CarBot",
    icon: "🚗",
    desc: "Vehicle-specific analysis — auto-detects cars, trucks, and more with specialized pricing",
    detail: "Specialized vehicle identification, VIN collection, resale route recommendations, and vehicle-specific pricing.",
    color: "#2196f3",
    route: "/bots/carbot",
    badge: "Auto-Detects Vehicles",
  },
  {
    id: "antiquebot",
    name: "AntiqueBot",
    icon: "🏺",
    desc: "Antique specialist — authentication, provenance, history, collector market, and selling strategy",
    detail: "Deep-dive antique appraisal with authentication verdict, historical context, auction estimates, collector organizations, and expert selling strategy.",
    color: "#d97706",
    route: "/bots/antiquebot",
    badge: "Auto-Detects Antiques",
  },
];

export default async function BotsPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const analyzedCount = await prisma.aiResult.count({
    where: { item: { userId: user.id } },
  }).catch(() => 0);

  const totalItems = await prisma.item.count({
    where: { userId: user.id },
  }).catch(() => 0);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <style>{`
        .bot-hub-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,188,212,0.12);
          border-color: rgba(0,188,212,0.3) !important;
        }
      `}</style>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bot Hub" }]} />
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div className="section-title">Intelligence Center</div>
        <h1 className="h1" style={{ marginTop: "0.5rem" }}>Bot Hub</h1>
        <p className="muted" style={{ marginTop: "0.5rem", maxWidth: "600px" }}>
          8 specialist bots + MegaBot power-up work together to analyze, price, list, find buyers, and ship your items.
          {analyzedCount > 0 && ` ${analyzedCount} of ${totalItems} items analyzed.`}
        </p>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Items", value: totalItems },
          { label: "Analyzed", value: analyzedCount },
          { label: "Active Modules", value: analyzedCount > 0 ? 8 : 0 },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-card, var(--ghost-bg))",
              border: "1px solid var(--border-card, var(--border-default))",
              borderRadius: "1rem",
              padding: "1.25rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent, #00bcd4)" }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #a8a29e)", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bot grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "1.25rem" }}>
        {BOTS.map((bot, i) => (
          <Link
            key={bot.id}
            href={bot.route}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
              background: "var(--bg-card, var(--ghost-bg))",
              border: "1px solid var(--border-card, var(--border-default))",
              borderRadius: "1.25rem",
              padding: "2rem",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              animation: `fadeSlideUp 0.4s ease ${i * 0.08}s both`,
            }}
            className="bot-hub-card"
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "1rem",
                  background: `${bot.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem",
                  flexShrink: 0,
                }}
              >
                {bot.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary, #e7e5e4)" }}>{bot.name}</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      padding: "0.15rem 0.55rem",
                      borderRadius: "9999px",
                      background: analyzedCount > 0 ? `${bot.color}22` : "var(--ghost-bg)",
                      color: analyzedCount > 0 ? bot.color : "var(--text-muted)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: analyzedCount > 0 ? bot.color : "var(--text-muted)" }} />
                    {analyzedCount > 0 ? "Active" : "Demo"}
                  </span>
                  {(bot as any).badge && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "0.1rem 0.45rem", borderRadius: "9999px", background: `${bot.color}22`, color: bot.color }}>
                      {(bot as any).badge}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #d6d3d1)", marginTop: "0.5rem", lineHeight: 1.5 }}>
                  {bot.desc}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted, #a8a29e)", marginTop: "0.5rem", lineHeight: 1.4 }}>
                  {bot.detail}
                </p>
              </div>
            </div>
            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border-default)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: bot.color, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                View Dashboard
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke={bot.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
