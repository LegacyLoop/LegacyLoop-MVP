import type { Metadata } from "next";

export const metadata: Metadata = { title: "What's New · LegacyLoop", description: "Latest features and improvements" };

export default function WhatsNewPage() {
  const updates = [
    { date: "Mar 31, 2026", badge: "NEW", title: "🎬 VideoBot ElevenLabs Integration", desc: "5 professional voices with auto-selection by category. Photo-synced narration with sentence-level timecodes. Caching, quota checking, and OpenAI fallback." },
    { date: "Mar 31, 2026", badge: null, title: "⚖️ Meta API Compliance", desc: "Data deletion page, updated privacy policy with Square/Meta/cookies, About page with full mission and values." },
    { date: "Mar 31, 2026", badge: null, title: "🙏 Mission & Giving", desc: "Full mission and vision from official doc. Support Our Mission giving section. Built with purpose in Maine." },
    { date: "Mar 31, 2026", badge: null, title: "🔍 Full Page Audit", desc: "119 hardcoded colors fixed for light mode. 13 pages got SEO metadata. 2 dead links repaired. Every page verified." },
    { date: "Mar 31, 2026", badge: null, title: "🌙 Theme 3-Mode", desc: "Light, Dark, and Auto theme toggle in the settings menu. Auto mode follows your system preference." },
    { date: "Mar 30, 2026", badge: null, title: "🤖 AI Help Center", desc: "AI chatbot answers questions instantly. 50 help articles covering every feature. Support ticket system with email confirmations." },
    { date: "Mar 30, 2026", badge: null, title: "📧 Business Email Unification", desc: "7 professional @legacy-loop.com emails placed across all pages. Unified business phone number." },
    { date: "Mar 30, 2026", badge: null, title: "📊 Subscription & Credits Upgrade", desc: "Usage meters, annual billing toggle, credit spend analytics, downgrade confirmation flow, and cancel route." },
    { date: "Mar 29, 2026", badge: null, title: "🧠 Bot Intelligence Engine", desc: "Auto-sequencer cascades bots automatically. Disagreement detection flags pricing conflicts. Unified demand scoring. Bot accuracy tracking." },
    { date: "Mar 29, 2026", badge: null, title: "🦇 Batman & Robin Synergy", desc: "ListBot reads BuyerBot profiles to tailor listings. BuyerBot reads ListBot SEO keywords to find matching buyers." },
    { date: "Mar 29, 2026", badge: null, title: "📧 Outreach System", desc: "One-click buyer outreach with SendGrid email integration. Coming Soon badges for auto-post platforms." },
    { date: "Mar 29, 2026", badge: null, title: "🃏 Beckett-Equivalent Scrapers", desc: "PriceCharting.com for cards, games, comics, coins, Funko, LEGO. PSAcard.com for graded card auction history." },
    { date: "Mar 29, 2026", badge: null, title: "✍️ Bot Prompt Polish", desc: "ListBot: urgency language, defect framing, 16K tokens. BuyerBot: location preference, outreach specificity." },
    { date: "Mar 28, 2026", badge: null, title: "👁️ Bot Vision Upgrade", desc: "AntiqueBot and CarBot now use real photo vision. AntiqueBot upgraded to GPT-4o for detailed antique inspection." },
    { date: "Mar 28, 2026", badge: null, title: "🔧 Critical Bug Fixes", desc: "PriceSnapshot pricing consistency. ReconBot live mode fix. Cancel flow and downgrade bugs fixed." },
    { date: "Mar 28, 2026", badge: null, title: "📡 42-Platform Scraper System", desc: "14 built-in scrapers + 28 Apify adapters covering eBay, Craigslist, Facebook, Amazon, StockX, Chrono24, and more." },
    { date: "Mar 27, 2026", badge: null, title: "📦 Pricing Pipeline Overhaul", desc: "Anti-hallucination rules. Location-sensitive pricing. Weighted median consensus. Amazon hard ceiling enforcement." },
    { date: "Mar 3, 2026", badge: null, title: "💳 Square Payment Integration", desc: "Square sandbox for subscriptions, credits, and purchases. PaymentLedger and SellerEarnings models." },
    { date: "Mar 2, 2026", badge: null, title: "📦 Shipping System Overhaul", desc: "AI-suggested packaging, carrier comparison, label creation, 5-step tracking timeline, delivery notifications." },
    { date: "Mar 2, 2026", badge: null, title: "🔗 Connected Accounts Hub", desc: "Link social media, marketplaces, payment processors, and cloud storage in one place." },
    { date: "Mar 2, 2026", badge: null, title: "🔍 ReconBot Intelligence", desc: "Real-time competitor price monitoring across platforms with smart alerts." },
    { date: "Mar 2, 2026", badge: null, title: "🌙 Theme System", desc: "Light, dark, and auto theme with zero flash. Tesla-inspired design system." },
    { date: "Mar 2, 2026", badge: null, title: "📸 Enhanced Photo Upload", desc: "Camera capture, drag-to-reorder, rotate, client-side compression, and multi-source upload." },
    { date: "Mar 1, 2026", badge: null, title: "🤖 MegaBot Multi-AI", desc: "Four AI models analyze items simultaneously for consensus pricing with higher confidence." },
    { date: "Mar 1, 2026", badge: null, title: "🚀 Platform Launch", desc: "LegacyLoop MVP goes live with 11 AI bots, messaging, shipping, credits, subscriptions, and storefront." },
  ];

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent, #00bcd4)", marginBottom: "0.5rem" }}>Updates</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>What&apos;s New</h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>Recent features and improvements to LegacyLoop.</p>
      </div>

      <div>
        {updates.map((u, i) => (
          <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "12px", padding: "1.25rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>{u.date}</span>
              {u.badge && (
                <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "var(--accent, #00bcd4)", border: "1px solid rgba(0,188,212,0.2)" }}>
                  {u.badge}
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>{u.title}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.35rem", lineHeight: 1.55 }}>{u.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
        LegacyLoop is updated daily. Follow us for the latest.
      </div>
    </div>
  );
}
