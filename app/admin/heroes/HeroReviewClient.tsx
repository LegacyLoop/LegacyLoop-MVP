"use client";

import { useState } from "react";

interface Verification {
  id: string;
  fullName: string;
  email: string;
  serviceCategory: string;
  serviceDetail: string;
  department: string | null;
  proofFileName: string | null;
  proofFilePath: string | null;
  reviewNotes: string | null;
  status: string;
  createdAt: string;
}

interface AiResult {
  isLikelyValid: boolean;
  confidence: number;
  documentType: string;
  matchesCategory: boolean;
  detectedCategory: string | null;
  nameFound: string | null;
  nameMatchScore: number;
  flags: string[];
  summary: string;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let color = "#ef4444";
  let bg = "rgba(239,68,68,0.1)";
  let label = "Low";
  if (confidence >= 80) { color = "#22c55e"; bg = "rgba(22,163,74,0.1)"; label = "High"; }
  else if (confidence >= 50) { color = "#eab308"; bg = "rgba(234,179,8,0.1)"; label = "Medium"; }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.68rem", fontWeight: 700,
      background: bg, color, border: `1px solid ${color}30`,
    }}>
      {confidence}% {label}
    </span>
  );
}

export default function HeroReviewClient({ verifications }: { verifications: Verification[] }) {
  const [items, setItems] = useState(verifications);
  const [aiResults, setAiResults] = useState<Record<string, AiResult>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [denyNotes, setDenyNotes] = useState<Record<string, string>>({});
  const [showDenyInput, setShowDenyInput] = useState<Record<string, boolean>>({});

  async function handleAiVerify(id: string) {
    setAiLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/heroes/ai-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: id }),
      });
      const data = await res.json();
      if (data.result) {
        setAiResults((prev) => ({ ...prev, [id]: data.result }));
      }
    } catch {
      // Non-critical
    } finally {
      setAiLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleAction(id: string, action: "approve" | "reject", notes?: string) {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/heroes/review/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes || undefined }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((v) => v.id !== id));
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  // Parse existing AI notes from reviewNotes
  function getExistingAiScore(v: Verification): { confidence: number; summary: string } | null {
    if (!v.reviewNotes || !v.reviewNotes.includes("[AI PRE-SCREEN]")) return null;
    const confMatch = v.reviewNotes.match(/Confidence:\s*(\d+)%/);
    const summaryMatch = v.reviewNotes.match(/\|\s*([^|]+)$/);
    if (!confMatch) return null;
    return {
      confidence: parseInt(confMatch[1]),
      summary: summaryMatch ? summaryMatch[1].trim() : "",
    };
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
        No pending verifications.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {items.map((v) => {
        const ai = aiResults[v.id];
        const existingAi = getExistingAiScore(v);
        const isAiLoading = aiLoading[v.id];
        const isActionLoading = actionLoading[v.id];
        const showDeny = showDenyInput[v.id];

        return (
          <div key={v.id} style={{
            padding: "1.25rem", borderRadius: "0.875rem",
            background: "rgba(234,179,8,0.04)", border: "1px solid rgba(234,179,8,0.15)",
          }}>
            {/* Top row: applicant info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{v.fullName}</span>
                  {(ai || existingAi) && (
                    <ConfidenceBadge confidence={ai?.confidence ?? existingAi!.confidence} />
                  )}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {v.serviceCategory.replace(/_/g, " ")} · {v.serviceDetail}
                </div>
                {v.department && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Dept: {v.department}</div>
                )}
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  {v.email} · Applied {new Date(v.createdAt).toLocaleDateString()}
                </div>
                {v.proofFilePath && (
                  <a
                    href={v.proofFilePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.72rem", color: "#00bcd4", marginTop: "0.2rem", textDecoration: "none" }}
                  >
                    View Document ({v.proofFileName})
                  </a>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                {v.proofFilePath && (
                  <button
                    onClick={() => handleAiVerify(v.id)}
                    disabled={isAiLoading}
                    style={{
                      padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.72rem", fontWeight: 700,
                      background: "rgba(0,188,212,0.08)", color: "#00bcd4", border: "1px solid rgba(0,188,212,0.25)",
                      cursor: isAiLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {isAiLoading ? "Analyzing..." : ai ? "Re-Run AI" : "AI Verify"}
                  </button>
                )}
                <button
                  onClick={() => handleAction(v.id, "approve")}
                  disabled={isActionLoading}
                  style={{
                    padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.72rem", fontWeight: 700,
                    background: "rgba(22,163,74,0.1)", color: "#22c55e", border: "1px solid rgba(22,163,74,0.2)",
                    cursor: isActionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowDenyInput((prev) => ({ ...prev, [v.id]: !prev[v.id] }))}
                  style={{
                    padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.72rem", fontWeight: 700,
                    background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
                    cursor: "pointer",
                  }}
                >
                  Deny
                </button>
              </div>
            </div>

            {/* AI Results Panel */}
            {ai && (
              <div style={{
                marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: "0.625rem",
                background: ai.isLikelyValid ? "rgba(22,163,74,0.06)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${ai.isLikelyValid ? "rgba(22,163,74,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                  AI VERIFICATION RESULT
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Document Type</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{ai.documentType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Category Match</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: ai.matchesCategory ? "#22c55e" : "#ef4444" }}>
                      {ai.matchesCategory ? "Yes" : "No"} {ai.detectedCategory ? `(${ai.detectedCategory})` : ""}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Name Match</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: ai.nameMatchScore >= 70 ? "#22c55e" : ai.nameMatchScore >= 40 ? "#eab308" : "#ef4444" }}>
                      {ai.nameMatchScore}% {ai.nameFound ? `("${ai.nameFound}")` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {ai.summary}
                </div>
                {ai.flags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.4rem" }}>
                    {ai.flags.map((f, i) => (
                      <span key={i} style={{
                        padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.62rem", fontWeight: 600,
                        background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)",
                      }}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Existing AI notes (from auto-analysis on submit) */}
            {!ai && existingAi && (
              <div style={{
                marginTop: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)",
                fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5,
              }}>
                AI pre-screen: {existingAi.confidence}% confidence — {existingAi.summary}
              </div>
            )}

            {/* Deny input */}
            {showDeny && (
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem" }}>
                <input
                  type="text"
                  placeholder="Reason for denial (optional)"
                  value={denyNotes[v.id] || ""}
                  onChange={(e) => setDenyNotes((prev) => ({ ...prev, [v.id]: e.target.value }))}
                  style={{
                    flex: 1, padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                    border: "1px solid var(--border-default)", background: "var(--bg-card-solid)",
                    color: "var(--text-primary)", fontSize: "0.78rem",
                  }}
                />
                <button
                  onClick={() => handleAction(v.id, "reject", denyNotes[v.id])}
                  disabled={isActionLoading}
                  style={{
                    padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.72rem", fontWeight: 700,
                    background: "#ef4444", color: "#fff", border: "none",
                    cursor: isActionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Confirm Deny
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
