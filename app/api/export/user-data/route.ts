import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/utils/json";

// GET — GDPR-style full data export as JSON download
export async function GET() {
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    // Fetch all user data in parallel
    const [
      fullUser,
      items,
      conversations,
      credits,
      connectedPlatforms,
      notifications,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          tier: true,
          heroVerified: true,
          heroCategory: true,
          createdAt: true,
          // NOT passwordHash
        },
      }),

      prisma.item.findMany({
        where: { userId: user.id },
        include: {
          aiResult: { select: { rawJson: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.conversation.findMany({
        where: { item: { userId: user.id } },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              sender: true,
              content: true,
              isRead: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.userCredits.findUnique({
        where: { userId: user.id },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              amount: true,
              balance: true,
              description: true,
              createdAt: true,
            },
          },
        },
      }),

      prisma.connectedPlatform.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          platform: true,
          platformUsername: true,
          isActive: true,
          lastSync: true,
          createdAt: true,
        },
      }),

      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          link: true,
          isRead: true,
          createdAt: true,
        },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: fullUser,
      items: items.map((item) => {
        const ai = safeJson(item.aiResult?.rawJson);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          category: ai?.category ?? null,
          condition: item.condition,
          saleMethod: item.saleMethod,
          saleZip: item.saleZip,
          listingPrice: item.listingPrice,
          purchasePrice: item.purchasePrice,
          story: item.story,
          createdAt: item.createdAt,
        };
      }),
      conversations: conversations.map((c) => ({
        id: c.id,
        itemId: c.itemId,
        buyerName: c.buyerName,
        buyerEmail: c.buyerEmail,
        platform: c.platform,
        createdAt: c.createdAt,
        messages: c.messages,
      })),
      credits: credits
        ? {
            balance: credits.balance,
            lifetime: credits.lifetime,
            spent: credits.spent,
            transactions: credits.transactions,
          }
        : null,
      connectedPlatforms,
      notifications,
    };

    const json = JSON.stringify(exportData, null, 2);

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition":
          'attachment; filename="legacyloop-data-export.json"',
      },
    });
  } catch (err) {
    console.error("User data export failed:", err);
    return Response.json(
      { error: "Failed to export user data" },
      { status: 500 }
    );
  }
}
