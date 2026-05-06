"use client";
import { useState, useEffect, useRef } from "react";

interface BotLead {
  id: string;
  platform: string;
  sourceType: string;
  buyerName: string;
  buyerHandle: string | null;
  location: string | null;
  searchingFor: string | null;
  maxBudget: number | null;
  urgency: string;
  matchScore: number;
  matchReason: string | null;
  aiConfidence: number;
  botScore: number;
  outreachStatus: string;
  contactedAt: string | null;
  sourceUrl?: string | null;
}

interface BotData {
  id: string;
  isActive: boolean;
  isMegaBot: boolean;
  scansCompleted: number;
  buyersFound: number;
  outreachSent: number;
  responsesReceived: number;
  conversionsToSale: number;
  lastScanAt: string | null;
  nextScanAt: string | null;
}

interface Props {
  itemId: string;
  itemTitle: string;
  initialBot: BotData | null;
  initialLeads: BotLead[];
}

const PURPLE_GRADIENT = "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)";
const PURPLE_GRADIENT_SM = "linear-gradient(135deg, #1e1b4b, #312e81)";

const ACTIVATION_STEPS = [
  "Analyzing with OpenAI GPT-4o...",
  "Analyzing with Claude Opus 4...",
  "Analyzing with Gemini 1.5 Pro...",
  "Creating consensus buyer profile...",
  "Scanning Facebook (500+ groups)...",
  "Scanning eBay, Craigslist, Reddit...",
  "Scanning antique forums, collector sites...",
  "Filtering with 4 AI consensus (95%+ accuracy)...",
  "8 qualified buyers found!",
];

