"use client";

import { useState } from "react";
import Link from "next/link";

const USE_CASES = [
  {
    icon: "🏘️",
    title: "Neighborhood Estate Sale",
    description: "Coordinate a multi-family sale event that draws more buyers and splits marketing costs.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family Group Downsizing",
    description: "Extended family members clearing out different homes under one shared account.",
  },
  {
    icon: "🏚️",
    title: "HOA / Community Event",
    description: "Homeowners association sponsors a community-wide estate and garage sale weekend.",
  },
  {
    icon: "🤝",
    title: "Senior Living Transition",
    description: "Multiple residents in a senior community transitioning belongings at the same time.",
  },
];

const FAMILY_PRICING = [
  { families: 2, label: "2 Families", beta: 15, regular: 30, savings: 15, spotsLeft: null },
  { families: 3, label: "3 Families", beta: 13, regular: 26, savings: 39, spotsLeft: null },
  { families: 4, label: "4 Families", beta: 11, regular: 22, savings: 44, spotsLeft: 8 },
  { families: 5, label: "5 Families", beta: 10, regular: 20, savings: 50, spotsLeft: 5 },
  { families: 6, label: "6 Families", beta: 9, regular: 18, savings: 46, spotsLeft: 3 },
  { families: 8, label: "8 Families", beta: 8, regular: 16, savings: 64, spotsLeft: 2 },
];

const BUNDLE_FEATURES = [
  "Shared group dashboard for all families",
  "Unified buyer marketplace (more buyers see more items)",
  "Cross-family item recommendations",
  "Single billing admin (one invoice for all)",
  "Shared MegaBot analysis credits",
  "Group analytics — see total portfolio value",
  "Coordinated sale day scheduling tools",
  "Bulk buyer notification to shared buyer list",
  "Shared story archive for community history",
  "Priority coordinator support",
];

const TESTIMONIALS = [
  {
    name: "Margaret & Doris, Brunswick, ME",
    role: "Neighbors (32 years)",
    quote: "We cleared out both our houses at the same time. LegacyLoop's neighborhood bundle let our buyers see both collections at once — we had a buyer drive up from Boston who bought $4,200 worth of furniture from both of us the same weekend.",
    value: "$12,400 sold together",
  },
  {
    name: "The Patterson Family, Augusta",
    role: "4 siblings, 3 properties",
    quote: "Settling our parents' estate while handling siblings' own moves would have been chaos. The shared dashboard let all four of us track progress, approve listings, and coordinate without endless phone calls.",
    value: "$28,000 sold in 6 weeks",
  },
];

