import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BundlePublicClient from "./BundlePublicClient";

/* ──────────────────────────────────────────────────────────────────────────────
   Public Bundle Page — Server Component
   /bundle/[slug]
   No auth needed. Fetches bundle + items + seller info server-side.
   Delegates rendering to a client component for interactivity.
   ────────────────────────────────────────────────────────────────────────────── */

type Params = Promise<{ slug: string }>;

async function getBundleData(slug: string) {
  // Bundles are stored as EventLog entries with eventType BUNDLE_CREATED
  // The payload JSON contains: title, description, bundleType, itemIds, bundlePrice, allowOffers, slug, shareUrl
  const bundleEvent = await prisma.eventLog.findFirst({
    where: {
      eventType: "BUNDLE_CREATED",
      payload: { contains: `"slug":"${slug}"` },
    },
    orderBy: { createdAt: "desc" },
    include: {
      item: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
    },
  }).catch(() => null);

  if (!bundleEvent?.payload) return null;

  let data: any;
  try {
    data = JSON.parse(bundleEvent.payload);
  } catch {
    return null;
  }

  const itemIds: string[] = data.itemIds || [];
  if (itemIds.length === 0) return null;

  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    include: {
      photos: { orderBy: { order: "asc" } },
      aiResult: true,
      valuation: true,
      antiqueCheck: true,
    },
  }).catch(() => []);

  // Get seller from first item or from the event
  const sellerId = data.userId || bundleEvent.item?.userId || items[0]?.userId;
  let seller = null;
  if (sellerId) {
    seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, email: true },
    }).catch(() => null);
  }

  return {
    id: bundleEvent.id,
    slug: data.slug || slug,
    title: data.title || "Bundle Sale",
    description: data.description || "",
    bundleType: data.bundleType || "CUSTOM",
    bundlePrice: data.bundlePrice || 0,
    allowOffers: data.allowOffers !== false,
    createdAt: bundleEvent.createdAt.toISOString(),
    items: items.map((item) => {
      let aiData: any = null;
      try {
        if (item.aiResult?.rawJson) aiData = JSON.parse(item.aiResult.rawJson);
      } catch { /* ignore */ }

      const photo = item.photos.find((p) => p.isPrimary) || item.photos[0];

      return {
        id: item.id,
        title: item.title || aiData?.item_name || `Item #${item.id.slice(0, 6)}`,
        category: item.category || aiData?.category || aiData?.item_type || "Other",
        condition: item.condition || aiData?.condition_guess || "Good",
        price: item.listingPrice || item.valuation?.mid || item.valuation?.high || 0,
        photo: photo?.filePath || null,
        description: item.description || aiData?.description || "",
        era: item.era || aiData?.era || null,
        material: item.material || aiData?.material || null,
        brand: item.brand || aiData?.brand || aiData?.maker || null,
        isAntique: item.antiqueCheck?.isAntique || false,
      };
    }),
    seller: seller
      ? { id: seller.id, name: seller.email.split("@")[0] }
      : null,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getBundleData(slug);
  if (!bundle) return { title: "Bundle Not Found - LegacyLoop" };

  const itemCount = bundle.items.length;
  const individualTotal = bundle.items.reduce((s: number, i: any) => s + (i.price || 0), 0);
  const discountPct = individualTotal > 0 ? Math.round(((individualTotal - bundle.bundlePrice) / individualTotal) * 100) : 0;

  return {
    title: `${bundle.title} - LegacyLoop Bundle Sale`,
    description: `${itemCount} items for $${bundle.bundlePrice.toLocaleString()} (${discountPct}% off). ${bundle.description || "Browse and buy this curated bundle."}`,
    openGraph: {
      title: bundle.title,
      description: `${itemCount} items \u00B7 $${bundle.bundlePrice} \u00B7 ${discountPct}% off individual prices`,
      type: "website",
    },
  };
}

export default async function BundlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const bundle = await getBundleData(slug);

  if (!bundle) {
    notFound();
  }

  return <BundlePublicClient bundle={bundle} />;
}
