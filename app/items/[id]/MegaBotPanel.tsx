"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type ProviderRow = {
  provider: "openai" | "claude" | "gemini" | "grok";
  itemName: string | null;
  confidence: number | null;
  priceLow: number | null;
  priceFair: number | null;
  priceHigh: number | null;
  conditionScore: number | null;
  category: string | null;
  era: string | null;
  error: string | null;
  durationMs: number;
};

type MegabotData = {
  providers: ProviderRow[];
  agreementScore: number;
  consensus: {
    item_name: string;
    category: string;
    confidence: number;
    price_low?: number;
    price_fair?: number;
    price_high?: number;
    condition_score?: number;
    era?: string;
  };
};

type Props = {
  itemId: string;
  megabotData: MegabotData | null;
  originalEstimate?: { low: number; high: number } | null;
};

const PROVIDERS = [
  { key: "openai", name: "OpenAI GPT-4", color: "#10b981", icon: "O", specialty: "Balanced & Data-Driven" },
  { key: "claude", name: "Claude", color: "#8b5cf6", icon: "C", specialty: "Craftsmanship & History" },
  { key: "gemini", name: "Gemini", color: "#3b82f6", icon: "G", specialty: "Market & Demand" },
  { key: "grok", name: "Grok (xAI)", color: "#00DC82", icon: "X", specialty: "Trends & Social" },
] as const;

/* ── Scanning animation phases ── */
const SCAN_STEPS = [
  "Initializing multi-AI engine...",
  "Querying OpenAI GPT-4...",
  "Querying Claude (Anthropic)...",
  "Querying Google Gemini...",
  "Querying Grok (xAI)...",
  "Cross-referencing results...",
  "Computing consensus pricing...",
  "Building comparison matrix...",
  "Finalizing analysis...",
];

