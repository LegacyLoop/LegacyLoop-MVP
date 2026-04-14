"use client";

import { useState } from "react";

interface Props {
  show: boolean;
}

export default function DataConsentModal({ show }: Props) {
  const [visible, setVisible] = useState(show);
  const [dataCollection, setDataCollection] = useState(false);
  const [aiTraining, setAiTraining] = useState(false);
  const [marketResearch, setMarketResearch] = useState(false);
  const [anonymousSharing, setAnonymousSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!visible) return null;

  const anyChecked = dataCollection || aiTraining || marketResearch || anonymousSharing;

  async function handleAccept() {
    setLoading(true);
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataCollection,
          aiTraining,
          marketResearch,
          anonymousSharing,
        }),
      });
      setDone(true);
      setTimeout(() => setVisible(false), 2500);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ declined: true }),
    });
    setVisible(false);
  }

  // ── Toggle switch sub-component ──────────────────────────────────────────
  function Toggle({
    checked,
    onChange,
    label,
    desc,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    desc: string;
  }) {
    return (
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
          cursor: "pointer",
          padding: "0.65rem 0.75rem",
          borderRadius: "0.75rem",
          background: checked ? "rgba(0,188,212,0.06)" : "transparent",
          border: `1px solid ${checked ? "rgba(0,188,212,0.2)" : "var(--border-default, #e7e5e4)"}`,
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ flexShrink: 0, marginTop: "0.1rem" }}>
          <div
            onClick={(e) => {
              e.preventDefault();
              onChange(!checked);
            }}
            style={{
              width: "2.5rem",
              height: "1.35rem",
              borderRadius: "9999px",
              background: checked
                ? "linear-gradient(135deg, #00bcd4, #0097a7)"
                : "var(--ghost-bg, #e7e5e4)",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s ease",
              boxShadow: checked ? "0 0 8px rgba(0,188,212,0.35)" : "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "2.5px",
                left: checked ? "calc(100% - 19px)" : "2.5px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s ease",
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650, fontSize: "0.82rem", color: "var(--text-primary, #1c1917)" }}>
            {label}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #a8a29e)", marginTop: "0.1rem", lineHeight: 1.4 }}>
            {desc}
          </div>
        </div>
      </label>
    );
  }

  return (
    <div
      className="glass-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Data collection preferences"
      style={{
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="glass-modal"
        style={{
          padding: "2rem",
          maxWidth: "440px",
          width: "100%",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary, #1c1917)" }}>
              Thank you!
            </div>
            <div style={{ color: "var(--text-muted, #78716c)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
              {dataCollection ? "💎 100 bonus credits added to your account." : "Your preferences have been saved."}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #a8a29e)", marginTop: "0.75rem" }}>
              You can change these anytime in Settings → Privacy & Data Sharing.
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(0,188,212,0.1)",
                border: "2px solid rgba(0,188,212,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.75rem",
                fontSize: "1.5rem",
              }}>
                🔒
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--text-primary, #1c1917)" }}>
                Help Us Improve LegacyLoop
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #78716c)", marginTop: "0.35rem", lineHeight: 1.5 }}>
                Choose which anonymized data you're comfortable sharing. Every toggle is independent — enable what you want, skip what you don't.
              </div>
            </div>

            {/* What we collect */}
            <div
              style={{
                background: "var(--ghost-bg, #f5f5f4)",
                borderRadius: "0.875rem",
                padding: "0.875rem 1rem",
                marginBottom: "1rem",
                fontSize: "0.78rem",
                color: "var(--text-secondary, #57534e)",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--text-primary, #1c1917)", marginBottom: "0.3rem", fontSize: "0.82rem" }}>
                What we collect (all anonymized):
              </div>
              <div>• How accurate our AI pricing estimates are</div>
              <div>• Which items sell and at what prices</div>
              <div>• Market trends across connected platforms</div>
            </div>

            {/* Benefits */}
            <div style={{ marginBottom: "1rem" }}>
              {[
                { icon: "✅", text: "Improves AI pricing accuracy — for every user" },
                { icon: "✅", text: "Generates better recommendations over time" },
                { icon: "✅", text: "Helps us spot market trends faster" },
              ].map((b) => (
                <div key={b.text} style={{ fontSize: "0.78rem", color: "var(--text-secondary, #57534e)", marginBottom: "0.25rem", display: "flex", gap: "0.35rem" }}>
                  <span>{b.icon}</span> {b.text}
                </div>
              ))}
            </div>

            {/* Incentive */}
            <div
              style={{
                background: "rgba(0,188,212,0.06)",
                border: "1.5px solid rgba(0,188,212,0.2)",
                borderRadius: "0.875rem",
                padding: "0.875rem 1rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>💎</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent, #00bcd4)" }}>
                  Earn 100 bonus credits
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #78716c)" }}>
                  Instantly added when you enable data collection
                </div>
              </div>
            </div>

            {/* 4 Independent consent toggles */}
            <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Toggle
                checked={dataCollection}
                onChange={setDataCollection}
                label="Anonymized Data Collection"
                desc="Share pricing accuracy and sale outcome data to improve the platform"
              />
              <Toggle
                checked={aiTraining}
                onChange={setAiTraining}
                label="AI Training Data"
                desc="Allow anonymized item data to help train our pricing and identification AI"
              />
              <Toggle
                checked={marketResearch}
                onChange={setMarketResearch}
                label="Market Research"
                desc="Share anonymous transaction patterns with our research team"
              />
              <Toggle
                checked={anonymousSharing}
                onChange={setAnonymousSharing}
                label="Aggregate Trend Reports"
                desc="Include your items in anonymous market trend and pricing reports"
              />
            </div>

            {/* Privacy note */}
            <div style={{
              fontSize: "0.68rem",
              color: "var(--text-muted, #a8a29e)",
              textAlign: "center",
              marginBottom: "1rem",
              lineHeight: 1.5,
            }}>
              🔒 Your data is anonymized, encrypted, and <strong>never sold</strong>.
              <br />
              You can change these preferences anytime in <strong>Settings</strong>.
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={handleAccept}
                disabled={loading || !anyChecked}
                style={{
                  padding: "0.875rem",
                  background: !anyChecked
                    ? "var(--ghost-bg, #e7e5e4)"
                    : "linear-gradient(135deg, #00bcd4, #0097a7)",
                  color: !anyChecked ? "var(--text-muted, #a8a29e)" : "#fff",
                  border: "none",
                  borderRadius: "0.875rem",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: loading || !anyChecked ? "not-allowed" : "pointer",
                  boxShadow: anyChecked ? "0 4px 16px rgba(0,188,212,0.25)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {loading
                  ? "Saving…"
                  : dataCollection
                    ? "Accept & Get 100 Credits"
                    : anyChecked
                      ? "Save Preferences"
                      : "Select at least one option"}
              </button>
              <button
                onClick={handleDecline}
                style={{
                  padding: "0.625rem",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted, #78716c)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                No thanks — decline and continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
