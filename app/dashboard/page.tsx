import Link from "next/link";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";
import DemoSeedButton from "./DemoSeedButton";
import AlertsWidget from "./AlertsWidget";
import { safeJson } from "@/lib/utils/json";
import { DISCOUNTS } from "@/lib/pricing/constants";
import { computeAuthenticityScore, getTierFromScore } from "@/lib/antique-score";
import { computeCollectiblesScore } from "@/lib/collectibles-score";
import { detectCollectible } from "@/lib/collectible-detect";

/** Check both AntiqueCheck table AND AI analysis rawJson for antique detection */
function isAntiqueItem(item: { antiqueCheck?: { isAntique: boolean } | null; aiResult?: { rawJson: string | null } | null }): boolean {
  if (item.antiqueCheck?.isAntique) return true;
  try {
    const raw = item.aiResult?.rawJson;
    if (!raw) return false;
    const ai = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (ai?.is_antique === true || ai?.antique_alert === true) return true;
    const age = typeof ai?.estimated_age === "number" ? ai.estimated_age : parseInt(ai?.estimated_age ?? "");
    if (age >= 70) return true;
    const ageYears = typeof ai?.estimated_age_years === "number" ? ai.estimated_age_years : parseInt(ai?.estimated_age_years ?? "");
    if (ageYears >= 70) return true;
  } catch { /* ignore */ }
  return false;
}

/** Check AI analysis rawJson for collectible detection */
function isCollectibleItem(item: { aiResult?: { rawJson: string | null } | null }): boolean {
  try {
    const rawJson = item.aiResult?.rawJson;
    if (!rawJson) return false;
    const aiData = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
    if (!aiData) return false;
    const detection = detectCollectible(aiData);
    return detection.isCollectible;
  } catch { return false; }
}

