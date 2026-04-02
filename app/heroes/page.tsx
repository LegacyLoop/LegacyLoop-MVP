import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Heroes Discount Program · LegacyLoop",
  description: "25% discount for military, law enforcement, fire, and EMS families. Honoring those who serve our communities.",
};

const HERO_GROUPS = [
  {
    icon: "\uD83C\uDF96\uFE0F",
    title: "Military",
    color: "#1e3a5f",
    bg: "rgba(30,58,95,0.08)",
    border: "rgba(30,58,95,0.2)",
    members: [
      "Active duty (all branches)",
      "Veterans (all eras)",
      "Gold Star families",
      "Military retirees",
      "National Guard & Reserve",
      "Military spouses",
    ],
    verify: "DD-214 or military ID",
  },
  {
    icon: "\uD83D\uDE94",
    title: "Law Enforcement",
    color: "var(--text-primary)",
    bg: "var(--bg-secondary)",
    border: "var(--border-default)",
    members: [
      "Active police officers",
      "Retired law enforcement",
      "Sheriff's deputies",
      "State troopers",
      "Federal agents (FBI, DEA, etc.)",
      "Corrections officers",
    ],
    verify: "Badge + department ID",
  },
  {
    icon: "\uD83D\uDE92",
    title: "Fire & EMS",
    color: "#b91c1c",
    bg: "rgba(185,28,28,0.06)",
    border: "rgba(185,28,28,0.18)",
    members: [
      "Active firefighters",
      "Volunteer firefighters",
      "Retired firefighters",
      "EMTs & paramedics",
      "Dispatch personnel",
      "Fire investigator/marshal",
    ],
    verify: "Department ID or certification",
  },
];

const BENEFITS = [
  {
    icon: "\uD83D\uDCB0",
    title: "25% Off All Plans",
    description: "Every subscription tier, every month — for as long as you're a subscriber. No annual commitment required.",
    highlight: true,
  },
  {
    icon: "\uD83D\uDCD6",
    title: "Free Legacy Storytelling",
    description: "Complimentary story capture for up to 10 service-related items — uniforms, badges, gear, memorabilia.",
    highlight: false,
  },
  {
    icon: "\uD83C\uDFDB\uFE0F",
    title: "Heritage Archive",
    description: "A dedicated digital archive documenting your service history and family stories for future generations.",
    highlight: false,
  },
  {
    icon: "\uD83E\uDD1D",
    title: "Donation Coordination",
    description: "We connect service items with museums, historical societies, and organizations that will honor them.",
    highlight: false,
  },
  {
    icon: "\u2B50",
    title: "Priority Support",
    description: "Dedicated hero liaison — a real person, not a bot. We understand the value of a life in service.",
    highlight: false,
  },
  {
    icon: "\uD83C\uDFC5",
    title: "Hero Verified Badge",
    description: "A Hero Verified badge on your public store — builds buyer trust and honors your service publicly.",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    icon: "\uD83C\uDF96\uFE0F",
    name: "James K., Army Veteran (Vietnam)",
    quote: "LegacyLoop helped me find the right home for my father's WWII medals and uniform. They connected us with a military museum that will display them permanently. The 25% discount and storytelling service meant the world to our family.",
    stars: 5,
  },
  {
    icon: "\uD83D\uDE94",
    name: "Chief Sandra M., Retired Police (Portland PD)",
    quote: "After 32 years on the force I had decades of memorabilia and equipment. LegacyLoop treated each piece with respect — my badge collection found a buyer who truly appreciated the history. The hero discount made it an easy choice.",
    stars: 5,
  },
  {
    icon: "\uD83D\uDE92",
    name: "Captain Doug R., Waterville Fire Dept.",
    quote: "Retired firefighters end up with a lot of gear. LegacyLoop catalogued everything, helped me write the stories behind each piece, and found buyers who understood their significance. Amazing service.",
    stars: 5,
  },
];

