"use client";

import { useState } from "react";

type PlatformRecord = {
  platform: string;
  platformUsername: string | null;
  isActive: boolean;
  lastSync: string | null;
};

type Props = {
  connectedPlatforms: PlatformRecord[];
};

const PLATFORMS = [
  { id: "facebook",   name: "Facebook Marketplace", icon: "📘", desc: "Reach local buyers through the #1 local marketplace", maine: false },
  { id: "instagram",  name: "Instagram Shopping",   icon: "📸", desc: "Showcase items to collectors and enthusiasts", maine: false },
  { id: "ebay",       name: "eBay",                 icon: "🛒", desc: "Access 135M buyers for collectibles and antiques", maine: false },
  { id: "craigslist", name: "Craigslist",            icon: "🗞️", desc: "Classic local classifieds with broad reach", maine: false },
  { id: "unclehenrys",name: "Uncle Henry's",         icon: "🦞", desc: "Maine's #1 local buy-sell publication since 1970", maine: true },
  { id: "offerup",    name: "OfferUp",               icon: "🤝", desc: "Mobile-first marketplace with buyer verification", maine: false },
  { id: "mercari",    name: "Mercari",               icon: "📦", desc: "Fast-growing platform for all categories", maine: false },
  { id: "poshmark",   name: "Poshmark",              icon: "👗", desc: "Best for clothing, accessories, and fashion items", maine: false },
  { id: "etsy",       name: "Etsy",                  icon: "🎨", desc: "Ideal for vintage, handmade, and unique items", maine: false },
  { id: "nextdoor",   name: "Nextdoor",              icon: "🏘️", desc: "Hyperlocal sales to verified neighbors", maine: false },
];

const CARD: React.CSSProperties = {
  background: "var(--bg-card-solid)",
  border: "1px solid var(--border-default)",
  borderRadius: "1.25rem",
  padding: "1.5rem",
};

