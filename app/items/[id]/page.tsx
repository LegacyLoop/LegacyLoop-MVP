import Link from "next/link";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import ShareDropdown from "./ShareDropdown";
import AnalyzeActions from "./AnalyzeActions";
import ItemDashboardPanels from "./ItemDashboardPanels";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import ItemPhotoStrip from "./ItemPhotoStrip";
import { computeAuthenticityScore } from "@/lib/antique-score";
import { computeCollectiblesScore } from "@/lib/collectibles-score";
import { detectCollectible } from "@/lib/collectible-detect";
import AmazonPriceBadge from "./AmazonPriceBadge";
import SoldPriceWidget from "./SoldPriceWidget";
import SaleCongratsBar from "./SaleCongratsBar";
import { enrichItemContext } from "@/lib/addons/enrich-item-context";
import ItemIntelligenceSummary from "./ItemIntelligenceSummary";

type Params = Promise<{ id: string }>;

function safeJsonParse(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "rgba(120,113,108,0.2)", color: "#a8a29e" },
  ANALYZED: { bg: "rgba(0,188,212,0.15)", color: "#00bcd4" },
  READY: { bg: "rgba(0,188,212,0.15)", color: "#00bcd4" },
  LISTED: { bg: "rgba(76,175,80,0.15)", color: "#4caf50" },
  INTERESTED: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  SOLD: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  SHIPPED: { bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
  COMPLETED: { bg: "rgba(76,175,80,0.15)", color: "#4caf50" },
};

