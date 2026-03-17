"use client";

import { useState } from "react";

type Props = {
  itemId: string;
  fromZip: string | null;
};

type Rate = {
  id: string;
  carrier: string;
  service: string;
  days: string;
  price: number;
};

const MOCK_RATES: Rate[] = [
  { id: "usps_priority", carrier: "USPS", service: "Priority Mail 2-Day", days: "2 business days", price: 12.80 },
  { id: "ups_ground",    carrier: "UPS",  service: "Ground",               days: "5 business days", price: 9.40  },
  { id: "fedex_home",   carrier: "FedEx", service: "Home Delivery",        days: "3 business days", price: 14.60 },
];

const CARRIER_ICON: Record<string, string> = {
  USPS: "🇺🇸",
  UPS: "📦",
  FedEx: "🚀",
};

type LabelMethod = "print" | "qr" | "pickup";

const METHODS: { id: LabelMethod; emoji: string; label: string; desc: string; recommended?: boolean }[] = [
  { id: "print",   emoji: "🖨️",  label: "Print Label",        desc: "Home printer — download PDF" },
  { id: "qr",      emoji: "📱",  label: "QR Code",            desc: "No printer needed — show at UPS/FedEx/USPS", recommended: true },
  { id: "pickup",  emoji: "🚪",  label: "Schedule Pickup",    desc: "$5 fee · waived for premium members" },
];

