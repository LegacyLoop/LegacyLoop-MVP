"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DIGITAL_TIERS } from "@/lib/pricing/constants";
import { usePurchaseParams } from "@/lib/hooks/usePurchaseParams";
import { TIERS, WHITE_GLOVE, NEIGHBORHOOD_BUNDLE, PROCESSING_FEE, BOT_COSTS, PLANS, TIER, TIER_KEY_TO_NUMBER } from "@/lib/constants/pricing";
import CancelFlowModal from "@/app/components/billing/CancelFlowModal";
import UpgradeFlowModal from "@/app/components/billing/UpgradeFlowModal";
import WhiteGloveBookingModal from "@/app/components/billing/WhiteGloveBookingModal";

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

function getAnnualPrice(key: string): number {
  return DIGITAL_TIERS[key]?.annualPrice ?? 0;
}

function getPreLaunchAnnualPrice(key: string): number | null {
  return DIGITAL_TIERS[key]?.preLaunchAnnual ?? null;
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
  itemCount?: number;
  projectCount?: number;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Shared UI helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative", padding: "2rem 0 0" }}>
      {/* Atmospheric glow — wider, more prominent */}
      <div style={{ position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)", width: "500px", height: "250px", background: "radial-gradient(ellipse 70% 55% at 50% 50%, var(--accent-dim), transparent 70%)", pointerEvents: "none" }} />

      {/* Accent bar — wider with glow */}
      <div style={{ width: 64, height: 4, background: "linear-gradient(90deg, var(--accent), var(--accent-deep))", borderRadius: 2, margin: "0 auto 1.25rem auto", boxShadow: "0 2px 12px var(--accent-border)" }} />

      {/* Title — larger, bolder gradient */}
      <h1 style={{
        fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15,
        backgroundImage: "linear-gradient(135deg, var(--text-primary) 30%, var(--accent) 100%)",
        backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        marginBottom: "0.65rem", position: "relative",
      }}>{title}</h1>

      {/* Subtitle — refined typography */}
      <p style={{
        color: "var(--text-secondary)", fontSize: "1.05rem",
        letterSpacing: "0.015em", fontWeight: 400, lineHeight: 1.5,
        maxWidth: "480px", margin: "0 auto",
        position: "relative",
      }}>{subtitle}</p>
    </div>
  );
}

