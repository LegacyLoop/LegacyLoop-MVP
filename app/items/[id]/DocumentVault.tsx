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
  createdAt: string;
}

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

  // Completeness
  const completedRecommended = RECOMMENDED.filter((r) => docTypes.has(r)).length;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid var(--border-default)",
      borderRadius: "0.85rem",
      padding: "1.25rem",
      marginTop: "1rem",
    }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            🗄️ Document Vault
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
            Upload documents to make every AI bot smarter
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {docs.length > 0 && (
            <span style={{
              padding: "3px 9px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700,
              background: "rgba(0,188,212,0.1)", color: "var(--accent)", border: "1px solid rgba(0,188,212,0.2)",
            }}>
              {docs.length} Document{docs.length !== 1 ? "s" : ""}
            </span>
          )}
          {hasAiAnalyzed && (
            <span style={{
              padding: "3px 9px", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700,
              background: "rgba(0,188,212,0.08)", color: "var(--accent)", border: "1px solid rgba(0,188,212,0.15)",
            }}>
              🤖 AI Analyzed
            </span>
          )}
        </div>
      </div>

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
                : "rgba(255,255,255,0.02)",
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
          background: "rgba(255,255,255,0.03)", color: "var(--text-primary)",
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
            : "2px dashed rgba(255,255,255,0.12)",
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

      {/* Hidden file inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.odt,.txt,.rtf,.xls,.xlsx,.csv"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

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
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)", cursor: "pointer",
          }}
        >
          📁 Browse Files
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* ── COMPLETENESS SCORE ── */}
      <div style={{
        background: "rgba(255,255,255,0.02)", borderRadius: "0.5rem",
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
          background: "rgba(255,255,255,0.06)",
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
          background: "rgba(255,255,255,0.02)", borderRadius: "0.5rem",
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
                  background: "rgba(255,255,255,0.03)",
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
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <span style={{
                        padding: "1px 6px", borderRadius: "10px", fontSize: "0.58rem",
                        fontWeight: 700, textTransform: "uppercase",
                        background: "rgba(0,188,212,0.1)", color: "var(--accent)",
                        border: "1px solid rgba(0,188,212,0.15)",
                      }}>
                        {catInfo?.icon} {catInfo?.label || doc.docType}
                      </span>
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

                {/* AI Summary expandable */}
                {doc.aiSummary && expandedSummary === doc.id && (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(0,188,212,0.04)",
                    border: "1px solid rgba(0,188,212,0.15)",
                    borderTop: "none",
                    borderRadius: "0 0 0.5rem 0.5rem",
                  }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.3rem" }}>
                      🤖 AI Document Summary
                    </div>
                    <div style={{
                      fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                    }}>
                      {doc.aiSummary}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
