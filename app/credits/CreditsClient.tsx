"use client";

import { useState, useEffect } from "react";
import { calculateCustomCredits, CUSTOM_CREDIT_MINIMUM, CUSTOM_CREDIT_MAXIMUM, CUSTOM_CREDIT_SCALE } from "@/lib/constants/pricing";
import CreditPurchaseModal from "@/app/components/billing/CreditPurchaseModal";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  paymentAmount: number | null;
  createdAt: string;
};

type Props = {
  initialBalance: number;
  lifetime: number;
  spent: number;
  transactions: Transaction[];
};

// Credit packages — synced with lib/constants/pricing.ts ADD_ONS
const PACKAGES = [
  { id: "starter",  name: "Starter",   credits: 30,  bonusCredits: 0,   price: 25,  popular: false, label: null as string | null },
  { id: "plus",     name: "Plus",      credits: 50,  bonusCredits: 15,  price: 50,  popular: true,  label: "MOST POPULAR" as string | null },
  { id: "power",    name: "Power",     credits: 100, bonusCredits: 40,  price: 100, popular: false, label: "BEST VALUE" as string | null },
  { id: "pro",      name: "Pro",       credits: 200, bonusCredits: 100, price: 200, popular: false, label: "MAX SAVINGS" as string | null },
];

const PACK_ID_MAP: Record<string, string> = {
  starter: "pack_25",
  plus: "pack_50",
  power: "pack_100",
  pro: "pack_200",
};

const ADDON_TOOL_ROUTES: Record<string, string> = {
  ai_listing_optimizer: "/addons/listing-optimizer",
  buyer_outreach_blast: "/addons/buyer-outreach",
  ai_market_report: "/addons/market-report",
};

const TYPE_ICONS: Record<string, string> = {
  purchase: "💎",
  spend:    "🔧",
  bonus:    "🎁",
  earned:   "✨",
  refund:   "↩️",
};

const EARN_WAYS = [
  { icon: "🎉", label: "Sign up bonus",        amount: 10,  desc: "Just for creating your account" },
  { icon: "🔐", label: "Data consent",          amount: 100, desc: "Opt into anonymized market insights" },
  { icon: "🎁", label: "Refer a friend",        amount: 50,  desc: "When they list their first item" },
  { icon: "🏷️", label: "First sale",            amount: 25,  desc: "Complete your first sale on LegacyLoop" },
];

