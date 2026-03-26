import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import ListBotClient from "./ListBotClient";
import PublishHubClient from "./PublishHubClient";

export const metadata = { title: "ListBot — LegacyLoop" };

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export default async function ListBotPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const resolvedParams = await searchParams;
  const itemId = resolvedParams?.item;

  // ── PUBLISH HUB MODE: ?item=X ──
  if (itemId) {
    const [item, listBotLog, megaBotLog, publishStatuses] = await Promise.all([
      prisma.item.findUnique({
        where: { id: itemId },
        include: {
          photos: { orderBy: { order: "asc" }, take: 1 },
          valuation: true,
          aiResult: true,
        },
      }),
      prisma.eventLog.findFirst({
        where: { itemId, eventType: "LISTBOT_RESULT" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.eventLog.findFirst({
        where: { itemId, eventType: { contains: "MEGABOT" } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.listingPublish.findMany({
        where: { itemId, userId: user.id },
      }).catch(() => []),
    ]);

    if (!item || item.userId !== user.id) redirect("/bots/listbot");

    const listBotResult = safeJson(listBotLog?.payload);
    const megaBotRaw = safeJson(megaBotLog?.payload);
    // MegaBot result may be nested under a "listing" or "listbot" key
    const megaBotResult = megaBotRaw?.listing || megaBotRaw?.listbot || megaBotRaw;

    const itemPrice = item.valuation
      ? Math.round((item.valuation.low + item.valuation.high) / 2)
      : null;

    return (
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Breadcrumbs items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Bots", href: "/bots" },
          { label: "ListBot", href: "/bots/listbot" },
          { label: "Publish Hub" },
        ]} />
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "linear-gradient(135deg, rgba(0,188,212,0.15), rgba(0,150,136,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🚀</div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Publish Hub</h1>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>One item. Every platform. One click.</p>
          </div>
        </div>
        <Suspense>
          <PublishHubClient
            itemId={itemId}
            itemTitle={item.title || "Untitled Item"}
            itemPhoto={item.photos[0]?.filePath ?? null}
            itemPrice={itemPrice}
            listBotResult={listBotResult}
            megaBotResult={megaBotResult}
            initialStatuses={publishStatuses}
            userId={user.id}
          />
        </Suspense>
      </div>
    );
  }

  // ── DEFAULT MODE: item picker ──
  const [rawItems, platforms] = await Promise.all([
    prisma.item.findMany({
      where: { userId: user.id },
      include: {
        photos: { orderBy: { order: "asc" }, take: 1 },
        aiResult: true,
        valuation: true,
        eventLogs: {
          where: { eventType: { in: ["LISTBOT_RESULT", "LISTBOT_RUN", "MEGABOT_LISTBOT"] } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, eventType: true, payload: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.connectedPlatform.findMany({
      where: { userId: user.id, isActive: true },
      select: { platform: true },
    }),
  ]);

  const connectedPlatforms = platforms.map((p) => p.platform);

  const serialized = rawItems.map((item) => {
    const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    return {
      id: item.id,
      title: item.title || `Item #${item.id.slice(0, 6)}`,
      status: item.status,
      photo: item.photos[0]?.filePath ?? null,
      hasAnalysis: !!item.aiResult,
      aiResult: item.aiResult?.rawJson ?? null,
      category: ai?.category || "general",
      connectedPlatforms,
      valuationMid: item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : null,
      listingHistory: item.eventLogs.map((ev: any) => ({
        id: ev.id, type: ev.eventType, createdAt: ev.createdAt.toISOString(),
      })),
      lastListedAt: item.eventLogs[0]?.createdAt?.toISOString() ?? null,
    };
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "ListBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(255,152,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>📝</div>
        <div>
          <h1 className="h2">ListBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>The Listing Machine — AI-generated, platform-optimized listings for 10+ marketplaces in one click</p>
        </div>
      </div>
      <Suspense><ListBotClient items={serialized} /></Suspense>
    </div>
  );
}
