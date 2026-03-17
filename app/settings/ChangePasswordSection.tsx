"use client";

import { useState, useMemo } from "react";

function getStrength(pw: string): { level: number; label: string } {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "Weak" };
  if (score === 2) return { level: 2, label: "Fair" };
  if (score === 3) return { level: 3, label: "Good" };
  return { level: 4, label: "Strong" };
}

const STRENGTH_COLORS = ["#e5e7eb", "#ef4444", "#f97316", "#eab308", "#00bcd4"];

export default function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const strength = useMemo(() => getStrength(newPassword), [newPassword]);

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isValid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 mt-4">
      <div
        style={{
          fontWeight: 700,
          fontSize: "1rem",
          color: "var(--text-primary, #1c1917)",
          marginBottom: "0.25rem",
        }}
      >
        Security &amp; Password
      </div>
      <div
        style={{
          color: "var(--text-muted, #78716c)",
          fontSize: "0.85rem",
          marginBottom: "1.25rem",
        }}
      >
        Change your password
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Current password */}
        <div>
          <label className="label" htmlFor="cp-current">
            Current Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="cp-current"
              className="input"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
              style={{ width: "100%", paddingRight: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "var(--text-muted, #78716c)",
                padding: "2px 4px",
              }}
              tabIndex={-1}
            >
              {showCurrent ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="label" htmlFor="cp-new">
            New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="cp-new"
              className="input"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              style={{ width: "100%", paddingRight: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "var(--text-muted, #78716c)",
                padding: "2px 4px",
              }}
              tabIndex={-1}
            >
              {showNew ? "Hide" : "Show"}
            </button>
          </div>

          {/* Strength indicator */}
          {newPassword.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    style={{
                      flex: 1,
                      height: "4px",
                      borderRadius: "2px",
                      background:
                        seg <= strength.level
                          ? STRENGTH_COLORS[strength.level]
                          : "#e5e7eb",
                      transition: "background 0.2s",
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: STRENGTH_COLORS[strength.level],
                  fontWeight: 600,
                }}
              >
                {strength.label}
              </div>
            </div>
          )}
        </div>

        {/* Confirm new password */}
        <div>
          <label className="label" htmlFor="cp-confirm">
            Confirm New Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="cp-confirm"
              className="input"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              style={{ width: "100%", paddingRight: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "var(--text-muted, #78716c)",
                padding: "2px 4px",
              }}
              tabIndex={-1}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.35rem" }}>
              Passwords do not match.
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "#ef4444",
              background: "rgba(239,68,68,0.08)",
              padding: "0.6rem 0.75rem",
              borderRadius: "6px",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "#16a34a",
              background: "rgba(22,163,74,0.08)",
              padding: "0.6rem 0.75rem",
              borderRadius: "6px",
            }}
          >
            {success}
          </div>
        )}

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="btn-primary"
            disabled={!isValid || loading}
            style={{ fontSize: "0.85rem", opacity: !isValid || loading ? 0.5 : 1 }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
