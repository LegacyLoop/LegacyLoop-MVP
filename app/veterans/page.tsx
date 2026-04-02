import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Veteran Legacy Program · LegacyLoop",
  description: "Special pricing and legacy storytelling for veterans and military families. Honoring those who served.",
};

const BENEFITS = [
  {
    icon: "💰",
    title: "25% Service Discount",
    description: "All service tiers discounted 25% for verified veterans and active duty military families.",
    highlight: true,
  },
  {
    icon: "📖",
    title: "Free Legacy Storytelling",
    description: "Complimentary story capture for up to 10 service-related items — uniforms, medals, equipment, memorabilia.",
    highlight: false,
  },
  {
    icon: "🎖️",
    title: "Military Heritage Archive",
    description: "A dedicated digital archive documenting service history, military items, and family stories for future generations.",
    highlight: false,
  },
  {
    icon: "🏛️",
    title: "VA & Museum Referrals",
    description: "We connect significant military items with VA museums, historical societies, and veteran organizations as an alternative to resale.",
    highlight: false,
  },
  {
    icon: "⭐",
    title: "Priority Support",
    description: "Dedicated veteran liaison for all questions. No automated bots — a real person who understands military service.",
    highlight: false,
  },
  {
    icon: "🤝",
    title: "Donation Coordination",
    description: "We coordinate donations of military items to veteran organizations, museums, and historical societies on your behalf.",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: "James K., Army Veteran (Vietnam)",
    quote: "LegacyLoop helped me find the right home for my father's WWII medals and uniform. They connected us with a military museum that will display them permanently. The storytelling service captured his service in a way our family will cherish forever.",
    stars: 5,
  },
  {
    name: "Patricia M., Gold Star Family",
    quote: "After losing my husband, I had no idea what to do with his military gear and personal items. LegacyLoop treated every item with incredible respect and helped me decide what to keep, sell, and donate. The 25% discount was meaningful but the care they showed was priceless.",
    stars: 5,
  },
  {
    name: "Robert & Linda Chen, Military Family",
    quote: "Retiring after 30 years means a house full of memories. LegacyLoop organized everything — from deployments to family photos — into a beautiful digital archive our grandchildren can access forever.",
    stars: 5,
  },
];

const ELIGIBLE = [
  "Active duty military personnel",
  "Veterans (all branches, all eras)",
  "Gold Star families",
  "Military retirees",
  "National Guard and Reserve members",
  "Military spouse households",
];

