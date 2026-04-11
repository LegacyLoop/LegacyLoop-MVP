"use client";

// CMD-WHITE-GLOVE-UI — April 11, 2026
// Premium 3-step White Glove booking modal with Stripe Elements.
// Four Seasons standard. Gold accent. Formal luxury tone.
// Inline styles only. Zero Tailwind.

import { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";

interface Props {
  tier: string;
  tierLabel: string;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  regularPrice?: number;
  heroesDiscount?: boolean;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

const GOLD = "#D4AF37";
const CARD_OPTIONS = {
  style: {
    base: {
      color: "#e2e8f0",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: "15px",
      "::placeholder": { color: "#64748b" },
    },
    invalid: { color: "#ef4444" },
  },
};

function BookingFormInner({ tier, tierLabel, totalAmount, depositAmount, balanceAmount, regularPrice, heroesDiscount, onClose, onSuccess }: Props) {
  const stripeHook = useStripe();
  const elements = useElements();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  const isDemo = typeof window !== "undefined" && (window as any).__DEMO_MODE === true;

  async function handleBook() {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/white-glove/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tier.toLowerCase(),
          serviceType: "ESTATE_SALE",
          scheduledDate: scheduledDate || undefined,
          clientNotes: clientNotes || undefined,
          heroesDiscount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed. Please try again.");
        setProcessing(false);
        return;
      }
      setBookingId(data.bookingId);
      if (data.clientSecret && !isDemo) {
        setClientSecret(data.clientSecret);
        setStep(2);
      } else {
        setStep(3);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setProcessing(false);
  }

  async function handleConfirmPayment() {
    if (!stripeHook || !elements || !clientSecret) return;
    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card input not ready.");
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripeHook.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed.");
      setProcessing(false);
      return;
    }
    if (paymentIntent?.status !== "succeeded") {
      setError("Payment was not completed.");
      setProcessing(false);
      return;
    }

    setStep(3);
    setProcessing(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(12px)", zIndex: 1000,
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(500px, 92vw)", zIndex: 1001,
        borderRadius: 20,
        background: "rgba(13,17,23,0.98)",
        border: `1px solid rgba(212,175,55,0.2)`,
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.06)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.75rem",
          borderBottom: `1px solid rgba(212,175,55,0.12)`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#f1f5f9" }}>
              {step === 3 ? "Booking Confirmed" : step === 2 ? "Secure Your Booking" : "Book White Glove Service"}
            </div>
            <div style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 600, marginTop: "2px" }}>{tierLabel}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.3)",
            cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem",
          }}>×</button>
        </div>

        <div style={{ padding: "1.75rem" }}>

          {/* ── STEP 3: Confirmation ── */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: `rgba(212,175,55,0.12)`, border: `2px solid ${GOLD}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M6 13.5L11 18.5L20 8" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.5rem" }}>
                Your Estate Service Is Booked
              </div>
              <div style={{ fontSize: "0.82rem", color: "rgba(207,216,220,0.6)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Our estate team will contact you within 24 hours to schedule your service and walk you through every step.
              </div>

              <div style={{ background: "rgba(212,175,55,0.04)", border: `1px solid rgba(212,175,55,0.15)`, borderRadius: 12, padding: "1rem", textAlign: "left", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.78rem", color: "rgba(207,216,220,0.6)" }}>Deposit paid</span>
                  <span style={{ fontSize: "0.78rem", color: GOLD, fontWeight: 700 }}>${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.78rem", color: "rgba(207,216,220,0.6)" }}>Balance at completion</span>
                  <span style={{ fontSize: "0.78rem", color: "#f1f5f9", fontWeight: 600 }}>${balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {bookingId && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(212,175,55,0.1)" }}>
                    <span style={{ fontSize: "0.65rem", color: "rgba(207,216,220,0.4)" }}>Ref: {bookingId.slice(0, 12)}...</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: "0.75rem", color: "rgba(207,216,220,0.5)", fontStyle: "italic", marginBottom: "1.25rem" }}>
                Thank you for trusting LegacyLoop with your family{"'"}s legacy.
              </div>

              <button onClick={() => onSuccess(bookingId || "")} style={{
                width: "100%", padding: "0.85rem", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #00bcd4, #0097a7)",
                color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
              }}>
                Done
              </button>
            </div>
          )}

          {/* ── STEP 2: Payment ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: "0.82rem", color: "rgba(207,216,220,0.6)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                Your deposit of <span style={{ color: GOLD, fontWeight: 700 }}>${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> is held securely. The remaining ${balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} is collected at service completion.
              </div>

              <div style={{
                padding: "0.85rem 1rem", borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid rgba(212,175,55,0.15)`,
                marginBottom: "1rem",
              }}>
                <div style={{ fontSize: "0.68rem", color: "rgba(207,216,220,0.5)", marginBottom: "0.4rem", fontWeight: 500 }}>Card Details</div>
                <CardElement options={CARD_OPTIONS} />
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.5rem 0.75rem", marginBottom: "1rem", fontSize: "0.78rem", color: "#ef4444" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: "1rem", fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>
                <span>🔒</span> Secured by Stripe — your information is encrypted
              </div>

              <button onClick={handleConfirmPayment} disabled={processing || !stripeHook} style={{
                width: "100%", padding: "0.85rem", borderRadius: 12, border: "none",
                background: processing ? "rgba(212,175,55,0.3)" : `linear-gradient(135deg, ${GOLD}, #b8962e)`,
                color: processing ? "rgba(0,0,0,0.4)" : "#000", fontWeight: 800, fontSize: "0.9rem",
                cursor: processing ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {processing && <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", animation: "spin 0.7s linear infinite" }} />}
                {processing ? "Processing…" : `Confirm Deposit — $${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </button>

              <button onClick={() => { setStep(1); setError(null); }} style={{
                width: "100%", marginTop: "0.5rem", padding: "0.6rem", background: "transparent",
                border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", cursor: "pointer",
              }}>
                ← Back
              </button>
            </div>
          )}

          {/* ── STEP 1: Summary ── */}
          {step === 1 && (
            <div>
              {/* Pricing summary */}
              <div style={{
                background: "rgba(212,175,55,0.04)", borderLeft: `3px solid ${GOLD}`,
                borderRadius: "0 12px 12px 0", padding: "1.25rem", marginBottom: "1.25rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(207,216,220,0.6)" }}>Service total</span>
                  <div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: GOLD, fontFamily: "'Barlow Condensed', sans-serif" }}>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    {regularPrice && regularPrice > totalAmount && (
                      <span style={{ fontSize: "0.78rem", color: "rgba(207,216,220,0.4)", textDecoration: "line-through", marginLeft: "0.5rem" }}>${regularPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(207,216,220,0.6)" }}>Deposit today (60%)</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Barlow Condensed', sans-serif" }}>${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.82rem", color: "rgba(207,216,220,0.6)" }}>Balance at completion (40%)</span>
                  <span style={{ fontSize: "0.82rem", color: "rgba(207,216,220,0.5)", fontFamily: "'Barlow Condensed', sans-serif" }}>${balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Policy note */}
              <div style={{ fontSize: "0.7rem", color: "rgba(207,216,220,0.4)", lineHeight: 1.6, marginBottom: "1.25rem", padding: "0 0.25rem" }}>
                Deposit is non-refundable after 48 hours. Balance is due within 24 hours of service completion. A $50/day late fee applies after 48 hours.
              </div>

              {/* Optional fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "rgba(207,216,220,0.5)", display: "block", marginBottom: "0.25rem" }}>Preferred date (optional)</label>
                  <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#e2e8f0", fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "rgba(207,216,220,0.5)", display: "block", marginBottom: "0.25rem" }}>Notes for our team (optional)</label>
                  <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} rows={2} placeholder="Any details about the estate, timeline, or special requirements..."
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#e2e8f0", fontSize: "0.82rem", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.5rem 0.75rem", marginBottom: "1rem", fontSize: "0.78rem", color: "#ef4444" }}>
                  {error}
                </div>
              )}

              <button onClick={handleBook} disabled={processing} style={{
                width: "100%", padding: "0.85rem", borderRadius: 12, border: "none",
                background: processing ? "rgba(212,175,55,0.3)" : `linear-gradient(135deg, ${GOLD}, #b8962e)`,
                color: processing ? "rgba(0,0,0,0.4)" : "#000", fontWeight: 800, fontSize: "0.9rem",
                cursor: processing ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: processing ? "none" : "0 4px 20px rgba(212,175,55,0.25)",
              }}>
                {processing && <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", animation: "spin 0.7s linear infinite" }} />}
                {processing ? "Processing…" : `Book Now — Pay $${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} Deposit`}
              </button>

              <button onClick={onClose} style={{
                width: "100%", marginTop: "0.5rem", padding: "0.6rem", background: "transparent",
                border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function WhiteGloveBookingModal(props: Props) {
  return (
    <Elements stripe={stripePromise}>
      <BookingFormInner {...props} />
    </Elements>
  );
}
