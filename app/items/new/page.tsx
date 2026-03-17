"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type SaleOption = {
  id: string;
  name: string;
  type: string;
  status: string;
  itemCount: number;
  startDate: string | null;
};

const SALE_TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  ESTATE_SALE: { emoji: "\uD83C\uDFE1", label: "Estate Sale", color: "#a855f7" },
  GARAGE_SALE: { emoji: "\uD83C\uDFF7\uFE0F", label: "Garage Sale", color: "#00bcd4" },
  MOVING_SALE: { emoji: "\uD83D\uDE9B", label: "Moving Sale", color: "#f97316" },
  YARD_SALE:   { emoji: "\uD83C\uDF3F", label: "Yard Sale", color: "#22c55e" },
  DOWNSIZING:  { emoji: "\uD83D\uDCE6", label: "Downsizing Sale", color: "#eab308" },
  ONLINE_SALE: { emoji: "\uD83D\uDECD\uFE0F", label: "Online Sale Only", color: "#3b82f6" },
};

const getSaleMeta = (type: string) => SALE_TYPE_META[type] || SALE_TYPE_META.ESTATE_SALE;


const CATEGORIES = [
  "Furniture",
  "Antiques",
  "Electronics",
  "Clothing & Accessories",
  "Art & Collectibles",
  "Kitchen & Dining",
  "Tools & Hardware",
  "Books & Media",
  "Jewelry & Watches",
  "Toys & Games",
  "Sports & Outdoors",
  "Home Decor",
  "Vehicles & Parts",
  "Musical Instruments",
  "Coins & Currency",
  "Pottery & Glass",
  "Textiles & Linens",
  "Militaria",
  "Other",
];