export default function VeteransPage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f, #1a2f4e)",
          borderRadius: "1.5rem",
          padding: "3.5rem",
          color: "#fff",
          marginBottom: "3rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: "1rem", right: "1.5rem", fontSize: "4rem", opacity: 0.12 }}>🇺🇸</div>
        <div style={{ position: "absolute", bottom: "0", right: "0", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)" }} />

        <div style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#93c5fd", fontWeight: 700, marginBottom: "0.75rem" }}>
          🇺🇸 Veteran Legacy Program
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem" }}>
          Honoring Those Who Served
        </h1>
        <p style={{ color: "var(--text-primary)", maxWidth: "600px", lineHeight: 1.7, marginBottom: "1.75rem", fontSize: "1.05rem" }}>
          Military service creates a lifetime of meaningful items — uniforms, medals, equipment, letters, photos.
          LegacyLoop helps veteran families preserve, document, and responsibly transition these treasures
          with special pricing and dedicated support.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href="#apply"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#fff",
              color: "#1e3a5f",
              padding: "0.85rem 2rem",
              borderRadius: "9999px",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            Apply for Veteran Pricing →
          </a>
          <Link
            href="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--bg-card-hover)",
              color: "var(--text-primary)",
              padding: "0.85rem 2rem",
              borderRadius: "9999px",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: "0.95rem",
              border: "1px solid var(--border-default)",
            }}
          >
            View All Plans
          </Link>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: "2.5rem", marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" }}>
          {[
            { value: "25%", label: "Discount on all tiers" },
            { value: "Free", label: "Legacy storytelling" },
            { value: "10+", label: "Partner museums & orgs" },
            { value: "1-on-1", label: "Veteran liaison support" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits grid */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Program Benefits</div>
        <h2 className="h2 mb-6">What You Receive</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="card p-6"
              style={b.highlight ? { background: "linear-gradient(135deg, #eff6ff, #dbeafe)", borderColor: "#93c5fd", borderWidth: "1.5px" } : {}}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{b.icon}</div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem", marginBottom: "0.35rem" }}>
                {b.title}
                {b.highlight && (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.65rem", background: "#1e3a5f", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 800 }}>
                    MILITARY EXCLUSIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{b.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Stories</div>
        <h2 className="h2 mb-6">From Veteran Families</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div style={{ display: "flex", gap: "0.2rem", marginBottom: "0.75rem" }}>
                {"★★★★★".split("").map((star, i) => (
                  <span key={i} style={{ color: "#f59e0b", fontSize: "1rem" }}>{star}</span>
                ))}
              </div>
              <blockquote style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.7, fontStyle: "italic", marginBottom: "0.75rem" }}>
                "{t.quote}"
              </blockquote>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>— {t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility */}
      <div className="card p-8 mb-8">
        <h2 className="h2 mb-4">Who Is Eligible</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ELIGIBLE.map((e) => (
            <div key={e} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              <span style={{ color: "#1e3a5f", fontWeight: 700 }}>✓</span>
              {e}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.75rem", fontSize: "0.85rem", color: "#1e40af" }}>
          Verification is simple and respectful. A copy of DD-214 or military ID is sufficient. We protect all documents securely.
        </div>
      </div>

      {/* Military item types */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Items We Specialize In</div>
        <h2 className="h2 mb-6">Military &amp; Service Items</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { icon: "🎖️", label: "Medals & Ribbons" },
            { icon: "👔", label: "Dress Uniforms" },
            { icon: "🗺️", label: "Maps & Documents" },
            { icon: "📷", label: "Wartime Photos" },
            { icon: "🔫", label: "Decommissioned Equipment" },
            { icon: "📝", label: "Letters & Journals" },
            { icon: "🪖", label: "Helmets & Gear" },
            { icon: "📚", label: "Military Books" },
            { icon: "🎺", label: "Instruments" },
            { icon: "🏅", label: "Challenge Coins" },
            { icon: "✈️", label: "Aviation Memorabilia" },
            { icon: "⚓", label: "Naval Items" },
          ].map((item) => (
            <div key={item.label} style={{ padding: "0.75rem 1rem", background: "var(--bg-card-solid)", borderRadius: "0.75rem", textAlign: "center", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{item.icon}</div>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Apply section */}
      <div
        id="apply"
        style={{
          background: "linear-gradient(135deg, #1e3a5f, #1a2f4e)",
          borderRadius: "1.5rem",
          padding: "3rem",
          color: "#fff",
          marginBottom: "2rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "500px", margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🇺🇸</div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            Apply for Veteran Pricing
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Takes 2 minutes. We verify within 24 hours and apply your 25% discount immediately.
            No pressure, no sales calls.
          </p>

          {/* Mock form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <input
              placeholder="Your name"
              style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "none", fontSize: "0.9rem", background: "var(--bg-card-hover)", color: "var(--text-primary)", outline: "1px solid var(--border-default)" }}
            />
            <input
              placeholder="Email address"
              type="email"
              style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "none", fontSize: "0.9rem", background: "var(--bg-card-hover)", color: "var(--text-primary)", outline: "1px solid var(--border-default)" }}
            />
            <select
              style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "none", fontSize: "0.9rem", background: "var(--bg-card-hover)", color: "var(--text-primary)", outline: "1px solid var(--border-default)" }}
            >
              <option value="" style={{ color: "#1c1917" }}>Status / Branch</option>
              <option style={{ color: "#1c1917" }}>Army Veteran</option>
              <option style={{ color: "#1c1917" }}>Navy Veteran</option>
              <option style={{ color: "#1c1917" }}>Air Force Veteran</option>
              <option style={{ color: "#1c1917" }}>Marine Corps Veteran</option>
              <option style={{ color: "#1c1917" }}>Coast Guard Veteran</option>
              <option style={{ color: "#1c1917" }}>Space Force</option>
              <option style={{ color: "#1c1917" }}>Active Duty</option>
              <option style={{ color: "#1c1917" }}>Gold Star Family</option>
              <option style={{ color: "#1c1917" }}>Military Spouse</option>
            </select>
          </div>

          <button
            style={{
              width: "100%",
              padding: "0.9rem",
              background: "#fff",
              color: "#1e3a5f",
              border: "none",
              borderRadius: "0.75rem",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Submit Application →
          </button>

          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem" }}>
            We will never share your service information. Verification documents are deleted after review.
          </p>
        </div>
      </div>

      {/* Partners */}
      <div className="card p-6 text-center mb-8">
        <div className="section-title mb-4">Partner Organizations</div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          We work with these organizations to ensure military items find the right homes.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          {[
            "Maine Military Museum",
            "American Legion Posts",
            "VFW Posts",
            "Smithsonian (Affiliate)",
            "VA Medical Centers",
            "Honor & Remember",
          ].map((org) => (
            <div key={org} style={{ padding: "0.4rem 0.9rem", background: "var(--bg-card-solid)", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              {org}
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "1.5rem", background: "#eff6ff", borderRadius: "1rem", fontSize: "0.88rem", color: "#1e40af" }}>
        Questions? Contact our veteran liaison directly: <strong>support@legacy-loop.com</strong> or call <strong>(207) 555-VETS</strong>
      </div>
    </div>
  );
}
