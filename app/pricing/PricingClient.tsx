"use client";

import { useState } from "react";
import Link from "next/link";
import { DISCOUNTS } from "@/lib/pricing/constants";
import { PROCESSING_FEE, PLANS, TIER_LIMITS, TIER } from "@/lib/constants/pricing";
import TestimonialGrid from "@/app/components/TestimonialGrid";

// ─── Digital tiers ─────────────────────────────────────────────────────────
// Source of truth: lib/constants/pricing.ts (PLANS + TIER_LIMITS)
// 4 canonical tiers only — no phantom tiers

const DIGITAL_TIERS = [
  {
    id: "free",
    name: PLANS.FREE.name,
    badge: "Free Forever",
    badgeBg: "#f0fdf4",
    badgeColor: "#16a34a",
    color: "#16a34a",
    border: "#bbf7d0",
    bg: "#f0fdf4",
    monthly: PLANS.FREE.preLaunchPrice,
    annual: 0,
    regularMonthly: PLANS.FREE.monthlyPrice,
    regularAnnual: 0,
    commission: PLANS.FREE.commission * 100,
    ctaLabel: "Start Free",
    ctaVariant: "outline" as const,
    trial: null,
    features: [
      { text: `${TIER_LIMITS[TIER.FREE].maxActiveItems} items max`, enabled: true },
      { text: "Basic AI identification", enabled: true },
      { text: `${TIER_LIMITS[TIER.FREE].maxPhotosPerItem} photos per item`, enabled: true },
      { text: "Public store listing", enabled: true },
      { text: "Email support", enabled: true },
      { text: "Analytics dashboard", enabled: false },
      { text: "Buyer Finder", enabled: false },
      { text: "MegaBot (multi-AI consensus)", enabled: false },
      { text: "Remove LegacyLoop branding", enabled: false },
    ],
    limits: { items: TIER_LIMITS[TIER.FREE].maxActiveItems, photos: TIER_LIMITS[TIER.FREE].maxPhotosPerItem },
  },
  {
    id: "starter",
    name: PLANS.DIY_SELLER.name,
    badge: "Most Popular",
    badgeBg: "#0f766e",
    badgeColor: "#fff",
    color: "#0f766e",
    border: "#99f6e4",
    bg: "#f0fdfa",
    monthly: PLANS.DIY_SELLER.preLaunchPrice,
    annual: Math.round(PLANS.DIY_SELLER.preLaunchAnnual / 12),
    regularMonthly: PLANS.DIY_SELLER.monthlyPrice,
    regularAnnual: Math.round(PLANS.DIY_SELLER.annualPrice / 12),
    commission: PLANS.DIY_SELLER.commission * 100,
    ctaLabel: "Try Free for 7 Days",
    ctaVariant: "primary" as const,
    trial: "7-day free trial",
    features: [
      { text: `${TIER_LIMITS[TIER.DIY_SELLER].maxActiveItems} items`, enabled: true },
      { text: "Full AI pricing & listings", enabled: true },
      { text: `${TIER_LIMITS[TIER.DIY_SELLER].maxPhotosPerItem} photos per item`, enabled: true },
      { text: "BuyerBot matching", enabled: true },
      { text: "Remove LegacyLoop branding", enabled: true },
      { text: "Priority email support", enabled: true },
      { text: "MegaBot (credit-based)", enabled: true },
      { text: "Specialty bots (ReconBot, AntiqueBot)", enabled: false },
      { text: "Advanced analytics", enabled: false },
    ],
    limits: { items: TIER_LIMITS[TIER.DIY_SELLER].maxActiveItems, photos: TIER_LIMITS[TIER.DIY_SELLER].maxPhotosPerItem },
  },
  {
    id: "plus",
    name: PLANS.POWER_SELLER.name,
    badge: null,
    badgeBg: "",
    badgeColor: "",
    color: "#7c3aed",
    border: "#c4b5fd",
    bg: "#faf5ff",
    monthly: PLANS.POWER_SELLER.preLaunchPrice,
    annual: Math.round(PLANS.POWER_SELLER.preLaunchAnnual / 12),
    regularMonthly: PLANS.POWER_SELLER.monthlyPrice,
    regularAnnual: Math.round(PLANS.POWER_SELLER.annualPrice / 12),
    commission: PLANS.POWER_SELLER.commission * 100,
    ctaLabel: "Try Free for 7 Days",
    ctaVariant: "primary" as const,
    trial: "7-day free trial",
    features: [
      { text: `${TIER_LIMITS[TIER.POWER_SELLER].maxActiveItems} items`, enabled: true },
      { text: `${TIER_LIMITS[TIER.POWER_SELLER].maxPhotosPerItem} photos per item`, enabled: true },
      { text: "Full analytics dashboard", enabled: true },
      { text: "All specialty bots included", enabled: true },
      { text: "MegaBot (credit-based)", enabled: true },
      { text: "Storytelling tools", enabled: true },
      { text: "Priority email support", enabled: true },
      { text: "Project management", enabled: true },
      { text: "CarBot vehicle analysis", enabled: false },
    ],
    limits: { items: TIER_LIMITS[TIER.POWER_SELLER].maxActiveItems, photos: TIER_LIMITS[TIER.POWER_SELLER].maxPhotosPerItem },
  },
  {
    id: "pro",
    name: PLANS.ESTATE_MANAGER.name,
    badge: "Best Value",
    badgeBg: "#b45309",
    badgeColor: "#fff",
    color: "#b45309",
    border: "#fbbf24",
    bg: "#fffbeb",
    monthly: PLANS.ESTATE_MANAGER.preLaunchPrice,
    annual: Math.round(PLANS.ESTATE_MANAGER.preLaunchAnnual / 12),
    regularMonthly: PLANS.ESTATE_MANAGER.monthlyPrice,
    regularAnnual: Math.round(PLANS.ESTATE_MANAGER.annualPrice / 12),
    commission: PLANS.ESTATE_MANAGER.commission * 100,
    ctaLabel: "Try Free for 14 Days",
    ctaVariant: "primary" as const,
    trial: "14-day free trial",
    features: [
      { text: "Unlimited items", enabled: true },
      { text: `${TIER_LIMITS[TIER.ESTATE_MANAGER].maxPhotosPerItem} photos per item`, enabled: true },
      { text: "All bots including CarBot", enabled: true },
      { text: "MegaBot (credit-based)", enabled: true },
      { text: "White-label store", enabled: true },
      { text: "Full estate project tools", enabled: true },
      { text: "Legacy storytelling + archives", enabled: true },
      { text: "Dedicated account manager", enabled: true },
      { text: "API access + priority phone support", enabled: true },
    ],
    limits: { items: "Unlimited", photos: TIER_LIMITS[TIER.ESTATE_MANAGER].maxPhotosPerItem },
  },
];

