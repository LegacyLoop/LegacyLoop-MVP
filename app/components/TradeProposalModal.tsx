"use client";
import { useState } from "react";

interface TradeItem {
  title: string;
  estimatedValue: string;
  condition: string;
  description: string;
}

export default function TradeProposalModal({ itemId, itemTitle, onClose }: { itemId: string; itemTitle: string; onClose: () => void }) {
  const [items, setItems] = useState<TradeItem[]>([{ title: "", estimatedValue: "", condition: "Good", description: "" }]);
  const [cashAdded, setCashAdded] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateItem(idx: number, field: string, value: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  function addItem() {
    if (items.length < 5) setItems(prev => [...prev, { title: "", estimatedValue: "", condition: "Good", description: "" }]);
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (items.some(i => !i.title || !i.estimatedValue || Number(i.estimatedValue) <= 0)) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/trades/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          proposedItems: items.map(i => ({ title: i.title, estimatedValue: Number(i.estimatedValue), condition: i.condition, description: i.description || null })),
          cashAdded: Number(cashAdded) || null,
          buyerNote: buyerNote || null,
          buyerName: buyerName || null,
          buyerEmail: buyerEmail || null,
        }),
      });
      if (res.ok) setSuccess(true);
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  const totalValue = items.reduce((s, i) => s + (Number(i.estimatedValue) || 0), 0) + (Number(cashAdded) || 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "rgba(10,25,40,0.97)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: 16, maxWidth: 560, width: "95%", maxHeight: "90vh", overflow: "auto", padding: 28 }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Trade Proposal Sent!</div>
            <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginBottom: 20 }}>The seller will review your offer and respond soon.</div>
            <button onClick={onClose} style={{ padding: "10px 24px", background: "#00bcd4", color: "#000", fontWeight: 700, fontSize: 13, borderRadius: 8, border: "none", cursor: "pointer" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>🔄 Propose a Trade</div>
                <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginTop: 4 }}>for: {itemTitle}</div>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 10 }}>What are you offering?</div>
            {items.map((item, idx) => (
              <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input placeholder="Item name *" value={item.title} onChange={e => updateItem(idx, "title", e.target.value)} style={{ flex: 2, padding: "8px 10px", fontSize: 13, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#fff", outline: "none" }} />
                  <input placeholder="Value $" type="number" value={item.estimatedValue} onChange={e => updateItem(idx, "estimatedValue", e.target.value)} style={{ flex: 1, padding: "8px 10px", fontSize: 13, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#00bcd4", outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={item.condition} onChange={e => updateItem(idx, "condition", e.target.value)} style={{ flex: 1, padding: "6px 8px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#fff", outline: "none" }}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                  <input placeholder="Description (optional)" value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} style={{ flex: 2, padding: "6px 8px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#fff", outline: "none" }} />
                  {items.length > 1 && <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 14, cursor: "pointer", padding: "0 4px" }}>✕</button>}
                </div>
              </div>
            ))}
            {items.length < 5 && (
              <button onClick={addItem} style={{ width: "100%", padding: "8px", fontSize: 12, fontWeight: 600, background: "transparent", border: "1px dashed rgba(0,188,212,0.3)", borderRadius: 8, color: "#00bcd4", cursor: "pointer", marginBottom: 16 }}>+ Add Another Item</button>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginBottom: 6 }}>Adding cash? (optional)</div>
              <input placeholder="$0.00" type="number" value={cashAdded} onChange={e => setCashAdded(e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: 13, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#00bcd4", outline: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input placeholder="Your name" value={buyerName} onChange={e => setBuyerName(e.target.value)} style={{ flex: 1, padding: "8px 10px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#fff", outline: "none" }} />
              <input placeholder="Your email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} style={{ flex: 1, padding: "8px 10px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#fff", outline: "none" }} />
            </div>

            <textarea placeholder="Tell the seller why your items are a great trade..." value={buyerNote} onChange={e => setBuyerNote(e.target.value)} rows={3} style={{ width: "100%", padding: "8px 10px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", outline: "none", resize: "vertical", marginBottom: 16 }} />

            {totalValue > 0 && (
              <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginBottom: 12 }}>Total trade value: <span style={{ color: "#00bcd4", fontWeight: 700 }}>${Math.round(totalValue)}</span></div>
            )}

            <button onClick={handleSubmit} disabled={submitting || items.some(i => !i.title || !i.estimatedValue)} style={{ width: "100%", height: 52, background: "linear-gradient(135deg, #00bcd4, #0097a7)", color: "#000", fontWeight: 700, fontSize: 14, borderRadius: 10, border: "none", cursor: submitting ? "wait" : "pointer", opacity: items.some(i => !i.title || !i.estimatedValue) ? 0.5 : 1 }}>
              {submitting ? "Sending..." : "Send Trade Proposal"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
