"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

type PasswordStrength = "weak" | "fair" | "good" | "strong";

function getPasswordStrength(pw: string): PasswordStrength {
  if (pw.length < 8) return "weak";
  if (pw.length <= 10) return "fair";
  if (pw.length <= 13) return "good";
  const hasMixed = /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
  return hasMixed ? "strong" : "good";
}

const STRENGTH_CONFIG: Record<PasswordStrength, { color: string; label: string; segments: number }> = {
  weak:   { color: "#ef4444", label: "Weak",   segments: 1 },
  fair:   { color: "#f59e0b", label: "Fair",   segments: 2 },
  good:   { color: "#eab308", label: "Good",   segments: 3 },
  strong: { color: "#00bcd4", label: "Strong", segments: 4 },
};

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthCfg = STRENGTH_CONFIG[strength];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Those passwords don't match. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (text.toLowerCase().includes("already") || text.toLowerCase().includes("exists") || text.toLowerCase().includes("duplicate")) {
          setError("That email is already registered. Try signing in instead.");
        } else if (text.toLowerCase().includes("rate") || text.toLowerCase().includes("too many")) {
          setError("Too many attempts. Please wait a minute and try again.");
        } else if (text.toLowerCase().includes("8 char") || text.toLowerCase().includes("password")) {
          setError("Password must be at least 8 characters.");
        } else {
          setError(text || "Something went wrong. Please try again.");
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Welcome screen after successful signup ── */
  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        {/* Checkmark icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(0,188,212,0.12)",
            border: "1px solid rgba(0,188,212,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00bcd4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          }}
        >
          Welcome to LegacyLoop!
        </h1>

        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-muted)",
            marginTop: "0.5rem",
            marginBottom: "2rem",
          }}
        >
          Your account is ready. Let&apos;s start selling.
        </p>

        <button
          className="btn-primary"
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
          style={{
            width: "100%",
            padding: "0.8rem",
            fontSize: "0.9rem",
            borderRadius: "0.75rem",
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  /* ── Signup form ── */
  return (
    <div>
      {/* Founding Member pill */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.35rem 0.875rem",
            borderRadius: "9999px",
            border: "1px solid rgba(0,188,212,0.3)",
            background: "rgba(0,188,212,0.06)",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "#00bcd4",
            letterSpacing: "0.02em",
          }}
        >
          Founding Member Offer — Join Free
        </span>
      </div>

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
          Create your account
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
          Start your first item in minutes.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>

        {/* Email */}
        <div>
          <label className="label-light" htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-dark"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ fontSize: "0.95rem", padding: "0.75rem 0.875rem" }}
          />
        </div>

        {/* Password */}
        <div>
          <label className="label-light" htmlFor="signup-password">
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="signup-password"
              name="password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              required
              className="input-dark"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "2.75rem" }}
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

          {/* Password strength bar */}
          {password.length > 0 && (
            <div style={{ marginTop: "0.625rem" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: i < strengthCfg.segments
                        ? strengthCfg.color
                        : "var(--text-muted)",
                      transition: "background 0.25s ease",
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "0.375rem",
                }}
              >
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  At least 8 characters with a mix of letters and numbers
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    color: strengthCfg.color,
                    flexShrink: 0,
                    marginLeft: "0.5rem",
                  }}
                >
                  {strengthCfg.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="label-light" htmlFor="signup-confirm">
            Confirm password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="signup-confirm"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              className="input-dark"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingRight: "2.75rem" }}
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
        </div>

        {/* Error display */}
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
            padding: "0.8rem",
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
              Creating account...
            </span>
          ) : (
            "Create Account"
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

      {/* Sign in link */}
      <p style={{ textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
        Already have an account?{" "}
        <Link
          href="/auth/login"
          style={{
            color: "#00bcd4",
            fontWeight: 600,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "0.75")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "1")}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
