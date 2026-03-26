"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  connectedPlatforms: string[];
  valuationMid: number | null;
  listingHistory?: { id: string; type: string; createdAt: string }[];
  lastListedAt?: string | null;
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

function calculateListingScore(listing: any): { score: number; breakdown: { label: string; score: number; max: number; tip?: string }[] } {
  const breakdown: { label: string; score: number; max: number; tip?: string }[] = [];
  const title = listing?.recommended_title || listing?.listings?.ebay?.title || "";
  const titleScore = Math.min(20, Math.round((title.length >= 30 ? 8 : title.length >= 15 ? 5 : 2) + (title.split(" ").length >= 5 ? 6 : 3) + (/\d/.test(title) ? 3 : 0) + (/[A-Z]/.test(title) ? 3 : 0)));
  breakdown.push({ label: "Title", score: titleScore, max: 20, tip: titleScore < 15 ? "Add brand/model/year" : undefined });
  const desc = listing?.listings?.ebay?.description_html || listing?.listings?.facebook_marketplace?.description || "";
  const descScore = Math.min(25, Math.round((desc.length >= 200 ? 10 : desc.length >= 100 ? 6 : 1) + (desc.toLowerCase().includes("condition") ? 5 : 0) + (/\n/.test(desc) ? 5 : 0) + (desc.includes("$") ? 5 : 0)));
  breakdown.push({ label: "Description", score: descScore, max: 25, tip: descScore < 18 ? "Add condition + pricing" : undefined });
  const keywords = listing?.seo_master?.primary_keywords || listing?.keywords || [];
  const kwScore = Math.min(20, keywords.length * 2);
  breakdown.push({ label: "SEO", score: kwScore, max: 20, tip: kwScore < 10 ? "Add more keywords" : undefined });
  const platforms = listing?.listings ? Object.keys(listing.listings).length : 0;
  const platScore = Math.min(20, platforms * 2);
  breakdown.push({ label: "Platforms", score: platScore, max: 20 });
  const photoScore = 12; // Default — photos counted externally
  breakdown.push({ label: "Photos", score: photoScore, max: 15 });
  return { score: breakdown.reduce((s, b) => s + b.score, 0), breakdown };
}

function CharacterBar({ current, max, label }: { current: number; max: number; label: string }) {
  if (!max || max <= 0) return null;
  const pct = Math.min(100, (current / max) * 100);
  const color = pct > 95 ? "#ef4444" : pct > 80 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ marginTop: "0.2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.48rem", color: "var(--text-muted)", marginBottom: "0.08rem" }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{current}/{max}</span>
      </div>
      <div style={{ height: "3px", background: "var(--ghost-bg)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "width 0.3s ease" }} />
      </div>
    </div>
  );
}

// Platform definitions with icons, colors, char limits
const PLATFORM_META: Record<string, { icon: string; color: string; titleLimit: number; name: string }> = {
  ebay: { icon: "🏷️", color: "#e53238", titleLimit: 80, name: "eBay" },
  facebook_marketplace: { icon: "📘", color: "#1877f2", titleLimit: 100, name: "Facebook Marketplace" },
  facebook_groups: { icon: "👥", color: "#1877f2", titleLimit: 0, name: "Facebook Groups" },
  instagram: { icon: "📸", color: "#e1306c", titleLimit: 0, name: "Instagram" },
  tiktok: { icon: "🎵", color: "#010101", titleLimit: 0, name: "TikTok" },
  etsy: { icon: "🧡", color: "#f1641e", titleLimit: 140, name: "Etsy" },
  craigslist: { icon: "📋", color: "#5c2d91", titleLimit: 70, name: "Craigslist" },
  mercari: { icon: "🔴", color: "#ef4444", titleLimit: 40, name: "Mercari" },
  offerup: { icon: "🏪", color: "#00d4aa", titleLimit: 100, name: "OfferUp" },
  poshmark: { icon: "👗", color: "#c63663", titleLimit: 80, name: "Poshmark" },
};

const LISTBOT_SPECIALTIES: Record<string, string> = {
  openai: "Web Research — real listing examples",
  claude: "Expert Copywriting — craftsmanship",
  gemini: "Market Intelligence — SEO optimization",
  grok: "Social Strategy — viral captions",
};

const PLATFORM_ORDER = ["ebay", "facebook_marketplace", "facebook_groups", "instagram", "tiktok", "etsy", "craigslist", "mercari", "offerup", "poshmark"];

const PLATFORM_URLS: Record<string, string> = {
  ebay: "https://www.ebay.com/sl/sell",
  facebook_marketplace: "https://www.facebook.com/marketplace/create/item",
  facebook_groups: "https://www.facebook.com/groups/",
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/upload",
  etsy: "https://www.etsy.com/your/shops/me/tools/listings/create",
  craigslist: "https://post.craigslist.org/",
  mercari: "https://www.mercari.com/sell/",
  offerup: "https://offerup.com/post",
  poshmark: "https://poshmark.com/create-listing",
};

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 600,
        borderRadius: "0.4rem", border: "1px solid var(--border-default)",
        background: copied ? "rgba(76,175,80,0.12)" : "transparent",
        color: copied ? "#4caf50" : "var(--text-muted)", cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {copied ? "✓ Copied" : label || "📋 Copy"}
    </button>
  );
}

function CharCount({ current, max, label }: { current: number; max: number; label?: string }) {
  const ok = current <= max;
  return (
    <span style={{
      fontSize: "0.6rem", fontWeight: 600, padding: "0.1rem 0.4rem", borderRadius: "9999px",
      background: ok ? "rgba(76,175,80,0.12)" : "rgba(245,158,11,0.12)",
      color: ok ? "#4caf50" : "#f59e0b",
    }}>
      {label || ""}{current}/{max} {ok ? "✅" : "⚠️"}
    </span>
  );
}

function getListingText(listing: any, platform: string): string {
  if (!listing) return "";
  switch (platform) {
    case "ebay": return `${listing.title}\n\n${listing.description_html?.replace(/<[^>]+>/g, "") || ""}\n\nKeywords: ${(listing.seo_keywords || []).join(", ")}`;
    case "facebook_marketplace": return `${listing.title}\n\n${listing.description}\n\nPrice: $${listing.price}`;
    case "facebook_groups": return listing.post_text || "";
    case "instagram": return `${listing.caption}\n\n${(listing.hashtags || []).join(" ")}`;
    case "tiktok": return `${listing.caption}\n\n${listing.video_concept || ""}`;
    case "etsy": return `${listing.title}\n\n${listing.description}\n\nTags: ${(listing.tags || []).join(", ")}`;
    case "craigslist": return `${listing.title}\n\n${listing.body}\n\nPrice: $${listing.price}`;
    case "mercari": return `${listing.title}\n\n${listing.description}\n\nPrice: $${listing.price}`;
    case "offerup": return `${listing.title}\n\n${listing.description}\n\nPrice: $${listing.price}`;
    case "poshmark": return `${listing.title}\n\n${listing.description}\n\nPrice: $${listing.price}`;
    default: return "";
  }
}

