import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Roadmap & Marketplace Ecosystem · LegacyLoop",
  description: "The complete LegacyLoop roadmap: 18+ marketplace connectors, API platform, and AI bots that work across every platform you sell on.",
  openGraph: {
    title: "LegacyLoop Roadmap — The Operating System for Estate Resale",
    description: "Marketplace connectors for eBay, Facebook, Etsy, Shopify, Amazon, and more. AI bots that work everywhere you sell.",
  },
};

/* ── Marketplace connector data ──────────────────────────────────── */

const MARKETPLACE_GROUPS = [
  {
    label: "Point-of-Sale Systems",
    platforms: [
      { icon: "🏪", name: "Square POS", desc: "Catalog sync, inventory, payments", status: "In Development" },
      { icon: "💳", name: "Stripe", desc: "Product catalog, checkout, subscriptions", status: "In Development" },
      { icon: "🍀", name: "Clover POS", desc: "Menu sync, inventory management", status: "Planned" },
    ],
  },
  {
    label: "Major Marketplaces",
    platforms: [
      { icon: "🛒", name: "eBay", desc: "Listings, auctions, Buy It Now, feedback sync", status: "Coming Soon" },
      { icon: "📘", name: "Facebook Marketplace", desc: "Local listings, Shops, Messenger leads", status: "Coming Soon" },
      { icon: "🎨", name: "Etsy", desc: "Vintage & handmade, SEO optimization", status: "Coming Soon" },
      { icon: "🛍️", name: "Shopify", desc: "Storefront sync, collections, checkout", status: "Coming Soon" },
      { icon: "📦", name: "Amazon", desc: "FBA/FBM listings, pricing, inventory", status: "Coming Soon" },
    ],
  },
  {
    label: "Resale Platforms",
    platforms: [
      { icon: "🏷️", name: "Mercari", desc: "Auto-list, smart pricing, shipping labels", status: "Planned" },
      { icon: "👗", name: "Poshmark", desc: "Closet sync, sharing automation, offers", status: "Planned" },
      { icon: "🤝", name: "OfferUp", desc: "Local listings, TruYou verification", status: "Planned" },
      { icon: "📋", name: "Craigslist", desc: "Auto-post, category mapping, renewals", status: "Planned" },
      { icon: "🏘️", name: "Nextdoor", desc: "Neighborhood listings, local matching", status: "Planned" },
      { icon: "🦌", name: "Uncle Henry's", desc: "Maine-local listings, category sync", status: "Planned" },
    ],
  },
  {
    label: "Specialty & Premium",
    platforms: [
      { icon: "💎", name: "Ruby Lane", desc: "Antique & vintage dealer marketplace", status: "Planned" },
      { icon: "🏛️", name: "1stDibs", desc: "Luxury furniture & fine art listings", status: "Planned" },
      { icon: "🪑", name: "Chairish", desc: "Curated home furnishing marketplace", status: "Planned" },
      { icon: "🔨", name: "LiveAuctioneers", desc: "Online auction house integration", status: "Planned" },
    ],
  },
];

/* ── Bot intelligence data ───────────────────────────────────────── */

const BOT_INTEGRATIONS = [
  { icon: "💰", name: "PriceBot", desc: "Scans competitor pricing across all connected marketplaces in real time. Auto-adjusts your prices to stay competitive on every platform." },
  { icon: "✍️", name: "ListBot", desc: "Generates SEO-optimized listings tailored to each platform's algorithm. eBay titles differ from Etsy titles — ListBot knows the difference." },
  { icon: "🔍", name: "BuyerBot", desc: "Cross-platform buyer matching. Finds interested buyers on eBay, Facebook, Etsy, and more — then routes them to your best listing." },
  { icon: "📡", name: "ReconBot", desc: "Monitors competitor listings and price changes across every connected marketplace. Alerts you to undercut pricing and new opportunities." },
  { icon: "📣", name: "AutoPoster", desc: "One-click publish to all connected platforms simultaneously. Platform-specific formatting, photos, and pricing applied automatically." },
];

/* ── API feature data ────────────────────────────────────────────── */

const API_FEATURES = [
  { icon: "🔌", name: "REST API v1", desc: "Full CRUD for items, listings, bots, and analytics. JSON responses with pagination and filtering." },
  { icon: "📡", name: "Webhook Events", desc: "40+ event types — item.listed, price.changed, buyer.matched, sale.completed, and more." },
  { icon: "📦", name: "Official SDKs", desc: "Type-safe libraries for Python, Node.js, Ruby, and PHP with full documentation and examples." },
  { icon: "🔐", name: "OAuth2 Auth", desc: "Secure marketplace authentication. Connect once, sync forever. Token refresh handled automatically." },
];

/* ── Phase roadmap data ──────────────────────────────────────────── */

