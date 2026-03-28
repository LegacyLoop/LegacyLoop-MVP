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

  // Fetch all PhotoBot event logs for this user's items
  const itemIds = rawItems.map((i) => i.id);
  const botLogs = await prisma.eventLog.findMany({
    where: {
      itemId: { in: itemIds },
      eventType: { in: ["PHOTOBOT_EDIT", "PHOTOBOT_ENHANCE", "PHOTOBOT_ASSESS", "PHOTOBOT_ENHANCE_VARIATION"] },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build maps: per-photo edit results + per-item enhance results
  const editResultsByPhoto: Record<string, any> = {};
  const enhanceResultsByItem: Record<string, any> = {};
  const variationsByItem: Record<string, any[]> = {};

  for (const log of botLogs) {
    try {
      const parsed = JSON.parse(log.payload || "{}");
      if (log.eventType === "PHOTOBOT_EDIT" && parsed.originalPhotoId && !editResultsByPhoto[parsed.originalPhotoId]) {
        editResultsByPhoto[parsed.originalPhotoId] = parsed;
      }
      if ((log.eventType === "PHOTOBOT_ENHANCE" || log.eventType === "PHOTOBOT_ASSESS") && log.itemId && !enhanceResultsByItem[log.itemId]) {
        enhanceResultsByItem[log.itemId] = parsed;
      }
      if (log.eventType === "PHOTOBOT_ENHANCE_VARIATION" && log.itemId) {
        if (!variationsByItem[log.itemId]) variationsByItem[log.itemId] = [];
        variationsByItem[log.itemId].push(parsed);
      }
    } catch { /* ignore */ }
  }

  const serialized = rawItems.map((item) => {
    const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    return {
      id: item.id,
      title: item.title || `Item #${item.id.slice(0, 6)}`,
      status: item.status,
      hasAnalysis: !!item.aiResult,
      category: ai?.category || "general",
      photoQualityScore: ai?.photo_quality_score ?? null,
      photoTips: ai?.photo_improvement_tips ?? [],
      photos: item.photos.map((p) => ({
        id: p.id,
        filePath: p.filePath,
        isPrimary: p.isPrimary,
        caption: p.caption,
        order: p.order,
        editResult: editResultsByPhoto[p.id] || null,
      })),
      enhanceResult: enhanceResultsByItem[item.id] || null,
      variations: variationsByItem[item.id] || [],
    };
  });

  return (
    <Suspense fallback={<div style={{ background: "var(--bg-card-solid)", minHeight: "100vh" }} />}>
      <PhotoBotClient items={serialized} />
    </Suspense>
  );
}
