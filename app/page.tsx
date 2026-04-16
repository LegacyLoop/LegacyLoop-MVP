import { authAdapter } from "@/lib/adapters/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFoundingMemberStats } from "@/lib/founding-members";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LegacyLoop — AI-Powered Estate & Garage Sale Platform",
  description: "Upload a photo and get instant AI pricing. Sell to real buyers with smart bots, easy shipping, and white-glove estate services. Start free.",
  openGraph: {
    title: "LegacyLoop — AI-Powered Estate & Garage Sale Platform",
    description: "Upload a photo and get instant AI pricing. Sell to real buyers with smart bots, easy shipping, and white-glove estate services.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegacyLoop — AI-Powered Estate & Garage Sale Platform",
    description: "Upload a photo and get instant AI pricing. Sell to real buyers with smart bots, easy shipping, and white-glove estate services.",
  },
};

const FEATURES = [
  {
    icon: "🧠",
    title: "AI-Powered Pricing",
    desc: "4 AI engines analyze your item and give you the true market value",
    gradient: "linear-gradient(135deg, rgba(0,188,212,0.15), rgba(0,188,212,0.05))",
  },
  {
    icon: "🔍",
    title: "Find Real Buyers",
    desc: "Our bots scan 50+ platforms to find people who actually want your items",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))",
  },
  {
    icon: "📦",
    title: "Ship With Ease",
    desc: "Print labels, show a QR code at the post office, or schedule a pickup",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))",
  },
  {
    icon: "🏡",
    title: "Estate Services",
    desc: "We come to your home and handle everything, from inventory to sale",
    gradient: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))",
  },
];

const STEPS = [
  { num: "01", title: "Upload a Photo", desc: "Snap a photo of any item with your phone", icon: "📸" },
  { num: "02", title: "AI Prices It Instantly", desc: "Get a fair market price from 4 AI engines in seconds", icon: "⚡" },
  { num: "03", title: "Sell & Ship", desc: "Accept offers, print a label, and get paid", icon: "💰" },
];

const TESTIMONIALS = [
  { name: "Margaret T.", location: "Waterville, ME", text: "I had no idea Grandma's tea set was worth $340. LegacyLoop's AI nailed it, and it sold in 3 days.", rating: 5 },
  { name: "Jason K.", location: "Portland, ME", text: "The MegaBot pricing gave us confidence to price Dad's workshop tools. Made over $2,000 in a week.", rating: 5 },
  { name: "Robert D.", location: "Augusta, ME", text: "As a veteran, the 25% discount meant a lot. The team handled everything with respect.", rating: 5 },
];

const TIERS_PREVIEW = [
  { name: "Free", price: 0, label: "Try it out", commission: "12%", color: "#22c55e" },
  { name: "Starter", price: 10, regularPrice: 20, label: "Most Popular", commission: "8%", color: "var(--accent)", popular: true },
  { name: "Plus", price: 25, regularPrice: 49, label: "Power seller", commission: "5%", color: "#a855f7" },
  { name: "Pro", price: 75, regularPrice: 99, label: "Full suite", commission: "4%", color: "#f59e0b" },
];

