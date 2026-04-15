"use client";

// CMD-STRIPE-CREDITS-UI — April 10, 2026
// Modal for confirming credit purchase with Stripe Elements.
// Triggered when checkout API returns clientSecret.
// Inline styles only. Matches BuyNowModal + UpgradeFlowModal.

import { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe-client";

interface Props {
  clientSecret: string;
  packageName: string;
  credits: number;
  charged: number;
  onSuccess: (balance: number) => void;
  onClose: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#f1f5f9",
      fontFamily: "var(--font-body)",
      fontSize: "16px",
      "::placeholder": { color: "#64748b" },
    },
    invalid: { color: "#ef4444" },
  },
};

function CreditConfirmInner({ clientSecret, packageName, credits, charged, onSuccess, onClose }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card input not ready. Please try again.");
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
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

    setDone(true);
    setTimeout(() => onSuccess(0), 1200);
  }

  const canSubmit = !processing && !!stripe;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(12px)", zIndex: 1000,
        }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(440px, 92vw)", zIndex: 1001,
        borderRadius: 16,
        background: "rgba(13,31,45,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f1f5f9", fontFamily: "var(--font-heading)" }}>
            Complete Purchase
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.4)",
            cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem",
          }}>×</button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {done ? (
            /* Success */
            <div style={{ textAlign: "center", padding: "16px 0" }}>
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
              <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 6, fontFamily: "var(--font-heading)" }}>
                {credits} Credits Added!
              </div>
              <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)" }}>
                Your credits are available immediately.
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: 16, marginBottom: 20,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: "rgba(207,216,220,0.5)",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
                  fontFamily: "var(--font-data)",
                }}>
                  Purchase Summary
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "rgba(207,216,220,0.7)" }}>{packageName}</span>
                  <span style={{ fontSize: 13, color: "#00bcd4", fontWeight: 700 }}>💎 {credits} credits</span>
                </div>
                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  marginTop: 12, paddingTop: 12,
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: 15, color: "#00bcd4", fontWeight: 800 }}>${charged.toFixed(2)}</span>
                </div>
              </div>

              {/* Card input */}
              <div style={{
                padding: "0.75rem 0.9rem", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                marginBottom: 16,
              }}>
                <div style={{
                  fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 500,
                  fontFamily: "var(--font-body)",
                }}>
                  Card Details
                </div>
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>

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

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={!canSubmit}
                style={{
                  width: "100%", height: 50,
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
                {processing ? "Processing…" : `Pay $${charged.toFixed(2)}`}
              </button>

              {/* Trust */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 14, fontSize: 10, color: "rgba(255,255,255,0.3)",
              }}>
                <span>🔒 Secured by Stripe</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function CreditPurchaseModal(props: Props) {
  const stripe = getStripePromise();
  if (!stripe) {
    return (
      <>
        <div onClick={props.onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", zIndex: 1000 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(400px, 92vw)", zIndex: 1001, borderRadius: 16, background: "rgba(13,31,45,0.98)", border: "1px solid rgba(255,255,255,0.1)", padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", marginBottom: "0.5rem" }}>Payment system loading...</p>
          <p style={{ fontSize: "0.85rem", color: "rgba(207,216,220,0.6)" }}>If this persists, please refresh the page.</p>
          <button onClick={props.onClose} style={{ marginTop: "1rem", padding: "0.6rem 1.5rem", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "0.85rem" }}>Close</button>
        </div>
      </>
    );
  }

  return (
    <Elements stripe={stripe}>
      <CreditConfirmInner {...props} />
    </Elements>
  );
}
