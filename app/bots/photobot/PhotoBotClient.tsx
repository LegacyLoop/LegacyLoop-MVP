"use client";

import { useState } from "react";
import Link from "next/link";
import BotItemSelector from "../BotItemSelector";
import BotLoadingState from "@/app/components/BotLoadingState";

type PhotoData = {
  id: string;
  filePath: string;
  isPrimary: boolean;
  editResult: any | null;
};

type ItemData = {
  id: string;
  title: string;
  status: string;
  hasAnalysis: boolean;
  photos: PhotoData[];
};

export default function PhotoBotClient({ items }: { items: ItemData[] }) {
  const [selected, setSelected] = useState<ItemData | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editResultsByPhoto, setEditResultsByPhoto] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    for (const item of items) {
      for (const p of item.photos) {
        if (p.editResult) map[p.id] = p.editResult;
      }
    }
    return map;
  });

  function selectItem(item: ItemData) {
    setSelected(item);
    setSelectedPhotoId(null);
    setEditResult(null);
    setEditError(null);
    // Show existing edit result for primary photo if available
    const primary = item.photos.find((p) => p.isPrimary) || item.photos[0];
    if (primary && editResultsByPhoto[primary.id]) {
      setSelectedPhotoId(primary.id);
      setEditResult(editResultsByPhoto[primary.id]);
    }
  }

  function selectPhoto(photoId: string) {
    setSelectedPhotoId(photoId);
    setEditError(null);
    // If this photo already has an edit result, show it
    if (editResultsByPhoto[photoId]) {
      setEditResult(editResultsByPhoto[photoId]);
    } else {
      setEditResult(null);
    }
  }

  async function runClean() {
    if (!selected || !selectedPhotoId) return;
    setEditLoading(true);
    setEditError(null);
    setEditResult(null);
    try {
      const res = await fetch(`/api/photobot/edit/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: selectedPhotoId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setEditResult(data.result);
          setEditResultsByPhoto((prev) => ({ ...prev, [selectedPhotoId!]: data.result }));
        } else {
          setEditError("Photo edit returned no data.");
        }
      } else {
        const err = await res.json().catch(() => null);
        const rawError = err?.error || `Photo edit failed (${res.status})`;
        // Translate technical errors to friendly messages
        if (rawError.includes("bounding box") || rawError.includes("Vision could not")) {
          setEditError("Photo enhancement couldn't isolate the item. Try a photo with the item on a plain background, or use the full-image edit instead.");
        } else if (rawError.includes("Vision scan failed")) {
          setEditError("Our AI had trouble analyzing this photo. Try a clearer, well-lit photo or try again in a moment.");
        } else if (rawError.includes("DALL-E") || rawError.includes("Image edit failed")) {
          setEditError("The photo editor is temporarily unavailable. Please try again in a moment.");
        } else {
          setEditError(rawError);
        }
      }
    } catch (e: any) {
      setEditError(e?.message || "Network error");
    }
    setEditLoading(false);
  }

  const selectorItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    photo: item.photos[0]?.filePath ?? null,
    hasAnalysis: item.hasAnalysis,
  }));

  return (
    <div>
      {/* Item Selector */}
      <BotItemSelector
        items={selectorItems}
        selectedId={selected?.id ?? null}
        onSelect={(id) => {
          const item = items.find((i) => i.id === id);
          if (item) selectItem(item);
        }}
      />

      {!selected ? (
        <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Select an item above to use PhotoBot
        </div>
      ) : (
        <div style={{ marginTop: "1.5rem" }}>
          {/* ── Photo Editor Section ── */}
          <div style={{ width: "48px", height: "3px", background: "linear-gradient(90deg, #00bcd4, #009688)", borderRadius: "2px", marginBottom: "1rem" }} />
          <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.4rem", marginBottom: "0.4rem" }}>🧹 Photo Editor</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Auto-clean your listing photos. AI removes backgrounds, people, and clutter while keeping your item 100% untouched.
          </div>

          {/* Iron rule banner */}
          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "1.5rem", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>🛡️</span>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6 }}>
              The sale item is always protected. Our AI identifies and shields the item from any edits — only the background and surroundings are ever touched. Item condition is preserved exactly as photographed.
            </div>
          </div>

          {selected.photos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No photos uploaded for this item. <Link href={`/items/${selected.id}/edit`} style={{ color: "#00bcd4" }}>Add photos</Link>
            </div>
          ) : (
            <>
              {/* Photo grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {selected.photos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectPhoto(p.id)}
                    style={{
                      position: "relative", borderRadius: "10px", overflow: "hidden", cursor: "pointer",
                      border: selectedPhotoId === p.id ? "2px solid #00bcd4" : "2px solid transparent",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <img src={p.filePath} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                    {selectedPhotoId === p.id && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,188,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#00bcd4", fontSize: "1.5rem", fontWeight: 700 }}>✓</span>
                      </div>
                    )}
                    {editResultsByPhoto[p.id] && (
                      <span style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(16,185,129,0.9)", color: "white", borderRadius: "4px", padding: "0.15rem 0.4rem", fontSize: "0.65rem", fontWeight: 700 }}>
                        Cleaned
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {editError && (
                <div style={{ padding: "0.6rem 0.85rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: "0.82rem", color: "#ef4444", marginBottom: "1rem" }}>
                  {editError}
                </div>
              )}

              {/* Auto-Clean button */}
              {!editLoading && !editResult && (
                <button
                  onClick={runClean}
                  disabled={!selectedPhotoId}
                  style={{
                    background: selectedPhotoId ? "linear-gradient(135deg, #00bcd4, #009688)" : "var(--ghost-bg)",
                    border: "none", borderRadius: "12px", padding: "0.75rem 2rem",
                    color: selectedPhotoId ? "white" : "var(--text-muted)",
                    fontWeight: 700, fontSize: "0.95rem",
                    cursor: selectedPhotoId ? "pointer" : "default",
                    display: "block", marginBottom: "1.5rem",
                    boxShadow: selectedPhotoId ? "0 4px 15px rgba(0,188,212,0.25)" : "none",
                    opacity: selectedPhotoId ? 1 : 0.5,
                  }}
                >
                  🧹 Auto-Clean Selected Photo · 1 cr
                </button>
              )}

              {/* Loading */}
              {editLoading && (
                <BotLoadingState botName="PhotoBot" />
              )}

              {/* Results */}
              {editResult && !editLoading && (
                <div>
                  {/* Before / After */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    {/* Original */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "10px", overflow: "hidden" }}>
                      <img src={editResult.originalPhotoPath} alt="Original" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                      <div style={{ padding: "0.5rem 0.65rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600 }}>Original</div>
                    </div>
                    {/* Cleaned */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "10px", overflow: "hidden" }}>
                      <img src={editResult.editedPhotoUrl} alt="Cleaned" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                      <div style={{ padding: "0.5rem 0.65rem", color: "#00bcd4", fontSize: "0.78rem", fontWeight: 600 }}>Cleaned</div>
                    </div>
                  </div>

                  {/* What was removed */}
                  <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
                    <div style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>✓ What was removed:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {(editResult.distractingElements || []).map((el: string, i: number) => (
                        <span key={i} style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "20px", padding: "0.2rem 0.65rem", color: "#10b981", fontSize: "0.78rem" }}>
                          {el}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Item protection badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                    <span style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "20px", padding: "0.2rem 0.65rem", color: "#f59e0b", fontSize: "0.78rem", fontWeight: 600 }}>
                      🛡️ Item condition untouched — only surroundings edited
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button style={{ background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none", borderRadius: "10px", padding: "0.6rem 1.5rem", color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                      Set as Cover Photo
                    </button>
                    <button
                      onClick={() => { setEditResult(null); setSelectedPhotoId(null); }}
                      style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "0.6rem 1.25rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                    >
                      Clean Another
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
