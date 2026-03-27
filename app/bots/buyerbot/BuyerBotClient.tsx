"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BotItemSelector from "../BotItemSelector";
import BotLoadingState from "@/app/components/BotLoadingState";

type ItemData = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  hasAnalysis: boolean;
  aiResult: string | null;
  category: string;
  valuation: { low: number; mid: number; high: number; confidence: number } | null;
  leadCount: number;
  buyerBotResult: string | null;
  buyerBotRunAt: string | null;
  buyerHistory?: { id: string; type: string; createdAt: string }[];
  lastScannedAt?: string | null;
  activeLeads?: any[];
  botActive?: boolean;
  botBuyersFound?: number;
};

function AccordionHeader({ id, icon, title, subtitle, isOpen, onToggle, accentColor, badge }: {
  id: string; icon: string; title: string; subtitle?: string;
  isOpen: boolean; onToggle: (id: string) => void; accentColor?: string; badge?: string;
}) {
  return (
    <button onClick={() => onToggle(id)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: "100%", background: isOpen ? "rgba(0,188,212,0.02)" : "transparent",
      border: "none", borderBottom: isOpen ? "1px solid var(--border-default)" : "1px solid transparent",
      padding: "0.65rem 0.5rem", cursor: "pointer", transition: "all 0.2s ease",
      borderRadius: isOpen ? "0.4rem 0.4rem 0 0" : "0.4rem", minHeight: "40px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: accentColor || "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{title}</span>
        {badge && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: `${accentColor || "#00bcd4"}18`, color: accentColor || "#00bcd4" }}>{badge}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        {subtitle && !isOpen && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontWeight: 500 }}>{subtitle}</span>}
        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", transition: "transform 0.25s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: isOpen ? "rgba(0,188,212,0.08)" : "transparent" }}>▼</span>
      </div>
    </button>
  );
}

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

// ─── Shared Style Helpers ─────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-card)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(0,188,212,0.15)", borderRadius: 16, padding: "1.25rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
      <span style={{ fontSize: "1rem" }}>{icon}</span>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
    </div>
  );
}

function UrgencyBadge({ level }: { level: string }) {
  const l = (level || "").toLowerCase();
  const color = l.includes("act now") ? "#ef4444" : l.includes("this week") ? "#f59e0b" : l.includes("this month") ? "#00bcd4" : "#64748b";
  const bg = l.includes("act now") ? "rgba(239,68,68,0.12)" : l.includes("this week") ? "rgba(245,158,11,0.12)" : l.includes("this month") ? "rgba(0,188,212,0.1)" : "rgba(100,116,139,0.1)";
  return (
    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 700, background: bg, color, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {level}
    </span>
  );
}

function OpportunityBadge({ level }: { level: string }) {
  const l = (level || "").toLowerCase();
  const color = l === "excellent" ? "#4ade80" : l === "good" ? "#00bcd4" : l === "moderate" ? "#f59e0b" : "#94a3b8";
  return (
    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600, background: `${color}18`, color, textTransform: "capitalize" }}>
      {level}
    </span>
  );
}

function BuyerTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    "Collector": "#a78bfa", "Reseller": "#f59e0b", "Decorator": "#ec4899",
    "Hobbyist": "#00bcd4", "Gift Buyer": "#4ade80", "Dealer": "#fb923c",
    "Museum/Gallery": "#c084fc", "Personal Use": "#94a3b8",
  };
  const c = colorMap[type] || "#94a3b8";
  return <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.58rem", fontWeight: 600, background: `${c}18`, color: c }}>{type}</span>;
}

function PriceSensitivityBadge({ level }: { level: string }) {
  const l = (level || "").toLowerCase();
  const color = l.includes("premium") ? "#4ade80" : l.includes("fair") ? "#00bcd4" : l.includes("bargain") ? "#f59e0b" : "#ef4444";
  return <span style={{ padding: "0.12rem 0.45rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 600, background: `${color}15`, color }}>{level}</span>;
}

// ─── MegaBot helpers ─────────────────────────────────────────────────────────

const MEGA_PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Comprehensive buyer profiling across mainstream platforms" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Niche collectors, specialty dealers, enthusiast communities" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Platform analytics, algorithm-optimized posting strategies" },
  grok: { icon: "🌀", label: "Grok (xAI)", color: "#00DC82", specialty: "Social buyer communities, viral potential, Gen Z patterns" },
};

function _megaNormKeys(o: any): any {
  if (!o || typeof o !== "object" || Array.isArray(o)) return o;
  const out: any = {};
  for (const key of Object.keys(o)) {
    const lk = key.toLowerCase();
    const val = o[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const inner: any = {};
      for (const ik of Object.keys(val)) inner[ik.toLowerCase()] = val[ik];
      out[lk] = inner;
    } else { out[lk] = val; }
  }
  return out;
}
const _megaObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v)) ? v : null;

function _megaArr(d: any, ...keys: string[]): any[] {
  for (const k of keys) { if (Array.isArray(d[k]) && d[k].length > 0) return d[k]; }
  const wrappers = ["buyer_analysis", "market_analysis", "deep_dive", "megabot_enhancement"];
  for (const w of wrappers) { if (d[w] && typeof d[w] === "object") { for (const k of keys) { if (Array.isArray(d[w][k]) && d[w][k].length > 0) return d[w][k]; } } }
  return [];
}
function _megaField(d: any, ...keys: string[]): any {
  for (const k of keys) { if (d[k] != null && d[k] !== "" && d[k] !== "Unknown") return d[k]; }
  return null;
}

