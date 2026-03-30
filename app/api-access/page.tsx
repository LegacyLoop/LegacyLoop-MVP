import Link from "next/link";
import type { Metadata } from "next";
import { API_TIERS } from "@/lib/constants/pricing";

export const metadata: Metadata = {
  title: "API Access & Licensing · LegacyLoop",
  description: "Integrate LegacyLoop's AI estate analysis, antique detection, and pricing intelligence into your own platform.",
};

const PLANS = [
  {
    id: "starter",
    name: API_TIERS.developer.name,
    price: API_TIERS.developer.price,
    color: "#0f766e",
    border: "#99f6e4",
    bg: "#f0fdfa",
    badge: null,
    calls: "10,000",
    features: [
      "10,000 API calls/month",
      "Item analysis endpoint",
      "Pricing intelligence endpoint",
      "Antique detection endpoint",
      "JSON + webhook responses",
      "REST API",
      "Standard rate limits",
      "Email support",
      "API docs access",
      "Sandbox environment",
    ],
  },
  {
    id: "business",
    name: API_TIERS.business.name,
    price: API_TIERS.business.price,
    color: "#7c3aed",
    border: "#c4b5fd",
    bg: "#faf5ff",
    badge: "Most Popular",
    calls: "100,000",
    features: [
      "100,000 API calls/month",
      "All Developer endpoints",
      "MegaBot consensus endpoint",
      "Batch processing (up to 50 items)",
      "Buyer matching API",
      "Webhook + streaming support",
      "Priority rate limits",
      "Priority email + Slack support",
      "White-label response option",
      "SLA: 99.5% uptime",
    ],
  },
  {
    id: "enterprise",
    name: API_TIERS.enterprise.name,
    price: API_TIERS.enterprise.price,
    color: "#1c1917",
    border: "#44403c",
    bg: "#1c1917",
    dark: true,
    badge: "White-Label Ready",
    calls: "Unlimited",
    features: [
      "Unlimited API calls",
      "All Business endpoints",
      "Custom model fine-tuning",
      "Dedicated infrastructure",
      "White-label full stack",
      "Custom domain + branding",
      "Dedicated account manager",
      "24/7 phone support",
      "SLA: 99.9% uptime",
      "Custom contract + NDA",
    ],
  },
];

const ENDPOINTS = [
  {
    method: "POST",
    path: "/v1/analyze",
    desc: "Analyze an item from photos + description. Returns category, condition, AI description, and antique score.",
    example: `{
  "photos": ["https://...jpg"],
  "description": "Victorian mahogany writing desk",
  "condition": "good"
}`,
    response: `{
  "category": "Furniture",
  "condition": "Good",
  "antique_score": 8.2,
  "is_antique": true,
  "description": "...",
  "tags": ["victorian", "mahogany", "antique"]
}`,
  },
  {
    method: "POST",
    path: "/v1/price",
    desc: "Get AI-powered price estimate with market comps. Returns suggested price range and confidence.",
    example: `{
  "item_id": "item_abc123",
  "market": "US",
  "condition": "good"
}`,
    response: `{
  "low": 450,
  "mid": 680,
  "high": 900,
  "confidence": 0.87,
  "comps": [...],
  "rationale": "..."
}`,
  },
  {
    method: "POST",
    path: "/v1/megabot",
    desc: "Run 4-AI consensus analysis (OpenAI + Claude + Gemini + Grok). Returns consensus result + individual breakdowns.",
    example: `{
  "item_id": "item_abc123",
  "task": "price"
}`,
    response: `{
  "consensus": { "low": 450, "mid": 680 },
  "models": {
    "claude": {...},
    "openai": {...},
    "gemini": {...}
  }
}`,
  },
  {
    method: "GET",
    path: "/v1/buyers/match",
    desc: "Find buyer matches for an item based on category, location, and price range.",
    example: `?item_id=item_abc123&radius_miles=100`,
    response: `{
  "matches": [
    { "score": 94, "platform": "facebook", ... },
    { "score": 87, "platform": "ebay", ... }
  ]
}`,
  },
];

