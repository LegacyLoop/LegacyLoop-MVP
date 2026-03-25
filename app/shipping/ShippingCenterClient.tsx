"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { runStandardAnalysis } from "@/lib/agents/runner";
import type { AgentResult } from "@/lib/agents/runner";
import { searchCities } from "@/lib/shipping/city-lookup";
import type { CityEntry } from "@/lib/shipping/city-lookup";
import { getFreightEstimates } from "@/lib/shipping/freight-estimates";
import type { FreightEstimate } from "@/lib/shipping/freight-estimates";
import { saveQuote, getAllSavedQuotes, deleteQuote, isQuoteSaved } from "@/lib/shipping/saved-quotes";

type Tab = "preSale" | "readyToShip" | "shipped" | "freight" | "pickup";

type ShipData = {
  preSale: any[];
  readyToShip: any[];
  shipped: any[];
};

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "preSale", label: "Estimates", icon: "\u{1F4CA}" },
  { key: "readyToShip", label: "Ready to Ship", icon: "\u{1F4E6}" },
  { key: "shipped", label: "Tracking", icon: "\u{1F69A}" },
  { key: "freight", label: "Freight / LTL", icon: "\u{1F69B}" },
  { key: "pickup", label: "Local Pickup", icon: "\u{1F91D}" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dimStr(item: any): string {
  if (item.length && item.width && item.height) return `${item.length}\u00D7${item.width}\u00D7${item.height} in`;
  if (item.aiShipping) {
    const a = item.aiShipping;
    if (a.length && a.width && a.height) return `${a.length}\u00D7${a.width}\u00D7${a.height} in`;
    if (typeof a === "string") return a;
  }
  return "";
}
function weightStr(item: any): string {
  if (item.weight) return `${item.weight} lbs`;
  if (item.aiShipping?.weight) return `~${item.aiShipping.weight} lbs`;
  return "";
}
function hasDims(item: any): boolean {
  return !!(item.weight || item.length || item.aiShipping);
}

// ─── Shared Rate Fetcher (Shippo first, estimate fallback) ──────────────────

async function fetchLiveRates(
  itemId: string,
  fromZip: string,
  toZip: string,
  weight: number,
  length: number,
  width: number,
  height: number,
): Promise<{ carriers: any[]; isLive: boolean; weight: number }> {
  // Try Shippo live rates first
  try {
    const res = await fetch("/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromZip,
        toZip,
        weight: String(weight),
        length: String(length),
        width: String(width),
        height: String(height),
      }),
    });
    const data = await res.json();
    if (data.rates && data.rates.length > 0) {
      const carriers = data.rates
        .map((r: any) => ({
          carrier: r.provider || r.carrier,
          service: r.servicelevel_name || r.service,
          price: parseFloat(r.amount || r.rate) || 0,
          days: String(r.estimated_days || r.estimatedDays || 5),
        }))
        .filter((c: any) => c.price > 0)
        .sort((a: any, b: any) => a.price - b.price);
      if (carriers.length > 0) {
        return { carriers, isLive: !data.isDemo && !data.isMock, weight };
      }
    }
  } catch { /* fall through */ }

  // Fallback to estimate API
  try {
    const res = await fetch("/api/shipping/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, destZip: toZip }),
    });
    const data = await res.json();
    if (!data.error) {
      return {
        carriers: (data.carriers || []).map((c: any) => ({
          ...c,
          days: c.days || "5",
        })),
        isLive: false,
        weight,
      };
    }
  } catch { /* ignore */ }

  return { carriers: [], isLive: false, weight };
}

// ─── Box Presets + Constants ─────────────────────────────────────────────────

const BOX_PRESETS: Record<string, { l: number; w: number; h: number; label: string; desc: string }> = {
  tiny:      { l: 6,  w: 4,  h: 3,  label: "Tiny (6\u00D74\u00D73)",      desc: "Jewelry, small accessories" },
  small:     { l: 10, w: 8,  h: 4,  label: "Small (10\u00D78\u00D74)",     desc: "Pedals, small electronics, books" },
  medium:    { l: 14, w: 12, h: 8,  label: "Medium (14\u00D712\u00D78)",   desc: "Appliances, boots, kitchenware" },
  large:     { l: 18, w: 14, h: 12, label: "Large (18\u00D714\u00D712)",   desc: "Electronics, tools, multiple items" },
  xl:        { l: 24, w: 18, h: 16, label: "XL (24\u00D718\u00D716)",      desc: "Small furniture, monitors" },
  oversized: { l: 36, w: 24, h: 24, label: "Oversized (36\u00D724\u00D724)", desc: "Large decor, equipment, chairs" },
  furniture: { l: 48, w: 30, h: 30, label: "Furniture (48\u00D730\u00D730)", desc: "Furniture, large frames, shelving" },
  custom:    { l: 0,  w: 0,  h: 0,  label: "Custom",                       desc: "Any size \u2014 enter your dimensions" },
};

const PACKAGING_TYPES = [
  { value: "box", label: "Box", icon: "\u{1F4E6}" },
  { value: "envelope", label: "Envelope", icon: "\u2709\uFE0F" },
  { value: "tube", label: "Tube", icon: "\u{1F9FB}" },
  { value: "crate", label: "Crate", icon: "\u{1FAB5}" },
  { value: "pallet", label: "Pallet", icon: "\u{1F3D7}\uFE0F" },
];

const CATEGORY_DEFAULTS: Record<string, { l: number; w: number; h: number; weight: number; packaging: string; fragile: boolean }> = {
  furniture: { l: 48, w: 24, h: 30, weight: 45, packaging: "crate", fragile: false },
  electronics: { l: 18, w: 14, h: 10, weight: 5, packaging: "box", fragile: true },
  jewelry: { l: 8, w: 6, h: 3, weight: 0.5, packaging: "box", fragile: true },
  clothing: { l: 14, w: 10, h: 4, weight: 1.5, packaging: "envelope", fragile: false },
  art: { l: 36, w: 4, h: 28, weight: 8, packaging: "tube", fragile: true },
  antiques: { l: 24, w: 18, h: 12, weight: 12, packaging: "box", fragile: true },
  toys: { l: 16, w: 12, h: 8, weight: 2, packaging: "box", fragile: false },
  books: { l: 12, w: 9, h: 6, weight: 4, packaging: "box", fragile: false },
  collectibles: { l: 12, w: 10, h: 8, weight: 2, packaging: "box", fragile: true },
  kitchenware: { l: 18, w: 14, h: 10, weight: 6, packaging: "box", fragile: true },
  tools: { l: 20, w: 14, h: 10, weight: 12, packaging: "box", fragile: false },
  instruments: { l: 48, w: 18, h: 8, weight: 15, packaging: "crate", fragile: true },
  appliances: { l: 30, w: 22, h: 18, weight: 25, packaging: "box", fragile: false },
};

function getCategoryDefaults(category: string) {
  const key = Object.keys(CATEGORY_DEFAULTS).find((k) => category.toLowerCase().includes(k));
  return key ? CATEGORY_DEFAULTS[key] : { l: 18, w: 14, h: 8, weight: 5, packaging: "box", fragile: false };
}

// ─── City Search Component ──────────────────────────────────────────────────