export default function IntegrationsClient({ connectedPlatforms }: Props) {
  const [platformMap, setPlatformMap] = useState<Record<string, PlatformRecord>>(() => {
    const map: Record<string, PlatformRecord> = {};
    for (const p of connectedPlatforms) map[p.platform] = p;
    return map;
  });

  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [autoPublish, setAutoPublish] = useState(true);
  const [autoPricing, setAutoPricing] = useState(false);
  const [autoSold, setAutoSold] = useState(true);
  const [platformToggles, setPlatformToggles] = useState<Record<string, boolean>>({});
  const [publishing, setPublishing] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  function isConnected(id: string) {
    return platformMap[id]?.isActive === true;
  }

  async function connect(platformId: string) {
    setConnecting(platformId);
    // Simulate brief loading
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId }),
      });
      if (res.ok) {
        setPlatformMap((prev) => ({
          ...prev,
          [platformId]: {
            platform: platformId,
            platformUsername: null,
            isActive: true,
            lastSync: new Date().toISOString(),
          },
        }));
        const p = PLATFORMS.find((x) => x.id === platformId)!;
        showToast(`✅ Connected to ${p.name}!`);
      }
    } finally {
      setConnecting(null);
    }
  }

  async function disconnect(platformId: string) {
    setDisconnecting(platformId);
    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId }),
      });
      if (res.ok) {
        setPlatformMap((prev) => ({
          ...prev,
          [platformId]: { ...prev[platformId], isActive: false },
        }));
        const p = PLATFORMS.find((x) => x.id === platformId)!;
        showToast(`Disconnected from ${p.name}`);
      }
    } finally {
      setDisconnecting(null);
    }
  }

  async function bulkPublish() {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setPublishing(false);
    const active = PLATFORMS.filter((p) => isConnected(p.id));
    showToast(`✅ Published to ${active.length} platforms successfully!`);
  }

  const connectedCount = PLATFORMS.filter((p) => isConnected(p.id)).length;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 100,
          background: "#0f766e", color: "#fff", padding: "0.75rem 1.25rem",
          borderRadius: "0.75rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          fontSize: "0.9rem",
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Settings</div>
        <h1 className="h1 mt-2">Platform Integrations</h1>
        <p className="muted mt-1">Connect your selling platforms to publish and sync listings automatically</p>
      </div>

      {/* Stats bar */}
      <div style={{ ...CARD, marginBottom: "2rem", background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", borderColor: "#86efac", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0f766e" }}>{connectedCount}</div>
          <div style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 600 }}>Connected</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)" }}>{PLATFORMS.length - connectedCount}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600 }}>Available</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#7c3aed" }}>10</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 600 }}>Total Platforms</div>
        </div>
        {connectedCount > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <div style={{ padding: "0.3rem 0.75rem", background: "#dcfce7", color: "#16a34a", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 700 }}>
              ✓ {connectedCount} platform{connectedCount !== 1 ? "s" : ""} active
            </div>
          </div>
        )}
      </div>

      {/* Platform cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {PLATFORMS.map((plat) => {
          const connected = isConnected(plat.id);
          const record = platformMap[plat.id];
          const isConn = connecting === plat.id;
          const isDisconn = disconnecting === plat.id;

          return (
            <div
              key={plat.id}
              style={{
                ...CARD,
                border: connected ? "2px solid #86efac" : "1px solid #e7e5e4",
                background: connected ? "linear-gradient(135deg, #f0fdf4, var(--bg-card-solid))" : "var(--bg-card-solid)",
                position: "relative",
              }}
            >
              {plat.maine && (
                <div style={{
                  position: "absolute", top: "1rem", right: "1rem",
                  background: "#fef3c7", color: "#92400e", padding: "0.15rem 0.5rem",
                  borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700,
                  border: "1px solid #fcd34d",
                }}>
                  🦞 Maine Exclusive
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ fontSize: "2.25rem", flexShrink: 0 }}>{plat.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{plat.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem", lineHeight: 1.4 }}>{plat.desc}</div>

                  {connected && record && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#166534" }}>
                      ✅ Connected
                      {record.lastSync && (
                        <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                          · Last sync {new Date(record.lastSync).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                {!connected ? (
                  <button
                    onClick={() => connect(plat.id)}
                    disabled={isConn}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      background: isConn ? "#e7e5e4" : "#0f766e",
                      color: isConn ? "var(--text-muted)" : "#fff",
                      border: "none",
                      borderRadius: "0.6rem",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: isConn ? "not-allowed" : "pointer",
                    }}
                  >
                    {isConn ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                        <span style={{ width: "12px", height: "12px", border: "2px solid var(--text-muted)", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                        Connecting...
                      </span>
                    ) : "🔗 Connect"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => showToast(`⚙️ ${plat.name} settings coming soon!`)}
                      style={{ flex: 1, padding: "0.5rem", background: "#f5f5f4", color: "var(--text-primary)", border: "none", borderRadius: "0.6rem", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      onClick={() => disconnect(plat.id)}
                      disabled={isDisconn}
                      style={{ padding: "0.5rem 0.75rem", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "0.6rem", fontWeight: 600, fontSize: "0.82rem", cursor: isDisconn ? "not-allowed" : "pointer" }}
                    >
                      {isDisconn ? "..." : "Disconnect"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Platform Publishing */}
      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🚀</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Cross-Platform Publishing</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Publish to all connected platforms with one click</div>
          </div>
        </div>

        {/* Global toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem", padding: "1rem", background: "#f9f9f8", borderRadius: "0.75rem" }}>
          {[
            { label: "Auto-publish new items", value: autoPublish, set: setAutoPublish },
            { label: "Auto-update pricing when market changes", value: autoPricing, set: setAutoPricing },
            { label: "Auto-mark as sold when completed", value: autoSold, set: setAutoSold },
          ].map(({ label, value, set }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{label}</span>
              <button
                onClick={() => set(!value)}
                style={{
                  width: "44px", height: "24px",
                  background: value ? "#0f766e" : "#d1d5db",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute",
                  top: "2px",
                  left: value ? "22px" : "2px",
                  width: "20px", height: "20px",
                  background: "#fff",
                  borderRadius: "50%",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>
          ))}
        </div>

        {/* Per-platform toggles */}
        {connectedCount > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              Auto-publish to:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {PLATFORMS.filter((p) => isConnected(p.id)).map((plat) => (
                <div key={plat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.75rem", background: "#f0fdf4", borderRadius: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem" }}>{plat.icon} {plat.name}</span>
                  <button
                    onClick={() => setPlatformToggles((prev) => ({ ...prev, [plat.id]: !prev[plat.id] }))}
                    style={{
                      width: "36px", height: "20px",
                      background: platformToggles[plat.id] === false ? "#d1d5db" : "#0f766e",
                      borderRadius: "9999px",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <span style={{
                      position: "absolute",
                      top: "2px",
                      left: platformToggles[plat.id] === false ? "2px" : "18px",
                      width: "16px", height: "16px",
                      background: "#fff",
                      borderRadius: "50%",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={bulkPublish}
          disabled={publishing || connectedCount === 0}
          style={{
            width: "100%",
            padding: "0.85rem",
            background: connectedCount === 0 ? "#e7e5e4" : publishing ? "#0f766e" : "#0f766e",
            color: connectedCount === 0 ? "var(--text-muted)" : "#fff",
            border: "none",
            borderRadius: "0.75rem",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: connectedCount === 0 ? "not-allowed" : "pointer",
            opacity: publishing ? 0.8 : 1,
          }}
        >
          {publishing ? "⏳ Publishing..." : connectedCount === 0 ? "Connect platforms to publish" : `🚀 Bulk Publish to ${connectedCount} Platform${connectedCount !== 1 ? "s" : ""}`}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
