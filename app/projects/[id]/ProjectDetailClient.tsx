"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShareButtons from "@/app/components/ShareButtons";

type ProjectInfo = {
  id: string; type: string; name: string; description: string | null;
  startDate: string | null; endDate: string | null;
  city: string | null; state: string | null; status: string;
  itemCount: number; soldCount: number; revenue: number; portfolio: number;
  publicUrl: string;
};
type ItemRow = {
  id: string; title: string; status: string; photoUrl: string | null;
  isAntique: boolean; valuationHigh: number | null; listingPrice: number | null; convCount: number;
};
type AvailItem = { id: string; title: string; photoUrl: string | null; status: string };

const SALE_TYPE_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  ESTATE_SALE: { emoji: "\uD83C\uDFE1", label: "Estate Sale", color: "#a855f7" },
  GARAGE_SALE: { emoji: "\uD83C\uDFF7\uFE0F", label: "Garage Sale", color: "#00bcd4" },
  MOVING_SALE: { emoji: "\uD83D\uDE9B", label: "Moving Sale", color: "#f97316" },
  YARD_SALE:   { emoji: "\uD83C\uDF3F", label: "Yard Sale", color: "#22c55e" },
  DOWNSIZING:  { emoji: "\uD83D\uDCE6", label: "Downsizing Sale", color: "#eab308" },
  ONLINE_SALE: { emoji: "\uD83D\uDECD\uFE0F", label: "Online Sale Only", color: "#3b82f6" },
};

