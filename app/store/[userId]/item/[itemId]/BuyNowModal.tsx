"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import ProcessingFeeTooltip from "@/app/components/ProcessingFeeTooltip";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

type Props = {
  itemId: string;
  itemTitle: string;
  price: number;
  shippingEstimate?: number;
  photoUrl?: string;
};

/* ── Stripe CardElement styling ──────────────────────────────── */
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

/* ── Inner checkout form (must be inside <Elements>) ─────────── */
function CheckoutForm({
  itemId, itemTitle, price, shippingEstimate, photoUrl, onClose,
}: Props & { onClose: () => void }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");

  const shipping = shippingEstimate ?? 0;
  const subtotal = price + shipping;
  const fee = Math.round(subtotal * PROCESSING_FEE.buyerRate * 100) / 100;
  const total = Math.round((subtotal + fee) * 100) / 100;

  const isDemo = typeof window !== "undefined" && (window as any).__DEMO_MODE === true;
  const canSubmit = buyerName.trim() && buyerEmail.trim() && !processing;

  async function handlePurchase() {
    if (!canSubmit) return;
    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create PaymentIntent on server
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "item_purchase",
          id: itemId,
          shippingCost: shipping,
          buyerName: buyerName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment failed. Please try again.");
        setProcessing(false);
        return;
      }

      // Step 2: If clientSecret returned, confirm with Stripe
      if (data.clientSecret && stripe && elements) {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setError("Card input not ready. Please try again.");
          setProcessing(false);
          return;
        }

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: buyerName.trim(),
                email: buyerEmail.trim(),
              },
            },
          }
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

      // Step 3: Success — redirect
      router.push(
        `/payments/success?type=item_purchase&amount=${data.subtotal ?? subtotal}&fee=${data.processingFee ?? fee}&total=${data.total ?? total}&item=${encodeURIComponent(data.itemTitle || itemTitle)}`
      );
    } catch (e) {
      console.error("Purchase failed:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)", zIndex: 100,
        }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(460px, 90vw)", zIndex: 101,
        borderRadius: "1.5rem",
        background: "var(--bg-card-solid)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-default)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>Order Summary</div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
            fontSize: "1.25rem", padding: "0.25rem",
          }}>×</button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Item preview */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
            {photoUrl && (
              <img src={photoUrl} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "0.75rem" }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{itemTitle}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>LegacyLoop Estate Sale</div>
            </div>
          </div>

          {/* Price breakdown */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "0.75rem",
            padding: "1rem",
            marginBottom: "1.25rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Item price</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>${price.toLocaleString()}</span>
            </div>
            {shipping > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Shipping</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>${shipping.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>
                Processing fee ({PROCESSING_FEE.buyerDisplay} — your share)
              </span>
              <span style={{ color: "var(--text-muted)" }}>${fee.toFixed(2)}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              borderTop: "1px solid var(--border-default)", paddingTop: "0.5rem", marginTop: "0.3rem",
              fontSize: "1.05rem", fontWeight: 800,
            }}>
              <span style={{ color: "var(--text-primary)" }}>Total</span>
              <span style={{ color: "var(--accent)" }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Buyer info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <input
              type="text"
              placeholder="Your name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="input-dark"
              style={{ padding: "0.65rem 0.9rem", borderRadius: "0.6rem", fontSize: "0.88rem" }}
            />
            <input
              type="email"
              placeholder="Your email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className="input-dark"
              style={{ padding: "0.65rem 0.9rem", borderRadius: "0.6rem", fontSize: "0.88rem" }}
            />
          </div>

          {/* Stripe Card Input */}
          {!isDemo && (
            <div style={{
              padding: "0.75rem 0.9rem",
              borderRadius: "0.6rem",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: "1.25rem",
            }}>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.4rem", fontWeight: 500 }}>
                Card Details
              </div>
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "0.5rem",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: "0.8rem",
              marginBottom: "1rem",
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {/* Purchase button */}
          <button
            onClick={handlePurchase}
            disabled={!canSubmit}
            className="btn-primary"
            style={{
              width: "100%", padding: "0.85rem", fontSize: "1rem", fontWeight: 800,
              borderRadius: "0.75rem",
              opacity: canSubmit ? 1 : 0.6,
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
          >
            {processing && (
              <div style={{
                width: "16px", height: "16px", borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                animation: "spin 0.7s linear infinite",
              }} />
            )}
            {processing ? "Processing…" : `Pay $${total.toFixed(2)}`}
          </button>

          {/* Fee note */}
          <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <ProcessingFeeTooltip amount={subtotal} compact showSplit />
          </div>

          {/* Security badges */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem",
            marginTop: "1rem", fontSize: "0.68rem", color: "var(--text-muted)",
          }}>
            <span>🔒 Secure Checkout</span>
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main export (wraps inner form with Elements) ────────────── */
export default function BuyNowModal({ itemId, itemTitle, price, shippingEstimate = 0, photoUrl }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary"
        style={{
          width: "100%",
          padding: "0.85rem",
          fontSize: "1.05rem",
          borderRadius: "0.75rem",
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
      >
        Buy Now — ${price.toLocaleString()}
      </button>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        itemId={itemId}
        itemTitle={itemTitle}
        price={price}
        shippingEstimate={shippingEstimate}
        photoUrl={photoUrl}
        onClose={() => setOpen(false)}
      />
    </Elements>
  );
}