function getListingTitle(listing: any, platform: string): string {
  if (!listing) return "";
  if (platform === "facebook_groups") return (listing.post_text || "").slice(0, 60) + "...";
  if (platform === "instagram") return (listing.caption || "").slice(0, 60) + "...";
  if (platform === "tiktok") return listing.hook_line || (listing.caption || "").slice(0, 60);
  return listing.title || "";
}

function getListingPrice(listing: any, platform: string): number | null {
  if (!listing) return null;
  if (platform === "ebay") return listing.buy_it_now_price || listing.starting_price || null;
  return listing.price ?? null;
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

// ─── MegaBot helpers ─────────────────────────────────────────────────────────

const MEGA_PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Comprehensive listing optimization across mainstream platforms" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Storytelling, provenance details, collector-oriented descriptions" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "SEO keywords, algorithm optimization, trending search terms" },
  grok: { icon: "🌀", label: "Grok (xAI)", color: "#00DC82", specialty: "Social platform hooks, viral captions, Gen Z engagement" },
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
  const wrappers = ["listing_analysis", "listing_generation", "megabot_enhancement", "listbot_enhancement"];
  for (const w of wrappers) { if (d[w] && typeof d[w] === "object") { for (const k of keys) { if (Array.isArray(d[w][k]) && d[w][k].length > 0) return d[w][k]; } } }
  return [];
}
function _megaField(d: any, ...keys: string[]): any {
  for (const k of keys) { if (d[k] != null && d[k] !== "" && d[k] !== "Unknown") return d[k]; }
  return null;
}

function extractMegaLB(p: any) {
  let d = _megaNormKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && typeof d[topKeys[0]] === "object" && !Array.isArray(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];
  const listingsObj = (d.listings && typeof d.listings === "object" && !Array.isArray(d.listings)) ? d.listings : (d.platform_listings && typeof d.platform_listings === "object" && !Array.isArray(d.platform_listings)) ? d.platform_listings : {};
  const platforms = Array.isArray(d.top_platforms) ? d.top_platforms : Object.keys(listingsObj);
  const platformCount = Object.keys(listingsObj).length;
  const titles: Record<string, string> = {};
  for (const [plat, lst] of Object.entries(listingsObj)) {
    const v = lst as any;
    if (v?.title) titles[plat] = v.title;
  }
  const seo = (d.seo_keywords && typeof d.seo_keywords === "object" && !Array.isArray(d.seo_keywords)) ? d.seo_keywords : {};
  const primaryKw = Array.isArray(seo.primary) ? seo.primary : _megaArr(d, "primary_keywords", "top_keywords", "keywords");
  const longTailKw = Array.isArray(seo.long_tail) ? seo.long_tail : _megaArr(d, "long_tail_keywords", "long_tail");
  const bestTitle = d.best_title_overall || d.best_title || null;
  const bestHook = d.best_description_hook || d.best_hook || null;
  const hashtags = Array.isArray(d.hashtags) ? d.hashtags : _megaArr(d, "hashtags", "tags");
  return {
    listings: listingsObj, platforms, platformCount, titles,
    bestTitle, bestHook, hashtags,
    primaryKw, longTailKw, allKwCount: primaryKw.length + longTailKw.length,
    photoDirection: d.photo_direction || d.photo_tip || null,
    postingTime: d.posting_time || d.best_time || null,
    summary: d.executive_summary || d.summary || null,
  };
}

