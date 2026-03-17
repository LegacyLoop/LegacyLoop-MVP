import { prisma } from "@/lib/db";

export interface AgentContext {
  conversation: { id: string; createdAt: Date; messageCount: number; source: string } | null;
  messages: { role: string; content: string; timestamp: Date }[];
  item: { id: string; title: string; description: string | null; condition: string | null; askingPrice: number | null; listingPrice: number | null; category: string | null; status: string; daysListed: number; photoCount: number } | null;
  offer: { currentPrice: number; originalPrice: number; round: number; status: string; expiresAt: Date } | null;
  floorPrice: number | null;
  agentSettings: { permissionLevel: string; defaultTone: string; autoReplyEnabled: boolean; checkInThreshold: number };
  buyerProfile: { name: string; email: string | null; messageCount: number; responseTimeMinutes: number | null; offerHistory: { amount: number; round: number; outcome?: string }[]; firstContact: Date | null };
}

export async function buildAgentContext(conversationId: string, userId: string): Promise<AgentContext> {
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 10 },
        item: { include: { photos: true, valuation: true, aiResult: true } },
        offers: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
    });

    if (!conv) return defaultContext();

    // Messages (reversed to chronological)
    const messages = [...conv.messages].reverse().map(m => ({
      role: m.sender,
      content: m.content,
      timestamp: m.createdAt,
    }));

    // Item info
    const item = conv.item ? {
      id: conv.item.id,
      title: conv.item.title || "Untitled",
      description: conv.item.description,
      condition: conv.item.condition,
      askingPrice: conv.item.listingPrice,
      listingPrice: conv.item.listingPrice,
      category: (() => { try { return conv.item.aiResult?.rawJson ? JSON.parse(conv.item.aiResult.rawJson).category : null; } catch { return null; } })(),
      status: conv.item.status,
      daysListed: Math.round((Date.now() - conv.item.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      photoCount: conv.item.photos?.length || 0,
    } : null;

    // Offer info
    const latestOffer = conv.offers?.[0] || null;
    const offer = latestOffer ? {
      currentPrice: latestOffer.currentPrice,
      originalPrice: latestOffer.originalPrice,
      round: latestOffer.round,
      status: latestOffer.status,
      expiresAt: latestOffer.expiresAt,
    } : null;

    // Floor price from EventLog
    let floorPrice: number | null = null;
    if (item) {
      const fpLog = await prisma.eventLog.findFirst({
        where: { itemId: item.id, eventType: "FLOOR_PRICE_SET" },
        orderBy: { createdAt: "desc" },
      });
      if (fpLog?.payload) {
        try { floorPrice = JSON.parse(fpLog.payload).floorPrice ?? null; } catch { /* ignore */ }
      }
    }

    // Agent settings from UserEvent (not EventLog — EventLog requires itemId)
    const settingsLog = await prisma.userEvent.findFirst({
      where: { userId, eventType: "AGENT_SETTINGS_UPDATED" },
      orderBy: { createdAt: "desc" },
    });
    let agentSettings = { permissionLevel: "monitor", defaultTone: "professional", autoReplyEnabled: false, checkInThreshold: 50 };
    if (settingsLog?.metadata) {
      try { const s = JSON.parse(settingsLog.metadata); agentSettings = { ...agentSettings, ...s }; } catch { /* ignore */ }
    }

    // Buyer profile
    const buyerMessages = conv.messages.filter(m => m.sender === "buyer");
    let avgResponseMinutes: number | null = null;
    if (buyerMessages.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < buyerMessages.length; i++) {
        diffs.push((buyerMessages[i].createdAt.getTime() - buyerMessages[i - 1].createdAt.getTime()) / (1000 * 60));
      }
      avgResponseMinutes = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }

    const offerHistory = conv.offers?.map(o => ({ amount: o.currentPrice, round: o.round, outcome: o.status })) || [];

    return {
      conversation: { id: conv.id, createdAt: conv.createdAt, messageCount: conv.messages.length, source: "inquiry" },
      messages,
      item,
      offer,
      floorPrice,
      agentSettings,
      buyerProfile: {
        name: conv.buyerName,
        email: conv.buyerEmail,
        messageCount: buyerMessages.length,
        responseTimeMinutes: avgResponseMinutes,
        offerHistory,
        firstContact: buyerMessages[0]?.createdAt || null,
      },
    };
  } catch (err) {
    console.error("[agent-context]", err);
    return defaultContext();
  }
}

function defaultContext(): AgentContext {
  return {
    conversation: null, messages: [], item: null, offer: null, floorPrice: null,
    agentSettings: { permissionLevel: "monitor", defaultTone: "professional", autoReplyEnabled: false, checkInThreshold: 50 },
    buyerProfile: { name: "Unknown", email: null, messageCount: 0, responseTimeMinutes: null, offerHistory: [], firstContact: null },
  };
}