function extractMegaBH(p: any) {
  let d = _megaNormKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _megaObj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];

  const profiles = _megaArr(d, "buyer_profiles", "profiles", "buyers", "buyer_types", "target_buyers");
  const platforms = _megaArr(d, "platform_opportunities", "platforms", "platform_analysis", "marketplace_opportunities");
  const hotLeads = _megaArr(d, "hot_leads", "leads", "active_leads", "urgent_leads", "immediate_opportunities");
  const outreach = _megaArr(d, "outreach_strategies", "strategies", "outreach_plans", "approach_strategies");
  const influencers = _megaArr(d, "influencer_targets", "influencers", "tastemakers", "amplifiers");

  return {
    profiles, profileCount: profiles.length,
    platforms, platformCount: platforms.length,
    bestPlatform: _megaField(d, "best_platform", "top_platform", "recommended_platform"),
    hotLeads, hotLeadCount: hotLeads.length,
    outreach, influencers,
    localOpps: _megaObj(d.local_opportunities) || _megaObj(d.local_buyers) || null,
    competitive: _megaObj(d.competitive_landscape) || _megaObj(d.competition) || null,
    timing: _megaObj(d.timing_advice) || _megaObj(d.timing) || null,
    internationalBuyers: _megaObj(d.international_buyers) || _megaObj(d.international_demand) || null,
    corporateBuyers: _megaObj(d.corporate_buyers) || _megaObj(d.business_buyers) || null,
    viralMarketing: _megaObj(d.viral_marketing) || _megaObj(d.viral_potential) || null,
    demandLevel: _megaField(d, "demand_level", "market_demand", "buyer_demand"),
    summary: d.executive_summary || d.summary || null,
  };
}

// ─── Outreach Message Composer ────────────────────────────────────────────────

const TONE_PRESETS: Record<string, { label: string; style: string }> = {
  casual: { label: "Casual & Friendly", style: "Warm, conversational, with emoji" },
  professional: { label: "Professional", style: "Polished, businesslike" },
  collector: { label: "Collector-to-Collector", style: "Enthusiast-to-enthusiast, shared passion" },
};

const CHANNELS = [
  { id: "inapp", name: "In-App Message", icon: "💬", status: "connected" as const },
  { id: "email", name: "Email", icon: "📧", status: "connected" as const },
  { id: "facebook", name: "Facebook", icon: "📘", status: "simulated" as const },
  { id: "instagram", name: "Instagram", icon: "📸", status: "simulated" as const },
  { id: "craigslist", name: "Craigslist", icon: "📋", status: "simulated" as const },
  { id: "ebay", name: "eBay", icon: "🏷️", status: "simulated" as const },
  { id: "etsy", name: "Etsy", icon: "🧶", status: "simulated" as const },
  { id: "mercari", name: "Mercari", icon: "📱", status: "simulated" as const },
  { id: "reddit", name: "Reddit", icon: "🔴", status: "simulated" as const },
];

