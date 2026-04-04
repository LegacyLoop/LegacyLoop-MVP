"use client";

import { useState } from "react";

// ── Platform Leads data ───────────────────────────────────────────────────────
type PlatformLead = {
  id: string;
  platform: string;
  platformIcon: string;
  platformColor: string;
  handle: string;
  want: string;
  maxPrice: number;
  location: string;
  matchScore: number;
  botScore: number;
  timeAgo: string;
};

const PLATFORM_LEADS: PlatformLead[] = [
  { id: "pl1",  platform: "Facebook Groups",    platformIcon: "👥", platformColor: "#1877f2", handle: "Jennifer K.",          want: "vintage oak dining furniture, prefer MCM style",         maxPrice: 500,   location: "Waterville, ME",   matchScore: 94, botScore: 96, timeAgo: "1h ago" },
  { id: "pl2",  platform: "Facebook Groups",    platformIcon: "👥", platformColor: "#1877f2", handle: "Tom & Diane",          want: "estate silverware, sterling preferred, gift for mom",    maxPrice: 2000,  location: "Augusta, ME",      matchScore: 91, botScore: 89, timeAgo: "3h ago" },
  { id: "pl3",  platform: "Craigslist",         platformIcon: "🗞️", platformColor: "#8b4513", handle: "CL Wanted #4821",     want: "working typewriter, portable, any condition",            maxPrice: 300,   location: "Portland, ME",     matchScore: 87, botScore: 82, timeAgo: "5h ago" },
  { id: "pl4",  platform: "Craigslist",         platformIcon: "🗞️", platformColor: "#8b4513", handle: "CL Wanted #4977",     want: "vintage film camera, Leica or Nikon preferred",          maxPrice: 1500,  location: "Bangor, ME",       matchScore: 85, botScore: 91, timeAgo: "2h ago" },
  { id: "pl5",  platform: "Uncle Henry's",      platformIcon: "🦞", platformColor: "#b45309", handle: "Wayne F.",            want: "old farm tools, hand planes, chisels, estate finds",     maxPrice: 400,   location: "Skowhegan, ME",    matchScore: 78, botScore: 94, timeAgo: "6h ago" },
  { id: "pl6",  platform: "Uncle Henry's",      platformIcon: "🦞", platformColor: "#b45309", handle: "Deanne P.",           want: "antique lamps or lighting, prefer pre-1950",             maxPrice: 2500,  location: "Ellsworth, ME",    matchScore: 83, botScore: 88, timeAgo: "4h ago" },
  { id: "pl7",  platform: "Reddit",             platformIcon: "🔴", platformColor: "#ff4500", handle: "u/ME_collector",      want: "ISO Pokémon sealed product or PSA graded cards, budget $1k", maxPrice: 1000, location: "Portland, ME",  matchScore: 88, botScore: 85, timeAgo: "8h ago" },
  { id: "pl8",  platform: "Reddit",             platformIcon: "🔴", platformColor: "#ff4500", handle: "u/vintageguitarme",   want: "WTB vintage electric guitar, Fender or Gibson",          maxPrice: 700,   location: "Brunswick, ME",    matchScore: 90, botScore: 92, timeAgo: "1h ago" },
  { id: "pl9",  platform: "eBay Watchers",      platformIcon: "🛒", platformColor: "#e53238", handle: "eBay User #2847",     want: "Watching 4 Rolex Datejust listings in past 7 days",      maxPrice: 6000,  location: "Boston, MA",       matchScore: 96, botScore: 78, timeAgo: "Now" },
  { id: "pl10", platform: "eBay Watchers",      platformIcon: "🛒", platformColor: "#e53238", handle: "eBay User #9134",     want: "Watching Victorian silver items, saved search active",   maxPrice: 2200,  location: "Unknown",          matchScore: 82, botScore: 65, timeAgo: "2h ago" },
  { id: "pl11", platform: "Facebook Groups",    platformIcon: "👥", platformColor: "#1877f2", handle: "Sarah R.",            want: "mid century furniture for whole room, chairs + dresser",  maxPrice: 800,   location: "Lewiston, ME",     matchScore: 79, botScore: 93, timeAgo: "12h ago" },
  { id: "pl12", platform: "Craigslist",         platformIcon: "🗞️", platformColor: "#8b4513", handle: "CL Wanted #5103",     want: "acoustic guitar, vintage preferred, will travel",        maxPrice: 600,   location: "Augusta, ME",      matchScore: 86, botScore: 84, timeAgo: "3h ago" },
];

