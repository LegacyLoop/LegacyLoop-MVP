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
import { calculateGarageSalePrices } from "@/lib/pricing/garage-sale";
import { computePricingConsensus } from "@/lib/pricing/reconcile";
import { detectCollectible } from "@/lib/collectible-detect";
import AmazonPriceBadge from "./AmazonPriceBadge";
import V8PillsStrip from "./V8PillsStrip";
import ConfidencePill from "./ConfidencePill";
import DetectionHUD from "./DetectionHUD";
import SoldPriceWidget from "./SoldPriceWidget";
import SaleCongratsBar from "./SaleCongratsBar";
import { enrichItemContext } from "@/lib/addons/enrich-item-context";

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
  LISTED: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  INTERESTED: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  SOLD: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  SHIPPED: { bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
  COMPLETED: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  RETURN_REQUESTED: { bg: "rgba(239,68,68,0.12)", color: "#f87171" },
  RETURNED: { bg: "rgba(251,146,60,0.12)", color: "#fb923c" },
  REFUNDED: { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
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

  // Calculate garage sale prices server-side for header pills (V2: enriched options)
  const valForGs = item.valuation;
  const marketMid = (valForGs as any)?.mid ?? (valForGs ? Math.round((valForGs.low + valForGs.high) / 2) : 0);
  let aiDataForGs: any = {};
  try { aiDataForGs = item.aiResult?.rawJson ? JSON.parse(item.aiResult.rawJson) : {}; } catch { /* */ }
  const antiqueForGs = item.antiqueCheck;
  const gsCalc = marketMid > 0
    ? calculateGarageSalePrices(
        marketMid,
        aiDataForGs.category || (item as any).category || "",
        aiDataForGs.condition_guess || (item as any).condition || "good",
        (item as any).saleZip,
        {
          isAntique: antiqueForGs?.isAntique ?? false,
          authenticityScore: antiqueForGs?.authenticityScore ?? undefined,
          auctionLow: antiqueForGs?.auctionLow ?? undefined,
          auctionHigh: antiqueForGs?.auctionHigh ?? undefined,
          confidenceScore: aiDataForGs.pricing_confidence ?? (valForGs?.confidence ?? undefined),
          brand: aiDataForGs.brand ?? undefined,
          marketCompsCount: item.marketComps?.length ?? 0,
        },
      )
    : null;

  // Auto-save garage prices to DB if calculated but not yet persisted (fire-and-forget)
  if (gsCalc && !(item as any).garageSalePrice) {
    prisma.item.update({
      where: { id: item.id },
      data: {
        garageSalePrice: gsCalc.garageSalePrice,
        garageSalePriceHigh: gsCalc.garageSalePriceHigh,
        quickSalePrice: gsCalc.quickSalePrice,
        quickSalePriceHigh: gsCalc.quickSalePriceHigh,
        garageSaleCalcAt: new Date(),
      },
    }).catch(() => {});
  }

  // Fetch engagement metrics + document count + latest shipping quote for control center
  const [engagement, docCount, latestShippingQuote, demandScoreLog, disagreementLog, v8CalcLog, v9CalcLog] = await Promise.all([
    prisma.itemEngagementMetrics.findUnique({ where: { itemId: item.id }, select: { totalViews: true, inquiries: true, buyersFound: true } }).catch(() => null),
    prisma.itemDocument.count({ where: { itemId: item.id } }).catch(() => 0),
    prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: "SHIPPING_QUOTED" },
      orderBy: { createdAt: "desc" },
      select: { payload: true, createdAt: true },
    }).catch(() => null),
    prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: "DEMAND_SCORE" },
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    }).catch(() => null),
    prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: "BOT_DISAGREEMENT" },
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    }).catch(() => null),
    prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: { in: ["GARAGE_SALE_V9_CALC", "GARAGE_SALE_V8_CALC"] } },
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    }).catch(() => null),
    prisma.eventLog.findFirst({
      where: { itemId: item.id, eventType: "GARAGE_SALE_V9_CALC" },
      orderBy: { createdAt: "desc" },
      select: { payload: true },
    }).catch(() => null),
  ]);

  const demandScore = demandScoreLog?.payload ? safeJsonParse(demandScoreLog.payload) : null;
  const botDisagreement = disagreementLog?.payload ? safeJsonParse(disagreementLog.payload) : null;
  const v8CalcData = v8CalcLog?.payload ? safeJsonParse(v8CalcLog.payload) : null;
  const v9CalcData = v9CalcLog?.payload ? safeJsonParse(v9CalcLog.payload) : null;

  const enriched = await enrichItemContext(item.id, (item as any).listingPrice ?? null).catch(() => null);
  const aiObj = item.aiResult?.rawJson ? safeJsonParse(item.aiResult.rawJson) : null;
  const displayTitle = item.title || aiObj?.item_name || (item.status === "DRAFT" ? "New Item — Awaiting Analysis" : `Item #${item.id.slice(0, 8)}`);
  const antique = item.antiqueCheck;

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
  const collectibleDetectionResult = aiObj ? detectCollectible(aiObj) : null;
  const isCollectibleFromAI = collectibleDetectionResult?.isCollectible ?? false;
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

  // CMD-PRICING-INTELLIGENCE-V3: compute reconciled pricing with category-
  // aware weights + outlier detection + identity anchor + Trust Score
  const pricingConsensus = await computePricingConsensus(item.id, {
    category: aiObj?.category,
    brand: aiObj?.brand,
    isAntique: showAntiqueUI,
    isCollectible: isCollectibleFromAI,
    // CMD-RECONCILE-SALE-METHOD-AWARE: SSR path threads saleMethod +
    // saleRadiusMi so LOCAL_PICKUP items get v8_engine pass-through
    // for list/accept/floor and local-tier Valuation range.
    saleMethod: (item as any).saleMethod ?? undefined,
    saleRadiusMi: (item as any).saleRadiusMi ?? undefined,
  }).catch(() => null);

  const v = item.valuation as any;
  // CMD-NET-PAYOUT-LOCAL-PICKUP-MATH: top-card V8 pills swap to
  // in-person (gsCalc) tier when seller opted local-only.
  const itemSaleMethod = (item as any).saleMethod ?? "BOTH";
  const isLocalPickup = itemSaleMethod === "LOCAL_PICKUP";
  const comps = Array.isArray(item.marketComps) ? item.marketComps : [];

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
    <div className="mx-auto max-w-4xl px-4" style={{ overflowX: "hidden", maxWidth: "100%", boxSizing: "border-box" }}>
      {/* CMD-MOBILE-QA-FIX: Item header stacks vertically on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .item-header-row {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .item-header-row > div:last-child {
            align-items: flex-start !important;
          }
        }
        /* Hide scrollbar on price pills strip */
        .item-header-row div::-webkit-scrollbar { display: none; }
        .item-header-row div { scrollbar-width: none; }
        /* Full-width bot action buttons on mobile */
        @media (max-width: 640px) {
          .item-analyze-actions button { width: 100% !important; justify-content: center; }
        }
      `}</style>
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Items", href: "/items" },
        { label: displayTitle },
      ]} />



      {/* Hero photo warning */}
      {item.photos.length > 0 && !item.photos.some((p: any) => p.isPrimary) && (
        <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "10px", padding: "0.65rem 1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#eab308" }}>
          <span>⚠️</span>
          <span>No primary photo set — <strong>set a cover photo</strong> for best listing results.</span>
        </div>
      )}

      {/* ═══ Premium Header Card ═══ */}
      <div className="glass-card" style={{
        padding: "1.5rem",
        marginBottom: "0.75rem",
      }}>
      <div className="item-header-row" style={{
        display: "flex",
        flexDirection: "column" as const,
        gap: 0,
        minWidth: 0,
      }}>
        {/* ═══ BAND 1 — IDENTITY ═══ */}
        <div className="item-header-band" style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem", width: "100%", maxWidth: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            <h1 style={{
              fontSize: "1.85rem",
              fontWeight: 800,
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
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

            {/* Antique badge */}
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
              const VEHICLE_KW = ["car", "truck", "vehicle", "automobile", "suv", "van", "motorcycle", "atv", "boat", "trailer", "rv", "camper"];
              const cat = (aiObj?.category || "").toLowerCase();
              const hasVehicleFields = !!(aiObj?.vehicle_year || aiObj?.vehicle_make || aiObj?.vehicle_model);
              const isOutdoorEq = cat.includes("outdoor") || cat.includes("garden") || /riding\s*mow|lawn\s*mow|garden\s*tract|lawn\s*tract/i.test((aiObj?.item_name || "") + " " + (aiObj?.subcategory || ""));
              const isVehicle = !isOutdoorEq && (VEHICLE_KW.some((kw) => cat.includes(kw)) || hasVehicleFields);
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

            {/* High value badge */}
            {(() => {
              const midVal = v?.mid ?? (v?.low != null && v?.high != null ? Math.round((v.low + v.high) / 2) : 0);
              const highVal = v?.high ?? 0;
              return (midVal >= 500 || highVal >= 500) ? (
                <span style={{
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  background: "linear-gradient(135deg, #d97706, #f59e0b)",
                  color: "#fff",
                  boxShadow: "0 2px 6px rgba(245,158,11,0.3)",
                }}>
                  💎 HIGH VALUE
                </span>
              ) : null;
            })()}
          </div>

          {/* Subtitle line */}
          {subtitleParts.length > 0 && (
            <p style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              margin: 0,
            }}>
              {subtitleParts.join(" · ")}
            </p>
          )}

          {/* Description */}
          {displayDescription ? (
            <p style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: "720px",
              paddingLeft: "0.75rem",
              borderLeft: "3px solid rgba(0,188,212,0.25)",
            }}>
              {displayDescription}
            </p>
          ) : !aiObj ? (
            <p style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              margin: 0,
              fontStyle: "italic",
            }}>
              Run AI analysis to get a detailed description and valuation.
            </p>
          ) : null}
        </div>

        {v && <div className="item-header-divider" />}

        {/* ═══ BAND 2 — PRICING INTELLIGENCE ═══ */}
        {v && (
          <div
            className="item-header-band item-header-pricing-band"
            style={{
              display: "flex",
              flexDirection: "row" as const,
              flexWrap: "nowrap" as const,
              gap: "0.5rem",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              paddingBottom: "2px",
              WebkitMaskImage: "linear-gradient(to right, black 0, black calc(100% - 20px), transparent 100%)",
              maskImage: "linear-gradient(to right, black 0, black calc(100% - 20px), transparent 100%)",
            }}
          >
            <div style={{ textAlign: "center" as const, padding: "0.35rem 0.65rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", minWidth: "55px", flexShrink: 0 }}>
              <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>Value</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "var(--font-data)", color: "var(--accent)", letterSpacing: "-0.01em" }}>{`$${pricingConsensus?.consensusValueLow ?? Math.round(v.low || 0)}–${pricingConsensus?.consensusValueHigh ?? Math.round(v.high || 0)}`}</div>
            </div>
            {v.confidence != null && (
              <ConfidencePill
                value={pricingConsensus?.consensusConfidence ?? (v.confidence > 1 ? v.confidence : v.confidence * 100)}
                itemId={item.id}
              />
            )}
            {gsCalc && !gsCalc.isExempt && (pricingConsensus || (isLocalPickup && gsCalc)) && (
              <V8PillsStrip itemId={item.id} pills={[
                { label: "List", value: isLocalPickup && gsCalc ? gsCalc.garageSalePriceHigh : (pricingConsensus?.consensusListPrice ?? 0), color: "#00bcd4", bg: "rgba(0,188,212,0.06)", border: "rgba(0,188,212,0.2)", trustRing: (pricingConsensus?.consensusConfidence ?? 0) >= 90 },
                { label: "Accept", value: isLocalPickup && gsCalc ? gsCalc.garageSalePrice : (pricingConsensus?.consensusAcceptPrice ?? 0), color: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.2)" },
                { label: "Floor", value: isLocalPickup && gsCalc ? gsCalc.quickSalePrice : (pricingConsensus?.consensusFloorPrice ?? 0), color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" },
              ]} />
            )}
            {gsCalc && !gsCalc.isExempt && !pricingConsensus && (<>
              <div style={{ textAlign: "center" as const, padding: "0.35rem 0.65rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.2)", minWidth: "55px", flexShrink: 0 }}>
                <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#00bcd4", fontWeight: 700 }}>Garage Sale</div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "var(--font-data)", color: "#00bcd4", letterSpacing: "-0.01em" }}>{`$${gsCalc.garageSalePrice}–${gsCalc.garageSalePriceHigh}`}</div>
              </div>
              <div style={{ textAlign: "center" as const, padding: "0.35rem 0.65rem", borderRadius: "0.5rem", background: "rgba(29,158,117,0.06)", border: "1px solid rgba(29,158,117,0.2)", minWidth: "55px", flexShrink: 0 }}>
                <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#1D9E75", fontWeight: 700 }}>Quick Sale</div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "var(--font-data)", color: "#1D9E75", letterSpacing: "-0.01em" }}>{`$${gsCalc.quickSalePrice}–${gsCalc.quickSalePriceHigh}`}</div>
              </div>
            </>)}
            {gsCalc?.isExempt && (pricingConsensus || (isLocalPickup && gsCalc)) && (
              <V8PillsStrip itemId={item.id} pills={[
                { label: "Hold", value: isLocalPickup && gsCalc ? gsCalc.garageSalePriceHigh : (pricingConsensus?.consensusListPrice ?? 0), color: "#D4AF37", bg: "rgba(212,175,55,0.08)", border: "rgba(212,175,55,0.25)" },
                { label: "Negotiate", value: isLocalPickup && gsCalc ? gsCalc.garageSalePrice : (pricingConsensus?.consensusAcceptPrice ?? 0), color: "#D4AF37", bg: "rgba(212,175,55,0.06)", border: "rgba(212,175,55,0.20)" },
                { label: "Minimum", value: isLocalPickup && gsCalc ? gsCalc.quickSalePrice : (pricingConsensus?.consensusFloorPrice ?? 0), color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" },
              ]} />
            )}
            {gsCalc?.isExempt && !pricingConsensus && (
              <div style={{ textAlign: "center" as const, padding: "0.35rem 0.65rem", borderRadius: "0.5rem", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", flexShrink: 0 }}>
                <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#D4AF37", fontWeight: 700 }}>Collectible</div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "var(--font-data)", color: "#D4AF37", letterSpacing: "-0.01em" }}>{`$${gsCalc.garageSalePrice}–${gsCalc.garageSalePriceHigh}`}</div>
              </div>
            )}
          </div>
        )}

        <div className="item-header-divider" />

        {/* ═══ BAND 3 — ACTIONS ═══ */}
        <div className="item-header-band item-header-actions" style={{ display: "flex", flexDirection: "row" as const, alignItems: "center", gap: "0.5rem", flexWrap: "wrap", width: "100%", maxWidth: "100%" }}>
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

      {/* ═══ Detection HUD (Antique + Collectible — above Control Center) ═══ */}
      {(showAntiqueUI || showCollectibleUI) && (
        <div style={{ marginTop: "0.75rem" }}>
          <DetectionHUD
            itemId={item.id}
            showAntique={showAntiqueUI}
            antique={antique ? {
              isAntique: showAntiqueUI,
              auctionLow: antique.auctionLow,
              auctionHigh: antique.auctionHigh,
              reason: antique.reason,
            } : null}
            authenticityScore={authenticityScore}
            antiqueBannerAge={(() => {
              const estAge = Number(aiObj?.estimated_age_years ?? aiObj?.estimated_age ?? 0);
              const decStr = String(aiObj?.decade ?? aiObj?.era ?? "");
              const decAge = (() => { const m = decStr.match(/(\d{4})/); return m ? new Date().getFullYear() - Number(m[1]) : 0; })();
              return estAge >= 70 ? `~${estAge} Years Old` : decAge >= 70 ? `~${decStr}` : null;
            })()}
            showCollectible={showCollectibleUI}
            collectibleDetection={collectibleDetectionResult}
            collectiblesScore={collectiblesScore}
            isAntique={showAntiqueUI}
          />
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
      <div style={{ marginTop: "1.75rem", overflowX: "hidden", maxWidth: "100%", boxSizing: "border-box" }}>
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
          demandScore={demandScore}
          botDisagreement={botDisagreement}
          enriched={enriched ? {
            priceDirection: enriched.priceDirection,
            demandLevel: enriched.demandLevel,
            totalOffers: enriched.totalOffers,
            highestOffer: enriched.highestOffer,
            offerToAskRatio: enriched.offerToAskRatio,
            soldPrice: enriched.soldPrice,
            dataCompleteness: enriched.dataCompleteness,
            bestPlatform: enriched.bestPlatform,
            targetBuyerProfiles: enriched.targetBuyerProfiles,
            valueDrivers: enriched.valueDrivers,
            topSearchKeywords: enriched.topSearchKeywords,
            avgCompPrice: enriched.avgCompPrice,
            highComp: enriched.highComp,
            lowComp: enriched.lowComp,
            aiConfidence: enriched.aiConfidence,
            compCount: enriched.marketComps?.length ?? 0,
            hasAcceptedOffer: enriched.hasAcceptedOffer,
          } : null}
          itemSaleMethod={(item as any).saleMethod || null}
          itemIsCollectible={isCollectibleFromAI}
          v8CalcData={v8CalcData}
          v9CalcData={v9CalcData}
          pricingConsensus={pricingConsensus}
        />
      </div>


    </div>
  );
}
