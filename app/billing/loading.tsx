export default function BillingLoading() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 36, width: 160, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 16, width: 240 }} />
      </div>
      <div className="skeleton" style={{ height: 180, borderRadius: "1.25rem", marginBottom: "1.5rem" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 320, borderRadius: "1.25rem", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 14, width: 140, marginBottom: "1rem" }} />
      <div className="skeleton" style={{ height: 36, borderRadius: "0.5rem", marginBottom: "0.5rem" }} />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 44, borderRadius: "0.5rem", marginBottom: "0.25rem", animationDelay: `${i * 0.05}s` }} />
      ))}
    </div>
  );
}
