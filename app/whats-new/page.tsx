export default function WhatsNewPage() {
  const updates = [
    { date: "Mar 2, 2026", title: "Shipping System Overhaul", desc: "Complete shipping pipeline: AI-suggested packaging, carrier comparison, label creation, tracking timeline, and delivery notifications." },
    { date: "Mar 2, 2026", title: "Connected Accounts Hub", desc: "Link your social media, marketplaces, payment processors, and cloud storage in one place." },
    { date: "Mar 2, 2026", title: "Recon Bot Intelligence", desc: "Real-time competitor price monitoring across Facebook, eBay, and Craigslist with smart alerts." },
    { date: "Mar 1, 2026", title: "MegaBot Multi-AI", desc: "Four AI models analyze your items simultaneously for a consensus price estimate with higher confidence." },
    { date: "Mar 1, 2026", title: "Enhanced Photo Upload", desc: "Camera capture, drag-to-reorder, rotate, client-side compression, and multi-source upload." },
    { date: "Mar 1, 2026", title: "Location-Based Pricing", desc: "Prices now adjust based on local market demand. Ship to high-demand metros for better returns." },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="section-title">Updates</div>
      <h1 className="h2 mt-2">What&apos;s New</h1>
      <p className="muted mt-3">Recent features and improvements.</p>

      <div className="mt-8 space-y-4">
        {updates.map((u, i) => (
          <div key={i} className="card p-6">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>{u.date}</span>
              {i === 0 && (
                <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "var(--accent)", border: "1px solid rgba(0,188,212,0.2)" }}>
                  NEW
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{u.title}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.25rem", lineHeight: 1.5 }}>{u.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
