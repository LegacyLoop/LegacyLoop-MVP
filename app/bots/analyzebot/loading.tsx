export default function AnalyzeBotLoading() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 160, marginBottom: "0.5rem" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div>
            <div className="skeleton" style={{ height: 32, width: 200, marginBottom: "0.35rem" }} />
            <div className="skeleton" style={{ height: 14, width: 280 }} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: "1rem", animationDelay: `${i * 0.06}s` }} />
        ))}
      </div>
    </div>
  );
}
