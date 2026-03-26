"use client";

import { useState, useEffect, useCallback } from "react";

// ── Platform definitions ────────────────────────────────────────────────────

const PLATFORMS = [
  { key: "ebay", name: "eBay", color: "#e53238", icon: "\ud83d\uded2", url: "https://www.ebay.com/sl/sell", apiStatus: "coming_soon", category: "marketplace", tip: "Best for collectibles, electronics, and rare items" },
  { key: "facebook_marketplace", name: "Facebook Marketplace", color: "#1877f2", icon: "\ud83d\udcd8", url: "https://www.facebook.com/marketplace/create/item", apiStatus: "coming_soon", category: "social", tip: "Best for local pickup and furniture" },
  { key: "instagram", name: "Instagram", color: "#e1306c", icon: "\ud83d\udcf8", url: "https://www.instagram.com", apiStatus: "coming_soon", category: "social", tip: "Best for visual items, fashion, and collectibles" },
  { key: "tiktok", name: "TikTok Shop", color: "#010101", icon: "\ud83c\udfb5", url: "https://shop.tiktok.com", apiStatus: "coming_soon", category: "social", tip: "Best for trending items and younger buyers" },
  { key: "etsy", name: "Etsy", color: "#f1641e", icon: "\ud83c\udfa8", url: "https://www.etsy.com/sell/post", apiStatus: "coming_soon", category: "marketplace", tip: "Best for handmade, vintage, and unique items" },
  { key: "craigslist", name: "Craigslist", color: "#592d8c", icon: "\ud83d\udccb", url: "https://post.craigslist.org", apiStatus: "copy_only", category: "local", tip: "Best for large items and local cash sales" },
  { key: "offerup", name: "OfferUp", color: "#34a853", icon: "\ud83d\udc9a", url: "https://offerup.com/post", apiStatus: "coming_soon", category: "marketplace", tip: "Best for local sales and quick cash" },
  { key: "mercari", name: "Mercari", color: "#d5001c", icon: "\ud83c\udfea", url: "https://www.mercari.com/sell", apiStatus: "coming_soon", category: "marketplace", tip: "Best for clothing, toys, and everyday items" },
  { key: "poshmark", name: "Poshmark", color: "#cc2f5c", icon: "\ud83d\udc57", url: "https://poshmark.com/create-listing", apiStatus: "coming_soon", category: "marketplace", tip: "Best for clothing, shoes, and accessories" },
  { key: "reverb", name: "Reverb", color: "#298dff", icon: "\ud83c\udfb8", url: "https://reverb.com/sell/listings/new", apiStatus: "coming_soon", category: "marketplace", tip: "Best for musical instruments and gear" },
  { key: "pinterest", name: "Pinterest", color: "#e60023", icon: "\ud83d\udccc", url: "https://pinterest.com/pin/create/button", apiStatus: "coming_soon", category: "social", tip: "Best for home decor, art, and inspiration items" },
  { key: "amazon", name: "Amazon", color: "#ff9900", icon: "\ud83d\udce6", url: "https://sellercentral.amazon.com", apiStatus: "coming_soon", category: "marketplace", tip: "Best for books, electronics, and branded items" },
];

