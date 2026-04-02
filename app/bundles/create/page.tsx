"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";

/* ──────────────────────────────────────────────────────────────────────────────
   Bundle Create Page — 4-step wizard
   Step 1: Choose bundle type  (Full Sale / Category / Custom)
   Step 2: Select items
   Step 3: Pricing
   Step 4: Details + publish
   Success: share URL
   ────────────────────────────────────────────────────────────────────────────── */

const TEAL = "var(--accent)";
const TEAL_DIM = "var(--accent-dim)";
const TEAL_GLOW = "var(--accent-glow)";
const GLASS = "var(--ghost-bg)";
const GLASS_BORDER = "var(--border-default)";
const GLASS_HOVER = "var(--ghost-bg)";
const TEXT_PRIMARY = "var(--text-primary)";
const TEXT_SECONDARY = "var(--text-secondary)";
const TEXT_MUTED = "var(--text-muted)";
const BG_PAGE = "var(--bg-primary)";
const SUCCESS_GREEN = "#4caf50";
const WARN_ORANGE = "#ff9800";

interface ItemData {
  id: string;
  title?: string | null;
  category?: string | null;
  aiCategory?: string | null;
  condition?: string | null;
  listingPrice?: number | null;
  price?: number | null;
  status?: string;
  photos?: { filePath: string; isPrimary?: boolean }[];
  aiResult?: { rawJson?: string | null } | null;
  valuation?: { low?: number; mid?: number | null; high?: number } | null;
}

const BUNDLE_TYPES = [
  {
    key: "FULL_SALE",
    icon: "\uD83C\uDFE0",
    label: "Full Estate Sale",
    desc: "Bundle every active item into one listing. Perfect for complete estate cleanouts.",
    color: "#4caf50",
  },
  {
    key: "CATEGORY",
    icon: "\uD83D\uDCE6",
    label: "Category Bundle",
    desc: "Group items by AI-assigned category. Sell all furniture, all electronics, etc.",
    color: "#ff9800",
  },
  {
    key: "CUSTOM",
    icon: "\u2728",
    label: "Custom Bundle",
    desc: "Hand-pick exactly which items to include. Maximum flexibility.",
    color: TEAL,
  },
];

function getItemPhoto(item: ItemData): string | null {
  if (!item.photos || item.photos.length === 0) return null;
  const primary = item.photos.find((p) => p.isPrimary);
  return primary?.filePath || item.photos[0]?.filePath || null;
}

function getItemPrice(item: ItemData): number {
  return item.listingPrice || item.price || item.valuation?.mid || item.valuation?.high || 0;
}

function getItemCategory(item: ItemData): string {
  if (item.category) return item.category;
  if (item.aiCategory) return item.aiCategory;
  try {
    if (item.aiResult?.rawJson) {
      const ai = JSON.parse(item.aiResult.rawJson);
      return ai.category || ai.item_type || "Other";
    }
  } catch { /* ignore */ }
  return "Other";
}

