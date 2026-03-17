import { Suspense } from "react";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import ShipBotClient from "./ShipBotClient";

export const metadata = { title: "Shipping Center — LegacyLoop" };

export default async function ShipBotPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const rawItems = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
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
      category: ai?.category || "general",
    };
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bots", href: "/bots" }, { label: "Shipping Center" }]} />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: "0.75rem", background: "rgba(156,39,176,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>📦</div>
        <div>
          <h1 className="h2">Shipping Center</h1>
          <p className="muted" style={{ fontSize: "0.85rem" }}>Shipping intelligence — carrier comparisons, AI-suggested packaging, and LTL freight detection</p>
        </div>
      </div>
      <Suspense><ShipBotClient items={serialized} /></Suspense>
    </div>
  );
}
