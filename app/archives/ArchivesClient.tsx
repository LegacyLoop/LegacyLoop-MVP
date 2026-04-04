"use client";

import { useState } from "react";
import Link from "next/link";

type ItemRow = {
  id: string;
  title: string;
  photoUrl: string | null;
  status: string;
  valuationHigh: number | null;
  isAntique: boolean;
  hasStory: boolean;
};

type MockArchive = {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  format: string;
  size: string;
  downloadUrl: string;
};

const MOCK_ARCHIVES: MockArchive[] = [
  {
    id: "a1",
    name: "Grandma Dorothy's Estate — Full Archive",
    createdAt: "2026-02-28",
    itemCount: 12,
    format: "PDF + Digital",
    size: "48 MB",
    downloadUrl: "#",
  },
  {
    id: "a2",
    name: "Victorian Silver — Heritage Report",
    createdAt: "2026-03-01",
    itemCount: 1,
    format: "PDF",
    size: "3.2 MB",
    downloadUrl: "#",
  },
];

const FORMAT_OPTIONS = [
  {
    id: "pdf",
    icon: "📄",
    title: "Digital PDF",
    price: "Free",
    desc: "Full inventory with photos, stories, and AI valuations. Download instantly.",
    priceColor: "#16a34a",
  },
  {
    id: "print",
    icon: "📚",
    title: "Print Memory Book",
    price: "$25",
    desc: "Beautiful 8×10 printed book with your items, stories, and family history.",
    priceColor: "#0f766e",
  },
  {
    id: "usb",
    icon: "💾",
    title: "USB Archive Drive",
    price: "$35",
    desc: "All photos in full resolution, AI reports, and stories on a keepsake USB drive.",
    priceColor: "#7c3aed",
  },
];

interface Props {
  items: ItemRow[];
}

