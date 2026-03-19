"use client";

import { useState } from "react";
import { DIGITAL_TIERS } from "@/lib/pricing/constants";
import { TIERS, WHITE_GLOVE, NEIGHBORHOOD_BUNDLE, PROCESSING_FEE, BOT_COSTS, PLANS, TIER, TIER_KEY_TO_NUMBER } from "@/lib/constants/pricing";
import CancelFlowModal from "@/app/components/billing/CancelFlowModal";
import UpgradeFlowModal from "@/app/components/billing/UpgradeFlowModal";

const TIER_NAMES: Record<string, string> = {
  FREE: PLANS.FREE.name,
  STARTER: PLANS.DIY_SELLER.name,
  PLUS: PLANS.POWER_SELLER.name,
  PRO: PLANS.ESTATE_MANAGER.name,
};

const TIER_KEYS = ["FREE", "STARTER", "PLUS", "PRO"];

function getTierPrice(key: string): number {
  return DIGITAL_TIERS[key]?.monthlyPrice ?? 0;
}

function getPreLaunchPrice(key: string): number | null {
  return DIGITAL_TIERS[key]?.preLaunchMonthly ?? null;
}

function getTierFeatures(key: string): string[] {
  return DIGITAL_TIERS[key]?.features ?? [];
}

function getTierCommission(key: string): number {
  return DIGITAL_TIERS[key]?.commission ?? 0;
}

type Subscription = {
  id: string;
  tier: string;
  price: number;
  status: string;
  billingPeriod: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
} | null;

type Change = {
  id: string;
  fromTier: string | null;
  toTier: string | null;
  changeType: string;
  amountPaid: number;
  daysUsed: number;
  daysRemaining: number;
  proratedRefund: number;
  creditIssued: number;
  refundMethod: string | null;
  reason: string | null;
  refundStatus: string;
  changeDate: string;
};

type Props = {
  subscription: Subscription;
  changes: Change[];
};

/* ═══════════════════════════════════════════════════════════════════════════
   Shared UI helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
      <div style={{ width: 48, height: 3, background: "linear-gradient(90deg, #00bcd4, #009688)", borderRadius: 2, margin: "0 auto 1rem auto" }} />
      <div style={{ color: "var(--text-primary)", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>{subtitle}</div>
    </div>
  );
}

function FeatureTable({ headers, rows }: { headers: string[]; rows: { label: string; values: string[] }[] }) {
  return (
    <div style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr style={{ background: "rgba(0,188,212,0.08)" }}>
              {headers.map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? "left" : "center", padding: "0.75rem 1rem", color: "#00bcd4", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.label} style={{ background: ri % 2 === 0 ? "var(--bg-card)" : "transparent" }}>
                <td style={{ padding: "0.65rem 1rem", color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>{row.label}</td>
                {row.values.map((v, vi) => (
                  <td key={vi} style={{ padding: "0.65rem 1rem", textAlign: "center", color: v === "\u2014" ? "var(--text-muted)" : v === "\u2713" ? "#00bcd4" : "var(--text-secondary)", fontWeight: v === "\u2713" ? 700 : 400, fontSize: "0.875rem" }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WHITE-GLOVE data from constants
   ═══════════════════════════════════════════════════════════════════════════ */

