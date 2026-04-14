export default function SubscriptionLoading() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 16, width: 260 }} />
      </div>
      <div className="skeleton" style={{ height: 180, borderRadius: "1.25rem", marginBottom: "1.5rem" }} />
      <div className="skeleton" style={{ height: 14, width: 160, marginBottom: "1rem" }} />
      <div className="skeleton" style={{ height: 36, borderRadius: "0.5rem", marginBottom: "0.5rem" }} />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 44, borderRadius: "0.5rem", marginBottom: "0.25rem", animationDelay: `${i * 0.05}s` }} />
      ))}
    </div>
  );
}
