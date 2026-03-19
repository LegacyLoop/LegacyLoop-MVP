"use client";

import { useState } from "react";

/* ── Types ── */
type Platform = {
  id: string;
  platform: string;
  platformUsername: string | null;
  isActive: boolean;
  lastSync: string | null;
};

type Props = {
  connectedPlatforms: Platform[];
};

type CardDef = {
  key: string;
  name: string;
  color: string;
  purpose: string;
  icon: string; // emoji for simplicity in demo
};

/* ── Platform definitions ── */

const SOCIAL_MEDIA: CardDef[] = [
  { key: "facebook",  name: "Facebook",  color: "#1877f2", purpose: "Marketplace listings, buyer outreach", icon: "f" },
  { key: "instagram", name: "Instagram", color: "#e1306c", purpose: "Story posts, visual listings", icon: "IG" },
  { key: "twitter",   name: "X (Twitter)", color: "#fff", purpose: "Item promotion, buyer discovery", icon: "X" },
  { key: "tiktok",    name: "TikTok",    color: "#ff0050", purpose: "Video listings, viral reach", icon: "TT" },
  { key: "pinterest", name: "Pinterest", color: "#e60023", purpose: "Visual discovery, shopping pins", icon: "P" },
  { key: "linkedin",  name: "LinkedIn",  color: "#0a66c2", purpose: "B2B estate services", icon: "in" },
  { key: "snapchat",  name: "Snapchat",  color: "#fffc00", purpose: "AR try-on, story promotion", icon: "S" },
  { key: "discord",   name: "Discord",   color: "#5865f2", purpose: "Community, notifications", icon: "D" },
  { key: "nextdoor",  name: "Nextdoor",  color: "#8ed500", purpose: "Local buyer outreach", icon: "N" },
];

const MARKETPLACES: CardDef[] = [
  { key: "ebay",       name: "eBay",                color: "#e53238", purpose: "Cross-listing, price comparisons, sold data", icon: "eB" },
  { key: "mercari",    name: "Mercari",             color: "#ff0211", purpose: "Cross-listing, buyer matching", icon: "M" },
  { key: "poshmark",   name: "Poshmark",            color: "#c80a50", purpose: "Fashion and clothing listings", icon: "PM" },
  { key: "offerup",    name: "OfferUp",             color: "#00ab80", purpose: "Local sales, buyer matching", icon: "OU" },
  { key: "craigslist", name: "Craigslist",          color: "#5b00a1", purpose: "Local classified listings", icon: "CL" },
  { key: "etsy",       name: "Etsy",                color: "#f56400", purpose: "Vintage and handmade items", icon: "Et" },
  { key: "fb_marketplace", name: "FB Marketplace",  color: "#1877f2", purpose: "Local and shipped sales", icon: "FM" },
];

const PAYMENTS: CardDef[] = [
  { key: "square",   name: "Square",        color: "#00bcd4", purpose: "Payment processing, buyer checkout", icon: "Sq" },
  { key: "paypal",   name: "PayPal",       color: "#003087", purpose: "Alternative payment collection", icon: "PP" },
  { key: "bank_ach", name: "Bank (ACH)",   color: "#00bcd4", purpose: "Direct deposit of earnings", icon: "$$" },
  { key: "venmo",    name: "Venmo",        color: "#3d95ce", purpose: "Person-to-person payments", icon: "V" },
  { key: "zelle",    name: "Zelle",        color: "#6d1ed4", purpose: "Person-to-person payments", icon: "Z" },
  { key: "cashapp",  name: "Cash App",     color: "#00d632", purpose: "Person-to-person payments", icon: "CA" },
];

