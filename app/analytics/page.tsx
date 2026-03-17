import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { safeJson } from "@/lib/utils/json";

export const metadata: Metadata = {
  title: "Analytics · LegacyLoop",
  description: "Estate sale performance analytics powered by AI",
};

import { isAdmin } from "@/lib/constants/admin";

const SPECIALIST_BOT_TYPES = [
  "PRICEBOT_RESULT",
  "ANTIQUEBOT_RESULT",
  "COLLECTIBLESBOT_RESULT",
  "CARBOT_RESULT",
  "LISTBOT_RESULT",
  "BUYERBOT_RESULT",
  "RECONBOT_RESULT",
  "PHOTOBOT_EDIT",
  "PHOTOBOT_ENHANCE",
  "PHOTOBOT_ASSESS",
] as const;

// ─── Style constants ──────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "1.5rem",
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: "1rem",
};

const KPI_VALUE: React.CSSProperties = {
  fontSize: "2rem",
  fontWeight: 800,
  color: "var(--text-primary)",
  lineHeight: 1.2,
};

const KPI_LABEL: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "var(--text-muted)",
  marginTop: "0.3rem",
};

const ACCENT_BAR: React.CSSProperties = {
  width: "48px",
  height: "3px",
  borderRadius: "2px",
  marginBottom: "1rem",
};