const USE_CASES = [
  {
    icon: "🏚️",
    title: "Real Estate Platforms",
    description: "Embed estate sale valuation into your property listing or closing workflow. Help sellers understand the value of contents before listing.",
  },
  {
    icon: "🛒",
    title: "Resale Marketplaces",
    description: "Add AI pricing intelligence to your existing resale platform. Auto-suggest prices and detect high-value antiques before listing.",
  },
  {
    icon: "🏛️",
    title: "Auction Houses",
    description: "Pre-screen incoming lots with AI antique detection and pricing. Save appraiser time on low-value items.",
  },
  {
    icon: "📦",
    title: "Moving Companies",
    description: "Offer estate sale services as part of your moving package. Integrate LegacyLoop valuation into your customer app.",
  },
  {
    icon: "🏥",
    title: "Senior Care Providers",
    description: "Help families during transitions. Integrate estate analysis into discharge planning or move-in coordination tools.",
  },
  {
    icon: "🔧",
    title: "Home Services Apps",
    description: "Add item valuation to your junk removal, cleanout, or staging app. Buyers will pay more when items are priced correctly.",
  },
];

export default function ApiAccessPage() {
  return (
    <div className="mx-auto max-w-5xl">
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
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "300px", background: "radial-gradient(ellipse at right, rgba(15,118,110,0.2), transparent 70%)" }} />

        <div style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5eead4", fontWeight: 700, marginBottom: "0.75rem" }}>
          🔌 API Access & Licensing
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem" }}>
          LegacyLoop Intelligence<br />in Your Platform
        </h1>
        <p style={{ color: "var(--text-primary)", maxWidth: "600px", lineHeight: 1.7, marginBottom: "1.75rem", fontSize: "1.05rem" }}>
          Integrate our AI estate analysis, antique detection, MegaBot pricing, and buyer matching
          directly into your application via REST API. Built for resale platforms, real estate software,
          auction houses, and senior service apps.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href="#plans"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#0f766e",
              color: "#fff",
              padding: "0.85rem 2rem",
              borderRadius: "9999px",
              fontWeight: 800,
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            View API Plans →
          </a>
          <a
            href="mailto:support@legacy-loop.com"
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
            Talk to Sales
          </a>
        </div>

        <div style={{ display: "flex", gap: "2.5rem", marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" }}>
          {[
            { value: "REST", label: "API standard" },
            { value: "<800ms", label: "Avg response time" },
            { value: "99.5%", label: "Uptime SLA" },
            { value: "3-AI", label: "MegaBot consensus" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#5eead4" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Use Cases</div>
        <h2 className="h2 mb-6">Who Uses the API</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map((u) => (
            <div key={u.title} className="card p-5">
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{u.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.3rem" }}>{u.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{u.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Endpoints */}
      <div style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Endpoints</div>
        <h2 className="h2 mb-6">Core API Endpoints</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f4", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "0.4rem",
                  background: ep.method === "GET" ? "#dbeafe" : "#d1fae5",
                  color: ep.method === "GET" ? "#1e40af" : "#065f46",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                }}>{ep.method}</span>
                <code style={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 700, color: "#0f766e" }}>{ep.path}</code>
              </div>
              <div style={{ padding: "1rem 1.5rem" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>{ep.desc}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Request</div>
                    <pre style={{ background: "#1c1917", color: "#5eead4", padding: "0.75rem", borderRadius: "0.6rem", fontSize: "0.72rem", overflowX: "auto", margin: 0 }}>{ep.example}</pre>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Response</div>
                    <pre style={{ background: "#1c1917", color: "#86efac", padding: "0.75rem", borderRadius: "0.6rem", fontSize: "0.72rem", overflowX: "auto", margin: 0 }}>{ep.response}</pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div id="plans" style={{ marginBottom: "3rem" }}>
        <div className="section-title mb-2">Pricing</div>
        <h2 className="h2 mb-2">API Plans</h2>
        <p className="muted mb-6">Pay-as-you-go also available at $0.01 per call for casual use. All plans include sandbox access.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isDark = plan.dark;
            return (
              <div key={plan.id} style={{ background: isDark ? "#1c1917" : "var(--bg-card-solid)", border: `2px solid ${plan.border}`, borderRadius: "1.25rem", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: 0, right: 0, background: plan.color, color: "#fff", fontSize: "0.62rem", fontWeight: 800, padding: "0.2rem 0.65rem", borderBottomLeftRadius: "0.65rem", letterSpacing: "0.05em" }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ padding: "1.75rem 1.75rem 1rem", background: isDark ? "#292524" : plan.bg }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "#a8a29e" : plan.color }}>{plan.name}</div>
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                    <span style={{ fontSize: "2.25rem", fontWeight: 900, color: isDark ? "#fff" : "var(--text-primary)" }}>${plan.price}</span>
                    <span style={{ fontSize: "0.82rem", color: isDark ? "#a8a29e" : "var(--text-muted)" }}>/month</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isDark ? "#78716c" : "var(--text-muted)", marginTop: "0.15rem" }}>{plan.calls} API calls/month</div>
                </div>

                <div style={{ padding: "1.25rem 1.75rem", flex: 1, background: isDark ? "#1c1917" : "var(--bg-card-solid)" }}>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem", color: isDark ? "#e7e5e4" : "var(--text-secondary)" }}>
                        <span style={{ color: isDark ? "#5eead4" : plan.color, fontWeight: 700, flexShrink: 0, fontSize: "0.75rem" }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: "1rem 1.75rem 1.75rem", background: isDark ? "#1c1917" : "var(--bg-card-solid)" }}>
                  <a
                    href="mailto:support@legacy-loop.com"
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.75rem",
                      background: isDark ? "var(--bg-card-hover)" : plan.color,
                      color: isDark ? "var(--text-primary)" : "#fff",
                      border: `2px solid ${isDark ? "var(--border-default)" : plan.color}`,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                    }}
                  >
                    {plan.id === "enterprise" ? "Contact Sales →" : "Get API Key →"}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pay-as-you-go */}
      <div className="card p-8 mb-10">
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ fontSize: "2.5rem" }}>⚡</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>Pay-As-You-Go</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
              Not ready for a monthly plan? Pay per call at <strong>$0.01/call</strong> for item analysis and pricing endpoints.
              MegaBot calls are <strong>$0.05/call</strong>. No monthly commitment, no expiring credits.
            </p>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
              <div><span style={{ fontWeight: 700, color: "#0f766e" }}>$0.01</span> <span style={{ color: "var(--text-secondary)" }}>Analyze / Price call</span></div>
              <div><span style={{ fontWeight: 700, color: "#7c3aed" }}>$0.05</span> <span style={{ color: "var(--text-secondary)" }}>MegaBot call</span></div>
              <div><span style={{ fontWeight: 700, color: "#b45309" }}>$0.02</span> <span style={{ color: "var(--text-secondary)" }}>Buyer match call</span></div>
            </div>
          </div>
          <a
            href="mailto:support@legacy-loop.com"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", padding: "0.7rem 1.25rem", borderRadius: "0.75rem", fontWeight: 700, textDecoration: "none", fontSize: "0.88rem", flexShrink: 0 }}
          >
            Request PAYG Key →
          </a>
        </div>
      </div>

      {/* Contact */}
      <div style={{ background: "linear-gradient(135deg, #1c1917, #292524)", borderRadius: "1.5rem", padding: "3rem", textAlign: "center", color: "#fff" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          Ready to integrate?
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
          Contact our API team for sandbox credentials, documentation, and a technical walkthrough.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="mailto:support@legacy-loop.com"
            style={{ background: "#0f766e", color: "#fff", padding: "0.85rem 2rem", borderRadius: "9999px", fontWeight: 800, textDecoration: "none", fontSize: "0.95rem" }}
          >
            Email support@legacy-loop.com
          </a>
          <Link
            href="/pricing"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-primary)", padding: "0.85rem 2rem", borderRadius: "9999px", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem", border: "1px solid var(--border-default)" }}
          >
            View Platform Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
