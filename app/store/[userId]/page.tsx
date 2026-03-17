import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import StoreFront from "./StoreFront";
import type { Metadata } from "next";
import { safeJson } from "@/lib/utils/json";

type Params = Promise<{ userId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { userId } = await params;
  const owner = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null);
  if (!owner) return { title: "Store Not Found · LegacyLoop" };
  const name = owner.email.split("@")[0];
  const itemCount = await prisma.item.count({ where: { userId, status: { in: ["LISTED", "INTERESTED", "ANALYZED", "READY"] } } }).catch(() => 0);
  return {
    title: `${name}'s Estate Sale · LegacyLoop`,
    description: `Browse ${itemCount} item${itemCount !== 1 ? "s" : ""} from ${name}'s estate sale on LegacyLoop. Antiques, collectibles, furniture, electronics and more.`,
    openGraph: {
      title: `${name}'s Estate Sale`,
      description: `${itemCount} item${itemCount !== 1 ? "s" : ""} available · AI-priced · Contact seller directly`,
      type: "website",
    },
  };
}

export default async function StorePage({ params }: { params: Params }) {
  const { userId } = await params;

  const owner = await prisma.user.findUnique({ where: { id: userId } })
    .catch((e) => { console.error("[store] owner query failed:", e); return null; });
  if (!owner) {
    return (
      <div className="card p-8 max-w-xl mx-auto mt-10 text-center">
        <div className="text-5xl mb-4">🏪</div>
        <div className="text-xl font-semibold">Store not found</div>
        <p className="muted mt-2">This store doesn't exist or has been removed.</p>
      </div>
    );
  }

  const currentUser = await authAdapter.getSession();
  const isOwner = currentUser?.id === userId;

  // Only show items that are listed/active (not draft or deleted)
  const items = await prisma.item.findMany({
    where: {
      userId,
      status: { in: ["LISTED", "INTERESTED", "ANALYZED", "READY"] },
    },
    include: {
      photos: true,
      valuation: true,
      antiqueCheck: true,
      aiResult: true,
    },
    orderBy: { createdAt: "desc" },
  }).catch((e) => { console.error("[store] items query failed:", e); return []; });

  const storeItems = items.map((item) => {
    const ai = safeJson(item.aiResult?.rawJson);
    return {
      id: item.id,
      title: item.title || ai?.item_name || `Item #${item.id.slice(0, 8)}`,
      condition: item.condition,
      description: item.description,
      listingPrice: item.listingPrice ? Number(item.listingPrice) : null,
      valuationLow: item.valuation?.low ?? null,
      valuationHigh: item.valuation?.high ?? null,
      photoUrl: item.photos[0]?.filePath ?? null,
      isAntique: item.antiqueCheck?.isAntique ?? false,
      category: ai?.category ?? null,
      status: item.status,
    };
  });

  const ownerName = owner.email.split("@")[0];
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://legacyloop.com";
  const storeUrl = `${BASE_URL}/store/${userId}`;

  return (
    <div className="mx-auto max-w-5xl">
      <StoreFront
        ownerName={ownerName}
        items={storeItems}
        userId={userId}
        isOwner={isOwner}
        storeUrl={storeUrl}
      />
    </div>
  );
}
