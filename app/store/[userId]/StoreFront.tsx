"use client";

import { useState } from "react";
import Link from "next/link";
import ShareButtons from "@/app/components/ShareButtons";

type Item = {
  id: string;
  title: string;
  condition: string | null;
  description: string | null;
  listingPrice: number | null;
  valuationLow: number | null;
  valuationHigh: number | null;
  photoUrl: string | null;
  isAntique: boolean;
  category: string | null;
  status: string;
};

interface StoreFrontProps {
  ownerName: string;
  items: Item[];
  userId: string;
  isOwner: boolean;
  storeUrl: string;
}

export default function StoreFront({ ownerName, items, userId, isOwner, storeUrl }: StoreFrontProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "antique" | "priced">("all");
  const [sort, setSort] = useState<"newest" | "priceLow" | "priceHigh" | "antiques">("newest");
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.title.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q) ||
      (item.category ?? "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "antique" && item.isAntique) ||
      (filter === "priced" && item.listingPrice != null);
    const matchCategory = !catFilter || item.category === catFilter;
    return matchSearch && matchFilter && matchCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "priceLow") return (a.listingPrice ?? 0) - (b.listingPrice ?? 0);
    if (sort === "priceHigh") return (b.listingPrice ?? 0) - (a.listingPrice ?? 0);
    if (sort === "antiques") return (b.isAntique ? 1 : 0) - (a.isAntique ? 1 : 0);
    return 0; // newest = default order from server
  });

  return (
    <div>
      <style>{`
        .storefront-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,188,212,0.15) !important;
        }
        .storefront-card:hover .storefront-card-img {
          transform: scale(1.06);
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--bg-secondary), var(--bg-card-solid))",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          marginBottom: "2rem",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
              Estate Sale
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "0.25rem" }}>
              {ownerName}'s Store
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
              {items.length} item{items.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <ShareButtons
              url={storeUrl}
              title={`${ownerName}'s Estate Sale on LegacyLoop`}
              description={`Browse ${items.length} items from ${ownerName}'s estate sale. AI-priced and verified.`}
            />
            {isOwner && (
              <Link
                href="/dashboard"
                style={{ padding: "0.6rem 1.2rem", background: "var(--accent)", borderRadius: "0.75rem", color: "#fff", fontSize: "0.85rem", textDecoration: "none" }}
              >
                ← My Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "0.6rem 1rem",
            border: "1px solid var(--border-default)",
            borderRadius: "0.75rem",
            fontSize: "0.9rem",
            outline: "none",
            background: "var(--bg-card-solid)",
            color: "var(--text-primary)",
          }}
        />
        {(["all", "antique", "priced"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              fontSize: "0.82rem",
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              background: filter === f ? "var(--accent)" : "var(--bg-card-solid)",
              color: filter === f ? "#fff" : "var(--text-secondary)",
              borderColor: filter === f ? "var(--accent)" : "var(--border-default)",
            }}
          >
            {f === "all" ? "All Items" : f === "antique" ? "🏺 Antiques" : "Priced"}
          </button>
        ))}
      </div>

      {/* Category filter pills */}
      {categories.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap", overflowX: "auto" }}>
          <button
            onClick={() => setCatFilter(null)}
            style={{
              padding: "0.35rem 0.85rem", borderRadius: "9999px",
              fontSize: "0.75rem", fontWeight: 600, border: "1px solid",
              cursor: "pointer", whiteSpace: "nowrap",
              background: !catFilter ? "var(--accent)" : "var(--bg-card-solid)",
              color: !catFilter ? "#fff" : "var(--text-secondary)",
              borderColor: !catFilter ? "var(--accent)" : "var(--border-default)",
            }}
          >All Categories</button>
          {categories.sort().map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                padding: "0.35rem 0.85rem", borderRadius: "9999px",
                fontSize: "0.75rem", fontWeight: 600, border: "1px solid",
                cursor: "pointer", whiteSpace: "nowrap",
                background: catFilter === cat ? "var(--accent)" : "var(--bg-card-solid)",
                color: catFilter === cat ? "#fff" : "var(--text-secondary)",
                borderColor: catFilter === cat ? "var(--accent)" : "var(--border-default)",
              }}
            >{cat}</button>
          ))}
        </div>
      )}

      {/* Sort */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          style={{
            padding: "0.4rem 0.75rem", fontSize: "0.78rem", fontWeight: 600,
            background: "var(--bg-card-solid)", color: "var(--text-primary)",
            border: "1px solid var(--border-default)", borderRadius: "0.5rem",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="newest">Newest First</option>
          <option value="priceLow">Price: Low → High</option>
          <option value="priceHigh">Price: High → Low</option>
          <option value="antiques">Antiques First</option>
        </select>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "1.25rem", padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>No items found</div>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Try a different search or filter.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.5rem",
        }}>
          {sorted.map((item) => {
            const isSold = item.status === "SOLD" || item.status === "SHIPPED" || item.status === "COMPLETED";
            return (
              <div
                key={item.id}
                className="storefront-card"
                style={{
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  background: "var(--bg-card-solid)",
                  border: item.isAntique ? "1px solid rgba(255,107,53,0.4)" : "1px solid var(--border-card)",
                  boxShadow: item.isAntique
                    ? "0 4px 24px rgba(255,107,53,0.15), 0 0 0 1px rgba(255,182,39,0.1)"
                    : "0 4px 20px rgba(0,0,0,0.15)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
              >
                {/* Photo with overlay badges */}
                <Link href={`/store/${userId}/item/${item.id}`} style={{ display: "block", position: "relative", overflow: "hidden" }}>
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.title}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "240px",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                      }}
                      className="storefront-card-img"
                    />
                  ) : (
                    <div style={{ width: "100%", height: "240px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-card-hover)" }}>
                      <span style={{ fontSize: "3rem", color: "var(--text-muted)" }}>📷</span>
                    </div>
                  )}

                  {/* Price badge overlay */}
                  {item.listingPrice != null && (
                    <div style={{
                      position: "absolute", bottom: "0.65rem", right: "0.65rem",
                      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
                      padding: "0.3rem 0.75rem", borderRadius: "0.65rem",
                      fontSize: "1.1rem", fontWeight: 800,
                      color: item.isAntique ? "#FFB627" : "var(--accent)",
                    }}>
                      ${item.listingPrice.toLocaleString()}
                    </div>
                  )}

                  {/* Condition badge */}
                  {item.condition && (
                    <div style={{
                      position: "absolute", top: "0.6rem", right: "0.6rem",
                      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
                      color: "#fff", fontSize: "0.6rem", fontWeight: 600,
                      padding: "0.2rem 0.55rem", borderRadius: "9999px",
                      letterSpacing: "0.03em",
                    }}>
                      {item.condition}
                    </div>
                  )}

                  {/* Status overlays */}
                  {item.status === "INTERESTED" && (
                    <div style={{
                      position: "absolute", top: item.condition ? "2rem" : "0.6rem", right: "0.6rem",
                      background: "rgba(251,191,36,0.9)", color: "#000",
                      fontSize: "0.6rem", fontWeight: 700,
                      padding: "0.2rem 0.55rem", borderRadius: "9999px",
                    }}>
                      Pending
                    </div>
                  )}
                  {isSold && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" }}>SOLD</span>
                    </div>
                  )}
                </Link>

                {/* Body */}
                <div style={{ padding: "1.15rem 1.25rem 1.25rem" }}>
                  <Link href={`/store/${userId}/item/${item.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.3,
                      color: "var(--text-primary)",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    }}>
                      {item.title}
                    </div>
                  </Link>

                  {item.category && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {item.category}
                    </div>
                  )}

                  {item.description && (
                    <p style={{
                      color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.5rem", lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    }}>
                      {item.description}
                    </p>
                  )}

                  {/* Price (inline when no overlay) */}
                  {item.listingPrice == null && (
                    <div style={{ marginTop: "0.65rem" }}>
                      {item.valuationLow != null ? (
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                          Est. ${Math.round(item.valuationLow)} – ${Math.round(item.valuationHigh!)}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>Make an offer</div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/store/${userId}/item/${item.id}`}
                    style={{
                      display: "block",
                      marginTop: "0.85rem",
                      padding: "0.6rem",
                      textAlign: "center",
                      borderRadius: "0.75rem",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      background: isSold ? "var(--border-default)" : "var(--accent)",
                      color: "#fff",
                      cursor: isSold ? "not-allowed" : "pointer",
                      pointerEvents: isSold ? "none" : "auto",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {isSold ? "Sold" : "View Details"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      <div style={{ marginTop: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        <p>Powered by <strong style={{ color: "var(--accent)" }}>LegacyLoop</strong> · AI-powered estate sale platform</p>
      </div>
    </div>
  );
}
