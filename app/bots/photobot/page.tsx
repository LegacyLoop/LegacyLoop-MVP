import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import PhotoBotClient from "./PhotoBotClient";

export const metadata = { title: "PhotoBot — LegacyLoop" };

export default async function PhotoBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" } },
      aiResult: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all PHOTOBOT_EDIT results for this user's items
  const itemIds = rawItems.map((i) => i.id);
  const editLogs = await prisma.eventLog.findMany({
    where: { itemId: { in: itemIds }, eventType: "PHOTOBOT_EDIT" },
    orderBy: { createdAt: "desc" },
  });

  const editResultsByPhoto: Record<string, any> = {};
  for (const log of editLogs) {
    try {
      const parsed = JSON.parse(log.payload || "{}");
      if (parsed.originalPhotoId && !editResultsByPhoto[parsed.originalPhotoId]) {
        editResultsByPhoto[parsed.originalPhotoId] = parsed;
      }
    } catch { /* ignore */ }
  }

  const serialized = rawItems.map((item) => ({
    id: item.id,
    title: item.title || `Item #${item.id.slice(0, 6)}`,
    status: item.status,
    hasAnalysis: !!item.aiResult,
    photos: item.photos.map((p) => ({
      id: p.id,
      filePath: p.filePath,
      isPrimary: p.isPrimary,
      editResult: editResultsByPhoto[p.id] || null,
    })),
  }));

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "PhotoBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(240,98,146,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>📷</div>
        <div>
          <h1 className="h2">PhotoBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>AI photo enhancement, editing, and professional storefront imagery</p>
        </div>
      </div>
      <Suspense><PhotoBotClient items={serialized} /></Suspense>
    </div>
  );
}
