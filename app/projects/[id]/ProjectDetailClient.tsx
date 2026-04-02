"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShareButtons from "@/app/components/ShareButtons";
import BundleSuggestions from "@/app/components/BundleSuggestions";
import BudgetGuard from "@/app/components/BudgetGuard";

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
  category?: string | null;
};
type AvailItem = { id: string; title: string; photoUrl: string | null; status: string };

const SALE_TYPE_MAP: Record<string, { emoji: string; label: string; sub: string; color: string }> = {
  ESTATE_SALE: { emoji: "\u{1F3E1}", label: "Estate Sale", sub: "Downsizing, inheritance, liquidation", color: "#a855f7" },
  GARAGE_SALE: { emoji: "\u{1F3F7}\u{FE0F}", label: "Garage Sale", sub: "Decluttering, seasonal cleanout", color: "#00bcd4" },
  MOVING_SALE: { emoji: "\u{1F69B}", label: "Moving Sale", sub: "Relocating, everything must go", color: "#f97316" },
  YARD_SALE:   { emoji: "\u{1F33F}", label: "Yard Sale", sub: "Casual outdoor sale, community event", color: "#22c55e" },
  DOWNSIZING:  { emoji: "\u{1F4E6}", label: "Downsizing Sale", sub: "Simplifying, curated items", color: "#eab308" },
  ONLINE_SALE: { emoji: "\u{1F6CD}\u{FE0F}", label: "Online Sale Only", sub: "Ship everything, no in-person", color: "#3b82f6" },
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

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--input-bg, rgba(255,255,255,0.06))",
  border: "1px solid var(--input-border, rgba(255,255,255,0.16))",
  color: "var(--input-color, #f1f5f9)",
  borderRadius: "0.5rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.85rem",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};

