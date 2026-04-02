"use client";

import { useState } from "react";

export default function DeleteAccountSection({ userEmail }: { userEmail: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const emailMatches = confirmEmail.toLowerCase() === userEmail.toLowerCase();

  async function handleDelete() {
    if (!emailMatches) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as any).error || "Deletion failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setDeleting(false);
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 600,
            background: "transparent", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "0.5rem", color: "#ef4444", cursor: "pointer",
          }}
        >
          Delete My Account
        </button>
      ) : (
        <div style={{
          padding: "1.25rem", borderRadius: "0.75rem",
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
        }}>
          <div style={{ fontWeight: 700, color: "#ef4444", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            Permanently Delete Account
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
            This will permanently delete your account and all data including items, photos, conversations, credits, and subscription. This action cannot be undone.
          </p>
          <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
            Type your email to confirm:
          </label>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={userEmail}
            className="input"
            style={{ width: "100%", marginBottom: "0.75rem" }}
          />
          {error && (
            <div style={{ fontSize: "0.78rem", color: "#ef4444", marginBottom: "0.75rem" }}>{error}</div>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleDelete}
              disabled={!emailMatches || deleting}
              style={{
                padding: "0.5rem 1rem", fontSize: "0.82rem", fontWeight: 700,
                background: emailMatches && !deleting ? "#ef4444" : "rgba(239,68,68,0.3)",
                color: "#fff", border: "none", borderRadius: "0.5rem",
                cursor: emailMatches && !deleting ? "pointer" : "not-allowed",
              }}
            >
              {deleting ? "Deleting..." : "Delete My Account Permanently"}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmEmail(""); setError(""); }}
              style={{
                padding: "0.5rem 1rem", fontSize: "0.82rem",
                background: "transparent", border: "1px solid var(--border-default)",
                borderRadius: "0.5rem", color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