const CATEGORY_LABELS: Record<string, string> = { marketplace: "Marketplaces", social: "Social", local: "Local", platform: "Platform" };
const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  READY: { bg: "var(--ghost-bg)", color: "var(--text-muted)", label: "Ready" },
  COPIED: { bg: "rgba(0,188,212,0.12)", color: "#00bcd4", label: "Copied" },
  POSTED: { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Posted" },
  LIVE: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Live" },
  SOLD: { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6", label: "Sold" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function getPlatformListing(listBotResult: any, megaBotResult: any, platformKey: string, itemData: any) {
  // Priority 1: MegaBot listing result
  if (megaBotResult) {
    const mbListings = megaBotResult?.consensus?.listings || megaBotResult?.listings || {};
    for (const [key, val] of Object.entries(mbListings)) {
      if (key.toLowerCase().replace(/[\s_-]/g, "").includes(platformKey.replace(/_/g, ""))) return val as any;
    }
    // Try providers
    if (megaBotResult?.providers) {
      for (const prov of megaBotResult.providers) {
        const provListings = prov?.result?.listings || {};
        for (const [key, val] of Object.entries(provListings)) {
          if (key.toLowerCase().replace(/[\s_-]/g, "").includes(platformKey.replace(/_/g, ""))) return val as any;
        }
      }
    }
  }
  // Priority 2: Single ListBot result
  if (listBotResult?.listings) {
    for (const [key, val] of Object.entries(listBotResult.listings)) {
      if (key.toLowerCase().replace(/[\s_-]/g, "").includes(platformKey.replace(/_/g, ""))) return val as any;
    }
  }
  // Priority 3: Fallback from item data
  return {
    title: listBotResult?.best_title_overall || itemData?.title || "Untitled Item",
    description: listBotResult?.description || itemData?.description || "",
    price: listBotResult?.suggested_price || itemData?.price || 0,
    tags: listBotResult?.hashtags || [],
    posting_tip: null,
  };
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  itemId: string;
  itemTitle: string;
  itemPhoto: string | null;
  itemPrice: number | null;
  listBotResult: any;
  megaBotResult: any;
  initialStatuses: any[];
  userId: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PublishHubClient({ itemId, itemTitle, itemPhoto, itemPrice, listBotResult, megaBotResult, initialStatuses, userId }: Props) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const s of initialStatuses) map[s.platform] = s.status;
    return map;
  });
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showStrategy, setShowStrategy] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [launchMode, setLaunchMode] = useState(false);
  const [launchStep, setLaunchStep] = useState(0);

  const hasListingData = !!listBotResult || !!megaBotResult;
  const allPlatforms = [...PLATFORMS, { key: "legacyloop", name: "LegacyLoop Storefront", color: "#00bcd4", icon: "\ud83d\udd04", url: `/store/${userId}`, apiStatus: "live", category: "platform", tip: "Your personal LegacyLoop storefront \u2014 already live!" }];
  const filtered = filter === "all" ? allPlatforms : allPlatforms.filter((p) => p.category === filter);

  const copiedCount = Object.values(statuses).filter((s) => s === "COPIED" || s === "POSTED" || s === "LIVE").length;
  const postedCount = Object.values(statuses).filter((s) => s === "POSTED" || s === "LIVE").length;
  const totalPlatforms = allPlatforms.length;

  // Strategy/SEO data from MegaBot or ListBot
  const strategy = megaBotResult?.consensus?.cross_platform_strategy || megaBotResult?.cross_platform_strategy || listBotResult?.cross_platform_strategy || null;
  const seoData = megaBotResult?.consensus?.seo_master || megaBotResult?.seo_master || listBotResult?.seo_master || null;
  const execSummary = megaBotResult?.consensus?.executive_summary || megaBotResult?.executive_summary || listBotResult?.executive_summary || null;
  const globalHashtags = megaBotResult?.consensus?.hashtags || megaBotResult?.hashtags || listBotResult?.hashtags || [];
  const bestTitle = megaBotResult?.consensus?.best_title_overall || megaBotResult?.best_title_overall || listBotResult?.best_title_overall || itemTitle;

  const copyToClipboard = useCallback(async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
      // Save status
      fetch("/api/listings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, platform, status: "COPIED", listingTitle: text.slice(0, 100) }),
      }).catch(() => {});
      setStatuses((prev) => ({ ...prev, [platform]: prev[platform] === "POSTED" ? "POSTED" : "COPIED" }));
    } catch { /* clipboard not available */ }
  }, [itemId]);

  const markPosted = useCallback(async (platform: string) => {
    fetch("/api/listings/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, platform, status: "POSTED" }),
    }).catch(() => {});
    setStatuses((prev) => ({ ...prev, [platform]: "POSTED" }));
  }, [itemId]);

  const copyAllPlatforms = useCallback(async () => {
    const lines: string[] = [`\u2550\u2550\u2550 ${itemTitle} \u2014 LegacyLoop Publish Hub \u2550\u2550\u2550\n`];
    for (const p of allPlatforms) {
      const listing = getPlatformListing(listBotResult, megaBotResult, p.key, { title: itemTitle, price: itemPrice });
      lines.push(`\u2500\u2500\u2500 ${p.name} \u2500\u2500\u2500`);
      lines.push(`Title: ${listing?.title || itemTitle}`);
      lines.push(`Price: $${listing?.price || itemPrice || 0}`);
      lines.push(`Description: ${listing?.description || ""}`);
      if (listing?.tags?.length) lines.push(`Tags: ${listing.tags.join(", ")}`);
      lines.push("");
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedPlatform("__all__");
      setTimeout(() => setCopiedPlatform(null), 3000);
    } catch { /* ignore */ }
  }, [allPlatforms, itemTitle, itemPrice, listBotResult, megaBotResult]);

  // ── No listing data fallback ──
  if (!hasListingData) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{"\ud83d\udccb"}</div>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>No Listings Generated Yet</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", maxWidth: 440, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
          Run ListBot first to generate optimized listings for all platforms. Then come back here to publish everywhere at once.
        </p>
        <a href={`/items/${itemId}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", fontWeight: 700, fontSize: "0.88rem", borderRadius: "0.5rem", textDecoration: "none", minHeight: "48px" }}>
          Run ListBot {"\u2192"}
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 100px" }}>
      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.08), transparent)", borderBottom: "1px solid rgba(0,188,212,0.12)", padding: "24px 0 20px", marginBottom: "20px" }}>
        <a href={`/items/${itemId}`} style={{ display: "inline-block", marginBottom: "12px", fontSize: "0.78rem", color: "var(--text-muted)", textDecoration: "none", border: "1px solid var(--border-default)", borderRadius: "0.4rem", padding: "0.35rem 0.75rem" }}>{"\u2190"} Back to Item</a>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {itemPhoto && <img src={itemPhoto} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: "2px solid rgba(0,188,212,0.3)" }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>{itemTitle}</h1>
            {itemPrice != null && <div style={{ color: "#00bcd4", fontWeight: 700, fontSize: "1.25rem" }}>${itemPrice}</div>}
          </div>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { n: totalPlatforms, label: "platforms" },
          { n: copiedCount, label: "copied" },
          { n: postedCount, label: "posted" },
        ].map((s, i) => (
          <span key={i} style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: 20, padding: "6px 14px", fontSize: 11, color: "rgba(207,216,220,0.7)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#fff", fontWeight: 700 }}>{s.n}</span> {s.label}
          </span>
        ))}
      </div>

      {/* ── LAUNCH ALL WIZARD ── */}
      {hasListingData && !launchMode && (
        <button
          onClick={() => { setLaunchStep(0); setLaunchMode(true); }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            width: "100%", padding: "0.7rem 1.5rem", fontSize: "0.82rem", fontWeight: 700,
            background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff",
            border: "none", borderRadius: "0.6rem", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(34,197,94,0.3)", transition: "all 0.2s ease",
            marginBottom: "0.75rem", minHeight: "48px",
          }}
        >
          🚀 Launch All Listings — {totalPlatforms} Platforms
        </button>
      )}

      {launchMode && (
        <div style={{
          padding: "0.75rem", borderRadius: "0.6rem", marginBottom: "0.75rem",
          background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22c55e" }}>
              🚀 LAUNCH WIZARD — Step {launchStep + 1} of {filtered.length}
            </div>
            <button onClick={() => setLaunchMode(false)} style={{ fontSize: "0.55rem", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}>✕ Exit</button>
          </div>
          <div style={{ height: "4px", background: "var(--ghost-bg)", borderRadius: "2px", marginBottom: "0.5rem", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "2px", background: "linear-gradient(90deg, #22c55e, #16a34a)", width: `${((launchStep + 1) / Math.max(filtered.length, 1)) * 100}%`, transition: "width 0.3s ease" }} />
          </div>
          {filtered[launchStep] && (() => {
            const p = filtered[launchStep];
            const listing = getPlatformListing(listBotResult, megaBotResult, p.key, { title: itemTitle, price: itemPrice, photo: itemPhoto });
            const fullText = listing ? [listing.title, listing.description, listing.description_html, listing.caption].filter(Boolean).join("\n\n") : itemTitle;
            return (
              <div style={{ padding: "0.5rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                  {p.icon} {p.name}
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <button onClick={() => copyToClipboard(fullText, p.key)} style={{ padding: "0.35rem 0.7rem", fontSize: "0.6rem", fontWeight: 600, background: "linear-gradient(135deg, #00bcd4, #00acc1)", color: "#fff", border: "none", borderRadius: "0.35rem", cursor: "pointer" }}>
                    📋 Copy Listing
                  </button>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ padding: "0.35rem 0.7rem", fontSize: "0.6rem", fontWeight: 600, color: "#00bcd4", border: "1px solid rgba(0,188,212,0.3)", borderRadius: "0.35rem", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                    🌐 Open {p.name} ↗
                  </a>
                  <button onClick={() => {
                    markPosted(p.key);
                    if (launchStep < filtered.length - 1) setLaunchStep(s => s + 1);
                    else setLaunchMode(false);
                  }} style={{ padding: "0.35rem 0.7rem", fontSize: "0.6rem", fontWeight: 600, background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", border: "none", borderRadius: "0.35rem", cursor: "pointer", marginLeft: "auto" }}>
                    {launchStep < filtered.length - 1 ? "✅ Done — Next →" : "✅ All Done!"}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── COMMAND CENTER ── */}
      <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: 12, padding: "14px 18px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={copyAllPlatforms} style={{ padding: "0 20px", minHeight: 46, minWidth: 200, background: copiedPlatform === "__all__" ? "rgba(0,188,212,0.15)" : "linear-gradient(135deg, #00bcd4, #0097a7)", color: copiedPlatform === "__all__" ? "#00bcd4" : "#000", fontWeight: 700, fontSize: 13, borderRadius: 10, border: "none", cursor: "pointer" }}>
          {copiedPlatform === "__all__" ? "\u2713 All Platforms Copied!" : `\ud83d\udccb Copy All ${totalPlatforms} Platforms`}
        </button>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["all", "marketplace", "social", "local", "platform"].map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)} style={{ fontSize: 10, padding: "6px 14px", borderRadius: 20, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: filter === cat ? 700 : 600, background: filter === cat ? "#00bcd4" : "transparent", color: filter === cat ? "#000" : "var(--text-muted)", border: filter === cat ? "none" : "1px solid var(--border-default)" }}>
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI STRATEGY ── */}
      {strategy && (
        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
          <button onClick={() => setShowStrategy(!showStrategy)} style={{ width: "100%", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", borderBottom: "1px solid var(--border-default)", cursor: "pointer", color: "var(--text-primary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ background: "rgba(0,188,212,0.12)", color: "#00bcd4", padding: "0.15rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.65rem", fontWeight: 700 }}>AI STRATEGY</span>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Cross-Platform Strategy</span>
            </span>
            <span style={{ fontSize: "0.7rem", color: "#00bcd4" }}>{showStrategy ? "\u25B2" : "\u25BC"}</span>
          </button>
          {showStrategy && (
            <div style={{ padding: "0 1.25rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {typeof strategy === "string" ? strategy : JSON.stringify(strategy, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* ── SEO KEYWORDS ── */}
      {(seoData || globalHashtags.length > 0) && (
        <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
          <button onClick={() => setShowSeo(!showSeo)} style={{ width: "100%", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", borderBottom: "1px solid var(--border-default)", cursor: "pointer", color: "var(--text-primary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ background: "rgba(0,188,212,0.12)", color: "#00bcd4", padding: "0.15rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.65rem", fontWeight: 700 }}>SEO</span>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Keywords & Hashtags</span>
            </span>
            <span style={{ fontSize: "0.7rem", color: "#00bcd4" }}>{showSeo ? "\u25B2" : "\u25BC"}</span>
          </button>
          {showSeo && (
            <div style={{ padding: "0 1.25rem 1rem" }}>
              {globalHashtags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                  {globalHashtags.map((tag: string, i: number) => (
                    <button key={i} onClick={() => copyToClipboard(tag, `tag_${i}`)} style={{ padding: "6px 14px", fontSize: 11, fontWeight: 600, borderRadius: 20, background: copiedPlatform === `tag_${i}` ? "rgba(0,188,212,0.2)" : "rgba(0,188,212,0.08)", color: "#00bcd4", border: "1px solid rgba(0,188,212,0.35)", cursor: "pointer" }}>
                      {copiedPlatform === `tag_${i}` ? "\u2713" : ""} {tag.startsWith("#") ? tag : `#${tag}`}
                    </button>
                  ))}
                </div>
              )}
              {seoData && typeof seoData === "object" && (
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {seoData.primary_keywords && <div style={{ marginBottom: "0.4rem" }}><strong>Primary:</strong> {Array.isArray(seoData.primary_keywords) ? seoData.primary_keywords.join(", ") : String(seoData.primary_keywords)}</div>}
                  {seoData.trending_keywords && <div style={{ marginBottom: "0.4rem" }}><strong>Trending:</strong> {Array.isArray(seoData.trending_keywords) ? seoData.trending_keywords.join(", ") : String(seoData.trending_keywords)}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PLATFORM GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
        {filtered.map((platform) => {
          const listing = getPlatformListing(listBotResult, megaBotResult, platform.key, { title: itemTitle, price: itemPrice });
          const status = statuses[platform.key] || "READY";
          const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.READY;
          const isCopied = copiedPlatform === platform.key;
          const isExpanded = expanded[platform.key];

          return (
            <div key={platform.key} style={{ background: "var(--bg-card)", borderRadius: 14, borderLeft: `4px solid ${platform.color}`, borderTop: "1px solid var(--border-default)", borderRight: "1px solid var(--border-default)", borderBottom: "1px solid var(--border-default)", padding: "18px 20px", transition: "border-color 0.2s" }}>
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{platform.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{platform.name}</div>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.15rem" }}>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
                    {platform.apiStatus === "live" && <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "0.25rem", background: "rgba(16,185,129,0.12)", color: "#10b981" }}>Live</span>}
                  </div>
                </div>
                {listing?.price && <div style={{ color: "#00bcd4", fontWeight: 700, fontSize: 18 }}>${listing.price}</div>}
              </div>

              {/* Card Body */}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.5 }}>{listing?.title || bestTitle}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, overflow: "hidden", maxHeight: isExpanded ? "none" : "3.4em" }}>
                  {listing?.description || ""}
                </div>
                {listing?.description?.length > 120 && (
                  <button onClick={() => setExpanded((p) => ({ ...p, [platform.key]: !p[platform.key] }))} style={{ fontSize: "0.68rem", color: "#00bcd4", background: "none", border: "none", cursor: "pointer", padding: "0.2rem 0", fontWeight: 600 }}>
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
                {listing?.tags?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {(listing.tags as string[]).slice(0, 6).map((tag: string, i: number) => (
                      <span key={i} style={{ fontSize: 10, padding: "4px 10px", borderRadius: "9999px", background: "rgba(0,188,212,0.06)", color: "var(--text-muted)", border: "1px solid rgba(0,188,212,0.12)" }}>{tag.startsWith("#") ? tag : `#${tag}`}</span>
                    ))}
                  </div>
                )}
                {listing?.hook_line && (
                  <div style={{ fontSize: "0.68rem", color: "#00bcd4", fontStyle: "italic", borderLeft: "2px solid #00bcd4", paddingLeft: 10, margin: "8px 0", lineHeight: 1.4 }}>{listing.hook_line}</div>
                )}
                {listing?.posting_tip && (
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", margin: "6px 0 10px", display: "flex", alignItems: "flex-start", gap: "0.25rem" }}>
                    <span>{"\ud83d\udca1"}</span><span>{listing.posting_tip}</span>
                  </div>
                )}
                <div style={{ fontSize: "0.6rem", color: platform.color, fontStyle: "italic", marginTop: "0.35rem", opacity: 0.7 }}>{platform.tip}</div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "12px" }}>
                {status !== "POSTED" && status !== "LIVE" ? (
                  <button
                    onClick={() => {
                      const text = `${listing?.title || bestTitle}\n\n${listing?.description || ""}\n\nPrice: $${listing?.price || itemPrice || 0}\n\n${(listing?.tags || []).map((t: string) => t.startsWith("#") ? t : `#${t}`).join(" ")}`;
                      copyToClipboard(text, platform.key);
                    }}
                    style={{ width: "100%", padding: "0.65rem", minHeight: 44, background: isCopied ? "transparent" : `linear-gradient(135deg, ${platform.color}, ${platform.color}cc)`, color: isCopied ? "#00bcd4" : "#fff", fontWeight: 700, fontSize: 12, borderRadius: 9, border: isCopied ? "1px solid #00bcd4" : "none", cursor: "pointer", marginBottom: 8, transition: "all 0.2s" }}
                  >
                    {isCopied ? `\u2713 Copied \u2014 Open ${platform.name} \u2192` : status === "COPIED" ? `\u2713 Copied \u00b7 Open ${platform.name} \u2192` : `\ud83d\udccb Copy for ${platform.name}`}
                  </button>
                ) : (
                  <div style={{ width: "100%", padding: "0.65rem", minHeight: 44, background: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 700, fontSize: 12, borderRadius: 9, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {"\u2713"} Posted to {platform.name}
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {(status === "COPIED" || isCopied) && status !== "POSTED" && (
                    <>
                      <a href={platform.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "0.4rem", fontSize: 10, fontWeight: 600, textAlign: "center", borderRadius: 6, border: "1px solid var(--border-default)", color: "var(--text-secondary)", textDecoration: "none", cursor: "pointer" }}>
                        Open {platform.name} {"\u2192"}
                      </a>
                      <button onClick={() => markPosted(platform.key)} style={{ flex: 1, height: 32, fontSize: 10, fontWeight: 600, borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)", color: "#10b981", cursor: "pointer" }}>
                        Mark as Posted {"\u2713"}
                      </button>
                    </>
                  )}
                  <button onClick={() => copyToClipboard(listing?.title || bestTitle, `title_${platform.key}`)} title="Copy title" style={{ height: 28, fontSize: 10, borderRadius: 6, padding: "0 10px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>{copiedPlatform === `title_${platform.key}` ? "\u2713" : "\ud83d\udccb"}</button>
                  <button onClick={() => copyToClipboard((listing?.tags || []).join(" "), `tags_${platform.key}`)} title="Copy tags" style={{ height: 28, fontSize: 10, borderRadius: 6, padding: "0 10px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>{copiedPlatform === `tags_${platform.key}` ? "\u2713" : "\ud83c\udff7\ufe0f"}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── EXECUTIVE SUMMARY ── */}
      {execSummary && (
        <div style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 12, padding: "18px 22px", marginBottom: 20 }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontSize: 10, background: "#f5a623", color: "#0a1929", borderRadius: 4, padding: "3px 8px", display: "inline-block", marginBottom: 10, fontWeight: 700 }}>AI SUMMARY</span>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)", marginLeft: "0.5rem" }}>Executive Summary</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{execSummary}</p>
        </div>
      )}

      {/* ── 4 AI COMPARISON ── */}
      {megaBotResult?.providers && megaBotResult.providers.length > 1 && (() => {
        const providers = megaBotResult.providers.filter((p: any) => p.result?.listings);
        if (providers.length < 2) return null;
        const [activeAI, setActiveAI] = [expanded["__ai_tab__"] as any || providers[0]?.provider, (v: string) => setExpanded((p) => ({ ...p, "__ai_tab__": v as any }))];
        return (
          <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ padding: "0.75rem 1.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(0,188,212,0.12)", color: "#00bcd4", padding: "0.15rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.65rem", fontWeight: 700 }}>4 AI ENGINES</span>
              {providers.map((prov: any) => (
                <button key={prov.provider} onClick={() => setActiveAI(prov.provider)} style={{ fontSize: 10, padding: "6px 16px", borderRadius: 20, cursor: "pointer", textTransform: "capitalize", fontWeight: activeAI === prov.provider ? 700 : 600, background: activeAI === prov.provider ? "#00bcd4" : "transparent", color: activeAI === prov.provider ? "#000" : "var(--text-muted)", border: activeAI === prov.provider ? "none" : "1px solid var(--border-default)" }}>
                  {prov.provider}
                </button>
              ))}
            </div>
            <div style={{ padding: "0.75rem 1.25rem" }}>
              {providers.filter((p: any) => p.provider === activeAI).map((prov: any) => {
                const provListings = prov.result?.listings || {};
                const topKeys = Object.keys(provListings).slice(0, 3);
                return (
                  <div key={prov.provider} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {topKeys.map((pk) => {
                      const lst = provListings[pk] as any;
                      return (
                        <div key={pk} style={{ padding: "0.5rem 0.7rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderLeft: "3px solid #00bcd4", borderRadius: 8, marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>{pk}</span>
                            {lst?.price && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00bcd4" }}>${lst.price}</span>}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{lst?.title || ""}</div>
                        </div>
                      );
                    })}
                    {prov.result?.executive_summary && (
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.5, marginTop: "0.25rem", borderLeft: "2px solid #00bcd4", paddingLeft: 14, borderRadius: 6 }}>{prov.result.executive_summary}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── PROGRESS TRACKER (sticky bottom) ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(13,31,45,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(0,188,212,0.15)", padding: "12px 28px", zIndex: 100, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 2, background: "var(--ghost-bg)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round((copiedCount / totalPlatforms) * 100)}%`, background: "linear-gradient(90deg, #00bcd4, #009688)", borderRadius: 2, transition: "width 0.4s ease" }} />
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
          <span style={{ color: "#00bcd4", fontWeight: 700 }}>{copiedCount}</span>/{totalPlatforms} platforms reached
        </span>
      </div>
    </div>
  );
}
