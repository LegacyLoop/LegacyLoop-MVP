import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About LegacyLoop — Mission & Vision",
  description: "AI-powered resale platform built with faith, grit, and a calling to serve families, seniors, veterans, and those in need.",
};

export default function AboutPage() {
  const values = [
    { icon: "\u271D\uFE0F", title: "Faith-Driven", desc: "Guided by belief and purpose, honoring the greater good in every decision and action we take." },
    { icon: "\uD83E\uDD81", title: "Courage", desc: "Boldly pursuing a vision that transforms lives, even when it is unconventional or hard." },
    { icon: "\u2696\uFE0F", title: "Integrity", desc: "Operating with honesty and ethical standards in every interaction \u2014 no exceptions." },
    { icon: "\u2764\uFE0F", title: "Compassion", desc: "Serving with empathy \u2014 especially for seniors, families, veterans, and those in need." },
    { icon: "\uD83C\uDF31", title: "Stewardship", desc: "Responsibly managing resources to maximize meaningful impact for those who need it most." },
    { icon: "\uD83D\uDCAA", title: "Discipline", desc: "Committing to excellence and persistence in achieving the mission, every single day." },
  ];

  const visionGoals = [
    { title: "Community Roots in Maine", desc: "Build a successful company that funds community property and initiatives in central Maine \u2014 starting local, growing with purpose." },
    { title: "Veterans Support Program", desc: "Develop an affordable living program for veterans, offering a real path to stability, dignity, and hope. 25% hero discount on all plans." },
    { title: "Support for the Vulnerable", desc: "Provide resources and innovative solutions for seniors and individuals in need \u2014 tools designed with empathy, not just efficiency." },
    { title: "Nothing Goes to Waste", desc: "Collect unsold items from platform users and redirect them as donations to families in need. Every item finds purpose." },
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Premium header with atmospheric glow */}
      <div style={{ textAlign: "center", marginBottom: "3rem", position: "relative" }}>
        <div style={{ position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)", width: "400px", height: "250px", background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,188,212,0.1), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ width: 48, height: 3, background: "linear-gradient(90deg, #00bcd4, #009688)", borderRadius: 2, margin: "0 auto 1rem auto" }} />
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", backgroundImage: "linear-gradient(135deg, var(--text-primary), #00bcd4)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.75rem" }}>About LegacyLoop</h1>
        <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "600px", margin: "0 auto" }}>
          An AI-powered resale platform built with faith, grit, and a calling to serve families, seniors, veterans, and those in need.
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>Founded by Ryan Hallee · Maine, USA · 2025</p>
      </div>

      {/* Mission Statement — premium glass card with teal border */}
      <div style={{ background: "var(--bg-card)", backdropFilter: "blur(24px)", borderLeft: "4px solid #00bcd4", borderRadius: "0 16px 16px 0", padding: "1.75rem 2rem", marginBottom: "2rem", boxShadow: "0 8px 32px rgba(0,188,212,0.08), inset 0 1px 0 rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "radial-gradient(circle, rgba(0,188,212,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Our Mission</div>
        <p style={{ fontSize: "1.05rem", color: "var(--text-primary)", lineHeight: 1.7, fontStyle: "italic", fontWeight: 500 }}>
          &ldquo;At LegacyLoop, we are driven by faith and purpose to connect generations and uplift communities. Our AI-powered resale platform empowers families and seniors during life&apos;s transitions, while supporting veterans, the elderly, and those in need. Through every sale, donation, and partnership, we aim to provide dignity, resources, and hope &mdash; building a brighter future with integrity, compassion, and stewardship.&rdquo;
        </p>
      </div>

      {/* Values Grid */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: "1.25rem" }}>Our Values</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {values.map(v => (
            <div key={v.title} onMouseEnter={(e: any) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,188,212,0.1)"; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }} style={{ background: "var(--bg-card)", backdropFilter: "blur(12px)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "1.25rem", transition: "transform 0.25s ease, box-shadow 0.25s ease", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", cursor: "default" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{v.icon}</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>{v.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vision */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: "1.25rem" }}>Our Vision</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {visionGoals.map((g, i) => (
            <div key={g.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, color: "#00bcd4", flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{g.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{g.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Paths */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: "1.25rem" }}>Two Paths, One Platform</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(0,188,212,0.02))", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "16px", padding: "1.5rem" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#00bcd4", marginBottom: "0.5rem" }}>🏠 Estate & Senior Path</div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>Full-service estate sale management with White-Glove support. AI handles pricing, listing, and buyer matching. Designed for families navigating transitions with dignity and respect.</p>
          </div>
          <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "16px", padding: "1.5rem" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#22c55e", marginBottom: "0.5rem" }}>🏷️ Garage & Yard Sale Path</div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>Self-serve selling with AI assistance. Snap a photo, get an instant price, list across 10+ platforms. Neighborhood Bundle feature brings communities together for multi-family sales.</p>
          </div>
        </div>
      </div>

      {/* Our Heart */}
      <div style={{ marginBottom: "2.5rem", textAlign: "center", padding: "0 1.5rem" }}>
        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.8, maxWidth: "600px", margin: "0 auto", fontStyle: "italic" }}>
          LegacyLoop was built on the belief that every person has value, every item has a story, and every transition deserves dignity. Our founder started this company in Maine with nothing but faith, grit, and a laptop &mdash; driven by a calling to serve. That calling hasn&apos;t changed. As we grow, so does our commitment to giving back. We collect unsold items for donation to families in need, and a portion of our success will fund affordable living programs for veterans and community initiatives in central Maine.
        </p>
      </div>

      {/* Closing */}
      <div style={{ textAlign: "center", padding: "2rem 1.5rem", background: "linear-gradient(135deg, rgba(0,188,212,0.06), transparent)", borderRadius: "16px", border: "1px solid rgba(0,188,212,0.15)" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", fontStyle: "italic", lineHeight: 1.6 }}>
          &ldquo;Connecting Generations — one family, one item, one act of generosity at a time.&rdquo;
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>Founded by Ryan Hallee · Maine, 2025</p>
      </div>
    </div>
  );
}
