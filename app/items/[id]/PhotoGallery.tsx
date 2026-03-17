"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Photo = {
  id: string;
  filePath: string;
  order: number;
  isPrimary: boolean;
  caption: string | null;
};

interface Props {
  itemId: string;
  photos: Photo[];
  isOwner: boolean;
}

export default function PhotoGallery({ itemId, photos, isOwner }: Props) {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Sort: primary first, then by order
  const sorted = [...photos].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.order - b.order;
  });

  const active = sorted[activeIdx] ?? sorted[0];

  async function addPhotos(files: FileList) {
    const valid = Array.from(files).filter((f) => {
      if (f.type.startsWith("image/")) return true;
      const name = f.name.toLowerCase();
      return name.endsWith(".heic") || name.endsWith(".heif");
    }).slice(0, 10 - sorted.length);
    if (!valid.length) return;
    setUploading(true);
    const fd = new FormData();
    for (const f of valid) fd.append("photos[]", f);
    await fetch(`/api/items/photos/${itemId}`, { method: "POST", body: fd });
    setUploading(false);
    router.refresh();
  }

  async function deletePhoto(photoId: string) {
    if (!confirm("Remove this photo?")) return;
    setDeleting(photoId);
    await fetch(`/api/items/photos/${itemId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    setDeleting(null);
    if (activeIdx >= sorted.length - 1) setActiveIdx(Math.max(0, sorted.length - 2));
    router.refresh();
  }

  async function setPrimary(photoId: string) {
    await fetch(`/api/items/photos/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setPrimary: true, photoId }),
    });
    setActiveIdx(0);
    router.refresh();
  }

  if (sorted.length === 0) {
    return (
      <div className="mt-6 h-48 w-full flex items-center justify-center rounded-3xl" style={{ background: "var(--bg-card-hover)" }}>
        <span style={{ fontSize: "2.5rem", color: "var(--text-muted)" }}>📷</span>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Main photo */}
      <div style={{ position: "relative" }}>
        <img
          src={active.filePath}
          alt=""
          className="w-full rounded-3xl border object-cover shadow-sm"
          style={{ maxHeight: 460, objectFit: "cover" }}
        />

        {/* Photo counter */}
        {sorted.length > 1 && (
          <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "0.78rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
            {activeIdx + 1} / {sorted.length}
          </div>
        )}

        {/* Nav arrows */}
        {sorted.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "9999px", width: "2.25rem", height: "2.25rem", fontSize: "1rem", cursor: "pointer", opacity: activeIdx === 0 ? 0.3 : 1 }}
            >
              ‹
            </button>
            <button
              onClick={() => setActiveIdx((i) => Math.min(sorted.length - 1, i + 1))}
              disabled={activeIdx === sorted.length - 1}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "9999px", width: "2.25rem", height: "2.25rem", fontSize: "1rem", cursor: "pointer", opacity: activeIdx === sorted.length - 1 ? 0.3 : 1 }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Caption display */}
      {active?.caption && (
        <div style={{
          marginTop: "0.5rem",
          fontSize: "0.82rem",
          color: "var(--text-secondary)",
          fontStyle: "italic",
          padding: "0.35rem 0",
        }}>
          {active.caption}
        </div>
      )}

      {/* Thumbnail strip */}
      {sorted.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          {sorted.map((photo, i) => (
            <div
              key={photo.id}
              style={{ position: "relative", flexShrink: 0 }}
            >
              <img
                src={photo.filePath}
                alt=""
                onClick={() => setActiveIdx(i)}
                style={{
                  width: "64px", height: "64px",
                  objectFit: "cover",
                  borderRadius: "0.6rem",
                  border: i === activeIdx ? "2.5px solid var(--accent-theme)" : "2px solid var(--border-default)",
                  cursor: "pointer",
                  opacity: deleting === photo.id ? 0.4 : 1,
                }}
              />
              {photo.isPrimary && (
                <div style={{ position: "absolute", top: "2px", left: "2px", background: "var(--accent)", color: "#fff", fontSize: "0.5rem", fontWeight: 800, padding: "1px 4px", borderRadius: "4px" }}>
                  ★
                </div>
              )}
            </div>
          ))}

          {/* Add more photos button */}
          {isOwner && sorted.length < 10 && (
            <label style={{ width: "64px", height: "64px", border: "2px dashed var(--border-default)", borderRadius: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, background: "var(--bg-card-hover)" }}>
              <span style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>{uploading ? "⏳" : "+"}</span>
              <input type="file" accept="image/*,.heic,.heif" multiple style={{ display: "none" }} onChange={(e) => e.target.files && addPhotos(e.target.files)} disabled={uploading} />
            </label>
          )}
        </div>
      )}

      {/* Photo management for owner */}
      {isOwner && active && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          {!active.isPrimary && (
            <button onClick={() => setPrimary(active.id)} style={{ padding: "0.4rem 0.7rem", fontSize: "0.8rem", background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: "0.5rem", color: "var(--success-text)", cursor: "pointer" }}>
              ⭐ Set as primary
            </button>
          )}
          {sorted.length > 1 && (
            <button onClick={() => deletePhoto(active.id)} disabled={!!deleting} style={{ padding: "0.4rem 0.7rem", fontSize: "0.8rem", background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "0.5rem", color: "var(--error-text)", cursor: "pointer" }}>
              🗑 Remove this photo
            </button>
          )}
          {sorted.length === 1 && isOwner && (
            <label style={{ padding: "0.4rem 0.7rem", fontSize: "0.8rem", background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: "0.5rem", color: "var(--success-text)", cursor: "pointer" }}>
              📸 Add more photos
              <input type="file" accept="image/*,.heic,.heif" multiple style={{ display: "none" }} onChange={(e) => e.target.files && addPhotos(e.target.files)} disabled={uploading} />
            </label>
          )}
          {sorted.length > 1 && (
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              {sorted.length} photo{sorted.length !== 1 ? "s" : ""} · {sorted.length >= 3 ? "+confidence boost" : "add more for +AI accuracy"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
