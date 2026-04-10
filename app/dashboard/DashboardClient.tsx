"use client";

import { useState, useEffect } from "react";
import ItemCard from "./ItemCard";
import BundleSuggestions from "@/app/components/BundleSuggestions";
import BudgetGuard from "@/app/components/BudgetGuard";
import WelcomeModal from "@/app/components/WelcomeModal";

// ── Types ────────────────────────────────────────────────────────────────────

type ItemStatus = "DRAFT" | "ANALYZED" | "READY" | "LISTED" | "INTERESTED" | "SOLD" | "SHIPPED" | "COMPLETED";

export interface CardItem {
  id: string;
  status: ItemStatus;
  title: string | null;
  condition: string | null;
  createdAt: string;
  megabotUsed: boolean;
  listingPrice: number | null;
  photoUrl: string | null;
  isAntique: boolean;
  authenticityScore: number | null;
  antiqueTier: string | null;
  isCollectible: boolean;
  collectiblesScore: number;
  collectiblesTier: string | null;
  auctionLow: number | null;
  auctionHigh: number | null;
  valuationLow: number | null;
  valuationHigh: number | null;
  aiItemName: string | null;
  convCount: number;
  unreadMsgs: number;
  hasBotConv: boolean;
  category?: string | null;
  botStatus?: {
    analyzeBotRun: boolean;
    megaBotRun: boolean;
    buyerBotRun: boolean;
    reconBotRun: boolean;
    listBotRun: boolean;
  };
}

export interface EventLogEntry {
  id: string;
  itemId: string;
  eventType: string;
  payload: string | null;
  createdAt: string;
  itemTitle: string;
}

type StatFilter = "all" | "analyzed" | "antiques" | "collectibles" | "listed" | "sold";

interface StatCardDef {
  key: StatFilter;
  label: string;
  value: string;
  sub: string;
  accentColor?: string;
  subColor?: string;
}

