"use client";

import { useState, useEffect, useMemo } from "react";
import type { PackageSuggestion } from "@/lib/shipping/package-suggestions";
import type { ShippingMethodSuggestion } from "@/lib/shipping/package-suggestions";
import type { MetroEstimate } from "@/lib/shipping/metro-estimates";
import { getFreightEstimates } from "@/lib/shipping/freight-estimates";
import type { FreightEstimate } from "@/lib/shipping/freight-estimates";
import LocalPickupPanel from "./LocalPickupPanel";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

type ShippingRate = {
  object_id: string;
  provider: string;
  servicelevel_name: string;
  amount: string;
  estimated_days: number | null;
};

/** Normalize rates from any API format into the ShippingRate shape */
function normalizeRates(raw: any[]): ShippingRate[] {
  return raw.map((r: any, i: number) => ({
    object_id: r.object_id || r.id || `rate-${i}`,
    provider: r.provider || r.carrier || "Unknown",
    servicelevel_name: r.servicelevel_name || r.service || r.servicelevel?.name || "Standard",
    amount: String(r.amount ?? r.rate ?? r.price ?? 0),
    estimated_days: r.estimated_days ?? r.estimatedDays ?? (r.days ? parseInt(String(r.days)) : null),
  }));
}

/** Generate fallback estimated rates when the shipping API returns nothing */
function generateFallbackRates(weightLbs: number): ShippingRate[] {
  const base = Math.max(5, weightLbs * 0.8);
  return [
    { object_id: "est-1", provider: "USPS", servicelevel_name: "Priority Mail", amount: (base + 3.95).toFixed(2), estimated_days: 2 },
    { object_id: "est-2", provider: "USPS", servicelevel_name: "First Class Package", amount: (base + 0.50).toFixed(2), estimated_days: 4 },
    { object_id: "est-3", provider: "UPS", servicelevel_name: "UPS Ground", amount: (base + 7.40).toFixed(2), estimated_days: 5 },
    { object_id: "est-4", provider: "FedEx", servicelevel_name: "FedEx Home Delivery", amount: (base + 8.20).toFixed(2), estimated_days: 3 },
  ];
}

type ShipmentLabelData = {
  id: string;
  carrier: string;
  service: string;
  trackingNumber: string;
  labelUrl: string;
  rate: number | string;
  status: string;
  deliveryMethod: string;
  estimatedDays: number | null;
  statusHistory?: string;
  createdAt?: string;
  isDemo?: boolean;
};

type Props = {
  itemId: string;
  mode: "pre-sale" | "post-sale";
  fromZip: string | null;
  suggestion: PackageSuggestion | null;
  metroEstimates: MetroEstimate[];
  savedShipping: {
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    isFragile: boolean;
    preference: string;
  };
  itemStatus: string;
  existingLabel: ShipmentLabelData | null;
  itemValue: number | null; // mid estimate for insurance check
  shippingMethod?: ShippingMethodSuggestion;
  saleMethod?: string;
  saleRadius?: number;
};

const BOX_PRESETS: Record<string, { l: number; w: number; h: number; label: string; desc: string }> = {
  tiny:      { l: 6,  w: 4,  h: 3,  label: "Tiny (6×4×3)",        desc: "Jewelry, small accessories, guitar picks" },
  small:     { l: 10, w: 8,  h: 4,  label: "Small (10×8×4)",      desc: "Guitar pedals, small electronics, books, CDs" },
  medium:    { l: 14, w: 12, h: 8,  label: "Medium (14×12×8)",    desc: "Small appliances, boots, kitchenware, board games" },
  large:     { l: 18, w: 14, h: 12, label: "Large (18×14×12)",    desc: "Larger electronics, tools, multiple items" },
  xl:        { l: 24, w: 18, h: 16, label: "XL (24×18×16)",       desc: "Small furniture, monitors, large decor" },
  oversized: { l: 36, w: 24, h: 24, label: "Oversized (36×24×24)", desc: "Large decor, equipment, chairs" },
  furniture: { l: 48, w: 30, h: 30, label: "Furniture (48×30×30)", desc: "Furniture, large frames, shelving" },
  custom:    { l: 0,  w: 0,  h: 0,  label: "Custom",              desc: "Any size — enter your dimensions" },
};

/** Estimate NMFC freight class from density (lbs/cubic foot) with category hints */
function estimateFreightClass(
  weightLbs: number,
  lengthIn: number,
  widthIn: number,
  heightIn: number,
  category?: string | null,
  material?: string | null,
): { freightClass: number; density: number; note: string | null } {
  const cubicFt = (lengthIn * widthIn * heightIn) / 1728;
  const density = cubicFt > 0 ? weightLbs / cubicFt : 0;

  // Density-based class lookup
  let fc: number;
  if (density >= 50) fc = 50;
  else if (density >= 35) fc = 55;
  else if (density >= 30) fc = 60;
  else if (density >= 22.5) fc = 65;
  else if (density >= 15) fc = 70;
  else if (density >= 13.5) fc = 77.5;
  else if (density >= 12) fc = 85;
  else if (density >= 10.5) fc = 92.5;
  else if (density >= 9) fc = 100;
  else if (density >= 8) fc = 110;
  else if (density >= 7) fc = 125;
  else if (density >= 6) fc = 150;
  else if (density >= 5) fc = 175;
  else if (density >= 4) fc = 200;
  else if (density >= 3) fc = 250;
  else if (density >= 2) fc = 300;
  else if (density >= 1) fc = 400;
  else fc = 500;

  // Category-based overrides / notes
  let note: string | null = null;
  const cat = (category || "").toLowerCase();
  const mat = (material || "").toLowerCase();

  if (cat.includes("furniture")) {
    if (fc > 85) fc = Math.min(fc, 85);
    note = "Furniture typically ships Class 70-85";
  } else if (cat.includes("art") || cat.includes("painting") || cat.includes("canvas")) {
    if (fc < 125) fc = 125;
    note = "Artwork is light but bulky/fragile — Class 125-150 typical";
  } else if (cat.includes("appliance")) {
    if (fc > 100) fc = Math.min(fc, 100);
    note = "Appliances typically ship Class 85-100";
  } else if (cat.includes("electronics") && density < 10) {
    note = "Large electronics typically ship Class 85-92.5";
  } else if (cat.includes("instrument") || cat.includes("piano")) {
    note = "Musical instruments — Class 100-125 typical. Request blanket wrap.";
  } else if (cat.includes("antique") || mat.includes("antique")) {
    note = "Antique item — request blanket wrap protection";
  }

  return { freightClass: fc, density: Math.round(density * 10) / 10, note };
}

/** Map AI suggestion to the closest BOX_PRESETS key that fits the dimensions.
 *  Checks each preset smallest→largest; picks the first where AI dims fit (within 2" tolerance).
 *  Falls back to boxSize string match, then to "custom" with pre-filled dims. */
function mapSuggestionToPreset(suggestion: PackageSuggestion | null): { key: string; autoCustom: boolean; reason: string } {
  if (!suggestion) return { key: "medium", autoCustom: false, reason: "No AI data — default" };

  const aiL = suggestion.length;
  const aiW = suggestion.width;
  const aiH = suggestion.height;
  const tolerance = 2; // inches
  const presetOrder = ["tiny", "small", "medium", "large", "xl", "oversized", "furniture"] as const;

  // Thin/flat items (< 2" on any dimension) always get custom box
  const minDim = Math.min(aiL, aiW, aiH);
  if (minDim < 2) {
    return { key: "custom", autoCustom: true, reason: `Thin/flat item (${minDim.toFixed(1)}") — custom box: ${aiL}×${aiW}×${aiH}"` };
  }

  // Try to find the smallest preset that fits
  for (const key of presetOrder) {
    const p = BOX_PRESETS[key];
    if (aiL <= p.l + tolerance && aiW <= p.w + tolerance && aiH <= p.h + tolerance) {
      // Check for excessive void — if any box dimension is > 3x the item's corresponding dimension
      const voidH = p.h / aiH;
      const voidW = p.w / aiW;
      const voidL = p.l / aiL;
      if (voidH > 3 || voidW > 3 || voidL > 3) {
        return { key: "custom", autoCustom: true, reason: `${p.label} fits but excessive void (${Math.max(voidH, voidW, voidL).toFixed(1)}x). Custom: ${aiL}×${aiW}×${aiH}"` };
      }
      return { key, autoCustom: false, reason: `AI dimensions ${aiL}×${aiW}×${aiH}" fit ${p.label}` };
    }
  }

  // If no preset fits, auto-select custom
  return { key: "custom", autoCustom: true, reason: `AI dimensions ${aiL}×${aiW}×${aiH}" exceed standard presets` };
}

// ─── POST-SALE WIZARD ──────────────────────────────────────────────────────