const COMPARISON_ROWS = [
  { feature: "AI Models Used",      standard: "1",            mega: "5 (GPT-4o + Claude + Gemini + Grok + Consensus)" },
  { feature: "Platforms Scanned",   standard: "10-15",        mega: "50+" },
  { feature: "Scan Frequency",      standard: "Every 24h",    mega: "Every 2h" },
  { feature: "Buyer Verification",  standard: "Basic",        mega: "Advanced 95%+" },
  { feature: "Outreach Messages",   standard: "Templates",    mega: "AI-personalized per buyer" },
  { feature: "Avg Sale Success",    standard: "20-30%",       mega: "60-80%" },
  { feature: "Avg Time to Sale",    standard: "7-14 days",    mega: "2-5 days" },
];

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    "Facebook Groups": "#1877f2",
    "Facebook Marketplace": "#1877f2",
    "eBay Saved Searches": "#e53238",
    "Reddit r/Antiques": "#ff4500",
    "Craigslist": "#800000",
    "Etsy Favorites": "#f16521",
    "Nextdoor": "#8db600",
    "Antique Forum": "#6b21a8",
  };
  const bg = colors[platform] ?? "#374151";
  return (
    <span style={{ display: "inline-block", background: bg, color: "#fff", borderRadius: 9999, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>
      {platform}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, { label: string; color: string }> = {
    high: { label: "High urgency", color: "#ef4444" },
    medium: { label: "Medium urgency", color: "#f59e0b" },
    low: { label: "Low urgency", color: "var(--text-muted)" },
  };
  const { label, color } = map[urgency] ?? { label: urgency, color: "var(--text-muted)" };
  return <span style={{ color, fontSize: "0.78rem", fontWeight: 600 }}>{label}</span>;
}

function useCountdown(nextScanAt: string | null) {
  const [text, setText] = useState("—");
  useEffect(() => {
    if (!nextScanAt) return;
    const update = () => {
      const diff = new Date(nextScanAt).getTime() - Date.now();
      if (diff <= 0) { setText("Scanning now..."); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextScanAt]);
  return text;
}

export default function MegaBuyingBotPanel({ itemId, itemTitle, initialBot, initialLeads }: Props) {
  const [bot, setBot] = useState<BotData | null>(initialBot);
  const [leads, setLeads] = useState<BotLead[]>(initialLeads);
  const [activating, setActivating] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdown = useCountdown(bot?.nextScanAt ?? null);

  function clearIntervalRef() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  async function handleActivate() {
    setActivating(true);
    setStepIdx(0);
    setProgress(0);

    const totalDuration = 4000;
    const stepDuration = totalDuration / ACTIVATION_STEPS.length;
    let idx = 0;

    intervalRef.current = setInterval(() => {
      idx++;
      setStepIdx(idx);
      setProgress(Math.round((idx / ACTIVATION_STEPS.length) * 100));
      if (idx >= ACTIVATION_STEPS.length) {
        clearIntervalRef();
      }
    }, stepDuration);

    try {
      const res = await fetch(`/api/bots/activate/${itemId}`, { method: "POST" });
      const data = await res.json();
      await new Promise((r) => setTimeout(r, totalDuration + 300));
      clearIntervalRef();
      setActivating(false);
      if (data.ok) {
        setBot(data.bot);
        setLeads(data.leads);
      }
    } catch {
      clearIntervalRef();
      setActivating(false);
    }
  }

  async function handleReach(lead: BotLead) {
    try {
      await fetch(`/api/bots/lead/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreachStatus: "CONTACTED" }),
      });
      setContactedIds((prev) => new Set(prev).add(lead.id));
    } catch {
      // ignore
    }
  }

  const isContacted = (id: string) => contactedIds.has(id) || leads.find((l) => l.id === id)?.outreachStatus === "CONTACTED";

  // ── State 1: No bot ───────────────────────────────────────────────────────
  if (!bot && !activating) {
    return (
      <div className="card overflow-hidden">
        {/* Header */}
        <div style={{ background: PURPLE_GRADIENT, padding: "1.5rem 2rem" }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🚀</span>
                <span style={{ color: "#fff", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Smart Outreach Agent</span>
                <span style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)", color: "#1c1917", fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 9999, letterSpacing: "0.1em" }}>PREMIUM</span>
              </div>
              <p style={{ color: "#c4b5fd", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                4 AI models · 50+ platforms · personalized outreach · 60-80% success rate
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Comparison Table */}
          <div>
            <div className="section-title mb-3">Standard Bot vs Smart Outreach Agent</div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: "0.75rem", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "var(--stripe-bg)" }}>
                    <th style={{ padding: "0.6rem 1rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 600 }}>Feature</th>
                    <th style={{ padding: "0.6rem 1rem", textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>Standard</th>
                    <th style={{ padding: "0.6rem 1rem", textAlign: "center", background: "var(--purple-bg)", color: "var(--purple-text)", fontWeight: 700 }}>🚀 MegaBot</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.feature} style={{ borderTop: "1px solid var(--border-default)", background: i % 2 === 0 ? "transparent" : "var(--stripe-bg)" }}>
                      <td style={{ padding: "0.55rem 1rem", fontWeight: 500, color: "var(--text-primary)" }}>{row.feature}</td>
                      <td style={{ padding: "0.55rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>{row.standard}</td>
                      <td style={{ padding: "0.55rem 1rem", textAlign: "center", color: "var(--purple-text)", fontWeight: 600 }}>{row.mega}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* How It Works */}
          <div>
            <div className="section-title mb-3">How It Works</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { step: "1", icon: "🧠", title: "5 AI Analysis", desc: "GPT-4o, Claude, Gemini, Grok + consensus layer create ideal buyer profile" },
                { step: "2", icon: "🌐", title: "Massive Scan", desc: "50+ platforms scanned every 2 hours for active buyers" },
                { step: "3", icon: "🔍", title: "Smart Filtering", desc: "95%+ accuracy removes bots and low-intent buyers" },
                { step: "4", icon: "✉️", title: "AI Outreach", desc: "Personalized messages crafted per buyer's interests" },
                { step: "5", icon: "🤝", title: "Connection", desc: "Real-time alerts when buyers respond" },
              ].map((s) => (
                <div key={s.step} style={{ background: "var(--purple-bg)", borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem" }}>{s.icon}</div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--purple-text)", marginTop: "0.25rem" }}>{s.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "24", label: "Avg buyers found" },
              { value: "4hr", label: "Avg first response" },
              { value: "108%", label: "Avg sale price achieved" },
              { value: "67%", label: "Conversion rate" },
            ].map((m) => (
              <div key={m.label} style={{ background: PURPLE_GRADIENT_SM, borderRadius: "0.75rem", padding: "1rem", textAlign: "center" }}>
                <div style={{ color: "#fbbf24", fontSize: "1.6rem", fontWeight: 800 }}>{m.value}</div>
                <div style={{ color: "#c4b5fd", fontSize: "0.78rem", marginTop: "0.15rem" }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Pricing + CTA */}
          <div style={{ background: "var(--purple-bg)", border: "1px solid var(--purple-border)", borderRadius: "1rem", padding: "1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              One-time activation · Money-back if &lt;5 buyers found in 48 hours
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
              $25 <span style={{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: 400 }}>or</span> 25 credits
            </div>
            <button
              onClick={handleActivate}
              style={{
                marginTop: "1rem",
                background: "linear-gradient(135deg,#312e81,#4c1d95)",
                color: "#fff",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.85rem 2.5rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(79,70,229,0.4)",
                minHeight: "48px",
              }}
            >
              🚀 Activate Smart Outreach Agent
            </button>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Scanning begins immediately · Results in ~60 seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── State 2: Activating ───────────────────────────────────────────────────
  if (activating) {
    const currentStep = ACTIVATION_STEPS[Math.min(stepIdx, ACTIVATION_STEPS.length - 1)];
    return (
      <div className="card overflow-hidden">
        <div style={{ background: PURPLE_GRADIENT, padding: "1.5rem 2rem" }}>
          <div style={{ color: "#fff", fontSize: "1.2rem", fontWeight: 800 }}>🚀 Smart Outreach Agent — Activating</div>
          <p style={{ color: "#c4b5fd", fontSize: "0.85rem", marginTop: "0.25rem" }}>Scanning 50+ platforms for {itemTitle}...</p>
        </div>
        <div className="p-8 space-y-6" style={{ textAlign: "center" }}>
          {/* Spinner */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              border: "4px solid var(--purple-border)",
              borderTopColor: "var(--purple-text)",
              animation: "spin 0.7s linear infinite",
            }} />
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ background: "var(--stripe-bg)", borderRadius: 9999, height: 12, overflow: "hidden", border: "1px solid var(--border-default)" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg,#6d28d9,#a855f7)", borderRadius: 9999, width: `${progress}%`, transition: "width 0.2s ease" }} />
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>{progress}% complete</div>
          </div>

          {/* Current step */}
          <div style={{ background: "var(--purple-bg)", border: "1px solid var(--purple-border)", borderRadius: "0.75rem", padding: "1rem 1.5rem", fontSize: "0.95rem", color: "var(--purple-text)", fontWeight: 600, minHeight: 52 }}>
            {currentStep}
          </div>

          {/* Steps list */}
          <div style={{ textAlign: "left", display: "inline-block" }}>
            {ACTIVATION_STEPS.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem", fontSize: "0.85rem", color: i < stepIdx ? "var(--purple-text)" : i === stepIdx ? "var(--text-primary)" : "var(--text-muted)" }}>
                <span>{i < stepIdx ? "✓" : i === stepIdx ? "▶" : "○"}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── State 3: Active (results) ─────────────────────────────────────────────
  const repliedCount = leads.filter((l) => l.outreachStatus === "REPLIED" || l.outreachStatus === "CONVERTED").length;
  const convertedCount = leads.filter((l) => l.outreachStatus === "CONVERTED").length;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div style={{ background: PURPLE_GRADIENT, padding: "1.25rem 2rem" }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.3rem" }}>🚀</span>
              <span style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 800 }}>Smart Outreach Agent</span>
              <span style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)", color: "#1c1917", fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 9999 }}>PREMIUM</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-card-hover)", borderRadius: 9999, padding: "4px 12px" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ color: "#fff", fontSize: "0.78rem" }}>Active — scanning every 2h</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: "var(--purple-bg)", padding: "0.85rem 2rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.875rem", borderBottom: "1px solid var(--border-default)" }}>
        {[
          { label: "Buyers found", value: bot!.buyersFound },
          { label: "Outreach sent", value: bot!.outreachSent },
          { label: "Responses", value: bot!.responsesReceived + repliedCount },
          { label: "Conversions", value: bot!.conversionsToSale + convertedCount },
          { label: "Next scan", value: countdown },
        ].map((s) => (
          <div key={s.label}>
            <span style={{ color: "var(--text-muted)" }}>{s.label}: </span>
            <span style={{ color: "var(--purple-text)", fontWeight: 700 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Leads */}
      <div className="p-6 space-y-3">
        <div className="section-title">Qualified Buyers ({leads.length})</div>
        {leads.map((lead) => {
          const expanded = expandedLeadId === lead.id;
          const contacted = isContacted(lead.id);
          return (
            <div key={lead.id} style={{ border: `1.5px solid ${lead.matchScore >= 90 ? "var(--purple-border)" : "var(--border-default)"}`, borderRadius: "0.85rem", overflow: "hidden" }}>
              <button
                onClick={() => setExpandedLeadId(expanded ? null : lead.id)}
                style={{ width: "100%", textAlign: "left", padding: "0.85rem 1rem", background: lead.matchScore >= 90 ? "var(--purple-bg)" : "transparent", border: "none", cursor: "pointer", color: "var(--text-primary)" }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlatformBadge platform={lead.platform} />
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{lead.buyerName}</span>
                    {lead.location && <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>📍 {lead.location}</span>}
                    <UrgencyBadge urgency={lead.urgency} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{
                      padding: "2px 10px", borderRadius: 9999, fontSize: "0.78rem", fontWeight: 700,
                      background: lead.matchScore >= 90 ? "var(--success-bg)" : lead.matchScore >= 80 ? "var(--warning-bg)" : "var(--stripe-bg)",
                      color: lead.matchScore >= 90 ? "var(--success-text)" : lead.matchScore >= 80 ? "var(--warning-text)" : "var(--text-secondary)",
                    }}>
                      {lead.matchScore}% match
                    </span>
                    <span style={{ padding: "2px 8px", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 600, background: "var(--purple-bg)", color: "var(--purple-text)" }}>
                      🤖 {lead.botScore}
                    </span>
                    {lead.maxBudget && (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>${lead.maxBudget.toLocaleString()} budget</span>
                    )}
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{expanded ? "▲" : "▼"}</span>
                  </div>
                </div>
              </button>

              {expanded && (
                <div style={{ padding: "0.85rem 1rem 1rem", background: "var(--stripe-bg)", borderTop: "1px solid var(--border-default)" }}>
                  {lead.searchingFor && (
                    <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.6rem 0.85rem", fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "0.75rem", fontStyle: "italic" }}>
                      "{lead.searchingFor}"
                    </div>
                  )}
                  {lead.matchReason && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                      <strong>Why matched:</strong> {lead.matchReason}
                    </div>
                  )}
                  {lead.sourceUrl && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <a
                        href={lead.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "var(--accent)",
                          textDecoration: "none",
                          background: "var(--accent-dim)",
                          border: "1px solid var(--accent-border)",
                          borderRadius: "0.5rem",
                          padding: "0.45rem 0.75rem",
                          minHeight: "44px",
                        }}
                        aria-label="Open buyer source link in new tab"
                      >
                        🔗 Reach this buyer →
                      </a>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      AI Confidence: <strong>{Math.round(lead.aiConfidence * 100)}%</strong>
                    </div>
                    {contacted ? (
                      <span style={{ color: "var(--success-text)", background: "var(--success-bg)", borderRadius: 9999, padding: "4px 14px", fontSize: "0.8rem", fontWeight: 600 }}>
                        ✓ Contacted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleReach(lead)}
                        style={{ background: "linear-gradient(135deg,#312e81,#4c1d95)", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.1rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", minHeight: "40px" }}
                      >
                        📤 Reach Out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
