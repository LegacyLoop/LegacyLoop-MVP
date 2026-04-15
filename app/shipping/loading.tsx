export default function ShippingLoading() {
  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ height: 12, width: 120, background: "var(--ghost-bg)", borderRadius: "0.25rem", marginBottom: "0.75rem" }} className="skeleton" />
        <div style={{ height: 24, width: 220, background: "var(--ghost-bg)", borderRadius: "0.25rem", marginBottom: "0.5rem" }} className="skeleton" />
        <div style={{ height: 10, width: 300, background: "var(--ghost-bg)", borderRadius: "0.25rem" }} className="skeleton" />
      </div>

      {/* Tab bar skeleton — 5 pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[100, 120, 100, 130, 110].map((w, i) => (
          <div key={i} style={{ height: 44, width: w, borderRadius: "0.75rem", background: "var(--ghost-bg)" }} className="skeleton" />
        ))}
      </div>

      {/* KPI dashboard row — 4 metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ padding: "1rem", borderRadius: "0.75rem", border: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
            <div style={{ height: 10, width: "50%", background: "var(--ghost-bg)", borderRadius: "0.25rem", marginBottom: "0.5rem" }} className="skeleton" />
            <div style={{ height: 24, width: "40%", background: "var(--ghost-bg)", borderRadius: "0.25rem" }} className="skeleton" />
          </div>
        ))}
      </div>

      {/* Item rows — 3 items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "1rem", padding: "1rem",
            borderRadius: "0.75rem", border: "1px solid var(--border-default)",
            background: "var(--bg-card)",
          }}>
            <div style={{ width: 56, height: 56, borderRadius: "0.5rem", background: "var(--ghost-bg)", flexShrink: 0 }} className="skeleton" />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: "55%", background: "var(--ghost-bg)", borderRadius: "0.25rem", marginBottom: "0.4rem" }} className="skeleton" />
              <div style={{ height: 10, width: "30%", background: "var(--ghost-bg)", borderRadius: "0.25rem" }} className="skeleton" />
            </div>
            <div style={{ height: 30, width: 90, borderRadius: "0.5rem", background: "var(--ghost-bg)", flexShrink: 0 }} className="skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
