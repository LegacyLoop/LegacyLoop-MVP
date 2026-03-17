"use client";
import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Props {
  bots: any[];
  leads: any[];
  user: any;
}

/* ------------------------------------------------------------------ */
/*  Bot definitions                                                   */
/* ------------------------------------------------------------------ */

interface BotDefinition {
  key: string;
  icon: string;
  name: string;
  subtitle: string;
  learnMore: string;
  viewResultsLink: string;
  viewResultsLabel: string;
  defaultActive: boolean;
  stats: { label: string; value: string | number }[];
}

const BOT_DEFINITIONS: BotDefinition[] = [
  {
    key: "analyze-bot",
    icon: "\uD83E\uDDE0",
    name: "AnalyzeBot",
    subtitle: "AI-powered item identification, condition scoring, and initial valuation",
    learnMore:
      "Upload a photo and AnalyzeBot uses OpenAI Vision to identify your item, assess its condition on a 1-10 scale, detect materials and markings, estimate dimensions, and provide an initial valuation — all in seconds.",
    viewResultsLink: "/bots/analyzebot",
    viewResultsLabel: "View Details",
    defaultActive: true,
    stats: [
      { label: "Items Scanned", value: 10 },
      { label: "Avg Confidence", value: "94%" },
      { label: "Credits Used", value: 10 },
    ],
  },
  {
    key: "price-bot",
    icon: "\uD83D\uDCB0",
    name: "PriceBot",
    subtitle: "Deep pricing analysis with comparable sales, platform breakdown, and negotiation guide",
    learnMore:
      "PriceBot searches eBay sold listings, Etsy, and other marketplaces for comparable items. It calculates local, national, and best-market prices, factors in your location, and generates a negotiation guide with floor price and walk-away points.",
    viewResultsLink: "/bots/pricebot",
    viewResultsLabel: "View Details",
    defaultActive: true,
    stats: [
      { label: "Prices Analyzed", value: 8 },
      { label: "Comps Found", value: 47 },
      { label: "Avg Accuracy", value: "91%" },
    ],
  },
  {
    key: "buyer-bot",
    icon: "\uD83C\uDFAF",
    name: "BuyerBot",
    subtitle: "Find buyers across 15+ platforms with outreach tools and message templates",
    learnMore:
      "Our AI scans Facebook Marketplace, eBay, Craigslist, Uncle Henry's, and 50+ platforms to find active buyers searching for items like yours. You'll see their name, platform, interest level, and suggested outreach message — all in one place.",
    viewResultsLink: "/bots/buyerbot",
    viewResultsLabel: "View Buyers",
    defaultActive: true,
    stats: [
      { label: "Items Watched", value: 12 },
      { label: "Buyers Found", value: 8 },
      { label: "Leads Contacted", value: 3 },
    ],
  },
  {
    key: "list-bot",
    icon: "\u270D\uFE0F",
    name: "ListBot",
    subtitle: "Generate optimized listings for every platform in one click",
    learnMore:
      "ListBot creates platform-specific listings optimized for eBay, Facebook Marketplace, Craigslist, Etsy, and more. Each listing uses the right keywords, formatting, and pricing strategy for that platform's audience.",
    viewResultsLink: "/bots/listbot",
    viewResultsLabel: "View Details",
    defaultActive: true,
    stats: [
      { label: "Listings Created", value: 6 },
      { label: "Platforms", value: 5 },
      { label: "Clicks Generated", value: 89 },
    ],
  },
  {
    key: "recon-bot",
    icon: "\uD83D\uDD0D",
    name: "ReconBot",
    subtitle: "Continuous market monitoring — tracks competitors, pricing shifts, and opportunities",
    learnMore:
      "Continuously watches eBay, Etsy, Facebook Marketplace, and other platforms for similar items. When a competitor lists something like yours, changes their price, or sells — you get an instant alert. Helps you price competitively and know exactly when the market shifts.",
    viewResultsLink: "/bots/reconbot",
    viewResultsLabel: "View Analytics",
    defaultActive: true,
    stats: [
      { label: "Items Tracked", value: 4 },
      { label: "Competitors Found", value: 23 },
      { label: "Price Alerts", value: 5 },
    ],
  },
  {
    key: "car-bot",
    icon: "\uD83D\uDE97",
    name: "CarBot",
    subtitle: "Vehicle specialist — condition grading, VIN decode, market value, selling strategy",
    learnMore:
      "CarBot is your vehicle specialist. It grades condition, decodes VIN numbers, pulls market values from KBB and Edmunds, checks recall history, and creates a comprehensive selling strategy — whether you're listing a classic car or a daily driver.",
    viewResultsLink: "/bots/carbot",
    viewResultsLabel: "View Details",
    defaultActive: false,
    stats: [
      { label: "Vehicles Analyzed", value: 2 },
      { label: "VINs Decoded", value: 2 },
      { label: "Market Comps", value: 14 },
    ],
  },
  {
    key: "antique-bot",
    icon: "\uD83C\uDFDB\uFE0F",
    name: "AntiqueBot",
    subtitle: "Antique evaluation — authentication, historical research, auction estimates, collector market",
    learnMore:
      "AntiqueBot specializes in antiques and collectibles. It authenticates items, researches historical provenance, estimates auction values, identifies maker's marks, and connects you with the collector market — spotting hidden value that general AI might miss.",
    viewResultsLink: "/bots/antiquebot",
    viewResultsLabel: "View Details",
    defaultActive: false,
    stats: [
      { label: "Antiques Found", value: 3 },
      { label: "Auction Est.", value: "$4,200" },
      { label: "Authentication", value: "High" },
    ],
  },
  {
    key: "collectibles-bot",
    icon: "\uD83C\uDCCF",
    name: "CollectiblesBot",
    subtitle: "Sports cards, trading cards, vinyl, coins, comics & more",
    learnMore:
      "CollectiblesBot is your specialist for sports cards, trading cards, vinyl records, coins, comic books, and other collectibles. It identifies editions, grades condition using industry standards (PSA, BGS, CGC), checks recent sale prices on specialized marketplaces, and finds collectors actively searching for your exact items.",
    viewResultsLink: "/bots/collectiblesbot",
    viewResultsLabel: "View Details",
    defaultActive: false,
    stats: [
      { label: "Items Graded", value: 5 },
      { label: "Collectors Found", value: 18 },
      { label: "Avg Value", value: "$127" },
    ],
  },
  {
    key: "style-bot",
    icon: "\uD83D\uDCF7",
    name: "PhotoBot",
    subtitle: "Photo quality analysis, staging advice, and presentation optimization",
    learnMore:
      "PhotoBot analyzes your item photos for lighting, angle, background, and composition. It suggests specific improvements that increase buyer interest — better photos mean faster sales at higher prices. Includes staging tips for different item categories.",
    viewResultsLink: "/bots/stylebot",
    viewResultsLabel: "View Details",
    defaultActive: false,
    stats: [
      { label: "Photos Reviewed", value: 15 },
      { label: "Avg Score", value: "7.2/10" },
      { label: "Tips Given", value: 28 },
    ],
  },
  {
    key: "megabot",
    icon: "\u26A1",
    name: "MegaBot",
    subtitle: "4 AI agents in parallel — OpenAI, Claude, Gemini, Grok for the ultimate analysis",
    learnMore:
      "Runs your item photo through OpenAI, Claude, Google Gemini, and Grok simultaneously. Each AI independently identifies your item, estimates its value, and rates its condition. We then merge all 4 results into a single high-confidence consensus price — more accurate than any single AI alone. Costs 5 credits.",
    viewResultsLink: "/bots/megabot",
    viewResultsLabel: "View Details",
    defaultActive: true,
    stats: [
      { label: "Items Analyzed", value: 6 },
      { label: "Avg Agreement", value: "92%" },
      { label: "Credits Used", value: 30 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Toggle Switch component                                           */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={active ? "Deactivate bot" : "Activate bot"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {/* Track */}
      <span
        style={{
          position: "relative",
          display: "inline-block",
          width: 48,
          height: 26,
          borderRadius: 13,
          background: active
            ? "var(--accent, #00bcd4)"
            : "rgba(255,255,255,0.15)",
          transition: "background 0.25s ease",
          flexShrink: 0,
          border: active
            ? "1px solid var(--accent, #00bcd4)"
            : "1px solid var(--border-default, rgba(255,255,255,0.12))",
        }}
      >
        {/* Knob */}
        <span
          style={{
            position: "absolute",
            top: 2,
            left: active ? 23 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.25s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </span>
      {/* Label */}
      <span
        style={{
          fontSize: "0.82rem",
          fontWeight: 600,
          color: active
            ? "var(--success-text, #4ade80)"
            : "var(--text-muted, #94a3b8)",
        }}
      >
        {active ? "Active" : "Inactive"}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Status indicator (pulsing dot)                                    */
/* ------------------------------------------------------------------ */

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: active ? "#22c55e" : "#6b7280",
        flexShrink: 0,
        boxShadow: active ? "0 0 6px rgba(34,197,94,0.6)" : "none",
        animation: active ? "botPulse 2s ease-in-out infinite" : "none",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Chevron for expandable section                                    */
/* ------------------------------------------------------------------ */

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        transition: "transform 0.3s ease",
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        flexShrink: 0,
      }}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export default function BotDashboardClient({ bots, leads, user }: Props) {
  // Toggle state per bot (keyed by bot definition key)
  const [activeState, setActiveState] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {};
      BOT_DEFINITIONS.forEach((b) => {
        init[b.key] = b.defaultActive;
      });
      return init;
    }
  );

  // Expanded "Learn More" state per bot
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>(
    {}
  );

  const handleToggle = (key: string) => {
    setActiveState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpand = (key: string) => {
    setExpandedState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCount = Object.values(activeState).filter(Boolean).length;

  return (
    <div>
      {/* Keyframe for pulse animation */}
      <style>{`
        @keyframes botPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
      `}</style>

      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.9rem",
            color: "var(--text-secondary, #cbd5e1)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--success-bg, rgba(34,197,94,0.1))",
              color: "var(--success-text, #4ade80)",
              fontSize: "0.82rem",
              fontWeight: 800,
            }}
          >
            {activeCount}
          </span>
          <span>
            of {BOT_DEFINITIONS.length} bots active
          </span>
        </div>
        <Link
          href="/dashboard"
          style={{
            fontSize: "0.82rem",
            color: "var(--accent, #00bcd4)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Bot cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1.25rem",
        }}
      >
        {BOT_DEFINITIONS.map((bot) => {
          const isActive = activeState[bot.key] ?? bot.defaultActive;
          const isExpanded = expandedState[bot.key] ?? false;

          return (
            <div
              key={bot.key}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-default, rgba(255,255,255,0.12))",
                borderRadius: "1rem",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                ...(isActive
                  ? {
                      borderColor: "var(--accent-border, rgba(0,188,212,0.3))",
                      boxShadow: "0 0 20px rgba(0,188,212,0.05)",
                    }
                  : {}),
              }}
            >
              {/* Header: icon + name + subtitle + status dot */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                {/* Large icon */}
                <div
                  style={{
                    fontSize: "2.5rem",
                    lineHeight: 1,
                    flexShrink: 0,
                    width: 56,
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.75rem",
                    background: isActive
                      ? "var(--accent-dim, rgba(0,188,212,0.12))"
                      : "rgba(255,255,255,0.05)",
                    transition: "background 0.25s ease",
                  }}
                >
                  {bot.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name row with status dot */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: "var(--text-primary, #f1f5f9)",
                        lineHeight: 1.2,
                      }}
                    >
                      {bot.name}
                    </span>
                    <StatusDot active={isActive} />
                  </div>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "var(--text-secondary, #cbd5e1)",
                      margin: "0.35rem 0 0 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {bot.subtitle}
                  </p>
                </div>
              </div>

              {/* Stats row: 3 mini stat boxes */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                {bot.stats.map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border-default, rgba(255,255,255,0.12))",
                      borderRadius: "0.625rem",
                      padding: "0.625rem 0.75rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 800,
                        color: isActive
                          ? "var(--accent, #00bcd4)"
                          : "var(--text-muted, #94a3b8)",
                        lineHeight: 1.2,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted, #94a3b8)",
                        marginTop: "0.2rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Toggle switch */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <ToggleSwitch
                  active={isActive}
                  onToggle={() => handleToggle(bot.key)}
                />
              </div>

              {/* Learn More expandable section */}
              <div>
                <button
                  onClick={() => handleExpand(bot.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-muted, #94a3b8)",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color =
                      "var(--accent, #00bcd4)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      "var(--text-muted, #94a3b8)")
                  }
                >
                  Learn More
                  <Chevron expanded={isExpanded} />
                </button>

                {/* Expandable content with height transition */}
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isExpanded ? 200 : 0,
                    opacity: isExpanded ? 1 : 0,
                    transition: "max-height 0.35s ease, opacity 0.3s ease",
                    marginTop: isExpanded ? "0.75rem" : 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-secondary, #cbd5e1)",
                      lineHeight: 1.55,
                      margin: 0,
                      padding: "0.75rem",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "0.5rem",
                      border:
                        "1px solid var(--border-default, rgba(255,255,255,0.12))",
                    }}
                  >
                    {bot.learnMore}
                  </p>
                </div>
              </div>

              {/* View Results button */}
              <Link
                href={bot.viewResultsLink}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.625rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  background: isActive
                    ? "var(--accent, #00bcd4)"
                    : "rgba(255,255,255,0.06)",
                  color: isActive ? "#fff" : "var(--text-muted, #94a3b8)",
                  border: isActive
                    ? "1px solid var(--accent, #00bcd4)"
                    : "1px solid var(--border-default, rgba(255,255,255,0.12))",
                }}
              >
                {bot.viewResultsLabel}
                <span style={{ fontSize: "0.85rem" }}>&rarr;</span>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Responsive: single column on mobile */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
