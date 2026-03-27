"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const AI_ENGINES = [
  { key: "openai", name: "GPT-4o", color: "#10a37f", persona: "Collectors", icon: "🏆" },
  { key: "claude", name: "Claude", color: "#8b5cf6", persona: "Gift Buyers", icon: "🎁" },
  { key: "gemini", name: "Gemini", color: "#4285f4", persona: "Resellers", icon: "📈" },
  { key: "grok", name: "Grok", color: "#ff6600", persona: "Local Buyers", icon: "📍" },
];

const SENSITIVITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  low: { bg: "rgba(76,175,80,0.15)", border: "#4caf50", text: "#4caf50" },
  medium: { bg: "rgba(255,193,7,0.15)", border: "#ffc107", text: "#ffc107" },
  high: { bg: "rgba(244,67,54,0.15)", border: "#f44336", text: "#f44336" },
};

const TONE_COLORS: Record<string, string> = {
  friendly: "#4caf50",
  professional: "#2196f3",
  casual: "#ff9800",
  enthusiastic: "#e91e63",
};

function BuyerOutreachInner() {
  const searchParams = useSearchParams();
  const urlItemId = searchParams.get("item");

  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(urlItemId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [engineStatuses, setEngineStatuses] = useState<Record<string, string>>({});
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch user items
  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => {
        setItems(Array.isArray(d) ? d : d.items || []);
      })
      .catch(() => {});
  }, []);

  async function runBlast() {
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
      const res = await fetch("/api/addons/buyer-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedItemId }),
      });
      const data = await res.json();

      if (res.ok && data.personas) {
        const statuses: Record<string, string> = {};
        for (const agent of data.agentResults || []) {
          statuses[agent.provider] = agent.status === "success" ? "complete" : "failed";
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
        alert(data.error || "Outreach blast failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 60px" }}>
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(0,188,212,0.1), transparent)",
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
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: 0 }}>
              Buyer Outreach Blast
            </h1>
            <p style={{ fontSize: 13, color: "rgba(207,216,220,0.6)", marginTop: 6 }}>
              4 AI engines finding your ideal buyers and crafting personalized outreach messages
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

      {/* ITEM SELECTOR */}
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
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Select an item to find buyers for
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
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,188,212,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {item.title || "Untitled"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(207,216,220,0.5)", marginTop: 4 }}>
                  {item.status}
                  {item.listingPrice ? ` · $${item.listingPrice}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LAUNCH BUTTON */}
      {selectedItemId && !result && !loading && (
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {selectedItem && (
            <div style={{ fontSize: 14, color: "rgba(207,216,220,0.6)", marginBottom: 12 }}>
              Finding buyers for:{" "}
              <strong style={{ color: "#fff" }}>{selectedItem.title || "Selected Item"}</strong>
            </div>
          )}
          <button
            onClick={runBlast}
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
            Launch Buyer Blast
          </button>
          <button
            onClick={() => setSelectedItemId(null)}
            style={{
              display: "block",
              margin: "12px auto 0",
              background: "none",
              border: "none",
              color: "rgba(207,216,220,0.5)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Change item
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
              color: "#fff",
              marginBottom: 20,
            }}
          >
            4 AI Engines Scanning for Buyers...
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
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{e.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: e.color, marginBottom: 4 }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(207,216,220,0.6)" }}>
                    {status === "running"
                      ? `Finding ${e.persona}...`
                      : status === "complete"
                        ? "Done"
                        : "Failed"}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 4 }}>
                    {status === "complete" ? "✅" : status === "failed" ? "❌" : "⏳"}
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
          {/* Summary Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              marginBottom: 28,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "rgba(0,188,212,0.1)",
                border: "1px solid rgba(0,188,212,0.25)",
                borderRadius: 12,
                padding: "14px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "#00bcd4" }}>
                {result.personas?.length || 0}
              </div>
              <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)" }}>Buyer Personas</div>
            </div>
            <div
              style={{
                background: "rgba(76,175,80,0.1)",
                border: "1px solid rgba(76,175,80,0.25)",
                borderRadius: 12,
                padding: "14px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4caf50" }}>
                {result.totalMessages || 0}
              </div>
              <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)" }}>Outreach Messages</div>
            </div>
            <div
              style={{
                background: "rgba(255,152,0,0.1)",
                border: "1px solid rgba(255,152,0,0.25)",
                borderRadius: 12,
                padding: "14px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: "#ff9800" }}>
                {result.topPersona?.likelihood_to_buy || 0}%
              </div>
              <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)" }}>Top Match Score</div>
            </div>
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
            {(result.agentResults || []).map((agent: any) => {
              const engine = AI_ENGINES.find((e) => e.key === agent.provider);
              return (
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: engine?.color || "#fff" }}>
                    {engine?.name || agent.provider}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)", margin: "4px 0" }}>
                    {agent.personaName || "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: agent.status === "success" ? "#4caf50" : "#f44336",
                    }}
                  >
                    {agent.status} · {Math.round(agent.ms / 1000)}s
                  </div>
                </div>
              );
            })}
          </div>

          {/* Persona Cards — 2x2 grid */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            Buyer Personas
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {(result.personas || []).map((persona: any, idx: number) => {
              const engine = AI_ENGINES.find((e) => e.key === persona.provider);
              const sensitivity = SENSITIVITY_COLORS[persona.price_sensitivity] || SENSITIVITY_COLORS.medium;
              const isExpanded = expandedPersona === `${persona.provider}-${idx}`;
              const personaKey = `${persona.provider}-${idx}`;

              return (
                <div
                  key={personaKey}
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${engine?.color || "var(--border-default)"}33`,
                    borderRadius: 14,
                    padding: 20,
                    position: "relative",
                  }}
                >
                  {/* Engine badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      fontSize: 8,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: `${engine?.color || "#666"}22`,
                      border: `1px solid ${engine?.color || "#666"}44`,
                      color: engine?.color || "#666",
                      fontWeight: 700,
                    }}
                  >
                    {engine?.name || persona.provider}
                  </div>

                  {/* Persona header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${engine?.color || "#00bcd4"}15`,
                        border: `1px solid ${engine?.color || "#00bcd4"}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      {engine?.icon || "👤"}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                        {persona.name || "Unknown Persona"}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(207,216,220,0.5)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        {(persona.type || "unknown").replace(/_/g, " ")}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(207,216,220,0.7)",
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}
                  >
                    {persona.description || ""}
                  </div>

                  {/* Motivation chips */}
                  {persona.motivations?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {persona.motivations.map((m: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 9,
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: "rgba(0,188,212,0.08)",
                            border: "1px solid rgba(0,188,212,0.18)",
                            color: "#00bcd4",
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Likelihood meter */}
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 10, color: "rgba(207,216,220,0.5)" }}>
                        Likelihood to Buy
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
                        {persona.likelihood_to_buy || 0}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "var(--ghost-bg)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${persona.likelihood_to_buy || 0}%`,
                          height: "100%",
                          borderRadius: 3,
                          background:
                            (persona.likelihood_to_buy || 0) >= 70
                              ? "linear-gradient(90deg, #4caf50, #66bb6a)"
                              : (persona.likelihood_to_buy || 0) >= 40
                                ? "linear-gradient(90deg, #ff9800, #ffb74d)"
                                : "linear-gradient(90deg, #f44336, #ef5350)",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Best platforms pills */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 9, color: "rgba(207,216,220,0.4)" }}>Best on:</span>
                    {(persona.best_platforms || []).map((p: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 9,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: "var(--ghost-bg)",
                          border: "1px solid var(--border-default)",
                          color: "rgba(207,216,220,0.7)",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Price sensitivity + message count */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 10px",
                        borderRadius: 20,
                        background: sensitivity.bg,
                        border: `1px solid ${sensitivity.border}`,
                        color: sensitivity.text,
                        fontWeight: 700,
                      }}
                    >
                      {(persona.price_sensitivity || "medium").toUpperCase()} PRICE SENSITIVITY
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: "2px 10px",
                        borderRadius: 20,
                        background: "rgba(0,188,212,0.1)",
                        border: "1px solid rgba(0,188,212,0.2)",
                        color: "#00bcd4",
                        fontWeight: 700,
                      }}
                    >
                      {persona.messages?.length || 0} messages
                    </span>
                  </div>

                  {/* Expand/collapse messages */}
                  <button
                    onClick={() => setExpandedPersona(isExpanded ? null : personaKey)}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      background: "rgba(0,188,212,0.06)",
                      border: "1px solid rgba(0,188,212,0.15)",
                      borderRadius: 8,
                      color: "#00bcd4",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginBottom: isExpanded ? 12 : 0,
                    }}
                  >
                    {isExpanded ? "▲ Hide Messages" : "▼ Show Messages"}
                  </button>

                  {/* Messages panel (expanded) */}
                  {isExpanded && (
                    <div>
                      {(persona.messages || []).map((msg: any, mi: number) => {
                        const msgKey = `${personaKey}-msg-${mi}`;
                        const toneColor = TONE_COLORS[msg.tone] || "#999";
                        const isCopied = copiedId === msgKey;

                        return (
                          <div
                            key={mi}
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-default)",
                              borderRadius: 10,
                              padding: 14,
                              marginBottom: 10,
                            }}
                          >
                            {/* Message header */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9,
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  background: "rgba(0,188,212,0.1)",
                                  border: "1px solid rgba(0,188,212,0.2)",
                                  color: "#00bcd4",
                                  fontWeight: 700,
                                }}
                              >
                                {msg.platform || "general"}
                              </span>
                              <span
                                style={{
                                  fontSize: 9,
                                  padding: "2px 8px",
                                  borderRadius: 20,
                                  background: `${toneColor}15`,
                                  border: `1px solid ${toneColor}33`,
                                  color: toneColor,
                                  fontWeight: 700,
                                }}
                              >
                                {msg.tone || "neutral"}
                              </span>
                              <span
                                style={{
                                  fontSize: 9,
                                  color: "rgba(207,216,220,0.5)",
                                  marginLeft: "auto",
                                }}
                              >
                                Est. response: {msg.estimated_response_rate || 0}%
                              </span>
                            </div>

                            {/* Subject line */}
                            {msg.subject && (
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#fff",
                                  marginBottom: 6,
                                }}
                              >
                                {msg.subject}
                              </div>
                            )}

                            {/* Message body */}
                            <div
                              style={{
                                fontSize: 12,
                                color: "rgba(207,216,220,0.8)",
                                lineHeight: 1.7,
                                marginBottom: 10,
                                borderLeft: "2px solid rgba(0,188,212,0.2)",
                                paddingLeft: 12,
                              }}
                            >
                              {msg.body || ""}
                            </div>

                            {/* Response rate bar */}
                            <div
                              style={{
                                height: 3,
                                borderRadius: 2,
                                background: "var(--ghost-bg)",
                                marginBottom: 10,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${msg.estimated_response_rate || 0}%`,
                                  height: "100%",
                                  borderRadius: 2,
                                  background: engine?.color || "#00bcd4",
                                  transition: "width 0.5s ease",
                                }}
                              />
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => {
                                  const text = msg.subject
                                    ? `Subject: ${msg.subject}\n\n${msg.body}`
                                    : msg.body || "";
                                  copyText(text, msgKey);
                                }}
                                style={{
                                  padding: "5px 12px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  background: isCopied
                                    ? "rgba(76,175,80,0.15)"
                                    : "rgba(0,188,212,0.1)",
                                  border: isCopied
                                    ? "1px solid #4caf50"
                                    : "1px solid rgba(0,188,212,0.2)",
                                  color: isCopied ? "#4caf50" : "#00bcd4",
                                  cursor: "pointer",
                                }}
                              >
                                {isCopied ? "Copied!" : "Copy"}
                              </button>
                              <button
                                onClick={() => {
                                  const text = msg.subject
                                    ? `Subject: ${msg.subject}\n\n${msg.body}`
                                    : msg.body || "";
                                  copyText(text, `${msgKey}-queue`);
                                }}
                                style={{
                                  padding: "5px 12px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  background: "var(--ghost-bg)",
                                  border: "1px solid var(--border-default)",
                                  color: "rgba(207,216,220,0.6)",
                                  cursor: "pointer",
                                }}
                              >
                                {copiedId === `${msgKey}-queue` ? "Queued!" : "Queue in Messages"}
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Strategy paragraph */}
                      {persona.strategy && (
                        <div
                          style={{
                            background: "rgba(0,188,212,0.04)",
                            border: "1px solid rgba(0,188,212,0.12)",
                            borderRadius: 8,
                            padding: 14,
                            marginTop: 4,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#00bcd4",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              marginBottom: 6,
                            }}
                          >
                            Outreach Strategy
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "rgba(207,216,220,0.7)",
                              lineHeight: 1.7,
                            }}
                          >
                            {persona.strategy}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Top Persona Highlight */}
          {result.topPersona && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(76,175,80,0.06))",
                border: "1px solid rgba(0,188,212,0.2)",
                borderRadius: 14,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>⭐</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  Top Match: {result.topPersona.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 10px",
                    borderRadius: 20,
                    background: "rgba(76,175,80,0.15)",
                    border: "1px solid #4caf50",
                    color: "#4caf50",
                    fontWeight: 700,
                    marginLeft: "auto",
                  }}
                >
                  {result.topPersona.likelihood_to_buy || 0}% match
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(207,216,220,0.7)",
                  lineHeight: 1.6,
                }}
              >
                {result.topPersona.description || ""}
              </div>
            </div>
          )}

          {/* Action Center */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            Action Center
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => {
                const allMsgs = (result.messages || [])
                  .map(
                    (m: any, i: number) =>
                      `--- Message ${i + 1} (${m.platform} · ${m.personaName}) ---\n${m.subject ? `Subject: ${m.subject}\n` : ""}${m.body}\n`
                  )
                  .join("\n");
                copyText(allMsgs, "__all_msgs__");
              }}
              style={{
                width: "100%",
                height: 52,
                background: "linear-gradient(135deg, #00bcd4, #0097a7)",
                color: "#000",
                fontWeight: 800,
                fontSize: 14,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0,188,212,0.3)",
              }}
            >
              {copiedId === "__all_msgs__" ? "All Messages Copied!" : "Copy All Messages"}
            </button>
            <button
              onClick={() => {
                const allMsgs = (result.messages || [])
                  .map(
                    (m: any, i: number) =>
                      `--- Message ${i + 1} (${m.platform} · ${m.personaName}) ---\n${m.subject ? `Subject: ${m.subject}\n` : ""}${m.body}\n`
                  )
                  .join("\n");
                copyText(allMsgs, "__queue_all__");
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
              {copiedId === "__queue_all__" ? "All Queued!" : "Queue All"}
            </button>
          </div>

          {/* Timestamp */}
          <div
            style={{
              fontSize: 10,
              color: "rgba(207,216,220,0.4)",
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Generated by{" "}
            {(result.agentResults || []).filter((a: any) => a.status === "success").length} AI
            engines · {result.totalMessages} messages · {new Date().toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}

export default function BuyerOutreachPage() {
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
          <div style={{ fontSize: 14, color: "rgba(207,216,220,0.5)" }}>
            Loading outreach blast...
          </div>
        </div>
      }
    >
      <BuyerOutreachInner />
    </Suspense>
  );
}