export default function ShippingLabelPanel({ itemId, fromZip }: Props) {
  const [weight, setWeight] = useState("2");
  const [boxSize, setBoxSize] = useState<"small" | "medium" | "large">("medium");
  const [step, setStep] = useState<"setup" | "rates" | "method" | "done">("setup");
  const [rates] = useState<Rate[]>(MOCK_RATES);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [labelMethod, setLabelMethod] = useState<LabelMethod>("qr");
  const [labelBusy, setLabelBusy] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const BOX_WEIGHTS: Record<string, string> = { small: "1", medium: "3", large: "8" };

  const handleGetRates = () => {
    setStep("rates");
  };

  const handleSelectRate = (rate: Rate) => {
    setSelectedRate(rate);
    setStep("method");
  };

  const handleCreateLabel = async () => {
    if (!selectedRate) return;
    setLabelBusy(true);

    // Call the existing mock label API
    const res = await fetch("/api/shipping/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rateId: selectedRate.id }),
    });

    const data = await res.json().catch(() => ({}));
    setLabelBusy(false);

    const tracking = data.tracking_number || `9400111899223082${Math.floor(Math.random() * 100000)}`;
    setTrackingNumber(tracking);

    if (labelMethod === "qr") {
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tracking)}`);
    }

    setStep("done");
  };

  const copyTracking = () => {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card p-6">
      <div className="section-title">📦 Create Shipping Label</div>
      <p className="muted text-sm mt-1 mb-5">
        Generate a label with QR code — no printer needed.
      </p>

      {step === "setup" && (
        <div>
          {/* Box size quick-select */}
          <div style={{ marginBottom: "1rem" }}>
            <label className="label" style={{ fontSize: "0.82rem" }}>Package size</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["small", "medium", "large"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setBoxSize(s); setWeight(BOX_WEIGHTS[s]); }}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    border: `2px solid ${boxSize === s ? "#0f766e" : "#e7e5e4"}`,
                    borderRadius: "0.75rem",
                    background: boxSize === s ? "#f0fdfa" : "#fff",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: boxSize === s ? 700 : 400,
                    color: boxSize === s ? "#0f766e" : "#374151",
                    transition: "all 0.15s",
                  }}
                >
                  {s === "small" ? "📦 Small\n≤ 2 lbs" : s === "medium" ? "📦 Medium\n2–5 lbs" : "📦 Large\n5–20 lbs"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label className="label" style={{ fontSize: "0.82rem" }}>Estimated weight (lbs)</label>
            <input
              type="number"
              className="input"
              min="0.1"
              max="70"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{ maxWidth: "160px" }}
            />
          </div>

          <button className="btn-primary" onClick={handleGetRates}>
            Get Rates →
          </button>
        </div>
      )}

      {step === "rates" && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem" }}>Select a carrier</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {rates.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  border: "1.5px solid #e7e5e4",
                  borderRadius: "0.875rem",
                  background: "#fff",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>{CARRIER_ICON[r.carrier] ?? "📫"}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{r.carrier} — {r.service}</div>
                    <div style={{ fontSize: "0.72rem", color: "#78716c" }}>{r.days}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f766e" }}>${r.price.toFixed(2)}</span>
                  <button
                    className="btn-primary"
                    style={{ fontSize: "0.78rem", padding: "0.35rem 0.875rem" }}
                    onClick={() => handleSelectRate(r)}
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-ghost" style={{ marginTop: "0.75rem", fontSize: "0.82rem" }} onClick={() => setStep("setup")}>
            ← Back
          </button>
        </div>
      )}

      {step === "method" && selectedRate && (
        <div>
          <div style={{ marginBottom: "0.75rem", padding: "0.75rem 1rem", background: "#f0fdfa", border: "1.5px solid #99f6e4", borderRadius: "0.875rem", fontSize: "0.85rem" }}>
            Selected: <strong>{selectedRate.carrier} — {selectedRate.service}</strong> · <strong>${selectedRate.price.toFixed(2)}</strong>
          </div>

          <div style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem" }}>How would you like your label?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {METHODS.map((m) => (
              <label
                key={m.id}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                  padding: "0.875rem 1rem",
                  border: `2px solid ${labelMethod === m.id ? "#0f766e" : "#e7e5e4"}`,
                  borderRadius: "0.875rem",
                  background: labelMethod === m.id ? "#f0fdfa" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="labelMethod"
                  value={m.id}
                  checked={labelMethod === m.id}
                  onChange={() => setLabelMethod(m.id)}
                  style={{ marginTop: "0.15rem" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>{m.emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.label}</span>
                    {m.recommended && (
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#0f766e", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "999px", letterSpacing: "0.04em" }}>
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "0.15rem" }}>{m.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep("rates")}>← Back</button>
            <button
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={labelBusy}
              onClick={handleCreateLabel}
            >
              {labelBusy ? "Creating…" : "Create Label"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && trackingNumber && (
        <div>
          <div
            style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.25rem" }}
          >
            <div style={{ fontWeight: 700, color: "#15803d", marginBottom: "0.5rem" }}>✅ Label Created!</div>
            <div style={{ fontSize: "0.85rem", color: "#166534", marginBottom: "0.75rem" }}>
              Carrier: {selectedRate?.carrier} — {selectedRate?.service}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <div style={{ fontFamily: "monospace", background: "#fff", border: "1px solid #86efac", borderRadius: "0.5rem", padding: "0.35rem 0.75rem", fontSize: "0.88rem", color: "#15803d", letterSpacing: "0.04em" }}>
                {trackingNumber}
              </div>
              <button
                onClick={copyTracking}
                className="btn-ghost"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}
              >
                {copied ? "✅ Copied!" : "📋 Copy"}
              </button>
            </div>
          </div>

          {labelMethod === "qr" && qrUrl && (
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>📱 Your QR Code</div>
              <img
                src={qrUrl}
                alt="Shipping QR code"
                style={{ width: "200px", height: "200px", border: "3px solid #e7e5e4", borderRadius: "1rem", margin: "0 auto 0.75rem" }}
              />
              <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "0.75rem" }}>
                Show this QR code at any of these locations — they'll print it for you:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center", marginBottom: "0.875rem" }}>
                {["UPS Store ✅", "FedEx Office ✅", "USPS ✅", "Walgreens ✅", "CVS ✅"].map((loc) => (
                  <span
                    key={loc}
                    style={{ padding: "0.2rem 0.6rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "999px", fontSize: "0.75rem", color: "#15803d", fontWeight: 600 }}
                  >
                    {loc}
                  </span>
                ))}
              </div>
              <a
                href={qrUrl}
                download="shipping-qr.png"
                className="btn-ghost"
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem" }}
              >
                💾 Save QR to photos
              </a>
            </div>
          )}

          {labelMethod === "print" && (
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <button
                type="button"
                className="btn-primary"
                style={{ display: "inline-block" }}
                onClick={() => { alert("In production, this downloads your PDF label."); }}
              >
                🖨️ Download Label PDF
              </button>
            </div>
          )}

          {labelMethod === "pickup" && (
            <div style={{ background: "#fef3c7", border: "1.5px solid #fde047", borderRadius: "0.875rem", padding: "1rem", marginBottom: "1.25rem", textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: "#92400e" }}>🚪 Pickup Scheduled</div>
              <div style={{ fontSize: "0.82rem", color: "#78350f", marginTop: "0.25rem" }}>A driver will come to your door. $5 fee applied at checkout.</div>
            </div>
          )}

          <button
            className="btn-ghost w-full"
            onClick={() => { setStep("setup"); setTrackingNumber(null); setQrUrl(null); setSelectedRate(null); }}
          >
            Create another label
          </button>
        </div>
      )}
    </div>
  );
}
