"use client";

import { useState, useEffect } from "react";

type Props = { initialBalance: number; lifetime: number; spent: number };

const AI_ENGINES = [
  { name: "GPT-4o", color: "#10a37f" },
  { name: "Claude", color: "#8b5cf6" },
  { name: "Gemini", color: "#4285f4" },
  { name: "Grok", color: "#ff6600" },
];

const FEATURED_IDS = ["ai_listing_optimizer", "buyer_outreach_blast", "ai_market_report"];
const TOOL_URLS: Record<string, string> = {
  ai_listing_optimizer: "/addons/listing-optimizer",
  buyer_outreach_blast: "/addons/buyer-outreach",
  ai_market_report: "/addons/market-report",
};

const ADDON_ICONS: Record<string, string> = {
  megabot_analysis: "🧠", expert_appraisal: "💎", text_story: "📖", audio_story: "🎙️",
  video_story: "🎬", legacy_archive_usb: "💾", tech_coaching: "🎓", inventory_report: "📊",
  priority_processing: "⚡", extra_photos: "📸", shipping_kit: "📦", print_story_book: "📚",
  ai_listing_optimizer: "🚀", buyer_outreach_blast: "🎯", ai_market_report: "📊",
  social_media_pack: "📣",
};

const CATEGORY_LABELS: Record<string, string> = {
  "All": "All", "AI Power Tools": "🤖 AI Power Tools", ai: "🤖 AI", legacy: "📖 Legacy & Stories",
  valuation: "💎 Valuation", reporting: "📊 Reports", service: "⚡ Services", photos: "📸 Photos",
  shipping: "📦 Shipping", support: "🎓 Support",
};

