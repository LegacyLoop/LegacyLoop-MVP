"use client";

import { useState } from "react";

interface WelcomeUser {
  firstName: string;
  sellerType: string | null;
  recommendedTier: string | null;
}

interface Props {
  user: WelcomeUser;
  onClose: () => void;
}

/**
 * CMD-ONBOARDING-7B: Premium welcome modal for first login.
 * Shows once when onboardingStep === 1 (quiz completed but not welcomed).
 * Personalized by sellerType. Updates onboardingStep to 2 on dismiss.
 */
export default function WelcomeModal({ user, onClose }: Props) {
  const [closing, setClosing] = useState(false);

  const emoji =
    user.sellerType === "estate" ? "🏛️"
    : user.sellerType === "garage" ? "🏠"
    : user.sellerType === "neighborhood" ? "🤝"
    : "✨";

  const subtitle =
    user.sellerType === "estate"
      ? "You're on the estate path. Let's turn your legacy items into real value."
      : user.sellerType === "garage"
      ? "You're on the garage sale path. Let's get your items sold fast and smart."
      : "Your AI resale assistant is ready. Let's start selling smarter.";

  const handleDismiss = async () => {
    setClosing(true);
    try {
      await fetch("/api/user/onboarding-step", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingStep: 2 }),
      });
    } catch { /* non-blocking */ }
    setTimeout(() => onClose(), 300);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: closing ? 0 : 1,
        transition: "opacity 0.3s ease",
        padding: "1rem",
      }}
    >
      <style>{`
        @keyframes welcomeScaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "rgba(13,17,23,0.97)",
          border: "1px solid rgba(0,188,212,0.25)",
          borderRadius: "1.5rem",
          padding: "2.5rem 2rem",
          boxShadow: "0 0 60px rgba(0,188,212,0.08), 0 24px 80px rgba(0,0,0,0.5)",
          animation: "welcomeScaleIn 0.4s ease-out forwards",
          textAlign: "center",
        }}
      >
        {/* Emoji */}
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{emoji}</div>

        {/* Headline */}
        <h2
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#f1f5f9",
            marginBottom: "0.5rem",
            lineHeight: 1.25,
          }}
        >
          Welcome to LegacyLoop{user.firstName ? `, ${user.firstName}` : ""}!
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "0.92rem",
            color: "#94a3b8",
            lineHeight: 1.6,
            marginBottom: "1.75rem",
            maxWidth: "360px",
            margin: "0 auto 1.75rem",
          }}
        >
          {subtitle}
        </p>

        {/* What you get */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            textAlign: "left",
            marginBottom: "1.75rem",
            padding: "0 0.5rem",
          }}
        >
          {[
            "AI identifies + values your items instantly",
            "Lists across 14+ marketplaces automatically",
            "Handles shipping, payments, and buyer matching",
          ].map((text) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <span style={{ color: "#00bcd4", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleDismiss}
          style={{
            width: "100%",
            padding: "0.9rem",
            background: "linear-gradient(135deg, #00bcd4, #0097a7)",
            color: "#fff",
            border: "none",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,188,212,0.3)",
            transition: "filter 0.15s ease",
            marginBottom: "0.75rem",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
        >
          Start Selling →
        </button>

        {/* Skip link */}
        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.82rem",
            cursor: "pointer",
            padding: "0.4rem",
          }}
        >
          I'll explore on my own →
        </button>
      </div>
    </div>
  );
}
