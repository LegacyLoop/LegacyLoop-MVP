"use client";

// CMD-STRIPE-SUBSCRIPTION-UI — April 10, 2026
// Premium subscription upgrade modal with Stripe Elements.
// Elements wrapper → CardElement → confirmCardPayment.
// Demo mode preserved. Inline styles only.

import { useState, useEffect } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";

interface Props {
  currentTier: number;
  newTier: number;
  newPlanName: string;
  newPlanPrice: number;
  billingPeriod?: "monthly" | "annual";
  onClose: () => void;
  onUpgraded: () => void;
}

interface ProRateData {
  currentPlanCredit: number;
  newPlanCost: number;
  chargeToday: number;
  daysRemaining: number;
  billingPeriodEnd: string;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#f1f5f9",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: "16px",
      "::placeholder": { color: "#64748b" },
    },
    invalid: { color: "#ef4444" },
  },
};

/* ── Inner form (must be inside <Elements>) ──────────────────── */
function UpgradeFormInner({
  currentTier, newTier, newPlanName, newPlanPrice,
  billingPeriod = "monthly", onClose, onUpgraded,
}: Props) {
  const stripeHook = useStripe();
  const elements = useElements();

  const [proRate, setProRate] = useState<ProRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDemo = typeof window !== "undefined" && (window as any).__DEMO_MODE === true;

  useEffect(() => {
    fetch(`/api/billing/pro-rate?action=upgrade&newTier=${newTier}`)
      .then((r) => {
        if (!r.ok) throw new Error("Pro-rate unavailable");
        return r.json();
      })
      .then((d) => {
        if (d && typeof d.chargeToday === "number") {
          setProRate(d);
        } else {
          setProRate({ currentPlanCredit: 0, newPlanCost: newPlanPrice, chargeToday: newPlanPrice, daysRemaining: 0, billingPeriodEnd: "" });
        }
      })
      .catch(() => {
        setProRate({ currentPlanCredit: 0, newPlanCost: newPlanPrice, chargeToday: newPlanPrice, daysRemaining: 0, billingPeriodEnd: "" });
      })
      .finally(() => setLoading(false));
  }, [newTier, newPlanPrice]);

  async function handleUpgrade() {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTier, billing: billingPeriod }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upgrade failed. Please try again.");
        setProcessing(false);
        return;
      }

      // If clientSecret returned, confirm with Stripe
      if (data.clientSecret && stripeHook && elements) {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setError("Card input not ready. Please try again.");
          setProcessing(false);
          return;
        }

        const { error: stripeError, paymentIntent } = await stripeHook.confirmCardPayment(
          data.clientSecret,
          { payment_method: { card: cardElement } }
        );

        if (stripeError) {
          setError(stripeError.message || "Payment failed. Please try again.");
          setProcessing(false);
          return;
        }

        if (paymentIntent?.status !== "succeeded") {
          setError("Payment was not completed. Please try again.");
          setProcessing(false);
          return;
        }
      }

      // Success
      setDone(true);
      onUpgraded();
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setProcessing(false);
  }

  const chargeAmount = proRate?.chargeToday ?? newPlanPrice;
  const hasCredit = (proRate?.currentPlanCredit ?? 0) > 0;
  const canSubmit = !processing && !loading;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "rgba(13,31,45,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, maxWidth: 480, width: "95%", padding: 28,
      }}>
        {done ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(0,188,212,0.15)", border: "2px solid #00bcd4",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 11.5L9 15.5L17 7" stroke="#00bcd4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8, fontFamily: "'Exo 2', sans-serif" }}>
              Upgraded to {newPlanName}!
            </div>
            <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginBottom: 20, lineHeight: 1.6 }}>
              Your new plan is active immediately. All features are unlocked.
            </div>
            <button
              onClick={() => { onClose(); window.location.reload(); }}
              style={{
                padding: "10px 24px", background: "#00bcd4", color: "#000",
                fontWeight: 700, fontSize: 13, borderRadius: 8, border: "none", cursor: "pointer",
              }}
            >
              Continue
            </button>
          </div>
        ) : (
          /* ── Upgrade form ── */
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4, fontFamily: "'Exo 2', sans-serif" }}>
              {hasCredit ? "Upgrade" : "Subscribe"} to {newPlanName}
            </div>
            <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginBottom: 24 }}>
              ${newPlanPrice}/mo — Your {hasCredit ? "upgrade" : "subscription"} takes effect immediately.
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(207,216,220,0.5)", fontSize: 13 }}>
                Loading details...
              </div>
            ) : proRate ? (
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: 16, marginBottom: 20,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: "rgba(207,216,220,0.5)",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}>
                  {hasCredit ? "Upgrade Summary" : "Subscription Summary"}
                </div>

                {hasCredit && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(207,216,220,0.7)" }}>
                      Current plan credit ({proRate.daysRemaining} days unused)
                    </span>
                    <span style={{ fontSize: 13, color: "#4caf50", fontWeight: 600 }}>
                      -${(proRate.currentPlanCredit ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "rgba(207,216,220,0.7)" }}>
                    {newPlanName} {hasCredit ? "(remaining period)" : "(monthly)"}
                  </span>
                  <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
                    ${(proRate.newPlanCost ?? newPlanPrice).toFixed(2)}
                  </span>
                </div>

                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  marginTop: 12, paddingTop: 12,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>Charge today</span>
                  <span style={{ fontSize: 15, color: "#00bcd4", fontWeight: 800 }}>
                    ${(proRate.chargeToday ?? newPlanPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Stripe Card Input */}
            {!isDemo && (
              <div style={{
                padding: "0.75rem 0.9rem", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 500,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  Card Details
                </div>
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8, padding: "8px 12px", marginBottom: 16,
                fontSize: 12, color: "#ef4444", lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={handleUpgrade}
                disabled={!canSubmit}
                style={{
                  height: 52,
                  background: canSubmit ? "linear-gradient(135deg, #00bcd4, #0097a7)" : "rgba(0,188,212,0.3)",
                  color: canSubmit ? "#000" : "rgba(0,0,0,0.5)",
                  fontWeight: 800, fontSize: 14, borderRadius: 10, border: "none",
                  cursor: canSubmit ? "pointer" : "wait",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {processing && (
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000",
                    animation: "spin 0.7s linear infinite",
                  }} />
                )}
                {processing ? "Processing…" : `Confirm — Pay $${chargeAmount.toFixed(2)}`}
              </button>
              <button
                onClick={onClose}
                style={{
                  height: 40, background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.6)", fontSize: 12,
                  borderRadius: 10, cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            {/* Trust signal */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 16, fontSize: 10, color: "rgba(255,255,255,0.3)",
            }}>
              <span>🔒 Secured by Stripe</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main export (wraps with Elements provider) ──────────────── */
export default function UpgradeFlowModal(props: Props) {
  return (
    <Elements stripe={stripePromise}>
      <UpgradeFormInner {...props} />
    </Elements>
  );
}
