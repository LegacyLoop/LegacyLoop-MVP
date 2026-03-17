"use client";

import { useState } from "react";

interface Props {
  show: boolean;
}

export default function DataConsentModal({ show }: Props) {
  const [visible, setVisible] = useState(show);
  const [dataCollection, setDataCollection] = useState(true);
  const [aiTraining, setAiTraining] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!visible) return null;

  async function handleAccept() {
    setLoading(true);
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataCollection,
          aiTraining,
          marketResearch: true,
          anonymousSharing: dataCollection,
        }),
      });
      setDone(true);
      setTimeout(() => setVisible(false), 2000);
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "1.5rem",
          padding: "2rem",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1c1917" }}>
              Thank you!
            </div>
            <div style={{ color: "#57534e", fontSize: "0.85rem", marginTop: "0.4rem" }}>
              💎 100 bonus credits added to your account.
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2.25rem", marginBottom: "0.5rem" }}>🔒</div>
              <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#1c1917" }}>
                Help Us Improve LegacyLoop
              </div>
              <div style={{ fontSize: "0.82rem", color: "#78716c", marginTop: "0.35rem" }}>
                We'd like to use anonymized data to make the platform smarter for everyone.
              </div>
            </div>

            {/* What we collect */}
            <div
              style={{
                background: "#f5f5f4",
                borderRadius: "0.875rem",
                padding: "0.875rem 1rem",
                marginBottom: "1rem",
                fontSize: "0.8rem",
                color: "#57534e",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 700, color: "#1c1917", marginBottom: "0.3rem" }}>
                What we collect (anonymized):
              </div>
              <div>• How accurate our AI pricing is</div>
              <div>• Which items sell and for how much</div>
              <div>• Market trends across platforms</div>
            </div>

            {/* Benefits */}
            <div style={{ marginBottom: "1rem" }}>
              {[
                "✅ Improves AI accuracy over time — for everyone",
                "✅ Generates better price recommendations",
                "✅ Helps us spot market trends faster",
              ].map((b) => (
                <div key={b} style={{ fontSize: "0.8rem", color: "#57534e", marginBottom: "0.25rem" }}>
                  {b}
                </div>
              ))}
            </div>

            {/* Incentive */}
            <div
              style={{
                background: "linear-gradient(135deg, #f0fdfa, #fff)",
                border: "1.5px solid #99f6e4",
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
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f766e" }}>
                  Earn 100 bonus credits ($100 value)
                </div>
                <div style={{ fontSize: "0.72rem", color: "#78716c" }}>
                  Instantly added when you accept
                </div>
              </div>
            </div>

            {/* Consent options */}
            <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={dataCollection}
                  onChange={(e) => setDataCollection(e.target.checked)}
                  style={{ marginTop: "0.15rem", accentColor: "#0f766e" }}
                />
                <span style={{ fontSize: "0.82rem", color: "#1c1917" }}>
                  <strong>Anonymized data collection</strong> — pricing accuracy & sale outcomes
                </span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={aiTraining}
                  onChange={(e) => setAiTraining(e.target.checked)}
                  style={{ marginTop: "0.15rem", accentColor: "#0f766e" }}
                />
                <span style={{ fontSize: "0.82rem", color: "#1c1917" }}>
                  <strong>AI training data</strong> — helps improve accuracy for everyone
                </span>
              </label>
            </div>

            {/* Privacy note */}
            <div style={{ fontSize: "0.68rem", color: "#a8a29e", textAlign: "center", marginBottom: "1rem" }}>
              🔒 Your data is anonymized, encrypted, and <strong>never sold</strong>.
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={handleAccept}
                disabled={loading || !dataCollection}
                style={{
                  padding: "0.875rem",
                  background: !dataCollection ? "#e7e5e4" : "#0f766e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.875rem",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: loading || !dataCollection ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Saving…" : "Accept & Get 100 Credits"}
              </button>
              <button
                onClick={handleDecline}
                style={{
                  padding: "0.625rem",
                  background: "none",
                  border: "none",
                  color: "#78716c",
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
