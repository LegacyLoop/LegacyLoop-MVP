"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ══════════════════════════════════════════════════════════
   Inner form — uses useSearchParams (needs Suspense boundary)
   ══════════════════════════════════════════════════════════ */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<"form" | "success" | "expired">("form");

  /* ── Password strength ── */
  const strength = useMemo(() => {
    if (password.length === 0) return 0;
    if (password.length < 8) return 1;
    if (password.length < 11) return 2;
    if (password.length < 14) return 3;
    return 4;
  }, [password]);

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#eab308", "#00bcd4"][strength];

  /* ── Requirements ── */
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;
  const canSubmit = hasLength && hasLetter && hasNumber && passwordsMatch && !loading;

  /* ── Requirement check icon ── */
  const checkIcon = (met: boolean) => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={met ? "#22c55e" : "var(--text-muted)"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, transition: "stroke 0.2s" }}
    >
      {met ? (
        <polyline points="20 6 9 17 4 12" />
      ) : (
        <circle cx="12" cy="12" r="8" />
      )}
    </svg>
  );

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don\u2019t match. Please try again.");
      return;
    }
    if (!token) {
      setError("This link has expired. Request a new one.");
      setState("expired");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const msg = await res.text();
        if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
          setState("expired");
          return;
        }
        setError(msg || "Something went wrong. Please try again.");
        return;
      }

      setState("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ──────────── TOKEN EXPIRED STATE ──────────── */
  if (state === "expired" || (!token && state === "form")) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Warning icon */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "2px solid #fca5a5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fca5a5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "#fca5a5",
            letterSpacing: "-0.015em",
            margin: 0,
            textAlign: "center",
          }}
        >
          This link has expired
        </h1>

        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginTop: "0.5rem",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Password reset links are only valid for 1 hour.
          <br />
          Request a new one to continue.
        </p>

        <button
          type="button"
          className="btn-primary"
          onClick={() => router.push("/auth/forgot-password")}
          style={{
            width: "100%",
            padding: "0.85rem",
            fontSize: "0.9rem",
            borderRadius: "0.75rem",
            marginTop: "1.5rem",
          }}
        >
          Request a new reset link
        </button>

        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          style={{
            marginTop: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            fontWeight: 400,
            padding: 0,
            transition: "color 0.15s",
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  /* ──────────── SUCCESS STATE ──────────── */
  if (state === "success") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Animated checkmark circle */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "2px solid #00bcd4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.25rem",
            animation: "fadeScaleIn 0.5s ease-out both",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00bcd4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "checkDraw 0.4s ease-out 0.3s both" }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "#f5f5f7",
            letterSpacing: "-0.015em",
            margin: 0,
            textAlign: "center",
          }}
        >
          Password updated!
        </h1>

        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginTop: "0.5rem",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Your password has been changed. Sign in with your new password below.
        </p>

        <button
          type="button"
          className="btn-primary"
          onClick={() => router.push("/auth/login")}
          style={{
            width: "100%",
            padding: "0.85rem",
            fontSize: "0.9rem",
            borderRadius: "0.75rem",
            marginTop: "1.5rem",
          }}
        >
          Sign in with your new password
        </button>

        {/* Keyframe styles */}
        <style>{`
          @keyframes fadeScaleIn {
            from { opacity: 0; transform: scale(0.6); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes checkDraw {
            from { stroke-dasharray: 40; stroke-dashoffset: 40; opacity: 0; }
            to   { stroke-dasharray: 40; stroke-dashoffset: 0; opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  /* ──────────── FORM STATE ──────────── */
  return (
    <div>
      {/* Heading */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "#f5f5f7",
            letterSpacing: "-0.015em",
            margin: 0,
          }}
        >
          Create new password
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginTop: "0.35rem",
            lineHeight: 1.5,
          }}
        >
          Choose something memorable but strong.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
      >
        {/* New password */}
        <div>
          <label className="label-light" htmlFor="reset-password">
            New password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="reset-password"
              type={showPass ? "text" : "password"}
              className="input-dark"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              style={{ minHeight: 52, paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 0,
                lineHeight: 1,
                fontSize: "0.75rem",
                transition: "color 0.15s",
              }}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>

          {/* Strength indicator — 4 segments */}
          {password.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "0.35rem" }}>
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background:
                        strength >= seg
                          ? strengthColor
                          : "var(--text-muted)",
                      transition: "background 0.25s",
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: strengthColor,
                  fontWeight: 600,
                }}
              >
                {strengthLabel}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="label-light" htmlFor="reset-confirm">
            Confirm new password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="reset-confirm"
              type={showConfirm ? "text" : "password"}
              className="input-dark"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Same password again"
              required
              autoComplete="new-password"
              style={{ minHeight: 52, paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 0,
                lineHeight: 1,
                fontSize: "0.75rem",
                transition: "color 0.15s",
              }}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>

          {/* Mismatch warning */}
          {confirm.length > 0 && password !== confirm && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "#ef4444",
                marginTop: "0.35rem",
                margin: "0.35rem 0 0 0",
              }}
            >
              Those passwords don&apos;t match.
            </p>
          )}
        </div>

        {/* Requirements checklist */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            padding: "0.25rem 0",
          }}
        >
          {[
            { met: hasLength, label: "At least 8 characters" },
            { met: hasLetter, label: "At least one letter" },
            { met: hasNumber, label: "At least one number" },
          ].map(({ met, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.78rem",
                color: met ? "#22c55e" : "var(--text-muted)",
                transition: "color 0.2s",
              }}
            >
              {checkIcon(met)}
              {label}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(220,38,38,0.12)",
              border: "1px solid rgba(220,38,38,0.35)",
              borderRadius: "0.625rem",
              padding: "0.625rem 0.875rem",
              fontSize: "0.82rem",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary"
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: "0.85rem",
            fontSize: "0.9rem",
            borderRadius: "0.75rem",
            marginTop: "0.25rem",
            opacity: canSubmit ? 1 : 0.45,
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "opacity 0.2s",
          }}
        >
          {loading ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <svg
                style={{ animation: "spin 0.8s linear infinite" }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Updating...
            </span>
          ) : (
            "Update Password"
          )}
        </button>
      </form>

      {/* Back to sign in */}
      <p style={{ textAlign: "center", marginTop: "1.25rem" }}>
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            fontWeight: 400,
            padding: 0,
            transition: "color 0.15s",
          }}
        >
          Back to sign in
        </button>
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Page wrapper — Suspense boundary for useSearchParams
   ══════════════════════════════════════════════════════════ */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 0",
            color: "var(--text-muted)",
            fontSize: "0.85rem",
          }}
        >
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
