export default function BotsLoading() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 16, width: 280 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 240, borderRadius: "1.25rem", animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}
