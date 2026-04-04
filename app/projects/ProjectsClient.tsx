"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Project = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  status: string;
  itemCount: number;
  listedCount: number;
  soldCount: number;
  revenue: number;
  portfolio: number;
  photoUrl: string | null;
  createdAt: string;
};

type UnassignedItem = { id: string; title: string; photoUrl: string | null; status: string };

interface Props {
  projects: Project[];
  unassignedItems: UnassignedItem[];
}

/* ── Sale type config ── */

const SALE_TYPES: Record<string, { emoji: string; label: string; sub: string; color: string; bg: string }> = {
  ESTATE_SALE: { emoji: "\uD83C\uDFE1", label: "Estate Sale", sub: "Downsizing, inheritance, liquidation", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  GARAGE_SALE: { emoji: "\uD83C\uDFF7\uFE0F", label: "Garage Sale", sub: "Decluttering, seasonal cleanout", color: "#00bcd4", bg: "rgba(0,188,212,0.12)" },
  MOVING_SALE: { emoji: "\uD83D\uDE9B", label: "Moving Sale", sub: "Relocating, everything must go", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  YARD_SALE:   { emoji: "\uD83C\uDF3F", label: "Yard Sale", sub: "Casual outdoor sale, community event", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  DOWNSIZING:  { emoji: "\uD83D\uDCE6", label: "Downsizing Sale", sub: "Simplifying, curated items", color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  ONLINE_SALE: { emoji: "\uD83D\uDECD\uFE0F", label: "Online Sale Only", sub: "Ship everything, no in-person", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

const getSaleType = (type: string) => SALE_TYPES[type] || SALE_TYPES.ESTATE_SALE;

const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
  DRAFT: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  ACTIVE: { color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  COMPLETED: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const optsY: Intl.DateTimeFormatOptions = { ...opts, year: "numeric" };
  if (!end) return s.toLocaleDateString("en-US", optsY);
  const e = new Date(end);
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString("en-US", opts)} \u2013 ${e.toLocaleDateString("en-US", optsY)}`;
  }
  return `${s.toLocaleDateString("en-US", optsY)} \u2013 ${e.toLocaleDateString("en-US", optsY)}`;
}

export default function ProjectsClient({ projects, unassignedItems }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    type: "ESTATE_SALE",
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    city: "",
    state: "",
  });

  async function createProject() {
    if (!form.name.trim()) return;
    setCreating(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreating(false);
    setShowCreate(false);
    setForm({ type: "ESTATE_SALE", name: "", description: "", startDate: "", endDate: "", city: "", state: "" });
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)", fontWeight: 700 }}>Organize & Sell</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.35rem" }}>My Sales</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Create and manage your sale events &mdash; garage sales, estate sales, and more
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.65rem 1.25rem", borderRadius: "0.6rem", border: "none",
            background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
            fontSize: "0.88rem", fontWeight: 700, cursor: "pointer",
            boxShadow: "0 0 20px rgba(0,188,212,0.25)",
            transition: "all 0.2s ease",
          }}
        >
          + New Sale
        </button>
      </div>

      {/* ── Create modal ── */}
      {showCreate && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div style={{
            background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
            borderRadius: "1.25rem", padding: "2rem", width: "100%", maxWidth: "580px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.3)", backdropFilter: "blur(24px)",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Create New Sale</h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Choose a sale type, give it a name, and start adding items.
            </p>

            {/* Type selector — 3x2 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
              {Object.entries(SALE_TYPES).map(([value, t]) => {
                const selected = form.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: value }))}
                    style={{
                      padding: "0.75rem 0.6rem", textAlign: "center",
                      border: `2px solid ${selected ? t.color : "var(--text-muted)"}`,
                      borderRadius: "0.75rem", cursor: "pointer",
                      background: selected ? t.bg : "var(--bg-card)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: "1.35rem", marginBottom: "0.3rem" }}>{t.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.72rem", color: selected ? t.color : "var(--text-secondary)" }}>{t.label}</div>
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.15rem", lineHeight: 1.3 }}>{t.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                placeholder="Sale name (e.g. Grandma Dorothy's Estate Sale)"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={{
                  padding: "0.65rem 0.9rem", border: "1px solid var(--border-default)",
                  borderRadius: "0.6rem", fontSize: "0.88rem",
                  background: "var(--ghost-bg)", color: "var(--text-primary)",
                }}
              />
              <textarea
                placeholder="Description (optional)"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{
                  padding: "0.65rem 0.9rem", border: "1px solid var(--border-default)",
                  borderRadius: "0.6rem", fontSize: "0.88rem", resize: "vertical",
                  background: "var(--ghost-bg)", color: "var(--text-primary)",
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Start date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    style={{
                      display: "block", width: "100%", padding: "0.5rem 0.75rem",
                      border: "1px solid var(--border-default)", borderRadius: "0.6rem",
                      fontSize: "0.82rem", boxSizing: "border-box",
                      background: "var(--ghost-bg)", color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>End date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    style={{
                      display: "block", width: "100%", padding: "0.5rem 0.75rem",
                      border: "1px solid var(--border-default)", borderRadius: "0.6rem",
                      fontSize: "0.82rem", boxSizing: "border-box",
                      background: "var(--ghost-bg)", color: "var(--text-primary)",
                    }}
                  />
                </div>
                <input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  style={{
                    padding: "0.5rem 0.75rem", border: "1px solid var(--border-default)",
                    borderRadius: "0.6rem", fontSize: "0.82rem",
                    background: "var(--ghost-bg)", color: "var(--text-primary)",
                  }}
                />
                <input
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  style={{
                    padding: "0.5rem 0.75rem", border: "1px solid var(--border-default)",
                    borderRadius: "0.6rem", fontSize: "0.82rem",
                    background: "var(--ghost-bg)", color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={createProject}
                disabled={!form.name.trim() || creating}
                style={{
                  flex: 1, padding: "0.75rem", borderRadius: "0.6rem", border: "none",
                  background: !form.name.trim() ? "var(--border-default)" : "linear-gradient(135deg, #00bcd4, #009688)",
                  color: !form.name.trim() ? "var(--text-muted)" : "#fff",
                  fontSize: "0.9rem", fontWeight: 700, cursor: !form.name.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {creating ? "Creating..." : "Create Sale"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: "0.75rem 1.25rem", borderRadius: "0.6rem",
                  border: "1px solid var(--border-default)", background: "transparent",
                  color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sales grid ── */}
      {projects.length === 0 ? (
        <div style={{
          padding: "4rem 2rem", textAlign: "center",
          background: "var(--bg-card)", border: "1px solid var(--border-default)",
          borderRadius: "1.25rem", backdropFilter: "blur(20px)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem", opacity: 0.7 }}>{"\uD83C\uDFF7\uFE0F"}</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>No sales yet</div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem", maxWidth: "420px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            Group your items into a Sale Event to share, promote, and sell everything at once.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              marginTop: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.75rem 1.75rem", borderRadius: "0.6rem", border: "none",
              background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
              fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
              boxShadow: "0 0 24px rgba(0,188,212,0.3)",
            }}
          >
            Start Your First Sale
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {projects.map((p) => {
            const saleType = getSaleType(p.type);
            const statusBadge = STATUS_BADGE[p.status] || STATUS_BADGE.DRAFT;
            const dateStr = formatDateRange(p.startDate, p.endDate);

            return (
              <div
                key={p.id}
                style={{
                  display: "grid", gridTemplateColumns: "200px 1fr auto", gap: 0,
                  background: "var(--bg-card)", border: "1px solid var(--border-default)",
                  borderRadius: "1rem", overflow: "hidden", backdropFilter: "blur(20px)",
                  transition: "border-color 0.2s ease",
                }}
              >
                {/* Photo / Type badge area */}
                <div style={{ position: "relative", minHeight: "160px" }}>
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: saleType.bg,
                    }}>
                      <span style={{ fontSize: "3rem" }}>{saleType.emoji}</span>
                    </div>
                  )}
                  {/* Type badge */}
                  <div style={{
                    position: "absolute", top: "0.6rem", left: "0.6rem",
                    background: "rgba(12,12,22,0.85)", backdropFilter: "blur(12px)",
                    padding: "0.2rem 0.55rem", borderRadius: "9999px",
                    border: `1px solid ${saleType.color}33`,
                    fontSize: "0.62rem", fontWeight: 700, color: saleType.color,
                    display: "flex", alignItems: "center", gap: "0.25rem",
                  }}>
                    {saleType.emoji} {saleType.label}
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{p.name}</h2>
                    <span style={{
                      fontSize: "0.58rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                      borderRadius: "9999px", textTransform: "uppercase", letterSpacing: "0.06em",
                      background: statusBadge.bg, color: statusBadge.color,
                    }}>
                      {p.status}
                    </span>
                  </div>

                  {p.description && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem", lineHeight: 1.5 }}>
                      {p.description.length > 120 ? p.description.slice(0, 120) + "\u2026" : p.description}
                    </p>
                  )}

                  {(dateStr || p.city) && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {dateStr && <span>{"\uD83D\uDCC5"} {dateStr}</span>}
                      {p.city && p.state && <span>{"\uD83D\uDCCD"} {p.city}, {p.state}</span>}
                    </div>
                  )}

                  {/* Stats row */}
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    {[
                      { label: "Items", value: p.itemCount, color: "var(--text-primary)" },
                      { label: "Listed", value: p.listedCount, color: "#00bcd4" },
                      { label: "Sold", value: p.soldCount, color: "#4ade80" },
                      { label: "Revenue", value: `$${p.revenue.toLocaleString()}`, color: p.revenue > 0 ? "#4ade80" : "var(--text-muted)" },
                      { label: "Portfolio", value: `$${p.portfolio.toLocaleString()}`, color: "#00bcd4" },
                    ].map((s) => (
                      <div key={s.label}>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* No items nudge */}
                  {p.itemCount === 0 && (
                    <div style={{ marginTop: "0.75rem", fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      No items yet &mdash; <Link href={`/projects/${p.id}`} style={{ color: "#00bcd4", textDecoration: "none", fontWeight: 600, fontStyle: "normal" }}>add some to get started</Link>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  padding: "1.25rem", display: "flex", flexDirection: "column",
                  gap: "0.5rem", justifyContent: "center",
                  borderLeft: "1px solid var(--border-default)",
                }}>
                  <Link
                    href={`/projects/${p.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0.5rem 1.1rem", borderRadius: "0.5rem", border: "none",
                      background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                      fontSize: "0.8rem", fontWeight: 700, textDecoration: "none",
                      whiteSpace: "nowrap", transition: "all 0.2s ease",
                    }}
                  >
                    Manage &rarr;
                  </Link>
                  <a
                    href={`/sale/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0.45rem 1.1rem", borderRadius: "0.5rem",
                      border: "1px solid var(--border-default)", background: "transparent",
                      color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600,
                      textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.2s ease",
                    }}
                  >
                    {"\uD83D\uDD17"} Public Page
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
