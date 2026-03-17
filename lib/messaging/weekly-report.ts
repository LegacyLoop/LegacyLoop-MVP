import { prisma } from "@/lib/db";

export interface WeeklyReport {
  weekOf: string;
  messagesSent: number;
  agentAssists: number;
  dealsClosed: number;
  scamsBlocked: number;
  ghostRecoveries: number;
  itemsNeedingAttention: { itemId: string; title: string; daysListed: number; inquiryCount: number; recommendation: string }[];
  agentRecommendations: string[];
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekOf = weekAgo.toISOString().slice(0, 10);

  try {
    // Count seller messages sent this week
    const messagesSent = await prisma.message.count({
      where: {
        conversation: { item: { userId } },
        sender: "seller",
        createdAt: { gte: weekAgo },
      },
    });

    // Count agent-related events this week (UserEvent for agent actions without itemId)
    const agentAssists = await prisma.userEvent.count({
      where: {
        userId,
        eventType: { startsWith: "AGENT_" },
        createdAt: { gte: weekAgo },
      },
    });

    // Count items sold this week
    const dealsClosed = await prisma.item.count({
      where: {
        userId,
        status: "SOLD",
        soldAt: { gte: weekAgo },
      },
    });

    // Count scam flags this week (EventLog for item-linked events)
    const scamEvents = await prisma.eventLog.count({
      where: {
        item: { userId },
        eventType: "AGENT_SCAM_FLAGGED",
        createdAt: { gte: weekAgo },
      },
    });

    // Count ghost recovery events this week
    const ghostRecoveries = await prisma.userEvent.count({
      where: {
        userId,
        eventType: { contains: "GHOST" },
        createdAt: { gte: weekAgo },
      },
    });

    // Items that need attention (listed/interested but stale or with active convos)
    const items = await prisma.item.findMany({
      where: {
        userId,
        status: { in: ["LISTED", "INTERESTED", "OFFER_PENDING"] },
      },
      include: {
        conversations: { select: { _count: { select: { messages: true } } } },
      },
      take: 5,
      orderBy: { createdAt: "asc" },
    });

    const itemsNeedingAttention = items.map(item => ({
      itemId: item.id,
      title: item.title || "Untitled",
      daysListed: Math.round((Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      inquiryCount: item.conversations.reduce((s, c) => s + c._count.messages, 0),
      recommendation: item.conversations.length === 0
        ? "No inquiries yet — consider lowering price or boosting listing"
        : "Active interest — respond promptly to convert",
    }));

    const recommendations: string[] = [];
    if (dealsClosed > 0) recommendations.push(`Great week! ${dealsClosed} item${dealsClosed > 1 ? "s" : ""} sold.`);
    if (scamEvents > 0) recommendations.push(`${scamEvents} scam attempt${scamEvents > 1 ? "s" : ""} blocked by AI.`);
    if (itemsNeedingAttention.some(i => i.daysListed > 14)) recommendations.push("Some items listed 14+ days — consider price adjustments.");
    if (recommendations.length === 0) recommendations.push("Keep engaging with buyers. Consistency closes deals.");

    return {
      weekOf,
      messagesSent,
      agentAssists,
      dealsClosed,
      scamsBlocked: scamEvents,
      ghostRecoveries,
      itemsNeedingAttention,
      agentRecommendations: recommendations,
    };
  } catch (err) {
    console.error("[weekly-report]", err);
    return {
      weekOf,
      messagesSent: 0,
      agentAssists: 0,
      dealsClosed: 0,
      scamsBlocked: 0,
      ghostRecoveries: 0,
      itemsNeedingAttention: [],
      agentRecommendations: ["Report generation encountered an error."],
    };
  }
}