function PostSaleWizard({
  itemId,
  weight: initWeight,
  length: initLength,
  width: initWidth,
  height: initHeight,
  isFragile: initFragile,
  fromZip,
  itemValue,
  existingLabel,
}: {
  itemId: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  isFragile: boolean;
  fromZip: string | null;
  itemValue: number | null;
  existingLabel: ShipmentLabelData | null;
}) {
  // Editable package dims (Part C)
  const [weight, setEditWeight] = useState(initWeight);
  const [length, setEditLength] = useState(initLength);
  const [width, setEditWidth] = useState(initWidth);
  const [height, setEditHeight] = useState(initHeight);
  const [isFragile, setEditFragile] = useState(initFragile);

  const [step, setStep] = useState(existingLabel ? 4 : 0);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [buyerZip, setBuyerZip] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerStreet, setBuyerStreet] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [buyerState, setBuyerState] = useState("");
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"qr" | "print" | "pickup">("qr");
  const [insurance, setInsurance] = useState<string>((itemValue ?? 0) > 200 ? "full" : (itemValue ?? 0) > 25 ? "basic" : "none");
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState<ShipmentLabelData | null>(existingLabel);
  const [error, setError] = useState("");

  // Step 0: Saved quote state
  const [savedQuote, setSavedQuote] = useState<any>(null);
  const [showAllCarriers, setShowAllCarriers] = useState(false);
  const [editingPackage, setEditingPackage] = useState(false);
  const [savingDims, setSavingDims] = useState(false);

  // Load saved quote + wizard state from localStorage (Part D)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ll_quote_${itemId}`);
      if (raw) {
        const q = JSON.parse(raw);
        const ageMs = Date.now() - (q.savedAt || 0);
        setSavedQuote({ ...q, isFresh: ageMs < 43200000, isExpiring: ageMs >= 43200000 && ageMs < 86400000, isExpired: ageMs >= 86400000, ageHrs: Math.round(ageMs / 3600000) });
      }
    } catch { /* ignore */ }
    // Restore wizard state
    try {
      const ws = localStorage.getItem(`ll_wizard_${itemId}`);
      if (ws && !existingLabel) {
        const s = JSON.parse(ws);
        if (s.step > 0 && s.step < 4) {
          if (s.buyerZip) setBuyerZip(s.buyerZip);
          if (s.buyerName) setBuyerName(s.buyerName);
          if (s.buyerStreet) setBuyerStreet(s.buyerStreet);
          if (s.buyerCity) setBuyerCity(s.buyerCity);
          if (s.buyerState) setBuyerState(s.buyerState);
          if (s.insurance) setInsurance(s.insurance);
          if (s.deliveryMethod) setDeliveryMethod(s.deliveryMethod);
        }
      }
    } catch { /* ignore */ }
  }, [itemId, existingLabel]);

  // Save wizard state on step change (Part D)
  useEffect(() => {
    if (step > 0 && step < 4 && !label) {
      try {
        localStorage.setItem(`ll_wizard_${itemId}`, JSON.stringify({
          step, buyerZip, buyerName, buyerStreet, buyerCity, buyerState,
          selectedRate: selectedRate ? { carrier: selectedRate.provider, service: selectedRate.servicelevel_name, rate: selectedRate.amount, days: selectedRate.estimated_days } : null,
          insurance, deliveryMethod, updatedAt: new Date().toISOString(),
        }));
      } catch { /* ignore */ }
    }
  }, [step, buyerZip, buyerName, buyerStreet, buyerCity, buyerState, selectedRate, insurance, deliveryMethod, itemId, label]);

  const fetchRates = async () => {
    if (!buyerZip || buyerZip.length < 5) return;
    setLoadingRates(true);
    setError("");
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromZip: fromZip ?? "04901",
          toZip: buyerZip,
          weight: String(weight),
          length: String(length),
          width: String(width),
          height: String(height),
        }),
      });
      const data = await res.json();
      const rawRates = data.rates ?? [];
      const normalized = normalizeRates(rawRates);
      setRates(normalized.length > 0 ? normalized : generateFallbackRates(weight));
      // Persist quote to Shipping Center via estimate API (fire-and-forget)
      fetch("/api/shipping/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, destZip: buyerZip }),
      }).catch(() => {});
    } catch {
      setRates(generateFallbackRates(weight));
    } finally {
      setLoadingRates(false);
    }
  };

  const createLabel = async () => {
    if (!selectedRate) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateId: selectedRate.object_id,
          itemId,
          carrier: selectedRate.provider,
          service: selectedRate.servicelevel_name,
          weight,
          deliveryMethod,
          estimatedDays: selectedRate.estimated_days,
          rateAmount: parseFloat(selectedRate.amount),
          fromAddress: { name: "Seller", street1: "123 Main St", city: "Portland", state: "ME", zip: fromZip ?? "04101" },
          toAddress: { name: buyerName || "Buyer", street1: buyerStreet || "456 Oak Ave", city: buyerCity || "New York", state: buyerState || "NY", zip: buyerZip },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Label creation failed");
      setLabel(data);
      setStep(4);
    } catch (e: any) {
      // ── Demo label fallback when Shippo fails ──
      const demoId = `DEMO-${Date.now().toString(36).toUpperCase()}`;
      const demoLabel: ShipmentLabelData = {
        id: demoId,
        trackingNumber: demoId,
        carrier: selectedRate.provider,
        service: selectedRate.servicelevel_name,
        rate: selectedRate.amount,
        labelUrl: "#demo",
        status: "LABEL_CREATED",
        deliveryMethod,
        estimatedDays: selectedRate.estimated_days ?? 5,
        isDemo: true,
      };
      setLabel(demoLabel);
      setStep(4);
    } finally {
      setCreating(false);
    }
  };

  // Clear wizard state after label created (Part D)
  useEffect(() => {
    if (label && step === 4) {
      try { localStorage.removeItem(`ll_wizard_${itemId}`); } catch { /* ignore */ }
    }
  }, [label, step, itemId]);

  // Save package dims via API (Part C)
  const savePackageDims = async () => {
    setSavingDims(true);
    try {
      await fetch(`/api/items/update/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingWeight: weight, shippingLength: length, shippingWidth: width, shippingHeight: height, isFragile }),
      });
    } catch { /* ignore */ }
    setSavingDims(false);
    setEditingPackage(false);
  };

  // If we already have a label, show the packing checklist (step 4)
  if (label && step === 4) {
    return <PackingChecklist label={label} isFragile={isFragile} deliveryMethod={label.deliveryMethod || deliveryMethod} />;
  }

  // Box presets for quick-select (Part C)
  const BOX_QUICK = [
    { key: "tiny", l: 6, w: 4, h: 3, label: "Tiny" },
    { key: "small", l: 10, w: 8, h: 4, label: "Small" },
    { key: "medium", l: 14, w: 12, h: 8, label: "Medium" },
    { key: "large", l: 18, w: 14, h: 12, label: "Large" },
    { key: "xl", l: 24, w: 18, h: 16, label: "XL" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Step 0: Quote Dashboard (Part B) */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Saved quote card */}
          {savedQuote && savedQuote.carrier && (() => {
            const c = savedQuote.carrier;
            const remainMs = savedQuote.savedAt ? 86400000 - (Date.now() - savedQuote.savedAt) : 0;
            const remainHrs = Math.max(0, Math.floor(remainMs / 3600000));
            const remainMins = Math.max(0, Math.floor((remainMs % 3600000) / 60000));
            return (
              <div style={{ padding: "0.75rem", borderRadius: "0.75rem", background: savedQuote.isFresh ? "rgba(34,197,94,0.04)" : savedQuote.isExpiring ? "rgba(245,158,11,0.04)" : "rgba(239,68,68,0.04)", border: `1px solid ${savedQuote.isFresh ? "rgba(34,197,94,0.15)" : savedQuote.isExpiring ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{"\u{1F4CB}"} Saved Quote</span>
                  <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: savedQuote.isFresh ? "rgba(34,197,94,0.12)" : savedQuote.isExpiring ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)", color: savedQuote.isFresh ? "#22c55e" : savedQuote.isExpiring ? "#f59e0b" : "#ef4444" }}>
                    {savedQuote.isFresh ? "\u2705 Fresh" : savedQuote.isExpiring ? `\u26A0\uFE0F Expiring (${savedQuote.ageHrs}h)` : `\u274C Expired (${savedQuote.ageHrs}h)`}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{c.carrier || "?"} {c.service || ""}</span>
                  <span style={{ fontSize: "1rem", fontWeight: 800, color: "#4caf50" }}>${c.price?.toFixed(2) ?? "?"}</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  {c.days ? `${c.days}d transit` : ""}{savedQuote.toZip ? ` \u00B7 ${fromZip || "04901"} \u2192 ${savedQuote.toZip}` : ""}{remainMs > 0 ? ` \u00B7 valid ~${remainHrs}h ${remainMins}m` : ""}
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      if (savedQuote.toZip) { setBuyerZip(savedQuote.toZip); fetchRates(); setStep(3); }
                      else { setStep(2); }
                    }}
                    style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #4caf50, #2e7d32)", color: "#fff", cursor: "pointer" }}
                  >
                    {"\u{1F680}"} Ship with This Quote
                  </button>
                  <button onClick={() => setShowAllCarriers(!showAllCarriers)} style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                    {showAllCarriers ? "\u25BC Hide Carriers" : "\u{1F4CB} View All Carriers"}
                  </button>
                  <button onClick={() => setStep(1)} style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                    {"\u{1F504}"} Fresh Quote
                  </button>
                </div>
                {/* Expanded all carriers view */}
                {showAllCarriers && savedQuote.allCarriers && savedQuote.allCarriers.length > 0 && (
                  <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-default)", paddingTop: "0.5rem" }}>
                    {savedQuote.allCarriers.sort((a: any, b: any) => (a.price || 0) - (b.price || 0)).map((cr: any, i: number) => (
                      <div key={`${cr.carrier}-${cr.service}-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.3rem 0.4rem", borderRadius: "0.35rem", fontSize: "0.75rem", background: cr.carrier === c.carrier && cr.service === c.service ? "rgba(0,188,212,0.06)" : "transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{cr.carrier}</span>
                          <span style={{ color: "var(--text-muted)" }}>{cr.service}</span>
                          {i === 0 && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 4px", borderRadius: "9999px", background: "rgba(76,175,80,0.15)", color: "#4caf50" }}>BEST</span>}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>${cr.price?.toFixed(2) ?? "?"} {cr.days ? `\u00B7 ${cr.days}d` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* No saved quote — package summary */}
          {(!savedQuote || !savedQuote.carrier) && (
            <div style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                {"\u{1F4E6}"} Ready to ship!
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Package: {length}{"\u00D7"}{width}{"\u00D7"}{height} in {"\u00B7"} {weight} lbs {isFragile ? "\u00B7 FRAGILE" : ""}
              </div>
              <button onClick={() => setStep(1)} style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer" }}>
                Get Shipping Rates {"\u2192"}
              </button>
            </div>
          )}

          {/* Quick actions bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.3rem" }}>
            <button onClick={() => setStep(1)} style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {"\u{1F4E6}"} Edit Package & Get Rates
            </button>
            <a href={`/shipping?itemId=${itemId}`} style={{ fontSize: "0.72rem", color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
              {"\u{1F3E2}"} Open Shipping Center {"\u2192"}
            </a>
          </div>
        </div>
      )}

      {/* Step indicator (steps 1-3) */}
      {step >= 1 && step <= 3 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.7rem", flexWrap: "wrap" }}>
          {["Package", "Address", "Carrier", "Label"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <span
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  background: step > i + 1 ? "var(--accent)" : step === i + 1 ? "var(--accent)" : "var(--bg-card-hover, var(--ghost-bg))",
                  color: step >= i + 1 ? "#fff" : "var(--text-muted)",
                }}
              >
                {step > i + 1 ? "\u2713" : i + 1}
              </span>
              <span style={{ color: step === i + 1 ? "var(--text-primary)" : "var(--text-muted)", fontWeight: step === i + 1 ? 600 : 400 }}>
                {s}
              </span>
              {i < 3 && <span style={{ color: "var(--text-muted)", margin: "0 0.15rem" }}>{"\u2192"}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Confirm Package (upgraded with editable dims — Part C) */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {"\u{1F4E6}"} Package: {length}{"\u00D7"}{width}{"\u00D7"}{height} in, {weight} lbs {isFragile ? "(FRAGILE)" : ""}
          </div>
          {/* Edit toggle */}
          <button onClick={() => setEditingPackage(!editingPackage)} style={{ fontSize: "0.75rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontWeight: 500 }}>
            {editingPackage ? "\u25BC Hide Package Editor" : "\u25B6 Edit Package Details"}
          </button>
          {/* Editable dims */}
          {editingPackage && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
              {/* Box quick-select */}
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {BOX_QUICK.map(b => (
                  <button key={b.key} onClick={() => { setEditLength(b.l); setEditWidth(b.w); setEditHeight(b.h); }} style={{
                    padding: "0.25rem 0.55rem", fontSize: "0.68rem", fontWeight: 600, borderRadius: "0.35rem", cursor: "pointer",
                    border: length === b.l && width === b.w && height === b.h ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                    background: length === b.l && width === b.w && height === b.h ? "rgba(0,188,212,0.06)" : "transparent",
                    color: length === b.l && width === b.w && height === b.h ? "var(--accent)" : "var(--text-muted)",
                  }}>
                    {b.label}
                  </button>
                ))}
              </div>
              {/* Dim inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                {[{ k: "weight", l: "Weight (lbs)", v: weight, set: setEditWeight }, { k: "length", l: "L (in)", v: length, set: setEditLength }, { k: "width", l: "W (in)", v: width, set: setEditWidth }, { k: "height", l: "H (in)", v: height, set: setEditHeight }].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginBottom: 2 }}>{f.l}</div>
                    <input value={f.v} onChange={e => f.set(Number(e.target.value) || 0)} type="number" style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.78rem", borderRadius: "0.35rem", border: "1px solid var(--border-default)", background: "var(--input-bg, var(--ghost-bg))", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)", cursor: "pointer", marginBottom: "0.5rem" }}>
                <input type="checkbox" checked={isFragile} onChange={e => setEditFragile(e.target.checked)} style={{ accentColor: "var(--accent)" }} /> Fragile
              </label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button onClick={savePackageDims} disabled={savingDims} style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", opacity: savingDims ? 0.6 : 1 }}>
                  {savingDims ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setEditingPackage(false)} style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button onClick={() => setStep(0)} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "0.5rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
              Back
            </button>
            <button onClick={() => setStep(2)} style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer" }}>
              Confirm Package {"\u2192"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Buyer Address */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Buyer name</label>
              <input className="input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label">Buyer ZIP</label>
              <input className="input" value={buyerZip} onChange={(e) => setBuyerZip(e.target.value)} placeholder="10001" maxLength={5} />
            </div>
            <div>
              <label className="label">Street</label>
              <input className="input" value={buyerStreet} onChange={(e) => setBuyerStreet(e.target.value)} placeholder="456 Oak Ave" />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} placeholder="New York" />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={buyerState} onChange={(e) => setBuyerState(e.target.value)} placeholder="NY" maxLength={2} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setStep(1)} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>Back</button>
            <button className="btn-primary" onClick={() => { fetchRates(); setStep(3); }} disabled={!buyerZip || buyerZip.length < 5} style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
              Get Rates
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Choose Carrier */}
      {step === 3 && (
        <div className="space-y-3">
          {loadingRates ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading carrier rates...</div>
          ) : rates.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No rates available. Check addresses and try again.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Carrier</th>
                    <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Service</th>
                    <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Speed</th>
                    <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Cost</th>
                    <th style={{ padding: "0.5rem" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => {
                    const cheapest = rates.every((o) => parseFloat(o.amount) >= parseFloat(r.amount));
                    const fastest = r.estimated_days != null && rates.every((o) => (o.estimated_days ?? 99) >= (r.estimated_days ?? 99));
                    const selected = selectedRate?.object_id === r.object_id;
                    return (
                      <tr
                        key={r.object_id}
                        style={{
                          borderBottom: "1px solid var(--border-default)",
                          background: selected ? "rgba(0,188,212,0.08)" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedRate(r)}
                      >
                        <td style={{ padding: "0.5rem", color: "var(--text-primary)" }}>{r.provider}</td>
                        <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>
                          {r.servicelevel_name}
                          {cheapest && <span style={{ marginLeft: "0.5rem", fontSize: "0.65rem", background: "var(--success-text)", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>Cheapest</span>}
                          {fastest && <span style={{ marginLeft: "0.5rem", fontSize: "0.65rem", background: "var(--accent)", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>Fastest</span>}
                        </td>
                        <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>
                          {r.estimated_days != null ? `${r.estimated_days} day${r.estimated_days !== 1 ? "s" : ""}` : "—"}
                        </td>
                        <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 600, color: "var(--text-primary)" }}>
                          {isNaN(parseFloat(r.amount)) ? "Quote N/A" : `$${parseFloat(r.amount).toFixed(2)}`}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          <input type="radio" checked={selected} readOnly style={{ accentColor: "var(--accent)" }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Insurance option — never blocks the flow */}
          {selectedRate && (
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                🛡️ Shipping Insurance
              </div>
              {(() => {
                const val = itemValue ?? 0;
                const options = [
                  { key: "none", label: "No insurance", desc: "Ship at your own risk", cost: 0 },
                  ...(val > 25 ? [{ key: "basic", label: "Basic coverage", desc: "Up to $100", cost: Math.round(Math.max(2.5, val * 0.02) * 100) / 100 }] : []),
                  ...(val > 200 ? [{ key: "full", label: "Full coverage", desc: `Up to $${Math.round(val)}`, cost: Math.round(val * 0.035 * 100) / 100 }] : []),
                ];
                const defaultIns = val > 200 ? "full" : val > 25 ? "basic" : "none";
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {options.map((opt) => (
                      <label
                        key={opt.key}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.6rem",
                          borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.8rem",
                          border: `1px solid ${insurance === opt.key ? "var(--accent)" : "var(--border-default)"}`,
                          background: insurance === opt.key ? "rgba(0,188,212,0.06)" : "transparent",
                        }}
                      >
                        <input type="radio" name="insurance" checked={insurance === opt.key} onChange={() => setInsurance(opt.key)} style={{ accentColor: "var(--accent)" }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{opt.label}</span>
                          <span style={{ color: "var(--text-muted)", marginLeft: "0.4rem" }}>— {opt.desc}</span>
                        </div>
                        {opt.cost > 0 && <span style={{ fontWeight: 600, color: "var(--accent)" }}>+${opt.cost.toFixed(2)}</span>}
                        {opt.key === defaultIns && <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(0,188,212,0.12)", color: "var(--accent)", padding: "0.1rem 0.35rem", borderRadius: "9999px" }}>Recommended</span>}
                      </label>
                    ))}
                    {insurance === "none" && val > 25 && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic", padding: "0.2rem 0" }}>
                        You chose no insurance. You can add it later before printing your label.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Delivery method */}
          {selectedRate && (
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Label Delivery
              </div>
              <div className="flex gap-2">
                {(["qr", "print", "pickup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDeliveryMethod(m)}
                    style={{
                      padding: "0.4rem 0.875rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.8rem",
                      fontWeight: deliveryMethod === m ? 600 : 400,
                      background: deliveryMethod === m ? "rgba(0,188,212,0.12)" : "var(--bg-card-hover)",
                      border: `1px solid ${deliveryMethod === m ? "var(--accent)" : "var(--border-default)"}`,
                      color: deliveryMethod === m ? "var(--accent)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {m === "qr" ? "QR Code" : m === "print" ? "Print PDF" : "Schedule Pickup"}
                    {m === "qr" && <span style={{ fontSize: "0.65rem", marginLeft: "0.3rem", opacity: 0.6 }}>(recommended)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Review summary before committing */}
          {selectedRate && (
            <div style={{ padding: "0.6rem 0.75rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", fontSize: "0.78rem" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>Shipment Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Carrier</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{selectedRate.provider} {selectedRate.servicelevel_name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>${parseFloat(selectedRate.amount).toFixed(2)}</span>
                </div>
                {insurance !== "none" && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Insurance ({insurance})</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      +${(insurance === "full" ? Math.round((itemValue ?? 0) * 0.035 * 100) / 100 : Math.round(Math.max(2.5, (itemValue ?? 0) * 0.02) * 100) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-default)", paddingTop: "0.25rem", marginTop: "0.1rem" }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                    ${(parseFloat(selectedRate.amount) + (insurance === "full" ? Math.round((itemValue ?? 0) * 0.035 * 100) / 100 : insurance === "basic" ? Math.round(Math.max(2.5, (itemValue ?? 0) * 0.02) * 100) / 100 : 0)).toFixed(2)}
                  </span>
                </div>
                {selectedRate.estimated_days && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Est. delivery</span>
                    <span style={{ color: "var(--text-primary)" }}>{selectedRate.estimated_days} business day{selectedRate.estimated_days !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setStep(2)} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>Back</button>
            <button className="btn-primary" onClick={createLabel} disabled={!selectedRate || creating} style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}>
              {creating ? "Creating Label..." : "✅ Commit to This Shipment"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: "0.8rem", color: "var(--error-text)", padding: "0.5rem 0.75rem", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "0.5rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── PACKING CHECKLIST (post-label) ────────────────────────────────────────

function PackingChecklist({ label, isFragile, deliveryMethod }: { label: ShipmentLabelData; isFragile: boolean; deliveryMethod: string }) {
  const [copied, setCopied] = useState(false);
  const isDemo = label.isDemo || label.trackingNumber?.startsWith("DEMO-");

  const copyTracking = () => {
    navigator.clipboard.writeText(label.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Demo banner */}
      {isDemo && (
        <div style={{
          padding: "0.55rem 0.75rem", borderRadius: "0.5rem",
          background: "rgba(234,179,8,0.10)", border: "1px solid rgba(234,179,8,0.35)",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <span style={{ fontSize: "0.85rem" }}>🧪</span>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#eab308" }}>Demo Label</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              This is a simulated label for demonstration. In production, a real carrier label will be generated.
            </div>
          </div>
        </div>
      )}

      {/* Success banner */}
      <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", textAlign: "center" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--success-text)" }}>
          🏷️ {isDemo ? "Demo Shipping Label Created" : "Your Shipping Label is Ready!"}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginTop: "0.25rem" }}>
          {label.carrier} {label.service} — ${Number(label.rate).toFixed(2)}
        </div>
      </div>

      {/* Demo printable label */}
      {isDemo ? (
        <div style={{
          border: "2px dashed var(--border-default)", borderRadius: "0.75rem", padding: "1.25rem",
          background: "var(--bg-card)", position: "relative",
        }}>
          <div style={{ position: "absolute", top: "0.4rem", right: "0.6rem", fontSize: "0.6rem", fontWeight: 700, color: "#eab308", textTransform: "uppercase", letterSpacing: "0.1em" }}>DEMO</div>
          <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>LegacyLoop Shipping Label</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.78rem" }}>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.15rem" }}>FROM</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>Seller</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>Portland, ME</div>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.15rem" }}>TO</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>Buyer</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>Destination</div>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem", textAlign: "center", padding: "0.4rem", background: "var(--ghost-bg)", borderRadius: "0.4rem", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.2rem" }}>CARRIER / SERVICE</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>{label.carrier} — {label.service}</div>
          </div>
          <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.15rem" }}>TRACKING</div>
            <code style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em" }}>{label.trackingNumber}</code>
          </div>
          <div style={{ marginTop: "0.5rem", textAlign: "center", fontSize: "2rem", letterSpacing: "0.15em", color: "var(--text-muted)", fontFamily: "monospace" }}>
            ▌▌▐▌▌▐▐▌▐▌▐▐▌▌▐▌▐▐▌▌
          </div>
        </div>
      ) : (
        /* Real label: Print / Download buttons */
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => window.print()} className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            🖨️ Print Label
          </button>
          <a href={label.labelUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", fontSize: "0.85rem", textDecoration: "none" }}>
            📄 Download Label (PDF)
          </a>
        </div>
      )}

      {/* Print demo label button */}
      {isDemo && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => window.print()} className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            🖨️ Print Demo Label
          </button>
        </div>
      )}

      {/* Tracking number — prominent */}
      <div style={{ padding: "0.6rem 0.75rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
          Tracking Number {isDemo && <span style={{ color: "#eab308", marginLeft: "0.3rem" }}>(Demo)</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <code style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-card-hover)", padding: "0.25rem 0.6rem", borderRadius: "0.3rem", letterSpacing: "0.03em" }}>
            {label.trackingNumber}
          </code>
          <button onClick={copyTracking} style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)", background: "transparent", border: "1px solid var(--accent)", borderRadius: "0.4rem", padding: "0.2rem 0.5rem", cursor: "pointer" }}>
            📋 {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Drop-off info for QR */}
      {deliveryMethod === "qr" && (
        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>Drop-off Locations</div>
          <ul style={{ fontSize: "0.8rem", color: "var(--text-secondary)", paddingLeft: "1rem", marginTop: "0.25rem" }}>
            <li>UPS Store</li>
            <li>FedEx Office</li>
            <li>USPS Post Office</li>
            <li>Walgreens (USPS drop-off)</li>
            <li>CVS (USPS drop-off)</li>
          </ul>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Show the QR code at any drop-off location — no printing needed.
          </div>
        </div>
      )}

      {deliveryMethod === "pickup" && (
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Pickup has been scheduled. The carrier will arrive at your address.
          Leave the package in a visible location or hand off directly.
        </div>
      )}

      {/* Packing checklist */}
      <div>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>Packing Checklist</div>
        <ul style={{ fontSize: "0.8rem", color: "var(--text-secondary)", paddingLeft: "1rem", marginTop: "0.25rem" }}>
          {isFragile && (
            <>
              <li>Wrap item in 2+ layers of bubble wrap</li>
              <li>Use packing peanuts or crumpled paper to fill gaps</li>
              <li>Mark FRAGILE on all sides of the box</li>
            </>
          )}
          <li>Seal box with packing tape (not masking/duct tape)</li>
          <li>Ensure label is flat and visible — not over seams or tape edges</li>
          <li>Remove or cover any old shipping labels</li>
        </ul>
      </div>
    </div>
  );
}

// ─── PICKUP HELPER COMPONENTS ─────────────────────────────────────────────

const LOCATION_MAP: Record<string, { icon: string; label: string; mapQuery: string; safety: string }> = {
  my_location:    { icon: "📍", label: "My Location", mapQuery: "", safety: "City-level only until confirmed" },
  police_station: { icon: "🚔", label: "Police Station / Public Safety", mapQuery: "police+station+near+", safety: "Safest option — highly recommended" },
  bank:           { icon: "🏦", label: "Bank Parking Lot", mapQuery: "bank+near+", safety: "Public and well-monitored" },
  coffee_shop:    { icon: "☕", label: "Coffee Shop / Restaurant", mapQuery: "coffee+shop+near+", safety: "Casual and public" },
  post_office:    { icon: "📬", label: "Post Office", mapQuery: "post+office+near+", safety: "Public building" },
  other:          { icon: "📍", label: "Other Public Place", mapQuery: "", safety: "Seller-specified location" },
};

function MeetupLocationCard({ locationType, sellerZip, isRevealed }: { locationType: string; sellerZip: string | null; isRevealed: boolean }) {
  const loc = LOCATION_MAP[locationType] ?? LOCATION_MAP.my_location;
  const showMap = loc.mapQuery && sellerZip;
  const mapUrl = showMap ? `https://www.google.com/maps/search/${loc.mapQuery}${sellerZip}` : null;
  return (
    <div style={{
      background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
      borderRadius: "10px", padding: "0.85rem 1rem",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
        <span style={{ fontSize: "1.2rem" }}>{loc.icon}</span>
        <div>
          <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>
            {locationType === "my_location" && !isRevealed ? "Your location (shared after confirmation)" : loc.label}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{loc.safety}</div>
        </div>
      </div>
      {mapUrl && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.3)",
            borderRadius: "7px", padding: "0.35rem 0.75rem",
            color: "#00bcd4", fontSize: "0.75rem", fontWeight: 600,
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          Find on Maps
        </a>
      )}
    </div>
  );
}

function PaymentMethodBadge({ method, price }: { method: string; price: number | null }) {
  const amt = price != null ? `$${price.toLocaleString()}` : "";
  if (method === "legacyloop") return (
    <div style={{ background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.3)", borderRadius: "8px", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <span style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.82rem" }}>
        {amt ? `${amt} secured in escrow` : "Payment secured in escrow"}
      </span>
      <span style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", padding: "0.1rem 0.5rem", color: "#10b981", fontSize: "0.7rem", fontWeight: 700 }}>RECOMMENDED</span>
    </div>
  );
  if (method === "cash") return (
    <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", padding: "0.5rem 1rem" }}>
      <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.82rem" }}>
        {amt ? `Cash at meetup — ${amt} exact change` : "Cash at meetup"}
      </span>
      <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "0.2rem" }}>No buyer protection — proceed with caution</div>
    </div>
  );
  if (method === "venmo") return (
    <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "8px", padding: "0.5rem 1rem" }}>
      <span style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "0.82rem" }}>
        {amt ? `Venmo/Zelle — ${amt} after handoff` : "Venmo/Zelle after handoff"}
      </span>
    </div>
  );
  if (method === "decide_later") return (
    <div style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.5rem 1rem" }}>
      <span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.82rem" }}>
        Payment to be discussed at meetup
      </span>
    </div>
  );
  return null;
}

