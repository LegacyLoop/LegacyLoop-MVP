"use client";

import { useState } from "react";

type Rate = {
  object_id: string;
  provider: string;
  servicelevel_name: string;
  amount: string;
  currency: string;
  estimated_days: number | null;
};

type Props = {
  fromZip: string | null;
};

const CARRIER_ICON: Record<string, string> = {
  USPS: "🇺🇸",
  UPS: "📦",
  FedEx: "🚀",
  DHL: "🌍",
};

export default function ShippingCalculator({ fromZip }: Props) {
  const [toZip, setToZip] = useState("");
  const [weight, setWeight] = useState("2");
  const [busy, setBusy] = useState(false);
  const [rates, setRates] = useState<Rate[] | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState("");
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [label, setLabel] = useState<{ tracking_number: string; label_url: string; status: string } | null>(null);
  const [labelBusy, setLabelBusy] = useState(false);

  const getRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toZip.trim()) return;
    setBusy(true);
    setError("");
    setRates(null);
    setLabel(null);

    const res = await fetch("/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromZip: fromZip || "10001", toZip: toZip.trim(), weight }),
    });

    if (!res.ok) { setError(await res.text()); setBusy(false); return; }
    const data = await res.json();
    setRates(data.rates);
    setIsMock(data.isMock);
    setBusy(false);
  };

  const getLabel = async (rate: Rate) => {
    setSelectedRate(rate);
    setLabelBusy(true);
    const res = await fetch("/api/shipping/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rateId: rate.object_id }),
    });
    if (res.ok) {
      const data = await res.json();
      setLabel(data);
    }
    setLabelBusy(false);
  };

  return (
    <div className="card p-6">
      <div className="section-title">📦 Shipping Calculator</div>
      <p className="muted text-sm mt-1 mb-4">
        Estimate shipping cost before you price the item.
        {!fromZip && " Add your ZIP in Edit Details for more accurate rates."}
      </p>

      <form onSubmit={getRates} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 120px" }}>
          <label className="label" style={{ fontSize: "0.8rem" }}>Buyer's ZIP</label>
          <input
            className="input"
            value={toZip}
            onChange={(e) => setToZip(e.target.value)}
            placeholder="90210"
            maxLength={5}
            required
          />
        </div>
        <div style={{ flex: "1 1 100px" }}>
          <label className="label" style={{ fontSize: "0.8rem" }}>Est. weight (lbs)</label>
          <input
            className="input"
            type="number"
            min="0.1"
            max="70"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary" style={{ padding: "0.65rem 1.25rem" }}>
          {busy ? "Checking…" : "Get Rates"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "#fee2e2", color: "#991b1b", borderRadius: "0.5rem", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {rates && (
        <div style={{ marginTop: "1rem" }}>
          {isMock && (
            <div style={{ marginBottom: "0.5rem", padding: "0.4rem 0.75rem", background: "#fef3c7", color: "#92400e", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 600 }}>
              📋 Sample rates (add SHIPPO_API_KEY for live rates)
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {rates.map((r) => (
              <div
                key={r.object_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.875rem",
                  borderRadius: "0.875rem",
                  border: "1.5px solid",
                  borderColor: selectedRate?.object_id === r.object_id ? "#0f766e" : "#e7e5e4",
                  background: selectedRate?.object_id === r.object_id ? "#f0fdfa" : "#fff",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{CARRIER_ICON[r.provider] ?? "📫"}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                      {r.provider} — {r.servicelevel_name}
                    </div>
                    {r.estimated_days != null && (
                      <div style={{ fontSize: "0.72rem", color: "#78716c" }}>
                        Est. {r.estimated_days} business day{r.estimated_days !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f766e" }}>
                    ${Number(r.amount).toFixed(2)}
                  </span>
                  <button
                    onClick={() => getLabel(r)}
                    disabled={labelBusy}
                    className="btn-ghost"
                    style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
                  >
                    {labelBusy && selectedRate?.object_id === r.object_id ? "…" : "Generate Label"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {label && (
            <div
              style={{
                marginTop: "0.875rem",
                padding: "0.875rem",
                background: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: "0.875rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: "0.4rem" }}>
                ✅ Label Ready
              </div>
              <div style={{ fontSize: "0.82rem", color: "#166534" }}>
                Tracking: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{label.tracking_number}</span>
              </div>
              {label.label_url && (
                <a
                  href={label.label_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ display: "inline-flex", marginTop: "0.6rem", padding: "0.5rem 1rem", fontSize: "0.82rem" }}
                >
                  🖨️ Print Label
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
