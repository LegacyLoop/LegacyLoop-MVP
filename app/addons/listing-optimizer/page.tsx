"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const PLATFORMS = [
  { key: "ebay", name: "eBay", color: "#e53238", icon: "🛒" },
  { key: "facebook_marketplace", name: "Facebook", color: "#1877f2", icon: "📘" },
  { key: "instagram", name: "Instagram", color: "#e1306c", icon: "📸" },
  { key: "tiktok", name: "TikTok", color: "#444", icon: "🎵" },
  { key: "etsy", name: "Etsy", color: "#f1641e", icon: "🎨" },
  { key: "craigslist", name: "Craigslist", color: "#592d8c", icon: "📋" },
  { key: "offerup", name: "OfferUp", color: "#34a853", icon: "💚" },
  { key: "mercari", name: "Mercari", color: "#d5001c", icon: "🏪" },
  { key: "poshmark", name: "Poshmark", color: "#cc2f5c", icon: "👗" },
  { key: "legacyloop", name: "LegacyLoop", color: "#00bcd4", icon: "🔄" },
];

const AI_ENGINES = [
  { key: "openai", name: "GPT-4o", color: "#10a37f" },
  { key: "claude", name: "Claude", color: "#8b5cf6" },
  { key: "gemini", name: "Gemini", color: "#4285f4" },
  { key: "grok", name: "Grok", color: "#ff6600" },
];