export default function CreditsClient({ initialBalance, lifetime, spent, transactions }: Props) {
  const [tab, setTab] = useState<"store" | "services" | "history">("store");
  const [balance, setBalance] = useState(initialBalance);
  const [txList, setTxList] = useState<Transaction[]>(transactions);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{ name: string; id: string } | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [customPurchasing, setCustomPurchasing] = useState(false);
  const [stripeModal, setStripeModal] = useState<{ clientSecret: string; packageName: string; credits: number; charged: number } | null>(null);

  useEffect(() => {
    fetch("/api/addons").then(r => r.json()).then(d => {
      setAddons(d.addons || []);
      setAddonsLoading(false);
    }).catch(() => setAddonsLoading(false));
    fetch("/api/addons/history").then(r => r.json()).then(d => {
      setPurchasedIds((d.purchases || []).map((p: any) => p.addonId));
    }).catch(() => {});
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function purchase(pkgId: string) {
    setPurchasing(pkgId);
    try {
      const pkg = PACKAGES.find((p) => p.id === pkgId);
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "credit_pack", id: PACK_ID_MAP[pkgId] || pkgId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Stripe live: open card confirmation modal
        if (data.clientSecret) {
          setStripeModal({
            clientSecret: data.clientSecret,
            packageName: pkg?.name || "Credit Pack",
            credits: data.credits,
            charged: data.charged,
          });
          return;
        }
        // Demo mode: credits already awarded
        setBalance(data.balance);
        showToast(`${data.credits} credits added! New balance: ${data.balance}`);
        const newTx: Transaction = {
          id: `local-${Date.now()}`,
          type: "purchase",
          amount: data.credits,
          balance: data.balance,
          description: `Credit Pack — ${data.credits} credits ($${data.charged})`,
          paymentAmount: data.charged,
          createdAt: new Date().toISOString(),
        };
        setTxList((prev) => [newTx, ...prev]);
      }
    } finally {
      setPurchasing(null);
    }
  }

  async function purchaseCustom() {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < CUSTOM_CREDIT_MINIMUM || amount > CUSTOM_CREDIT_MAXIMUM) return;
    setCustomPurchasing(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "custom_credit", id: "custom", amount }),
      });
      if (res.ok) {
        const data = await res.json();
        // Stripe live: open card confirmation modal
        if (data.clientSecret) {
          setStripeModal({
            clientSecret: data.clientSecret,
            packageName: `Custom Credits (${data.tierName || "Standard"})`,
            credits: data.credits,
            charged: data.charged,
          });
          return;
        }
        // Demo mode
        setBalance(data.balance);
        showToast(`${data.credits} credits added! New balance: ${data.balance}`);
        const newTx: Transaction = {
          id: `local-${Date.now()}`,
          type: "purchase",
          amount: data.credits,
          balance: data.balance,
          description: `Custom Credits — ${data.credits} credits ($${data.charged})`,
          paymentAmount: data.charged,
          createdAt: new Date().toISOString(),
        };
        setTxList((prev) => [newTx, ...prev]);
        setCustomAmount("");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast((err as { error?: string }).error || "Purchase failed");
      }
    } catch { showToast("Network error — please try again"); }
    finally { setCustomPurchasing(false); }
  }

  const parsedAmount = parseFloat(customAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= CUSTOM_CREDIT_MINIMUM && parsedAmount <= CUSTOM_CREDIT_MAXIMUM;
  const customCalc = isValidAmount ? calculateCustomCredits(parsedAmount) : null;
  const activeTierIdx = isValidAmount ? CUSTOM_CREDIT_SCALE.findIndex(s => parsedAmount >= s.minAmount && parsedAmount <= s.maxAmount) : -1;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 100,
          background: "var(--accent)", color: "#fff", padding: "0.75rem 1.25rem",
          borderRadius: "0.75rem", fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,188,212,0.3)",
          fontSize: "0.9rem",
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Marketplace</div>
        <h1 className="h1 mt-2">Credits &amp; Services</h1>
        <p className="muted mt-1">Buy credits to unlock AI features, storytelling, and expert services</p>
      </div>

      {/* Balance card */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,188,212,0.12), rgba(0,188,212,0.04))",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(0,188,212,0.25)",
        borderRadius: "20px",
        padding: "1.75rem 2rem",
        color: "var(--text-primary)",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        position: "relative", overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,188,212,0.1), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "radial-gradient(circle, rgba(0,188,212,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "3rem" }}>💎</div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Balance</div>
            <div style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", backgroundImage: "linear-gradient(135deg, #00bcd4, #009688)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{balance}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>credits</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{lifetime}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Lifetime Earned</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{spent}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Spent</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{txList.length}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Transactions</div>
          </div>
        </div>
      </div>

      {/* Credit Meter */}
      {(() => {
        const recentSpends = txList.filter((t: any) => t.type === "spend" && Date.now() - new Date(t.createdAt).getTime() < 30 * 86400000);
        const totalSpent30d = recentSpends.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
        const weeklyRate = Math.round(totalSpent30d / 4);
        const runway = weeklyRate > 0 ? Math.round(balance / weeklyRate) : null;
        if (weeklyRate === 0) return null;
        return (
          <div style={{ padding: "12px 20px", marginBottom: "1.5rem", background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
            <span style={{ color: "var(--text-secondary)" }}>📊 ~{weeklyRate} credits/week</span>
            {runway && <span style={{ color: "var(--text-secondary)" }}>📅 ~{runway} week{runway !== 1 ? "s" : ""} remaining</span>}
          </div>
        );
      })()}

      {/* Low balance warning */}
      {balance < 5 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.875rem 1.25rem", borderRadius: "0.75rem",
          background: "linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.02))",
          border: "1px solid rgba(234,179,8,0.2)",
          marginBottom: "1.25rem",
        }}>
          <span style={{ fontSize: "1.1rem" }}>⚠️</span>
          <span style={{ fontSize: "0.85rem", color: "#eab308", fontWeight: 600 }}>
            Low credit balance — bots cost 1–7 credits per run.
          </span>
          <button onClick={() => setTab("store")} style={{
            marginLeft: "auto", padding: "0.35rem 0.875rem", borderRadius: "0.5rem",
            background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)",
            color: "#eab308", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
          }}>
            Buy Credits
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "inline-flex", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 16, padding: 4, gap: 4, marginBottom: "1.5rem" }}>
        {(["store", "services", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.6rem 1.5rem",
              background: tab === t ? "linear-gradient(135deg, rgba(0,188,212,0.15), rgba(0,188,212,0.08))" : "transparent",
              border: tab === t ? "1px solid rgba(0,188,212,0.3)" : "1px solid transparent",
              borderRadius: 12,
              color: tab === t ? "#00bcd4" : "var(--text-muted)",
              fontWeight: tab === t ? 700 : 500,
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              letterSpacing: "0.02em",
              boxShadow: tab === t ? "0 2px 12px rgba(0,188,212,0.12)" : "none",
            }}
          >
            {t === "store" ? "💳 Buy Credits" : t === "services" ? "🛒 Services" : "📋 History"}
          </button>
        ))}
      </div>

      {/* ── Store Tab ── */}
      {tab === "store" && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {PACKAGES.map((pkg) => {
              const total = pkg.credits + pkg.bonusCredits;
              return (
                <div
                  key={pkg.id}
                  style={{
                    background: pkg.popular
                      ? "linear-gradient(135deg, rgba(0,188,212,0.1), rgba(0,188,212,0.03))"
                      : "var(--bg-card)",
                    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                    border: pkg.popular ? "2px solid rgba(0,188,212,0.4)" : "1px solid var(--border-default)",
                    borderRadius: "1.25rem",
                    padding: "1.75rem",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    boxShadow: pkg.popular
                      ? "0 8px 32px rgba(0,188,212,0.15), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
                      : "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,188,212,0.2), 0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = pkg.popular ? "0 8px 32px rgba(0,188,212,0.15), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)"; }}
                >
                  {/* Corner glow */}
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: `radial-gradient(circle, ${pkg.popular ? "rgba(0,188,212,0.12)" : "rgba(0,188,212,0.06)"} 0%, transparent 70%)`, pointerEvents: "none" }} />

                  {pkg.label && (
                    <div style={{
                      position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                      background: "linear-gradient(135deg, #00bcd4, #009688)",
                      color: "#fff", padding: "0.2rem 1rem",
                      borderRadius: "0 0 10px 10px", fontSize: "0.62rem", fontWeight: 800,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      boxShadow: "0 4px 12px rgba(0,188,212,0.3)",
                    }}>
                      {pkg.label}
                    </div>
                  )}
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginTop: pkg.label ? "0.5rem" : 0, letterSpacing: "-0.01em" }}>{pkg.name}</div>
                  <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--accent)" }}>{total}</span>
                    <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 600 }}>credits</span>
                  </div>
                  {pkg.bonusCredits > 0 && (
                    <div style={{ fontSize: "0.82rem", color: "#22c55e", fontWeight: 700, marginTop: "0.15rem" }}>
                      {pkg.credits} base + {pkg.bonusCredits} bonus
                    </div>
                  )}
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    ${(pkg.price / total).toFixed(2)} per credit
                  </div>
                  <button
                    onClick={() => purchase(pkg.id)}
                    disabled={purchasing === pkg.id}
                    className="btn-primary"
                    style={{
                      marginTop: "1rem",
                      width: "100%",
                      padding: "0.7rem",
                      fontSize: "1rem",
                      cursor: purchasing === pkg.id ? "not-allowed" : "pointer",
                      opacity: purchasing === pkg.id ? 0.7 : 1,
                    }}
                  >
                    {purchasing === pkg.id ? "Processing..." : `Buy for $${pkg.price}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Custom Credit Purchase ── */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(0,188,212,0.15)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            backdropFilter: "blur(12px)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "1.25rem" }}>✨</span>
              <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>Custom Amount</span>
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Enter any amount — our scale gives you the best rate automatically
            </div>

            {/* Bulk promo banner */}
            <div style={{
              background: parsedAmount >= 500
                ? "linear-gradient(135deg, rgba(184,134,11,0.1), rgba(184,134,11,0.04))"
                : "rgba(184,134,11,0.04)",
              borderLeft: `3px solid ${parsedAmount >= 500 ? "#b8860b" : "rgba(184,134,11,0.4)"}`,
              borderRadius: "0 0.75rem 0.75rem 0",
              padding: "0.65rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "0.82rem",
              color: parsedAmount >= 500 ? "#b8860b" : "var(--text-secondary)",
              fontWeight: 600,
            }}>
              {parsedAmount >= 500
                ? "Bulk Rate Unlocked! You're getting our best deal — $0.60 per credit"
                : "Spend $500+ and get credits at just $0.60 each — our best rate"}
            </div>

            {/* Input row */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: 700 }}>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setCustomAmount(v);
                    }}
                    placeholder="Enter amount"
                    style={{
                      width: "100%",
                      padding: "1rem 1rem 1rem 2.25rem",
                      background: "var(--ghost-bg)",
                      border: `2px solid ${isValidAmount ? "rgba(0,188,212,0.5)" : customAmount && !isValidAmount ? "rgba(239,68,68,0.4)" : "var(--border-default)"}`,
                      borderRadius: "14px",
                      color: "var(--text-primary)",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      outline: "none",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                      boxShadow: isValidAmount ? "0 0 0 3px rgba(0,188,212,0.08)" : "none",
                    }}
                  />
                </div>
                {customAmount && !isNaN(parsedAmount) && parsedAmount < CUSTOM_CREDIT_MINIMUM && (
                  <div style={{ fontSize: "0.75rem", color: "rgba(239,68,68,0.7)", marginTop: "0.35rem" }}>Minimum purchase is ${CUSTOM_CREDIT_MINIMUM}</div>
                )}
                {customAmount && !isNaN(parsedAmount) && parsedAmount > CUSTOM_CREDIT_MAXIMUM && (
                  <div style={{ fontSize: "0.75rem", color: "rgba(239,68,68,0.7)", marginTop: "0.35rem" }}>Maximum single purchase is ${CUSTOM_CREDIT_MAXIMUM.toLocaleString()}</div>
                )}
              </div>
              <button
                onClick={purchaseCustom}
                disabled={!isValidAmount || customPurchasing}
                style={{
                  padding: "1rem 2rem",
                  background: isValidAmount && !customPurchasing
                    ? "linear-gradient(135deg, #00bcd4, #009688)"
                    : "rgba(0,188,212,0.15)",
                  border: "none",
                  borderRadius: "14px",
                  color: isValidAmount && !customPurchasing ? "#fff" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "0.01em",
                  cursor: isValidAmount && !customPurchasing ? "pointer" : "not-allowed",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  boxShadow: isValidAmount ? "0 4px 16px rgba(0,188,212,0.25)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {customPurchasing ? "Processing..." : isValidAmount ? `Buy for $${parsedAmount}` : "Buy"}
              </button>
            </div>

            {/* Live preview */}
            {isValidAmount && customCalc && (
              <div style={{
                background: "rgba(0,188,212,0.06)",
                border: "1px solid rgba(0,188,212,0.2)",
                borderRadius: "1rem",
                padding: "1.25rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <span style={{ fontSize: "2.25rem", fontWeight: 900, color: customCalc.tierName === "Bulk" ? "#b8860b" : "var(--accent)" }}>
                      {customCalc.credits}
                    </span>
                    <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 600 }}>credits</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    ${customCalc.perCredit} per credit
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                  <span style={{
                    background: customCalc.tierName === "Bulk" ? "rgba(184,134,11,0.12)" : "rgba(0,188,212,0.12)",
                    border: `1px solid ${customCalc.tierName === "Bulk" ? "rgba(184,134,11,0.3)" : "rgba(0,188,212,0.3)"}`,
                    color: customCalc.tierName === "Bulk" ? "#b8860b" : "#00bcd4",
                    padding: "0.2rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}>
                    {customCalc.tierName} Rate
                  </span>
                  {customCalc.savings !== "Base rate" && (
                    <span style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 700 }}>
                      {customCalc.savings}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Scale visualization */}
            <div style={{ display: "flex", gap: "2px", borderRadius: "0.5rem", overflow: "hidden" }}>
              {CUSTOM_CREDIT_SCALE.map((s, i) => {
                const isActive = i === activeTierIdx;
                const isBulk = s.tierName === "Bulk";
                return (
                  <div key={s.tierName} style={{
                    flex: isBulk ? 2 : 1,
                    background: isActive
                      ? (isBulk ? "rgba(184,134,11,0.15)" : "rgba(0,188,212,0.15)")
                      : "var(--ghost-bg)",
                    borderTop: isActive ? `2px solid ${isBulk ? "#b8860b" : "#00bcd4"}` : "2px solid var(--border-default)",
                    padding: "0.5rem 0.35rem",
                    textAlign: "center",
                  }}>
                    <div style={{
                      fontSize: "0.68rem",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? (isBulk ? "#b8860b" : "#00bcd4") : "var(--text-secondary)",
                    }}>
                      {s.tierName}
                    </div>
                    <div style={{
                      fontSize: "0.62rem",
                      color: isActive ? "var(--text-secondary)" : "var(--text-muted)",
                      marginTop: "0.15rem",
                    }}>
                      ${s.rate}/cr
                    </div>
                    <div style={{
                      fontSize: "0.58rem",
                      color: "var(--text-muted)",
                      marginTop: "0.1rem",
                    }}>
                      ${s.minAmount}{s.maxAmount === 10000 ? "+" : `–$${s.maxAmount}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ways to Earn */}
          <div style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>✨</span> Ways to Earn Free Credits
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EARN_WAYS.map((way) => (
                <div
                  key={way.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    background: "var(--ghost-bg)",
                    border: "1px solid rgba(34,197,94,0.15)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", flexShrink: 0 }}>{way.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>{way.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{way.desc}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: "#22c55e", fontSize: "1rem", flexShrink: 0 }}>
                    +{way.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How Credits Work */}
          <div style={{
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-default)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}>
            <div style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.95rem", color: "var(--text-primary)" }}>How Credits Work</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                "Credits never expire — use them whenever you need",
                "Spend credits on AI analysis, storytelling, expert services, and more",
                "Earn bonus credits when you sell items through LegacyLoop",
                "Volume packages give you more credits per dollar spent",
                "Refunds available within 7 days if a service isn't delivered",
              ].map((point, i) => (
                <div key={i} style={{ display: "flex", gap: "0.6rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Services Tab ── */}
      {tab === "services" && (
        <div>
          {/* Hero */}
          <div style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(0,188,212,0.02))", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 20, padding: "24px 28px", marginBottom: 24, position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, background: "radial-gradient(circle, rgba(0,188,212,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>🚀 LegacyLoop Add-On Store</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>Premium AI tools powered by 4 engines working in parallel. MegaBot-level power on every add-on.</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {["16 Add-Ons", "4 AI Engines", "All Parallel"].map((s, i) => (
                <span key={i} style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: 20, padding: "4px 12px", fontSize: 10, color: "var(--text-muted)" }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Loading */}
          {addonsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 180, background: "var(--ghost-bg)", borderRadius: 14 }} />)}
            </div>
          ) : (
            <>
              {/* Category groups */}
              {Object.entries(
                addons.reduce((acc: Record<string, any[]>, a: any) => {
                  const cat = a.category || "other";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(a);
                  return acc;
                }, {})
              ).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", letterSpacing: 0.5, marginBottom: 4, textTransform: "capitalize" }}>{cat === "ai" ? "🤖 AI Power Tools" : cat === "legacy" ? "📖 Legacy & Storytelling" : cat === "valuation" ? "💎 Valuation" : cat === "reporting" ? "📊 Reports" : cat === "service" ? "⚡ Services" : cat === "photos" ? "📸 Photos" : cat === "shipping" ? "📦 Shipping" : cat === "support" ? "🎓 Support" : `📁 ${cat}`}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                    {(items as any[]).map((addon: any) => {
                      const owned = purchasedIds.includes(addon.id);
                      const buying = purchasingId === addon.id;
                      return (
                        <div key={addon.id} style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)", borderRadius: 16, padding: "20px", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: "0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04)" }} onMouseEnter={(e: any) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,188,212,0.1)"; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{addon.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>{addon.description}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>💎 {addon.credits} credits</span>
                            {owned ? (
                              ADDON_TOOL_ROUTES[addon.id] ? (
                                <a href={ADDON_TOOL_ROUTES[addon.id]} style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 7, background: "rgba(76,175,80,0.15)", border: "1px solid #4caf50", color: "#4caf50", textDecoration: "none" }}>Launch Tool →</a>
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 7, background: "rgba(76,175,80,0.15)", border: "1px solid #4caf50", color: "#4caf50" }}>✓ Owned</span>
                              )
                            ) : (
                              <button
                                onClick={async () => {
                                  setPurchasingId(addon.id);
                                  try {
                                    const res = await fetch("/api/addons/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addonId: addon.id }) });
                                    if (res.ok) {
                                      setPurchasedIds(prev => [...prev, addon.id]);
                                      setPurchaseSuccess({ name: addon.name, id: addon.id });
                                      setTimeout(() => setPurchaseSuccess(null), 8000);
                                    } else {
                                      const err = await res.json().catch(() => ({}));
                                      alert(err.message || err.error || "Failed to redeem");
                                    }
                                  } catch { alert("Network error"); }
                                  setPurchasingId(null);
                                }}
                                disabled={buying}
                                style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 7, background: buying ? "rgba(0,188,212,0.3)" : "linear-gradient(135deg, #00bcd4, #0097a7)", color: "#000", border: "none", cursor: buying ? "wait" : "pointer" }}
                              >
                                {buying ? "..." : "Get Add-On"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Success banner */}
          {purchaseSuccess && (
            <div style={{ position: "fixed", bottom: 24, right: 24, background: "linear-gradient(135deg, rgba(76,175,80,0.95), rgba(56,142,60,0.95))", color: "#fff", padding: "16px 24px", borderRadius: 14, fontSize: 13, fontWeight: 700, zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.5)", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>✓</span>
                <span>{purchaseSuccess.name} activated!</span>
                <button onClick={() => setPurchaseSuccess(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
              </div>
              {ADDON_TOOL_ROUTES[purchaseSuccess.id] && (
                <a href={ADDON_TOOL_ROUTES[purchaseSuccess.id]} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--bg-card-hover)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontWeight: 700, fontSize: 12, padding: "8px 16px", borderRadius: 8, textDecoration: "none", justifyContent: "center" }}>Launch Tool Now →</a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {tab === "history" && (
        <div>
          {txList.length === 0 ? (
            <div style={{
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-default)",
              borderRadius: "1.25rem",
              textAlign: "center",
              padding: "3rem",
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>No transactions yet</div>
              <div style={{ color: "var(--text-muted)", marginTop: "0.4rem" }}>Buy credits to get started</div>
              <button
                onClick={() => setTab("store")}
                className="btn-primary"
                style={{ marginTop: "1rem", padding: "0.5rem 1.25rem" }}
              >
                Browse Credit Packages
              </button>
            </div>
          ) : (
            <div style={{
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-default)",
              borderRadius: "1.25rem",
              padding: 0,
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-default)" }}>
                    {["", "Description", "Credits", "Balance", "Date", ""].map((h) => (
                      <th key={h} style={{
                        padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem",
                        fontWeight: 700, color: "var(--text-muted)",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txList.map((tx, i) => (
                    <tr key={tx.id} style={{ borderBottom: i < txList.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "1.2rem" }}>{TYPE_ICONS[tx.type] ?? "💎"}</td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-primary)" }}>{tx.description}</td>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.9rem", color: tx.amount > 0 ? "#22c55e" : "#ef4444" }}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                        💎 {tx.balance}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <a
                          href={`/receipts/${tx.id}?type=credit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "0.25rem 0.6rem", borderRadius: "6px",
                            fontSize: "0.68rem", fontWeight: 600,
                            color: "var(--accent)", background: "rgba(0,188,212,0.08)",
                            border: "1px solid rgba(0,188,212,0.2)",
                            textDecoration: "none", whiteSpace: "nowrap",
                            transition: "all 0.15s ease",
                          }}
                        >
                          📄 Receipt
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* Stripe card confirmation modal */}
      {stripeModal && (
        <CreditPurchaseModal
          clientSecret={stripeModal.clientSecret}
          packageName={stripeModal.packageName}
          credits={stripeModal.credits}
          charged={stripeModal.charged}
          onSuccess={() => {
            setStripeModal(null);
            showToast(`${stripeModal.credits} credits purchased! Refreshing...`);
            // Refresh balance from server
            fetch("/api/credits/balance").then(r => r.json()).then(d => {
              if (d.balance != null) setBalance(d.balance);
            }).catch(() => {});
          }}
          onClose={() => setStripeModal(null)}
        />
      )}
    </div>
  );
}
