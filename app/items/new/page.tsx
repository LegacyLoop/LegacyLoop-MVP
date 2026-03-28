"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import UploadModal, { type PhotoFile } from "@/app/components/UploadModal";

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
  border: "1px solid var(--border-default)",
  background: "var(--ghost-bg)",
  color: "var(--text-primary, #f1f5f9)",
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
  color: "var(--text-muted)",
  marginBottom: "6px",
  letterSpacing: "0.01em",
};

const sectionHeadStyle: React.CSSProperties = {
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
  fontWeight: 700,
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-default)",
  borderRadius: "20px",
  padding: "24px",
  marginBottom: "16px",
};

function focusHandler(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(0,188,212,0.5)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,188,212,0.08)";
}
function blurHandler(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--border-default)";
  e.currentTarget.style.boxShadow = "none";
}

export default function NewItemPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading...</div>}>
      <NewItemPageContent />
    </Suspense>
  );
}

function NewItemPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedSaleId = searchParams.get("saleId") || "";
  const preSelectedSaleName = searchParams.get("saleName") || "";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  const titleRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<Record<string, "pending" | "uploading" | "done" | "error">>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);

  // Sale assignment state
  const [sales, setSales] = useState<SaleOption[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState(preSelectedSaleId);

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

  // Clipboard paste handled by UploadModal component

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


  const retryUpload = async (photo: PhotoFile, itemId: string | null) => {
    if (!itemId) return;
    const key = `${photo.file.name}-${photo.file.size}`;
    setUploadStatus((prev) => ({ ...prev, [key]: "uploading" }));
    setUploadProgress((prev) => ({ ...prev, [key]: 0 }));
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({ ...prev, [key]: Math.min((prev[key] || 0) + 20, 80) }));
      }, 200);
      const fd = new FormData();
      fd.append("photos[]", photo.file);
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
      for (const p of photos) formData.append("photos[]", p.file);
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
      if (selectedSaleId) formData.append("projectId", selectedSaleId);

      // Start upload progress tracking
      const statusInit: Record<string, "uploading"> = {};
      const progressInit: Record<string, number> = {};
      for (const p of photos) {
        const key = `${p.file.name}-${p.file.size}`;
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

      if (preSelectedSaleId) {
        router.push(`/projects/${preSelectedSaleId}`);
      } else {
        router.push(`/items/${id}`);
      }
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
      {/* ── Sale context banner ── */}
      {preSelectedSaleName && (
        <div style={{
          background: "var(--accent-dim, rgba(0,188,212,0.06))",
          border: "1px solid var(--accent-border, rgba(0,188,212,0.25))",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          marginBottom: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1rem" }}>{"\u{1F3F7}\u{FE0F}"}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-primary, #f1f5f9)" }}>
              Creating item for: <strong>{decodeURIComponent(preSelectedSaleName)}</strong>
            </span>
          </div>
          <Link
            href={`/projects/${preSelectedSaleId}`}
            style={{
              fontSize: "0.78rem",
              color: "var(--accent, #00bcd4)",
              textDecoration: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {"\u2190"} Back to Sale
          </Link>
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard")}>Dashboard</span>
        <span style={{ margin: "0 6px" }}>/</span>
        <span>New Item</span>
      </div>

      {/* ── Header ── */}
      <h1 style={{
        fontSize: "28px",
        fontWeight: 800,
        color: "var(--text-primary)",
        letterSpacing: "-0.02em",
        marginBottom: "6px",
      }}>
        Add New Item
      </h1>

      <div style={{ marginBottom: "24px" }} />

      {/* ── PHOTOS ── */}
      <div>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "16px",
        }}>
          <div style={{
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            fontWeight: 700,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ fontSize: "15px" }}>📷</span> Item Photos
          </div>

          <UploadModal
            photos={photos}
            setPhotos={setPhotos}
            maxPhotos={10}
          />

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
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
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
                    color: "var(--text-muted)",
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
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
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
                      border: `2px solid ${!selectedSaleId ? "#00bcd4" : "var(--border-default)"}`,
                      background: !selectedSaleId ? "rgba(0,188,212,0.06)" : "transparent",
                      cursor: "pointer", textAlign: "left" as const, width: "100%",
                      transition: "all 0.15s ease", minHeight: "46px",
                    }}
                  >
                    <span style={{ fontSize: "16px", opacity: 0.5 }}>{"\u2014"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>No Sale — Individual Item</div>
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
                          border: `2px solid ${selected ? meta.color : "var(--border-default)"}`,
                          background: selected ? `${meta.color}10` : "transparent",
                          cursor: "pointer", textAlign: "left" as const, width: "100%",
                          transition: "all 0.15s ease", minHeight: "46px",
                        }}
                      >
                        <span style={{ fontSize: "18px" }}>{meta.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{sale.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
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
              color: "var(--text-secondary)",
              listStyle: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "15px" }}>📦</span> Additional Details (optional — helps AI accuracy)
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>▼</span>
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
                fontSize: "12px", fontWeight: 600, color: "var(--text-muted)",
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
                  fontSize: "15px", color: "var(--text-secondary)",
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
