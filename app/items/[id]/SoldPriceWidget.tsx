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

  function getDeltaColor(delta: number | null, estimated: number | null): string {
    if (delta == null || estimated == null) return "var(--text-muted)";
    if (delta >= 0) return "#4caf50";
    const pct = Math.abs(delta) / estimated;
    return pct <= 0.2 ? "#f59e0b" : "#ef4444";
  }

  const priceNum = parseFloat(soldPrice) || 0;
  const sellerFee = Math.round(priceNum * 0.0175 * 100) / 100;
  const netKeep = Math.round((priceNum - Math.round(priceNum * 0.05 * 100) / 100 - sellerFee) * 100) / 100;

  return (
    <div style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderLeft: "3px solid #00bcd4", borderRadius: 12, padding: "20px 22px" }}>
      {showForm ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{"\u{1F4B0}"} Record Your Sale</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>Recording the real price helps improve AI accuracy for everyone.</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Final Sale Price</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#00bcd4", fontWeight: 700 }}>$</span>
              <input
                type="number"
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
                placeholder="0.00"
                style={{ width: "100%", padding: "12px 12px 12px 28px", fontSize: 16, fontWeight: 600, background: "var(--input-bg, var(--ghost-bg))", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#00bcd4"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
              />
            </div>
            {priceNum > 0 && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                After ~5% commission + 1.75% fee {"\u2192"} You keep ~<span style={{ color: "#4ade80", fontWeight: 600 }}>${netKeep.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>How did it sell?</label>
            <select
              value={soldVia}
              onChange={(e) => setSoldVia(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, background: "var(--input-bg, var(--ghost-bg))", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)", outline: "none", cursor: "pointer", boxSizing: "border-box" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#00bcd4"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
            >
              <option value="offer">Accepted Offer</option>
              <option value="direct">Direct Sale</option>
              <option value="trade">Trade / Barter</option>
              <option value="external">Sold on External Platform</option>
              <option value="auction">Auction</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !soldPrice || parseFloat(soldPrice) <= 0}
            style={{ width: "100%", height: 48, background: submitting ? "rgba(0,188,212,0.3)" : "#00bcd4", color: "#fff", fontWeight: 700, fontSize: 14, borderRadius: 8, border: "none", cursor: submitting ? "wait" : "pointer", opacity: (!soldPrice || parseFloat(soldPrice) <= 0) ? 0.5 : 1 }}
          >
            {submitting ? "Recording..." : "Record Sale"}
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#4caf50", marginBottom: 12 }}>{"\u2705"} Sale recorded</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 80, border: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>Sold for</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>${result!.soldPrice}</div>
            </div>
            {result!.estimatedValue != null && (
              <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 80, border: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>Estimated</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)" }}>${result!.estimatedValue}</div>
              </div>
            )}
            {result!.priceDelta != null && (
              <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 80, border: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>Difference</div>
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