function OutreachCenter({ item, ai, result }: { item: ItemData; ai: any; result: any }) {
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("casual");
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [outreachLog, setOutreachLog] = useState<Array<{ channel: string; action: string; time: string }>>([]);

  // Build templates from AI result or defaults
  const templates = useMemo(() => {
    const name = ai?.item_name || item.title;
    const cat = ai?.category || item.category;
    const cond = ai?.condition_score >= 8 ? "excellent" : ai?.condition_score >= 5 ? "great" : "good";
    const price = item.valuation?.mid || 0;
    const era = ai?.era || "vintage";
    const material = ai?.material || "";
    const city = "Maine";

    const strategies = result?.outreach_strategies || [];

    return [
      { id: "general", label: "General Inquiry", text: strategies[0]?.message_template || `Hi! I have a ${name} in ${cond} condition that I thought you might be interested in. I'm asking $${price}. Would you like to see more details?` },
      { id: "collector", label: "Collector Pitch", text: strategies[3]?.message_template || `Fellow ${cat.toLowerCase()} enthusiast — I have a ${era} ${name} that's looking for a good home. Beautiful ${material} construction. Asking $${price}, happy to discuss.` },
      { id: "local", label: "Quick Local", text: strategies[2]?.message_template || `Hey neighbor! Selling a ${name} locally in ${city}. ${cond.charAt(0).toUpperCase() + cond.slice(1)} condition, $${price} or best offer. Can meet at a public spot. Interested?` },
      { id: "dealer", label: "Dealer / Shop", text: `Hi, I have a ${name} (${era}, ${cond} condition) that I think would be perfect for your inventory. Estimated value $${item.valuation?.low || 0}-$${item.valuation?.high || 0}. Would you be interested in taking a look?` },
    ];
  }, [item, ai, result]);

  useEffect(() => {
    if (!message && templates.length > 0) setMessage(templates[0].text);
  }, [templates, message]);

  const charLimit = 1000;

  function copyMessage(channelId: string) {
    navigator.clipboard.writeText(message).catch(() => {});
    setCopiedChannel(channelId);
    setTimeout(() => setCopiedChannel(null), 2500);
    setOutreachLog((prev) => [
      { channel: channelId, action: "copied", time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  }

  return (
    <Card>
      <SectionLabel icon="📤" label="Outreach Center" />

      {/* Template Selector */}
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {templates.map((t) => (
          <button key={t.id} onClick={() => setMessage(t.text)} style={{
            padding: "0.25rem 0.6rem", borderRadius: "9999px", fontSize: "0.62rem", fontWeight: 600,
            border: message === t.text ? "1px solid var(--accent)" : "1px solid var(--border-default)",
            background: message === t.text ? "rgba(0,188,212,0.12)" : "transparent",
            color: message === t.text ? "var(--accent)" : "var(--text-muted)", cursor: "pointer",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tone Selector */}
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.6rem" }}>
        {Object.entries(TONE_PRESETS).map(([key, val]) => (
          <button key={key} onClick={() => setTone(key)} style={{
            padding: "0.2rem 0.5rem", borderRadius: "0.35rem", fontSize: "0.58rem",
            border: tone === key ? "1px solid var(--accent)" : "1px solid var(--border-default)",
            background: tone === key ? "rgba(0,188,212,0.08)" : "transparent",
            color: tone === key ? "var(--accent)" : "var(--text-muted)", cursor: "pointer",
          }}>
            {val.label}
          </button>
        ))}
      </div>

      {/* Message Textarea */}
      <div style={{ position: "relative", marginBottom: "0.5rem" }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          style={{
            width: "100%", padding: "0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem",
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            color: "var(--text-primary)", resize: "vertical", lineHeight: 1.5,
            fontFamily: "inherit",
          }}
        />
        <div style={{ position: "absolute", bottom: "0.4rem", right: "0.5rem", fontSize: "0.55rem", color: message.length > charLimit ? "#ef4444" : "var(--text-muted)" }}>
          {message.length}/{charLimit}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", fontSize: "0.65rem", color: "var(--text-secondary)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}>
          <input type="checkbox" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} style={{ accentColor: "#00bcd4" }} />
          Include item photos
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}>
          <input type="checkbox" checked={includePrice} onChange={(e) => setIncludePrice(e.target.checked)} style={{ accentColor: "#00bcd4" }} />
          Include price
        </label>
      </div>

      {/* Outreach Channels */}
      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>Send Via</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
        {CHANNELS.map((ch) => (
          <div key={ch.id} style={{
            display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.6rem",
            borderRadius: "0.45rem", border: "1px solid var(--border-default)", background: "var(--bg-card)",
          }}>
            <span style={{ fontSize: "0.85rem" }}>{ch.icon}</span>
            <span style={{ flex: 1, fontSize: "0.7rem", fontWeight: 600, color: "var(--text-primary)" }}>{ch.name}</span>
            {ch.status === "connected" ? (
              <span style={{ fontSize: "0.55rem", color: "#4ade80" }}>✅ Connected</span>
            ) : (
              <a href="/settings" style={{ fontSize: "0.55rem", color: "var(--accent)", textDecoration: "none" }}>🔗 Connect</a>
            )}
            <button onClick={() => copyMessage(ch.id)} style={{
              padding: "0.2rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.58rem", fontWeight: 600,
              background: copiedChannel === ch.id ? "rgba(74,222,128,0.15)" : "rgba(0,188,212,0.1)",
              border: "1px solid " + (copiedChannel === ch.id ? "rgba(74,222,128,0.3)" : "rgba(0,188,212,0.2)"),
              color: copiedChannel === ch.id ? "#4ade80" : "var(--accent)", cursor: "pointer",
            }}>
              {copiedChannel === ch.id ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>
        ))}
      </div>

      {/* Outreach Log */}
      {outreachLog.length > 0 && (
        <div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Outreach Log</div>
          {outreachLog.slice(0, 5).map((entry, i) => (
            <div key={i} style={{ fontSize: "0.62rem", color: "var(--text-secondary)", padding: "0.15rem 0" }}>
              📋 Message copied for {CHANNELS.find((c) => c.id === entry.channel)?.name || entry.channel} — {entry.time}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Main BuyerBot Client ─────────────────────────────────────────────────────

export default function BuyerBotClient({ items }: { items: ItemData[] }) {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("item");

  const [selectedId, setSelectedId] = useState<string>(preselected || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [runAt, setRunAt] = useState<string | null>(null);
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [megaBotExpanded, setMegaBotExpanded] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["hot-leads", "profiles", "outreach"]));
  const toggleSection = (id: string) => { setOpenSections(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };

  const item = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId]);
  const ai = useMemo(() => item ? safeJson(item.aiResult) : null, [item]);

  // Load existing result
  useEffect(() => {
    if (!selectedId) { setResult(null); return; }
    const existing = items.find((i) => i.id === selectedId);
    if (existing?.buyerBotResult) {
      const parsed = safeJson(existing.buyerBotResult);
      if (parsed) {
        setResult(parsed);
        setIsDemo(!!parsed._isDemo);
        setRunAt(existing.buyerBotRunAt);
        return;
      }
    }
    // Also try API
    fetch(`/api/bots/buyerbot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.hasResult && d.result) {
          setResult(d.result);
          setIsDemo(!!d.result._isDemo);
          setRunAt(d.createdAt || null);
        } else {
          setResult(null);
        }
      })
      .catch(() => setResult(null));
  }, [selectedId, items]);

  // Load MegaBot data
  useEffect(() => {
    if (!selectedId) { setMegaBotData(null); return; }
    fetch(`/api/megabot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.results?.buyerbot) setMegaBotData(d.results.buyerbot);
        else setMegaBotData(null);
      })
      .catch(() => setMegaBotData(null));
  }, [selectedId]);

  const runMegaBuyerBot = useCallback(async () => {
    if (!selectedId || megaBotLoading) return;
    setMegaBotData(null); // Clear old data so loading state shows (not stale results)
    setMegaBotLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch(`/api/megabot/${selectedId}?bot=buyerbot`, { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.providers || data.consensus)) {
          setMegaBotData(data);
        }
      } else {
        console.warn("[MegaBuyerBot] API error:", res.status);
      }
    } catch (e: any) {
      console.warn("[MegaBuyerBot] fetch error:", e.message);
    }
    setMegaBotLoading(false);
  }, [selectedId, megaBotLoading]);

  const runBuyerBot = useCallback(async () => {
    if (!selectedId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/buyerbot/${selectedId}`, { method: "POST" });
      const data = await res.json();
      if (data.result) {
        setResult(data.result);
        setIsDemo(!!data.isDemo);
        setRunAt(new Date().toISOString());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [selectedId, loading]);

  // ── No item selected ──
  if (!selectedId) {
    return (
      <BotItemSelector
        items={items.map((i) => ({ id: i.id, title: i.title, photo: i.photo, status: i.status, hasAnalysis: i.hasAnalysis }))}
        selectedId=""
        onSelect={setSelectedId}
      />
    );
  }

  // ── Item selected, extract data ──
  const profiles = result?.buyer_profiles || [];
  const platforms = result?.platform_opportunities || [];
  const hotLeads = result?.hot_leads || [];
  const strategies = result?.outreach_strategies || [];
  const local = result?.local_opportunities || null;
  const competition = result?.competitive_landscape || null;
  const timing = result?.timing_advice || null;
  const summary = result?.executive_summary || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Item selector */}
      <BotItemSelector
        items={items.map((i) => ({ id: i.id, title: i.title, photo: i.photo, status: i.status, hasAnalysis: i.hasAnalysis }))}
        selectedId={selectedId}
        onSelect={(id) => { setSelectedId(id); setResult(null); }}
      />

      {/* No analysis */}
      {item && !item.hasAnalysis && (
        <Card>
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</div>
            <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Run AI analysis first to enable buyer search.</p>
            <a href={`/items/${item.id}`} style={{ color: "var(--accent)", fontSize: "0.8rem", textDecoration: "none", fontWeight: 600 }}>
              Go to item → Analyze
            </a>
          </div>
        </Card>
      )}

      {/* Has analysis, no result — Teaser */}
      {item && item.hasAnalysis && !result && !loading && (
        <Card>
          <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎯</div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem" }}>
              Find Buyers for {item.title}
            </h2>
            {item.valuation && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 0.75rem" }}>
                Estimated value: ${item.valuation.low} – ${item.valuation.high}
              </p>
            )}
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 480, margin: "0 auto 0.75rem" }}>
              BuyerBot scans 15+ platforms and communities to find people actively looking for your item. You&apos;ll get buyer profiles, platform opportunities, outreach templates, hot leads, and competitive analysis.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: 280, margin: "0 auto 1rem", fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "left" }}>
              <div>✅ 6-12 buyer profiles with motivation + offer range</div>
              <div>✅ Platform-by-platform opportunity analysis</div>
              <div>✅ Ready-to-send outreach messages</div>
              <div>✅ Hot leads with urgency levels</div>
              <div>✅ Competitive landscape + timing advice</div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={runBuyerBot} className="btn-primary" style={{ padding: "0.6rem 1.5rem", fontSize: "0.85rem" }}>
                🎯 Run BuyerBot — 1 credit
              </button>
              <button onClick={runBuyerBot} style={{
                padding: "0.6rem 1.2rem", fontSize: "0.8rem", borderRadius: "0.5rem",
                background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(251,191,36,0.15))",
                border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa",
                cursor: "pointer", fontWeight: 600,
              }}>
                ⚡ MegaBot Buyer Search — 5 cr
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <BotLoadingState botName="BuyerBot" />
        </Card>
      )}

      {/* ── FULL RESULTS ── */}
      {result && !loading && (
        <>
          {/* Demo indicator */}
          {isDemo && (
            <div style={{ padding: "0.4rem 0.75rem", borderRadius: "0.5rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "0.68rem", color: "#f59e0b", textAlign: "center" }}>
              🧪 Demo Mode — Based on market analysis for this item type
            </div>
          )}

          {/* SECTION A — Buyer Overview */}
          <Card>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              {item?.photo && (
                <img src={item.photo} alt="" style={{ width: 56, height: 56, borderRadius: "0.5rem", objectFit: "cover" }} />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{item?.title}</h2>
                <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem", flexWrap: "wrap" }}>
                  <span>🎯 <strong style={{ color: "var(--text-primary)" }}>{profiles.length}</strong> buyer profiles</span>
                  <span>·</span>
                  <span>📡 <strong style={{ color: "var(--text-primary)" }}>{platforms.length}</strong> platforms scanned</span>
                  <span>·</span>
                  <span>🔥 <strong style={{ color: "#ef4444" }}>{hotLeads.length}</strong> hot leads</span>
                </div>
              </div>
            </div>
            {summary && (
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, marginTop: "0.75rem", padding: "0.65rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.1)" }}>
                {summary}
              </p>
            )}
          </Card>

          {/* SECTION B — Hot Leads */}
          <AccordionHeader id="hot-leads" icon="🔥" title="HOT LEADS" subtitle={`${hotLeads.length} leads found`} isOpen={openSections.has("hot-leads")} onToggle={toggleSection} accentColor="#ef4444" badge={hotLeads.length ? `${hotLeads.length} HOT` : ""} />
          {openSections.has("hot-leads") && hotLeads.length > 0 && (
            <Card>
              <SectionLabel icon="🔥" label="Hot Leads" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {hotLeads.map((lead: any, i: number) => (
                  <div key={i} style={{
                    padding: "0.75rem", borderRadius: "0.6rem",
                    border: "1px solid " + (i === 0 ? "rgba(239,68,68,0.25)" : "var(--border-default)"),
                    background: i === 0 ? "rgba(239,68,68,0.04)" : "var(--bg-card)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{lead.lead_description}</span>
                      <UrgencyBadge level={lead.urgency} />
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: "0 0 0.3rem", lineHeight: 1.4 }}>
                      {lead.evidence}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        💡 {lead.how_to_reach}
                      </span>
                      {lead.estimated_price_theyd_pay && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4ade80" }}>
                          ~${lead.estimated_price_theyd_pay}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SECTION C — Buyer Profiles */}
          <AccordionHeader id="profiles" icon="👥" title="BUYER PROFILES" subtitle={`${profiles.length} profiles identified`} isOpen={openSections.has("profiles")} onToggle={toggleSection} accentColor="#00bcd4" />
          {openSections.has("profiles") && profiles.length > 0 && (
            <Card>
              <SectionLabel icon="👤" label={`Buyer Profiles (${profiles.length})`} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.5rem" }}>
                {profiles.map((p: any, i: number) => (
                  <div key={i} style={{
                    padding: "0.75rem", borderRadius: "0.6rem",
                    border: "1px solid var(--border-default)", background: "var(--bg-card)",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-primary)", marginBottom: "0.3rem" }}>{p.profile_name}</div>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                      <BuyerTypeBadge type={p.buyer_type} />
                      <PriceSensitivityBadge level={p.price_sensitivity} />
                      {p.likelihood_to_buy && (
                        <span style={{ padding: "0.12rem 0.45rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 600, background: "rgba(0,188,212,0.1)", color: "var(--accent)" }}>
                          {p.likelihood_to_buy}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: "0 0 0.25rem", lineHeight: 1.4 }}>{p.motivation}</p>
                    {p.estimated_offer_range && (
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                        Offer range: <strong style={{ color: "var(--accent)" }}>{p.estimated_offer_range}</strong>
                      </div>
                    )}
                    {p.platforms_active_on?.length > 0 && (
                      <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                        {p.platforms_active_on.slice(0, 4).map((pl: string, j: number) => (
                          <span key={j} style={{ padding: "0.1rem 0.35rem", borderRadius: "0.25rem", fontSize: "0.55rem", background: "var(--ghost-bg)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }}>
                            {pl}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", margin: "0.3rem 0 0", fontStyle: "italic", lineHeight: 1.3 }}>
                      {p.best_approach}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SECTION D — Platform Opportunities */}
          <AccordionHeader id="platforms" icon="🏪" title="PLATFORM OPPORTUNITIES" subtitle={`${platforms.length} platforms analyzed`} isOpen={openSections.has("platforms")} onToggle={toggleSection} />
          {openSections.has("platforms") && platforms.length > 0 && (
            <Card>
              <SectionLabel icon="📡" label="Platform Opportunities" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {platforms.map((plat: any, i: number) => (
                  <div key={i} style={{
                    padding: "0.75rem", borderRadius: "0.6rem",
                    border: "1px solid var(--border-default)", background: "var(--bg-card)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{plat.platform}</span>
                      <OpportunityBadge level={plat.opportunity_level} />
                      {plat.estimated_buyers && (
                        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginLeft: "auto" }}>~{plat.estimated_buyers} potential buyers</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                      {plat.avg_sale_price_here && <span>Avg price: <strong style={{ color: "#4ade80" }}>${plat.avg_sale_price_here}</strong></span>}
                      {plat.avg_days_to_sell && <span>Sells in: <strong style={{ color: "var(--accent)" }}>{plat.avg_days_to_sell} days</strong></span>}
                      {plat.best_time_to_post && <span>Best time: {plat.best_time_to_post}</span>}
                    </div>
                    {plat.audience_description && (
                      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", margin: "0 0 0.3rem", lineHeight: 1.35 }}>{plat.audience_description}</p>
                    )}
                    {plat.how_to_list && (
                      <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", margin: "0 0 0.3rem", lineHeight: 1.35 }}>💡 {plat.how_to_list}</p>
                    )}
                    {/* Search terms */}
                    {plat.search_terms_buyers_use?.length > 0 && (
                      <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                        {plat.search_terms_buyers_use.map((term: string, j: number) => (
                          <span key={j} style={{ padding: "0.1rem 0.35rem", borderRadius: "0.25rem", fontSize: "0.55rem", background: "rgba(0,188,212,0.08)", color: "var(--accent)", border: "1px solid rgba(0,188,212,0.15)" }}>
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Groups */}
                    {plat.groups_or_communities?.length > 0 && (
                      <div style={{ marginTop: "0.3rem" }}>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>Communities: </span>
                        {plat.groups_or_communities.map((g: string, j: number) => (
                          <span key={j} style={{ fontSize: "0.58rem", color: "var(--text-secondary)" }}>
                            {j > 0 ? " · " : ""}{g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SECTION E — Outreach Center */}
          <AccordionHeader id="outreach" icon="📤" title="OUTREACH CENTER" subtitle="Templates & channels to reach buyers" isOpen={openSections.has("outreach")} onToggle={toggleSection} accentColor="#22c55e" />
          {openSections.has("outreach") && item && <OutreachCenter item={item} ai={ai} result={result} />}

          {/* SECTION F — Local Opportunities */}
          <AccordionHeader id="local" icon="📍" title="LOCAL OPPORTUNITIES" subtitle="Shops, flea markets, consignment near you" isOpen={openSections.has("local")} onToggle={toggleSection} />
          {openSections.has("local") && local && (
            <Card>
              <SectionLabel icon="📍" label="Local Opportunities" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {local.antique_shops_nearby && (
                  <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.15rem" }}>🏪 Shops & Dealers</div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{local.antique_shops_nearby}</p>
                  </div>
                )}
                {local.flea_markets && (
                  <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.15rem" }}>🎪 Flea Markets & Events</div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{local.flea_markets}</p>
                  </div>
                )}
                {local.consignment_options && (
                  <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.15rem" }}>🏷️ Consignment</div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{local.consignment_options}</p>
                  </div>
                )}
                {local.local_collector_clubs && (
                  <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.15rem" }}>🤝 Clubs & Groups</div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{local.local_collector_clubs}</p>
                  </div>
                )}
                {local.word_of_mouth && (
                  <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.15rem" }}>📢 Word of Mouth</div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{local.word_of_mouth}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* SECTION G — Competitive Landscape */}
          <AccordionHeader id="competitive" icon="⚔️" title="COMPETITIVE LANDSCAPE" subtitle="What you're up against" isOpen={openSections.has("competitive")} onToggle={toggleSection} />
          {openSections.has("competitive") && competition && (
            <Card>
              <SectionLabel icon="⚔️" label="Competitive Landscape" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ padding: "0.5rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", textAlign: "center" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>{competition.similar_items_listed || "?"}</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Similar Items Listed</div>
                </div>
                <div style={{ padding: "0.5rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", textAlign: "center" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{competition.price_range_of_competitors || "N/A"}</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Competitor Price Range</div>
                </div>
              </div>
              {competition.your_advantage && (
                <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.65rem", color: "#4ade80", fontWeight: 700 }}>✅ Your Advantage: </span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{competition.your_advantage}</span>
                </div>
              )}
              {competition.your_disadvantage && (
                <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700 }}>⚠️ Watch Out: </span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{competition.your_disadvantage}</span>
                </div>
              )}
              {competition.differentiation_tip && (
                <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.1)" }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--accent)", fontWeight: 700 }}>💡 Stand Out: </span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>{competition.differentiation_tip}</span>
                </div>
              )}
            </Card>
          )}

          {/* SECTION H — Timing Advice */}
          <AccordionHeader id="timing" icon="⏰" title="TIMING ADVICE" subtitle={timing?.best_day_to_list || ""} isOpen={openSections.has("timing")} onToggle={toggleSection} />
          {openSections.has("timing") && timing && (
            <Card>
              <SectionLabel icon="⏱️" label="Timing Advice" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                {timing.best_day_to_list && (
                  <div style={{ padding: "0.5rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.1rem" }}>📅 Best Day</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{timing.best_day_to_list}</div>
                  </div>
                )}
                {timing.best_time_to_list && (
                  <div style={{ padding: "0.5rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.1rem" }}>🕐 Best Time</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{timing.best_time_to_list}</div>
                  </div>
                )}
                {timing.seasonal_peak && (
                  <div style={{ padding: "0.5rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.1rem" }}>🌸 Peak Season</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)" }}>{timing.seasonal_peak}</div>
                  </div>
                )}
                {timing.avoid_listing && (
                  <div style={{ padding: "0.5rem", borderRadius: "0.45rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.1rem" }}>🚫 Avoid</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)" }}>{timing.avoid_listing}</div>
                  </div>
                )}
              </div>
              {timing.urgency_recommendation && (
                <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.65rem", borderRadius: "0.45rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.1)", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  ⏰ <strong style={{ color: "var(--accent)" }}>Recommendation:</strong> {timing.urgency_recommendation}
                </div>
              )}
            </Card>
          )}

          {/* SECTION I — MegaBot Buyer Analysis */}
          {megaBotLoading && (
            <Card style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))", border: "1px solid rgba(167,139,250,0.2)" }}>
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }}>⚡</div>
                <p style={{ fontSize: "0.85rem", color: "#a78bfa", fontWeight: 600 }}>4 AI buyer specialists working...</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>OpenAI, Claude, Gemini, and Grok scanning for buyers in parallel</p>
              </div>
            </Card>
          )}

          {!megaBotLoading && !megaBotData && (
            <Card style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))", border: "1px solid rgba(167,139,250,0.2)" }}>
              <SectionLabel icon="⚡" label="MegaBot Buyer Deep Dive" />
              <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                  Run 4 AI agents in parallel — OpenAI profiles mainstream buyers, Claude finds niche collectors, Gemini optimizes platform timing, and Grok surfaces social demand.
                </p>
                <button onClick={runMegaBuyerBot} style={{
                  padding: "0.55rem 1.3rem", fontSize: "0.8rem", borderRadius: "0.5rem", fontWeight: 700,
                  background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(251,191,36,0.2))",
                  border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa", cursor: "pointer",
                }}>
                  ⚡ Run MegaBot Buyer Search — 5 credits
                </button>
              </div>
            </Card>
          )}

          {!megaBotLoading && megaBotData && (() => {
            const providers: any[] = megaBotData.providers || [];
            const successful = providers.filter((p: any) => !p.error);
            const failed = providers.filter((p: any) => p.error);
            const agreeRaw = megaBotData.agreementScore || megaBotData.agreement || 0.85;
            const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
            const allBH = successful.map((p: any) => extractMegaBH(p));
            const totalProfiles = allBH.reduce((s: number, h: any) => s + h.profileCount, 0);
            const totalLeads = allBH.reduce((s: number, h: any) => s + h.hotLeadCount, 0);
            const totalPlatforms = new Set(allBH.flatMap((h: any) => h.platforms.map((p: any) => (p.platform || "").toLowerCase()))).size;

            return (
              <Card style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))", border: "1px solid rgba(139,92,246,0.2)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      MegaBot Buyer Deep Dive — {successful.length} AI Experts
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {totalProfiles} profiles · {totalPlatforms} platforms · {totalLeads} hot leads
                    </div>
                  </div>
                  <div style={{ padding: "0.2rem 0.6rem", borderRadius: 99, background: agree >= 75 ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)", color: agree >= 75 ? "#4caf50" : "#ff9800", fontSize: "0.72rem", fontWeight: 700 }}>
                    {agree}%
                  </div>
                </div>

                {/* Agreement bar */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ height: 5, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${agree}%`, borderRadius: 99, background: agree >= 80 ? "#4caf50" : agree >= 60 ? "#ff9800" : "#ef4444" }} />
                  </div>
                </div>

                {/* 4 Agent cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
                  {successful.map((p: any, idx: number) => {
                    const pm = MEGA_PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                    const isExp = megaBotExpanded === p.provider;
                    const bh = allBH[idx];
                    const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";

                    return (
                      <div key={p.provider} style={{
                        background: isExp ? "var(--ghost-bg)" : "var(--bg-card)",
                        borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                        border: `1px solid ${isExp ? `${pm.color}30` : "var(--border-default)"}`,
                        borderRadius: "0.5rem", overflow: "hidden",
                      }}>
                        <button
                          onClick={() => setMegaBotExpanded(isExp ? null : p.provider)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.65rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                          <span style={{ fontSize: "0.85rem" }}>{pm.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: "0.72rem", color: pm.color, minWidth: 52 }}>{pm.label}</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {bh.profileCount} profiles · {bh.platformCount} platforms · {bh.hotLeadCount} hot leads
                            {bh.demandLevel && ` · ${bh.demandLevel}`}
                          </span>
                          <span style={{ fontSize: "0.6rem", color: "#4caf50" }}>✅ {timeStr}</span>
                          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                        </button>

                        {isExp && (
                          <div style={{ padding: "0 0.75rem 0.75rem", borderTop: `1px solid ${pm.color}15` }}>
                            {/* Profiles */}
                            {bh.profiles.length > 0 && (
                              <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Buyer Profiles ({bh.profiles.length})</div>
                                {bh.profiles.slice(0, 6).map((bp: any, i: number) => (
                                  <div key={i} style={{ padding: "0.35rem 0.4rem", marginBottom: "0.25rem", borderRadius: "0.35rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>🎯 {bp.profile_name || bp.name || "Buyer"}</span>
                                      {bp.buyer_type && <BuyerTypeBadge type={bp.buyer_type} />}
                                      {bp.price_sensitivity && <PriceSensitivityBadge level={bp.price_sensitivity} />}
                                    </div>
                                    {bp.estimated_offer_range && <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--accent)", marginTop: "0.1rem" }}>{bp.estimated_offer_range}</div>}
                                    {bp.motivation && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.1rem", lineHeight: 1.3 }}>{typeof bp.motivation === "string" && bp.motivation.length > 120 ? bp.motivation.slice(0, 120) + "..." : bp.motivation}</div>}
                                    {bp.best_approach && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem", fontStyle: "italic" }}>💡 {typeof bp.best_approach === "string" && bp.best_approach.length > 100 ? bp.best_approach.slice(0, 100) + "..." : bp.best_approach}</div>}
                                    {Array.isArray(bp.platforms_active_on) && bp.platforms_active_on.length > 0 && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>📱 {bp.platforms_active_on.join(", ")}</div>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Platforms */}
                            {bh.platforms.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Platform Opportunities</div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                                        <th style={{ textAlign: "left", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Platform</th>
                                        <th style={{ textAlign: "center", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Level</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Buyers</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg $</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Days</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {bh.platforms.slice(0, 8).map((pl: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border-default)" }}>
                                          <td style={{ padding: "0.25rem 0.3rem", color: "var(--text-primary)", fontWeight: 600 }}>{pl.platform || "Unknown"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "center" }}>
                                            <OpportunityBadge level={pl.opportunity_level || "Moderate"} />
                                          </td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-secondary)" }}>{pl.estimated_buyers != null ? `~${pl.estimated_buyers}` : "—"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--accent)", fontWeight: 600 }}>{pl.avg_sale_price_here != null || pl.avg_sale_price != null ? `$${pl.avg_sale_price_here || pl.avg_sale_price}` : "—"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-muted)" }}>{pl.avg_days_to_sell != null ? `~${pl.avg_days_to_sell}d` : "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Hot Leads */}
                            {bh.hotLeads.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Hot Leads</div>
                                {bh.hotLeads.slice(0, 6).map((lead: any, i: number) => (
                                  <div key={i} style={{ padding: "0.3rem 0", borderBottom: i < Math.min(bh.hotLeads.length, 6) - 1 ? "1px solid var(--border-default)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                      <UrgencyBadge level={lead.urgency || "This week"} />
                                      <span style={{ fontSize: "0.7rem", color: "var(--text-primary)", flex: 1 }}>{lead.lead_description || lead.description || "Active buyer"}</span>
                                      {(lead.estimated_price_theyd_pay || lead.estimated_price) && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4ade80" }}>~${lead.estimated_price_theyd_pay || lead.estimated_price}</span>}
                                    </div>
                                    {lead.how_to_reach && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>💡 {lead.how_to_reach}</div>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Outreach + Deep Intel */}
                            {(bh.outreach.length > 0 || bh.influencers.length > 0 || bh.internationalBuyers || bh.corporateBuyers || bh.viralMarketing || bh.localOpps || bh.competitive || bh.timing) && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.35rem" }}>Deep Buyer Intelligence</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                  {bh.outreach.length > 0 && bh.outreach.slice(0, 3).map((s: any, i: number) => (
                                    <div key={i} style={{ padding: "0.3rem", borderRadius: "0.3rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                                      <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-primary)" }}>🎯 {s.strategy_name || s.channel || "Strategy"}</div>
                                      {s.message_template && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.1rem", fontStyle: "italic" }}>&ldquo;{typeof s.message_template === "string" && s.message_template.length > 100 ? s.message_template.slice(0, 100) + "..." : s.message_template}&rdquo;</div>}
                                    </div>
                                  ))}
                                  {bh.influencers.length > 0 && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>👥 {bh.influencers.length} influencer targets: {bh.influencers.slice(0, 2).map((inf: any) => `${inf.type || "Influencer"} — ${inf.niche || ""}`).join(", ")}</div>}
                                  {bh.internationalBuyers && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>🌍 International: {Array.isArray(bh.internationalBuyers.countries_with_demand) ? bh.internationalBuyers.countries_with_demand.join(", ") : "Global demand"}</div>}
                                  {bh.corporateBuyers && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>🏢 Corporate: {Object.entries(bh.corporateBuyers).filter(([, v]) => v && typeof v === "string").slice(0, 2).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")}</div>}
                                  {bh.viralMarketing && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>📱 Viral angle: {bh.viralMarketing.hook_angle || ""}{bh.viralMarketing.best_platform_for_viral ? ` on ${bh.viralMarketing.best_platform_for_viral}` : ""}</div>}
                                  {bh.localOpps && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>🏪 Local: {Object.entries(bh.localOpps).filter(([, v]) => v && typeof v === "string").slice(0, 2).map(([, v]) => v).join(" · ")}</div>}
                                  {bh.timing && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>⏰ {bh.timing.best_day_to_list ? `Best: ${bh.timing.best_day_to_list}` : ""}{bh.timing.urgency_recommendation ? ` — ${bh.timing.urgency_recommendation}` : ""}</div>}
                                </div>
                              </div>
                            )}

                            {/* Key insight */}
                            {bh.summary && (
                              <div style={{ padding: "0.4rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.4rem", borderLeft: `3px solid ${pm.color}50` }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} What {pm.label} Found</div>
                                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                                  &ldquo;{typeof bh.summary === "string" && bh.summary.length > 300 ? bh.summary.slice(0, 300) + "..." : bh.summary}&rdquo;
                                </p>
                              </div>
                            )}

                            <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.35rem" }}>
                              {pm.icon} {pm.label}: {pm.specialty}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {failed.map((p: any) => {
                    const pm = MEGA_PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                    return (
                      <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.5rem", opacity: 0.6, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: "0.4rem", fontSize: "0.65rem" }}>
                        <span>{pm.icon}</span>
                        <span style={{ fontWeight: 600, color: pm.color }}>{pm.label}</span>
                        <span style={{ color: "#ef4444", flex: 1 }}>❌ {(p.error || "").slice(0, 60)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Comparison */}
                {successful.length > 1 && (
                  <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Buyer Intelligence Comparison</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.7rem" }}>
                      {successful.map((p: any, i: number) => {
                        const pm = MEGA_PROVIDER_META[p.provider];
                        const bh = allBH[i];
                        return (
                          <span key={p.provider} style={{ color: pm?.color || "var(--text-secondary)" }}>
                            {pm?.icon} {pm?.label}: {bh.profileCount} profiles · {bh.platformCount} platforms · {bh.hotLeadCount} leads
                          </span>
                        );
                      })}
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4caf50", marginTop: "0.1rem" }}>
                        ✅ Combined: ~{totalProfiles} profiles · {totalPlatforms} platforms · {totalLeads} hot leads
                      </span>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div style={{ background: "rgba(139,92,246,0.04)", borderLeft: "3px solid rgba(139,92,246,0.3)", borderRadius: "0 0.5rem 0.5rem 0", padding: "0.65rem 0.85rem", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>MegaBot Buyer Summary</div>
                  <p style={{ fontSize: "0.78rem", lineHeight: 1.55, color: "var(--text-secondary)", margin: 0 }}>
                    {(() => {
                      const parts: string[] = [];
                      parts.push(`${successful.length} AI buyer specialists found ${totalProfiles} buyer profiles across ${totalPlatforms} platforms with ${totalLeads} hot leads.`);
                      if (agree >= 80) parts.push(`Strong consensus (${agree}%) on buyer approach.`);
                      for (let i = 0; i < successful.length && parts.length < 6; i++) {
                        const bh = allBH[i];
                        const label = MEGA_PROVIDER_META[successful[i].provider]?.label || successful[i].provider;
                        if (bh.summary && typeof bh.summary === "string") {
                          const sentences = bh.summary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
                          if (sentences.length > 25) parts.push(`${label}: ${sentences}`);
                        }
                      }
                      return parts.join(" ");
                    })()}
                  </p>
                </div>

                {/* MegaBot Web Sources */}
                {(() => {
                  const megaProviders = megaBotData?.providers || successful || [];
                  const allSrc = megaProviders.flatMap((p: any) => (p.webSources || []).map((s: any) => ({ ...s, provider: p.provider })));
                  const unique = allSrc.filter((s: any, i: number, a: any[]) => a.findIndex((x: any) => x.url === s.url) === i);
                  if (unique.length === 0) return null;
                  return (
                    <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#00bcd4", marginBottom: "0.25rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                        🌐 MEGABOT BUYER RESEARCH — {unique.length} sources
                      </div>
                      {unique.slice(0, 8).map((src: any, i: number) => (
                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.35rem", marginBottom: "0.1rem", borderRadius: "0.25rem", background: "var(--bg-card)", textDecoration: "none", fontSize: "0.52rem", color: "#00bcd4" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: src.provider === "openai" ? "#10b981" : src.provider === "gemini" ? "#3b82f6" : "#00DC82" }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{src.title || src.url}</span>
                          <span style={{ fontSize: "0.45rem", color: "var(--text-muted)", flexShrink: 0 }}>↗</span>
                        </a>
                      ))}
                    </div>
                  );
                })()}

                {/* Re-run */}
                <div style={{ textAlign: "center" }}>
                  <button onClick={runMegaBuyerBot} style={{
                    padding: "0.4rem 1rem", fontSize: "0.72rem", borderRadius: "0.4rem", fontWeight: 600,
                    background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", cursor: "pointer",
                  }}>
                    Re-Run MegaBot — 3 cr
                  </button>
                </div>
              </Card>
            );
          })()}

          {/* SECTION J — Actions */}
          <Card>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={runBuyerBot} className="btn-primary" style={{ padding: "0.5rem 1.2rem", fontSize: "0.78rem" }}>
                🎯 Re-Run BuyerBot — 1 credit
              </button>
              <button onClick={runBuyerBot} style={{
                padding: "0.5rem 1rem", fontSize: "0.75rem", borderRadius: "0.5rem",
                background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(251,191,36,0.15))",
                border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa",
                cursor: "pointer", fontWeight: 600,
              }}>
                ⚡ MegaBot — 5 cr
              </button>
              <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
                <Link href={`/items/${selectedId}`} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
                  textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
                  border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
                }}>
                  ← Back to Item
                </Link>
              </div>
              <a href={`/bots/listbot?item=${selectedId}`} style={{
                display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", fontSize: "0.75rem",
                borderRadius: "0.5rem", border: "1px solid var(--border-default)",
                color: "var(--text-secondary)", textDecoration: "none", fontWeight: 600,
              }}>
                ✍️ Create Listing
              </a>
            </div>
            {runAt && (
              <div style={{ textAlign: "center", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                Last run: {new Date(runAt).toLocaleString()}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
