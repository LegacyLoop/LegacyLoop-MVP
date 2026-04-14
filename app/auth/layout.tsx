"use client";

import Image from "next/image";
import Link from "next/link";

const PARTICLES = [
  { size: 4, top: "10%", left: "7%", delay: "0s", duration: "7s" },
  { size: 3, top: "25%", left: "87%", delay: "1.2s", duration: "9s" },
  { size: 5, top: "52%", left: "13%", delay: "2.5s", duration: "11s" },
  { size: 3, top: "68%", left: "80%", delay: "0.8s", duration: "8s" },
  { size: 4, top: "36%", left: "93%", delay: "3.1s", duration: "10s" },
  { size: 3, top: "80%", left: "40%", delay: "1.7s", duration: "12s" },
  { size: 4, top: "16%", left: "62%", delay: "0.4s", duration: "9.5s" },
  { size: 3, top: "5%", left: "46%", delay: "2.2s", duration: "7.5s" },
  { size: 4, top: "42%", left: "3%", delay: "0.6s", duration: "8.5s" },
  { size: 3, top: "88%", left: "72%", delay: "1.9s", duration: "10.5s" },
  { size: 5, top: "60%", left: "55%", delay: "3.4s", duration: "11.5s" },
  { size: 3, top: "22%", left: "30%", delay: "2.8s", duration: "9s" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="login-page-wrapper"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        position: "relative",
        overflow: "hidden",
        background: "#0a0a0a",
      }}
    >
      {/* Animated gradient mesh — subtle depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(0,188,212,0.06) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 70% 60%, rgba(0,150,136,0.04) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 50% 40%, rgba(0,188,212,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Floating particle dots — enhanced with glow */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle-dot"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            boxShadow: "0 0 6px rgba(0,188,212,0.3), 0 0 12px rgba(0,188,212,0.1)",
          }}
          aria-hidden="true"
        />
      ))}

      {/* Logo with subtle backglow */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: "2rem" }}>
        {/* Teal glow behind logo */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "160%",
            height: "160%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,188,212,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <Image
          src="/images/logos/logo-stacked.png"
          alt="LegacyLoop"
          width={425}
          height={268}
          priority
          style={{
            position: "relative",
            maxWidth: "clamp(180px, 40vw, 280px)",
            width: "100%",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Auth card — premium glass morphism */}
      <div
        className="glass-modal"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
          background: "rgba(13, 17, 23, 0.88)",
          borderTop: "1px solid rgba(0,188,212,0.25)",
          padding: "40px",
          boxShadow:
            "0 0 40px rgba(0,188,212,0.06), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 var(--glass-highlight)",
        }}
      >
        {children}
      </div>

      {/* Tagline — teal accent on "Connecting Generations" */}
      <p
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "1.5rem",
          fontSize: "0.78rem",
          color: "#64748b",
          textAlign: "center",
          letterSpacing: "0.06em",
        }}
      >
        AI-powered resale &middot;{" "}
        <span style={{ color: "#00bcd4" }}>Connecting Generations</span>
      </p>

      {/* Terms + Privacy — teal hover */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "0.75rem",
          display: "flex",
          gap: "1.25rem",
          justifyContent: "center",
        }}
      >
        {[
          { href: "/terms", label: "Terms of Service" },
          { href: "/privacy", label: "Privacy Policy" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: "0.68rem",
              color: "#475569",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#00bcd4";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#475569";
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
