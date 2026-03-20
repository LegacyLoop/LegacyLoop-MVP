"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProcessingFeeTooltip from "@/app/components/ProcessingFeeTooltip";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

type Props = {
  itemId: string;
  itemTitle: string;
  price: number;
  shippingEstimate?: number;
  photoUrl?: string;
};

export default function BuyNowModal({ itemId, itemTitle, price, shippingEstimate = 0, photoUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");

  const subtotal = price + shippingEstimate;
  const fee = Math.round(subtotal * PROCESSING_FEE.buyerRate * 100) / 100;
  const total = Math.round((subtotal + fee) * 100) / 100;

  async function handlePurchase() {
    if (!buyerName.trim() || !buyerEmail.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "item_purchase",
          id: itemId,
          shippingCost: shippingEstimate,
          buyerName: buyerName.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/payments/success?type=item_purchase&amount=${data.subtotal}&fee=${data.processingFee}&total=${data.total}&item=${encodeURIComponent(data.itemTitle || itemTitle)}`);
      }
    } catch (e) {
      console.error("Purchase failed:", e);
    } finally {
      setProcessing(false);
    }
  }

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
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
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
          <button onClick={() => setOpen(false)} style={{
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
            {shippingEstimate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Shipping</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>${shippingEstimate.toFixed(2)}</span>
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

          {/* Purchase button */}
          <button
            onClick={handlePurchase}
            disabled={processing || !buyerName.trim() || !buyerEmail.trim()}
            className="btn-primary"
            style={{
              width: "100%", padding: "0.85rem", fontSize: "1rem", fontWeight: 800,
              borderRadius: "0.75rem",
              opacity: (processing || !buyerName.trim() || !buyerEmail.trim()) ? 0.6 : 1,
              cursor: (processing || !buyerName.trim() || !buyerEmail.trim()) ? "not-allowed" : "pointer",
            }}
          >
            {processing ? "Processing..." : `Pay $${total.toFixed(2)}`}
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
            <span>Secure Checkout</span>
            <span>Powered by Square</span>
          </div>
        </div>
      </div>
    </>
  );
}