export default function MegaBotPanel({ itemId, megabotData, originalEstimate }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MegabotData | null>(megabotData);

  // Scanning animation state
  const [scanStep, setScanStep] = useState(0);
  const [providersDone, setProvidersDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!busy) return;
    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev >= SCAN_STEPS.length - 1) return prev;
        // Mark providers as done at specific steps
        if (prev === 1) setProvidersDone((s) => new Set([...s, "openai"]));
        if (prev === 2) setProvidersDone((s) => new Set([...s, "claude"]));
        if (prev === 3) setProvidersDone((s) => new Set([...s, "gemini"]));
        if (prev === 4) setProvidersDone((s) => new Set([...s, "grok"]));
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [busy]);

  const runMegabot = useCallback(async () => {
    setBusy(true);
    setScanStep(0);
    setProvidersDone(new Set());
    setError("");
    try {
      const res = await fetch(`/api/megabot/${itemId}`, { method: "POST" });
      if (!res.ok) { setError(await res.text()); return; }
      const data = await res.json();
      setResult({ providers: data.providers, agreementScore: data.agreementScore, consensus: data.consensus });
      const scrollY = window.scrollY;
      router.refresh();
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
      // Amazon enrichment is handled by the analyze route — data already cached
    } catch (e: any) {
      setError(e.message ?? "MegaBot failed");
    } finally {
      setBusy(false);
      setProvidersDone(new Set(["openai", "claude", "gemini", "grok"]));
    }
  }, [itemId, router]);

  // Delta calculation
  const consensusFair = result?.consensus?.price_fair ?? (result?.providers?.[0]?.priceFair ?? null);
  const originalFair = originalEstimate ? Math.round((originalEstimate.low + originalEstimate.high) / 2) : null;
  const deltaPercent = consensusFair && originalFair ? Math.round(((consensusFair - originalFair) / originalFair) * 100) : null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      borderRadius: "1.25rem", padding: "1.75rem 2rem", color: "#fff",
      position: "relative", overflow: "hidden",
    }}>
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -30, left: 20, width: 140, height: 140, background: "radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem", position: "relative" }}>
        <span style={{ fontSize: "1.35rem" }}>⚡</span>
        <div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
            Premium Feature
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, lineHeight: 1.2 }}>MegaBot — 4-AI Consensus</div>
        </div>
      </div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
        OpenAI + Claude + Gemini + Grok analyze simultaneously for maximum pricing accuracy.
      </p>

      {/* CTA / Scanning State */}
      {busy ? (
        <div style={{ position: "relative" }}>
          {/* Provider status row */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            {PROVIDERS.map((p) => {
              const done = providersDone.has(p.key);
              return (
                <div key={p.key} style={{
                  flex: 1, padding: "0.75rem", borderRadius: "0.75rem",
                  background: done ? `${p.color}18` : "var(--ghost-bg)",
                  border: `1px solid ${done ? `${p.color}40` : "var(--border-default)"}`,
                  textAlign: "center", transition: "all 0.5s ease",
                }}>
                  <div style={{
                    width: "2rem", height: "2rem", borderRadius: "50%", margin: "0 auto 0.5rem",
                    background: done ? p.color : "var(--ghost-bg)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 800, color: "#fff",
                    animation: !done ? "pulse 1.5s ease-in-out infinite" : "none",
                    transition: "background 0.4s ease",
                  }}>
                    {done ? "✓" : p.icon}
                  </div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: done ? p.color : "var(--text-muted)" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: done ? "var(--text-secondary)" : "var(--text-muted)", marginTop: "0.15rem" }}>
                    {done ? "Complete" : "Analyzing..."}
                  </div>
                  <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.35)", marginTop: "0.1rem", fontStyle: "italic" }}>
                    {p.specialty}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div style={{ background: "var(--ghost-bg)", borderRadius: "0.5rem", height: "6px", overflow: "hidden", marginBottom: "0.75rem" }}>
            <div style={{
              height: "100%", borderRadius: "0.5rem",
              background: "linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981)",
              width: `${Math.min(100, (scanStep / (SCAN_STEPS.length - 1)) * 100)}%`,
              transition: "width 0.8s ease",
            }} />
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textAlign: "center" }}>
            {SCAN_STEPS[scanStep]}
          </div>
        </div>
      ) : !result ? (
        <button onClick={runMegabot} style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.85rem 1.75rem", borderRadius: "0.75rem",
          background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", color: "#fff",
          fontWeight: 700, fontSize: "1rem", border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(139,92,246,0.45)", transition: "all 0.2s ease",
          minHeight: "48px",
        }}>
          Run MegaBot Analysis
        </button>
      ) : null}

      {error && (
        <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.875rem", background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "0.75rem", fontSize: "0.82rem", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Results — comparison view */}
      {result && !busy && (
        <div style={{ marginTop: result ? "0.5rem" : 0 }}>
          {/* Re-run button */}
          <button onClick={runMegabot} style={{
            padding: "0.5rem 1rem", borderRadius: "0.6rem", fontSize: "0.78rem", fontWeight: 600,
            background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
            color: "var(--text-secondary)", cursor: "pointer", marginBottom: "1.25rem",
            transition: "all 0.15s ease",
          }}>
            Re-run Analysis
          </button>

          {/* Agreement bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", padding: "0.75rem 1rem", background: "var(--ghost-bg)", borderRadius: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>AI Agreement</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{result.agreementScore}%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 7, background: "var(--bg-card-hover)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${result.agreementScore}%`, borderRadius: 4,
                  background: result.agreementScore >= 70 ? "linear-gradient(90deg, #10b981, #34d399)" : result.agreementScore >= 40 ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #ef4444, #f87171)",
                  transition: "width 0.8s ease",
                }} />
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {result.agreementScore >= 70 ? "Strong consensus" : result.agreementScore >= 40 ? "Moderate agreement" : "Low agreement — review carefully"}
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div style={{ overflowX: "auto", marginBottom: "1.25rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.6rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border-default)" }}>
                    Aspect
                  </th>
                  {result.providers.map((p) => {
                    const pCfg = PROVIDERS.find((pr) => pr.key === p.provider)!;
                    return (
                      <th key={p.provider} style={{ textAlign: "center", padding: "0.5rem 0.6rem", borderBottom: "1px solid var(--border-default)" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: pCfg.color, display: "inline-block" }} />
                            <span style={{ color: pCfg.color, fontWeight: 700, fontSize: "0.7rem" }}>{pCfg.name}</span>
                          </div>
                          <div style={{ fontSize: "0.48rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{pCfg.specialty}</div>
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ textAlign: "center", padding: "0.5rem 0.6rem", borderBottom: "1px solid rgba(0,188,212,0.3)", color: "#22d3ee", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Consensus
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Item ID */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-default)" }}>Identification</td>
                  {result.providers.map((p) => (
                    <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#fff", fontWeight: 500, borderBottom: "1px solid var(--border-default)", maxWidth: "120px" }}>
                      {p.error ? <span style={{ color: "#f87171" }}>Error</span> : (p.itemName ?? "—")}
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#22d3ee", fontWeight: 700, borderBottom: "1px solid var(--border-default)", background: "rgba(0,188,212,0.05)" }}>
                    {result.consensus.item_name}
                  </td>
                </tr>

                {/* Category */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "rgba(255,255,255,0.6)", fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Category</td>
                  {result.providers.map((p) => (
                    <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#fff", fontSize: "0.72rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {p.category ?? "—"}
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#22d3ee", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,188,212,0.05)" }}>
                    {result.consensus.category ?? "—"}
                  </td>
                </tr>
                {/* Era */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "rgba(255,255,255,0.6)", fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Era</td>
                  {result.providers.map((p) => (
                    <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#fff", fontSize: "0.72rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {p.era ?? "—"}
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#22d3ee", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,188,212,0.05)" }}>
                    {result.consensus.era ?? "—"}
                  </td>
                </tr>
                {/* Condition */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-default)" }}>Condition</td>
                  {result.providers.map((p) => (
                    <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#fff", borderBottom: "1px solid var(--border-default)" }}>
                      {p.conditionScore != null ? `${p.conditionScore}/10` : "—"}
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#22d3ee", fontWeight: 700, borderBottom: "1px solid var(--border-default)", background: "rgba(0,188,212,0.05)" }}>
                    {result.consensus.condition_score != null ? `${result.consensus.condition_score}/10` : "—"}
                  </td>
                </tr>

                {/* Price Low */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-default)" }}>Price Low</td>
                  {result.providers.map((p) => (
                    <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#fff", borderBottom: "1px solid var(--border-default)" }}>
                      {p.priceLow != null ? `$${p.priceLow}` : "—"}
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#22d3ee", fontWeight: 700, borderBottom: "1px solid var(--border-default)", background: "rgba(0,188,212,0.05)" }}>
                    {result.consensus.price_low != null ? `$${result.consensus.price_low}` : "—"}
                  </td>
                </tr>

                {/* Price Fair */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-default)" }}>Price Fair</td>
                  {result.providers.map((p) => (
                    <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#fff", fontWeight: 600, borderBottom: "1px solid var(--border-default)" }}>
                      {p.priceFair != null ? `$${p.priceFair}` : "—"}
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#22d3ee", fontWeight: 800, fontSize: "0.88rem", borderBottom: "1px solid var(--border-default)", background: "rgba(0,188,212,0.05)" }}>
                    {result.consensus.price_fair != null ? `$${result.consensus.price_fair}` : "—"}
                  </td>
                </tr>

                {/* Price High */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "var(--text-secondary)", fontWeight: 500, borderBottom: "1px solid var(--border-default)" }}>Price High</td>
                  {result.providers.map((p) => (
                    <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#fff", borderBottom: "1px solid var(--border-default)" }}>
                      {p.priceHigh != null ? `$${p.priceHigh}` : "—"}
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "#22d3ee", fontWeight: 700, borderBottom: "1px solid var(--border-default)", background: "rgba(0,188,212,0.05)" }}>
                    {result.consensus.price_high != null ? `$${result.consensus.price_high}` : "—"}
                  </td>
                </tr>

                {/* Confidence */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "var(--text-secondary)", fontWeight: 500 }}>Confidence</td>
                  {result.providers.map((p) => {
                    const pCfg = PROVIDERS.find((pr) => pr.key === p.provider)!;
                    return (
                      <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center" }}>
                        {p.confidence != null ? (
                          <span style={{ color: pCfg.color, fontWeight: 700, background: `${pCfg.color}18`, padding: "0.15rem 0.4rem", borderRadius: "0.35rem" }}>
                            {Math.round(p.confidence * 100)}%
                          </span>
                        ) : "—"}
                      </td>
                    );
                  })}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", background: "rgba(0,188,212,0.05)" }}>
                    <span style={{ color: "#22d3ee", fontWeight: 700, background: "rgba(0,188,212,0.15)", padding: "0.15rem 0.4rem", borderRadius: "0.35rem" }}>
                      {Math.round(result.consensus.confidence * 100)}%
                    </span>
                  </td>
                </tr>
                {/* Response Time */}
                <tr>
                  <td style={{ padding: "0.5rem 0.6rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Response Time</td>
                  {result.providers.map((p) => (
                    <td key={p.provider} style={{ padding: "0.5rem 0.6rem", textAlign: "center", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
                      {p.durationMs ? `${(p.durationMs / 1000).toFixed(1)}s` : "—"}
                    </td>
                  ))}
                  <td style={{ padding: "0.5rem 0.6rem", textAlign: "center", color: "rgba(0,188,212,0.6)", fontSize: "0.72rem", background: "rgba(0,188,212,0.05)" }}>
                    {(() => {
                      const durations = result.providers.filter(p => p.durationMs).map(p => p.durationMs);
                      return durations.length ? `${(Math.max(...durations) / 1000).toFixed(1)}s total` : "—";
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delta summary */}
          {deltaPercent !== null && (
            <div style={{
              padding: "0.875rem 1rem", borderRadius: "0.75rem",
              background: deltaPercent > 0 ? "rgba(34,197,94,0.08)" : deltaPercent < 0 ? "rgba(239,68,68,0.08)" : "var(--ghost-bg)",
              border: `1px solid ${deltaPercent > 0 ? "rgba(34,197,94,0.2)" : deltaPercent < 0 ? "rgba(239,68,68,0.2)" : "var(--border-default)"}`,
              marginBottom: "1rem",
            }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: deltaPercent > 0 ? "#4ade80" : deltaPercent < 0 ? "#f87171" : "var(--text-secondary)" }}>
                {Math.abs(deltaPercent) <= 10
                  ? `MegaBot confirms the original estimate — all AIs agree within ${Math.abs(deltaPercent)}%.`
                  : deltaPercent > 0
                    ? `MegaBot found this item may be worth ${deltaPercent}% MORE than the original single-AI estimate of $${originalFair}.`
                    : `MegaBot suggests this item may be worth ${Math.abs(deltaPercent)}% less than the original estimate of $${originalFair}.`
                }
              </div>
            </div>
          )}

          {/* What This Means */}
          <div style={{
            padding: "0.875rem 1rem", borderRadius: "0.75rem",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "1rem",
          }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "0.4rem" }}>
              📋 WHAT THIS MEANS FOR YOU
            </div>
            <div style={{ fontSize: "0.82rem", color: "#e2e8f0", lineHeight: 1.7 }}>
              {result.agreementScore >= 70 ? (
                <>All 4 AI engines agree on this item. You can confidently price it at <strong style={{ color: "#22d3ee" }}>${result.consensus.price_fair ?? "the suggested price"}</strong> and expect strong results.</>
              ) : result.agreementScore >= 40 ? (
                <>The AI engines have some disagreement. Review the comparison above — the <strong style={{ color: "#22d3ee" }}>Consensus</strong> column shows the best average. Consider a professional appraisal for high-value items.</>
              ) : (
                <>The AI engines significantly disagree. This usually means a rare or unusual item. We recommend a professional appraisal before pricing.</>
              )}
            </div>
          </div>

          {/* ── Per-Provider Detail Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {result.providers.map((p) => {
              const pCfg = PROVIDERS.find((pr) => pr.key === p.provider)!;
              const isErr = !!p.error;
              return (
                <div key={p.provider} style={{
                  padding: "1rem", borderRadius: "0.875rem",
                  background: isErr ? "rgba(239,68,68,0.06)" : `${pCfg.color}08`,
                  border: `1px solid ${isErr ? "rgba(239,68,68,0.2)" : `${pCfg.color}25`}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                    <span style={{
                      width: "1.5rem", height: "1.5rem", borderRadius: "50%",
                      background: isErr ? "#ef444430" : pCfg.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.6rem", fontWeight: 800, color: "#fff",
                    }}>{isErr ? "✗" : pCfg.icon}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: isErr ? "#f87171" : pCfg.color }}>{pCfg.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--text-muted)" }}>{p.durationMs}ms</span>
                  </div>
                  {isErr ? (
                    <div style={{ fontSize: "0.75rem", color: "#fca5a5" }}>Error: {p.error}</div>
                  ) : (
                    <>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>{p.itemName}</div>
                      {p.priceFair != null && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Fair: <span style={{ color: pCfg.color, fontWeight: 700 }}>${p.priceFair}</span>
                          {p.priceLow != null && p.priceHigh != null && <span> ({`$${p.priceLow}–$${p.priceHigh}`})</span>}
                        </div>
                      )}
                      {p.conditionScore != null && (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                          Condition: {p.conditionScore}/10 · Confidence: {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : "—"}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── MegaBot Summary Dialogue ── */}
          <div style={{
            padding: "1.25rem 1.5rem", borderRadius: "1rem",
            background: "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(139,92,246,0.06))",
            border: "1px solid rgba(0,188,212,0.2)",
            position: "relative",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.1rem" }}>🤖</span>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#22d3ee" }}>
                MegaBot Summary
              </div>
            </div>

            {/* Item identification */}
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", lineHeight: 1.3 }}>
              {result.consensus.item_name}
            </div>

            {/* Key findings grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              {result.consensus.price_fair != null && (
                <div style={{ padding: "0.75rem", borderRadius: "0.75rem", background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.15)" }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                    Consensus Value
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#22d3ee" }}>
                    ${result.consensus.price_fair}
                  </div>
                  {result.consensus.price_low != null && result.consensus.price_high != null && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Range: ${result.consensus.price_low} – ${result.consensus.price_high}
                    </div>
                  )}
                </div>
              )}
              <div style={{ padding: "0.75rem", borderRadius: "0.75rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                  AI Agreement
                </div>
                <div style={{
                  fontSize: "1.35rem", fontWeight: 800,
                  color: result.agreementScore >= 70 ? "#4ade80" : result.agreementScore >= 40 ? "#fbbf24" : "#f87171",
                }}>
                  {result.agreementScore}%
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {result.providers.filter((p) => !p.error).length}/{result.providers.length} AIs responded
                </div>
              </div>
            </div>

            {/* Plain-English analysis */}
            <div style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.65, marginBottom: "0.75rem" }}>
              {(() => {
                const successes = result.providers.filter((p) => !p.error).length;
                const lines: string[] = [];
                lines.push(`${successes} out of ${result.providers.length} AI engines successfully analyzed this item.`);
                if (result.consensus.category) lines.push(`All models classify this as "${result.consensus.category}".`);
                if (result.consensus.era) lines.push(`Estimated era: ${result.consensus.era}.`);
                if (result.consensus.condition_score != null) lines.push(`Average condition rating: ${result.consensus.condition_score}/10.`);
                if (result.consensus.price_fair != null) {
                  lines.push(`The consensus fair market value is $${result.consensus.price_fair}.`);
                }
                if (result.agreementScore >= 70) {
                  lines.push("The AI models show strong agreement — this estimate is high-confidence.");
                } else if (result.agreementScore >= 40) {
                  lines.push("Models show moderate agreement. Consider getting a second opinion for high-value items.");
                } else {
                  lines.push("Low agreement between models. A professional appraisal is recommended.");
                }
                return lines.join(" ");
              })()}
            </div>

            {/* Delta vs original */}
            {deltaPercent !== null && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.6rem 0.875rem", borderRadius: "0.6rem",
                background: deltaPercent > 0 ? "rgba(34,197,94,0.1)" : deltaPercent < 0 ? "rgba(239,68,68,0.08)" : "var(--ghost-bg)",
                border: `1px solid ${deltaPercent > 0 ? "rgba(34,197,94,0.2)" : deltaPercent < 0 ? "rgba(239,68,68,0.15)" : "var(--border-default)"}`,
              }}>
                <span style={{ fontSize: "0.85rem" }}>{deltaPercent > 0 ? "📈" : deltaPercent < 0 ? "📉" : "✅"}</span>
                <span style={{
                  fontSize: "0.82rem", fontWeight: 600,
                  color: deltaPercent > 0 ? "#4ade80" : deltaPercent < 0 ? "#f87171" : "var(--text-secondary)",
                }}>
                  {Math.abs(deltaPercent) <= 10
                    ? `Confirms original estimate (within ${Math.abs(deltaPercent)}%)`
                    : deltaPercent > 0
                      ? `${deltaPercent}% higher than single-AI estimate ($${originalFair})`
                      : `${Math.abs(deltaPercent)}% lower than single-AI estimate ($${originalFair})`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
