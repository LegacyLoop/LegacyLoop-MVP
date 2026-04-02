"use client";

import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  { id: "ui", label: "UI / Visual Issue", icon: "🎨" },
  { id: "pricing", label: "Pricing / Valuation", icon: "💰" },
  { id: "bots", label: "Bot / AI Issue", icon: "🤖" },
  { id: "shipping", label: "Shipping / Labels", icon: "📦" },
  { id: "messaging", label: "Messaging", icon: "💬" },
  { id: "auth", label: "Login / Account", icon: "🔐" },
  { id: "payments", label: "Payments / Credits", icon: "💳" },
  { id: "performance", label: "Slow / Crashed", icon: "🐌" },
  { id: "other", label: "Other", icon: "❓" },
];

const SEVERITIES = [
  { id: "low", label: "Low", desc: "Minor annoyance", color: "#22c55e" },
  { id: "medium", label: "Medium", desc: "Impacts workflow", color: "#eab308" },
  { id: "high", label: "High", desc: "Can't complete task", color: "#f97316" },
  { id: "critical", label: "Critical", desc: "Data loss / broken", color: "#ef4444" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BugReportModal({ open, onClose }: Props) {
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setCategory("");
      setSeverity("medium");
      setDescription("");
      setScreenshot(null);
      setSubmitted(false);
      setError("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const captureScreenshot = useCallback(async () => {
    setCapturing(true);
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      // Temporarily hide the modal for the capture
      const modalEl = document.getElementById("bug-report-modal-overlay");
      if (modalEl) modalEl.style.display = "none";

      const canvas = await html2canvas(document.body, {
        scale: 0.5, // Half resolution to keep file size small
        useCORS: true,
        logging: false,
        backgroundColor: null,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      // Restore modal
      if (modalEl) modalEl.style.display = "";

      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      setScreenshot(dataUrl);
    } catch (err) {
      console.error("[BugReport] Screenshot capture failed:", err);
      setError("Screenshot capture failed. You can still submit without one.");
    } finally {
      setCapturing(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!category) { setError("Please select a category"); return; }
    if (!description.trim() || description.trim().length < 5) {
      setError("Please describe the issue (at least 5 characters)");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          severity,
          description: description.trim(),
          pageUrl: window.location.href,
          screenshot,
          userAgent: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      id="bug-report-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--bg-card-solid, #161b22)",
          border: "1.5px solid rgba(0,188,212,0.25)",
          borderRadius: 16,
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🐛</span>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary, #f0f6fc)" }}>
              Report a Bug
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted, #64748b)",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem" }}>
          {submitted ? (
            // ── Success State ──
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary, #f0f6fc)", marginBottom: "0.5rem" }}>
                Bug Report Submitted
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary, #8b949e)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Thank you for helping us improve LegacyLoop. Our team will review your report.
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: "0.625rem 2rem",
                  background: "#00bcd4",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.625rem",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          ) : (
            // ── Form ──
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Category */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted, #64748b)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Category
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      style={{
                        padding: "0.35rem 0.65rem",
                        borderRadius: "8px",
                        border: category === c.id ? "1.5px solid #00bcd4" : "1px solid var(--border-default, rgba(255,255,255,0.08))",
                        background: category === c.id ? "rgba(0,188,212,0.12)" : "transparent",
                        color: category === c.id ? "#00bcd4" : "var(--text-secondary, #8b949e)",
                        fontSize: "0.75rem",
                        fontWeight: category === c.id ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted, #64748b)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Severity
                </label>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSeverity(s.id)}
                      style={{
                        flex: 1,
                        padding: "0.5rem 0.35rem",
                        borderRadius: "8px",
                        border: severity === s.id ? `1.5px solid ${s.color}` : "1px solid var(--border-default, rgba(255,255,255,0.08))",
                        background: severity === s.id ? `${s.color}18` : "transparent",
                        color: severity === s.id ? s.color : "var(--text-secondary, #8b949e)",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      <div>{s.label}</div>
                      <div style={{ fontSize: "0.58rem", fontWeight: 400, marginTop: "2px", opacity: 0.7 }}>
                        {s.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted, #64748b)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Describe the Issue
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? What were you trying to do?"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-default, rgba(255,255,255,0.08))",
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--text-primary, #f0f6fc)",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted, #64748b)", textAlign: "right", marginTop: "0.2rem" }}>
                  {description.length}/2000
                </div>
              </div>

              {/* Screenshot */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted, #64748b)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Screenshot (optional)
                </label>

                {screenshot ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={screenshot}
                      alt="Screenshot preview"
                      style={{
                        width: "100%",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(0,188,212,0.2)",
                        maxHeight: 200,
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.4rem" }}>
                      <button
                        onClick={captureScreenshot}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border-default)",
                          background: "transparent",
                          color: "var(--text-secondary, #8b949e)",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                        }}
                      >
                        🔄 Retake
                      </button>
                      <button
                        onClick={() => setScreenshot(null)}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border-default)",
                          background: "transparent",
                          color: "#ef4444",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={captureScreenshot}
                    disabled={capturing}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      border: "2px dashed var(--border-default, rgba(255,255,255,0.1))",
                      background: "rgba(0,188,212,0.03)",
                      color: "var(--text-secondary, #8b949e)",
                      fontSize: "0.82rem",
                      cursor: capturing ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {capturing ? (
                      <>
                        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                        Capturing page...
                      </>
                    ) : (
                      <>📸 Capture Screenshot</>
                    )}
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: "0.5rem 0.75rem",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "0.5rem",
                  color: "#ef4444",
                  fontSize: "0.78rem",
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.625rem",
                  border: "none",
                  background: submitting ? "#6b7280" : "linear-gradient(135deg, #00bcd4, #0097a7)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: submitting ? "none" : "0 2px 12px rgba(0,188,212,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "Submitting..." : "Submit Bug Report"}
              </button>

              {/* Page context hint */}
              <div style={{
                fontSize: "0.62rem",
                color: "var(--text-muted, #64748b)",
                textAlign: "center",
                lineHeight: 1.4,
              }}>
                Page URL, browser info, and screen size are automatically included.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
