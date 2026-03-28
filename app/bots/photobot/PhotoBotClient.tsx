"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import BotLoadingState from "@/app/components/BotLoadingState";

// ── Types ──────────────────────────────────────────────────────────────────
type PhotoData = {
  id: string;
  filePath: string;
  isPrimary: boolean;
  caption: string | null;
  order: number;
  editResult: any | null;
};

type ItemData = {
  id: string;
  title: string;
  status: string;
  hasAnalysis: boolean;
  category: string;
  photoQualityScore: number | null;
  photoTips: string[];
  photos: PhotoData[];
  enhanceResult: any | null;
  variations: any[];
};

// ── Color Scheme ───────────────────────────────────────────────────────────
const PINK = "#f06292";
const PINK_DARK = "#c2185b";
const PINK_BG = "rgba(240,98,146,0.08)";
const PINK_BORDER = "rgba(240,98,146,0.25)";
const TEAL = "#00bcd4";
const GREEN = "#10b981";
const AMBER = "#f59e0b";

// ── MegaBot Provider Metadata ──────────────────────────────────────────────
const PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "GPT-4o", color: "#10a37f", specialty: "Detail analysis & composition" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Authenticity & presentation" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Market appeal & trends" },
  grok: { icon: "🌀", label: "Grok", color: "#00DC82", specialty: "Social media optimization" },
};

