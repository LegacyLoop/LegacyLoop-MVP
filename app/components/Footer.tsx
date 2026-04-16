"use client";

import Link from "next/link";

const TRUST_BADGES = [
  { icon: "🔒", label: "SSL Secured", sub: "256-bit encryption" },
  { icon: "✅", label: "SOC 2 Type II", sub: "Security certified" },
  { icon: "🏛️", label: "Maine Certified", sub: "Licensed platform" },
  { icon: "🎖️", label: "Veteran-Owned", sub: "Proud member" },
];

const STATS = [
  { value: "AI-Powered", label: "Estate resale platform" },
  { value: "15 Bots", label: "Working for you" },
  { value: "Pre-Launch", label: "Beta — Launching 2026" },
  { value: "Free", label: "To get started" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="no-print app-footer"
      style={{
        borderTop: "1px solid var(--border-default)",
        background: "var(--bg-secondary)",
        marginTop: "4rem",
        paddingTop: "3rem",
        paddingBottom: "1.5rem",
      }}
    >
      <div className="container-app">
        {/* Social proof stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "3rem",
            flexWrap: "wrap",
            marginBottom: "2.5rem",
            paddingBottom: "2.5rem",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent-theme)" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
            marginBottom: "2.5rem",
          }}
        >
          {TRUST_BADGES.map((b) => (
            <div
              key={b.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.875rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "0.75rem",
              }}
            >
              <span style={{ fontSize: "1rem" }}>{b.icon}</span>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {b.label}
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{b.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Links grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "2rem",
            marginBottom: "2rem",
            maxWidth: "900px",
            margin: "0 auto 2rem auto",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              Platform
            </div>
            {[
              { label: "Pricing", href: "/pricing" },
              { label: "Take the Quiz", href: "/onboarding/quiz" },
              { label: "How It Works", href: "/pricing#how" },
              { label: "White-Glove", href: "/white-glove" },
              { label: "Contractors", href: "/contractors" },
              { label: "What's New", href: "/whats-new" },
              { label: "Roadmap", href: "/coming-soon" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  marginBottom: "0.35rem",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              Community
            </div>
            {[
              { label: "Heroes Program", href: "/heroes" },
              { label: "Neighborhood Bundle", href: "/services/neighborhood-bundle" },
              { label: "Donate Items", href: "/donate" },
              { label: "Referral Program", href: "/referral" },
              { label: "API Access", href: "/api-access" },
              { label: "Support Our Mission", href: "/donate#support" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  marginBottom: "0.35rem",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              Support
            </div>
            {[
              { label: "support@legacy-loop.com", href: "mailto:support@legacy-loop.com" },
              { label: "Phone support coming soon", href: "#" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  marginBottom: "0.35rem",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              Company
            </div>
            {[
              { label: "About LegacyLoop", href: "/about" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Data Deletion", href: "/data-deletion" },
              { label: "Cookie Policy", href: "/privacy#cookies" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  marginBottom: "0.35rem",
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-default)",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <img src="/images/logos/logo-icon.png" alt="LegacyLoop" style={{ height: "24px", width: "24px", objectFit: "contain" }} />
            &copy; {year} LegacyLoop Tech LLC &middot; Waterville, Maine &middot; All rights reserved.
          </span>
          <span
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <span
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent-theme)",
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.65rem",
                fontWeight: 700,
                border: "1px solid var(--accent-border)",
              }}
            >
              v1.0.0-beta
            </span>
            <span>Built with purpose in Maine</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
