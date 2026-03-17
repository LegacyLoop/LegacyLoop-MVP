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
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/dashboard" className="btn-primary" style={{ padding: "0.7rem 1.5rem", fontSize: "0.9rem", borderRadius: "0.6rem" }}>
          Go to Dashboard
        </Link>
        <Link href="/" className="btn-ghost" style={{ padding: "0.7rem 1.5rem", fontSize: "0.9rem", borderRadius: "0.6rem" }}>
          Go Home
        </Link>
      </div>
      <div style={{ marginTop: "2rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
        Need help? <a href="tel:5127580518" style={{ color: "var(--accent)" }}>(512) 758-0518</a>
      </div>
    </div>
  );
}
