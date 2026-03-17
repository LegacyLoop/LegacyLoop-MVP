import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/utils/json";

import { isAdmin } from "@/lib/constants/admin";

// All specialist bot eventTypes stored in EventLog
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

/**
 * GET /api/analytics?scope=seller|admin&timeframe=7d|30d|90d|all
 *
 * Returns comprehensive analytics across three metric families:
 *  1. User Activity  — items, statuses, conversations, engagement
 *  2. Marketplace    — revenue, portfolio, conversion, categories, top items
 *  3. AI Engine      — bot usage (all 10), enrichment, credits, pricing accuracy
 *
 * Plus extended blocks:
 *  4. Trending       — time-filtered counts
 *  5. Fulfillment    — pickup/LTL completions
 *  6. Scoring        — antique authenticity + collectibles grade distribution
 *  7. Value Distribution — item price buckets
 *  8. Credit Economy — credit health metrics
 *  9. Time to Value  — speed metrics
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = req.nextUrl.searchParams.get("scope") || "seller";
    const timeframe = req.nextUrl.searchParams.get("timeframe") || "30d";
    const isAdminUser = isAdmin(user.email);
    const isAdminView = scope === "admin" && isAdminUser;
    const tfStart = parseTimeframe(timeframe);

    const itemWhere = isAdminView ? {} : { userId: user.id };

    // ─── Core item query ────────────────────────────────────────────────
    const items = await prisma.item.findMany({
      where: itemWhere,
      include: {
        photos: { take: 1 },
        valuation: true,
        antiqueCheck: true,
        aiResult: true,
        conversations: { include: { messages: true } },
        engagementMetrics: true,
      },
    });

    const itemIds = items.map((i) => i.id);

    // ─── Bot usage from EventLog ────────────────────────────────────────
    const botEvents = itemIds.length > 0
      ? await prisma.eventLog.groupBy({
          by: ["eventType"],
          where: {
            itemId: { in: itemIds },
            eventType: { in: [...SPECIALIST_BOT_TYPES] },
          },
          _count: true,
        })
      : [];

    // MegaBot uses MEGABOT_ prefix — count separately
    const megaBotCount = itemIds.length > 0
      ? await prisma.eventLog.count({
          where: {
            itemId: { in: itemIds },
            eventType: { startsWith: "MEGABOT_" },
          },
        })
      : 0;

    // Items that used MegaBot (via megabotUsed flag)
    const megaBotItemCount = items.filter((i) => (i as any).megabotUsed).length;

    // ─── User Activity Metrics ──────────────────────────────────────────
    const totalItems = items.length;
    const statusCounts: Record<string, number> = {};
    for (const item of items) {
      statusCounts[item.status] = (statusCounts[item.status] ?? 0) + 1;
    }

    const analyzedItems = items.filter((i) => i.aiResult).length;
    const listedItems = items.filter((i) =>
      ["LISTED", "INTERESTED", "READY"].includes(i.status)
    ).length;
    const soldItems = items.filter((i) =>
      ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)
    ).length;
    const antiqueItems = items.filter((i) => i.antiqueCheck?.isAntique).length;

    // Conversations
    const allConvs = items.flatMap((i) => i.conversations);
    const totalConversations = allConvs.length;
    const totalMessages = allConvs.flatMap((c) => c.messages).length;
    const unreadMessages = allConvs
      .flatMap((c) => c.messages)
      .filter((m) => !m.isRead && m.sender === "buyer").length;
    const avgBotScore =
      totalConversations > 0
        ? Math.round(
            allConvs.reduce((s, c) => s + c.botScore, 0) / totalConversations
          )
        : 0;
    const humanConvs = allConvs.filter((c) => c.botScore >= 80).length;
    const uncertainConvs = allConvs.filter(
      (c) => c.botScore >= 50 && c.botScore < 80
    ).length;
    const botConvs = allConvs.filter((c) => c.botScore < 50).length;

    // Platform breakdown
    const platformCounts: Record<string, number> = {};
    for (const conv of allConvs) {
      platformCounts[conv.platform] = (platformCounts[conv.platform] ?? 0) + 1;
    }

    // Engagement metrics
    const totalViews = items.reduce(
      (sum, i) => sum + (i.engagementMetrics?.totalViews ?? 0),
      0
    );
    const totalInquiries = items.reduce(
      (sum, i) => sum + (i.engagementMetrics?.inquiries ?? 0),
      0
    );

    // ─── Marketplace Metrics ────────────────────────────────────────────
    const soldRevenue = items
      .filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status))
      .reduce(
        (sum, i) =>
          sum +
          (i.listingPrice
            ? Number(i.listingPrice)
            : i.valuation
              ? (i.valuation.low + i.valuation.high) / 2
              : 0),
        0
      );

    const estimatedPortfolio = items
      .filter(
        (i) =>
          i.valuation && !["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)
      )
      .reduce((sum, i) => sum + (i.valuation?.high ?? 0), 0);

    const soldItemsWithPrice = items.filter(
      (i) =>
        ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status) && i.listingPrice
    );
    const avgSalePrice =
      soldItemsWithPrice.length > 0
        ? soldItemsWithPrice.reduce(
            (sum, i) => sum + Number(i.listingPrice ?? 0),
            0
          ) / soldItemsWithPrice.length
        : 0;

    const conversionRate =
      listedItems + soldItems > 0
        ? Math.round((soldItems / (listedItems + soldItems)) * 100)
        : 0;

    // Category breakdown
    const categoryCounts: Record<
      string,
      { count: number; value: number; sold: number }
    > = {};
    for (const item of items) {
      const ai = safeJson(item.aiResult?.rawJson);
      const cat =
        (ai?.category as string | undefined)?.split("/")[0]?.trim() ?? "Other";
      if (!categoryCounts[cat])
        categoryCounts[cat] = { count: 0, value: 0, sold: 0 };
      categoryCounts[cat].count++;
      categoryCounts[cat].value += item.valuation?.high ?? 0;
      if (["SOLD", "SHIPPED", "COMPLETED"].includes(item.status))
        categoryCounts[cat].sold++;
    }
    const categories = Object.entries(categoryCounts)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 10);

    // Top items
    const topItems = [...items]
      .filter((i) => i.valuation)
      .sort((a, b) => (b.valuation?.high ?? 0) - (a.valuation?.high ?? 0))
      .slice(0, 8)
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

    // ─── AI Engine Metrics ──────────────────────────────────────────────
    const avgConfidence =
      analyzedItems > 0
        ? items
            .filter((i) => i.aiResult)
            .reduce((sum, i) => sum + i.aiResult!.confidence, 0) /
          analyzedItems
        : 0;

    // Pricing accuracy
    const accuracyItems = items.filter(
      (i) =>
        ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status) &&
        i.listingPrice != null &&
        i.valuation != null
    );
    const avgDeviation =
      accuracyItems.length > 0
        ? accuracyItems.reduce((sum, i) => {
            const mid = (i.valuation!.low + i.valuation!.high) / 2;
            const listed = Number(i.listingPrice!);
            return sum + Math.abs(mid > 0 ? (listed - mid) / mid : 0);
          }, 0) / accuracyItems.length
        : null;

    // Build bot usage map
    const botUsage: Record<string, number> = {};
    for (const ev of botEvents) {
      botUsage[ev.eventType] = ev._count;
    }
    // AnalyzeBot = items with aiResult
    botUsage["ANALYZEBOT"] = analyzedItems;
    // MegaBot
    botUsage["MEGABOT"] = megaBotCount;

    // Credit usage (seller-scoped or admin-aggregated)
    let creditStats = {
      balance: 0,
      lifetime: 0,
      spent: 0,
      transactionCount: 0,
      recentTransactions: [] as any[],
    };

    if (isAdminView) {
      const agg = await prisma.userCredits.aggregate({
        _sum: { balance: true, lifetime: true, spent: true },
        _count: true,
      });
      creditStats.balance = agg._sum.balance ?? 0;
      creditStats.lifetime = agg._sum.lifetime ?? 0;
      creditStats.spent = agg._sum.spent ?? 0;
      creditStats.transactionCount = await prisma.creditTransaction.count();
    } else {
      const uc = await prisma.userCredits
        .findUnique({ where: { userId: user.id } })
        .catch(() => null);
      if (uc) {
        creditStats.balance = uc.balance;
        creditStats.lifetime = uc.lifetime;
        creditStats.spent = uc.spent;
      }
      creditStats.transactionCount = uc
        ? await prisma.creditTransaction.count({
            where: { userCreditsId: uc.id },
          })
        : 0;
    }

    // Enrichment stats — count items by enrichment level
    const enrichmentStats = {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
    };
    for (const item of items) {
      let sourceCount = 0;
      if (item.aiResult) sourceCount++;
      if (item.valuation) sourceCount++;
      if (item.antiqueCheck) sourceCount++;
      if ((item as any).megabotUsed) sourceCount += 2;
      if (sourceCount === 0) enrichmentStats.none++;
      else if (sourceCount <= 2) enrichmentStats.low++;
      else if (sourceCount <= 4) enrichmentStats.medium++;
      else enrichmentStats.high++;
    }

    // Admin-only: user count
    let userCount = 0;
    if (isAdminView) {
      userCount = await prisma.user.count();
    }

    // ═════════════════════════════════════════════════════════════════════
    // NEW BLOCKS — v2 additions (each wrapped in try/catch)
    // ═════════════════════════════════════════════════════════════════════

    // ─── 1. TRENDING (time-filtered) ────────────────────────────────────
    let trending: any = null;
    try {
      const itemsInPeriod = items.filter((i) => i.createdAt >= tfStart);
      const salesInPeriod = itemsInPeriod.filter((i) =>
        ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)
      );
      const revenueInPeriod = salesInPeriod.reduce(
        (sum, i) =>
          sum +
          (i.listingPrice
            ? Number(i.listingPrice)
            : i.valuation
              ? (i.valuation.low + i.valuation.high) / 2
              : 0),
        0
      );

      const botRunsInPeriod = itemIds.length > 0
        ? await prisma.eventLog.count({
            where: {
              itemId: { in: itemIds },
              createdAt: { gte: tfStart },
              eventType: {
                in: [
                  ...SPECIALIST_BOT_TYPES,
                ],
              },
            },
          }) + await prisma.eventLog.count({
            where: {
              itemId: { in: itemIds },
              createdAt: { gte: tfStart },
              eventType: { startsWith: "MEGABOT_" },
            },
          })
        : 0;

      // Credits spent in period
      let creditsSpentInPeriod = 0;
      if (isAdminView) {
        const txAgg = await prisma.creditTransaction.aggregate({
          where: { type: "spend", createdAt: { gte: tfStart } },
          _sum: { amount: true },
        });
        creditsSpentInPeriod = Math.abs(txAgg._sum.amount ?? 0);
      } else {
        const uc = await prisma.userCredits
          .findUnique({ where: { userId: user.id } })
          .catch(() => null);
        if (uc) {
          const txAgg = await prisma.creditTransaction.aggregate({
            where: { userCreditsId: uc.id, type: "spend", createdAt: { gte: tfStart } },
            _sum: { amount: true },
          });
          creditsSpentInPeriod = Math.abs(txAgg._sum.amount ?? 0);
        }
      }

      trending = {
        timeframe,
        botRunsThisPeriod: botRunsInPeriod,
        itemsCreatedThisPeriod: itemsInPeriod.length,
        salesThisPeriod: salesInPeriod.length,
        revenueThisPeriod: Math.round(revenueInPeriod),
        creditsSpentThisPeriod: creditsSpentInPeriod,
      };
    } catch (e) {
      console.error("[analytics] trending block failed:", e);
    }

    // ─── 2. FULFILLMENT ─────────────────────────────────────────────────
    let fulfillment: any = null;
    try {
      const pickupCompletions = items.filter(
        (i) => i.pickupStatus === "COMPLETED"
      ).length;
      const ltlCompletions = items.filter(
        (i) => i.ltlStatus === "DELIVERED"
      ).length;
      const bolsGenerated = items.filter(
        (i) => i.ltlBolNumber != null
      ).length;

      // Avg days from pickupConfirmedAt to pickupCompletedAt
      const pickupTimedItems = items.filter(
        (i) => i.pickupConfirmedAt && i.pickupCompletedAt
      );
      const avgDaysPickupToClose =
        pickupTimedItems.length > 0
          ? pickupTimedItems.reduce((sum, i) => {
              const ms =
                i.pickupCompletedAt!.getTime() -
                i.pickupConfirmedAt!.getTime();
              return sum + ms / 86400000;
            }, 0) / pickupTimedItems.length
          : null;

      fulfillment = {
        pickupCompletions,
        ltlCompletions,
        bolsGenerated,
        avgDaysPickupToClose:
          avgDaysPickupToClose != null
            ? Math.round(avgDaysPickupToClose * 10) / 10
            : null,
        totalFulfilled: pickupCompletions + ltlCompletions,
      };
    } catch (e) {
      console.error("[analytics] fulfillment block failed:", e);
    }

    // ─── 3. SCORING DISTRIBUTION ────────────────────────────────────────
    let scoring: any = null;
    try {
      // Antique authenticity score distribution
      const antiqueChecks = items
        .filter((i) => i.antiqueCheck?.authenticityScore != null && i.antiqueCheck.authenticityScore > 0)
        .map((i) => i.antiqueCheck!.authenticityScore!);

      const antiqueScoring = {
        amber: antiqueChecks.filter((s) => s >= 1 && s <= 33).length,
        gold: antiqueChecks.filter((s) => s >= 34 && s <= 66).length,
        platinum: antiqueChecks.filter((s) => s >= 67 && s <= 100).length,
        total: antiqueChecks.length,
      };

      // Collectibles — parse COLLECTIBLESBOT_RESULT payloads for grade_confidence
      let collectiblesScoring = { bronze: 0, silver: 0, gold: 0, total: 0 };
      if (itemIds.length > 0) {
        const collectiblesLogs = await prisma.eventLog.findMany({
          where: {
            itemId: { in: itemIds },
            eventType: "COLLECTIBLESBOT_RESULT",
          },
          select: { payload: true },
        });
        for (const log of collectiblesLogs) {
          const payload = safeJson(log.payload);
          const confidence = payload?.grade_confidence;
          if (typeof confidence === "number" && confidence > 0) {
            const score = Math.round(confidence * 100);
            collectiblesScoring.total++;
            if (score <= 33) collectiblesScoring.bronze++;
            else if (score <= 66) collectiblesScoring.silver++;
            else collectiblesScoring.gold++;
          }
        }
      }

      scoring = {
        antique: antiqueScoring,
        collectibles: collectiblesScoring,
      };
    } catch (e) {
      console.error("[analytics] scoring block failed:", e);
    }

    // ─── 4. VALUE DISTRIBUTION ──────────────────────────────────────────
    let valueDistribution: any = null;
    try {
      const buckets = [
        { bucket: "Under $50", min: 0, max: 50, count: 0 },
        { bucket: "$50–$200", min: 50, max: 200, count: 0 },
        { bucket: "$200–$500", min: 200, max: 500, count: 0 },
        { bucket: "$500–$1,000", min: 500, max: 1000, count: 0 },
        { bucket: "$1,000+", min: 1000, max: Infinity, count: 0 },
      ];

      for (const item of items) {
        const value = item.listingPrice
          ? Number(item.listingPrice)
          : item.valuation
            ? (item.valuation.low + item.valuation.high) / 2
            : null;
        if (value == null || value <= 0) continue;
        for (const b of buckets) {
          if (value >= b.min && value < b.max) {
            b.count++;
            break;
          }
        }
      }

      valueDistribution = buckets.map((b) => ({
        bucket: b.bucket,
        count: b.count,
      }));
    } catch (e) {
      console.error("[analytics] valueDistribution block failed:", e);
    }

    // ─── 5. CREDIT ECONOMY ──────────────────────────────────────────────
    let creditEconomy: any = null;
    try {
      let totalPurchased = 0;
      let totalSpent = 0;
      let totalHeld = 0;
      let spendTxs: { description: string; amount: number }[] = [];

      if (isAdminView) {
        const purchaseAgg = await prisma.creditTransaction.aggregate({
          where: { type: "purchase" },
          _sum: { amount: true },
        });
        const spendAgg = await prisma.creditTransaction.aggregate({
          where: { type: "spend" },
          _sum: { amount: true },
        });
        const balanceAgg = await prisma.userCredits.aggregate({
          _sum: { balance: true },
        });
        totalPurchased = purchaseAgg._sum.amount ?? 0;
        totalSpent = Math.abs(spendAgg._sum.amount ?? 0);
        totalHeld = balanceAgg._sum.balance ?? 0;

        spendTxs = (
          await prisma.creditTransaction.findMany({
            where: { type: "spend" },
            select: { description: true, amount: true },
          })
        ).map((t) => ({ description: t.description, amount: Math.abs(t.amount) }));
      } else {
        const uc = await prisma.userCredits
          .findUnique({ where: { userId: user.id } })
          .catch(() => null);
        if (uc) {
          totalHeld = uc.balance;
          totalPurchased = uc.lifetime;
          totalSpent = uc.spent;

          spendTxs = (
            await prisma.creditTransaction.findMany({
              where: { userCreditsId: uc.id, type: "spend" },
              select: { description: true, amount: true },
            })
          ).map((t) => ({ description: t.description, amount: Math.abs(t.amount) }));
        }
      }

      // Parse descriptions for bot names
      const botCreditMap: Record<string, number> = {};
      const botKeywords = [
        "analyze", "price", "antique", "collectible", "car",
        "list", "buyer", "recon", "photo", "mega",
      ];
      for (const tx of spendTxs) {
        const desc = tx.description.toLowerCase();
        let matched = false;
        for (const kw of botKeywords) {
          if (desc.includes(kw)) {
            const label = kw.charAt(0).toUpperCase() + kw.slice(1) + "Bot";
            botCreditMap[label] = (botCreditMap[label] ?? 0) + tx.amount;
            matched = true;
            break;
          }
        }
        if (!matched) {
          botCreditMap["Other"] = (botCreditMap["Other"] ?? 0) + tx.amount;
        }
      }

      const topCreditConsumingBots = Object.entries(botCreditMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([bot, totalCredits]) => ({ bot, totalCredits }));

      const itemsWithBotRuns = items.filter(
        (i) => i.aiResult || (i as any).megabotUsed
      ).length;
      const avgCreditsSpentPerItem =
        itemsWithBotRuns > 0
          ? Math.round((totalSpent / itemsWithBotRuns) * 10) / 10
          : null;

      const avgSaleValuePerCreditSpent =
        totalSpent > 0 && soldRevenue > 0
          ? Math.round((soldRevenue / totalSpent) * 100) / 100
          : null;

      creditEconomy = {
        totalCreditsEverPurchased: totalPurchased,
        totalCreditsEverSpent: totalSpent,
        totalCreditsCurrentlyHeld: totalHeld,
        avgCreditsSpentPerItem,
        avgSaleValuePerCreditSpent,
        topCreditConsumingBots,
      };
    } catch (e) {
      console.error("[analytics] creditEconomy block failed:", e);
    }

    // ─── 6. TIME TO VALUE ───────────────────────────────────────────────
    let timeToValue: any = null;
    try {
      // Avg hours from item creation to first EventLog entry
      let totalHoursToFirstBot = 0;
      let itemsWithBotRun = 0;

      if (itemIds.length > 0) {
        const firstEvents = await prisma.eventLog.groupBy({
          by: ["itemId"],
          where: { itemId: { in: itemIds } },
          _min: { createdAt: true },
        });

        const firstEventMap = new Map<string, Date>();
        for (const fe of firstEvents) {
          if (fe._min.createdAt) firstEventMap.set(fe.itemId, fe._min.createdAt);
        }

        for (const item of items) {
          const firstBotDate = firstEventMap.get(item.id);
          if (firstBotDate) {
            const hours =
              (firstBotDate.getTime() - item.createdAt.getTime()) / 3600000;
            if (hours >= 0) {
              totalHoursToFirstBot += hours;
              itemsWithBotRun++;
            }
          }
        }
      }

      const avgHoursUploadToFirstBot =
        itemsWithBotRun > 0
          ? Math.round((totalHoursToFirstBot / itemsWithBotRun) * 10) / 10
          : null;

      // Avg bots run per sold item
      const soldItemIds = items
        .filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status))
        .map((i) => i.id);

      let avgBotsRunBeforeSale: number | null = null;
      if (soldItemIds.length > 0) {
        const soldEventCounts = await prisma.eventLog.groupBy({
          by: ["itemId"],
          where: { itemId: { in: soldItemIds } },
          _count: true,
        });
        const totalEvents = soldEventCounts.reduce(
          (sum, e) => sum + e._count,
          0
        );
        avgBotsRunBeforeSale =
          Math.round((totalEvents / soldItemIds.length) * 10) / 10;
      }

      timeToValue = {
        avgHoursUploadToFirstBot,
        avgDaysListedToSold: null, // No listedAt/soldAt timestamps in schema
        avgBotsRunBeforeSale,
      };
    } catch (e) {
      console.error("[analytics] timeToValue block failed:", e);
    }

    return NextResponse.json({
      scope: isAdminView ? "admin" : "seller",
      isAdmin: isAdminUser,

      userActivity: {
        totalItems,
        analyzedItems,
        listedItems,
        soldItems,
        antiqueItems,
        statusCounts,
        totalConversations,
        totalMessages,
        unreadMessages,
        avgBotScore,
        buyerQuality: { human: humanConvs, uncertain: uncertainConvs, bot: botConvs },
        platforms: platformCounts,
        totalViews,
        totalInquiries,
        ...(isAdminView ? { userCount } : {}),
      },

      marketplace: {
        soldRevenue: Math.round(soldRevenue),
        estimatedPortfolio: Math.round(estimatedPortfolio),
        avgSalePrice: Math.round(avgSalePrice),
        conversionRate,
        categories,
        topItems,
      },

      aiEngine: {
        avgConfidence: Math.round(avgConfidence * 100),
        avgDeviation: avgDeviation != null ? Math.round(avgDeviation * 100) : null,
        botUsage,
        megaBotItemCount,
        enrichmentStats,
        creditStats,
      },

      // v2 additions
      trending,
      fulfillment,
      scoring,
      valueDistribution,
      creditEconomy,
      timeToValue,
    });
  } catch (e: any) {
    console.error("[analytics API]", e);
    return NextResponse.json(
      { error: e?.message || "Analytics query failed" },
      { status: 500 }
    );
  }
}
