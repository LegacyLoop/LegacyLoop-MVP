export default function SettingsLoading() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 36, width: 140, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 16, width: 260 }} />
      </div>
      <div className="skeleton" style={{ height: 100, borderRadius: "1.25rem", marginBottom: "1rem" }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 48, borderRadius: "0.75rem", marginBottom: "0.5rem" }} />
      ))}
      <div className="skeleton" style={{ height: 240, borderRadius: "1.25rem", marginTop: "1rem", marginBottom: "1rem" }} />
      <div className="skeleton" style={{ height: 140, borderRadius: "1.25rem", marginBottom: "1rem" }} />
      <div className="skeleton" style={{ height: 140, borderRadius: "1.25rem", marginBottom: "1rem" }} />
      <div className="skeleton" style={{ height: 140, borderRadius: "1.25rem" }} />
    </div>
  );
}
