export default function StoreLoading() {
  return (
    <div>
      <div className="skeleton" style={{ height: 160, borderRadius: "1.5rem", marginBottom: "1.5rem" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div className="skeleton" style={{ height: 28, width: 200 }} />
        <div className="skeleton" style={{ height: 14, width: 80 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 320, borderRadius: "1.25rem", animationDelay: `${i * 0.06}s` }} />
        ))}
      </div>
    </div>
  );
}