export default async function DashboardPage() {
  const user = await authAdapter.getSession();
  if (!user) {
    return (
      <div style={{
        maxWidth: "28rem", margin: "4rem auto", padding: "2rem", borderRadius: "1rem",
        background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", textAlign: "center",
      }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>Please log in</h1>
        <p className="muted" style={{ marginTop: "0.5rem" }}>You need an account to access the dashboard.</p>
        <Link href="/auth/login" className="btn-primary mt-6 inline-flex">Go to Login</Link>
      </div>
    );
  }

  // ── Items ──────────────────────────────────────────────────────────────────
  let items: Awaited<ReturnType<typeof prisma.item.findMany<{
    include: {
      photos: true;
      valuation: true;
      antiqueCheck: true;
      aiResult: true;
      conversations: { include: { messages: { where: { sender: string; isRead: boolean } } } };
    };
  }>>> = [];
  try {
    items = await prisma.item.findMany({
      where: { userId: user.id },
      include: {
        photos: true,
        valuation: true,
        antiqueCheck: true,
        aiResult: true,
        conversations: {
          include: { messages: { where: { sender: "buyer", isRead: false } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("[dashboard] items query failed:", e);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalItems = items.length;
  const analyzedItems = items.filter((i) => ["ANALYZED", "READY", "LISTED", "INTERESTED", "SOLD", "SHIPPED", "COMPLETED"].includes(i.status)).length;
  const antiqueItems = items.filter(isAntiqueItem).length;
  const collectibleItems = items.filter(isCollectibleItem).length;
  const megabotItems = items.filter((i) => i.megabotUsed).length;
  const soldItems = items.filter((i) => ["SOLD", "SHIPPED", "COMPLETED"].includes(i.status)).length;
  const interestedItems = items.filter((i) => i.status === "INTERESTED").length;
  const listedItems = items.filter((i) => i.status === "LISTED").length;
  const draftItems = items.filter((i) => i.status === "DRAFT").length;
  const shippedItems = items.filter((i) => ["SOLD", "SHIPPED"].includes(i.status)).length;

  const estimatedRevenue = items
    .filter((i) => i.valuation)
    .reduce((sum, i) => sum + (i.valuation?.high ?? 0), 0);

  const totalUnread = items.reduce(
    (sum, i) => sum + i.conversations.reduce((s, c) => s + c.messages.length, 0),
    0
  );

  const totalConversations = items.reduce((sum, i) => sum + i.conversations.length, 0);

  // ── Earnings summary ───────────────────────────────────────────────────────
  let totalEarnings = 0;
  try {
    const agg = await prisma.transaction.aggregate({
      where: { userId: user.id, status: "COMPLETED" },
      _sum: { netAmount: true },
    });
    totalEarnings = agg._sum.netAmount ?? 0;
  } catch { /* table may not exist */ }

  // ── Event logs (via item relation — EventLog has no userId) ────────────────
  const itemIds = items.map((i) => i.id);
  let eventLogsRaw: Awaited<ReturnType<typeof prisma.eventLog.findMany<{
    include: { item: { select: { id: true; title: true } } };
  }>>> = [];
  try {
    if (itemIds.length > 0) {
      eventLogsRaw = await prisma.eventLog.findMany({
        where: { itemId: { in: itemIds } },
        include: { item: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }
  } catch (e) {
    console.error("[dashboard] eventLogs query failed:", e);
  }

  const eventLogs = eventLogsRaw.map((log) => ({
    id: log.id,
    itemId: log.itemId,
    eventType: log.eventType,
    payload: log.payload,
    createdAt: log.createdAt.toISOString(),
    itemTitle: log.item.title || `Item #${log.itemId.slice(0, 8)}`,
  }));

  // ── Recon Bot alerts ───────────────────────────────────────────────────────
  let reconAlertsRaw: Awaited<ReturnType<typeof prisma.reconAlert.findMany<{
    include: { reconBot: { include: { item: { select: { id: true; title: true } } } } };
  }>>> = [];
  try {
    reconAlertsRaw = await prisma.reconAlert.findMany({
      where: { reconBot: { userId: user.id }, dismissed: false },
      include: {
        reconBot: { include: { item: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });
  } catch (e) {
    console.error("[dashboard] reconAlerts query failed:", e);
  }

  const reconAlerts = reconAlertsRaw.map((a) => ({
    id: a.id,
    alertType: a.alertType,
    severity: a.severity,
    title: a.title,
    message: a.message,
    actionable: a.actionable,
    suggestedAction: a.suggestedAction ?? null,
    dismissed: a.dismissed,
    createdAt: a.createdAt.toISOString(),
    reconBot: {
      id: a.reconBot.id,
      item: { id: a.reconBot.item.id, title: a.reconBot.item.title },
    },
  }));

  // ── Serialize for client components ───────────────────────────────────────
  const cardItems = items.map((item) => {
    const ai = safeJson(item.aiResult?.rawJson);
    const convCount = item.conversations.length;
    const unreadMsgs = item.conversations.reduce((s, c) => s + c.messages.length, 0);
    const hasBotConv = item.conversations.some((c) => c.botScore < 50);
    const itemIsAntique = isAntiqueItem(item);

    // Compute authenticity score for antique items
    let authenticityScore: number | null = null;
    let antiqueTier: string | null = null;
    if (itemIsAntique) {
      const scoreResult = computeAuthenticityScore({
        aiResult: item.aiResult,
        antiqueCheck: item.antiqueCheck ?? undefined,
        megaBotResult: null,
      });
      authenticityScore = scoreResult.score;
      antiqueTier = scoreResult.tier;
    }

    // Compute collectibles score
    const itemIsCollectible = isCollectibleItem(item);
    let collectiblesScore = 0;
    let collectiblesTier: string | null = null;
    if (itemIsCollectible) {
      const csResult = computeCollectiblesScore({ aiResult: item.aiResult });
      collectiblesScore = csResult.score;
      collectiblesTier = csResult.tier;
    }

    return {
      id: item.id,
      status: item.status as any,
      title: item.title,
      condition: item.condition,
      createdAt: item.createdAt.toISOString(),
      megabotUsed: item.megabotUsed,
      listingPrice: item.listingPrice ? Number(item.listingPrice) : null,
      photoUrl: item.photos[0]?.filePath ?? null,
      isAntique: itemIsAntique,
      authenticityScore,
      antiqueTier,
      isCollectible: itemIsCollectible,
      collectiblesScore,
      collectiblesTier,
      auctionLow: item.antiqueCheck?.auctionLow ?? null,
      auctionHigh: item.antiqueCheck?.auctionHigh ?? null,
      valuationLow: item.valuation?.low ?? null,
      valuationHigh: item.valuation?.high ?? null,
      aiItemName: ai?.item_name ?? null,
      convCount,
      unreadMsgs,
      hasBotConv,
    };
  });

  // ── Action items (things needing attention) ────────────────────────────────
  const actionItems: { label: string; count: number; href: string; color: string; bgColor: string; borderColor: string }[] = [];

  if (totalUnread > 0) {
    actionItems.push({
      label: `${totalUnread} unread message${totalUnread !== 1 ? "s" : ""}`,
      count: totalUnread, href: "/messages",
      color: "#ef4444", bgColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)",
    });
  }
  if (interestedItems > 0) {
    actionItems.push({
      label: `${interestedItems} buyer${interestedItems !== 1 ? "s" : ""} interested`,
      count: interestedItems, href: "/messages",
      color: "#eab308", bgColor: "rgba(234,179,8,0.08)", borderColor: "rgba(234,179,8,0.2)",
    });
  }
  if (shippedItems > 0) {
    actionItems.push({
      label: `${shippedItems} item${shippedItems !== 1 ? "s" : ""} need shipping`,
      count: shippedItems, href: "/dashboard",
      color: "var(--accent)", bgColor: "rgba(0,188,212,0.08)", borderColor: "rgba(0,188,212,0.2)",
    });
  }
  if (draftItems > 0) {
    actionItems.push({
      label: `${draftItems} draft${draftItems !== 1 ? "s" : ""} to finish`,
      count: draftItems, href: "/dashboard",
      color: "var(--text-muted)", bgColor: "var(--bg-card)", borderColor: "var(--border-default)",
    });
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <div className="section-title">Your Workspace</div>
          <h1 className="h2 mt-2">Dashboard</h1>
          <p className="muted mt-1">Welcome back, {user.email.split("@")[0]}. Here&apos;s an overview of your items and activity.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <DemoSeedButton />
          <Link href="/items/new" className="btn-primary" style={{ padding: "0.625rem 1.5rem", fontSize: "0.88rem" }}>
            + New Item
          </Link>
        </div>
      </div>

      {/* ── Row 1: Action banners (premium glass cards) ─────────────────────── */}
      {actionItems.length > 0 && (
        <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {actionItems.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.75rem 1.125rem", borderRadius: "0.75rem",
                background: `linear-gradient(135deg, ${a.bgColor}, rgba(255,255,255,0.02))`,
                border: `1px solid ${a.borderColor}`,
                borderLeft: `3px solid ${a.color}`,
                textDecoration: "none", transition: "all 0.15s ease",
                flex: "1 1 auto", minWidth: "fit-content",
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{
                width: "0.5rem", height: "0.5rem", borderRadius: "50%", flexShrink: 0,
                background: a.color,
                boxShadow: `0 0 8px ${a.bgColor}`,
              }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: a.color }}>
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Recon Bot alerts */}
      <AlertsWidget initialAlerts={reconAlerts} />

      {/* ── Row 2.5: Messages summary ───────────────────────────────────────── */}
      {totalConversations > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.25rem",
          borderRadius: "0.75rem", background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
          marginBottom: "1.75rem", flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {totalConversations} conversation{totalConversations !== 1 ? "s" : ""}
            </span>
            {totalUnread > 0 && (
              <span style={{
                padding: "0.1rem 0.5rem", borderRadius: "0.3rem", fontSize: "0.65rem", fontWeight: 700,
                background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
              }}>
                {totalUnread} unread
              </span>
            )}
          </div>
          <Link href="/messages" className="btn-ghost" style={{ padding: "0.4rem 0.875rem", fontSize: "0.78rem" }}>
            View Messages
          </Link>
        </div>
      )}

      {/* ── Pre-launch pricing banner ────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "1rem 1.25rem", borderRadius: "0.75rem", marginBottom: "1.75rem",
        background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(0,188,212,0.02))",
        border: "1px solid var(--accent-border)",
      }}>
        <span style={{
          flexShrink: 0, padding: "0.2rem 0.625rem", borderRadius: "0.35rem",
          background: "var(--accent)", color: "#fff",
          fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const,
        }}>
          Founding Member
        </span>
        <span style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Lock in pre-launch pricing — <strong style={{ color: "var(--text-primary)" }}>{DISCOUNTS.preLaunch.spotsRemaining} of {DISCOUNTS.preLaunch.totalSpots}</strong> spots remaining
        </span>
        <Link
          href="/pricing"
          style={{
            flexShrink: 0, padding: "0.4rem 1rem", borderRadius: "0.5rem",
            background: "var(--accent-dim)", color: "var(--accent)",
            fontSize: "0.78rem", fontWeight: 600, textDecoration: "none",
            border: "1px solid var(--accent-border)",
          }}
        >
          View Pricing
        </Link>
      </div>

      {/* ── Interactive: Stat Cards + Filtered Items + Activity Feed ─────── */}
      {items.length === 0 ? (
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{
            textAlign: "center", padding: "4rem 2rem", borderRadius: "1.25rem",
            background: "linear-gradient(135deg, var(--bg-card-solid), rgba(0,188,212,0.03))",
            border: "1px solid var(--border-default)",
          }}>
            {/* Animated upload icon */}
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "rgba(0,188,212,0.08)", border: "2px solid rgba(0,188,212,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem",
              animation: "emptyPulse 2.5s ease-in-out infinite",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Ready to start selling?
            </div>
            <p style={{
              fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "340px", margin: "0 auto 2rem", lineHeight: 1.6,
            }}>
              Upload a photo and our AI will identify, price, and list your item automatically.
            </p>
            <Link href="/items/new" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.85rem 2.25rem", borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #00bcd4, #0097a7)",
              color: "#fff", fontSize: "1rem", fontWeight: 600,
              textDecoration: "none", border: "none",
              boxShadow: "0 4px 16px rgba(0,188,212,0.25)",
              transition: "all 0.15s ease",
            }}>
              + Add Your First Item
            </Link>
            <style>{`@keyframes emptyPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,188,212,0.2); } 50% { transform: scale(1.05); box-shadow: 0 0 20px 4px rgba(0,188,212,0.15); } }`}</style>
          </div>
        </div>
      ) : (
        <DashboardClient
          items={cardItems}
          stats={{
            totalItems,
            analyzedItems,
            antiqueItems,
            collectibleItems,
            megabotItems,
            soldItems,
            listedItems,
            estimatedRevenue,
            totalEarnings,
          }}
          events={eventLogs}
        />
      )}

      {/* ── Row 5: Quick links ──────────────────────────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem",
      }}>
        {[
          { label: "Sales", href: "/projects", sub: "Sale events" },
          { label: "Buyers", href: "/buyers", sub: "Active leads" },
          { label: "Store", href: "/store", sub: "Public listing" },
          { label: "Earnings", href: "/payments", sub: totalEarnings > 0 ? `$${Math.round(totalEarnings)}` : "View payouts" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            style={{
              display: "block", padding: "1rem 1.25rem", borderRadius: "0.75rem",
              background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
              textDecoration: "none", transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{link.label}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{link.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