export default function NeighborhoodBundlePage() {
  const [selectedFamilies, setSelectedFamilies] = useState(3);
  const [annual, setAnnual] = useState(false);

  const selected = FAMILY_PRICING.find((f) => f.families === selectedFamilies) ?? FAMILY_PRICING[1];
  const monthlyTotal = selected.beta * selectedFamilies;
  const annualSavings = Math.round(monthlyTotal * 12 * 0.15);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f766e, #0d9488)",
          borderRadius: "1.5rem",
          padding: "3.5rem",
          color: "#fff",
          marginBottom: "3rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "300px", background: "radial-gradient(ellipse at right, rgba(255,255,255,0.08), transparent 70%)" }} />

        <div style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "0.75rem" }}>
          🏘️ Neighborhood Bundle
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem" }}>
          Better Together.<br />Save More, Sell More.
        </h1>
        <p style={{ color: "var(--text-primary)", maxWidth: "600px", lineHeight: 1.7, marginBottom: "1.75rem", fontSize: "1.05rem" }}>
          When neighbors or family members sell together, buyers come from farther away, marketing costs are shared,
          and everyone gets a better deal. LegacyLoop's Neighborhood Bundle makes it easy.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href="#calculator"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#fff",
              color: "#0f766e",
              padding: "0.85rem 2rem",
              borderRadius: "9999px",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            Calculate Your Savings →
          </a>
          <Link
            href="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--bg-card-hover)",
              color: "var(--text-primary)",
              padding: "0.85rem 2rem",
              borderRadius: "9999px",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "0.95rem",
              border: "1px solid var(--border-default)",
            }}
          >
            View All Plans
          </Link>
        </div>

        <div style={{ display: "flex", gap: "2.5rem", marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" }}>
          {[
            { value: "Up to 50%", label: "Off per-family pricing" },
            { value: "Shared", label: "Buyer marketplace" },
            { value: "2–8", label: "Families per bundle" },
            { value: "1 Invoice", label: "Simple group billing" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Who It's For</div>
        <h2 className="h2 mb-6">Perfect For These Situations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {USE_CASES.map((u) => (
            <div key={u.title} className="card p-6">
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{u.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1c1917", marginBottom: "0.3rem" }}>{u.title}</div>
              <div style={{ fontSize: "0.85rem", color: "#57534e", lineHeight: 1.6 }}>{u.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Calculator */}
      <div id="calculator" style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Pricing Calculator</div>
        <h2 className="h2 mb-2">How Much Will You Save?</h2>
        <p className="muted mb-6">Beta pricing is available now — spots are limited. Lock in your rate before launch.</p>

        <div className="card p-8">
          {/* Family count selector */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ fontSize: "0.9rem", fontWeight: 700, color: "#44403c", display: "block", marginBottom: "0.75rem" }}>
              How many families / households?
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {FAMILY_PRICING.map((f) => (
                <button
                  key={f.families}
                  onClick={() => setSelectedFamilies(f.families)}
                  style={{
                    position: "relative",
                    padding: "0.6rem 1.1rem",
                    borderRadius: "0.75rem",
                    border: "2px solid",
                    borderColor: selectedFamilies === f.families ? "#0f766e" : "#e7e5e4",
                    background: selectedFamilies === f.families ? "#f0fdfa" : "#fff",
                    color: selectedFamilies === f.families ? "#0f766e" : "#44403c",
                    fontWeight: selectedFamilies === f.families ? 800 : 500,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  {f.label}
                  {f.spotsLeft !== null && (
                    <span style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-4px",
                      background: "#dc2626",
                      color: "#fff",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "0.1rem 0.3rem",
                      borderRadius: "9999px",
                    }}>
                      {f.spotsLeft} left
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Billing toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: !annual ? "#1c1917" : "#78716c" }}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              style={{ width: "44px", height: "24px", borderRadius: "9999px", border: "none", cursor: "pointer", background: annual ? "#0f766e" : "#e7e5e4", position: "relative", transition: "background 0.2s" }}
            >
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: annual ? "23px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </button>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: annual ? "#1c1917" : "#78716c" }}>
              Annual <span style={{ background: "#0f766e", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 800 }}>Extra 15% off</span>
            </span>
          </div>

          {/* Results */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ padding: "1.25rem", background: "#f5f5f4", borderRadius: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "#78716c", fontWeight: 600, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Regular price</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#78716c", textDecoration: "line-through" }}>
                ${annual ? Math.round(selected.regular * 12 * 0.85) : selected.regular * selectedFamilies}<span style={{ fontSize: "0.8rem", fontWeight: 500 }}>/{annual ? "yr" : "mo"}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>combined</div>
            </div>

            <div style={{ padding: "1.25rem", background: "linear-gradient(135deg, #f0fdfa, #ecfdf5)", border: "2px solid #86efac", borderRadius: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "#0f766e", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Beta price</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f766e" }}>
                ${annual ? Math.round(monthlyTotal * 12 * 0.85) : monthlyTotal}<span style={{ fontSize: "0.85rem", fontWeight: 500 }}>/{annual ? "yr" : "mo"}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#16a34a" }}>${selected.beta}/family/mo</div>
            </div>

            <div style={{ padding: "1.25rem", background: "#fef9c3", border: "2px solid #fde68a", borderRadius: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "#b45309", fontWeight: 700, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>You save</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#b45309" }}>
                ${annual ? Math.round(selected.regular * 12 * 0.85) - Math.round(monthlyTotal * 12 * 0.85) : selected.regular * selectedFamilies - monthlyTotal}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#92400e" }}>per {annual ? "year" : "month"}</div>
            </div>
          </div>

          <div style={{ padding: "0.75rem 1rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "0.75rem", fontSize: "0.82rem", color: "#92400e", marginBottom: "1.5rem" }}>
            <strong>Beta pricing lock-in:</strong> Sign up today and pay this rate forever, even after launch pricing increases.
            {selected.spotsLeft !== null && <strong> Only {selected.spotsLeft} spots left at this price.</strong>}
          </div>

          <Link
            href="/auth/signup"
            style={{ display: "block", textAlign: "center", padding: "0.9rem", background: "#0f766e", color: "#fff", borderRadius: "0.875rem", fontWeight: 800, fontSize: "1rem", textDecoration: "none" }}
          >
            Start Neighborhood Bundle →
          </Link>
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#78716c", marginTop: "0.5rem" }}>No credit card required to start. 14-day free trial included.</p>
        </div>
      </div>

      {/* Features */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Bundle Features</div>
        <h2 className="h2 mb-6">Everything Included</h2>
        <div className="card p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BUNDLE_FEATURES.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.88rem", color: "#44403c" }}>
                <span style={{ color: "#0f766e", fontWeight: 700, flexShrink: 0, marginTop: "0.05rem" }}>✓</span>
                {f}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "0.875rem", fontSize: "0.85rem", color: "#0f766e" }}>
            All features from the Power Seller plan included for every family, at the bundle rate.
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Success Stories</div>
        <h2 className="h2 mb-6">Neighbors Selling Together</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.15rem" }}>
                  {"★★★★★".split("").map((s, i) => <span key={i} style={{ color: "#f59e0b", fontSize: "1rem" }}>{s}</span>)}
                </div>
                <span style={{ background: "#f0fdfa", color: "#0f766e", fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", border: "1px solid #99f6e4" }}>
                  {t.value}
                </span>
              </div>
              <blockquote style={{ fontSize: "0.92rem", color: "#44403c", lineHeight: 1.7, fontStyle: "italic", marginBottom: "0.75rem" }}>
                "{t.quote}"
              </blockquote>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1c1917" }}>— {t.name}</div>
              <div style={{ fontSize: "0.78rem", color: "#78716c" }}>{t.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)", borderRadius: "1.5rem", padding: "3rem", textAlign: "center", color: "#fff" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          Ready to sell together?
        </h2>
        <p style={{ color: "var(--text-primary)", marginBottom: "1.5rem", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
          Start a neighborhood bundle today. Invite your neighbors and everyone saves. No commitment required.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth/signup"
            style={{ background: "#fff", color: "#0f766e", padding: "0.85rem 2rem", borderRadius: "9999px", fontWeight: 800, textDecoration: "none", fontSize: "0.95rem" }}>
            Start Bundle Free
          </Link>
          <a href="mailto:support@legacy-loop.com"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-primary)", padding: "0.85rem 2rem", borderRadius: "9999px", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem", border: "1px solid var(--border-default)" }}>
            Email Us About Your Group
          </a>
        </div>
      </div>
    </div>
  );
}
