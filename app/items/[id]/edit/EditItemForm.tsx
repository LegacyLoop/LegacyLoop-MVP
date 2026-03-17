"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

type SaleMethod = "LOCAL_PICKUP" | "ONLINE_SHIPPING" | "BOTH";

type PhotoData = { id: string; filePath: string; isPrimary: boolean; order: number };

type Initial = {
  id: string;
  title: string;
  description: string;
  condition: string;
  purchasePrice: number | null;
  purchaseDate: string; // YYYY-MM-DD or ""
  saleMethod: SaleMethod;
  saleZip: string;
  saleRadiusMi: number;
  shippingWeight: number | null;
  shippingLength: number | null;
  shippingWidth: number | null;
  shippingHeight: number | null;
  isFragile: boolean;
  shippingPreference: string;
};

const MAX_PHOTOS = 10;

export default function EditItemForm({ initial, initialPhotos = [] }: { initial: Initial; initialPhotos?: PhotoData[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"idle" | "save" | "save+analyze">("idle");
  const [error, setError] = useState("");

  // Photo management state
  const [photos, setPhotos] = useState<PhotoData[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const addPhotoInputRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const prevPhoto = () => setLightboxIndex((i) => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setLightboxIndex((i) => (i + 1) % photos.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const deletePhoto = async (photoId: string) => {
    if (!confirm("Remove this photo?")) return;
    setDeletingId(photoId);
    try {
      const res = await fetch(`/api/items/photos/${initial.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) {
        setPhotos((prev) => {
          const updated = prev.filter((p) => p.id !== photoId);
          // If we deleted the primary, the API auto-promotes next
          if (updated.length > 0 && !updated.some((p) => p.isPrimary)) {
            updated[0].isPrimary = true;
          }
          return updated;
        });
      }
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  const setCoverPhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/items/photos/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setPrimary: true, photoId }),
      });
      if (res.ok) {
        setPhotos((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === photoId })));
      }
    } catch { /* ignore */ }
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    setUploading(true);
    const formData = new FormData();
    const toUpload = Array.from(files).slice(0, remaining);
    toUpload.forEach((f) => formData.append("photos[]", f));

    try {
      const res = await fetch(`/api/items/photos/${initial.id}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        window.location.reload();
      } else {
        setError("Failed to upload photos. Please try again.");
      }
    } catch {
      setError("Failed to upload photos. Please try again.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = async (e: React.FormEvent | React.MouseEvent, rerun: boolean) => {
    e.preventDefault();
    setError("");
    setBusy(rerun ? "save+analyze" : "save");

    const formEl = formRef.current;
    if (!formEl) { setError("Form not found"); setBusy("idle"); return; }
    const form = new FormData(formEl);

    const payload = {
      title: String(form.get("title") || "").trim() || null,
      description: String(form.get("description") || "").trim() || null,
      condition: String(form.get("condition") || "").trim() || null,

      purchasePrice: (() => {
        const raw = String(form.get("purchasePrice") || "").trim();
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      })(),

      purchaseDate: (() => {
        const raw = String(form.get("purchaseDate") || "").trim();
        return raw || null;
      })(),

      saleMethod: (String(form.get("saleMethod") || "BOTH") as SaleMethod) || "BOTH",
      saleZip: String(form.get("saleZip") || "").trim() || null,

      saleRadiusMi: (() => {
        const raw = String(form.get("saleRadiusMi") || "").trim();
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      })(),

      shippingWeight: (() => { const r = String(form.get("shippingWeight") || "").trim(); return r ? Number(r) : null; })(),
      shippingLength: (() => { const r = String(form.get("shippingLength") || "").trim(); return r ? Number(r) : null; })(),
      shippingWidth: (() => { const r = String(form.get("shippingWidth") || "").trim(); return r ? Number(r) : null; })(),
      shippingHeight: (() => { const r = String(form.get("shippingHeight") || "").trim(); return r ? Number(r) : null; })(),
      isFragile: form.get("isFragile") === "on",
      shippingPreference: String(form.get("shippingPreference") || "BUYER_PAYS"),
    };

    const res = await fetch(`/api/items/update/${initial.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setBusy("idle");
      setError(await res.text());
      return;
    }

    if (rerun) {
      const a = await fetch(`/api/analyze/${initial.id}?force=1`, { method: "POST" });
      if (!a.ok) {
        setBusy("idle");
        setError(await a.text());
        return;
      }
    }

    setBusy("idle");
    router.push(`/items/${initial.id}`);
    router.refresh();
  };

  return (
    <div className="card p-8">
      {/* ── Photo Management ── */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          Item Photos
        </div>

        {photos.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", borderRadius: "0.75rem", border: "1px dashed var(--border-default)", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.4 }}>📷</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No photos yet — add photos to get started</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.75rem" }}>
            {photos.map((p, i) => (
              <div key={p.id} style={{ position: "relative", borderRadius: "0.6rem", overflow: "hidden", border: p.isPrimary ? "2px solid var(--accent)" : "1px solid var(--border-default)", background: "rgba(255,255,255,0.03)", cursor: "pointer" }} onClick={() => openLightbox(i)}>
                <img src={p.filePath} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                {/* Order number */}
                <span style={{ position: "absolute", bottom: "0.3rem", left: "0.3rem", fontSize: "0.6rem", fontWeight: 700, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "0.1rem 0.35rem", borderRadius: "9999px" }}>
                  {i + 1}
                </span>
                {/* Cover badge */}
                {p.isPrimary && (
                  <span style={{ position: "absolute", top: "0.3rem", left: "0.3rem", fontSize: "0.58rem", fontWeight: 700, background: "var(--accent)", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                    Cover
                  </span>
                )}
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => deletePhoto(p.id)}
                  disabled={deletingId === p.id}
                  style={{ position: "absolute", top: "0.3rem", right: "0.3rem", width: 22, height: 22, borderRadius: "50%", background: "rgba(220,38,38,0.85)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                >
                  {deletingId === p.id ? "…" : "✕"}
                </button>
                {/* Set as cover */}
                {!p.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setCoverPhoto(p.id)}
                    style={{ position: "absolute", bottom: "0.3rem", right: "0.3rem", fontSize: "0.55rem", fontWeight: 600, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", cursor: "pointer", padding: "0.15rem 0.35rem", borderRadius: "9999px" }}
                  >
                    Set Cover
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Photo count + tip */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {photos.length} of {MAX_PHOTOS} photos
            {photos.length >= MAX_PHOTOS && " — maximum reached"}
          </span>
          {photos.length > 0 && photos.length < 3 && (
            <span style={{ fontSize: "0.72rem", color: "var(--accent)" }}>
              Items with 3+ photos sell 40% faster — add more!
            </span>
          )}
        </div>

        {/* Add new photos */}
        {photos.length < MAX_PHOTOS && (
          <div style={{ marginTop: "0.75rem" }}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              style={{ display: "none" }}
              ref={addPhotoInputRef}
              onChange={handleAddPhotos}
            />
            <button
              type="button"
              onClick={() => addPhotoInputRef.current?.click()}
              disabled={uploading}
              style={{
                background: "rgba(0,188,212,0.1)",
                border: "1px solid rgba(0,188,212,0.3)",
                borderRadius: "10px",
                padding: "12px 20px",
                color: "#00bcd4",
                fontSize: "14px",
                fontWeight: 600,
                cursor: uploading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: uploading ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {uploading ? "Uploading…" : "📷 Add Photos"}
            </button>
          </div>
        )}
      </div>

      <form ref={formRef} className="space-y-6" onSubmit={(e) => onSubmit(e, false)}>
        <div>
          <label className="label">Item name (optional)</label>
          <input name="title" className="input" defaultValue={initial.title} />
        </div>

        <div>
          <label className="label">Condition (optional)</label>
          <select name="condition" className="input" defaultValue={initial.condition}>
            <option value="">Select…</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="For Parts">For Parts</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Selling method</label>
            <select name="saleMethod" className="input" defaultValue={initial.saleMethod}>
              <option value="BOTH">Local + Online</option>
              <option value="LOCAL_PICKUP">Local pickup only</option>
              <option value="ONLINE_SHIPPING">Online shipping only</option>
            </select>
          </div>

          <div>
            <label className="label">ZIP (optional)</label>
            <input name="saleZip" className="input" defaultValue={initial.saleZip} placeholder="04901" />
          </div>

          <div>
            <label className="label">Search radius (miles)</label>
            <input
              name="saleRadiusMi"
              type="number"
              className="input"
              defaultValue={initial.saleRadiusMi}
              min={1}
              max={5000}
            />
            <div className="muted text-sm mt-1">Use 1000+ for nationwide.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Purchase price (optional)</label>
            <input
              name="purchasePrice"
              type="number"
              step="0.01"
              className="input"
              defaultValue={initial.purchasePrice ?? ""}
              placeholder="100.00"
            />
          </div>
          <div>
            <label className="label">Purchase date (optional)</label>
            <input name="purchaseDate" type="date" className="input" defaultValue={initial.purchaseDate} />
          </div>
        </div>

        {/* Shipping Details */}
        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Shipping Details
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Weight (lbs)</label>
              <input name="shippingWeight" type="number" step="0.5" className="input" defaultValue={initial.shippingWeight ?? ""} placeholder="5" />
            </div>
            <div>
              <label className="label">Length (in)</label>
              <input name="shippingLength" type="number" className="input" defaultValue={initial.shippingLength ?? ""} placeholder="14" />
            </div>
            <div>
              <label className="label">Width (in)</label>
              <input name="shippingWidth" type="number" className="input" defaultValue={initial.shippingWidth ?? ""} placeholder="12" />
            </div>
            <div>
              <label className="label">Height (in)</label>
              <input name="shippingHeight" type="number" className="input" defaultValue={initial.shippingHeight ?? ""} placeholder="8" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer", minHeight: "2.75rem" }}>
              <input type="checkbox" name="isFragile" defaultChecked={initial.isFragile} style={{ accentColor: "var(--accent)", width: "1.125rem", height: "1.125rem" }} />
              Fragile item
            </label>
            <div className="flex items-center gap-2">
              {(["BUYER_PAYS", "FREE_SHIPPING", "LOCAL_ONLY"] as const).map((p) => (
                <label key={p} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer", minHeight: "2.75rem" }}>
                  <input type="radio" name="shippingPreference" value={p} defaultChecked={initial.shippingPreference === p} style={{ accentColor: "var(--accent)", width: "1.125rem", height: "1.125rem" }} />
                  {p === "BUYER_PAYS" ? "Buyer pays" : p === "FREE_SHIPPING" ? "Free shipping" : "Local only"}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            name="description"
            className="textarea"
            rows={4}
            defaultValue={initial.description}
            placeholder="Any details that help pricing and accuracy…"
          />
        </div>

        {error && (
          <div style={{
            borderRadius: "1rem",
            background: "rgba(220, 38, 38, 0.1)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            padding: "0.75rem 1rem",
            color: "#ef4444",
            fontSize: "0.9rem",
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={busy !== "idle"}
            className="btn-ghost w-full sm:w-auto px-6 py-3"
          >
            {busy === "save" ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            disabled={busy !== "idle"}
            onClick={(e) => onSubmit(e, true)}
            className="btn-primary w-full sm:w-auto px-6 py-3"
          >
            {busy === "save+analyze" ? "Saving & re-running..." : "Save + Re-run analysis"}
          </button>
        </div>
      </form>

      {/* Lightbox */}
      {lightboxOpen && photos.length > 0 && (
        <div
          onClick={closeLightbox}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Prev */}
            <button onClick={prevPhoto} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,188,212,0.3)", borderRadius: "50%", width: 44, height: 44, color: "#00bcd4", fontSize: "1.2rem", cursor: "pointer", flexShrink: 0 }}>
              ‹
            </button>

            {/* Main image */}
            <div style={{ position: "relative" }}>
              <img
                src={photos[lightboxIndex]?.filePath}
                alt={`Photo ${lightboxIndex + 1}`}
                style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: 12, objectFit: "contain", display: "block" }}
              />
              {/* Counter */}
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "white", borderRadius: 20, padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}>
                {lightboxIndex + 1} / {photos.length}
              </div>
              {/* Close */}
              <button onClick={closeLightbox} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 32, height: 32, color: "white", fontSize: "1rem", cursor: "pointer" }}>
                ✕
              </button>
              {/* Cover badge */}
              {photos[lightboxIndex]?.isPrimary && (
                <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,188,212,0.85)", color: "white", borderRadius: 6, padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 }}>
                  COVER
                </div>
              )}
              {/* Set as Cover */}
              {!photos[lightboxIndex]?.isPrimary && (
                <button
                  onClick={() => setCoverPhoto(photos[lightboxIndex].id)}
                  style={{ position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #00bcd4, #009688)", border: "none", borderRadius: 8, padding: "0.4rem 1rem", color: "white", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Set as Cover
                </button>
              )}
            </div>

            {/* Next */}
            <button onClick={nextPhoto} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,188,212,0.3)", borderRadius: "50%", width: 44, height: 44, color: "#00bcd4", fontSize: "1.2rem", cursor: "pointer", flexShrink: 0 }}>
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}