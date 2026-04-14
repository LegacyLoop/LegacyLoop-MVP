export default function MegaBotLoading() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 160, marginBottom: "0.5rem" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div>
            <div className="skeleton" style={{ height: 32, width: 240, marginBottom: "0.35rem" }} />
            <div className="skeleton" style={{ height: 14, width: 320 }} />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: "0.75rem", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 64, borderRadius: "0.75rem", marginBottom: "1rem" }} />
      <div className="skeleton" style={{ height: 300, borderRadius: "1.25rem" }} />
    </div>
  );
}
