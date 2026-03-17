import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import SearchClient from "./SearchClient";
import { safeJson } from "@/lib/utils/json";

export const metadata: Metadata = {
  title: "Browse Estate Sales · LegacyLoop",
  description: "Search thousands of AI-priced items from estate and garage sales near you. Antiques, collectibles, furniture, electronics and more.",
  openGraph: {
    title: "Browse Estate Sales · LegacyLoop",
    description: "AI-priced items from estate sales. Find antiques, collectibles, furniture, and more.",
    type: "website",
  },
};

export default async function SearchPage() {
  const items = await prisma.item.findMany({
    where: {
      status: { in: ["LISTED", "INTERESTED", "ANALYZED", "READY"] },
    },
    include: {
      photos: { take: 1 },
      valuation: true,
      antiqueCheck: true,
      aiResult: true,
      user: { select: { id: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  }).catch((e) => { console.error("[search] items query failed:", e); return []; });

  const publicItems = items.map((item) => {
    const ai = safeJson(item.aiResult?.rawJson);
    return {
      id: item.id,
      userId: item.userId,
      title: item.title || ai?.item_name || `Item #${item.id.slice(0, 8)}`,
      condition: item.condition,
      description: item.description,
      listingPrice: item.listingPrice ? Number(item.listingPrice) : null,
      valuationLow: item.valuation?.low ?? null,
      valuationHigh: item.valuation?.high ?? null,
      photoUrl: item.photos[0]?.filePath ?? null,
      isAntique: item.antiqueCheck?.isAntique ?? false,
      category: ai?.category ?? null,
      ownerName: item.user.email.split("@")[0],
      saleZip: (item as any).saleZip ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Marketplace</div>
        <h1 className="h1 mt-2">Browse Estate Sales</h1>
        <p className="muted mt-1">
          {publicItems.length} AI-priced items from active estate and garage sales
        </p>
      </div>

      <SearchClient items={publicItems} />
    </div>
  );
}
