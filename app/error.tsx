"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 1.5rem", maxWidth: "500px", margin: "0 auto" }}>
      <div style={{
        width: "80px", height: "80px", borderRadius: "50%",
        background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 1.5rem", fontSize: "2rem",
      }}>⚠️</div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
        Something Went Wrong
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.5 }}>
        We hit an unexpected error. Don&apos;t worry — your data is safe.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => reset()} className="btn-primary" style={{ padding: "0.7rem 1.5rem", fontSize: "0.9rem", borderRadius: "0.6rem" }}>
          Try Again
        </button>
        <a href="/dashboard" className="btn-ghost" style={{ padding: "0.7rem 1.5rem", fontSize: "0.9rem", borderRadius: "0.6rem", textDecoration: "none" }}>
          Go to Dashboard
        </a>
      </div>
      <div style={{ marginTop: "2rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
        Contact support: <a href="tel:5127580518" style={{ color: "var(--accent)" }}>(512) 758-0518</a> · <a href="mailto:legacyloopmaine@gmail.com" style={{ color: "var(--accent)" }}>legacyloopmaine@gmail.com</a>
      </div>
    </div>
  );
}
