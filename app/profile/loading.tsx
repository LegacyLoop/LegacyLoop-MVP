export default function ProfileLoading() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 36, width: 160, marginBottom: "0.5rem" }} />
      </div>
      <div className="skeleton" style={{ height: 160, borderRadius: "1.25rem", marginBottom: "1.5rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: "1rem", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 32, width: 100, borderRadius: "9999px" }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 200, borderRadius: "1.25rem" }} />
    </div>
  );
}
