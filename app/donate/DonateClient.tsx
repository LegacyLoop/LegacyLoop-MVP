"use client";

import { useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  title: string;
  status: string;
  condition: string | null;
  estimatedHigh: number | null;
  photo: string | null;
};

const CHARITIES = [
  {
    id: "goodwill",
    name: "Goodwill Portland",
    emoji: "🏪",
    tagline: "Empowering people through the power of work",
    pickup: true,
    note: "Free pickup available",
    color: "#1a4b8c",
  },
  {
    id: "salvation_army",
    name: "Salvation Army",
    emoji: "🛡️",
    tagline: "Doing the most good",
    pickup: true,
    note: "Free pickup available",
    color: "#e31837",
  },
  {
    id: "habitat",
    name: "Habitat for Humanity ReStore",
    emoji: "🔨",
    tagline: "Building homes, communities, and hope",
    pickup: false,
    note: "Drop-off only",
    color: "#2b5fb3",
  },
  {
    id: "library",
    name: "Local Library",
    emoji: "📚",
    tagline: "Books & media only",
    pickup: false,
    note: "Books, DVDs, CDs accepted",
    color: "#166534",
  },
];

const TIME_WINDOWS = [
  "8am – 10am",
  "10am – 12pm",
  "12pm – 2pm",
  "2pm – 4pm",
  "4pm – 6pm",
];

type Props = { items: Item[] };