// Status pipeline config
const STATUS_PIPELINE: { status: ItemStatus; label: string; color: string; bg: string }[] = [
  { status: "DRAFT",      label: "Draft",      color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  { status: "ANALYZED",   label: "Analyzed",   color: "#0f766e", bg: "rgba(15,118,110,0.12)" },
  { status: "READY",      label: "Ready",      color: "#2563eb", bg: "rgba(37,99,235,0.12)" },
  { status: "LISTED",     label: "Listed",     color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
  { status: "INTERESTED", label: "Interested", color: "#d97706", bg: "rgba(217,119,6,0.12)" },
  { status: "SOLD",       label: "Sold",       color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  { status: "SHIPPED",    label: "Shipped",    color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  { status: "COMPLETED",  label: "Completed",  color: "#059669", bg: "rgba(5,150,105,0.12)" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const ANALYZED_STATUSES = new Set(["ANALYZED", "READY", "LISTED", "INTERESTED", "SOLD", "SHIPPED", "COMPLETED"]);
const SOLD_STATUSES = new Set(["SOLD", "SHIPPED", "COMPLETED"]);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function safePayload(raw: string | null): any {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Event type display config
const EVENT_META: Record<string, { icon: string; label: string; color: string; badgeColor: string; badgeBg: string }> = {
  ANALYZED:          { icon: "o",  label: "Analysis",       color: "#0f766e", badgeColor: "#0f766e", badgeBg: "rgba(15,118,110,0.12)" },
  ANALYZED_FORCE:    { icon: "o",  label: "Re-analysis",    color: "#0369a1", badgeColor: "#0369a1", badgeBg: "rgba(3,105,161,0.12)" },
  MEGABOT_ANALYSIS:  { icon: "o",  label: "MegaBot",        color: "#7c3aed", badgeColor: "#7c3aed", badgeBg: "rgba(124,58,237,0.12)" },
  STATUS_CHANGE:     { icon: "o",  label: "Status Change",  color: "#64748b", badgeColor: "#64748b", badgeBg: "rgba(100,116,139,0.12)" },
  PRICE_UPDATE:      { icon: "o",  label: "Price Update",   color: "#d97706", badgeColor: "#d97706", badgeBg: "rgba(217,119,6,0.12)" },
  LISTING_CREATED:   { icon: "o",  label: "Listing",        color: "#0ea5e9", badgeColor: "#0ea5e9", badgeBg: "rgba(14,165,233,0.12)" },
  LABEL_CREATED:     { icon: "o",  label: "Shipping",       color: "#059669", badgeColor: "#059669", badgeBg: "rgba(5,150,105,0.12)" },
  RECON_ACTIVATED:   { icon: "o",  label: "Recon Bot",      color: "#dc2626", badgeColor: "#dc2626", badgeBg: "rgba(220,38,38,0.12)" },
  BOT_ACTIVATED:     { icon: "o",  label: "Buyer Bot",      color: "#8b5cf6", badgeColor: "#8b5cf6", badgeBg: "rgba(139,92,246,0.12)" },
  PHOTO_UPLOADED:    { icon: "o",  label: "Photo",          color: "#06b6d4", badgeColor: "#06b6d4", badgeBg: "rgba(6,182,212,0.12)" },
};

function getEventDisplay(eventType: string) {
  return EVENT_META[eventType] ?? {
    icon: "o",
    label: eventType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "var(--text-muted)",
    badgeColor: "var(--text-muted)",
    badgeBg: "rgba(148,163,184,0.12)",
  };
}

function describeEvent(eventType: string, payload: any): string {
  switch (eventType) {
    case "ANALYZED":
      return `AI analysis complete${payload?.comps ? ` with ${payload.comps} comps` : ""}${payload?.pricingSource ? ` via ${payload.pricingSource}` : ""}`;
    case "ANALYZED_FORCE":
      return `Re-analyzed${payload?.comps ? ` with ${payload.comps} comps` : ""}`;
    case "MEGABOT_ANALYSIS":
      return `MegaBot ran${payload?.agreementScore ? ` — ${payload.agreementScore}% agreement` : ""} across 4 AI models`;
    case "STATUS_CHANGE":
      return `Status changed${payload?.from ? ` from ${payload.from}` : ""}${payload?.to ? ` to ${payload.to}` : ""}`;
    case "PRICE_UPDATE":
      return `Price updated${payload?.price ? ` to $${payload.price}` : ""}`;
    case "LISTING_CREATED":
      return `Item listed on marketplace`;
    case "LABEL_CREATED":
      return `Shipping label created${payload?.carrier ? ` — ${payload.carrier}` : ""}`;
    case "RECON_ACTIVATED":
      return `Recon Bot activated for market monitoring`;
    case "BOT_ACTIVATED":
      return `Buyer Bot activated to find leads`;
    case "PHOTO_UPLOADED":
      return `Photo uploaded${payload?.count ? ` (${payload.count} photos)` : ""}`;
    default:
      return eventType.replace(/_/g, " ").toLowerCase();
  }
}

// ── Props ────────────────────────────────────────────────────────────────────

// CMD-ONBOARDING-7B: onboarding fields from User model
interface OnboardingUser {
  firstName: string;
  sellerType: string | null;
  recommendedTier: string | null;
  onboardingStep: number;
  quizCompletedAt: string | null;
  emailVerified: boolean;
}

interface DashboardClientProps {
  items: CardItem[];
  stats: {
    totalItems: number;
    analyzedItems: number;
    antiqueItems: number;
    collectibleItems: number;
    megabotItems: number;
    soldItems: number;
    listedItems: number;
    estimatedRevenue: number;
    totalEarnings: number;
  };
  events: EventLogEntry[];
  onboardingUser?: OnboardingUser;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DashboardClient({ items, stats, events, onboardingUser }: DashboardClientProps) {
  const [activeFilter, setActiveFilter] = useState<StatFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // CMD-ONBOARDING-7B: Welcome modal + checklist state
  const [showWelcome, setShowWelcome] = useState(onboardingUser?.onboardingStep === 1);

  // CMD-EMAIL-VERIFICATION: banner + success toast state
  const [verifyBannerDismissed, setVerifyBannerDismissed] = useState(false);
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem("ll-verify-banner-dismissed")) setVerifyBannerDismissed(true); } catch {}
    if (typeof window !== "undefined" && window.location.search.includes("verified=true")) {
      setShowVerifiedToast(true);
      setTimeout(() => setShowVerifiedToast(false), 5000);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [showQuizBanner, setShowQuizBanner] = useState(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem("legacyloop_quiz_completed");
      const dismissed = sessionStorage.getItem("legacyloop_quiz_banner_dismissed");
      if (!completed && !dismissed) {
        setShowQuizBanner(true);
      }
    } catch {
      // localStorage/sessionStorage not available
    }
  }, []);

  const dismissQuizBanner = () => {
    setShowQuizBanner(false);
    try {
      sessionStorage.setItem("legacyloop_quiz_banner_dismissed", "true");
    } catch {}
  };

  // Counts per status for the pipeline bar
  const statusCounts: Record<ItemStatus, number> = {
    DRAFT: 0, ANALYZED: 0, READY: 0, LISTED: 0,
    INTERESTED: 0, SOLD: 0, SHIPPED: 0, COMPLETED: 0,
  };
  for (const item of items) statusCounts[item.status]++;

  // Compute per-item bot run status from event logs
  const itemBotStatusMap = new Map<string, { analyzeBotRun: boolean; megaBotRun: boolean; buyerBotRun: boolean; reconBotRun: boolean; listBotRun: boolean }>();
  for (const event of events) {
    if (!itemBotStatusMap.has(event.itemId)) {
      itemBotStatusMap.set(event.itemId, { analyzeBotRun: false, megaBotRun: false, buyerBotRun: false, reconBotRun: false, listBotRun: false });
    }
    const bs = itemBotStatusMap.get(event.itemId)!;
    if (event.eventType === "ANALYZED" || event.eventType === "ANALYZED_FORCE") bs.analyzeBotRun = true;
    if (event.eventType === "MEGABOT_ANALYSIS") bs.megaBotRun = true;
    if (event.eventType === "BOT_ACTIVATED") bs.buyerBotRun = true;
    if (event.eventType === "RECON_ACTIVATED") bs.reconBotRun = true;
    if (event.eventType === "LISTING_CREATED") bs.listBotRun = true;
  }

  // Enrich items with bot status
  const enrichedItems = items.map((item) => ({
    ...item,
    botStatus: itemBotStatusMap.get(item.id) ?? {
      analyzeBotRun: item.status !== "DRAFT",
      megaBotRun: item.megabotUsed,
      buyerBotRun: false,
      reconBotRun: false,
      listBotRun: false,
    },
  }));

  // Build stat card definitions
  const statCards: StatCardDef[] = [
    {
      key: "all",
      label: "Your Items",
      value: stats.totalItems.toString(),
      sub: `${stats.totalItems} item${stats.totalItems !== 1 ? "s" : ""} uploaded for sale`,
    },
    {
      key: "analyzed",
      label: "AI Analyzed",
      value: stats.analyzedItems.toString(),
      sub: stats.megabotItems > 0 ? `${stats.megabotItems} via MegaBot` : "items priced by AI",
      subColor: stats.megabotItems > 0 ? "#8b5cf6" : undefined,
    },
    {
      key: "antiques",
      label: "Antiques Found",
      value: stats.antiqueItems.toString(),
      sub: stats.antiqueItems > 0 ? "may be worth more at auction" : "none detected yet",
      accentColor: stats.antiqueItems > 0 ? "#f59e0b" : undefined,
    },
    {
      key: "collectibles",
      label: "Collectibles Found",
      value: stats.collectibleItems.toString(),
      sub: stats.collectibleItems > 0 ? "may have collector premium" : "none detected yet",
      accentColor: stats.collectibleItems > 0 ? "#8b5cf6" : undefined,
    },
    {
      key: "listed",
      label: "Listed for Sale",
      value: stats.listedItems.toString(),
      sub: "visible to buyers now",
      accentColor: stats.listedItems > 0 ? "#0ea5e9" : undefined,
    },
    {
      key: "sold",
      label: "Sold",
      value: stats.soldItems.toString(),
      sub: stats.totalEarnings > 0 ? `$${Math.round(stats.totalEarnings).toLocaleString()} earned from ${stats.soldItems} sale${stats.soldItems !== 1 ? "s" : ""}` : "from completed sales",
      accentColor: stats.soldItems > 0 ? "#22c55e" : undefined,
    },
  ];

  // Filter items — statusFilter (pipeline) takes priority over stat card filter
  const filteredItems = enrichedItems.filter((item) => {
    if (statusFilter) return item.status === statusFilter;
    switch (activeFilter) {
      case "all": return true;
      case "analyzed": return ANALYZED_STATUSES.has(item.status);
      case "antiques": return item.isAntique;
      case "collectibles": return item.isCollectible;
      case "listed": return item.status === "LISTED";
      case "sold": return SOLD_STATUSES.has(item.status);
      default: return true;
    }
  });

  // Handle stat card click — clears pipeline filter
  function handleStatClick(key: StatFilter) {
    setActiveFilter(key);
    setStatusFilter(null);
  }

  // Handle pipeline chip click
  function handlePipelineClick(status: ItemStatus) {
    if (statusFilter === status) {
      setStatusFilter(null); // toggle off
    } else {
      setStatusFilter(status);
      setActiveFilter("all"); // reset stat card highlight
    }
  }

  // Unique event types for the event filter pills
  const eventTypes = Array.from(new Set(events.map((e) => e.eventType)));

  // Events to display — filtered by event type if active
  const INITIAL_EVENT_COUNT = 10;
  const typeFilteredEvents = eventTypeFilter
    ? events.filter((e) => e.eventType === eventTypeFilter)
    : events;
  const visibleEvents = showAllEvents ? typeFilteredEvents : typeFilteredEvents.slice(0, INITIAL_EVENT_COUNT);
  const hasMoreEvents = typeFilteredEvents.length > INITIAL_EVENT_COUNT;

  // CMD-ONBOARDING-7B: Getting-started checklist data
  const checklistSteps = [
    { id: "account", label: "Create your account", done: true, cta: "" },
    { id: "quiz", label: "Take the assessment", done: !!onboardingUser?.quizCompletedAt, cta: "/onboarding/quiz" },
    { id: "upload", label: "Upload your first item", done: stats.totalItems > 0, cta: "/items/new" },
    { id: "analyze", label: "Run your first AI analysis", done: stats.analyzedItems > 0, cta: items[0]?.id ? `/items/${items[0].id}` : "/items/new" },
    { id: "list", label: "Get your first listing live", done: stats.listedItems > 0 || stats.soldItems > 0, cta: "/items" },
  ];
  const completedCount = checklistSteps.filter((s) => s.done).length;
  const allComplete = completedCount === 5;
  const showChecklist = onboardingUser && (onboardingUser.onboardingStep ?? 0) < 3 && !allComplete;

  // Auto-advance onboardingStep to 3 when all complete
  useEffect(() => {
    if (allComplete && onboardingUser && (onboardingUser.onboardingStep ?? 0) < 3) {
      fetch("/api/user/onboarding-step", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingStep: 3 }),
      }).catch(() => {});
    }
  }, [allComplete, onboardingUser]);

  return (
    <div>
      {/* CMD-ONBOARDING-7B: Welcome Modal */}
      {showWelcome && onboardingUser && (
        <WelcomeModal
          user={onboardingUser}
          onClose={() => setShowWelcome(false)}
        />
      )}

      {/* CMD-EMAIL-VERIFICATION: Verified toast */}
      {showVerifiedToast && (
        <div style={{ position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)", zIndex: 9998, padding: "0.75rem 1.5rem", background: "rgba(22,163,74,0.95)", color: "#fff", borderRadius: "0.75rem", fontSize: "0.9rem", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "fadeSlideUp 0.3s ease forwards" }}>
          ✅ Email verified! Welcome to LegacyLoop.
        </div>
      )}

      {/* CMD-EMAIL-VERIFICATION: Verify email banner */}
      {onboardingUser && !onboardingUser.emailVerified && !verifyBannerDismissed && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "0.75rem", padding: "0.75rem 1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: "200px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            Please verify your email to unlock all features.
          </div>
          <button onClick={() => { fetch("/api/auth/resend-verification", { method: "POST" }).catch(() => {}); alert("Verification email sent! Check your inbox."); }} style={{ padding: "0.4rem 0.85rem", background: "transparent", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "0.5rem", color: "#f59e0b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
            Resend email
          </button>
          <button onClick={() => { setVerifyBannerDismissed(true); try { sessionStorage.setItem("ll-verify-banner-dismissed", "1"); } catch {} }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", padding: "0.25rem", flexShrink: 0 }} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* CMD-ONBOARDING-7B: Getting Started Checklist */}
      {showChecklist && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(0,188,212,0.2)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>🚀 Getting Started</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{completedCount} of 5 steps complete</div>
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#00bcd4" }}>{Math.round((completedCount / 5) * 100)}%</div>
          </div>
          {/* Progress bar */}
          <div style={{ height: "6px", background: "var(--ghost-bg)", borderRadius: "999px", overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{ height: "100%", width: `${(completedCount / 5) * 100}%`, background: "linear-gradient(90deg, #00bcd4, #0097a7)", borderRadius: "999px", transition: "width 0.5s ease" }} />
          </div>
          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {checklistSteps.map((step) => (
              <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: step.done ? "rgba(0,188,212,0.04)" : "transparent" }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: step.done ? "#00bcd4" : "transparent",
                  border: step.done ? "none" : "2px solid var(--border-default)",
                  fontSize: "0.65rem", color: "#fff", fontWeight: 700,
                }}>
                  {step.done ? "✓" : ""}
                </div>
                <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: step.done ? 400 : 600, color: step.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: step.done ? "line-through" : "none" }}>
                  {step.label}
                </span>
                {!step.done && step.cta && (
                  <a href={step.cta} style={{ fontSize: "0.75rem", fontWeight: 600, color: "#00bcd4", textDecoration: "none", flexShrink: 0 }}>Start →</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quiz Assessment Banner ── */}
      {showQuizBanner && (
        <div
          style={{
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-border)",
            borderRadius: "1.25rem",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{"\u{1F3AF}"}</span>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{
              fontWeight: 700,
              color: "var(--text-primary)",
              fontSize: "0.95rem",
              marginBottom: "0.2rem",
            }}>
              Find your perfect plan
            </div>
            <div style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              lineHeight: 1.4,
            }}>
              Take our 2-minute assessment to get a personalized recommendation.
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <a
              href="/onboarding/quiz"
              style={{
                padding: "0.5rem 1.25rem",
                background: "var(--accent-theme)",
                color: "#fff",
                borderRadius: "0.75rem",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Take Assessment {"\u2192"}
            </a>
            <button
              onClick={dismissQuizBanner}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.85rem",
                padding: "0.5rem",
              }}
            >
              {"\u2715"}
            </button>
          </div>
        </div>
      )}

      {/* ── Stat Card Filters ─────────────────────────────────────────────── */}
      <style>{`
        .dash-stat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem; margin-bottom: 1.75rem; }
        @media (max-width: 768px) { .dash-stat-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 480px) { .dash-stat-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      <div className="dash-stat-grid">
        {statCards.map((stat) => {
          const isActive = activeFilter === stat.key;
          const accent = stat.accentColor;

          return (
            <button
              key={stat.key}
              onClick={() => handleStatClick(stat.key)}
              style={{
                padding: "1.125rem 1.25rem",
                borderRadius: "0.75rem",
                background: accent
                  ? `linear-gradient(135deg, ${accent}12, ${accent}04)`
                  : "var(--bg-card-solid)",
                border: `1px solid ${isActive ? "var(--accent)" : accent ? `${accent}30` : "var(--border-default)"}`,
                boxShadow: isActive
                  ? "0 0 0 2px var(--accent-dim), 0 0 12px rgba(0,188,212,0.15)"
                  : "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                outline: "none",
              }}
            >
              <div style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: isActive ? "var(--accent)" : accent ?? "var(--text-muted)",
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                marginTop: "0.15rem",
                letterSpacing: "-0.02em",
                color: isActive ? "var(--accent)" : accent ?? "var(--text-primary)",
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: "0.7rem",
                marginTop: "0.1rem",
                color: stat.subColor ?? "var(--text-muted)",
                fontWeight: stat.subColor ? 600 : 400,
              }}>
                {stat.sub}
              </div>
              {isActive && (
                <div style={{
                  marginTop: "0.5rem",
                  height: "2px",
                  borderRadius: "1px",
                  background: "var(--accent)",
                  opacity: 0.7,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Status Pipeline ────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        marginBottom: "1.25rem",
        overflowX: "auto",
        paddingBottom: "0.25rem",
      }}>
        {STATUS_PIPELINE.map((stage, idx) => {
          const count = statusCounts[stage.status];
          const isActive = statusFilter === stage.status;
          const isLast = idx === STATUS_PIPELINE.length - 1;

          return (
            <div key={stage.status} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={() => handlePipelineClick(stage.status)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "9999px",
                  border: isActive ? `2px solid ${stage.color}` : "1px solid var(--border-default)",
                  background: isActive ? stage.bg : "var(--bg-card-solid)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                  boxShadow: isActive ? `0 0 8px ${stage.color}30` : "none",
                  opacity: count === 0 && !isActive ? 0.5 : 1,
                }}
              >
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? stage.color : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}>
                  {stage.label}
                </span>
                <span style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  padding: "0.05rem 0.35rem",
                  borderRadius: "9999px",
                  background: isActive ? stage.color : "var(--bg-secondary)",
                  color: isActive ? "#fff" : "var(--text-muted)",
                  minWidth: "1.1rem",
                  textAlign: "center",
                }}>
                  {count}
                </span>
              </button>
              {!isLast && (
                <div style={{
                  width: "0.75rem",
                  height: "2px",
                  background: "var(--border-default)",
                  flexShrink: 0,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Items Section ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
        }}>
          <div style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-muted)",
          }}>
            {statusFilter
              ? `${STATUS_PIPELINE.find(s => s.status === statusFilter)?.label ?? ""} Items`
              : activeFilter === "all" ? "Your Items" : `${statCards.find(s => s.key === activeFilter)?.label ?? ""} Items`}
            <span style={{
              marginLeft: "0.5rem",
              padding: "0.1rem 0.45rem",
              borderRadius: "9999px",
              fontSize: "0.6rem",
              fontWeight: 700,
              background: "var(--accent-dim)",
              color: "var(--accent)",
            }}>
              {filteredItems.length}
            </span>
          </div>
          {(activeFilter !== "all" || statusFilter) && (
            <button
              onClick={() => { setActiveFilter("all"); setStatusFilter(null); }}
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
              }}
            >
              Clear filter
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            borderRadius: "1rem",
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-default)",
            transition: "opacity 0.3s ease",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.3 }}>
              {activeFilter === "antiques" ? "~" : activeFilter === "sold" ? "$" : "+"}
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              No {activeFilter === "all" ? "" : activeFilter + " "}items
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {activeFilter === "all"
                ? "Upload photos to create new items."
                : `Items will appear here when they match the "${statCards.find(s => s.key === activeFilter)?.label}" filter.`}
            </div>
            {(activeFilter !== "all" || statusFilter) && (
              <button
                onClick={() => { setActiveFilter("all"); setStatusFilter(null); }}
                style={{
                  marginTop: "1rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 1rem",
                  cursor: "pointer",
                }}
              >
                Show all items
              </button>
            )}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            style={{ transition: "opacity 0.3s ease" }}
          >
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Budget Control ────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <BudgetGuard variant="compact" />
      </div>

      {/* ── Bundle Suggestions ─────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <BundleSuggestions />
      </div>

      {/* ── Activity Feed ─────────────────────────────────────────────────── */}
      {events.length > 0 && (
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}>
            <div style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
            }}>
              Activity Feed
              <span style={{
                marginLeft: "0.5rem",
                padding: "0.1rem 0.45rem",
                borderRadius: "9999px",
                fontSize: "0.6rem",
                fontWeight: 700,
                background: "var(--accent-dim)",
                color: "var(--accent)",
              }}>
                {typeFilteredEvents.length}
              </span>
            </div>

            {/* Event type filter pills */}
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {eventTypes.map((type) => {
                const display = getEventDisplay(type);
                const isActive = eventTypeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setEventTypeFilter(isActive ? null : type);
                      setShowAllEvents(false);
                    }}
                    style={{
                      padding: "0.2rem 0.55rem",
                      borderRadius: "9999px",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      border: isActive ? `1px solid ${display.badgeColor}` : "1px solid var(--border-default)",
                      background: isActive ? display.badgeBg : "transparent",
                      color: isActive ? display.badgeColor : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      outline: "none",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {display.label}
                  </button>
                );
              })}
              {eventTypeFilter && (
                <button
                  onClick={() => { setEventTypeFilter(null); setShowAllEvents(false); }}
                  style={{
                    padding: "0.2rem 0.55rem",
                    borderRadius: "9999px",
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    border: "none",
                    background: "none",
                    color: "var(--accent)",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div style={{
            borderRadius: "1rem",
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-default)",
            padding: "0.75rem 1rem",
          }}>
            {visibleEvents.map((event, idx) => {
              const display = getEventDisplay(event.eventType);
              const payload = safePayload(event.payload);
              const description = describeEvent(event.eventType, payload);
              const isExpanded = expandedEventId === event.id;
              const isLast = idx === visibleEvents.length - 1;

              return (
                <div key={event.id}>
                  <button
                    onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.75rem 0",
                      width: "100%",
                      background: "none",
                      borderTop: "none",
                      borderLeft: "none",
                      borderRight: "none",
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomStyle: isLast ? "none" : "solid",
                      borderBottomColor: "var(--border-default)",
                      cursor: "pointer",
                      textAlign: "left",
                      outline: "none",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* Teal timeline dot */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      flexShrink: 0,
                      paddingTop: "0.2rem",
                    }}>
                      <div style={{
                        width: "0.625rem",
                        height: "0.625rem",
                        borderRadius: "50%",
                        background: "var(--accent)",
                        boxShadow: "0 0 6px rgba(0,188,212,0.4)",
                        flexShrink: 0,
                      }} />
                      {!isLast && (
                        <div style={{
                          width: "2px",
                          flex: 1,
                          minHeight: "16px",
                          background: "var(--border-default)",
                          marginTop: "0.25rem",
                        }} />
                      )}
                    </div>

                    {/* Event content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        marginBottom: "0.2rem",
                      }}>
                        {/* Event type badge */}
                        <span style={{
                          padding: "0.1rem 0.5rem",
                          borderRadius: "9999px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: display.badgeColor,
                          background: display.badgeBg,
                          letterSpacing: "0.02em",
                          textTransform: "uppercase",
                        }}>
                          {display.label}
                        </span>
                        {/* Item title */}
                        <span style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "200px",
                        }}>
                          {event.itemTitle}
                        </span>
                      </div>
                      <div style={{
                        fontSize: "0.82rem",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}>
                        {description}
                      </div>
                    </div>

                    {/* Timestamp + expand indicator */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexShrink: 0,
                    }}>
                      <span style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}>
                        {timeAgo(event.createdAt)}
                      </span>
                      <span style={{
                        fontSize: "0.65rem",
                        color: "var(--text-muted)",
                        transition: "transform 0.2s ease",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Expanded metadata */}
                  {isExpanded && (
                    <div style={{
                      marginLeft: "1.375rem",
                      marginBottom: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.625rem",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-default)",
                      fontSize: "0.78rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            padding: "0.1rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: display.badgeColor,
                            background: display.badgeBg,
                            textTransform: "uppercase",
                          }}>
                            {event.eventType.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {new Date(event.createdAt).toLocaleString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "numeric", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <a
                          href={`/items/${event.itemId}`}
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: "var(--accent)",
                            textDecoration: "none",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "0.4rem",
                            background: "var(--accent-dim)",
                            border: "1px solid var(--accent-border)",
                          }}
                        >
                          View Item →
                        </a>
                      </div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                        {event.itemTitle}
                      </div>
                      {payload && (
                        <div style={{
                          marginTop: "0.35rem",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.35rem",
                        }}>
                          {Object.entries(payload).map(([key, val]) => (
                            <span
                              key={key}
                              style={{
                                padding: "0.15rem 0.55rem",
                                borderRadius: "9999px",
                                fontSize: "0.7rem",
                                background: "var(--accent-dim)",
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-default)",
                              }}
                            >
                              {key}: {typeof val === "object" ? JSON.stringify(val) : String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                      {!payload && (
                        <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.72rem" }}>
                          No additional metadata recorded.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show more / Show less */}
            {hasMoreEvents && (
              <div style={{
                textAlign: "center",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border-default)",
              }}>
                <button
                  onClick={() => setShowAllEvents(!showAllEvents)}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--accent)",
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent-border)",
                    borderRadius: "0.5rem",
                    padding: "0.45rem 1.25rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {showAllEvents
                    ? "Show less"
                    : `Show ${typeFilteredEvents.length - INITIAL_EVENT_COUNT} more event${typeFilteredEvents.length - INITIAL_EVENT_COUNT !== 1 ? "s" : ""}`}
                </button>
              </div>
            )}

            {/* Empty state */}
            {events.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "2rem",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}>
                No activity recorded yet. Analyze items to start tracking events.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
