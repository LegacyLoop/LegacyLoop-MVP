import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import StyleBotClient from "./StyleBotClient";

export const metadata = { title: "PhotoBot — LegacyLoop" };

export default async function StyleBotPage() {
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

  const serialized = rawItems.map((item) => {
    const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
    return {
      id: item.id,
      title: item.title || `Item #${item.id.slice(0, 6)}`,
      status: item.status,
      photo: item.photos[0]?.filePath ?? null,
      hasAnalysis: !!item.aiResult,
      aiResult: item.aiResult?.rawJson ?? null,
      photoCount: item.photos.length,
      photos: item.photos.map((p) => ({ id: p.id, path: p.filePath, isPrimary: p.isPrimary, caption: p.caption })),
      category: ai?.category || "general",
      photoQualityScore: ai?.photo_quality_score ?? null,
      photoTips: ai?.photo_improvement_tips ?? [],
    };
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "PhotoBot" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(233,30,99,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🎨</div>
        <div>
          <h1 className="h2">PhotoBot</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Visual presentation — photo quality, lighting, staging tips to attract more buyers</p>
        </div>
      </div>
      <Suspense><StyleBotClient items={serialized} /></Suspense>
    </div>
  );
}