const LEAD_PLATFORMS = ["All", "Facebook Groups", "Craigslist", "Uncle Henry's", "Reddit", "eBay Watchers"];

type BuyerProfile = {
  id: string;
  name: string;
  platform: string;
  platformIcon: string;
  location: string;
  botScore: number;
  matchReason: string;
  searchTerm: string;
  itemTitle: string;
  itemPrice: number;
  itemCategory: string;
  status: "pending" | "contacted" | "replied" | "flagged";
  generatedMessage: string;
  avatarInitials: string;
  avatarColor: string;
  timeAgo: string;
};

const MOCK_BUYERS: BuyerProfile[] = [
  {
    id: "b1",
    name: "Sarah Mitchell",
    platform: "Facebook Marketplace",
    platformIcon: "📘",
    location: "Portland, ME",
    botScore: 96,
    matchReason: "Actively searching for sterling silver tea sets in Maine area",
    searchTerm: "sterling silver tea service",
    itemTitle: "Victorian Sterling Silver Tea Service",
    itemPrice: 1800,
    itemCategory: "Antiques / Silver",
    status: "replied",
    generatedMessage: "Hi Sarah! I noticed you're searching for sterling silver tea sets in the Portland area. I have a stunning Victorian 5-piece sterling silver tea service from the 1880s — hallmarked Sheffield. In excellent condition with original patina. Asking $1,800 or best offer. Would love to share more photos!",
    avatarInitials: "SM",
    avatarColor: "#0f766e",
    timeAgo: "2 hours ago",
  },
  {
    id: "b2",
    name: "Mike Thompson",
    platform: "eBay",
    platformIcon: "🛒",
    location: "Boston, MA",
    botScore: 88,
    matchReason: "Watching 3 similar Victorian silver items, high purchase history",
    searchTerm: "Victorian antique silver",
    itemTitle: "Victorian Sterling Silver Tea Service",
    itemPrice: 1800,
    itemCategory: "Antiques / Silver",
    status: "contacted",
    generatedMessage: "Hello! I saw you're watching Victorian silver items on eBay. I have a 5-piece Sheffield sterling tea service (c.1880s) that matches exactly what you're looking for. Happy to answer questions or send additional photos!",
    avatarInitials: "MT",
    avatarColor: "#7c3aed",
    timeAgo: "5 hours ago",
  },
  {
    id: "b3",
    name: "Jennifer & Tom Kowalski",
    platform: "Facebook Groups",
    platformIcon: "👥",
    location: "Waterville, ME",
    botScore: 94,
    matchReason: "Members of Maine Antique Buyers group, recent posts asking for estate furniture",
    searchTerm: "vintage oak dining furniture Maine",
    itemTitle: "Vintage Oak Dining Table (1960s)",
    itemPrice: 450,
    itemCategory: "Furniture",
    status: "pending",
    generatedMessage: "Hi Jennifer & Tom! I saw your post in Maine Antique Buyers looking for vintage oak dining furniture. I have a beautiful 1960s oak dining table in great condition — it's been in the family for decades. Asking $450. Located in Waterville. Would you like to come take a look?",
    avatarInitials: "JK",
    avatarColor: "#b45309",
    timeAgo: "1 day ago",
  },
  {
    id: "b4",
    name: "David Chen",
    platform: "Craigslist",
    platformIcon: "🗞",
    location: "Augusta, ME",
    botScore: 82,
    matchReason: "Wanted ad: 'Looking for vintage guitars in good condition'",
    searchTerm: "vintage acoustic guitar",
    itemTitle: "1970s Guild D-25 Acoustic Guitar",
    itemPrice: 550,
    itemCategory: "Musical Instruments",
    status: "pending",
    generatedMessage: "Hi, I saw your Craigslist wanted ad looking for vintage guitars. I have a 1970s Guild D-25 acoustic guitar in good condition — plays great, warm sound. Asking $550. Located in Augusta area. Includes original case. Let me know if you'd like to hear it!",
    avatarInitials: "DC",
    avatarColor: "#0369a1",
    timeAgo: "1 day ago",
  },
  {
    id: "b5",
    name: "CollectorsHub2024",
    platform: "eBay",
    platformIcon: "🛒",
    location: "Unknown",
    botScore: 22,
    matchReason: "New account, no purchase history, generic inquiry pattern",
    searchTerm: "pokemon card graded PSA 10",
    itemTitle: "Pokémon 1st Edition Charizard (PSA 9)",
    itemPrice: 1200,
    itemCategory: "Collectibles",
    status: "flagged",
    generatedMessage: "",
    avatarInitials: "CH",
    avatarColor: "#dc2626",
    timeAgo: "3 hours ago",
  },
  {
    id: "b6",
    name: "Rachel Abernathy",
    platform: "Facebook Marketplace",
    platformIcon: "📘",
    location: "Bangor, ME",
    botScore: 91,
    matchReason: "Searching 'mid century modern dresser', viewed 12 similar items",
    searchTerm: "MCM dresser mid century",
    itemTitle: "Mid-Century Modern Dresser (Broyhill, 1965)",
    itemPrice: 380,
    itemCategory: "Furniture",
    status: "pending",
    generatedMessage: "Hi Rachel! I saw you're searching for mid-century modern furniture in Maine. I have a beautiful 1965 Broyhill MCM dresser with original hardware — 6 drawers, walnut finish, excellent condition. Asking $380 in Bangor area. Happy to negotiate!",
    avatarInitials: "RA",
    avatarColor: "#0f766e",
    timeAgo: "4 hours ago",
  },
  {
    id: "b7",
    name: "HP_Deals_Bot",
    platform: "Facebook Marketplace",
    platformIcon: "📘",
    location: "Various",
    botScore: 15,
    matchReason: "Automated account, sends identical inquiry to all laptop listings",
    searchTerm: "laptop",
    itemTitle: "HP Envy 15 Laptop (2022)",
    itemPrice: 499,
    itemCategory: "Electronics",
    status: "flagged",
    generatedMessage: "",
    avatarInitials: "HB",
    avatarColor: "#dc2626",
    timeAgo: "1 hour ago",
  },
  {
    id: "b8",
    name: "Marcus Williams",
    platform: "Reddit",
    platformIcon: "🔴",
    location: "Portland, ME",
    botScore: 87,
    matchReason: "Active in r/pokemoncardmarket, recent WTB post matching your item",
    searchTerm: "WTB 1st edition Charizard",
    itemTitle: "Pokémon 1st Edition Charizard (PSA 9)",
    itemPrice: 1200,
    itemCategory: "Collectibles",
    status: "contacted",
    generatedMessage: "Hey Marcus! I saw your WTB post on r/pokemoncardmarket for a 1st edition Charizard. I have a PSA 9 graded card available — asking $1,200. Happy to provide authentication photos and discuss. DM me if interested!",
    avatarInitials: "MW",
    avatarColor: "#7c3aed",
    timeAgo: "6 hours ago",
  },
];

