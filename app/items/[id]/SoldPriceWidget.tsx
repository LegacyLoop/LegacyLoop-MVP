"use client";

import { useState } from "react";

interface Props {
  itemId: string;
  status: string;
  existingSoldPrice?: number | null;
  existingEstimatedValue?: number | null;
}

export default function SoldPriceWidget({ itemId, status, existingSoldPrice, existingEstimatedValue }: Props) {
  const [soldPrice, setSoldPrice] = useState<string>(existingSoldPrice ? String(existingSoldPrice) : "");
  const [soldVia, setSoldVia] = useState<string>("direct");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ soldPrice: number; estimatedValue: number | null; priceDelta: number | null } | null>(
    existingSoldPrice ? { soldPrice: existingSoldPrice, estimatedValue: existingEstimatedValue ?? null, priceDelta: existingEstimatedValue != null ? existingSoldPrice - existingEstimatedValue : null } : null
  );
  const [editing, setEditing] = useState(false);

  // Only show for SOLD status or items that already have a sold price
  if (status !== "SOLD" && status !== "SHIPPED" && status !== "COMPLETED" && !existingSoldPrice) return null;

  const showForm = !result || editing;

  async function handleSubmit() {
    const price = parseFloat(soldPrice);
    if (!price || price <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/items/sold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, soldPrice: price, soldVia }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ soldPrice: data.soldPrice, estimatedValue: data.estimatedValue, priceDelta: data.priceDelta });
        setEditing(false);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  // Delta color
  function getDeltaColor(delta: number | null, estimated: number | null): string {
    if (delta == null || estimated == null) return "rgba(207,216,220,0.6)";
    if (delta >= 0) return "#4caf50";
    const pct = Math.abs(delta) / estimated;
    return pct <= 0.2 ? "#f59e0b" : "#ef4444";
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "3px solid #00bcd4", borderRadius: 12, padding: "20px 22px" }}>
      {showForm ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>What did this sell for?</div>
          <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginBottom: 16, lineHeight: 1.5 }}>Recording the real price helps improve AI accuracy for everyone.</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(207,216,220,0.7)", marginBottom: 6 }}>Final Sale Price</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#00bcd4", fontWeight: 700 }}>$</span>
              <input
                type="number"
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
                placeholder="0.00"
                style={{ width: "100%", padding: "12px 12px 12px 28px", fontSize: 16, fontWeight: 600, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", outline: "none" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00bcd4"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(207,216,220,0.7)", marginBottom: 6 }}>How did it sell?</label>
            <select
              value={soldVia}
              onChange={(e) => setSoldVia(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", outline: "none", cursor: "pointer" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00bcd4"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              <option value="offer">Accepted Offer</option>
              <option value="direct">Direct Sale</option>
              <option value="trade">Trade / Barter</option>
              <option value="external">Sold on External Platform</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !soldPrice || parseFloat(soldPrice) <= 0}
            style={{ width: "100%", height: 48, background: submitting ? "rgba(0,188,212,0.3)" : "#00bcd4", color: "#000", fontWeight: 700, fontSize: 14, borderRadius: 8, border: "none", cursor: submitting ? "wait" : "pointer", opacity: (!soldPrice || parseFloat(soldPrice) <= 0) ? 0.5 : 1 }}
          >
            {submitting ? "Recording..." : "Record Sale"}
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#4caf50", marginBottom: 12 }}>Sale recorded</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 9, color: "rgba(207,216,220,0.5)", marginBottom: 2 }}>Sold for</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>${result!.soldPrice}</div>
            </div>
            {result!.estimatedValue != null && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 80 }}>
                <div style={{ fontSize: 9, color: "rgba(207,216,220,0.5)", marginBottom: 2 }}>Estimated</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(207,216,220,0.6)" }}>${result!.estimatedValue}</div>
              </div>
            )}
            {result!.priceDelta != null && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 80 }}>
                <div style={{ fontSize: 9, color: "rgba(207,216,220,0.5)", marginBottom: 2 }}>Difference</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: getDeltaColor(result!.priceDelta, result!.estimatedValue) }}>
                  {result!.priceDelta! >= 0 ? "+" : ""}{result!.priceDelta! > 0 ? `$${result!.priceDelta}` : result!.priceDelta === 0 ? "$0" : `-$${Math.abs(result!.priceDelta!)}`}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: "#00bcd4", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}>Edit sale price</button>
        </>
      )}
    </div>
  );
}
