import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import VideoBotClient from "./VideoBotClient";

export const metadata = { title: "VideoBot — LegacyLoop" };

export default async function VideoBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      aiResult: true,
      valuation: true,
      eventLogs: {
        where: { eventType: { in: ["VIDEOBOT_RESULT", "VIDEOBOT_RUN"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, eventType: true, payload: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = rawItems.map((item) => ({
    id: item.id,
    title: item.title || `Item #${item.id.slice(0, 6)}`,
    status: item.status,
    photo: item.photos[0]?.filePath ?? null,
    hasAnalysis: !!item.valuation,
    videoBotResult: (() => {
      const evt = item.eventLogs.find((ev: any) => ev.eventType === "VIDEOBOT_RESULT");
      return evt?.payload ?? null;
    })(),
    videoBotRunAt: (() => {
      const evt = item.eventLogs.find((ev: any) => ev.eventType === "VIDEOBOT_RESULT");
      return evt?.createdAt?.toISOString() ?? null;
    })(),
  }));

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "VideoBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(0,188,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🎬</div>
        <div>
          <h1 className="h2">VideoBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>AI video ad generator -- create scroll-stopping ads for TikTok, Reels, and more</p>
        </div>
      </div>
      <Suspense><VideoBotClient items={serialized} /></Suspense>
    </div>
  );
}