function getItemTitle(item: ItemData): string {
  if (item.title) return item.title;
  try {
    if (item.aiResult?.rawJson) {
      const ai = JSON.parse(item.aiResult.rawJson);
      return ai.item_name || ai.title || `Item #${item.id.slice(0, 6)}`;
    }
  } catch { /* ignore */ }
  return `Item #${item.id.slice(0, 6)}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default function BundleCreatePage() {
  const [step, setStep] = useState(1);
  const [bundleType, setBundleType] = useState<string | null>(null);
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState(0);
  const [allowOffers, setAllowOffers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ id: string; slug: string; shareUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoverType, setHoverType] = useState<string | null>(null);
  const [hoverItem, setHoverItem] = useState<string | null>(null);

  // Fetch items on mount
  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.items || [];
        // Only active items (not SOLD/SHIPPED/COMPLETED)
        const active = list.filter(
          (i: ItemData) => !["SOLD", "SHIPPED", "COMPLETED"].includes(i.status || "")
        );
        setItems(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedItems = items.filter((i) => selectedIds.includes(i.id));
  const individualTotal = selectedItems.reduce((s, i) => s + getItemPrice(i), 0);
  const discountPercent =
    individualTotal > 0
      ? Math.round(((individualTotal - bundlePrice) / individualTotal) * 100)
      : 0;

  // Group by category
  const categoryGroups = items.reduce<Record<string, ItemData[]>>((acc, item) => {
    const cat = getItemCategory(item);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryKeys = Object.keys(categoryGroups).sort();

  // Auto-select based on type
  const handleTypeSelect = useCallback(
    (type: string) => {
      setBundleType(type);
      if (type === "FULL_SALE") {
        setSelectedIds(items.map((i) => i.id));
        const total = items.reduce((s, i) => s + getItemPrice(i), 0);
        setBundlePrice(Math.round(total * 0.8)); // 20% discount default
      } else {
        setSelectedIds([]);
        setBundlePrice(0);
      }
      setStep(2);
    },
    [items]
  );

  const handleCategorySelect = useCallback(
    (cat: string) => {
      setSelectedCategory(cat);
      const catItems = categoryGroups[cat] || [];
      setSelectedIds(catItems.map((i) => i.id));
      const total = catItems.reduce((s, i) => s + getItemPrice(i), 0);
      setBundlePrice(Math.round(total * 0.85)); // 15% discount default
      setTitle(`${cat} Bundle`);
    },
    [categoryGroups]
  );

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(items.map((i) => i.id));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Recalculate suggested price when selection changes
  useEffect(() => {
    if (bundleType === "CUSTOM" && selectedIds.length > 0) {
      const total = items
        .filter((i) => selectedIds.includes(i.id))
        .reduce((s, i) => s + getItemPrice(i), 0);
      if (bundlePrice === 0 || bundlePrice > total) {
        setBundlePrice(Math.round(total * 0.85));
      }
    }
  }, [selectedIds, bundleType, items, bundlePrice]);

  async function createBundle() {
    if (!title.trim() || selectedIds.length < 2 || bundlePrice <= 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          bundleType,
          itemIds: selectedIds,
          bundlePrice,
          allowOffers,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setStep(5);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to create bundle");
      }
    } catch {
      alert("Network error — please try again");
    }
    setCreating(false);
  }

  function copyShareUrl() {
    if (!result?.shareUrl) return;
    navigator.clipboard.writeText(result.shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Discount badge color ──
  function getDiscountColor(pct: number): string {
    if (pct >= 30) return "#f44336";
    if (pct >= 20) return "#ff9800";
    if (pct >= 10) return SUCCESS_GREEN;
    return TEAL;
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG_PAGE, padding: "40px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              height: 32,
              width: 220,
              background: GLASS,
              borderRadius: 8,
              marginBottom: 32,
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  height: 180,
                  background: GLASS,
                  borderRadius: 14,
                  border: `1px solid ${GLASS_BORDER}`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ──
  if (step === 5 && result) {
    const shareUrl = result.shareUrl || `${typeof window !== "undefined" ? window.location.origin : ""}/bundle/${result.slug}`;
    return (
      <div style={{ minHeight: "100vh", background: BG_PAGE, padding: "40px 16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(76,175,80,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 40,
            }}
          >
            {"\u2705"}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
            Bundle Created!
          </h1>
          <p style={{ fontSize: 14, color: TEXT_SECONDARY, marginTop: 8 }}>
            Your bundle sale is live. Share the link with potential buyers.
          </p>

          {/* Share URL box */}
          <div
            style={{
              marginTop: 32,
              background: GLASS,
              border: `1px solid ${GLASS_BORDER}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Share URL
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(0,0,0,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: TEAL,
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shareUrl}
              </span>
              <button
                onClick={copyShareUrl}
                style={{
                  background: copied ? SUCCESS_GREEN : TEAL,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Quick share row */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            {[
              { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, color: "#1877f2" },
              { label: "Twitter", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, color: "#1da1f2" },
              { label: "Email", href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this bundle sale: ${shareUrl}`)}`, color: "#ff9800" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: `${s.color}22`,
                  color: s.color,
                  border: `1px solid ${s.color}44`,
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* Summary card */}
          <div
            style={{
              marginTop: 32,
              background: GLASS,
              border: `1px solid ${GLASS_BORDER}`,
              borderRadius: 14,
              padding: 24,
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 12 }}>
              {title}
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
              <div>
                <div style={{ color: TEXT_MUTED, fontSize: 11 }}>Items</div>
                <div style={{ color: TEXT_PRIMARY, fontWeight: 700 }}>{selectedIds.length}</div>
              </div>
              <div>
                <div style={{ color: TEXT_MUTED, fontSize: 11 }}>Bundle Price</div>
                <div style={{ color: SUCCESS_GREEN, fontWeight: 700 }}>${bundlePrice.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: TEXT_MUTED, fontSize: 11 }}>Individual Total</div>
                <div style={{ color: TEXT_SECONDARY, fontWeight: 700, textDecoration: "line-through" }}>
                  ${individualTotal.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: TEXT_MUTED, fontSize: 11 }}>Discount</div>
                <div style={{ color: getDiscountColor(discountPercent), fontWeight: 700 }}>
                  {discountPercent}% OFF
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
            <Link
              href={`/bundle/${result.slug}`}
              style={{
                background: `linear-gradient(135deg, ${TEAL}, var(--accent-deep))`,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              View Bundle Page
            </Link>
            <Link
              href="/bundles"
              style={{
                background: GLASS,
                color: TEXT_SECONDARY,
                border: `1px solid ${GLASS_BORDER}`,
                borderRadius: 10,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              My Bundles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: BG_PAGE, padding: "40px 16px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83D\uDCE6"}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
            No Items Available
          </h1>
          <p style={{ fontSize: 14, color: TEXT_SECONDARY, marginTop: 8 }}>
            You need at least 2 active items to create a bundle sale. Upload some items first!
          </p>
          <Link
            href="/items/new"
            style={{
              display: "inline-block",
              marginTop: 20,
              background: `linear-gradient(135deg, ${TEAL}, var(--accent-deep))`,
              color: "#fff",
              borderRadius: 10,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Add Your First Item
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG_PAGE, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bundles", href: "/bundles" }, { label: "Create" }]} />
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/bundles"
            style={{ fontSize: 12, color: TEXT_MUTED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}
          >
            {"\u2190"} Back to Bundles
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
            Create Bundle Sale
          </h1>
          <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6 }}>
            Bundle multiple items together for a discounted price. Buyers love deals.
          </p>
        </div>

        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginBottom: 36,
            padding: "0 8px",
          }}
        >
          {["Type", "Items", "Pricing", "Publish"].map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: isComplete ? "pointer" : "default",
                  }}
                  onClick={() => isComplete && setStep(stepNum)}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      background: isActive
                        ? `linear-gradient(135deg, ${TEAL}, var(--accent-deep))`
                        : isComplete
                        ? SUCCESS_GREEN
                        : GLASS,
                      color: isActive || isComplete ? "#fff" : TEXT_MUTED,
                      border: isActive ? "none" : `1px solid ${isComplete ? SUCCESS_GREEN : GLASS_BORDER}`,
                      transition: "all 0.2s",
                    }}
                  >
                    {isComplete ? "\u2713" : stepNum}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? TEAL : isComplete ? SUCCESS_GREEN : TEXT_MUTED,
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: isComplete ? SUCCESS_GREEN : GLASS_BORDER,
                      margin: "0 12px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── STEP 1: Type Selection ───────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 20 }}>
              Choose Bundle Type
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260, 1fr))",
                gap: 16,
              }}
            >
              {BUNDLE_TYPES.map((bt) => {
                const isHover = hoverType === bt.key;
                return (
                  <button
                    key={bt.key}
                    onClick={() => handleTypeSelect(bt.key)}
                    onMouseEnter={() => setHoverType(bt.key)}
                    onMouseLeave={() => setHoverType(null)}
                    style={{
                      background: isHover ? GLASS_HOVER : GLASS,
                      border: `1px solid ${isHover ? `${bt.color}66` : GLASS_BORDER}`,
                      borderRadius: 16,
                      padding: 28,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.25s",
                      transform: isHover ? "translateY(-2px)" : "none",
                      boxShadow: isHover ? `0 8px 30px ${bt.color}15` : "none",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 14 }}>{bt.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>
                      {bt.label}
                    </div>
                    <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                      {bt.desc}
                    </div>
                    <div
                      style={{
                        marginTop: 16,
                        fontSize: 12,
                        fontWeight: 600,
                        color: bt.color,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {bt.key === "FULL_SALE" && `${items.length} items`}
                      {bt.key === "CATEGORY" && `${categoryKeys.length} categories`}
                      {bt.key === "CUSTOM" && "Pick items"}
                      <span style={{ fontSize: 14 }}>{"\u2192"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Item Selection ───────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>
              {bundleType === "FULL_SALE"
                ? "Full Estate Sale"
                : bundleType === "CATEGORY"
                ? "Select a Category"
                : "Select Items"}
            </h2>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 20 }}>
              {bundleType === "FULL_SALE"
                ? `All ${items.length} active items are included. Review below.`
                : bundleType === "CATEGORY"
                ? "Choose a category to bundle together."
                : "Click items to add or remove them from the bundle. Minimum 2 items."}
            </p>

            {/* Category selector */}
            {bundleType === "CATEGORY" && !selectedCategory && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {categoryKeys.map((cat) => {
                  const catItems = categoryGroups[cat];
                  const catTotal = catItems.reduce((s, i) => s + getItemPrice(i), 0);
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      style={{
                        background: GLASS,
                        border: `1px solid ${GLASS_BORDER}`,
                        borderRadius: 12,
                        padding: 20,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{cat}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>
                        {catItems.length} item{catItems.length !== 1 ? "s" : ""} &middot; ${catTotal.toLocaleString()} total
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Item grid (Full Sale, Category selected, or Custom) */}
            {(bundleType === "FULL_SALE" || bundleType === "CUSTOM" || (bundleType === "CATEGORY" && selectedCategory)) && (
              <>
                {/* Select controls for Custom */}
                {bundleType === "CUSTOM" && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <button
                      onClick={selectAll}
                      style={{
                        background: TEAL_DIM,
                        color: TEAL,
                        border: `1px solid ${TEAL}44`,
                        borderRadius: 8,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      style={{
                        background: GLASS,
                        color: TEXT_MUTED,
                        border: `1px solid ${GLASS_BORDER}`,
                        borderRadius: 8,
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Deselect All
                    </button>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, color: TEXT_SECONDARY, alignSelf: "center" }}>
                      {selectedIds.length} selected
                    </span>
                  </div>
                )}

                {/* Item cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 12,
                  }}
                >
                  {(bundleType === "CUSTOM" ? items : selectedItems.length > 0 ? selectedItems : items).map(
                    (item) => {
                      const isSelected = selectedIds.includes(item.id);
                      const photo = getItemPhoto(item);
                      const price = getItemPrice(item);
                      const isHover2 = hoverItem === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => bundleType === "CUSTOM" && toggleItem(item.id)}
                          onMouseEnter={() => setHoverItem(item.id)}
                          onMouseLeave={() => setHoverItem(null)}
                          style={{
                            background: isSelected ? `${TEAL}11` : GLASS,
                            border: `2px solid ${isSelected ? TEAL : isHover2 ? `${TEAL}44` : GLASS_BORDER}`,
                            borderRadius: 14,
                            overflow: "hidden",
                            cursor: bundleType === "CUSTOM" ? "pointer" : "default",
                            transition: "all 0.2s",
                            transform: isHover2 && bundleType === "CUSTOM" ? "translateY(-1px)" : "none",
                            position: "relative",
                          }}
                        >
                          {/* Selected checkmark */}
                          {isSelected && (
                            <div
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: TEAL,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                color: "#fff",
                                fontWeight: 700,
                                zIndex: 2,
                              }}
                            >
                              {"\u2713"}
                            </div>
                          )}

                          {/* Photo */}
                          <div
                            style={{
                              width: "100%",
                              height: 130,
                              background: "rgba(0,0,0,0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {photo ? (
                              <img
                                src={photo}
                                alt={getItemTitle(item)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  opacity: isSelected || bundleType !== "CUSTOM" ? 1 : 0.5,
                                  transition: "opacity 0.2s",
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 32, opacity: 0.3 }}>{"\uD83D\uDDBC"}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div style={{ padding: "10px 12px" }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: TEXT_PRIMARY,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getItemTitle(item)}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: 4,
                              }}
                            >
                              <span style={{ fontSize: 11, color: TEXT_MUTED }}>
                                {getItemCategory(item)}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>
                                {price > 0 ? `$${price.toLocaleString()}` : "No price"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Selection summary bar */}
                <div
                  style={{
                    marginTop: 20,
                    background: GLASS,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 12,
                    padding: "14px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                      {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""} selected
                    </span>
                    <span style={{ fontSize: 13, color: TEXT_MUTED, marginLeft: 12 }}>
                      Individual total: ${individualTotal.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedIds.length < 2) {
                        alert("Select at least 2 items to create a bundle.");
                        return;
                      }
                      setStep(3);
                    }}
                    disabled={selectedIds.length < 2}
                    style={{
                      background:
                        selectedIds.length >= 2
                          ? `linear-gradient(135deg, ${TEAL}, var(--accent-deep))`
                          : "var(--ghost-bg)",
                      color: selectedIds.length >= 2 ? "#fff" : TEXT_MUTED,
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 24px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: selectedIds.length >= 2 ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                    }}
                  >
                    Continue to Pricing {"\u2192"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 3: Pricing ──────────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>
              Set Bundle Price
            </h2>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 24 }}>
              Set a discounted price for the entire bundle. We recommend 10-25% off.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Pricing controls */}
              <div>
                {/* Individual total */}
                <div
                  style={{
                    background: GLASS,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 14,
                    padding: 24,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    Individual Item Total
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: TEXT_SECONDARY, textDecoration: "line-through" }}>
                    ${individualTotal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>
                    {selectedIds.length} items at full price
                  </div>
                </div>

                {/* Bundle price input */}
                <div
                  style={{
                    background: GLASS,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 14,
                    padding: 24,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                    Bundle Price
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: TEXT_MUTED }}>$</span>
                    <input
                      type="number"
                      value={bundlePrice || ""}
                      onChange={(e) => setBundlePrice(Math.max(0, Number(e.target.value)))}
                      style={{
                        flex: 1,
                        background: "rgba(0,0,0,0.3)",
                        border: `1px solid ${GLASS_BORDER}`,
                        borderRadius: 10,
                        padding: "14px 16px",
                        fontSize: 28,
                        fontWeight: 800,
                        color: TEAL,
                        outline: "none",
                      }}
                      placeholder="0"
                      min={0}
                    />
                  </div>

                  {/* Quick preset buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    {[10, 15, 20, 25, 30].map((pct) => {
                      const suggested = Math.round(individualTotal * (1 - pct / 100));
                      const isActive = bundlePrice === suggested;
                      return (
                        <button
                          key={pct}
                          onClick={() => setBundlePrice(suggested)}
                          style={{
                            flex: 1,
                            background: isActive ? TEAL_DIM : "rgba(0,0,0,0.2)",
                            color: isActive ? TEAL : TEXT_MUTED,
                            border: `1px solid ${isActive ? `${TEAL}66` : GLASS_BORDER}`,
                            borderRadius: 8,
                            padding: "8px 0",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {pct}% off
                        </button>
                      );
                    })}
                  </div>

                  {/* Price slider */}
                  <div style={{ marginTop: 16 }}>
                    <input
                      type="range"
                      min={Math.round(individualTotal * 0.5)}
                      max={individualTotal}
                      value={bundlePrice}
                      onChange={(e) => setBundlePrice(Number(e.target.value))}
                      style={{
                        width: "100%",
                        accentColor: TEAL,
                        height: 6,
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>
                      <span>50% off</span>
                      <span>Full price</span>
                    </div>
                  </div>
                </div>

                {/* Allow offers toggle */}
                <div
                  style={{
                    background: GLASS,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>Allow Offers</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>Buyers can submit counter-offers</div>
                  </div>
                  <button
                    onClick={() => setAllowOffers(!allowOffers)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: allowOffers ? TEAL : "var(--bg-card-hover)",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        position: "absolute",
                        top: 3,
                        left: allowOffers ? 23 : 3,
                        transition: "left 0.2s",
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Right: Discount visualization */}
              <div>
                {/* Giant discount badge */}
                <div
                  style={{
                    background: GLASS,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 14,
                    padding: 32,
                    textAlign: "center",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${getDiscountColor(discountPercent)}22, ${getDiscountColor(discountPercent)}44)`,
                      border: `3px solid ${getDiscountColor(discountPercent)}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      boxShadow: `0 0 40px ${getDiscountColor(discountPercent)}30`,
                    }}
                  >
                    <div style={{ fontSize: 42, fontWeight: 900, color: getDiscountColor(discountPercent), lineHeight: 1 }}>
                      {discountPercent}%
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: getDiscountColor(discountPercent), letterSpacing: 2, textTransform: "uppercase" }}>
                      OFF
                    </div>
                  </div>
                  <div style={{ marginTop: 16, fontSize: 13, color: TEXT_SECONDARY }}>
                    Buyer saves{" "}
                    <span style={{ fontWeight: 700, color: getDiscountColor(discountPercent) }}>
                      ${(individualTotal - bundlePrice).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Price breakdown */}
                <div
                  style={{
                    background: GLASS,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 14,
                    padding: 20,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                    Price Breakdown
                  </div>
                  {selectedItems.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        borderBottom: `1px solid ${GLASS_BORDER}`,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: TEXT_SECONDARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                        {getItemTitle(item)}
                      </span>
                      <span style={{ color: TEXT_MUTED, textDecoration: "line-through" }}>
                        ${getItemPrice(item).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {selectedItems.length > 8 && (
                    <div style={{ fontSize: 11, color: TEXT_MUTED, padding: "6px 0" }}>
                      +{selectedItems.length - 8} more items
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0 0",
                      marginTop: 4,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: TEXT_PRIMARY }}>Bundle Price</span>
                    <span style={{ color: TEAL }}>${bundlePrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 28,
              }}
            >
              <button
                onClick={() => setStep(2)}
                style={{
                  background: GLASS,
                  color: TEXT_SECONDARY,
                  border: `1px solid ${GLASS_BORDER}`,
                  borderRadius: 10,
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {"\u2190"} Back
              </button>
              <button
                onClick={() => {
                  if (bundlePrice <= 0) {
                    alert("Please set a bundle price greater than $0.");
                    return;
                  }
                  if (bundlePrice >= individualTotal) {
                    alert("Bundle price should be less than the individual total to offer a discount.");
                    return;
                  }
                  if (!title.trim()) {
                    const autoTitle =
                      bundleType === "FULL_SALE"
                        ? "Complete Estate Sale Bundle"
                        : selectedCategory
                        ? `${selectedCategory} Bundle`
                        : `Custom ${selectedIds.length}-Item Bundle`;
                    setTitle(autoTitle);
                  }
                  setStep(4);
                }}
                style={{
                  background: `linear-gradient(135deg, ${TEAL}, var(--accent-deep))`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Continue {"\u2192"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Details + Publish ────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 4 }}>
              Bundle Details
            </h2>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 24 }}>
              Add a title and description. This is what buyers see.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Form */}
              <div>
                {/* Title */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 6 }}>
                    Bundle Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${GLASS_BORDER}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontSize: 15,
                      fontWeight: 600,
                      color: TEXT_PRIMARY,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    placeholder="e.g., Vintage Kitchen Collection"
                  />
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>
                    URL: /bundle/{slugify(title || "your-bundle")}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 6 }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${GLASS_BORDER}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontSize: 13,
                      color: TEXT_PRIMARY,
                      outline: "none",
                      resize: "vertical",
                      lineHeight: 1.6,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                    placeholder="Describe what's in this bundle. Mention any highlights, condition notes, or special items."
                  />
                </div>

                {/* Type badge */}
                <div
                  style={{
                    background: GLASS,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20 }}>
                    {bundleType === "FULL_SALE" ? "\uD83C\uDFE0" : bundleType === "CATEGORY" ? "\uD83D\uDCE6" : "\u2728"}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
                      {bundleType === "FULL_SALE" ? "Full Estate Sale" : bundleType === "CATEGORY" ? "Category Bundle" : "Custom Bundle"}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                      {selectedIds.length} items &middot; ${bundlePrice.toLocaleString()} &middot; {discountPercent}% discount
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Preview */}
              <div>
                <div
                  style={{
                    background: GLASS,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  {/* Preview header */}
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${GLASS_BORDER}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1 }}>
                      Preview
                    </div>
                  </div>

                  {/* Mini photo grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 2,
                      padding: 2,
                    }}
                  >
                    {selectedItems.slice(0, 4).map((item) => {
                      const photo = getItemPhoto(item);
                      return (
                        <div
                          key={item.id}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            background: "rgba(0,0,0,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {photo ? (
                            <img
                              src={photo}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: 20, opacity: 0.3 }}>{"\uD83D\uDDBC"}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Preview content */}
                  <div style={{ padding: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 8 }}>
                      {title || "Untitled Bundle"}
                    </div>
                    {description && (
                      <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5, marginBottom: 12 }}>
                        {description.slice(0, 120)}{description.length > 120 ? "..." : ""}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: TEAL }}>
                        ${bundlePrice.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 14, color: TEXT_MUTED, textDecoration: "line-through" }}>
                        ${individualTotal.toLocaleString()}
                      </span>
                      <span
                        style={{
                          background: `${getDiscountColor(discountPercent)}22`,
                          color: getDiscountColor(discountPercent),
                          border: `1px solid ${getDiscountColor(discountPercent)}44`,
                          borderRadius: 6,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {discountPercent}% OFF
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 8 }}>
                      {selectedIds.length} items included
                      {allowOffers ? " \u00B7 Offers accepted" : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 28,
              }}
            >
              <button
                onClick={() => setStep(3)}
                style={{
                  background: GLASS,
                  color: TEXT_SECONDARY,
                  border: `1px solid ${GLASS_BORDER}`,
                  borderRadius: 10,
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {"\u2190"} Back
              </button>
              <button
                onClick={createBundle}
                disabled={creating || !title.trim() || selectedIds.length < 2 || bundlePrice <= 0}
                style={{
                  background:
                    creating || !title.trim()
                      ? "var(--ghost-bg)"
                      : `linear-gradient(135deg, ${TEAL}, var(--accent-deep))`,
                  color: creating || !title.trim() ? TEXT_MUTED : "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 32px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: creating || !title.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow:
                    creating || !title.trim()
                      ? "none"
                      : `0 4px 20px ${TEAL}40`,
                }}
              >
                {creating ? "Creating..." : "Publish Bundle Sale"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
