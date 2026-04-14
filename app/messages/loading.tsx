export default function MessagesLoading() {
  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 36, width: 180, marginBottom: "0.5rem" }} />
      </div>
      <div style={{ display: "flex", gap: "1rem", minHeight: "70vh" }}>
        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="skeleton" style={{ height: 44, borderRadius: "0.75rem", marginBottom: "0.5rem" }} />
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: `${60 + (i % 3) * 15}%`, marginBottom: "4px" }} />
                <div className="skeleton" style={{ height: 12, width: `${40 + (i % 4) * 10}%` }} />
              </div>
              <div className="skeleton" style={{ height: 10, width: 40 }} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="skeleton" style={{ height: 56, borderRadius: "0.75rem", marginBottom: "1rem" }} />
          <div className="skeleton" style={{ flex: 1, borderRadius: "1rem", marginBottom: "1rem" }} />
          <div className="skeleton" style={{ height: 52, borderRadius: "0.75rem" }} />
        </div>
      </div>
    </div>
  );
}
