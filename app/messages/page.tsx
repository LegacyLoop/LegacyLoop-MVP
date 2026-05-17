import Link from "next/link";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import MessagesClient from "./MessagesClient";
import MessagesAgentWrapper from "./MessagesAgentWrapper";
import { safeJson } from "@/lib/utils/json";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import EmptyState from "@/app/components/EmptyState";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Messages · Legacy-Loop", description: "Your inbox — buyer inquiries, offers, and conversations" };

export default async function MessagesPage() {
  const user = await authAdapter.getSession();
  if (!user) {
    return (
      <div className="card p-8 max-w-xl mx-auto mt-10">
        <h1 className="text-2xl font-semibold">Please log in</h1>
        <Link href="/auth/login" className="btn-primary mt-4 inline-flex">Go to Login</Link>
      </div>
    );
  }

  const userItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: { aiResult: { select: { rawJson: true } } },
    orderBy: { createdAt: "desc" },
  }).catch((e) => { console.error("[messages] userItems query failed:", e); return []; });

  const itemIds = userItems.map((i) => i.id);

  const conversations = itemIds.length
    ? await prisma.conversation.findMany({
        where: { itemId: { in: itemIds } },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          item: {
            select: {
              id: true,
              title: true,
              aiResult: { select: { rawJson: true } },
              photos: { take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }).catch((e) => { console.error("[messages] conversations query failed:", e); return []; })
    : [];

  const itemsForForm = userItems.map((i) => {
    const ai = safeJson(i.aiResult?.rawJson);
    return { id: i.id, displayTitle: i.title || ai?.item_name || `Item #${i.id.slice(0, 8)}` };
  });

  // Stats (PATH E BUILD-UP · query-layer · Promise.all batched · kills O(N×M) reduce)
  const convWhere = { itemId: { in: itemIds } };
  const [total, botCount, humanCount, unreadCount] = itemIds.length
    ? await Promise.all([
        prisma.conversation.count({ where: convWhere }),
        prisma.conversation.count({ where: { ...convWhere, botScore: { lt: 50 } } }),
        prisma.conversation.count({ where: { ...convWhere, botScore: { gte: 80 } } }),
        prisma.message.count({
          where: {
            sender: "buyer",
            isRead: false,
            conversation: { itemId: { in: itemIds } },
          },
        }),
      ])
    : [0, 0, 0, 0];

  // Serialize dates for client
  const serialized = conversations.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    messages: c.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    item: {
      ...c.item,
      photos: c.item.photos.map((p) => ({ filePath: (p as any).filePath })),
    },
  }));

  return (
    <MessagesAgentWrapper>
      <style>{`
        @media (max-width: 768px) {
          .messages-breadcrumb-wrap { display: none !important; }
        }
      `}</style>
      <div className="messages-breadcrumb-wrap">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Messages" }]} />
      </div>
      <div style={{ width: "100%", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {itemsForForm.length === 0 ? (
          <div style={{ padding: "2rem 1rem" }}>
            <EmptyState
              icon="💬"
              title="No conversations yet"
              description="Messages from buyers and bot alerts will appear here."
              ctaLabel="+ Add Your First Item"
              ctaHref="/items/new"
            />
          </div>
        ) : (
          <MessagesClient initialConversations={serialized as any} itemsForForm={itemsForForm} stats={{ total, botCount, humanCount, unreadCount }} />
        )}
      </div>
    </MessagesAgentWrapper>
  );
}