function ContactMethodCard({ method, isActive }: { method: string; isActive: boolean }) {
  const methods: Record<string, { icon: string; label: string; activeLabel: string; inactiveLabel: string }> = {
    in_app: { icon: "💬", label: "In-app messaging", activeLabel: "Messaging active — open Messages to chat", inactiveLabel: "Activated after confirmation" },
    text:   { icon: "📱", label: "Text message", activeLabel: "Contact shared with buyer", inactiveLabel: "Phone shared after confirmation" },
    email:  { icon: "📧", label: "Email", activeLabel: "Email shared with buyer", inactiveLabel: "Email shared after confirmation" },
  };
  const m = methods[method] ?? methods.in_app;
  return (
    <div style={{
      background: isActive ? "rgba(0,188,212,0.06)" : "var(--bg-card)",
      border: `1px solid ${isActive ? "rgba(0,188,212,0.2)" : "var(--border-default)"}`,
      borderRadius: "8px", padding: "0.5rem 0.85rem",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.95rem" }}>{m.icon}</span>
        <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-primary)" }}>{m.label}</span>
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 500, color: isActive ? "#10b981" : "var(--text-muted)" }}>
        {isActive ? m.activeLabel : m.inactiveLabel}
      </span>
    </div>
  );
}

// ─── PICKUP COMPLETION FLOW (post-sale) ──────────────────────────────────

const PICKUP_STEPS = [
  { key: "INVITE_SENT", label: "Invite Sent", icon: "📤" },
  { key: "CONFIRMED", label: "Confirmed", icon: "✅" },
  { key: "EN_ROUTE", label: "En Route", icon: "🚗" },
  { key: "HANDED_OFF", label: "Handed Off", icon: "🤝" },
  { key: "COMPLETED", label: "Completed", icon: "🎉" },
];

const PICKUP_STATUS_IDX: Record<string, number> = {};
PICKUP_STEPS.forEach((s, i) => { PICKUP_STATUS_IDX[s.key] = i; });

const SAFETY_CHECKLIST = [
  "Meet in a public, well-lit location",
  "Bring a friend if possible",
  "Test the item before payment",
  "Verify ID for large purchases",
  "Trust your instincts — safety first",
];