export default function MarketplaceClient({ initialBalance, lifetime, spent }: Props) {
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(initialBalance);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [purchaseBanner, setPurchaseBanner] = useState<{ name: string; id: string } | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/addons").then(r => r.json()).then(d => { setAddons(d.addons || []); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/addons/history").then(r => r.json()).then(d => { setOwnedIds((d.purchases || []).map((p: any) => p.addonId)); }).catch(() => {});
  }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  async function handlePurchase(addon: any) {
    if (balance < addon.credits) { showToast("Not enough credits — buy more first."); return; }
    setPurchasing(addon.id);
    try {
      const res = await fetch("/api/addons/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ addonId: addon.id }) });
      if (res.ok) {
        setBalance(b => b - addon.credits);
        setOwnedIds(prev => [...prev, addon.id]);
        if (TOOL_URLS[addon.id]) {
          setPurchaseBanner({ name: addon.name, id: addon.id });
          setTimeout(() => setPurchaseBanner(null), 8000);
        }
        showToast(`✓ ${addon.name} activated!`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || err.error || "Purchase failed");
      }
    } catch { showToast("Network error"); }
    setPurchasing(null);
  }

  const featured = addons.filter(a => FEATURED_IDS.includes(a.id));
  const categories = [...new Set(addons.map(a => a.category))].filter(Boolean);
  const filteredAddons = filter === "All" ? addons : addons.filter(a => a.category === filter || (filter === "AI Power Tools" && (a.category === "ai" || a.category === "AI Power Tools")));

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "rgba(0,188,212,0.95)", color: "#000", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>{toast}</div>
      )}

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.12), transparent)", borderBottom: "1px solid rgba(0,188,212,0.2)", padding: "40px 40px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00bcd4", letterSpacing: 3, marginBottom: 8 }}>TOOLS & SERVICES</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>Add-On Store</h1>
          <p style={{ fontSize: 14, color: "rgba(207,216,220,0.8)", maxWidth: 500, lineHeight: 1.6, margin: 0 }}>Premium AI tools that supercharge your selling. All powered by 4 AI engines working in parallel.</p>
        </div>
        <div style={{ background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>💎</span>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{balance}</div>
            <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)" }}>Credits available</div>
          </div>
          <a href="/credits" style={{ marginLeft: 12, padding: "8px 16px", background: "linear-gradient(135deg, #00bcd4, #0097a7)", color: "#000", fontWeight: 700, fontSize: 11, borderRadius: 8, textDecoration: "none" }}>+ Buy</a>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px 40px", display: "flex", gap: 32, fontSize: 11, color: "rgba(207,216,220,0.5)" }}>
        <span><strong style={{ color: "#fff" }}>{addons.length}</strong> Add-Ons</span>
        <span><strong style={{ color: "#fff" }}>4</strong> AI Engines</span>
        <span><strong style={{ color: "#fff" }}>{featured.length}</strong> Working Now</span>
        <span>New tools added regularly</span>
      </div>

      {/* CATEGORY FILTER */}
      <div style={{ padding: "20px 40px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["All", ...categories].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{ padding: "7px 16px", fontSize: 12, borderRadius: 20, border: filter === cat ? "1px solid #00bcd4" : "1px solid rgba(255,255,255,0.1)", background: filter === cat ? "#00bcd4" : "rgba(255,255,255,0.06)", color: filter === cat ? "#000" : "rgba(255,255,255,0.7)", fontWeight: filter === cat ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* FEATURED — WORKING NOW */}
      {(filter === "All" || filter === "AI Power Tools" || filter === "ai") && featured.length > 0 && (
        <div style={{ padding: "24px 40px 32px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#f5a623", letterSpacing: 2, marginBottom: 16 }}>⚡ POWERED BY 4 AI ENGINES — LIVE NOW</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {featured.map(addon => {
              const owned = ownedIds.includes(addon.id);
              const buying = purchasing === addon.id;
              const toolUrl = TOOL_URLS[addon.id];
              return (
                <div key={addon.id} style={{ background: "linear-gradient(135deg, rgba(0,188,212,0.08), transparent)", border: "1px solid rgba(0,188,212,0.3)", borderRadius: 16, padding: 24, position: "relative", transition: "all 0.2s", cursor: "pointer" }}>
                  <div style={{ position: "absolute", top: 12, right: 12, background: "#f5a623", color: "#000", fontSize: 8, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 1 }}>✓ WORKING NOW</div>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(0,188,212,0.15)", border: "1px solid rgba(0,188,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{ADDON_ICONS[addon.id] || "🔧"}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 14, marginBottom: 8 }}>{addon.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(207,216,220,0.7)", lineHeight: 1.7, marginBottom: 14 }}>{addon.description}</div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Powered by:</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {AI_ENGINES.map(e => <span key={e.name} style={{ fontSize: 8, padding: "2px 8px", borderRadius: 12, background: `${e.color}22`, border: `1px solid ${e.color}44`, color: e.color, fontWeight: 700 }}>{e.name}</span>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>💎 {addon.credits} credits</span>
                    {owned ? (
                      <a href={toolUrl || "#"} style={{ padding: "0 20px", height: 40, display: "inline-flex", alignItems: "center", background: "rgba(76,175,80,0.15)", border: "1px solid #4caf50", color: "#4caf50", fontWeight: 700, fontSize: 12, borderRadius: 8, textDecoration: "none" }}>Launch Tool →</a>
                    ) : (
                      <button onClick={() => handlePurchase(addon)} disabled={buying} style={{ padding: "0 20px", height: 40, background: buying ? "rgba(0,188,212,0.3)" : "linear-gradient(135deg, #00bcd4, #0097a7)", color: "#000", fontWeight: 800, fontSize: 12, borderRadius: 8, border: "none", cursor: buying ? "wait" : "pointer" }}>{buying ? "..." : "Get Add-On"}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post-purchase launch banner */}
      {purchaseBanner && TOOL_URLS[purchaseBanner.id] && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "linear-gradient(135deg, rgba(76,175,80,0.95), rgba(56,142,60,0.95))", color: "#fff", padding: "16px 24px", borderRadius: 14, fontSize: 13, fontWeight: 700, zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.5)", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <span>{purchaseBanner.name} activated!</span>
            <button onClick={() => setPurchaseBanner(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
          </div>
          <a href={TOOL_URLS[purchaseBanner.id]} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 700, fontSize: 12, padding: "8px 16px", borderRadius: 8, textDecoration: "none", justifyContent: "center" }}>Launch Tool Now →</a>
        </div>
      )}

      {/* ALL ADD-ONS GRID */}
      <div style={{ padding: "0 40px 40px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 16 }}>ALL ADD-ONS</div>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 200, background: "rgba(255,255,255,0.04)", borderRadius: 14 }} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredAddons.map(addon => {
              const owned = ownedIds.includes(addon.id);
              const buying = purchasing === addon.id;
              const isFeatured = FEATURED_IDS.includes(addon.id);
              const toolUrl = TOOL_URLS[addon.id];
              return (
                <div key={addon.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, transition: "all 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{ADDON_ICONS[addon.id] || "🔧"}</div>
                    {isFeatured && <span style={{ fontSize: 8, padding: "3px 8px", borderRadius: 20, background: "#f5a623", color: "#000", fontWeight: 700 }}>WORKING NOW</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 10, marginBottom: 6 }}>{addon.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(207,216,220,0.7)", lineHeight: 1.6, marginBottom: 12 }}>{addon.description}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>💎 {addon.credits}</span>
                    {owned ? (
                      toolUrl ? <a href={toolUrl} style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 7, background: "rgba(76,175,80,0.15)", border: "1px solid #4caf50", color: "#4caf50", textDecoration: "none" }}>Launch →</a>
                      : <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 7, background: "rgba(76,175,80,0.15)", border: "1px solid #4caf50", color: "#4caf50" }}>✓ Owned</span>
                    ) : (
                      <button onClick={() => handlePurchase(addon)} disabled={buying} style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 7, background: buying ? "rgba(0,188,212,0.3)" : "linear-gradient(135deg, #00bcd4, #0097a7)", color: "#000", border: "none", cursor: buying ? "wait" : "pointer" }}>{buying ? "..." : "Get Add-On"}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