const PHASES = [
  {
    label: "Phase 1 — Launching Now",
    borderColor: "#00bcd4",
    features: [
      { icon: "🏪", title: "POS / Catalog Sync", desc: "Sync inventory directly to Square, Stripe, and other POS systems. Categories, pricing, and photos transfer automatically.", status: "In Development" },
      { icon: "🔌", title: "Marketplace Connector SDK", desc: "The foundational API layer powering all marketplace integrations. REST endpoints, webhook delivery, and OAuth2 flows.", status: "In Development" },
      { icon: "📣", title: "Auto-Post to Platforms", desc: "One-click cross-posting to Facebook Marketplace, eBay, Craigslist, OfferUp, and 9 more platforms.", status: "In Development" },
      { icon: "🚚", title: "Advanced Shipping TMS", desc: "Full transportation management with LTL freight, white-glove delivery, and real-time tracking across all carriers.", status: "Beta" },
      { icon: "🤖", title: "Cross-Platform Bot Intelligence", desc: "PriceBot, ListBot, BuyerBot, and ReconBot extend to every connected marketplace — not just LegacyLoop.", status: "In Development" },
    ],
  },
  {
    label: "Phase 2 — Next Up",
    borderColor: "#94a3b8",
    features: [
      { icon: "📖", title: "StoryBot", desc: "Generate legacy stories, audio narrations, and video memories about your family's belongings using AI.", status: "Planned" },
      { icon: "🛡️", title: "InsuranceBot", desc: "Certified AI appraisal reports for insurance documentation, estate planning, and claims.", status: "Planned" },
      { icon: "🤝", title: "DonationBot", desc: "Find charities, schedule pickups, and generate tax receipts for donated items.", status: "Planned" },
      { icon: "🔧", title: "Contractor Network", desc: "Connect with local movers, cleaners, and estate sale professionals in your area.", status: "Planned" },
      { icon: "📊", title: "Analytics Dashboard API", desc: "Cross-platform sales analytics, conversion rates, and buyer demographics available via API.", status: "Planned" },
    ],
  },
  {
    label: "Phase 3 — Future Vision",
    borderColor: "#475569",
    features: [
      { icon: "🤖", title: "Full AI Support Workforce", desc: "AI-powered agents handle buyer inquiries, scheduling, and negotiations 24/7 across every platform.", status: "Exploring" },
      { icon: "📱", title: "Employee Operations Apps", desc: "Field tools for estate sale teams — check-in, inventory, cashiering, and real-time reporting.", status: "Exploring" },
      { icon: "🔄", title: "Bidirectional POS Sync", desc: "Full two-way sync with Square/Stripe catalogs — real-time inventory, pricing, and sales data.", status: "Exploring" },
      { icon: "🌍", title: "National Marketplace", desc: "Browse and buy estate sale items from anywhere in the country with AI-verified listings.", status: "Exploring" },
      { icon: "🏢", title: "Enterprise & Franchise API", desc: "Multi-location estate sale companies manage everything through our API. White-label storefronts.", status: "Exploring" },
    ],
  },
];

/* ── Status badge styles ─────────────────────────────────────────── */

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  "In Development": { bg: "rgba(0,188,212,0.1)", color: "#00bcd4", border: "rgba(0,188,212,0.25)", dot: "#00bcd4" },
  "Beta": { bg: "rgba(34,197,94,0.1)", color: "#22c55e", border: "rgba(34,197,94,0.25)", dot: "#22c55e" },
  "Coming Soon": { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "rgba(251,191,36,0.25)", dot: "#fbbf24" },
  "Planned": { bg: "rgba(148,163,184,0.08)", color: "#94a3b8", border: "rgba(148,163,184,0.2)", dot: "#94a3b8" },
  "Exploring": { bg: "rgba(148,163,184,0.05)", color: "#64748b", border: "rgba(148,163,184,0.15)", dot: "#64748b" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["Planned"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem",
      borderRadius: "9999px", whiteSpace: "nowrap",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.dot }} />
      {status}
    </span>
  );
}

/* ── Page Component ──────────────────────────────────────────────── */

