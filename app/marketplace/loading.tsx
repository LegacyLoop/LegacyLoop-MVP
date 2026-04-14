export default function MarketplaceLoading() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 140, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 140, borderRadius: "1.25rem", marginBottom: "1.5rem" }} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[100, 80, 120, 90, 70, 110, 85, 95].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 36, width: w, borderRadius: "9999px" }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "1rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 280, borderRadius: "1.25rem", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 14, width: 100, marginBottom: "1rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 300, borderRadius: "1.25rem", animationDelay: `${i * 0.06}s` }} />
        ))}
      </div>
    </div>
  );
}