export default function ArchivesClient({ items }: Props) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeStories, setIncludeStories] = useState(true);
  const [includeValuations, setIncludeValuations] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [archives, setArchives] = useState<MockArchive[]>(MOCK_ARCHIVES);

  function toggleItem(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedItems(new Set(items.map((i) => i.id)));
  }

  function clearAll() {
    setSelectedItems(new Set());
  }

  async function generateArchive() {
    if (selectedItems.size === 0) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));
    setGenerating(false);
    setGenerated(true);
    const newArchive: MockArchive = {
      id: `a${Date.now()}`,
      name: `Estate Archive — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      createdAt: new Date().toISOString().split("T")[0],
      itemCount: selectedItems.size,
      format: FORMAT_OPTIONS.find((f) => f.id === selectedFormat)?.title ?? "PDF",
      size: `${(selectedItems.size * 1.8 + 2.4).toFixed(1)} MB`,
      downloadUrl: "#",
    };
    setArchives((prev) => [newArchive, ...prev]);
    setTimeout(() => setGenerated(false), 3000);
  }

  const CARD: React.CSSProperties = {
    background: "var(--bg-card-solid)",
    border: "1px solid var(--border-default)",
    borderRadius: "1.25rem",
    padding: "1.5rem",
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Preservation</div>
        <h1 className="h1 mt-2">Legacy Archives</h1>
        <p className="muted mt-1">
          Generate beautiful PDF reports, print books, or USB archives of your items — with photos, AI valuations, and family stories.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Left: builder */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Step 1: Select items */}
          <div style={CARD}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "24px", height: "24px", background: "#0f766e", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800, flexShrink: 0 }}>1</div>
                Select Items to Include
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button onClick={selectAll} style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "0.4rem", cursor: "pointer" }}>
                  Select All
                </button>
                <button onClick={clearAll} style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", background: "var(--ghost-bg)", color: "var(--text-muted)", border: "1px solid var(--border-default)", borderRadius: "0.4rem", cursor: "pointer" }}>
                  Clear
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
                <p style={{ marginBottom: "0.75rem" }}>No items yet. Add and analyze items to include them in archives.</p>
                <Link href="/items/new" className="btn-primary text-sm py-2 px-5 inline-flex">+ Add Items</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "360px", overflowY: "auto" }}>
                {items.map((item) => {
                  const isSelected = selectedItems.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.65rem 0.75rem",
                        background: isSelected ? "#f0fdf4" : "var(--ghost-bg)",
                        border: `1.5px solid ${isSelected ? "#86efac" : "var(--ghost-bg)"}`,
                        borderRadius: "0.75rem",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{
                        width: "20px", height: "20px", border: `2px solid ${isSelected ? "#16a34a" : "#d6d3d1"}`,
                        borderRadius: "4px", background: isSelected ? "#16a34a" : "var(--bg-card-solid)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {isSelected && <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 800 }}>✓</span>}
                      </div>
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "0.5rem", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", background: "var(--ghost-bg)", borderRadius: "0.5rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "1rem" }}>📷</span>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          {item.title}
                          {item.hasStory && <span style={{ fontSize: "0.6rem", background: "#f5f3ff", color: "#7c3aed", padding: "0.05rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>📖 Story</span>}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                          {item.status}
                          {item.valuationHigh && ` · Est. $${Math.round(item.valuationHigh).toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
              {selectedItems.size} of {items.length} item{items.length !== 1 ? "s" : ""} selected
            </div>
          </div>

          {/* Step 2: Include options */}
          <div style={CARD}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "24px", height: "24px", background: "#0f766e", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800, flexShrink: 0 }}>2</div>
              What to Include
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { key: "photos", label: "📷 Photos", desc: "Primary and additional photos", value: includePhotos, set: setIncludePhotos },
                { key: "stories", label: "📖 Stories", desc: "Family stories and memories", value: includeStories, set: setIncludeStories },
                { key: "valuations", label: "💰 AI Valuations", desc: "Pricing estimates and market comps", value: includeValuations, set: setIncludeValuations },
              ].map((opt) => (
                <div
                  key={opt.key}
                  onClick={() => opt.set(!opt.value)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: opt.value ? "#f0fdf4" : "var(--ghost-bg)", border: `1px solid ${opt.value ? "#86efac" : "var(--ghost-bg)"}`, borderRadius: "0.75rem", cursor: "pointer" }}
                >
                  <div style={{ width: "18px", height: "18px", border: `2px solid ${opt.value ? "#16a34a" : "#d6d3d1"}`, borderRadius: "4px", background: opt.value ? "#16a34a" : "var(--bg-card-solid)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {opt.value && <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 800 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>{opt.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Format */}
          <div style={CARD}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "24px", height: "24px", background: "#0f766e", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800, flexShrink: 0 }}>3</div>
              Choose Format
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {FORMAT_OPTIONS.map((fmt) => (
                <div
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0.9rem", background: selectedFormat === fmt.id ? "#f0fdf4" : "var(--ghost-bg)", border: `2px solid ${selectedFormat === fmt.id ? "#0f766e" : "var(--ghost-bg)"}`, borderRadius: "0.75rem", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{fmt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{fmt.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmt.desc}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: fmt.priceColor, fontSize: "0.9rem" }}>{fmt.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: summary + generate */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "sticky", top: "80px" }}>
          <div style={CARD}>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>Archive Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {[
                { label: "Items included", value: `${selectedItems.size} item${selectedItems.size !== 1 ? "s" : ""}` },
                { label: "Format", value: FORMAT_OPTIONS.find((f) => f.id === selectedFormat)?.title ?? "—" },
                { label: "Photos", value: includePhotos ? "✓ Yes" : "✗ No" },
                { label: "Stories", value: includeStories ? "✓ Yes" : "✗ No" },
                { label: "Valuations", value: includeValuations ? "✓ Yes" : "✗ No" },
                {
                  label: "Cost",
                  value: selectedFormat === "pdf" ? "Free" : selectedFormat === "print" ? "$25" : "$35",
                },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={generateArchive}
              disabled={selectedItems.size === 0 || generating}
              style={{
                width: "100%",
                padding: "0.85rem",
                background: generated ? "#16a34a" : selectedItems.size === 0 ? "#e7e5e4" : "#0f766e",
                color: selectedItems.size === 0 ? "var(--text-muted)" : "#fff",
                border: "none",
                borderRadius: "0.75rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: selectedItems.size === 0 || generating ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {generating ? "Generating…" : generated ? "✓ Archive Created!" : selectedFormat === "pdf" ? "📄 Generate PDF" : selectedFormat === "print" ? "📚 Order Print Book" : "💾 Order USB Archive"}
            </button>

            {selectedItems.size === 0 && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
                Select at least 1 item to continue
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div style={CARD}>
            <div className="section-title mb-3">Archive Stats</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Total items</span>
                <span style={{ fontWeight: 700 }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-muted)" }}>With stories</span>
                <span style={{ fontWeight: 700, color: "#7c3aed" }}>{items.filter((i) => i.hasStory).length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Antiques</span>
                <span style={{ fontWeight: 700, color: "#b45309" }}>{items.filter((i) => i.isAntique).length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Est. total value</span>
                <span style={{ fontWeight: 700, color: "#0f766e" }}>
                  ${items.reduce((s, i) => s + (i.valuationHigh ?? 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Previous archives */}
      {archives.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div className="section-title mb-4">Previous Archives</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {archives.map((archive) => (
              <div key={archive.id} style={CARD}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "1.75rem" }}>
                    {archive.format.includes("USB") ? "💾" : archive.format.includes("Print") ? "📚" : "📄"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{archive.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      {archive.itemCount} items · {archive.format} · {archive.size} · Created {new Date(archive.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a
                      href={archive.downloadUrl}
                      style={{ padding: "0.4rem 0.9rem", background: "#0f766e", color: "#fff", borderRadius: "0.6rem", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}
                    >
                      ↓ Download
                    </a>
                    <button
                      style={{ padding: "0.4rem 0.75rem", background: "var(--ghost-bg)", color: "var(--text-secondary)", border: "1px solid var(--border-default)", borderRadius: "0.6rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
