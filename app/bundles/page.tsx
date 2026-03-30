"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BundleSuggestions from "@/app/components/BundleSuggestions";

/* ──────────────────────────────────────────────────────────────────────────────
   My Bundles Page — /bundles
   Lists all bundles the user has created.
   Fetches from /api/bundles (GET).
   All inline style={{}} — no Tailwind.
   ────────────────────────────────────────────────────────────────────────────── */

const TEAL = "#00bcd4";
const TEAL_DIM = "rgba(0,188,212,0.15)";
const GLASS = "var(--ghost-bg)";
const GLASS_BORDER = "var(--border-default)";
const GLASS_HOVER = "var(--ghost-bg)";
const TEXT_PRIMARY = "var(--text-primary)";
const TEXT_SECONDARY = "rgba(207,216,220,0.7)";
const TEXT_MUTED = "rgba(207,216,220,0.45)";
const BG_PAGE = "#0f1419";
const SUCCESS_GREEN = "#4caf50";
const WARN_ORANGE = "#ff9800";
const DANGER_RED = "#f44336";

interface BundleData {
  id: string;
  slug: string;
  title: string;
  description: string;
  bundleType: string;
  bundlePrice: number;
  allowOffers: boolean;
  status: string; // ACTIVE, PAUSED, SOLD
  itemCount: number;
  individualTotal: number;
  createdAt: string;
  views?: number;
  inquiries?: number;
  coverPhotos?: string[];
}

function getDiscountColor(pct: number): string {
  if (pct >= 30) return DANGER_RED;
  if (pct >= 20) return WARN_ORANGE;
  if (pct >= 10) return SUCCESS_GREEN;
  return TEAL;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "Active", color: SUCCESS_GREEN, bg: `${SUCCESS_GREEN}18` },
  PAUSED: { label: "Paused", color: WARN_ORANGE, bg: `${WARN_ORANGE}18` },
  SOLD: { label: "Sold", color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  DRAFT: { label: "Draft", color: TEXT_MUTED, bg: "var(--ghost-bg)" },
};

