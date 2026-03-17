export default function DashboardLoading() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 36, width: 240, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ height: 16, width: 180 }} />
      </div>

      {/* Stats grid — 5 cards matching the real layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "0.75rem",
          marginBottom: "1.75rem",
        }}
      >
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 110, borderRadius: "0.75rem" }}
          />
        ))}
      </div>

      {/* Alerts skeleton */}
      <div
        className="skeleton"
        style={{ height: 56, borderRadius: "1rem", marginBottom: "1.5rem" }}
      />

      {/* Messages summary skeleton */}
      <div
        className="skeleton"
        style={{ height: 64, borderRadius: "1.25rem", marginBottom: "2rem" }}
      />

      {/* Items section title */}
      <div className="skeleton" style={{ height: 12, width: 100, marginBottom: "1rem" }} />

      {/* Item cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 240, borderRadius: "1.5rem" }}
          />
        ))}
      </div>

      {/* Recent activity skeleton */}
      <div style={{ marginTop: "2.5rem" }}>
        <div className="skeleton" style={{ height: 12, width: 140, marginBottom: "1rem" }} />
        <div className="skeleton" style={{ height: 280, borderRadius: "1.25rem" }} />
      </div>
    </div>
  );
}
