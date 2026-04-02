"use client";

import { useState } from "react";
import BudgetGuard from "@/app/components/BudgetGuard";

type ConsentData = {
  dataCollection: boolean;
  aiTraining: boolean;
  marketResearch: boolean;
  anonymousSharing: boolean;
  creditsEarned: number;
  consentedAt: string | null;
} | null;

type Props = {
  userId: string;
  email: string;
  consent: ConsentData;
};

export default function SettingsClient({ userId, email, consent }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    dataCollection: consent?.dataCollection ?? false,
    aiTraining: consent?.aiTraining ?? false,
    marketResearch: consent?.marketResearch ?? false,
    anonymousSharing: consent?.anonymousSharing ?? false,
  });

  // Notification prefs — UI only (no DB column yet, just shows intent)
  const [notifs, setNotifs] = useState({
    newMessage: true,
    priceAlerts: true,
    reconAlerts: true,
    weeklySummary: false,
  });

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Privacy / Data sharing */}
      <div className="card p-6 mb-4">
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
          Privacy & Data Sharing
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Control how your data is used. Enabling data sharing earns you{" "}
          <strong style={{ color: "var(--accent, #00bcd4)" }}>100 bonus credits</strong>.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {([
            {
              key: "dataCollection",
              label: "Data Collection",
              desc: "Allow LegacyLoop to collect usage analytics to improve the product.",
            },
            {
              key: "aiTraining",
              label: "AI Training Data",
              desc: "Allow anonymized item data to help train our pricing AI.",
            },
            {
              key: "marketResearch",
              label: "Market Research",
              desc: "Share anonymous transaction data with our research partners.",
            },
            {
              key: "anonymousSharing",
              label: "Anonymous Platform Sharing",
              desc: "Include your items in aggregate market trend reports.",
            },
          ] as const).map(({ key, label, desc }) => (
            <label
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                cursor: "pointer",
                padding: "0.75rem",
                borderRadius: "0.625rem",
                background: prefs[key] ? "rgba(0, 188, 212, 0.06)" : "transparent",
                border: `1px solid ${prefs[key] ? "rgba(0,188,212,0.2)" : "transparent"}`,
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{label}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.2rem" }}>{desc}</div>
              </div>
              <div style={{ position: "relative", flexShrink: 0, marginTop: "0.125rem" }}>
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                  style={{ display: "none" }}
                />
                <div
                  onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                  style={{
                    width: "2.75rem",
                    height: "1.5rem",
                    borderRadius: "9999px",
                    background: prefs[key] ? "linear-gradient(135deg, #00bcd4, #0097a7)" : "#e7e5e4",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                    boxShadow: prefs[key] ? "0 0 8px rgba(0,188,212,0.35)" : "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: prefs[key] ? "calc(100% - 21px)" : "3px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      transition: "left 0.2s ease",
                    }}
                  />
                </div>
              </div>
            </label>
          ))}
        </div>

        {consent?.creditsEarned ? (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              background: "rgba(0, 188, 212, 0.08)",
              border: "1px solid rgba(0, 188, 212, 0.2)",
              fontSize: "0.8rem",
              color: "var(--accent, #00bcd4)",
              fontWeight: 600,
            }}
          >
            ✓ You earned {consent.creditsEarned} credits for enabling data sharing.
          </div>
        ) : null}

        <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "0.5rem 1.25rem" }}
            onClick={handleSavePrivacy}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Preferences"}
          </button>
          {saved && (
            <span style={{ color: "#15803d", fontSize: "0.82rem", fontWeight: 600 }}>
              ✓ Saved!
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 mb-4">
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
          Notifications
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Choose what alerts you receive. (Email delivery coming soon — saved for when email is configured.)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {([
            { key: "newMessage", label: "New buyer messages", desc: "When a buyer sends you a message" },
            { key: "priceAlerts", label: "Price alerts", desc: "When market prices change significantly" },
            { key: "reconAlerts", label: "Recon Bot alerts", desc: "Competitor activity on your items" },
            { key: "weeklySummary", label: "Weekly summary", desc: "Digest of your estate's performance" },
          ] as const).map(({ key, label, desc }) => (
            <label
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.87rem" }}>{label}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{desc}</div>
              </div>
              <div
                onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                style={{
                  width: "2.75rem",
                  height: "1.5rem",
                  borderRadius: "9999px",
                  background: notifs[key] ? "linear-gradient(135deg, #00bcd4, #0097a7)" : "#e7e5e4",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s ease",
                  flexShrink: 0,
                  boxShadow: notifs[key] ? "0 0 8px rgba(0,188,212,0.35)" : "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: notifs[key] ? "calc(100% - 21px)" : "3px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    transition: "left 0.2s ease",
                  }}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Budget & Spending Controls ─────────────────────────── */}
      <div style={{ marginTop: "2rem" }}>
        <BudgetGuard variant="full" />
      </div>
    </>
  );
}
