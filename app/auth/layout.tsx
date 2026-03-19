import Image from "next/image";
import Link from "next/link";

const PARTICLES = [
  { size: 3, top: "12%", left: "8%", delay: "0s", duration: "7s" },
  { size: 2, top: "28%", left: "85%", delay: "1.2s", duration: "9s" },
  { size: 4, top: "55%", left: "15%", delay: "2.5s", duration: "11s" },
  { size: 2, top: "70%", left: "78%", delay: "0.8s", duration: "8s" },
  { size: 3, top: "38%", left: "92%", delay: "3.1s", duration: "10s" },
  { size: 2, top: "82%", left: "42%", delay: "1.7s", duration: "12s" },
  { size: 3, top: "18%", left: "65%", delay: "0.4s", duration: "9.5s" },
  { size: 2, top: "6%", left: "48%", delay: "2.2s", duration: "7.5s" },
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
      {/* Radial teal glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(0,188,212,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Floating particle dots */}
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
          }}
          aria-hidden="true"
        />
      ))}

      {/* Logo */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: "2rem" }}>
        <Image
          src="/images/logos/logo-stacked.png"
          alt="LegacyLoop"
          width={425}
          height={268}
          priority
          style={{
            maxWidth: "clamp(140px, 35vw, 200px)",
            width: "100%",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Auth card slot */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 20,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "40px",
        }}
      >
        {children}
      </div>

      {/* Tagline */}
      <p
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "1.5rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          textAlign: "center",
          letterSpacing: "0.04em",
        }}
      >
        AI-powered resale &middot; Connecting Generations
      </p>

      {/* Terms + Privacy */}
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
        <Link
          href="/terms"
          style={{
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          Terms of Service
        </Link>
        <Link
          href="/privacy"
          style={{
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