export default function ProjectDetailClient({ project, items, availableItems }: {
  project: ProjectInfo; items: ItemRow[]; availableItems: AvailItem[];
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [showAddItems, setShowAddItems] = useState(
    items.length < 3 && availableItems.length > 0
  );

  // ── Sell All state ──
  const [showSellAll, setShowSellAll] = useState(false);
  const [sellAllMode, setSellAllMode] = useState<"discount" | "fixed">("discount");
  const [discountPct, setDiscountPct] = useState(25);
  const [fixedPrice, setFixedPrice] = useState("");
  const [sellAllProcessing, setSellAllProcessing] = useState(false);

  // ── Department sell state ──
  const [showDeptSell, setShowDeptSell] = useState<string | null>(null);
  const [deptDiscount, setDeptDiscount] = useState(20);
  const [deptSelling, setDeptSelling] = useState(false);

  // ── Edit mode state ──
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description || "",
    type: project.type,
    startDate: project.startDate ? project.startDate.split("T")[0] : "",
    endDate: project.endDate ? project.endDate.split("T")[0] : "",
    city: project.city || "",
    state: project.state || "",
    status: project.status,
  });

  const conversionRate = project.itemCount > 0
    ? Math.round((project.soldCount / project.itemCount) * 100)
    : 0;

  const saleType = SALE_TYPE_MAP[project.type] || SALE_TYPE_MAP.ESTATE_SALE;
  const statusBadge = STATUS_BADGE[project.status] || STATUS_BADGE.DRAFT;

  // ── Department grouping ──
  const departments: Record<string, typeof items> = {};
  for (const item of items) {
    const cat = item.category || "Other";
    if (!departments[cat]) departments[cat] = [];
    departments[cat].push(item);
  }
  const deptEntries = Object.entries(departments).filter(([, di]) => di.length >= 1).sort((a, b) => b[1].length - a[1].length);

  // ── Handlers ──

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

  async function saveEdit() {
    // Status change confirmations
    if (editForm.status === "ACTIVE" && project.status !== "ACTIVE") {
      if (!confirm("Activate this sale? Items will become visible to buyers.")) return;
    }
    if (editForm.status === "COMPLETED" && project.status !== "COMPLETED") {
      if (!confirm("Mark this sale as complete? This indicates the sale is finished.")) return;
    }
    setSaving(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    setEditMode(false);
    router.refresh();
  }

  // ── Sell All handler ──
  const unsoldCount = project.itemCount - project.soldCount;
  const unsoldValue = project.portfolio;
  const discountedPrice = Math.round(unsoldValue * (1 - discountPct / 100));
  const displayPrice = sellAllMode === "discount" ? discountedPrice : (parseFloat(fixedPrice) || 0);
  const savingsAmount = unsoldValue - displayPrice;
  const savingsPct = unsoldValue > 0 ? Math.round((savingsAmount / unsoldValue) * 100) : 0;

  async function executeSellAll() {
    const priceToUse = sellAllMode === "discount" ? discountedPrice : parseFloat(fixedPrice);
    if (!priceToUse || priceToUse <= 0) return;
    if (!confirm(`Sell all ${unsoldCount} items for $${priceToUse.toLocaleString()}? This will mark all unsold items as SOLD.`)) return;
    setSellAllProcessing(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellAll: sellAllMode === "discount"
          ? { discountPct }
          : { bulkPrice: parseFloat(fixedPrice) },
      }),
    });
    setSellAllProcessing(false);
    setShowSellAll(false);
    router.refresh();
  }

  function cancelEdit() {
    setEditForm({
      name: project.name,
      description: project.description || "",
      type: project.type,
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
      city: project.city || "",
      state: project.state || "",
      status: project.status,
    });
    setEditMode(false);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "1.25rem", fontSize: "0.82rem" }}>
        <Link href="/projects" style={{ color: "#00bcd4", textDecoration: "none", fontWeight: 500 }}>{"\u2190"} My Sales</Link>
        <span style={{ color: "var(--text-muted)" }}> / {project.name}</span>
      </div>

      {/* Header card */}
      <div style={{
        padding: "1.5rem", borderRadius: "1rem", marginBottom: "1.25rem",
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
        backdropFilter: "blur(20px)",
      }}>
        {editMode ? (
          /* ── Edit Mode ── */
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
              {"\u270F\u{FE0F}"} Editing Sale
            </div>

            {/* Sale name */}
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Sale name"
              style={{ ...INPUT_STYLE, fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}
            />

            {/* Sale type selector */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Sale Type</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                {Object.entries(SALE_TYPE_MAP).map(([key, st]) => {
                  const isActive = editForm.type === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setEditForm({ ...editForm, type: key })}
                      style={{
                        padding: "0.6rem 0.5rem",
                        borderRadius: "0.5rem",
                        border: `2px solid ${isActive ? st.color : "var(--border-default)"}`,
                        background: isActive ? `${st.color}15` : "transparent",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontSize: "1.1rem" }}>{st.emoji}</div>
                      <div style={{ fontSize: "0.68rem", fontWeight: 600, color: isActive ? st.color : "var(--text-primary)", marginTop: "0.15rem" }}>{st.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Start Date</div>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>End Date</div>
                <input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            {/* City + State */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>City</div>
                <input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>State</div>
                <input
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  placeholder="ME"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Description</div>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Describe your sale..."
                rows={3}
                style={{ ...INPUT_STYLE, resize: "vertical" }}
              />
            </div>

            {/* Status */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Status</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["DRAFT", "ACTIVE", "COMPLETED"] as const).map((s) => {
                  const badge = STATUS_BADGE[s] || STATUS_BADGE.DRAFT;
                  const isActive = editForm.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setEditForm({ ...editForm, status: s })}
                      style={{
                        padding: "0.4rem 0.85rem",
                        borderRadius: "9999px",
                        border: `2px solid ${isActive ? badge.color : "var(--border-default)"}`,
                        background: isActive ? badge.bg : "transparent",
                        color: isActive ? badge.color : "var(--text-muted)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={cancelEdit}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                  border: "1px solid var(--border-default)", background: "transparent",
                  color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editForm.name.trim()}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                  border: "none",
                  background: "linear-gradient(135deg, #00bcd4, #009688)",
                  color: "#fff", fontSize: "0.82rem", fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving || !editForm.name.trim() ? 0.6 : 1,
                  transition: "opacity 0.15s ease",
                }}
              >
                {saving ? "Saving\u2026" : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* ── View Mode ── */
          <>
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
                {project.description && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.3rem", lineHeight: 1.5 }}>
                    {project.description}
                  </p>
                )}
                {(project.startDate || project.city) && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.35rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {project.startDate && (
                      <span>
                        {"\u{1F4C5}"} {new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {project.endDate && ` \u2013 ${new Date(project.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                      </span>
                    )}
                    {project.city && project.state && <span>{"\u{1F4CD}"} {project.city}, {project.state}</span>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link
                  href={`/items/new?saleId=${project.id}&saleName=${encodeURIComponent(project.name)}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
                    border: "none",
                    background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                    fontSize: "0.78rem", fontWeight: 700,
                    textDecoration: "none", transition: "all 0.15s ease",
                  }}
                >
                  {"\u{1F4F7}"} Add Item
                </Link>
                <button
                  onClick={() => setEditMode(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
                    border: "1px solid var(--border-default)", background: "transparent",
                    color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  {"\u270F\u{FE0F}"} Edit Sale
                </button>
                <a
                  href={`/sale/${project.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
                    border: "1px solid var(--border-default)", background: "transparent",
                    color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600,
                    textDecoration: "none", transition: "all 0.15s ease",
                  }}
                >
                  {"\u{1F517}"} Public Page
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
                  {publishing ? "Publishing\u2026" : "\u{1F4E2} Publish All Items"}
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
          </>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total Items", value: project.itemCount, color: "var(--text-primary)" },
          { label: "Sold", value: project.soldCount, color: "#4ade80" },
          { label: "Revenue", value: `$${project.revenue.toLocaleString()}`, color: project.revenue > 0 ? "#4ade80" : "var(--text-muted)" },
          { label: "Conversion", value: `${conversionRate}%`, color: conversionRate > 30 ? "#4ade80" : "#00bcd4" },
          { label: "Est. Portfolio", value: `$${project.portfolio.toLocaleString()}`, color: "#00bcd4" },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "1rem", borderRadius: "0.75rem",
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color, marginTop: "0.25rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Sell All Section ── */}
      {unsoldCount > 0 && (project.status === "ACTIVE" || project.status === "DRAFT") && (
        <div style={{ marginBottom: "1.25rem" }}>
          {!showSellAll ? (
            <button
              onClick={() => setShowSellAll(true)}
              style={{
                width: "100%",
                padding: "1rem 1.5rem",
                borderRadius: "1rem",
                border: "1px solid var(--accent-border, rgba(0,188,212,0.25))",
                background: "var(--accent-dim, rgba(0,188,212,0.06))",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{"\u{1F4B0}"}</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                  Sell Everything
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                  Offer all {unsoldCount} remaining item{unsoldCount !== 1 ? "s" : ""} at a bulk discount
                </div>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--accent, #00bcd4)", fontWeight: 600 }}>{"\u2192"}</span>
            </button>
          ) : (
            <div style={{
              padding: "1.5rem",
              borderRadius: "1rem",
              border: "1px solid var(--accent-border, rgba(0,188,212,0.25))",
              background: "var(--bg-card)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                    Sell Everything at Once
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Create a bulk offer for all {unsoldCount} unsold item{unsoldCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <button
                  onClick={() => setShowSellAll(false)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem", padding: "0.25rem" }}
                >
                  {"\u2715"}
                </button>
              </div>

              {/* Estimated value */}
              <div style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.6rem",
                background: "var(--ghost-bg)",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Total estimated value</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>${unsoldValue.toLocaleString()}</span>
              </div>

              {/* Mode toggle */}
              <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem", background: "var(--ghost-bg)", borderRadius: "0.5rem", padding: "0.2rem" }}>
                {([["discount", "Set Discount %"], ["fixed", "Set Fixed Price"]] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSellAllMode(mode)}
                    style={{
                      flex: 1,
                      padding: "0.45rem 0.75rem",
                      borderRadius: "0.4rem",
                      border: "none",
                      background: sellAllMode === mode ? "var(--bg-card-solid, var(--bg-card))" : "transparent",
                      color: sellAllMode === mode ? "var(--text-primary)" : "var(--text-muted)",
                      fontWeight: sellAllMode === mode ? 700 : 500,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: sellAllMode === mode ? "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.1))" : "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {sellAllMode === "discount" ? (
                <>
                  {/* Slider */}
                  <div style={{ marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Discount</span>
                      <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#00bcd4" }}>{discountPct}% off</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={5}
                      value={discountPct}
                      onChange={(e) => setDiscountPct(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#00bcd4", cursor: "pointer" }}
                    />
                  </div>
                  {/* Preset buttons */}
                  <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    {[10, 20, 25, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setDiscountPct(pct)}
                        style={{
                          padding: "0.3rem 0.65rem",
                          borderRadius: "9999px",
                          border: `1.5px solid ${discountPct === pct ? "#00bcd4" : "var(--border-default)"}`,
                          background: discountPct === pct ? "rgba(0,188,212,0.12)" : "transparent",
                          color: discountPct === pct ? "#00bcd4" : "var(--text-muted)",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Bulk Price ($)</div>
                  <input
                    type="number"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    placeholder="Enter bulk price..."
                    min={1}
                    style={{ ...INPUT_STYLE, fontSize: "1.1rem", fontWeight: 700 }}
                  />
                </div>
              )}

              {/* Summary card */}
              {displayPrice > 0 && (
                <div style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "var(--ghost-bg)",
                  border: "1px solid var(--border-default)",
                  marginBottom: "1rem",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.82rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>Items included</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{unsoldCount}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>Estimated value</span>
                      <span style={{ color: "var(--text-muted)" }}>${unsoldValue.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>Your bulk price</span>
                      <span style={{ fontWeight: 800, color: "#00bcd4", fontSize: "1rem" }}>${displayPrice.toLocaleString()}</span>
                    </div>
                    {savingsPct > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                        <span>Buyer saves</span>
                        <span style={{ color: "#4ade80", fontWeight: 600 }}>{savingsPct}% (${savingsAmount.toLocaleString()})</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowSellAll(false)}
                  style={{
                    padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                    border: "1px solid var(--border-default)", background: "transparent",
                    color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeSellAll}
                  disabled={sellAllProcessing || displayPrice <= 0}
                  style={{
                    padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none",
                    background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                    fontSize: "0.82rem", fontWeight: 700,
                    cursor: sellAllProcessing ? "wait" : "pointer",
                    opacity: sellAllProcessing || displayPrice <= 0 ? 0.6 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {sellAllProcessing ? "Processing\u2026" : `Confirm Sell All \u2192`}
                </button>
              </div>

              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.75rem", textAlign: "center", lineHeight: 1.4 }}>
                This will mark all unsold items as SOLD with the bulk price distributed evenly across items. This action cannot be undone.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Budget & Timeline Controls ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <BudgetGuard variant="compact" />
      </div>

      {/* ── Department Bundle Suggestions ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <BundleSuggestions projectId={project.id} />
      </div>

      {/* ── Department Cards ── */}
      {deptEntries.length > 1 && (
        <div style={{
          padding: "1.25rem", borderRadius: "1rem", marginBottom: "1.25rem",
          background: "var(--bg-card)", border: "1px solid var(--border-default)",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            Departments
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {deptEntries.map(([cat, dItems]) => {
              const unsold = dItems.filter((i) => !["SOLD", "SHIPPED", "COMPLETED"].includes(i.status));
              const deptValue = unsold.reduce((s, i) => s + (i.listingPrice || i.valuationHigh || 0), 0);
              return (
                <div key={cat} style={{
                  padding: "0.85rem", borderRadius: "0.75rem",
                  background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)",
                }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{cat}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {dItems.length} item{dItems.length !== 1 ? "s" : ""} &middot; {unsold.length} unsold &middot; ${Math.round(deptValue).toLocaleString()}
                  </div>
                  {unsold.length > 0 && (
                    <button
                      onClick={() => setShowDeptSell(showDeptSell === cat ? null : cat)}
                      style={{
                        marginTop: "0.5rem", fontSize: "0.7rem", fontWeight: 600,
                        padding: "0.3rem 0.65rem", borderRadius: "0.4rem",
                        background: "rgba(0,188,212,0.12)", color: "#00bcd4",
                        border: "1px solid rgba(0,188,212,0.2)", cursor: "pointer",
                      }}
                    >
                      {showDeptSell === cat ? "Cancel" : `Sell ${cat}`}
                    </button>
                  )}
                  {showDeptSell === cat && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <label style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Discount %</label>
                      <input
                        type="number" min={0} max={90} value={deptDiscount}
                        onChange={(e) => setDeptDiscount(Number(e.target.value))}
                        style={{ ...INPUT_STYLE, marginTop: "0.25rem", marginBottom: "0.4rem" }}
                      />
                      <button
                        disabled={deptSelling}
                        onClick={async () => {
                          setDeptSelling(true);
                          try {
                            const res = await fetch(`/api/projects/${project.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ sellDepartment: { category: cat, discountPct: deptDiscount } }),
                            });
                            if (res.ok) { router.refresh(); setShowDeptSell(null); }
                          } finally { setDeptSelling(false); }
                        }}
                        style={{
                          width: "100%", fontSize: "0.7rem", fontWeight: 600,
                          padding: "0.35rem 0.65rem", borderRadius: "0.4rem",
                          background: "#00bcd4", color: "#fff", border: "none", cursor: "pointer",
                        }}
                      >
                        {deptSelling ? "Selling..." : `Sell ${unsold.length} items at ${deptDiscount}% off`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items section */}
      <div style={{
        padding: "1.5rem", borderRadius: "1rem",
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
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
            {availableItems.length > 0 && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                {"\u00B7"} {availableItems.length} available to add
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            <Link
              href={`/items/new?saleId=${project.id}&saleName=${encodeURIComponent(project.name)}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                padding: "0.4rem 0.85rem", borderRadius: "0.5rem",
                border: "none",
                background: "linear-gradient(135deg, #00bcd4, #009688)",
                color: "#fff", fontSize: "0.75rem", fontWeight: 700,
                textDecoration: "none", transition: "all 0.15s ease",
              }}
            >
              {"\u{1F4F7}"} Create New Item
            </Link>
            <button
              onClick={() => setShowAddItems(!showAddItems)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                padding: "0.4rem 0.85rem", borderRadius: "0.5rem",
                border: "1px solid rgba(0,188,212,0.25)", background: showAddItems ? "rgba(0,188,212,0.1)" : "rgba(0,188,212,0.06)",
                color: "#00bcd4", fontSize: "0.75rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
            >
              {showAddItems ? "\u2212 Hide" : "+ Add Existing"}
            </button>
          </div>
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
                    background: "var(--bg-card)", borderRadius: "0.5rem",
                    border: "1px solid var(--border-default)",
                    transition: "background 0.15s ease",
                  }}
                >
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt="" style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "0.35rem", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "36px", height: "36px", background: "var(--ghost-bg)", borderRadius: "0.35rem", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, fontSize: "0.8rem", fontWeight: 500, color: "var(--text-primary)" }}>{item.title}</div>
                  <button
                    onClick={() => addItem(item.id)}
                    disabled={addingItem === item.id}
                    title="Add to sale"
                    style={{
                      width: "28px", height: "28px", borderRadius: "50%", border: "none",
                      background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                      fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: addingItem === item.id ? 0.5 : 1,
                      transition: "opacity 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    {addingItem === item.id ? "\u2026" : "+"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddItems && availableItems.length === 0 && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            borderRadius: "0.75rem", padding: "1rem", marginBottom: "1rem",
            textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)",
          }}>
            All your items are already assigned to a sale. <Link href="/items/new" style={{ color: "#00bcd4", textDecoration: "none", fontWeight: 600 }}>Create a new item</Link>
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
            <div style={{
              width: "4rem", height: "4rem", borderRadius: "50%", margin: "0 auto 1rem",
              background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.75rem",
            }}>
              {"\u{1F4F7}"}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
              Your sale is ready {"\u2014"} add your first item to get started
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.5 }}>
              Add photos and our AI will identify, price, and create listings automatically.
              {availableItems.length > 0 && ` You have ${availableItems.length} item${availableItems.length !== 1 ? "s" : ""} ready to add.`}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <Link
                href={`/items/new?saleId=${project.id}&saleName=${encodeURIComponent(project.name)}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  padding: "0.6rem 1.25rem", borderRadius: "0.6rem", border: "none",
                  background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                  fontSize: "0.85rem", fontWeight: 700, textDecoration: "none",
                }}
              >
                {"\u{1F4F7}"} Create New Item
              </Link>
              {availableItems.length > 0 && (
                <button
                  onClick={() => setShowAddItems(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.6rem 1.25rem", borderRadius: "0.6rem",
                    border: "1px solid rgba(0,188,212,0.25)", background: "transparent",
                    color: "#00bcd4", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  + Add Existing ({availableItems.length})
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
                    background: "var(--bg-card)", borderRadius: "0.6rem",
                    border: "1px solid var(--border-default)",
                    transition: "background 0.15s ease",
                  }}
                >
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.photoUrl} alt="" style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "0.45rem", flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "0.45rem", flexShrink: 0,
                      background: "var(--ghost-bg)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "0.9rem" }}>{"\u{1F4F7}"}</span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                      {item.title}
                      {item.isAntique && <span style={{ marginLeft: "0.4rem", fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.35rem", borderRadius: "9999px", background: "rgba(255,107,53,0.12)", color: "#FF6B35" }}>ANTIQUE</span>}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      {item.convCount > 0 && `\u{1F4AC} ${item.convCount} buyer${item.convCount !== 1 ? "s" : ""} \u00B7 `}
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
                        border: "1px solid var(--border-default)", background: "transparent",
                        color: "var(--text-muted)", textDecoration: "none", fontWeight: 500,
                      }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={removingItem === item.id}
                      title="Remove from sale (item won't be deleted)"
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
      <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
        <Link href="/projects" style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
          textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
          border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
        }}>
          ← Back to Projects
        </Link>
      </div>
    </div>
  );
}