export default function HeroesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Heroes" }]} />
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #1c1917, #292524)",
          borderRadius: "1.5rem",
          padding: "3.5rem",
          color: "#fff",
          marginBottom: "3rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: "1rem", right: "1.5rem", fontSize: "4rem", opacity: 0.08, display: "flex", gap: "0.5rem" }}>{"\uD83C\uDF96\uFE0F\uD83D\uDE94\uD83D\uDE92"}</div>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "350px", height: "350px", background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)" }} />

        <div style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#fbbf24", fontWeight: 700, marginBottom: "0.75rem" }}>
          {"\uD83C\uDFC5"} Heroes Discount Program
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem" }}>
          Honoring Those Who Serve
        </h1>
        <p style={{ color: "var(--text-primary)", maxWidth: "620px", lineHeight: 1.7, marginBottom: "1.75rem", fontSize: "1.05rem" }}>
          Military veterans, law enforcement, firefighters, and EMS personnel dedicate their lives to service.
          LegacyLoop honors that commitment with exclusive pricing, dedicated support, and a platform
          that preserves your legacy the way it deserves.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            href="/heroes/apply"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#fbbf24",
              color: "#1c1917",
              padding: "0.85rem 2rem",
              borderRadius: "9999px",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            Apply for Hero Pricing {"\u2192"}
          </Link>
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

        {/* Stats */}
        <div style={{ display: "flex", gap: "2.5rem", marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" }}>
          {[
            { value: "25%", label: "Off all subscription tiers" },
            { value: "3", label: "Hero categories honored" },
            { value: "Free", label: "Legacy storytelling (10 items)" },
            { value: "1-on-1", label: "Dedicated hero liaison" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fbbf24" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Who qualifies */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Eligibility</div>
        <h2 className="h2 mb-6">Who Qualifies</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {HERO_GROUPS.map((g) => (
            <div key={g.title} className="card p-6" style={{ border: `1.5px solid ${g.border}`, background: g.bg }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{g.icon}</div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: g.color, marginBottom: "0.75rem" }}>{g.title}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {g.members.map((m) => (
                  <li key={m} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    <span style={{ color: g.color, fontWeight: 700 }}>{"\u2713"}</span> {m}
                  </li>
                ))}
              </ul>
              <div style={{ padding: "0.5rem 0.75rem", background: "var(--bg-secondary)", border: `1px solid ${g.border}`, borderRadius: "0.6rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <span style={{ fontWeight: 700 }}>Verification:</span> {g.verify}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Program Benefits</div>
        <h2 className="h2 mb-6">What You Receive</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="card p-6"
              style={b.highlight ? { background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.08))", borderColor: "#fbbf24", borderWidth: "1.5px" } : {}}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{b.icon}</div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem", marginBottom: "0.35rem" }}>
                {b.title}
                {b.highlight && (
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.6rem", background: "#92400e", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 800 }}>
                    HERO EXCLUSIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{b.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing preview */}
      <div className="card p-8 mb-10">
        <h2 className="h2 mb-2">Hero Pricing</h2>
        <p className="muted mb-6">25% off every tier, every month. Verified heroes pay these rates as long as they{"'"}re subscribed.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Plan</th>
                <th style={{ textAlign: "center", padding: "0.6rem", color: "var(--text-muted)", fontWeight: 600 }}>Regular Price</th>
                <th style={{ textAlign: "center", padding: "0.6rem", color: "#fbbf24", fontWeight: 700 }}>Hero Price</th>
                <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Best For</th>
              </tr>
            </thead>
            <tbody>
              {[
                { plan: "Try It Out", regular: "Free", hero: "Free", best: "Getting started, 3 items" },
                { plan: "DIY Seller", regular: "$10/mo", hero: "$7.50/mo", best: "Individual sellers, 25 items" },
                { plan: "Power Seller", regular: "$20/mo", hero: "$15/mo", best: "Active sellers, 100 items" },
                { plan: "Estate Manager", regular: "$49/mo", hero: "$36.75/mo", best: "Full estates, 300 items" },
              ].map((row, i) => (
                <tr key={row.plan} style={{ borderBottom: "1px solid var(--border-default)", background: i % 2 === 0 ? "var(--bg-secondary)" : "var(--bg-card-solid)" }}>
                  <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{row.plan}</td>
                  <td style={{ padding: "0.6rem", textAlign: "center", color: "var(--text-muted)", textDecoration: row.regular !== "Free" ? "line-through" : "none" }}>{row.regular}</td>
                  <td style={{ padding: "0.6rem", textAlign: "center", fontWeight: 800, color: "var(--warning-text)" }}>{row.hero}</td>
                  <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>{row.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "0.75rem", fontSize: "0.82rem", color: "var(--antique-text)" }}>
          White-Glove estate services also include a 25% discount for verified heroes. Contact us for a custom quote.
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Stories</div>
        <h2 className="h2 mb-6">Representative Hero Experiences</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{t.icon}</span>
                <div style={{ display: "flex", gap: "0.15rem" }}>
                  {"\u2605\u2605\u2605\u2605\u2605".split("").map((s, i) => (
                    <span key={i} style={{ color: "#f59e0b", fontSize: "1rem" }}>{s}</span>
                  ))}
                </div>
              </div>
              <blockquote style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.7, fontStyle: "italic", marginBottom: "0.75rem" }}>
                {"\u201C"}{t.quote}{"\u201D"}
              </blockquote>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>{"\u2014"} {t.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply CTA */}
      <div id="apply" style={{ textAlign: "center", padding: "3rem", background: "var(--bg-card-solid)", borderRadius: "1.5rem", border: "1px solid var(--border-default)", marginBottom: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{"\uD83C\uDFC5"}</div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>Ready to Apply?</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>Takes 2 minutes. We verify within 24 hours and apply your 25% discount immediately.</p>
        <Link href="/heroes/apply" className="btn-primary" style={{ padding: "0.85rem 2.5rem", fontSize: "1rem", borderRadius: "9999px" }}>
          Start Application {"\u2192"}
        </Link>
      </div>

      {/* Contact */}
      <div style={{ textAlign: "center", padding: "1.5rem", background: "var(--bg-secondary)", borderRadius: "1rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
        Questions? Contact our hero liaison directly:{" "}
        <strong>support@legacy-loop.com</strong> or call <strong>(207) 555-HERO</strong>
      </div>
    </div>
  );
}