function ListingOptimizerInner() {
  const searchParams = useSearchParams();
  const urlItemId = searchParams.get("item");

  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(urlItemId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [engineStatuses, setEngineStatuses] = useState<Record<string, string>>({});
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  // Fetch user items
  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => {
        setItems(Array.isArray(d) ? d : d.items || []);
      })
      .catch(() => {});
  }, []);

  async function runOptimizer() {
    if (!selectedItemId) return;
    setLoading(true);
    setResult(null);
    setEngineStatuses({
      openai: "running",
      claude: "running",
      gemini: "running",
      grok: "running",
    });

    try {
      const res = await fetch("/api/addons/listing-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedItemId }),
      });
      const data = await res.json();

      if (res.ok && data.platforms) {
        // Update engine statuses from results
        const statuses: Record<string, string> = {};
        for (const agent of data.agentResults || []) {
          statuses[agent.provider] =
            agent.status === "success" ? "complete" : "failed";
        }
        setEngineStatuses(statuses);
        setResult(data);
      } else {
        setEngineStatuses({
          openai: "failed",
          claude: "failed",
          gemini: "failed",
          grok: "failed",
        });
        alert(data.error || "Optimization failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 60px" }}>
      {/* HEADER */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(0,188,212,0.1), transparent)",
          borderBottom: "1px solid rgba(0,188,212,0.15)",
          padding: "28px 0",
          marginBottom: 28,
        }}
      >
        <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
          <Link href="/marketplace" style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
            textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
            border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
          }}>
            ← Back to Marketplace
          </Link>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              AI Listing Optimizer
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginTop: 6,
              }}
            >
              4 AI engines rewriting every listing simultaneously for maximum
              conversion
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {AI_ENGINES.map((e) => (
              <span
                key={e.key}
                style={{
                  fontSize: 9,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: `${e.color}22`,
                  border: `1px solid ${e.color}44`,
                  color: e.color,
                  fontWeight: 700,
                }}
              >
                {e.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ITEM SELECTOR (if no item selected) */}
      {!selectedItemId && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: 14,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16,
            }}
          >
            Select an item to optimize
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  padding: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(0,188,212,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                }}
              >
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}
                >
                  {item.title || "Untitled"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OPTIMIZE BUTTON */}
      {selectedItemId && !result && !loading && (
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {selectedItem && (
            <div
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginBottom: 12,
              }}
            >
              Optimizing:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {selectedItem.title || "Selected Item"}
              </strong>
            </div>
          )}
          <button
            onClick={runOptimizer}
            style={{
              padding: "0 32px",
              height: 56,
              background: "linear-gradient(135deg, #00bcd4, #0097a7)",
              color: "#000",
              fontWeight: 800,
              fontSize: 16,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,188,212,0.4)",
            }}
          >
            Optimize All Listings
          </button>
        </div>
      )}

      {/* AI ENGINES RUNNING */}
      {loading && (
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              textAlign: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 20,
            }}
          >
            4 AI Engines Working...
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {AI_ENGINES.map((e) => {
              const status = engineStatuses[e.key] || "running";
              return (
                <div
                  key={e.key}
                  style={{
                    background: "var(--ghost-bg)",
                    border: `1px solid ${
                      status === "complete"
                        ? "#4caf50"
                        : status === "failed"
                          ? "#f44336"
                          : "var(--text-muted)"
                    }`,
                    borderRadius: 12,
                    padding: 16,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: e.color,
                      marginBottom: 6,
                    }}
                  >
                    {e.name}
                  </div>
                  <div style={{ fontSize: 20 }}>
                    {status === "complete"
                      ? "✅"
                      : status === "failed"
                        ? "❌"
                        : "⏳"}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    {status === "running" ? "Analyzing..." : status}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "var(--ghost-bg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "60%",
                height: "100%",
                background: "linear-gradient(90deg, #00bcd4, #00e5ff)",
                borderRadius: 2,
                animation: "pulse 1.5s infinite",
              }}
            />
          </div>
        </div>
      )}

      {/* RESULTS */}
      {result && (
        <>
          {/* Score Comparison */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 32,
              marginBottom: 28,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  border: "3px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 8px",
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "var(--text-muted)",
                  }}
                >
                  {result.originalScore}
                </span>
              </div>
              <div
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                Before
              </div>
            </div>
            <div style={{ fontSize: 24, color: "#00bcd4" }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  border: "3px solid #00bcd4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 8px",
                  boxShadow: "0 0 30px rgba(0,188,212,0.3)",
                }}
              >
                <span
                  style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)" }}
                >
                  {result.optimizedScore}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#00bcd4" }}>After</div>
            </div>
          </div>

          {/* Improvement badge */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span
              style={{
                background: "rgba(76,175,80,0.15)",
                border: "1px solid #4caf50",
                color: "#4caf50",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 20,
                padding: "6px 16px",
              }}
            >
              +{result.improvement} points improvement
            </span>
          </div>

          {/* AI Agent Breakdown */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {(result.agentResults || []).map((agent: any) => (
              <div
                key={agent.provider}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      AI_ENGINES.find((e) => e.key === agent.provider)
                        ?.color || "var(--text-primary)",
                  }}
                >
                  {AI_ENGINES.find((e) => e.key === agent.provider)
                    ?.name || agent.provider}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: "4px 0",
                  }}
                >
                  {agent.score || "—"}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color:
                      agent.status === "success" ? "#4caf50" : "#f44336",
                  }}
                >
                  {agent.status} · {Math.round(agent.ms / 1000)}s
                </div>
              </div>
            ))}
          </div>

          {/* Platform Results */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Platform-by-Platform Results
          </div>
          {PLATFORMS.map((plat) => {
            const p = result.platforms?.[plat.key];
            if (!p) return null;
            const isExpanded = expandedPlatform === plat.key;
            const isCopied = copiedPlatform === plat.key;
            return (
              <div
                key={plat.key}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderLeft: `4px solid ${plat.color}`,
                  borderRadius: 10,
                  padding: "14px 18px",
                  marginBottom: 10,
                }}
              >
                <div
                  onClick={() =>
                    setExpandedPlatform(isExpanded ? null : plat.key)
                  }
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{plat.icon}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {plat.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                      }}
                    >
                      {p.current_score} → {p.optimized_score}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: "rgba(76,175,80,0.15)",
                        color: "#4caf50",
                        fontWeight: 700,
                      }}
                    >
                      +
                      {(p.optimized_score || 0) - (p.current_score || 0)}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: "#00bcd4" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
                {isExpanded && (
                  <div style={{ marginTop: 12 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            marginBottom: 6,
                          }}
                        >
                          BEFORE
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            lineHeight: 1.5,
                          }}
                        >
                          Original listing content
                        </div>
                      </div>
                      <div
                        style={{
                          background: "rgba(0,188,212,0.04)",
                          border: "1px solid rgba(0,188,212,0.15)",
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#00bcd4",
                            marginBottom: 6,
                          }}
                        >
                          AFTER
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: 4,
                          }}
                        >
                          {p.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            marginBottom: 6,
                          }}
                        >
                          {p.description}
                        </div>
                        {p.hook_line && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "#00bcd4",
                              fontStyle: "italic",
                              borderLeft: "2px solid #00bcd4",
                              paddingLeft: 8,
                              marginBottom: 6,
                            }}
                          >
                            {p.hook_line}
                          </div>
                        )}
                        {p.tags?.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                              marginBottom: 6,
                            }}
                          >
                            {p.tags.map((t: string, i: number) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: 9,
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  background: "rgba(0,188,212,0.1)",
                                  border:
                                    "1px solid rgba(0,188,212,0.2)",
                                  color: "#00bcd4",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {p.posting_tip && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              fontStyle: "italic",
                            }}
                          >
                            {p.posting_tip}
                          </div>
                        )}
                      </div>
                    </div>
                    {p.key_improvements?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {p.key_improvements.map(
                          (imp: string, i: number) => (
                            <div
                              key={i}
                              style={{
                                fontSize: 10,
                                color: "#4caf50",
                                marginBottom: 2,
                              }}
                            >
                              {imp}
                            </div>
                          )
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${p.title}\n\n${p.description}\n\n${(p.tags || []).join(", ")}`
                        );
                        setCopiedPlatform(plat.key);
                        setTimeout(() => setCopiedPlatform(null), 2000);
                      }}
                      style={{
                        marginTop: 8,
                        padding: "6px 14px",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        background: isCopied
                          ? "rgba(76,175,80,0.15)"
                          : "rgba(0,188,212,0.12)",
                        border: isCopied
                          ? "1px solid #4caf50"
                          : "1px solid #00bcd4",
                        color: isCopied ? "#4caf50" : "#00bcd4",
                        cursor: "pointer",
                      }}
                    >
                      {isCopied
                        ? "Copied!"
                        : `Copy ${plat.name} Listing`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Action Center */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 24,
            }}
          >
            <a
              href={
                result.publishHubUrl ||
                `/bots/listbot?item=${selectedItemId}`
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 52,
                background:
                  "linear-gradient(135deg, #00bcd4, #0097a7)",
                color: "#000",
                fontWeight: 800,
                fontSize: 14,
                borderRadius: 10,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,188,212,0.3)",
              }}
            >
              Open Publish Hub with Optimized Listings
            </a>
            <button
              onClick={() => {
                const all = PLATFORMS.map((p) => {
                  const d = result.platforms?.[p.key];
                  return d
                    ? `--- ${p.name} ---\nTitle: ${d.title}\n${d.description}\nTags: ${(d.tags || []).join(", ")}\n`
                    : "";
                })
                  .filter(Boolean)
                  .join("\n");
                navigator.clipboard.writeText(all);
                setCopiedPlatform("__all__");
                setTimeout(() => setCopiedPlatform(null), 2500);
              }}
              style={{
                width: "100%",
                height: 44,
                background: "transparent",
                border: "1px solid rgba(0,188,212,0.3)",
                color: "#00bcd4",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              {copiedPlatform === "__all__"
                ? "All Copied!"
                : "Copy All Optimized Listings"}
            </button>
          </div>

          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Optimized by{" "}
            {
              (result.agentResults || []).filter(
                (a: any) => a.status === "success"
              ).length
            }{" "}
            AI engines · {new Date().toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}

export default function ListingOptimizerPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
            }}
          >
            Loading optimizer...
          </div>
        </div>
      }
    >
      <ListingOptimizerInner />
    </Suspense>
  );
}