export default function ListBotClient({ items }: { items: ItemData[] }) {
  const searchParams = useSearchParams();
  const itemParam = searchParams.get("item");
  const [selectedId, setSelectedId] = useState<string | null>(
    (itemParam && items.some((i) => i.id === itemParam)) ? itemParam : items[0]?.id ?? null
  );

  // ListBot result state
  const [listBotResult, setListBotResult] = useState<any>(null);
  const [listBotLoading, setListBotLoading] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroImageLoading, setHeroImageLoading] = useState(false);

  // UI state
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "strategy" | "seo" | "tracker">("listings");
  const [showPostAll, setShowPostAll] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(PLATFORM_ORDER));
  const [toast, setToast] = useState<string | null>(null);

  // Posting tracker: per-platform status
  const [tracker, setTracker] = useState<Record<string, { copied: boolean; opened: boolean; confirmed: boolean; copiedAt?: string }>>({});

  // MegaBot state
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [megaBotExpanded, setMegaBotExpanded] = useState<string | null>(null);

  // Accordion state
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["listing-preview", "platforms", "publish"]));
  const toggleSection = (id: string) => { setOpenSections(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };

  const item = items.find((i) => i.id === selectedId);
  const ai = useMemo(() => safeJson(item?.aiResult ?? null), [item?.aiResult]);
  const listings = listBotResult?.listings || {};
  const strategy = listBotResult?.cross_platform_strategy;
  const photoStrat = listBotResult?.photo_strategy;
  const seoMaster = listBotResult?.seo_master;
  const pricingStrat = listBotResult?.pricing_strategy_per_platform;
  const autoReady = listBotResult?.auto_post_readiness;
  const execSummary = listBotResult?.executive_summary;

  const platformCount = Object.keys(listings).length;
  const confirmedCount = Object.values(tracker).filter((t) => t.confirmed).length;
  const copiedCount = Object.values(tracker).filter((t) => t.copied).length;

  // Fetch existing result when item changes
  useEffect(() => {
    setListBotResult(null);
    setHeroImageUrl(null);
    setTracker({});
    setExpandedPlatform(null);
    setActiveTab("listings");
    setShowPostAll(false);
    if (!selectedId) return;
    fetch(`/api/bots/listbot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.hasResult) {
          setListBotResult(d.result);
          if (d.result?._heroImageUrl) setHeroImageUrl(d.result._heroImageUrl);
        }
      })
      .catch(() => {});
  }, [selectedId]);

  // Load MegaBot data
  useEffect(() => {
    if (!selectedId) { setMegaBotData(null); return; }
    fetch(`/api/megabot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.results?.listbot) setMegaBotData(d.results.listbot);
        else setMegaBotData(null);
      })
      .catch(() => setMegaBotData(null));
  }, [selectedId]);

  const runMegaListBot = useCallback(async () => {
    if (!selectedId || megaBotLoading) return;
    setMegaBotData(null);
    setMegaBotLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch(`/api/megabot/${selectedId}?bot=listbot`, { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.providers || data.consensus)) {
          setMegaBotData(data);
        }
      } else {
        console.warn("[MegaListBot] API error:", res.status);
      }
    } catch (e: any) {
      console.warn("[MegaListBot] fetch error:", e.message);
    }
    setMegaBotLoading(false);
  }, [selectedId, megaBotLoading]);

  async function runListBot() {
    if (!selectedId) return;
    setListBotLoading(true);
    try {
      const res = await fetch(`/api/bots/listbot/${selectedId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) {
        const data = await res.json();
        setListBotResult(data.result);
        if (data.heroImageUrl) setHeroImageUrl(data.heroImageUrl);
      }
    } catch { /* ignore */ }
    setListBotLoading(false);
  }

  async function generateHeroImage() {
    if (!selectedId) return;
    setHeroImageLoading(true);
    try {
      const res = await fetch(`/api/bots/listbot/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateHeroImage: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setListBotResult(data.result);
        if (data.heroImageUrl) setHeroImageUrl(data.heroImageUrl);
      }
    } catch { /* ignore */ }
    setHeroImageLoading(false);
  }

  function trackCopy(platform: string) {
    setTracker((prev) => ({ ...prev, [platform]: { ...prev[platform], copied: true, copiedAt: new Date().toLocaleTimeString(), opened: prev[platform]?.opened || false, confirmed: prev[platform]?.confirmed || false } }));
  }

  function trackOpen(platform: string) {
    const url = PLATFORM_URLS[platform];
    if (url) window.open(url, "_blank");
    setTracker((prev) => ({ ...prev, [platform]: { ...prev[platform], opened: true, copied: prev[platform]?.copied || false, confirmed: prev[platform]?.confirmed || false } }));
  }

  function trackConfirm(platform: string) {
    setTracker((prev) => ({ ...prev, [platform]: { ...prev[platform], confirmed: true, copied: prev[platform]?.copied || false, opened: prev[platform]?.opened || false } }));
    setToast(`✅ Confirmed posted on ${PLATFORM_META[platform]?.name || platform}!`);
    setTimeout(() => setToast(null), 3000);
  }

  function togglePlatformSelect(p: string) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  }

  const hasResult = !!listBotResult;
  const isDemo = !!listBotResult?._isDemo;

  // ── RENDER ──

  return (
    <div>
      <BotItemSelector
        items={items.map((i) => ({ id: i.id, title: i.title, photo: i.photo, status: i.status, hasAnalysis: i.hasAnalysis }))}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
      />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "rgba(76,175,80,0.95)", color: "#fff", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
          {toast}
        </div>
      )}

      {/* Freshness Indicator */}
      {item?.lastListedAt && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem",
          background: "var(--ghost-bg)", borderRadius: "0.5rem", marginBottom: "0.75rem",
          fontSize: "0.65rem", color: "var(--text-muted)", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "0.8rem" }}>🕐</span>
          <span>Last generated: <strong style={{ color: "var(--text-secondary)" }}>
            {(() => {
              const ms = Date.now() - new Date(item.lastListedAt!).getTime();
              const mins = Math.floor(ms / 60000);
              if (mins < 60) return `${mins}m ago`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs}h ago`;
              return `${Math.floor(hrs / 24)}d ago`;
            })()}
          </strong></span>
          {(() => {
            const ms = Date.now() - new Date(item.lastListedAt!).getTime();
            const hrs = ms / 3600000;
            if (hrs > 168) return <span style={{ color: "#ef4444", fontWeight: 600 }}>⚠️ Stale — re-generate recommended</span>;
            if (hrs > 48) return <span style={{ color: "#f59e0b", fontWeight: 600 }}>⏳ Aging — listings may be outdated</span>;
            return <span style={{ color: "#22c55e", fontWeight: 600 }}>✅ Fresh</span>;
          })()}
          <span style={{ marginLeft: "auto", fontSize: "0.55rem" }}>
            {item.listingHistory?.length ?? 0} run{(item.listingHistory?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {!item ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>📝</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)" }}>Select an Item</div>
          <div style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>Choose an item above to generate optimized listings.</div>
        </div>
      ) : !ai ? (
        <div style={{ marginTop: "1.5rem", background: "var(--bg-card, var(--ghost-bg))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📝</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Analyze First</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Run AI analysis on this item before generating listings.</p>
        </div>
      ) : !hasResult && !listBotLoading ? (
        /* ── NOT RUN YET ── */
        <div style={{ marginTop: "1.5rem", background: "var(--bg-card, var(--ghost-bg))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✍️</div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>ListBot — The Listing Machine</h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto 0.75rem", lineHeight: 1.6 }}>
            Creates perfect, ready-to-post listings for every platform — optimized for each platform&apos;s audience, algorithm, and format.
          </p>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            What you&apos;ll get: eBay, Facebook, Instagram, TikTok, Etsy, Craigslist, Mercari, OfferUp, Poshmark — all ready to copy and post.
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={runListBot} className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.88rem" }}>
              ✍️ Run ListBot — 1 credit
            </button>
            <button onClick={runListBot} style={{
              padding: "0.75rem 2rem", fontSize: "0.88rem", fontWeight: 600, borderRadius: "0.5rem",
              background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none", color: "#fff", cursor: "pointer",
            }}>
              ⚡ MegaBot Lister — 5 credits
            </button>
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
            Uses AI analysis + PriceBot + BuyerBot data for maximum accuracy
          </div>
        </div>
      ) : listBotLoading ? (
        /* ── LOADING ── */
        <div style={{ marginTop: "1.5rem", background: "var(--bg-card, var(--ghost-bg))", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "1.25rem" }}>
          <BotLoadingState botName="ListBot" />
        </div>
      ) : (
        /* ── HAS RESULTS ── */
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Demo label */}
          {isDemo && (
            <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#f59e0b", textAlign: "center", padding: "0.3rem", background: "rgba(245,158,11,0.08)", borderRadius: "0.4rem" }}>
              Demo Mode — Listings generated from item analysis data
            </div>
          )}

          {/* Listing Quality Score */}
          {listBotResult && (() => {
            const { score, breakdown } = calculateListingScore(listBotResult);
            const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
            return (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "var(--ghost-bg)", borderRadius: "0.5rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${color}`, flexShrink: 0 }}>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color }}>{score}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
                    Listing Quality: {score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work"}
                  </div>
                  <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                    {breakdown.map((b, i) => (
                      <span key={i} style={{ fontSize: "0.48rem", padding: "1px 6px", borderRadius: "4px", background: b.score >= b.max * 0.7 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: b.score >= b.max * 0.7 ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>
                        {b.label}: {b.score}/{b.max}
                      </span>
                    ))}
                  </div>
                  {breakdown.find(b => b.tip) && (
                    <div style={{ fontSize: "0.5rem", color: "#f59e0b", marginTop: "0.1rem" }}>💡 {breakdown.find(b => b.tip)?.tip}</div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ═══ SECTION A: POST ALL HERO ═══ */}
          <div style={{
            background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(0,150,136,0.05))",
            border: "1px solid rgba(0,188,212,0.2)", borderRadius: "1.25rem", padding: "1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                  {platformCount} Platform Listings Ready
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {confirmedCount > 0 ? `Posted ${confirmedCount} of ${platformCount}` : `${copiedCount} copied · ${platformCount - copiedCount} pending`}
                </div>
                {/* Progress bar */}
                <div style={{ width: 200, height: 6, borderRadius: 3, background: "var(--ghost-bg)", marginTop: "0.5rem" }}>
                  <div style={{ width: `${(confirmedCount / Math.max(platformCount, 1)) * 100}%`, height: "100%", borderRadius: 3, background: "var(--accent)", transition: "width 0.3s" }} />
                </div>
              </div>
              <button
                onClick={() => setShowPostAll(!showPostAll)}
                className="btn-primary"
                style={{ padding: "0.85rem 2.5rem", fontSize: "0.95rem" }}
              >
                🚀 Post to All Platforms
              </button>
            </div>

            {/* Post All checklist */}
            {showPostAll && (
              <div style={{ marginTop: "1.25rem", borderTop: "1px solid rgba(0,188,212,0.15)", paddingTop: "1rem" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                  Select platforms to post
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {PLATFORM_ORDER.map((p) => {
                    const meta = PLATFORM_META[p];
                    const listing = listings[p];
                    if (!listing || !meta) return null;
                    const title = getListingTitle(listing, p);
                    const price = getListingPrice(listing, p);
                    const selected = selectedPlatforms.has(p);
                    return (
                      <div key={p} onClick={() => togglePlatformSelect(p)} style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.5rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer",
                        background: selected ? "rgba(0,188,212,0.06)" : "transparent",
                        border: `1px solid ${selected ? "rgba(0,188,212,0.2)" : "transparent"}`,
                      }}>
                        <span style={{ width: 18, height: 18, borderRadius: 3, border: "1.5px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", background: selected ? "var(--accent)" : "transparent", color: "#fff" }}>
                          {selected ? "✓" : ""}
                        </span>
                        <span>{meta.icon}</span>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{meta.name}</span>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                        {price && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)" }}>${price}</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  <button onClick={() => {
                    const selected = Array.from(selectedPlatforms);
                    selected.forEach((p) => {
                      const listing = listings[p];
                      if (listing) {
                        navigator.clipboard.writeText(getListingText(listing, p));
                        trackCopy(p);
                      }
                    });
                    setToast(`📋 Copied listings for ${selected.length} platforms!`);
                    setTimeout(() => setToast(null), 3000);
                  }} className="btn-primary" style={{ padding: "0.6rem 1.5rem", fontSize: "0.82rem" }}>
                    📋 Copy All Selected ({selectedPlatforms.size})
                  </button>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: "36px" }}>
                    Copies each platform&apos;s listing to clipboard one at a time
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Executive Summary */}
          {execSummary && (
            <div style={{
              padding: "1rem 1.25rem", borderRadius: "1rem",
              background: "rgba(0,188,212,0.04)", borderLeft: "4px solid var(--accent)",
            }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>ListBot Summary</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{execSummary}</div>
            </div>
          )}

          {/* ═══ SECTION B: AI HERO IMAGE ═══ */}
          <div style={{
            background: "var(--bg-card, var(--ghost-bg))",
            border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.25rem",
          }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              ✨ AI Hero Image
            </div>
            {heroImageUrl ? (
              <div>
                <img src={heroImageUrl} alt="AI-generated hero" style={{ width: "100%", maxWidth: 400, borderRadius: "0.75rem", marginBottom: "0.75rem" }} />
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>AI-enhanced product photo generated by DALL-E</div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                    Generate a professional AI-enhanced hero image for your listing
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                    📷 Pro tip: The first photo is your most important — make it clean, bright, and showing the full item
                  </div>
                </div>
                <button onClick={generateHeroImage} disabled={heroImageLoading} style={{
                  padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem",
                  background: heroImageLoading ? "var(--ghost-bg)" : "linear-gradient(135deg, rgba(0,188,212,0.15), rgba(0,150,136,0.1))",
                  border: "1px solid rgba(0,188,212,0.3)", color: heroImageLoading ? "var(--text-muted)" : "var(--accent)",
                  cursor: heroImageLoading ? "not-allowed" : "pointer",
                }}>
                  {heroImageLoading ? "⏳ Generating..." : "✨ Generate AI Hero Image — 1 cr"}
                </button>
              </div>
            )}
          </div>

          {/* Tab navigation */}
          <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.5rem" }}>
            {([
              { key: "listings", label: "Platform Listings" },
              { key: "strategy", label: "Strategy" },
              { key: "seo", label: "SEO & Keywords" },
              { key: "tracker", label: "Posting Tracker" },
            ] as const).map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: "0.4rem 1rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "none", cursor: "pointer",
                background: activeTab === tab.key ? "rgba(255,152,0,0.12)" : "transparent",
                color: activeTab === tab.key ? "#ff9800" : "var(--text-muted)",
              }}>
                {tab.label}
                {tab.key === "tracker" && confirmedCount > 0 && (
                  <span style={{ marginLeft: "0.3rem", fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.3rem", borderRadius: "9999px", background: "rgba(76,175,80,0.15)", color: "#4caf50" }}>
                    {confirmedCount}/{platformCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ═══ SECTION C: PLATFORM LISTINGS ═══ */}
          <AccordionHeader id="platforms" icon="🏪" title="PLATFORM LISTINGS" subtitle={`${Object.keys(listings).length} platforms`} isOpen={openSections.has("platforms")} onToggle={toggleSection} badge={`${Object.keys(listings).length} READY`} />
          {openSections.has("platforms") && activeTab === "listings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {PLATFORM_ORDER.map((p) => {
                const listing = listings[p];
                const meta = PLATFORM_META[p];
                if (!listing || !meta) return null;
                const title = getListingTitle(listing, p);
                const titleLen = title.length;
                const price = getListingPrice(listing, p);
                const isExpanded = expandedPlatform === p;
                const fullText = getListingText(listing, p);
                const t = tracker[p];
                const readyBadge = autoReady?.platforms_ready?.includes(meta.name) ? "Ready" : "Review";

                return (
                  <div key={p} style={{
                    background: "var(--bg-card, var(--ghost-bg))",
                    border: `1px solid ${isExpanded ? `${meta.color}33` : "var(--border-card, var(--border-default))"}`,
                    borderRadius: "1rem", overflow: "hidden", transition: "border-color 0.2s",
                  }}>
                    {/* Platform header */}
                    <div
                      onClick={() => setExpandedPlatform(isExpanded ? null : p)}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "1.3rem" }}>{meta.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>{meta.name}</span>
                          <span style={{
                            fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px",
                            background: readyBadge === "Ready" ? "rgba(76,175,80,0.12)" : "rgba(245,158,11,0.12)",
                            color: readyBadge === "Ready" ? "#4caf50" : "#f59e0b", textTransform: "uppercase",
                          }}>
                            {readyBadge === "Ready" ? "✅ Ready to Post" : "📝 Needs Review"}
                          </span>
                          {meta.titleLimit > 0 && <CharCount current={titleLen} max={meta.titleLimit} />}
                          {t?.copied && <span style={{ fontSize: "0.55rem", color: "#4caf50", fontWeight: 600 }}>📋 Copied</span>}
                          {t?.confirmed && <span style={{ fontSize: "0.55rem", color: "#4caf50", fontWeight: 600 }}>✅ Posted</span>}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {title}
                        </div>
                      </div>
                      {price && <span style={{ fontSize: "0.88rem", fontWeight: 800, color: meta.color }}>${price}</span>}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "" }}>▾</span>
                    </div>

                    {/* Expanded listing content */}
                    {isExpanded && (
                      <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border-default)" }}>
                        {/* Full listing preview */}
                        <div style={{
                          marginTop: "1rem", padding: "1rem", borderRadius: "0.6rem",
                          background: "var(--bg-card)", border: "1px solid var(--border-default)",
                          fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6,
                          whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto",
                        }}>
                          {fullText}
                        </div>

                        {/* Character bars */}
                        {(() => {
                          const tLimit = meta.titleLimit || 100;
                          const dLimit: Record<string, number> = { ebay: 4000, facebook_marketplace: 1000, instagram: 2200, tiktok: 300, etsy: 2000, craigslist: 2000, mercari: 1000, offerup: 1000, poshmark: 1500, reverb: 3000, pinterest: 500, amazon: 2000 };
                          return (
                            <div style={{ marginTop: "0.3rem" }}>
                              {tLimit > 0 && <CharacterBar current={title.length} max={tLimit} label="Title" />}
                              <CharacterBar current={fullText.length} max={dLimit[p] || 1000} label="Full listing" />
                            </div>
                          );
                        })()}

                        {/* Platform-specific extras */}
                        {p === "ebay" && listing.scheduling_tip && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem", padding: "0.4rem 0.6rem", borderRadius: "0.4rem", background: "var(--bg-card)" }}>
                            ⏰ {listing.scheduling_tip}
                          </div>
                        )}
                        {p === "instagram" && listing.posting_tip && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem", padding: "0.4rem 0.6rem", borderRadius: "0.4rem", background: "var(--bg-card)" }}>
                            📸 {listing.posting_tip}
                          </div>
                        )}
                        {p === "tiktok" && listing.trend_tie_in && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem", padding: "0.4rem 0.6rem", borderRadius: "0.4rem", background: "var(--bg-card)" }}>
                            🎵 Trend: {listing.trend_tie_in}
                          </div>
                        )}
                        {p === "etsy" && listing.renewal_tip && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem", padding: "0.4rem 0.6rem", borderRadius: "0.4rem", background: "var(--bg-card)" }}>
                            🔄 {listing.renewal_tip}
                          </div>
                        )}
                        {p === "poshmark" && listing.cover_shot_tip && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem", padding: "0.4rem 0.6rem", borderRadius: "0.4rem", background: "var(--bg-card)" }}>
                            📷 {listing.cover_shot_tip}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                          <CopyButton text={fullText} label={`📋 Copy ${meta.name} Listing`} />
                          <button onClick={() => { trackCopy(p); navigator.clipboard.writeText(fullText); setToast(`✅ Copied ${meta.name} listing!`); setTimeout(() => setToast(null), 2000); }} style={{ display: "none" }} />
                          <button onClick={() => trackOpen(p)} style={{
                            padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 600,
                            borderRadius: "0.4rem", border: `1px solid ${meta.color}44`,
                            background: "transparent", color: meta.color, cursor: "pointer",
                          }}>
                            🔗 Open {meta.name}
                          </button>
                          {!t?.confirmed && (
                            <button onClick={() => trackConfirm(p)} style={{
                              padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 600,
                              borderRadius: "0.4rem", border: "1px solid rgba(76,175,80,0.3)",
                              background: "transparent", color: "#4caf50", cursor: "pointer",
                            }}>
                              ✅ I Posted This
                            </button>
                          )}
                          <a href="/integrations" style={{
                            padding: "0.3rem 0.75rem", fontSize: "0.68rem", fontWeight: 600,
                            borderRadius: "0.4rem", border: "1px solid var(--border-default)",
                            background: "transparent", color: "var(--text-muted)", textDecoration: "none",
                            display: "flex", alignItems: "center",
                          }}>
                            🔗 Connect {meta.name} →
                          </a>
                        </div>

                        {t?.copiedAt && (
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                            Copied for {meta.name} — {t.copiedAt}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ SECTION D+G: STRATEGY ═══ */}
          {activeTab === "strategy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Cross-Platform Strategy */}
              {strategy && (
                <div style={{ background: "var(--bg-card, var(--ghost-bg))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
                    Cross-Platform Strategy
                  </div>
                  {strategy.posting_order && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)", marginBottom: "0.5rem" }}>📋 Posting Order</div>
                      <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
                        {(Array.isArray(strategy.posting_order) ? strategy.posting_order : [strategy.posting_order]).map((s: string, i: number) => (
                          <li key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.35rem", lineHeight: 1.5 }}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {[
                    { key: "price_differentiation", label: "💰 Price Differentiation", icon: "💰" },
                    { key: "exclusivity_windows", label: "⏰ Exclusivity Windows", icon: "⏰" },
                    { key: "cross_promotion", label: "🔗 Cross-Promotion", icon: "🔗" },
                    { key: "removal_strategy", label: "🗑️ Removal Strategy", icon: "🗑️" },
                  ].map(({ key, label }) => strategy[key] ? (
                    <div key={key} style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{label}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{strategy[key]}</div>
                    </div>
                  ) : null)}
                </div>
              )}

              {/* Photo Strategy */}
              {photoStrat && (
                <div style={{ background: "var(--bg-card, var(--ghost-bg))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
                    📷 Photo Strategy
                  </div>
                  {photoStrat.hero_image && <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.5 }}><strong>Hero:</strong> {photoStrat.hero_image}</div>}
                  {photoStrat.photo_order && <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.5 }}><strong>Order:</strong> {photoStrat.photo_order}</div>}
                  {photoStrat.photos_needed?.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Photos Needed:</div>
                      <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                        {photoStrat.photos_needed.map((p: string, i: number) => (
                          <li key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {photoStrat.editing_tips?.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Editing Tips:</div>
                      {photoStrat.editing_tips.map((t: string, i: number) => (
                        <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>• {t}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pricing Strategy */}
              {pricingStrat && (
                <div style={{ background: "var(--bg-card, var(--ghost-bg))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
                    💰 Pricing Strategy Per Platform
                  </div>
                  {/* Price map */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                    {PLATFORM_ORDER.filter((p) => listings[p]).map((p) => {
                      const price = getListingPrice(listings[p], p);
                      const meta = PLATFORM_META[p];
                      return price ? (
                        <div key={p} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                          <span>{meta.icon}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", flex: 1 }}>{meta.name}</span>
                          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: meta.color }}>${price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  {[
                    { key: "highest_price_platform", label: "📈 Highest Price" },
                    { key: "lowest_price_platform", label: "📉 Lowest Price" },
                    { key: "negotiation_platforms", label: "🤝 Negotiation Expected" },
                    { key: "firm_price_platforms", label: "🔒 Firm Price Works" },
                  ].map(({ key, label }) => pricingStrat[key] ? (
                    <div key={key} style={{ marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>{label}: </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{pricingStrat[key]}</span>
                    </div>
                  ) : null)}
                </div>
              )}
            </div>
          )}

          {/* ═══ SECTION E: SEO & KEYWORDS ═══ */}
          {activeTab === "seo" && seoMaster && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card, var(--ghost-bg))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.5rem" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
                  🔍 SEO Master Keywords
                </div>

                {seoMaster.primary_keywords?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4caf50" }}>Primary Keywords (must include)</span>
                      <CopyButton text={seoMaster.primary_keywords.join(", ")} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {seoMaster.primary_keywords.map((k: string, i: number) => (
                        <span key={i} style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(76,175,80,0.12)", color: "#4caf50", border: "1px solid rgba(76,175,80,0.2)" }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {seoMaster.long_tail_keywords?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)" }}>Long-Tail Keywords</span>
                      <CopyButton text={seoMaster.long_tail_keywords.join(", ")} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {seoMaster.long_tail_keywords.map((k: string, i: number) => (
                        <span key={i} style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(0,188,212,0.08)", color: "var(--accent)", border: "1px solid rgba(0,188,212,0.15)" }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {seoMaster.trending_keywords?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ff9800", marginBottom: "0.5rem" }}>🔥 Trending Now</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {seoMaster.trending_keywords.map((k: string, i: number) => (
                        <span key={i} style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(255,152,0,0.1)", color: "#ff9800", border: "1px solid rgba(255,152,0,0.2)" }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {seoMaster.keywords_to_avoid?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.5rem" }}>🚫 Avoid These</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {seoMaster.keywords_to_avoid.map((k: string, i: number) => (
                        <span key={i} style={{ padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)", textDecoration: "line-through" }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: "1rem", fontSize: "0.72rem", color: "#4caf50", fontWeight: 600 }}>
                  ✅ These keywords are included in all your listings
                </div>
              </div>

              {/* Auto-Post Readiness */}
              {autoReady && (
                <div style={{ background: "var(--bg-card, var(--ghost-bg))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    🚀 Auto-Post Readiness
                  </div>
                  {autoReady.platforms_ready?.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#4caf50", marginBottom: "0.35rem" }}>✅ Ready to Post:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {autoReady.platforms_ready.map((p: string, i: number) => (
                          <span key={i} style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.68rem", fontWeight: 600, background: "rgba(76,175,80,0.1)", color: "#4caf50" }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {autoReady.platforms_need_tweaks?.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#f59e0b", marginBottom: "0.35rem" }}>📝 Need Tweaks:</div>
                      {autoReady.platforms_need_tweaks.map((t: string, i: number) => (
                        <div key={i} style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>• {t}</div>
                      ))}
                    </div>
                  )}
                  {autoReady.estimated_time_to_post_all && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      ⏱️ {autoReady.estimated_time_to_post_all}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ SECTION H: POSTING TRACKER ═══ */}
          {activeTab === "tracker" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Progress bar */}
              <div style={{
                background: "var(--bg-card, var(--ghost-bg))", border: "1px solid var(--border-card)",
                borderRadius: "1.25rem", padding: "1.25rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Posted on {confirmedCount} of {platformCount} platforms
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700 }}>
                    {platformCount > 0 ? Math.round((confirmedCount / platformCount) * 100) : 0}%
                  </span>
                </div>
                <div style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--ghost-bg)" }}>
                  <div style={{ width: `${(confirmedCount / Math.max(platformCount, 1)) * 100}%`, height: "100%", borderRadius: 4, background: "linear-gradient(135deg, #00bcd4, #009688)", transition: "width 0.3s" }} />
                </div>
              </div>

              {/* Platform tracker cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {PLATFORM_ORDER.map((p) => {
                  const listing = listings[p];
                  const meta = PLATFORM_META[p];
                  if (!listing || !meta) return null;
                  const t = tracker[p] || { copied: false, opened: false, confirmed: false };
                  const fullText = getListingText(listing, p);
                  const status = t.confirmed ? "posted" : t.opened ? "opened" : t.copied ? "copied" : "pending";
                  const statusColor = status === "posted" ? "#4caf50" : status === "opened" ? "#ff9800" : status === "copied" ? "#00bcd4" : "var(--text-muted)";
                  const statusLabel = status === "posted" ? "✅ Posted" : status === "opened" ? "🔗 Opened" : status === "copied" ? "📋 Copied" : "⏳ Not yet";

                  return (
                    <div key={p} style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.75rem 1rem", borderRadius: "0.75rem",
                      background: "var(--bg-card, var(--ghost-bg))",
                      border: `1px solid ${t.confirmed ? "rgba(76,175,80,0.2)" : "var(--border-card, var(--border-default))"}`,
                    }}>
                      <span style={{ fontSize: "1.1rem" }}>{meta.icon}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", flex: 1, minWidth: 0 }}>{meta.name}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: statusColor, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: `${statusColor}15`, flexShrink: 0 }}>
                        {statusLabel}
                      </span>
                      <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                        <button onClick={() => { navigator.clipboard.writeText(fullText); trackCopy(p); }} style={{
                          padding: "0.2rem 0.5rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.3rem",
                          border: "1px solid var(--border-default)", background: "transparent",
                          color: t.copied ? "#4caf50" : "var(--text-muted)", cursor: "pointer",
                        }}>
                          📋
                        </button>
                        <button onClick={() => trackOpen(p)} style={{
                          padding: "0.2rem 0.5rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.3rem",
                          border: `1px solid ${meta.color}44`, background: "transparent",
                          color: meta.color, cursor: "pointer",
                        }}>
                          🔗
                        </button>
                        {!t.confirmed && (
                          <button onClick={() => trackConfirm(p)} style={{
                            padding: "0.2rem 0.5rem", fontSize: "0.62rem", fontWeight: 600, borderRadius: "0.3rem",
                            border: "1px solid rgba(76,175,80,0.3)", background: "transparent",
                            color: "#4caf50", cursor: "pointer",
                          }}>
                            ✅
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ SECTION I: MEGABOT LISTING DEEP DIVE ═══ */}
          <AccordionHeader id="megabot" icon="⚡" title="MEGABOT LISTING DEEP DIVE" subtitle={megaBotData ? `${(megaBotData.providers || []).length} AI engines` : "Not yet run"} isOpen={openSections.has("megabot")} onToggle={toggleSection} accentColor="#8b5cf6" />
          {openSections.has("megabot") && megaBotLoading && (
            <Card style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))", border: "1px solid rgba(167,139,250,0.2)" }}>
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }}>⚡</div>
                <p style={{ fontSize: "0.85rem", color: "#a78bfa", fontWeight: 600 }}>4 AI listing specialists working...</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>OpenAI, Claude, Gemini, and Grok crafting listings in parallel</p>
              </div>
            </Card>
          )}

          {openSections.has("megabot") && !megaBotLoading && !megaBotData && (
            <Card style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))", border: "1px solid rgba(167,139,250,0.2)" }}>
              <SectionLabel icon="⚡" label="MegaBot Listing Deep Dive" />
              <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                  Run 4 AI agents in parallel — OpenAI optimizes mainstream listings, Claude crafts collector descriptions, Gemini maximizes SEO, and Grok writes viral social hooks.
                </p>
                <button onClick={runMegaListBot} style={{
                  padding: "0.55rem 1.3rem", fontSize: "0.8rem", borderRadius: "0.5rem", fontWeight: 700,
                  background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(251,191,36,0.2))",
                  border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa", cursor: "pointer",
                }}>
                  ⚡ Run MegaBot Listing Search — 5 credits
                </button>
              </div>
            </Card>
          )}

          {openSections.has("megabot") && !megaBotLoading && megaBotData && (() => {
            const providers: any[] = megaBotData.providers || [];
            const successful = providers.filter((p: any) => !p.error);
            const failed = providers.filter((p: any) => p.error);
            const agreeRaw = megaBotData.agreementScore || megaBotData.agreement || 0.85;
            const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
            const allLB = successful.map((p: any) => extractMegaLB(p));
            const totalListings = allLB.reduce((s: number, h: any) => s + (h.platformCount || 0), 0);
            const totalKeywords = new Set(allLB.flatMap((h: any) => [...(h.primaryKw || []), ...(h.longTailKw || [])].map((k: any) => typeof k === "string" ? k.toLowerCase() : ""))).size;
            const bestPlatforms = allLB.map((h: any) => h.platforms[0]).filter(Boolean);

            return (
              <Card style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))", border: "1px solid rgba(139,92,246,0.2)" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      MegaBot Listing Deep Dive — {successful.length} AI Experts
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {totalListings} listings across {new Set(allLB.flatMap((h: any) => h.platforms.map((p: any) => typeof p === "string" ? p.toLowerCase() : ""))).size} platforms · {totalKeywords} SEO keywords
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
                    const lb = allLB[idx];
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
                          <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontStyle: "italic" }}>{LISTBOT_SPECIALTIES[p.provider] || ""}</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {lb.platformCount} listings · {timeStr}
                          </span>
                          <span style={{ fontSize: "0.6rem", color: "#4caf50" }}>✅ {timeStr}</span>
                          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                        </button>

                        {isExp && (
                          <div style={{ padding: "0 0.75rem 0.75rem", borderTop: `1px solid ${pm.color}15` }}>
                            {/* Platform Listings */}
                            {lb.platformCount > 0 && (
                              <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Platform Listings ({lb.platformCount})</div>
                                {Object.entries(lb.listings).slice(0, 4).map(([platform, lst]: [string, any]) => (
                                  <div key={platform} style={{ padding: "0.4rem 0.5rem", marginBottom: "0.25rem", borderRadius: "0.4rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "0.6rem", padding: "0.05rem 0.3rem", borderRadius: 99, background: "rgba(0,188,212,0.12)", color: "var(--accent)", fontWeight: 600, textTransform: "capitalize" }}>{platform.replace(/_/g, " ")}</span>
                                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{lst?.title || "\u2014"}</span>
                                      {lst?.price && <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent)" }}>${lst.price}</span>}
                                    </div>
                                    {lst?.description && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.12rem", lineHeight: 1.4 }}>{(lst.description || "").slice(0, 250)}{(lst.description || "").length > 250 ? "..." : ""}</div>}
                                    {Array.isArray(lst?.tags) && lst.tags.length > 0 && (
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", marginTop: "0.15rem" }}>
                                        {lst.tags.slice(0, 8).map((tag: string, ti: number) => (
                                          <span key={ti} style={{ fontSize: "0.55rem", padding: "0.08rem 0.3rem", borderRadius: 99, background: "rgba(139,92,246,0.08)", color: "#a855f7" }}>{tag}</span>
                                        ))}
                                      </div>
                                    )}
                                    {lst?.posting_tip && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.12rem", fontStyle: "italic" }}>💡 {lst.posting_tip}</div>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* SEO Keywords */}
                            {lb.allKwCount > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>SEO Keywords ({lb.allKwCount})</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                                  {lb.primaryKw.slice(0, 8).map((kw: any, i: number) => (
                                    <span key={`p${i}`} style={{ padding: "0.12rem 0.4rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 600, background: "rgba(0,188,212,0.08)", color: "var(--accent)", border: "1px solid rgba(0,188,212,0.15)" }}>
                                      {typeof kw === "string" ? kw : String(kw)}
                                    </span>
                                  ))}
                                  {lb.longTailKw.slice(0, 4).map((kw: any, i: number) => (
                                    <span key={`l${i}`} style={{ padding: "0.12rem 0.4rem", borderRadius: "9999px", fontSize: "0.6rem", fontWeight: 500, background: "rgba(139,92,246,0.08)", color: "#a855f7" }}>
                                      {typeof kw === "string" ? kw : String(kw)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Listing Extras */}
                            {(lb.bestTitle || lb.bestHook || lb.hashtags.length > 0 || lb.photoDirection || lb.postingTime) && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.35rem" }}>Listing Intelligence</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                  {lb.bestTitle && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                                      🏆 Best title: <strong style={{ color: "var(--accent)" }}>{lb.bestTitle}</strong>
                                    </div>
                                  )}
                                  {lb.bestHook && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                                      🎯 Opening: {typeof lb.bestHook === "string" && lb.bestHook.length > 100 ? lb.bestHook.slice(0, 100) + "..." : lb.bestHook}
                                    </div>
                                  )}
                                  {lb.hashtags.length > 0 && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                                      #️⃣ {lb.hashtags.slice(0, 8).join(" ")}
                                    </div>
                                  )}
                                  {lb.photoDirection && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                                      📸 {lb.photoDirection}
                                    </div>
                                  )}
                                  {lb.postingTime && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                                      ⏰ {lb.postingTime}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Key insight */}
                            {lb.summary && (
                              <div style={{ padding: "0.4rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.4rem", borderLeft: `3px solid ${pm.color}50` }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} What {pm.label} Found</div>
                                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                                  &ldquo;{typeof lb.summary === "string" && lb.summary.length > 300 ? lb.summary.slice(0, 300) + "..." : lb.summary}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* Web sources */}
                            {p.webSources?.length > 0 && (
                              <div style={{ marginTop: "0.4rem", paddingTop: "0.3rem", borderTop: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.15rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>🔗 LISTING RESEARCH ({p.webSources.length})</div>
                                {p.webSources.slice(0, 4).map((src: any, si: number) => (
                                  <a key={si} href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "0.15rem 0.35rem", marginBottom: "0.08rem", borderRadius: "0.25rem", background: "var(--ghost-bg)", textDecoration: "none", fontSize: "0.5rem", color: "#00bcd4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                    🔗 {src.title || src.url} ↗
                                  </a>
                                ))}
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
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Listing Intelligence Comparison</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.7rem" }}>
                      {successful.map((p: any, i: number) => {
                        const pm = MEGA_PROVIDER_META[p.provider];
                        const lb = allLB[i];
                        return (
                          <span key={p.provider} style={{ color: pm?.color || "var(--text-secondary)" }}>
                            {pm?.icon} {pm?.label}: {lb.platformCount} listings · {lb.allKwCount} keywords{lb.bestTitle ? ` · "${(lb.bestTitle as string).slice(0, 30)}..."` : ""}
                          </span>
                        );
                      })}
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4caf50", marginTop: "0.1rem" }}>
                        ✅ Combined: {totalListings} listings across {new Set(allLB.flatMap((h: any) => h.platforms.map((p: any) => typeof p === "string" ? p.toLowerCase() : ""))).size} platforms · {totalKeywords} unique keywords
                      </span>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div style={{ background: "rgba(139,92,246,0.04)", borderLeft: "3px solid rgba(139,92,246,0.3)", borderRadius: "0 0.5rem 0.5rem 0", padding: "0.65rem 0.85rem", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>MegaBot Listing Summary</div>
                  <p style={{ fontSize: "0.78rem", lineHeight: 1.55, color: "var(--text-secondary)", margin: 0 }}>
                    {(() => {
                      const parts: string[] = [];
                      parts.push(`${successful.length} AI listing experts created ${totalListings} professional listings with ${totalKeywords} unique SEO keywords.`);
                      if (agree >= 80) parts.push(`Strong consensus (${agree}%) on listing approach.`);
                      if (bestPlatforms.length > 0) parts.push(`Recommended platform: ${bestPlatforms[0]}.`);
                      for (let i = 0; i < successful.length && parts.length < 6; i++) {
                        const lb = allLB[i];
                        const label = MEGA_PROVIDER_META[successful[i].provider]?.label || successful[i].provider;
                        if (lb.summary && typeof lb.summary === "string") {
                          const sentences = lb.summary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
                          if (sentences.length > 25) parts.push(`${label}: ${sentences}`);
                        }
                      }
                      return parts.join(" ");
                    })()}
                  </p>
                </div>

                {/* Unified web research */}
                {(() => {
                  const allSrc = successful.flatMap((p: any) => (p.webSources || []).map((s: any) => ({ ...s, provider: p.provider })));
                  const unique = allSrc.filter((s: any, i: number, a: any[]) => a.findIndex((x: any) => x.url === s.url) === i);
                  if (unique.length === 0) return null;
                  return (
                    <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#00bcd4", marginBottom: "0.2rem", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>🌐 MEGABOT LISTING RESEARCH — {unique.length} sources</div>
                      {unique.slice(0, 6).map((src: any, i: number) => (
                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.15rem 0.35rem", marginBottom: "0.08rem", borderRadius: "0.25rem", background: "var(--bg-card)", textDecoration: "none", fontSize: "0.5rem", color: "#00bcd4" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: src.provider === "openai" ? "#10b981" : src.provider === "gemini" ? "#3b82f6" : "#00DC82" }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{src.title || src.url}</span>
                          <span style={{ fontSize: "0.42rem", color: "var(--text-muted)" }}>↗</span>
                        </a>
                      ))}
                    </div>
                  );
                })()}

                {/* Re-run */}
                <div style={{ textAlign: "center" }}>
                  <button onClick={runMegaListBot} style={{
                    padding: "0.4rem 1rem", fontSize: "0.72rem", borderRadius: "0.4rem", fontWeight: 600,
                    background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", cursor: "pointer",
                  }}>
                    Re-Run MegaBot — 3 cr
                  </button>
                </div>
              </Card>
            );
          })()}

          {/* ═══ SECTION J: ACTIONS ═══ */}
          <div style={{
            background: "var(--bg-card, var(--ghost-bg))",
            border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.25rem",
          }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Actions
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button onClick={runListBot} disabled={listBotLoading} style={{
                padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "1px solid var(--border-default)", background: "transparent",
                color: "var(--text-muted)", cursor: listBotLoading ? "not-allowed" : "pointer",
              }}>
                ✍️ Re-Run ListBot — 1 cr
              </button>
              <button onClick={runListBot} style={{
                padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem",
                background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none",
                color: "#fff", cursor: "pointer",
              }}>
                ⚡ MegaBot Lister — 5 cr
              </button>
              {!heroImageUrl && (
                <button onClick={generateHeroImage} disabled={heroImageLoading} style={{
                  padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem",
                  border: "1px solid rgba(0,188,212,0.3)", background: "rgba(0,188,212,0.06)",
                  color: "var(--accent)", cursor: heroImageLoading ? "not-allowed" : "pointer",
                }}>
                  ✨ AI Hero Image — 1 cr
                </button>
              )}
              <button onClick={() => setShowPostAll(true)} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.78rem" }}>
                🚀 Post to All
              </button>
              <a href={`/items/${selectedId}`} style={{
                padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "1px solid var(--border-default)", background: "transparent",
                color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center",
              }}>
                🔙 Back to Item
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
