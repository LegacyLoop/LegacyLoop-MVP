"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  /* ── Resend countdown ── */
  useEffect(() => {
    if (!submitted) return;
    setCountdown(60);
    setCanResend(false);
    const iv = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [submitted]);

  /* ── Submit handler ── */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError("");
      setLoading(true);

      try {
        await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        // Always show success regardless of response (privacy)
        setSubmitted(true);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [email],
  );

  /* ── Resend ── */
  const handleResend = () => {
    setCanResend(false);
    setCountdown(60);
    handleSubmit();
  };

  /* ──────────────────── SUCCESS STATE ──────────────────── */
  if (submitted) {
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
          Check your inbox
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
          We sent a password reset link to{" "}
          <strong style={{ color: "#00bcd4" }}>{email}</strong>.
          <br />
          It expires in 1 hour.
        </p>

        {/* What to do next */}
        <div
          style={{
            width: "100%",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "0.75rem",
            padding: "1rem 1.25rem",
            marginTop: "1.5rem",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: "0.75rem",
              fontSize: "0.82rem",
            }}
          >
            What to do next
          </div>
          <ol
            style={{
              paddingLeft: "1.25rem",
              margin: 0,
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              lineHeight: 1.45,
            }}
          >
            <li>Open your email inbox</li>
            <li>
              Look for an email from <strong style={{ color: "var(--text-secondary)" }}>LegacyLoop</strong>
            </li>
            <li>
              Click the &quot;Reset My Password&quot; button
            </li>
            <li>Create your new password</li>
          </ol>
        </div>

        {/* Spam tip */}
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginTop: "1rem",
            textAlign: "center",
          }}
        >
          Tip: Check your spam or junk folder if you don&apos;t see it.
        </p>

        {/* Resend */}
        <button
          type="button"
          disabled={!canResend}
          onClick={handleResend}
          style={{
            marginTop: "1.25rem",
            background: "none",
            border: "none",
            cursor: canResend ? "pointer" : "default",
            fontSize: "0.82rem",
            color: canResend ? "#00bcd4" : "var(--text-muted)",
            fontWeight: 500,
            transition: "color 0.15s",
            padding: 0,
          }}
        >
          {canResend
            ? "Didn\u2019t get it? Resend"
            : `Resend available in ${countdown}s`}
        </button>

        {/* Back to sign in */}
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

  /* ──────────────────── INITIAL / FORM STATE ──────────────────── */
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
          Forgot your password?
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-muted)",
            marginTop: "0.35rem",
            lineHeight: 1.5,
          }}
        >
          No problem. Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
      >
        {/* Email */}
        <div>
          <label className="label-light" htmlFor="forgot-email">
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            className="input-dark"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={{ minHeight: 52 }}
          />
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
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.85rem",
            fontSize: "0.9rem",
            borderRadius: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
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
              Sending...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          margin: "1.5rem 0 1.25rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "var(--ghost-bg)" }} />
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          or
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--ghost-bg)" }} />
      </div>

      {/* Google sign-in link */}
      <p
        style={{
          textAlign: "center",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          margin: 0,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#00bcd4",
            fontWeight: 600,
            fontSize: "0.82rem",
            padding: 0,
            transition: "opacity 0.15s",
          }}
        >
          Sign in with Google instead
        </button>
      </p>

      {/* Back to sign in */}
      <p style={{ textAlign: "center", marginTop: "1rem" }}>
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

      {/* Help section */}
      <div
        style={{
          marginTop: "1.75rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--border-default)",
        }}
      >
        <div
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          Need more help?
        </div>
        <div
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            lineHeight: 1.5,
          }}
        >
          <span>Phone: (207) 555-0100</span>
          <span>Text: (207) 555-0101</span>
          <span>Email: help@legacy-loop.com</span>
        </div>
      </div>
    </div>
  );
}