function CitySearch({ value, onChange, placeholder }: { value: string; onChange: (zip: string) => void; placeholder?: string }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CityEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (query.length >= 2 && !/^\d{5}$/.test(query)) {
      setResults(searchCities(query).slice(0, 6));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
    if (/^\d{5}$/.test(query)) {
      onChange(query);
      setOpen(false);
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: "relative" }}>
      <input
        value={label || query}
        onChange={e => { setQuery(e.target.value); setLabel(""); }}
        onFocus={() => { if (results.length) setOpen(true); }}
        placeholder={placeholder || "City or ZIP..."}
        style={{ width: "100%", padding: "0.4rem 0.6rem", fontSize: "0.78rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "var(--input-bg, var(--ghost-bg))", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
      />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border-default)", borderRadius: "0.4rem", marginTop: 2, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", maxHeight: 200, overflowY: "auto" }}>
          {results.map(c => (
            <button key={c.zip} onClick={() => { onChange(c.zip); setLabel(`${c.label} \u2014 ${c.zip}`); setQuery(c.zip); setOpen(false); }} style={{ display: "block", width: "100%", padding: "0.45rem 0.6rem", fontSize: "0.75rem", color: "var(--text-primary)", background: "transparent", border: "none", textAlign: "left", cursor: "pointer" }}>
              {c.label} {"\u2014"} {c.zip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shipping AI Panel ──────────────────────────────────────────────────────

function ShippingAIPanel({ item }: { item: any }) {
  const aiInsight = useMemo<AgentResult | null>(() => {
    if (!item.category && !item.title) return null;
    try {
      return runStandardAnalysis(item.id, "shipping", {
        name: item.title || "Item",
        category: item.category || "General",
        priceMid: item.valuationMid || item.soldPrice || 50,
      });
    } catch { return null; }
  }, [item.id, item.title, item.category, item.valuationMid, item.soldPrice]);

  const [expanded, setExpanded] = useState(false);
  if (!aiInsight?.data) return null;

  const tips = aiInsight.data.packagingTips ?? [];
  const notes = aiInsight.data.shippingNotes ?? [];
  const conf = Math.round(aiInsight.confidence * 100);

  return (
    <div style={{ marginTop: "0.5rem", borderLeft: "3px solid #00bcd4", borderRadius: "0 0.5rem 0.5rem 0", background: "rgba(0,188,212,0.03)", border: "1px solid rgba(0,188,212,0.12)", padding: "0.6rem 0.75rem" }}>
      <button onClick={() => setExpanded(!expanded)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.85rem" }}>{"\u{1F916}"}</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)" }}>AI Shipping Advisor</span>
          <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "1px 5px", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "#00bcd4" }}>{conf}%</span>
        </div>
        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{aiInsight.keyInsight}</div>
      {expanded && (
        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {/* Confidence bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--ghost-bg)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${conf}%`, borderRadius: 2, background: "linear-gradient(90deg, #00bcd4, #009688)" }} />
            </div>
            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{conf}% confident</span>
          </div>
          {notes.length > 0 && (
            <div>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Shipping Strategy</div>
              {notes.map((n, i) => <div key={i} style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{"\u2022"} {n}</div>)}
            </div>
          )}
          {tips.length > 0 && (
            <div>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Packaging Intelligence</div>
              {tips.map((t, i) => <div key={i} style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{"\u2022"} {t}</div>)}
            </div>
          )}
          {/* Enrichment-based shipping intelligence */}
          {(item.isAntique || item.isHighValue || item.isPremium || (item.conditionScore != null && item.conditionScore <= 4)) && (
            <div>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#ff9800", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>Smart Recommendations</div>
              {item.isAntique && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{"\u2022"} {"\u{1F3DB}\uFE0F"} Antique item {"\u2014"} double-box with acid-free tissue, avoid ground services</div>}
              {item.isPremium && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{"\u2022"} {"\u2B50"} Premium item ($2K+) {"\u2014"} consider white glove shipping, require signature</div>}
              {item.isHighValue && !item.isPremium && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{"\u2022"} {"\u{1F4B0}"} High-value item {"\u2014"} add insurance, request signature confirmation</div>}
              {item.conditionScore != null && item.conditionScore <= 4 && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{"\u2022"} {"\u26A0\uFE0F"} Fragile condition (score: {item.conditionScore}/10) {"\u2014"} extra padding, handle with care labels</div>}
              {item.conditionScore != null && item.conditionScore >= 8 && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{"\u2022"} {"\u2728"} Mint condition {"\u2014"} package to preserve, avoid compression</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── A) Tracking Number Generator ───────────────────────────────────────────

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function generateTrackingNumber(itemId: string, carrier: string): string {
  const h = simpleHash(itemId + carrier);
  const pad = (n: number, len: number) => String(n).padStart(len, "0");

  const c = carrier.toUpperCase();
  if (c.includes("USPS")) {
    // USPS: 9400 + 18 digits
    const d1 = pad(h % 1000000000, 9);
    const d2 = pad(simpleHash(itemId + "usps2") % 1000000000, 9);
    return "9400" + d1 + d2;
  }
  if (c.includes("UPS")) {
    // UPS: 1Z + 6 alphanumeric + 10 digits
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let alpha = "";
    for (let i = 0; i < 6; i++) {
      alpha += chars[(h + i * 7) % chars.length];
    }
    const digits = pad(simpleHash(itemId + "ups2") % 10000000000, 10);
    return "1Z" + alpha + digits;
  }
  // FedEx: 12 digits
  const d1 = pad(h % 1000000, 6);
  const d2 = pad(simpleHash(itemId + "fedex2") % 1000000, 6);
  return d1 + d2;
}

// ─── B) CSS Barcode ─────────────────────────────────────────────────────────

function CSSBarcode({ code }: { code: string }) {
  const bars: { width: number; filled: boolean }[] = [];
  for (let i = 0; i < 30; i++) {
    const charIdx = i % code.length;
    const charCode = code.charCodeAt(charIdx);
    const w = (charCode % 3) + 1; // 1-3px
    bars.push({ width: w, filled: i % 2 === 0 });
  }
  return (
    <div style={{ overflow: "hidden", height: 45, display: "flex", alignItems: "flex-end", gap: 0, padding: "0 2px" }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            display: "inline-block",
            background: b.filled ? "#000" : "#fff",
            width: b.width,
            height: 40,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ─── C) Shipping Label Component ────────────────────────────────────────────

const CARRIER_COLORS: Record<string, string> = {
  USPS: "#333366",
  UPS: "#351c15",
  FedEx: "#4d148c",
};

function ShippingLabel({
  item,
  carrier,
  service,
  rate,
  trackingNumber,
  fromZip,
  toZip,
  weight,
  onPrint,
}: {
  item: any;
  carrier: string;
  service: string;
  rate: number | string;
  trackingNumber: string;
  fromZip: string;
  toZip: string;
  weight: number | string;
  onPrint?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const carrierColor = CARRIER_COLORS[carrier.toUpperCase()] ?? CARRIER_COLORS[carrier.split(" ")[0]?.toUpperCase()] ?? "#1a1a1a";
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  function copyTrack() {
    navigator.clipboard.writeText(trackingNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        background: "#fff",
        color: "#000",
        borderRadius: 12,
        padding: 0,
        border: "2px solid #333",
        maxWidth: 440,
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
      }}
    >
      {/* Title bar + DEMO badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.75rem", background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: "#555" }}>LEGACYLOOP SHIPPING LABEL</span>
        <span style={{ fontSize: "0.5rem", fontWeight: 800, padding: "1px 6px", borderRadius: "3px", background: "#fff3cd", color: "#856404", border: "1px solid #ffc107" }}>DEMO</span>
      </div>

      {/* Carrier header */}
      <div
        style={{
          background: carrierColor,
          color: "#fff",
          padding: "0.6rem 0.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "0.08em" }}>
          {carrier.toUpperCase()}
        </span>
        <span style={{ fontSize: "0.78rem", opacity: 0.9, fontWeight: 600 }}>{service}</span>
      </div>

      <div style={{ padding: "1rem 1.25rem" }}>
        {/* From / To */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px dashed #ccc" }}>
          <div>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#888", marginBottom: "0.2rem" }}>
              FROM
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.5 }}>
              LegacyLoop Seller<br />
              Portland, ME {fromZip}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#888", marginBottom: "0.2rem" }}>
              TO
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.5 }}>
              Buyer<br />
              {toZip}
            </div>
          </div>
        </div>

      {/* Shipment details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem", padding: "0.5rem 0", borderBottom: "1px dashed #ccc" }}>
        <div><span style={{ fontSize: "0.55rem", color: "#888", textTransform: "uppercase" }}>Weight</span><div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{weight} lbs</div></div>
        <div><span style={{ fontSize: "0.55rem", color: "#888", textTransform: "uppercase" }}>Ship Date</span><div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{today}</div></div>
        <div><span style={{ fontSize: "0.55rem", color: "#888", textTransform: "uppercase" }}>Rate</span><div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2e7d32" }}>${typeof rate === "number" ? rate.toFixed(2) : rate}</div></div>
      </div>

      {/* Tracking + Barcode */}
      <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#888", marginBottom: "0.3rem" }}>TRACKING NUMBER</div>
        <div style={{ fontSize: "1.1rem", fontFamily: "monospace", fontWeight: 800, letterSpacing: "0.1em", color: "#00838f", marginBottom: "0.4rem" }}>
          {trackingNumber}
        </div>
        <CSSBarcode code={trackingNumber} />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <button
          onClick={onPrint || (() => window.print())}
          style={{
            padding: "0.45rem 1rem",
            fontSize: "0.78rem",
            fontWeight: 700,
            borderRadius: 6,
            border: "none",
            background: "linear-gradient(135deg, #00bcd4, #009688)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {"\u{1F5A8}\uFE0F"} Print Label
        </button>
        <button
          onClick={copyTrack}
          style={{
            padding: "0.45rem 0.85rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: 6,
            border: "1px solid #ccc",
            background: copied ? "#e8f5e9" : "#f5f5f5",
            color: copied ? "#2e7d32" : "#333",
            cursor: "pointer",
          }}
        >
          {copied ? "\u2713 Copied" : "\u{1F4CB} Copy Tracking"}
        </button>
      </div>
      </div>
    </div>
  );
}

// ─── D) TMS Dashboard ───────────────────────────────────────────────────────

function TMSDashboard({ data, onTabSwitch }: { data: ShipData; onTabSwitch?: (tab: string) => void }) {
  const delivered = data.shipped.filter((s) => s.deliveryStatus === "DELIVERED").length;
  const inTransit = data.shipped.filter((s) => s.deliveryStatus !== "DELIVERED").length;
  const totalShipCost = data.shipped.reduce((s, i) => s + (i.rate || 0), 0);
  const avgCost = data.shipped.length > 0 ? totalShipCost / data.shipped.length : 0;
  const oldestUnsent = data.readyToShip.reduce((oldest, i) => {
    if (!i.soldAt) return oldest;
    const days = Math.floor((Date.now() - new Date(i.soldAt).getTime()) / 86400000);
    return days > oldest ? days : oldest;
  }, 0);
  const pickupCount = [...data.preSale, ...data.readyToShip].filter(
    (i) => i.saleMethod === "LOCAL_PICKUP" || i.saleMethod === "BOTH" || (i.aiBox === "freight" && (i.category || "").toLowerCase().match(/vehicle|boat|car|truck|motorcycle/))
  ).length;
  const [hoveredPipeline, setHoveredPipeline] = useState<string | null>(null);
  const [hoveredFinancial, setHoveredFinancial] = useState<string | null>(null);

  const pipeline = [
    { label: "Needs Quote", value: data.preSale.length, color: "#ff9800", icon: "\u{1F4CA}", tab: "preSale" },
    { label: "Ready to Ship", value: data.readyToShip.length, color: data.readyToShip.length > 0 ? "#00bcd4" : "var(--text-muted)", icon: "\u{1F4E6}", tab: "readyToShip" },
    { label: "In Transit", value: inTransit, color: "#3b82f6", icon: "\u{1F69A}", tab: "shipped" },
    { label: "Delivered", value: delivered, color: "#4caf50", icon: "\u2705", tab: "shipped" },
    { label: "Pickups", value: pickupCount, color: pickupCount > 0 ? "#a855f7" : "var(--text-muted)", icon: "\u{1F91D}", tab: "pickup" },
  ];
  const financials = [
    { label: "Total Ship Cost", value: `$${Math.round(totalShipCost)}`, color: "var(--text-primary)", icon: "\u{1F4B0}", tab: null },
    { label: "Avg Cost/Item", value: avgCost > 0 ? `$${avgCost.toFixed(2)}` : "\u2014", color: "var(--text-secondary)", icon: "\u{1F4CA}", tab: null },
    { label: "Awaiting Ship", value: data.readyToShip.length, color: data.readyToShip.length > 0 ? "#ff9800" : "var(--text-muted)", icon: "\u{1F4E6}", tab: "readyToShip" },
    { label: "Oldest Unsent", value: oldestUnsent > 0 ? `${oldestUnsent}d` : "\u2014", color: oldestUnsent > 5 ? "#ef4444" : oldestUnsent > 2 ? "#ff9800" : "var(--text-muted)", icon: "\u23F3", tab: null },
  ];

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginBottom: "0" }}>
        {pipeline.map((s) => {
          const isHov = hoveredPipeline === s.label;
          return (
            <div
              key={s.label}
              onClick={() => onTabSwitch?.(s.tab)}
              onMouseEnter={() => setHoveredPipeline(s.label)}
              onMouseLeave={() => setHoveredPipeline(null)}
              style={{
                background: isHov ? "rgba(0,188,212,0.06)" : "rgba(0,188,212,0.02)",
                border: isHov ? "1px solid rgba(0,188,212,0.3)" : "1px solid var(--border-default)",
                borderRadius: "0.75rem",
                padding: "0.85rem 0.5rem",
                textAlign: "center",
                transition: "all 0.15s ease",
                transform: isHov ? "scale(1.03)" : "scale(1)",
                boxShadow: isHov ? "0 4px 16px rgba(0,188,212,0.12)" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "1.1rem", marginBottom: "0.2rem" }}>{s.icon}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
      {/* Divider */}
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--border-default), transparent)", margin: "0.6rem 0" }} />
      {/* Financials */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
        {financials.map((s) => {
          const isHov = hoveredFinancial === s.label;
          const isClickable = !!s.tab;
          return (
            <div
              key={s.label}
              onClick={() => { if (s.tab) onTabSwitch?.(s.tab); }}
              onMouseEnter={() => setHoveredFinancial(s.label)}
              onMouseLeave={() => setHoveredFinancial(null)}
              style={{
                background: "var(--ghost-bg)",
                border: isHov && isClickable ? "1px solid rgba(0,188,212,0.2)" : "1px solid var(--border-default)",
                borderRadius: "0.5rem",
                padding: "0.55rem",
                textAlign: "center",
                transition: "all 0.15s ease",
                transform: isHov ? "scale(1.02)" : "scale(1)",
                boxShadow: isHov ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                cursor: isClickable ? "pointer" : "default",
              }}
            >
              <div style={{ fontSize: "0.8rem", marginBottom: "0.1rem", opacity: 0.7 }}>{s.icon}</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.52rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    CREATED: { bg: "rgba(0,188,212,0.15)", color: "#00bcd4" },
    PICKED_UP: { bg: "rgba(0,188,212,0.15)", color: "#00bcd4" },
    IN_TRANSIT: { bg: "rgba(0,188,212,0.2)", color: "#00bcd4" },
    OUT_FOR_DELIVERY: { bg: "rgba(255,152,0,0.15)", color: "#ff9800" },
    DELIVERED: { bg: "rgba(76,175,80,0.15)", color: "#4caf50" },
    EXCEPTION: { bg: "rgba(255,152,0,0.2)", color: "#ff9800" },
  };
  const c = colors[status] || colors.CREATED;
  return (
    <span
      style={{
        padding: "0.15rem 0.55rem",
        borderRadius: "9999px",
        fontSize: "0.65rem",
        fontWeight: 700,
        background: c.bg,
        color: c.color,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── E) Ship Profile ─────────────────────────────────────────────────────────

function ShipProfile({ item }: { item: any }) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const d = dimStr(item);
  const w = weightStr(item);
  const tips: string[] = item.aiPackingTips ?? [];

  // Saved quote status from localStorage
  const [savedQuoteStatus, setSavedQuoteStatus] = useState<"fresh" | "expiring" | "expired" | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ll_quote_${item.id}`);
      if (raw) {
        const q = JSON.parse(raw);
        const ageMs = Date.now() - (q.savedAt || 0);
        setSavedQuoteStatus(ageMs < 43200000 ? "fresh" : ageMs < 86400000 ? "expiring" : "expired");
      }
    } catch { /* ignore */ }
  }, [item.id]);

  if (!d && !w && !item.aiBox) {
    return (
      <div style={{ fontSize: "0.68rem", color: "#ff9800", display: "flex", alignItems: "center", gap: "0.25rem" }}>
        {"\u26A0\uFE0F"} No profile {"\u2014"}{" "}
        <Link href={`/items/${item.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
          run AI analysis
        </Link>
      </div>
    );
  }

  return (
    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
      {/* AI Recommendation sub-section */}
      {item.aiBox && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "2px 7px", borderRadius: "0.35rem", background: "rgba(0,188,212,0.07)", border: "1px solid rgba(0,188,212,0.15)", marginBottom: "0.2rem" }}>
          <span style={{ fontSize: "0.6rem" }}>{"\u{1F916}"}</span>
          <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.62rem" }}>AI: {item.aiBox}</span>
          {item.aiBoxLabel && <span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>{"\u2014"} {item.aiBoxLabel}</span>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
        {/* Dimensions in monospace badge */}
        {d && (
          <span style={{ fontFamily: "monospace", fontSize: "0.64rem", padding: "1px 5px", borderRadius: "0.25rem", background: "var(--ghost-bg)", color: "var(--text-secondary)", letterSpacing: "0.02em" }}>
            {d}
          </span>
        )}
        {w && (
          <span style={{ fontFamily: "monospace", fontSize: "0.64rem", padding: "1px 5px", borderRadius: "0.25rem", background: "var(--ghost-bg)", color: "var(--text-secondary)", letterSpacing: "0.02em" }}>
            {w}
          </span>
        )}
        {item.isFragile && (
          <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
            {"\u26A0\uFE0F"} FRAGILE
          </span>
        )}
        {item.hasSavedDims && <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 4px", borderRadius: "9999px", background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>{"\u2705"} Saved</span>}
        {!item.hasSavedDims && item.hasAiProfile && <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 4px", borderRadius: "9999px", background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>{"\u26A1"} AI est.</span>}
        {item.isAntique && (
          <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(255,152,0,0.12)", color: "#ff9800" }}>{"\u{1F3DB}\uFE0F"} ANTIQUE</span>
        )}
        {item.isHighValue && !item.isPremium && (
          <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "#00bcd4" }}>{"\u{1F4B0}"} HIGH VALUE</span>
        )}
        {item.isPremium && (
          <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "linear-gradient(90deg, rgba(255,215,0,0.15), rgba(255,152,0,0.12))", color: "#f59e0b" }}>{"\u2B50"} PREMIUM</span>
        )}
        {(item.isPremium || (item.isHighValue && item.isAntique) || (item.isHighValue && item.isFragile)) && (
          <span style={{ fontSize: "0.45rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "linear-gradient(90deg, rgba(255,215,0,0.1), rgba(255,152,0,0.08))", color: "#f59e0b", border: "1px solid rgba(255,215,0,0.12)" }}>{"\u{1F3DB}\uFE0F"} ARTA</span>
        )}
        {item.conditionScore != null && item.conditionScore <= 4 && (
          <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>{"\u26A0\uFE0F"} FRAGILE COND.</span>
        )}
        {item.category && <span style={{ fontSize: "0.62rem" }}>{"\u00B7"} {item.category}</span>}
        {/* Saved quote status badge */}
        {savedQuoteStatus === "fresh" && (
          <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>{"\u2705"} Quote Fresh</span>
        )}
        {savedQuoteStatus === "expiring" && (
          <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>{"\u26A0\uFE0F"} Expiring Soon</span>
        )}
        {savedQuoteStatus === "expired" && (
          <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>{"\u274C"} Quote Expired</span>
        )}
      </div>
      {item.lastQuote && (
        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
          {"\u{1F4CB}"} Quoted: {item.lastQuote.cheapest?.carrier ?? "?"} {"\u2014"} ${item.lastQuote.cheapest?.price?.toFixed(2) ?? "?"}
        </div>
      )}
      {tips.length > 0 && (
        <div style={{ marginTop: "0.2rem" }}>
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "0.62rem",
              color: "var(--accent)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {tipsOpen ? "\u25BC" : "\u25B6"} {tips.length} packing tip{tips.length !== 1 ? "s" : ""}
          </button>
          {tipsOpen && (
            <ul style={{ margin: "0.2rem 0 0 0.75rem", padding: 0, fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              {tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── F) Item Row ─────────────────────────────────────────────────────────────

function ItemRow({ item, children }: { item: any; children?: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.85rem",
        borderRadius: "0.65rem",
        border: "1px solid var(--border-default)",
        background: "var(--bg-card)",
        transition: "all 0.15s ease",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo} alt="" style={{ width: 56, height: 56, borderRadius: "0.4rem", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 56, height: 56, borderRadius: "0.4rem", background: "var(--ghost-bg)", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
          <Link href={`/items/${item.id}`} style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", textDecoration: "none" }}>
            {item.title}
          </Link>
          {item.aiShippingDifficulty && (() => {
            const d = item.aiShippingDifficulty;
            const colors: Record<string, { bg: string; text: string }> = {
              "Easy": { bg: "rgba(76,175,80,0.12)", text: "#4caf50" },
              "Moderate": { bg: "rgba(255,152,0,0.12)", text: "#ff9800" },
              "Difficult": { bg: "rgba(244,67,54,0.12)", text: "#f44336" },
              "Freight only": { bg: "rgba(156,39,176,0.12)", text: "#9c27b0" },
            };
            const c = colors[d] || colors["Moderate"];
            return (
              <span style={{ fontSize: "0.48rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: c.bg, color: c.text }}>
                {d === "Freight only" ? "FREIGHT" : d.toUpperCase()}
              </span>
            );
          })()}
        </div>
        <ShipProfile item={item} />
      </div>
      {children}
    </div>
  );
}

// ─── Quote Detail Panel ─────────────────────────────────────────────────────

function QuoteDetailPanel({ item, quote, onRefresh }: { item: any; quote: any; onRefresh?: () => void }) {
  const [expandedAlts, setExpandedAlts] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  if (!quote) return null;

  const carriers = (quote.carriers || []).filter((c: any) => c.price > 0).sort((a: any, b: any) => a.price - b.price);
  if (carriers.length === 0) {
    return (
      <div style={{
        borderTop: "1px solid var(--border-default)", padding: "0.75rem 0.85rem",
        background: "rgba(0,188,212,0.015)", fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" as const,
      }}>
        No quotes available yet. Enter a destination and get estimate.
      </div>
    );
  }

  const best = carriers[0];
  const alts = carriers.slice(1);
  const quotedDate = quote.quotedAt ? new Date(quote.quotedAt) : null;
  const ageMs = quotedDate ? Date.now() - quotedDate.getTime() : 0;
  const ageHrs = Math.round(ageMs / 3600000);
  const ageMins = Math.round(ageMs / 60000);
  const history = item.quoteHistory || [];

  // Freshness indicator
  const freshness = ageHrs < 1
    ? { dot: "\u{1F7E2}", label: `Fresh (${ageMins}m)`, color: "#22c55e" }
    : ageHrs < 6
      ? { dot: "\u{1F7E1}", label: `${ageHrs}h old`, color: "#f59e0b" }
      : { dot: "\u{1F534}", label: "Stale (> 6h)", color: "#ef4444" };

  const remainMs = quotedDate ? 86400000 - ageMs : 0;

  return (
    <div style={{ borderTop: "1px solid var(--border-default)", padding: "0.75rem 0.85rem", background: "rgba(0,188,212,0.015)", display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
      {/* Best Rate Card */}
      <div style={{
        padding: "0.6rem 0.75rem",
        borderRadius: "0.6rem",
        background: "rgba(76,175,80,0.08)",
        border: "1.5px solid rgba(76,175,80,0.25)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.4rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.7rem" }}>{"\u{1F49A}"}</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4caf50", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
              Best Rate
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            {onRefresh && (
              <button
                onClick={onRefresh}
                style={{
                  fontSize: "0.55rem",
                  padding: "2px 5px",
                  borderRadius: "0.3rem",
                  background: "rgba(0,188,212,0.1)",
                  color: "#00bcd4",
                  border: "1px solid rgba(0,188,212,0.2)",
                  cursor: "pointer",
                }}
              >
                {"\u21BB"} Refresh
              </button>
            )}
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.3rem",
        }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {best.carrier}
          </span>
          {best.service && (
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{best.service}</span>
          )}
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4caf50" }}>
            ${best.price.toFixed(2)}
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
            {best.days || "?"}d
          </span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: "0.6rem",
          color: "var(--text-secondary)",
        }}>
          <span>{freshness.dot}</span>
          <span style={{ color: freshness.color }}>{freshness.label}</span>
          {quotedDate && remainMs > 0 && (
            <span style={{ marginLeft: "0.3rem" }}>
              Valid ~{Math.max(0, Math.floor(remainMs / 3600000))}h
            </span>
          )}
          {quotedDate && remainMs <= 0 && (
            <span style={{ marginLeft: "0.3rem", color: "#ef4444" }}>
              Expired {Math.abs(Math.round(remainMs / 3600000))}h ago
            </span>
          )}
        </div>
      </div>

      {/* Route + Package info strip */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, fontSize: "0.62rem", color: "var(--text-muted)" }}>
        {quote.fromZip && quote.toZip && (
          <span>{"\u{1F4CD}"} {quote.fromZip} {"\u2192"} {quote.toZip}</span>
        )}
        {quote.weight && <span>{"\u{1F4E6}"} {quote.weight} lbs</span>}
        {quote.box?.label && <span>{"\u{1F4D0}"} {quote.box.label}</span>}
        {quote.isFragile && <span style={{ color: "#f59e0b" }}>{"\u26A0\uFE0F"} Fragile</span>}
        {quote.isLTL && <span style={{ color: "#ce93d8" }}>{"\u{1F69B}"} LTL Freight</span>}
        {quote.isLiveRates && <span style={{ color: "#22c55e" }}>{"\u{1F7E2}"} Live rates</span>}
      </div>

      {/* Alternative Rates */}
      {alts.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedAlts(!expandedAlts)}
            style={{
              fontSize: "0.62rem",
              fontWeight: 600,
              padding: "0.3rem 0.5rem",
              borderRadius: "0.3rem",
              background: "transparent",
              color: "#00bcd4",
              border: "1px solid rgba(0,188,212,0.3)",
              cursor: "pointer",
              width: "100%",
              textAlign: "left" as const,
            }}
          >
            {expandedAlts ? "\u25BC" : "\u25B6"} Other Options ({alts.length})
          </button>
          {expandedAlts && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.3rem", marginTop: "0.3rem" }}>
              {alts.map((alt: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: "0.4rem 0.5rem",
                    borderRadius: "0.4rem",
                    background: "var(--ghost-bg)",
                    border: "1px solid var(--border-default)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {alt.carrier}
                    </span>
                    {alt.service && (
                      <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{alt.service}</span>
                    )}
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                      ${alt.price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {alt.days || "?"}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quote History (collapsible) */}
      {history.length > 1 && (
        <div style={{ marginTop: "0.1rem" }}>
          <button onClick={() => setHistoryOpen(!historyOpen)} style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {historyOpen ? "\u25BC" : "\u25B6"} Quote History ({history.length})
          </button>
          {historyOpen && (
            <div style={{ marginTop: "0.3rem", display: "flex", flexDirection: "column" as const, gap: "0.2rem" }}>
              {history.map((h: any, i: number) => {
                const hDate = h.quotedAt ? new Date(h.quotedAt) : null;
                const cheapest = (h.carriers || []).filter((c: any) => c.price > 0).sort((a: any, b: any) => a.price - b.price)[0];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.2rem 0.5rem", fontSize: "0.55rem", color: i === 0 ? "var(--text-secondary)" : "var(--text-muted)", borderLeft: i === 0 ? "2px solid var(--accent)" : "2px solid var(--border-default)", opacity: i === 0 ? 1 : 0.7 }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.5rem", minWidth: 80 }}>{hDate?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} {hDate?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                    <span>{cheapest ? `${cheapest.carrier} ${cheapest.service}` : "\u2014"}</span>
                    <span style={{ fontWeight: 700 }}>{cheapest ? `$${cheapest.price.toFixed(2)}` : ""}</span>
                    {h.fromZip && h.toZip && <span>{h.fromZip}{"\u2192"}{h.toZip}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Address Display ────────────────────────────────────────────────────────

function AddressDisplay({ label, address }: { label: string; address: any }) {
  if (!address) return null;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: "0.48rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.15rem" }}>{label}</div>
      <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
        {address.name && <div style={{ fontWeight: 600 }}>{address.name}</div>}
        {address.street1 && <div>{address.street1}</div>}
        <div>{[address.city, address.state, address.zip].filter(Boolean).join(", ")}</div>
      </div>
    </div>
  );
}

// ─── G) Pre-Sale Tab ─────────────────────────────────────────────────────────

function PreSaleTab({ items, estimates, onEstimate, onSwitchTab }: { items: any[]; estimates: Record<string, any>; onEstimate: (id: string, est: any) => void; onSwitchTab?: (tab: string) => void }) {
  const [estimating, setEstimating] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editDims, setEditDims] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [selectedCarrierMap, setSelectedCarrierMap] = useState<Record<string, any>>({});
  const [liveMetros, setLiveMetros] = useState<Record<string, any[]>>({});
  const [fetchingMetros, setFetchingMetros] = useState<string | null>(null);
  const [markingSold, setMarkingSold] = useState<string | null>(null);
  const [markedSold, setMarkedSold] = useState<Set<string>>(new Set());
  const [savedQuotes, setSavedQuotes] = useState<Record<string, "fresh" | "expiring" | "expired">>({});
  const [savedQuoteFullData, setSavedQuoteFullData] = useState<Record<string, any>>({});
  const [detailOpen, setDetailOpen] = useState<Record<string, boolean>>({});

  // Auto-expand quote details for items that have quotes
  useEffect(() => {
    const autoOpen: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.lastQuote && item.lastQuote.carriers?.length > 0) {
        autoOpen[item.id] = true;
      }
    });
    if (Object.keys(autoOpen).length > 0) {
      setDetailOpen((prev) => ({ ...autoOpen, ...prev }));
    }
  }, [items]);

  // Load saved quote statuses + full data from localStorage on mount
  useEffect(() => {
    const map: Record<string, "fresh" | "expiring" | "expired"> = {};
    const fullMap: Record<string, any> = {};
    items.forEach((item) => {
      try {
        const raw = localStorage.getItem(`ll_quote_${item.id}`);
        if (raw) {
          const q = JSON.parse(raw);
          const ageMs = Date.now() - (q.savedAt || 0);
          map[item.id] = ageMs < 43200000 ? "fresh" : ageMs < 86400000 ? "expiring" : "expired";
          fullMap[item.id] = { ...q, ageHrs: Math.round(ageMs / 3600000), isFresh: ageMs < 43200000, isExpiring: ageMs >= 43200000 && ageMs < 86400000, isExpired: ageMs >= 86400000 };
        }
      } catch { /* ignore */ }
    });
    setSavedQuotes(map);
    setSavedQuoteFullData(fullMap);
  }, [items]);

  function saveQuote(itemId: string, carrier: any) {
    try {
      const toZip = editDims.destZip || "";
      const now = Date.now();
      const quoteObj = { carrier, savedAt: now, toZip };
      localStorage.setItem(`ll_quote_${itemId}`, JSON.stringify(quoteObj));
      setSavedQuotes((prev) => ({ ...prev, [itemId]: "fresh" }));
      setSavedQuoteFullData((prev) => ({ ...prev, [itemId]: { ...quoteObj, ageHrs: 0, isFresh: true, isExpiring: false, isExpired: false } }));
    } catch { /* ignore */ }
  }

  function openEditor(item: any) {
    setEditingItem(editingItem === item.id ? null : item.id);
    if (editingItem !== item.id) {
      const preset = item.aiBox ? BOX_PRESETS[item.aiBox] : null;
      // Auto-populate from category defaults when no saved dims
      const catDefaults = item.category ? getCategoryDefaults(item.category) : null;
      setEditDims({
        weight: item.weight || item.aiEstWeight || (catDefaults?.weight ? String(catDefaults.weight) : "5"),
        length: item.length || item.aiBoxDims?.length || preset?.l || (catDefaults?.l ? String(catDefaults.l) : ""),
        width: item.width || item.aiBoxDims?.width || preset?.w || (catDefaults?.w ? String(catDefaults.w) : ""),
        height: item.height || item.aiBoxDims?.height || preset?.h || (catDefaults?.h ? String(catDefaults.h) : ""),
        isFragile: item.isFragile || (catDefaults?.fragile ?? false),
        selectedBox: item.aiBox || "",
        packaging: catDefaults?.packaging || "box",
        preference: "BUYER_PAYS",
        destZip: "",
      });
    }
  }

  function selectPreset(key: string, item: any) {
    const p = BOX_PRESETS[key];
    if (key === "custom") {
      // Auto-fill custom with item dims + 4 if no standard fits
      const iL = Number(editDims.length) || item.aiBoxDims?.length || 0;
      const iW = Number(editDims.width) || item.aiBoxDims?.width || 0;
      const iH = Number(editDims.height) || item.aiBoxDims?.height || 0;
      const anyFits = Object.entries(BOX_PRESETS).some(([k, bp]) => {
        if (k === "custom") return false;
        return (iL + 4) <= bp.l && (iW + 4) <= bp.w && (iH + 4) <= bp.h;
      });
      if (!anyFits && iL > 0 && iW > 0 && iH > 0) {
        setEditDims((d: any) => ({ ...d, selectedBox: "custom", length: String(iL + 4), width: String(iW + 4), height: String(iH + 4) }));
      } else {
        setEditDims((d: any) => ({ ...d, selectedBox: "custom" }));
      }
    } else {
      setEditDims((d: any) => ({ ...d, selectedBox: key, length: String(p.l), width: String(p.w), height: String(p.h) }));
    }
  }

  async function saveShippingDetails(itemId: string) {
    setSaving(itemId);
    try {
      await fetch(`/api/items/update/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingWeight: Number(editDims.weight) || null,
          shippingLength: Number(editDims.length) || null,
          shippingWidth: Number(editDims.width) || null,
          shippingHeight: Number(editDims.height) || null,
          isFragile: editDims.isFragile,
          shippingPreference: editDims.preference,
        }),
      });
      setSavedMsg(itemId);
      setTimeout(() => setSavedMsg(null), 2000);
    } catch {}
    setSaving(null);
  }

  async function getEstimate(itemId: string) {
    setEstimating(itemId);
    const item = items.find(i => i.id === itemId);
    const destZip = editDims.destZip || "";
    const w = item?.weight || item?.aiEstWeight || Number(editDims.weight) || 5;
    const l = item?.length || item?.aiBoxDims?.length || Number(editDims.length) || 14;
    const wi = item?.width || item?.aiBoxDims?.width || Number(editDims.width) || 12;
    const h = item?.height || item?.aiBoxDims?.height || Number(editDims.height) || 8;
    const origin = item?.saleZip || "04901";
    const result = await fetchLiveRates(itemId, origin, destZip, w, l, wi, h);
    if (result.carriers.length > 0) {
      onEstimate(itemId, { ...result, fromZip: origin, toZip: destZip });
    }
    setEstimating(null);
  }

  if (items.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem", opacity: 0.4 }}>{"\u{1F4E6}"}</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>No Items to Estimate</div>
        <div style={{ fontSize: "0.82rem", lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>Upload and analyze items to start getting real carrier rates. AI will recommend the perfect box and packing strategy.</div>
        <Link href="/items/new" style={{ display: "inline-block", marginTop: "0.75rem", padding: "0.4rem 1rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.5rem", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", textDecoration: "none" }}>
          {"\u2795"} Add Item
        </Link>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {items.map((item) => {
        const est = estimates[item.id];
        const carriers = est?.carriers?.filter((c: any) => c.price > 0).sort((a: any, b: any) => a.price - b.price) ?? [];
        const bySpeed = est?.carriers?.filter((c: any) => c.price > 0).sort((a: any, b: any) => {
          const aDays = parseInt(String(a.days)) || 99;
          const bDays = parseInt(String(b.days)) || 99;
          return aDays - bDays;
        }) ?? [];
        const fastestCarrier = bySpeed[0];
        const isVehicle = (item.aiBox === "freight" && (item.category || "").toLowerCase().match(/vehicle|boat|car|truck|motorcycle/)) || false;
        return (
          <div key={item.id} style={{ borderRadius: "0.75rem", border: "1px solid var(--border-default)", background: "var(--bg-card)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem" }}>
              {item.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photo} alt="" style={{ width: 56, height: 56, borderRadius: "0.4rem", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "0.4rem", background: "var(--ghost-bg)", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/items/${item.id}`} style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", textDecoration: "none" }}>
                  {item.title}
                </Link>
                <ShipProfile item={item} />
                {/* Shipping Readiness Stepper */}
                {!isVehicle && (() => {
                  const hasProfile = !!(item.aiBox || item.weight || item.aiEstWeight);
                  const hasQuote = !!(est && carriers.length > 0);
                  const hasSaved = savedQuotes[item.id] === "fresh" || savedQuotes[item.id] === "expiring" || savedQuotes[item.id] === "expired";
                  const steps = [
                    { label: "AI Profile", done: hasProfile, icon: "\u{1F4E6}" },
                    { label: "Get Rates", done: hasQuote, icon: "\u{1F4CB}" },
                    { label: "Save Quote", done: hasSaved, icon: "\u{1F4BE}" },
                  ];
                  const currentStep = hasSaved ? 3 : hasQuote ? 2 : hasProfile ? 1 : 0;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.15rem", marginTop: "0.3rem", marginBottom: "0.15rem" }}>
                      {steps.map((s, i) => (
                        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.15rem" }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: "0.15rem",
                            padding: "1px 5px", borderRadius: "9999px", fontSize: "0.45rem", fontWeight: 700,
                            background: s.done ? "rgba(34,197,94,0.1)" : i === currentStep ? "rgba(0,188,212,0.08)" : "transparent",
                            color: s.done ? "#22c55e" : i === currentStep ? "#00bcd4" : "var(--text-muted)",
                            border: `1px solid ${s.done ? "rgba(34,197,94,0.15)" : i === currentStep ? "rgba(0,188,212,0.15)" : "transparent"}`,
                          }}>
                            {s.done ? "\u2713" : s.icon} {s.label}
                          </div>
                          {i < steps.length - 1 && <span style={{ fontSize: "0.4rem", color: "var(--text-muted)" }}>{"\u203A"}</span>}
                        </div>
                      ))}
                      {hasSaved && <span style={{ fontSize: "0.45rem", fontWeight: 700, color: "#22c55e", marginLeft: "0.2rem" }}>{"\u2705"} Ready</span>}
                    </div>
                  );
                })()}
                <ShippingAIPanel item={item} />
                {isVehicle && (
                  <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "1rem" }}>{"\u{1F697}"}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a855f7" }}>LOCAL PICKUP ONLY</span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: "0.4rem" }}>
                      Vehicles cannot be shipped via parcel or freight carriers. Set up local pickup for this item.
                    </div>
                    <button onClick={() => onSwitchTab?.("pickup")} style={{ padding: "0.3rem 0.75rem", fontSize: "0.68rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", cursor: "pointer" }}>
                      {"\u{1F91D}"} Set Up Pickup {"\u2192"}
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                {item.valuationLow != null && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)" }}>
                      ${item.valuationLow}{"\u2013"}${item.valuationHigh}
                    </div>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Est. value</div>
                  </div>
                )}
                {!isVehicle && !est && (
                  <button
                    onClick={() => getEstimate(item.id)}
                    disabled={estimating === item.id}
                    style={{
                      padding: "0.35rem 0.85rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "0.5rem",
                      border: "1px solid var(--accent)",
                      background: "transparent",
                      color: "var(--accent)",
                      cursor: "pointer",
                    }}
                  >
                    {estimating === item.id ? "Quoting..." : "Get Quote"}
                  </button>
                )}
                {est && (
                  <button
                    onClick={() => getEstimate(item.id)}
                    disabled={estimating === item.id}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      borderRadius: "0.35rem",
                      border: "1px solid var(--border-default)",
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {estimating === item.id ? "..." : "\u{1F504}"}
                  </button>
                )}
                {/* Mark as Sold */}
                {!markedSold.has(item.id) && (
                  <button
                    onClick={async () => {
                      setMarkingSold(item.id);
                      try {
                        await fetch(`/api/items/status/${item.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "SOLD" }),
                        });
                        setMarkedSold(prev => new Set(prev).add(item.id));
                      } catch {}
                      setMarkingSold(null);
                    }}
                    disabled={markingSold === item.id}
                    style={{
                      padding: "0.25rem 0.55rem",
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      borderRadius: "0.35rem",
                      border: "1px solid rgba(76,175,80,0.3)",
                      background: "rgba(76,175,80,0.06)",
                      color: "#4caf50",
                      cursor: "pointer",
                    }}
                  >
                    {markingSold === item.id ? "..." : "\u{1F4B0} Mark Sold"}
                  </button>
                )}
                {markedSold.has(item.id) && (
                  <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#4caf50" }}>{"\u2705"} Sold!</span>
                )}
              </div>
            </div>
            {/* Saved Quote from Item Dashboard (localStorage) */}
            {savedQuoteFullData[item.id] && savedQuoteFullData[item.id].carrier && !selectedCarrierMap[item.id] && (() => {
              const sq = savedQuoteFullData[item.id];
              const c = sq.carrier;
              const status = savedQuotes[item.id];
              const remainMs = sq.savedAt ? 86400000 - (Date.now() - sq.savedAt) : 0;
              const remainHrs = Math.max(0, Math.floor(remainMs / 3600000));
              const remainMins = Math.max(0, Math.floor((remainMs % 3600000) / 60000));
              return (
                <div style={{ margin: "0 0.85rem", padding: "0.55rem 0.75rem", borderRadius: "0.5rem", background: sq.isFresh ? "rgba(34,197,94,0.04)" : sq.isExpiring ? "rgba(245,158,11,0.04)" : "rgba(239,68,68,0.04)", border: `1px solid ${sq.isFresh ? "rgba(34,197,94,0.15)" : sq.isExpiring ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.3rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem" }}>{"\u{1F4CB}"}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>Saved Quote: {c.carrier || "?"} {c.service || ""}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#4caf50" }}>${c.price?.toFixed(2) ?? "?"}</span>
                      <span style={{ fontSize: "0.48rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: sq.isFresh ? "rgba(34,197,94,0.12)" : sq.isExpiring ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)", color: sq.isFresh ? "#22c55e" : sq.isExpiring ? "#f59e0b" : "#ef4444" }}>
                        {sq.isFresh ? "\u2705 Fresh" : sq.isExpiring ? `\u26A0\uFE0F Expiring (${sq.ageHrs}h)` : `\u274C Expired (${sq.ageHrs}h)`}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <button
                        onClick={() => { setSelectedCarrierMap((prev) => ({ ...prev, [item.id]: c })); saveQuote(item.id, c); }}
                        style={{ padding: "0.25rem 0.6rem", fontSize: "0.6rem", fontWeight: 700, borderRadius: "0.35rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer" }}
                      >
                        Use This Quote {"\u2192"}
                      </button>
                      <button
                        onClick={() => getEstimate(item.id)}
                        disabled={estimating === item.id}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.6rem", fontWeight: 600, borderRadius: "0.35rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
                      >
                        {estimating === item.id ? "..." : "\u{1F504} Get Fresh Rates"}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {c.days ? `${c.days}d transit` : ""}{c.days && sq.savedAt ? " \u00B7 " : ""}{sq.savedAt ? `saved ${new Date(sq.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}
                    {remainMs > 0 ? ` \u00B7 valid ~${remainHrs}h ${remainMins}m` : sq.savedAt ? ` \u00B7 expired ${sq.ageHrs - 24}h ago` : ""}
                  </div>
                </div>
              );
            })()}
            {/* Quote detail toggle */}
            {item.lastQuote && (
              <div style={{ padding: "0 0.85rem" }}>
                <button onClick={() => setDetailOpen(prev => ({ ...prev, [item.id]: !prev[item.id] }))} style={{ fontSize: "0.58rem", fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "0.2rem 0" }}>
                  {detailOpen[item.id] ? "\u25BC Hide Quote Details" : "\u25B6 Show Quote Details"} {"\u00B7"} {item.lastQuote.carriers?.length || 0} carriers
                </button>
              </div>
            )}
            {/* Expandable quote detail */}
            {detailOpen[item.id] && item.lastQuote && (
              <QuoteDetailPanel item={item} quote={item.lastQuote} onRefresh={() => getEstimate(item.id)} />
            )}
            {/* Shipping Details Editor */}
            {editingItem === item.id && (
              <div style={{ borderTop: "1px solid var(--border-default)", padding: "0.85rem" }}>
                {/* Dest ZIP with CitySearch */}
                <div style={{ marginBottom: "0.6rem" }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Buyer ZIP (for estimates)</div>
                  <CitySearch value={editDims.destZip || ""} onChange={(zip) => setEditDims((d: any) => ({ ...d, destZip: zip }))} placeholder="City or ZIP..." />
                </div>
                {/* Box Size Grid */}
                <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.4rem" }}>Box Size</div>
                {(() => {
                  // Validate AI pick against actual item dimensions
                  const dimL = Number(editDims.length) || item.aiBoxDims?.length || 0;
                  const dimW = Number(editDims.width) || item.aiBoxDims?.width || 0;
                  const dimH = Number(editDims.height) || item.aiBoxDims?.height || 0;
                  const hasDims = dimL > 0 && dimW > 0 && dimH > 0;
                  let validatedPick = item.aiBox || "";
                  let pickUpgraded = false;
                  let pickReason = "";

                  if (hasDims && validatedPick && validatedPick !== "custom") {
                    const aiP = BOX_PRESETS[validatedPick];
                    if (aiP) {
                      const aiFits = (dimL + 4) <= aiP.l && (dimW + 4) <= aiP.w && (dimH + 4) <= aiP.h;
                      const aiLoose = aiFits && (aiP.l > dimL * 2 || aiP.w > dimW * 2 || aiP.h > dimH * 2);
                      const aiVoid = aiFits && aiP.h > (dimH + 4) * 3;
                      if (!aiFits || aiLoose || aiVoid) {
                        // AI pick doesn't fit well — find the first good preset
                        const order = ["tiny", "small", "medium", "large", "xl", "oversized", "furniture"];
                        let found = false;
                        for (const k of order) {
                          const bp = BOX_PRESETS[k];
                          const kFits = (dimL + 4) <= bp.l && (dimW + 4) <= bp.w && (dimH + 4) <= bp.h;
                          const kLoose = kFits && (bp.l > dimL * 2 || bp.w > dimW * 2 || bp.h > dimH * 2);
                          const kVoid = kFits && bp.h > (dimH + 4) * 3;
                          if (kFits && !kLoose && !kVoid) {
                            validatedPick = k;
                            pickUpgraded = true;
                            pickReason = !aiFits ? `Upgraded from ${item.aiBox} (too small)` : `Upgraded from ${item.aiBox} (excess void)`;
                            found = true;
                            break;
                          }
                        }
                        if (!found) {
                          validatedPick = "custom";
                          pickUpgraded = true;
                          pickReason = `Custom recommended \u2014 ${Math.ceil(dimL + 4)}\u00D7${Math.ceil(dimW + 4)}\u00D7${Math.ceil(dimH + 4)}" fits perfectly`;
                        }
                      }
                    }
                  }

                  // Override: for very thin/small items, trust AI category over dimension fit calc
                  const itemDims = [dimL, dimW, dimH].filter(d => d > 0);
                  const minItemDim = itemDims.length > 0 ? Math.min(...itemDims) : 999;
                  if (minItemDim < 1 && item.aiBox === "tiny") {
                    validatedPick = "tiny";
                    pickUpgraded = false;
                    pickReason = "Category-appropriate packaging for thin/small items";
                  }
                  // Override: for known small-item categories, keep tiny if AI says tiny
                  const catLower = (item.category || "").toLowerCase();
                  const isSmallCategory = ["card", "trading", "jewelry", "coin", "stamp", "watch", "phone", "pokemon", "hockey"].some(k => catLower.includes(k));
                  if (isSmallCategory && item.aiBox === "tiny" && validatedPick !== "tiny") {
                    validatedPick = "tiny";
                    pickUpgraded = false;
                    pickReason = "Category-appropriate packaging";
                  }

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.3rem", marginBottom: "0.65rem" }}>
                      {Object.entries(BOX_PRESETS).map(([key, p]) => {
                        const isAi = validatedPick === key;
                        const isSel = editDims.selectedBox === key;
                        const iL = dimL; const iW = dimW; const iH = dimH;
                        const hasDimInfo = iL > 0 && iW > 0 && iH > 0 && key !== "custom";
                        let fitLabel = "";
                        let fitColor = "";
                        let fitBg = "";
                        if (hasDimInfo) {
                          const fits = (iL + 4) <= p.l && (iW + 4) <= p.w && (iH + 4) <= p.h;
                          const tooSmall = iL > p.l || iW > p.w || iH > p.h;
                          const loose = fits && (p.l > iL * 2 || p.w > iW * 2 || p.h > iH * 2);
                          const excessiveVoid = fits && !tooSmall && p.h > (iH + 4) * 3;
                          // Small-category items use rigid mailers — Tiny is perfect, not "too small"
                          if (key === "tiny" && isSmallCategory) {
                            fitLabel = "\u2705 Perfect"; fitColor = "#22c55e"; fitBg = "rgba(34,197,94,0.08)";
                          } else if (key === "tiny" && minItemDim < 0.5) {
                            fitLabel = "\u2705 Mailer"; fitColor = "#22c55e"; fitBg = "rgba(34,197,94,0.08)";
                          } else if (tooSmall) { fitLabel = "\u274C Too small"; fitColor = "#ef4444"; fitBg = "rgba(239,68,68,0.08)"; }
                          else if (excessiveVoid && !loose) { fitLabel = "\u26A0\uFE0F Void space"; fitColor = "#f59e0b"; fitBg = "rgba(245,158,11,0.08)"; }
                          else if (loose) { fitLabel = "\u26A0\uFE0F Loose"; fitColor = "#f59e0b"; fitBg = "rgba(245,158,11,0.08)"; }
                          else if (fits) { fitLabel = "\u2705 Fits"; fitColor = "#22c55e"; fitBg = "rgba(34,197,94,0.08)"; }
                        }
                        return (
                          <button key={key} onClick={() => selectPreset(key, item)} style={{
                            padding: "0.4rem 0.3rem", borderRadius: "0.4rem", textAlign: "center", cursor: "pointer",
                            border: isSel ? "1.5px solid var(--accent)" : isAi && !isSel ? "1.5px solid rgba(0,188,212,0.4)" : "1px solid var(--border-default)",
                            background: isSel ? "rgba(0,188,212,0.06)" : isAi && !isSel ? "rgba(0,188,212,0.03)" : "transparent",
                            transition: "all 0.15s ease",
                          }}>
                            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: isSel ? "var(--accent)" : "var(--text-primary)" }}>{key}</div>
                            <div style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>{p.desc.split(",")[0]}</div>
                            {isAi && !pickUpgraded && <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "var(--accent)", marginTop: 1 }}>AI PICK {"\u00B7"} +2" pad</div>}
                            {isAi && pickUpgraded && <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "#00bcd4", marginTop: 1 }}>AI PICK (upgraded)</div>}
                            {isAi && pickUpgraded && <div style={{ fontSize: "0.42rem", color: "var(--text-muted)", marginTop: 1 }}>{pickReason}</div>}
                            {isAi && !pickUpgraded && iL > 0 && <div style={{ fontSize: "0.44rem", color: "var(--text-muted)", marginTop: 1 }}>Based on {iL}{"\u00D7"}{iW}{"\u00D7"}{iH} + 2" pad</div>}
                            {key === "custom" && !isAi && <div style={{ fontSize: "0.44rem", color: "var(--text-muted)", marginTop: 1 }}>Auto L+4/W+4/H+4</div>}
                            {key === "custom" && isAi && <div style={{ fontSize: "0.44rem", color: "var(--accent)", marginTop: 1 }}>{"\u{1F4E6}"} {Math.ceil(dimL + 4)}{"\u00D7"}{Math.ceil(dimW + 4)}{"\u00D7"}{Math.ceil(dimH + 4)}" sized for item</div>}
                            {fitLabel && (
                              <div style={{ fontSize: "0.48rem", fontWeight: 700, color: fitColor, background: fitBg, borderRadius: "3px", padding: "0 3px", marginTop: 2 }}>{fitLabel}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                {/* Custom auto-recommend when void space is excessive */}
                {(() => {
                  const iL = Number(editDims.length) || item.aiBoxDims?.length || 0;
                  const iW = Number(editDims.width) || item.aiBoxDims?.width || 0;
                  const iH = Number(editDims.height) || item.aiBoxDims?.height || 0;
                  if (iL > 0 && iW > 0 && iH > 0) {
                    const bestFit = Object.entries(BOX_PRESETS).find(([k, p]) => {
                      if (k === "custom") return false;
                      return (iL + 4) <= p.l && (iW + 4) <= p.w && (iH + 4) <= p.h && p.h <= (iH + 4) * 3;
                    });
                    if (!bestFit && editDims.selectedBox !== "custom") {
                      return (
                        <div style={{ padding: "0.45rem 0.65rem", borderRadius: "0.4rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.15)", marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--accent)" }}>{"\u{1F916}"} Custom Recommended: {iL + 4}{"\u00D7"}{iW + 4}{"\u00D7"}{iH + 4} in</div>
                            <div style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>Perfectly sized for this item {"\u2014"} no wasted space</div>
                          </div>
                          <button onClick={() => { setEditDims((d: any) => ({ ...d, selectedBox: "custom", length: String(iL + 4), width: String(iW + 4), height: String(iH + 4) })); }} style={{ padding: "0.25rem 0.55rem", fontSize: "0.6rem", fontWeight: 700, borderRadius: "0.35rem", border: "none", background: "var(--accent)", color: "#000", cursor: "pointer" }}>
                            Use Custom
                          </button>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
                {/* Editable Dims */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  {[{ k: "weight", l: "Weight (lbs)" }, { k: "length", l: "L (in)" }, { k: "width", l: "W (in)" }, { k: "height", l: "H (in)" }].map(f => (
                    <div key={f.k}>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>{f.l}</div>
                      <input value={editDims[f.k] || ""} onChange={e => setEditDims((d: any) => ({ ...d, [f.k]: e.target.value }))} style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.78rem", borderRadius: "0.35rem", border: "1px solid var(--border-default)", background: "var(--input-bg, var(--ghost-bg))", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
                {/* Packaging Type + Fragile */}
                <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  {PACKAGING_TYPES.map(pt => (
                    <button key={pt.value} onClick={() => setEditDims((d: any) => ({ ...d, packaging: pt.value }))} style={{
                      padding: "0.3rem 0.55rem", borderRadius: "0.35rem", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
                      border: editDims.packaging === pt.value ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                      background: editDims.packaging === pt.value ? "rgba(0,188,212,0.06)" : "transparent",
                      color: editDims.packaging === pt.value ? "var(--accent)" : "var(--text-muted)",
                    }}>
                      {pt.icon} {pt.label}
                    </button>
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.68rem", color: "var(--text-muted)", cursor: "pointer", marginLeft: "0.5rem" }}>
                    <input type="checkbox" checked={editDims.isFragile} onChange={e => setEditDims((d: any) => ({ ...d, isFragile: e.target.checked }))} /> Fragile
                  </label>
                </div>
                {/* Save */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={() => saveShippingDetails(item.id)} disabled={saving === item.id} style={{
                    padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "0.4rem",
                    border: "none", background: savedMsg === item.id ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #00bcd4, #009688)",
                    color: savedMsg === item.id ? "#22c55e" : "#fff", cursor: "pointer",
                  }}>
                    {saving === item.id ? "Saving..." : savedMsg === item.id ? "\u2705 Saved!" : "Save Shipping Details"}
                  </button>
                </div>
                {/* Metro Estimates — with Get Live Rates button */}
                {item.metroEstimates && item.metroEstimates.length > 0 && (
                  <div style={{ marginTop: "0.65rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Shipping to Major Cities</div>
                      {!liveMetros[item.id] && (
                        <button
                          onClick={async () => {
                            setFetchingMetros(item.id);
                            const metroZips = [
                              { city: "New York", zip: "10001" },
                              { city: "Los Angeles", zip: "90001" },
                              { city: "Chicago", zip: "60601" },
                              { city: "Houston", zip: "77001" },
                            ];
                            const w = item.weight || item.aiEstWeight || 5;
                            const l = item.length || item.aiBoxDims?.length || 14;
                            const wi = item.width || item.aiBoxDims?.width || 12;
                            const h = item.height || item.aiBoxDims?.height || 8;
                            try {
                              const results = await Promise.all(
                                metroZips.map(async (m) => {
                                  const r = await fetchLiveRates(item.id, "04901", m.zip, w, l, wi, h);
                                  const cheapest = r.carriers[0];
                                  return cheapest ? { city: m.city, zip: m.zip, estimatedCost: cheapest.price, estimatedDays: parseInt(cheapest.days) || 5, carrier: cheapest.carrier, service: cheapest.service, isCheapest: false, isFastest: false, isLive: r.isLive } : null;
                                })
                              );
                              const valid = results.filter(Boolean) as any[];
                              if (valid.length > 0) {
                                const minCost = Math.min(...valid.map((v: any) => v.estimatedCost));
                                const minDays = Math.min(...valid.map((v: any) => v.estimatedDays));
                                valid.forEach((v: any) => { v.isCheapest = v.estimatedCost === minCost; v.isFastest = v.estimatedDays === minDays && !v.isCheapest; });
                              }
                              setLiveMetros(prev => ({ ...prev, [item.id]: valid }));
                            } catch { /* ignore */ }
                            setFetchingMetros(null);
                          }}
                          disabled={fetchingMetros === item.id}
                          style={{ fontSize: "0.52rem", fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          {fetchingMetros === item.id ? "Loading..." : "\u{1F4E1} Get Live Rates"}
                        </button>
                      )}
                      {liveMetros[item.id] && (
                        <span style={{ fontSize: "0.45rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "#00bcd4" }}>SHIPPO RATES</span>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min((liveMetros[item.id] || item.metroEstimates).length, 5)}, 1fr)`, gap: "0.3rem" }}>
                      {(liveMetros[item.id] || item.metroEstimates).map((mc: any) => (
                        <div key={mc.city} style={{ padding: "0.35rem", borderRadius: "0.35rem", background: "var(--ghost-bg)", textAlign: "center", border: mc.isCheapest ? "1px solid rgba(76,175,80,0.2)" : mc.isFastest ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent" }}>
                          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--text-primary)" }}>{mc.city.split(",")[0]}</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: mc.isCheapest ? "#4caf50" : "var(--text-primary)" }}>${mc.estimatedCost.toFixed(2)}</div>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>{mc.estimatedDays}d</div>
                          {mc.carrier && <div style={{ fontSize: "0.42rem", color: "var(--text-muted)" }}>{mc.carrier}</div>}
                          {mc.isCheapest && <div style={{ fontSize: "0.45rem", fontWeight: 700, color: "#4caf50" }}>CHEAPEST</div>}
                          {mc.isFastest && !mc.isCheapest && <div style={{ fontSize: "0.45rem", fontWeight: 700, color: "#3b82f6" }}>FASTEST</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Packing Tips */}
                {(item.aiPackingTips?.length ?? 0) > 0 && (
                  <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.65rem", borderRadius: "0.4rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)" }}>
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--accent)", marginBottom: "0.25rem" }}>{"\u{1F4E6}"} PACKING TIPS</div>
                    {item.aiPackingTips.map((tip: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{"\u2022"} {tip}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Carrier comparison table */}
            {est && carriers.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border-default)", padding: "0.65rem 0.85rem" }}>
                <div
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    marginBottom: "0.4rem",
                  }}
                >
                  {"\u{1F4E6}"} {est.weight} lbs {"\u00B7"} {est.box?.label || "Standard Box"}
                  {est.isLTL ? " \u00B7 FREIGHT" : ""}
                  {est.isLive && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(0,188,212,0.15)", color: "#00bcd4", marginLeft: "0.3rem" }}>SHIPPO RATES</span>}
                  {est.isLive === false && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(255,152,0,0.12)", color: "#ff9800", marginLeft: "0.3rem" }}>ESTIMATED</span>}
                </div>
                {item.aiBox && (
                  <div style={{ fontSize: "0.62rem", color: "var(--accent)", marginBottom: "0.35rem" }}>
                    {"\u{1F916}"} AI suggests: {item.aiBox} ({item.aiBoxLabel})
                  </div>
                )}
                {/* Enrichment-based shipping recommendations */}
                {(item.isAntique || item.isHighValue || item.isPremium) && (
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                    {item.isAntique && (
                      <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(255,152,0,0.1)", color: "#ff9800", border: "1px solid rgba(255,152,0,0.15)" }}>{"\u{1F3DB}\uFE0F"} Insure + signature recommended</span>
                    )}
                    {item.isPremium && (
                      <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "linear-gradient(90deg, rgba(255,215,0,0.1), rgba(255,152,0,0.08))", color: "#f59e0b", border: "1px solid rgba(255,215,0,0.15)" }}>{"\u2B50"} Premium {"\u2014"} white glove or air service</span>
                    )}
                    {item.isHighValue && !item.isPremium && !item.isAntique && (
                      <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(0,188,212,0.08)", color: "#00bcd4", border: "1px solid rgba(0,188,212,0.12)" }}>{"\u{1F4B0}"} Add insurance ($500+ value)</span>
                    )}
                  </div>
                )}
                {/* Shipping Details Editor Toggle */}
                <div style={{ marginBottom: "0.35rem" }}>
                  <button onClick={() => openEditor(item)} style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {editingItem === item.id ? "\u25BC Hide Shipping Details" : "\u25B6 Edit Shipping Details"}
                  </button>
                </div>
                {/* Hint + Table Header */}
                {!selectedCarrierMap[item.id] && (
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span>{"\u{1F446}"}</span> Click a carrier to select and save your quote
                  </div>
                )}
                {selectedCarrierMap[item.id] && (savedQuotes[item.id] === "fresh" || savedQuotes[item.id] === "expiring") && (
                  <div style={{ padding: "0.45rem 0.65rem", borderRadius: "0.4rem", background: savedQuotes[item.id] === "fresh" ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${savedQuotes[item.id] === "fresh" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)"}`, marginBottom: "0.4rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.8rem" }}>{savedQuotes[item.id] === "fresh" ? "\u2705" : "\u26A0\uFE0F"}</span>
                      <div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: savedQuotes[item.id] === "fresh" ? "#22c55e" : "#f59e0b" }}>Quote Saved {"\u2014"} {selectedCarrierMap[item.id].carrier} {selectedCarrierMap[item.id].service} ${selectedCarrierMap[item.id].price?.toFixed(2)}</div>
                        <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{savedQuotes[item.id] === "expiring" ? "Quote expiring soon \u2014 refresh before shipping" : "This quote will carry over when the item is sold"}</div>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedCarrierMap((prev) => ({ ...prev, [item.id]: null })); }} style={{ fontSize: "0.58rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Change carrier</button>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", gap: "0.3rem", padding: "0.3rem 0.6rem", marginBottom: "0.2rem" }}>
                  {["Carrier", "Service", "Transit", "Cost", "Net Profit"].map((h) => (
                    <div key={h} style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{h}</div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {carriers.map((c: any, i: number) => {
                    const isBest = i === 0;
                    const isFastest =
                      fastestCarrier &&
                      c.carrier === fastestCarrier.carrier &&
                      c.service === fastestCarrier.service &&
                      !isBest;
                    const isSelectedRow = selectedCarrierMap[item.id]?.carrier === c.carrier && selectedCarrierMap[item.id]?.service === c.service;
                    const val = item.listingPrice || item.soldPrice || item.valuationMid || 0;
                    const shipCost = item.shippingPreference === "SPLIT_COST" ? c.price / 2 : item.shippingPreference === "BUYER_PAYS" ? 0 : c.price;
                    // 8% commission (Starter tier default) + 1.75% seller processing = 9.75%
                    // TODO: Pull actual user tier commission rate when available
                    const net = val > 0 ? Math.round((val - shipCost - val * 0.08 - val * 0.0175) * 100) / 100 : null;
                    const pct = val > 0 ? Math.round((c.price / val) * 100) : 0;
                    return (
                      <div
                        key={`${c.carrier}-${c.service}-${i}`}
                        onClick={() => setSelectedCarrierMap((prev) => ({ ...prev, [item.id]: isSelectedRow ? null : c }))}
                        onMouseEnter={(e) => { if (!isSelectedRow) (e.currentTarget as HTMLDivElement).style.background = "rgba(0,188,212,0.06)"; }}
                        onMouseLeave={(e) => { if (!isSelectedRow) (e.currentTarget as HTMLDivElement).style.background = i % 2 === 0 ? "var(--ghost-bg)" : "transparent"; }}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
                          gap: "0.3rem",
                          alignItems: "center",
                          padding: "0.45rem 0.6rem",
                          borderRadius: "0.4rem",
                          background: isSelectedRow ? "rgba(0,188,212,0.08)" : i % 2 === 0 ? "var(--ghost-bg)" : "transparent",
                          border: isSelectedRow ? "1.5px solid var(--accent)" : isBest ? "1px solid rgba(0,188,212,0.2)" : "1px solid transparent",
                          cursor: "pointer",
                          transition: "background 0.1s ease, border 0.1s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          {isSelectedRow && <span style={{ fontSize: "0.7rem", color: "var(--accent)" }}>{"\u2714"}</span>}
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.carrier}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{c.service}</span>
                          {isBest && (
                            <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(76,175,80,0.15)", color: "#4caf50" }}>BEST</span>
                          )}
                          {isFastest && (
                            <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>FASTEST</span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.days}d</span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: isBest ? "#4caf50" : "var(--text-primary)" }}>${c.price.toFixed(2)}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: net !== null ? (pct > 30 ? "#ef4444" : "#4caf50") : "var(--text-muted)" }}>
                          {net !== null ? `$${net > 0 ? net.toFixed(0) : "0"}` : "\u2014"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Best profit summary */}
                {carriers.length > 0 && (() => {
                  const val = item.listingPrice || item.soldPrice || item.valuationMid || 0;
                  if (val <= 0) return null;
                  const pref = item.shippingPreference || "BUYER_PAYS";
                  const bestCarrier = carriers.reduce((best: any, c: any) => {
                    const sc = pref === "SPLIT_COST" ? c.price / 2 : pref === "BUYER_PAYS" ? 0 : c.price;
                    const net = val - sc - val * 0.08 - val * 0.0175;
                    return (!best || net > best.net) ? { ...c, net } : best;
                  }, null);
                  if (!bestCarrier) return null;
                  const feeLabel = pref === "BUYER_PAYS" ? "after 9.75% fees" : "after shipping + 9.75% fees";
                  return (
                    <div style={{ marginTop: "0.35rem", padding: "0.35rem 0.6rem", borderRadius: "0.35rem", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.12)", fontSize: "0.62rem", color: "#4caf50", fontWeight: 600 }}>
                      {"\u{1F4B0}"} Best profit: {bestCarrier.carrier} {"\u2014"} ${bestCarrier.net.toFixed(0)} net {feeLabel}
                    </div>
                  );
                })()}
                {/* Save Quote bar */}
                {selectedCarrierMap[item.id] && savedQuotes[item.id] !== "fresh" && savedQuotes[item.id] !== "expiring" && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      onClick={() => saveQuote(item.id, selectedCarrierMap[item.id])}
                      style={{
                        width: "100%", padding: "0.55rem 0.85rem", fontSize: "0.78rem", fontWeight: 700,
                        borderRadius: "0.5rem", border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                      }}
                    >
                      <span>{"\u{1F4CB}"}</span>
                      Save Quote {"\u2014"} {selectedCarrierMap[item.id].carrier} {selectedCarrierMap[item.id].service} ${selectedCarrierMap[item.id].price?.toFixed(2)}
                    </button>
                    <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.2rem" }}>Lock in this rate for your shipment</div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── H) Ready to Ship Tab ────────────────────────────────────────────────────

function ReadyToShipTab({
  items,
  estimates,
  onEstimate,
  onRefresh,
  highlightId,
}: {
  items: any[];
  estimates: Record<string, any>;
  onEstimate: (id: string, est: any) => void;
  onRefresh: () => void;
  highlightId?: string | null;
}) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [wizardItem, setWizardItem] = useState<string | null>(highlightId ?? null);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<Record<string, any>>({});
  const [selectedCarrier, setSelectedCarrier] = useState<any>(null);
  const [generatedLabel, setGeneratedLabel] = useState<{ itemId: string; data: any } | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<Record<string, any>>({});
  const [refreshingQuote, setRefreshingQuote] = useState<string | null>(null);

  // Load saved quotes from localStorage + API fallback
  useEffect(() => {
    const map: Record<string, any> = {};
    items.forEach((item) => {
      // Try localStorage first
      try {
        const raw = localStorage.getItem(`ll_quote_${item.id}`);
        if (raw) {
          const q = JSON.parse(raw);
          const ageMs = Date.now() - (q.savedAt || 0);
          map[item.id] = { ...q, isFresh: ageMs < 43200000, isExpiring: ageMs >= 43200000 && ageMs < 86400000, isExpired: ageMs >= 86400000, ageHrs: Math.round(ageMs / 3600000) };
          return; // forEach callback return
        }
      } catch { /* ignore */ }
      // Fallback: use API lastQuote/selectedQuote (quote from when item was in PreSale)
      if (item.selectedQuote?.carrier) {
        const sq = item.selectedQuote;
        const ageMs = sq.quotedAt ? Date.now() - new Date(sq.quotedAt).getTime() : 86400000 * 2;
        map[item.id] = {
          carrier: { carrier: sq.carrier, service: sq.service, price: sq.price, days: String(sq.days || 5) },
          savedAt: sq.quotedAt ? new Date(sq.quotedAt).getTime() : Date.now() - ageMs,
          toZip: sq.toZip || "",
          isFresh: ageMs < 43200000,
          isExpiring: ageMs >= 43200000 && ageMs < 86400000,
          isExpired: ageMs >= 86400000,
          ageHrs: Math.round(ageMs / 3600000),
          fromApi: true,
        };
      } else if (item.lastQuote?.cheapest) {
        const lq = item.lastQuote;
        const ageMs = lq.quotedAt ? Date.now() - new Date(lq.quotedAt).getTime() : 86400000 * 2;
        map[item.id] = {
          carrier: { carrier: lq.cheapest.carrier, service: lq.cheapest.service || "Ground", price: lq.cheapest.price, days: String(lq.cheapest.days || 5) },
          savedAt: lq.quotedAt ? new Date(lq.quotedAt).getTime() : Date.now() - ageMs,
          toZip: lq.toZip || "",
          isFresh: ageMs < 43200000,
          isExpiring: ageMs >= 43200000 && ageMs < 86400000,
          isExpired: ageMs >= 86400000,
          ageHrs: Math.round(ageMs / 3600000),
          fromApi: true,
        };
      }
    });
    setSavedQuotes(map);
  }, [items]);

  // Auto-fetch live rates for items that have a saved quote with a toZip
  useEffect(() => {
    items.forEach((item) => {
      if (!estimates[item.id]) {
        const sq = savedQuotes[item.id];
        if (sq?.toZip) {
          // Has a saved route — fetch live rates for that route
          const w = item.weight || item.aiEstWeight || 5;
          const l = item.length || item.aiBoxDims?.length || 14;
          const wi = item.width || item.aiBoxDims?.width || 12;
          const h = item.height || item.aiBoxDims?.height || 8;
          fetchLiveRates(item.id, "04901", sq.toZip, w, l, wi, h)
            .then((result) => {
              if (result.carriers.length > 0) onEstimate(item.id, result);
            })
            .catch(() => {});
        }
      }
    });
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  function startWizard(item: any, fromSavedQuote?: boolean) {
    const est = estimates[item.id];
    const sq = savedQuotes[item.id];
    const sqCarrier = sq?.carrier;
    setWizardItem(item.id);
    setGeneratedLabel(null);

    // Determine starting step based on available data
    let startStep = 1;
    if (est || item.weight || item.aiEstWeight) startStep = 2;
    if (fromSavedQuote && sq && sqCarrier) {
      setSelectedCarrier(sqCarrier);
      // Fresh/expiring quote → skip to confirm (step 4); expired → carrier select (step 3)
      startStep = (sq.isFresh || sq.isExpiring) ? 4 : 3;
      if (sq.isExpired) {
        setRefreshingQuote(item.id);
        // Auto-refresh expired quote with live Shippo rates
        const w = item.weight || item.aiEstWeight || 5;
        const l = item.length || item.aiBoxDims?.length || 14;
        const wi = item.width || item.aiBoxDims?.width || 12;
        const h = item.height || item.aiBoxDims?.height || 8;
        fetchLiveRates(item.id, item.saleZip || "04901", sq.toZip, w, l, wi, h)
          .then((result) => {
            if (result.carriers.length > 0) {
              setWizardData((prev) => ({ ...prev, carriers: result.carriers, isLive: result.isLive }));
              onEstimate(item.id, result);
            }
          })
          .catch(() => {})
          .finally(() => setRefreshingQuote(null));
      }
    } else {
      setSelectedCarrier(est?.carriers?.[0] ?? null);
    }

    setWizardStep(startStep);
    setWizardData({
      weight: est?.weight ?? item.weight ?? item.aiEstWeight ?? 5,
      length: est?.box?.length ?? item.length ?? item.aiBoxDims?.length ?? "",
      width: est?.box?.width ?? item.width ?? item.aiBoxDims?.width ?? "",
      height: est?.box?.height ?? item.height ?? item.aiBoxDims?.height ?? "",
      isFragile: est?.isFragile ?? item.isFragile ?? false,
      fromZip: est?.fromZip ?? "04901",
      toZip: sq?.toZip || "",
      carriers: est?.carriers ?? [],
      insurance: (() => { try { return localStorage.getItem(`ll_insurance_${item.id}`) || "basic"; } catch { return "basic"; } })(),
    });
  }

  async function generateLabel(itemId: string) {
    const d = wizardData;
    const weight = Number(d.weight) || 5;
    const c = selectedCarrier || d.carriers?.[0];
    const carrier = c?.carrier || (weight > 40 ? "FedEx" : "USPS");
    const service = c?.service || (weight > 40 ? "FedEx Ground" : "Priority Mail");
    const days = c?.days ? parseInt(c.days) || 3 : weight > 40 ? 5 : 3;
    const rate = c?.price ?? (weight > 40 ? Math.round(weight * 0.85 * 100) / 100 : Math.round((6.95 + weight * 0.4) * 100) / 100);
    const insurance = d.insurance || "none";
    // Persist insurance preference
    try { localStorage.setItem(`ll_insurance_${itemId}`, insurance); } catch { /* ignore */ }
    setGenerating(itemId);
    try {
      const res = await fetch("/api/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          rateId: `auto-${carrier.toLowerCase().replace(/\s/g, "-")}-1`,
          carrier,
          service,
          weight,
          deliveryMethod: d.deliveryMethod === "pickup" ? "PICKUP" : d.deliveryMethod === "print" ? "PRINT" : "QR",
          estimatedDays: days,
          rateAmount: rate,
          insurance,
          fromAddress: { zip: d.fromZip || "04901" },
          toAddress: { zip: d.toZip || "" },
        }),
      });
      const labelData = await res.json();
      const trackNum = labelData.trackingNumber || generateTrackingNumber(itemId, carrier);
      setGeneratedLabel({
        itemId,
        data: {
          carrier,
          service,
          rate,
          trackingNumber: trackNum,
          fromZip: d.fromZip || "04901",
          toZip: d.toZip || "",
          weight,
        },
      });
      setWizardStep(4);
    } catch {
      // Demo fallback: still show label
      const trackNum = generateTrackingNumber(itemId, carrier);
      setGeneratedLabel({
        itemId,
        data: { carrier, service, rate, trackingNumber: trackNum, fromZip: d.fromZip || "04901", toZip: d.toZip || "", weight },
      });
      setWizardStep(4);
    }
    setGenerating(null);
  }

  async function fetchRatesForWizard() {
    if (!wizardItem || !wizardData.toZip) return;
    const w = Number(wizardData.weight) || 5;
    const l = Number(wizardData.length) || 14;
    const wi = Number(wizardData.width) || 12;
    const h = Number(wizardData.height) || 8;
    const result = await fetchLiveRates(wizardItem, wizardData.fromZip || "04901", wizardData.toZip, w, l, wi, h);
    if (result.carriers.length > 0) {
      setWizardData((prev) => ({ ...prev, carriers: result.carriers, isLive: result.isLive }));
      setSelectedCarrier(result.carriers[0] || null);
      onEstimate(wizardItem, result);
    }
  }

  if (items.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem", opacity: 0.4 }}>{"\u{1F4E6}"}</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nothing to Ship Yet</div>
        <div style={{ fontSize: "0.82rem", lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>When you sell an item, it will appear here ready for label generation and shipping. Save quotes in the Estimates tab to speed up the process.</div>
      </div>
    );

  const WIZARD_STEPS = ["Package", "Address", "Carrier", "Confirm"];
  const inputStyle: React.CSSProperties = {
    padding: "0.45rem 0.65rem",
    fontSize: "0.82rem",
    borderRadius: "0.4rem",
    border: "1px solid var(--border-default)",
    background: "var(--input-bg, var(--ghost-bg))",
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {items.map((item) => {
        const soldDays = item.soldAt ? Math.floor((Date.now() - new Date(item.soldAt).getTime()) / 86400000) : null;
        const isWizard = wizardItem === item.id;
        const isHighlight = highlightId === item.id;
        return (
          <div
            key={item.id}
            style={{
              borderRadius: "0.75rem",
              border: isHighlight
                ? "2px solid var(--accent)"
                : isWizard
                  ? "1px solid rgba(0,188,212,0.3)"
                  : "1px solid var(--border-default)",
              background: isHighlight ? "rgba(0,188,212,0.04)" : "var(--bg-card)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem" }}>
              {item.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photo} alt="" style={{ width: 56, height: 56, borderRadius: "0.4rem", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "0.4rem", background: "var(--ghost-bg)", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Link href={`/items/${item.id}`} style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", textDecoration: "none" }}>
                    {item.title}
                  </Link>
                  {soldDays != null && soldDays > 2 && (
                    <span
                      style={{
                        fontSize: "0.55rem",
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: "9999px",
                        background: soldDays > 5 ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                        color: soldDays > 5 ? "#ef4444" : "#f59e0b",
                      }}
                    >
                      {soldDays}d ago
                    </span>
                  )}
                </div>
                <ShipProfile item={item} />
                {!isWizard && <ShippingAIPanel item={item} />}
                {/* Saved quote from localStorage */}
                {savedQuotes[item.id] && !isWizard && (() => {
                  const sq = savedQuotes[item.id];
                  const c = sq.carrier;
                  return (
                    <div style={{ marginTop: "0.35rem", padding: "0.45rem 0.65rem", borderRadius: "0.4rem", background: sq.isFresh ? "rgba(34,197,94,0.04)" : sq.isExpiring ? "rgba(245,158,11,0.04)" : "rgba(239,68,68,0.04)", border: `1px solid ${sq.isFresh ? "rgba(34,197,94,0.15)" : sq.isExpiring ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.68rem", flexWrap: "wrap" }}>
                        <span>{"\u{1F4CB}"}</span>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c?.carrier || "?"} {c?.service || ""}</span>
                        <span style={{ color: "var(--text-muted)" }}>{"\u2014"}</span>
                        <span style={{ fontWeight: 700, color: "#4caf50" }}>${c?.price?.toFixed(2) ?? "?"}</span>
                        <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: sq.isFresh ? "rgba(34,197,94,0.12)" : sq.isExpiring ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)", color: sq.isFresh ? "#22c55e" : sq.isExpiring ? "#f59e0b" : "#ef4444" }}>
                          {sq.isFresh ? "\u2705 Fresh" : sq.isExpiring ? `\u26A0\uFE0F Expiring (${sq.ageHrs}h)` : `\u274C Expired (${sq.ageHrs}h)`}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        {c?.days ? `${c.days}d transit` : ""}{c?.days && sq.savedAt ? " \u00B7 " : ""}{sq.savedAt ? `saved ${new Date(sq.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}
                        {sq.savedAt && (() => {
                          const remainMs = 86400000 - (Date.now() - sq.savedAt);
                          if (remainMs > 0) {
                            const hrs = Math.floor(remainMs / 3600000);
                            const mins = Math.floor((remainMs % 3600000) / 60000);
                            return ` \u00B7 valid ~${hrs}h ${mins}m`;
                          }
                          return ` \u00B7 expired ${sq.ageHrs - 24}h ago`;
                        })()}
                      </div>
                    </div>
                  );
                })()}
                {/* Pre-loaded quote from API */}
                {!savedQuotes[item.id] && item.lastQuote && !isWizard && (
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    {"\u{1F4CB}"} {item.lastQuote.carriers?.length || 0} quotes {"\u00B7"} from ${item.lastQuote.cheapest?.price?.toFixed(2) ?? "?"} {"\u00B7"} {item.lastQuote.fromZip}{"\u2192"}{item.lastQuote.toZip || "?"}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                {(item.soldPrice || item.listingPrice) && (
                  <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.88rem" }}>${item.soldPrice || item.listingPrice}</span>
                )}
                {/* Ship Now with saved quote */}
                {savedQuotes[item.id] && !isWizard && (
                  <button
                    onClick={() => startWizard(item, true)}
                    disabled={generating === item.id}
                    style={{
                      padding: "0.45rem 1rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      borderRadius: "0.5rem",
                      border: "none",
                      background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                      color: "#fff",
                      cursor: "pointer",
                      opacity: generating === item.id ? 0.6 : 1,
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    {generating === item.id ? "..." : `\u{1F680} Ship Now \u2014 $${savedQuotes[item.id].carrier?.price?.toFixed(2) ?? "?"}`}
                  </button>
                )}
                {/* No saved quote — show generic ship button */}
                {!savedQuotes[item.id] && !isWizard && (
                  <button
                    onClick={() => startWizard(item)}
                    disabled={generating === item.id}
                    style={{
                      padding: "0.4rem 0.85rem",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      borderRadius: "0.5rem",
                      border: "none",
                      background: "linear-gradient(135deg, #00bcd4, #009688)",
                      color: "#fff",
                      cursor: "pointer",
                      opacity: generating === item.id ? 0.6 : 1,
                    }}
                  >
                    {generating === item.id ? "..." : "\u{1F4E6} Get Rates & Ship"}
                  </button>
                )}
                {/* Change carrier / new rates link */}
                {savedQuotes[item.id] && !isWizard && (
                  <button
                    onClick={() => startWizard(item)}
                    style={{ background: "none", border: "none", padding: 0, fontSize: "0.58rem", color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Change carrier / Get new rates
                  </button>
                )}
              </div>
            </div>

            {/* Wizard */}
            {isWizard && (
              <div style={{ borderTop: "1px solid var(--border-default)", padding: "1rem" }}>
                {/* Step indicator */}
                {wizardStep < 4 && (
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "1.25rem", position: "relative" }}>
                    {WIZARD_STEPS.map((s, i) => {
                      const step = i + 1;
                      const active = wizardStep === step;
                      const done = wizardStep > step;
                      return (
                        <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                          {/* Connecting line (before dot, skip first) */}
                          {i > 0 && (
                            <div style={{
                              position: "absolute",
                              left: "-50%",
                              right: "50%",
                              top: 8,
                              height: 2,
                              background: done || active ? "linear-gradient(90deg, #009688, #00bcd4)" : "var(--ghost-bg)",
                              zIndex: 0,
                            }} />
                          )}
                          <div style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.58rem",
                            fontWeight: 800,
                            background: active ? "linear-gradient(135deg, #00bcd4, #009688)" : done ? "#009688" : "var(--ghost-bg)",
                            color: active || done ? "#fff" : "var(--text-muted)",
                            border: active ? "2px solid #00bcd4" : "2px solid transparent",
                            boxShadow: active ? "0 0 6px rgba(0,188,212,0.4)" : "none",
                            transition: "all 0.2s ease",
                            zIndex: 1,
                            position: "relative",
                            marginBottom: 5,
                          }}>
                            {done ? "\u2713" : step}
                          </div>
                          <span style={{ fontSize: "0.62rem", fontWeight: active ? 700 : 400, color: active ? "var(--accent)" : done ? "var(--text-secondary)" : "var(--text-muted)" }}>
                            {s}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Step 1: Package */}
                {wizardStep === 1 && (
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Confirm Package Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      {[
                        { label: "Length", key: "length" },
                        { label: "Width", key: "width" },
                        { label: "Height", key: "height" },
                        { label: "Weight (lbs)", key: "weight" },
                      ].map((f) => (
                        <div key={f.key}>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{f.label}</div>
                          <input
                            value={(wizardData as any)[f.key]}
                            onChange={(e) => setWizardData((d) => ({ ...d, [f.key]: e.target.value }))}
                            placeholder={f.key === "weight" ? "lbs" : "in"}
                            style={inputStyle}
                          />
                        </div>
                      ))}
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "var(--text-muted)", cursor: "pointer", marginBottom: "0.75rem" }}>
                      <input type="checkbox" checked={wizardData.isFragile} onChange={(e) => setWizardData((d) => ({ ...d, isFragile: e.target.checked }))} /> Fragile item {"\u2014"} requires extra packaging
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setWizardItem(null)}
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setWizardStep(2)}
                        style={{ padding: "0.4rem 0.85rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: "#00bcd4", color: "#fff", cursor: "pointer" }}
                      >
                        {"Next \u2192"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Address */}
                {wizardStep === 2 && (
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Shipping Address</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>From ZIP</div>
                        <input value={wizardData.fromZip} onChange={(e) => setWizardData((d) => ({ ...d, fromZip: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Buyer City or ZIP</div>
                        <CitySearch value={wizardData.toZip} onChange={(zip) => setWizardData((d) => ({ ...d, toZip: zip }))} placeholder="Search city or ZIP..." />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setWizardStep(1)}
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
                      >
                        {"\u2190 Back"}
                      </button>
                      <button
                        onClick={() => {
                          fetchRatesForWizard();
                          setWizardStep(3);
                        }}
                        disabled={!wizardData.toZip}
                        style={{
                          padding: "0.4rem 0.85rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          borderRadius: "0.4rem",
                          border: "none",
                          background: "#00bcd4",
                          color: "#fff",
                          cursor: "pointer",
                          opacity: wizardData.toZip ? 1 : 0.5,
                        }}
                      >
                        {"Get Rates & Ship \u2192"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Carrier Select */}
                {wizardStep === 3 &&
                  (() => {
                    const carriers = (wizardData.carriers || []).filter((c: any) => c.price > 0).sort((a: any, b: any) => a.price - b.price);
                    const bySpeed = [...carriers].sort((a: any, b: any) => {
                      const aDays = parseInt(String(a.days)) || 99;
                      const bDays = parseInt(String(b.days)) || 99;
                      return aDays - bDays;
                    });
                    const fastestC = bySpeed[0];
                    const sc = selectedCarrier || carriers[0];
                    return (
                      <div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Select Carrier</div>
                        {refreshingQuote === item.id && (
                          <div style={{ padding: "0.45rem 0.65rem", borderRadius: "0.4rem", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: "0.5rem", fontSize: "0.68rem", color: "#f59e0b", fontWeight: 600 }}>
                            {"\u26A0\uFE0F"} Quote expired. Refreshing rates...
                          </div>
                        )}
                        {/* Package summary */}
                        <div
                          style={{
                            padding: "0.5rem 0.65rem",
                            borderRadius: "0.4rem",
                            background: "var(--ghost-bg)",
                            border: "1px solid var(--border-default)",
                            marginBottom: "0.6rem",
                            fontSize: "0.72rem",
                            display: "flex",
                            gap: "0.75rem",
                            flexWrap: "wrap",
                            color: "var(--text-muted)",
                          }}
                        >
                          <span>
                            {"\u{1F4E6}"} {Number(wizardData.weight) || 5} lbs
                            {wizardData.isFragile ? " \u00B7 FRAGILE" : ""}
                          </span>
                          <span>
                            {"\u{1F4CD}"} {wizardData.fromZip} {"\u2192"} {wizardData.toZip || "..."}
                          </span>
                        </div>
                        {/* Carrier selection */}
                        {carriers.length > 0 ? (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: "0.3rem", padding: "0.3rem 0.65rem", marginBottom: "0.2rem" }}>
                              {["Carrier", "Service", "Transit", "Cost"].map((h) => (
                                <div key={h} style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{h}</div>
                              ))}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                              {carriers.map((c: any, i: number) => {
                                const isSelected = sc && sc.carrier === c.carrier && sc.service === c.service;
                                const isBest = i === 0;
                                const isFastest = fastestC && c.carrier === fastestC.carrier && c.service === fastestC.service && !isBest;
                                return (
                                  <button
                                    key={`${c.carrier}-${c.service}-${i}`}
                                    onClick={() => setSelectedCarrier(c)}
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "2fr 2fr 1fr 1fr",
                                      gap: "0.3rem",
                                      alignItems: "center",
                                      padding: "0.5rem 0.65rem",
                                      borderRadius: "0.4rem",
                                      border: isSelected ? "1.5px solid var(--accent)" : "1px solid transparent",
                                      background: isSelected ? "rgba(0,188,212,0.08)" : i % 2 === 0 ? "var(--ghost-bg)" : "transparent",
                                      cursor: "pointer",
                                      textAlign: "left" as const,
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                      {isSelected && <span style={{ fontSize: "0.7rem", color: "var(--accent)" }}>{"\u2714"}</span>}
                                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.carrier}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{c.service}</span>
                                      {isBest && (
                                        <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(76,175,80,0.15)", color: "#4caf50" }}>BEST</span>
                                      )}
                                      {isFastest && (
                                        <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>FASTEST</span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.days}d</span>
                                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: isSelected ? "#4caf50" : "var(--text-primary)" }}>
                                      ${c.price.toFixed(2)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.75rem", fontStyle: "italic" }}>
                            Fetching carrier rates...
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setWizardStep(2)}
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
                          >
                            {"\u2190"} Back
                          </button>
                          <button
                            onClick={() => { if (sc) { setSelectedCarrier(sc); setWizardStep(4); } }}
                            disabled={!sc}
                            style={{
                              padding: "0.4rem 1rem",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              borderRadius: "0.4rem",
                              border: "none",
                              background: "linear-gradient(135deg, #00bcd4, #009688)",
                              color: "#fff",
                              cursor: "pointer",
                              opacity: !sc ? 0.5 : 1,
                            }}
                          >
                            {sc ? `Review ${sc.carrier} \u2014 $${sc.price.toFixed(2)} \u2192` : "Select Carrier"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                {/* Step 4: Shipment Summary & Confirm */}
                {wizardStep === 4 && !generatedLabel &&
                  (() => {
                    const sc = selectedCarrier;
                    if (!sc) return null;
                    const w = Number(wizardData.weight) || 5;
                    const dims = [wizardData.length, wizardData.width, wizardData.height].filter(Boolean).join("\u00D7");
                    return (
                      <div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>{"\u{1F4E6}"} Shipment Summary</div>
                        <div style={{
                          borderRadius: "0.65rem",
                          border: "1px solid var(--border-default)",
                          background: "var(--ghost-bg)",
                          padding: "1rem",
                          marginBottom: "0.75rem",
                        }}>
                          {/* Item */}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.6rem", paddingBottom: "0.6rem", borderBottom: "1px solid var(--border-default)" }}>
                            <span style={{ fontSize: "0.8rem" }}>{"\u{1F3F7}\uFE0F"}</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</span>
                          </div>
                          {/* Package */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.6rem", fontSize: "0.72rem" }}>
                            <div>
                              <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Package</div>
                              <div style={{ color: "var(--text-primary)" }}>{dims ? `${dims} in` : "Standard"} {"\u00B7"} {w} lbs</div>
                              {wizardData.isFragile && <div style={{ fontSize: "0.6rem", color: "#f59e0b", fontWeight: 600, marginTop: "0.1rem" }}>{"\u26A0\uFE0F"} Fragile</div>}
                            </div>
                            <div>
                              <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Route</div>
                              <div style={{ color: "var(--text-primary)" }}>{wizardData.fromZip} {"\u2192"} {wizardData.toZip || "?"}</div>
                            </div>
                          </div>
                          {/* Carrier */}
                          <div style={{ padding: "0.6rem", borderRadius: "0.4rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", marginBottom: "0.6rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.1rem" }}>Carrier</div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{sc.carrier} {sc.service}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4caf50" }}>${sc.price.toFixed(2)}</div>
                                <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{sc.days} business days</div>
                              </div>
                            </div>
                          </div>
                          {/* Insurance */}
                          <div style={{ marginBottom: "0.3rem" }}>
                            <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Insurance</div>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              {[
                                { value: "basic", label: "Basic $2.50", desc: "Up to $100 coverage" },
                                { value: "full", label: "Full $12.99", desc: "Full declared value" },
                                { value: "none", label: "None", desc: "No coverage" },
                              ].map((ins) => (
                                <button
                                  key={ins.value}
                                  onClick={() => setWizardData((d) => ({ ...d, insurance: ins.value }))}
                                  style={{
                                    flex: 1,
                                    padding: "0.4rem",
                                    borderRadius: "0.35rem",
                                    border: wizardData.insurance === ins.value ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                                    background: wizardData.insurance === ins.value ? "rgba(0,188,212,0.06)" : "transparent",
                                    cursor: "pointer",
                                    textAlign: "center",
                                  }}
                                >
                                  <div style={{ fontSize: "0.68rem", fontWeight: 600, color: wizardData.insurance === ins.value ? "var(--accent)" : "var(--text-primary)" }}>{ins.label}</div>
                                  <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>{ins.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Delivery Method */}
                          <div style={{ marginTop: "0.4rem" }}>
                            <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Label Delivery</div>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                              {[
                                { value: "qr", label: "QR Code", desc: "Scan to view label", icon: "\u{1F4F1}" },
                                { value: "print", label: "Print PDF", desc: "Print at home", icon: "\u{1F5A8}\uFE0F" },
                                { value: "pickup", label: "Schedule Pickup", desc: "Carrier comes to you", icon: "\u{1F69A}" },
                              ].map((dm) => (
                                <button
                                  key={dm.value}
                                  onClick={() => setWizardData((d) => ({ ...d, deliveryMethod: dm.value }))}
                                  style={{
                                    flex: 1, padding: "0.4rem", borderRadius: "0.35rem", cursor: "pointer", textAlign: "center",
                                    border: (wizardData.deliveryMethod || "qr") === dm.value ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                                    background: (wizardData.deliveryMethod || "qr") === dm.value ? "rgba(0,188,212,0.06)" : "transparent",
                                  }}
                                >
                                  <div style={{ fontSize: "0.75rem", marginBottom: "0.1rem" }}>{dm.icon}</div>
                                  <div style={{ fontSize: "0.62rem", fontWeight: 600, color: (wizardData.deliveryMethod || "qr") === dm.value ? "var(--accent)" : "var(--text-primary)" }}>{dm.label}</div>
                                  <div style={{ fontSize: "0.45rem", color: "var(--text-muted)" }}>{dm.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* Actions */}
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setWizardStep(3)}
                            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
                          >
                            {"\u2190"} Back
                          </button>
                          <button
                            onClick={() => generateLabel(item.id)}
                            disabled={generating === item.id}
                            style={{
                              padding: "0.5rem 1.25rem",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              borderRadius: "0.5rem",
                              border: "none",
                              background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                              color: "#fff",
                              cursor: generating === item.id ? "wait" : "pointer",
                              opacity: generating === item.id ? 0.6 : 1,
                            }}
                          >
                            {generating === item.id ? "Generating Label..." : `\u2705 Generate Label \u2014 $${sc.price.toFixed(2)}`}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                {/* Step 5: Label Generated — Celebration */}
                {wizardStep >= 4 && generatedLabel && generatedLabel.itemId === item.id && (
                  <div>
                    <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.15)", marginBottom: "0.75rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.5rem", marginBottom: "0.2rem" }}>{"\u{1F389}"}</div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "#4caf50" }}>Label Created!</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "0.4rem", fontSize: "0.68rem" }}>
                        <div><span style={{ color: "var(--text-muted)" }}>Carrier:</span> <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{generatedLabel.data.carrier}</span></div>
                        <div><span style={{ color: "var(--text-muted)" }}>Rate:</span> <span style={{ fontWeight: 700, color: "#4caf50" }}>${typeof generatedLabel.data.rate === "number" ? generatedLabel.data.rate.toFixed(2) : generatedLabel.data.rate}</span></div>
                        <div><span style={{ color: "var(--text-muted)" }}>Tracking:</span> <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "var(--text-primary)" }}>{generatedLabel.data.trackingNumber.slice(0, 12)}...</span></div>
                      </div>
                    </div>
                    <ShippingLabel
                      item={item}
                      carrier={generatedLabel.data.carrier}
                      service={generatedLabel.data.service}
                      rate={generatedLabel.data.rate}
                      trackingNumber={generatedLabel.data.trackingNumber}
                      fromZip={generatedLabel.data.fromZip}
                      toZip={generatedLabel.data.toZip}
                      weight={generatedLabel.data.weight}
                    />
                    {/* Enhanced post-label actions */}
                    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/items/status/${item.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "SHIPPED" }),
                              });
                            } catch {}
                            setWizardItem(null);
                            setGeneratedLabel(null);
                            onRefresh();
                          }}
                          style={{
                            padding: "0.45rem 1rem",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            borderRadius: "0.4rem",
                            border: "none",
                            background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {"\u{1F69A}"} Mark as Shipped
                        </button>
                        <button
                          onClick={() => window.print()}
                          style={{
                            padding: "0.45rem 0.85rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: "0.4rem",
                            border: "1px solid var(--border-default)",
                            background: "transparent",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {"\u{1F5A8}\uFE0F"} Print Label
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLabel.data.trackingNumber).catch(() => {});
                          }}
                          style={{
                            padding: "0.45rem 0.85rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            borderRadius: "0.4rem",
                            border: "1px solid var(--border-default)",
                            background: "transparent",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {"\u{1F4CB}"} Copy Tracking #
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <button
                          onClick={() => {
                            setWizardItem(null);
                            setGeneratedLabel(null);
                            onRefresh();
                            const event = new CustomEvent("shipping-tab-change", { detail: "shipped" });
                            window.dispatchEvent(event);
                          }}
                          style={{
                            background: "none", border: "none", padding: "0.3rem 0",
                            fontSize: "0.68rem", color: "var(--accent)", cursor: "pointer",
                            textAlign: "left", fontWeight: 600,
                          }}
                        >
                          View in Tracking Board {"\u2192"}
                        </button>
                        <a
                          href={`/items/${item.id}`}
                          style={{
                            fontSize: "0.68rem", color: "var(--text-muted)", textDecoration: "none",
                            padding: "0.3rem 0", fontWeight: 600,
                          }}
                        >
                          {"\u{1F4E6}"} View Item Dashboard {"\u2192"}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── I) Shipped Tab ──────────────────────────────────────────────────────────

function ShippedTab({ items, allData, freightBOL, pickupStatuses }: { items: any[]; allData?: ShipData; freightBOL?: any; pickupStatuses?: Record<string, any> }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [closingSale, setClosingSale] = useState<string | null>(null);
  const [closedSales, setClosedSales] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [boardRefreshTs, setBoardRefreshTs] = useState(new Date());

  const PARCEL_STEPS = ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
  const FREIGHT_STEPS = ["BOL_CREATED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
  const PICKUP_STEPS = ["INVITE_SENT", "CONFIRMED", "EN_ROUTE", "HANDED_OFF", "COMPLETED"];

  // Auto-update timestamp every 60s
  useEffect(() => {
    const interval = setInterval(() => setBoardRefreshTs(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Carrier branding colors
  const carrierBorderColor = (carrier: string) => {
    const c = (carrier || "").toUpperCase();
    if (c.includes("USPS")) return "#333366";
    if (c.includes("UPS")) return "#351c15";
    if (c.includes("FEDEX")) return "#4d148c";
    if (c.includes("DHL")) return "#FFCC00";
    return "var(--accent)";
  };

  function copyTracking(tn: string) {
    navigator.clipboard.writeText(tn).catch(() => {});
    setCopied(tn);
    setTimeout(() => setCopied(null), 2000);
    console.log(`[tracking-dashboard] Copied tracking: ${tn}`);
  }

  const getTrackingUrl = (carrier: string, tracking: string): string | null => {
    const c = (carrier || "").toLowerCase();
    if (c.includes("usps")) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${tracking}`;
    if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    if (c.includes("dhl")) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${tracking}`;
    return null;
  };

  async function closeSale(itemId: string) {
    setClosingSale(itemId);
    try {
      await fetch(`/api/items/status/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      setClosedSales(prev => new Set(prev).add(itemId));
      console.log(`[tracking-dashboard] Closed sale: ${itemId}`);
    } catch {}
    setClosingSale(null);
  }

  // Build unified shipments list: parcel + freight + pickup
  const pickupCompleted: any[] = [];
  const pickupActive: any[] = [];
  if (allData && pickupStatuses) {
    const allItems = [...(allData.preSale || []), ...(allData.readyToShip || [])];
    allItems.forEach((item) => {
      const ps = pickupStatuses[item.id];
      if (ps?.status === "COMPLETED") pickupCompleted.push({ ...item, pickupData: ps });
      else if (ps?.status && ps.status !== "COMPLETED") pickupActive.push({ ...item, pickupData: ps });
    });
  }

  // Normalize all shipment types into unified rows
  type BoardRow = {
    id: string;
    type: "parcel" | "freight" | "pickup";
    title: string;
    photo?: string;
    carrier: string;
    trackingId: string;
    status: string;
    normalizedStatus: string; // for filtering + sorting
    accentColor: string;
    eta: string | null;
    shipDate: string | null;
    weight: string;
    rate: string;
    fromAddress: any;
    toAddress: any;
    steps: string[];
    stepIndex: number;
    isDelivered: boolean;
    raw: any;
  };

  const parcelRows: BoardRow[] = items.map((item: any) => {
    const tn = item.trackingNumber || generateTrackingNumber(item.id, item.carrier || "USPS");
    const stepIdx = PARCEL_STEPS.indexOf(item.deliveryStatus);
    const estDate = item.estimatedDays && item.shipDate
      ? new Date(new Date(item.shipDate).getTime() + item.estimatedDays * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;
    return {
      id: item.id,
      type: "parcel" as const,
      title: item.title || "Item",
      photo: item.photo,
      carrier: item.carrier || "USPS",
      trackingId: tn,
      status: item.deliveryStatus || "CREATED",
      normalizedStatus: item.deliveryStatus || "CREATED",
      accentColor: carrierBorderColor(item.carrier),
      eta: estDate,
      shipDate: item.shipDate || null,
      weight: item.weight ? `${item.weight} lbs` : "",
      rate: item.rate ? `$${Number(item.rate).toFixed(2)}` : "",
      fromAddress: item.fromAddress,
      toAddress: item.toAddress,
      steps: PARCEL_STEPS,
      stepIndex: stepIdx >= 0 ? stepIdx : 0,
      isDelivered: item.deliveryStatus === "DELIVERED",
      raw: item,
    };
  });

  const freightRows: BoardRow[] = freightBOL ? [{
    id: `freight-${freightBOL.bolNumber || "bol"}`,
    type: "freight" as const,
    title: "Freight Shipment",
    photo: undefined,
    carrier: freightBOL.carrier || "LTL",
    trackingId: freightBOL.bolNumber ? `BOL: ${freightBOL.bolNumber}` : "Pending",
    status: freightBOL.trackingStatus || "BOL_CREATED",
    normalizedStatus: (() => {
      const s = freightBOL.trackingStatus || "BOL_CREATED";
      if (s === "DELIVERED") return "DELIVERED";
      if (s === "IN_TRANSIT") return "IN_TRANSIT";
      return "CREATED";
    })(),
    accentColor: "#9c27b0",
    eta: null,
    shipDate: null,
    weight: freightBOL.weight ? `${freightBOL.weight} lbs` : "",
    rate: freightBOL.rate ? `$${Number(freightBOL.rate).toFixed(2)}` : "",
    fromAddress: freightBOL.fromAddress || null,
    toAddress: freightBOL.toAddress || null,
    steps: FREIGHT_STEPS,
    stepIndex: FREIGHT_STEPS.indexOf(freightBOL.trackingStatus || "BOL_CREATED"),
    isDelivered: freightBOL.trackingStatus === "DELIVERED",
    raw: freightBOL,
  }] : [];

  const pickupRows: BoardRow[] = [...pickupActive, ...pickupCompleted].map((item: any) => {
    const ps = item.pickupData;
    const stepIdx = PICKUP_STEPS.indexOf(ps?.status || "");
    return {
      id: item.id,
      type: "pickup" as const,
      title: item.title || "Pickup Item",
      photo: item.photo,
      carrier: "Local Pickup",
      trackingId: ps?.handoffCode ? `CODE: ${ps.handoffCode}` : "Pending",
      status: ps?.status || "INVITE_SENT",
      normalizedStatus: (() => {
        const s = ps?.status || "INVITE_SENT";
        if (s === "COMPLETED") return "DELIVERED";
        if (s === "EN_ROUTE" || s === "HANDED_OFF") return "IN_TRANSIT";
        if (s === "CONFIRMED") return "OUT_FOR_DELIVERY";
        return "CREATED";
      })(),
      accentColor: "#ff9800",
      eta: ps?.scheduledAt ? new Date(ps.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null,
      shipDate: null,
      weight: "",
      rate: item.listingPrice ? `$${item.listingPrice}` : "",
      fromAddress: null,
      toAddress: null,
      steps: PICKUP_STEPS,
      stepIndex: stepIdx >= 0 ? stepIdx : 0,
      isDelivered: ps?.status === "COMPLETED",
      raw: item,
    };
  });

  // Combine and sort by status priority
  const allRows = [...parcelRows, ...freightRows, ...pickupRows];

  const getStatusPriority = (ns: string) => {
    if (ns === "EXCEPTION") return 0;
    if (ns === "OUT_FOR_DELIVERY") return 1;
    if (ns === "IN_TRANSIT" || ns === "PICKED_UP") return 2;
    if (ns === "CREATED") return 3;
    if (ns === "DELIVERED") return 4;
    return 5;
  };

  const sortedRows = [...allRows].sort((a, b) => getStatusPriority(a.normalizedStatus) - getStatusPriority(b.normalizedStatus));

  // Status counts for command header
  const counts = {
    inTransit: allRows.filter(r => r.normalizedStatus === "IN_TRANSIT" || r.normalizedStatus === "PICKED_UP").length,
    outForDelivery: allRows.filter(r => r.normalizedStatus === "OUT_FOR_DELIVERY").length,
    delivered: allRows.filter(r => r.normalizedStatus === "DELIVERED").length,
    exceptions: allRows.filter(r => r.normalizedStatus === "EXCEPTION").length,
  };

  // Filter rows by selected status
  const filteredRows = filterStatus
    ? sortedRows.filter(r => {
        if (filterStatus === "inTransit") return r.normalizedStatus === "IN_TRANSIT" || r.normalizedStatus === "PICKED_UP";
        if (filterStatus === "outForDelivery") return r.normalizedStatus === "OUT_FOR_DELIVERY";
        if (filterStatus === "delivered") return r.normalizedStatus === "DELIVERED";
        if (filterStatus === "exceptions") return r.normalizedStatus === "EXCEPTION";
        return true;
      })
    : sortedRows;

  // Empty state
  if (allRows.length === 0) {
    return (
      <div style={{ textAlign: "center" as const, padding: "3rem", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem", opacity: 0.4 }}>{"\u{1F4E1}"}</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>No Shipments Yet</div>
        <div style={{ fontSize: "0.82rem", lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>Your shipped and delivered items will be tracked here with real-time status updates, carrier tracking, and delivery confirmation.</div>
      </div>
    );
  }

  // Progress bar renderer
  function renderProgressBar(steps: string[], currentIndex: number, isDone: boolean) {
    const progress = currentIndex < 0 ? 0 : ((currentIndex + 1) / steps.length) * 100;
    return (
      <div style={{
        height: 4,
        borderRadius: 2,
        background: "rgba(0,188,212,0.1)",
        marginTop: "0.35rem",
        overflow: "hidden",
        position: "relative" as const,
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: isDone
            ? "linear-gradient(90deg, #00bcd4, #4caf50)"
            : "linear-gradient(90deg, #00bcd4, #00838f)",
          borderRadius: 2,
          transition: "width 0.4s ease",
        }} />
        {progress > 0 && progress < 100 && (
          <div style={{
            position: "absolute" as const,
            top: "50%",
            left: `${progress}%`,
            transform: "translate(-50%, -50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#00bcd4",
            boxShadow: "0 0 4px rgba(0,188,212,0.5)",
          }} />
        )}
      </div>
    );
  }

  // Render a single board row
  function renderBoardRow(row: BoardRow, idx: number) {
    const isExpanded = expandedRow === row.id;
    const isClosed = closedSales.has(row.id);
    const isException = row.normalizedStatus === "EXCEPTION";
    const typeIcon = row.type === "freight" ? "\u{1F69B}" : row.type === "pickup" ? "\u{1F91D}" : "\u{1F4E6}";
    const trackUrl = row.type === "parcel" ? getTrackingUrl(row.carrier, row.trackingId) : null;

    // ETA display
    let etaDisplay = "Pending";
    if (row.isDelivered) {
      etaDisplay = "\u2713 Done";
    } else if (row.eta) {
      // Check if "today" or "tomorrow"
      const etaDate = new Date(row.eta);
      const now = new Date();
      const diffDays = Math.floor((etaDate.getTime() - now.getTime()) / 86400000);
      if (diffDays === 0) etaDisplay = "Today";
      else if (diffDays === 1) etaDisplay = "Tomorrow";
      else etaDisplay = row.eta;
    }

    return (
      <div key={row.id}>
        {/* Row */}
        <div
          onClick={() => { setExpandedRow(isExpanded ? null : row.id); console.log(`[tracking-dashboard] ${isExpanded ? "Collapsed" : "Expanded"} row: ${row.id}`); }}
          style={{
            borderRadius: "0.5rem",
            overflow: "hidden",
            cursor: "pointer",
            borderLeft: `3px solid ${row.isDelivered ? "#4caf50" : isException ? "#f44336" : row.accentColor}`,
            background: idx % 2 === 0 ? "transparent" : "rgba(0,188,212,0.02)",
            transition: "all 0.2s ease",
            marginBottom: "0.35rem",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "rgba(0,188,212,0.04)";
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1.005)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = idx % 2 === 0 ? "transparent" : "rgba(0,188,212,0.02)";
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          }}
        >
          {/* Main row content */}
          <div style={{
            padding: "0.75rem 0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}>
            {/* Thumbnail */}
            {row.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.photo} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: 4,
                background: row.type === "freight" ? "rgba(156,39,176,0.08)" : row.type === "pickup" ? "rgba(255,152,0,0.08)" : "rgba(0,188,212,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.85rem", flexShrink: 0,
              }}>
                {typeIcon}
              </div>
            )}

            {/* Item info + progress bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
              }}>
                {row.type !== "parcel" && (
                  <span style={{ fontSize: "0.65rem" }}>{typeIcon}</span>
                )}
                <span style={{
                  fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                  maxWidth: "260px",
                }}>
                  {row.title}
                </span>
              </div>
              {renderProgressBar(row.steps, row.stepIndex, row.isDelivered)}
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                {row.fromAddress?.city && row.toAddress?.city
                  ? `${row.fromAddress.city}, ${row.fromAddress.state || ""} \u2192 ${row.toAddress.city}, ${row.toAddress.state || ""}`
                  : row.type === "pickup" ? "Local pickup" : row.type === "freight" ? "LTL Freight" : ""}
              </div>
            </div>

            {/* Carrier badge */}
            <div style={{
              padding: "2px 6px", fontSize: "0.62rem", fontWeight: 600,
              fontFamily: "monospace", border: `1px solid ${row.accentColor}`,
              borderRadius: 3, color: row.accentColor, whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}>
              {row.type === "freight" ? "LTL" : row.type === "pickup" ? "LOCAL" : row.carrier.toUpperCase().substring(0, 4)}
            </div>

            {/* Tracking / BOL / Code */}
            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", flexShrink: 0 }}>
              {trackUrl ? (
                <a
                  href={trackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: "0.65rem", fontFamily: "monospace",
                    color: "var(--accent)", textDecoration: "none",
                  }}
                >
                  {row.trackingId.length > 14 ? row.trackingId.substring(0, 14) + "\u2026" : row.trackingId}{"\u2197"}
                </a>
              ) : (
                <span style={{
                  fontSize: "0.65rem", fontFamily: "monospace",
                  color: row.type === "freight" ? "#9c27b0" : row.type === "pickup" ? "#ff9800" : "var(--text-muted)",
                }}>
                  {row.trackingId}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); copyTracking(row.trackingId); }}
                style={{
                  padding: "1px 3px", fontSize: "0.55rem",
                  border: "1px solid rgba(0,188,212,0.2)", borderRadius: 2,
                  background: "transparent",
                  color: copied === row.trackingId ? "#4caf50" : "var(--text-muted)",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                {copied === row.trackingId ? "\u2713" : "\u{1F4CB}"}
              </button>
            </div>

            {/* Status badge */}
            <StatusBadge status={row.status} />

            {/* ETA */}
            <div style={{
              fontSize: "0.75rem", fontWeight: 600,
              color: row.isDelivered ? "#4caf50" : "var(--text-muted)",
              whiteSpace: "nowrap" as const, minWidth: "50px", textAlign: "right" as const,
              flexShrink: 0,
            }}>
              {etaDisplay}
            </div>

            {/* Expand chevron */}
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", flexShrink: 0 }}>
              {isExpanded ? "\u25B2" : "\u25BC"}
            </span>
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div style={{
              padding: "0.65rem 0.9rem 0.75rem",
              background: "rgba(0,188,212,0.02)",
              borderTop: "1px solid rgba(0,188,212,0.08)",
              fontSize: "0.72rem",
            }}>
              {/* Address row */}
              {(row.fromAddress || row.toAddress) && (
                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.5rem" }}>
                  <AddressDisplay label="FROM" address={row.fromAddress} />
                  <AddressDisplay label="TO" address={row.toAddress} />
                </div>
              )}

              {/* Details row */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                {row.weight && <span>Weight: {row.weight}</span>}
                {row.rate && <span>Rate: {row.rate}</span>}
                {row.shipDate && <span>Shipped: {row.shipDate}</span>}
                {row.type === "pickup" && row.raw?.pickupData?.scheduledAt && (
                  <span>Scheduled: {new Date(row.raw.pickupData.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                )}
                {row.type === "pickup" && row.raw?.pickupData?.handoffCode && (
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>Handoff Code: {row.raw.pickupData.handoffCode}</span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
                {row.type === "parcel" && (() => {
                  const url = getTrackingUrl(row.carrier, row.trackingId);
                  if (!url) return null;
                  const cUp = row.carrier.toUpperCase();
                  const tColor = cUp.includes("USPS") ? "#333366" : cUp.includes("UPS") ? "#351c15" : cUp.includes("FEDEX") ? "#4d148c" : "var(--accent)";
                  return (
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(url, "_blank"); }}
                      style={{
                        padding: "4px 8px", fontSize: "0.62rem", fontWeight: 600,
                        border: `1px solid ${tColor}`, borderRadius: 3,
                        background: "transparent", color: tColor, cursor: "pointer",
                      }}
                    >
                      Track on {row.carrier.split(" ")[0]} {"\u2197"}
                    </button>
                  );
                })()}
                {row.isDelivered && !isClosed && (
                  <button
                    onClick={(e) => { e.stopPropagation(); closeSale(row.id); }}
                    disabled={closingSale === row.id}
                    style={{
                      padding: "4px 8px", fontSize: "0.62rem", fontWeight: 600,
                      border: "1px solid #4caf50", borderRadius: 3,
                      background: "rgba(76,175,80,0.1)", color: "#4caf50",
                      cursor: closingSale === row.id ? "wait" : "pointer",
                      opacity: closingSale === row.id ? 0.6 : 1,
                    }}
                  >
                    {closingSale === row.id ? "Closing..." : "\u2713 Close Sale"}
                  </button>
                )}
                {isClosed && (
                  <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "#4caf50" }}>{"\u2705"} Sale completed</span>
                )}
                {row.type === "parcel" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedRow(isExpanded ? null : row.id); }}
                    style={{
                      padding: "4px 8px", fontSize: "0.62rem", fontWeight: 600,
                      border: "1px solid var(--border-default)", borderRadius: 3,
                      background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                    }}
                  >
                    {"\u{1F3F7}\uFE0F"} View Label
                  </button>
                )}
              </div>

              {/* Inline label for parcel when expanded */}
              {row.type === "parcel" && (
                <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "center" }}>
                  <ShippingLabel
                    item={row.raw}
                    carrier={row.carrier}
                    service={row.raw.deliveryMethod || "Standard"}
                    rate={row.raw.rate || 0}
                    trackingNumber={row.trackingId}
                    fromZip="04901"
                    toZip={row.toAddress?.zip || row.raw.buyerZip || ""}
                    weight={row.raw.weight || 5}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  console.log(`[tracking-dashboard] Board render: ${allRows.length} total (${parcelRows.length} parcel, ${freightRows.length} freight, ${pickupRows.length} pickup)`);

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.75rem" }}>
      {/* Scan line keyframes */}
      <style>{`@keyframes ll-scan { 0% { top: 0; } 100% { top: 100%; } }`}</style>

      {/* ─── TRACKING COMMAND HEADER ─── */}
      <div style={{
        padding: "0.85rem 1rem",
        borderRadius: "0.75rem",
        background: "linear-gradient(135deg, rgba(0,188,212,0.04), rgba(0,150,136,0.03))",
        border: "1px solid rgba(0,188,212,0.12)",
        position: "relative" as const,
        overflow: "hidden",
      }}>
        {/* Scan line animation */}
        <div style={{
          position: "absolute" as const,
          left: 0, right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,188,212,0.3), transparent)",
          animation: "ll-scan 3s ease-in-out infinite",
          top: 0,
        }} />

        {/* Title row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "0.6rem",
        }}>
          <span style={{
            fontSize: "0.9rem", fontWeight: 700,
            letterSpacing: "0.08em", color: "var(--text-primary)",
          }}>
            {"\u{1F4E1}"} SHIPMENT TRACKING
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{
              fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "monospace",
            }}>
              Last: {boardRefreshTs.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={() => { setBoardRefreshTs(new Date()); console.log("[tracking-dashboard] Manual refresh"); }}
              style={{
                padding: "4px 8px", fontSize: "0.62rem", fontWeight: 600,
                border: "1px solid rgba(0,188,212,0.2)", borderRadius: 3,
                background: "rgba(0,188,212,0.08)", color: "var(--accent)",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,188,212,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,188,212,0.08)"; }}
            >
              {"\u{1F504}"} Refresh
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(0,188,212,0.08)", marginBottom: "0.6rem" }} />

        {/* Status counts row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
          {[
            { key: "inTransit", icon: "\u{1F7E2}", label: "In Transit", count: counts.inTransit },
            { key: "outForDelivery", icon: "\u{1F7E0}", label: "Out for Delivery", count: counts.outForDelivery },
            { key: "delivered", icon: "\u2705", label: "Delivered", count: counts.delivered },
            { key: "exceptions", icon: "\u26A0\uFE0F", label: "Exceptions", count: counts.exceptions },
          ].map((status) => (
            <button
              key={status.key}
              onClick={() => {
                setFilterStatus(filterStatus === status.key ? null : status.key);
                console.log(`[tracking-dashboard] Filter: ${filterStatus === status.key ? "cleared" : status.key}`);
              }}
              style={{
                padding: "0.5rem 0.6rem",
                textAlign: "center" as const,
                fontSize: "0.7rem",
                fontWeight: 600,
                border: filterStatus === status.key ? "1px solid var(--accent)" : "1px solid rgba(0,188,212,0.15)",
                borderRadius: 4,
                background: filterStatus === status.key ? "rgba(0,188,212,0.15)" : "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "monospace",
              }}
              onMouseEnter={(e) => {
                if (filterStatus !== status.key) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,188,212,0.06)";
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== status.key) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <div>{status.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{status.count}</div>
              <div style={{ fontSize: "0.48rem", marginTop: 2, opacity: 0.8, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{status.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active filter indicator */}
      {filterStatus && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          fontSize: "0.68rem", color: "var(--text-muted)",
        }}>
          <span>Showing: <strong style={{ color: "var(--accent)" }}>{filterStatus === "inTransit" ? "In Transit" : filterStatus === "outForDelivery" ? "Out for Delivery" : filterStatus === "delivered" ? "Delivered" : "Exceptions"}</strong></span>
          <button
            onClick={() => setFilterStatus(null)}
            style={{
              fontSize: "0.55rem", padding: "1px 4px", borderRadius: 3,
              border: "1px solid var(--border-default)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer",
            }}
          >
            {"\u2715"} Clear
          </button>
          <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: "var(--text-muted)" }}>
            {filteredRows.length} of {allRows.length} shipments
          </span>
        </div>
      )}

      {/* ─── FLIGHT BOARD ─── */}
      <div>
        {/* Column header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          padding: "0.35rem 0.9rem 0.35rem calc(0.9rem + 3px)",
          fontSize: "0.48rem", fontWeight: 700,
          textTransform: "uppercase" as const, letterSpacing: "0.08em",
          color: "var(--text-muted)", borderBottom: "1px solid var(--border-default)",
          marginBottom: "0.3rem",
        }}>
          <div style={{ width: 40, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>Item</div>
          <div style={{ width: 40, flexShrink: 0, textAlign: "center" as const }}>Carrier</div>
          <div style={{ width: 120, flexShrink: 0 }}>Tracking</div>
          <div style={{ width: 80, flexShrink: 0 }}>Status</div>
          <div style={{ width: 50, flexShrink: 0, textAlign: "right" as const }}>ETA</div>
          <div style={{ width: 12, flexShrink: 0 }} />
        </div>

        {/* Rows */}
        {filteredRows.length === 0 ? (
          <div style={{ textAlign: "center" as const, padding: "2rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            No shipments match this filter.
          </div>
        ) : (
          filteredRows.map((row, idx) => renderBoardRow(row, idx))
        )}
      </div>
    </div>
  );
}

// ─── J) Freight Tab ──────────────────────────────────────────────────────────

function calcFreightClass(w: number, l: number, wi: number, h: number): string {
  const cubicFt = (l * wi * h) / 1728;
  const density = cubicFt > 0 ? w / cubicFt : 0;
  if (density >= 50) return "50";
  if (density >= 35) return "55";
  if (density >= 30) return "60";
  if (density >= 22.5) return "65";
  if (density >= 15) return "70";
  if (density >= 13.5) return "77.5";
  if (density >= 12) return "85";
  if (density >= 10.5) return "92.5";
  if (density >= 9) return "100";
  if (density >= 8) return "110";
  if (density >= 7) return "125";
  if (density >= 6) return "150";
  if (density >= 5) return "175";
  if (density >= 4) return "200";
  if (density >= 3) return "250";
  if (density >= 2) return "300";
  if (density >= 1) return "400";
  return "500";
}

function FreightTab({ items }: { items: any[] }) {
  const heavyItem = items?.find((i) => (i.weight || 0) > 40);
  const aiAutoFilled = !!(heavyItem?.aiWeightLbs && !heavyItem?.weight) || !!(heavyItem?.aiDimsEstimate && !heavyItem?.length);
  const [form, setForm] = useState(() => {
    // Parse AI dims if available: "34 x 24 x 30" → { l, w, h }
    const parseDim = (dims: string | null | undefined, part: "l" | "w" | "h"): string => {
      if (!dims) return part === "l" ? "48" : part === "w" ? "40" : "36";
      const m = dims.match(/(\d+(?:\.\d+)?)\s*[x\u00D7X]\s*(\d+(?:\.\d+)?)\s*[x\u00D7X]\s*(\d+(?:\.\d+)?)/);
      if (!m) return part === "l" ? "48" : part === "w" ? "40" : "36";
      return part === "l" ? m[1] : part === "w" ? m[2] : m[3];
    };
    return {
      weight: heavyItem?.weight ? String(heavyItem.weight)
        : heavyItem?.aiWeightLbs ? String(heavyItem.aiWeightLbs) : "",
      length: heavyItem?.length ? String(heavyItem.length)
        : heavyItem?.aiDimsEstimate ? parseDim(heavyItem.aiDimsEstimate, "l") : "48",
      width: heavyItem?.width ? String(heavyItem.width)
        : heavyItem?.aiDimsEstimate ? parseDim(heavyItem.aiDimsEstimate, "w") : "40",
      height: heavyItem?.height ? String(heavyItem.height)
        : heavyItem?.aiDimsEstimate ? parseDim(heavyItem.aiDimsEstimate, "h") : "36",
      fromZip: "04901",
      toZip: "",
      accessNotes: "",
      packaging: "palletized",
    };
  });
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [selectedFreight, setSelectedFreight] = useState<any>(null);
  const [accessorials, setAccessorials] = useState({
    residential: false,
    liftgate: false,
    notification: false,
    blanketWrap: false,
    insideDelivery: false,
  });
  // Arta quote state
  const [artaQuoteData, setArtaQuoteData] = useState<any>(null);
  const [loadingArtaQuote, setLoadingArtaQuote] = useState(false);
  const [artaQuoteError, setArtaQuoteError] = useState("");

  const getArtaQuote = async (item: any) => {
    setLoadingArtaQuote(true);
    setArtaQuoteError("");
    try {
      const res = await fetch("/api/shipping/arta-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: {
            id: item.id,
            title: item.title,
            isPremium: item.isPremium,
            isHighValue: item.isHighValue,
            isAntique: item.isAntique,
            isFragile: item.isFragile,
            value: item.listingPrice || 500,
          },
          fromZip: form.fromZip || "04901",
          toZip: form.toZip,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log("[arta] Quote received:", data);
        setArtaQuoteData(data);
      } else {
        setArtaQuoteError(data.error || "Failed to fetch Arta quote");
      }
    } catch (err) {
      console.error("[arta] Error:", err);
      setArtaQuoteError("Failed to fetch Arta quote");
    } finally {
      setLoadingArtaQuote(false);
    }
  };

  // Official Quote Upload state
  const [showQuoteUpload, setShowQuoteUpload] = useState(false);
  const [officialQuote, setOfficialQuote] = useState<any>(null);
  const [officialQuoteForm, setOfficialQuoteForm] = useState({
    quoteNumber: "",
    carrier: "",
    rate: "",
    transit: "",
    pickupDate: "",
    instructions: "",
  });
  // BOL state
  const [showBOL, setShowBOL] = useState(false);
  const [bolGenerated, setBolGenerated] = useState<any>(null);
  const [bolForm, setBolForm] = useState({
    // Shipper
    shipperName: "LegacyLoop Seller",
    shipperStreet: "",
    shipperCity: "Portland",
    shipperState: "ME",
    shipperZip: "04901",
    shipperContact: "",
    shipperPhone: "",
    shipperEmail: "",
    shipperSID: "",
    // Consignee
    consigneeName: "",
    consigneeStreet: "",
    consigneeCity: "",
    consigneeState: "",
    consigneeZip: "",
    consigneeContact: "",
    consigneePhone: "",
    consigneeEmail: "",
    consigneeCID: "",
    // Billing
    billTo: "SHIPPER",
    thirdPartyCompany: "",
    thirdPartyAddress: "",
    thirdPartyPhone: "",
    // Shipment
    pieces: "1",
    packageType: "Pallet",
    totalWeight: "",
    dimensions: "",
    freightClass: "",
    freightClassOverride: "",
    nmfc: "",
    commodityDesc: "",
    hazmat: false,
    // Special services
    svcResidential: false,
    svcLiftgateDelivery: false,
    svcLiftgatePickup: false,
    svcInsideDelivery: false,
    svcDeliveryNotification: false,
    svcBlanketWrap: false,
    svcWhiteGlove: false,
    svcAppointment: false,
    svcSortSegregate: false,
    // References
    poNumber: "",
    proNumber: "",
    refNotes: "",
  });
  // BOL Tracking state
  const [bolTracking, setBolTracking] = useState<{ status: string; proNumber: string; events: { status: string; date: string }[] } | null>(null);

  // BOL localStorage key — per item
  const bolKey = `ll_freight_bol_${heavyItem?.id || "latest"}`;

  // Restore BOL from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(bolKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.bolGenerated) setBolGenerated(saved.bolGenerated);
        if (saved.bolTracking) setBolTracking(saved.bolTracking);
        if (saved.officialQuote) setOfficialQuote(saved.officialQuote);
        if (saved.confirmation) setConfirmation(saved.confirmation);
      }
    } catch { /* ignore */ }
  }, [bolKey]);

  // Persist BOL to localStorage whenever it changes
  useEffect(() => {
    if (bolGenerated || bolTracking) {
      try {
        localStorage.setItem(bolKey, JSON.stringify({ bolGenerated, bolTracking, officialQuote, confirmation }));
      } catch { /* ignore */ }
    }
  }, [bolGenerated, bolTracking, officialQuote, confirmation, bolKey]);

  const accessorialTotal =
    (accessorials.residential ? 85 : 0) +
    (accessorials.liftgate ? 90 : 0) +
    (accessorials.notification ? 12 : 0) +
    (accessorials.blanketWrap ? 75 : 0) +
    (accessorials.insideDelivery ? 150 : 0);

  const inputStyle: React.CSSProperties = {
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--border-default)",
    background: "var(--input-bg, var(--ghost-bg))",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    width: "100%",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  };

  // Unified quote function — calls /api/shipping/ltl-quote (ShipEngine + FedEx + fallback)
  async function getQuote() {
    setLoading(true);
    try {
      const cW = Number(form.weight) || 80;
      const cL = Number(form.length) || 48;
      const cWi = Number(form.width) || 40;
      const cH = Number(form.height) || 36;
      const fc = calcFreightClass(cW, cL, cWi, cH);
      const res = await fetch("/api/shipping/ltl-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromZip: form.fromZip, toZip: form.toZip, weight: cW, length: cL, width: cWi, height: cH, packaging: form.packaging, freightClass: fc }),
      });
      const data = await res.json();
      if (data.quotes?.length > 0) {
        const calcClass = fc;
        const calcDensity = ((cL * cWi * cH) / 1728) > 0 ? (cW / ((cL * cWi * cH) / 1728)).toFixed(1) : "0";
        setQuote({
          freightClass: calcClass,
          density: calcDensity,
          cubicFeet: ((cL * cWi * cH) / 1728).toFixed(1),
          carriers: data.quotes.map((q: any) => ({
            carrier: q.carrier,
            service: q.service,
            price: q.total_amount,
            transit: `${q.transit_days} days`,
            guaranteed: false,
            isLive: q.isLive,
            quoteId: q.quote_id,
            source: q.source || "demo",
          })),
          isLive: data.isLive,
        });
        setSelectedFreight(null);
      }
    } catch {}
    setLoading(false);
  }

  async function schedulePickup(carrier: string) {
    if (!pickupDate) return;
    setScheduling(true);
    try {
      const r = await fetch("/api/shipping/freight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", carrier, pickupDate }),
      });
      const d = await r.json();
      if (d.confirmed) setConfirmation({ ...d, selectedCarrier: carrier, selectedQuote: selectedFreight });
    } catch {}
    setScheduling(false);
  }

  // Find cheapest and fastest from quote carriers
  const sortedCarriers = quote?.carriers?.slice().sort((a: any, b: any) => a.price - b.price) ?? [];
  const byTransit = quote?.carriers?.slice().sort((a: any, b: any) => {
    const aDays = parseInt(a.transit) || 99;
    const bDays = parseInt(b.transit) || 99;
    return aDays - bDays;
  }) ?? [];
  const fastestFreight = byTransit[0];

  const [freightQuoteVer, setFreightQuoteVer] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Saved Freight Quotes — Horizontal Card Layout */}
      {(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        freightQuoteVer; // trigger re-render on delete
        const allSaved = getAllSavedQuotes();
        const ltlQuotes = allSaved.flatMap(({ itemId, quotes }) =>
          quotes.filter(q => q.type === "ltl").map(q => ({ ...q, itemId }))
        );
        if (ltlQuotes.length === 0) return null;
        return (
          <div style={{
            borderRadius: "0.75rem",
            background: "rgba(156,39,176,0.03)", border: "1px solid rgba(156,39,176,0.12)",
            overflow: "hidden",
            padding: "0.6rem 0.85rem 0.75rem",
          }}>
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                {"\u{1F4BE}"} Saved Quotes ({ltlQuotes.length})
              </span>
              {ltlQuotes.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all saved quotes?")) {
                      ltlQuotes.forEach((q: any) => deleteQuote(q.itemId, q.quoteKey));
                      setFreightQuoteVer(v => v + 1);
                      console.log("[SavedQuotes] Cleared all saved quotes");
                    }
                  }}
                  style={{
                    fontSize: "0.55rem",
                    padding: "2px 6px",
                    borderRadius: "0.3rem",
                    background: "rgba(244,67,54,0.1)",
                    color: "#f44336",
                    border: "1px solid rgba(244,67,54,0.2)",
                    cursor: "pointer",
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap" as const,
            }}>
              {ltlQuotes.slice(0, 3).map((q: any) => (
                <div
                  key={`${q.itemId}-${q.quoteKey}`}
                  style={{
                    flex: "0 1 calc(33.333% - 0.35rem)",
                    minWidth: "140px",
                    padding: "0.5rem 0.6rem",
                    borderRadius: "0.5rem",
                    background: "rgba(255,193,7,0.06)",
                    border: "1.5px solid rgba(255,193,7,0.25)",
                    display: "flex",
                    flexDirection: "column" as const,
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {q.carrier}
                      </span>
                      {q.isLive && <span style={{ fontSize: "0.42rem", fontWeight: 700, padding: "1px 3px", borderRadius: "9999px", background: "rgba(76,175,80,0.12)", color: "#4caf50" }}>LIVE</span>}
                    </div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ffc107", marginBottom: "0.15rem" }}>
                      ${Number(q.amount).toFixed(0)}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
                      {q.transit || "?"} {"\u00B7"} {q.service || ""}
                    </div>
                    <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      {q.itemTitle || q.itemId.slice(0, 8)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.35rem" }}>
                    <a
                      href={`/items/${q.itemId}`}
                      style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
                    >
                      Use {"\u2192"}
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuote(q.itemId, q.quoteKey);
                        setFreightQuoteVer(v => v + 1);
                        console.log("[SavedQuotes] Removed quote", q.quoteKey);
                      }}
                      style={{
                        fontSize: "0.5rem",
                        padding: "2px 4px",
                        borderRadius: "0.2rem",
                        background: "rgba(244,67,54,0.1)",
                        color: "#f44336",
                        border: "none",
                        cursor: "pointer",
                        marginLeft: "auto",
                      }}
                    >
                      {"\u{1F5D1}"} Remove
                    </button>
                  </div>
                </div>
              ))}
              {ltlQuotes.length > 3 && (
                <div
                  style={{
                    flex: "0 1 calc(33.333% - 0.35rem)",
                    minWidth: "140px",
                    padding: "0.5rem 0.6rem",
                    borderRadius: "0.5rem",
                    background: "rgba(0,188,212,0.04)",
                    border: "1px solid rgba(0,188,212,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    cursor: "default",
                  }}
                >
                  +{ltlQuotes.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div
        style={{
          background: "rgba(156,39,176,0.06)",
          border: "1px solid rgba(156,39,176,0.15)",
          borderRadius: "1rem",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>{"\u{1F69B}"}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#ce93d8" }}>LTL Freight Shipping</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            For furniture, appliances, and items over 40 lbs.{heavyItem ? ` Pre-filled from "${heavyItem.title}".` : ""}
          </div>
        </div>
      </div>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "1rem", padding: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
          {[
            { l: "Length", k: "length" },
            { l: "Width", k: "width" },
            { l: "Height", k: "height" },
            { l: "Weight (lbs)", k: "weight" },
          ].map((f) => (
            <div key={f.k}>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{f.l}</div>
              <input value={(form as any)[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.k === "weight" ? "e.g. 85" : ""} style={inputStyle} />
            </div>
          ))}
        </div>
        {aiAutoFilled && (
          <div style={{ fontSize: "0.62rem", color: "var(--accent)", fontStyle: "italic", marginBottom: "0.3rem" }}>
            {"\u{1F916}"} Dimensions auto-filled from AI analysis. Verify before quoting.
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>From ZIP</div>
            <input value={form.fromZip} onChange={(e) => setForm({ ...form, fromZip: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>To ZIP</div>
            <input value={form.toZip} onChange={(e) => setForm({ ...form, toZip: e.target.value })} placeholder="Buyer" style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Packaging</div>
            <select value={form.packaging} onChange={(e) => setForm({ ...form, packaging: e.target.value })} style={inputStyle}>
              <option value="palletized">Palletized</option>
              <option value="crated">Crated</option>
              <option value="blanket">Blanket Wrap</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Access</div>
            <input value={form.accessNotes} onChange={(e) => setForm({ ...form, accessNotes: e.target.value })} placeholder="Ground, stairs..." style={inputStyle} />
          </div>
        </div>
        {/* Accessorial toggles */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.65rem" }}>
          {([
            { key: "residential", label: "\u{1F3E0} Residential", range: "$75\u201395" },
            { key: "liftgate", label: "\u{1F4E6} Liftgate", range: "$85\u201395" },
            { key: "notification", label: "\u{1F514} Notification", range: "$10\u201315" },
            { key: "blanketWrap", label: "\u{1FAE7} Blanket Wrap", range: "+$75" },
            { key: "insideDelivery", label: "\u{1F6AA} Inside Delivery", range: "+$150" },
          ] as { key: keyof typeof accessorials; label: string; range: string }[]).map((ac) => {
            const on = accessorials[ac.key];
            return (
              <button
                key={ac.key}
                onClick={() => setAccessorials((prev) => ({ ...prev, [ac.key]: !on }))}
                style={{
                  display: "flex", alignItems: "center", gap: "0.25rem",
                  padding: "0.25rem 0.55rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                  border: on ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                  background: on ? "rgba(0,188,212,0.08)" : "transparent",
                  color: on ? "var(--accent)" : "var(--text-muted)",
                  transition: "all 0.15s ease",
                }}
              >
                {ac.label} <span style={{ fontSize: "0.52rem", opacity: 0.7 }}>{ac.range}</span>
              </button>
            );
          })}
          {accessorialTotal > 0 && (
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#f59e0b", alignSelf: "center" }}>+${accessorialTotal} accessorials</span>
          )}
        </div>
        <button
          onClick={getQuote}
          disabled={loading || !form.weight || !form.toZip}
          style={{
            width: "100%",
            padding: "0.6rem 1.25rem",
            fontSize: "0.88rem",
            fontWeight: 700,
            borderRadius: "0.5rem",
            border: "none",
            background: "linear-gradient(135deg, #00bcd4, #009688)",
            color: "#fff",
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !form.weight || !form.toZip ? 0.5 : 1,
            boxShadow: "0 4px 16px rgba(0,188,212,0.15)",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "Getting Quotes from All Carriers..." : "\u{1F4E1} Get Freight Quotes"}
        </button>
      </div>

      {/* Quote results with carrier selection */}
      {quote && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {[
              { l: "Class", v: quote.freightClass, c: "var(--accent)" },
              { l: "Density", v: `${quote.density} lbs/ft\u00B3`, c: "var(--text-primary)" },
              { l: "Volume", v: `${quote.cubicFeet} ft\u00B3`, c: "var(--text-primary)" },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{s.l}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: s.c }}>{s.v}</div>
              </div>
            ))}
            <span style={{ alignSelf: "center", fontSize: "0.5rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(0,188,212,0.08)", color: "var(--text-muted)" }}>AI Class: {quote.freightClass} ({quote.density} lbs/ft{"\u00B3"})</span>
            {quote.isLive && <span style={{ alignSelf: "center", fontSize: "0.5rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "#00bcd4" }}>LIVE RATES</span>}
            {!quote.isLive && <span style={{ alignSelf: "center", fontSize: "0.5rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(255,152,0,0.12)", color: "#ff9800" }}>ESTIMATED</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {sortedCarriers.map((c: any, i: number) => {
              const isBest = i === 0;
              const isFastest = fastestFreight && c.carrier === fastestFreight.carrier && !isBest;
              const isSelected = selectedFreight?.carrier === c.carrier;
              const isFedEx = c.source === "fedex" || c.carrier?.toLowerCase().includes("fedex");
              const isShipEngine = c.source === "shipengine";
              const isDemo = c.source === "demo" || (!c.isLive && !isFedEx && !isShipEngine);
              return (
                <button
                  key={`${c.carrier}-${i}`}
                  onClick={() => {
                    setSelectedFreight(c);
                    const fItemId = (heavyItem || items[0])?.id;
                    if (fItemId) {
                      saveQuote(fItemId, {
                        type: "ltl",
                        carrier: c.carrier,
                        service: c.service || "LTL",
                        amount: c.price,
                        transit: c.transit || "5-10 days",
                        source: c.source || "demo",
                        isLive: !!c.isLive,
                        itemTitle: (heavyItem || items[0])?.title || "",
                      });
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: isSelected
                      ? isFedEx ? "1.5px solid #4D148C" : "1.5px solid var(--accent)"
                      : isFedEx ? "1px solid rgba(77,20,140,0.3)" : "1px solid var(--border-default)",
                    background: isSelected
                      ? isFedEx ? "rgba(77,20,140,0.08)" : "rgba(0,188,212,0.06)"
                      : isFedEx ? "rgba(77,20,140,0.03)" : "var(--bg-card)",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    borderLeft: (() => { const fId = (heavyItem || items[0])?.id; return fId && isQuoteSaved(fId, c.carrier, c.service || "LTL", "ltl") ? "3px solid #4caf50" : undefined; })(),
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: isFedEx ? "#4D148C" : "var(--text-primary)" }}>{c.carrier}</span>
                      {isBest && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(76,175,80,0.15)", color: "#4caf50" }}>BEST RATE</span>}
                      {isFastest && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>FASTEST</span>}
                      {isFedEx && c.isLive && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(77,20,140,0.15)", color: "#4D148C" }}>FEDEX LIVE</span>}
                      {isFedEx && !c.isLive && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(255,152,0,0.12)", color: "#ff9800" }}>FEDEX ESTIMATED</span>}
                      {isShipEngine && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(0,188,212,0.12)", color: "#00bcd4" }}>SHIPENGINE</span>}
                      {isDemo && !isFedEx && <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(255,152,0,0.12)", color: "#ff9800" }}>ESTIMATED</span>}
                      {(() => { const fId = (heavyItem || items[0])?.id; return fId && isQuoteSaved(fId, c.carrier, c.service || "LTL", "ltl") ? <span style={{ fontSize: "0.5rem", fontWeight: 700, padding: "1px 5px", borderRadius: "9999px", background: "rgba(76,175,80,0.15)", color: "#4caf50" }}>SAVED</span> : null; })()}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {c.service} {"\u00B7"} {c.transit}
                      {c.guaranteed ? " \u00B7 Guaranteed" : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: isSelected ? "#4caf50" : isFedEx ? "#4D148C" : "var(--accent)" }}>${c.price.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(77,20,140,0.06)", border: "1px solid rgba(77,20,140,0.15)", fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(77,20,140,0.12)", color: "#4D148C" }}>FEDEX</span>
            <span>FedEx Freight Economy rates available with production credentials. Currently showing estimate.</span>
          </div>
          {selectedFreight && (
            <div style={{ marginTop: "0.75rem" }}>
              {/* Action paths after carrier selection */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                <button
                  onClick={() => { setOfficialQuoteForm(prev => ({ ...prev, carrier: selectedFreight.carrier, rate: String(selectedFreight.price) })); setShowQuoteUpload(true); }}
                  style={{ padding: "0.4rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "0.4rem", border: "1px solid rgba(0,188,212,0.3)", background: "rgba(0,188,212,0.06)", color: "#00bcd4", cursor: "pointer" }}
                >
                  {"\u{1F4CB}"} Upload Official Quote
                </button>
                <button
                  onClick={() => {
                    setBolForm(prev => ({ ...prev, shipperZip: form.fromZip, consigneeZip: form.toZip, totalWeight: form.weight, dimensions: `${form.length}\u00D7${form.width}\u00D7${form.height}`, commodityDesc: "" }));
                    setOfficialQuote({ quoteNumber: `FQ-${Date.now().toString(36).toUpperCase().slice(-6)}`, carrier: selectedFreight.carrier, rate: String(selectedFreight.price), transit: selectedFreight.transit });
                    setShowBOL(true);
                  }}
                  style={{ padding: "0.4rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {"\u{1F4C4}"} Create BOL
                </button>
              </div>
              {/* Schedule Pickup */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Pickup Date</div>
                  <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }} />
                </div>
              <button
                onClick={() => schedulePickup(selectedFreight.carrier)}
                disabled={scheduling || !pickupDate}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "linear-gradient(135deg, #00bcd4, #009688)",
                  color: "#fff",
                  cursor: scheduling ? "wait" : "pointer",
                  opacity: scheduling || !pickupDate ? 0.5 : 1,
                  whiteSpace: "nowrap" as const,
                }}
              >
                {scheduling ? "Scheduling..." : `Schedule ${selectedFreight.carrier} Pickup`}
              </button>
              </div>
              {/* Link to dashboard for full freight booking flow */}
              <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                  Complete freight booking with BOL generation on the item dashboard
                </div>
                <a
                  href="/dashboard"
                  style={{
                    fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)",
                    textDecoration: "none", cursor: "pointer",
                  }}
                >
                  {"\u{1F4CB}"} Proceed to Freight Booking {"\u2192"}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Arta White-Glove Option — Inline Quote */}
      {(() => {
        const artaItem = heavyItem || items[0];
        const artaOk = artaItem && (artaItem.isPremium || artaItem.isArtaEligible || (artaItem.isHighValue && artaItem.isAntique) || (artaItem.isHighValue && artaItem.isFragile));
        if (!artaOk) return null;
        return (
          <div style={{
            borderRadius: "0.75rem",
            background: "linear-gradient(135deg, rgba(255,215,0,0.04), rgba(255,152,0,0.03))",
            border: "1px solid rgba(255,215,0,0.15)",
            padding: "0.85rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "1rem" }}>{"\u{1F3DB}\uFE0F"}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f59e0b" }}>Arta White-Glove Shipping</span>
              <span style={{ fontSize: "0.48rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(255,215,0,0.1)", color: "#f59e0b", border: "1px solid rgba(255,215,0,0.2)" }}>PREMIUM</span>
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "0.5rem", lineHeight: 1.5 }}>
              This item qualifies for museum-grade shipping by Arta {"\u2014"} custom crating, climate control, white-glove delivery, and full insurance.
            </div>

            {!artaQuoteData && !loadingArtaQuote && (
              <button
                onClick={() => getArtaQuote(artaItem)}
                style={{ fontSize: "0.65rem", fontWeight: 700, padding: "5px 12px", borderRadius: "0.4rem", background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.2)", color: "#f59e0b", cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: "0.04em", transition: "all 0.2s" }}
              >
                Get Arta Quote
              </button>
            )}
            {loadingArtaQuote && (
              <div style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 600 }}>Fetching Arta quotes...</div>
            )}

            {artaQuoteError && (
              <div style={{ marginTop: "0.4rem", fontSize: "0.62rem", color: "#f44336", padding: "0.3rem 0.4rem", borderRadius: "0.3rem", background: "rgba(244,67,54,0.08)" }}>
                {artaQuoteError}
              </div>
            )}

            {artaQuoteData && (
              <div style={{ marginTop: "0.5rem" }}>
                {(artaQuoteData.quotes && artaQuoteData.quotes.length > 0) ? (
                  artaQuoteData.quotes.map((q: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: "0.35rem", padding: "0.4rem 0.5rem", borderRadius: "0.4rem",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.08)",
                        fontSize: "0.62rem", display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{q.quote_type || "Quote"}</div>
                        {q.services && q.services.length > 0 && (
                          <div style={{ color: "var(--text-muted)", fontSize: "0.52rem", marginTop: "0.1rem" }}>
                            {q.services.slice(0, 3).join(", ")}
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, color: "#f59e0b" }}>
                        ${Number(q.total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : artaQuoteData.tiers ? (
                  ["premium", "select", "parcel"].map((tier) => {
                    const t = (artaQuoteData.tiers as Record<string, any>)[tier];
                    if (!t) return null;
                    return (
                      <div
                        key={tier}
                        style={{
                          marginBottom: "0.35rem", padding: "0.4rem 0.5rem", borderRadius: "0.4rem",
                          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.08)",
                          fontSize: "0.62rem", display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{t.tier}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.52rem", marginTop: "0.1rem" }}>{t.description}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: "#f59e0b" }}>${t.basePrice}</div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>No Arta quotes available for this route.</div>
                )}
                <div style={{ marginTop: "0.3rem", fontSize: "0.48rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" as const }}>
                  Powered by Arta {artaQuoteData.isLive ? "" : "\u00B7 Estimated"}
                </div>
              </div>
            )}

            {!artaQuoteData && !loadingArtaQuote && (
              <div style={{ marginTop: "0.4rem" }}>
                <a
                  href={`/items/${artaItem.id}`}
                  style={{ fontSize: "0.6rem", color: "var(--text-muted)", textDecoration: "none" }}
                >
                  Or get quote on Item Dashboard {"\u2192"}
                </a>
              </div>
            )}
          </div>
        );
      })()}

      {confirmation && !showQuoteUpload && !showBOL && !bolGenerated && (
        <div style={{ background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: "#4caf50", marginBottom: "0.75rem" }}>{"\u2705"} Freight Pickup Confirmed</div>
          <div
            style={{
              background: "#fff",
              color: "#000",
              borderRadius: 8,
              padding: "1rem",
              border: "2px solid #333",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "0.78rem",
              lineHeight: 1.7,
            }}
          >
            <div style={{ textAlign: "center", fontWeight: 800, fontSize: "1rem", borderBottom: "2px solid #333", paddingBottom: "0.4rem", marginBottom: "0.5rem" }}>
              BILL OF LADING
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div>
                <strong>BOL #:</strong> {confirmation.confirmationNumber}
              </div>
              <div>
                <strong>Date:</strong> {confirmation.pickupDate}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div>
                <strong>Shipper:</strong>
                <br />
                LegacyLoop Seller
                <br />
                {form.fromZip}, ME
              </div>
              <div>
                <strong>Consignee:</strong>
                <br />
                Buyer
                <br />
                {form.toZip}
              </div>
            </div>
            <div style={{ borderTop: "1px dashed #999", paddingTop: "0.4rem", marginTop: "0.4rem" }}>
              <div>
                <strong>Carrier:</strong> {confirmation.carrier}
              </div>
              <div>
                <strong>Item:</strong> {form.weight} lbs, {form.length}{"\u00D7"}{form.width}{"\u00D7"}{form.height} in
              </div>
              <div>
                <strong>Freight Class:</strong> {quote?.freightClass ?? "\u2014"}
              </div>
              <div>
                <strong>Packaging:</strong> {form.packaging}
              </div>
              <div>
                <strong>Pickup Window:</strong> {confirmation.pickupWindow}
              </div>
              <div>
                <strong>Est. Delivery:</strong> {confirmation.estimatedDelivery}
              </div>
            </div>
            {confirmation.instructions && (
              <div style={{ marginTop: "0.5rem", padding: "0.4rem", background: "#fff3cd", borderRadius: 4, fontSize: "0.72rem" }}>
                {"\u26A0\uFE0F"} {confirmation.instructions}
              </div>
            )}
          </div>
          {/* Next step: Upload Official Quote */}
          <div style={{ marginTop: "0.75rem", padding: "0.65rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              {"\u{1F4CB}"} Waiting for official quote from our freight team. We{"\u2019"}ll email your request to shipping@legacy-loop.com and quote through our carrier network.
            </div>
            <button onClick={() => { setShowQuoteUpload(true); setOfficialQuoteForm(prev => ({ ...prev, carrier: confirmation.selectedCarrier || selectedFreight?.carrier || "", rate: selectedFreight?.price ? String(selectedFreight.price) : "" })); }} style={{ padding: "0.4rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer" }}>
              {"\u{1F4CB}"} Upload Official Quote
            </button>
          </div>
        </div>
      )}

      {/* Upload Official Quote Form */}
      {showQuoteUpload && !officialQuote && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.75rem" }}>{"\u{1F4CB}"} Upload Official Quote</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Quote Number</div>
              <input value={officialQuoteForm.quoteNumber} onChange={(e) => setOfficialQuoteForm(prev => ({ ...prev, quoteNumber: e.target.value }))} placeholder="e.g. FQ-2026-45821" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Carrier</div>
              <select value={officialQuoteForm.carrier} onChange={(e) => setOfficialQuoteForm(prev => ({ ...prev, carrier: e.target.value }))} style={inputStyle}>
                <option value="">Select Carrier</option>
                {["XPO Logistics", "Old Dominion", "R+L Carriers", "ABF Freight", "Estes Express", "SAIA", "YRC Freight", "FreightQuote", "Other"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Official Rate ($)</div>
              <input type="number" value={officialQuoteForm.rate} onChange={(e) => setOfficialQuoteForm(prev => ({ ...prev, rate: e.target.value }))} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Transit Time</div>
              <input value={officialQuoteForm.transit} onChange={(e) => setOfficialQuoteForm(prev => ({ ...prev, transit: e.target.value }))} placeholder="e.g. 3-5 business days" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Pickup Date</div>
              <input type="date" value={officialQuoteForm.pickupDate} onChange={(e) => setOfficialQuoteForm(prev => ({ ...prev, pickupDate: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Special Instructions</div>
              <textarea value={officialQuoteForm.instructions} onChange={(e) => setOfficialQuoteForm(prev => ({ ...prev, instructions: e.target.value }))} placeholder="Any special notes..." rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button onClick={() => setShowQuoteUpload(false)} style={{ padding: "0.4rem 0.75rem", fontSize: "0.72rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={() => {
                setOfficialQuote({ ...officialQuoteForm, uploadedAt: new Date().toISOString() });
                setShowQuoteUpload(false);
                // Pre-fill BOL form from known data
                setBolForm(prev => ({
                  ...prev,
                  shipperZip: form.fromZip,
                  consigneeZip: form.toZip,
                  totalWeight: form.weight,
                  dimensions: `${form.length}\u00D7${form.width}\u00D7${form.height}`,
                  commodityDesc: heavyItem?.title || "",
                }));
              }}
              disabled={!officialQuoteForm.quoteNumber || !officialQuoteForm.carrier || !officialQuoteForm.rate}
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer", opacity: (!officialQuoteForm.quoteNumber || !officialQuoteForm.carrier || !officialQuoteForm.rate) ? 0.5 : 1 }}
            >
              {"\u{1F4CB}"} Upload Quote
            </button>
          </div>
        </div>
      )}

      {/* Official Quote Uploaded — proceed to BOL */}
      {officialQuote && !showBOL && !bolGenerated && (
        <div style={{ background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1rem" }}>{"\u2705"}</span>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#4caf50" }}>Official quote uploaded!</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div style={{ padding: "0.4rem", borderRadius: "0.4rem", background: "var(--ghost-bg)" }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Quote #</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{officialQuote.quoteNumber}</div>
            </div>
            <div style={{ padding: "0.4rem", borderRadius: "0.4rem", background: "var(--ghost-bg)" }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Carrier</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{officialQuote.carrier}</div>
            </div>
            <div style={{ padding: "0.4rem", borderRadius: "0.4rem", background: "var(--ghost-bg)" }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Rate</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4caf50" }}>${Number(officialQuote.rate).toFixed(2)}</div>
            </div>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Complete the Bill of Lading to finalize the shipment.</div>
          <button onClick={() => setShowBOL(true)} style={{ padding: "0.45rem 1rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer" }}>
            {"\u{1F4CB}"} Complete BOL {"\u2192"}
          </button>
        </div>
      )}

      {/* Full BOL Questionnaire */}
      {showBOL && !bolGenerated && (() => {
        // AI Freight Class Calculator
        const w = Number(bolForm.totalWeight) || Number(form.weight) || 80;
        const l = Number(form.length) || 48;
        const wi = Number(form.width) || 40;
        const h = Number(form.height) || 36;
        const cubicFeet = (l * wi * h) / 1728;
        const density = cubicFeet > 0 ? w / cubicFeet : 0;
        let aiFreightClass = "70";
        let aiClassNote = "General freight";
        if (density >= 50) { aiFreightClass = "50"; aiClassNote = "Clean freight, high density"; }
        else if (density >= 35) { aiFreightClass = "55"; aiClassNote = "Bricks, cement, flooring"; }
        else if (density >= 22.5) { aiFreightClass = "60"; aiClassNote = "Car accessories, bottled water"; }
        else if (density >= 15) { aiFreightClass = "65"; aiClassNote = "Car parts, bottled drinks, books"; }
        else if (density >= 13.5) { aiFreightClass = "70"; aiClassNote = "Machinery, car engines, food items"; }
        else if (density >= 12) { aiFreightClass = "77.5"; aiClassNote = "Tires, bathroom fixtures"; }
        else if (density >= 10.5) { aiFreightClass = "85"; aiClassNote = "Crated machinery, cast iron stoves"; }
        else if (density >= 9) { aiFreightClass = "92.5"; aiClassNote = "Computers, monitors, refrigerators"; }
        else if (density >= 8) { aiFreightClass = "100"; aiClassNote = "Furniture, boat covers, wine"; }
        else if (density >= 6) { aiFreightClass = "110"; aiClassNote = "Cabinets, framed artwork, tables"; }
        else if (density >= 4) { aiFreightClass = "125"; aiClassNote = "Small appliances, tables"; }
        else if (density >= 3) { aiFreightClass = "150"; aiClassNote = "Auto sheet metal, bookcases"; }
        else if (density >= 2) { aiFreightClass = "175"; aiClassNote = "Clothing, couches, stuffed furniture"; }
        else if (density >= 1) { aiFreightClass = "200"; aiClassNote = "Auto sheet metal parts, mattresses"; }
        else { aiFreightClass = "250"; aiClassNote = "Bamboo furniture, pillows, lamp shades"; }

        if (!bolForm.freightClass) {
          setTimeout(() => setBolForm(prev => ({ ...prev, freightClass: aiFreightClass })), 0);
        }

        const bolNumber = `BOL-LL-${Date.now().toString(36).toUpperCase().slice(-6)}`;

        const svcTotal =
          (bolForm.svcResidential ? 85 : 0) +
          (bolForm.svcLiftgateDelivery ? 90 : 0) +
          (bolForm.svcLiftgatePickup ? 85 : 0) +
          (bolForm.svcInsideDelivery ? 150 : 0) +
          (bolForm.svcDeliveryNotification ? 15 : 0) +
          (bolForm.svcBlanketWrap ? 75 : 0) +
          (bolForm.svcWhiteGlove ? 350 : 0);

        return (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "1rem", padding: "1.25rem" }}>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>{"\u{1F4CB}"} Bill of Lading</div>

            {/* Section A — Shipper */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00bcd4", marginBottom: "0.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>A {"\u2014"} Shipper Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  { k: "shipperName", l: "Company/Name" }, { k: "shipperStreet", l: "Street Address" },
                  { k: "shipperCity", l: "City" }, { k: "shipperState", l: "State" },
                  { k: "shipperZip", l: "ZIP" }, { k: "shipperContact", l: "Contact Name" },
                  { k: "shipperPhone", l: "Phone" }, { k: "shipperEmail", l: "Email" },
                ].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>{f.l}</div>
                    <input value={(bolForm as any)[f.k]} onChange={(e) => setBolForm(prev => ({ ...prev, [f.k]: e.target.value }))} style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Section B — Consignee */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00bcd4", marginBottom: "0.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>B {"\u2014"} Consignee Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  { k: "consigneeName", l: "Company/Name" }, { k: "consigneeStreet", l: "Street Address" },
                  { k: "consigneeCity", l: "City" }, { k: "consigneeState", l: "State" },
                  { k: "consigneeZip", l: "ZIP" }, { k: "consigneeContact", l: "Contact Name" },
                  { k: "consigneePhone", l: "Phone" }, { k: "consigneeEmail", l: "Email" },
                ].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>{f.l}</div>
                    <input value={(bolForm as any)[f.k]} onChange={(e) => setBolForm(prev => ({ ...prev, [f.k]: e.target.value }))} style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Section C — Third Party Billing */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00bcd4", marginBottom: "0.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>C {"\u2014"} Billing</div>
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                {["SHIPPER", "CONSIGNEE", "THIRD_PARTY"].map(bt => (
                  <button key={bt} onClick={() => setBolForm(prev => ({ ...prev, billTo: bt }))} style={{
                    padding: "0.3rem 0.65rem", borderRadius: "0.35rem", fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
                    border: bolForm.billTo === bt ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                    background: bolForm.billTo === bt ? "rgba(0,188,212,0.06)" : "transparent",
                    color: bolForm.billTo === bt ? "var(--accent)" : "var(--text-muted)",
                  }}>
                    {bt.replace("_", " ")}
                  </button>
                ))}
              </div>
              {bolForm.billTo === "THIRD_PARTY" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  {[{ k: "thirdPartyCompany", l: "Company" }, { k: "thirdPartyAddress", l: "Address" }, { k: "thirdPartyPhone", l: "Phone" }].map(f => (
                    <div key={f.k}>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>{f.l}</div>
                      <input value={(bolForm as any)[f.k]} onChange={(e) => setBolForm(prev => ({ ...prev, [f.k]: e.target.value }))} style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section D — Shipment Details */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00bcd4", marginBottom: "0.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>D {"\u2014"} Shipment Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                {[
                  { k: "pieces", l: "# Pieces" }, { k: "totalWeight", l: "Weight (lbs)" },
                  { k: "dimensions", l: "Dimensions" }, { k: "nmfc", l: "NMFC # (opt)" },
                ].map(f => (
                  <div key={f.k}>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>{f.l}</div>
                    <input value={(bolForm as any)[f.k]} onChange={(e) => setBolForm(prev => ({ ...prev, [f.k]: e.target.value }))} style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>Package Type</div>
                  <select value={bolForm.packageType} onChange={(e) => setBolForm(prev => ({ ...prev, packageType: e.target.value }))} style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem" }}>
                    {["Pallet", "Crate", "Box", "Drum", "Bundle"].map(pt => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>Commodity Description</div>
                  <input value={bolForm.commodityDesc} onChange={(e) => setBolForm(prev => ({ ...prev, commodityDesc: e.target.value }))} style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem" }} />
                </div>
              </div>
              {/* AI Freight Class Calculator */}
              <div style={{ padding: "0.65rem", borderRadius: "0.5rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.12)", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.85rem" }}>{"\u{1F916}"}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)" }}>AI Freight Class: {aiFreightClass}</span>
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Density: {density.toFixed(1)} lbs/ft{"\u00B3"} {"\u00B7"} {aiClassNote}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Override:</div>
                  <select value={bolForm.freightClassOverride || ""} onChange={(e) => setBolForm(prev => ({ ...prev, freightClassOverride: e.target.value, freightClass: e.target.value || aiFreightClass }))} style={{ ...inputStyle, fontSize: "0.72rem", padding: "0.25rem 0.4rem", maxWidth: 120 }}>
                    <option value="">Use AI ({aiFreightClass})</option>
                    {["50","55","60","65","70","77.5","85","92.5","100","110","125","150","175","200","250","300","400","500"].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  {bolForm.freightClassOverride && <span style={{ fontSize: "0.55rem", color: "#f59e0b", fontWeight: 600 }}>Manual override {"\u2014"} carrier may adjust</span>}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "var(--text-muted)", cursor: "pointer" }}>
                <input type="checkbox" checked={bolForm.hazmat} onChange={(e) => setBolForm(prev => ({ ...prev, hazmat: e.target.checked }))} /> Hazardous Material
              </label>
            </div>

            {/* Section E — Special Services */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00bcd4", marginBottom: "0.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>E {"\u2014"} Special Services</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {([
                  { k: "svcResidential", l: "\u{1F3E0} Residential Delivery", cost: "+$75\u201395" },
                  { k: "svcLiftgateDelivery", l: "\u{1F4E6} Liftgate at Delivery", cost: "+$85\u201395" },
                  { k: "svcLiftgatePickup", l: "\u2B06\uFE0F Liftgate at Pickup", cost: "+$85\u201395" },
                  { k: "svcInsideDelivery", l: "\u{1F6AA} Inside Delivery", cost: "+$150" },
                  { k: "svcDeliveryNotification", l: "\u{1F514} Delivery Notification", cost: "+$15" },
                  { k: "svcBlanketWrap", l: "\u{1FAE7} Blanket/Pad Wrap", cost: "+$75" },
                  { k: "svcWhiteGlove", l: "\u2B50 White Glove Service", cost: "+$350" },
                  { k: "svcAppointment", l: "\u{1F4C5} Appointment Delivery", cost: "Free" },
                  { k: "svcSortSegregate", l: "\u{1F4E6} Sort & Segregate", cost: "Varies" },
                ] as { k: string; l: string; cost: string }[]).map(svc => {
                  const on = (bolForm as any)[svc.k];
                  return (
                    <button key={svc.k} onClick={() => setBolForm(prev => ({ ...prev, [svc.k]: !on }))} style={{
                      display: "flex", alignItems: "center", gap: "0.25rem",
                      padding: "0.3rem 0.6rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                      border: on ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                      background: on ? "rgba(0,188,212,0.08)" : "transparent",
                      color: on ? "var(--accent)" : "var(--text-muted)",
                    }}>
                      {svc.l} <span style={{ fontSize: "0.52rem", opacity: 0.7 }}>{svc.cost}</span>
                    </button>
                  );
                })}
              </div>
              {svcTotal > 0 && <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#f59e0b", marginTop: "0.4rem" }}>Estimated accessorial total: +${svcTotal}</div>}
            </div>

            {/* Section F — Carrier + Pricing */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00bcd4", marginBottom: "0.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>F {"\u2014"} Carrier & Pricing</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>Carrier</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", padding: "0.35rem 0" }}>{officialQuote?.carrier || "\u2014"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>Quote #</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", padding: "0.35rem 0" }}>{officialQuote?.quoteNumber || "\u2014"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>Rate</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4caf50", padding: "0.35rem 0" }}>${Number(officialQuote?.rate || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>Transit</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", padding: "0.35rem 0" }}>{officialQuote?.transit || "\u2014"}</div>
                </div>
              </div>
            </div>

            {/* Section G — References */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#00bcd4", marginBottom: "0.5rem", borderBottom: "1px solid var(--border-default)", paddingBottom: "0.3rem" }}>G {"\u2014"} References</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>BOL #</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, fontFamily: "monospace", color: "var(--accent)", padding: "0.35rem 0" }}>{bolNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>PO # (optional)</div>
                  <input value={bolForm.poNumber} onChange={(e) => setBolForm(prev => ({ ...prev, poNumber: e.target.value }))} style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>PRO # (carrier assigns)</div>
                  <input value={bolForm.proNumber} onChange={(e) => setBolForm(prev => ({ ...prev, proNumber: e.target.value }))} placeholder="Assigned by carrier" style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem" }} />
                </div>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 2 }}>Reference Notes</div>
                <textarea value={bolForm.refNotes} onChange={(e) => setBolForm(prev => ({ ...prev, refNotes: e.target.value }))} rows={2} style={{ ...inputStyle, fontSize: "0.78rem", padding: "0.35rem 0.5rem", resize: "vertical" as const }} />
              </div>
            </div>

            {/* Generate BOL */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowBOL(false)} style={{ padding: "0.4rem 0.75rem", fontSize: "0.72rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => {
                  setBolGenerated({
                    bolNumber,
                    ...bolForm,
                    freightClass: bolForm.freightClassOverride || aiFreightClass,
                    carrier: officialQuote?.carrier,
                    quoteNumber: officialQuote?.quoteNumber,
                    rate: officialQuote?.rate,
                    transit: officialQuote?.transit,
                    generatedAt: new Date().toISOString(),
                    svcTotal,
                  });
                  setShowBOL(false);
                  setBolTracking({ status: "BOL_CREATED", proNumber: bolForm.proNumber, events: [{ status: "BOL_CREATED", date: new Date().toISOString() }] });
                }}
                style={{ padding: "0.45rem 1.25rem", fontSize: "0.82rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer" }}
              >
                {"\u{1F4CB}"} Generate BOL
              </button>
            </div>
          </div>
        );
      })()}

      {/* Generated BOL Document */}
      {bolGenerated && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "1rem", overflow: "hidden" }}>
          {/* BOL Document */}
          <div style={{ background: "#fff", color: "#000", padding: "1.5rem", fontFamily: "'Courier New', Courier, monospace", fontSize: "0.75rem", lineHeight: 1.6 }}>
            <div style={{ textAlign: "center", fontWeight: 800, fontSize: "1.2rem", borderBottom: "3px solid #000", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
              STRAIGHT BILL OF LADING {"\u2014"} SHORT FORM
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>
              <div><strong>BOL #:</strong> <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>{bolGenerated.bolNumber}</span></div>
              <div><strong>Date:</strong> {new Date(bolGenerated.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
              <div><strong>Carrier:</strong> {bolGenerated.carrier}</div>
            </div>
            {/* Shipper / Consignee side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "0.75rem", borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>
              <div>
                <div style={{ fontWeight: 800, textTransform: "uppercase", borderBottom: "1px solid #999", marginBottom: "0.3rem", paddingBottom: "0.15rem" }}>SHIPPER</div>
                <div>{bolGenerated.shipperName}</div>
                {bolGenerated.shipperStreet && <div>{bolGenerated.shipperStreet}</div>}
                <div>{bolGenerated.shipperCity}, {bolGenerated.shipperState} {bolGenerated.shipperZip}</div>
                {bolGenerated.shipperPhone && <div>Ph: {bolGenerated.shipperPhone}</div>}
              </div>
              <div>
                <div style={{ fontWeight: 800, textTransform: "uppercase", borderBottom: "1px solid #999", marginBottom: "0.3rem", paddingBottom: "0.15rem" }}>CONSIGNEE</div>
                <div>{bolGenerated.consigneeName || "TBD"}</div>
                {bolGenerated.consigneeStreet && <div>{bolGenerated.consigneeStreet}</div>}
                <div>{bolGenerated.consigneeCity}{bolGenerated.consigneeState ? `, ${bolGenerated.consigneeState}` : ""} {bolGenerated.consigneeZip}</div>
                {bolGenerated.consigneePhone && <div>Ph: {bolGenerated.consigneePhone}</div>}
              </div>
            </div>
            {/* Shipment details */}
            <div style={{ marginBottom: "0.75rem", borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
                <div><strong># Pcs:</strong><br />{bolGenerated.pieces}</div>
                <div><strong>Type:</strong><br />{bolGenerated.packageType}</div>
                <div><strong>Weight:</strong><br />{bolGenerated.totalWeight} lbs</div>
                <div><strong>Class:</strong><br />{bolGenerated.freightClass}</div>
                <div><strong>NMFC:</strong><br />{bolGenerated.nmfc || "\u2014"}</div>
              </div>
              <div style={{ marginTop: "0.3rem" }}><strong>Description:</strong> {bolGenerated.commodityDesc}</div>
            </div>
            {/* Special services */}
            {bolGenerated.svcTotal > 0 && (
              <div style={{ marginBottom: "0.75rem", borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>
                <strong>Special Services:</strong>{" "}
                {[
                  bolGenerated.svcResidential && "Residential",
                  bolGenerated.svcLiftgateDelivery && "Liftgate (Del.)",
                  bolGenerated.svcLiftgatePickup && "Liftgate (PU)",
                  bolGenerated.svcInsideDelivery && "Inside Delivery",
                  bolGenerated.svcBlanketWrap && "Blanket Wrap",
                  bolGenerated.svcWhiteGlove && "White Glove",
                  bolGenerated.svcAppointment && "Appointment",
                ].filter(Boolean).join(", ")}
              </div>
            )}
            {/* Rate info */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div><strong>Quote #:</strong> {bolGenerated.quoteNumber}</div>
              <div><strong>Rate:</strong> ${Number(bolGenerated.rate).toFixed(2)}{bolGenerated.svcTotal > 0 ? ` + $${bolGenerated.svcTotal} svc` : ""}</div>
              <div><strong>Transit:</strong> {bolGenerated.transit}</div>
            </div>
            {/* Signature lines */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1rem" }}>
              <div>
                <div style={{ borderBottom: "1px solid #000", height: 30 }} />
                <div style={{ fontSize: "0.6rem", marginTop: "0.15rem" }}>Shipper Signature / Date</div>
              </div>
              <div>
                <div style={{ borderBottom: "1px solid #000", height: 30 }} />
                <div style={{ fontSize: "0.6rem", marginTop: "0.15rem" }}>Carrier Signature / Date</div>
              </div>
            </div>
          </div>

          {/* BOL Actions */}
          <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border-default)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => window.print()} style={{ padding: "0.4rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer" }}>
              {"\u{1F5A8}\uFE0F"} Print BOL
            </button>
            <button onClick={() => { navigator.clipboard.writeText(bolGenerated.bolNumber).catch(() => {}); }} style={{ padding: "0.4rem 0.75rem", fontSize: "0.72rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
              {"\u{1F4CB}"} Copy BOL #
            </button>
          </div>

          {/* BOL Tracking */}
          {bolTracking && (
            <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-default)" }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>{"\u{1F69B}"} Freight Tracking</div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)" }}>BOL:</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, fontFamily: "monospace", color: "var(--accent)" }}>{bolGenerated.bolNumber}</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", marginLeft: "0.5rem" }}>PRO #:</div>
                <input
                  value={bolTracking.proNumber}
                  onChange={(e) => setBolTracking(prev => prev ? { ...prev, proNumber: e.target.value } : prev)}
                  placeholder="Carrier assigns"
                  style={{ ...inputStyle, fontSize: "0.72rem", padding: "0.25rem 0.4rem", maxWidth: 160 }}
                />
              </div>
              {/* Status progression */}
              {(() => {
                const FREIGHT_STEPS = ["BOL_CREATED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
                const FREIGHT_LABELS = ["BOL Created", "Pickup Scheduled", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];
                const stepIdx = FREIGHT_STEPS.indexOf(bolTracking.status);
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", margin: "0.75rem 0" }}>
                      {FREIGHT_STEPS.map((s, i) => {
                        const done = i <= stepIdx;
                        const isCurrent = i === stepIdx;
                        return (
                          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                            {i > 0 && <div style={{ position: "absolute", left: "-50%", right: "50%", top: 6, height: 3, background: done ? "linear-gradient(90deg, #9c27b0, #7b1fa2)" : "var(--ghost-bg)", zIndex: 0 }} />}
                            <div style={{
                              width: 12, height: 12, borderRadius: "50%",
                              background: done ? "linear-gradient(135deg, #9c27b0, #7b1fa2)" : "var(--ghost-bg)",
                              border: isCurrent ? "2px solid #9c27b0" : "2px solid transparent",
                              boxShadow: isCurrent ? "0 0 6px rgba(156,39,176,0.4)" : "none",
                              marginBottom: 3, zIndex: 1, position: "relative",
                            }} />
                            <span style={{ fontSize: "0.45rem", fontWeight: done ? 700 : 400, color: done ? "#9c27b0" : "var(--text-muted)", textAlign: "center" }}>{FREIGHT_LABELS[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Advance button */}
                    {stepIdx < FREIGHT_STEPS.length - 1 && (
                      <button
                        onClick={() => {
                          const nextStatus = FREIGHT_STEPS[stepIdx + 1];
                          setBolTracking(prev => prev ? {
                            ...prev,
                            status: nextStatus,
                            events: [...prev.events, { status: nextStatus, date: new Date().toISOString() }],
                          } : prev);
                        }}
                        style={{ padding: "0.35rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #9c27b0, #7b1fa2)", color: "#fff", cursor: "pointer" }}
                      >
                        {"\u2192"} {FREIGHT_LABELS[stepIdx + 1]}
                      </button>
                    )}
                    {stepIdx === FREIGHT_STEPS.length - 1 && (
                      <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.15)", fontSize: "0.78rem", fontWeight: 700, color: "#4caf50" }}>
                        {"\u2705"} Freight delivered! Sale complete.
                      </div>
                    )}
                  </div>
                );
              })()}
              {/* Event log */}
              {bolTracking.events.length > 0 && (
                <div style={{ marginTop: "0.5rem" }}>
                  {bolTracking.events.map((ev, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.6rem", color: "var(--text-muted)", borderLeft: "2px solid rgba(156,39,176,0.3)", paddingLeft: "0.5rem", marginBottom: "0.2rem" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.52rem", minWidth: 90 }}>{new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {new Date(ev.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                      <span style={{ fontWeight: 600 }}>{ev.status.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── K) Local Pickup Tab ─────────────────────────────────────────────────────

function PickupProgress({ status }: { status: string | null }) {
  const STEPS = ["INVITE_SENT", "CONFIRMED", "EN_ROUTE", "HANDED_OFF", "COMPLETED"];
  const LABELS = ["Invite", "Confirmed", "En Route", "Handoff", "Complete"];
  const ICONS = ["\u{1F4E9}", "\u2705", "\u{1F697}", "\u{1F4E6}", "\u{1F389}"];
  const stepIdx = status ? STEPS.indexOf(status) : -1;
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
      {STEPS.map((s, i) => {
        const done = i <= stepIdx;
        const isCurrent = i === stepIdx;
        return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
            {i > 0 && (
              <div style={{ position: "absolute", left: "-50%", right: "50%", top: 10, height: 3, background: done ? "linear-gradient(90deg, #a855f7, #7c3aed)" : "var(--ghost-bg)", zIndex: 0 }} />
            )}
            <div style={{
              width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.55rem", fontWeight: 800,
              background: done ? "linear-gradient(135deg, #a855f7, #7c3aed)" : "var(--ghost-bg)",
              color: done ? "#fff" : "var(--text-muted)",
              border: isCurrent ? "2px solid #a855f7" : "2px solid transparent",
              boxShadow: isCurrent ? "0 0 8px rgba(168,85,247,0.4)" : "none",
              marginBottom: 4, zIndex: 1, position: "relative",
            }}>
              {done ? ICONS[i] : i + 1}
            </div>
            <span style={{ fontSize: "0.5rem", fontWeight: done ? 700 : 400, color: done ? "#a855f7" : "var(--text-muted)" }}>{LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function LocalPickupTab({ data }: { data: ShipData }) {
  const [pickupAddress, setPickupAddress] = useState("123 Main St, Waterville, ME 04901");
  const [pickupAvailability, setPickupAvailability] = useState("Weekdays 9 AM \u2013 5 PM");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [pickupSaved, setPickupSaved] = useState(false);
  const [pickupStatuses, setPickupStatuses] = useState<Record<string, any>>({});
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>({});
  const [tipsOpen, setTipsOpen] = useState(false);
  const [inviteConfirm, setInviteConfirm] = useState<string | null>(null);

  const allItems = [...data.preSale, ...data.readyToShip];
  const pickupItems = allItems.filter((i) =>
    i.saleMethod === "LOCAL_PICKUP" || i.saleMethod === "BOTH" ||
    (i.aiBox === "freight" && (i.category || "").toLowerCase().match(/vehicle|boat|car|truck|motorcycle/))
  );
  const activePickups = pickupItems.filter(i => pickupStatuses[i.id]?.status && pickupStatuses[i.id].status !== "COMPLETED");
  const completedPickups = pickupItems.filter(i => pickupStatuses[i.id]?.status === "COMPLETED");
  const pendingPickups = pickupItems.filter(i => !pickupStatuses[i.id]?.status);

  const SAFETY_TIPS = [
    "Meet in public places \u2014 police station parking lots recommended",
    "Bring a friend for high-value items",
    "Accept payment BEFORE handing off item",
    "Use the handoff code to verify both parties",
    "Never share personal address if meetup is at a neutral location",
    "For vehicles: meet at DMV for title transfer",
  ];

  function savePickupPrefs() {
    try { localStorage.setItem("ll_pickup_prefs", JSON.stringify({ address: pickupAddress, availability: pickupAvailability, instructions: pickupInstructions })); } catch {}
    setPickupSaved(true);
    setTimeout(() => setPickupSaved(false), 2000);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ll_pickup_prefs");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.address) setPickupAddress(p.address);
        if (p.availability) setPickupAvailability(p.availability);
        if (p.instructions) setPickupInstructions(p.instructions);
      }
    } catch {}
  }, []);

  const pickupFetchedRef = useRef(false);
  useEffect(() => {
    if (pickupFetchedRef.current || pickupItems.length === 0) return;
    pickupFetchedRef.current = true;
    // Batch fetch all pickup statuses in 1 API call
    fetch("/api/shipping/pickup-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemIds: pickupItems.map((item: any) => item.id),
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.statuses) {
          setPickupStatuses(d.statuses);
          console.log(`[LocalPickupTab] Loaded ${Object.keys(d.statuses).length} pickup statuses in 1 batch API call`);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function advancePickup(itemId: string, extraData?: any) {
    setAdvancing(itemId);
    try {
      const res = await fetch(`/api/shipping/pickup/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance", ...extraData }),
      });
      const d = await res.json();
      if (d.success) {
        const statusRes = await fetch(`/api/shipping/pickup/${itemId}`);
        const statusData = await statusRes.json();
        if (!statusData.error) setPickupStatuses(prev => ({ ...prev, [itemId]: statusData }));
        setInviteForm(null);
      }
    } catch {}
    setAdvancing(null);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.82rem", borderRadius: "0.4rem",
    border: "1px solid var(--border-default)", background: "var(--input-bg, var(--ghost-bg))",
    color: "var(--text-primary)", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit",
  };

  function renderPickupCard(item: any) {
    const ps = pickupStatuses[item.id];
    const status = ps?.status || null;
    const isVehicle = (item.aiBox === "freight" && (item.category || "").toLowerCase().match(/vehicle|boat|car|truck|motorcycle/)) || false;

    return (
      <div key={item.id} style={{ borderRadius: "0.75rem", border: "1px solid var(--border-default)", borderLeft: "4px solid #a855f7", background: "var(--bg-card)", overflow: "hidden" }}>
        {/* Item header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem" }}>
          {item.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.photo} alt="" style={{ width: 56, height: 56, borderRadius: "0.4rem", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: "0.4rem", background: "var(--ghost-bg)", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Link href={`/items/${item.id}`} style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)", textDecoration: "none" }}>
                {item.title}
              </Link>
              <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(168,85,247,0.12)", color: "#a855f7" }}>PICKUP</span>
              {isVehicle && <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: "9999px", background: "rgba(168,85,247,0.08)", color: "#a855f7" }}>{"\u{1F697}"} Vehicle</span>}
            </div>
            {(item.soldPrice || item.listingPrice) && (
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)", marginTop: "0.1rem" }}>${item.soldPrice || item.listingPrice}</div>
            )}
          </div>
        </div>

        {/* Progress tracker */}
        <div style={{ padding: "0 0.85rem" }}>
          <PickupProgress status={status} />
        </div>

        {/* Status-specific content */}
        <div style={{ padding: "0.5rem 0.85rem 0.85rem" }}>
          {/* Invite confirmation banner */}
          {inviteConfirm === item.id && (
            <div style={{
              padding: "0.5rem 0.75rem", borderRadius: "0.4rem", marginBottom: "0.5rem",
              background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)",
              display: "flex", alignItems: "center", gap: "0.3rem",
              fontSize: "0.75rem", fontWeight: 600, color: "#4caf50",
            }}>
              {"\u2705"} Invite sent to buyer
            </div>
          )}
          {/* PENDING — no status yet */}
          {!status && inviteForm !== item.id && (
            <button
              onClick={() => { setInviteForm(item.id); setInviteData({ location: pickupAddress, timeSlots: pickupAvailability, contactMethod: "IN_APP", paymentMethod: "SQUARE", notes: pickupInstructions }); }}
              style={{ width: "100%", padding: "0.5rem 0.85rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", cursor: "pointer" }}
            >
              {"\u{1F4E9}"} Send Pickup Invite
            </button>
          )}

          {/* Invite form */}
          {!status && inviteForm === item.id && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.12)" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a855f7", marginBottom: "0.1rem" }}>{"\u{1F4E9}"} Send Pickup Invite</div>
              <div>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Pickup Location</div>
                <input value={inviteData.location || ""} onChange={(e) => setInviteData((d: any) => ({ ...d, location: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Available Time Slots</div>
                <input value={inviteData.timeSlots || ""} onChange={(e) => setInviteData((d: any) => ({ ...d, timeSlots: e.target.value }))} placeholder="e.g. Sat 10am, Sun 2pm" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Contact Method</div>
                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                  {["PHONE", "TEXT", "EMAIL", "IN_APP"].map(m => (
                    <button key={m} onClick={() => setInviteData((d: any) => ({ ...d, contactMethod: m }))} style={{
                      padding: "0.25rem 0.55rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                      border: inviteData.contactMethod === m ? "1.5px solid #a855f7" : "1px solid var(--border-default)",
                      background: inviteData.contactMethod === m ? "rgba(168,85,247,0.1)" : "transparent",
                      color: inviteData.contactMethod === m ? "#a855f7" : "var(--text-muted)",
                    }}>
                      {m === "PHONE" ? "\u{1F4DE}" : m === "TEXT" ? "\u{1F4F1}" : m === "EMAIL" ? "\u{1F4E7}" : "\u{1F4AC}"} {m.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Payment Method</div>
                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                  {["CASH", "VENMO", "SQUARE", "IN_APP"].map(m => (
                    <button key={m} onClick={() => setInviteData((d: any) => ({ ...d, paymentMethod: m }))} style={{
                      padding: "0.25rem 0.55rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                      border: inviteData.paymentMethod === m ? "1.5px solid #a855f7" : "1px solid var(--border-default)",
                      background: inviteData.paymentMethod === m ? "rgba(168,85,247,0.1)" : "transparent",
                      color: inviteData.paymentMethod === m ? "#a855f7" : "var(--text-muted)",
                    }}>
                      {m === "CASH" ? "\u{1F4B5}" : m === "VENMO" ? "\u{1F4B3}" : m === "SQUARE" ? "\u{1F7E6}" : "\u{1F4B0}"} {m.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Notes for Buyer</div>
                <textarea value={inviteData.notes || ""} onChange={(e) => setInviteData((d: any) => ({ ...d, notes: e.target.value }))} placeholder="Any special notes..." rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setInviteForm(null)} style={{ padding: "0.35rem 0.75rem", fontSize: "0.72rem", borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await advancePickup(item.id, {
                      location: inviteData.location,
                      timeSlots: inviteData.timeSlots,
                      contactMethod: inviteData.contactMethod,
                      paymentMethod: inviteData.paymentMethod,
                      notes: inviteData.notes,
                    });
                    setInviteConfirm(item.id);
                    console.log("[pickup] Invite sent for item:", item.id);
                    setTimeout(() => setInviteConfirm(null), 3000);
                  }}
                  disabled={advancing === item.id}
                  style={{ padding: "0.35rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", cursor: advancing === item.id ? "wait" : "pointer", opacity: advancing === item.id ? 0.6 : 1 }}
                >
                  {advancing === item.id ? "Sending..." : "\u{1F4E9} Send Invite"}
                </button>
              </div>
            </div>
          )}

          {/* INVITE_SENT */}
          {status === "INVITE_SENT" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ padding: "0.6rem", borderRadius: "0.5rem", background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#a855f7", marginBottom: "0.3rem" }}>{"\u{1F4E9}"} Invite Sent — Waiting for buyer confirmation</div>
                {ps?.location && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{"\u{1F4CD}"} {ps.location}</div>}
                {ps?.timeSlots && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{"\u{1F552}"} {ps.timeSlots}</div>}
                {ps?.contactMethod && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{"\u{1F4AC}"} Contact: {ps.contactMethod}</div>}
                {ps?.inviteSentAt && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Sent {new Date(ps.inviteSentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>}
              </div>
              <button
                onClick={() => advancePickup(item.id)}
                disabled={advancing === item.id}
                style={{ padding: "0.4rem 0.85rem", fontSize: "0.72rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px dashed var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
              >
                {advancing === item.id ? "Confirming..." : "\u{1F50D} Simulate Buyer Confirm (Demo)"}
              </button>
            </div>
          )}

          {/* CONFIRMED */}
          {status === "CONFIRMED" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ padding: "0.6rem", borderRadius: "0.5rem", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.15)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#4caf50", marginBottom: "0.4rem" }}>{"\u2705"} Buyer Confirmed!</div>
                {ps?.confirmedAt && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Confirmed {new Date(ps.confirmedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>}
                {ps?.buyerTimeSlot && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>{"\u{1F552}"} Buyer selected: {ps.buyerTimeSlot}</div>}
                {ps?.buyerMessage && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.15rem", fontStyle: "italic" }}>"{ps.buyerMessage}"</div>}
              </div>
              {ps?.handoffCode && (
                <div style={{ textAlign: "center", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Handoff Code</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "0.15em", color: "#a855f7", fontFamily: "monospace" }}>{ps.handoffCode}</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Share with buyer to verify handoff</div>
                </div>
              )}
              <button
                onClick={() => advancePickup(item.id)}
                disabled={advancing === item.id}
                style={{ width: "100%", padding: "0.5rem 0.85rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", cursor: "pointer", opacity: advancing === item.id ? 0.6 : 1 }}
              >
                {advancing === item.id ? "Updating..." : "\u{1F697} Mark En Route"}
              </button>
            </div>
          )}

          {/* EN_ROUTE */}
          {status === "EN_ROUTE" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ padding: "0.6rem", borderRadius: "0.5rem", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#3b82f6" }}>{"\u{1F697}"} Buyer is on their way!</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Prepare the item for handoff.</div>
              </div>
              {ps?.handoffCode && (
                <div style={{ textAlign: "center", padding: "0.6rem", borderRadius: "0.5rem", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <div style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Verify Handoff Code</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "0.15em", color: "#a855f7", fontFamily: "monospace" }}>{ps.handoffCode}</div>
                </div>
              )}
              <button
                onClick={() => advancePickup(item.id)}
                disabled={advancing === item.id}
                style={{ width: "100%", padding: "0.5rem 0.85rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", cursor: "pointer", opacity: advancing === item.id ? 0.6 : 1 }}
              >
                {advancing === item.id ? "Confirming..." : "\u{1F4E6} Confirm Handoff"}
              </button>
            </div>
          )}

          {/* HANDED_OFF */}
          {status === "HANDED_OFF" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ padding: "0.6rem", borderRadius: "0.5rem", background: "rgba(255,152,0,0.06)", border: "1px solid rgba(255,152,0,0.15)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#ff9800" }}>{"\u{1F4E6}"} Item handed off — awaiting buyer confirmation</div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>Buyer needs to confirm they received the item.</div>
              </div>
              <button
                onClick={() => advancePickup(item.id)}
                disabled={advancing === item.id}
                style={{ width: "100%", padding: "0.5rem 0.85rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #4caf50, #2e7d32)", color: "#fff", cursor: "pointer", opacity: advancing === item.id ? 0.6 : 1 }}
              >
                {advancing === item.id ? "Completing..." : "\u{1F389} Complete Pickup"}
              </button>
            </div>
          )}

          {/* COMPLETED */}
          {status === "COMPLETED" && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1rem" }}>{"\u{1F389}"}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#4caf50" }}>Pickup complete! Sale closed.</span>
              </div>
              {ps?.completedAt && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Completed {new Date(ps.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* SECTION 1: Pickup Preferences */}
      <div style={{ background: "rgba(168,85,247,0.02)", border: "1px solid var(--border-default)", borderRadius: "0.75rem", padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.1rem" }}>{"\u{1F91D}"}</span>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#a855f7" }}>Pickup Preferences</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Pickup Address</div>
            <input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Availability</div>
            <input value={pickupAvailability} onChange={(e) => setPickupAvailability(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Special Instructions</div>
          <textarea value={pickupInstructions} onChange={(e) => setPickupInstructions(e.target.value)} placeholder="Ring doorbell, items on porch, etc." rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
        </div>
        <button onClick={savePickupPrefs} style={{ padding: "0.4rem 0.85rem", fontSize: "0.72rem", fontWeight: 700, borderRadius: "0.4rem", border: "none", background: pickupSaved ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #a855f7, #7c3aed)", color: pickupSaved ? "#22c55e" : "#fff", cursor: "pointer" }}>
          {pickupSaved ? "\u2705 Saved!" : "Save Pickup Preferences"}
        </button>
      </div>

      {/* SECTION 2: Active & Pending Pickups */}
      {(pendingPickups.length > 0 || activePickups.length > 0) && (
        <div>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            {"\u{1F4E6}"} Active Pickups ({pendingPickups.length + activePickups.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...activePickups, ...pendingPickups].map(renderPickupCard)}
          </div>
        </div>
      )}

      {/* SECTION 3: Completed Pickups */}
      {completedPickups.length > 0 && (
        <div>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            {"\u2705"} Completed Pickups ({completedPickups.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {completedPickups.slice(0, 5).map(renderPickupCard)}
            {completedPickups.length > 5 && (
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", padding: "0.5rem" }}>
                + {completedPickups.length - 5} more completed pickups
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pickupItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{"\u{1F91D}"}</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Local Pickup & Meetup</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 400, margin: "0 auto 1rem" }}>
            No items currently in local pickup. When a buyer chooses local pickup, you{"\u2019"}ll manage the handoff here.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.5rem", maxWidth: 450, margin: "0 auto" }}>
            {[
              { icon: "\u{1F4E9}", label: "Send Invite" },
              { icon: "\u{1F91D}", label: "Safe Meetup" },
              { icon: "\u{1F510}", label: "Handoff Code" },
              { icon: "\u{1F389}", label: "Sale Complete" },
            ].map((s) => (
              <div key={s.label} style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid var(--border-default)", background: "var(--bg-card)", textAlign: "center" }}>
                <div style={{ fontSize: "1rem" }}>{s.icon}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.15rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Safety Tips */}
      <div style={{ borderRadius: "0.75rem", border: "1px solid var(--border-default)", background: "var(--bg-card)", overflow: "hidden" }}>
        <button
          onClick={() => setTipsOpen(!tipsOpen)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1rem", background: "none", border: "none", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.9rem" }}>{"\u{1F6E1}\uFE0F"}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>Safety Tips for Local Pickups</span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{tipsOpen ? "\u25B2" : "\u25BC"}</span>
        </button>
        {tipsOpen && (
          <div style={{ padding: "0 1rem 0.85rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {SAFETY_TIPS.map((tip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <span style={{ fontSize: "0.6rem", color: "#a855f7", fontWeight: 700, marginTop: "0.15rem" }}>{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── L) Main Component ───────────────────────────────────────────────────────

export default function ShippingCenterClient() {
  const searchParams = useSearchParams();
  const itemIdParam = searchParams.get("itemId");

  const [tab, setTab] = useState<Tab>(itemIdParam ? "readyToShip" : "preSale");
  const [data, setData] = useState<ShipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [allEstimates, setAllEstimates] = useState<Record<string, any>>({});
  const [pickupStatusesForTracking, setPickupStatusesForTracking] = useState<Record<string, any>>({});
  const [freightBOLForTracking, setFreightBOLForTracking] = useState<any>(null);
  const [savedFreightCount, setSavedFreightCount] = useState(0);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Hydration-safe: read saved quote count only on client
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ll_saved_quotes");
      if (!raw) return;
      const store = JSON.parse(raw);
      let sc = 0;
      for (const qs of Object.values(store)) { sc += (qs as any[]).filter((q: any) => q.type === "ltl").length; }
      setSavedFreightCount(sc);
    } catch { /* ignore */ }
  }, []);

  // Listen for tab-change events from child components (e.g., "View in Tracking Board")
  useEffect(() => {
    function handleTabChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail && TABS.some(t => t.key === detail)) {
        setTab(detail as Tab);
      }
    }
    window.addEventListener("shipping-tab-change", handleTabChange);
    return () => window.removeEventListener("shipping-tab-change", handleTabChange);
  }, []);

  // Load freight BOL from localStorage for tracking board (check all per-item keys)
  useEffect(() => {
    try {
      // Check for per-item BOL keys
      const allItems = data ? [...data.preSale, ...data.readyToShip, ...data.shipped] : [];
      for (const item of allItems) {
        const raw = localStorage.getItem(`ll_freight_bol_${item.id}`);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.bolGenerated) {
            setFreightBOLForTracking({ ...saved.bolGenerated, trackingStatus: saved.bolTracking?.status || "BOL_CREATED" });
            break;
          }
        }
      }
      // Fallback: check legacy key
      if (!freightBOLForTracking) {
        const raw = localStorage.getItem("ll_freight_bol_latest");
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.bolGenerated) {
            setFreightBOLForTracking({ ...saved.bolGenerated, trackingStatus: saved.bolTracking?.status || "BOL_CREATED" });
          }
        }
      }
    } catch { /* ignore */ }
  }, [tab, data]); // Re-check when switching tabs or data loads

  // Fetch pickup statuses for tracking board — once on initial data load (batch)
  const trackingPickupFetchedRef = useRef(false);
  useEffect(() => {
    if (!data || trackingPickupFetchedRef.current) return;
    trackingPickupFetchedRef.current = true;
    const allItems = [...data.preSale, ...data.readyToShip];
    const pickupItems = allItems.filter((i) =>
      i.saleMethod === "LOCAL_PICKUP" || i.saleMethod === "BOTH" ||
      (i.aiBox === "freight" && (i.category || "").toLowerCase().match(/vehicle|boat|car|truck|motorcycle/))
    );
    if (pickupItems.length === 0) return;
    fetch("/api/shipping/pickup-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemIds: pickupItems.map((i: any) => i.id),
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.statuses) {
          setPickupStatusesForTracking(d.statuses);
          console.log(`[TrackingBoard] Batch loaded ${Object.keys(d.statuses).length} pickup statuses`);
        }
      })
      .catch(() => {});
  }, [data]);

  const handleEstimate = useCallback((id: string, est: any) => {
    setAllEstimates((prev) => ({ ...prev, [id]: est }));
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/shipping/center")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setData(d);
          setLastRefresh(new Date());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown "Updated X seconds ago"
  const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    if (!lastRefresh) return;
    setSecondsAgo(0);
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefresh.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRefresh]);

  // Auto-switch to readyToShip tab if itemId param is present
  useEffect(() => {
    if (itemIdParam && data) {
      const isInReady = data.readyToShip.some((i) => i.id === itemIdParam);
      if (isInReady) setTab("readyToShip");
    }
  }, [itemIdParam, data]);

  const totalItems = data ? data.preSale.length + data.readyToShip.length + data.shipped.length : 0;
  const hasUrgent = (data?.readyToShip.length ?? 0) > 0;

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          {data && `Managing ${totalItems} item${totalItems !== 1 ? "s" : ""} across ${data.shipped.length} shipment${data.shipped.length !== 1 ? "s" : ""}`}
          {lastRefresh && ` \u00B7 Updated ${secondsAgo < 5 ? "just now" : secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`}`}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: "0.3rem 0.65rem",
            fontSize: "0.68rem",
            fontWeight: 600,
            borderRadius: "0.35rem",
            border: "1px solid var(--border-default)",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "..." : "\u{1F504} Refresh"}
        </button>
      </div>

      {/* Priority Action Banner */}
      {data && !dismissedBanner && (() => {
        const actionPills: { label: string; action: () => void; urgent: boolean }[] = [];

        // Items needing quotes
        const needingQuotes = data.preSale.filter(
          (item: any) => !item.lastQuote && !item.hasQuote
        ).length;
        if (needingQuotes > 0) {
          actionPills.push({
            label: `${needingQuotes} need quotes`,
            action: () => setTab("preSale"),
            urgent: needingQuotes > 5,
          });
        }

        // Items awaiting shipment > 3 days
        const overdue = data.readyToShip.filter((item: any) => {
          const soldAt = item.soldAt ? new Date(item.soldAt) : item.createdAt ? new Date(item.createdAt) : null;
          if (!soldAt) return false;
          const daysSince = (Date.now() - soldAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > 3;
        }).length;
        if (overdue > 0) {
          actionPills.push({
            label: `${overdue} awaiting shipment > 3d`,
            action: () => setTab("readyToShip"),
            urgent: true,
          });
        }

        // Quotes expiring soon (< 24h from now via localStorage)
        let expiringQuotes = 0;
        [...data.preSale, ...data.readyToShip].forEach((item: any) => {
          try {
            const raw = localStorage.getItem(`ll_quote_${item.id}`);
            if (raw) {
              const q = JSON.parse(raw);
              const ageMs = Date.now() - (q.savedAt || 0);
              if (ageMs >= 43200000 && ageMs < 86400000) expiringQuotes++;
            }
          } catch { /* ignore */ }
        });
        if (expiringQuotes > 0) {
          actionPills.push({
            label: `${expiringQuotes} quotes expiring soon`,
            action: () => setTab("preSale"),
            urgent: false,
          });
        }

        // Shipments with exceptions
        const exceptions = data.shipped.filter((item: any) => {
          return item.deliveryStatus && item.deliveryStatus !== "DELIVERED";
        }).length;
        if (exceptions > 0) {
          actionPills.push({
            label: `${exceptions} shipments in transit`,
            action: () => setTab("shipped"),
            urgent: true,
          });
        }

        if (actionPills.length === 0) return null;
        console.log("[PriorityBanner] Showing", actionPills.length, "action pills");

        return (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            padding: "0.5rem 0.75rem",
            marginBottom: "0.75rem",
            borderRadius: "0.6rem",
            background: "rgba(255,152,0,0.04)",
            border: "1px solid rgba(255,152,0,0.12)",
            alignItems: "center",
          }}>
            <span style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#ff9800",
              textTransform: "uppercase" as const,
              letterSpacing: "0.05em",
              whiteSpace: "nowrap" as const,
            }}>
              {"\u26A1"} Action Required
            </span>
            {actionPills.map((ai, idx) => (
              <button
                key={idx}
                onClick={() => { ai.action(); console.log("[PriorityBanner] Clicked:", ai.label); }}
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: ai.urgent ? "rgba(244,67,54,0.1)" : "rgba(255,152,0,0.08)",
                  color: ai.urgent ? "#f44336" : "#ff9800",
                  border: `1px solid ${ai.urgent ? "rgba(244,67,54,0.2)" : "rgba(255,152,0,0.15)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap" as const,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                {ai.label}
              </button>
            ))}
            <button
              onClick={() => { setDismissedBanner(true); console.log("[PriorityBanner] Dismissed"); }}
              style={{
                marginLeft: "auto",
                fontSize: "0.55rem",
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 0.25rem",
                whiteSpace: "nowrap" as const,
              }}
            >
              {"\u2715"}
            </button>
          </div>
        );
      })()}

      {/* Redirect breadcrumb */}
      {itemIdParam && (
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          <Link href={`/items/${itemIdParam}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>{"\u2190"} Back to Item Dashboard</Link>
          <span> {"\u00B7"} Redirected from item page</span>
        </div>
      )}

      {/* Pulse animation for overdue badge */}
      <style>{`@keyframes ll-badge-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      {/* Tabs */}
      {(() => {
        // Compute overdue pulse: any readyToShip items > 3 days
        const hasOverdue = data?.readyToShip.some((item: any) => {
          const soldAt = item.soldAt ? new Date(item.soldAt) : item.createdAt ? new Date(item.createdAt) : null;
          if (!soldAt) return false;
          return (Date.now() - soldAt.getTime()) / (1000 * 60 * 60 * 24) > 3;
        }) ?? false;

        // Compute tab badges
        const tabBadges: Record<string, number> = {
          preSale: data?.preSale.length ?? 0,
          readyToShip: data?.readyToShip.length ?? 0,
          shipped: data?.shipped.filter((s: any) => s.deliveryStatus !== "DELIVERED").length ?? 0,
          freight: savedFreightCount,
          pickup: data ? [...data.preSale, ...data.readyToShip].filter((i: any) => i.saleMethod === "LOCAL_PICKUP" || i.saleMethod === "BOTH").length : 0,
        };

        return (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            {TABS.map((t) => {
              const count = tabBadges[t.key] ?? 0;
              const isActive = tab === t.key;
              const isRTS = t.key === "readyToShip";
              const isUrgent = isRTS && hasOverdue;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.4rem",
                    background: isActive ? "rgba(0,188,212,0.15)" : "transparent",
                    color: isActive ? "#00bcd4" : "var(--text-muted)",
                    border: isActive ? "1px solid rgba(0,188,212,0.3)" : "1px solid transparent",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: isActive ? 700 : 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    whiteSpace: "nowrap" as const,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {count > 0 && (
                    <span style={{
                      fontSize: "0.5rem",
                      fontWeight: 700,
                      padding: "1px 4px",
                      borderRadius: "9999px",
                      background: isUrgent ? "rgba(244,67,54,0.2)" : "rgba(0,188,212,0.15)",
                      color: isUrgent ? "#f44336" : "#00bcd4",
                      animation: isUrgent ? "ll-badge-pulse 2s infinite" : "none",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Dashboard */}
      {data && <TMSDashboard data={data} onTabSwitch={(t) => setTab(t as Tab)} />}

      {/* Content */}
      {loading && !data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem",
                borderRadius: "0.65rem",
                border: "1px solid var(--border-default)",
                background: "var(--bg-card)",
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: "0.4rem", background: "var(--ghost-bg)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: "55%", background: "var(--ghost-bg)", borderRadius: 3, marginBottom: 6 }} />
                <div style={{ height: 8, width: "35%", background: "var(--ghost-bg)", borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem", opacity: 0.4 }}>{"\u26A0\uFE0F"}</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)" }}>Could Not Load Shipping Data</div>
          <div style={{ fontSize: "0.82rem", marginTop: "0.25rem", lineHeight: 1.5, maxWidth: 320, margin: "0.25rem auto 0" }}>There was a problem loading your shipping data. This is usually temporary.</div>
          <button onClick={fetchData} style={{ marginTop: "0.75rem", padding: "0.4rem 1rem", fontSize: "0.78rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", cursor: "pointer" }}>
            {"\u{1F504}"} Retry
          </button>
        </div>
      ) : (
        <>
          {tab === "preSale" && <PreSaleTab items={data.preSale} estimates={allEstimates} onEstimate={handleEstimate} onSwitchTab={(t) => setTab(t as Tab)} />}
          {tab === "readyToShip" && (
            <ReadyToShipTab items={data.readyToShip} estimates={allEstimates} onEstimate={handleEstimate} onRefresh={fetchData} highlightId={itemIdParam} />
          )}
          {tab === "shipped" && <ShippedTab items={data.shipped} allData={data} freightBOL={freightBOLForTracking} pickupStatuses={pickupStatusesForTracking} />}
          {tab === "freight" && <FreightTab items={[...data.preSale, ...data.readyToShip]} />}
          {tab === "pickup" && <LocalPickupTab data={data} />}
        </>
      )}
    </div>
  );
}