const TIMEFRAME_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function pctBar(value: number, max: number, color = "#00bcd4") {
  const pct = max === 0 ? 0 : Math.round(Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginTop: "0.4rem" }}>
      <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "9999px", transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function statPill(label: string, value: string | number, color: string) {
  return (
    <div style={{
      padding: "0.75rem 1rem",
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: "12px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color, fontWeight: 600, opacity: 0.8, marginTop: "0.15rem" }}>{label}</div>
    </div>
  );
}

function emptyVal(label: string) {
  return (
    <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
      {label}
    </div>
  );
}

const BOT_META: Record<string, { label: string; icon: string; color: string }> = {
  ANALYZEBOT:             { label: "AnalyzeBot",     icon: "🔍", color: "#00bcd4" },
  PRICEBOT_RESULT:        { label: "PriceBot",       icon: "💰", color: "#10b981" },
  ANTIQUEBOT_RESULT:      { label: "AntiqueBot",     icon: "🏺", color: "#f59e0b" },
  COLLECTIBLESBOT_RESULT: { label: "CollectiblesBot", icon: "🎭", color: "#8b5cf6" },
  CARBOT_RESULT:          { label: "CarBot",         icon: "🚗", color: "#ef4444" },
  LISTBOT_RESULT:         { label: "ListBot",        icon: "📝", color: "#3b82f6" },
  BUYERBOT_RESULT:        { label: "BuyerBot",       icon: "🎯", color: "#ec4899" },
  RECONBOT_RESULT:        { label: "ReconBot",       icon: "🕵️", color: "#6366f1" },
  PHOTOBOT:               { label: "PhotoBot",       icon: "📸", color: "#14b8a6" },
  MEGABOT:                { label: "MegaBot",        icon: "🤖", color: "#f97316" },
};

function parseTimeframe(tf: string): Date {
  const now = new Date();
  switch (tf) {
    case "7d":  return new Date(now.getTime() - 7 * 86400000);
    case "30d": return new Date(now.getTime() - 30 * 86400000);
    case "90d": return new Date(now.getTime() - 90 * 86400000);
    case "all": return new Date(0);
    default:    return new Date(now.getTime() - 30 * 86400000);
  }
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const params = await searchParams;
  const timeframe = params.timeframe || "30d";
  const tfStart = parseTimeframe(timeframe);

  const user = await authAdapter.getSession();
  if (!user) {
    return (
      <div style={{ ...CARD, maxWidth: "32rem", margin: "3rem auto", textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔒</div>
        <div style={{ ...KPI_VALUE, fontSize: "1.25rem" }}>Please log in</div>
        <Link href="/auth/login" style={{ display: "inline-block", marginTop: "1.5rem", padding: "0.6rem 2rem", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "white", borderRadius: "10px", fontWeight: 700, textDecoration: "none" }}>
          Go to Login
        </Link>
      </div>
    );
  }

  const isAdminUser = isAdmin(user.email);

  // ─── Data fetch ────────────────────────────────────────────────────────
  const items = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { take: 1 },
      valuation: true,
      antiqueCheck: true,
      aiResult: true,
      conversations: { include: { messages: true } },
      engagementMetrics: true,
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: "42rem", margin: "3rem auto", textAlign: "center" }}>
        <div style={{ ...CARD, padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
          <div style={{ ...KPI_VALUE, fontSize: "1.25rem" }}>No data yet</div>
          <div style={{ ...KPI_LABEL, marginTop: "0.5rem", marginBottom: "1.5rem" }}>
            Add and analyze items to see your analytics.
          </div>
          <Link href="/items/new" style={{ display: "inline-block", padding: "0.6rem 2rem", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "white", borderRadius: "10px", fontWeight: 700, textDecoration: "none" }}>
            Add Your First Item
          </Link>
        </div>
      </div>
    );
  }

  const itemIds = items.map((i) => i.id);

  // ─── Bot usage from EventLog ───────────────────────────────────────────
  const botEventsRaw = itemIds.length > 0
    ? await prisma.eventLog.groupBy({
        by: ["eventType"],
        where: {
          itemId: { in: itemIds },
          eventType: { in: [...SPECIALIST_BOT_TYPES] },
        },
        _count: true,
      })
    : [];

  const megaBotCount = itemIds.length > 0
    ? await prisma.eventLog.count({
        where: { itemId: { in: itemIds }, eventType: { startsWith: "MEGABOT_" } },
      })
    : 0;

  const botUsage: Record<string, number> = {};
  for (const ev of botEventsRaw) {
    botUsage[ev.eventType] = ev._count;
  }
  const photoBotTotal =
    (botUsage["PHOTOBOT_EDIT"] ?? 0) +
    (botUsage["PHOTOBOT_ENHANCE"] ?? 0) +
    (botUsage["PHOTOBOT_ASSESS"] ?? 0);

  const analyzedItems = items.filter((i) => i.aiResult).length;
  botUsage["ANALYZEBOT"] = analyzedItems;
  botUsage["PHOTOBOT"] = photoBotTotal;
  botUsage["MEGABOT"] = megaBotCount;

  const totalBotRuns = Object.values(botUsage).reduce((s, v) => s + v, 0);

  // ─── User Activity Metrics ────────────────────────────────────────────
  const totalItems = items.length;
  const listedItems = items.filter((i) => ["LISTED", "INTERESTED", "READY"].includes(i.status)).length;
  const soldItems = items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)).length;
  const draftItems = items.filter((i) => i.status === "DRAFT").length;
  const interestedItems = items.filter((i) => i.status === "INTERESTED").length;
  const antiqueItems = items.filter((i) => i.antiqueCheck?.isAntique).length;

  const allConvs = items.flatMap((i) => i.conversations);
  const totalConversations = allConvs.length;
  const totalMessages = allConvs.flatMap((c) => c.messages).length;
  const unreadMessages = allConvs.flatMap((c) => c.messages).filter((m) => !m.isRead && m.sender === "buyer").length;
  const humanConvs = allConvs.filter((c) => c.botScore >= 80).length;
  const uncertainConvs = allConvs.filter((c) => c.botScore >= 50 && c.botScore < 80).length;
  const botConvs = allConvs.filter((c) => c.botScore < 50).length;
  const avgBotScore = totalConversations > 0 ? Math.round(allConvs.reduce((s, c) => s + c.botScore, 0) / totalConversations) : 0;

  const totalViews = items.reduce((sum, i) => sum + (i.engagementMetrics?.totalViews ?? 0), 0);
  const totalInquiries = items.reduce((sum, i) => sum + (i.engagementMetrics?.inquiries ?? 0), 0);

  const platformCounts: Record<string, number> = {};
  for (const conv of allConvs) {
    platformCounts[conv.platform] = (platformCounts[conv.platform] ?? 0) + 1;
  }
  const platforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // ─── Marketplace Metrics ──────────────────────────────────────────────
  const soldRevenue = items
    .filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status))
    .reduce((sum, i) => sum + (i.listingPrice ? Number(i.listingPrice) : (i.valuation ? (i.valuation.low + i.valuation.high) / 2 : 0)), 0);

  const estimatedPortfolio = items
    .filter((i) => i.valuation && !["SOLD", "SHIPPED", "COMPLETED"].includes(i.status))
    .reduce((sum, i) => sum + (i.valuation?.high ?? 0), 0);

  const soldItemsWithPrice = items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status) && i.listingPrice);
  const avgSalePrice = soldItemsWithPrice.length > 0
    ? soldItemsWithPrice.reduce((sum, i) => sum + Number(i.listingPrice ?? 0), 0) / soldItemsWithPrice.length
    : 0;

  const conversionRate = listedItems + soldItems > 0 ? Math.round((soldItems / (listedItems + soldItems)) * 100) : 0;

  const categoryCounts: Record<string, { count: number; value: number; sold: number }> = {};
  for (const item of items) {
    const ai = safeJson(item.aiResult?.rawJson);
    const cat = (ai?.category as string | undefined)?.split("/")[0]?.trim() ?? "Other";
    if (!categoryCounts[cat]) categoryCounts[cat] = { count: 0, value: 0, sold: 0 };
    categoryCounts[cat].count++;
    categoryCounts[cat].value += item.valuation?.high ?? 0;
    if (["SOLD", "SHIPPED", "COMPLETED"].includes(item.status)) categoryCounts[cat].sold++;
  }
  const categories = Object.entries(categoryCounts).sort((a, b) => b[1].value - a[1].value).slice(0, 8);

  const topItems = [...items]
    .filter((i) => i.valuation)
    .sort((a, b) => (b.valuation?.high ?? 0) - (a.valuation?.high ?? 0))
    .slice(0, 6)
    .map((i) => {
      const ai = safeJson(i.aiResult?.rawJson);
      return {
        id: i.id,
        title: i.title || ai?.item_name || `Item #${i.id.slice(0, 8)}`,
        status: i.status,
        photoUrl: i.photos[0]?.filePath ?? null,
        valuationHigh: i.valuation?.high ?? 0,
        listingPrice: i.listingPrice ? Number(i.listingPrice) : null,
        isAntique: i.antiqueCheck?.isAntique ?? false,
        convCount: i.conversations.length,
        confidence: i.aiResult?.confidence ?? null,
      };
    });

  const statusBreakdown = [
    { label: "Draft", count: draftItems, color: "#64748b" },
    { label: "Analyzed", count: items.filter((i) => i.status === "ANALYZED").length, color: "#00bcd4" },
    { label: "Ready", count: items.filter((i) => i.status === "READY").length, color: "#3b82f6" },
    { label: "Listed", count: items.filter((i) => i.status === "LISTED").length, color: "#8b5cf6" },
    { label: "Interested", count: interestedItems, color: "#f59e0b" },
    { label: "Sold", count: items.filter((i) => i.status === "SOLD").length, color: "#10b981" },
    { label: "Shipped", count: items.filter((i) => i.status === "SHIPPED").length, color: "#6366f1" },
    { label: "Completed", count: items.filter((i) => i.status === "COMPLETED").length, color: "#16a34a" },
  ].filter((s) => s.count > 0);

  // ─── AI Engine Metrics ────────────────────────────────────────────────
  const avgConfidence = analyzedItems > 0
    ? items.filter((i) => i.aiResult).reduce((sum, i) => sum + i.aiResult!.confidence, 0) / analyzedItems
    : 0;

  const accuracyItems = items.filter((i) =>
    ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status) && i.listingPrice != null && i.valuation != null
  );
  const avgDeviation = accuracyItems.length > 0
    ? accuracyItems.reduce((sum, i) => {
        const mid = (i.valuation!.low + i.valuation!.high) / 2;
        const listed = Number(i.listingPrice!);
        return sum + Math.abs(mid > 0 ? (listed - mid) / mid : 0);
      }, 0) / accuracyItems.length
    : null;

  const userCredits = await prisma.userCredits.findUnique({ where: { userId: user.id } }).catch(() => null);
  const creditBalance = userCredits?.balance ?? 0;
  const creditLifetime = userCredits?.lifetime ?? 0;
  const creditSpent = userCredits?.spent ?? 0;

  const enrichmentStats = { none: 0, low: 0, medium: 0, high: 0 };
  for (const item of items) {
    let src = 0;
    if (item.aiResult) src++;
    if (item.valuation) src++;
    if (item.antiqueCheck) src++;
    if ((item as any).megabotUsed) src += 2;
    if (src === 0) enrichmentStats.none++;
    else if (src <= 2) enrichmentStats.low++;
    else if (src <= 4) enrichmentStats.medium++;
    else enrichmentStats.high++;
  }

  const funnel = [
    { label: "Created", count: totalItems, color: "#64748b" },
    { label: "Analyzed", count: analyzedItems, color: "#00bcd4" },
    { label: "Listed", count: listedItems + soldItems, color: "#8b5cf6" },
    { label: "Sold", count: soldItems, color: "#10b981" },
  ];

  // ═════════════════════════════════════════════════════════════════════
  // v2 DATA QUERIES
  // ═════════════════════════════════════════════════════════════════════

  // ─── Trending (time-filtered) ─────────────────────────────────────────
  const itemsInPeriod = items.filter((i) => i.createdAt >= tfStart);
  const salesInPeriod = itemsInPeriod.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status));
  const revenueInPeriod = salesInPeriod.reduce(
    (sum, i) => sum + (i.listingPrice ? Number(i.listingPrice) : (i.valuation ? (i.valuation.low + i.valuation.high) / 2 : 0)), 0
  );

  let botRunsInPeriod = 0;
  let creditsSpentInPeriod = 0;
  try {
    if (itemIds.length > 0) {
      botRunsInPeriod =
        (await prisma.eventLog.count({
          where: { itemId: { in: itemIds }, createdAt: { gte: tfStart }, eventType: { in: [...SPECIALIST_BOT_TYPES] } },
        })) +
        (await prisma.eventLog.count({
          where: { itemId: { in: itemIds }, createdAt: { gte: tfStart }, eventType: { startsWith: "MEGABOT_" } },
        }));
    }
    if (userCredits) {
      const txAgg = await prisma.creditTransaction.aggregate({
        where: { userCreditsId: userCredits.id, type: "spend", createdAt: { gte: tfStart } },
        _sum: { amount: true },
      });
      creditsSpentInPeriod = Math.abs(txAgg._sum.amount ?? 0);
    }
  } catch {}

  // ─── Fulfillment ──────────────────────────────────────────────────────
  const pickupCompletions = items.filter((i) => i.pickupStatus === "COMPLETED").length;
  const ltlCompletions = items.filter((i) => i.ltlStatus === "DELIVERED").length;
  const bolsGenerated = items.filter((i) => i.ltlBolNumber != null).length;
  const totalFulfilled = pickupCompletions + ltlCompletions;

  const pickupTimedItems = items.filter((i) => i.pickupConfirmedAt && i.pickupCompletedAt);
  const avgDaysPickupToClose = pickupTimedItems.length > 0
    ? Math.round(
        pickupTimedItems.reduce((sum, i) => {
          return sum + (i.pickupCompletedAt!.getTime() - i.pickupConfirmedAt!.getTime()) / 86400000;
        }, 0) / pickupTimedItems.length * 10
      ) / 10
    : null;

  // ─── Authenticity & Grading ───────────────────────────────────────────
  const antiqueScores = items
    .filter((i) => i.antiqueCheck?.authenticityScore != null && i.antiqueCheck.authenticityScore > 0)
    .map((i) => i.antiqueCheck!.authenticityScore!);

  const antiqueAmber = antiqueScores.filter((s) => s >= 1 && s <= 33).length;
  const antiqueGold = antiqueScores.filter((s) => s >= 34 && s <= 66).length;
  const antiquePlatinum = antiqueScores.filter((s) => s >= 67 && s <= 100).length;

  // Collectibles grade from EventLog payload
  let collectiblesBronze = 0;
  let collectiblesSilver = 0;
  let collectiblesGold = 0;
  let collectiblesTotal = 0;
  try {
    if (itemIds.length > 0) {
      const collectiblesLogs = await prisma.eventLog.findMany({
        where: { itemId: { in: itemIds }, eventType: "COLLECTIBLESBOT_RESULT" },
        select: { payload: true },
      });
      for (const log of collectiblesLogs) {
        const payload = safeJson(log.payload);
        const confidence = payload?.grade_confidence;
        if (typeof confidence === "number" && confidence > 0) {
          const score = Math.round(confidence * 100);
          collectiblesTotal++;
          if (score <= 33) collectiblesBronze++;
          else if (score <= 66) collectiblesSilver++;
          else collectiblesGold++;
        }
      }
    }
  } catch {}

  // ─── Value Distribution ───────────────────────────────────────────────
  const valueBuckets = [
    { bucket: "Under $50", min: 0, max: 50, count: 0, color: "#64748b" },
    { bucket: "$50–$200", min: 50, max: 200, count: 0, color: "#00bcd4" },
    { bucket: "$200–$500", min: 200, max: 500, count: 0, color: "#3b82f6" },
    { bucket: "$500–$1K", min: 500, max: 1000, count: 0, color: "#8b5cf6" },
    { bucket: "$1,000+", min: 1000, max: Infinity, count: 0, color: "#10b981" },
  ];
  for (const item of items) {
    const value = item.listingPrice
      ? Number(item.listingPrice)
      : item.valuation
        ? (item.valuation.low + item.valuation.high) / 2
        : null;
    if (value == null || value <= 0) continue;
    for (const b of valueBuckets) {
      if (value >= b.min && value < b.max) { b.count++; break; }
    }
  }
  const maxBucketCount = Math.max(1, ...valueBuckets.map((b) => b.count));

  // ─── Credit Economy ───────────────────────────────────────────────────
  let topCreditBots: { bot: string; credits: number }[] = [];
  let avgCreditsPerItem: number | null = null;
  let botROI: number | null = null;
  try {
    if (userCredits) {
      const spendTxs = await prisma.creditTransaction.findMany({
        where: { userCreditsId: userCredits.id, type: "spend" },
        select: { description: true, amount: true },
      });
      const botCreditMap: Record<string, number> = {};
      const keywords = ["analyze", "price", "antique", "collectible", "car", "list", "buyer", "recon", "photo", "mega"];
      for (const tx of spendTxs) {
        const desc = tx.description.toLowerCase();
        let matched = false;
        for (const kw of keywords) {
          if (desc.includes(kw)) {
            const label = kw.charAt(0).toUpperCase() + kw.slice(1) + "Bot";
            botCreditMap[label] = (botCreditMap[label] ?? 0) + Math.abs(tx.amount);
            matched = true;
            break;
          }
        }
        if (!matched) botCreditMap["Other"] = (botCreditMap["Other"] ?? 0) + Math.abs(tx.amount);
      }
      topCreditBots = Object.entries(botCreditMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([bot, credits]) => ({ bot, credits }));

      const itemsWithRuns = items.filter((i) => i.aiResult || (i as any).megabotUsed).length;
      avgCreditsPerItem = itemsWithRuns > 0 ? Math.round((creditSpent / itemsWithRuns) * 10) / 10 : null;
      botROI = creditSpent > 0 && soldRevenue > 0 ? Math.round((soldRevenue / creditSpent) * 100) / 100 : null;
    }
  } catch {}

  // ─── Time to Value ────────────────────────────────────────────────────
  let avgHoursToFirstBot: number | null = null;
  let avgBotsBeforeSale: number | null = null;
  try {
    if (itemIds.length > 0) {
      const firstEvents = await prisma.eventLog.groupBy({
        by: ["itemId"],
        where: { itemId: { in: itemIds } },
        _min: { createdAt: true },
      });
      const firstMap = new Map<string, Date>();
      for (const fe of firstEvents) {
        if (fe._min.createdAt) firstMap.set(fe.itemId, fe._min.createdAt);
      }
      let totalHours = 0;
      let count = 0;
      for (const item of items) {
        const first = firstMap.get(item.id);
        if (first) {
          const h = (first.getTime() - item.createdAt.getTime()) / 3600000;
          if (h >= 0) { totalHours += h; count++; }
        }
      }
      avgHoursToFirstBot = count > 0 ? Math.round((totalHours / count) * 10) / 10 : null;

      const soldIds = items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)).map((i) => i.id);
      if (soldIds.length > 0) {
        const soldCounts = await prisma.eventLog.groupBy({
          by: ["itemId"],
          where: { itemId: { in: soldIds } },
          _count: true,
        });
        const total = soldCounts.reduce((s, e) => s + e._count, 0);
        avgBotsBeforeSale = Math.round((total / soldIds.length) * 10) / 10;
      }
    }
  } catch {}

  // ─── RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div>
          <div style={ACCENT_BAR} />
          <div style={{ ...SECTION_TITLE, marginBottom: "0.5rem" }}>Performance</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Analytics Dashboard</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
            {totalItems} items · {analyzedItems} analyzed · {totalBotRuns} bot runs
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {isAdminUser && (
            <Link href="/admin" style={{ padding: "0.5rem 1rem", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", color: "#8b5cf6", fontWeight: 600, fontSize: "0.8rem", textDecoration: "none" }}>
              Admin Portal
            </Link>
          )}
          <Link href="/dashboard" style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.8rem", textDecoration: "none" }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* ── Time Filter Bar ── */}
      <div style={{
        display: "flex",
        gap: "0.25rem",
        marginBottom: "2rem",
        padding: "0.3rem",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        width: "fit-content",
      }}>
        {TIMEFRAME_OPTIONS.map((opt) => {
          const isActive = timeframe === opt.value;
          return (
            <Link
              key={opt.value}
              href={`/analytics?timeframe=${opt.value}`}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "#00bcd4" : "var(--text-muted)",
                background: isActive ? "rgba(0,188,212,0.1)" : "transparent",
                border: isActive ? "1px solid rgba(0,188,212,0.25)" : "1px solid transparent",
                transition: "all 0.2s",
              }}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TRENDING METRICS (time-filtered)
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #f59e0b, #d97706)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        Trending · {TIMEFRAME_OPTIONS.find((o) => o.value === timeframe)?.label ?? "Last 30 Days"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Bot Runs</div>
          <div style={{ ...KPI_VALUE, color: "#f59e0b" }}>{botRunsInPeriod}</div>
          <div style={KPI_LABEL}>this period</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Items Created</div>
          <div style={{ ...KPI_VALUE, color: "#00bcd4" }}>{itemsInPeriod.length}</div>
          <div style={KPI_LABEL}>new items</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Sales</div>
          <div style={{ ...KPI_VALUE, color: "#10b981" }}>{salesInPeriod.length}</div>
          <div style={KPI_LABEL}>items sold</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Revenue</div>
          <div style={{ ...KPI_VALUE, color: "#10b981" }}>${Math.round(revenueInPeriod).toLocaleString()}</div>
          <div style={KPI_LABEL}>realized</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Credits Spent</div>
          <div style={{ ...KPI_VALUE, color: "#8b5cf6" }}>{creditsSpentInPeriod}</div>
          <div style={KPI_LABEL}>consumed</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: USER ACTIVITY
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #00bcd4, #009688)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        User Activity
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Total Items</div>
          <div style={KPI_VALUE}>{totalItems}</div>
          <div style={KPI_LABEL}>{draftItems} draft · {analyzedItems} analyzed</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Active Listings</div>
          <div style={{ ...KPI_VALUE, color: "#8b5cf6" }}>{listedItems}</div>
          <div style={KPI_LABEL}>{interestedItems} with interest</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Conversations</div>
          <div style={{ ...KPI_VALUE, color: "#00bcd4" }}>{totalConversations}</div>
          <div style={KPI_LABEL}>{totalMessages} msgs · {unreadMessages} unread</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Engagement</div>
          <div style={{ ...KPI_VALUE, color: "#10b981" }}>{totalViews.toLocaleString()}</div>
          <div style={KPI_LABEL}>views · {totalInquiries} inquiries</div>
        </div>
      </div>

      {/* Status breakdown + Buyer quality + Conversion funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>

        {/* Status Breakdown */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Item Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {statusBreakdown.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
                {pctBar(s.count, totalItems, s.color)}
              </div>
            ))}
          </div>
          {antiqueItems > 0 && (
            <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.7rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", fontSize: "0.78rem", color: "#f59e0b", fontWeight: 600 }}>
              🏺 {antiqueItems} antique{antiqueItems !== 1 ? "s" : ""} detected
            </div>
          )}
        </div>

        {/* Buyer Quality */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Buyer Quality</div>
          {totalConversations === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No conversations yet</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
                {statPill("Conversations", totalConversations, "#00bcd4")}
                {statPill("Unread", unreadMessages, unreadMessages > 0 ? "#f59e0b" : "#64748b")}
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                Avg bot score: {avgBotScore}
              </div>
              <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem" }}>
                {humanConvs > 0 && (
                  <div style={{ flex: humanConvs, padding: "0.25rem", background: "rgba(16,185,129,0.15)", borderRadius: "6px", textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "#10b981" }}>
                    ✓ {humanConvs}
                  </div>
                )}
                {uncertainConvs > 0 && (
                  <div style={{ flex: uncertainConvs, padding: "0.25rem", background: "rgba(245,158,11,0.15)", borderRadius: "6px", textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "#f59e0b" }}>
                    ? {uncertainConvs}
                  </div>
                )}
                {botConvs > 0 && (
                  <div style={{ flex: botConvs, padding: "0.25rem", background: "rgba(239,68,68,0.15)", borderRadius: "6px", textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "#ef4444" }}>
                    ⚠ {botConvs}
                  </div>
                )}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {totalMessages} messages · {totalConversations > 0 ? Math.round((humanConvs / totalConversations) * 100) : 0}% real buyers
              </div>
            </>
          )}
        </div>

        {/* Conversion Funnel */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Conversion Funnel</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {funnel.map((step, i) => {
              const pct = totalItems > 0 ? Math.round((step.count / totalItems) * 100) : 0;
              return (
                <div key={step.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{step.label}</span>
                    <span style={{ color: step.color, fontWeight: 700 }}>{step.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${step.color}, ${step.color}88)`,
                      borderRadius: "9999px",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                  {i < funnel.length - 1 && (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.65rem", margin: "0.15rem 0" }}>↓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platforms */}
      {platforms.length > 0 && (
        <div style={{ ...CARD, marginBottom: "2rem" }}>
          <div style={SECTION_TITLE}>Buyer Platforms</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {platforms.map(([platform, count]) => (
              <div key={platform} style={{ padding: "0.6rem 0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)", textTransform: "capitalize" }}>
                    {platform === "direct" ? "🔗 Direct" :
                     platform.includes("Facebook") ? "📘 Facebook" :
                     platform.includes("Craigslist") ? "🗞 Craigslist" :
                     platform.includes("eBay") ? "🛒 eBay" :
                     `📱 ${platform}`}
                  </span>
                  <span style={{ fontWeight: 700, color: "#00bcd4" }}>{count}</span>
                </div>
                {pctBar(count, Math.max(...platforms.map((p) => p[1])))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: MARKETPLACE
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #10b981, #059669)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        Marketplace Performance
      </div>

      {/* Revenue KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Realized Revenue</div>
          <div style={{ ...KPI_VALUE, color: soldRevenue > 0 ? "#10b981" : "var(--text-primary)" }}>
            ${Math.round(soldRevenue).toLocaleString()}
          </div>
          <div style={KPI_LABEL}>{soldItems} item{soldItems !== 1 ? "s" : ""} sold</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Portfolio Value</div>
          <div style={{ ...KPI_VALUE, color: "#00bcd4" }}>
            ${Math.round(estimatedPortfolio).toLocaleString()}
          </div>
          <div style={KPI_LABEL}>unsold high estimate</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Conversion Rate</div>
          <div style={KPI_VALUE}>{conversionRate}%</div>
          {pctBar(conversionRate, 100, "#10b981")}
          <div style={KPI_LABEL}>{soldItems} sold / {listedItems + soldItems} listed</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Avg Sale Price</div>
          <div style={{ ...KPI_VALUE, color: avgSalePrice > 0 ? "#10b981" : "var(--text-muted)" }}>
            {avgSalePrice > 0 ? `$${Math.round(avgSalePrice).toLocaleString()}` : "—"}
          </div>
          <div style={KPI_LABEL}>{soldItemsWithPrice.length} sold with price</div>
        </div>
      </div>

      {/* Category + Top Items */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "1rem", marginBottom: "2rem" }}>

        {/* Category Performance */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Category Performance</div>
          {categories.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Analyze items to see categories.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    {["Category", "Items", "Sold", "Est. Value", "Conv."].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.5rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(([cat, data]) => (
                    <tr key={cat}>
                      <td style={{ padding: "0.5rem", fontWeight: 600, color: "var(--text-primary)" }}>{cat}</td>
                      <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>{data.count}</td>
                      <td style={{ padding: "0.5rem" }}>
                        <span style={{ color: data.sold > 0 ? "#10b981" : "var(--text-muted)", fontWeight: data.sold > 0 ? 700 : 400 }}>
                          {data.sold}
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem", color: "#00bcd4", fontWeight: 600 }}>
                        ${Math.round(data.value).toLocaleString()}
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        {data.count > 0 ? (
                          <span style={{ color: data.sold / data.count > 0.5 ? "#10b981" : "var(--text-muted)" }}>
                            {Math.round((data.sold / data.count) * 100)}%
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Items */}
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={SECTION_TITLE}>Top Items by Value</div>
            <Link href="/dashboard" style={{ fontSize: "0.75rem", color: "#00bcd4", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {topItems.map((item, i) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", width: "1.2rem", textAlign: "center", flexShrink: 0 }}>
                  #{i + 1}
                </div>
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt="" style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.06)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "1rem" }}>📷</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                    {item.isAntique && <span style={{ marginLeft: "0.3rem", fontSize: "0.7rem" }}>🏺</span>}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    {item.status}{item.convCount > 0 && ` · ${item.convCount} buyer${item.convCount !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: "#00bcd4", fontSize: "0.85rem" }}>
                    ${item.listingPrice != null ? item.listingPrice.toLocaleString() : Math.round(item.valuationHigh).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: AI ENGINE
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #8b5cf6, #6366f1)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        AI Engine Metrics
      </div>

      {/* AI KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={CARD}>
          <div style={SECTION_TITLE}>AI Confidence</div>
          <div style={{ ...KPI_VALUE, color: avgConfidence > 0.7 ? "#10b981" : "#f59e0b" }}>
            {Math.round(avgConfidence * 100)}%
          </div>
          {pctBar(avgConfidence * 100, 100, avgConfidence > 0.7 ? "#10b981" : "#f59e0b")}
          <div style={KPI_LABEL}>avg across {analyzedItems} analyses</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Total Bot Runs</div>
          <div style={{ ...KPI_VALUE, color: "#8b5cf6" }}>{totalBotRuns}</div>
          <div style={KPI_LABEL}>across {Object.keys(BOT_META).length} bots</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Credits</div>
          <div style={{ ...KPI_VALUE, color: "#00bcd4" }}>{creditBalance}</div>
          <div style={KPI_LABEL}>{creditLifetime} earned · {creditSpent} spent</div>
        </div>
        {avgDeviation != null && (
          <div style={CARD}>
            <div style={SECTION_TITLE}>Price Accuracy</div>
            <div style={{ ...KPI_VALUE, color: avgDeviation < 0.15 ? "#10b981" : "#f59e0b" }}>
              {Math.round(avgDeviation * 100)}%
            </div>
            <div style={KPI_LABEL}>avg deviation on {accuracyItems.length} sold</div>
          </div>
        )}
      </div>

      {/* Bot Usage Grid */}
      <div style={{ ...CARD, marginBottom: "1.5rem" }}>
        <div style={SECTION_TITLE}>Bot Usage Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
          {Object.entries(BOT_META).map(([key, meta]) => {
            const count = botUsage[key] ?? 0;
            return (
              <div
                key={key}
                style={{
                  padding: "1rem",
                  background: count > 0 ? `${meta.color}10` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${count > 0 ? `${meta.color}30` : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "12px",
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>{meta.icon}</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: count > 0 ? meta.color : "var(--text-muted)" }}>
                  {count}
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: count > 0 ? meta.color : "var(--text-muted)", opacity: 0.8, marginTop: "0.15rem" }}>
                  {meta.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrichment + Pricing Accuracy row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>

        {/* Enrichment Stats */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Enrichment Coverage</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {([
              { label: "High (5+ sources)", count: enrichmentStats.high, color: "#10b981" },
              { label: "Medium (3-4 sources)", count: enrichmentStats.medium, color: "#00bcd4" },
              { label: "Low (1-2 sources)", count: enrichmentStats.low, color: "#f59e0b" },
              { label: "None", count: enrichmentStats.none, color: "#64748b" },
            ] as const).map((level) => (
              <div key={level.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{level.label}</span>
                  <span style={{ fontWeight: 700, color: level.color }}>
                    {level.count} item{level.count !== 1 ? "s" : ""}
                  </span>
                </div>
                {pctBar(level.count, totalItems, level.color)}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Cross-bot enrichment feeds each bot with insights from all prior runs.
          </div>
        </div>

        {/* AI Pricing Detail */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>AI Pricing Engine</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
            {statPill("Analyzed", analyzedItems, "#00bcd4")}
            {statPill("Antiques", antiqueItems, "#f59e0b")}
            {statPill("MegaBot Items", items.filter((i) => (i as any).megabotUsed).length, "#f97316")}
            {statPill("Avg Sale", avgSalePrice > 0 ? `$${Math.round(avgSalePrice).toLocaleString()}` : "—", "#10b981")}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            AI pricing uses OpenAI vision + live market comparables + location-based multipliers.
            {antiqueItems > 0 && " Antique items may command higher prices at auction."}
            {" "}MegaBot combines 3 AI models for consensus pricing.
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: FULFILLMENT & SHIPPING
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #6366f1, #4f46e5)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        Fulfillment & Shipping
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Pickup Completions</div>
          <div style={{ ...KPI_VALUE, color: pickupCompletions > 0 ? "#10b981" : "var(--text-muted)" }}>
            {pickupCompletions}
          </div>
          <div style={KPI_LABEL}>items handed off</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>LTL Completions</div>
          <div style={{ ...KPI_VALUE, color: ltlCompletions > 0 ? "#6366f1" : "var(--text-muted)" }}>
            {ltlCompletions}
          </div>
          <div style={KPI_LABEL}>freight delivered</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>BOLs Generated</div>
          <div style={{ ...KPI_VALUE, color: bolsGenerated > 0 ? "#00bcd4" : "var(--text-muted)" }}>
            {bolsGenerated}
          </div>
          <div style={KPI_LABEL}>bills of lading</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Total Fulfilled</div>
          <div style={{ ...KPI_VALUE, color: totalFulfilled > 0 ? "#10b981" : "var(--text-muted)" }}>
            {totalFulfilled}
          </div>
          <div style={KPI_LABEL}>
            {avgDaysPickupToClose != null
              ? `avg ${avgDaysPickupToClose}d to close`
              : "pickup + LTL combined"}
          </div>
        </div>
      </div>

      {/* Pickup vs LTL split bar */}
      {totalFulfilled > 0 && (
        <div style={{ ...CARD, marginBottom: "2rem" }}>
          <div style={SECTION_TITLE}>Fulfillment Method Split</div>
          <div style={{ display: "flex", gap: "0.25rem", height: "32px", borderRadius: "8px", overflow: "hidden" }}>
            {pickupCompletions > 0 && (
              <div style={{
                flex: pickupCompletions,
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "white",
              }}>
                Pickup {Math.round((pickupCompletions / totalFulfilled) * 100)}%
              </div>
            )}
            {ltlCompletions > 0 && (
              <div style={{
                flex: ltlCompletions,
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "white",
              }}>
                LTL Freight {Math.round((ltlCompletions / totalFulfilled) * 100)}%
              </div>
            )}
          </div>
        </div>
      )}
      {totalFulfilled === 0 && (
        <div style={{ ...CARD, marginBottom: "2rem" }}>
          {emptyVal("No fulfillments completed yet. Sell items to see pickup and shipping metrics.")}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: AUTHENTICATION & GRADING
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        Authentication & Grading
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>

        {/* Antique Authenticity Distribution */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Antique Authenticity Score</div>
          {antiqueScores.length === 0 ? (
            emptyVal("No authenticity scores yet. Run AntiqueBot to generate scores.")
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              {/* Amber */}
              <div style={{
                padding: "1rem 0.75rem",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#f59e0b", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Amber</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f59e0b" }}>{antiqueAmber}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Score 1–33</div>
              </div>
              {/* Gold */}
              <div style={{
                padding: "1rem 0.75rem",
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#fbbf24", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Gold</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fbbf24" }}>{antiqueGold}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Score 34–66</div>
              </div>
              {/* Platinum */}
              <div style={{
                padding: "1rem 0.75rem",
                background: "rgba(226,232,240,0.08)",
                border: "1px solid rgba(226,232,240,0.2)",
                borderRadius: "12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Platinum</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#e2e8f0" }}>{antiquePlatinum}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Score 67–100</div>
              </div>
            </div>
          )}
        </div>

        {/* Collectibles Grade Distribution */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Collectibles Collector Grade</div>
          {collectiblesTotal === 0 ? (
            emptyVal("No collectible grades yet. Run CollectiblesBot to generate grades.")
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              {/* Bronze */}
              <div style={{
                padding: "1rem 0.75rem",
                background: "rgba(205,127,50,0.08)",
                border: "1px solid rgba(205,127,50,0.2)",
                borderRadius: "12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#cd7f32", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Bronze</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#cd7f32" }}>{collectiblesBronze}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Score 1–33</div>
              </div>
              {/* Silver */}
              <div style={{
                padding: "1rem 0.75rem",
                background: "rgba(148,163,184,0.08)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: "12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Silver</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#94a3b8" }}>{collectiblesSilver}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Score 34–66</div>
              </div>
              {/* Gold */}
              <div style={{
                padding: "1rem 0.75rem",
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#fbbf24", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Gold</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fbbf24" }}>{collectiblesGold}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Score 67–100</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6: VALUE DISTRIBUTION
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #3b82f6, #2563eb)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        Item Value Distribution
      </div>

      <div style={{ ...CARD, marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {valueBuckets.map((b) => (
            <div key={b.bucket}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{b.bucket}</span>
                <span style={{ fontWeight: 700, color: b.color }}>
                  {b.count} item{b.count !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ height: "24px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.max(2, (b.count / maxBucketCount) * 100)}%`,
                  background: `linear-gradient(90deg, ${b.color}, ${b.color}88)`,
                  borderRadius: "8px",
                  transition: "width 0.6s ease",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "0.5rem",
                }}>
                  {b.count > 0 && (
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "white" }}>{b.count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Values derived from listing price (sold items) or AI valuation midpoint (unsold items).
          LegacyLoop handles everything from $5 garage sale finds to $5,000+ estate pieces.
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7: CREDIT ECONOMY
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #ec4899, #db2777)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        Credit Economy
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Total Purchased</div>
          <div style={{ ...KPI_VALUE, color: "#ec4899" }}>{creditLifetime}</div>
          <div style={KPI_LABEL}>lifetime credits earned</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Total Spent</div>
          <div style={{ ...KPI_VALUE, color: "#f59e0b" }}>{creditSpent}</div>
          <div style={KPI_LABEL}>credits consumed</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Currently Held</div>
          <div style={{ ...KPI_VALUE, color: "#00bcd4" }}>{creditBalance}</div>
          <div style={KPI_LABEL}>available balance</div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Bot ROI</div>
          <div style={{ ...KPI_VALUE, color: botROI != null ? "#10b981" : "var(--text-muted)" }}>
            {botROI != null ? `$${botROI}` : "—"}
          </div>
          <div style={KPI_LABEL}>
            {botROI != null ? "sale value per credit" : "sell items to see ROI"}
          </div>
        </div>
      </div>

      {/* Top credit-consuming bots */}
      {topCreditBots.length > 0 && (
        <div style={{ ...CARD, marginBottom: "2rem" }}>
          <div style={SECTION_TITLE}>Top Credit-Consuming Bots</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {topCreditBots.map((entry, i) => (
              <div key={entry.bot} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "1.5rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)" }}>
                  #{i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{entry.bot}</span>
                    <span style={{ fontWeight: 700, color: "#ec4899" }}>{entry.credits} cr</span>
                  </div>
                  {pctBar(entry.credits, topCreditBots[0].credits, "#ec4899")}
                </div>
              </div>
            ))}
          </div>
          {avgCreditsPerItem != null && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Avg {avgCreditsPerItem} credits spent per item with bot analysis.
            </div>
          )}
        </div>
      )}
      {topCreditBots.length === 0 && (
        <div style={{ ...CARD, marginBottom: "2rem" }}>
          {emptyVal("No credit usage recorded yet. Run bots to see credit consumption patterns.")}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8: TIME TO VALUE
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...ACCENT_BAR, background: "linear-gradient(90deg, #14b8a6, #0d9488)" }} />
      <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.2rem", marginBottom: "1.25rem" }}>
        Time to Value
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Upload to First Bot</div>
          <div style={{ ...KPI_VALUE, color: avgHoursToFirstBot != null ? "#14b8a6" : "var(--text-muted)" }}>
            {avgHoursToFirstBot != null
              ? avgHoursToFirstBot < 1
                ? `${Math.round(avgHoursToFirstBot * 60)}m`
                : `${avgHoursToFirstBot}h`
              : "—"}
          </div>
          <div style={KPI_LABEL}>
            {avgHoursToFirstBot != null ? "avg time to first AI analysis" : "upload items to see timing"}
          </div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Listed to Sold</div>
          <div style={{ ...KPI_VALUE, color: "var(--text-muted)" }}>—</div>
          <div style={KPI_LABEL} title="No listedAt/soldAt timestamps in current schema">
            coming soon
          </div>
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Bots Before Sale</div>
          <div style={{ ...KPI_VALUE, color: avgBotsBeforeSale != null ? "#14b8a6" : "var(--text-muted)" }}>
            {avgBotsBeforeSale ?? "—"}
          </div>
          <div style={KPI_LABEL}>
            {avgBotsBeforeSale != null ? "avg bot runs per sold item" : "sell items to see this metric"}
          </div>
        </div>
      </div>

      {/* Pro tip */}
      <div style={{
        padding: "1rem 1.25rem",
        background: "rgba(16,185,129,0.06)",
        border: "1px solid rgba(16,185,129,0.15)",
        borderRadius: "12px",
        fontSize: "0.82rem",
        color: "#10b981",
        lineHeight: 1.6,
        marginBottom: "2rem",
      }}>
        <strong>Pro tip:</strong> Items with antique flags and MegaBot consensus pricing achieve 20–40% higher sale prices.
        Run MegaBot on your high-value items for multi-AI price confidence.
      </div>
    </div>
  );
}