const WG_CARDS: { key: string; accent: string; borderColor: string; bg: string; cta: string; features: string[] }[] = [
  {
    key: "essentials",
    accent: "#10b981",
    borderColor: "rgba(16,185,129,0.25)",
    bg: "var(--bg-card)",
    cta: "Get Started",
    features: [
      "Item photography",
      "AI listing creation",
      "Buyer outreach",
      "Shipping coordination",
      "Donation management",
    ],
  },
  {
    key: "professional",
    accent: "#00bcd4",
    borderColor: "rgba(0,188,212,0.35)",
    bg: "rgba(0,188,212,0.04)",
    cta: "Request Consultation",
    features: [
      "Everything in Essentials",
      "Buyer negotiation",
      "Premium listing placement",
      "Dedicated estate manager",
      "Full reporting",
    ],
  },
  {
    key: "legacy",
    accent: "#f59e0b",
    borderColor: "rgba(245,158,11,0.25)",
    bg: "var(--bg-card)",
    cta: "Get Started",
    features: [
      "Everything in Professional",
      "White-glove concierge",
      "Family coordination tools",
      "Archive and documentation",
      "Priority support",
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SubscriptionClient({ subscription, changes }: Props) {
  const [tab, setTab] = useState<"plan" | "history">("plan");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<string>("PLUS");
  const [activeSlide, setActiveSlide] = useState(0);

  const tier = subscription?.tier || "FREE";
  // BUG 1 FIX: Use canonical tier pricing, not stale DB value
  const normalPrice = getTierPrice(tier);
  const preLaunchPrice = getPreLaunchPrice(tier);
  const displayPrice = preLaunchPrice ?? normalPrice;
  const periodEnd = subscription ? new Date(subscription.currentPeriodEnd) : null;
  const periodStart = subscription ? new Date(subscription.currentPeriodStart) : null;

  const upgradePrice = getPreLaunchPrice(upgradeTarget) ?? getTierPrice(upgradeTarget);

  const tierNumber = TIER_KEY_TO_NUMBER[tier] ?? 1;
  // BUG 2 FIX: Index-based tier comparison instead of price-based
  const currentTierIndex = TIER_KEYS.indexOf(tier);

  // BUG 5 FIX: Determine subscription state
  const isActive = subscription?.status === "ACTIVE";
  const isCancelled = subscription?.status === "CANCELLED";
  const needsFreshSubscription = isCancelled || !subscription;

  /* ─── Bot access table data ─── */
  const botTableRows: { label: string; values: string[] }[] = [
    { label: "AI Item Analysis", values: ["Limited", "\u2713", "\u2713", "\u2713"] },
    { label: "PriceBot", values: ["\u2014", "\u2713", "\u2713", "\u2713"] },
    { label: "PhotoBot", values: ["\u2014", "\u2713", "\u2713", "\u2713"] },
    { label: "ReconBot", values: ["\u2014", "\u2014", "\u2713", "\u2713"] },
    { label: "AntiqueBot", values: ["\u2014", "\u2014", "\u2713", "\u2713"] },
    { label: "CollectorBot", values: ["\u2014", "\u2014", "\u2713", "\u2713"] },
    { label: "CarBot", values: ["\u2014", "\u2014", "\u2014", "\u2713"] },
    { label: "MegaBot (credits)", values: ["\u2014", "\u2713", "\u2713", "\u2713"] },
    { label: "Active Items", values: [String(TIERS.free.items), String(TIERS.starter.items), String(TIERS.plus.items), "Unlimited"] },
    { label: "Photos Per Item", values: [String(TIERS.free.photos), String(TIERS.starter.photos), String(TIERS.plus.photos), String(TIERS.pro.photos)] },
    { label: "Commission", values: [`${TIERS.free.commissionPct}%`, `${TIERS.starter.commissionPct}%`, `${TIERS.plus.commissionPct}%`, `${TIERS.pro.commissionPct}%`] },
    { label: "Garage Sale Network", values: ["Browse", "\u2713", "\u2713", "\u2713"] },
    { label: "Neighborhood Sale Events", values: ["\u2014", "\u2713", "\u2713", "\u2713"] },
    { label: "Estate Sale Events", values: ["\u2014", "\u2014", "\u2014", "\u2713"] },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "2rem 1rem" }}>

      {/* ═══════════════════════════════════════════════════════════════════════
         SECTION 1 — SUBSCRIPTION PLANS
         ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1100, margin: "0 auto 4rem auto" }}>
        <SectionHeader title="Subscription Plans" subtitle="Manage your plan, upgrade, or view your billing history." />

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "2rem" }}>
          {(["plan", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "0.4rem 1.25rem",
                borderRadius: 20,
                border: tab === t ? "1px solid rgba(0,188,212,0.3)" : "1px solid var(--border-default)",
                background: tab === t ? "rgba(0,188,212,0.15)" : "transparent",
                color: tab === t ? "#00bcd4" : "var(--text-muted)",
                fontWeight: tab === t ? 600 : 500,
                cursor: "pointer",
                fontSize: "0.85rem",
                transition: "all 0.2s",
              }}
            >
              {t === "plan" ? "Current Plan" : "Change History"}
            </button>
          ))}
        </div>

        {tab === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* ── Current plan card ── */}
            <div style={{ background: "var(--ghost-bg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: 20, padding: "2rem", position: "relative", overflow: "hidden" }}>
              {/* Decorative glow */}
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "radial-gradient(circle, rgba(0,188,212,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", position: "relative" }}>
                <div>
                  <div style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Current Plan</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "0.25rem" }}>
                    {TIER_NAMES[tier] || tier}
                  </div>
                  {preLaunchPrice != null && preLaunchPrice !== normalPrice ? (
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                      <span style={{ color: "#00bcd4", fontWeight: 700, fontSize: "2rem" }}>
                        ${preLaunchPrice}<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "1rem", textDecoration: "line-through" }}>
                        ${normalPrice}/mo
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: "#00bcd4", fontWeight: 700, fontSize: "2rem" }}>
                      ${normalPrice}<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
                    </div>
                  )}
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                    {getTierCommission(tier)}% commission on sales
                  </div>
                  {periodEnd && (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.25rem" }}>
                      Next billing: {periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                  <div style={{ marginTop: "0.75rem" }}>
                    <span style={{
                      display: "inline-block",
                      background: subscription?.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : subscription ? "rgba(239,68,68,0.15)" : "var(--text-muted)",
                      color: subscription?.status === "ACTIVE" ? "#10b981" : subscription ? "#ef4444" : "var(--text-muted)",
                      border: subscription?.status === "ACTIVE" ? "1px solid rgba(16,185,129,0.3)" : subscription ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border-default)",
                      borderRadius: 20,
                      padding: "0.25rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}>
                      {subscription?.status || "No subscription"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {isActive && tier !== "PRO" && (
                    <button
                      onClick={() => {
                        const idx = TIER_KEYS.indexOf(tier);
                        setUpgradeTarget(TIER_KEYS[Math.min(idx + 1, TIER_KEYS.length - 1)]);
                        setShowUpgradeModal(true);
                      }}
                      style={{ background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none", borderRadius: 12, padding: "0.75rem 1.75rem", color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,188,212,0.3)" }}
                    >
                      Upgrade Plan
                    </button>
                  )}
                  {isActive && displayPrice > 0 && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "0.75rem 1.75rem", color: "rgba(239,68,68,0.7)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
                    >
                      Cancel subscription
                    </button>
                  )}
                  {isCancelled && (
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 220 }}>
                      Your plan has been cancelled. Choose a new plan below to reactivate.
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-default)", position: "relative" }}>
                <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>{"What's included"}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {getTierFeatures(tier).map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      <span style={{ color: "#00bcd4", fontWeight: 700, flexShrink: 0 }}>{"\u2713"}</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Founders banner ── */}
            <div style={{ background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.3)", borderRadius: 12, padding: "0.75rem 1.5rem", textAlign: "center", color: "#00bcd4", fontWeight: 600, fontSize: "0.9rem" }}>
              {"\uD83D\uDE80"} Founders Early Access — Pre-launch pricing locked in forever for founding members. Normal prices shown crossed out.
            </div>

            {/* ── Choose a Plan (cancelled/no subscription) ── */}
            {needsFreshSubscription && (
              <div>
                <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Choose a Plan</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
                  {TIER_KEYS.map((t) => {
                    const tp = getTierPrice(t);
                    const pl = getPreLaunchPrice(t);
                    const isFree = tp === 0;
                    return (
                      <div
                        key={t}
                        style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                      >
                        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>{TIER_NAMES[t]}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                          {pl != null && pl !== tp ? (
                            <>
                              <span style={{ color: "#00bcd4", fontWeight: 800, fontSize: "1.75rem" }}>${pl}/mo</span>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "line-through" }}>${tp}/mo</span>
                            </>
                          ) : (
                            <span style={{ color: "#00bcd4", fontWeight: 800, fontSize: "1.75rem" }}>${tp}/mo</span>
                          )}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                          {getTierCommission(t)}% commission
                        </div>
                        <button
                          onClick={() => {
                            if (isFree) {
                              fetch("/api/billing/downgrade", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ newTier: 1 }),
                              }).then(() => window.location.reload());
                            } else {
                              setUpgradeTarget(t);
                              setShowUpgradeModal(true);
                            }
                          }}
                          style={{
                            background: isFree ? "transparent" : "linear-gradient(135deg, #00bcd4, #009688)",
                            border: isFree ? "1px solid rgba(0,188,212,0.4)" : "none",
                            borderRadius: 10,
                            padding: "0.65rem 1.25rem",
                            color: isFree ? "#00bcd4" : "white",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            marginTop: "auto",
                            boxShadow: isFree ? "none" : "0 2px 12px rgba(0,188,212,0.2)",
                          }}
                        >
                          {isFree ? "Continue on Free" : `Subscribe to ${TIER_NAMES[t]}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Available upgrades ── */}
            {isActive && tier !== "PRO" && (
              <div>
                <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Available Upgrades</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
                  {TIER_KEYS.filter((t) => TIER_KEYS.indexOf(t) > currentTierIndex).map((t) => {
                    const tierPrice = getTierPrice(t);
                    const preLaunch = getPreLaunchPrice(t);
                    return (
                      <div
                        key={t}
                        style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                      >
                        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>{TIER_NAMES[t]}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                          {preLaunch != null && (
                            <span style={{ color: "#00bcd4", fontWeight: 800, fontSize: "1.75rem" }}>${preLaunch}/mo</span>
                          )}
                          <span style={{
                            color: preLaunch != null ? "var(--text-muted)" : "#00bcd4",
                            fontWeight: preLaunch != null ? 500 : 800,
                            fontSize: preLaunch != null ? "0.9rem" : "1.75rem",
                            textDecoration: preLaunch != null ? "line-through" : "none",
                            verticalAlign: "middle",
                          }}>
                            ${tierPrice}/mo
                          </span>
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                          {getTierCommission(t)}% commission
                        </div>
                        <button
                          onClick={() => { setUpgradeTarget(t); setShowUpgradeModal(true); }}
                          style={{ background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none", borderRadius: 10, padding: "0.65rem 1.25rem", color: "white", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", marginTop: "auto", boxShadow: "0 2px 12px rgba(0,188,212,0.2)" }}
                        >
                          Upgrade to {TIER_NAMES[t]}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Available downgrades ── */}
            {isActive && tier !== "FREE" && (
              <div>
                <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Available Downgrades</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
                  {TIER_KEYS.filter((t) => TIER_KEYS.indexOf(t) < currentTierIndex).map((t) => {
                    const tierPrice = getTierPrice(t);
                    const preLaunch = getPreLaunchPrice(t);
                    return (
                      <div
                        key={t}
                        style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--border-default)", borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
                      >
                        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>{TIER_NAMES[t]}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                          {preLaunch != null && preLaunch !== tierPrice ? (
                            <>
                              <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem" }}>${preLaunch}/mo</span>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "line-through" }}>${tierPrice}/mo</span>
                            </>
                          ) : (
                            <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem" }}>${tierPrice}/mo</span>
                          )}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                          {getTierCommission(t)}% commission
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                          You{"'"}ll keep access until end of billing period
                        </div>
                        <button
                          onClick={async () => {
                            const res = await fetch("/api/billing/downgrade", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ newTier: TIER_KEY_TO_NUMBER[t.toLowerCase()] ?? 1 }),
                            });
                            if (res.ok) {
                              window.location.reload();
                            } else {
                              const err = await res.json().catch(() => ({}));
                              alert((err as { error?: string }).error || "Downgrade failed");
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(0,188,212,0.4)",
                            borderRadius: 10,
                            padding: "0.65rem 1.25rem",
                            color: "#00bcd4",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            marginTop: "auto",
                          }}
                        >
                          Downgrade to {TIER_NAMES[t]}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Bot access table ── */}
            <div>
              <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>{"What's included by plan"}</div>
              <FeatureTable
                headers={["Feature", "Free", "DIY Seller", "Power Seller", "Estate Manager"]}
                rows={botTableRows}
              />
              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", marginTop: "1rem" }}>
                Processing fee ({PROCESSING_FEE.display}) included in listed prices. MegaBot requires AI credits ({BOT_COSTS.megabot.credits} credits per run). All plans include free item identification.
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Change History</div>
            {changes.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No subscription changes yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(0,188,212,0.15)" }}>
                      {["Date", "Type", "From \u2192 To", "Refund", "Credits", "Method"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "#00bcd4", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((c, ci) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--border-default)", background: ci % 2 === 0 ? "var(--bg-card)" : "transparent" }}>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-primary)" }}>{new Date(c.changeDate).toLocaleDateString()}</td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>
                          <span style={{
                            padding: "0.15rem 0.5rem", borderRadius: 20,
                            background: c.changeType === "cancel" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                            color: c.changeType === "cancel" ? "#ef4444" : "#10b981",
                            fontSize: "0.75rem", fontWeight: 700,
                          }}>
                            {c.changeType}
                          </span>
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)" }}>{c.fromTier || "\u2014"} {"\u2192"} {c.toTier || "\u2014"}</td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-primary)" }}>${c.proratedRefund.toFixed(2)}</td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-primary)" }}>{c.creditIssued > 0 ? `${Math.round(c.creditIssued)} credits` : "\u2014"}</td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-secondary)" }}>{c.refundMethod || "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         SECTION 2 — WHITE-GLOVE ESTATE SERVICES (Sliding Display)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1100, margin: "0 auto 4rem auto" }}>
        <SectionHeader title="White-Glove Estate Services" subtitle="Full-service estate liquidation. We handle photography, listing, selling, shipping, and donation management." />

        {/* Pre-launch banner */}
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "0.75rem 1.5rem", textAlign: "center", marginBottom: "2rem", color: "#f59e0b", fontWeight: 600, fontSize: "0.9rem" }}>
          Pre-Launch Estate Pricing Active — Founding clients receive discounted rates locked in at launch price.
        </div>

        {/* Tab selector */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 28, padding: "4px" }}>
            {["Estate Sale Services", "Neighborhood Bundle"].map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveSlide(i)}
                style={{
                  padding: "0.5rem 1.5rem",
                  borderRadius: 24,
                  border: "none",
                  background: activeSlide === i ? "rgba(0,188,212,0.15)" : "transparent",
                  color: activeSlide === i ? "#00bcd4" : "var(--text-muted)",
                  fontWeight: activeSlide === i ? 700 : 500,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Slider container */}
        <div style={{ position: "relative", overflow: "hidden", paddingTop: "1.25rem" }}>
          {/* Slide 0 — Estate Sale Services */}
          <div style={{
            opacity: activeSlide === 0 ? 1 : 0,
            transform: activeSlide === 0 ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: activeSlide === 0 ? "auto" : "none",
            position: activeSlide === 0 ? "relative" : "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {WG_CARDS.map((card) => {
                const wg = WHITE_GLOVE[card.key];
                if (!wg) return null;
                const isRecommended = wg.recommended === true;
                return (
                  <div key={card.key} style={{ background: card.bg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${card.borderColor}`, borderRadius: 16, padding: isRecommended ? "2.25rem 1.75rem 1.75rem 1.75rem" : "1.75rem", position: "relative", overflow: "visible" }}>
                    {isRecommended && (
                      <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "white", borderRadius: 20, padding: "0.3rem 1.25rem", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.06em", boxShadow: "0 2px 12px rgba(0,188,212,0.4)", zIndex: 10 }}>RECOMMENDED</div>
                    )}
                    <div style={{ borderLeft: `3px solid ${card.accent}`, paddingLeft: "1rem", marginBottom: "1rem" }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>{wg.name}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.25rem" }}>
                        <span style={{ color: card.accent, fontWeight: 800, fontSize: "2rem" }}>${wg.preLaunch.toLocaleString()}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "line-through", marginLeft: "0.5rem", verticalAlign: "middle" }}>${wg.price.toLocaleString()}</span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "1rem" }}>{wg.commissionPct}% commission</div>
                    </div>

                    {card.features.map((f) => (
                      <div key={f} style={{ display: "flex", gap: "0.4rem", color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                        <span style={{ color: card.accent, flexShrink: 0 }}>{"\u2713"}</span> {f}
                      </div>
                    ))}

                    <button style={{ background: "transparent", border: `1px solid ${card.accent}`, borderRadius: 10, padding: "0.65rem 1.5rem", color: card.accent, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", width: "100%", marginTop: "1.25rem" }}>
                      {card.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slide 1 — Neighborhood Bundle */}
          <div style={{
            opacity: activeSlide === 1 ? 1 : 0,
            transform: activeSlide === 1 ? "translateX(0)" : "translateX(30px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: activeSlide === 1 ? "auto" : "none",
            position: activeSlide === 1 ? "relative" : "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <div style={{ background: "rgba(0,188,212,0.04)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,188,212,0.35)", borderRadius: 20, padding: "2.5rem", position: "relative", overflow: "hidden" }}>
                {/* Decorative glow */}
                <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(0,188,212,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ position: "relative" }}>
                  <div style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Community Sale Program</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>{NEIGHBORHOOD_BUNDLE.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "#00bcd4", fontWeight: 800, fontSize: "2.5rem" }}>${NEIGHBORHOOD_BUNDLE.preLaunch}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "1rem", textDecoration: "line-through" }}>${NEIGHBORHOOD_BUNDLE.price}</span>
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>{NEIGHBORHOOD_BUNDLE.commissionPct}% commission on sales</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
                    {NEIGHBORHOOD_BUNDLE.minFamilies}–{NEIGHBORHOOD_BUNDLE.maxFamilies} families per bundle
                  </div>

                  {/* Features 2-column grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem", marginBottom: "1.5rem" }}>
                    {NEIGHBORHOOD_BUNDLE.includes.map((feature: string) => (
                      <div key={feature} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                        <span style={{ color: "#00bcd4", fontWeight: 700, flexShrink: 0, marginTop: "0.05rem" }}>{"\u2713"}</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Additional family pricing */}
                  <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1.5rem" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      Additional families: <span style={{ color: "#00bcd4", fontWeight: 700 }}>${NEIGHBORHOOD_BUNDLE.preLaunchAdditional}/family</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", textDecoration: "line-through", marginLeft: "0.4rem" }}>${NEIGHBORHOOD_BUNDLE.additionalFamily}</span>
                    </div>
                  </div>

                  <button style={{ background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none", borderRadius: 12, padding: "0.85rem 2rem", color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", width: "100%", boxShadow: "0 4px 20px rgba(0,188,212,0.3)" }}>
                    Start a Neighborhood Bundle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          {[0, 1].map((i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                width: activeSlide === i ? 24 : 8,
                height: 8,
                borderRadius: activeSlide === i ? 4 : 4,
                background: activeSlide === i ? "#00bcd4" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                padding: 0,
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", marginTop: "1.5rem" }}>
          {"Traditional estate companies charge 35\u201350% commission with no base fee. LegacyLoop\u2019s transparent pricing puts more money back in your family\u2019s hands."}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         MODALS — Cancel + Upgrade (all logic preserved exactly)
         ═══════════════════════════════════════════════════════════════════════ */}

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelFlowModal
          planName={TIER_NAMES[tier] || tier}
          currentTier={tierNumber}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => window.location.reload()}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeFlowModal
          currentTier={tierNumber}
          newTier={TIER_KEY_TO_NUMBER[upgradeTarget] ?? 1}
          newPlanName={TIER_NAMES[upgradeTarget] || upgradeTarget}
          newPlanPrice={upgradePrice}
          onClose={() => setShowUpgradeModal(false)}
          onUpgraded={() => window.location.reload()}
        />
      )}
    </div>
  );
}
