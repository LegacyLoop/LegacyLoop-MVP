export default function ItemLoading() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div className="skeleton" style={{ height: 18, width: 200, marginBottom: "1.5rem" }} />

      {/* Title + badges */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div className="skeleton" style={{ height: 36, width: "60%", marginBottom: "0.75rem" }} />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 9999 }} />
          <div className="skeleton" style={{ height: 24, width: 100, borderRadius: 9999 }} />
          <div className="skeleton" style={{ height: 24, width: 90, borderRadius: 9999 }} />
        </div>
      </div>

      {/* Photo gallery + details grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        {/* Photo gallery skeleton */}
        <div>
          <div className="skeleton" style={{ height: 340, borderRadius: "1.5rem", marginBottom: "0.75rem" }} />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ width: 64, height: 64, borderRadius: "0.5rem" }} />
            ))}
          </div>
        </div>
        {/* Details skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 48, borderRadius: "0.75rem" }} />
          ))}
        </div>
      </div>

      {/* Engagement bar */}
      <div className="skeleton" style={{ height: 48, borderRadius: "1rem", marginBottom: "1.5rem" }} />

      {/* AI analysis panel */}
      <div className="skeleton" style={{ height: 200, borderRadius: "1.5rem", marginBottom: "1.5rem" }} />

      {/* Antique alert placeholder */}
      <div className="skeleton" style={{ height: 80, borderRadius: "1rem", marginBottom: "1.5rem" }} />

      {/* Message center */}
      <div className="skeleton" style={{ height: 260, borderRadius: "1.5rem", marginBottom: "1.5rem" }} />

      {/* MegaBuying Bot panel */}
      <div className="skeleton" style={{ height: 180, borderRadius: "1.5rem", marginBottom: "1.5rem" }} />

      {/* Recon Bot panel */}
      <div className="skeleton" style={{ height: 180, borderRadius: "1.5rem", marginBottom: "1.5rem" }} />

      {/* Activity log */}
      <div className="skeleton" style={{ height: 200, borderRadius: "1.5rem" }} />
    </div>
  );
}