export default async function HomePage() {
  const user = await authAdapter.getSession();
  if (user) redirect("/dashboard");

  const founderStats = await getFoundingMemberStats();

  return (
    <div style={{ marginTop: "-2.5rem" }}>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{
        textAlign: "center",
        padding: "clamp(2rem, 8vw, 5rem) 1.5rem clamp(2rem, 6vw, 4rem)",
        background: "radial-gradient(ellipse at 50% 0%, rgba(0,188,212,0.08) 0%, transparent 60%)",
        position: "relative",
      }}>
        {/* Subtle glow */}
        <div style={{
          position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "300px",
          background: "radial-gradient(ellipse, rgba(0,188,212,0.12) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "750px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.3rem 0.9rem", borderRadius: "9999px",
            background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.2)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--accent)",
            marginBottom: "1.5rem",
          }}>
            ✨ Pre-Launch — 50% Off All Plans
          </div>

          <h1 style={{
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: "1.25rem",
          }}>
            Turn Your Belongings Into Cash —{" "}
            <span style={{ color: "var(--accent)" }}>AI Does the Hard Part</span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "600px",
            margin: "0 auto 2rem",
          }}>
            Upload a photo. Get an instant price. Sell to real buyers.
            Estate sales to garage sales.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/signup" className="btn-primary" style={{
              padding: "0.9rem 2.5rem", fontSize: "1.05rem", fontWeight: 800,
              borderRadius: "0.75rem",
            }}>
              Start Selling Free
            </Link>
            <Link href="/quote" className="btn-ghost" style={{
              padding: "0.9rem 2.5rem", fontSize: "1.05rem", fontWeight: 700,
              borderRadius: "0.75rem",
            }}>
              Get an Estate Quote
            </Link>
          </div>
        </div>
      </section>

      {/* ── Value Proposition ─────────────────────────────────── */}
      <section style={{ padding: "3rem 1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              padding: "1.75rem 1.5rem",
              borderRadius: "1.25rem",
              background: f.gradient,
              border: "1px solid var(--border-default)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.4rem" }}>{f.title}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section style={{
        padding: "4rem 1.5rem",
        background: "rgba(0,188,212,0.03)",
        borderTop: "1px solid var(--border-default)",
        borderBottom: "1px solid var(--border-default)",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.5rem" }}>
            How It Works
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "3rem" }}>
            Three steps. That&apos;s it.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2rem" }}>
            {STEPS.map((s) => (
              <div key={s.num} style={{ textAlign: "center" }}>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "rgba(0,188,212,0.1)", border: "2px solid rgba(0,188,212,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1rem", fontSize: "1.5rem",
                }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                  STEP {s.num}
                </div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.4rem" }}>{s.title}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.5rem" }}>
            Beta Feedback
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)" }}>
            What Early Users Say
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{
              padding: "1.5rem",
              borderRadius: "1.25rem",
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-default)",
            }}>
              <div style={{ color: "#fbbf24", fontSize: "0.9rem", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
                {"★".repeat(t.rating)}
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic", marginBottom: "1rem" }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{t.name} <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "var(--text-muted)" }}>(Beta)</span></div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{t.location}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pre-Launch Banner ─────────────────────────────────── */}
      <section style={{
        padding: "3rem 1.5rem",
        background: "linear-gradient(135deg, rgba(0,188,212,0.12), rgba(0,188,212,0.04))",
        borderTop: "1px solid rgba(0,188,212,0.15)",
        borderBottom: "1px solid rgba(0,188,212,0.15)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", padding: "0.25rem 0.8rem", borderRadius: "9999px",
            background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)",
            fontSize: "0.72rem", fontWeight: 700, color: "#fbbf24", marginBottom: "1rem",
          }}>
            FOUNDING MEMBER OFFER — {founderStats.remaining} OF {founderStats.totalSpots} SPOTS LEFT AT 50% OFF
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Pre-Launch Special: 50% Off All Plans
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Lock in founding member pricing forever. No price increases, ever.
          </p>
          <Link href="/auth/signup" className="btn-primary" style={{
            padding: "0.85rem 2.5rem", fontSize: "1rem", fontWeight: 800, borderRadius: "0.75rem",
          }}>
            Claim Your Spot
          </Link>
        </div>
      </section>

      {/* ── Pricing Preview ──────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.5rem" }}>
            Pricing
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)" }}>
            Simple, transparent pricing
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: "0.4rem" }}>Pre-launch prices locked in forever</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {TIERS_PREVIEW.map((t) => (
            <div key={t.name} style={{
              padding: "1.5rem",
              borderRadius: "1.25rem",
              background: "var(--bg-card-solid)",
              border: t.popular ? "2px solid var(--accent)" : "1px solid var(--border-default)",
              position: "relative",
              textAlign: "center",
            }}>
              {t.popular && (
                <div style={{
                  position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                  background: "var(--accent)", color: "#fff", padding: "0.15rem 0.8rem",
                  borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.05em",
                }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: t.color, marginBottom: "0.25rem" }}>{t.label}</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>{t.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.3rem" }}>
                <span style={{ fontSize: "2.25rem", fontWeight: 900, color: t.color }}>${t.price}</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>/mo</span>
              </div>
              {t.regularPrice && (
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textDecoration: "line-through", marginTop: "0.1rem" }}>
                  ${t.regularPrice}/mo at launch
                </div>
              )}
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                {t.commission} commission
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/pricing" style={{ color: "var(--accent)", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}>
            See All Plans Including Estate Services →
          </Link>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section style={{
        padding: "4rem 1.5rem",
        textAlign: "center",
        background: "radial-gradient(ellipse at 50% 100%, rgba(0,188,212,0.06) 0%, transparent 60%)",
      }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
          Ready to sell smarter?
        </h2>
        <p style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
          Join the LegacyLoop community and sell your belongings with care and confidence.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth/signup" className="btn-primary" style={{
            padding: "0.9rem 2.5rem", fontSize: "1.05rem", fontWeight: 800, borderRadius: "0.75rem",
          }}>
            Get Started Free
          </Link>
          <Link href="/heroes" className="btn-ghost" style={{
            padding: "0.9rem 2.5rem", fontSize: "1.05rem", fontWeight: 700, borderRadius: "0.75rem",
          }}>
            Heroes Program
          </Link>
        </div>
      </section>

      {/* ── Landing Footer ───────────────────────────────────── */}
      <section style={{
        padding: "3rem 1.5rem 2rem",
        borderTop: "1px solid var(--border-default)",
        maxWidth: "1000px",
        margin: "0 auto",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "2rem",
          marginBottom: "2rem",
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--accent)", marginBottom: "0.75rem" }}>LegacyLoop</div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              AI-powered estate and garage sale platform. Honoring memories while creating value.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Platform</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Link href="/pricing" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textDecoration: "none" }}>Pricing</Link>
              <Link href="/help" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textDecoration: "none" }}>Help Center</Link>
              <Link href="/heroes" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textDecoration: "none" }}>Heroes Program</Link>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Legal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <Link href="/privacy" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textDecoration: "none" }}>Privacy Policy</Link>
              <Link href="/terms" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textDecoration: "none" }}>Terms of Service</Link>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <a href="tel:2075550127" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textDecoration: "none" }}>(207) 555-0127</a>
              <a href="mailto:support@legacy-loop.com" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textDecoration: "none" }}>support@legacy-loop.com</a>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
              <span style={{ fontSize: "1.1rem", opacity: 0.5, cursor: "pointer" }} title="Facebook">f</span>
              <span style={{ fontSize: "1.1rem", opacity: 0.5, cursor: "pointer" }} title="Instagram">ig</span>
              <span style={{ fontSize: "1.1rem", opacity: 0.5, cursor: "pointer" }} title="X">𝕏</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", paddingTop: "1.5rem", borderTop: "1px solid var(--border-default)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
          © 2026 LegacyLoop Tech LLC. All rights reserved. · v0.1.0-beta
        </div>
      </section>
    </div>
  );
}