export default function BundlesPage() {
  const [bundles, setBundles] = useState<BundleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bundles")
      .then((r) => r.json())
      .then((d) => setBundles(Array.isArray(d) ? d : d.bundles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "ALL"
      ? bundles
      : bundles.filter((b) => b.status === filter);

  const stats = {
    total: bundles.length,
    active: bundles.filter((b) => b.status === "ACTIVE").length,
    totalValue: bundles.reduce((s, b) => s + b.bundlePrice, 0),
    totalItems: bundles.reduce((s, b) => s + b.itemCount, 0),
  };

  function copyShareUrl(bundle: BundleData) {
    const url = `${window.location.origin}/bundle/${bundle.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(bundle.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  async function deleteBundle(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/bundles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBundles((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert("Failed to delete bundle");
      }
    } catch {
      alert("Network error");
    }
    setDeleting(false);
    setDeleteId(null);
  }

  async function togglePause(bundle: BundleData) {
    const newStatus = bundle.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/bundles/${bundle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBundles((prev) =>
          prev.map((b) => (b.id === bundle.id ? { ...b, status: newStatus } : b))
        );
      }
    } catch { /* ignore */ }
    setShowMenu(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: BG_PAGE, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: TEXT_PRIMARY,
                margin: 0,
              }}
            >
              My Bundles
            </h1>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>
              Manage your bundle sales. Bundles sell 40% faster on average.
            </p>
          </div>
          <Link
            href="/bundles/create"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: `linear-gradient(135deg, ${TEAL}, #0097a7)`,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: `0 4px 16px ${TEAL}30`,
              whiteSpace: "nowrap",
            }}
          >
            + Create Bundle Sale
          </Link>
        </div>

        {/* Stats bar */}
        {bundles.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              { label: "Total Bundles", value: stats.total, color: TEXT_PRIMARY },
              { label: "Active", value: stats.active, color: SUCCESS_GREEN },
              { label: "Total Value", value: `$${stats.totalValue.toLocaleString()}`, color: TEAL },
              { label: "Items Bundled", value: stats.totalItems, color: WARN_ORANGE },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: GLASS,
                  border: `1px solid ${GLASS_BORDER}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {bundles.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {["ALL", "ACTIVE", "PAUSED", "SOLD"].map((f) => {
              const isActive = filter === f;
              const count =
                f === "ALL"
                  ? bundles.length
                  : bundles.filter((b) => b.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    background: isActive ? TEAL_DIM : GLASS,
                    color: isActive ? TEAL : TEXT_MUTED,
                    border: `1px solid ${isActive ? `${TEAL}44` : GLASS_BORDER}`,
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {f === "ALL" ? "All" : STATUS_CONFIG[f]?.label || f} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                style={{
                  height: 220,
                  background: GLASS,
                  border: `1px solid ${GLASS_BORDER}`,
                  borderRadius: 14,
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && bundles.length === 0 && (
          <div
            style={{
              background: GLASS,
              border: `1px solid ${GLASS_BORDER}`,
              borderRadius: 18,
              padding: 48,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83D\uDCE6"}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, margin: "0 0 8px" }}>
              No Bundles Yet
            </h2>
            <p style={{ fontSize: 13, color: TEXT_SECONDARY, maxWidth: 400, margin: "0 auto 24px" }}>
              Bundle multiple items together at a discounted price. Buyers love getting a deal,
              and you move inventory faster.
            </p>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {[
                { icon: "\uD83C\uDFE0", label: "Full Estate Sale", desc: "Bundle everything" },
                { icon: "\uD83D\uDCE6", label: "Category Bundle", desc: "Group by type" },
                { icon: "\u2728", label: "Custom Bundle", desc: "Hand-pick items" },
              ].map((t) => (
                <div
                  key={t.label}
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 10,
                    padding: "14px 18px",
                    textAlign: "center",
                    width: 140,
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
            <Link
              href="/bundles/create"
              style={{
                display: "inline-block",
                marginTop: 24,
                background: `linear-gradient(135deg, ${TEAL}, #0097a7)`,
                color: "#fff",
                borderRadius: 10,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: `0 4px 16px ${TEAL}30`,
              }}
            >
              Create Your First Bundle
            </Link>
          </div>
        )}

        {/* Bundle cards */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))",
              gap: 14,
              marginBottom: 32,
            }}
          >
            {filtered.map((bundle) => {
              const discountPercent =
                bundle.individualTotal > 0
                  ? Math.round(
                      ((bundle.individualTotal - bundle.bundlePrice) / bundle.individualTotal) * 100
                    )
                  : 0;
              const dColor = getDiscountColor(discountPercent);
              const statusCfg = STATUS_CONFIG[bundle.status] || STATUS_CONFIG.DRAFT;
              const isHover = hoverCard === bundle.id;
              const isCopied = copiedId === bundle.id;

              return (
                <div
                  key={bundle.id}
                  onMouseEnter={() => setHoverCard(bundle.id)}
                  onMouseLeave={() => { setHoverCard(null); setShowMenu(null); }}
                  style={{
                    background: isHover ? GLASS_HOVER : GLASS,
                    border: `1px solid ${isHover ? `${TEAL}33` : GLASS_BORDER}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    transition: "all 0.2s",
                    transform: isHover ? "translateY(-1px)" : "none",
                    position: "relative",
                  }}
                >
                  {/* Cover photos strip */}
                  {bundle.coverPhotos && bundle.coverPhotos.length > 0 && (
                    <div style={{ display: "flex", height: 70, overflow: "hidden" }}>
                      {bundle.coverPhotos.slice(0, 5).map((photo, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            background: "rgba(0,0,0,0.3)",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={photo}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card content */}
                  <div style={{ padding: "16px 20px" }}>
                    {/* Top row: title + status + menu */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Link
                            href={`/bundle/${bundle.slug}`}
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: TEXT_PRIMARY,
                              textDecoration: "none",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {bundle.title}
                          </Link>
                          <span
                            style={{
                              background: statusCfg.bg,
                              color: statusCfg.color,
                              borderRadius: 4,
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                          {bundle.itemCount} items
                          {" \u00B7 "}
                          {bundle.bundleType === "FULL_SALE"
                            ? "Full Sale"
                            : bundle.bundleType === "CATEGORY"
                            ? "Category"
                            : "Custom"}
                          {" \u00B7 "}
                          Created {new Date(bundle.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action menu */}
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() => setShowMenu(showMenu === bundle.id ? null : bundle.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: TEXT_MUTED,
                            fontSize: 18,
                            cursor: "pointer",
                            padding: "2px 6px",
                            lineHeight: 1,
                          }}
                        >
                          {"\u22EE"}
                        </button>
                        {showMenu === bundle.id && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              right: 0,
                              background: "#1a1f25",
                              border: `1px solid ${GLASS_BORDER}`,
                              borderRadius: 10,
                              padding: 6,
                              minWidth: 150,
                              zIndex: 20,
                              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                            }}
                          >
                            <Link
                              href={`/bundle/${bundle.slug}`}
                              style={{
                                display: "block",
                                padding: "8px 12px",
                                fontSize: 12,
                                color: TEXT_SECONDARY,
                                textDecoration: "none",
                                borderRadius: 6,
                              }}
                            >
                              View Public Page
                            </Link>
                            <button
                              onClick={() => copyShareUrl(bundle)}
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "8px 12px",
                                fontSize: 12,
                                color: TEXT_SECONDARY,
                                background: "transparent",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                borderRadius: 6,
                              }}
                            >
                              Copy Share Link
                            </button>
                            {(bundle.status === "ACTIVE" || bundle.status === "PAUSED") && (
                              <button
                                onClick={() => togglePause(bundle)}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  padding: "8px 12px",
                                  fontSize: 12,
                                  color: bundle.status === "ACTIVE" ? WARN_ORANGE : SUCCESS_GREEN,
                                  background: "transparent",
                                  border: "none",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  borderRadius: 6,
                                }}
                              >
                                {bundle.status === "ACTIVE" ? "Pause Bundle" : "Resume Bundle"}
                              </button>
                            )}
                            <button
                              onClick={() => { setDeleteId(bundle.id); setShowMenu(null); }}
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "8px 12px",
                                fontSize: 12,
                                color: DANGER_RED,
                                background: "transparent",
                                border: "none",
                                textAlign: "left",
                                cursor: "pointer",
                                borderRadius: 6,
                              }}
                            >
                              Delete Bundle
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ fontSize: 22, fontWeight: 800, color: TEAL }}>
                        ${bundle.bundlePrice.toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: TEXT_MUTED,
                          textDecoration: "line-through",
                        }}
                      >
                        ${bundle.individualTotal.toLocaleString()}
                      </span>
                      <span
                        style={{
                          background: `${dColor}22`,
                          color: dColor,
                          borderRadius: 6,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {discountPercent}% OFF
                      </span>
                    </div>

                    {/* Engagement stats */}
                    {(bundle.views !== undefined || bundle.inquiries !== undefined) && (
                      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                        {bundle.views !== undefined && (
                          <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                            <span style={{ fontWeight: 700, color: TEXT_SECONDARY }}>{bundle.views}</span> views
                          </div>
                        )}
                        {bundle.inquiries !== undefined && (
                          <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                            <span style={{ fontWeight: 700, color: TEXT_SECONDARY }}>{bundle.inquiries}</span> inquiries
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => copyShareUrl(bundle)}
                        style={{
                          flex: 1,
                          background: isCopied ? `${SUCCESS_GREEN}18` : TEAL_DIM,
                          color: isCopied ? SUCCESS_GREEN : TEAL,
                          border: `1px solid ${isCopied ? `${SUCCESS_GREEN}44` : `${TEAL}44`}`,
                          borderRadius: 8,
                          padding: "8px 0",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {isCopied ? "Copied!" : "Share Link"}
                      </button>
                      <Link
                        href={`/bundle/${bundle.slug}`}
                        style={{
                          flex: 1,
                          background: GLASS,
                          color: TEXT_SECONDARY,
                          border: `1px solid ${GLASS_BORDER}`,
                          borderRadius: 8,
                          padding: "8px 0",
                          fontSize: 11,
                          fontWeight: 600,
                          textDecoration: "none",
                          textAlign: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        View Page
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No results for filter */}
        {!loading && bundles.length > 0 && filtered.length === 0 && (
          <div
            style={{
              background: GLASS,
              border: `1px solid ${GLASS_BORDER}`,
              borderRadius: 14,
              padding: 32,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>
              No {filter.toLowerCase()} bundles found.
            </div>
          </div>
        )}

        {/* Bundle Suggestions widget */}
        <BundleSuggestions />

        {/* Delete confirmation modal */}
        {deleteId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteId(null);
            }}
          >
            <div
              style={{
                background: "#1a1f25",
                border: `1px solid ${GLASS_BORDER}`,
                borderRadius: 18,
                padding: 32,
                maxWidth: 400,
                width: "100%",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{"\u26A0\uFE0F"}</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  margin: "0 0 8px",
                }}
              >
                Delete Bundle?
              </h3>
              <p style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 24 }}>
                This will remove the bundle listing. The individual items will not be affected.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setDeleteId(null)}
                  style={{
                    flex: 1,
                    background: GLASS,
                    color: TEXT_SECONDARY,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 10,
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteBundle(deleteId)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    background: `${DANGER_RED}22`,
                    color: DANGER_RED,
                    border: `1px solid ${DANGER_RED}44`,
                    borderRadius: 10,
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: deleting ? "wait" : "pointer",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