const PLATFORM_COLORS: Record<string, string> = {
  "Facebook Marketplace": "#1877f2",
  "Facebook Groups": "#1877f2",
  eBay: "#e53238",
  Craigslist: "#8b4513",
  Reddit: "#ff4500",
};

function BotScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  const bg = score >= 80 ? "#dcfce7" : score >= 50 ? "#fef3c7" : "#fee2e2";
  const label = score >= 80 ? "✓ Real" : score >= 50 ? "? Uncertain" : "⚠ Bot";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.2rem 0.6rem",
        background: bg,
        color,
        borderRadius: "9999px",
        fontSize: "0.72rem",
        fontWeight: 700,
      }}
    >
      {label} {score}/100
    </div>
  );
}

const STATUS_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "var(--ghost-bg)", color: "var(--text-muted)", label: "Pending" },
  contacted: { bg: "#eff6ff", color: "#1d4ed8", label: "Contacted" },
  replied: { bg: "#dcfce7", color: "#16a34a", label: "Replied ✓" },
  flagged: { bg: "#fee2e2", color: "#dc2626", label: "Flagged Bot" },
};

export default function BuyerFinderClient() {
  const [mainTab, setMainTab] = useState<"active" | "platform">("active");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(true); // show results by default for demo
  const [scanStep, setScanStep] = useState(0);
  const [buyers, setBuyers] = useState<BuyerProfile[]>(MOCK_BUYERS);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [sending, setSending] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set(["b1", "b2", "b8"]));

  // Platform leads state
  const [leadPlatform, setLeadPlatform] = useState("All");
  const [scanningPlatform, setScanningPlatform] = useState<string | null>(null);
  const [scannedPlatforms, setScannedPlatforms] = useState<Set<string>>(new Set(["All"]));
  const [contactedLeads, setContactedLeads] = useState<Set<string>>(new Set(["pl9"]));

  const SCAN_STEPS = [
    "Scanning Facebook Marketplace...",
    "Scanning eBay Watch Lists...",
    "Scanning Craigslist Wanted Ads...",
    "Scanning Facebook Groups...",
    "Scanning Reddit...",
    "Analyzing buyer quality scores...",
    "Generating personalized messages...",
    "Done! 8 potential buyers found",
  ];

  async function startScan() {
    setScanning(true);
    setScanned(false);
    setScanStep(0);
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setScanStep(i);
    }
    await new Promise((r) => setTimeout(r, 400));
    setScanning(false);
    setScanned(true);
  }

  async function sendMessage(buyerId: string) {
    setSending(buyerId);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(null);
    setSentIds((prev) => new Set([...prev, buyerId]));
    setBuyers((prev) =>
      prev.map((b) => (b.id === buyerId ? { ...b, status: "contacted" as const } : b))
    );
  }

  function flagBuyer(buyerId: string) {
    setBuyers((prev) =>
      prev.map((b) => (b.id === buyerId ? { ...b, status: "flagged" as const } : b))
    );
  }

  const filtered = buyers.filter((b) => {
    if (filterPlatform !== "all" && !b.platform.toLowerCase().includes(filterPlatform)) return false;
    if (filterScore === "real" && b.botScore < 80) return false;
    if (filterScore === "bots" && b.botScore >= 50) return false;
    return true;
  });

  const humanCount = buyers.filter((b) => b.botScore >= 80).length;
  const botCount = buyers.filter((b) => b.botScore < 50).length;
  const contactedCount = buyers.filter((b) => b.status === "contacted" || b.status === "replied").length;
  const repliedCount = buyers.filter((b) => b.status === "replied").length;

  const CARD: React.CSSProperties = {
    background: "var(--bg-card-solid)",
    border: "1px solid var(--border-default)",
    borderRadius: "1.25rem",
    padding: "1.5rem",
  };

  const filteredLeads = PLATFORM_LEADS.filter(
    (l) => leadPlatform === "All" || l.platform === leadPlatform
  );

  const totalLeadPlatforms = new Set(PLATFORM_LEADS.map((l) => l.platform)).size;

  async function scanPlatform(platform: string) {
    setScanningPlatform(platform);
    await new Promise((r) => setTimeout(r, 1800));
    setScanningPlatform(null);
    setScannedPlatforms((prev) => new Set([...prev, platform]));
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <div className="section-title">Outreach</div>
          <h1 className="h1 mt-2">Buyer Finder</h1>
          <p className="muted mt-1">AI scans Facebook, eBay, Craigslist, Reddit to find buyers already searching for your items</p>
        </div>
        {mainTab === "active" && (
          <button
            onClick={startScan}
            disabled={scanning}
            className="btn-primary px-6 py-3"
            style={{ fontSize: "1rem" }}
          >
            {scanning ? "Scanning..." : "🔍 Scan for Buyers"}
          </button>
        )}
      </div>

      {/* Main tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", borderBottom: "2px solid var(--border-default)" }}>
        {([
          { key: "active",   label: "🎯 Active Buyers",   count: buyers.length },
          { key: "platform", label: "📡 Platform Leads",  count: PLATFORM_LEADS.length },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            style={{
              padding: "0.65rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: mainTab === key ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: "-2px",
              color: mainTab === key ? "var(--accent)" : "var(--text-muted)",
              fontWeight: mainTab === key ? 700 : 500,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {label}
            <span style={{
              padding: "0.1rem 0.45rem",
              background: mainTab === key ? "var(--accent)" : "var(--ghost-bg)",
              color: mainTab === key ? "#fff" : "var(--text-muted)",
              borderRadius: "9999px",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── ACTIVE BUYERS TAB ─────────────────────────────────────────── */}
      {mainTab === "active" && (<>

      {/* Scan animation */}
      {scanning && (
        <div style={{ ...CARD, marginBottom: "1.5rem", background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", borderColor: "#86efac" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #0f766e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: "#15803d" }}>Scanning platforms...</div>
              <div style={{ fontSize: "0.85rem", color: "#166534", marginTop: "0.2rem" }}>
                {SCAN_STEPS[Math.min(scanStep, SCAN_STEPS.length - 1)]}
              </div>
            </div>
          </div>
          <div style={{ marginTop: "1rem", height: "6px", background: "#d1fae5", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#0f766e", borderRadius: "9999px", width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%`, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#15803d" }}>
            Step {Math.min(scanStep + 1, SCAN_STEPS.length)} of {SCAN_STEPS.length}
          </div>
        </div>
      )}

      {/* Scan results summary */}
      {scanned && (
        <div style={{ ...CARD, marginBottom: "1.5rem", background: "linear-gradient(135deg, #f0fdf4, #f5f3ff)", borderColor: "#a7f3d0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🎯</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Scan complete — {buyers.length} potential buyers found</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Across Facebook, eBay, Craigslist, Reddit &amp; Groups</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem" }}>
            {[
              { label: "Total Found", value: buyers.length, color: "var(--text-primary)", bg: "var(--ghost-bg)" },
              { label: "Real Humans", value: humanCount, color: "#16a34a", bg: "#dcfce7" },
              { label: "Possible Bots", value: botCount, color: "#dc2626", bg: "#fee2e2" },
              { label: "Contacted", value: contactedCount, color: "#1d4ed8", bg: "#eff6ff" },
              { label: "Replied", value: repliedCount, color: "#0f766e", bg: "#f0fdf4" },
            ].map((s) => (
              <div key={s.label} style={{ padding: "0.75rem", background: s.bg, borderRadius: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outreach metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Messages Sent", value: sentIds.size, sub: "across all platforms", color: "#0f766e" },
          { label: "Reply Rate", value: "67%", sub: "above industry avg", color: "#16a34a" },
          { label: "Avg Bot Score", value: Math.round(buyers.reduce((s, b) => s + b.botScore, 0) / buyers.length), sub: "quality buyers", color: "#7c3aed" },
          { label: "Est. Conversions", value: repliedCount, sub: "warm leads", color: "#b45309" },
        ].map((s) => (
          <div key={s.label} style={CARD}>
            <div className="section-title">{s.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, marginTop: "0.25rem" }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Platform:</span>
          {["all", "facebook", "ebay", "craigslist", "reddit"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.72rem",
                background: filterPlatform === p ? "var(--accent)" : "var(--ghost-bg)",
                color: filterPlatform === p ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "9999px",
                cursor: "pointer",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Filter:</span>
          {[
            { key: "all", label: "All" },
            { key: "real", label: "✓ Real buyers" },
            { key: "bots", label: "⚠ Bots only" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterScore(f.key)}
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.72rem",
                background: filterScore === f.key ? "var(--accent)" : "var(--ghost-bg)",
                color: filterScore === f.key ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "9999px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buyer queue */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filtered.map((buyer) => {
          const chip = STATUS_CHIP[buyer.status];
          const isFlagged = buyer.status === "flagged";
          const isSent = sentIds.has(buyer.id);
          const isExpanded = expandedMsg === buyer.id;

          return (
            <div
              key={buyer.id}
              style={{
                ...CARD,
                opacity: isFlagged ? 0.6 : 1,
                border: buyer.status === "replied" ? "1.5px solid #86efac" : "1px solid var(--border-default)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                {/* Avatar */}
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: buyer.avatarColor,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    flexShrink: 0,
                  }}
                >
                  {buyer.avatarInitials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{buyer.name}</span>
                    <span style={{ fontSize: "0.75rem", color: PLATFORM_COLORS[buyer.platform] ?? "var(--text-muted)", fontWeight: 600 }}>
                      {buyer.platformIcon} {buyer.platform}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{buyer.timeAgo}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    📍 {buyer.location}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ color: "#0f766e" }}>🎯</span>
                    {buyer.matchReason}
                  </div>
                  {buyer.searchTerm && (
                    <div style={{ marginTop: "0.3rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Search: <span style={{ background: "var(--ghost-bg)", padding: "0.1rem 0.4rem", borderRadius: "0.3rem", fontFamily: "monospace" }}>"{buyer.searchTerm}"</span>
                    </div>
                  )}
                </div>

                {/* Bot score + item */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
                  <BotScoreBadge score={buyer.botScore} />
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right" }}>
                    <span style={{ fontWeight: 600 }}>{buyer.itemTitle}</span>
                    <br />
                    <span style={{ color: "#0f766e", fontWeight: 700 }}>${buyer.itemPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ padding: "0.15rem 0.5rem", background: chip.bg, color: chip.color, borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700 }}>
                    {chip.label}
                  </div>
                </div>
              </div>

              {/* Message section */}
              {!isFlagged && buyer.generatedMessage && (
                <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-default)", paddingTop: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      ✨ AI-Generated Message:
                    </span>
                    <button
                      onClick={() => setExpandedMsg(isExpanded ? null : buyer.id)}
                      style={{ fontSize: "0.72rem", color: "#0f766e", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {isExpanded ? "Collapse" : "Preview"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#166534", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                      {buyer.generatedMessage}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {!isSent ? (
                      <button
                        onClick={() => sendMessage(buyer.id)}
                        disabled={sending === buyer.id}
                        style={{
                          padding: "0.4rem 1rem",
                          background: "#0f766e",
                          color: "#fff",
                          border: "none",
                          borderRadius: "0.6rem",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: sending === buyer.id ? "not-allowed" : "pointer",
                          opacity: sending === buyer.id ? 0.7 : 1,
                        }}
                      >
                        {sending === buyer.id ? "Sending..." : "📤 Send Message"}
                      </button>
                    ) : (
                      <div style={{ padding: "0.4rem 1rem", background: "#dcfce7", color: "#16a34a", borderRadius: "0.6rem", fontSize: "0.82rem", fontWeight: 700 }}>
                        ✓ Message Sent
                      </div>
                    )}
                    <button
                      onClick={() => flagBuyer(buyer.id)}
                      style={{ padding: "0.4rem 0.75rem", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "0.6rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      ⚠ Flag Bot
                    </button>
                  </div>
                </div>
              )}

              {isFlagged && (
                <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "0.6rem", fontSize: "0.78rem", color: "#dc2626", fontWeight: 600 }}>
                  ⚠ Flagged as bot — skipped in outreach queue
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <div className="text-xl font-semibold">No buyers match your filters</div>
          <button onClick={() => { setFilterPlatform("all"); setFilterScore("all"); }} className="btn-ghost mt-4">Clear filters</button>
        </div>
      )}

      {/* How it works */}
      <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--ghost-bg)", borderRadius: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>How Buyer Finder works</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {[
            { step: "1", text: "AI scans Facebook Marketplace, eBay Watch lists, Craigslist wanted ads, Reddit buy/sell boards" },
            { step: "2", text: "Each potential buyer is scored for bot likelihood using account age, history, and inquiry patterns" },
            { step: "3", text: "Personalized messages are pre-written for each buyer based on their search intent" },
            { step: "4", text: "Send with one click — all outreach is tracked and reply rates are measured automatically" },
          ].map((s) => (
            <div key={s.step} style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ width: "22px", height: "22px", background: "#0f766e", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
              <div style={{ fontSize: "0.78rem", lineHeight: 1.5 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      </>)} {/* end mainTab === "active" */}

      {/* ── PLATFORM LEADS TAB ────────────────────────────────────────── */}
      {mainTab === "platform" && (
        <div>
          {/* Summary bar */}
          <div style={{
            background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
            border: "1px solid #bfdbfe",
            borderRadius: "1rem",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📡</span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  Total Intelligence: {PLATFORM_LEADS.length} leads across {totalLeadPlatforms} platforms
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {contactedLeads.size} contacted · {PLATFORM_LEADS.filter(l => l.matchScore >= 85).length} high-confidence matches
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {[
                { label: "Avg Match", value: `${Math.round(PLATFORM_LEADS.reduce((s, l) => s + l.matchScore, 0) / PLATFORM_LEADS.length)}%`, color: "#0f766e", bg: "#f0fdf4" },
                { label: "High Value", value: PLATFORM_LEADS.filter(l => l.maxPrice >= 1000).length, color: "#7c3aed", bg: "#f5f3ff" },
                { label: "Maine", value: PLATFORM_LEADS.filter(l => l.location.includes("ME")).length, color: "#b45309", bg: "#fef3c7" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "0.4rem 0.75rem", background: s.bg, borderRadius: "0.6rem" }}>
                  <div style={{ fontWeight: 800, color: s.color, fontSize: "1.1rem" }}>{s.value}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform filter tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            {LEAD_PLATFORMS.map((plat) => {
              const isScanning = scanningPlatform === plat;
              const wasScanned = scannedPlatforms.has(plat);
              return (
                <div key={plat} style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                  <button
                    onClick={() => setLeadPlatform(plat)}
                    style={{
                      padding: "0.3rem 0.75rem",
                      background: leadPlatform === plat ? "var(--accent)" : "var(--ghost-bg)",
                      color: leadPlatform === plat ? "#fff" : "var(--text-secondary)",
                      border: "none",
                      borderRadius: "9999px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {plat === "Uncle Henry's" ? "🦞 " : ""}{plat}
                    {plat !== "All" && (
                      <span style={{ marginLeft: "0.3rem", opacity: 0.7 }}>
                        ({PLATFORM_LEADS.filter(l => l.platform === plat).length})
                      </span>
                    )}
                  </button>
                  {plat !== "All" && (
                    <button
                      onClick={() => scanPlatform(plat)}
                      disabled={isScanning}
                      style={{
                        padding: "0.25rem 0.5rem",
                        background: wasScanned ? "#dcfce7" : "#eff6ff",
                        color: wasScanned ? "#16a34a" : "#1d4ed8",
                        border: "none",
                        borderRadius: "0.4rem",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        cursor: isScanning ? "not-allowed" : "pointer",
                      }}
                    >
                      {isScanning ? "⏳" : wasScanned ? "✓" : "Scan"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lead cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredLeads.map((lead) => {
              const isContacted = contactedLeads.has(lead.id);
              return (
                <div
                  key={lead.id}
                  style={{
                    background: "var(--bg-card-solid)",
                    border: lead.matchScore >= 90 ? "2px solid #86efac" : "1px solid var(--border-default)",
                    borderRadius: "1rem",
                    padding: "1.25rem 1.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                        {/* Platform badge */}
                        <span style={{
                          padding: "0.15rem 0.55rem",
                          background: lead.platformColor + "18",
                          color: lead.platformColor,
                          borderRadius: "9999px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          border: `1px solid ${lead.platformColor}30`,
                        }}>
                          {lead.platformIcon} {lead.platform}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{lead.timeAgo}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{lead.handle}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>📍 {lead.location}</div>
                      <div style={{
                        marginTop: "0.6rem",
                        padding: "0.5rem 0.75rem",
                        background: "var(--ghost-bg)",
                        borderRadius: "0.6rem",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                        lineHeight: 1.5,
                      }}>
                        "{lead.want}"
                      </div>
                      <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Max budget: <span style={{ fontWeight: 700, color: "#0f766e" }}>${lead.maxPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end", flexShrink: 0 }}>
                      {/* Match score */}
                      <div style={{
                        padding: "0.25rem 0.65rem",
                        background: lead.matchScore >= 90 ? "#dcfce7" : lead.matchScore >= 80 ? "#eff6ff" : "#fef3c7",
                        color: lead.matchScore >= 90 ? "#16a34a" : lead.matchScore >= 80 ? "#1d4ed8" : "#92400e",
                        borderRadius: "9999px",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                      }}>
                        🎯 {lead.matchScore}% match
                      </div>
                      <BotScoreBadge score={lead.botScore} />
                      {!isContacted ? (
                        <button
                          onClick={() => setContactedLeads((prev) => new Set([...prev, lead.id]))}
                          style={{
                            padding: "0.4rem 1rem",
                            background: "#0f766e",
                            color: "#fff",
                            border: "none",
                            borderRadius: "0.6rem",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            marginTop: "0.25rem",
                          }}
                        >
                          📤 Reach Out
                        </button>
                      ) : (
                        <div style={{ padding: "0.4rem 1rem", background: "#dcfce7", color: "#16a34a", borderRadius: "0.6rem", fontSize: "0.78rem", fontWeight: 700, marginTop: "0.25rem" }}>
                          ✓ Contacted
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLeads.length === 0 && (
            <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "1rem", padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📡</div>
              <div style={{ fontWeight: 700 }}>No leads for this platform yet</div>
              <button onClick={() => setLeadPlatform("All")} style={{ marginTop: "0.75rem", padding: "0.4rem 1rem", background: "var(--ghost-bg)", border: "none", borderRadius: "0.6rem", cursor: "pointer", fontWeight: 600, color: "var(--text-secondary)" }}>
                Show All Platforms
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