const CLOUD: CardDef[] = [
  { key: "google_drive", name: "Google Drive", color: "#4285f4", purpose: "Photo import, document storage", icon: "G" },
  { key: "icloud",       name: "iCloud",       color: "#3e94d9", purpose: "Photo import", icon: "iC" },
  { key: "dropbox",      name: "Dropbox",      color: "#0061ff", purpose: "Photo import", icon: "Db" },
  { key: "onedrive",     name: "OneDrive",     color: "#0078d4", purpose: "Photo import", icon: "OD" },
  { key: "shippo",       name: "Shippo",       color: "#1da1f2", purpose: "Shipping labels & tracking", icon: "Sh" },
  { key: "sendgrid",     name: "SendGrid",     color: "#1a82e2", purpose: "Email notifications", icon: "SG" },
  { key: "twilio",       name: "Twilio",       color: "#f22f46", purpose: "SMS notifications", icon: "Tw" },
];

const API_KEYS = [
  { key: "openai",    name: "OpenAI",    envVar: "OPENAI_API_KEY" },
  { key: "anthropic", name: "Anthropic",  envVar: "ANTHROPIC_API_KEY" },
  { key: "gemini",    name: "Google Gemini", envVar: "GEMINI_API_KEY" },
  { key: "ebay_dev",  name: "eBay Developer", envVar: "EBAY_CLIENT_ID" },
];

// Demo-connected platforms
const DEMO_CONNECTED = new Set(["facebook", "instagram", "ebay", "craigslist", "square"]);
const COMING_SOON = new Set(["icloud", "dropbox", "onedrive", "snapchat", "tiktok", "linkedin", "sendgrid", "twilio"]);

/* ── Component ── */