export default function DonateClient({ items }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0]);
  const [address, setAddress] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const totalDeduction = items
    .filter((i) => selectedIds.has(i.id))
    .reduce((sum, i) => sum + (i.estimatedHigh ?? 0), 0);

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const charityObj = CHARITIES.find((c) => c.id === selectedCharity);

  const handleSchedule = async () => {
    setError("");
    if (!address.trim()) { setError("Please enter your pickup address."); return; }

    setBusy(true);
    const res = await fetch("/api/donation/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemIds: Array.from(selectedIds),
        charity: charityObj?.name,
        pickupDate,
        timeWindow,
        address,
        accessNotes,
      }),
    });
    setBusy(false);

    if (!res.ok) {
      const msg = await res.text();
      setError(msg || "Something went wrong.");
      return;
    }

    setStep(4);
  };

  if (step === 4) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-8 text-center">
          <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>🤝</div>
          <h2 className="h2 mb-3">Donation Scheduled!</h2>
          <div
            style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem", textAlign: "left" }}
          >
            <div style={{ fontWeight: 700, color: "#15803d", marginBottom: "0.5rem" }}>
              {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} donated to {charityObj?.name}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#166534", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span>📅 Pickup: {new Date(pickupDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
              <span>🕐 Time window: {timeWindow}</span>
              <span>📍 Address: {address}</span>
            </div>
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
            You'll receive an official tax receipt from {charityObj?.name} after pickup.
          </p>
          {totalDeduction > 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Estimated tax deduction: <strong>${Math.round(totalDeduction).toLocaleString()}</strong> (consult a tax advisor for your specific deduction).
            </p>
          )}
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Items have been marked as completed in your inventory.
          </p>
          <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
            <Link href="/dashboard" style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
              textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
              border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
            }}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="section-title">Donate</div>
      <h1 className="h2 mt-2 mb-2">Donate items to charity</h1>
      <p className="muted mb-6">
        Turn unsold items into tax deductions. Schedule a free pickup with a local charity.
      </p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "4px",
              background: step >= s ? "#0f766e" : "#e7e5e4",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      {/* Step 1 — Item selection */}
      {step === 1 && (
        <div className="card p-6">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Select items to donate</div>
            <button
              onClick={toggleAll}
              className="btn-ghost"
              style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
            >
              {selectedIds.size === items.length ? "Deselect all" : "Select all unsold"}
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📦</div>
              <p>No eligible items found. All items may already be sold or completed.</p>
              <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
                <Link href="/dashboard" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
                  textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
                  border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
                }}>
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {items.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    padding: "0.875rem",
                    border: `2px solid ${selectedIds.has(item.id) ? "#0f766e" : "#e7e5e4"}`,
                    borderRadius: "1rem",
                    cursor: "pointer",
                    background: selectedIds.has(item.id) ? "#f0fdfa" : "#fff",
                    alignItems: "flex-start",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    style={{ marginTop: "0.2rem", flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    {item.photo && (
                      <img
                        src={item.photo}
                        alt={item.title}
                        style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "0.5rem", marginBottom: "0.4rem" }}
                      />
                    )}
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", wordBreak: "break-word" }}>{item.title}</div>
                    {item.condition && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{item.condition}</div>
                    )}
                    {item.estimatedHigh != null && (
                      <div style={{ fontSize: "0.78rem", color: "#0f766e", fontWeight: 600, marginTop: "0.2rem" }}>
                        ~${Math.round(item.estimatedHigh).toLocaleString()} deduction
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {selectedIds.size > 0 && (
            <div
              style={{
                marginTop: "1.25rem",
                padding: "0.875rem 1.25rem",
                background: "#f0fdfa",
                border: "1.5px solid #99f6e4",
                borderRadius: "0.875rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.88rem", color: "#0f766e" }}>
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <span style={{ fontWeight: 700, color: "#0f766e" }}>
                Est. deduction: ${Math.round(totalDeduction).toLocaleString()}
              </span>
            </div>
          )}

          <button
            className="btn-primary w-full"
            style={{ marginTop: "1.25rem" }}
            disabled={selectedIds.size === 0}
            onClick={() => setStep(2)}
          >
            Continue → Select charity
          </button>
        </div>
      )}

      {/* Step 2 — Charity selection */}
      {step === 2 && (
        <div className="card p-6">
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>Choose a charity</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {CHARITIES.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCharity(c.id); setStep(3); }}
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  border: `2px solid ${selectedCharity === c.id ? "#0f766e" : "#e7e5e4"}`,
                  borderRadius: "1rem",
                  background: selectedCharity === c.id ? "#f0fdfa" : "#fff",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <div style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>{c.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{c.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>{c.tagline}</div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "999px",
                    background: c.pickup ? "#dcfce7" : "#fef3c7",
                    color: c.pickup ? "#15803d" : "#92400e",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                  }}
                >
                  {c.pickup ? "✅ " : "📍 "}{c.note}
                </div>
              </button>
            ))}
          </div>
          <button className="btn-ghost w-full" style={{ marginTop: "1rem" }} onClick={() => setStep(1)}>
            ← Back
          </button>
        </div>
      )}

      {/* Step 3 — Scheduling */}
      {step === 3 && (
        <div className="card p-6">
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1.25rem" }}>
            Schedule pickup with {charityObj?.emoji} {charityObj?.name}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Preferred pickup date</label>
              <input
                type="date"
                className="input"
                min={minDate}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Time window</label>
              <select
                className="input"
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
              >
                {TIME_WINDOWS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Pickup address</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Portland, ME 04101"
                required
              />
            </div>

            <div>
              <label className="label">Access instructions (optional)</label>
              <textarea
                className="input"
                value={accessNotes}
                onChange={(e) => setAccessNotes(e.target.value)}
                placeholder="e.g. Items in garage, ring doorbell, dog is friendly"
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>

          {/* Deduction summary */}
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.875rem 1.25rem",
              background: "#f0fdfa",
              border: "1.5px solid #99f6e4",
              borderRadius: "0.875rem",
            }}
          >
            <div style={{ fontWeight: 600, color: "#0f766e", marginBottom: "0.25rem" }}>
              {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} — Est. tax deduction: ${Math.round(totalDeduction).toLocaleString()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Consult a tax advisor. Most household goods deductible at fair market value.
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm mt-3">
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep(2)}>
              ← Back
            </button>
            <button
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={busy || !pickupDate || !address.trim()}
              onClick={handleSchedule}
            >
              {busy ? "Scheduling…" : "Schedule Donation Pickup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
