import { redirect } from "next/navigation";
import Link from "next/link";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata = { title: "Bot Hub \u2014 LegacyLoop" };

// ── Bot definitions ──────────────────────────────────────────────────────────

interface BotDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  detail: string;
  color: string;
  route: string;
  badge?: string;
}

const BOTS: BotDef[] = [
  {
    id: "megabot",
    name: "MegaBot",
    icon: "\u{1F916}",
    desc: "Multi-agent power-up \u2014 enhance any bot with OpenAI, Claude, Gemini, and Grok in parallel",
    detail: "Not a standalone bot. Activate MegaBot from any specialist bot below to get 4 independent AI perspectives merged into a Master Summary.",
    color: "#00bcd4",
    route: "/bots/megabot",
    badge: "Power-Up",
  },
  {
    id: "analyzebot",
    name: "AnalyzeBot",
    icon: "\u{1F9E0}",
    desc: "Comprehensive item analysis \u2014 identification, condition, pricing, and listing suggestions",
    detail: "The core analysis specialist. Identifies items, assesses condition, estimates pricing, suggests listings, and scores photo quality.",
    color: "#00bcd4",
    route: "/bots/analyzebot",
  },
  {
    id: "pricebot",
    name: "PriceBot",
    icon: "\u{1F4B0}",
    desc: "Deep pricing intelligence \u2014 market analysis, adjustments, and earnings projections",
    detail: "Local vs national vs best market pricing with condition adjustments, location multipliers, and dual earnings breakdown.",
    color: "#4caf50",
    route: "/bots/pricebot",
  },
  {
    id: "listbot",
    name: "ListBot",
    icon: "\u{1F4DD}",
    desc: "Listing optimization \u2014 AI-generated titles, descriptions, keywords, and auto-distribution",
    detail: "Generates marketplace-ready titles, engaging descriptions, SEO keywords, platform recommendations, and cross-platform auto-posting.",
    color: "#ff9800",
    route: "/bots/listbot",
  },
  {
    id: "buyerbot",
    name: "BuyerBot",
    icon: "\u{1F3AF}",
    desc: "Aggressive buyer search \u2014 finds targeted buyers across all networks and platforms",
    detail: "Scans marketplaces, social media, and forums for active buyers matching your item. Lead scoring, outreach templates, and activity tracking.",
    color: "#e91e63",
    route: "/bots/buyerbot",
  },
  {
    id: "shipbot",
    name: "ShipBot",
    icon: "\u{1F4E6}",
    desc: "Per-item shipping analysis \u2014 carrier comparisons, AI-suggested packaging, and LTL freight detection",
    detail: "AI-suggested box sizes, weight estimates, USPS/UPS/FedEx rate comparison, packaging tips, and LTL freight detection.",
    color: "#9c27b0",
    route: "/bots/shipbot",
  },
  {
    id: "stylebot",
    name: "PhotoBot",
    icon: "\u{1F4F7}",
    desc: "Visual presentation \u2014 photo quality, lighting, staging tips to attract more buyers",
    detail: "AI-scored photo quality, lighting analysis, staging tips, before/after improvements, and platform-specific advice.",
    color: "#f06292",
    route: "/bots/photobot",
  },
  {
    id: "carbot",
    name: "CarBot",
    icon: "\u{1F697}",
    desc: "Vehicle-specific analysis \u2014 auto-detects cars, trucks, and more with specialized pricing",
    detail: "Specialized vehicle identification, VIN collection, resale route recommendations, and vehicle-specific pricing.",
    color: "#2196f3",
    route: "/bots/carbot",
    badge: "Auto-Detects Vehicles",
  },
  {
    id: "antiquebot",
    name: "AntiqueBot",
    icon: "\u{1F3FA}",
    desc: "Antique specialist \u2014 authentication, provenance, history, collector market, and selling strategy",
    detail: "Deep-dive antique appraisal with authentication verdict, historical context, auction estimates, collector organizations, and expert selling strategy.",
    color: "#d97706",
    route: "/bots/antiquebot",
    badge: "Auto-Detects Antiques",
  },
  {
    id: "collectiblesbot",
    name: "CollectiblesBot",
    icon: "\u{1F3C6}",
    desc: "Collectible specialist \u2014 detection, scoring, market value, and collector community connections",
    detail: "Identifies collectibles across 20+ categories, scores rarity and condition, estimates collector market value, and connects to buyer communities.",
    color: "#8b5cf6",
    route: "/bots/collectiblesbot",
    badge: "Auto-Detects Collectibles",
  },
  {
    id: "reconbot",
    name: "ReconBot",
    icon: "\u{1F50D}",
    desc: "Market intelligence \u2014 real-time competitor tracking, price alerts, and market shift detection",
    detail: "Scans competing listings across platforms, tracks price movements, detects market shifts, and sends alerts when action is needed.",
    color: "#06b6d4",
    route: "/bots/reconbot",
    badge: "Real-Time Intel",
  },
  {
    id: "videobot",
    name: "VideoBot",
    icon: "\uD83C\uDFAC",
    desc: "AI video ads — TikTok, Reels, Shorts, Facebook — from your item photos",
    detail: "Generate professional 15-60 second video ads with AI narration, trending music, and platform-optimized formatting.",
    color: "#ef4444",
    route: "/bots/videobot",
    badge: "NEW",
  },
];

