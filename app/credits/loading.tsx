export default function CreditsLoading() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 36, width: 140, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 16, width: 200 }} />
      </div>
      <div className="skeleton" style={{ height: 140, borderRadius: "1.25rem", marginBottom: "1.5rem" }} />
      <div className="skeleton" style={{ height: 14, width: 180, marginBottom: "1rem" }} />
      <div className="skeleton" style={{ height: 36, borderRadius: "0.5rem", marginBottom: "0.5rem" }} />
      {[...Array(12)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 40, borderRadius: "0.5rem", marginBottom: "0.25rem", animationDelay: `${i * 0.05}s` }} />
      ))}
    </div>
  );
}