// ─── White-glove tiers ─────────────────────────────────────────────────────

const WG_TIERS = [
  {
    id: "essentials",
    icon: "🏠",
    name: "Estate Essentials",
    idealFor: "Smaller estates, 1–2 bedrooms",
    basePrice: 2500,
    preLaunchPrice: 1750,
    commission: 25,
    timeline: "2–3 weeks",
    badge: "Pre-Launch — Save 30%",
    color: "#0f766e",
    border: "#99f6e4",
    bg: "#f0fdfa",
    featured: false,
    services: [
      "On-site consultation (2 hours)",
      "Up to 100 items catalogued",
      "Professional photography",
      "AI + expert pricing",
      "Complete online listings",
      "Buyer communication",
      "Shipping coordination",
      "Story capture (10 items)",
      "Donation coordination",
    ],
    team: "1–2 specialists assigned",
  },
  {
    id: "professional",
    icon: "🏡",
    name: "Estate Professional",
    idealFor: "Full homes, 3–4 bedrooms",
    basePrice: 5000,
    preLaunchPrice: 3500,
    commission: 30,
    timeline: "3–4 weeks",
    badge: "Recommended",
    color: "#7c3aed",
    border: "#c4b5fd",
    bg: "#faf5ff",
    featured: true,
    services: [
      "Everything in Essentials, PLUS:",
      "Full-day on-site assessment",
      "Up to 300 items",
      "Multi-angle photography",
      "MegaBot pricing on all items",
      "Video walkthroughs",
      "Expert appraisals (10 items)",
      "Story capture (25 items)",
      "Audio recording sessions",
      "Legacy archive creation",
      "Multiple on-site visits",
      "Junk removal coordination",
    ],
    team: "2–3 specialists + photographer",
  },
  {
    id: "legacy",
    icon: "🏰",
    name: "Estate Legacy",
    idealFor: "Large estates, historic collections",
    basePrice: 10000,
    preLaunchPrice: 7000,
    commission: 35,
    timeline: "4–8 weeks",
    badge: "White-Glove Premium",
    color: "#1c1917",
    border: "#44403c",
    bg: "#1c1917",
    featured: false,
    dark: true,
    services: [
      "Everything in Professional, PLUS:",
      "Unlimited items",
      "Dedicated project manager",
      "Professional videographer",
      "Unlimited expert appraisals",
      "Museum-quality photography",
      "Video legacy interviews",
      "Custom legacy book (printed)",
      "Restoration recommendations",
      "Auction house coordination",
      "Insurance documentation",
      "Estate attorney coordination",
      "Weekly progress reports",
      "24/7 dedicated support",
    ],
    team: "3–5 specialists + manager",
  },
];

const NEIGHBORHOOD_BUNDLE = {
  basePrice: 399,
  preLaunchPrice: 239,
  additionalFamily: 149,
  preLaunchAdditional: 89,
  commission: 20,
  maxFamilies: 8,
  features: [
    "Shared on-site visit — one trip, multiple homes",
    "AI identification & pricing for each family",
    "Individual storefronts per household",
    "Coordinated pickup / shipping days",
    "Bulk shipping discounts (save 15–25%)",
    "Community sale event option",
    "20% commission (vs 25–35% individual)",
    "Group scheduling — convenient for the whole block",
  ],
};

const HOW_IT_WORKS = [
  { icon: "📞", title: "Request a Quote", desc: "Fill out our form with property details. We'll call within 24 hours." },
  { icon: "🏠", title: "On-Site Assessment", desc: "Our team visits for a comprehensive evaluation and detailed quote." },
  { icon: "📋", title: "Contract & Deposit", desc: "Sign service agreement, pay 50% deposit, and schedule your start date." },
  { icon: "📸", title: "Inventory & Photography", desc: "We catalogue every item, take professional photos, and capture stories." },
  { icon: "🚀", title: "List & Market", desc: "Items listed on all major platforms with optimized pricing." },
  { icon: "💬", title: "Manage Sales", desc: "We handle all buyer communications, negotiations, and shipping." },
  { icon: "📦", title: "Final Coordination", desc: "Unsold items donated or removed. Property cleaned and ready." },
  { icon: "💰", title: "Final Payment", desc: "Detailed sales report + payment. Legacy archive delivered if included." },
];

