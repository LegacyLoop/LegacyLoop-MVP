export default function ShippingLoading() {
  return (
    <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ height: 12, width: 120, background: "rgba(255,255,255,0.06)", borderRadius: "0.25rem", marginBottom: "0.75rem" }} className="skeleton" />
        <div style={{ height: 24, width: 220, background: "rgba(255,255,255,0.08)", borderRadius: "0.25rem", marginBottom: "0.5rem" }} className="skeleton" />
        <div style={{ height: 10, width: 300, background: "rgba(255,255,255,0.04)", borderRadius: "0.25rem" }} className="skeleton" />
      </div>

      {/* Tab skeleton */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
        {[130, 110, 140, 150].map((w, i) => (
          <div key={i} style={{ height: 36, width: w, borderRadius: "0.65rem", background: "rgba(255,255,255,0.05)" }} className="skeleton" />
        ))}
      </div>

      {/* Items skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "1rem", padding: "1rem",
            borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)" }} className="skeleton" />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: "55%", background: "rgba(255,255,255,0.06)", borderRadius: "0.25rem", marginBottom: "0.4rem" }} className="skeleton" />
              <div style={{ height: 10, width: "30%", background: "rgba(255,255,255,0.04)", borderRadius: "0.25rem" }} className="skeleton" />
            </div>
            <div style={{ height: 30, width: 90, borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)" }} className="skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
