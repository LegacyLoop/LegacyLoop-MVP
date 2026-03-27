import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "4rem 1.5rem", maxWidth: "500px", margin: "0 auto" }}>
      <div style={{
        fontSize: "6rem", fontWeight: 900, color: "var(--accent)",
        lineHeight: 1, letterSpacing: "-0.05em", marginBottom: "1rem",
        opacity: 0.3,
      }}>404</div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
        Page Not Found
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.5 }}>
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
        <Link href="/dashboard" style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
          textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
          border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
        }}>
          ← Back to Dashboard
        </Link>
      </div>
      <div style={{ marginTop: "2rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
        Need help? <a href="tel:5127580518" style={{ color: "var(--accent)" }}>(512) 758-0518</a>
      </div>
    </div>
  );
}