const STATUS_CHIP: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
  ANALYZED: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  READY: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
  LISTED: { bg: "rgba(0,188,212,0.12)", color: "#00bcd4" },
  INTERESTED: { bg: "rgba(234,179,8,0.12)", color: "#eab308" },
  SOLD: { bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
  SHIPPED: { bg: "rgba(168,85,247,0.12)", color: "#a855f7" },
  COMPLETED: { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
};

const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
  DRAFT: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  ACTIVE: { color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  COMPLETED: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

export default function ProjectDetailClient({ project, items, availableItems }: {
  project: ProjectInfo; items: ItemRow[]; availableItems: AvailItem[];
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [showAddItems, setShowAddItems] = useState(false);

  const conversionRate = project.itemCount > 0
    ? Math.round((project.soldCount / project.itemCount) * 100)
    : 0;

  const saleType = SALE_TYPE_MAP[project.type] || SALE_TYPE_MAP.ESTATE_SALE;
  const statusBadge = STATUS_BADGE[project.status] || STATUS_BADGE.DRAFT;

  async function publishAll() {
    setPublishing(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishAll: true }),
    });
    setPublishing(false);
    router.refresh();
  }

  async function addItem(itemId: string) {
    setAddingItem(itemId);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addItemId: itemId }),
    });
    setAddingItem(null);
    setShowAddItems(false);
    router.refresh();
  }

  async function removeItem(itemId: string) {
    setRemovingItem(itemId);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeItemId: itemId }),
    });
    setRemovingItem(null);
    router.refresh();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "1.25rem", fontSize: "0.82rem" }}>
        <Link href="/projects" style={{ color: "#00bcd4", textDecoration: "none", fontWeight: 500 }}>&larr; My Sales</Link>
        <span style={{ color: "var(--text-muted)" }}> / {project.name}</span>
      </div>

      {/* Header card */}
      <div style={{
        padding: "1.5rem", borderRadius: "1rem", marginBottom: "1.25rem",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <span style={{
                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: saleType.color, display: "flex", alignItems: "center", gap: "0.25rem",
              }}>
                {saleType.emoji} {saleType.label}
              </span>
              <span style={{
                fontSize: "0.55rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "9999px",
                textTransform: "uppercase", letterSpacing: "0.06em",
                background: statusBadge.bg, color: statusBadge.color,
              }}>
                {project.status}
              </span>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.2rem 0 0 0" }}>
              {project.name}
            </h1>
            {(project.startDate || project.city) && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.35rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {project.startDate && (
                  <span>
                    {"\uD83D\uDCC5"} {new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {project.endDate && ` \u2013 ${new Date(project.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  </span>
                )}
                {project.city && project.state && <span>{"\uD83D\uDCCD"} {project.city}, {project.state}</span>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <a
              href={`/sale/${project.id}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600,
                textDecoration: "none", transition: "all 0.15s ease",
              }}
            >
              {"\uD83D\uDD17"} Public Page
            </a>
            <button
              onClick={publishAll}
              disabled={publishing}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                padding: "0.45rem 0.85rem", borderRadius: "0.5rem", border: "none",
                background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                fontSize: "0.78rem", fontWeight: 700, cursor: publishing ? "wait" : "pointer",
                opacity: publishing ? 0.7 : 1, transition: "all 0.2s ease",
              }}
            >
              {publishing ? "Publishing..." : "\uD83D\uDCE2 Publish All Items"}
            </button>
          </div>
        </div>

        {/* Share */}
        <div style={{ marginTop: "1rem" }}>
          <ShareButtons
            url={project.publicUrl}
            title={project.name}
            description={project.description || `${project.name} \u2014 sale on LegacyLoop`}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total Items", value: project.itemCount, color: "var(--text-primary)" },
          { label: "Sold", value: project.soldCount, color: "#4ade80" },
          { label: "Revenue", value: `$${project.revenue.toLocaleString()}`, color: project.revenue > 0 ? "#4ade80" : "var(--text-muted)" },
          { label: "Conversion", value: `${conversionRate}%`, color: conversionRate > 30 ? "#4ade80" : "#00bcd4" },
          { label: "Est. Portfolio", value: `$${project.portfolio.toLocaleString()}`, color: "#00bcd4" },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "1rem", borderRadius: "0.75rem",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color, marginTop: "0.25rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Items section */}
      <div style={{
        padding: "1.5rem", borderRadius: "1rem",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Items in this Sale
            </div>
            <span style={{
              fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "9999px",
              background: "rgba(0,188,212,0.12)", color: "#00bcd4",
            }}>
              {items.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddItems(!showAddItems)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              padding: "0.4rem 0.85rem", borderRadius: "0.5rem",
              border: "1px solid rgba(0,188,212,0.25)", background: "rgba(0,188,212,0.06)",
              color: "#00bcd4", fontSize: "0.75rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s ease",
            }}
          >
            + Add Items
          </button>
        </div>

        {/* Add items panel */}
        {showAddItems && availableItems.length > 0 && (
          <div style={{
            background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)",
            borderRadius: "0.75rem", padding: "1rem", marginBottom: "1rem",
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#00bcd4", marginBottom: "0.6rem" }}>
              Add existing items to this sale:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", maxHeight: "220px", overflowY: "auto" }}>
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.45rem 0.65rem",
                    background: "rgba(255,255,255,0.03)", borderRadius: "0.5rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt="" style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "0.35rem", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.06)", borderRadius: "0.35rem", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, fontSize: "0.8rem", fontWeight: 500, color: "var(--text-primary)" }}>{item.title}</div>
                  <button
                    onClick={() => addItem(item.id)}
                    disabled={addingItem === item.id}
                    style={{
                      padding: "0.3rem 0.65rem", borderRadius: "0.4rem", border: "none",
                      background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                      fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                      opacity: addingItem === item.id ? 0.6 : 1,
                    }}
                  >
                    {addingItem === item.id ? "Adding\u2026" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddItems && availableItems.length === 0 && (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "0.75rem", padding: "1rem", marginBottom: "1rem",
            textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)",
          }}>
            All your items are already assigned to a sale. <Link href="/items/new" style={{ color: "#00bcd4", textDecoration: "none", fontWeight: 600 }}>Create a new item</Link>
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
            <div style={{
              width: "3.5rem", height: "3.5rem", borderRadius: "50%", margin: "0 auto 1rem",
              background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem",
            }}>
              {"\uD83D\uDCF7"}
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
              Ready to add your first item?
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: "380px", margin: "0 auto", lineHeight: 1.5 }}>
              Add photos and our AI will identify, price, and create listings automatically.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <Link
                href="/items/new"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  padding: "0.55rem 1.1rem", borderRadius: "0.5rem", border: "none",
                  background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                  fontSize: "0.82rem", fontWeight: 700, textDecoration: "none",
                }}
              >
                + Add New Item
              </Link>
              {availableItems.length > 0 && (
                <button
                  onClick={() => setShowAddItems(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.55rem 1.1rem", borderRadius: "0.5rem",
                    border: "1px solid rgba(0,188,212,0.25)", background: "transparent",
                    color: "#00bcd4", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  + Add Existing Items
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {items.map((item) => {
              const chip = STATUS_CHIP[item.status] ?? STATUS_CHIP.DRAFT;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    background: "rgba(255,255,255,0.02)", borderRadius: "0.6rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                    transition: "background 0.15s ease",
                  }}
                >
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt="" style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "0.45rem", flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "0.45rem", flexShrink: 0,
                      background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "0.9rem" }}>{"\uD83D\uDCF7"}</span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                      {item.title}
                      {item.isAntique && <span style={{ marginLeft: "0.4rem", fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.35rem", borderRadius: "9999px", background: "rgba(255,107,53,0.12)", color: "#FF6B35" }}>ANTIQUE</span>}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      {item.convCount > 0 && `\uD83D\uDCAC ${item.convCount} buyer${item.convCount !== 1 ? "s" : ""} \u00B7 `}
                      {item.listingPrice != null ? `$${item.listingPrice.toLocaleString()}` : item.valuationHigh ? `Est. $${Math.round(item.valuationHigh).toLocaleString()}` : "No price yet"}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.62rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px",
                    background: chip.bg, color: chip.color, textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {item.status}
                  </span>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <Link
                      href={`/items/${item.id}`}
                      style={{
                        fontSize: "0.68rem", padding: "0.25rem 0.55rem", borderRadius: "0.35rem",
                        border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                        color: "var(--text-muted)", textDecoration: "none", fontWeight: 500,
                      }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={removingItem === item.id}
                      style={{
                        fontSize: "0.68rem", padding: "0.25rem 0.55rem", borderRadius: "0.35rem",
                        border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)",
                        color: "#ef4444", cursor: "pointer", fontWeight: 500,
                        opacity: removingItem === item.id ? 0.5 : 1,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