export default async function ItemPage({ params }: { params: Params }) {
  const { id } = await params;

  const user = await authAdapter.getSession();
  if (!user) {
    return (
      <div className="card p-8 max-w-xl mx-auto mt-10">Please log in.</div>
    );
  }

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: "asc" } },
      aiResult: true,
      valuation: true,
      antiqueCheck: true,
      marketComps: true,
    },
  });

  if (!item || item.userId !== user.id) {
    return (
      <div className="card p-8 max-w-xl mx-auto mt-10">Item not found.</div>
    );
  }

  // Fetch engagement metrics + document count + latest shipping quote for control center
  const [engagement, docCount, latestShippingQuote] = await Promise.all([
    prisma.itemEngagementMetrics.findUnique({ where: { itemId: item.id }, select: { totalViews: true, inquiries: true, buyersFound: true } }).catch(() => null),
    prisma.itemDocument.count({ where: { itemId: item.id } }).catch(() => 0),
    prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: "SHIPPING_QUOTED" },
      orderBy: { createdAt: "desc" },
      select: { payload: true, createdAt: true },
    }).catch(() => null),
  ]);

  const enriched = await enrichItemContext(item.id, (item as any).listingPrice ?? null).catch(() => null);
  const aiObj = item.aiResult?.rawJson ? safeJsonParse(item.aiResult.rawJson) : null;
  const displayTitle = item.title || aiObj?.item_name || (item.status === "DRAFT" ? "New Item — Awaiting Analysis" : `Item #${item.id.slice(0, 8)}`);
  const antique = item.antiqueCheck;

  // Check if AntiqueBot has been run and confirmed
  const antiqueBotConfirmed = await prisma.eventLog.findFirst({
    where: { itemId: item.id, eventType: "ANTIQUEBOT_RESULT" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  }).then((r) => !!r).catch(() => false);

  // Detect antique from AI analysis (fires before AntiqueBot is run)
  let isAntiqueFromAI = false;
  if (aiObj) {
    isAntiqueFromAI = !!(
      aiObj.is_antique === true ||
      aiObj.antique_alert === true ||
      (typeof aiObj.estimated_age === "number" && aiObj.estimated_age >= 70) ||
      (typeof aiObj.estimated_age === "string" && parseInt(aiObj.estimated_age) >= 70) ||
      (typeof aiObj.estimated_age_years === "number" && aiObj.estimated_age_years >= 70) ||
      (typeof aiObj.estimated_age_years === "string" && parseInt(aiObj.estimated_age_years) >= 70)
    );
  }
  const showAntiqueUI = antique?.isAntique === true || isAntiqueFromAI;

  // Detect collectible from AI analysis
  let isCollectibleFromAI = false;
  if (aiObj) {
    const collectibleDetection = detectCollectible(aiObj);
    isCollectibleFromAI = collectibleDetection.isCollectible;
  }
  const showCollectibleUI = isCollectibleFromAI;
  const collectiblesScore = showCollectibleUI
    ? computeCollectiblesScore({ aiResult: item.aiResult })
    : null;

  // Compute authenticity score server-side for antique items
  const authenticityScore = showAntiqueUI
    ? computeAuthenticityScore({
        aiResult: item.aiResult,
        antiqueCheck: item.antiqueCheck ?? undefined,
        megaBotResult: null,
      })
    : null;

  const v = item.valuation as any;
  const comps = Array.isArray(item.marketComps) ? item.marketComps : [];
  const primaryPhoto = item.photos.find((p) => p.isPrimary) || item.photos[0];

  // Public listing statuses
  const PUBLIC_STATUSES = ["LISTED", "ANALYZED", "READY", "INTERESTED"];
  const isPublic = PUBLIC_STATUSES.includes(item.status);

  // Build clean subtitle parts
  const subtitleParts: string[] = [];
  if (item.condition) subtitleParts.push(`Condition: ${item.condition}`);
  if (item.purchasePrice != null) subtitleParts.push(`Paid: $${Number(item.purchasePrice).toFixed(2)}`);
  if (item.purchaseDate) {
    subtitleParts.push(`Purchased: ${new Date(item.purchaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
  }
  if ((item as any).numberOfOwners) subtitleParts.push(`${(item as any).numberOfOwners} owner${(item as any).numberOfOwners > 1 ? "s" : ""}`);

  // Display description: prefer AI summary, skip raw metadata dumps
  const rawDesc = item.description || "";
  const isRawMetadata = rawDesc.startsWith("[") || rawDesc.startsWith("Age:") || rawDesc.startsWith("Functionality:");
  const displayDescription = aiObj?.summary || (!isRawMetadata && rawDesc ? rawDesc : null);

  const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.DRAFT;
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://legacyloop.com"}/store/${user.id}/item/${item.id}`;

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Items", href: "/items" },
        { label: displayTitle },
      ]} />



      {/* ═══ Premium Header Card ═══ */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "1rem",
        padding: "1.5rem",
        marginBottom: "0.75rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}>
        {/* Left: Title + Status + Subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            <h1 style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}>
              {displayTitle}
            </h1>

            {/* Status badge pill */}
            <span style={{
              padding: "0.2rem 0.65rem",
              borderRadius: "9999px",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
              background: statusStyle.bg,
              color: statusStyle.color,
              boxShadow: `0 0 8px ${statusStyle.color}25`,
            }}>
              {item.status}
            </span>

            {/* Antique badge — shows on AI detection or AntiqueBot confirmation */}
            {showAntiqueUI && (
              <span style={{
                padding: "0.2rem 0.65rem",
                borderRadius: "9999px",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                background: "linear-gradient(135deg, #FF6B35, #FFB627)",
                color: "#fff",
                boxShadow: "0 2px 6px rgba(255, 107, 53, 0.3)",
              }}>
                ANTIQUE
              </span>
            )}

            {/* Collectible badge */}
            {showCollectibleUI && (
              <span style={{
                padding: "0.2rem 0.65rem",
                borderRadius: "9999px",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                color: "#fff",
                boxShadow: "0 2px 6px rgba(139,92,246,0.3)",
              }}>
                🎴 COLLECTIBLE
              </span>
            )}

            {/* Vehicle detected badge */}
            {(() => {
              const VEHICLE_KW = ["car", "truck", "vehicle", "automobile", "suv", "van", "motorcycle", "atv", "boat", "tractor", "trailer", "rv", "camper"];
              const cat = (aiObj?.category || "").toLowerCase();
              const hasVehicleFields = !!(aiObj?.vehicle_year || aiObj?.vehicle_make || aiObj?.vehicle_model);
              const isVehicle = VEHICLE_KW.some((kw) => cat.includes(kw)) || hasVehicleFields;
              return isVehicle ? (
                <span style={{
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  background: "linear-gradient(135deg, #1565C0, #2196f3)",
                  color: "#fff",
                  boxShadow: "0 2px 6px rgba(33,150,243,0.3)",
                }}>
                  🚗 VEHICLE
                </span>
              ) : null;
            })()}
          </div>

          {/* Subtitle line */}
          {subtitleParts.length > 0 && (
            <p style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              marginTop: "0.45rem",
              margin: "0.45rem 0 0 0",
            }}>
              {subtitleParts.join(" · ")}
            </p>
          )}

          {/* Description */}
          {displayDescription ? (
            <p style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginTop: "0.6rem",
              margin: "0.6rem 0 0 0",
              lineHeight: 1.6,
              maxWidth: "600px",
              paddingLeft: "0.75rem",
              borderLeft: "3px solid rgba(0,188,212,0.25)",
            }}>
              {displayDescription}
            </p>
          ) : !aiObj ? (
            <p style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              marginTop: "0.6rem",
              margin: "0.6rem 0 0 0",
              fontStyle: "italic",
            }}>
              Run AI analysis to get a detailed description and valuation.
            </p>
          ) : null}
        </div>

        {/* Right: Quick Stats + Actions */}
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: "0.75rem", flexShrink: 0 }}>
          {/* Quick Stats */}
          {v && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ textAlign: "center" as const, padding: "0.35rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", minWidth: "70px" }}>
                <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>Value</div>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--accent)" }}>${Math.round(v.low || 0)}–${Math.round(v.high || 0)}</div>
              </div>
              {v.confidence != null && (
                <div style={{ textAlign: "center" as const, padding: "0.35rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                  <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>Confidence</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: (v.confidence > 0.7 || v.confidence > 70) ? "#22c55e" : "#f59e0b" }}>{Math.round(v.confidence > 1 ? v.confidence : v.confidence * 100)}%</div>
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              padding: "0.2rem 0.55rem", borderRadius: "9999px",
              fontSize: "0.62rem", fontWeight: 600,
              background: "var(--ghost-bg)", color: "var(--text-muted)",
              border: "1px solid var(--border-default)",
            }}>
              Tier {user.tier}
            </span>

            <Link
              className="btn-ghost"
              href={`/items/${item.id}/edit`}
              style={{ padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
            >
              Edit
            </Link>

            {isPublic && (
              <a
                href={`/store/${user.id}/item/${item.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "0.35rem 0.85rem", fontSize: "0.72rem", fontWeight: 600,
                  borderRadius: "0.5rem", border: "1px solid var(--accent)",
                  background: "transparent", color: "var(--accent)",
                  textDecoration: "none",
                }}
              >
                View Listing
              </a>
            )}

            <ShareDropdown
              url={shareUrl}
              title={displayTitle}
              description={item.description || "Check out this item on LegacyLoop"}
            />
          </div>
        </div>
      </div>
      </div>

      {/* ═══ Photo Display ═══ */}
      <ItemPhotoStrip
        photos={item.photos.map((p) => ({
          id: p.id,
          filePath: p.filePath,
          isPrimary: p.isPrimary,
        }))}
        displayTitle={displayTitle}
      />

      {/* ═══ Action Buttons ═══ */}
      <AnalyzeActions
        itemId={item.id}
        hasPhotos={item.photos.length > 0}
        isAnalyzed={!!aiObj}
        megabotUsed={(item as any).megabotUsed ?? false}
      />

      {/* ═══ Amazon Price Badge (passive — auto-enriched) ═══ */}
      {aiObj && (
        <div style={{ marginTop: "0.5rem", marginBottom: "0.25rem", display: "flex", justifyContent: "center" }}>
          <AmazonPriceBadge itemId={item.id} />
        </div>
      )}

      {/* ═══ Sale Congrats Bar ═══ */}
      {item.status === "SOLD" && (
        <div style={{ marginTop: "1rem" }}>
          <SaleCongratsBar
            saleMethod={(item as any).saleMethod || "BOTH"}
            itemId={item.id}
          />
        </div>
      )}

      {/* ═══ Sold Price Capture ═══ */}
      <div style={{ marginTop: "1rem" }}>
        <SoldPriceWidget
          itemId={item.id}
          status={item.status}
          existingSoldPrice={item.soldPrice ?? null}
          existingEstimatedValue={item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : null}
        />
      </div>

      {/* ═══ Bot Dashboard Panels (Item Intelligence rendered inside, after Control Center) ═══ */}
      <div style={{ marginTop: "1.75rem" }}>
        <ItemDashboardPanels
          itemId={item.id}
          aiData={aiObj}
          valuation={v ? {
            low: v.low,
            mid: v.mid,
            high: v.high,
            confidence: v.confidence,
            source: v.source,
            rationale: v.rationale,
            localLow: v.localLow,
            localMid: v.localMid,
            localHigh: v.localHigh,
            localSource: v.localSource,
            onlineLow: v.onlineLow,
            onlineMid: v.onlineMid,
            onlineHigh: v.onlineHigh,
            onlineSource: v.onlineSource,
            onlineRationale: v.onlineRationale,
            bestMarketLow: v.bestMarketLow,
            bestMarketMid: v.bestMarketMid,
            bestMarketHigh: v.bestMarketHigh,
            bestMarketCity: v.bestMarketCity,
            sellerNetLocal: v.sellerNetLocal,
            sellerNetNational: v.sellerNetNational,
            sellerNetBestMarket: v.sellerNetBestMarket,
            recommendation: v.recommendation,
            adjustments: v.adjustments,
          } : null}
          antique={antique ? {
            isAntique: showAntiqueUI,
            auctionLow: antique.auctionLow,
            auctionHigh: antique.auctionHigh,
            reason: antique.reason,
          } : null}
          comps={comps.slice(0, 8).map((c: any) => ({
            id: c.id,
            title: c.title,
            platform: c.platform,
            price: c.price,
          }))}
          photos={item.photos.map((p) => ({
            id: p.id,
            filePath: p.filePath,
            isPrimary: p.isPrimary,
            caption: p.caption,
          }))}
          status={item.status}
          category={aiObj?.category || "general"}
          saleZip={item.saleZip ?? null}
          megabotUsed={(item as any).megabotUsed ?? false}
          userTier={user.tier}
          listingPrice={(item as any).listingPrice ?? null}
          authenticityScore={authenticityScore}
          collectiblesScore={collectiblesScore}
          shippingData={{
            weight: (item as any).shippingWeight ?? null,
            length: (item as any).shippingLength ?? null,
            width: (item as any).shippingWidth ?? null,
            height: (item as any).shippingHeight ?? null,
            isFragile: (item as any).isFragile ?? false,
            preference: (item as any).shippingPreference ?? "BUYER_PAYS",
            aiWeightLbs: (item as any).aiWeightLbs ?? null,
            aiDimsEstimate: (item as any).aiDimsEstimate ?? null,
            aiShippingDifficulty: (item as any).aiShippingDifficulty ?? null,
            aiShippingNotes: (item as any).aiShippingNotes ?? null,
            aiShippingConfidence: (item as any).aiShippingConfidence ?? null,
            quotedShippingRate: (() => {
              if (!latestShippingQuote?.payload) return null;
              try {
                const q = JSON.parse(latestShippingQuote.payload);
                return q.cheapest?.price ?? null;
              } catch { return null; }
            })(),
            quotedShippingAt: latestShippingQuote?.createdAt?.toISOString() ?? null,
          }}
          controlCenterExtra={{
            totalViews: engagement?.totalViews ?? 0,
            inquiries: engagement?.inquiries ?? 0,
            buyersFound: engagement?.buyersFound ?? 0,
            documentCount: docCount,
            updatedAt: item.createdAt.toISOString(),
            shippingReady: !!((item as any).shippingWeight && (item as any).shippingLength),
          }}
          projectId={item.projectId ?? null}
        />
      </div>


    </div>
  );
}