const WG_TESTIMONIALS = [
  { quote: "The LegacyLoop team treated my mother's estate with such care and respect. They got 40% more than we expected and created a beautiful memory book that our whole family treasures.", name: "Sarah M.", location: "Portland, ME", service: "Estate Professional — 3BR home" },
  { quote: "Worth every penny. They handled everything while I was out of state. Regular updates, professional service, and incredible attention to detail. I never felt out of the loop.", name: "James T.", location: "Augusta, ME", service: "Estate Legacy — 5BR historic home" },
  { quote: "As the estate executor I had no idea where to start. LegacyLoop walked me through every step, kept the family informed, and sold over $22,000 in items I would have donated.", name: "Patricia K.", location: "Waterville, ME", service: "Estate Professional — 4BR home" },
];

const COMPARISON_ROWS = [
  { label: "Handle everything myself remotely", digital: "✅ Perfect fit", wg: "Not needed" },
  { label: "Have someone do it all for me", digital: "Limited help", wg: "✅ Perfect fit" },
  { label: "Minimize upfront costs", digital: "✅ $0–$49/mo", wg: "$2,500+ upfront" },
  { label: "Get expert help on-site", digital: "Not available", wg: "✅ Included" },
  { label: "Professional photography", digital: "DIY photos", wg: "✅ Included" },
  { label: "Preserve family stories", digital: "DIY tools", wg: "✅ Professional" },
  { label: "Auction house referrals", digital: "Pro plan only", wg: "✅ All tiers" },
  { label: "Property in Maine required", digital: "❌ Anywhere", wg: "✅ Maine only" },
];

const FAQ_ITEMS = [
  { q: "Can I start with Digital and upgrade to White-Glove later?", a: "Absolutely! Many clients start with our digital platform and switch to white-glove when they realize the scope of work. We'll credit any unused subscription fees toward your white-glove package." },
  { q: "What areas do you serve for White-Glove service?", a: "Currently serving all of Maine. Priority areas include Waterville, Portland, Augusta, and Bangor. Locations up to 2 hours from Waterville may include a travel surcharge." },
  { q: "How is the commission calculated?", a: "Commission applies only to items that actually sell. For example, if an item sells for $100 with 30% commission, you receive $70. No sale = no commission beyond the upfront fee." },
  { q: "What if items don't sell in the digital plan?", a: "You pay nothing extra. Items stay listed as long as your subscription is active. You can update pricing anytime based on buyer feedback." },
  { q: "What happens to unsold items after White-Glove service?", a: "We coordinate donation pickup for quality unsold items (you receive a donation receipt for tax purposes) or junk removal. Your property is cleared and ready." },
  { q: "Is MegaBot worth it?", a: "For items over $50, absolutely. MegaBot runs 3 separate AIs and picks the best consensus — it catches details one AI misses and consistently prices 15–30% more accurately." },
];

// ─── Pricing Calculator (White-Glove) ──────────────────────────────────────