export default function ComingSoonPage() {
  const totalPlatforms = MARKETPLACE_GROUPS.reduce((sum, g) => sum + g.platforms.length, 0);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
      <style>{`
        .roadmap-platform-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        .roadmap-api-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .roadmap-stats-row {
          display: flex;
          justify-content: center;
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .roadmap-platform-grid { grid-template-columns: repeat(2, 1fr); }
          .roadmap-api-grid { grid-template-columns: 1fr; }
          .roadmap-stats-row { gap: 1rem; }
        }
        @media (max-width: 480px) {
          .roadmap-platform-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Roadmap" }]} />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "3rem", marginTop: "0.5rem" }}>
        <div style={{
          display: "inline-block", fontSize: "0.65rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.15em",
          padding: "0.25rem 0.75rem", borderRadius: "9999px",
          background: "rgba(0,188,212,0.1)", color: "#00bcd4",
          border: "1px solid rgba(0,188,212,0.25)", marginBottom: "1rem",
        }}>
          Platform Roadmap
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.15, marginBottom: "0.75rem" }}>
          The Operating System{" "}
          <span style={{ color: "#00bcd4" }}>for Estate Resale</span>
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: "640px", margin: "0 auto" }}>
          LegacyLoop isn&apos;t just a platform — it&apos;s the engine that connects your inventory to every marketplace, every buyer, everywhere.
          Our AI bots don&apos;t just work here. They work on <strong style={{ color: "var(--text-primary)" }}>every platform you sell on</strong>.
        </p>

        {/* Stats row */}
        <div className="roadmap-stats-row" style={{ marginTop: "2rem" }}>
          {[
            { value: `${totalPlatforms}+`, label: "Marketplace Connectors" },
            { value: "15", label: "AI Bots" },
            { value: "API-First", label: "Developer Platform" },
          ].map((s) => (
            <div key={s.label} style={{
              padding: "1rem 1.75rem", borderRadius: "1rem",
              background: "var(--bg-card)", border: "1px solid var(--border-default)",
              minWidth: "140px",
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#00bcd4" }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section: Marketplace Ecosystem ────────────────────── */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Marketplace Connector Ecosystem
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.55 }}>
            List once on LegacyLoop. Publish everywhere. Every connector syncs your inventory, pricing, photos, and buyer inquiries automatically.
          </p>
        </div>

        {MARKETPLACE_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: "1.5rem" }}>
            <div style={{
              fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "var(--text-muted)",
              marginBottom: "0.65rem", paddingBottom: "0.35rem",
              borderBottom: "1px solid var(--border-default)",
            }}>
              {group.label}
            </div>
            <div className="roadmap-platform-grid">
              {group.platforms.map((p) => (
                <div key={p.name} style={{
                  padding: "0.85rem 1rem", borderRadius: "0.75rem",
                  background: "var(--bg-card)", border: "1px solid var(--border-default)",
                  transition: "border-color 0.15s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>{p.icon}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{p.name}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "0.4rem" }}>{p.desc}</div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Section: Bot Intelligence ─────────────────────────── */}
      <div style={{
        marginBottom: "3rem", padding: "2rem",
        borderRadius: "1.25rem",
        background: "linear-gradient(135deg, rgba(0,188,212,0.04), rgba(0,188,212,0.01))",
        border: "1px solid rgba(0,188,212,0.15)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            AI Bots That Work on Every Platform
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.55 }}>
            Your LegacyLoop bots don&apos;t just work here — they extend into every connected marketplace. One intelligence engine powering all your sales channels.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {BOT_INTEGRATIONS.map((bot) => (
            <div key={bot.name} style={{
              display: "flex", gap: "0.85rem", alignItems: "flex-start",
              padding: "1rem 1.15rem", borderRadius: "0.85rem",
              background: "var(--bg-card)", border: "1px solid var(--border-default)",
              borderLeft: "3px solid #00bcd4",
            }}>
              <span style={{ fontSize: "1.35rem", flexShrink: 0 }}>{bot.icon}</span>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{bot.name}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{bot.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section: Developer API ────────────────────────────── */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Developer API Platform
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.55 }}>
            Build on top of LegacyLoop. Our API-first architecture means every feature is accessible programmatically — from item analysis to bot deployment.
          </p>
        </div>

        <div className="roadmap-api-grid">
          {API_FEATURES.map((f) => (
            <div key={f.name} style={{
              padding: "1.25rem", borderRadius: "1rem",
              background: "var(--bg-card)", border: "1px solid var(--border-default)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>{f.icon}</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{f.name}</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* API code preview */}
        <div style={{
          marginTop: "1rem", padding: "1.25rem",
          borderRadius: "0.75rem",
          background: "#0d1117", border: "1px solid rgba(148,163,184,0.15)",
          fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: "0.72rem", lineHeight: 1.65, color: "#e6edf3",
          overflow: "auto",
        }}>
          <div style={{ color: "#7ee787" }}>// List an item across all connected marketplaces</div>
          <div><span style={{ color: "#ff7b72" }}>const</span> response = <span style={{ color: "#ff7b72" }}>await</span> legacyloop.items.<span style={{ color: "#d2a8ff" }}>crossPost</span>({"{"}
          </div>
          <div style={{ paddingLeft: "1.25rem" }}>
            <span style={{ color: "#79c0ff" }}>itemId</span>: <span style={{ color: "#a5d6ff" }}>&quot;item_abc123&quot;</span>,
          </div>
          <div style={{ paddingLeft: "1.25rem" }}>
            <span style={{ color: "#79c0ff" }}>platforms</span>: [<span style={{ color: "#a5d6ff" }}>&quot;ebay&quot;</span>, <span style={{ color: "#a5d6ff" }}>&quot;etsy&quot;</span>, <span style={{ color: "#a5d6ff" }}>&quot;facebook&quot;</span>, <span style={{ color: "#a5d6ff" }}>&quot;shopify&quot;</span>],
          </div>
          <div style={{ paddingLeft: "1.25rem" }}>
            <span style={{ color: "#79c0ff" }}>enableBots</span>: <span style={{ color: "#ff7b72" }}>true</span>,  <span style={{ color: "#7ee787" }}>// PriceBot + ListBot auto-optimize per platform</span>
          </div>
          <div>{"}"});</div>
          <div style={{ color: "#7ee787", marginTop: "0.35rem" }}>// =&gt; {"{"} success: true, listings: 4, platforms: [&quot;ebay&quot;, &quot;etsy&quot;, &quot;facebook&quot;, &quot;shopify&quot;] {"}"}</div>
        </div>
      </div>

      {/* ── Section: Phase Roadmap ────────────────────────────── */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Development Roadmap
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.55 }}>
            Every feature below is actively being designed, built, or tested. We ship updates daily.
          </p>
        </div>

        {PHASES.map((phase) => (
          <div key={phase.label} style={{ marginBottom: "1.75rem" }}>
            <h3 style={{
              fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: "0.75rem",
            }}>
              {phase.label}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {phase.features.map((f) => (
                <div key={f.title} style={{
                  padding: "1.15rem 1.25rem", borderRadius: "1rem",
                  background: "var(--bg-card)", border: "1px solid var(--border-default)",
                  borderLeft: `3px solid ${phase.borderColor}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.15rem" }}>{f.icon}</span>
                      <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" }}>{f.title}</span>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── How It Works ──────────────────────────────────────── */}
      <div style={{
        marginBottom: "3rem", padding: "2rem",
        borderRadius: "1.25rem",
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
      }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", textAlign: "center", marginBottom: "1.5rem" }}>
          How the Ecosystem Works
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {[
            { step: "1", title: "Upload Once", desc: "Add your item to LegacyLoop. Our AI bots analyze, price, and optimize your listing automatically." },
            { step: "2", title: "Connect Your Platforms", desc: "Link your eBay, Facebook, Etsy, Shopify, Amazon, and POS accounts through our secure OAuth2 integration." },
            { step: "3", title: "Publish Everywhere", desc: "One click sends your listing to every connected marketplace. ListBot tailors each listing to the platform's format and algorithm." },
            { step: "4", title: "Bots Work 24/7", desc: "PriceBot monitors competitors. BuyerBot finds interested buyers. ReconBot alerts you to opportunities. All across every platform." },
            { step: "5", title: "Sell Faster", desc: "Orders, offers, and inquiries from all platforms funnel into your LegacyLoop dashboard. One place to manage everything." },
          ].map((s) => (
            <div key={s.step} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "rgba(0,188,212,0.12)", border: "1px solid rgba(0,188,212,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.78rem", fontWeight: 800, color: "#00bcd4", flexShrink: 0,
              }}>
                {s.step}
              </div>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{s.title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <div style={{
        textAlign: "center", padding: "2.5rem 1.5rem", borderRadius: "1.25rem",
        background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(0,188,212,0.02))",
        border: "1px solid rgba(0,188,212,0.2)",
      }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Get Early Access to the Ecosystem
        </h3>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.55, maxWidth: "480px", margin: "0 auto 1.5rem auto" }}>
          Founding members get first access to every new marketplace connector, bot upgrade, and API feature — plus priority support and lifetime pricing.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/pricing" style={{
            display: "inline-block", padding: "0.7rem 1.75rem",
            background: "#00bcd4", color: "#fff", borderRadius: "0.75rem",
            fontSize: "0.88rem", fontWeight: 700, textDecoration: "none",
          }}>
            Become a Founding Member
          </Link>
          <Link href="/api-access" style={{
            display: "inline-block", padding: "0.7rem 1.75rem",
            background: "transparent", color: "#00bcd4",
            borderRadius: "0.75rem", border: "1px solid rgba(0,188,212,0.35)",
            fontSize: "0.88rem", fontWeight: 700, textDecoration: "none",
          }}>
            API Documentation
          </Link>
        </div>
      </div>

      {/* ── Footer note ───────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
        <p>LegacyLoop is updated daily. Features may ship in a different order based on demand.</p>
        <p style={{ marginTop: "0.25rem" }}>
          Have a marketplace you want connected?{" "}
          <a href="mailto:partnerships@legacy-loop.com" style={{ color: "#00bcd4", textDecoration: "none" }}>partnerships@legacy-loop.com</a>
        </p>
      </div>
    </div>
  );
}
