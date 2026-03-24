"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

type AuthPanel = "none" | "phone" | "magic";

export default function LoginPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Alternate auth panels
  const [activePanel, setActivePanel] = useState<AuthPanel>("none");

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [phoneError, setPhoneError] = useState("");
  const [phoneResendCountdown, setPhoneResendCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Magic link state
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSending, setMagicSending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState("");
  const [magicResendCountdown, setMagicResendCountdown] = useState(0);

  // ---------- Countdown timers ----------

  useEffect(() => {
    if (phoneResendCountdown <= 0) return;
    const t = setTimeout(() => setPhoneResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneResendCountdown]);

  useEffect(() => {
    if (magicResendCountdown <= 0) return;
    const t = setTimeout(() => setMagicResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [magicResendCountdown]);

  // ---------- Email / password submit ----------

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 429) {
          setError("Too many attempts. Please wait a minute and try again.");
        } else {
          setError(text || "That email or password doesn't match. Please try again.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Phone OTP ----------

  const sendOtp = async () => {
    setPhoneError("");
    setPhoneSending(true);
    try {
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        setPhoneError(await res.text() || "Could not send code. Please try again.");
        return;
      }
      setPhoneSent(true);
      setPhoneResendCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setPhoneError("Something went wrong. Please try again.");
    } finally {
      setPhoneSending(false);
    }
  };

  const verifyOtp = useCallback(
    async (code: string) => {
      setPhoneError("");
      try {
        const res = await fetch("/api/auth/phone/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code }),
        });
        if (!res.ok) {
          setPhoneError(await res.text() || "Invalid code. Please try again.");
          setOtpDigits(["", "", "", "", "", ""]);
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } catch {
        setPhoneError("Something went wrong. Please try again.");
      }
    },
    [phone, router],
  );

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const code = next.join("");
      if (code.length === 6) {
        verifyOtp(code);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    if (pasted.length === 6) {
      verifyOtp(pasted);
    } else {
      otpRefs.current[pasted.length]?.focus();
    }
  };

  // ---------- Magic link ----------

  const sendMagicLink = async () => {
    setMagicError("");
    setMagicSending(true);
    try {
      const res = await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: magicEmail }),
      });
      if (!res.ok) {
        setMagicError(await res.text() || "Could not send link. Please try again.");
        return;
      }
      setMagicSent(true);
      setMagicResendCountdown(60);
    } catch {
      setMagicError("Something went wrong. Please try again.");
    } finally {
      setMagicSending(false);
    }
  };

  const resendMagicLink = async () => {
    setMagicResendCountdown(60);
    setMagicSending(true);
    try {
      await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: magicEmail }),
      });
    } finally {
      setMagicSending(false);
    }
  };

  // ---------- Panel helpers ----------

  const openPanel = (panel: AuthPanel) => {
    setActivePanel(panel);
    setPhoneError("");
    setMagicError("");
  };

  const closePanel = () => {
    setActivePanel("none");
    setPhoneSent(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setPhoneError("");
    setMagicSent(false);
    setMagicError("");
  };

  // ---------- Inline SVGs ----------

  const GoogleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const PhoneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );

  const EnvelopeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <polyline points="22,4 12,13 2,4"/>
    </svg>
  );

  const SpinnerIcon = () => (
    <svg
      style={{ animation: "spin 0.8s linear infinite" }}
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <>
      {/* Heading */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            backgroundImage: "linear-gradient(135deg, #f1f5f9, #00bcd4)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#94a3b8",
            marginTop: "0.4rem",
            margin: "0.4rem 0 0 0",
          }}
        >
          Sign in to your LegacyLoop dashboard
        </p>
      </div>

      {/* ────── Email / Password Form ────── */}
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
        {/* Email */}
        <div>
          <label htmlFor="login-email" style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "14px 16px", fontSize: "0.95rem",
              background: "rgba(255,255,255,0.04)", color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
              outline: "none", transition: "all 0.2s ease",
              fontFamily: "inherit",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,188,212,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,188,212,0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="login-password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "14px 16px", paddingRight: "3.5rem", fontSize: "0.95rem",
                background: "rgba(255,255,255,0.04)", color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                outline: "none", transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,188,212,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,188,212,0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
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
                padding: "4px",
                lineHeight: 1,
                fontSize: "0.75rem",
                fontWeight: 500,
                transition: "color 0.15s ease",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#00bcd4";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              }}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
          <Link
            href="/auth/forgot-password"
            style={{
              fontSize: "0.82rem",
              color: "#00bcd4",
              textDecoration: "none",
              transition: "opacity 0.15s ease",
              display: "inline-block",
              minHeight: "44px",
              lineHeight: "44px",
              padding: "0 4px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.7";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              borderLeft: "3px solid #ef4444",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: "0.82rem",
              color: "#fca5a5",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Sign In button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "1rem",
            fontWeight: 700,
            borderRadius: 12,
            marginTop: "0.25rem",
            border: "none",
            background: "linear-gradient(135deg, #00bcd4, #009688)",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.2s ease",
            boxShadow: "0 4px 16px rgba(0,188,212,0.2)",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(0,188,212,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; } }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,188,212,0.2)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <SpinnerIcon />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>

        {/* Keep me signed in */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            minHeight: "44px",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{
              width: 18,
              height: 18,
              accentColor: "#00bcd4",
              cursor: "pointer",
              borderRadius: 4,
            }}
          />
          Keep me signed in on this device
        </label>
      </form>

      {/* ────── OR CONTINUE WITH divider ────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          margin: "1.5rem 0 1.25rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
        <span
          style={{
            fontSize: "0.65rem",
            color: "#475569",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}
        >
          or continue with
        </span>
        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
      </div>

      {/* ────── Alternate sign-in buttons ────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {/* Google */}
        <a
          href="/api/auth/google/init"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            height: 48,
            width: "100%",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.95)",
            color: "#1f2937",
            fontSize: "0.85rem",
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#fff";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.95)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <GoogleLogo />
          Continue with Google
        </a>

        {/* Phone */}
        <button
          type="button"
          onClick={() => openPanel(activePanel === "phone" ? "none" : "phone")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            height: 48,
            width: "100%",
            borderRadius: 12,
            border: activePanel === "phone" ? "1px solid rgba(0,188,212,0.4)" : "1px solid rgba(255,255,255,0.08)",
            background: activePanel === "phone" ? "rgba(0,188,212,0.06)" : "rgba(255,255,255,0.04)",
            color: activePanel === "phone" ? "#00bcd4" : "#94a3b8",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (activePanel !== "phone") {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
            }
          }}
          onMouseLeave={(e) => {
            if (activePanel !== "phone") {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLElement).style.color = "#94a3b8";
            }
          }}
        >
          <PhoneIcon />
          Continue with Phone
        </button>

        {/* Magic Link */}
        <button
          type="button"
          onClick={() => openPanel(activePanel === "magic" ? "none" : "magic")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            height: 48,
            width: "100%",
            borderRadius: 12,
            border: activePanel === "magic" ? "1px solid rgba(0,188,212,0.4)" : "1px solid rgba(255,255,255,0.08)",
            background: activePanel === "magic" ? "rgba(0,188,212,0.06)" : "rgba(255,255,255,0.04)",
            color: activePanel === "magic" ? "#00bcd4" : "#94a3b8",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (activePanel !== "magic") {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
            }
          }}
          onMouseLeave={(e) => {
            if (activePanel !== "magic") {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLElement).style.color = "#94a3b8";
            }
          }}
        >
          <EnvelopeIcon />
          Email me a sign-in link
        </button>
      </div>

      {/* ────── Phone OTP Panel ────── */}
      {activePanel === "phone" && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1.25rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 16,
            transition: "all 0.15s ease",
          }}
        >
          {!phoneSent ? (
            <>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#f5f5f7",
                  fontWeight: 600,
                  margin: "0 0 0.75rem 0",
                }}
              >
                Sign in with your phone
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.5,
                }}
              >
                We&apos;ll send a 6-digit code to verify your number.
              </p>
              <input
                type="tel"
                placeholder="(207) 555-1234"
                className="input-dark"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}
                autoComplete="tel"
              />
              {phoneError && (
                <div
                  role="alert"
                  style={{
                    background: "rgba(220, 38, 38, 0.12)",
                    border: "1px solid rgba(220, 38, 38, 0.3)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: "0.78rem",
                    color: "#fca5a5",
                    marginBottom: "0.75rem",
                    lineHeight: 1.5,
                  }}
                >
                  {phoneError}
                </div>
              )}
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={phoneSending || !phone.trim()}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    border: "none",
                    background: "#00bcd4",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: phoneSending || !phone.trim() ? "not-allowed" : "pointer",
                    opacity: phoneSending || !phone.trim() ? 0.5 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {phoneSending ? "Sending..." : "Send Code"}
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  style={{
                    height: 44,
                    padding: "0 1rem",
                    borderRadius: 10,
                    border: "1px solid var(--border-default)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }}
                >
                  Back
                </button>
              </div>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#f5f5f7",
                  fontWeight: 600,
                  margin: "0 0 0.35rem 0",
                }}
              >
                Enter your code
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  margin: "0 0 1.25rem 0",
                  lineHeight: 1.5,
                }}
              >
                Sent to <span style={{ color: "#00bcd4" }}>{phone}</span>
              </p>

              {/* 6-digit OTP inputs */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: 48,
                      height: 48,
                      textAlign: "center",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#f5f5f7",
                      background: "var(--ghost-bg)",
                      border: digit
                        ? "1px solid #00bcd4"
                        : "1px solid var(--border-default)",
                      borderRadius: 10,
                      outline: "none",
                      caretColor: "#00bcd4",
                      transition: "border-color 0.15s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#00bcd4";
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.value) {
                        e.currentTarget.style.borderColor = "var(--border-default)";
                      }
                    }}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {phoneError && (
                <div
                  role="alert"
                  style={{
                    background: "rgba(220, 38, 38, 0.12)",
                    border: "1px solid rgba(220, 38, 38, 0.3)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: "0.78rem",
                    color: "#fca5a5",
                    marginBottom: "0.75rem",
                    lineHeight: 1.5,
                  }}
                >
                  {phoneError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={closePanel}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    padding: "4px 0",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }}
                >
                  Back
                </button>

                {phoneResendCountdown > 0 ? (
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Resend code in {phoneResendCountdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpDigits(["", "", "", "", "", ""]);
                      sendOtp();
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#00bcd4",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      padding: "4px 0",
                      transition: "opacity 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ────── Magic Link Panel ────── */}
      {activePanel === "magic" && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1.25rem",
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 16,
            transition: "all 0.15s ease",
          }}
        >
          {!magicSent ? (
            <>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#f5f5f7",
                  fontWeight: 600,
                  margin: "0 0 0.75rem 0",
                }}
              >
                Sign in with a link
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.5,
                }}
              >
                We&apos;ll email you a magic link that signs you in instantly. No password needed.
              </p>
              <input
                type="email"
                placeholder="you@example.com"
                className="input-dark"
                value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
                style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}
                autoComplete="email"
              />
              {magicError && (
                <div
                  role="alert"
                  style={{
                    background: "rgba(220, 38, 38, 0.12)",
                    border: "1px solid rgba(220, 38, 38, 0.3)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: "0.78rem",
                    color: "#fca5a5",
                    marginBottom: "0.75rem",
                    lineHeight: 1.5,
                  }}
                >
                  {magicError}
                </div>
              )}
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <button
                  type="button"
                  onClick={sendMagicLink}
                  disabled={magicSending || !magicEmail.trim()}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    border: "none",
                    background: "#00bcd4",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: magicSending || !magicEmail.trim() ? "not-allowed" : "pointer",
                    opacity: magicSending || !magicEmail.trim() ? 0.5 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {magicSending ? "Sending..." : "Send Sign-In Link"}
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  style={{
                    height: 44,
                    padding: "0 1rem",
                    borderRadius: 10,
                    border: "1px solid var(--border-default)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }}
                >
                  Back
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success state */}
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                {/* Large envelope icon */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(0,188,212,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <svg
                    width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#00bcd4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <polyline points="22,4 12,13 2,4"/>
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#f5f5f7",
                    fontWeight: 600,
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  Check your inbox
                </p>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    margin: "0 0 1.25rem 0",
                    lineHeight: 1.6,
                  }}
                >
                  We sent a sign-in link to{" "}
                  <span style={{ color: "#00bcd4", fontWeight: 500 }}>{magicEmail}</span>.
                  <br />
                  Click the link in the email and you&apos;ll be signed right in.
                </p>

                {magicError && (
                  <div
                    role="alert"
                    style={{
                      background: "rgba(220, 38, 38, 0.12)",
                      border: "1px solid rgba(220, 38, 38, 0.3)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: "0.78rem",
                      color: "#fca5a5",
                      marginBottom: "0.75rem",
                      lineHeight: 1.5,
                      textAlign: "left",
                    }}
                  >
                    {magicError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={closePanel}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      padding: "4px 0",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    }}
                  >
                    Back
                  </button>

                  {magicResendCountdown > 0 ? (
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Didn&apos;t get it? Resend in {magicResendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendMagicLink}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#00bcd4",
                        fontSize: "0.82rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        padding: "4px 0",
                        transition: "opacity 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "0.7";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "1";
                      }}
                    >
                      Didn&apos;t get it? Resend
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ────── Create account link ────── */}
      <p
        style={{
          textAlign: "center",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          margin: "1.75rem 0 0 0",
        }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          style={{
            color: "#00bcd4",
            fontWeight: 600,
            textDecoration: "none",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