function PricingCalculator() {
  const [bedrooms, setBedrooms] = useState("3-4");
  const [items, setItems] = useState("100-300");
  const [addOns, setAddOns] = useState<string[]>([]);

  const ADD_ON_PRICES: Record<string, number> = {
    appraisals: 500,
    video: 750,
    archive: 400,
    staging: 350,
  };

  const BASE_PRICES: Record<string, [number, number]> = {
    "1-2": [2500, 4000],
    "3-4": [5000, 7000],
    "5+": [10000, 14000],
  };

  const base = BASE_PRICES[bedrooms] ?? [5000, 7000];
  const addOnTotal = addOns.reduce((s, k) => s + (ADD_ON_PRICES[k] ?? 0), 0);
  const commission = bedrooms === "5+" ? 35 : bedrooms === "3-4" ? 30 : 25;

  function toggleAddOn(key: string) {
    setAddOns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  return (
    <div className="card p-8" style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div className="section-title mb-1">Estimate Tool</div>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
        Calculate Your Project Cost
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        <div>
          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Bedrooms</label>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {["1-2", "3-4", "5+"].map((v) => (
              <button key={v} onClick={() => setBedrooms(v)}
                style={{ flex: 1, padding: "0.5rem", background: bedrooms === v ? "#0f766e" : "#f5f5f4", color: bedrooms === v ? "#fff" : "#44403c", border: `1px solid ${bedrooms === v ? "#0f766e" : "#e7e5e4"}`, borderRadius: "0.6rem", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Estimated Items</label>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {["<100", "100-300", "300-500", "500+"].map((v) => (
              <button key={v} onClick={() => setItems(v)}
                style={{ padding: "0.5rem 0.6rem", background: items === v ? "#0f766e" : "#f5f5f4", color: items === v ? "#fff" : "#44403c", border: `1px solid ${items === v ? "#0f766e" : "#e7e5e4"}`, borderRadius: "0.6rem", fontWeight: 600, fontSize: "0.72rem", cursor: "pointer" }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>Add-On Services</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
          {[
            { key: "appraisals", label: "Expert Appraisals", price: "$500" },
            { key: "video", label: "Video Documentation", price: "$750" },
            { key: "archive", label: "Legacy Archive", price: "$400" },
            { key: "staging", label: "Staging Consultation", price: "$350" },
          ].map((ao) => (
            <div key={ao.key} onClick={() => toggleAddOn(ao.key)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: addOns.includes(ao.key) ? "#f0fdf4" : "#fafaf9", border: `1px solid ${addOns.includes(ao.key) ? "#86efac" : "#f5f5f4"}`, borderRadius: "0.6rem", cursor: "pointer" }}>
              <div style={{ width: "16px", height: "16px", border: `2px solid ${addOns.includes(ao.key) ? "#16a34a" : "#d6d3d1"}`, borderRadius: "3px", background: addOns.includes(ao.key) ? "#16a34a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {addOns.includes(ao.key) && <span style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 800 }}>✓</span>}
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: 500, flex: 1 }}>{ao.label}</span>
              <span style={{ fontSize: "0.72rem", color: "#0f766e", fontWeight: 700 }}>{ao.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      <div style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1.5px solid #86efac", borderRadius: "1rem", padding: "1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Base service ({bedrooms} bedrooms)</span>
            <span style={{ fontWeight: 600 }}>${base[0].toLocaleString()} – ${base[1].toLocaleString()}</span>
          </div>
          {addOnTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Add-on services ({addOns.length})</span>
              <span style={{ fontWeight: 600 }}>+${addOnTotal.toLocaleString()}</span>
            </div>
          )}
          <div style={{ height: "1px", background: "#bbf7d0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Total upfront estimate</span>
            <span style={{ fontWeight: 800, color: "#16a34a", fontSize: "1.1rem" }}>
              ${(base[0] + addOnTotal).toLocaleString()} – ${(base[1] + addOnTotal).toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>Commission on sales</span>
            <span style={{ fontWeight: 600, color: "#0f766e" }}>{commission}% of sale price</span>
          </div>
        </div>
        <p style={{ fontSize: "0.72rem", color: "#166534", marginBottom: "0.75rem" }}>
          Preliminary estimate only. Final pricing determined after free on-site assessment.
        </p>
        <Link href="/quote"
          style={{ display: "block", textAlign: "center", padding: "0.7rem", background: "#0f766e", color: "#fff", borderRadius: "0.75rem", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
          Request Official Quote →
        </Link>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function PricingClient() {
  const [tab, setTab] = useState<"digital" | "white-glove">("digital");
  const [annual, setAnnual] = useState(false);

  const CARD: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-default)",
    borderRadius: "1.25rem",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="section-title">Pricing</div>
        <h1 className="h1 mt-2">Choose Your LegacyLoop Experience</h1>
        <p className="muted mt-3 max-w-xl mx-auto">
          From self-service AI tools to full white-glove estate management. Every plan includes our antique detection, MegaBot pricing, and buyer messaging.
        </p>
        <div style={{ marginTop: "1.25rem" }}>
          <Link href="/onboarding/quiz"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--accent-dim, rgba(0,188,212,0.06))", color: "var(--accent, #00bcd4)", padding: "0.6rem 1.25rem", borderRadius: "9999px", fontWeight: 700, textDecoration: "none", fontSize: "0.88rem", border: "1.5px solid var(--accent-border, rgba(0,188,212,0.25))" }}>
            🎯 Not sure which plan? Take our 2-minute quiz →
          </Link>
        </div>
      </div>

      {/* Social proof strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0",
          marginBottom: "2.5rem",
          background: "var(--accent-dim, rgba(0,188,212,0.06))",
          border: "1.5px solid var(--accent-border, rgba(0,188,212,0.25))",
          borderRadius: "1.25rem",
          padding: "1rem 1.5rem",
          flexWrap: "wrap",
        }}
      >
        {[
          { value: "847+", label: "Families Served", icon: "👨‍👩‍👧‍👦" },
          { value: "$2.4M", label: "In Items Sold", icon: "💰" },
          { value: "4.9 / 5", label: "Avg. Rating", icon: "⭐" },
          { value: "32", label: "States Reached", icon: "🗺️" },
          { value: "15–30%", label: "More Accurate Pricing", icon: "🎯" },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            style={{
              flex: "1 1 140px",
              textAlign: "center",
              padding: "0.6rem 1rem",
              borderRight: i < arr.length - 1 ? "1px solid var(--border-default)" : "none",
            }}
          >
            <div style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>{stat.icon}</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--accent, #00bcd4)", lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.25rem", fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2.5rem" }}>
        <div style={{ display: "inline-flex", background: "var(--bg-card)", borderRadius: "1rem", padding: "0.35rem", gap: "0.25rem", border: "1px solid var(--border-default)" }}>
          {([
            { key: "digital" as const, icon: "💻", label: "Digital Platform", sub: "Self-service with AI" },
            { key: "white-glove" as const, icon: "🏠", label: "White-Glove Service", sub: "We handle everything on-site" },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: "0.7rem 1.5rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor: "pointer",
                background: tab === t.key ? "var(--bg-primary)" : "transparent",
                boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{t.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{t.sub}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── DIGITAL TAB ── */}
      {tab === "digital" && (
        <div>
          {/* Founding Member Banner — prices from lib/pricing/constants.ts */}
          <div style={{ background: "linear-gradient(135deg, #78350f, #92400e)", borderRadius: "1.25rem", padding: "1.25rem 1.75rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "200px", background: "radial-gradient(ellipse at right, rgba(251,191,36,0.15), transparent 70%)" }} />
            <div style={{ fontSize: "2rem", flexShrink: 0 }}>⚡</div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                <span style={{ background: "#fbbf24", color: "#78350f", fontSize: "0.6rem", fontWeight: 900, padding: "0.15rem 0.5rem", borderRadius: "9999px", letterSpacing: "0.1em" }}>FOUNDING MEMBER OFFER</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                  Limited — {DISCOUNTS.preLaunch.spotsRemaining} of {DISCOUNTS.preLaunch.totalSpots} spots remaining
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#fff", marginBottom: "0.1rem" }}>
                Lock in pre-launch pricing — save up to 24%, forever.
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Sign up today and pay founding member rates as long as you're subscribed. Prices increase at launch.
              </div>
              <Link href="/onboarding/quiz" style={{ display: "inline-block", marginTop: "0.6rem", background: "var(--bg-card-hover)", color: "#fff", padding: "0.3rem 0.8rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none", border: "1px solid var(--border-default)" }}>
                Not sure which plan? Take our 2-min quiz →
              </Link>
            </div>
            <div style={{ flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                {[
                  { plan: PLANS.DIY_SELLER.name, pre: PLANS.DIY_SELLER.preLaunchPrice, reg: PLANS.DIY_SELLER.monthlyPrice },
                  { plan: PLANS.POWER_SELLER.name, pre: PLANS.POWER_SELLER.preLaunchPrice, reg: PLANS.POWER_SELLER.monthlyPrice },
                  { plan: PLANS.ESTATE_MANAGER.name, pre: PLANS.ESTATE_MANAGER.preLaunchPrice, reg: PLANS.ESTATE_MANAGER.monthlyPrice },
                ].map((t) => (
                  <div key={t.plan} style={{ textAlign: "center" }}>
                    <div style={{ color: "#fbbf24", fontWeight: 900, fontSize: "1.1rem" }}>${t.pre}<span style={{ fontSize: "0.65rem" }}>/mo</span></div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.62rem", textDecoration: "line-through" }}>${t.reg}/mo</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.62rem", marginTop: "0.1rem" }}>{t.plan}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Billing toggle */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: !annual ? "var(--text-primary)" : "var(--text-muted)" }}>Monthly</span>
            <button onClick={() => setAnnual(!annual)}
              style={{ width: "44px", height: "24px", borderRadius: "9999px", border: "none", cursor: "pointer", background: annual ? "#0f766e" : "#e7e5e4", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: annual ? "23px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </button>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: annual ? "var(--text-primary)" : "var(--text-muted)" }}>
              Annual <span style={{ background: "#0f766e", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 800 }}>Save 20%</span>
            </span>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {DIGITAL_TIERS.map((tier) => (
              <div key={tier.id} style={{ ...CARD, border: `2px solid ${tier.border}` }}>
                {tier.badge && (
                  <div style={{ position: "absolute", top: 0, right: 0, background: tier.badgeBg, color: tier.badgeColor, fontSize: "0.62rem", fontWeight: 800, padding: "0.2rem 0.65rem", borderBottomLeftRadius: "0.65rem", letterSpacing: "0.05em" }}>
                    {tier.badge}
                  </div>
                )}

                <div style={{ padding: "1.5rem 1.5rem 1rem", background: tier.bg }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: tier.color }}>{tier.name}</div>
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)" }}>
                      ${annual ? tier.annual : tier.monthly}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>/month</span>
                    {tier.regularMonthly > 0 && (
                      <span style={{ fontSize: "0.8rem", color: "#a8a29e", textDecoration: "line-through" }}>
                        ${annual ? tier.regularAnnual : tier.regularMonthly}
                      </span>
                    )}
                  </div>
                  {tier.monthly > 0 && (
                    <div style={{ fontSize: "0.72rem", marginTop: "0.1rem" }}>
                      {annual ? (
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>
                          Billed ${tier.annual * 12}/year — save ${(tier.monthly - tier.annual) * 12}/yr
                        </span>
                      ) : (
                        <span style={{ color: "#b45309", fontWeight: 700 }}>
                          ⚡ Pre-launch price — ${tier.regularMonthly}/mo at launch
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>+ {tier.commission}% on sales</div>
                  {tier.monthly > 0 && (
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      {PROCESSING_FEE.display} processing fee added at checkout
                    </div>
                  )}
                </div>

                <div style={{ padding: "1rem 1.5rem", flex: 1 }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {tier.features.map((f) => (
                      <li key={f.text} style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem", color: f.enabled ? "#44403c" : "#a8a29e" }}>
                        <span style={{ color: f.enabled ? tier.color : "#d6d3d1", fontWeight: 700, flexShrink: 0, fontSize: "0.75rem" }}>{f.enabled ? "✓" : "✗"}</span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: "1rem 1.5rem 1.5rem" }}>
                  {tier.trial && (
                    <div style={{ fontSize: "0.7rem", color: "#78716c", textAlign: "center", marginBottom: "0.4rem" }}>✨ {tier.trial} — no card needed</div>
                  )}
                  <Link href="/auth/signup"
                    style={{
                      display: "block", textAlign: "center", padding: "0.7rem 1rem", borderRadius: "0.75rem",
                      background: tier.ctaVariant === "primary" ? tier.color : "transparent",
                      color: tier.ctaVariant === "primary" ? "#fff" : tier.color,
                      border: `2px solid ${tier.color}`,
                      fontWeight: 700, fontSize: "0.88rem", textDecoration: "none",
                    }}>
                    {tier.ctaLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Feature comparison table */}
          <div className="card p-8 mb-12">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Full Feature Comparison</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                    <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", fontWeight: 700, color: "var(--text-primary)", width: "22%" }}>Feature</th>
                    {DIGITAL_TIERS.map((t) => (
                      <th key={t.id} style={{ textAlign: "center", padding: "0.6rem 0.5rem", fontWeight: 700, color: t.color, width: "13%", fontSize: "0.75rem" }}>
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Items", values: ["3", "15", "25", "100", "300", "600"] },
                    { label: "Photos/item", values: ["1", "3", "3", "5", "10", "Unlimited"] },
                    { label: "Pre-launch price", values: ["Free", "$10/mo", "$10/mo", "$25/mo", "$75/mo", "$149/mo"] },
                    { label: "Regular price", values: ["Free", "$20/mo", "$20/mo", "$49/mo", "$99/mo", "$199/mo"] },
                    { label: "Commission", values: ["5%", "10%", "8%", "10%", "15%", "4%"] },
                    { label: "AI identification", values: ["✓", "✓", "✓", "✓", "✓", "✓"] },
                    { label: "MegaBot (3-AI)", values: ["—", "—", "—", "5×/mo", "Unlimited", "Unlimited"] },
                    { label: "Buyer Finder", values: ["—", "—", "—", "20×/mo", "Unlimited", "Unlimited"] },
                    { label: "Analytics", values: ["—", "—", "Basic", "Full", "Full", "Full"] },
                    { label: "Yard sale tools", values: ["—", "✓", "—", "—", "—", "—"] },
                    { label: "Sales", values: ["—", "—", "—", "—", "✓", "✓"] },
                    { label: "Custom storefront", values: ["—", "—", "—", "✓", "✓", "✓"] },
                    { label: "Story capture", values: ["—", "—", "—", "—", "✓", "✓"] },
                    { label: "Legacy archives", values: ["—", "—", "—", "—", "✓", "✓"] },
                    { label: "Account manager", values: ["—", "—", "—", "—", "—", "✓"] },
                    { label: "Support", values: ["Email", "Email", "Email", "Priority", "Phone", "Phone + Video"] },
                    { label: "Remove branding", values: ["—", "—", "✓", "✓", "✓", "✓"] },
                  ].map((row, i) => (
                    <tr key={row.label} style={{ borderBottom: "1px solid var(--border-default)", background: i % 2 === 0 ? "var(--bg-secondary, var(--border-default))" : "transparent" }}>
                      <td style={{ padding: "0.5rem 0.75rem", fontWeight: 500, color: "var(--text-secondary)" }}>{row.label}</td>
                      {row.values.map((v, vi) => (
                        <td key={vi} style={{ padding: "0.5rem", textAlign: "center", color: v === "—" ? "var(--text-muted)" : v === "✓" ? "var(--success-text)" : "var(--text-primary)", fontWeight: v === "✓" ? 700 : 500 }}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── WHITE-GLOVE TAB ── */}
      {tab === "white-glove" && (
        <div>
          {/* Value prop banner */}
          <div style={{ background: "linear-gradient(135deg, #1c1917, #292524)", borderRadius: "1.25rem", padding: "2rem", color: "#fff", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "2.5rem" }}>🏠</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem" }}>White-Glove Estate Services — Maine Only</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Our team comes to you. We catalogue, photograph, price, list, and sell every item — then handle all buyer communication, shipping, and final coordination. You just say yes.
              </p>
            </div>
            <Link href="/quote" style={{ background: "#fff", color: "#1c1917", padding: "0.75rem 1.5rem", borderRadius: "0.75rem", fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap", fontSize: "0.9rem" }}>
              Request Free Quote →
            </Link>
          </div>

          {/* Service tier cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {WG_TIERS.map((tier) => {
              const isDark = tier.dark;
              return (
                <div key={tier.id} style={{ ...CARD, border: `2px solid ${tier.border}`, background: isDark ? "#1c1917" : "#fff" }}>
                  {tier.badge && (
                    <div style={{ position: "absolute", top: 0, right: 0, background: tier.color, color: isDark ? "#fff" : "#fff", fontSize: "0.62rem", fontWeight: 800, padding: "0.2rem 0.65rem", borderBottomLeftRadius: "0.65rem", letterSpacing: "0.05em" }}>
                      {tier.badge}
                    </div>
                  )}

                  <div style={{ padding: "1.75rem 1.75rem 1rem", background: isDark ? "#292524" : tier.bg }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{tier.icon}</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "#a8a29e" : tier.color }}>{tier.name}</div>
                    <div style={{ fontSize: "0.8rem", color: isDark ? "#78716c" : "#78716c", marginTop: "0.15rem" }}>{tier.idealFor}</div>
                    <div style={{ marginTop: "0.75rem" }}>
                      <div style={{ fontSize: "0.72rem", color: isDark ? "#78716c" : "var(--text-muted)" }}>Pre-launch price</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "2rem", fontWeight: 900, color: isDark ? "#fff" : "var(--text-primary)" }}>
                          ${tier.preLaunchPrice.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "1rem", color: isDark ? "#78716c" : "var(--text-muted)", textDecoration: "line-through" }}>
                          ${tier.basePrice.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", marginTop: "0.15rem" }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                          ⚡ Save ${(tier.basePrice - tier.preLaunchPrice).toLocaleString()} — pre-launch only
                        </span>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: isDark ? "#a8a29e" : "var(--text-muted)", marginTop: "0.25rem" }}>+ {tier.commission}% commission · {tier.timeline}</div>
                    </div>
                  </div>

                  <div style={{ padding: "1.25rem 1.75rem", flex: 1, background: isDark ? "#1c1917" : "#fff" }}>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {tier.services.map((s, i) => (
                        <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem", color: isDark ? (i === 0 ? "#a8a29e" : "#e7e5e4") : (i === 0 ? "#78716c" : "#44403c"), fontStyle: i === 0 && s.includes("PLUS") ? "italic" : "normal" }}>
                          {i !== 0 && <span style={{ color: isDark ? "#a8a29e" : tier.color, fontWeight: 700, flexShrink: 0, fontSize: "0.75rem" }}>✓</span>}
                          {s}
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: "1rem", padding: "0.5rem 0.75rem", background: isDark ? "#292524" : "#f5f5f4", borderRadius: "0.5rem", fontSize: "0.75rem", color: isDark ? "#a8a29e" : "#78716c", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>👥</span> {tier.team}
                    </div>
                  </div>

                  <div style={{ padding: "1rem 1.75rem 1.75rem", background: isDark ? "#1c1917" : "#fff" }}>
                    <Link href="/quote"
                      style={{
                        display: "block", textAlign: "center", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                        background: tier.featured ? tier.color : isDark ? "var(--border-default)" : "transparent",
                        color: tier.featured ? "#fff" : isDark ? "#fff" : tier.color,
                        border: `2px solid ${isDark ? "var(--border-default)" : tier.color}`,
                        fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                      }}>
                      Request Quote →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Neighborhood Bundle */}
          <div className="card p-8 mb-12" style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.04), rgba(0,188,212,0.01))", border: "1.5px solid var(--accent-border, rgba(0,188,212,0.25))" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🏘️</div>
              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                  <span style={{ background: "var(--accent, #00bcd4)", color: "#fff", fontSize: "0.6rem", fontWeight: 900, padding: "0.15rem 0.5rem", borderRadius: "9999px", letterSpacing: "0.1em" }}>NEIGHBORHOOD BUNDLE</span>
                  <span style={{ background: "#f59e0b", color: "#78350f", fontSize: "0.6rem", fontWeight: 900, padding: "0.15rem 0.5rem", borderRadius: "9999px", letterSpacing: "0.05em" }}>PRE-LAUNCH SPECIAL</span>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  Rally Your Neighbors — Save Together
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                  Get 2–8 families on your street or in your community together. Share one on-site visit, save on shipping, and get the lowest commission rate we offer.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {/* Pricing */}
              <div style={{ background: "var(--bg-card)", borderRadius: "1rem", padding: "1.25rem", border: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>PRICING</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)" }}>${NEIGHBORHOOD_BUNDLE.preLaunchPrice}</span>
                  <span style={{ fontSize: "1rem", color: "var(--text-muted)", textDecoration: "line-through" }}>${NEIGHBORHOOD_BUNDLE.basePrice}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>base / family</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  + <span style={{ fontWeight: 700 }}>${NEIGHBORHOOD_BUNDLE.preLaunchAdditional}</span>
                  <span style={{ textDecoration: "line-through", color: "var(--text-muted)", marginLeft: "0.35rem" }}>${NEIGHBORHOOD_BUNDLE.additionalFamily}</span>
                  {" "}per additional family
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--accent, #00bcd4)", fontWeight: 700 }}>
                  Only {NEIGHBORHOOD_BUNDLE.commission}% commission on sales
                </div>
                <div style={{ marginTop: "0.75rem", background: "rgba(0,188,212,0.06)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Example: 4 families = ${NEIGHBORHOOD_BUNDLE.preLaunchPrice} + (3 × ${NEIGHBORHOOD_BUNDLE.preLaunchAdditional}) = <strong style={{ color: "var(--text-primary)" }}>${NEIGHBORHOOD_BUNDLE.preLaunchPrice + 3 * NEIGHBORHOOD_BUNDLE.preLaunchAdditional}</strong> total
                </div>
              </div>

              {/* Features */}
              <div style={{ background: "var(--bg-card)", borderRadius: "1rem", padding: "1.25rem", border: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>WHAT'S INCLUDED</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {NEIGHBORHOOD_BUNDLE.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent, #00bcd4)", fontWeight: 700, flexShrink: 0, fontSize: "0.75rem" }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <Link href="/quote" style={{ display: "inline-block", background: "var(--accent, #00bcd4)", color: "#fff", padding: "0.75rem 2rem", borderRadius: "0.75rem", fontWeight: 800, textDecoration: "none", fontSize: "0.9rem" }}>
                Start a Neighborhood Bundle →
              </Link>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Minimum 2 families · Maine only · Free on-site assessment
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div id="how" style={{ marginBottom: "3rem" }}>
            <div className="section-title mb-1 text-center">Process</div>
            <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem", color: "var(--text-primary)" }}>
              How White-Glove Service Works
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="card p-5">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                    <div style={{ width: "28px", height: "28px", background: "#0f766e", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: "1.35rem" }}>{step.icon}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)", marginBottom: "0.3rem" }}>{step.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div style={{ marginBottom: "3rem" }}>
            <div className="section-title mb-1 text-center">Client Stories</div>
            <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
              What Our Clients Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {WG_TESTIMONIALS.map((t) => (
                <div key={t.name} className="card p-6">
                  <div style={{ display: "flex", gap: "0.15rem", marginBottom: "0.75rem" }}>
                    {"★★★★★".split("").map((s, i) => <span key={i} style={{ color: "#f59e0b" }}>{s}</span>)}
                  </div>
                  <blockquote style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.7, fontStyle: "italic", marginBottom: "0.75rem" }}>"{t.quote}"</blockquote>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary)" }}>— {t.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{t.location} · {t.service}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Calculator */}
          <div style={{ marginBottom: "3rem" }}>
            <div className="section-title mb-1 text-center">Estimate</div>
            <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
              Estimate Your Project Cost
            </h2>
            <PricingCalculator />
          </div>
        </div>
      )}

      {/* ── COMPARISON SECTION (both tabs) ── */}
      <div className="card p-8 mb-10">
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Which Service Is Right for You?</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: 600, width: "50%" }}>I want to…</th>
                <th style={{ textAlign: "center", padding: "0.6rem", color: "var(--accent, #00bcd4)", fontWeight: 700 }}>💻 Digital Platform</th>
                <th style={{ textAlign: "center", padding: "0.6rem", color: "#7c3aed", fontWeight: 700 }}>🏠 White-Glove</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} style={{ borderBottom: "1px solid var(--border-default)", background: i % 2 === 0 ? "var(--bg-secondary, var(--border-default))" : "transparent" }}>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)" }}>{row.label}</td>
                  <td style={{ padding: "0.5rem", textAlign: "center", color: row.digital.startsWith("✅") ? "var(--success-text)" : "var(--text-muted)", fontWeight: row.digital.startsWith("✅") ? 700 : 400 }}>{row.digital}</td>
                  <td style={{ padding: "0.5rem", textAlign: "center", color: row.wg.startsWith("✅") ? "var(--success-text)" : "var(--text-muted)", fontWeight: row.wg.startsWith("✅") ? 700 : 400 }}>{row.wg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Testimonials ── */}
      <div style={{ marginTop: "3rem", marginBottom: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="section-title" style={{ display: "inline-block" }}>Trusted by Sellers</div>
          <h2 className="h2 mt-2">What Our Customers Say</h2>
        </div>
        <TestimonialGrid maxItems={3} />
      </div>

      {/* ── FAQ ── */}
      <div className="card p-8 mb-10">
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Frequently Asked Questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {FAQ_ITEMS.map(({ q, a }) => (
            <div key={q} style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "1.25rem" }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem", marginBottom: "0.35rem" }}>{q}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Estate Service Contracts ── */}
      <div className="card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="section-title" style={{ marginBottom: "0.5rem" }}>Estate Service Contracts</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Ongoing Estate Management Subscriptions
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "600px", margin: "0.5rem auto 0" }}>
            For estate executors, attorneys, and families managing multi-month projects. Lock in pre-launch pricing with a service contract.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
          {[
            {
              name: "Monthly Estate Care",
              price: "$299",
              period: "/month",
              preLaunch: "$149",
              features: ["Up to 50 items/month", "Weekly status reports", "Dedicated coordinator", "Priority listing placement", "Cancel anytime"],
              cta: "Start Monthly Plan",
              color: "#0f766e",
            },
            {
              name: "3-Month Estate Package",
              price: "$799",
              period: "/quarter",
              preLaunch: "$399",
              features: ["Up to 200 items total", "Bi-weekly on-site visits", "Professional photography", "Story capture (10 items)", "Donation coordination", "15% commission savings"],
              cta: "Sign 3-Month Contract",
              color: "#7c3aed",
              popular: true,
            },
            {
              name: "Full Estate Resolution",
              price: "$1,999",
              period: "/6 months",
              preLaunch: "$999",
              features: ["Unlimited items", "Weekly on-site visits", "Full MegaBot pricing", "Legacy archive creation", "Attorney coordination", "Auction house access", "Guaranteed completion"],
              cta: "Sign 6-Month Contract",
              color: "var(--text-primary)",
            },
          ].map((plan) => (
            <div key={plan.name} style={{
              padding: "1.5rem", borderRadius: "1rem",
              border: `2px solid ${plan.popular ? plan.color : "var(--border-default)"}`,
              background: plan.popular ? "rgba(124,58,237,0.04)" : "transparent",
              position: "relative",
            }}>
              {plan.popular && (
                <div style={{ position: "absolute", top: "-0.6rem", left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: "0.6rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "9999px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Best Value
                </div>
              )}
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: plan.color, marginBottom: "0.5rem" }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.15rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{plan.price}</span>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{plan.preLaunch}</span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{plan.period}</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600, marginBottom: "1rem" }}>Pre-launch pricing — save 50%</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ color: "var(--success-text)", fontSize: "0.7rem" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/quote" style={{
                display: "block", textAlign: "center", padding: "0.6rem 1rem", borderRadius: "0.6rem",
                background: plan.popular ? plan.color : "transparent",
                color: plan.popular ? "#fff" : plan.color,
                border: plan.popular ? "none" : `1px solid ${plan.color}`,
                fontWeight: 700, fontSize: "0.85rem", textDecoration: "none",
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", borderRadius: "1.5rem", padding: "3rem", textAlign: "center", color: "#fff", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          Ready to get started?
        </h2>
        <p style={{ color: "var(--text-primary)", marginBottom: "1.5rem", maxWidth: "500px", margin: "0 auto 1.5rem" }}>
          Start with the digital platform free, or request a quote for white-glove service. No commitment required.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth/signup"
            style={{ background: "#fff", color: "#0f766e", padding: "0.85rem 2rem", borderRadius: "9999px", fontWeight: 800, textDecoration: "none", fontSize: "0.95rem" }}>
            Start Free Today
          </Link>
          <Link href="/quote"
            style={{ background: "var(--bg-card-hover)", color: "#fff", padding: "0.85rem 2rem", borderRadius: "9999px", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem", border: "1px solid var(--border-default)" }}>
            Request White-Glove Quote
          </Link>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
          textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
          border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
        }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
