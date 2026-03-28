"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface DocRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  docType: string;
  label: string | null;
  aiSummary: string | null;
  aiAnalysis: string | null;
  confidenceScore: number | null;
  providerResults: string | null;
  createdAt: string;
}

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

const PROVIDER_META: Record<string, { icon: string; label: string; color: string }> = {
  openai: { icon: "🤖", label: "GPT-4o", color: "#10a37f" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4" },
  grok: { icon: "🌀", label: "Grok", color: "#00DC82" },
};

const DOC_CATEGORIES = [
  { key: "RECEIPT", icon: "🧾", label: "Receipt" },
  { key: "CERTIFICATE", icon: "📜", label: "Certificate" },
  { key: "LEGAL", icon: "⚖️", label: "Legal" },
  { key: "MAINTENANCE", icon: "🔧", label: "Maintenance" },
  { key: "MANUAL", icon: "📖", label: "Manual" },
  { key: "PROVENANCE", icon: "🏛️", label: "Provenance" },
  { key: "APPRAISAL", icon: "💎", label: "Appraisal" },
  { key: "OTHER", icon: "📁", label: "Other" },
] as const;

const RECOMMENDED = ["RECEIPT", "CERTIFICATE", "PROVENANCE", "MAINTENANCE", "MANUAL"];

function fileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType === "application/pdf") return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("excel") || fileType.includes("spreadsheet") || fileType === "text/csv") return "📊";
  if (fileType.startsWith("text/")) return "📝";
  return "📎";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentVault({ itemId }: { itemId: string }) {
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("RECEIPT");
  const [labelInput, setLabelInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [vaultCollapsed, setVaultCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/items/documents/${itemId}`);
      if (!res.ok) return;
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [itemId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("docType", selectedType);
      if (labelInput.trim()) fd.append("label", labelInput.trim());

      const res = await fetch(`/api/items/documents/${itemId}`, { method: "POST", body: fd });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Upload failed");
      }
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
      setLabelInput("");
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(documentId: string) {
    setDeleting(documentId);
    try {
      const res = await fetch(`/api/items/documents/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setDocs((prev) => prev.filter((d) => d.id !== documentId));
    } catch (e: any) {
      setError(e.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  }

  // Trust badges
  const docTypes = new Set(docs.map((d) => d.docType));
  const trustBadges = [
    { type: "RECEIPT", label: "Receipt on File" },
    { type: "CERTIFICATE", label: "Certificate on File" },
    { type: "PROVENANCE", label: "Provenance Documented" },
    { type: "APPRAISAL", label: "Appraisal on File" },
  ].filter((b) => docTypes.has(b.type));

  const hasAiAnalyzed = docs.some((d) => d.aiSummary);

  // Poll for AI analysis results after upload (fire-and-forget means we need to check back)
  useEffect(() => {
    const pending = docs.filter((d) => !d.aiSummary);
    if (pending.length === 0) return;
    const timer = setTimeout(() => fetchDocs(), 8000);
    const timer2 = setTimeout(() => fetchDocs(), 20000);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, [docs, fetchDocs]);

  // Completeness
  const completedRecommended = RECOMMENDED.filter((r) => docTypes.has(r)).length;

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "16px",
      overflow: "hidden",
      marginTop: "1rem",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,188,212,0.08)",
      transition: "box-shadow 0.2s ease",
    }}>
      {/* Hidden file inputs — outside collapse gate so quick upload works */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.odt,.txt,.rtf,.xls,.xlsx,.csv"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* ── PREMIUM COLLAPSIBLE HEADER ── */}
      <div
        onClick={() => setVaultCollapsed(!vaultCollapsed)}
        style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.85rem 1.15rem", cursor: "pointer",
          borderBottom: vaultCollapsed ? "none" : "1px solid var(--border-default)",
          transition: "all 0.2s ease", userSelect: "none" as const,
          minHeight: vaultCollapsed ? "72px" : undefined,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ghost-bg)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        {/* Left: Icon + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>📁</span>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.03em" }}>
              DOCUMENT VAULT
            </div>
            <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
              Upload documents to make every AI bot smarter
            </div>
          </div>
        </div>

        {/* Center: Document type icons (compact display when collapsed) */}
        {vaultCollapsed && (
          <div style={{ display: "flex", gap: "0.25rem", marginLeft: "auto", marginRight: "0.75rem" }}>
            {[
              { icon: "🧾", has: docs.some(d => d.docType === "RECEIPT") },
              { icon: "📜", has: docs.some(d => d.docType === "CERTIFICATE") },
              { icon: "🏛️", has: docs.some(d => d.docType === "PROVENANCE") },
              { icon: "🔧", has: docs.some(d => d.docType === "MAINTENANCE") },
              { icon: "📖", has: docs.some(d => d.docType === "MANUAL") },
            ].map((dt, i) => (
              <span key={i} style={{
                fontSize: "0.85rem", opacity: dt.has ? 1 : 0.2,
                filter: dt.has ? "none" : "grayscale(1)",
                transition: "all 0.2s ease",
              }}>{dt.icon}</span>
            ))}
          </div>
        )}

        {/* Right: Score + Upload + Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginLeft: vaultCollapsed ? undefined : "auto" }}>
          {/* Progress bar for document score */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{
              width: "60px", height: "6px", borderRadius: "3px",
              background: "var(--ghost-bg)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: "3px",
                width: `${Math.min(100, (completedRecommended / RECOMMENDED.length) * 100)}%`,
                background: completedRecommended >= 5 ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : completedRecommended >= 2 ? "linear-gradient(90deg, #f59e0b, #d97706)"
                  : "linear-gradient(90deg, #94a3b8, #64748b)",
                transition: "width 0.3s ease",
              }} />
            </div>
            <span style={{
              fontSize: "0.55rem", fontWeight: 600, whiteSpace: "nowrap" as const,
              color: completedRecommended >= 5 ? "#22c55e" : completedRecommended >= 2 ? "#f59e0b" : "var(--text-muted)",
            }}>
              {completedRecommended}/{RECOMMENDED.length}
            </span>
          </div>

          {/* Doc count badge */}
          <span style={{
            fontSize: "0.52rem", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
            background: docs.length > 0 ? "rgba(0,188,212,0.12)" : "var(--ghost-bg)",
            color: docs.length > 0 ? "#00bcd4" : "var(--text-muted)",
          }}>
            {docs.length} doc{docs.length !== 1 ? "s" : ""}
          </span>

          {/* Quick upload — functional even when collapsed */}
          <button
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            style={{
              padding: "0.35rem 0.65rem", fontSize: "0.6rem", fontWeight: 700,
              background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
              border: "none", borderRadius: "0.4rem", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "0.25rem",
              boxShadow: "0 2px 8px rgba(0,188,212,0.25)",
              transition: "all 0.15s ease",
            }}
          >
            📎 Upload
          </button>

          {/* Collapse toggle */}
          <span style={{
            fontSize: "0.55rem", color: "var(--text-muted)",
            transition: "transform 0.25s ease",
            transform: vaultCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "24px", height: "24px", borderRadius: "50%",
            background: !vaultCollapsed ? "rgba(0,188,212,0.08)" : "transparent",
          }}>▼</span>
        </div>
      </div>

      {/* ── EXPANDED CONTENT ── */}
      {!vaultCollapsed && (
      <div style={{ padding: "1.25rem" }}>

      {/* ── TRUST BADGES ── */}
      {trustBadges.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "0.75rem" }}>
          {trustBadges.map((b) => (
            <span key={b.type} style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "3px 9px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 600,
              background: "rgba(34,197,94,0.08)", color: "rgba(34,197,94,0.9)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}>
              ✓ {b.label}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          fontSize: "0.75rem", color: "#ef4444",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "0.5rem", padding: "0.5rem 0.75rem", marginBottom: "0.6rem",
        }}>
          {error}
          <button onClick={() => setError(null)} style={{
            marginLeft: "8px", background: "none", border: "none", color: "#ef4444",
            cursor: "pointer", fontWeight: 700, fontSize: "0.75rem",
          }}>×</button>
        </div>
      )}

      {/* ── TYPE SELECTOR ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "0.65rem",
      }}>
        {DOC_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedType(cat.key)}
            style={{
              padding: "8px 4px", minHeight: "48px",
              fontSize: "0.72rem", fontWeight: selectedType === cat.key ? 700 : 500,
              borderRadius: "0.5rem",
              border: selectedType === cat.key
                ? "1px solid rgba(0,188,212,0.4)"
                : "1px solid var(--border-default)",
              background: selectedType === cat.key
                ? "rgba(0,188,212,0.12)"
                : "var(--bg-card)",
              color: selectedType === cat.key ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            }}
          >
            <span style={{ fontSize: "16px" }}>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── LABEL INPUT ── */}
      <input
        type="text"
        placeholder="Label (optional) — e.g. 'Purchase receipt 2024'"
        value={labelInput}
        onChange={(e) => setLabelInput(e.target.value)}
        style={{
          width: "100%", padding: "10px 12px", fontSize: "0.8rem",
          borderRadius: "0.5rem", border: "1px solid var(--border-default)",
          background: "var(--bg-card)", color: "var(--text-primary)",
          marginBottom: "0.5rem", boxSizing: "border-box",
        }}
      />

      {/* ── UPLOAD ZONE ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: dragOver
            ? "2px solid var(--accent)"
            : "2px dashed var(--border-default)",
          borderRadius: "0.65rem",
          padding: "1.25rem",
          textAlign: "center" as const,
          cursor: uploading ? "wait" : "pointer",
          background: dragOver ? "rgba(0,188,212,0.06)" : "transparent",
          transition: "all 0.2s ease",
          marginBottom: "0.65rem",
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? (
          <div style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: 600 }}>
            Uploading...
          </div>
        ) : (
          <>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>📎</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Drop document here or tap to upload
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Photos, PDF, Word, Excel, Text — up to 25MB
            </div>
          </>
        )}
      </div>

      {/* Camera button for mobile */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "0.75rem" }}>
        <button
          onClick={() => cameraRef.current?.click()}
          style={{
            flex: 1, padding: "10px", minHeight: "48px",
            fontSize: "0.78rem", fontWeight: 600,
            borderRadius: "0.5rem",
            background: "linear-gradient(135deg, rgba(0,188,212,0.15), rgba(0,188,212,0.08))",
            border: "1px solid rgba(0,188,212,0.25)",
            color: "var(--accent)", cursor: "pointer",
          }}
        >
          📷 Photograph Document
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1, padding: "10px", minHeight: "48px",
            fontSize: "0.78rem", fontWeight: 600,
            borderRadius: "0.5rem",
            background: "var(--ghost-bg)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)", cursor: "pointer",
          }}
        >
          📁 Browse Files
        </button>
      </div>

      {/* ── COMPLETENESS SCORE ── */}
      <div style={{
        background: "var(--bg-card)", borderRadius: "0.5rem",
        padding: "0.6rem 0.75rem", border: "1px solid var(--border-default)",
        marginBottom: "0.75rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Document Score
          </span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)" }}>
            {completedRecommended} / {RECOMMENDED.length} recommended
          </span>
        </div>
        <div style={{
          height: "4px", borderRadius: "2px",
          background: "var(--ghost-bg)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: "2px",
            background: "var(--accent)",
            width: `${(completedRecommended / RECOMMENDED.length) * 100}%`,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {/* ── DOCUMENT LIST ── */}
      {loading ? (
        <div style={{ padding: "1rem", textAlign: "center" as const, fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Loading documents...
        </div>
      ) : docs.length === 0 ? (
        <div style={{
          padding: "1.5rem", textAlign: "center" as const,
          background: "var(--bg-card)", borderRadius: "0.5rem",
          border: "1px solid var(--border-default)",
        }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>📂</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            No documents yet. Upload your first document to unlock AI document intelligence.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {docs.map((doc) => {
            const catInfo = DOC_CATEGORIES.find((c) => c.key === doc.docType);
            return (
              <div key={doc.id}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: expandedSummary === doc.id ? "0.5rem 0.5rem 0 0" : "0.5rem",
                }}>
                  {/* File icon */}
                  <span style={{ fontSize: "20px", width: "28px", textAlign: "center" as const }}>
                    {fileIcon(doc.fileType)}
                  </span>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {doc.label || doc.fileName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", flexWrap: "wrap" }}>
                      <span style={{
                        padding: "1px 6px", borderRadius: "10px", fontSize: "0.58rem",
                        fontWeight: 700, textTransform: "uppercase",
                        background: "rgba(0,188,212,0.1)", color: "var(--accent)",
                        border: "1px solid rgba(0,188,212,0.15)",
                      }}>
                        {catInfo?.icon} {catInfo?.label || doc.docType}
                      </span>
                      {doc.confidenceScore != null && doc.confidenceScore > 0 && (
                        <span style={{
                          padding: "1px 6px", borderRadius: "10px", fontSize: "0.52rem",
                          fontWeight: 700,
                          background: doc.confidenceScore >= 70 ? "rgba(34,197,94,0.1)" : doc.confidenceScore >= 40 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.08)",
                          color: doc.confidenceScore >= 70 ? "#22c55e" : doc.confidenceScore >= 40 ? "#f59e0b" : "#ef4444",
                          border: `1px solid ${doc.confidenceScore >= 70 ? "rgba(34,197,94,0.2)" : doc.confidenceScore >= 40 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.15)"}`,
                        }}>
                          {doc.confidenceScore}% confidence
                        </span>
                      )}
                      {!doc.aiSummary && (
                        <span style={{
                          padding: "1px 6px", borderRadius: "10px", fontSize: "0.52rem",
                          fontWeight: 600, color: "var(--accent)",
                          background: "rgba(0,188,212,0.08)",
                          animation: "pulse 2s ease infinite",
                        }}>
                          analyzing...
                        </span>
                      )}
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                        {formatSize(doc.fileSizeBytes)}
                      </span>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                        {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    {doc.aiSummary && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedSummary(expandedSummary === doc.id ? null : doc.id); }}
                        style={{
                          padding: "6px 10px", minHeight: "36px",
                          fontSize: "0.68rem", fontWeight: 600,
                          borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.2)",
                          background: expandedSummary === doc.id ? "rgba(0,188,212,0.12)" : "transparent",
                          color: "var(--accent)", cursor: "pointer",
                        }}
                      >
                        🤖 AI
                      </button>
                    )}
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: "6px 10px", minHeight: "36px",
                        fontSize: "0.68rem", fontWeight: 600,
                        borderRadius: "0.4rem", border: "1px solid var(--border-default)",
                        background: "transparent", color: "var(--text-secondary)",
                        textDecoration: "none", display: "inline-flex", alignItems: "center",
                      }}
                    >
                      View
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                      disabled={deleting === doc.id}
                      style={{
                        padding: "6px 10px", minHeight: "36px",
                        fontSize: "0.68rem", fontWeight: 600,
                        borderRadius: "0.4rem", border: "1px solid rgba(239,68,68,0.2)",
                        background: "transparent", color: "#ef4444",
                        cursor: deleting === doc.id ? "wait" : "pointer",
                        opacity: deleting === doc.id ? 0.5 : 1,
                      }}
                    >
                      {deleting === doc.id ? "..." : "✕"}
                    </button>
                  </div>
                </div>

                {/* AI Analysis expandable — multi-AI structured display */}
                {doc.aiSummary && expandedSummary === doc.id && (() => {
                  const analysis = safeJson(doc.aiAnalysis);
                  const provResults = safeJson(doc.providerResults);
                  const providers = provResults?.providers || [];

                  return (
                    <div style={{
                      padding: "12px 14px",
                      background: "rgba(0,188,212,0.04)",
                      border: "1px solid rgba(0,188,212,0.15)",
                      borderTop: "none",
                      borderRadius: "0 0 0.5rem 0.5rem",
                    }}>
                      {/* Header with provider status */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          🤖 Multi-AI Document Intelligence
                        </div>
                        {providers.length > 0 && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            {providers.map((p: any) => {
                              const meta = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888" };
                              return (
                                <span key={p.provider} title={`${meta.label}: ${p.success ? `${p.responseTime}ms` : p.error || "failed"}`} style={{
                                  fontSize: "0.75rem", opacity: p.success ? 1 : 0.3,
                                  filter: p.success ? "none" : "grayscale(1)",
                                }}>
                                  {meta.icon}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: "0.6rem" }}>
                        {analysis?.summary || doc.aiSummary}
                      </div>

                      {/* Key Findings */}
                      {analysis?.keyFindings?.length > 0 && (
                        <div style={{ marginBottom: "0.6rem" }}>
                          <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>
                            Key Findings
                          </div>
                          {analysis.keyFindings.slice(0, 5).map((f: string, i: number) => (
                            <div key={i} style={{ display: "flex", gap: "0.3rem", fontSize: "0.72rem", color: "var(--text-secondary)", padding: "0.12rem 0", lineHeight: 1.45 }}>
                              <span style={{ color: "#22c55e", flexShrink: 0 }}>•</span>
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Structured Data Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                        {/* Dates */}
                        {analysis?.dates?.length > 0 && (
                          <div style={{ padding: "0.4rem 0.55rem", borderRadius: "0.35rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", marginBottom: "0.15rem" }}>📅 Dates</div>
                            {analysis.dates.slice(0, 4).map((d: any, i: number) => (
                              <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                                <span style={{ fontWeight: 600 }}>{d.label}:</span> {d.value}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Prices */}
                        {analysis?.prices?.length > 0 && (
                          <div style={{ padding: "0.4rem 0.55rem", borderRadius: "0.35rem", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
                            <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", marginBottom: "0.15rem" }}>💰 Prices</div>
                            {analysis.prices.slice(0, 4).map((p: any, i: number) => (
                              <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                                <span style={{ fontWeight: 600 }}>{p.label}:</span> ${typeof p.value === "number" ? p.value.toLocaleString() : p.value}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Identifiers */}
                        {analysis?.identifiers?.length > 0 && (
                          <div style={{ padding: "0.4rem 0.55rem", borderRadius: "0.35rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                            <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", marginBottom: "0.15rem" }}>🔢 Identifiers</div>
                            {analysis.identifiers.slice(0, 4).map((id: any, i: number) => (
                              <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                                <span style={{ fontWeight: 600 }}>{id.label}:</span> {id.value}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Authenticity */}
                        {analysis?.authenticityMarkers?.length > 0 && (
                          <div style={{ padding: "0.4rem 0.55rem", borderRadius: "0.35rem", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}>
                            <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", marginBottom: "0.15rem" }}>🔐 Authenticity</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                              {analysis.authenticityMarkers.slice(0, 5).map((m: string, i: number) => (
                                <span key={i} style={{ fontSize: "0.58rem", padding: "1px 6px", borderRadius: "999px", background: "rgba(245,158,11,0.08)", color: "#f59e0b", fontWeight: 600 }}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Provenance */}
                      {analysis?.provenanceDetails?.length > 0 && (
                        <div style={{ padding: "0.4rem 0.55rem", borderRadius: "0.35rem", background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", marginBottom: "0.5rem" }}>
                          <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", marginBottom: "0.15rem" }}>🏛️ Provenance</div>
                          {analysis.provenanceDetails.slice(0, 3).map((p: string, i: number) => (
                            <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>• {p}</div>
                          ))}
                        </div>
                      )}

                      {/* People & Organizations */}
                      {(analysis?.people?.length > 0 || analysis?.organizations?.length > 0) && (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                          {analysis?.people?.slice(0, 4).map((p: string, i: number) => (
                            <span key={`p-${i}`} style={{ fontSize: "0.58rem", padding: "1px 6px", borderRadius: "999px", background: "rgba(0,188,212,0.08)", color: "var(--accent)", fontWeight: 600, border: "1px solid rgba(0,188,212,0.15)" }}>
                              👤 {p}
                            </span>
                          ))}
                          {analysis?.organizations?.slice(0, 4).map((o: string, i: number) => (
                            <span key={`o-${i}`} style={{ fontSize: "0.58rem", padding: "1px 6px", borderRadius: "999px", background: "var(--ghost-bg)", color: "var(--text-secondary)", fontWeight: 600, border: "1px solid var(--border-default)" }}>
                              🏢 {o}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Trust Score + Provider Performance Bar */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0.55rem", borderRadius: "0.35rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Trust Score</span>
                          <span style={{
                            fontSize: "0.85rem", fontWeight: 800,
                            color: (analysis?.trustScore ?? 0) >= 7 ? "#22c55e" : (analysis?.trustScore ?? 0) >= 4 ? "#f59e0b" : "#ef4444",
                          }}>
                            {analysis?.trustScore ?? "?"}/10
                          </span>
                        </div>
                        {provResults && (
                          <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                            {provResults.successCount}/{(provResults.successCount || 0) + (provResults.failCount || 0)} AIs • {provResults.agreementScore ?? 0}% agreement
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
    )}
    <style>{`
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    `}</style>
    </div>
  );
}
