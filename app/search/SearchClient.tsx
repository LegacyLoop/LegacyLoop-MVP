"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type PublicItem = {
  id: string;
  userId: string;
  title: string;
  condition: string | null;
  description: string | null;
  listingPrice: number | null;
  valuationLow: number | null;
  valuationHigh: number | null;
  photoUrl: string | null;
  isAntique: boolean;
  category: string | null;
  ownerName: string;
  saleZip: string | null;
};

interface Props {
  items: PublicItem[];
}

const BASE_CATEGORIES = [
  "Electronics", "Furniture", "Antiques", "Collectibles",
  "Musical Instruments", "Clothing", "Art", "Books", "Jewelry", "Other",
];

function effectivePrice(item: PublicItem): number | null {
  return item.listingPrice ?? item.valuationLow ?? null;
}

export default function SearchClient({ items }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [filter, setFilter] = useState<"all" | "antique" | "priced">("all");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [zipFilter, setZipFilter] = useState("");

  const hasActiveFilters = query || category !== "All" || filter !== "all" || priceMin || priceMax || zipFilter;

  function clearAll() {
    setQuery("");
    setCategory("All");
    setFilter("all");
    setSort("newest");
    setPriceMin("");
    setPriceMax("");
    setZipFilter("");
  }

  // Dynamic category counts from actual items
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    for (const item of items) {
      const raw = (item.category ?? "Other").split("/")[0].trim();
      const matched = BASE_CATEGORIES.find((c) =>
        raw.toLowerCase().includes(c.toLowerCase())
      ) ?? "Other";
      counts[matched] = (counts[matched] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const results = useMemo(() => {
    let list = items;
    const q = query.toLowerCase().trim();
    const minVal = priceMin ? parseFloat(priceMin) : null;
    const maxVal = priceMax ? parseFloat(priceMax) : null;
    const zip = zipFilter.trim();

    if (q) {
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q) ||
        (i.category ?? "").toLowerCase().includes(q) ||
        i.ownerName.toLowerCase().includes(q)
      );
    }

    if (category !== "All") {
      list = list.filter((i) =>
        (i.category ?? "").toLowerCase().includes(category.toLowerCase())
      );
    }

    if (filter === "antique") list = list.filter((i) => i.isAntique);
    if (filter === "priced") list = list.filter((i) => i.listingPrice != null);

    if (minVal !== null) {
      list = list.filter((i) => {
        const p = effectivePrice(i);
        return p !== null && p >= minVal;
      });
    }
    if (maxVal !== null) {
      list = list.filter((i) => {
        const p = effectivePrice(i);
        return p !== null && p <= maxVal;
      });
    }

    if (zip) {
      list = list.filter((i) => (i.saleZip ?? "").startsWith(zip));
    }

    if (sort === "price_asc") {
      list = [...list].sort((a, b) => {
        const pa = a.listingPrice ?? a.valuationLow ?? Infinity;
        const pb = b.listingPrice ?? b.valuationLow ?? Infinity;
        return pa - pb;
      });
    } else if (sort === "price_desc") {
      list = [...list].sort((a, b) => {
        const pa = a.listingPrice ?? a.valuationHigh ?? 0;
        const pb = b.listingPrice ?? b.valuationHigh ?? 0;
        return pb - pa;
      });
    }

    return list;
  }, [items, query, category, filter, sort, priceMin, priceMax, zipFilter]);

  return (
    <div>
      {/* Search bar */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          autoFocus
          placeholder="Search items, categories, sellers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "0.85rem 1.25rem",
            fontSize: "1rem",
            border: "2px solid var(--input-border)",
            borderRadius: "1rem",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
            background: "var(--input-bg)",
            color: "var(--input-color)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
        />
      </div>

      {/* Advanced filters row */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        {/* Price range */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <input
            type="number"
            placeholder="$ Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            style={{
              width: "80px",
              padding: "0.38rem 0.6rem",
              border: "1px solid var(--input-border)",
              borderRadius: "0.6rem",
              fontSize: "0.78rem",
              outline: "none",
              background: "var(--input-bg)",
              color: "var(--input-color)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>–</span>
          <input
            type="number"
            placeholder="$ Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            style={{
              width: "80px",
              padding: "0.38rem 0.6rem",
              border: "1px solid var(--input-border)",
              borderRadius: "0.6rem",
              fontSize: "0.78rem",
              outline: "none",
              background: "var(--input-bg)",
              color: "var(--input-color)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
          />
        </div>

        {/* ZIP filter */}
        <input
          type="text"
          placeholder="ZIP code"
          value={zipFilter}
          onChange={(e) => setZipFilter(e.target.value.replace(/\D/g, "").slice(0, 5))}
          style={{
            width: "90px",
            padding: "0.38rem 0.6rem",
            border: "1px solid var(--input-border)",
            borderRadius: "0.6rem",
            fontSize: "0.78rem",
            outline: "none",
            background: "var(--input-bg)",
            color: "var(--input-color)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
        />

        <div style={{ width: "1px", height: "20px", background: "var(--border-default)", margin: "0 0.1rem" }} />

        {/* Filter pills */}
        {(["all", "antique", "priced"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.38rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              background: filter === f ? "var(--accent)" : "var(--bg-card-solid)",
              color: filter === f ? "#fff" : "var(--text-secondary)",
              borderColor: filter === f ? "var(--accent)" : "var(--border-default)",
            }}
          >
            {f === "all" ? "All" : f === "antique" ? "🏺 Antiques" : "Fixed price"}
          </button>
        ))}

        <div style={{ width: "1px", height: "20px", background: "var(--border-default)", margin: "0 0.1rem" }} />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          style={{
            padding: "0.38rem 0.75rem",
            border: "1px solid var(--input-border)",
            borderRadius: "0.6rem",
            fontSize: "0.78rem",
            background: "var(--input-bg)",
            color: "var(--input-color)",
            cursor: "pointer",
          }}
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            style={{
              padding: "0.38rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "1px solid #e74c3c",
              cursor: "pointer",
              background: "var(--bg-card-solid)",
              color: "#e74c3c",
            }}
          >
            ✕ Clear all
          </button>
        )}

        <div style={{ marginLeft: "auto", fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {results.length} of {items.length} item{items.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Category chips with counts */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {["All", ...BASE_CATEGORIES].map((cat) => {
          const count = categoryCounts[cat] ?? 0;
          if (cat !== "All" && count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "0.3rem 0.7rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 500,
                border: "1px solid",
                cursor: "pointer",
                background: category === cat ? "var(--text-primary)" : "var(--bg-card-solid)",
                color: category === cat ? "#fff" : "var(--text-secondary)",
                borderColor: category === cat ? "var(--text-primary)" : "var(--border-default)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              {cat}
              <span style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "0 0.3rem",
                borderRadius: "9999px",
                background: category === cat ? "var(--border-default)" : "var(--border-default)",
                color: category === cat ? "#fff" : "var(--text-muted)",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active filter summary */}
      {(priceMin || priceMax || zipFilter) && (
        <div style={{ marginBottom: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(priceMin || priceMax) && (
            <span style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: "0.4rem", padding: "0.2rem 0.5rem", color: "var(--success-text)" }}>
              💰 {priceMin ? `$${priceMin}` : "$0"} – {priceMax ? `$${priceMax}` : "any"}
            </span>
          )}
          {zipFilter && (
            <span style={{ background: "var(--purple-bg)", border: "1px solid var(--purple-border)", borderRadius: "0.4rem", padding: "0.2rem 0.5rem", color: "var(--purple-text)" }}>
              📍 ZIP: {zipFilter}
            </span>
          )}
        </div>
      )}

      {/* Results grid */}
      {results.length === 0 ? (
        <div className="card p-16 text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
          <div className="text-xl font-semibold">No items found</div>
          <p className="muted mt-2">Try adjusting your filters or search terms.</p>
          <button
            onClick={clearAll}
            className="btn-ghost mt-6"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}>
          {results.map((item) => {
            const price = item.listingPrice;
            const valLow = item.valuationLow;
            const valHigh = item.valuationHigh;
            return (
              <Link
                key={item.id}
                href={`/store/${item.userId}/item/${item.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="card overflow-hidden"
                  style={{
                    cursor: "pointer",
                    transition: "box-shadow 0.15s, transform 0.15s",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    ...(item.isAntique
                      ? { borderColor: "#fbbf24", boxShadow: "0 0 0 2px rgba(251,191,36,0.15)" }
                      : {}),
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = item.isAntique
                      ? "0 0 0 2px rgba(251,191,36,0.15)"
                      : "";
                    (e.currentTarget as HTMLDivElement).style.transform = "";
                  }}
                >
                  {/* Photo */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.title}
                        style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "180px", background: "var(--bg-card-solid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "2.5rem", color: "var(--text-muted)" }}>📷</span>
                      </div>
                    )}
                    {item.saleZip && (
                      <div style={{ position: "absolute", bottom: "0.4rem", right: "0.4rem", background: "var(--overlay-dark)", color: "#fff", fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: "0.3rem" }}>
                        📍 {item.saleZip}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: "0.8rem 0.9rem", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.35, marginBottom: "0.2rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.title}
                    </div>
                    {item.condition && (
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>{item.condition}</div>
                    )}
                    <div style={{ marginTop: "auto", paddingTop: "0.4rem" }}>
                      {price != null ? (
                        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: item.isAntique ? "var(--antique-text)" : "var(--accent)" }}>
                          ${price.toLocaleString()}
                        </div>
                      ) : valLow != null ? (
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                          Est. ${Math.round(valLow)}–${Math.round(valHigh!)}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Make an offer</div>
                      )}
                    </div>
                    <div style={{ marginTop: "0.35rem", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                      {item.ownerName}'s store
                      {item.category && <span> · {item.category.split("/")[0].trim()}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