export default function ConnectedAccountsClient({ connectedPlatforms }: Props) {
  const [modal, setModal] = useState<string | null>(null);
  const [apiExpanded, setApiExpanded] = useState(false);

  const isConnected = (key: string) =>
    connectedPlatforms.some((p) => p.platform === key && p.isActive) || DEMO_CONNECTED.has(key);

  const getUsername = (key: string) => {
    const p = connectedPlatforms.find((p) => p.platform === key);
    if (p?.platformUsername) return p.platformUsername;
    // Demo mock data
    if (key === "facebook") return "@legacyloop.demo";
    if (key === "instagram") return "@legacyloop_shop";
    if (key === "ebay") return "legacyloop-seller";
    if (key === "craigslist") return "Portland, ME";
    if (key === "square") return "sq_sandbox_demo";
    return null;
  };

  const handleConnect = async (key: string) => {
    if (COMING_SOON.has(key)) {
      setModal(key);
      return;
    }
    // For demo: toggle connection via API
    try {
      await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: key, username: `${key}_user` }),
      });
      window.location.reload();
    } catch { /* silent */ }
  };

  const handleDisconnect = async (key: string) => {
    try {
      await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: key }),
      });
      window.location.reload();
    } catch { /* silent */ }
  };

  const renderCard = (card: CardDef) => {
    const connected = isConnected(card.key);
    const username = getUsername(card.key);
    const comingSoon = COMING_SOON.has(card.key);

    return (
      <div key={card.key} style={{
        padding: "1rem 1.25rem",
        borderRadius: "0.75rem",
        background: "var(--bg-card-solid)",
        border: `1px solid ${connected ? "rgba(0,188,212,0.2)" : "var(--border-default)"}`,
        opacity: comingSoon ? 0.65 : 1,
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
      }}>
        {/* Icon */}
        <div style={{
          width: "2.5rem", height: "2.5rem", borderRadius: "0.625rem", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${card.color}18`, border: `1px solid ${card.color}30`,
          fontSize: "0.75rem", fontWeight: 800, color: card.color === "#fff" ? "var(--text-primary)" : card.color,
          letterSpacing: "-0.02em",
        }}>
          {card.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>{card.name}</span>
            {comingSoon && (
              <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "0.12rem 0.4rem", borderRadius: "0.3rem", background: "var(--ghost-bg)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }}>
                COMING SOON
              </span>
            )}
            {connected && !comingSoon && (
              <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "0.12rem 0.4rem", borderRadius: "0.3rem", background: "rgba(22,163,74,0.12)", color: "#22c55e", border: "1px solid rgba(22,163,74,0.2)" }}>
                CONNECTED
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{card.purpose}</div>
          {connected && username && (
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>{username}</div>
          )}
        </div>

        {/* Action */}
        <div style={{ flexShrink: 0 }}>
          {comingSoon ? (
            <button onClick={() => setModal(card.key)} style={{
              padding: "0.4rem 0.75rem", borderRadius: "0.45rem", fontSize: "0.75rem", fontWeight: 500,
              background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s ease",
            }}>Notify Me</button>
          ) : connected ? (
            <button onClick={() => handleDisconnect(card.key)} style={{
              padding: "0.4rem 0.75rem", borderRadius: "0.45rem", fontSize: "0.75rem", fontWeight: 500,
              background: "transparent", border: "1px solid rgba(220,38,38,0.2)", color: "rgba(248,113,113,0.7)",
              cursor: "pointer", transition: "all 0.15s ease",
            }}>Disconnect</button>
          ) : (
            <button onClick={() => handleConnect(card.key)} className="btn-primary" style={{
              padding: "0.4rem 0.875rem", fontSize: "0.75rem", borderRadius: "0.45rem",
            }}>Connect</button>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (title: string, cards: CardDef[]) => (
    <div style={{ marginTop: "2rem" }}>
      <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>{title}</h2>
      <div style={{ display: "grid", gap: "0.625rem" }}>
        {cards.map(renderCard)}
      </div>
    </div>
  );

  return (
    <div>
      {renderSection("Social Media & Community", SOCIAL_MEDIA)}
      {renderSection("Selling Platforms", MARKETPLACES)}
      {renderSection("Payments & Banking", PAYMENTS)}
      {renderSection("Cloud Storage & Tools", CLOUD)}

      {/* API Keys — collapsible */}
      <div style={{ marginTop: "2rem" }}>
        <button onClick={() => setApiExpanded((v) => !v)} style={{
          display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", fontWeight: 600,
          color: "var(--text-primary)", background: "transparent", border: "none", cursor: "pointer", padding: 0,
        }}>
          <span style={{ transform: apiExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease", display: "inline-block" }}>&#9654;</span>
          Developer / API Keys
        </button>

        {apiExpanded && (
          <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem" }}>
            {API_KEYS.map((api) => {
              // In demo, show OpenAI/Anthropic/Gemini as connected
              const connected = ["openai", "anthropic", "gemini"].includes(api.key);
              return (
                <div key={api.key} style={{
                  padding: "0.75rem 1rem", borderRadius: "0.625rem",
                  background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
                  display: "flex", alignItems: "center", gap: "0.75rem",
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: connected ? "#22c55e" : "#6b7280",
                    boxShadow: connected ? "0 0 6px rgba(34,197,94,0.4)" : "none",
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>{api.name}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                      {connected ? "Connected" : "Not configured"}
                    </span>
                  </div>
                  <button style={{
                    padding: "0.3rem 0.6rem", borderRadius: "0.4rem", fontSize: "0.7rem", fontWeight: 500,
                    background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}>
                    {connected ? "Update Key" : "Add Key"}
                  </button>
                </div>
              );
            })}
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem", padding: "0 0.25rem" }}>
              API keys are stored securely as environment variables. The actual key values are never displayed.
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Modal */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        }} onClick={() => setModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "22rem", padding: "1.75rem",
            background: "rgba(12,12,22,0.98)", border: "1px solid var(--border-default)",
            borderRadius: "1rem", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Coming in Beta</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.5 }}>
              This integration is being built and will be available in the beta release. The infrastructure is ready — we just need to finalize the OAuth flow.
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button onClick={() => setModal(null)} className="btn-primary" style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem", borderRadius: "0.5rem" }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
