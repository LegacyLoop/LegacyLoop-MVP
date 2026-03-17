import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";
import BuyNowModal from "./BuyNowModal";
import MakeOfferForm from "./MakeOfferForm";
import ShareButtons from "@/app/components/ShareButtons";
import { safeJson } from "@/lib/utils/json";
import TradeButton from "./TradeButton";

type Params = Promise<{ userId: string; itemId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { itemId } = await params;
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { photos: true, aiResult: true },
  }).catch(() => null);
  if (!item) return { title: "Item Not Found · LegacyLoop" };
  const ai = safeJson(item.aiResult?.rawJson);
  const title = item.title || ai?.item_name || "Estate Sale Item";
  return {
    title: `${title} · LegacyLoop Estate Sale`,
    description: item.description || ai?.notes || `${title} for sale. AI-priced and verified.`,
    openGraph: {
      title,
      description: item.description || ai?.notes || `${title} for sale`,
      images: item.photos[0] ? [{ url: item.photos[0].filePath }] : [],
    },
  };
}

export default async function PublicItemPage({ params }: { params: Params }) {
  const { userId, itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { photos: true, valuation: true, antiqueCheck: true, aiResult: true, marketComps: true },
  }).catch((e) => { console.error("[public-item] item query failed:", e); return null; });

  if (!item || item.userId !== userId || !["LISTED", "INTERESTED", "ANALYZED", "READY", "OFFER_PENDING"].includes(item.status)) {
    return (
      <div className="card p-8 max-w-xl mx-auto mt-10 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <div className="text-xl font-semibold">Item not available</div>
        <p className="muted mt-2">This item may have been sold or removed.</p>
        <Link href={`/store/${userId}`} className="btn-primary mt-6 inline-flex">Browse Other Items</Link>
      </div>
    );
  }

  const ai = safeJson(item.aiResult?.rawJson);
  const title = item.title || ai?.item_name || `Item #${item.id.slice(0, 8)}`;
  const v = item.valuation;
  const antique = item.antiqueCheck;

  // Sort photos primary first
  const photos = [...item.photos].sort((a, b) => {
    if ((a as any).isPrimary) return -1;
    if ((b as any).isPrimary) return 1;
    return ((a as any).order ?? 1) - ((b as any).order ?? 1);
  });

  const keywords: string[] = Array.isArray(ai?.keywords) ? ai.keywords : [];

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://legacyloop.com";
  const itemUrl = `${BASE_URL}/store/${userId}/item/${item.id}`;
  const price = (item as any).listingPrice
    ? Number((item as any).listingPrice)
    : v
    ? Math.round((v.low + v.high) / 2)
    : null;

  const sellerName = item.userId.slice(0, 8);

  // JSON-LD for Google rich results
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: title,
    description: item.description || ai?.notes || `${title} for sale on LegacyLoop`,
    image: photos.map((p) => p.filePath),
    brand: ai?.brand ? { "@type": "Brand", name: ai.brand } : undefined,
    ...(price != null
      ? {
          offers: {
            "@type": "Offer",
            price: price.toString(),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: itemUrl,
            seller: { "@type": "Person", name: sellerName },
          },
        }
      : {}),
    keywords: keywords.join(", "),
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* JSON-LD schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Link href={`/store/${userId}`} style={{ color: "var(--accent)", textDecoration: "none" }}>← Back to store</Link>
        <span> / {title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }} className="sm:grid-cols-2">
        {/* Photos */}
        <div>
          {photos[0] ? (
            <img src={photos[0].filePath} alt={title} className="w-full rounded-3xl border object-cover shadow-sm" style={{ maxHeight: 400, objectFit: "cover" }} />
          ) : (
            <div className="h-80 bg-stone-100 rounded-3xl flex items-center justify-center">
              <span className="text-5xl text-stone-300">📷</span>
            </div>
          )}
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
              {photos.slice(0, 6).map((p) => (
                <img key={p.id} src={p.filePath} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "0.5rem", border: "2px solid var(--border-default)" }} />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{title}</h1>

          {item.condition && <div style={{ marginTop: "0.4rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{item.condition}</div>}

          {/* Price */}
          <div style={{ marginTop: "1rem" }}>
            {(item as any).listingPrice != null ? (
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>
                ${Number((item as any).listingPrice).toLocaleString()}
              </div>
            ) : v ? (
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  ${Math.round(v.low)} – ${Math.round(v.high)}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  AI-estimated fair market value · {Math.round(v.confidence * 100)}% confidence
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>Make an offer</div>
            )}
          </div>

          {item.description && (
            <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{item.description}</p>
          )}

          {/* AI details */}
          {ai && (
            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {keywords.slice(0, 8).map((k: string) => (
                <span key={k} className="badge">{k}</span>
              ))}
            </div>
          )}

          {/* Buy Now / Make Offer */}
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {price != null && (
              <BuyNowModal
                itemId={item.id}
                itemTitle={title}
                price={price}
                shippingEstimate={0}
                photoUrl={photos[0]?.filePath}
              />
            )}
            <MakeOfferForm
              itemId={item.id}
              itemTitle={title}
              suggestedPrice={price ?? undefined}
              itemStatus={item.status}
            />
            <TradeButton itemId={item.id} itemTitle={title} />
          </div>

          {/* Contact seller */}
          <div style={{ marginTop: "1rem" }}>
            <ContactForm itemId={item.id} itemTitle={title} />
          </div>
        </div>
      </div>

      {/* Market comps (social proof) */}
      {item.marketComps.length > 0 && (
        <div className="card p-6 mt-8">
          <div className="section-title mb-3">How this compares to market</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {item.marketComps.slice(0, 4).map((c: any) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", flex: 1, marginRight: "1rem" }} className="truncate">{c.title}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {c.currency} ${Number(c.price).toFixed(0)}
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ marginLeft: "0.5rem", color: "var(--accent)", fontSize: "0.75rem" }}>View →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share */}
      <div className="card p-6 mt-8">
        <div className="section-title mb-3">Share this item</div>
        <ShareButtons
          url={itemUrl}
          title={`${title}${price != null ? ` — $${price}` : ""}`}
          description={item.description || `${title} for sale on LegacyLoop estate sale platform.`}
        />
      </div>

      {/* Powered by LegacyLoop */}
      <div style={{ marginTop: "2rem", textAlign: "center", padding: "2rem", background: "var(--bg-card-hover)", borderRadius: "1rem" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Sold via <strong style={{ color: "var(--accent)" }}>LegacyLoop</strong> · AI-powered estate sale platform
        </div>
        <Link href="/pricing" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", marginTop: "0.25rem", display: "inline-block" }}>
          Sell your own items →
        </Link>
      </div>
    </div>
  );
}