function FeatureTable({ headers, rows }: { headers: string[]; rows: { label: string; values: string[] }[] }) {
  return (
    <div style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--accent-dim)", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, var(--accent-dim), var(--accent-dim))" }}>
              {headers.map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? "left" : "center", padding: "0.75rem 1rem", color: "var(--accent)", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.label} style={{ background: ri % 2 === 0 ? "var(--bg-card)" : "transparent" }}>
                <td style={{ padding: "0.65rem 1rem", color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>{row.label}</td>
                {row.values.map((v, vi) => (
                  <td key={vi} style={{ padding: "0.65rem 1rem", textAlign: "center", color: v === "\u2014" ? "var(--text-muted)" : v === "\u2713" ? "var(--accent)" : "var(--text-secondary)", fontWeight: v === "\u2713" ? 700 : 400, fontSize: "0.875rem" }}>{v}</td>
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
    accent: "var(--accent)",
    borderColor: "var(--accent-glow)",
    bg: "var(--accent-dim)",
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

export default function SubscriptionClient({ subscription, changes, itemCount = 0, projectCount = 0 }: Props) {
  const [tab, setTab] = useState<"plan" | "history">("plan");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    subscription?.billingPeriod === "annual" ? "annual" : "monthly"
  );
  const [confirmingDowngrade, setConfirmingDowngrade] = useState<number | null>(null);
  const [downgradeError, setDowngradeError] = useState<string | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<string>("PLUS");
  const [activeSlide, setActiveSlide] = useState(0);
  const [wgBookingKey, setWgBookingKey] = useState<string | null>(null);

  // URL param purchase intent (landing site → app → checkout)
  const purchaseParams = usePurchaseParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!purchaseParams.hasIntent) return;
    const t = setTimeout(() => {
      // Subscription upgrade
      if (purchaseParams.tier && !purchaseParams.product) {
        const tierMap: Record<string, string> = { diy: "STARTER", power: "PLUS", estate: "PRO" };
        const target = tierMap[purchaseParams.tier] ?? purchaseParams.tier.toUpperCase();
        if (purchaseParams.billing) setBillingPeriod(purchaseParams.billing);
        if (purchaseParams.upgrade || TIER_KEYS.indexOf(target) > TIER_KEYS.indexOf(subscription?.tier || "FREE")) {
          setUpgradeTarget(target);
          setShowUpgradeModal(true);
        }
      }

      // White Glove booking
      if (purchaseParams.product === "white_glove" && purchaseParams.tier) {
        setWgBookingKey(purchaseParams.tier);
        setActiveSlide(0);
      }

      // Estate Care — switch to estate care tab
      if (purchaseParams.product === "estate_care") {
        setActiveSlide(1);
      }

      // Clean URL params after consuming
      router.replace(pathname, { scroll: false });
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tier = subscription?.tier || "FREE";
  const isAnnualSub = subscription?.billingPeriod === "annual";
  // BUG 1 FIX: Use canonical tier pricing, billing-period aware
  const normalPrice = isAnnualSub ? getAnnualPrice(tier) : getTierPrice(tier);
  const preLaunchPrice = isAnnualSub ? getPreLaunchAnnualPrice(tier) : getPreLaunchPrice(tier);
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
    { label: "CollectiblesBot", values: ["\u2014", "\u2014", "\u2713", "\u2713"] },
    { label: "CarBot", values: ["\u2014", "\u2014", "\u2014", "\u2713"] },
    { label: "MegaBot", values: ["\u2014", "\u2713", "\u2713", "\u2713"] },
    { label: "ListBot", values: ["\u2014", "\u2713", "\u2713", "\u2713"] },
    { label: "BuyerBot", values: ["\u2014", "\u2713", "\u2713", "\u2713"] },
    { label: "VideoBot Standard", values: ["\u2014", "8 cr", "8 cr", "8 cr"] },
    { label: "VideoBot Pro", values: ["\u2014", "\u2014", "15 cr", "15 cr"] },
    { label: "VideoBot MegaBot", values: ["\u2014", "\u2014", "\u2014", "25 cr"] },
    { label: "Monthly Credits", values: ["\u2014", "20/mo", "50/mo", "100/mo"] },
    { label: "Intel: Market + Ready", values: ["\u2014", "\u2713", "\u2713", "\u2713"] },
    { label: "Intel: Sell + Alerts + Action", values: ["\u2014", "\u2014", "\u2713", "\u2713"] },
    { label: "Ask Claude", values: ["\u2014", "0.25 cr/q", "0.25 cr/q", "0.25 cr/q"] },
    { label: "Priority Bot Queue", values: ["\u2014", "\u2014", "\u2014", "Exclusive"] },
    { label: "High Value Alert ($500+)", values: ["\u2713", "\u2713", "\u2713", "\u2713"] },
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
                padding: "0.65rem 1.75rem",
                borderRadius: 12,
                border: tab === t ? "1px solid var(--accent-border)" : "1px solid transparent",
                background: tab === t ? "linear-gradient(135deg, var(--accent-dim), var(--accent-dim))" : "transparent",
                color: tab === t ? "var(--accent)" : "var(--text-muted)",
                fontWeight: tab === t ? 700 : 500,
                cursor: "pointer",
                fontSize: "0.88rem",
                transition: "all 0.2s ease",
                letterSpacing: "0.02em",
                boxShadow: tab === t ? "0 2px 12px var(--accent-dim)" : "none",
              }}
            >
              {t === "plan" ? "Current Plan" : "Change History"}
            </button>
          ))}
        </div>

        {tab === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* ── Current plan card ── */}
            <div style={{
              background: "linear-gradient(135deg, var(--bg-card), var(--accent-dim))",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              border: "1px solid var(--accent-border)", borderRadius: 24,
              padding: "2.25rem", position: "relative", overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}>
              {/* Decorative glows */}
              <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, background: "radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -30, left: -30, width: 140, height: 140, background: "radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)", pointerEvents: "none" }} />

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap", position: "relative" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Tier icon + label row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "linear-gradient(135deg, var(--accent-dim), var(--accent-dim))",
                      border: "1px solid var(--accent-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.4rem", flexShrink: 0,
                    }}>
                      {tier === "PRO" ? "👑" : tier === "PLUS" ? "⚡" : tier === "STARTER" ? "🚀" : "🆓"}
                    </div>
                    <div>
                      <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>Current Plan</div>
                      <div style={{
                        fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.02em",
                        backgroundImage: "linear-gradient(135deg, var(--text-primary), var(--accent))",
                        backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      }}>
                        {TIER_NAMES[tier] || tier}
                      </div>
                    </div>
                  </div>

                  {/* Price display */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    {preLaunchPrice != null && preLaunchPrice !== normalPrice ? (
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em" }}>
                          ${preLaunchPrice}
                        </span>
                        <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>{isAnnualSub ? "/yr" : "/mo"}</span>
                        <span style={{ fontSize: "1rem", color: "var(--text-muted)", textDecoration: "line-through", marginLeft: "0.25rem" }}>
                          ${normalPrice}{isAnnualSub ? "/yr" : "/mo"}
                        </span>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 9999,
                          background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)",
                        }}>
                          {Math.round((1 - preLaunchPrice / normalPrice) * 100)}% OFF
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                        <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em" }}>${normalPrice}</span>
                        <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-muted)" }}>{isAnnualSub ? "/yr" : "/mo"}</span>
                      </div>
                    )}
                    {isAnnualSub && displayPrice > 0 && (
                      <div style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600, marginTop: "-0.25rem" }}>
                        ${Math.round(displayPrice / 12)}/mo effective
                      </div>
                    )}
                  </div>

                  {/* Info pills row */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      padding: "0.25rem 0.75rem", borderRadius: 8,
                      background: "var(--accent-dim)", border: "1px solid var(--accent-dim)",
                      fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600,
                    }}>
                      💎 {getTierCommission(tier)}% commission
                    </span>
                    {periodEnd && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.25rem 0.75rem", borderRadius: 8,
                        background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                        fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500,
                      }}>
                        📅 Next billing: {periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "0.25rem 0.75rem", borderRadius: 8,
                      background: subscription?.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : subscription ? "rgba(239,68,68,0.1)" : "var(--ghost-bg)",
                      color: subscription?.status === "ACTIVE" ? "#10b981" : subscription ? "#ef4444" : "var(--text-muted)",
                      border: subscription?.status === "ACTIVE" ? "1px solid rgba(16,185,129,0.2)" : subscription ? "1px solid rgba(239,68,68,0.2)" : "1px solid var(--border-default)",
                      fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em",
                    }}>
                      {subscription?.status === "ACTIVE" ? "● ACTIVE" : subscription?.status || "No subscription"}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                  {isActive && tier !== "PRO" && (
                    <button
                      onClick={() => {
                        const idx = TIER_KEYS.indexOf(tier);
                        setUpgradeTarget(TIER_KEYS[Math.min(idx + 1, TIER_KEYS.length - 1)]);
                        setShowUpgradeModal(true);
                      }}
                      style={{
                        background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", border: "none", borderRadius: 14,
                        padding: "0.8rem 2rem", color: "white", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                        boxShadow: "0 4px 16px var(--accent-border)", transition: "all 0.2s ease", letterSpacing: "0.01em",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.boxShadow = "0 6px 24px var(--accent-glow)"; (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = "0 4px 16px var(--accent-border)"; (e.target as HTMLElement).style.transform = "translateY(0)"; }}
                    >
                      ⬆ Upgrade Plan
                    </button>
                  )}
                  {isActive && displayPrice > 0 && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      style={{
                        background: "transparent", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14,
                        padding: "0.75rem 1.75rem", color: "rgba(239,68,68,0.6)", fontWeight: 500, fontSize: "0.82rem",
                        cursor: "pointer", transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(239,68,68,0.4)"; (e.target as HTMLElement).style.color = "#ef4444"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(239,68,68,0.2)"; (e.target as HTMLElement).style.color = "rgba(239,68,68,0.6)"; }}
                    >
                      Cancel subscription
                    </button>
                  )}
                  {isCancelled && (
                    <div style={{
                      fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 220,
                      padding: "0.75rem 1rem", background: "rgba(239,68,68,0.04)",
                      border: "1px solid rgba(239,68,68,0.1)", borderRadius: 12,
                    }}>
                      Your plan has been cancelled. Choose a new plan below to reactivate.
                    </div>
                  )}
                </div>
              </div>

              {/* Features — 2 column grid */}
              <div style={{
                marginTop: "1.5rem", paddingTop: "1.5rem",
                borderTop: "1px solid var(--border-default)", position: "relative",
              }}>
                <div style={{
                  color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.75rem",
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem",
                }}>{"What's included"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem" }}>
                  {getTierFeatures(tier).map((f) => (
                    <div key={f} style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      color: "var(--text-secondary)", fontSize: "0.85rem",
                      padding: "0.3rem 0",
                    }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: "var(--accent-dim)", border: "1px solid var(--accent-dim)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", color: "var(--accent)", fontWeight: 700, flexShrink: 0,
                      }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Usage Meters ── */}
            {(() => {
              const tierIdx = TIER_KEYS.indexOf(tier);
              const limits = [
                { label: "Items", current: itemCount, max: tierIdx <= 0 ? 3 : tierIdx === 1 ? 25 : tierIdx === 2 ? 100 : Infinity },
                { label: "Projects", current: projectCount, max: tierIdx <= 0 ? 0 : tierIdx === 1 ? 3 : tierIdx === 2 ? 10 : Infinity },
              ];
              return (
                <div style={{ padding: "1.25rem", background: "var(--bg-card)", backdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>📊 Usage</div>
                  {limits.map(l => {
                    const pct = l.max === Infinity ? 0 : Math.min(100, Math.round((l.current / Math.max(1, l.max)) * 100));
                    return (
                      <div key={l.label} style={{ marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                          <span style={{ color: "var(--text-secondary)" }}>{l.label}</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{l.current} of {l.max === Infinity ? "Unlimited" : l.max}</span>
                        </div>
                        {l.max !== Infinity && (
                          <div style={{ height: 8, borderRadius: 4, background: "var(--accent-dim)", overflow: "hidden", border: "1px solid var(--border-default)" }}>
                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: pct >= 90 ? "linear-gradient(90deg, #ef4444, #dc2626)" : pct >= 70 ? "linear-gradient(90deg, #eab308, #f59e0b)" : "linear-gradient(90deg, var(--accent), var(--accent-deep))", transition: "width 0.5s ease", boxShadow: pct >= 90 ? "0 0 8px rgba(239,68,68,0.4)" : pct >= 70 ? "0 0 8px rgba(234,179,8,0.3)" : "0 0 8px var(--accent-border)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── Billing Period Toggle ── */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
              <span onClick={() => setBillingPeriod("monthly")} style={{ fontSize: "0.88rem", fontWeight: billingPeriod === "monthly" ? 700 : 400, color: billingPeriod === "monthly" ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", transition: "all 0.2s" }}>Monthly</span>
              <button onClick={() => setBillingPeriod(p => p === "monthly" ? "annual" : "monthly")} style={{ width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative", background: billingPeriod === "annual" ? "linear-gradient(135deg, var(--accent), var(--accent-deep))" : "var(--border-default)", boxShadow: billingPeriod === "annual" ? "0 2px 8px var(--accent-border)" : "none", transition: "all 0.2s ease" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: billingPeriod === "annual" ? 27 : 3, transition: "left 0.2s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </button>
              <span onClick={() => setBillingPeriod("annual")} style={{ fontSize: "0.88rem", fontWeight: billingPeriod === "annual" ? 700 : 400, color: billingPeriod === "annual" ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", transition: "all 0.2s" }}>Annual</span>
              {billingPeriod === "annual" && <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px", borderRadius: 9999, background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>Save 17%</span>}
            </div>

            {/* ── Founders banner ── */}
            <div style={{ background: "linear-gradient(135deg, var(--accent-dim), var(--accent-dim))", border: "1px solid var(--accent-border)", borderRadius: 16, padding: "1rem 1.75rem", textAlign: "center", color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem", boxShadow: "0 4px 20px var(--accent-dim), inset 0 1px 0 rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
              {"\uD83D\uDE80"} Founders Early Access — Pre-launch pricing locked in forever for founding members. Normal prices shown crossed out.
            </div>

            {/* ── Choose a Plan (cancelled/no subscription) ── */}
            {needsFreshSubscription && (
              <div>
                <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Choose a Plan</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "1rem" }}>
                  {TIER_KEYS.map((t, idx) => {
                    const tp = getTierPrice(t);
                    const pl = getPreLaunchPrice(t);
                    const annualTotal = getAnnualPrice(t);
                    const plAnnualTotal = getPreLaunchAnnualPrice(t);
                    const displayPrice = billingPeriod === "annual" && annualTotal > 0
                      ? Math.round((plAnnualTotal ?? annualTotal) / 12)
                      : (pl ?? tp);
                    const displayRegular = billingPeriod === "annual" && annualTotal > 0
                      ? Math.round(annualTotal / 12)
                      : tp;
                    const isFree = tp === 0;
                    const isPopular = t === "PLUS";
                    const features = getTierFeatures(t);
                    const TIER_ICONS: Record<string, string> = { FREE: "🆓", STARTER: "🚀", PLUS: "⚡", PRO: "👑" };
                    const TIER_TAGLINES: Record<string, string> = { FREE: "Get started free", STARTER: "For active sellers", PLUS: "Most popular choice", PRO: "Full estate power" };
                    return (
                      <div
                        key={t}
                        style={{
                          background: isPopular ? "linear-gradient(135deg, var(--accent-dim), var(--accent-dim))" : "var(--bg-card)",
                          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                          border: isPopular ? "2px solid var(--accent-glow)" : "1px solid var(--border-default)",
                          borderRadius: 20, padding: "1.75rem",
                          display: "flex", flexDirection: "column", gap: "0.5rem",
                          position: "relative", overflow: "hidden",
                          transition: "transform 0.25s ease, box-shadow 0.25s ease",
                          boxShadow: isPopular
                            ? "0 8px 32px var(--accent-dim), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
                            : "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px var(--accent-border), 0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = isPopular ? "0 8px 32px var(--accent-dim), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)"; }}
                      >
                        {/* Corner glow */}
                        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: `radial-gradient(circle, ${isPopular ? "var(--accent-dim)" : "var(--accent-dim)"} 0%, transparent 70%)`, pointerEvents: "none" }} />

                        {/* Popular badge */}
                        {isPopular && (
                          <div style={{
                            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                            background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", color: "#fff",
                            padding: "0.2rem 1.25rem", borderRadius: "0 0 10px 10px",
                            fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
                            boxShadow: "0 4px 12px var(--accent-glow)",
                          }}>
                            MOST POPULAR
                          </div>
                        )}

                        {/* Icon + Name */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: isPopular ? "0.5rem" : 0 }}>
                          <span style={{ fontSize: "1.5rem" }}>{TIER_ICONS[t] || "📦"}</span>
                          <div>
                            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.01em" }}>{TIER_NAMES[t]}</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 500 }}>{TIER_TAGLINES[t]}</div>
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.5rem" }}>
                          {displayPrice !== displayRegular ? (
                            <>
                              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em" }}>${displayPrice}</span>
                              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 400 }}>/mo</span>
                              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "line-through", marginLeft: "0.25rem" }}>${displayRegular}/mo</span>
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em" }}>${displayPrice}</span>
                              <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 400 }}>/mo</span>
                            </>
                          )}
                        </div>
                        {billingPeriod === "annual" && !isFree && (
                          <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600 }}>
                            Billed ${plAnnualTotal ?? annualTotal}/yr{plAnnualTotal ? ` — save $${annualTotal - plAnnualTotal}/yr` : ""}
                          </div>
                        )}

                        {/* Commission */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.6rem", borderRadius: "6px", background: "var(--accent-dim)", border: "1px solid var(--accent-dim)", width: "fit-content", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                          {getTierCommission(t)}% commission
                        </div>

                        {/* Feature highlights */}
                        <div style={{ marginTop: "0.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          {(features || []).slice(0, 5).map((f, fi) => (
                            <div key={fi} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>✓</span>
                              {f}
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
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
                            background: isFree ? "transparent" : "linear-gradient(135deg, var(--accent), var(--accent-deep))",
                            border: isFree ? "1px solid var(--accent-border)" : "none",
                            borderRadius: 12, padding: "0.75rem 1.25rem",
                            color: isFree ? "var(--accent)" : "white",
                            fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
                            marginTop: "0.75rem",
                            boxShadow: isFree ? "none" : "0 4px 16px var(--accent-border)",
                            transition: "all 0.2s ease",
                            letterSpacing: "0.01em",
                          }}
                          onMouseEnter={(e) => { if (!isFree) { (e.target as HTMLElement).style.boxShadow = "0 6px 24px var(--accent-glow)"; (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}}
                          onMouseLeave={(e) => { if (!isFree) { (e.target as HTMLElement).style.boxShadow = "0 4px 16px var(--accent-border)"; (e.target as HTMLElement).style.transform = "translateY(0)"; }}}
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
                    const upAnnual = getAnnualPrice(t);
                    const upPlAnnual = getPreLaunchAnnualPrice(t);
                    const upDisplay = billingPeriod === "annual" && upAnnual > 0
                      ? Math.round((upPlAnnual ?? upAnnual) / 12)
                      : (preLaunch ?? tierPrice);
                    const upRegular = billingPeriod === "annual" && upAnnual > 0
                      ? Math.round(upAnnual / 12)
                      : tierPrice;
                    const features = getTierFeatures(t);
                    const TIER_ICONS: Record<string, string> = { FREE: "🆓", STARTER: "🚀", PLUS: "⚡", PRO: "👑" };
                    return (
                      <div
                        key={t}
                        style={{
                          background: "var(--bg-card)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                          border: "1px solid var(--accent-border)", borderRadius: 20, padding: "1.75rem",
                          display: "flex", flexDirection: "column", gap: "0.5rem",
                          position: "relative", overflow: "hidden",
                          transition: "transform 0.25s ease, box-shadow 0.25s ease",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px var(--accent-dim), inset 0 1px 0 rgba(255,255,255,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)"; }}
                      >
                        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)", pointerEvents: "none" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.4rem" }}>{TIER_ICONS[t] || "📦"}</span>
                          <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.01em" }}>{TIER_NAMES[t]}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.25rem" }}>
                          {upDisplay !== upRegular ? (
                            <>
                              <span style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em" }}>${upDisplay}<span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></span>
                              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "line-through" }}>${upRegular}/mo</span>
                            </>
                          ) : (
                            <span style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.03em" }}>${upDisplay}<span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></span>
                          )}
                        </div>
                        {billingPeriod === "annual" && upAnnual > 0 && (
                          <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600 }}>
                            Billed ${upPlAnnual ?? upAnnual}/yr
                          </div>
                        )}
                        <div style={{ display: "inline-flex", alignItems: "center", padding: "0.2rem 0.6rem", borderRadius: "6px", background: "var(--accent-dim)", border: "1px solid var(--accent-dim)", width: "fit-content", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                          {getTierCommission(t)}% commission
                        </div>
                        {(features || []).slice(0, 4).map((f, fi) => (
                          <div key={fi} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            <span style={{ color: "var(--accent)", fontSize: "0.75rem" }}>✓</span> {f}
                          </div>
                        ))}
                        <button
                          onClick={() => { setUpgradeTarget(t); setShowUpgradeModal(true); }}
                          style={{
                            background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", border: "none", borderRadius: 12,
                            padding: "0.75rem 1.25rem", color: "white", fontWeight: 700, fontSize: "0.88rem",
                            cursor: "pointer", marginTop: "auto",
                            boxShadow: "0 4px 16px var(--accent-border)", transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => { (e.target as HTMLElement).style.boxShadow = "0 6px 24px var(--accent-glow)"; }}
                          onMouseLeave={(e) => { (e.target as HTMLElement).style.boxShadow = "0 4px 16px var(--accent-border)"; }}
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
                    const tierPrice = billingPeriod === "annual" ? getAnnualPrice(t) : getTierPrice(t);
                    const preLaunch = billingPeriod === "annual" ? getPreLaunchAnnualPrice(t) : getPreLaunchPrice(t);
                    const periodLabel = billingPeriod === "annual" ? "/yr" : "/mo";
                    return (
                      <div
                        key={t}
                        style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: 20, padding: "1.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", position: "relative", overflow: "hidden", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
                      >
                        <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.1rem" }}>{TIER_NAMES[t]}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                          {preLaunch != null && preLaunch !== tierPrice ? (
                            <>
                              <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem" }}>${preLaunch}{periodLabel}</span>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "line-through" }}>${tierPrice}{periodLabel}</span>
                            </>
                          ) : (
                            <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem" }}>${tierPrice}{periodLabel}</span>
                          )}
                        </div>
                        {billingPeriod === "annual" && (preLaunch ?? tierPrice) > 0 && (
                          <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600 }}>
                            ${Math.round((preLaunch ?? tierPrice) / 12)}/mo effective
                          </div>
                        )}
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
                              setDowngradeError((err as { error?: string }).error || "Downgrade failed. Please try again.");
                            }
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--accent-glow)",
                            borderRadius: 10,
                            padding: "0.65rem 1.25rem",
                            color: "var(--accent)",
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
                {downgradeError && (
                  <div style={{
                    marginTop: "0.75rem", padding: "0.6rem 1rem", borderRadius: 10,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#ef4444", fontSize: "0.82rem", lineHeight: 1.4,
                  }}>
                    {downgradeError}
                  </div>
                )}
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
          <div style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--accent-dim)", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Change History</div>
            {changes.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No subscription changes yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--accent-dim)" }}>
                      {["Date", "Type", "From \u2192 To", "Refund", "Credits", "Method"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "0.5rem 0.75rem", color: "var(--accent)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>{h}</th>
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
          <div style={{ display: "inline-flex", background: "var(--bg-card)", border: "1px solid var(--accent-dim)", borderRadius: 28, padding: "4px" }}>
            {["Estate Sale Services", "Estate Care Plans", "Neighborhood Bundle"].map((label, i) => (
              <button
                key={label}
                onClick={() => setActiveSlide(i)}
                style={{
                  padding: "0.5rem 1.5rem",
                  borderRadius: 24,
                  border: "none",
                  background: activeSlide === i ? "var(--accent-dim)" : "transparent",
                  color: activeSlide === i ? "var(--accent)" : "var(--text-muted)",
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
            {/* Section intro */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>One-Time Estate Sale</div>
              <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>
                We handle everything from start to finish. One project. One flat fee. Done.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {WG_CARDS.map((card) => {
                const wg = WHITE_GLOVE[card.key];
                if (!wg) return null;
                const isRecommended = wg.recommended === true;
                return (
                  <div key={card.key} style={{ background: card.bg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${card.borderColor}`, borderRadius: 20, padding: isRecommended ? "2.25rem 1.75rem 1.75rem 1.75rem" : "1.75rem", position: "relative", overflow: "visible", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px var(--accent-dim)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}>
                    {isRecommended && (
                      <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", color: "white", borderRadius: 20, padding: "0.3rem 1.25rem", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.06em", boxShadow: "0 2px 12px var(--accent-glow)", zIndex: 10 }}>RECOMMENDED</div>
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

                    <button onClick={() => setWgBookingKey(card.key)} style={{ display: "block", textAlign: "center", background: "transparent", border: `1px solid ${card.accent}`, borderRadius: 12, padding: "0.75rem 1.5rem", color: card.accent, fontWeight: 700, fontSize: "0.88rem", width: "100%", marginTop: "1.25rem", transition: "all 0.2s ease", boxSizing: "border-box", cursor: "pointer" }}>
                      {card.cta}
                    </button>
                    <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                      <a href={`mailto:support@legacy-loop.com?subject=${encodeURIComponent(`White Glove ${wg.name} Inquiry`)}`} style={{ fontSize: "0.65rem", color: "var(--text-muted)", textDecoration: "none" }}>
                        Prefer email? Contact support@legacy-loop.com
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contact CTA */}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Not sure which service is right for you?</div>
              <a href="mailto:support@legacy-loop.com?subject=Estate%20Services%20Question" style={{ color: "#D4AF37", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}>
                Email Our Estate Team →
              </a>
            </div>
          </div>

          {/* Slide 1 — Estate Care Plans */}
          <div style={{
            opacity: activeSlide === 1 ? 1 : 0,
            transform: activeSlide === 1 ? "translateX(0)" : `translateX(${activeSlide === 0 ? "30px" : "-30px"})`,
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: activeSlide === 1 ? "auto" : "none",
            position: activeSlide === 1 ? "relative" : "absolute",
            top: 0, left: 0, width: "100%",
          }}>
            {/* Section intro */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Ongoing Estate Management</div>
              <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>
                Need help over several months? We stay by your side the whole time.
              </div>
            </div>

            {/* Who is this for */}
            <div style={{ background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: 12, padding: "0.85rem 1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Perfect if you have a parent downsizing slowly, an estate too large for one sale, or items you want to sell over time — not all at once.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
              {/* Monthly */}
              <div style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: 20, padding: "1.75rem", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px var(--accent-dim)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ borderLeft: "3px solid var(--accent)", paddingLeft: "1rem", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem" }}>Month-to-Month Care</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.25rem" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: "2rem" }}>$149</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>/mo</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "line-through", marginLeft: "0.5rem" }}>$299/mo</span>
                  </div>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.5 }}>
                  We manage and sell your items every month. Cancel anytime — no long-term commitment.
                </div>
                <a href="mailto:support@legacy-loop.com?subject=Monthly%20Estate%20Care%20Inquiry" style={{ display: "block", textAlign: "center", background: "transparent", border: "1px solid var(--accent)", borderRadius: 12, padding: "0.75rem 1.5rem", color: "var(--accent)", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none", transition: "all 0.2s ease" }}>
                  Get Started
                </a>
              </div>

              {/* 3-Month */}
              <div style={{ background: "var(--accent-dim)", backdropFilter: "blur(16px)", border: "2px solid var(--accent-glow)", borderRadius: 20, padding: "2.25rem 1.75rem 1.75rem", position: "relative", overflow: "visible", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: "0 8px 32px var(--accent-dim), inset 0 1px 0 rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px var(--accent-dim)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px var(--accent-dim)"; }}
              >
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", color: "white", borderRadius: 20, padding: "0.3rem 1.25rem", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.06em", boxShadow: "0 2px 12px var(--accent-glow)", zIndex: 10 }}>BEST VALUE</div>
                <div style={{ borderLeft: "3px solid var(--accent)", paddingLeft: "1rem", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem" }}>3-Month Package</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.25rem" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: "2rem" }}>$399</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "line-through", marginLeft: "0.5rem" }}>$799</span>
                  </div>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.5 }}>
                  Three months of dedicated estate management. Best for medium-sized transitions.
                </div>
                <a href="mailto:support@legacy-loop.com?subject=3-Month%20Estate%20Care%20Package%20Inquiry" style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", border: "none", borderRadius: 12, padding: "0.75rem 1.5rem", color: "white", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none", boxShadow: "0 4px 16px var(--accent-border)", transition: "all 0.2s ease" }}>
                  Get Started
                </a>
              </div>

              {/* Full Resolution */}
              <div style={{ background: "var(--bg-card)", backdropFilter: "blur(16px)", border: "1px solid var(--border-default)", borderRadius: 20, padding: "2.25rem 1.75rem 1.75rem", position: "relative", overflow: "visible", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px var(--accent-dim)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "rgba(212,175,55,0.9)", color: "#fff", borderRadius: 20, padding: "0.3rem 1.25rem", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.06em", boxShadow: "0 2px 12px rgba(212,175,55,0.3)", zIndex: 10 }}>MOST COMPREHENSIVE</div>
                <div style={{ borderLeft: "3px solid #D4AF37", paddingLeft: "1rem", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem" }}>Full Resolution — 6 Months</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.25rem" }}>
                    <span style={{ color: "#D4AF37", fontWeight: 800, fontSize: "2rem" }}>$999</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "line-through", marginLeft: "0.5rem" }}>$1,999</span>
                  </div>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.5 }}>
                  Six full months. We don{"'"}t stop until everything is resolved and sold.
                </div>
                <a href="mailto:support@legacy-loop.com?subject=Full%20Estate%20Resolution%20Inquiry" style={{ display: "block", textAlign: "center", background: "transparent", border: "1px solid #D4AF37", borderRadius: 12, padding: "0.75rem 1.5rem", color: "#D4AF37", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none", transition: "all 0.2s ease" }}>
                  Get Started
                </a>
              </div>
            </div>

            {/* Contact CTA */}
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Not sure which plan is right for you?</div>
              <a href="mailto:support@legacy-loop.com?subject=Estate%20Care%20Plan%20Question" style={{ color: "var(--accent)", fontSize: "0.88rem", fontWeight: 600, textDecoration: "none" }}>
                Talk to our estate team — we{"'"}ll help you find the right fit →
              </a>
            </div>
          </div>

          {/* Slide 2 — Neighborhood Bundle */}
          <div style={{
            opacity: activeSlide === 2 ? 1 : 0,
            transform: activeSlide === 2 ? "translateX(0)" : "translateX(30px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: activeSlide === 2 ? "auto" : "none",
            position: activeSlide === 2 ? "relative" : "absolute",
            top: 0,
            left: 0,
            width: "100%",
          }}>
            {/* Section intro */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Community Sale Event</div>
              <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.5 }}>
                Sell together with your neighbors as one coordinated event.
              </div>
            </div>

            {/* Who is this for */}
            <div style={{ background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: 12, padding: "0.85rem 1.25rem", marginBottom: "1.5rem", textAlign: "center", maxWidth: 640, margin: "0 auto 1.5rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Selling with neighbors? A Neighborhood Bundle lets 2 to 8 families sell together in one coordinated community sale event. Better reach. Lower cost. More buyers.
              </div>
            </div>

            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <div style={{ background: "var(--accent-dim)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--accent-glow)", borderRadius: 20, padding: "2.5rem", position: "relative", overflow: "hidden" }}>
                {/* Decorative glow */}
                <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ position: "relative" }}>
                  <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Community Sale Program</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>{NEIGHBORHOOD_BUNDLE.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: "2.5rem" }}>${NEIGHBORHOOD_BUNDLE.preLaunch}</span>
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
                        <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0, marginTop: "0.05rem" }}>{"\u2713"}</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Additional family pricing */}
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--accent-dim)", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1.5rem" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      Additional families: <span style={{ color: "var(--accent)", fontWeight: 700 }}>${NEIGHBORHOOD_BUNDLE.preLaunchAdditional}/family</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", textDecoration: "line-through", marginLeft: "0.4rem" }}>${NEIGHBORHOOD_BUNDLE.additionalFamily}</span>
                    </div>
                  </div>

                  <a href="mailto:support@legacy-loop.com?subject=Neighborhood%20Bundle%20Inquiry" style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", border: "none", borderRadius: 12, padding: "0.85rem 2rem", color: "white", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", width: "100%", boxShadow: "0 4px 20px var(--accent-border)", transition: "all 0.2s ease", boxSizing: "border-box" }}>
                    Start a Neighborhood Bundle
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                width: activeSlide === i ? 24 : 8,
                height: 8,
                borderRadius: activeSlide === i ? 4 : 4,
                background: activeSlide === i ? "var(--accent)" : "var(--text-muted)",
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
          billingPeriod={billingPeriod}
          onClose={() => setShowUpgradeModal(false)}
          onUpgraded={() => window.location.reload()}
        />
      )}

      {/* White Glove Booking Modal */}
      {wgBookingKey && (() => {
        const wg = WHITE_GLOVE[wgBookingKey];
        if (!wg) return null;
        const isPreLaunch = true; // PRE_LAUNCH check happens server-side
        const total = isPreLaunch ? wg.preLaunch : wg.price;
        const deposit = Math.round(total * 0.60 * 100) / 100;
        const balance = Math.round(total * 0.40 * 100) / 100;
        return (
          <WhiteGloveBookingModal
            tier={wgBookingKey.toUpperCase()}
            tierLabel={wg.name}
            totalAmount={total}
            depositAmount={deposit}
            balanceAmount={balance}
            regularPrice={wg.price}
            onClose={() => setWgBookingKey(null)}
            onSuccess={() => { setWgBookingKey(null); window.location.reload(); }}
          />
        );
      })()}
    </div>
  );
}