function PickupCompletionFlow({ itemId, saleRadius, fromZip, itemValue }: {
  itemId: string;
  saleRadius?: number;
  fromZip: string | null;
  itemValue?: number | null;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [locData, setLocData] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [contactMethod, setContactMethod] = useState("in_app");
  const [paymentMethod, setPaymentMethod] = useState("legacyloop");
  const [handoffCode, setHandoffCode] = useState<string | null>(null);
  const [buyerTimeSlot, setBuyerTimeSlot] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(itemValue ?? null);
  const [sellerZip, setSellerZip] = useState<string | null>(fromZip);
  const [radius, setRadius] = useState<number | null>(saleRadius ?? null);

  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");

  // Invite form state (pre-send)
  const [invLocation, setInvLocation] = useState("police_station");
  const [invOtherDesc, setInvOtherDesc] = useState("");
  const [invSlots, setInvSlots] = useState<string[]>([]);
  const [invContact, setInvContact] = useState("in_app");
  const [invPayment, setInvPayment] = useState("legacyloop");
  const [invNotes, setInvNotes] = useState("");
  const [invRadius, setInvRadius] = useState(saleRadius ?? 25);
  const [showInvitePreview, setShowInvitePreview] = useState(false);
  // Precision location (invite)
  const [invPreciseAddress, setInvPreciseAddress] = useState("");
  const [invPreciseMapLink, setInvPreciseMapLink] = useState("");
  const [invPrecisionSpot, setInvPrecisionSpot] = useState("");
  const [invLocationName, setInvLocationName] = useState("");
  const [invLocationSubSpot, setInvLocationSubSpot] = useState("");
  // Payment sub-options (invite)
  const [invDenomPref, setInvDenomPref] = useState("Any");
  const [invVenmoService, setInvVenmoService] = useState("");
  const [invVenmoHandle, setInvVenmoHandle] = useState("");
  const [invVenmoTiming, setInvVenmoTiming] = useState("");
  // Contact sub-options (invite)
  const [invContactPhone, setInvContactPhone] = useState("");
  const [invContactTimePref, setInvContactTimePref] = useState("");
  const [invContactEmailAddr, setInvContactEmailAddr] = useState("");
  const [invContactResponseTime, setInvContactResponseTime] = useState("");
  const [invContactNotifyPref, setInvContactNotifyPref] = useState("");
  const [invUseDiffEmail, setInvUseDiffEmail] = useState(false);

  // Handoff code entry (step 4)
  const [codeInput, setCodeInput] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [conditionConfirmed, setConditionConfirmed] = useState(false);

  // Rating moved to SaleClosedScreen component

  useEffect(() => {
    fetch(`/api/shipping/pickup/${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setStatus(data.status);
          setConfirmedAt(data.confirmedAt);
          setCompletedAt(data.completedAt);
          setLocData(data.location);
          if (data.notes) { setNotes(data.notes); setInvNotes(data.notes); }
          if (data.timeSlots) setTimeSlots(Array.isArray(data.timeSlots) ? data.timeSlots : []);
          if (data.contactMethod) { setContactMethod(data.contactMethod); setInvContact(data.contactMethod); }
          if (data.paymentMethod) { setPaymentMethod(data.paymentMethod); setInvPayment(data.paymentMethod); }
          if (data.handoffCode) setHandoffCode(data.handoffCode);
          if (data.buyerTimeSlot) setBuyerTimeSlot(data.buyerTimeSlot);
          if (data.price != null) setPrice(data.price);
          if (data.saleZip) setSellerZip(data.saleZip);
          if (data.radius != null) setRadius(data.radius);
          // Populate invite form from saved data
          if (data.location?.type) setInvLocation(data.location.type);
          if (data.radius != null) setInvRadius(data.radius);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  const advance = async (extraData?: any) => {
    setAdvancing(true);
    setError("");
    try {
      const res = await fetch(`/api/shipping/pickup/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance", ...extraData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus(data.pickupStatus);
      if (data.confirmedAt) setConfirmedAt(data.confirmedAt);
      if (data.completedAt) setCompletedAt(data.completedAt);
      if (data.handoffCode) setHandoffCode(data.handoffCode);
    } catch (e: any) {
      setError(e.message);
    }
    setAdvancing(false);
  };

  const toggleInvSlot = (slot: string) => {
    setInvSlots((prev) => prev.includes(slot) ? prev.filter((s) => s !== slot) : prev.length < 3 ? [...prev, slot] : prev);
  };

  if (loading) {
    return <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", padding: "1rem 0" }}>Loading pickup status...</div>;
  }

  const currentIdx = status ? (PICKUP_STATUS_IDX[status] ?? -1) : -1;
  const isComplete = status === "COMPLETED";
  const locType = locData?.type ?? invLocation;
  const isContactActive = currentIdx >= 1; // CONFIRMED or later

  // ─── RENDER ──────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.1rem" }}>🤝</span>
        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Pickup / Meetup Completion</span>
        {isComplete && (
          <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "rgba(22,163,74,0.15)", color: "var(--success-text)", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>DONE</span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
        {PICKUP_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
              <div style={{
                width: "2rem", height: "2rem", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem",
                background: done ? (active ? "var(--accent)" : "rgba(0,188,212,0.15)") : "var(--bg-card-hover)",
                border: active ? "2px solid var(--accent)" : "1px solid var(--border-default)",
                transition: "all 0.2s ease",
                ...(active ? { boxShadow: "0 0 8px rgba(0,188,212,0.3)" } : {}),
              }}>
                {done ? step.icon : <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{i + 1}</span>}
              </div>
              <div style={{ fontSize: "0.6rem", fontWeight: done ? 600 : 400, color: done ? "var(--text-primary)" : "var(--text-muted)", textAlign: "center" }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ STEP 1: INVITE SENT (or not yet sent) ═══ */}
      {currentIdx < 0 && (
        <div style={{
          background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
          borderLeft: "3px solid rgba(245,158,11,0.6)", borderRadius: "14px", padding: "1.25rem",
          display: "flex", flexDirection: "column", gap: "0.85rem",
        }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Configure Pickup Invite</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Set your meetup preferences below. The buyer will see exactly what you configure.</div>

          {/* Location */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Meetup Location</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {Object.entries(LOCATION_MAP).map(([key, loc]) => (
                <div key={key}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.5rem",
                    borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem",
                    border: `1px solid ${invLocation === key ? "var(--accent)" : "var(--border-default)"}`,
                    background: invLocation === key ? "rgba(0,188,212,0.06)" : "transparent",
                  }}>
                    <input type="radio" name="inv-location" checked={invLocation === key} onChange={() => setInvLocation(key)} style={{ accentColor: "var(--accent)" }} />
                    <span>{loc.icon}</span>
                    <span style={{ color: invLocation === key ? "var(--accent)" : "var(--text-primary)", fontWeight: 500 }}>{loc.label}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginLeft: "auto" }}>{loc.safety}</span>
                  </label>

                  {/* my_location expand */}
                  {key === "my_location" && invLocation === "my_location" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Choose how to specify your location:</div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📍 Enter address or intersection</label>
                        <input type="text" placeholder="e.g. 123 Main St, Waterville ME" value={invPreciseAddress} onChange={e => setInvPreciseAddress(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                        <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "0.25rem" }}>🔒 Exact address only shared with confirmed buyer</div>
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>🗺️ Or drop a pin on Google Maps</label>
                        <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "8px", padding: "0.45rem 0.85rem", color: "#00bcd4", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>📍 Open Google Maps &mdash; drop a pin and paste link below</a>
                        <input type="text" placeholder="Paste Google Maps link here..." value={invPreciseMapLink} onChange={e => setInvPreciseMapLink(e.target.value)} style={{ width: "100%", marginTop: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📝 Precise meetup instructions</label>
                        <input type="text" placeholder="e.g. I'll be parked in the blue truck near the entrance" value={invPrecisionSpot} onChange={e => setInvPrecisionSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                    </div>
                  )}

                  {/* police_station expand */}
                  {key === "police_station" && invLocation === "police_station" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <a href={`https://www.google.com/maps/search/police+station+near+${sellerZip || ""}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", padding: "0.45rem 0.85rem", color: "#22c55e", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}>🗺️ Find Police Stations near {sellerZip || "you"}</a>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>🚔 Station name</label>
                        <input type="text" placeholder="e.g. Waterville Police Department" value={invLocationName} onChange={e => setInvLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📍 Precise spot</label>
                        <input type="text" placeholder="e.g. Front parking lot, visitor spaces" value={invLocationSubSpot} onChange={e => setInvLocationSubSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                    </div>
                  )}

                  {/* bank expand */}
                  {key === "bank" && invLocation === "bank" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <a href={`https://www.google.com/maps/search/bank+near+${sellerZip || ""}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", padding: "0.45rem 0.85rem", color: "#22c55e", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}>🗺️ Find Banks near {sellerZip || "you"}</a>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>🏦 Bank name</label>
                        <input type="text" placeholder="e.g. Camden National Bank, Main St" value={invLocationName} onChange={e => setInvLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📍 Where to meet</label>
                        <input type="text" placeholder="e.g. Main entrance, ATM side" value={invLocationSubSpot} onChange={e => setInvLocationSubSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                    </div>
                  )}

                  {/* coffee_shop expand */}
                  {key === "coffee_shop" && invLocation === "coffee_shop" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <a href={`https://www.google.com/maps/search/coffee+shop+near+${sellerZip || ""}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", padding: "0.45rem 0.85rem", color: "#22c55e", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}>🗺️ Find Coffee Shops near {sellerZip || "you"}</a>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>☕ Shop name</label>
                        <input type="text" placeholder="e.g. Dunkin&apos; on College Ave" value={invLocationName} onChange={e => setInvLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📍 Where to meet</label>
                        <input type="text" placeholder="e.g. Table by the window, back patio" value={invLocationSubSpot} onChange={e => setInvLocationSubSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                    </div>
                  )}

                  {/* post_office expand */}
                  {key === "post_office" && invLocation === "post_office" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <a href={`https://www.google.com/maps/search/post+office+near+${sellerZip || ""}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", padding: "0.45rem 0.85rem", color: "#22c55e", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", alignSelf: "flex-start" }}>🗺️ Find Post Offices near {sellerZip || "you"}</a>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📬 Location</label>
                        <input type="text" placeholder="e.g. Waterville Post Office, Elm St" value={invLocationName} onChange={e => setInvLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📍 Where to meet</label>
                        <input type="text" placeholder="e.g. Front steps, parking lot" value={invLocationSubSpot} onChange={e => setInvLocationSubSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                    </div>
                  )}

                  {/* other expand */}
                  {key === "other" && invLocation === "other" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📍 Location name</label>
                        <input type="text" placeholder="e.g. Walmart parking lot, Town park" value={invLocationName} onChange={e => setInvLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>🏠 Address</label>
                        <input type="text" placeholder="e.g. 123 Main St, Waterville ME" value={invPreciseAddress} onChange={e => setInvPreciseAddress(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>🗺️ Or drop a pin on Google Maps</label>
                        <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "8px", padding: "0.45rem 0.85rem", color: "#00bcd4", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>📍 Open Google Maps &mdash; drop a pin and paste link below</a>
                        <input type="text" placeholder="Paste Google Maps link here..." value={invPreciseMapLink} onChange={e => setInvPreciseMapLink(e.target.value)} style={{ width: "100%", marginTop: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📝 Meetup instructions</label>
                        <input type="text" placeholder="e.g. I'll be near the main entrance in a red jacket" value={invPrecisionSpot} onChange={e => setInvPrecisionSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Precision Meetup Point */}
          {invLocation && (
            <div style={{ marginTop: "0.25rem", padding: "0.85rem", background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "10px" }}>
              <div style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "0.75rem", marginBottom: "0.4rem" }}>📌 Precision Meetup Point</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.5rem" }}>Give the buyer a precise spot &mdash; &quot;north entrance&quot;, &quot;blue Honda&quot;, &quot;table by the window&quot;</div>
              <input type="text" placeholder="e.g. I'll be in the blue truck at the north end" value={invPrecisionSpot} onChange={e => setInvPrecisionSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
            </div>
          )}

          {/* Radius */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Pickup Radius</div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {[10, 25, 50, 100].map((r) => (
                <button key={r} onClick={() => setInvRadius(r)} style={{
                  padding: "0.35rem 0.65rem", borderRadius: "7px", fontSize: "0.75rem", cursor: "pointer",
                  fontWeight: invRadius === r ? 600 : 400,
                  border: invRadius === r ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                  background: invRadius === r ? "rgba(0,188,212,0.08)" : "transparent",
                  color: invRadius === r ? "var(--accent)" : "var(--text-secondary)",
                }}>
                  {r} mi
                </button>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
              Your Available Times <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 400 }}>(up to 3)</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {["8 AM – 12 PM", "12 PM – 5 PM", "5 PM – 8 PM", "Any time works"].map((slot) => {
                const active = invSlots.includes(slot);
                return (
                  <button key={slot} onClick={() => toggleInvSlot(slot)} style={{
                    padding: "0.3rem 0.6rem", borderRadius: "7px", fontSize: "0.72rem", cursor: "pointer",
                    fontWeight: active ? 600 : 400,
                    border: active ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                    background: active ? "rgba(0,188,212,0.08)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                  }}>
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact method */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Contact Method</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {([["in_app", "💬", "In-app message"], ["text", "📱", "Text message"], ["email", "📧", "Email"]] as const).map(([key, icon, label]) => (
                <div key={key}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.5rem",
                    borderRadius: "7px", cursor: "pointer", fontSize: "0.75rem",
                    border: `1px solid ${invContact === key ? "var(--accent)" : "var(--border-default)"}`,
                    background: invContact === key ? "rgba(0,188,212,0.06)" : "transparent",
                  }}>
                    <input type="radio" name="inv-contact" checked={invContact === key} onChange={() => setInvContact(key)} style={{ accentColor: "var(--accent)" }} />
                    <span>{icon} {label}</span>
                  </label>

                  {/* in_app expand */}
                  {key === "in_app" && invContact === "in_app" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: "0.1rem" }}>Messages stay in LegacyLoop &mdash; no personal info shared.</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", minWidth: "1rem" }}>💬</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Real-time in-app chat</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", minWidth: "1rem" }}>🔒</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Phone &amp; email stay private</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", minWidth: "1rem" }}>📎</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Photo sharing &amp; read receipts</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.35rem" }}>Notification preference:</div>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {["Push only", "Push + Email", "Email only"].map(pref => (
                            <button type="button" key={pref} onClick={() => setInvContactNotifyPref(pref)} style={{
                              padding: "0.25rem 0.55rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer",
                              fontWeight: invContactNotifyPref === pref ? 600 : 400,
                              border: invContactNotifyPref === pref ? "1.5px solid #00bcd4" : "1px solid var(--border-default)",
                              background: invContactNotifyPref === pref ? "rgba(0,188,212,0.1)" : "transparent",
                              color: invContactNotifyPref === pref ? "#00bcd4" : "var(--text-muted)",
                            }}>{pref}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* text expand */}
                  {key === "text" && invContact === "text" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📱 Your phone number</label>
                        <input type="tel" placeholder="(207) 555-1234" value={invContactPhone} onChange={e => setInvContactPhone(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                        <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "0.25rem" }}>🔒 Your number is masked &mdash; buyer texts a LegacyLoop relay number</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.35rem" }}>Best time for texts:</div>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {["Anytime", "Mornings", "Afternoons", "Evenings"].map(t => (
                            <button type="button" key={t} onClick={() => setInvContactTimePref(t)} style={{
                              padding: "0.25rem 0.55rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer",
                              fontWeight: invContactTimePref === t ? 600 : 400,
                              border: invContactTimePref === t ? "1.5px solid #22c55e" : "1px solid var(--border-default)",
                              background: invContactTimePref === t ? "rgba(34,197,94,0.1)" : "transparent",
                              color: invContactTimePref === t ? "#22c55e" : "var(--text-muted)",
                            }}>{t}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* email expand */}
                  {key === "email" && invContact === "email" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>🔒 Your email is masked &mdash; buyer emails a LegacyLoop relay address</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input type="checkbox" checked={invUseDiffEmail} onChange={e => setInvUseDiffEmail(e.target.checked)} style={{ accentColor: "#8b5cf6" }} />
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>Use a different email than my account email</span>
                      </div>
                      {invUseDiffEmail && (
                        <div>
                          <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📧 Preferred email</label>
                          <input type="email" placeholder="alternate@email.com" value={invContactEmailAddr} onChange={e => setInvContactEmailAddr(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                        </div>
                      )}
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.35rem" }}>Response time expectation:</div>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {["Within 1 hour", "Within 4 hours", "Same day", "Within 24 hours"].map(rt => (
                            <button type="button" key={rt} onClick={() => setInvContactResponseTime(rt)} style={{
                              padding: "0.25rem 0.55rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer",
                              fontWeight: invContactResponseTime === rt ? 600 : 400,
                              border: invContactResponseTime === rt ? "1.5px solid #8b5cf6" : "1px solid var(--border-default)",
                              background: invContactResponseTime === rt ? "rgba(139,92,246,0.1)" : "transparent",
                              color: invContactResponseTime === rt ? "#8b5cf6" : "var(--text-muted)",
                            }}>{rt}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Payment Method</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {([["legacyloop", "💳", "Through LegacyLoop"], ["cash", "💵", "Cash at meetup"], ["venmo", "📱", "Venmo/Zelle"], ["decide_later", "🤝", "Decide at meetup"]] as const).map(([key, icon, label]) => (
                <div key={key}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.5rem",
                    borderRadius: "7px", cursor: "pointer", fontSize: "0.75rem",
                    border: `1px solid ${invPayment === key ? "var(--accent)" : "var(--border-default)"}`,
                    background: invPayment === key ? "rgba(0,188,212,0.06)" : "transparent",
                  }}>
                    <input type="radio" name="inv-payment" checked={invPayment === key} onChange={() => setInvPayment(key)} style={{ accentColor: "var(--accent)" }} />
                    <span>{icon} {label}</span>
                    {key === "legacyloop" && <span style={{ fontSize: "0.58rem", fontWeight: 700, background: "rgba(0,188,212,0.12)", color: "var(--accent)", padding: "0.08rem 0.3rem", borderRadius: "9999px", marginLeft: "auto" }}>Recommended</span>}
                  </label>

                  {/* legacyloop expand */}
                  {key === "legacyloop" && invPayment === "legacyloop" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <div style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.72rem", marginBottom: "0.1rem" }}>Secure Escrow Flow</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {[
                          ["1️⃣", "Buyer pays into LegacyLoop escrow"],
                          ["2️⃣", "You meet and hand off the item"],
                          ["3️⃣", "Buyer confirms receipt"],
                          ["4️⃣", "Funds released to your account"],
                        ].map(([step, desc], i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.72rem" }}>{step}</span>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{desc}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: "0.2rem", padding: "0.55rem 0.7rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: "8px" }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Processing Fee</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}><span>Buyer pays</span><span style={{ color: "#00bcd4", fontWeight: 600 }}>{PROCESSING_FEE.buyerDisplay}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}><span>Seller pays</span><span style={{ color: "#ef4444", fontWeight: 600 }}>{PROCESSING_FEE.sellerDisplay}</span></div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>✅</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Buyer protection &mdash; refund if item not as described</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>✅</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Seller protection &mdash; guaranteed payment</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>✅</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Dispute resolution included</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* cash expand */}
                  {key === "cash" && invPayment === "cash" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      {price != null && price > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Exact amount:</span>
                          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f59e0b" }}>${price.toFixed(2)}</span>
                        </div>
                      )}
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.35rem" }}>Denomination preference:</div>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {["Any", "Small bills", "Exact change", "No preference"].map(d => (
                            <button type="button" key={d} onClick={() => setInvDenomPref(d)} style={{
                              padding: "0.25rem 0.55rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer",
                              fontWeight: invDenomPref === d ? 600 : 400,
                              border: invDenomPref === d ? "1.5px solid #f59e0b" : "1px solid var(--border-default)",
                              background: invDenomPref === d ? "rgba(245,158,11,0.1)" : "transparent",
                              color: invDenomPref === d ? "#f59e0b" : "var(--text-muted)",
                            }}>{d}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>💡</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Count cash before handing over item</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>💡</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Use a counterfeit pen for large bills</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>💡</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Meet in a public, well-lit area</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* venmo expand */}
                  {key === "venmo" && invPayment === "venmo" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.35rem" }}>Service:</div>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {["Venmo", "Zelle", "PayPal", "CashApp"].map(s => (
                            <button type="button" key={s} onClick={() => setInvVenmoService(s)} style={{
                              padding: "0.25rem 0.55rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer",
                              fontWeight: invVenmoService === s ? 600 : 400,
                              border: invVenmoService === s ? "1.5px solid #8b5cf6" : "1px solid var(--border-default)",
                              background: invVenmoService === s ? "rgba(139,92,246,0.1)" : "transparent",
                              color: invVenmoService === s ? "#8b5cf6" : "var(--text-muted)",
                            }}>{s}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📱 Your handle / username</label>
                        <input type="text" placeholder={invVenmoService ? `@your-${invVenmoService.toLowerCase()}-handle` : "@your-handle"} value={invVenmoHandle} onChange={e => setInvVenmoHandle(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "white", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" as const }} />
                        <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "0.25rem" }}>🔒 Only shared with confirmed buyer</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.35rem" }}>Payment timing:</div>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                          {["Before meetup", "At meetup", "After inspection"].map(t => (
                            <button type="button" key={t} onClick={() => setInvVenmoTiming(t)} style={{
                              padding: "0.25rem 0.55rem", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer",
                              fontWeight: invVenmoTiming === t ? 600 : 400,
                              border: invVenmoTiming === t ? "1.5px solid #8b5cf6" : "1px solid var(--border-default)",
                              background: invVenmoTiming === t ? "rgba(139,92,246,0.1)" : "transparent",
                              color: invVenmoTiming === t ? "#8b5cf6" : "var(--text-muted)",
                            }}>{t}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* decide_later expand */}
                  {key === "decide_later" && invPayment === "decide_later" && (
                    <div style={{ marginTop: "0.5rem", padding: "0.65rem 0.85rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "10px" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>💡 You can discuss payment with the buyer in chat and update this before the meetup.</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>Notes for Buyer</div>
            <textarea className="input" value={invNotes} onChange={(e) => setInvNotes(e.target.value)} placeholder="Ex: I'll be in a blue truck. Ring doorbell. Item is heavy, bring help." rows={2} style={{ resize: "vertical", width: "100%", fontSize: "0.78rem" }} />
          </div>

          {/* Preview / Send */}
          {!showInvitePreview ? (
            <button onClick={() => setShowInvitePreview(true)} style={{
              padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer",
              background: "var(--accent)", color: "#fff", border: "none", alignSelf: "flex-start",
            }}>
              Preview Pickup Invite
            </button>
          ) : (
            <div style={{ padding: "0.75rem", borderRadius: "10px", border: "1px solid rgba(0,188,212,0.25)", background: "rgba(0,188,212,0.04)" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                Invite Preview — What the buyer will see
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Location</span><span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{LOCATION_MAP[invLocation]?.icon} {LOCATION_MAP[invLocation]?.label}{invLocation === "other" && invOtherDesc ? ` — ${invOtherDesc}` : ""}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Radius</span><span style={{ fontWeight: 500, color: "var(--text-primary)" }}>Within {invRadius} mi of {sellerZip || "your location"}</span></div>
                {invSlots.length > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Times</span><span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{invSlots.join(", ")}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Contact</span><span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{invContact === "in_app" ? "In-app message" : invContact === "text" ? "Text message" : "Email"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Payment</span><span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{invPayment === "legacyloop" ? "Through LegacyLoop" : invPayment === "cash" ? "Cash" : invPayment === "venmo" ? "Venmo/Zelle" : "Decide at meetup"}</span></div>
                {invNotes && <div style={{ marginTop: "0.2rem", padding: "0.3rem 0.5rem", borderRadius: "6px", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "0.75rem" }}>{invNotes}</div>}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                <button
                  onClick={() => {
                    advance({
                      location: JSON.stringify({ type: invLocation, otherDesc: invOtherDesc || undefined }),
                      notes: invNotes,
                      timeSlots: invSlots,
                      contactMethod: invContact,
                      paymentMethod: invPayment,
                      radius: invRadius,
                    }).then(() => {
                      setContactMethod(invContact);
                      setPaymentMethod(invPayment);
                      setTimeSlots(invSlots);
                      setNotes(invNotes);
                      setRadius(invRadius);
                      setLocData({ type: invLocation, otherDesc: invOtherDesc || undefined });
                    });
                  }}
                  disabled={advancing}
                  style={{ padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer", background: "var(--accent)", color: "#fff", border: "none" }}
                >
                  {advancing ? "Sending..." : "📤 Send Pickup Invite to Buyer"}
                </button>
                <button onClick={() => setShowInvitePreview(false)} style={{ padding: "0.5rem 0.75rem", fontSize: "0.82rem", borderRadius: "8px", cursor: "pointer", background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 1 DONE: Invite Sent confirmation ═══ */}
      {currentIdx >= 0 && (
        <div style={{
          padding: "0.65rem 0.75rem", borderRadius: "10px",
          border: "1px solid rgba(22,163,74,0.25)", background: "rgba(22,163,74,0.04)", opacity: currentIdx > 0 ? 0.7 : 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem" }}>📤</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--success-text)" }}>Invite Sent</span>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(22,163,74,0.12)", color: "var(--success-text)", padding: "0.1rem 0.35rem", borderRadius: "9999px", marginLeft: "auto" }}>Done</span>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: CONFIRMED ═══ */}
      {currentIdx === 0 && (
        <div style={{
          background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.2)",
          borderLeft: "3px solid rgba(0,188,212,0.6)", borderRadius: "14px", padding: "1.25rem",
          display: "flex", flexDirection: "column", gap: "0.85rem",
        }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)" }}>Confirm Meetup</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Verify the buyer has agreed to the meetup details. Confirm to generate a secure handoff code.</div>

          {/* Location card */}
          <MeetupLocationCard locationType={locType} sellerZip={sellerZip} isRevealed={false} />

          {/* Time slots display */}
          {timeSlots.length > 0 && (
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Available Times</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                {timeSlots.map((slot) => (
                  <span key={slot} style={{ padding: "0.25rem 0.55rem", borderRadius: "7px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(0,188,212,0.1)", border: "1px solid rgba(0,188,212,0.2)", color: "var(--accent)" }}>
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact method */}
          <ContactMethodCard method={contactMethod} isActive={false} />

          {/* Payment method */}
          <PaymentMethodBadge method={paymentMethod} price={price} />

          {/* Notes */}
          {notes && (
            <div style={{ padding: "0.5rem 0.65rem", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-default)", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Notes: </span>{notes}
            </div>
          )}

          <button
            onClick={() => advance()}
            disabled={advancing}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer", background: "var(--accent)", color: "#fff", border: "none", alignSelf: "flex-start" }}
          >
            {advancing ? "Confirming..." : "✅ Confirm Meetup"}
          </button>
        </div>
      )}

      {/* Step 2 done badge */}
      {currentIdx >= 1 && (
        <div style={{
          padding: "0.65rem 0.75rem", borderRadius: "10px",
          border: "1px solid rgba(22,163,74,0.25)", background: "rgba(22,163,74,0.04)", opacity: currentIdx > 1 ? 0.7 : 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem" }}>✅</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--success-text)" }}>Meetup Confirmed</span>
            {confirmedAt && <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>{new Date(confirmedAt).toLocaleDateString()}</span>}
            <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(22,163,74,0.12)", color: "var(--success-text)", padding: "0.1rem 0.35rem", borderRadius: "9999px", marginLeft: "auto" }}>Done</span>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: EN ROUTE ═══ */}
      {currentIdx === 1 && (
        <div style={{
          background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)",
          borderLeft: "3px solid rgba(139,92,246,0.6)", borderRadius: "14px", padding: "1.25rem",
          display: "flex", flexDirection: "column", gap: "0.85rem",
        }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#8b5cf6" }}>Heading to Meetup</div>

          {/* Handoff code — generated at CONFIRMED */}
          {handoffCode && (
            <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", textAlign: "center" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>Your Handoff Code</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "0.3em", color: "#8b5cf6", fontFamily: "monospace" }}>{handoffCode}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>Share this code with the buyer to confirm the exchange</div>
            </div>
          )}

          {/* Location with map */}
          <MeetupLocationCard locationType={locType} sellerZip={sellerZip} isRevealed={true} />

          {/* Contact active */}
          <ContactMethodCard method={contactMethod} isActive={true} />

          {/* Payment reminder */}
          <PaymentMethodBadge method={paymentMethod} price={price} />

          {/* Safety checklist */}
          <div style={{ padding: "0.65rem 0.75rem", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>Safety Checklist</div>
            {SAFETY_CHECKLIST.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.15rem 0" }}>
                <span style={{ color: "#10b981", fontSize: "0.7rem" }}>✓</span> {item}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => advance()}
              disabled={advancing}
              style={{ padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer", background: "#8b5cf6", color: "#fff", border: "none" }}
            >
              {advancing ? "Updating..." : "🚗 I'm On My Way"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 done badge */}
      {currentIdx >= 2 && (
        <div style={{
          padding: "0.65rem 0.75rem", borderRadius: "10px",
          border: "1px solid rgba(22,163,74,0.25)", background: "rgba(22,163,74,0.04)", opacity: currentIdx > 2 ? 0.7 : 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem" }}>🚗</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--success-text)" }}>En Route</span>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(22,163,74,0.12)", color: "var(--success-text)", padding: "0.1rem 0.35rem", borderRadius: "9999px", marginLeft: "auto" }}>Done</span>
          </div>
        </div>
      )}

      {/* ═══ STEP 4: HANDED OFF ═══ */}
      {currentIdx === 2 && (
        <div style={{
          background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
          borderLeft: "3px solid #10b981", borderRadius: "14px", padding: "1.25rem",
          display: "flex", flexDirection: "column", gap: "0.85rem",
        }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#10b981" }}>Confirm Handoff</div>

          {/* Handoff code verification */}
          {handoffCode && (
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>Enter the buyer&#39;s handoff code to verify the exchange:</div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="text"
                  maxLength={4}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  style={{
                    width: "6rem", padding: "0.5rem 0.75rem", fontSize: "1.3rem", fontWeight: 800,
                    letterSpacing: "0.3em", textAlign: "center", fontFamily: "monospace",
                    borderRadius: "10px", border: `2px solid ${codeInput === handoffCode ? "#10b981" : codeInput.length === 4 ? "#ef4444" : "var(--border-default)"}`,
                    background: codeInput === handoffCode ? "rgba(16,185,129,0.08)" : "var(--ghost-bg)",
                    color: "var(--text-primary)",
                  }}
                />
                {codeInput === handoffCode && <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.82rem" }}>Code verified!</span>}
                {codeInput.length === 4 && codeInput !== handoffCode && <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.78rem" }}>Code doesn&#39;t match</span>}
              </div>
            </div>
          )}

          {/* Payment confirmation */}
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>Payment Confirmation</div>
            {paymentMethod === "legacyloop" && price != null && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Payment of ${price.toLocaleString()} is in escrow — will be released after handoff.</div>
            )}
            {paymentMethod === "cash" && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Confirm you received ${price != null ? `$${price.toLocaleString()} ` : ""}cash from buyer.</div>
            )}
            {paymentMethod === "venmo" && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Confirm you received payment via Venmo/Zelle.</div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} style={{ accentColor: "#10b981" }} />
              Payment received or secured
            </label>
          </div>

          {/* Item condition */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={conditionConfirmed} onChange={(e) => setConditionConfirmed(e.target.checked)} style={{ accentColor: "#10b981" }} />
            Item handed off in described condition
          </label>

          <button
            onClick={() => advance({ handoffCode: codeInput || undefined })}
            disabled={advancing || !paymentConfirmed || !conditionConfirmed || (handoffCode ? codeInput !== handoffCode : false)}
            style={{
              padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer",
              background: paymentConfirmed && conditionConfirmed && (!handoffCode || codeInput === handoffCode) ? "#10b981" : "rgba(16,185,129,0.3)",
              color: "#fff", border: "none", alignSelf: "flex-start",
              opacity: advancing || !paymentConfirmed || !conditionConfirmed || (handoffCode ? codeInput !== handoffCode : false) ? 0.5 : 1,
            }}
          >
            {advancing ? "Confirming..." : "🤝 Confirm Handoff Complete"}
          </button>
        </div>
      )}

      {/* Step 4 done badge */}
      {currentIdx >= 3 && (
        <div style={{
          padding: "0.65rem 0.75rem", borderRadius: "10px",
          border: "1px solid rgba(22,163,74,0.25)", background: "rgba(22,163,74,0.04)", opacity: currentIdx > 3 ? 0.7 : 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem" }}>🤝</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--success-text)" }}>Handed Off</span>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(22,163,74,0.12)", color: "var(--success-text)", padding: "0.1rem 0.35rem", borderRadius: "9999px", marginLeft: "auto" }}>Done</span>
          </div>
        </div>
      )}

      {/* ═══ STEP 5: COMPLETED ═══ */}
      {currentIdx === 3 && !isComplete && (
        <div style={{
          background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)",
          borderLeft: "3px solid var(--accent)", borderRadius: "14px", padding: "1.25rem",
          display: "flex", flexDirection: "column", gap: "0.65rem",
        }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)" }}>Finalize Transaction</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Both parties confirmed the handoff. Click below to close the transaction{paymentMethod === "legacyloop" ? " and release payment." : "."}</div>
          <button
            onClick={() => advance()}
            disabled={advancing}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer", background: "var(--accent)", color: "#fff", border: "none", alignSelf: "flex-start" }}
          >
            {advancing ? "Finalizing..." : "🎉 Complete Transaction"}
          </button>
        </div>
      )}

      {/* ═══ SALE CLOSED SCREEN ═══ */}
      {isComplete && (
        <SaleClosedScreen
          itemId={itemId}
          completionType="Pickup Handoff"
          price={price ?? null}
          closedAt={completedAt ?? new Date().toISOString()}
          fundsAvailable={true}
          summaryRows={[
            ...(price != null ? [{ label: "Sale Price", value: `$${price.toLocaleString()}`, highlight: true }] : []),
            ...(completedAt ? [{ label: "Completed", value: new Date(completedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) }] : []),
            { label: "Fulfilled via", value: "Pickup Handoff" },
            { label: "Location", value: `${LOCATION_MAP[locType]?.icon ?? ""} ${LOCATION_MAP[locType]?.label ?? "Meetup"}` },
            { label: "Payment", value: paymentMethod === "legacyloop" ? "LegacyLoop Escrow" : paymentMethod === "cash" ? "Cash" : paymentMethod === "venmo" ? "Venmo/Zelle" : "At meetup" },
          ]}
        />
      )}

      {error && (
        <div style={{ fontSize: "0.78rem", color: "var(--error-text)", padding: "0.4rem 0.6rem", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "0.5rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── LTL FREIGHT COMPLETION FLOW (post-sale) ─────────────────────────────

const LTL_STEPS = [
  { key: "QUOTE_ACCEPTED", label: "Quote Accepted", icon: "📋", desc: "Freight quote confirmed" },
  { key: "PICKUP_SCHEDULED", label: "Pickup Scheduled", icon: "📅", desc: "Carrier pickup date set" },
  { key: "PICKED_UP", label: "Picked Up", icon: "🚛", desc: "Carrier has the item" },
  { key: "IN_TRANSIT", label: "In Transit", icon: "📍", desc: "Moving to destination" },
  { key: "DELIVERED", label: "Delivered", icon: "✅", desc: "Freight delivered" },
];

const LTL_STATUS_IDX: Record<string, number> = {};
LTL_STEPS.forEach((s, i) => { LTL_STATUS_IDX[s.key] = i; });

function LtlCompletionFlow({ itemId, fromZip, weight, length, width, height }: {
  itemId: string;
  fromZip: string | null;
  weight: number;
  length: number;
  width: number;
  height: number;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [carrier, setCarrier] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [bolNumber, setBolNumber] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");

  // Form fields for QUOTE_ACCEPTED step
  const [selectedCarrier, setSelectedCarrier] = useState("XPO Logistics");
  const [scheduledPickupDate, setScheduledPickupDate] = useState("");

  useEffect(() => {
    fetch(`/api/shipping/ltl/${itemId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setStatus(data.status);
          setCarrier(data.carrier);
          setTrackingNumber(data.trackingNumber);
          setBolNumber(data.bolNumber);
          setPickupDate(data.pickupDate);
          setDeliveryDate(data.deliveryDate);
          setQuote(data.quote);
          if (data.carrier) setSelectedCarrier(data.carrier);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  const advance = async (extraData?: any) => {
    setAdvancing(true);
    setError("");
    try {
      const res = await fetch(`/api/shipping/ltl/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance", ...extraData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus(data.ltlStatus);
      if (data.bolNumber) setBolNumber(data.bolNumber);
      if (data.trackingNumber) setTrackingNumber(data.trackingNumber);
      if (data.carrier) setCarrier(data.carrier);
      if (data.pickupDate) setPickupDate(data.pickupDate);
      if (data.deliveryDate) setDeliveryDate(data.deliveryDate);
    } catch (e: any) {
      setError(e.message);
    }
    setAdvancing(false);
  };

  if (loading) {
    return <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", padding: "1rem 0" }}>Loading freight status...</div>;
  }

  const currentIdx = status ? (LTL_STATUS_IDX[status] ?? -1) : -1;
  const isComplete = status === "DELIVERED";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.1rem" }}>🚛</span>
        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>LTL Freight Completion</span>
        {isComplete && (
          <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "rgba(22,163,74,0.15)", color: "var(--success-text)", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>DELIVERED</span>
        )}
      </div>

      {/* Shipment info bar */}
      {(bolNumber || trackingNumber || carrier) && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))", gap: "0.5rem",
          padding: "0.6rem 0.75rem", borderRadius: "0.6rem",
          background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)",
        }}>
          {bolNumber && (
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>BOL #</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent)", fontFamily: "monospace" }}>{bolNumber}</div>
            </div>
          )}
          {trackingNumber && (
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>PRO #</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace" }}>{trackingNumber}</div>
            </div>
          )}
          {carrier && (
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Carrier</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{carrier}</div>
            </div>
          )}
          {bolNumber && (
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <a
                href={`/shipping/bol/${itemId}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)",
                  textDecoration: "none", padding: "0.25rem 0.6rem",
                  border: "1px solid var(--accent)", borderRadius: "0.4rem",
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                }}
              >
                📄 View BOL
              </a>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
        {LTL_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
              <div style={{
                width: "2rem", height: "2rem", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.85rem",
                background: done ? (active ? "var(--accent)" : "rgba(0,188,212,0.15)") : "var(--bg-card-hover)",
                border: active ? "2px solid var(--accent)" : "1px solid var(--border-default)",
                transition: "all 0.2s ease",
                ...(active ? { boxShadow: "0 0 8px rgba(0,188,212,0.3)" } : {}),
              }}>
                {done ? step.icon : <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{i + 1}</span>}
              </div>
              <div style={{ fontSize: "0.6rem", fontWeight: done ? 600 : 400, color: done ? "var(--text-primary)" : "var(--text-muted)", textAlign: "center" }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {LTL_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx + 1 && !isComplete;
          const future = i > currentIdx + 1;

          if (future) return null;

          return (
            <div
              key={step.key}
              style={{
                padding: "0.65rem 0.75rem",
                borderRadius: "0.6rem",
                border: `1px solid ${active ? "var(--accent)" : done ? "rgba(22,163,74,0.25)" : "var(--border-default)"}`,
                background: active ? "rgba(0,188,212,0.06)" : done ? "rgba(22,163,74,0.04)" : "transparent",
                opacity: done && !active ? 0.75 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: active ? "0.5rem" : 0 }}>
                <span style={{ fontSize: "0.9rem" }}>{step.icon}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: done ? "var(--success-text)" : active ? "var(--accent)" : "var(--text-primary)" }}>
                  {step.label}
                </span>
                {done && <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(22,163,74,0.12)", color: "var(--success-text)", padding: "0.1rem 0.35rem", borderRadius: "9999px", marginLeft: "auto" }}>Done</span>}
                {step.key === "PICKUP_SCHEDULED" && pickupDate && done && (
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>
                    {new Date(pickupDate).toLocaleDateString()}
                  </span>
                )}
                {step.key === "DELIVERED" && deliveryDate && done && (
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>
                    {new Date(deliveryDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Active card: show the action */}
              {active && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{step.desc}</div>

                  {step.key === "QUOTE_ACCEPTED" && (
                    <>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Accept the freight quote to generate a Bill of Lading (BOL). Select the carrier below.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                        <div>
                          <label className="label" style={{ fontSize: "0.68rem" }}>Carrier</label>
                          <select className="input" value={selectedCarrier} onChange={(e) => setSelectedCarrier(e.target.value)} style={{ fontSize: "0.78rem" }}>
                            <option value="XPO Logistics">XPO Logistics</option>
                            <option value="Estes Express">Estes Express</option>
                            <option value="Old Dominion">Old Dominion</option>
                            <option value="R+L Carriers">R+L Carriers</option>
                            <option value="SAIA">SAIA</option>
                            <option value="FedEx Freight">FedEx Freight</option>
                            <option value="UPS Freight">UPS Freight</option>
                          </select>
                        </div>
                        <div>
                          <label className="label" style={{ fontSize: "0.68rem" }}>Shipment</label>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", padding: "0.4rem 0" }}>
                            {weight} lbs · {length}×{width}×{height} in
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {step.key === "PICKUP_SCHEDULED" && (
                    <>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Schedule the freight pickup. The carrier will call 30 minutes before arrival.
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: "0.68rem" }}>Pickup Date</label>
                        <input
                          type="date"
                          className="input"
                          value={scheduledPickupDate}
                          onChange={(e) => setScheduledPickupDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          style={{ fontSize: "0.78rem", width: "auto" }}
                        />
                      </div>
                    </>
                  )}

                  {step.key === "PICKED_UP" && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Confirm the carrier has picked up the item. This will mark the item as shipped.
                    </div>
                  )}

                  {step.key === "IN_TRANSIT" && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      The freight is in transit. Track via the carrier website using PRO# {trackingNumber || "above"}.
                    </div>
                  )}

                  {step.key === "DELIVERED" && (
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      Confirm the freight has been delivered to the buyer. This completes the transaction.
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    onClick={() => advance(
                      step.key === "QUOTE_ACCEPTED"
                        ? { carrier: selectedCarrier, quote: { weight, length, width, height, fromZip } }
                        : step.key === "PICKUP_SCHEDULED"
                        ? { pickupDate: scheduledPickupDate || undefined }
                        : undefined
                    )}
                    disabled={advancing || (step.key === "PICKUP_SCHEDULED" && !scheduledPickupDate)}
                    style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", alignSelf: "flex-start" }}
                  >
                    {advancing ? "Updating..." : step.key === "QUOTE_ACCEPTED" ? "📋 Accept Quote & Generate BOL" : step.key === "PICKUP_SCHEDULED" ? "📅 Schedule Pickup" : step.key === "PICKED_UP" ? "🚛 Confirm Pickup" : step.key === "IN_TRANSIT" ? "📍 Confirm In Transit" : "✅ Confirm Delivery"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ SALE CLOSED SCREEN ═══ */}
      {isComplete && (
        <SaleClosedScreen
          itemId={itemId}
          completionType="Freight Delivery"
          price={null}
          closedAt={deliveryDate ?? new Date().toISOString()}
          fundsAvailable={true}
          summaryRows={[
            { label: "Fulfilled via", value: "LTL Freight" },
            ...(carrier ? [{ label: "Carrier", value: carrier }] : []),
            ...(trackingNumber ? [{ label: "PRO #", value: trackingNumber }] : []),
            ...(bolNumber ? [{ label: "BOL #", value: bolNumber }] : []),
            ...(deliveryDate ? [{ label: "Delivered", value: new Date(deliveryDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) }] : []),
          ]}
          extraContent={bolNumber ? (
            <a
              href={`/shipping/bol/${itemId}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
            >
              📄 View Bill of Lading →
            </a>
          ) : undefined}
        />
      )}

      {error && (
        <div style={{ fontSize: "0.78rem", color: "var(--error-text)", padding: "0.4rem 0.6rem", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "0.5rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── POST-SALE ROUTER ─────────────────────────────────────────────────────

function PostSaleRouter({
  itemId, weight, length, width, height, isFragile, fromZip, itemValue,
  existingLabel, saleMethod, needsFreight, shippingMethod, saleRadius, itemStatus,
}: {
  itemId: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  isFragile: boolean;
  fromZip: string | null;
  itemValue: number | null;
  existingLabel: ShipmentLabelData | null;
  saleMethod?: string;
  needsFreight: boolean;
  shippingMethod?: string;
  saleRadius?: number;
  itemStatus: string;
}) {
  const isLocalOnly = saleMethod === "LOCAL_PICKUP" || shippingMethod === "local_only";
  const isFreight = needsFreight || shippingMethod === "freight";
  const hasLabel = !!existingLabel;

  // Build available tabs
  const tabs: { key: "parcel" | "pickup" | "ltl"; label: string; icon: string }[] = [];
  if (!isLocalOnly) tabs.push({ key: "parcel", label: "Ship It", icon: "📦" });
  tabs.push({ key: "pickup", label: "Local Pickup", icon: "🤝" });
  if (isFreight || weight > 50) tabs.push({ key: "ltl", label: "LTL Freight", icon: "🚛" });

  const defaultTab = isLocalOnly ? "pickup" : isFreight ? "ltl" : hasLabel ? "parcel" : "parcel";
  const [fulfillTab, setFulfillTab] = useState<"parcel" | "pickup" | "ltl">(defaultTab as any);

  // If it's a simple parcel-only case with a label, skip tabs entirely
  if (hasLabel && !isLocalOnly && !isFreight && tabs.length <= 1) {
    return (
      <PostSaleWizard
        itemId={itemId} weight={weight} length={length} width={width} height={height}
        isFragile={isFragile} fromZip={fromZip} itemValue={itemValue} existingLabel={existingLabel}
      />
    );
  }

  // Only one option? Don't show tab bar
  if (tabs.length === 1) {
    if (tabs[0].key === "pickup") return <PickupCompletionFlow itemId={itemId} saleRadius={saleRadius} fromZip={fromZip} itemValue={itemValue} />;
    if (tabs[0].key === "ltl") return <LtlCompletionFlow itemId={itemId} fromZip={fromZip} weight={weight} length={length} width={width} height={height} />;
    return (
      <PostSaleWizard
        itemId={itemId} weight={weight} length={length} width={width} height={height}
        isFragile={isFragile} fromZip={fromZip} itemValue={itemValue} existingLabel={existingLabel}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-card)", borderRadius: "0.5rem", padding: "0.2rem", border: "1px solid var(--border-default)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFulfillTab(t.key)}
            style={{
              flex: 1, padding: "0.5rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.82rem", fontWeight: 600,
              background: fulfillTab === t.key ? "rgba(0,188,212,0.12)" : "transparent",
              border: fulfillTab === t.key ? "1px solid var(--accent)" : "1px solid transparent",
              color: fulfillTab === t.key ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {fulfillTab === "parcel" && (
        <PostSaleWizard
          itemId={itemId} weight={weight} length={length} width={width} height={height}
          isFragile={isFragile} fromZip={fromZip} itemValue={itemValue} existingLabel={existingLabel}
        />
      )}
      {fulfillTab === "pickup" && (
        <PickupCompletionFlow itemId={itemId} saleRadius={saleRadius} fromZip={fromZip} itemValue={itemValue} />
      )}
      {fulfillTab === "ltl" && (
        <LtlCompletionFlow itemId={itemId} fromZip={fromZip} weight={weight} length={length} width={width} height={height} />
      )}
    </div>
  );
}

// ─── LTL QUOTE FORM ────────────────────────────────────────────────────────

const FREIGHT_CLASSES = [
  { value: "auto", label: "Auto-calculate from dimensions & weight" },
  { value: "50", label: "Class 50 — Heavy, compact (50 lbs/cu ft)" },
  { value: "55", label: "Class 55" },
  { value: "60", label: "Class 60" },
  { value: "65", label: "Class 65" },
  { value: "70", label: "Class 70 — Most furniture" },
  { value: "77.5", label: "Class 77.5" },
  { value: "85", label: "Class 85 — Household goods" },
  { value: "92.5", label: "Class 92.5" },
  { value: "100", label: "Class 100 — Average density" },
  { value: "110", label: "Class 110" },
  { value: "125", label: "Class 125" },
  { value: "150", label: "Class 150 — Light/bulky" },
  { value: "175", label: "Class 175" },
  { value: "200", label: "Class 200" },
  { value: "250", label: "Class 250" },
  { value: "300", label: "Class 300" },
  { value: "400", label: "Class 400" },
  { value: "500", label: "Class 500 — Very light/bulky" },
];

function LtlQuoteForm({ itemId, fromZip, weight, length, width, height, suggestion, itemValue, accessorials, ltlSubmitting, onSubmit, onCancel, category }: {
  itemId: string;
  fromZip: string | null;
  weight: number;
  length: number;
  width: number;
  height: number;
  suggestion: PackageSuggestion | null;
  itemValue: number | null;
  accessorials: Record<string, boolean>;
  ltlSubmitting: boolean;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  category?: string | null;
}) {
  const [originZip, setOriginZip] = useState(fromZip ?? "");
  const [destZip, setDestZip] = useState("");
  const [formWeight, setFormWeight] = useState(weight);
  const [formLength, setFormLength] = useState(length);
  const [formWidth, setFormWidth] = useState(width);
  const [formHeight, setFormHeight] = useState(height);
  const [freightClass, setFreightClass] = useState("auto");
  const [commodity, setCommodity] = useState(suggestion?.label || "");
  const [packaging, setPackaging] = useState(suggestion?.isFragile ? "crate" : "pallet");
  const [stackable, setStackable] = useState(false);
  const [declaredValue, setDeclaredValue] = useState(itemValue ?? 0);
  const [instructions, setInstructions] = useState("");

  return (
    <div style={{ padding: "0.75rem", borderRadius: "0.6rem", border: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Freight Quote Request</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.78rem" }}>
        <div>
          <label className="label">Origin ZIP</label>
          <input className="input" value={originZip} onChange={(e) => setOriginZip(e.target.value)} style={{ fontSize: "0.78rem" }} />
        </div>
        <div>
          <label className="label">Destination ZIP</label>
          <input className="input" value={destZip} onChange={(e) => setDestZip(e.target.value)} placeholder="Enter ZIP" style={{ fontSize: "0.78rem" }} />
        </div>
        <div>
          <label className="label">Weight (lbs)</label>
          <input className="input" type="number" value={formWeight} onChange={(e) => setFormWeight(Number(e.target.value))} style={{ fontSize: "0.78rem" }} />
        </div>
        <div>
          <label className="label">Commodity Type</label>
          <input className="input" value={commodity} onChange={(e) => setCommodity(e.target.value)} placeholder="e.g. Antique dresser" style={{ fontSize: "0.78rem" }} />
        </div>
        <div>
          <label className="label">Length (in)</label>
          <input className="input" type="number" value={formLength} onChange={(e) => setFormLength(Number(e.target.value))} style={{ fontSize: "0.78rem" }} />
        </div>
        <div>
          <label className="label">Width (in)</label>
          <input className="input" type="number" value={formWidth} onChange={(e) => setFormWidth(Number(e.target.value))} style={{ fontSize: "0.78rem" }} />
        </div>
        <div>
          <label className="label">Height (in)</label>
          <input className="input" type="number" value={formHeight} onChange={(e) => setFormHeight(Number(e.target.value))} style={{ fontSize: "0.78rem" }} />
        </div>
        <div>
          <label className="label">Declared Value ($)</label>
          <input className="input" type="number" value={declaredValue} onChange={(e) => setDeclaredValue(Number(e.target.value))} style={{ fontSize: "0.78rem" }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">Freight Class</label>
          <select className="input" value={freightClass} onChange={(e) => setFreightClass(e.target.value)} style={{ fontSize: "0.78rem", width: "100%" }}>
            {FREIGHT_CLASSES.map((fc) => (
              <option key={fc.value} value={fc.value}>{fc.label}</option>
            ))}
          </select>
          {freightClass === "auto" && (() => {
            const calc = estimateFreightClass(formWeight, formLength, formWidth, formHeight, category || commodity);
            return (
              <div style={{ marginTop: "0.2rem" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 600 }}>
                  Auto-calculated: Class {calc.freightClass} (density: {calc.density} lb/ft³)
                </div>
                {calc.note && (
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    💡 {calc.note}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <div>
          <label className="label">Packaging Type</label>
          <select className="input" value={packaging} onChange={(e) => setPackaging(e.target.value)} style={{ fontSize: "0.78rem" }}>
            <option value="pallet">Pallet</option>
            <option value="crate">Crate</option>
            <option value="blanket">Blanket wrap</option>
            <option value="loose">Loose</option>
            <option value="carton">Carton</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "0.1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={stackable} onChange={(e) => setStackable(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
            Stackable
          </label>
        </div>
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <label className="label">Special Instructions</label>
        <textarea className="input" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Antique, fragile, stairs at delivery, etc." style={{ width: "100%", fontSize: "0.78rem", resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button
          className="btn-primary"
          disabled={ltlSubmitting || !destZip}
          onClick={() => onSubmit({
            itemId, originZip, destZip, weight: formWeight,
            dimensions: { length: formLength, width: formWidth, height: formHeight },
            freightClass, commodity, packaging, stackable, declaredValue,
            accessorials, instructions,
          })}
          style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}
        >
          {ltlSubmitting ? "Submitting..." : "Submit Quote Request"}
        </button>
        <button className="btn-ghost" onClick={onCancel} style={{ padding: "0.4rem 0.75rem", fontSize: "0.82rem" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

export default function ShippingPanel({
  itemId,
  mode,
  fromZip,
  suggestion,
  metroEstimates,
  savedShipping,
  itemStatus,
  existingLabel,
  itemValue,
  shippingMethod,
  saleMethod,
  saleRadius,
}: Props) {
  // AI suggestion mapping
  const aiMapping = useMemo(() => mapSuggestionToPreset(suggestion), [suggestion]);
  const aiSuggestedKey = aiMapping.key;

  // Editable package fields — pre-populated from saved data or AI suggestion
  const [boxSize, setBoxSize] = useState<string>(
    savedShipping.weight ? "custom" : aiSuggestedKey
  );
  const [weight, setWeight] = useState(savedShipping.weight ?? suggestion?.weightEstimate ?? 5);
  const [length, setLength] = useState(
    savedShipping.length ?? (aiMapping.autoCustom ? (suggestion?.length ?? 14) : (BOX_PRESETS[aiSuggestedKey]?.l || suggestion?.length || 14))
  );
  const [width, setWidth] = useState(
    savedShipping.width ?? (aiMapping.autoCustom ? (suggestion?.width ?? 12) : (BOX_PRESETS[aiSuggestedKey]?.w || suggestion?.width || 12))
  );
  const [height, setHeight] = useState(
    savedShipping.height ?? (aiMapping.autoCustom ? (suggestion?.height ?? 8) : (BOX_PRESETS[aiSuggestedKey]?.h || suggestion?.height || 8))
  );
  const [ratesStale, setRatesStale] = useState(false);
  const [fragile, setFragile] = useState(savedShipping.isFragile || suggestion?.isFragile || false);
  const [preference, setPreference] = useState(savedShipping.preference || "BUYER_PAYS");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Shipping vs Local Pickup tab
  const [shippingTab, setShippingTab] = useState<"ship" | "pickup">(
    shippingMethod === "local_only" ? "pickup" : "ship"
  );

  // Pre-sale carrier rates
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [buyerZip, setBuyerZip] = useState("");
  const [selectedPreSaleRate, setSelectedPreSaleRate] = useState<ShippingRate | null>(null);
  const [preSaleQuoteSaved, setPreSaleQuoteSaved] = useState(false);
  const [savedQuoteData, setSavedQuoteData] = useState<any>(null);

  // Live metro rates (Shippo per-city)
  const [liveMetro, setLiveMetro] = useState<any[] | null>(null);
  const [metroLoading, setMetroLoading] = useState(false);

  const METRO_ZIPS = [
    { city: "New York", zip: "10001" },
    { city: "Los Angeles", zip: "90001" },
    { city: "Chicago", zip: "60601" },
    { city: "Houston", zip: "77001" },
  ];

  const fetchLiveMetro = async () => {
    setMetroLoading(true);
    const results: any[] = [];
    for (const metro of METRO_ZIPS) {
      try {
        const res = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromZip: fromZip || "04901",
            toZip: metro.zip,
            weight: String(weight),
            length: String(length),
            width: String(width),
            height: String(height),
          }),
        });
        const data = await res.json();
        const sorted = (data.rates || [])
          .map((r: any) => ({
            carrier: r.provider || r.carrier,
            service: r.servicelevel_name || r.service,
            rate: parseFloat(r.amount || r.rate) || 0,
            days: r.estimated_days || r.estimatedDays || 5,
          }))
          .filter((r: any) => r.rate > 0)
          .sort((a: any, b: any) => a.rate - b.rate);

        if (sorted.length > 0) {
          results.push({
            city: metro.city,
            estimatedCost: sorted[0].rate,
            estimatedDays: sorted[0].days,
            carrier: sorted[0].carrier,
            service: sorted[0].service,
            isLive: !data.isMock && !data.isDemo,
            isCheapest: false,
            isFastest: false,
          });
        }
      } catch { /* ignore */ }
    }

    if (results.length > 0) {
      const minCost = Math.min(...results.map(r => r.estimatedCost));
      const minDays = Math.min(...results.map(r => r.estimatedDays));
      results.forEach(r => {
        r.isCheapest = r.estimatedCost === minCost;
        r.isFastest = r.estimatedDays === minDays && !r.isCheapest;
      });
      setLiveMetro(results);
    }
    setMetroLoading(false);
  };

  // Load saved quote from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ll_quote_${itemId}`);
      if (raw) {
        const q = JSON.parse(raw);
        const ageMs = Date.now() - (q.savedAt || 0);
        setSavedQuoteData({ ...q, isFresh: ageMs < 86400000, ageHrs: Math.round(ageMs / 3600000) });
      }
    } catch { /* ignore */ }
  }, [itemId]);

  // Fetch rates when package details are available (pre-sale)
  const fetchPreSaleRates = async (toZip?: string) => {
    setLoadingRates(true);
    setRatesStale(false);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromZip: fromZip ?? "04901",
          toZip: toZip || "10001", // Default to NYC for estimate
          weight: String(weight),
          length: String(length),
          width: String(width),
          height: String(height),
        }),
      });
      const data = await res.json();
      const rawRates = data.rates ?? [];
      const normalized = normalizeRates(rawRates);
      setRates(normalized.length > 0 ? normalized : generateFallbackRates(weight));
      // Persist quote to Shipping Center via estimate API (fire-and-forget)
      fetch("/api/shipping/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, destZip: toZip || "10001" }),
      }).catch(() => {});
    } catch {
      setRates(generateFallbackRates(weight));
    }
    setLoadingRates(false);
  };

  // Auto-fetch on mount for pre-sale
  useEffect(() => {
    if (mode === "pre-sale") {
      fetchPreSaleRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle box preset change
  const handleBoxPreset = (preset: string) => {
    setBoxSize(preset);
    if (preset !== "custom") {
      const p = BOX_PRESETS[preset];
      setLength(p.l);
      setWidth(p.w);
      setHeight(p.h);
    }
    if (rates.length > 0) setRatesStale(true);
  };

  // Save shipping details
  const saveShipping = async () => {
    setSaving(true);
    try {
      await fetch(`/api/items/update/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingWeight: weight,
          shippingLength: length,
          shippingWidth: width,
          shippingHeight: height,
          isFragile: fragile,
          shippingPreference: preference,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
    setSaving(false);
  };

  const isFromAI = !savedShipping.weight && suggestion !== null;

  // ── Oversized detection ──
  const maxDim = Math.max(length, width, height);
  const girth = 2 * (width + height);
  const lengthPlusGirth = length + girth;
  const isOverweight = weight > 70;
  const isOverweight150 = weight > 150;
  const isOversized = maxDim > 108;
  const isGirthExceeded = lengthPlusGirth > 165;
  const isBorderline = weight >= 50 && weight <= 70 && !isOversized && !isGirthExceeded;
  const isArtItem = !!(suggestion?.label && /art|paint|canvas|oil on|watercolor|lithograph|frame|portrait|sculpture/i.test(suggestion.label));
  const oversizedReason = isOverweight ? "weight" : isOversized ? "dimension" : isGirthExceeded ? "girth" : null;
  const needsFreight = isOverweight || isOversized || isGirthExceeded;

  // ── Large item routing (box-preset-based) ──
  const isOversizedBox = boxSize === "oversized" || boxSize === "furniture";
  const isFurnitureBox = boxSize === "furniture";
  const exceedsAllCarriers = isOverweight150 || isOversized;
  // Routing level: "required" > "strong" > "suggestion" > null
  const routingLevel: "required" | "strong" | "suggestion" | null =
    exceedsAllCarriers ? "required" :
    isFurnitureBox || isOverweight ? "strong" :
    isOversizedBox ? "suggestion" :
    null;

  // Freight estimates for large items
  const showFreight = shippingMethod === "freight" || shippingMethod === "local_recommended" || needsFreight;
  const [showFreightManual, setShowFreightManual] = useState(false);
  const [residential, setResidential] = useState(true);
  const [liftgate, setLiftgate] = useState(true);
  const [notifyBeforeDelivery, setNotifyBeforeDelivery] = useState(true);
  const [blanketWrap, setBlanketWrap] = useState(suggestion?.isFragile || false);
  const [insideDelivery, setInsideDelivery] = useState(false);
  const [whiteGlove, setWhiteGlove] = useState(false);
  const [showLtlQuoteForm, setShowLtlQuoteForm] = useState(needsFreight);
  const [ltlQuoteSubmitted, setLtlQuoteSubmitted] = useState(false);
  const [ltlSubmitting, setLtlSubmitting] = useState(false);
  const [liveLtlQuotes, setLiveLtlQuotes] = useState<any[] | null>(null);
  const [ltlQuoteLoading, setLtlQuoteLoading] = useState(false);
  const [ltlQuoteSource, setLtlQuoteSource] = useState<string>("");
  const [selectedLtlCarrier, setSelectedLtlCarrier] = useState<any>(null);

  const fetchLiveLtlQuotes = async () => {
    setLtlQuoteLoading(true);
    try {
      const fc = (() => {
        const cubicFt = (length * width * height) / 1728;
        const density = cubicFt > 0 ? weight / cubicFt : 0;
        if (density >= 50) return "50";
        if (density >= 35) return "55";
        if (density >= 22.5) return "65";
        if (density >= 15) return "70";
        if (density >= 12) return "85";
        if (density >= 9) return "100";
        if (density >= 6) return "150";
        if (density >= 4) return "200";
        return "250";
      })();
      const res = await fetch("/api/shipping/ltl-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromZip: fromZip || "04901",
          toZip: "10001",
          weight,
          length,
          width,
          height,
          freightClass: fc,
          description: suggestion?.label || "Household goods",
          packaging: "palletized",
        }),
      });
      const data = await res.json();
      if (data.quotes && data.quotes.length > 0) {
        setLiveLtlQuotes(data.quotes);
        setLtlQuoteSource(data.source || "demo");
      }
    } catch { /* ignore */ }
    setLtlQuoteLoading(false);
  };

  const freightEstimates: FreightEstimate[] = useMemo(() => {
    if (!showFreight) return [];
    return getFreightEstimates({
      weight,
      lengthIn: length,
      widthIn: width,
      heightIn: height,
      fromZip: fromZip ?? undefined,
      residential,
      liftgate,
    });
  }, [showFreight, weight, length, width, height, fromZip, residential, liftgate]);

  const isVehicle = shippingMethod === "local_only" && suggestion?.boxSize === "freight" && (suggestion?.label?.toLowerCase().includes("vehicle") || suggestion?.label?.toLowerCase().includes("boat"));
  // Recommendation banner config
  const bannerConfig: Record<string, { text: string; bg: string; border: string; color: string } | null> = {
    local_only: {
      text: isVehicle ? "🚗 LOCAL PICKUP ONLY — Vehicles must be picked up in person" : "This item is best suited for local pickup only",
      bg: isVehicle ? "rgba(234,179,8,0.12)" : "rgba(234,179,8,0.08)",
      border: "rgba(234,179,8,0.3)",
      color: "var(--warning-text, #b45309)",
    },
    local_recommended: {
      text: "We recommend local pickup for this item (over 150 lbs)",
      bg: "rgba(234,179,8,0.08)",
      border: "rgba(234,179,8,0.3)",
      color: "var(--warning-text, #b45309)",
    },
    freight: {
      text: "This item requires freight shipping (LTL)",
      bg: "rgba(0,188,212,0.06)",
      border: "rgba(0,188,212,0.25)",
      color: "var(--accent)",
    },
    parcel: null,
  };
  const banner = shippingMethod ? bannerConfig[shippingMethod] : null;

  return (
    <div>
      {/* Shipping method recommendation banner */}
      {banner && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.625rem 1rem",
            borderRadius: "0.5rem",
            background: banner.bg,
            border: `1px solid ${banner.border}`,
            fontSize: "0.85rem",
            fontWeight: 600,
            color: banner.color,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "1rem" }}>
            {shippingMethod === "freight" ? "🚛" : "📍"}
          </span>
          {banner.text}
        </div>
      )}

      {/* ── POST-SALE MODE ── */}
      {mode === "post-sale" ? (
        <div className="mt-4">
          <PostSaleRouter
            itemId={itemId}
            weight={weight}
            length={length}
            width={width}
            height={height}
            isFragile={fragile}
            fromZip={fromZip}
            itemValue={itemValue}
            existingLabel={existingLabel}
            saleMethod={saleMethod}
            needsFreight={needsFreight}
            shippingMethod={shippingMethod}
            saleRadius={saleRadius}
            itemStatus={itemStatus}
          />
        </div>
      ) : (
        <>
          {/* ── Tab Toggle: Ship It / Local Pickup ── */}
          {!isVehicle && (
            <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", padding: "0.2rem", border: "1px solid var(--border-default)" }}>
              <button
                onClick={() => setShippingTab("ship")}
                style={{
                  flex: 1, padding: "0.5rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.82rem", fontWeight: 600,
                  background: shippingTab === "ship" ? "rgba(0,188,212,0.12)" : "transparent",
                  border: shippingTab === "ship" ? "1px solid var(--accent)" : "1px solid transparent",
                  color: shippingTab === "ship" ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                📦 Ship It
              </button>
              <button
                onClick={() => setShippingTab("pickup")}
                style={{
                  flex: 1, padding: "0.5rem 0.75rem", borderRadius: "0.4rem", fontSize: "0.82rem", fontWeight: 600,
                  background: shippingTab === "pickup" ? "rgba(0,188,212,0.12)" : "transparent",
                  border: shippingTab === "pickup" ? "1px solid var(--accent)" : "1px solid transparent",
                  color: shippingTab === "pickup" ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                🤝 Local Pickup
              </button>
            </div>
          )}

          {/* ── Oversized Auto-Suggest Banner ── */}
          {shippingTab === "ship" && needsFreight && mode === "pre-sale" && (
            <div style={{
              marginTop: "0.75rem",
              padding: "0.65rem 0.75rem",
              borderRadius: "0.6rem",
              background: "rgba(234,179,8,0.10)",
              border: "1px solid rgba(234,179,8,0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1rem" }}>🚛</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#eab308" }}>
                  LTL Freight Recommended
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {oversizedReason === "weight" && `This item weighs ${weight} lbs — too heavy for standard parcel carriers (max 70 lbs). LTL freight shipping is required.`}
                {oversizedReason === "dimension" && `This item has a dimension of ${maxDim}" — exceeds parcel carrier limits (max 108"). LTL freight shipping is required.`}
                {oversizedReason === "girth" && `Combined length + girth is ${lengthPlusGirth}" — exceeds parcel limits (max 165"). LTL freight shipping is required.`}
              </div>
              {isArtItem && (
                <div style={{ fontSize: "0.72rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.1rem" }}>
                  🎨 Art/framed items: Consider blanket wrap + &quot;Do Not Stack&quot; handling. Freight carriers offer special art protection.
                </div>
              )}
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                Scroll to &quot;Freight Shipping&quot; section below for carrier estimates and quote requests.
              </div>
            </div>
          )}

          {/* ── Borderline Item Notice ── */}
          {shippingTab === "ship" && isBorderline && !needsFreight && mode === "pre-sale" && (
            <div style={{
              marginTop: "0.75rem",
              padding: "0.55rem 0.75rem",
              borderRadius: "0.6rem",
              background: "rgba(0,188,212,0.06)",
              border: "1px solid rgba(0,188,212,0.18)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <span style={{ fontSize: "0.85rem" }}>⚖️</span>
              <div>
                <div style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>
                  Borderline weight: {weight} lbs
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                  Close to parcel carrier limits (70 lbs). Parcel rates shown, but LTL freight may be cheaper — check freight estimates below.
                </div>
              </div>
            </div>
          )}

          {/* ── Art/Painting Notice (non-oversized) ── */}
          {shippingTab === "ship" && isArtItem && !needsFreight && mode === "pre-sale" && (
            <div style={{
              marginTop: "0.75rem",
              padding: "0.55rem 0.75rem",
              borderRadius: "0.6rem",
              background: "rgba(0,188,212,0.06)",
              border: "1px solid rgba(0,188,212,0.18)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <span style={{ fontSize: "0.85rem" }}>🎨</span>
              <div>
                <div style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>
                  Art / Framed Item Detected
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                  Use corner protectors and a cardboard sandwich. Mark &quot;FRAGILE — ART&quot; on all sides. Consider insurance for valuable pieces.
                </div>
              </div>
            </div>
          )}

          {/* ── PRE-SALE: Section A — Package Details ── */}
          <div className="mt-4 space-y-4">
            {!isVehicle && shippingTab === "ship" && <div>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Package Details
                </span>
                {isFromAI && (
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(0,188,212,0.12)", color: "var(--accent)", padding: "0.15rem 0.5rem", borderRadius: "9999px", border: "1px solid rgba(0,188,212,0.25)" }}>
                    AI Suggested
                  </span>
                )}
              </div>

              {/* Box size quick-select */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {Object.entries(BOX_PRESETS).map(([key, preset]) => {
                  const isSelected = boxSize === key;
                  const isAiPick = key === aiSuggestedKey && !savedShipping.weight;
                  return (
                    <button
                      key={key}
                      onClick={() => handleBoxPreset(key)}
                      style={{
                        padding: "0.5rem 0.65rem",
                        borderRadius: "0.6rem",
                        fontSize: "0.78rem",
                        fontWeight: isSelected ? 600 : 400,
                        background: isSelected ? "rgba(0,188,212,0.12)" : "var(--bg-card)",
                        border: `1px solid ${isAiPick ? "var(--accent)" : isSelected ? "var(--accent)" : "var(--border-default)"}`,
                        color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                        textAlign: "left",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                        <span>{preset.label}</span>
                        {isAiPick && (
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(0,188,212,0.15)", color: "var(--accent)", padding: "0.1rem 0.35rem", borderRadius: "9999px", whiteSpace: "nowrap" }}>
                            AI Suggested
                          </span>
                        )}
                      </div>
                      {key !== "custom" && (
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem", lineHeight: 1.3 }}>
                          {preset.desc}
                        </div>
                      )}
                      {key === "custom" && (
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          {preset.desc}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Auto-custom notice */}
              {aiMapping.autoCustom && boxSize === "custom" && !savedShipping.weight && (
                <div style={{ fontSize: "0.72rem", color: "var(--accent)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>📦</span> Custom size auto-filled from AI analysis ({suggestion?.length}×{suggestion?.width}×{suggestion?.height}")
                </div>
              )}
              {/* Stale rates notice */}
              {ratesStale && (
                <div style={{ fontSize: "0.72rem", color: "#eab308", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>📦</span> Box changed — click <button onClick={() => fetchPreSaleRates(buyerZip || undefined)} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textDecoration: "underline", fontSize: "0.72rem", padding: 0 }}>Update</button> to refresh rates
                </div>
              )}

              {/* Weight + dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="label">Weight (lbs)</label>
                  <input type="number" className="input" value={weight} onChange={(e) => { setWeight(Number(e.target.value)); if (rates.length > 0) setRatesStale(true); }} min={0.1} step={0.5} placeholder={suggestion?.weightEstimate ? `Est: ${suggestion.weightEstimate} lbs` : "Enter weight in lbs"} />
                  {suggestion?.weightEstimate && !savedShipping.weight && (
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>Estimated: {suggestion.weightEstimate} lbs from AI</div>
                  )}
                </div>
                <div>
                  <label className="label">Length (in)</label>
                  <input type="number" className="input" value={length} onChange={(e) => setLength(Number(e.target.value))} min={1} />
                </div>
                <div>
                  <label className="label">Width (in)</label>
                  <input type="number" className="input" value={width} onChange={(e) => setWidth(Number(e.target.value))} min={1} />
                </div>
                <div>
                  <label className="label">Height (in)</label>
                  <input type="number" className="input" value={height} onChange={(e) => setHeight(Number(e.target.value))} min={1} />
                </div>
              </div>

              {/* Fragile + preference */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
                  Fragile item
                </label>

                <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                  {(["BUYER_PAYS", "FREE_SHIPPING", "SPLIT_COST", "LOCAL_ONLY"] as const).map((p) => (
                    <label
                      key={p}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.78rem",
                        color: preference === p ? "var(--text-primary)" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <input type="radio" name="shippref" checked={preference === p} onChange={() => setPreference(p)} style={{ accentColor: "var(--accent)" }} />
                      {p === "BUYER_PAYS" ? "Buyer pays" : p === "FREE_SHIPPING" ? "Free shipping" : p === "SPLIT_COST" ? "Split cost" : "Local only"}
                    </label>
                  ))}
                </div>
                {preference === "SPLIT_COST" && (
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.3rem", padding: "0.35rem 0.6rem", borderRadius: "0.35rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.1)" }}>
                    Buyer and seller each pay 50% of shipping. Seller{"\u2019"}s half is deducted from earnings.
                  </div>
                )}
              </div>

              {/* Packing tips with box recommendation */}
              <div className="mt-3" style={{ fontSize: "0.78rem", color: "var(--text-secondary)", padding: "0.5rem 0.75rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: "0.5rem" }}>
                <span style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Packing Tips</span>
                <ul style={{ paddingLeft: "1rem", marginTop: "0.25rem" }}>
                  {/* Written box recommendation */}
                  {suggestion && (
                    <li style={{ fontWeight: 500 }}>
                      📦 Recommended box: {BOX_PRESETS[aiSuggestedKey]?.label || "Medium (14×12×8)"} based on your {suggestion.label || "item"}
                    </li>
                  )}
                  {/* AI packing notes */}
                  {suggestion?.packagingNotes?.map((n, i) => <li key={i}>{n}</li>)}
                  {/* Material-based tips */}
                  {fragile && <li>Wrap in 2+ layers of bubble wrap — mark FRAGILE on all sides</li>}
                  {weight > 30 && <li>Use double-walled corrugated box for heavy items ({weight} lbs)</li>}
                  {!suggestion?.packagingNotes?.length && !fragile && <li>Fill empty space with packing peanuts or crumpled paper</li>}
                  {/* Freight class tip for large items */}
                  {(weight > 50 || Math.max(length, width, height) > 48) && (() => {
                    const calc = estimateFreightClass(weight, length, width, height, suggestion?.label);
                    return (
                      <>
                        <li>🚛 This item may require freight shipping (LTL). Estimated freight class: {calc.freightClass} based on size and weight.</li>
                        <li style={{ color: "var(--text-muted)" }}>💡 Freight class affects shipping cost — lower class = denser item = cheaper shipping</li>
                      </>
                    );
                  })()}
                  {/* Art-specific packing tips */}
                  {suggestion?.label && /art|paint|canvas|oil on/i.test(suggestion.label) && (
                    <>
                      <li>🎨 Large artwork requires special packaging — use corner protectors and cardboard sandwich layers</li>
                      <li>Label box &quot;FRAGILE - ART&quot; on all sides</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Save button */}
              <div className="mt-3">
                <button className="btn-ghost" onClick={saveShipping} disabled={saving} style={{ padding: "0.4rem 1rem", fontSize: "0.82rem" }}>
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Shipping Details"}
                </button>
              </div>
            </div>}

            {/* ── Large Item Routing Banner ── */}
            {shippingTab === "ship" && !isVehicle && routingLevel && (
              <div style={{
                padding: "0.75rem",
                borderRadius: "0.6rem",
                background: routingLevel === "required" ? "rgba(220,38,38,0.08)" : routingLevel === "strong" ? "rgba(234,179,8,0.10)" : "rgba(0,188,212,0.06)",
                border: `1px solid ${routingLevel === "required" ? "rgba(220,38,38,0.3)" : routingLevel === "strong" ? "rgba(234,179,8,0.35)" : "rgba(0,188,212,0.18)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "1rem" }}>{routingLevel === "required" ? "🚛" : routingLevel === "strong" ? "🚛" : "📦"}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: routingLevel === "required" ? "var(--error-text, #ef4444)" : routingLevel === "strong" ? "#eab308" : "var(--accent)" }}>
                    {routingLevel === "required" && "This item exceeds all standard carrier limits"}
                    {routingLevel === "strong" && (isOverweight ? `Over 70 lbs (${weight} lbs) — USPS cannot ship this` : "This item exceeds standard carrier limits")}
                    {routingLevel === "suggestion" && "This is a large item — consider freight or local pickup"}
                  </span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.65rem", lineHeight: 1.4 }}>
                  {routingLevel === "required" && (isOverweight150 ? `At ${weight} lbs, this exceeds all parcel carrier weight limits (UPS/FedEx max 150 lbs). Freight shipping or local pickup required.` : `Dimension ${maxDim}" exceeds all carrier length limits (108" max). Freight or local pickup required.`)}
                  {routingLevel === "strong" && (isOverweight ? `UPS/FedEx may accept up to 150 lbs but rates will be very high. We recommend freight shipping or local pickup for the best experience.` : "We recommend freight shipping or local pickup for the best experience.")}
                  {routingLevel === "suggestion" && "For large items, freight shipping often saves money and reduces damage risk. Local pickup eliminates shipping entirely."}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button
                    onClick={() => {
                      setShowFreightManual(true);
                      setTimeout(() => document.getElementById("freight-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                    }}
                    style={{
                      padding: "0.6rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer",
                      background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.25)",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent)" }}>🚛 LTL Freight Shipping</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>Professional freight carriers — XPO, Old Dominion, R+L</div>
                  </button>
                  <button
                    onClick={() => setShippingTab("pickup")}
                    style={{
                      padding: "0.6rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer",
                      background: "var(--bg-card)", border: "1px solid var(--border-default)",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>🤝 Local Pickup</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>No shipping costs, no size limits</div>
                  </button>
                </div>
              </div>
            )}

            {/* ── Section B — Carrier Comparison ── */}
            {preference !== "LOCAL_ONLY" && !isVehicle && shippingTab === "ship" && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Carrier Rates
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <input
                      className="input"
                      style={{ width: "5rem", padding: "0.25rem 0.5rem", fontSize: "0.78rem" }}
                      placeholder="Buyer ZIP"
                      value={buyerZip}
                      onChange={(e) => setBuyerZip(e.target.value)}
                      maxLength={5}
                    />
                    <button
                      className="btn-ghost"
                      onClick={() => fetchPreSaleRates(buyerZip || undefined)}
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Saved quote banner */}
                {savedQuoteData && !loadingRates && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.45rem 0.65rem", borderRadius: "0.4rem", marginBottom: "0.5rem",
                    background: savedQuoteData.isFresh ? "rgba(34,197,94,0.04)" : "rgba(245,158,11,0.04)",
                    border: `1px solid ${savedQuoteData.isFresh ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)"}`,
                  }}>
                    <div style={{ fontSize: "0.68rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>📋 Saved: {savedQuoteData.carrier?.carrier || savedQuoteData.carrier?.provider || "?"} {savedQuoteData.carrier?.service || savedQuoteData.carrier?.servicelevel_name || ""}</span>
                      <span style={{ color: "var(--text-muted)" }}> — </span>
                      <span style={{ fontWeight: 700, color: "#4caf50" }}>${parseFloat(savedQuoteData.carrier?.price || savedQuoteData.carrier?.rate || savedQuoteData.carrier?.amount || "0").toFixed(2)}</span>
                      <span style={{
                        fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", marginLeft: "0.3rem",
                        background: savedQuoteData.isFresh ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                        color: savedQuoteData.isFresh ? "#22c55e" : "#f59e0b",
                      }}>
                        {savedQuoteData.isFresh ? "✅ Fresh" : `⚠️ ${savedQuoteData.ageHrs}h ago`}
                      </span>
                    </div>
                  </div>
                )}

                {loadingRates ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Loading rates...</div>
                ) : rates.length > 0 ? (
                  <div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                            <th style={{ textAlign: "left", padding: "0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Carrier</th>
                            <th style={{ textAlign: "left", padding: "0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Service</th>
                            <th style={{ textAlign: "left", padding: "0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Speed</th>
                            <th style={{ textAlign: "right", padding: "0.4rem", color: "var(--text-muted)", fontWeight: 600 }}>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rates.length > 0 && !selectedPreSaleRate && (
                            <tr><td colSpan={4} style={{ padding: "0.25rem 0.4rem", fontSize: "0.58rem", color: "var(--text-muted)" }}>{"\u{1F446}"} Click a carrier to select and save your quote</td></tr>
                          )}
                          {rates.map((r) => {
                            const cheapest = rates.every((o) => parseFloat(o.amount) >= parseFloat(r.amount));
                            const fastest = r.estimated_days != null && rates.every((o) => (o.estimated_days ?? 99) >= (r.estimated_days ?? 99));
                            const isSelected = selectedPreSaleRate?.object_id === r.object_id;
                            return (
                              <tr
                                key={r.object_id}
                                onClick={() => setSelectedPreSaleRate(isSelected ? null : r)}
                                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(0,188,212,0.04)"; }}
                                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                                style={{
                                  borderBottom: "1px solid var(--border-default)",
                                  cursor: "pointer",
                                  background: isSelected ? "rgba(0,188,212,0.08)" : "transparent",
                                  outline: isSelected ? "1.5px solid var(--accent)" : "none",
                                  outlineOffset: "-1px",
                                  borderRadius: isSelected ? "0.25rem" : "0",
                                  transition: "background 0.1s ease",
                                }}
                              >
                                <td style={{ padding: "0.4rem", color: "var(--text-primary)" }}>
                                  {isSelected && <span style={{ color: "var(--accent)", marginRight: "0.25rem" }}>✔</span>}
                                  {r.provider}
                                </td>
                                <td style={{ padding: "0.4rem", color: "var(--text-secondary)" }}>
                                  {r.servicelevel_name}
                                  {cheapest && <span style={{ marginLeft: "0.4rem", fontSize: "0.6rem", background: "var(--success-text)", color: "#fff", padding: "0.1rem 0.35rem", borderRadius: "9999px", fontWeight: 700 }}>Cheapest</span>}
                                  {fastest && <span style={{ marginLeft: "0.4rem", fontSize: "0.6rem", background: "var(--accent)", color: "#fff", padding: "0.1rem 0.35rem", borderRadius: "9999px", fontWeight: 700 }}>Fastest</span>}
                                </td>
                                <td style={{ padding: "0.4rem", color: "var(--text-secondary)" }}>
                                  {r.estimated_days != null ? `${r.estimated_days} day${r.estimated_days !== 1 ? "s" : ""}` : "—"}
                                </td>
                                <td style={{ padding: "0.4rem", textAlign: "right", fontWeight: 600, color: isSelected ? "#4caf50" : "var(--text-primary)" }}>
                                  {isNaN(parseFloat(r.amount)) ? "Quote N/A" : `$${parseFloat(r.amount).toFixed(2)}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Save Quote bar */}
                    {selectedPreSaleRate && (
                      <div style={{ marginTop: "0.5rem" }}>
                        {preSaleQuoteSaved ? (
                          <div style={{ padding: "0.55rem 0.75rem", borderRadius: "0.5rem", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", textAlign: "center" }}>
                            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#22c55e" }}>{"\u2705"} Quote Saved {"\u2014"} {selectedPreSaleRate.provider} {selectedPreSaleRate.servicelevel_name} ${parseFloat(selectedPreSaleRate.amount).toFixed(2)}</div>
                            <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>This quote will carry over to the Shipping Center</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              try {
                                localStorage.setItem(`ll_quote_${itemId}`, JSON.stringify({
                                  carrier: {
                                    carrier: selectedPreSaleRate.provider,
                                    service: selectedPreSaleRate.servicelevel_name,
                                    price: parseFloat(selectedPreSaleRate.amount),
                                    days: String(selectedPreSaleRate.estimated_days || 5),
                                  },
                                  allCarriers: rates.map(r => ({
                                    carrier: r.provider,
                                    service: r.servicelevel_name,
                                    rate: r.amount,
                                    days: r.estimated_days,
                                  })),
                                  savedAt: Date.now(),
                                  toZip: buyerZip || "",
                                  fromZip: fromZip || "04101",
                                }));
                                setSavedQuoteData({
                                  carrier: {
                                    carrier: selectedPreSaleRate.provider,
                                    service: selectedPreSaleRate.servicelevel_name,
                                    price: parseFloat(selectedPreSaleRate.amount),
                                    days: String(selectedPreSaleRate.estimated_days || 5),
                                  },
                                  savedAt: Date.now(),
                                  toZip: buyerZip || "",
                                  isFresh: true,
                                  ageHrs: 0,
                                });
                              } catch { /* ignore */ }
                              setPreSaleQuoteSaved(true);
                              setTimeout(() => setPreSaleQuoteSaved(false), 3000);
                            }}
                            style={{
                              width: "100%", padding: "0.55rem 0.85rem", fontSize: "0.82rem", fontWeight: 700,
                              borderRadius: "0.5rem", border: "none", cursor: "pointer",
                              background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                            }}
                          >
                            <span>{"\u{1F4CB}"}</span>
                            Save Quote {"\u2014"} {selectedPreSaleRate.provider} {selectedPreSaleRate.servicelevel_name} ${parseFloat(selectedPreSaleRate.amount).toFixed(2)}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Section C — Local Pickup ── */}
            {(shippingTab === "pickup" || isVehicle) && (
              <div>
                <LocalPickupPanel
                  itemId={itemId}
                  saleZip={fromZip}
                  saleRadius={saleRadius ?? 25}
                  isVehicle={isVehicle}
                  itemWeight={weight}
                  isFragile={fragile}
                  isAntique={suggestion?.packagingNotes?.some((n: string) => n.toLowerCase().includes("antique"))}
                  itemDimensions={suggestion ? `${suggestion.length}×${suggestion.width}×${suggestion.height} in` : null}
                />
              </div>
            )}

            {/* ── Section D — Freight Shipping ── */}
            {(showFreight || showFreightManual) && !isVehicle && shippingTab === "ship" && (
              <div id="freight-section">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    🚛 Freight Shipping (LTL)
                  </span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(0,188,212,0.12)", color: "var(--accent)", padding: "0.15rem 0.5rem", borderRadius: "9999px", border: "1px solid rgba(0,188,212,0.25)" }}>
                    Large Item
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.65rem" }}>For large, heavy, or oversized items</div>

                {/* Accessorial toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.75rem" }}>
                  {[
                    { checked: liftgate, set: setLiftgate, label: "Liftgate at pickup & delivery", cost: "+$85 each", defaultOn: true },
                    { checked: residential, set: setResidential, label: "Residential pickup & delivery", cost: "+$95 each", defaultOn: true },
                    { checked: notifyBeforeDelivery, set: setNotifyBeforeDelivery, label: "Notify before delivery", cost: "+$35", defaultOn: true },
                    { checked: blanketWrap, set: setBlanketWrap, label: "Blanket wrap protection", cost: "+$75", defaultOn: false },
                    { checked: insideDelivery, set: setInsideDelivery, label: "Inside delivery", cost: "+$150", defaultOn: false },
                    { checked: whiteGlove, set: setWhiteGlove, label: "White glove service (unpack, place, debris removal)", cost: "+$350", defaultOn: false },
                  ].map((toggle) => (
                    <label key={toggle.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--text-secondary)", cursor: "pointer", padding: "0.2rem 0" }}>
                      <input type="checkbox" checked={toggle.checked} onChange={(e) => toggle.set(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
                      <span style={{ flex: 1 }}>{toggle.checked ? "✅" : "☐"} {toggle.label}</span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{toggle.cost}</span>
                    </label>
                  ))}
                </div>

                {/* Freight carrier table */}
                {freightEstimates.length > 0 && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                          <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Carrier</th>
                          <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Service</th>
                          <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Transit</th>
                          <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Base</th>
                          <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Est. Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {freightEstimates.map((fe) => {
                          const extras = (blanketWrap ? 75 : 0) + (insideDelivery ? 150 : 0) + (whiteGlove ? 350 : 0) + (notifyBeforeDelivery ? fe.deliveryNotification : 0);
                          const estTotalLow = fe.totalLow + extras;
                          const estTotalHigh = fe.totalHigh + extras;
                          const isCheapest = freightEstimates.every((o) => o.totalLow >= fe.totalLow);
                          const isFastest = freightEstimates.every((o) => o.transitDays.min >= fe.transitDays.min);
                          return (
                            <tr key={fe.carrier} style={{ borderBottom: "1px solid var(--border-default)" }}>
                              <td style={{ padding: "0.5rem", color: "var(--text-primary)", fontWeight: 500 }}>{fe.carrier}</td>
                              <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>
                                {fe.service}
                                {isCheapest && <span style={{ marginLeft: "0.4rem", fontSize: "0.6rem", background: "var(--success-text)", color: "#fff", padding: "0.1rem 0.35rem", borderRadius: "9999px", fontWeight: 700 }}>Best Value</span>}
                                {isFastest && !isCheapest && <span style={{ marginLeft: "0.4rem", fontSize: "0.6rem", background: "var(--accent)", color: "#fff", padding: "0.1rem 0.35rem", borderRadius: "9999px", fontWeight: 700 }}>Fastest</span>}
                              </td>
                              <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>{fe.transitDays.min}–{fe.transitDays.max} days</td>
                              <td style={{ padding: "0.5rem", textAlign: "right", color: "var(--text-secondary)" }}>${fe.costLow.toFixed(0)}–${fe.costHigh.toFixed(0)}</td>
                              <td style={{ padding: "0.5rem", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>${estTotalLow.toFixed(0)}–${estTotalHigh.toFixed(0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.5rem 0.75rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", borderRadius: "0.5rem" }}>
                  Estimates only — official quote coming. Toggles update in real-time.
                </div>

                {/* LTL Live Quotes + Manual Backup */}
                <div style={{ marginTop: "0.75rem" }}>
                  {/* Primary: Get Live LTL Quotes */}
                  {!liveLtlQuotes && (
                    <button
                      onClick={fetchLiveLtlQuotes}
                      disabled={ltlQuoteLoading}
                      style={{
                        padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 700, borderRadius: "0.5rem",
                        border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                        cursor: ltlQuoteLoading ? "wait" : "pointer", opacity: ltlQuoteLoading ? 0.6 : 1,
                      }}
                    >
                      {ltlQuoteLoading ? "Getting Quotes..." : "\u{1F4E1} Get Live LTL Quotes"}
                    </button>
                  )}

                  {/* Live LTL Quote Results */}
                  {liveLtlQuotes && liveLtlQuotes.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {liveLtlQuotes.length} Carrier Quote{liveLtlQuotes.length !== 1 ? "s" : ""}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          {ltlQuoteSource === "live" && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "#00bcd4" }}>LIVE RATES</span>}
                          {ltlQuoteSource === "demo" && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(255,152,0,0.12)", color: "#ff9800" }}>ESTIMATED</span>}
                          <button
                            onClick={fetchLiveLtlQuotes}
                            disabled={ltlQuoteLoading}
                            style={{ fontSize: "0.55rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            {ltlQuoteLoading ? "..." : "\u{1F504}"}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {liveLtlQuotes.map((q: any, i: number) => {
                          const isBest = i === 0;
                          const isFastest = liveLtlQuotes.every((o: any) => (o.transit_days || 99) >= (q.transit_days || 99));
                          const isSelected = selectedLtlCarrier?.quote_id === q.quote_id;
                          const isFedEx = q.source === "fedex";
                          const isShipEngine = q.source === "shipengine";
                          return (
                            <button
                              key={q.quote_id || `ltl-${i}`}
                              onClick={() => setSelectedLtlCarrier(isSelected ? null : q)}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0.6rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer", textAlign: "left",
                                border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                                background: isSelected ? "rgba(0,188,212,0.06)" : "var(--bg-card)",
                              }}
                            >
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                                  <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-primary)" }}>{q.carrier}</span>
                                  {isBest && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(76,175,80,0.15)", color: "#4caf50" }}>BEST RATE</span>}
                                  {isFastest && !isBest && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>FASTEST</span>}
                                  {isFedEx && q.isLive && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(77,20,140,0.15)", color: "#4D148C" }}>FEDEX LIVE</span>}
                                  {isShipEngine && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "#00bcd4" }}>SHIPENGINE</span>}
                                  {!q.isLive && !isFedEx && !isShipEngine && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(255,152,0,0.12)", color: "#ff9800" }}>ESTIMATED</span>}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                                  {q.service} {"\u00B7"} {q.transit_days} day{q.transit_days !== 1 ? "s" : ""}
                                </div>
                              </div>
                              <span style={{ fontSize: "1rem", fontWeight: 700, color: isSelected ? "#4caf50" : "var(--accent)" }}>
                                ${(q.total_amount || 0).toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Secondary: Manual quote request */}
                  {!ltlQuoteSubmitted ? (
                    <div style={{ marginTop: "0.5rem" }}>
                      {!showLtlQuoteForm ? (
                        <button onClick={() => setShowLtlQuoteForm(true)} style={{ background: "none", border: "none", padding: 0, fontSize: "0.72rem", color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline" }}>
                          Need a custom quote? Request Manual Quote {"\u2192"}
                        </button>
                      ) : (
                        <LtlQuoteForm
                          itemId={itemId}
                          fromZip={fromZip}
                          weight={weight}
                          length={length}
                          width={width}
                          height={height}
                          suggestion={suggestion}
                          itemValue={itemValue}
                          accessorials={{ residential, liftgate, notifyBeforeDelivery, blanketWrap, insideDelivery, whiteGlove }}
                          ltlSubmitting={ltlSubmitting}
                          category={suggestion?.label}
                          onSubmit={async (formData) => {
                            setLtlSubmitting(true);
                            try {
                              await fetch("/api/shipping/ltl-quote-request", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(formData),
                              });
                            } catch { /* non-critical */ }
                            setLtlQuoteSubmitted(true);
                            setLtlSubmitting(false);
                          }}
                          onCancel={() => setShowLtlQuoteForm(false)}
                        />
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: "0.5rem", padding: "0.6rem 0.75rem", borderRadius: "0.5rem", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", fontSize: "0.82rem", color: "var(--success-text)" }}>
                      {"\u2705"} Quote request sent to our freight team! We&apos;ll have your official quote within 24 hours.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show freight link for non-freight items */}
            {!showFreight && !showFreightManual && !isVehicle && shippingTab === "ship" && (
              <button
                onClick={() => setShowFreightManual(true)}
                style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", padding: "0.2rem 0" }}
              >
                Need freight shipping for a large item?
              </button>
            )}

            {/* ── Section E — Metro Estimates ── */}
            {preference !== "LOCAL_ONLY" && shippingTab === "ship" && metroEstimates.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Estimated Shipping to Major Cities
                  </div>
                  {!liveMetro && (
                    <button
                      onClick={fetchLiveMetro}
                      disabled={metroLoading}
                      style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: metroLoading ? "wait" : "pointer", padding: 0 }}
                    >
                      {metroLoading ? "Loading..." : "\u{1F4E1} Get Live Rates"}
                    </button>
                  )}
                  {liveMetro && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "#00bcd4" }}>SHIPPO RATES</span>
                      <button
                        onClick={fetchLiveMetro}
                        disabled={metroLoading}
                        style={{ fontSize: "0.55rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        {metroLoading ? "..." : "\u{1F504}"}
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
                  {(liveMetro || metroEstimates).map((m: any) => (
                    <div
                      key={m.city}
                      style={{
                        flex: "1 0 0",
                        minWidth: "5.5rem",
                        padding: "0.6rem 0.5rem",
                        borderRadius: "0.5rem",
                        border: m.isCheapest ? "1px solid rgba(76,175,80,0.2)" : m.isFastest ? "1px solid rgba(59,130,246,0.2)" : "1px solid var(--border-default)",
                        background: "var(--bg-card)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{m.city.split(",")[0]}</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: m.isCheapest ? "#4caf50" : "var(--accent)" }}>
                        ${m.estimatedCost.toFixed(2)}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                        {m.estimatedDays}d
                      </div>
                      {m.carrier && <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{m.carrier}</div>}
                      {m.isCheapest && <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "#4caf50", marginTop: "0.1rem" }}>CHEAPEST</div>}
                      {m.isFastest && !m.isCheapest && <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "#3b82f6", marginTop: "0.1rem" }}>FASTEST</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SALE CLOSED SCREEN ──────────────────────────────────────────────────────
// Unified post-sale completion screen used by pickup and LTL flows.
// Shows animated checkmark, transaction summary, funds status, rating prompt.

type SummaryRow = { label: string; value: string; highlight?: boolean };

function SaleClosedScreen({
  itemId,
  completionType,
  price,
  closedAt,
  fundsAvailable,
  summaryRows,
  extraContent,
}: {
  itemId: string;
  completionType: string;
  price: number | null;
  closedAt: string;
  fundsAvailable: boolean;
  summaryRows: SummaryRow[];
  extraContent?: React.ReactNode;
}) {
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitRating = async () => {
    if (rating < 1 || ratingSubmitted) return;
    setSubmitting(true);
    try {
      await fetch("/api/ratings/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, rating, comment: ratingComment || undefined }),
      });
      setRatingSubmitted(true);
    } catch { /* silent */ }
    setSubmitting(false);
  };

  return (
    <div style={{
      background: "var(--bg-card)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(16,185,129,0.2)",
      borderRadius: "18px",
      padding: "2.5rem 2rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1.25rem",
      animation: "sc-fadeIn 0.4s ease",
    }}>
      {/* Animated checkmark */}
      <div style={{
        width: "3.5rem",
        height: "3.5rem",
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,188,212,0.1))",
        border: "2px solid rgba(16,185,129,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "sc-scaleIn 0.3s ease",
      }}>
        <span style={{ fontSize: "1.8rem" }}>✓</span>
      </div>

      {/* Headline */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Sale Complete
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Your transaction is closed and funds are available.
        </div>
      </div>

      {/* Transaction summary */}
      <div style={{
        width: "100%",
        maxWidth: "22rem",
        padding: "1rem",
        borderRadius: "12px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
      }}>
        <div style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "0.6rem",
        }}>
          Transaction Summary
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {summaryRows.map((row, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.78rem",
            }}>
              <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span style={{
                fontWeight: row.highlight ? 700 : 500,
                color: row.highlight ? "#10b981" : "var(--text-primary)",
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Funds status card */}
      <div style={{
        width: "100%",
        maxWidth: "22rem",
        padding: "0.85rem 1rem",
        borderRadius: "12px",
        background: fundsAvailable ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
        border: `1px solid ${fundsAvailable ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
        backdropFilter: "blur(10px)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.3rem",
        }}>
          <span style={{ fontSize: "1rem" }}>{fundsAvailable ? "💰" : "⏳"}</span>
          <span style={{
            fontWeight: 700,
            fontSize: "0.88rem",
            color: fundsAvailable ? "#10b981" : "#f59e0b",
          }}>
            {fundsAvailable ? "Funds Available" : "Funds Pending"}
          </span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {fundsAvailable
            ? "Your earnings are available for payout in your dashboard."
            : "Your earnings will be released once the hold period expires."}
        </div>
        {fundsAvailable && (
          <a
            href="/payments"
            style={{
              display: "inline-block",
              marginTop: "0.5rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            Go to Payouts →
          </a>
        )}
      </div>

      {/* Extra content (e.g., BOL link) */}
      {extraContent}

      {/* Action buttons */}
      <div style={{
        display: "flex",
        gap: "0.6rem",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        <a
          href="/items/new"
          style={{
            padding: "0.55rem 1.4rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #00bcd4, #009688)",
            color: "#fff",
            textDecoration: "none",
            display: "inline-block",
            boxShadow: "0 4px 12px rgba(0,188,212,0.2)",
          }}
        >
          List Another Item
        </a>
        <a
          href="/dashboard"
          style={{
            padding: "0.55rem 1.4rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            borderRadius: "10px",
            background: "transparent",
            border: "1px solid rgba(0,188,212,0.3)",
            color: "var(--accent)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Back to Dashboard
        </a>
        <a
          href="/payments"
          style={{
            padding: "0.55rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 500,
            color: "var(--text-muted)",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          View Transaction History
        </a>
      </div>

      {/* Divider */}
      <div style={{
        width: "100%",
        maxWidth: "22rem",
        height: "1px",
        background: "var(--ghost-bg)",
      }} />

      {/* Rating section */}
      {!ratingSubmitted ? (
        <div style={{ width: "100%", maxWidth: "22rem", textAlign: "center" }}>
          <div style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}>
            How was your selling experience?
          </div>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.3rem",
            marginBottom: "0.5rem",
          }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  fontSize: "1.6rem",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                  color: star <= rating ? "var(--accent)" : "var(--text-muted)",
                  transition: "color 0.15s ease, transform 0.15s ease",
                  transform: star <= rating ? "scale(1.1)" : "scale(1)",
                }}
              >
                ★
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Tell us what went well or how we can improve (optional)"
                rows={2}
                style={{
                  resize: "vertical",
                  width: "100%",
                  maxWidth: "20rem",
                  fontSize: "0.78rem",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-default)",
                  background: "var(--ghost-bg)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
              <button
                onClick={submitRating}
                disabled={submitting}
                style={{
                  padding: "0.4rem 1.2rem",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "1px solid rgba(0,188,212,0.3)",
                  background: "transparent",
                  color: "var(--accent)",
                  cursor: submitting ? "default" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#10b981",
          animation: "sc-fadeIn 0.3s ease",
        }}>
          Thank you for your feedback!
        </div>
      )}

      <style>{`
        @keyframes sc-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sc-scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
