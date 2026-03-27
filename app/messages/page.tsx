import Link from "next/link";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import MessagesClient from "./MessagesClient";
import MessagesAgentWrapper from "./MessagesAgentWrapper";
import { safeJson } from "@/lib/utils/json";
import Breadcrumbs from "@/app/components/Breadcrumbs";

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

  // Stats
  const total = conversations.length;
  const botCount = conversations.filter((c) => c.botScore < 50).length;
  const humanCount = conversations.filter((c) => c.botScore >= 80).length;
  const unreadCount = conversations.reduce(
    (sum, c) => sum + c.messages.filter((m) => m.sender === "buyer" && !m.isRead).length,
    0
  );

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
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Messages" }]} />
      <div style={{ width: "100%", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {itemsForForm.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>No items yet</div>
            <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Add an item before logging buyer messages.</p>
            <Link href="/items/new" style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", marginTop: 16, background: "#00bcd4", color: "#000", fontWeight: 700, borderRadius: 8, textDecoration: "none" }}>Add Item</Link>
          </div>
        ) : (
          <MessagesClient initialConversations={serialized as any} itemsForForm={itemsForForm} />
        )}
      </div>
    </MessagesAgentWrapper>
  );
}
