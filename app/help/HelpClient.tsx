"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { HelpArticle, HelpCategory } from "@/lib/help-articles";

interface HelpClientProps {
  categories: HelpCategory[];
  articles: HelpArticle[];
}

export default function HelpClient({ categories, articles }: HelpClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = articles;

    if (activeCategory) {
      result = result.filter((a) => a.category === activeCategory);
    }

    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q)
      );
    }

    return result;
  }, [articles, search, activeCategory]);

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-default)",
            background: "var(--bg-card-solid)",
            color: "var(--text-primary)",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() =>
                setActiveCategory(isActive ? null : cat.name)
              }
              className="card"
              style={{
                padding: "1rem 1.25rem",
                textAlign: "left",
                cursor: "pointer",
                border: isActive
                  ? "1.5px solid var(--accent)"
                  : "1px solid var(--border-default)",
                background: isActive
                  ? "var(--accent-dim)"
                  : "var(--bg-card-solid)",
                transition: "border 0.15s, background 0.15s",
              }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>
                {cat.icon}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {cat.name}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                {cat.description}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  marginTop: "0.4rem",
                }}
              >
                {cat.count} {cat.count === 1 ? "article" : "articles"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active filter pill */}
      {activeCategory && (
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid var(--accent-border)",
              background: "var(--accent-dim)",
              color: "var(--accent)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {activeCategory} &times; Show all
          </button>
        </div>
      )}

      {/* Article list */}
      <div style={{ marginTop: "1.5rem" }}>
        {filtered.length === 0 && (
          <div
            className="card"
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No articles found. Try a different search term.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((article) => (
            <Link
              key={article.slug}
              href={`/help/${article.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="card"
                style={{
                  padding: "1.25rem 1.5rem",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {article.title}
                    </div>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        marginTop: "0.3rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {article.summary}
                    </p>
                    <div style={{ marginTop: "0.5rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.15rem 0.55rem",
                          borderRadius: "999px",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          background: "var(--badge-bg)",
                          color: "var(--badge-color)",
                          border: "1px solid var(--badge-border)",
                        }}
                      >
                        {article.categoryIcon} {article.category}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      color: "var(--accent)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      flexShrink: 0,
                      paddingTop: "0.15rem",
                    }}
                  >
                    Read &rarr;
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