/* ── Inline input/select/textarea style helper ── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 500,
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  minHeight: "46px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  marginBottom: "6px",
  letterSpacing: "0.01em",
};

const sectionHeadStyle: React.CSSProperties = {
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.35)",
  fontWeight: 700,
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "20px",
  padding: "24px",
  marginBottom: "16px",
};

function focusHandler(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(0,188,212,0.5)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,188,212,0.08)";
}
function blurHandler(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
  e.currentTarget.style.boxShadow = "none";
}

export default function NewItemPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const titleRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<Record<string, "pending" | "uploading" | "done" | "error">>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [sizeWarning, setSizeWarning] = useState("");
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const [hoveredThumb, setHoveredThumb] = useState<number | null>(null);

  // Sync object URL previews with photos array
  useEffect(() => {
    // Revoke old URLs
    previews.forEach((url) => URL.revokeObjectURL(url));
    const next = photos.map((f) => URL.createObjectURL(f));
    setPreviews(next);
    return () => { next.forEach((url) => URL.revokeObjectURL(url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const allValid = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    const oversized = allValid.filter((f) => f.size > 15 * 1024 * 1024);
    const validFiles = allValid.filter((f) => f.size <= 15 * 1024 * 1024);
    if (oversized.length > 0) {
      setSizeWarning(`${oversized.length} photo(s) over 15MB were skipped. Try a smaller size.`);
    } else {
      setSizeWarning("");
    }
    setPhotos((prev) => [...prev, ...validFiles].slice(0, 10));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer.files.length) return;
    const newFiles = Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
      .filter((f) => f.size <= 15 * 1024 * 1024);
    setPhotos((prev) => [...prev, ...newFiles].slice(0, 10));
  };

  // Sale assignment state
  const [sales, setSales] = useState<SaleOption[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState("");

  // ── Section 1: Item Details ──
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [yearEra, setYearEra] = useState("");

  // ── Section 2: Description & Evaluation ──
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");

  // ── Section 3: Listing & Sale Assignment ──
  const [saleMethod, setSaleMethod] = useState("BOTH");
  const [startingPrice, setStartingPrice] = useState("");
  const [saleZip, setSaleZip] = useState("");
  const [saleRadius, setSaleRadius] = useState("250");

  // ── Section 4: Additional Details ──
  const [ageEstimate, setAgeEstimate] = useState("");
  const [functionality, setFunctionality] = useState("");
  const [numOwners, setNumOwners] = useState("Unknown");
  const [packaging, setPackaging] = useState("");
  const [damageRepairs, setDamageRepairs] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [shippingWeight, setShippingWeight] = useState("");
  const [shippingLength, setShippingLength] = useState("");
  const [shippingWidth, setShippingWidth] = useState("");
  const [shippingHeight, setShippingHeight] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [upc, setUpc] = useState("");

  // Fetch user's active sales on mount
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: any[]) => {
        const active = data
          .filter((p: any) => p.status === "DRAFT" || p.status === "ACTIVE")
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            status: p.status,
            itemCount: Array.isArray(p.items) ? p.items.length : 0,
            startDate: p.startDate,
          }));
        setSales(active);
      })
      .catch(() => {})
      .finally(() => setSalesLoading(false));
  }, []);

  // Clipboard paste support (Cmd+V / Ctrl+V adds images)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageFiles = items
        .filter((i) => i.type.startsWith("image/"))
        .map((i) => i.getAsFile())
        .filter(Boolean) as File[];
      if (imageFiles.length > 0) {
        setPhotos((prev) => [...prev, ...imageFiles].slice(0, 10));
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // SessionStorage backup/restore for form fields
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("newItemForm");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.category) setCategory(d.category);
        if (d.condition) setCondition(d.condition);
        if (d.brand) setBrand(d.brand);
        if (d.model) setModel(d.model);
        if (d.yearEra) setYearEra(d.yearEra);
        if (d.saleMethod) setSaleMethod(d.saleMethod);
        if (d.saleZip) setSaleZip(d.saleZip);
        if (d.saleRadius) setSaleRadius(d.saleRadius);
        if (d.description) setDescription(d.description);
        if (d.story) setStory(d.story);
        if (d.startingPrice) setStartingPrice(d.startingPrice);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const data = { title, category, condition, brand, model, yearEra, saleMethod, saleZip, saleRadius, description, story, startingPrice };
    try { sessionStorage.setItem("newItemForm", JSON.stringify(data)); } catch {}
  }, [title, category, condition, brand, model, yearEra, saleMethod, saleZip, saleRadius, description, story, startingPrice]);


  const retryUpload = async (photo: File, itemId: string | null) => {
    if (!itemId) return;
    const key = `${photo.name}-${photo.size}`;
    setUploadStatus((prev) => ({ ...prev, [key]: "uploading" }));
    setUploadProgress((prev) => ({ ...prev, [key]: 0 }));
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({ ...prev, [key]: Math.min((prev[key] || 0) + 20, 80) }));
      }, 200);
      const fd = new FormData();
      fd.append("photos[]", photo);
      const res = await fetch(`/api/items/photos/${itemId}`, { method: "POST", body: fd });
      clearInterval(progressInterval);
      if (res.ok) {
        setUploadProgress((prev) => ({ ...prev, [key]: 100 }));
        setUploadStatus((prev) => ({ ...prev, [key]: "done" }));
      } else {
        throw new Error("Upload failed");
      }
    } catch {
      setUploadStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      setError("Please add at least one photo.");
      return;
    }
    setBusy(true);
    setError("");

    try {
      // Build description with context parts (existing API pattern)
      const descParts: string[] = [];
      if (description) descParts.push(description);
      if (category) descParts.push(`[Category: ${category}]`);
      if (brand) descParts.push(`[Brand: ${brand}]`);
      if (model) descParts.push(`[Model: ${model}]`);
      if (yearEra) descParts.push(`[Year/Era: ${yearEra}]`);
      if (story) descParts.push(`[Provenance: ${story}]`);
      if (upc) descParts.push(`[UPC: ${upc}]`);
      const descString = descParts.length > 0 ? descParts.join(" | ") : "";

      const formData = new FormData();
      for (const p of photos) formData.append("photos[]", p);
      if (title) formData.append("title", title);
      if (condition) formData.append("condition", condition);
      if (descString) formData.append("description", descString);
      formData.append("saleMethod", saleMethod);
      if (saleZip) formData.append("saleZip", saleZip);
      formData.append("saleRadiusMi", saleRadius);
      if (ageEstimate) formData.append("ageEstimate", ageEstimate);
      if (functionality) formData.append("functionality", functionality);
      if (numOwners && numOwners !== "Unknown") formData.append("numOwners", numOwners);
      if (packaging) formData.append("packaging", packaging);
      if (damageRepairs) formData.append("damageRepairs", damageRepairs);
      if (purchasePrice) formData.append("purchasePrice", purchasePrice);
      if (purchaseDate) formData.append("purchaseDate", purchaseDate);

      // Start upload progress tracking
      const statusInit: Record<string, "uploading"> = {};
      const progressInit: Record<string, number> = {};
      for (const p of photos) {
        const key = `${p.name}-${p.size}`;
        statusInit[key] = "uploading";
        progressInit[key] = 0;
      }
      setUploadStatus(statusInit);
      setUploadProgress(progressInit);

      // Simulate per-photo progress during upload
      let progressTick = 0;
      const progressInterval = setInterval(() => {
        progressTick++;
        setUploadProgress((prev) => {
          const next = { ...prev };
          const keys = Object.keys(next);
          for (let pi = 0; pi < keys.length; pi++) {
            const target = Math.min(((progressTick + pi * 2) * 12), 80);
            next[keys[pi]] = Math.min(target, 80);
          }
          return next;
        });
      }, 250);

      const res = await fetch("/api/items/create", { method: "POST", body: formData });
      clearInterval(progressInterval);

      if (!res.ok) {
        let msg = "";
        try { msg = await res.text(); } catch {}
        // Mark all as error
        setUploadStatus((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(next)) next[k] = "error";
          return next;
        });
        setError(msg || `Save failed (${res.status}). Please try again.`);
        setBusy(false);
        return;
      }

      // Mark all photos as done
      setUploadStatus((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) next[k] = "done";
        return next;
      });
      setUploadProgress((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) next[k] = 100;
        return next;
      });

      let data: { id?: string; itemId?: string };
      try {
        data = await res.json();
      } catch {
        setError("Server returned an invalid response. Please try again.");
        setBusy(false);
        return;
      }

      const id = data.id ?? data.itemId;
      if (!id) {
        setError("Item was created but no ID was returned. Please check your dashboard.");
        setBusy(false);
        return;
      }
      setCreatedItemId(id);

      // If a sale was selected, assign the item to it
      if (selectedSaleId) {
        try {
          await fetch(`/api/projects/${selectedSaleId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addItemId: id }),
          });
        } catch {
          // Item was created — sale assignment is best-effort
        }
      }

      // Set starting price via status API (best-effort)
      if (startingPrice) {
        const priceNum = Number(startingPrice);
        if (Number.isFinite(priceNum) && priceNum > 0) {
          fetch(`/api/items/status/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingPrice: priceNum }),
          }).catch(() => null);
        }
      }

      // Set shipping dimensions via update API (best-effort)
      const hasShipping = shippingWeight || shippingLength || shippingWidth || shippingHeight || isFragile;
      if (hasShipping) {
        fetch(`/api/items/update/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(shippingWeight ? { shippingWeight: Number(shippingWeight) } : {}),
            ...(shippingLength ? { shippingLength: Number(shippingLength) } : {}),
            ...(shippingWidth ? { shippingWidth: Number(shippingWidth) } : {}),
            ...(shippingHeight ? { shippingHeight: Number(shippingHeight) } : {}),
            ...(isFragile ? { isFragile: true } : {}),
          }),
        }).catch(() => null);
      }

      // Clear session storage on success
      try { sessionStorage.removeItem("newItemForm"); } catch {}

      router.push(`/items/${id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Item save error:", err);
      setError(err?.message || "An unexpected error occurred. Please try again.");
      setBusy(false);
    }
  };


  return (
    <div style={{
      maxWidth: "680px",
      margin: "0 auto",
      padding: "0 16px 80px",
    }}>
      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard")}>Dashboard</span>
        <span style={{ margin: "0 6px" }}>/</span>
        <span>New Item</span>
      </div>

      {/* ── Header ── */}
      <h1 style={{
        fontSize: "28px",
        fontWeight: 800,
        color: "#fff",
        letterSpacing: "-0.02em",
        marginBottom: "6px",
      }}>
        Add New Item
      </h1>

      <div style={{ marginBottom: "24px" }} />

      {/* ── PHOTOS ── */}
      <div>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "22px",
          marginBottom: "16px",
        }}>
          {/* Section label */}
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "rgba(0,188,212,0.85)",
            textTransform: "uppercase" as const,
            marginBottom: "8px",
            display: "block",
          }}>
            📸 Photos
          </span>

          {/* Counter */}
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "14px", display: "block" }}>
            {photos.length} of 10 photos used
          </span>

          {/* Hidden inputs */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/gif"
            capture="environment"
            multiple
            style={{ display: "none" }}
            onChange={handleFilesAdded}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/gif"
            multiple
            style={{ display: "none" }}
            onChange={handleFilesAdded}
          />

          {/* Drop zone */}
          <div
            onClick={() => galleryRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onDrop={handleDrop}
            style={{
              background: dragOver ? "rgba(0,188,212,0.06)" : "rgba(255,255,255,0.02)",
              border: dragOver ? "2px dashed rgba(0,188,212,0.65)" : "2px dashed rgba(0,188,212,0.25)",
              borderRadius: "14px",
              padding: "32px 20px",
              textAlign: "center" as const,
              cursor: "pointer",
              transition: "all 0.2s ease",
              minHeight: "140px",
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              boxShadow: dragOver ? "0 0 30px rgba(0,188,212,0.15)" : "none",
              animation: dragOver ? "pulse-border 1s ease infinite" : "none",
            }}
          >
            <span style={{ fontSize: "32px", opacity: dragOver ? 1 : 0.5, transition: "opacity 0.2s ease" }}>📷</span>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "white" }}>
              Drop photos here or tap to choose
            </span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
              JPG, PNG, WEBP, HEIC &middot; Up to 10 photos &middot; Max 15MB each
            </span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "2px" }}>
              or paste from clipboard (&#8984;V)
            </span>
          </div>

          {/* Camera + Gallery buttons */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginTop: "14px",
          }}>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              style={{
                background: "linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)",
                border: "none",
                borderRadius: "14px",
                padding: "16px 20px",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                minHeight: "52px",
                boxShadow: "0 4px 16px rgba(0,188,212,0.2)",
                transition: "all 0.2s ease",
              }}
            >
              📷 Take a Photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "16px 20px",
                color: "rgba(255,255,255,0.85)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                minHeight: "52px",
                transition: "all 0.2s ease",
              }}
            >
              🖼️ Choose from Library
            </button>
          </div>

          {/* Size warning */}
          {sizeWarning && (
            <div style={{
              marginTop: "10px",
              padding: "10px 14px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px",
              fontSize: "13px",
              color: "rgba(239,68,68,0.85)",
            }}>
              {sizeWarning}
            </div>
          )}

          {/* Thumbnail grid */}
          {photos.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              marginTop: "16px",
            }}>
              {photos.map((photo, i) => {
                const photoKey = `${photo.name}-${photo.size}`;
                const status = uploadStatus[photoKey];
                const progress = uploadProgress[photoKey] || 0;
                return (
                <div
                  key={`${photo.name}-${photo.size}-${i}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("[data-remove]")) return;
                    if (i === 0) return;
                    setPhotos((prev) => {
                      const updated = [...prev];
                      const [selected] = updated.splice(i, 1);
                      updated.unshift(selected);
                      return updated;
                    });
                  }}
                  onMouseEnter={() => setHoveredThumb(i)}
                  onMouseLeave={() => setHoveredThumb(null)}
                  style={{
                    position: "relative" as const,
                    borderRadius: "10px",
                    overflow: "hidden",
                    aspectRatio: "1 / 1",
                    background: "rgba(255,255,255,0.05)",
                    border: i === 0 ? "2px solid #00bcd4" : "1px solid rgba(255,255,255,0.08)",
                    cursor: i === 0 ? "default" : "pointer",
                    animation: "thumb-in 0.25s ease forwards",
                    animationDelay: `${i * 0.04}s`,
                    opacity: 0,
                  }}
                >
                  {previews[i] ? (
                    <img
                      src={previews[i]}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" as const, display: "block" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "rgba(0,188,212,0.08)", borderRadius: "10px" }} />
                  )}
                  {/* COVER badge */}
                  {i === 0 && (
                    <span style={{
                      position: "absolute" as const,
                      top: "7px",
                      left: "7px",
                      background: "#00bcd4",
                      color: "white",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "5px",
                      letterSpacing: "0.06em",
                    }}>
                      COVER
                    </span>
                  )}
                  {/* Set Cover hover overlay */}
                  {i !== 0 && hoveredThumb === i && (
                    <div style={{
                      position: "absolute" as const,
                      inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "opacity 0.15s ease",
                    }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "white" }}>
                        ★ Set Cover
                      </span>
                    </div>
                  )}
                  {/* Upload progress bar */}
                  {status && (
                    <div style={{
                      position: "absolute" as const,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "3px",
                      background: "rgba(0,0,0,0.4)",
                      borderRadius: "0 0 10px 10px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: status === "error" ? "#ef4444" : status === "done" ? "#22c55e" : "#00bcd4",
                        transition: "width 0.3s ease",
                        borderRadius: "0 0 10px 10px",
                      }} />
                    </div>
                  )}
                  {/* Success checkmark */}
                  {status === "done" && (
                    <div style={{
                      position: "absolute" as const,
                      top: "6px",
                      right: i === 0 ? "32px" : "6px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      color: "white",
                      fontWeight: 700,
                    }}>
                      ✓
                    </div>
                  )}
                  {/* Error + retry overlay */}
                  {status === "error" && (
                    <div style={{
                      position: "absolute" as const,
                      inset: 0,
                      background: "rgba(239,68,68,0.7)",
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "10px",
                      gap: "4px",
                    }}>
                      <span style={{ fontSize: "11px", color: "white", fontWeight: 600 }}>Upload failed</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); retryUpload(photo, createdItemId); }}
                        style={{
                          background: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "3px 10px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          color: "#ef4444",
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    data-remove="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotos((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    style={{
                      position: "absolute" as const,
                      top: "5px",
                      right: "5px",
                      background: "rgba(0,0,0,0.7)",
                      border: "none",
                      color: "white",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
                );
              })}
            </div>
          )}

          {/* Upload status counter */}
          {Object.keys(uploadStatus).length > 0 && (
            <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 600, textAlign: "center" as const }}>
              {(() => {
                const doneCount = Object.values(uploadStatus).filter((s) => s === "done").length;
                const errorCount = Object.values(uploadStatus).filter((s) => s === "error").length;
                if (errorCount > 0) return <span style={{ color: "#ef4444" }}>{errorCount} failed — tap to retry</span>;
                if (doneCount === photos.length && doneCount > 0) return <span style={{ color: "#22c55e" }}>All {photos.length} photos uploaded ✓</span>;
                return <span style={{ color: "rgba(0,188,212,0.8)" }}>{doneCount} of {photos.length} uploaded</span>;
              })()}
            </div>
          )}
        </div>

      </div>

      {/* ── DETAILS FORM ── */}
      <form
        onSubmit={onSubmit}
        style={{
          marginTop: "24px",
        }}
      >

          {/* ═══ SECTION 1: Item Details ═══ */}
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>
              <span style={{ fontSize: "15px" }}>📋</span> Item Details
            </div>

            {/* Title — prominent */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Item name (optional — AI will suggest one)</label>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you selling?"
                style={{ ...inputStyle, fontSize: "18px", fontWeight: 600 }}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>

            {/* Category + Condition */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                  <option value="">AI will detect</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                  <option value="">AI will assess</option>
                  <option value="Mint">Mint</option>
                  <option value="Near Mint">Near Mint</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Below Average">Below Average</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Parts Only">Parts Only</option>
                </select>
              </div>
            </div>

            {/* Brand + Model + Year/Era */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Brand / Maker</label>
                <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Sony, Ethan Allen..." style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              <div>
                <label style={labelStyle}>Model / Series</label>
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="WH-1000XM5..." style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              <div>
                <label style={labelStyle}>Year / Era</label>
                <input value={yearEra} onChange={(e) => setYearEra(e.target.value)} placeholder="1970s, 2019..." style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
            </div>
          </div>

          {/* ═══ SECTION 2: Description & Evaluation ═══ */}
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>
              <span style={{ fontSize: "15px" }}>📝</span> Description & Evaluation
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Description / Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item — age, condition details, any flaws, what makes it special..."
                rows={4}
                style={{
                  ...inputStyle,
                  resize: "vertical" as const,
                  minHeight: "100px",
                }}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>

            <div>
              <label style={labelStyle}>Provenance / Story</label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Where did this come from? Estate detail, family history, how you acquired it..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical" as const,
                  minHeight: "80px",
                }}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
                Items with a story sell for 20-30% more on average
              </div>
            </div>
          </div>

          {/* ═══ SECTION 3: Listing & Sale Assignment ═══ */}
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>
              <span style={{ fontSize: "15px" }}>🏷️</span> Listing & Sale Assignment
            </div>

            {/* Selling method + Starting price */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Selling method</label>
                <select value={saleMethod} onChange={(e) => setSaleMethod(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                  <option value="BOTH">Local + Online</option>
                  <option value="LOCAL_PICKUP">Local pickup only</option>
                  <option value="ONLINE_SHIPPING">Online shipping only</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Starting price (optional)</label>
                <div style={{ position: "relative" as const }}>
                  <span style={{
                    position: "absolute" as const,
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "15px",
                    fontWeight: 600,
                    pointerEvents: "none" as const,
                  }}>$</span>
                  <input
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave blank for AI pricing"
                    style={{ ...inputStyle, paddingLeft: "28px" }}
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                  />
                </div>
              </div>
            </div>

            {/* ZIP + Radius */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Your ZIP code</label>
                <input value={saleZip} onChange={(e) => setSaleZip(e.target.value)} placeholder="04901" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              </div>
              <div>
                <label style={labelStyle}>Search radius (miles)</label>
                <input value={saleRadius} onChange={(e) => setSaleRadius(e.target.value)} type="number" min={10} max={5000} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
                  Use 1000+ for nationwide
                </div>
              </div>
            </div>

            {/* Sale assignment */}
            {!salesLoading && sales.length > 0 && (
              <div>
                <label style={{ ...labelStyle, marginBottom: "10px" }}>Assign to a sale (optional)</label>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                  {/* None option */}
                  <button
                    type="button"
                    onClick={() => setSelectedSaleId("")}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px", borderRadius: "12px",
                      border: `2px solid ${!selectedSaleId ? "#00bcd4" : "rgba(255,255,255,0.08)"}`,
                      background: !selectedSaleId ? "rgba(0,188,212,0.06)" : "transparent",
                      cursor: "pointer", textAlign: "left" as const, width: "100%",
                      transition: "all 0.15s ease", minHeight: "46px",
                    }}
                  >
                    <span style={{ fontSize: "16px", opacity: 0.5 }}>{"\u2014"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>No Sale — Individual Item</div>
                    </div>
                    {!selectedSaleId && <span style={{ color: "#00bcd4", fontWeight: 700, fontSize: "14px" }}>✓</span>}
                  </button>

                  {sales.map((sale) => {
                    const meta = getSaleMeta(sale.type);
                    const selected = selectedSaleId === sale.id;
                    return (
                      <button
                        type="button"
                        key={sale.id}
                        onClick={() => setSelectedSaleId(sale.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "10px 14px", borderRadius: "12px",
                          border: `2px solid ${selected ? meta.color : "rgba(255,255,255,0.08)"}`,
                          background: selected ? `${meta.color}10` : "transparent",
                          cursor: "pointer", textAlign: "left" as const, width: "100%",
                          transition: "all 0.15s ease", minHeight: "46px",
                        }}
                      >
                        <span style={{ fontSize: "18px" }}>{meta.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{sale.name}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                            {meta.label} · {sale.itemCount} item{sale.itemCount !== 1 ? "s" : ""}
                            {sale.startDate && ` · ${new Date(sale.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                          </div>
                        </div>
                        {selected && <span style={{ color: meta.color, fontWeight: 700, fontSize: "14px" }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ═══ SECTION 4: Additional Details (collapsible) ═══ */}
          <details style={{
            ...cardStyle,
            overflow: "hidden",
            padding: 0,
          }}>
            <summary style={{
              padding: "18px 24px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "15px" }}>📦</span> Additional Details (optional — helps AI accuracy)
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>▼</span>
            </summary>

            <div style={{ padding: "0 24px 24px" }}>
              {/* Age, functionality, owners */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={labelStyle}>Approximate age</label>
                  <select value={ageEstimate} onChange={(e) => setAgeEstimate(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                    <option value="">Unknown</option>
                    <option value="under_1_year">Under 1 year</option>
                    <option value="1_5_years">1–5 years</option>
                    <option value="5_20_years">5–20 years</option>
                    <option value="20_50_years">20–50 years</option>
                    <option value="50_100_years">50–100 years</option>
                    <option value="over_100_years">Over 100 years</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Does it work?</label>
                  <select value={functionality} onChange={(e) => setFunctionality(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                    <option value="">Not sure</option>
                    <option value="works_perfectly">Works perfectly</option>
                    <option value="works_with_issues">Minor issues</option>
                    <option value="needs_repair">Needs repair</option>
                    <option value="not_functional">Not functional</option>
                    <option value="not_applicable">N/A (decor, art)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Owners</label>
                  <select value={numOwners} onChange={(e) => setNumOwners(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                    <option value="Unknown">Unknown</option>
                    <option value="1">1 (original)</option>
                    <option value="2">2</option>
                    <option value="3+">3+</option>
                  </select>
                </div>
              </div>

              {/* Packaging + damage */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={labelStyle}>Packaging</label>
                  <select value={packaging} onChange={(e) => setPackaging(e.target.value)} style={inputStyle} onFocus={focusHandler} onBlur={blurHandler}>
                    <option value="">Not sure</option>
                    <option value="original_box">Original box</option>
                    <option value="original_complete">Box + manuals</option>
                    <option value="partial_packaging">Some packaging</option>
                    <option value="no_packaging">No packaging</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Known damage or repairs</label>
                  <input value={damageRepairs} onChange={(e) => setDamageRepairs(e.target.value)} placeholder="scratch, reglued leg..." style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>

              {/* Purchase history */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={labelStyle}>Purchase price</label>
                  <input value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} type="number" step="0.01" placeholder="100.00" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
                <div>
                  <label style={labelStyle}>Purchase date</label>
                  <input value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} type="date" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>

              {/* Dimensions + Weight */}
              <div style={{
                fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase", letterSpacing: "0.08em",
                marginBottom: "10px", marginTop: "6px",
              }}>Shipping dimensions</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={labelStyle}>Length (in)</label>
                  <input value={shippingLength} onChange={(e) => setShippingLength(e.target.value)} type="number" placeholder="14" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
                <div>
                  <label style={labelStyle}>Width (in)</label>
                  <input value={shippingWidth} onChange={(e) => setShippingWidth(e.target.value)} type="number" placeholder="12" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
                <div>
                  <label style={labelStyle}>Height (in)</label>
                  <input value={shippingHeight} onChange={(e) => setShippingHeight(e.target.value)} type="number" placeholder="8" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
                <div>
                  <label style={labelStyle}>Weight (lbs)</label>
                  <input value={shippingWeight} onChange={(e) => setShippingWeight(e.target.value)} type="number" step="0.5" placeholder="5" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>

              {/* Fragile + UPC */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  fontSize: "15px", color: "rgba(255,255,255,0.7)",
                  cursor: "pointer", minHeight: "46px",
                }}>
                  <input
                    type="checkbox"
                    checked={isFragile}
                    onChange={(e) => setIsFragile(e.target.checked)}
                    style={{ accentColor: "#00bcd4", width: "18px", height: "18px" }}
                  />
                  Fragile item
                </label>
                <div>
                  <label style={labelStyle}>UPC / Barcode</label>
                  <input value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="Optional" style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                </div>
              </div>
            </div>
          </details>

          {/* Error */}
          {error && (
            <div style={{
              borderRadius: "14px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              padding: "12px 16px",
              color: "#ef4444",
              fontSize: "14px",
              marginBottom: "12px",
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={busy || photos.length === 0}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              background: busy
                ? "rgba(0,188,212,0.2)"
                : "linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)",
              color: "white",
              fontSize: "16px",
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
              minHeight: "56px",
              transition: "all 0.25s ease",
              boxShadow: busy ? "none" : "0 4px 20px rgba(0,188,212,0.25)",
              opacity: busy ? 0.8 : 1,
              position: "sticky" as const,
              bottom: "16px",
              zIndex: 10,
            }}
          >
            {busy
              ? "🤖 Creating and analyzing..."
              : `Create Item → (${photos.length} photo${photos.length !== 1 ? "s" : ""})`}
          </button>
      </form>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(0,188,212,0.6); box-shadow: 0 0 0 0 rgba(0,188,212,0.2); }
          50% { border-color: rgba(0,188,212,0.9); box-shadow: 0 0 0 8px rgba(0,188,212,0); }
        }
        @keyframes thumb-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