const COMING_SOON_BOTS = [
  {
    id: "storybot",
    name: "StoryBot",
    icon: "\u{1F4D6}",
    desc: "Legacy storytelling \u2014 generate text, audio, and video stories about your items and family history",
    detail: "AI-generated item stories, family narratives, audio recordings, and video montages. Preserve memories alongside sales.",
    color: "#a855f7",
  },
  {
    id: "insurancebot",
    name: "InsuranceBot",
    icon: "\u{1F6E1}\u{FE0F}",
    desc: "Insurance valuations \u2014 certified appraisal reports for insurance documentation and claims",
    detail: "Generate insurance-grade valuation reports with replacement cost estimates, condition documentation, and photo evidence packages.",
    color: "#14b8a6",
  },
  {
    id: "donationbot",
    name: "DonationBot",
    icon: "\u{1F49D}",
    desc: "Donation routing \u2014 find charities, schedule pickups, and generate tax receipts automatically",
    detail: "Match unsold items with local charities, coordinate pickup schedules, estimate fair market value for tax deductions, and generate IRS-ready donation receipts.",
    color: "#f43f5e",
  },
];

// ── Bot groupings ────────────────────────────────────────────────────────────

const SPECIALIST_IDS = ["analyzebot", "pricebot", "listbot", "buyerbot", "shipbot", "stylebot"];
const INTEL_IDS = ["carbot", "antiquebot", "collectiblesbot", "reconbot"];

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BotsPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const analyzedCount = await prisma.aiResult.count({
    where: { item: { userId: user.id } },
  }).catch(() => 0);

  const totalItems = await prisma.item.count({
    where: { userId: user.id },
  }).catch(() => 0);

  const megabot = BOTS[0];
  const specialists = BOTS.filter((b) => SPECIALIST_IDS.includes(b.id));
  const intel = BOTS.filter((b) => INTEL_IDS.includes(b.id));

  let animIdx = 0;

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
        <p className="muted" style={{ marginTop: "0.5rem", maxWidth: "640px" }}>
          {BOTS.length - 1} specialist bots + MegaBot power-up + {COMING_SOON_BOTS.length} coming soon {"\u2014"} your complete AI selling team.
          {analyzedCount > 0 && ` ${analyzedCount} of ${totalItems} items analyzed.`}
        </p>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {[
          { label: "Items", value: totalItems },
          { label: "Analyzed", value: analyzedCount },
          { label: "Active Bots", value: analyzedCount > 0 ? BOTS.length : 0 },
          { label: "Coming Soon", value: COMING_SOON_BOTS.length },
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
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #a8a29e)", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Power-Up: MegaBot Hero ── */}
      <div style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted, #a8a29e)",
        marginBottom: "0.75rem",
      }}>
        {"\u{1F916}"} Power-Up
      </div>

      <Link
        href={megabot.route}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          background: "var(--bg-card, var(--ghost-bg))",
          border: "1px solid var(--accent-border, rgba(0,188,212,0.3))",
          borderRadius: "1.25rem",
          padding: "2rem",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          animation: `fadeSlideUp 0.4s ease 0s both`,
          marginBottom: "2.5rem",
          boxShadow: "0 0 24px rgba(0,188,212,0.06)",
        }}
        className="bot-hub-card"
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "1rem",
              background: `${megabot.color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              flexShrink: 0,
            }}
          >
            {megabot.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary, #e7e5e4)" }}>{megabot.name}</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px",
                  background: "rgba(0,188,212,0.15)",
                  color: "#00bcd4",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(0,188,212,0.25)",
                }}
              >
                {"\u26A1"} {megabot.badge}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  padding: "0.15rem 0.55rem",
                  borderRadius: "9999px",
                  background: analyzedCount > 0 ? `${megabot.color}22` : "var(--ghost-bg)",
                  color: analyzedCount > 0 ? megabot.color : "var(--text-muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: analyzedCount > 0 ? megabot.color : "var(--text-muted)" }} />
                {analyzedCount > 0 ? "Active" : "Demo"}
              </span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary, #d6d3d1)", marginTop: "0.5rem", lineHeight: 1.6 }}>
              {megabot.desc}
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #a8a29e)", marginTop: "0.35rem", lineHeight: 1.4 }}>
              {megabot.detail}
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
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: megabot.color, display: "flex", alignItems: "center", gap: "0.35rem" }}>
            View Dashboard
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke={megabot.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </Link>

      {/* ── Specialist Bots ── */}
      <div style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted, #a8a29e)",
        marginBottom: "0.75rem",
      }}>
        {"\u{1F9E0}"} Specialist Bots
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {specialists.map((bot) => {
          const idx = ++animIdx;
          return (
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
                animation: `fadeSlideUp 0.4s ease ${idx * 0.06}s both`,
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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
                    {bot.badge && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "0.1rem 0.45rem", borderRadius: "9999px", background: `${bot.color}22`, color: bot.color }}>
                        {bot.badge}
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
          );
        })}
      </div>

      {/* ── Detection + Intelligence ── */}
      <div style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted, #a8a29e)",
        marginBottom: "0.75rem",
      }}>
        {"\u{1F52C}"} Detection + Intelligence
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {intel.map((bot) => {
          const idx = ++animIdx;
          return (
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
                animation: `fadeSlideUp 0.4s ease ${idx * 0.06}s both`,
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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
                    {bot.badge && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "0.1rem 0.45rem", borderRadius: "9999px", background: `${bot.color}22`, color: bot.color }}>
                        {bot.badge}
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
          );
        })}
      </div>

      {/* ── Coming Soon ── */}
      <div style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-muted, #a8a29e)",
        marginBottom: "0.75rem",
      }}>
        {"\u{1F680}"} Coming Soon
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
        {COMING_SOON_BOTS.map((bot) => {
          const idx = ++animIdx;
          return (
            <div
              key={bot.id}
              style={{
                display: "block",
                background: "var(--bg-card, var(--ghost-bg))",
                border: "1px solid var(--border-card, var(--border-default))",
                borderRadius: "1.25rem",
                padding: "2rem",
                opacity: 0.6,
                cursor: "default",
                animation: `fadeSlideUp 0.4s ease ${idx * 0.06}s both`,
              }}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary, #e7e5e4)" }}>{bot.name}</span>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.55rem",
                        borderRadius: "9999px",
                        background: "var(--ghost-bg)",
                        color: "var(--text-muted)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Coming Soon
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #d6d3d1)", marginTop: "0.5rem", lineHeight: 1.5 }}>
                    {bot.desc}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted, #a8a29e)", marginTop: "0.5rem", lineHeight: 1.4 }}>
                    {bot.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
