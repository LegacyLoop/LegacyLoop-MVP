import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";
import BuyNowModal from "./BuyNowModal";
import MakeOfferForm from "./MakeOfferForm";
import ShareButtons from "@/app/components/ShareButtons";
import { safeJson } from "@/lib/utils/json";
import TradeButton from "./TradeButton";
import ItemPhotoStrip from "@/app/items/[id]/ItemPhotoStrip";

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
      <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "1.25rem", padding: "2rem", maxWidth: "36rem", margin: "2.5rem auto", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>Item not available</div>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>This item may have been sold or removed.</p>
        <Link href={`/store/${userId}`} style={{ display: "inline-flex", marginTop: "1.5rem", padding: "0.6rem 1.5rem", background: "var(--accent)", color: "#fff", borderRadius: "0.75rem", fontWeight: 700, textDecoration: "none" }}>Browse Other Items</Link>
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
    <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <style>{`
        .item-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        @media (max-width: 768px) { .item-detail-grid { grid-template-columns: 1fr; } }
      `}</style>
      {/* JSON-LD schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div style={{ marginBottom: "1rem" }}>
        <Link href={`/store/${userId}`} style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
          textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
          border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
        }}>
          ← Back to Store
        </Link>
      </div>

      <div className="item-detail-grid">
        {/* Photos — reusable carousel */}
        <div>
          <ItemPhotoStrip
            photos={photos.map((p) => ({
              id: p.id,
              filePath: p.filePath,
              isPrimary: (p as any).isPrimary ?? false,
            }))}
            displayTitle={title}
          />
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
                <span key={k} style={{ background: "var(--accent-dim)", color: "var(--accent)", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 600 }}>{k}</span>
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

            {/* Buyer Protection */}
            <div style={{ marginTop: "0.75rem", padding: "0.65rem 0.75rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: "0.5rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>🛡️ Buyer Protection</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                14-day return window · Full refund (minus processing fee) · Seller reviews within 48 hours
              </div>
            </div>
          </div>

          {/* Contact seller */}
          <div style={{ marginTop: "1rem" }}>
            <ContactForm itemId={item.id} itemTitle={title} />
          </div>
        </div>
      </div>

      {/* Market comps (social proof) */}
      {item.marketComps.length > 0 && (
        <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "1.25rem", padding: "1.5rem", marginTop: "2rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.75rem" }}>How this compares to market</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {item.marketComps.slice(0, 4).map((c: any) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", flex: 1, marginRight: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
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
      <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "1.25rem", padding: "1.5rem", marginTop: "2rem" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Share this item</div>
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
