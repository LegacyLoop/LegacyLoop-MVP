import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ArchivesClient from "./ArchivesClient";
import { safeJson } from "@/lib/utils/json";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Legacy Archives · LegacyLoop",
  description: "Generate beautiful PDF reports, print books, and USB archives of your estate items",
};

export default async function ArchivesPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const items = await prisma.item.findMany({
    where: { userId: user.id },
    include: {
      photos: { take: 1 },
      valuation: true,
      antiqueCheck: true,
      aiResult: true,
    },
    orderBy: { createdAt: "desc" },
  }).catch((e) => { console.error("[archives] items query failed:", e); return []; });

  const serialized = items.map((item) => {
    const ai = safeJson(item.aiResult?.rawJson);
    return {
      id: item.id,
      title: item.title || ai?.item_name || `Item #${item.id.slice(0, 8)}`,
      photoUrl: item.photos[0]?.filePath ?? null,
      status: item.status,
      valuationHigh: item.valuation?.high ?? null,
      isAntique: item.antiqueCheck?.isAntique ?? false,
      hasStory: !!(item as any).story,
    };
  });

  return (
    <>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Legacy Archives" }]} />
      <ArchivesClient items={serialized} />
    </>
  );
}