// ── Toast Component ────────────────────────────────────────────────────────
function Toast({ message, type = "success" }: { message: string; type?: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999,
      padding: "0.75rem 1.25rem", borderRadius: "10px",
      background: type === "error" ? "rgba(239,68,68,0.95)" : "rgba(16,185,129,0.95)",
      color: "#fff", fontWeight: 600, fontSize: "0.82rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      animation: "fadeIn 0.3s ease",
    }}>
      {type === "error" ? "❌" : "✓"} {message}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function PhotoBotClient({ items }: { items: ItemData[] }) {
  // ── Selection State ──
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);

  // ── Photo Management State ──
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [localPhotos, setLocalPhotos] = useState<Record<string, PhotoData[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Editor State ──
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [activeEditorTool, setActiveEditorTool] = useState<string | null>(null);
  const [editResult, setEditResult] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
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

  // ── Enhancement State ──
  const [enhanceResult, setEnhanceResult] = useState<any>(null);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhanceStep, setEnhanceStep] = useState<string | null>(null);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [coverSet, setCoverSet] = useState<string | null>(null);

  // ── MegaBot State ──
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [variationResults, setVariationResults] = useState<any[]>([]);
  const [variationLoading, setVariationLoading] = useState<string | null>(null);

  // ── UI State ──
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [showAssessDetail, setShowAssessDetail] = useState(false);
  const [customVarPrompt, setCustomVarPrompt] = useState("");
  const [customVarName, setCustomVarName] = useState("");
  const [comparisonMode, setComparisonMode] = useState<"side" | "slider">("side");

  // ── Lightbox State ──
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // ── Before/After Slider State ──
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderDragging = useRef(false);

  // ── Image Error Tracking ──
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const handleImgError = useCallback((src: string) => {
    setImgErrors((prev) => { const next = new Set(prev); next.add(src); return next; });
  }, []);

  // ── Toast State ──
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Slider Drag Handlers ──
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);
  useEffect(() => {
    const onMove = (e: MouseEvent) => handleSliderMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0]) handleSliderMove(e.touches[0].clientX); };
    const onUp = () => { sliderDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onUp); };
  }, [handleSliderMove]);

  // ── Image Fallback Renderer ──
  function renderImg(src: string, alt: string, style: React.CSSProperties, onClick?: () => void) {
    if (imgErrors.has(src)) {
      return (
        <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.3rem", background: "var(--ghost-bg)", color: "var(--text-muted)" }}>
          <span style={{ fontSize: "1.5rem" }}>🖼️</span>
          <span style={{ fontSize: "0.62rem" }}>Image unavailable</span>
        </div>
      );
    }
    return <img src={src} alt={alt} style={{ ...style, cursor: onClick ? "zoom-in" : undefined }} onClick={onClick} onError={() => handleImgError(src)} />;
  }

  // ── Derived Data ──
  const selected = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId]);
  const photos = useMemo(() => {
    if (!selectedId) return [];
    return localPhotos[selectedId] || selected?.photos || [];
  }, [selectedId, selected, localPhotos]);

  const totalPhotos = useMemo(() => items.reduce((s, i) => s + i.photos.length, 0), [items]);
  const enhancedPhotos = useMemo(() => Object.keys(editResultsByPhoto).length, [editResultsByPhoto]);
  const avgScore = useMemo(() => {
    const scored = items.filter((i) => i.photoQualityScore != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, i) => s + (i.photoQualityScore ?? 0), 0) / scored.length * 10) / 10;
  }, [items]);
  const coverPhotos = useMemo(() => items.filter((i) => i.photos.some((p) => p.isPrimary)).length, [items]);

  // ── Lightbox Escape Key ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxUrl(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Auto-select from URL ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemParam = params.get("item");
    if (itemParam && items.find((i) => i.id === itemParam)) {
      setSelectedId(itemParam);
    }
  }, [items]);

  // ── Load existing results when item changes ──
  useEffect(() => {
    if (!selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (item?.enhanceResult) setEnhanceResult(item.enhanceResult);
    if (item?.variations?.length) setVariationResults(item.variations);
    setSelectedPhotoId(null);
    setEditResult(null);
    setEditError(null);
    setEnhanceError(null);
    setActiveEditorTool(null);
    setMegaBotData(null);

    // Fetch existing MegaBot results
    fetch(`/api/megabot/${selectedId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.result) setMegaBotData(d.result); })
      .catch(() => {});
  }, [selectedId, items]);

  // ── Photo Management Handlers ──
  async function handlePhotoUpload(files: FileList | null) {
    if (!files || !files.length || !selectedId) return;
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("photos[]", files[i]);
      const res = await fetch(`/api/items/photos/${selectedId}`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.paths && Array.isArray(data.paths)) {
        const newPhotos: PhotoData[] = data.paths.map((fp: string, idx: number) => ({
          id: `new-${Date.now()}-${idx}`, filePath: fp, isPrimary: false, caption: null, order: 999 + idx, editResult: null,
        }));
        setLocalPhotos((prev) => ({
          ...prev,
          [selectedId!]: [...(prev[selectedId!] || selected?.photos || []), ...newPhotos],
        }));
        showToast(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded`);
      }
    } catch {
      showToast("Photo upload failed", "error");
    }
    setUploadingPhotos(false);
  }

  async function handleDeletePhoto(photoId: string) {
    if (!selectedId) return;
    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`/api/items/photos/${selectedId}?photoId=${photoId}`, { method: "DELETE" });
      if (res.ok) {
        const currentPhotos = localPhotos[selectedId] || selected?.photos || [];
        setLocalPhotos((prev) => ({
          ...prev,
          [selectedId!]: currentPhotos.filter((p) => p.id !== photoId),
        }));
        if (selectedPhotoId === photoId) {
          setSelectedPhotoId(null);
          setEditResult(null);
        }
        showToast("Photo deleted");
      } else {
        showToast("Delete failed", "error");
      }
    } catch {
      showToast("Delete failed", "error");
    }
    setDeletingPhotoId(null);
  }

  async function handleSetPrimary(photoId: string) {
    if (!selectedId) return;
    setSettingPrimaryId(photoId);
    try {
      const res = await fetch(`/api/items/photos/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, isPrimary: true }),
      });
      if (res.ok) {
        const currentPhotos = localPhotos[selectedId] || selected?.photos || [];
        setLocalPhotos((prev) => ({
          ...prev,
          [selectedId!]: currentPhotos.map((p) => ({ ...p, isPrimary: p.id === photoId })),
        }));
        showToast("Cover photo set");
      }
    } catch {
      showToast("Failed to set cover", "error");
    }
    setSettingPrimaryId(null);
  }

  // ── Editor Handlers ──
  async function runAutoClean() {
    if (!selectedId || !selectedPhotoId) return;
    setEditLoading(true);
    setEditError(null);
    setEditResult(null);
    try {
      const res = await fetch(`/api/photobot/edit/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: selectedPhotoId, ...(customPrompt.trim() ? { customPrompt: customPrompt.trim() } : {}) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setEditResult(data.result);
          setEditResultsByPhoto((prev) => ({ ...prev, [selectedPhotoId!]: data.result }));
          showToast("Photo cleaned successfully");
        } else {
          setEditError("Photo edit returned no data.");
        }
      } else {
        const err = await res.json().catch(() => null);
        const rawErr = err?.error || `Photo edit failed (${res.status})`;
        if (rawErr.includes("bounding box") || rawErr.includes("Vision could not")) {
          setEditError("Couldn't isolate the item. Try a photo with a clearer background.");
        } else if (rawErr.includes("Vision scan failed")) {
          setEditError("AI had trouble analyzing this photo. Try a clearer, well-lit photo.");
        } else if (rawErr.includes("DALL-E") || rawErr.includes("Image edit failed")) {
          setEditError("Photo editor temporarily unavailable. Please try again.");
        } else {
          setEditError(rawErr);
        }
      }
    } catch (e: any) {
      setEditError(e?.message || "Network error");
    }
    setEditLoading(false);
  }

  async function runEnhance() {
    if (!selectedId) return;
    setEnhanceLoading(true);
    setEnhanceError(null);
    setEnhanceStep("Step 1/3 — AI Vision analyzing your photo...");
    try {
      const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
      // Step progression simulated (server does all 3 steps in one call)
      const stepTimer1 = setTimeout(() => setEnhanceStep("Step 2/3 — DALL-E 2 editing real photo..."), 8000);
      const stepTimer2 = setTimeout(() => setEnhanceStep("Step 3/3 — DALL-E 3 generating HD storefront image..."), 18000);
      const res = await fetch(`/api/photobot/enhance/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: primaryPhoto?.id, ...(customPrompt.trim() ? { customPrompt: customPrompt.trim() } : {}) }),
      });
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setEnhanceResult(data.result);
          showToast("Enhancement complete");
        }
      } else {
        const err = await res.json().catch(() => null);
        setEnhanceError(err?.error || "Enhancement failed");
      }
    } catch (e: any) {
      setEnhanceError(e?.message || "Network error");
    }
    setEnhanceStep(null);
    setEnhanceLoading(false);
  }

  async function runAssessOnly() {
    if (!selectedId) return;
    setEnhanceLoading(true);
    setEnhanceError(null);
    try {
      const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
      const res = await fetch(`/api/photobot/enhance/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: primaryPhoto?.id, mode: "assess" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) setEnhanceResult(data.result);
      } else {
        const err = await res.json().catch(() => null);
        setEnhanceError(err?.error || "Assessment failed");
      }
    } catch (e: any) {
      setEnhanceError(e?.message || "Network error");
    }
    setEnhanceLoading(false);
  }

  async function runMegaBot() {
    if (!selectedId) return;
    setMegaBotLoading(true);
    try {
      const res = await fetch(`/api/megabot/${selectedId}?bot=photobot`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setMegaBotData(data.result);
          showToast("MegaBot analysis complete");
        }
      }
    } catch {}
    setMegaBotLoading(false);
  }

  async function generateMegaVariation(variation: any) {
    if (!selectedId) return;
    const vName = variation.variationName || variation.variation_name || "Variation";
    setVariationLoading(vName);
    try {
      const primaryPhoto = photos.find((p) => p.isPrimary) || photos[0];
      const res = await fetch(`/api/photobot/enhance/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId: primaryPhoto?.id,
          dallePrompt: variation.dallePrompt || variation.dalle_prompt,
          editInstructions: variation.editInstructions || variation.edit_instructions,
          variationName: vName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setVariationResults((prev) => [data.result, ...prev.filter((v: any) => v.variationName !== vName)]);
          showToast(`${vName} generated`);
        }
      }
    } catch {
      showToast("Generation failed", "error");
    }
    setVariationLoading(null);
  }

  async function setAsCover(photoUrl: string, label: string) {
    if (!selectedId) return;
    setCoverSet(null);
    try {
      const res = await fetch(`/api/items/update/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoUrl: photoUrl }),
      });
      if (res.ok) {
        setCoverSet(label);
        showToast("Cover photo updated");
        setTimeout(() => setCoverSet(null), 2000);
      }
    } catch {}
  }

  // ── Batch Variation Generation ──
  async function generateAllVariations(variations: any[]) {
    if (!selectedId || batchGenerating) return;
    setBatchGenerating(true);
    let generated = 0;
    for (const v of variations.slice(0, 5)) {
      const vName = v.variationName || v.variation_name || `Variation`;
      const existing = variationResults.find((vr: any) => vr.variationName === vName);
      if (existing) continue;
      await generateMegaVariation(v);
      generated++;
    }
    setBatchGenerating(false);
    if (generated > 0) showToast(`${generated} variation${generated !== 1 ? "s" : ""} generated!`);
    else showToast("All variations already generated");
  }

  // ── Custom Variation Submission ──
  async function submitCustomVariation() {
    if (!selectedId || !customVarPrompt.trim()) return;
    const name = customVarName.trim() || `Custom ${variationResults.length + 1}`;
    const variation = {
      variationName: name,
      dallePrompt: customVarPrompt.trim(),
      editInstructions: customVarPrompt.trim(),
      bestFor: "Custom",
      description: customVarPrompt.trim().slice(0, 100),
    };
    await generateMegaVariation(variation);
    setCustomVarPrompt("");
    setCustomVarName("");
  }

  // ── Download Helper ──
  function downloadImage(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Editor Tools Definition ──
  const editorTools = [
    { key: "clean", icon: "🧹", label: "Auto-Clean", desc: "Remove background clutter", credits: 1 },
    { key: "bgremove", icon: "🖼️", label: "Background Remove", desc: "Clean white/neutral background", credits: 1 },
    { key: "enhance", icon: "✨", label: "Enhance & Stage", desc: "Professional storefront image", credits: 2 },
    { key: "assess", icon: "📊", label: "Photo Assessment", desc: "AI quality scoring & tips", credits: 1 },
  ];

  // ── Stat Panels ──
  const statPanels = [
    { key: "photos", label: "Total Photos", value: totalPhotos, icon: "📷" },
    { key: "enhanced", label: "Enhanced", value: enhancedPhotos, icon: "✨" },
    { key: "score", label: "Avg Score", value: avgScore != null ? `${avgScore}/10` : "—", icon: "📊" },
    { key: "covers", label: "Cover Photos", value: coverPhotos, icon: "🖼️" },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 1rem" }}>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <input type="file" ref={fileInputRef} multiple accept="image/*" style={{ display: "none" }}
        onChange={(e) => handlePhotoUpload(e.target.files)} />

      {/* ═══ HERO ═══ */}
      <div style={{
        borderRadius: "1rem", padding: "3px", marginBottom: "1.5rem",
        background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK}, ${PINK})`,
        boxShadow: `0 4px 24px rgba(240,98,146,0.15)`,
      }}>
        <div style={{
          background: "var(--bg-card-solid)",
          borderRadius: "calc(1rem - 3px)",
          padding: "1.5rem 2rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div style={{
                width: 52, height: 52, borderRadius: "14px",
                background: `linear-gradient(135deg, ${PINK}20, ${PINK}08)`,
                border: `1px solid ${PINK_BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.6rem", flexShrink: 0,
              }}>📷</div>
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                  PhotoBot
                </h1>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.15rem 0 0", fontWeight: 500 }}>
                  Photo Editor · AI Enhancement · Professional Storefront Imagery
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                padding: "0.3rem 0.75rem", borderRadius: "999px",
                background: `rgba(16,185,129,0.1)`, border: "1px solid rgba(16,185,129,0.25)",
              }}>
                <span style={{ fontSize: "0.55rem" }}>🛡️</span>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: GREEN, letterSpacing: "0.03em" }}>
                  Item Protection Active
                </span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                padding: "0.3rem 0.75rem", borderRadius: "999px",
                background: `${PINK_BG}`, border: `1px solid ${PINK_BORDER}`,
              }}>
                <span style={{ fontSize: "0.55rem" }}>🎨</span>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: PINK, letterSpacing: "0.03em" }}>
                  DALL-E 3 HD
                </span>
              </div>
            </div>
          </div>

          {/* Item counts strip */}
          <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", fontSize: "0.72rem" }}>
            {[
              { label: "Items", count: items.length },
              { label: "With Photos", count: items.filter((i) => i.photos.length > 0).length },
              { label: "Total Photos", count: totalPhotos },
              { label: "Enhanced", count: enhancedPhotos },
            ].map((s) => (
              <span key={s.label} style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                <strong style={{ color: PINK, fontWeight: 800 }}>{s.count}</strong> {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CLICKABLE STAT PANELS ═══ */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {statPanels.map((s) => (
            <div
              key={s.key}
              onClick={() => setExpandedStat(expandedStat === s.key ? null : s.key)}
              style={{
                background: expandedStat === s.key ? PINK_BG : "var(--bg-card-solid)",
                border: expandedStat === s.key ? `2px solid ${PINK}` : "1px solid var(--border-default)",
                borderRadius: "12px", padding: "0.85rem", textAlign: "center" as const,
                boxShadow: expandedStat === s.key ? `0 4px 16px rgba(240,98,146,0.15)` : "0 1px 3px rgba(0,0,0,0.06)",
                cursor: "pointer", transition: "all 0.2s ease",
                transform: expandedStat === s.key ? "translateY(-2px)" : "none",
                userSelect: "none" as const,
              }}
            >
              <div style={{ fontSize: "1.1rem", marginBottom: "0.15rem" }}>{s.icon}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: PINK }}>{s.value}</div>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                {s.label} <span style={{ fontSize: "0.5rem", opacity: 0.6 }}>{expandedStat === s.key ? "▲" : "▼"}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded stat detail */}
        {expandedStat && (
          <div style={{
            marginTop: "0.75rem", padding: "1rem 1.25rem", borderRadius: "0.75rem",
            background: "var(--bg-card-solid)", border: `1px solid ${PINK_BORDER}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            {expandedStat === "photos" && (
              <>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: PINK, fontWeight: 700, marginBottom: "0.65rem" }}>Photos by Item</div>
                <div style={{ maxHeight: 200, overflowY: "auto" as const }}>
                  {items.filter((i) => i.photos.length > 0).map((it) => (
                    <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                      display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                      borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                    }}>
                      {it.photos[0] && <img src={it.photos[0].filePath} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{it.photos.length} photo{it.photos.length !== 1 ? "s" : ""}</div>
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: PINK, flexShrink: 0 }}>{it.photos.length}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {expandedStat === "enhanced" && (
              <>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: PINK, fontWeight: 700, marginBottom: "0.65rem" }}>Enhanced Photos</div>
                {enhancedPhotos === 0 ? (
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>No photos enhanced yet. Select an item and use the Photo Editor tools.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem", maxHeight: 200, overflowY: "auto" as const }}>
                    {items.flatMap((it) => it.photos.filter((p) => editResultsByPhoto[p.id]).map((p) => (
                      <div key={p.id} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${PINK_BORDER}` }}>
                        <img src={editResultsByPhoto[p.id].editedPhotoUrl || p.filePath} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" as const, display: "block" }} />
                      </div>
                    )))}
                  </div>
                )}
              </>
            )}
            {expandedStat === "score" && (
              <>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: PINK, fontWeight: 700, marginBottom: "0.65rem" }}>Photo Quality Scores</div>
                <div style={{ maxHeight: 200, overflowY: "auto" as const }}>
                  {items.filter((i) => i.photoQualityScore != null).map((it) => (
                    <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                      display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                      borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                    }}>
                      {it.photos[0] && <img src={it.photos[0].filePath} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                      </div>
                      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: (it.photoQualityScore ?? 0) >= 7 ? GREEN : (it.photoQualityScore ?? 0) >= 4 ? AMBER : "#ef4444" }}>
                        {it.photoQualityScore}/10
                      </span>
                    </div>
                  ))}
                  {items.filter((i) => i.photoQualityScore == null).length > 0 && (
                    <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "0.5rem 0 0", fontStyle: "italic" }}>
                      {items.filter((i) => i.photoQualityScore == null).length} item{items.filter((i) => i.photoQualityScore == null).length !== 1 ? "s" : ""} not yet scored — run AnalyzeBot first
                    </p>
                  )}
                </div>
              </>
            )}
            {expandedStat === "covers" && (
              <>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: PINK, fontWeight: 700, marginBottom: "0.65rem" }}>Cover Photos</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.65rem", maxHeight: 200, overflowY: "auto" as const }}>
                  {items.filter((i) => i.photos.some((p) => p.isPrimary)).map((it) => {
                    const cover = it.photos.find((p) => p.isPrimary) || it.photos[0];
                    return (
                      <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{ cursor: "pointer" }}>
                        <img src={cover?.filePath || ""} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" as const, borderRadius: 8, display: "block", border: `1px solid ${PINK_BORDER}` }} />
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.25rem", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══ ITEM SELECTOR ═══ */}
      <div style={{
        background: "var(--bg-card-solid)", border: `1px solid ${PINK_BORDER}`,
        borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
      }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          Select Item for Photo Editing
        </div>
        {items.length === 0 ? (
          <div style={{ padding: "1.5rem", textAlign: "center" as const, color: "var(--text-muted)" }}>
            <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>No items yet</p>
            <p style={{ fontSize: "0.78rem" }}>Upload an item first, then come back to edit photos.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
            {items.filter((i) => i.photos.length > 0).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.55rem 0.85rem", borderRadius: "0.65rem",
                  border: selectedId === item.id ? `2px solid ${PINK}` : "1px solid var(--border-default)",
                  background: selectedId === item.id ? PINK_BG : "var(--bg-card-solid)",
                  cursor: "pointer", textAlign: "left" as const, width: "100%",
                  transition: "all 0.15s ease",
                }}
              >
                {item.photos[0] && (
                  <img src={item.photos[0].filePath} alt="" style={{ width: 36, height: 36, borderRadius: "0.4rem", objectFit: "cover" as const, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.78rem", fontWeight: selectedId === item.id ? 700 : 500,
                    color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis",
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <span>📷 {item.photos.length}</span>
                    {item.hasAnalysis && <span style={{ color: GREEN }}>✓ Analyzed</span>}
                  </div>
                </div>
              </button>
            ))}
            {items.filter((i) => i.photos.length === 0).length > 0 && (
              <div style={{ padding: "0.5rem", fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                {items.filter((i) => i.photos.length === 0).length} item{items.filter((i) => i.photos.length === 0).length !== 1 ? "s" : ""} without photos
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ PHOTO GALLERY + MANAGEMENT ═══ */}
      {selectedId && selected && (
        <div style={{
          background: "var(--bg-card-solid)", border: `1px solid ${PINK_BORDER}`,
          borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
        }}>
          {/* Gallery Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                Photo Gallery
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.15rem" }}>
                {selected.title}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhotos}
                style={{
                  padding: "0.4rem 0.85rem", fontSize: "0.72rem", fontWeight: 700,
                  borderRadius: "8px", cursor: "pointer",
                  background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                  border: "none", color: "#fff",
                  boxShadow: `0 2px 8px rgba(240,98,146,0.25)`,
                  opacity: uploadingPhotos ? 0.6 : 1,
                }}
              >
                {uploadingPhotos ? "Uploading..." : "📷 Add Photos"}
              </button>
            </div>
          </div>

          {/* Iron Rule Banner */}
          <div style={{
            background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "8px", padding: "0.6rem 0.85rem", marginBottom: "1rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>🛡️</span>
            <span style={{ fontSize: "0.72rem", color: GREEN, fontWeight: 600 }}>
              Iron Rule: The sale item is never modified. Only backgrounds and surroundings are edited. Item authenticity is always preserved.
            </span>
          </div>

          {photos.length === 0 ? (
            <div style={{ textAlign: "center" as const, padding: "2.5rem 1rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📷</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>No Photos Yet</div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 380, margin: "0 auto 1rem" }}>
                Upload photos to get started with AI-powered editing, background removal, and professional storefront imagery.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: "0.65rem 1.5rem", fontSize: "0.85rem", fontWeight: 700,
                  borderRadius: "10px", cursor: "pointer",
                  background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                  border: "none", color: "#fff",
                  boxShadow: `0 4px 14px rgba(240,98,146,0.3)`,
                }}
              >
                📷 Upload Photos
              </button>
            </div>
          ) : (
            <>
              {/* Photo Grid with management controls */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                {photos.map((p, idx) => (
                  <div
                    key={p.id}
                    style={{
                      position: "relative" as const, borderRadius: "10px", overflow: "hidden",
                      border: selectedPhotoId === p.id ? `2px solid ${PINK}` : "1px solid var(--border-default)",
                      transition: "all 0.2s ease",
                      boxShadow: selectedPhotoId === p.id ? `0 4px 16px rgba(240,98,146,0.2)` : "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Photo */}
                    <div onClick={() => { setSelectedPhotoId(p.id); setEditResult(editResultsByPhoto[p.id] || null); setEditError(null); }}
                      style={{ cursor: "pointer" }}>
                      {renderImg(p.filePath, p.caption || "Item photo", { width: "100%", aspectRatio: "1", objectFit: "cover" as const, display: "block" })}
                    </div>

                    {/* Selection overlay */}
                    {selectedPhotoId === p.id && (
                      <div style={{
                        position: "absolute" as const, inset: 0, background: `${PINK}15`,
                        display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" as const,
                      }}>
                        <span style={{ color: PINK, fontSize: "1.8rem", fontWeight: 700 }}>✓</span>
                      </div>
                    )}

                    {/* Badges */}
                    <div style={{ position: "absolute" as const, top: 6, left: 6, display: "flex", gap: "0.25rem", flexWrap: "wrap" as const }}>
                      {p.isPrimary && (
                        <span style={{ background: "rgba(240,98,146,0.9)", color: "#fff", borderRadius: "4px", padding: "0.1rem 0.4rem", fontSize: "0.55rem", fontWeight: 700 }}>
                          Cover
                        </span>
                      )}
                      {editResultsByPhoto[p.id] && (
                        <span style={{ background: "rgba(16,185,129,0.9)", color: "#fff", borderRadius: "4px", padding: "0.1rem 0.4rem", fontSize: "0.55rem", fontWeight: 700 }}>
                          Cleaned
                        </span>
                      )}
                    </div>

                    {/* Action buttons overlay */}
                    <div style={{
                      position: "absolute" as const, bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                      padding: "1.5rem 0.4rem 0.35rem",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetPrimary(p.id); }}
                        disabled={p.isPrimary || settingPrimaryId === p.id}
                        title="Set as cover"
                        aria-label={p.isPrimary ? "Current cover photo" : "Set as cover photo"}
                        style={{
                          width: 36, height: 36, borderRadius: "8px", border: "none",
                          background: p.isPrimary ? "rgba(240,98,146,0.4)" : "rgba(255,255,255,0.2)",
                          color: "#fff", fontSize: "0.78rem", cursor: p.isPrimary ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: p.isPrimary ? 0.5 : 1,
                        }}
                      >
                        ⭐
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id); }}
                        disabled={deletingPhotoId === p.id}
                        title="Delete photo"
                        aria-label="Delete this photo"
                        style={{
                          width: 36, height: 36, borderRadius: "8px", border: "none",
                          background: "rgba(239,68,68,0.3)", color: "#fff", fontSize: "0.78rem",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {deletingPhotoId === p.id ? "…" : "🗑️"}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Upload more tile */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    borderRadius: "10px", border: `2px dashed ${PINK_BORDER}`,
                    display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
                    aspectRatio: "1", cursor: "pointer", transition: "border-color 0.2s",
                    background: PINK_BG,
                  }}
                >
                  <span style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>➕</span>
                  <span style={{ fontSize: "0.68rem", color: PINK, fontWeight: 600 }}>Add Photos</span>
                </div>
              </div>

              {/* Photo count + tips */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <span>{photos.length} photo{photos.length !== 1 ? "s" : ""} · Click a photo to select for editing</span>
                {photos.length < 3 && <span style={{ color: AMBER, fontWeight: 600 }}>💡 3+ photos sell 40% faster</span>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ EDITOR TOOLS ═══ */}
      {selectedId && selected && photos.length > 0 && (
        <div style={{
          background: "var(--bg-card-solid)", border: `1px solid ${PINK_BORDER}`,
          borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            Photo Editing Tools
          </div>

          {/* Tool selector grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem", marginBottom: "1rem" }}>
            {editorTools.map((tool) => (
              <button
                key={tool.key}
                onClick={() => setActiveEditorTool(activeEditorTool === tool.key ? null : tool.key)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.75rem 1rem", borderRadius: "0.6rem",
                  background: activeEditorTool === tool.key ? PINK_BG : "var(--ghost-bg)",
                  border: activeEditorTool === tool.key ? `2px solid ${PINK}` : "1px solid var(--border-default)",
                  cursor: "pointer", textAlign: "left" as const, width: "100%",
                  transition: "all 0.2s ease",
                  transform: activeEditorTool === tool.key ? "translateY(-1px)" : "none",
                  boxShadow: activeEditorTool === tool.key ? `0 4px 12px rgba(240,98,146,0.15)` : "none",
                }}
              >
                <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{tool.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{tool.label}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{tool.desc} · {tool.credits} cr</div>
                </div>
              </button>
            ))}
          </div>

          {/* Active tool workspace */}
          {activeEditorTool && (
            <div style={{
              background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
              borderRadius: "0.75rem", padding: "1.25rem",
            }}>
              {/* ── Custom Prompt Input (shown for all tools) ── */}
              {(activeEditorTool === "clean" || activeEditorTool === "bgremove" || activeEditorTool === "enhance") && (
                <div style={{
                  marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "10px",
                  background: `linear-gradient(135deg, ${PINK_BG}, rgba(240,98,146,0.03))`,
                  border: `1px solid ${PINK_BORDER}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>💬</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>AI Prompt (Optional)</span>
                  </div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Guide the AI: e.g. &quot;Make the background a warm wood studio&quot;, &quot;Remove the person on the left&quot;, &quot;Clean white backdrop, product centered&quot;..."
                    rows={2}
                    style={{
                      width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.78rem",
                      borderRadius: "8px", border: "1px solid var(--border-default)",
                      background: "var(--bg-card-solid)", color: "var(--text-primary)",
                      resize: "vertical" as const, fontFamily: "inherit",
                      outline: "none", lineHeight: 1.4,
                      minHeight: "2.5rem", maxHeight: "6rem",
                    }}
                    onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = PINK; }}
                    onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--border-default)"; }}
                  />
                  {customPrompt.trim() && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.35rem" }}>
                      <span style={{ fontSize: "0.6rem", color: GREEN }}>✓</span>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>AI will factor your instruction into the {activeEditorTool === "enhance" ? "enhancement" : "edit"}</span>
                      <button
                        onClick={() => setCustomPrompt("")}
                        aria-label="Clear custom prompt"
                        style={{ marginLeft: "auto", background: "none", border: "none", fontSize: "0.65rem", color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline", padding: "0.35rem 0.5rem", minHeight: "36px" }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Auto-Clean Tool ── */}
              {activeEditorTool === "clean" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>🧹</span>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Auto-Clean</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>AI removes background clutter, people, and distractions. Item is 100% protected.</div>
                    </div>
                  </div>

                  {!selectedPhotoId && (
                    <div style={{ textAlign: "center" as const, padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      ↑ Select a photo above to clean
                    </div>
                  )}

                  {selectedPhotoId && !editLoading && !editResult && (
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ marginBottom: "1rem" }}>
                        {renderImg(photos.find((p) => p.id === selectedPhotoId)?.filePath || "", "Selected photo", { maxWidth: 300, maxHeight: 250, borderRadius: "10px", objectFit: "contain" as const, border: "1px solid var(--border-default)" })}
                      </div>
                      <button
                        onClick={runAutoClean}
                        style={{
                          padding: "0.65rem 1.5rem", fontSize: "0.85rem", fontWeight: 700,
                          borderRadius: "10px", cursor: "pointer",
                          background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                          border: "none", color: "#fff",
                          boxShadow: `0 4px 14px rgba(240,98,146,0.3)`,
                        }}
                      >
                        🧹 Auto-Clean This Photo · 1 cr
                      </button>
                    </div>
                  )}

                  {editLoading && <BotLoadingState botName="PhotoBot" />}

                  {editError && (
                    <div style={{ padding: "0.65rem 1rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "#ef4444" }}>{editError}</span>
                      <button
                        onClick={() => { setEditError(null); runAutoClean(); }}
                        aria-label="Retry auto-clean"
                        style={{ padding: "0.35rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", cursor: "pointer", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", flexShrink: 0, minHeight: "44px" }}
                      >
                        ↻ Retry
                      </button>
                    </div>
                  )}

                  {editResult && !editLoading && (
                    <div>
                      {/* Before / After */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border-default)" }}>
                          {renderImg(editResult.originalPhotoPath, "Original", { width: "100%", aspectRatio: "4/3", objectFit: "cover" as const, display: "block" }, () => setLightboxUrl(editResult.originalPhotoPath))}
                          <div style={{ padding: "0.4rem 0.6rem", fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", background: "var(--ghost-bg)" }}>📷 Original</div>
                        </div>
                        <div style={{ borderRadius: "10px", overflow: "hidden", border: `1px solid ${PINK_BORDER}` }}>
                          {renderImg(editResult.editedPhotoUrl, "Cleaned", { width: "100%", aspectRatio: "4/3", objectFit: "cover" as const, display: "block" }, () => setLightboxUrl(editResult.editedPhotoUrl))}
                          <div style={{ padding: "0.4rem 0.6rem", fontSize: "0.68rem", fontWeight: 600, color: PINK, background: PINK_BG }}>✨ Cleaned</div>
                        </div>
                      </div>

                      {/* What was removed */}
                      {editResult.distractingElements?.length > 0 && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: GREEN, marginBottom: "0.35rem" }}>✓ Removed:</div>
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.3rem" }}>
                            {editResult.distractingElements.map((el: string, i: number) => (
                              <span key={i} style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "999px", padding: "0.15rem 0.55rem", color: GREEN, fontSize: "0.68rem", fontWeight: 600 }}>
                                {el}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Protection badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "1rem" }}>
                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 600, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: AMBER }}>
                          🛡️ Item condition untouched
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => setAsCover(editResult.editedPhotoUrl || editResult.editedPhotoSavedPath, "cleaned")}
                          style={{
                            padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                            borderRadius: "10px", cursor: "pointer",
                            background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                            border: "none", color: "#fff",
                          }}
                        >
                          {coverSet === "cleaned" ? "✓ Set!" : "⭐ Set as Cover Photo"}
                        </button>
                        <button
                          onClick={() => { setEditResult(null); setSelectedPhotoId(null); }}
                          style={{
                            padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 600,
                            borderRadius: "10px", cursor: "pointer",
                            background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Clean Another
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Background Remove Tool ── */}
              {activeEditorTool === "bgremove" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>🖼️</span>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Background Remove</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Replace background with clean, neutral white. Perfect for marketplaces.</div>
                    </div>
                  </div>
                  {!selectedPhotoId ? (
                    <div style={{ textAlign: "center" as const, padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      ↑ Select a photo above to remove its background
                    </div>
                  ) : (
                    <div style={{ textAlign: "center" as const }}>
                      <div style={{ marginBottom: "1rem" }}>
                        {renderImg(photos.find((p) => p.id === selectedPhotoId)?.filePath || "", "Selected photo", { maxWidth: 300, maxHeight: 250, borderRadius: "10px", objectFit: "contain" as const, border: "1px solid var(--border-default)" })}
                      </div>
                      <button
                        onClick={runAutoClean}
                        disabled={editLoading}
                        style={{
                          padding: "0.65rem 1.5rem", fontSize: "0.85rem", fontWeight: 700,
                          borderRadius: "10px", cursor: editLoading ? "not-allowed" : "pointer",
                          background: editLoading ? "var(--ghost-bg)" : `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                          border: "none", color: editLoading ? "var(--text-muted)" : "#fff",
                        }}
                      >
                        {editLoading ? "Processing..." : "🖼️ Remove Background · 1 cr"}
                      </button>
                    </div>
                  )}
                  {editLoading && <BotLoadingState botName="PhotoBot" />}
                  {editError && (
                    <div style={{ padding: "0.65rem 1rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "#ef4444" }}>{editError}</span>
                      <button
                        onClick={() => { setEditError(null); runAutoClean(); }}
                        aria-label="Retry background removal"
                        style={{ padding: "0.35rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", cursor: "pointer", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", flexShrink: 0, minHeight: "44px" }}
                      >
                        ↻ Retry
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── Enhance & Stage Tool ── */}
              {activeEditorTool === "enhance" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>✨</span>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Enhance & Stage</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>3-step AI pipeline: Vision assessment → DALL-E 2 real photo edit → DALL-E 3 HD professional storefront image. Your item is never modified.</div>
                    </div>
                  </div>

                  {enhanceLoading && (
                    <div>
                      <BotLoadingState botName="PhotoBot Enhancement" />
                      {enhanceStep && (
                        <div style={{
                          textAlign: "center", marginTop: "-0.5rem", marginBottom: "1rem",
                          padding: "0.5rem 1rem", borderRadius: "8px",
                          background: PINK_BG, border: `1px solid ${PINK_BORDER}`,
                        }}>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: PINK }}>{enhanceStep}</div>
                          <div style={{ marginTop: "0.4rem", height: 4, borderRadius: 2, background: "var(--ghost-bg)", overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 2,
                              background: `linear-gradient(90deg, ${PINK}, ${PINK_DARK})`,
                              width: enhanceStep.startsWith("Step 1") ? "33%" : enhanceStep.startsWith("Step 2") ? "66%" : "90%",
                              transition: "width 1s ease",
                            }} />
                          </div>
                          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                            {enhanceStep.startsWith("Step 1") ? "GPT-4o Vision is analyzing composition, lighting, and condition..." : enhanceStep.startsWith("Step 2") ? "Editing your real photo while protecting the item..." : "Generating a professional HD storefront image..."}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {enhanceError && (
                    <div style={{ padding: "0.65rem 1rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "#ef4444" }}>{enhanceError}</span>
                      <button
                        onClick={() => { setEnhanceError(null); runEnhance(); }}
                        aria-label="Retry enhancement"
                        style={{ padding: "0.35rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", cursor: "pointer", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", flexShrink: 0, minHeight: "44px" }}
                      >
                        ↻ Retry
                      </button>
                    </div>
                  )}

                  {!enhanceLoading && !enhanceResult && (
                    <div style={{ textAlign: "center" as const }}>
                      {/* Enrichment notice */}
                      {selected?.hasAnalysis && (
                        <div style={{ marginBottom: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                          <span style={{ fontSize: "0.6rem", color: GREEN }}>✓</span>
                          <span style={{ fontSize: "0.62rem", color: GREEN, fontWeight: 600 }}>AnalyzeBot data available — enhanced accuracy</span>
                        </div>
                      )}
                      <div style={{ marginBottom: "1rem" }}>
                        {renderImg((photos.find((p) => p.isPrimary) || photos[0])?.filePath || "", "Primary photo",
                          { maxWidth: 300, maxHeight: 250, borderRadius: "10px", objectFit: "contain" as const, border: "1px solid var(--border-default)" })}
                      </div>
                      <button
                        onClick={runEnhance}
                        style={{
                          padding: "0.65rem 1.5rem", fontSize: "0.85rem", fontWeight: 700,
                          borderRadius: "10px", cursor: "pointer",
                          background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                          border: "none", color: "#fff",
                          boxShadow: `0 4px 14px rgba(240,98,146,0.3)`,
                        }}
                      >
                        ✨ Enhance Cover Photo · 2 cr
                      </button>
                    </div>
                  )}

                  {enhanceResult && !enhanceLoading && (() => {
                    const assess = enhanceResult.assessment;
                    const editedUrl = enhanceResult.editedPhotoUrl || enhanceResult.editedUrl;
                    const generatedUrl = enhanceResult.generatedPhotoUrl || enhanceResult.generatedUrl;
                    const condDetails: string[] = assess?.conditionDetails || [];
                    const enhSteps: string[] = assess?.enhancementSteps || [];
                    const blockers: string[] = assess?.coverPhotoBlockers || [];
                    const distracting: string[] = assess?.distractingElements || [];
                    const physDesc = assess?.physicalDescription || "";
                    const matAnalysis = assess?.materialAnalysis || "";
                    const styleDesc = assess?.styleDescription || "";
                    const dimEstimate = assess?.dimensionEstimate || "";
                    const colorDesc = assess?.colorDescription || "";
                    const bgNeeded = assess?.backgroundRemovalNeeded;
                    const coverReady = assess?.coverPhotoReady;

                    return (
                    <div>
                      {/* Top bar: Enrichment badge + Cover readiness */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                          {enhanceResult.enrichedWithAnalysis && (
                            <span style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "999px", padding: "0.15rem 0.6rem", fontSize: "0.62rem", color: GREEN, fontWeight: 600 }}>
                              ✓ AnalyzeBot data used
                            </span>
                          )}
                          {bgNeeded != null && (
                            <span style={{ background: bgNeeded ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${bgNeeded ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`, borderRadius: "999px", padding: "0.15rem 0.6rem", fontSize: "0.62rem", color: bgNeeded ? "#ef4444" : GREEN, fontWeight: 600 }}>
                              {bgNeeded ? "🔄 Background needs work" : "✓ Background OK"}
                            </span>
                          )}
                        </div>
                        {coverReady != null && (
                          <span style={{
                            background: coverReady ? `linear-gradient(135deg, ${GREEN}15, ${GREEN}08)` : "rgba(245,158,11,0.08)",
                            border: `1px solid ${coverReady ? `${GREEN}35` : "rgba(245,158,11,0.2)"}`,
                            borderRadius: "999px", padding: "0.2rem 0.75rem", fontSize: "0.65rem", fontWeight: 700,
                            color: coverReady ? GREEN : AMBER,
                          }}>
                            {coverReady ? "⭐ Cover Photo Ready" : "⚠ Not Cover-Ready Yet"}
                          </span>
                        )}
                      </div>

                      {/* Assessment scores — 6 dimensions */}
                      {assess && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "0.4rem", marginBottom: "0.85rem" }}>
                          {[
                            { label: "Isolation", score: assess.isolationScore },
                            { label: "Lighting", score: assess.lightingScore },
                            { label: "Framing", score: assess.framingScore },
                            { label: "Focus", score: assess.focusScore },
                            { label: "Color", score: assess.colorAccuracy },
                            { label: "Overall", score: assess.overallScore },
                          ].filter((s) => s.score != null).map((s) => (
                            <div key={s.label} style={{
                              textAlign: "center" as const, padding: "0.45rem 0.3rem", borderRadius: "8px",
                              background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                            }}>
                              <div style={{ fontSize: "1rem", fontWeight: 800, color: (s.score ?? 0) >= 7 ? GREEN : (s.score ?? 0) >= 4 ? AMBER : "#ef4444" }}>
                                {s.score}<span style={{ fontSize: "0.5rem", fontWeight: 400, color: "var(--text-muted)" }}>/10</span>
                              </div>
                              <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cover Photo Blockers */}
                      {!coverReady && blockers.length > 0 && (
                        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.25rem" }}>🚫 Cover Photo Blockers:</div>
                          {blockers.slice(0, 4).map((b: string, i: number) => (
                            <div key={i} style={{ display: "flex", gap: "0.3rem", fontSize: "0.68rem", color: "var(--text-muted)", padding: "0.1rem 0" }}>
                              <span style={{ color: "#ef4444", flexShrink: 0 }}>✗</span>
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Assessment Detail — expandable */}
                      {assess && (physDesc || matAnalysis || styleDesc || colorDesc || dimEstimate) && (
                        <div style={{ marginBottom: "0.75rem", borderRadius: "8px", border: `1px solid ${PINK_BORDER}`, overflow: "hidden" }}>
                          <button
                            onClick={() => setShowAssessDetail(!showAssessDetail)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "0.5rem 0.75rem", background: PINK_BG, border: "none", cursor: "pointer",
                            }}
                          >
                            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: PINK, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              🔍 AI Assessment Detail
                            </span>
                            <span style={{ fontSize: "0.6rem", color: PINK }}>{showAssessDetail ? "▲ Hide" : "▼ Show"}</span>
                          </button>
                          {showAssessDetail && (
                            <div style={{ padding: "0.65rem 0.75rem", background: "var(--ghost-bg)" }}>
                              {physDesc && (
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <div style={{ fontSize: "0.52rem", fontWeight: 700, color: PINK, textTransform: "uppercase", marginBottom: "0.15rem" }}>Physical Description</div>
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{physDesc}</div>
                                </div>
                              )}
                              {matAnalysis && (
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <div style={{ fontSize: "0.52rem", fontWeight: 700, color: PINK, textTransform: "uppercase", marginBottom: "0.15rem" }}>Material Analysis</div>
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{typeof matAnalysis === "string" ? matAnalysis : JSON.stringify(matAnalysis)}</div>
                                </div>
                              )}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                {styleDesc && (
                                  <div>
                                    <div style={{ fontSize: "0.52rem", fontWeight: 700, color: PINK, textTransform: "uppercase", marginBottom: "0.15rem" }}>Style</div>
                                    <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{styleDesc}</div>
                                  </div>
                                )}
                                {dimEstimate && (
                                  <div>
                                    <div style={{ fontSize: "0.52rem", fontWeight: 700, color: PINK, textTransform: "uppercase", marginBottom: "0.15rem" }}>Dimensions</div>
                                    <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{dimEstimate}</div>
                                  </div>
                                )}
                              </div>
                              {colorDesc && (
                                <div style={{ marginTop: "0.5rem" }}>
                                  <div style={{ fontSize: "0.52rem", fontWeight: 700, color: PINK, textTransform: "uppercase", marginBottom: "0.15rem" }}>Color Profile</div>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{typeof colorDesc === "string" ? colorDesc : JSON.stringify(colorDesc)}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Condition preservation */}
                      {condDetails.length > 0 && (
                        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: AMBER, marginBottom: "0.25rem" }}>🛡️ Condition preserved in all versions:</div>
                          {condDetails.slice(0, 6).map((c: string, i: number) => (
                            <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>• {c}</div>
                          ))}
                        </div>
                      )}

                      {/* Distracting elements detected */}
                      {distracting.length > 0 && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.3rem" }}>🔍 Distractions Detected & Removed:</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                            {distracting.map((el: string, i: number) => (
                              <span key={i} style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: "999px", padding: "0.12rem 0.5rem", fontSize: "0.62rem", color: "#ef4444", fontWeight: 500 }}>
                                ✗ {el}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comparison Mode Toggle + Generated Images */}
                      {(editedUrl || generatedUrl) && (
                        <div style={{ marginBottom: "0.85rem" }}>
                          {/* View mode toggle */}
                          {editedUrl && generatedUrl && (
                            <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem" }}>
                              {(["side", "slider"] as const).map((mode) => (
                                <button
                                  key={mode}
                                  onClick={() => setComparisonMode(mode)}
                                  aria-label={mode === "side" ? "Side by side comparison" : "Drag slider comparison"}
                                  style={{
                                    padding: "0.35rem 0.75rem", fontSize: "0.62rem", fontWeight: 600,
                                    borderRadius: "6px", cursor: "pointer", minHeight: "36px",
                                    background: comparisonMode === mode ? PINK_BG : "var(--ghost-bg)",
                                    border: `1px solid ${comparisonMode === mode ? PINK : "var(--border-default)"}`,
                                    color: comparisonMode === mode ? PINK : "var(--text-muted)",
                                  }}
                                >
                                  {mode === "side" ? "◫ Side by Side" : "↔ Drag to Compare"}
                                </button>
                              ))}
                            </div>
                          )}

                          {comparisonMode === "side" ? (
                            <div style={{ display: "grid", gridTemplateColumns: editedUrl && generatedUrl ? "1fr 1fr" : "1fr", gap: "0.65rem" }}>
                              {editedUrl && (
                                <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border-default)" }}>
                                  {renderImg(editedUrl, "Edited", { width: "100%", aspectRatio: "4/3", objectFit: "cover" as const, display: "block" }, () => setLightboxUrl(editedUrl))}
                                  <div style={{ padding: "0.4rem 0.55rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ghost-bg)" }}>
                                    <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)" }}>📸 Edited Original</span>
                                    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                                      <button onClick={() => setLightboxUrl(editedUrl)} aria-label="Zoom edited image" style={{ background: "none", border: "none", fontSize: "0.72rem", color: "var(--text-muted)", cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>🔍</button>
                                      <button onClick={() => downloadImage(editedUrl, `${selected?.title || "photo"}-edited.png`)} aria-label="Download edited image" style={{ background: "none", border: "none", fontSize: "0.72rem", color: "var(--text-muted)", cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>⬇</button>
                                      <button onClick={() => setAsCover(editedUrl, "edited")} aria-label="Set edited image as cover" style={{ background: "none", border: "none", fontSize: "0.62rem", fontWeight: 700, color: PINK, cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>
                                        {coverSet === "edited" ? "✓ Set!" : "Set Cover"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {generatedUrl && (
                                <div style={{ borderRadius: "10px", overflow: "hidden", border: `1px solid ${PINK_BORDER}` }}>
                                  {renderImg(generatedUrl, "AI Generated", { width: "100%", aspectRatio: "4/3", objectFit: "cover" as const, display: "block" }, () => setLightboxUrl(generatedUrl))}
                                  <div style={{ padding: "0.4rem 0.55rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: PINK_BG }}>
                                    <span style={{ fontSize: "0.62rem", fontWeight: 600, color: PINK }}>🎨 AI Storefront</span>
                                    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                                      <button onClick={() => setLightboxUrl(generatedUrl!)} aria-label="Zoom AI storefront image" style={{ background: "none", border: "none", fontSize: "0.72rem", color: PINK, cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>🔍</button>
                                      <button onClick={() => downloadImage(generatedUrl!, `${selected?.title || "photo"}-storefront.png`)} aria-label="Download AI storefront image" style={{ background: "none", border: "none", fontSize: "0.72rem", color: PINK, cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>⬇</button>
                                      <button onClick={() => setAsCover(generatedUrl!, "generated")} aria-label="Set AI storefront as cover" style={{ background: "none", border: "none", fontSize: "0.62rem", fontWeight: 700, color: PINK, cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>
                                        {coverSet === "generated" ? "✓ Set!" : "Set Cover"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Before/After Drag Slider */
                            <div>
                              <div
                                ref={sliderRef}
                                style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: `1px solid ${PINK_BORDER}`, cursor: "ew-resize", userSelect: "none", touchAction: "none" }}
                                onMouseDown={(e) => { sliderDragging.current = true; handleSliderMove(e.clientX); }}
                                onTouchStart={(e) => { sliderDragging.current = true; if (e.touches[0]) handleSliderMove(e.touches[0].clientX); }}
                              >
                                {/* Bottom layer: AI Generated (right side) */}
                                {renderImg(generatedUrl || editedUrl || "", "AI Generated", { width: "100%", aspectRatio: "4/3", objectFit: "cover" as const, display: "block" })}
                                {/* Top layer: Original/Edited (clipped by slider) */}
                                {editedUrl && generatedUrl && (
                                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${sliderPos}%`, overflow: "hidden" }}>
                                    {renderImg(editedUrl, "Edited", { width: "100%", height: "100%", objectFit: "cover" as const, display: "block", minWidth: sliderRef.current ? `${sliderRef.current.offsetWidth}px` : "100%" })}
                                  </div>
                                )}
                                {/* Slider handle */}
                                <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, transform: "translateX(-50%)", width: "3px", background: "#fff", boxShadow: "0 0 8px rgba(0,0,0,0.5)", zIndex: 2 }}>
                                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, color: "#333" }}>
                                    ↔
                                  </div>
                                </div>
                                {/* Labels */}
                                <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", padding: "0.2rem 0.55rem", borderRadius: "6px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", fontSize: "0.58rem", fontWeight: 700, color: "#fff", zIndex: 1 }}>📸 Before</div>
                                <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", padding: "0.2rem 0.55rem", borderRadius: "6px", background: `rgba(240,98,146,0.8)`, backdropFilter: "blur(4px)", fontSize: "0.58rem", fontWeight: 700, color: "#fff", zIndex: 1 }}>🎨 After</div>
                              </div>
                              <div style={{ padding: "0.4rem 0.55rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ghost-bg)", borderRadius: "0 0 10px 10px" }}>
                                <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Drag to compare</span>
                                <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                                  <button onClick={() => setLightboxUrl(generatedUrl || editedUrl || "")} aria-label="Zoom comparison image" style={{ background: "none", border: "none", fontSize: "0.72rem", color: "var(--text-muted)", cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>🔍</button>
                                  <button onClick={() => downloadImage(generatedUrl || editedUrl || "", `${selected?.title || "photo"}-enhanced.png`)} aria-label="Download enhanced image" style={{ background: "none", border: "none", fontSize: "0.72rem", color: "var(--text-muted)", cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>⬇</button>
                                  <button onClick={() => setAsCover(generatedUrl || editedUrl || "", "slider")} aria-label="Set as cover photo" style={{ background: "none", border: "none", fontSize: "0.62rem", fontWeight: 700, color: PINK, cursor: "pointer", padding: "0.2rem 0.35rem", minHeight: "36px" }}>
                                    {coverSet === "slider" ? "✓ Set!" : "⭐ Set Cover"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Enhancement Steps Applied */}
                      {enhSteps.length > 0 && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, marginBottom: "0.4rem" }}>Enhancement Steps Applied</div>
                          {enhSteps.slice(0, 7).map((step: string, i: number) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", padding: "0.25rem 0", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                              <span style={{ color: GREEN, flexShrink: 0, fontSize: "0.62rem", marginTop: "0.08rem" }}>✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button
                          onClick={runEnhance}
                          style={{
                            padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                            borderRadius: "10px", cursor: "pointer",
                            background: `linear-gradient(135deg, ${PINK}30, ${PINK_DARK}20)`,
                            border: `1px solid ${PINK_BORDER}`, color: PINK,
                          }}
                        >
                          🔄 Re-Enhance · 1 cr
                        </button>
                        {(editedUrl || generatedUrl) && (
                          <button
                            onClick={() => {
                              if (editedUrl) downloadImage(editedUrl, `${selected?.title || "photo"}-edited.png`);
                              if (generatedUrl) downloadImage(generatedUrl!, `${selected?.title || "photo"}-storefront.png`);
                            }}
                            style={{
                              padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 600,
                              borderRadius: "10px", cursor: "pointer",
                              background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            ⬇ Download All
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })()}
                </>
              )}

              {/* ── Photo Assessment Tool ── */}
              {activeEditorTool === "assess" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>📊</span>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Photo Assessment</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>AI scores your photos and provides specific improvement tips for better sales.</div>
                    </div>
                  </div>

                  {enhanceLoading && <BotLoadingState botName="PhotoBot Assessment" />}

                  {!enhanceLoading && !enhanceResult?.assessment && (
                    <div style={{ textAlign: "center" as const }}>
                      <button
                        onClick={runAssessOnly}
                        disabled={enhanceLoading}
                        style={{
                          padding: "0.65rem 1.5rem", fontSize: "0.85rem", fontWeight: 700,
                          borderRadius: "10px", cursor: "pointer",
                          background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                          border: "none", color: "#fff",
                        }}
                      >
                        📊 Run Photo Assessment · 1 cr
                      </button>
                    </div>
                  )}

                  {enhanceResult?.assessment && !enhanceLoading && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                        {[
                          { label: "Isolation", score: enhanceResult.assessment.isolationScore },
                          { label: "Lighting", score: enhanceResult.assessment.lightingScore },
                          { label: "Framing", score: enhanceResult.assessment.framingScore },
                          { label: "Overall", score: enhanceResult.assessment.overallScore },
                        ].map((s) => (
                          <div key={s.label} style={{
                            textAlign: "center" as const, padding: "0.65rem", borderRadius: "10px",
                            background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                          }}>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: (s.score ?? 0) >= 7 ? GREEN : (s.score ?? 0) >= 4 ? AMBER : "#ef4444" }}>
                              {s.score ?? "—"}
                            </div>
                            <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" as const }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Tips from AI */}
                      {selected?.photoTips?.length > 0 && (
                        <div style={{ marginBottom: "0.75rem" }}>
                          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, marginBottom: "0.4rem" }}>Improvement Tips</div>
                          {selected.photoTips.slice(0, 6).map((tip: string, i: number) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", padding: "0.3rem 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              <span style={{ color: AMBER, flexShrink: 0 }}>💡</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={runAssessOnly}
                        style={{
                          padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                          borderRadius: "10px", cursor: "pointer",
                          background: `linear-gradient(135deg, ${PINK}30, ${PINK_DARK}20)`,
                          border: `1px solid ${PINK_BORDER}`, color: PINK,
                        }}
                      >
                        🔄 Re-Assess · 1 cr
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ MEGABOT MULTI-AI RESULTS ═══ */}
      {selectedId && megaBotData && (() => {
        const PURPLE = "#8b5cf6";
        const providers: any[] = Array.isArray(megaBotData.providers) ? megaBotData.providers.filter((p: any) => !p.error) : [];
        const consensus = megaBotData.consensus || {};

        // Extract MegaBot enhancement variations
        const megaVariations: any[] = [];
        const allVars = consensus.enhancementVariations || consensus.enhancement_variations;
        if (Array.isArray(allVars)) megaVariations.push(...allVars);
        if (megaVariations.length === 0) {
          for (const p of providers) {
            const d = p.data || {};
            const pv = d.enhancementVariations || d.enhancement_variations;
            if (Array.isArray(pv) && pv.length > 0) { megaVariations.push(...pv); break; }
          }
        }

        // Extract missing shots, pro tips, condition docs
        const megaMissingShots: any[] = [];
        const megaProTips: any[] = [];
        const megaConditionDocs: any[] = [];
        const shotSet = new Set<string>();
        const tipSet = new Set<string>();
        const condSet = new Set<string>();
        for (const src of [consensus, ...providers.map((pr: any) => pr.data || {})]) {
          const shots = src.missingShots || src.missing_shots || src.missing_angles;
          if (Array.isArray(shots)) shots.forEach((s: any) => { const key = typeof s === "string" ? s : s.shotName || JSON.stringify(s); if (!shotSet.has(key)) { shotSet.add(key); megaMissingShots.push(s); } });
          const tips = src.professionalTips || src.professional_tips || src.improvement_tips;
          if (Array.isArray(tips)) tips.forEach((t: any) => { const key = typeof t === "string" ? t : JSON.stringify(t); if (!tipSet.has(key)) { tipSet.add(key); megaProTips.push(t); } });
          const conds = src.conditionDocumentation || src.condition_documentation;
          if (Array.isArray(conds)) conds.forEach((c: any) => { const key = typeof c === "string" ? c : c.issue || JSON.stringify(c); if (!condSet.has(key)) { condSet.add(key); megaConditionDocs.push(c); } });
        }

        // Priority action + secondary
        const priorityAction = consensus.priorityAction || providers.find((p: any) => p.data?.priorityAction)?.data?.priorityAction;
        const secondaryActions: string[] = consensus.secondaryActions || providers.find((p: any) => p.data?.secondaryActions)?.data?.secondaryActions || [];
        const salesImpact = consensus.salesImpactStatement || providers.find((p: any) => p.data?.salesImpactStatement)?.data?.salesImpactStatement;
        const coverRec = consensus.coverPhotoRecommendation || consensus.cover_photo_recommendation || providers.find((p: any) => p.data?.coverPhotoRecommendation)?.data?.coverPhotoRecommendation;

        // Lighting, background, photography guide, price impact
        const lightingSetup = consensus.lightingSetup || providers.find((p: any) => p.data?.lightingSetup)?.data?.lightingSetup;
        const bgRecommendation = consensus.backgroundRecommendation || providers.find((p: any) => p.data?.backgroundRecommendation)?.data?.backgroundRecommendation;
        const condPhotoGuide: any[] = consensus.conditionPhotographyGuide || providers.find((p: any) => p.data?.conditionPhotographyGuide)?.data?.conditionPhotographyGuide || [];
        const priceImpact = consensus.priceImpactEstimate || providers.find((p: any) => p.data?.priceImpactEstimate)?.data?.priceImpactEstimate;

        // Buyer psychology + platform guide
        const buyerTrigger = consensus.buyerEmotionalTrigger || providers.find((p: any) => p.data?.buyerEmotionalTrigger)?.data?.buyerEmotionalTrigger;
        const trustSignals: string[] = consensus.trustSignals || providers.find((p: any) => p.data?.trustSignals)?.data?.trustSignals || [];
        const purchaseBarriers: string[] = consensus.purchaseBarriers || providers.find((p: any) => p.data?.purchaseBarriers)?.data?.purchaseBarriers || [];
        const competitiveEdge = consensus.competitiveEdge || providers.find((p: any) => p.data?.competitiveEdge)?.data?.competitiveEdge;
        const platformGuide = consensus.platformPhotoGuide || providers.find((p: any) => p.data?.platformPhotoGuide)?.data?.platformPhotoGuide;

        // Count how many variations are already generated
        const generatedCount = megaVariations.filter((v: any) => {
          const vName = v.variationName || v.variation_name;
          return variationResults.some((vr: any) => vr.variationName === vName);
        }).length;
        const pendingCount = megaVariations.length - generatedCount;

        return (
          <div style={{
            background: "var(--bg-card-solid)", borderRadius: "1rem", marginBottom: "1.5rem",
            border: `1px solid ${PURPLE}30`, overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "1rem 1.25rem",
              background: `linear-gradient(135deg, ${PURPLE}12, ${PURPLE}04)`,
              borderBottom: `1px solid ${PURPLE}20`,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>⚡</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>MegaBot Multi-AI Photo Analysis</span>
                <span style={{ padding: "0.12rem 0.45rem", borderRadius: "999px", fontSize: "0.52rem", fontWeight: 700, background: `${PURPLE}18`, color: PURPLE }}>
                  {providers.length} AI
                </span>
              </div>
              {megaBotData.agreementScore != null && (
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: PURPLE }}>{megaBotData.agreementScore}% Agreement</span>
              )}
            </div>

            <div style={{ padding: "1rem 1.25rem" }}>
              {/* Sales Impact Statement */}
              {salesImpact && (
                <div style={{
                  padding: "0.6rem 0.85rem", borderRadius: "0.5rem", marginBottom: "1rem",
                  background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GREEN, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>💰 Sales Impact</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{typeof salesImpact === "string" ? salesImpact : ""}</div>
                </div>
              )}

              {/* Priority Action */}
              {priorityAction && (
                <div style={{
                  padding: "0.6rem 0.85rem", borderRadius: "0.5rem", marginBottom: "1rem",
                  background: `${PINK}08`, border: `1px solid ${PINK_BORDER}`,
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>🎯 Priority Action</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{typeof priorityAction === "string" ? priorityAction : ""}</div>
                </div>
              )}

              {/* Provider Cards — expandable */}
              {providers.map((p: any) => {
                const pm = PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                const d = p.data || {};
                const score = d.overallPhotoScore || d.overall_quality_score || d.qualityScore;
                const summary = d.executive_summary || d.summary || "";
                const providerTips = d.professionalTips || d.professional_tips || d.improvement_tips || [];
                const providerMissing = d.missingShots || d.missing_shots || d.missing_angles || [];

                return (
                  <div key={p.provider} style={{
                    padding: "0.75rem", borderRadius: "0.6rem", marginBottom: "0.5rem",
                    background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                      <span>{pm.icon}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: pm.color }}>{pm.label}</span>
                      <span style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontStyle: "italic", padding: "0.1rem 0.4rem", background: "var(--ghost-bg)", borderRadius: "999px", border: "1px solid var(--border-default)" }}>{pm.specialty}</span>
                      {score != null && <span style={{ marginLeft: "auto", fontSize: "0.82rem", fontWeight: 800, color: Number(score) >= 7 ? GREEN : Number(score) >= 4 ? AMBER : "#ef4444" }}>{score}/10</span>}
                    </div>
                    {summary && <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: "0 0 0.4rem", lineHeight: 1.5 }}>{typeof summary === "string" ? summary.slice(0, 300) : ""}</p>}

                    {/* Scoring chips */}
                    {(d.presentationScore || d.lightingScore || d.compositionScore || d.backgroundScore || d.sharpnessScore || d.emotionalAppeal) && (
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" as const, marginBottom: "0.4rem" }}>
                        {[
                          { label: "Presentation", val: d.presentationScore },
                          { label: "Lighting", val: d.lightingScore },
                          { label: "Composition", val: d.compositionScore },
                          { label: "Background", val: d.backgroundScore },
                          { label: "Color", val: d.colorFidelity },
                          { label: "Detail", val: d.detailCapture },
                          { label: "Sharpness", val: d.sharpnessScore },
                          { label: "Exposure", val: d.exposureAccuracy },
                          { label: "Scale", val: d.scaleClarity },
                          { label: "Appeal", val: d.emotionalAppeal },
                          { label: "Mobile", val: d.mobileRendering },
                        ].filter((s) => s.val != null).map((s) => (
                          <span key={s.label} style={{ fontSize: "0.58rem", padding: "0.12rem 0.4rem", borderRadius: "999px", background: `${pm.color}12`, border: `1px solid ${pm.color}25`, color: pm.color, fontWeight: 600 }}>
                            {s.label}: {s.val}/10
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Top 3 tips from this provider */}
                    {Array.isArray(providerTips) && providerTips.length > 0 && (
                      <div style={{ marginTop: "0.3rem" }}>
                        {providerTips.slice(0, 3).map((tip: any, i: number) => (
                          <div key={i} style={{ display: "flex", gap: "0.3rem", fontSize: "0.65rem", color: "var(--text-muted)", padding: "0.1rem 0" }}>
                            <span style={{ color: pm.color, flexShrink: 0 }}>•</span>
                            <span>{typeof tip === "string" ? tip : JSON.stringify(tip)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Cover Photo Recommendation */}
              {coverRec && (
                <div style={{ padding: "0.6rem 0.85rem", borderRadius: "0.5rem", marginTop: "0.75rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.15)" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: TEAL, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>⭐ Cover Photo Recommendation</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {typeof coverRec === "string" ? coverRec : coverRec.reasoning || JSON.stringify(coverRec)}
                  </div>
                </div>
              )}

              {/* Enhancement Variations from MegaBot */}
              {megaVariations.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>🎨 AI Enhancement Variations</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.6rem" }}>
                    {megaVariations.slice(0, 5).map((v: any, i: number) => {
                      const vName = v.variationName || v.variation_name || `Variation ${i + 1}`;
                      const vResult = variationResults.find((vr: any) => vr.variationName === vName);
                      const vImgUrl = vResult?.generatedPhotoUrl || vResult?.editedPhotoUrl || null;
                      const isGenerating = variationLoading === vName;

                      return (
                        <div key={i} style={{
                          background: "var(--ghost-bg)", border: `1px solid ${PURPLE}20`,
                          borderRadius: "0.6rem", overflow: "hidden",
                        }}>
                          {/* Image or placeholder */}
                          {vImgUrl ? (
                            renderImg(vImgUrl, vName, { width: "100%", aspectRatio: "1", objectFit: "cover" as const, display: "block" }, () => setLightboxUrl(vImgUrl))
                          ) : isGenerating ? (
                            <div style={{ width: "100%", aspectRatio: "1", background: `${PURPLE}08`, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                              <span style={{ fontSize: "1.5rem" }}>🎨</span>
                              <span style={{ color: PURPLE, fontSize: "0.68rem", fontWeight: 600 }}>Generating...</span>
                            </div>
                          ) : (
                            <div style={{ width: "100%", aspectRatio: "1", background: `${PURPLE}05`, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.75rem" }}>
                              <span style={{ fontSize: "1.2rem" }}>✨</span>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.62rem", textAlign: "center" as const }}>{v.description ? v.description.slice(0, 80) : "Ready to generate"}</span>
                            </div>
                          )}
                          <div style={{ padding: "0.55rem" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{vName}</div>
                            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "0.15rem" }}>
                              {(v.bestFor || v.best_for) && (
                                <span style={{ fontSize: "0.52rem", padding: "0.1rem 0.4rem", borderRadius: "999px", background: `${PURPLE}12`, color: PURPLE, fontWeight: 600 }}>
                                  {v.bestFor || v.best_for}
                                </span>
                              )}
                              {(v.expectedScoreImprovement || v.expected_score_improvement) && (
                                <span style={{ fontSize: "0.52rem", padding: "0.1rem 0.4rem", borderRadius: "999px", background: "rgba(16,185,129,0.1)", color: GREEN, fontWeight: 600 }}>
                                  +{v.expectedScoreImprovement || v.expected_score_improvement} pts
                                </span>
                              )}
                            </div>
                            <div style={{ marginTop: "0.25rem" }}>
                              {vImgUrl ? (
                                <div style={{ display: "flex", gap: "0.3rem" }}>
                                  <button onClick={() => setAsCover(vImgUrl, `megavar-${i}`)} style={{
                                    flex: 1, padding: "0.28rem 0", fontSize: "0.62rem", fontWeight: 700,
                                    borderRadius: "6px", cursor: "pointer",
                                    background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`, border: "none", color: "#fff",
                                  }}>
                                    {coverSet === `megavar-${i}` ? "✓ Set!" : "⭐ Cover"}
                                  </button>
                                  <button onClick={() => downloadImage(vImgUrl, `${selected?.title || "photo"}-${vName}.png`)} style={{
                                    padding: "0.28rem 0.35rem", fontSize: "0.58rem", fontWeight: 600,
                                    borderRadius: "6px", cursor: "pointer",
                                    background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-muted)",
                                  }} title="Download">
                                    ⬇
                                  </button>
                                  <button onClick={() => generateMegaVariation(v)} disabled={!!variationLoading} style={{
                                    padding: "0.28rem 0.35rem", fontSize: "0.58rem", fontWeight: 600,
                                    borderRadius: "6px", cursor: variationLoading ? "wait" : "pointer",
                                    background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-muted)",
                                  }}>
                                    ↻
                                  </button>
                                </div>
                              ) : !isGenerating ? (
                                <button onClick={() => generateMegaVariation(v)} disabled={!!variationLoading} style={{
                                  width: "100%", padding: "0.3rem 0", fontSize: "0.62rem", fontWeight: 700,
                                  borderRadius: "6px", cursor: variationLoading ? "wait" : "pointer",
                                  background: `${PURPLE}12`, border: `1px solid ${PURPLE}25`, color: PURPLE,
                                  opacity: variationLoading ? 0.5 : 1,
                                }}>
                                  🎨 Generate · 1 cr
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missing Shots — with how-to and sales impact */}
              {megaMissingShots.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: TEAL, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>📸 Missing Shots Checklist</div>
                    <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{megaMissingShots.length} recommended</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                    {megaMissingShots.slice(0, 8).map((shot: any, i: number) => {
                      const shotName = typeof shot === "string" ? shot : shot.shotName || shot.angle || JSON.stringify(shot);
                      const shotWhy = typeof shot === "object" ? (shot.why || shot.reason || "") : "";
                      const howToShoot = typeof shot === "object" ? (shot.howToShoot || shot.how_to_shoot || "") : "";
                      const shotSalesImpact = typeof shot === "object" ? (shot.salesImpact || shot.sales_impact || "") : "";
                      const platforms = typeof shot === "object" ? (shot.platformsThatNeedIt || shot.platforms || []) : [];
                      return (
                        <div key={i} style={{ padding: "0.4rem 0.55rem", borderRadius: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                          <div style={{ display: "flex", gap: "0.3rem", alignItems: "flex-start", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                            <span style={{ color: TEAL, flexShrink: 0, fontSize: "0.85rem" }}>☐</span>
                            <span style={{ fontWeight: 700 }}>{shotName}</span>
                          </div>
                          {shotWhy && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem", lineHeight: 1.4 }}>{shotWhy}</div>}
                          {howToShoot && (
                            <div style={{ marginTop: "0.25rem", padding: "0.25rem 0.4rem", borderRadius: "4px", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.1)", fontSize: "0.58rem", color: TEAL, lineHeight: 1.4 }}>
                              📷 {howToShoot}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                            {shotSalesImpact && <span style={{ fontSize: "0.48rem", padding: "0.08rem 0.3rem", borderRadius: "999px", background: "rgba(16,185,129,0.08)", color: GREEN, fontWeight: 600 }}>💰 {shotSalesImpact}</span>}
                            {Array.isArray(platforms) && platforms.slice(0, 3).map((pl: string, j: number) => (
                              <span key={j} style={{ fontSize: "0.48rem", padding: "0.08rem 0.3rem", borderRadius: "999px", background: `${PURPLE}08`, color: PURPLE, fontWeight: 500 }}>{pl}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Professional Tips */}
              {megaProTips.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AMBER, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.4rem" }}>💡 Professional Tips</div>
                  {megaProTips.slice(0, 5).map((tip: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: "0.35rem", alignItems: "flex-start", fontSize: "0.72rem", color: "var(--text-secondary)", padding: "0.2rem 0", lineHeight: 1.5 }}>
                      <span style={{ color: AMBER, flexShrink: 0, marginTop: "0.1rem" }}>•</span>
                      <span>{typeof tip === "string" ? tip : JSON.stringify(tip)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Condition Documentation */}
              {megaConditionDocs.length > 0 && (
                <div style={{
                  marginTop: "1rem", padding: "0.6rem 0.85rem", borderRadius: "0.5rem",
                  background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AMBER, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.3rem" }}>🛡️ Condition Documentation</div>
                  {megaConditionDocs.slice(0, 6).map((c: any, i: number) => {
                    const text = typeof c === "string" ? c : c.issue || JSON.stringify(c);
                    const severity = typeof c === "object" ? c.severity : null;
                    const photoTip = typeof c === "object" ? c.photographyTip : null;
                    return (
                      <div key={i} style={{ padding: "0.2rem 0" }}>
                        <div style={{ display: "flex", gap: "0.3rem", alignItems: "flex-start", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          <span style={{ color: AMBER, flexShrink: 0 }}>•</span>
                          <span style={{ flex: 1 }}>{text}</span>
                          {severity && <span style={{ fontSize: "0.52rem", padding: "0.08rem 0.35rem", borderRadius: "999px", background: severity === "Significant" ? "rgba(239,68,68,0.1)" : severity === "Moderate" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", color: severity === "Significant" ? "#ef4444" : severity === "Moderate" ? "#f59e0b" : "#10b981", fontWeight: 600, flexShrink: 0 }}>{severity}</span>}
                        </div>
                        {photoTip && <div style={{ marginLeft: "1rem", fontSize: "0.6rem", color: TEAL, fontStyle: "italic", marginTop: "0.1rem" }}>📷 {photoTip}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Condition Photography Guide */}
              {Array.isArray(condPhotoGuide) && condPhotoGuide.length > 0 && (
                <div style={{
                  marginTop: "0.75rem", padding: "0.6rem 0.85rem", borderRadius: "0.5rem",
                  background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.15)",
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: TEAL, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.3rem" }}>📷 How to Photograph Condition</div>
                  {condPhotoGuide.slice(0, 5).map((tip: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: "0.3rem", alignItems: "flex-start", fontSize: "0.68rem", color: "var(--text-secondary)", padding: "0.15rem 0", lineHeight: 1.5 }}>
                      <span style={{ color: TEAL, flexShrink: 0 }}>•</span>
                      <span>{typeof tip === "string" ? tip : JSON.stringify(tip)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Lighting & Background Recommendations */}
              {(lightingSetup || bgRecommendation) && (
                <div style={{ display: "grid", gridTemplateColumns: lightingSetup && bgRecommendation ? "1fr 1fr" : "1fr", gap: "0.6rem", marginTop: "1rem" }}>
                  {lightingSetup && (
                    <div style={{ padding: "0.6rem 0.85rem", borderRadius: "0.5rem", background: `${PURPLE}06`, border: `1px solid ${PURPLE}15` }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.3rem" }}>💡 Lighting Setup</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{typeof lightingSetup === "string" ? lightingSetup : JSON.stringify(lightingSetup)}</div>
                    </div>
                  )}
                  {bgRecommendation && (
                    <div style={{ padding: "0.6rem 0.85rem", borderRadius: "0.5rem", background: `${PINK}06`, border: `1px solid ${PINK_BORDER}` }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.3rem" }}>🖼️ Background</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{typeof bgRecommendation === "string" ? bgRecommendation : JSON.stringify(bgRecommendation)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Price Impact Estimate */}
              {priceImpact && (
                <div style={{
                  marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(0,188,212,0.04))",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: GREEN, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>📈 Photo Quality Price Impact</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                    {priceImpact.currentPhotoQuality != null && (
                      <div style={{ textAlign: "center" as const, padding: "0.4rem", borderRadius: "8px", background: "var(--ghost-bg)" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: (priceImpact.currentPhotoQuality >= 7 ? GREEN : priceImpact.currentPhotoQuality >= 4 ? AMBER : "#ef4444") }}>
                          {priceImpact.currentPhotoQuality}/10
                        </div>
                        <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", textTransform: "uppercase" as const }}>Current Quality</div>
                      </div>
                    )}
                    {priceImpact.estimatedPriceBoost && (
                      <div style={{ textAlign: "center" as const, padding: "0.4rem", borderRadius: "8px", background: "rgba(16,185,129,0.06)" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: GREEN }}>
                          +{typeof priceImpact.estimatedPriceBoost === "string" ? priceImpact.estimatedPriceBoost : `${priceImpact.estimatedPriceBoost}%`}
                        </div>
                        <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", textTransform: "uppercase" as const }}>Price Boost</div>
                      </div>
                    )}
                    {priceImpact.estimatedTimeReduction && (
                      <div style={{ textAlign: "center" as const, padding: "0.4rem", borderRadius: "8px", background: "rgba(0,188,212,0.06)" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: TEAL }}>
                          {typeof priceImpact.estimatedTimeReduction === "string" ? priceImpact.estimatedTimeReduction : `${priceImpact.estimatedTimeReduction}%`}
                        </div>
                        <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", textTransform: "uppercase" as const }}>Faster Sale</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Secondary Actions */}
              {Array.isArray(secondaryActions) && secondaryActions.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.35rem" }}>📋 Next Steps</div>
                  {secondaryActions.slice(0, 4).map((action: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: "0.35rem", alignItems: "flex-start", fontSize: "0.72rem", color: "var(--text-secondary)", padding: "0.2rem 0", lineHeight: 1.5 }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.52rem", fontWeight: 800, color: "#fff",
                        background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
                      }}>{i + 1}</span>
                      <span>{typeof action === "string" ? action : JSON.stringify(action)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Buyer Psychology Intelligence ── */}
              {(buyerTrigger || trustSignals.length > 0 || purchaseBarriers.length > 0 || competitiveEdge) && (
                <div style={{
                  marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(240,98,146,0.04))",
                  border: `1px solid ${PURPLE}18`,
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>🧠 Buyer Psychology Intelligence</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    {buyerTrigger && (
                      <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.52rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: "0.2rem" }}>❤️ Emotional Trigger</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{typeof buyerTrigger === "string" ? buyerTrigger : JSON.stringify(buyerTrigger)}</div>
                      </div>
                    )}
                    {competitiveEdge && (
                      <div style={{ padding: "0.5rem 0.65rem", borderRadius: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                        <div style={{ fontSize: "0.52rem", fontWeight: 700, color: GREEN, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: "0.2rem" }}>⚔️ Competitive Edge</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{typeof competitiveEdge === "string" ? competitiveEdge : JSON.stringify(competitiveEdge)}</div>
                      </div>
                    )}
                  </div>
                  {trustSignals.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.52rem", fontWeight: 700, color: GREEN, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: "0.25rem" }}>✅ Trust Signals to Highlight</div>
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" as const }}>
                        {trustSignals.slice(0, 6).map((sig: string, i: number) => (
                          <span key={i} style={{ fontSize: "0.58rem", padding: "0.12rem 0.45rem", borderRadius: "999px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", color: GREEN, fontWeight: 600 }}>
                            {typeof sig === "string" ? sig : JSON.stringify(sig)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {purchaseBarriers.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.52rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: "0.25rem" }}>⚠️ Purchase Barriers to Address</div>
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" as const }}>
                        {purchaseBarriers.slice(0, 6).map((bar: string, i: number) => (
                          <span key={i} style={{ fontSize: "0.58rem", padding: "0.12rem 0.45rem", borderRadius: "999px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 600 }}>
                            {typeof bar === "string" ? bar : JSON.stringify(bar)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Platform-Specific Photo Guide ── */}
              {platformGuide && typeof platformGuide === "object" && Object.keys(platformGuide).length > 0 && (
                <div style={{
                  marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                  background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)",
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: TEAL, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>🌐 Platform Photo Optimization Guide</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem" }}>
                    {[
                      { key: "ebay", icon: "🛒", label: "eBay", color: "#0064d2" },
                      { key: "facebook", icon: "📘", label: "Facebook", color: "#1877f2" },
                      { key: "etsy", icon: "🧡", label: "Etsy", color: "#f1641e" },
                      { key: "instagram", icon: "📸", label: "Instagram", color: "#e1306c" },
                    ].filter((plat) => platformGuide[plat.key]).map((plat) => {
                      const pg = platformGuide[plat.key];
                      return (
                        <div key={plat.key} style={{ padding: "0.55rem 0.65rem", borderRadius: "0.45rem", background: "var(--ghost-bg)", border: `1px solid ${plat.color}18` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.3rem" }}>
                            <span style={{ fontSize: "0.85rem" }}>{plat.icon}</span>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: plat.color }}>{plat.label}</span>
                          </div>
                          {pg.idealAspectRatio && (
                            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>
                              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Ratio:</span> {pg.idealAspectRatio}
                            </div>
                          )}
                          {pg.backgroundTip && (
                            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>
                              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Background:</span> {pg.backgroundTip}
                            </div>
                          )}
                          {pg.photoCount && (
                            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>
                              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Photos:</span> {pg.photoCount}
                            </div>
                          )}
                          {pg.keyTip && (
                            <div style={{ fontSize: "0.55rem", color: plat.color, fontWeight: 600, marginTop: "0.2rem", padding: "0.15rem 0.35rem", borderRadius: "4px", background: `${plat.color}08` }}>
                              💡 {pg.keyTip}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Custom Variation Builder ── */}
              <div style={{
                marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "0.5rem",
                background: `${PURPLE}05`, border: `1px dashed ${PURPLE}25`,
              }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: PURPLE, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.4rem" }}>🎨 Custom Variation Builder</div>
                {/* Platform Preset Chips */}
                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  {[
                    { label: "eBay White BG", prompt: "Clean pure white background, item centered, even soft lighting, no shadows, professional marketplace photo optimized for eBay search results" },
                    { label: "Etsy Lifestyle", prompt: "Warm lifestyle context, natural materials background (wood, linen), soft golden-hour window light, artisan feel, styled but not cluttered, Etsy aesthetic" },
                    { label: "Instagram Square", prompt: "Square 1:1 composition, visually striking, bold contrast, clean modern background with subtle gradient, designed for Instagram grid scrolling impact" },
                    { label: "Facebook Quick-Sell", prompt: "Bright, clear, eye-catching photo with clean background, optimized for Facebook Marketplace mobile scroll, item fills frame, high contrast" },
                    { label: "Auction Catalog", prompt: "Formal auction-house presentation, neutral gray gradient backdrop, museum-quality lighting, detailed and dignified, Sotheby's catalog style" },
                    { label: "Warm Studio", prompt: "Warm studio setting, rich wood surface, soft diffused lighting from upper left, gentle shadows, premium professional product photography feel" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setCustomVarName(preset.label); setCustomVarPrompt(preset.prompt); }}
                      style={{
                        padding: "0.18rem 0.5rem", fontSize: "0.55rem", fontWeight: 600,
                        borderRadius: "999px", cursor: "pointer",
                        background: customVarName === preset.label ? `${PURPLE}20` : "var(--ghost-bg)",
                        border: `1px solid ${customVarName === preset.label ? PURPLE : "var(--border-default)"}`,
                        color: customVarName === preset.label ? PURPLE : "var(--text-muted)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <input
                    value={customVarName}
                    onChange={(e) => setCustomVarName(e.target.value)}
                    placeholder="Variation name (optional)"
                    style={{
                      width: "35%", padding: "0.4rem 0.65rem", fontSize: "0.72rem",
                      borderRadius: "6px", border: "1px solid var(--border-default)",
                      background: "var(--bg-card-solid)", color: "var(--text-primary)",
                      outline: "none", fontFamily: "inherit",
                    }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = PURPLE; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border-default)"; }}
                  />
                  <input
                    value={customVarPrompt}
                    onChange={(e) => setCustomVarPrompt(e.target.value)}
                    placeholder="Describe your custom enhancement: &quot;warm studio lighting, oak desk background, soft shadow...&quot;"
                    style={{
                      flex: 1, padding: "0.4rem 0.65rem", fontSize: "0.72rem",
                      borderRadius: "6px", border: "1px solid var(--border-default)",
                      background: "var(--bg-card-solid)", color: "var(--text-primary)",
                      outline: "none", fontFamily: "inherit",
                    }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = PURPLE; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border-default)"; }}
                    onKeyDown={(e) => { if (e.key === "Enter") submitCustomVariation(); }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={submitCustomVariation}
                    disabled={!customVarPrompt.trim() || !!variationLoading}
                    style={{
                      padding: "0.35rem 0.85rem", fontSize: "0.68rem", fontWeight: 700,
                      borderRadius: "6px", cursor: !customVarPrompt.trim() || variationLoading ? "not-allowed" : "pointer",
                      background: customVarPrompt.trim() && !variationLoading ? `linear-gradient(135deg, ${PURPLE}, ${PINK})` : "var(--ghost-bg)",
                      border: "none", color: customVarPrompt.trim() && !variationLoading ? "#fff" : "var(--text-muted)",
                      opacity: !customVarPrompt.trim() || variationLoading ? 0.5 : 1,
                    }}
                  >
                    🎨 Generate Custom · 1 cr
                  </button>
                  {megaVariations.length > 0 && pendingCount > 0 && (
                    <button
                      onClick={() => generateAllVariations(megaVariations)}
                      disabled={batchGenerating || !!variationLoading}
                      style={{
                        padding: "0.35rem 0.85rem", fontSize: "0.68rem", fontWeight: 700,
                        borderRadius: "6px", cursor: batchGenerating || variationLoading ? "not-allowed" : "pointer",
                        background: batchGenerating ? "var(--ghost-bg)" : `${PURPLE}15`,
                        border: `1px solid ${PURPLE}30`, color: batchGenerating ? "var(--text-muted)" : PURPLE,
                        opacity: batchGenerating || variationLoading ? 0.6 : 1,
                      }}
                    >
                      {batchGenerating ? "⏳ Generating..." : `⚡ Generate All ${pendingCount} Variations · ${pendingCount} cr`}
                    </button>
                  )}
                  <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                    {generatedCount}/{megaVariations.length + variationResults.filter((v: any) => v.variationName?.startsWith("Custom")).length} generated
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ EMPTY STATE (no item selected) ═══ */}
      {!selectedId && (
        <div style={{
          background: "var(--bg-card-solid)", border: `1px solid ${PINK_BORDER}`,
          borderRadius: "1rem", padding: "2.5rem 1.5rem", textAlign: "center" as const,
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📷</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Ready for Photo Editing</div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: 420, margin: "0 auto 1.25rem", lineHeight: 1.6 }}>
            Select an item above to access professional AI photo editing. Clean backgrounds, remove distractions, generate storefront images, and get quality assessments — all while protecting your item&apos;s authentic condition.
          </p>
          <div style={{ maxWidth: 400, margin: "0 auto 1.25rem", textAlign: "left" as const, padding: "0.85rem", background: PINK_BG, borderRadius: "0.65rem", border: `1px solid ${PINK_BORDER}` }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: PINK, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>What PhotoBot Can Do</div>
            {[
              { icon: "🧹", text: "Auto-Clean — remove background clutter, people, and distractions" },
              { icon: "🖼️", text: "Background Remove — clean neutral backgrounds for marketplaces" },
              { icon: "✨", text: "Enhance & Stage — DALL-E 3 HD professional storefront imagery" },
              { icon: "📊", text: "Photo Assessment — AI scoring with actionable improvement tips" },
              { icon: "⚡", text: "MegaBot — 4 AI specialists analyze your photos simultaneously" },
              { icon: "🛡️", text: "Iron Rule — your item is NEVER modified, only surroundings" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", padding: "0.3rem 0", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0 }}>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", marginBottom: "0.5rem" }}>
            {[
              { value: "4", label: "Editing Tools" },
              { value: "HD", label: "DALL-E 3" },
              { value: "4 AI", label: "MegaBot Experts" },
            ].map((m, i) => (
              <div key={i} style={{ textAlign: "center" as const }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: PINK }}>{m.value}</div>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase" as const }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STICKY BOTTOM ACTION BAR ═══ */}
      {selectedId && selected && (
        <div data-no-print style={{
          position: "sticky" as const, bottom: 0, zIndex: 100,
          background: "var(--bg-card-solid)", backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border-default)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
          padding: "0.85rem 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
            {photos[0] && (
              renderImg(photos[0].filePath, "Item thumbnail", { width: 32, height: 32, borderRadius: "0.35rem", objectFit: "cover" as const, flexShrink: 0 })
            )}
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>
              {selected.title}
            </span>
            <span style={{
              padding: "0.15rem 0.5rem", borderRadius: 99, fontSize: "0.58rem", fontWeight: 700, flexShrink: 0,
              background: PINK_BG, color: PINK, border: `1px solid ${PINK_BORDER}`,
            }}>
              📷 {photos.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={() => setActiveEditorTool("clean")}
              disabled={editLoading}
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", cursor: editLoading ? "not-allowed" : "pointer",
                background: editLoading ? "var(--ghost-bg)" : `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                border: "none", color: "#fff", minHeight: "44px",
                boxShadow: editLoading ? "none" : `0 2px 10px rgba(240,98,146,0.3)`,
              }}
            >
              {editLoading ? "Processing..." : "📷 PhotoBot · 1 cr"}
            </button>
            <button
              onClick={runMegaBot}
              disabled={megaBotLoading}
              style={{
                padding: "0.45rem 1rem", fontSize: "0.75rem", fontWeight: 700,
                borderRadius: "10px", cursor: megaBotLoading ? "not-allowed" : "pointer",
                background: megaBotLoading ? "var(--ghost-bg)" : `linear-gradient(135deg, ${PINK}30, ${PINK_DARK}20)`,
                border: `1px solid ${PINK}55`, color: PINK, minHeight: "44px",
              }}
            >
              {megaBotLoading ? "Running..." : megaBotData ? "🔄 Re-Run MegaBot · 3 cr" : "⚡ MegaBot · 3 cr"}
            </button>
            <Link
              href={`/items/${selectedId}`}
              style={{
                padding: "0.45rem 0.85rem", fontSize: "0.72rem", fontWeight: 600,
                borderRadius: "10px", textDecoration: "none", minHeight: "44px",
                background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                color: "var(--text-secondary)", display: "flex", alignItems: "center",
              }}
            >
              View Item →
            </Link>
          </div>
        </div>
      )}

      {/* ═══ LIGHTBOX MODAL ═══ */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-label="Full-size image viewer"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out", animation: "fadeIn 0.2s ease",
          }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            aria-label="Close lightbox"
            style={{
              position: "absolute", top: "1rem", right: "1rem", zIndex: 10001,
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", fontSize: "1.3rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
            onError={() => { handleImgError(lightboxUrl); setLightboxUrl(null); }}
            style={{
              maxWidth: "92vw", maxHeight: "90vh",
              borderRadius: "12px", objectFit: "contain",
              boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
              cursor: "default",
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", bottom: "1.25rem",
              display: "flex", gap: "0.5rem",
            }}
          >
            <button
              onClick={() => downloadImage(lightboxUrl, "photo.png")}
              aria-label="Download full-size image"
              style={{
                padding: "0.5rem 1.2rem", fontSize: "0.78rem", fontWeight: 700,
                borderRadius: "10px", cursor: "pointer", minHeight: "44px",
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff", backdropFilter: "blur(8px)",
              }}
            >
              ⬇ Download
            </button>
            <button
              onClick={() => { setAsCover(lightboxUrl, "lightbox"); setLightboxUrl(null); }}
              aria-label="Set as cover photo"
              style={{
                padding: "0.5rem 1.2rem", fontSize: "0.78rem", fontWeight: 700,
                borderRadius: "10px", cursor: "pointer", minHeight: "44px",
                background: `linear-gradient(135deg, ${PINK}, ${PINK_DARK})`,
                border: "none", color: "#fff",
              }}
            >
              ⭐ Set as Cover
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
