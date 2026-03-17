"use client";

import { useState } from "react";

export default function DemoSeedButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function seed() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/demo/seed", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setResult(data.message ?? "Demo data seeded!");
    } else {
      setResult(data.error ?? "Failed — analyze an item first.");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <button
        onClick={seed}
        disabled={loading}
        style={{
          padding: "0.55rem 1.1rem",
          fontSize: "0.875rem",
          background: "var(--purple-bg)",
          border: "1px solid var(--purple-border)",
          borderRadius: "0.6rem",
          color: "var(--purple-text)",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 600,
          whiteSpace: "nowrap",
          minHeight: "44px",
        }}
      >
        {loading ? "Seeding..." : "Load Demo Data"}
      </button>
      {result && (
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{result}</span>
      )}
    </div>
  );
}
