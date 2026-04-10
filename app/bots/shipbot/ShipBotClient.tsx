"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BotItemSelector from "../BotItemSelector";
import { runStandardAnalysis, runMegaAnalysis } from "@/lib/agents/runner";
import type { AgentResult, MultiAgentRun } from "@/lib/agents/runner";
import { searchCities, type CityEntry } from "@/lib/shipping/city-lookup";

type ItemData = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  hasAnalysis: boolean;
  aiResult: string | null;
  category: string;
};

type CarrierRate = {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  isDemo?: boolean;
};

type FreightQuote = {
  carrier: string;
  service: string;
  totalCost: number;
  transitDays: string;
  includedServices: string[];
  extraOptions: string[];
  isDemo?: boolean;
};

type Dimensions = {
  length: number;
  width: number;
  height: number;
  weight: number;
};

type PackagingType = "box" | "envelope" | "tube" | "crate" | "pallet";

const PACKAGING_TYPES: { value: PackagingType; label: string; icon: string }[] = [
  { value: "box", label: "Box", icon: "📦" },
  { value: "envelope", label: "Envelope", icon: "✉️" },
  { value: "tube", label: "Tube", icon: "🧻" },
  { value: "crate", label: "Crate", icon: "🪵" },
  { value: "pallet", label: "Pallet", icon: "🏗️" },
];

const CATEGORY_DEFAULTS: Record<string, { dims: Dimensions; packaging: PackagingType; fragile: boolean }> = {
  furniture: { dims: { length: 48, width: 24, height: 30, weight: 45 }, packaging: "crate", fragile: false },
  electronics: { dims: { length: 18, width: 14, height: 10, weight: 5 }, packaging: "box", fragile: true },
  jewelry: { dims: { length: 8, width: 6, height: 3, weight: 0.5 }, packaging: "box", fragile: true },
  clothing: { dims: { length: 14, width: 10, height: 4, weight: 1.5 }, packaging: "envelope", fragile: false },
  art: { dims: { length: 36, width: 4, height: 28, weight: 8 }, packaging: "tube", fragile: true },
  antiques: { dims: { length: 24, width: 18, height: 12, weight: 12 }, packaging: "box", fragile: true },
  toys: { dims: { length: 16, width: 12, height: 8, weight: 2 }, packaging: "box", fragile: false },
  books: { dims: { length: 12, width: 9, height: 6, weight: 4 }, packaging: "box", fragile: false },
  collectibles: { dims: { length: 12, width: 10, height: 8, weight: 2 }, packaging: "box", fragile: true },
  kitchenware: { dims: { length: 18, width: 14, height: 10, weight: 6 }, packaging: "box", fragile: true },
  tools: { dims: { length: 20, width: 14, height: 10, weight: 12 }, packaging: "box", fragile: false },
  instruments: { dims: { length: 48, width: 18, height: 8, weight: 15 }, packaging: "crate", fragile: true },
  appliances: { dims: { length: 30, width: 22, height: 18, weight: 25 }, packaging: "box", fragile: false },
};

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function getCategoryDefaults(category: string): { dims: Dimensions; packaging: PackagingType; fragile: boolean } {
  const key = Object.keys(CATEGORY_DEFAULTS).find((k) => category.toLowerCase().includes(k));
  return key ? CATEGORY_DEFAULTS[key] : { dims: { length: 18, width: 14, height: 8, weight: 5 }, packaging: "box", fragile: false };
}

/* ─── Agent card for Mega Mode ─────────────────────────────────────────── */

function AgentShipCard({ agent }: { agent: AgentResult }) {
  const d = agent.data;
  const isPlaceholder = agent.status === "placeholder";
  return (
    <div style={{
      background: "var(--bg-card, var(--ghost-bg))",
      border: "1px solid var(--border-card, var(--border-default))",
      borderRadius: "1.25rem",
      padding: "1.25rem",
      opacity: isPlaceholder ? 0.5 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "1.1rem" }}>{agent.agentIcon}</span>
        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>{agent.agentName}</span>
        <span style={{
          marginLeft: "auto", fontSize: "0.6rem", fontWeight: 600, padding: "0.15rem 0.45rem",
          borderRadius: "9999px",
          background: isPlaceholder ? "var(--ghost-bg)" : "rgba(76,175,80,0.15)",
          color: isPlaceholder ? "var(--text-muted)" : "#4caf50",
        }}>
          {isPlaceholder ? "Coming Soon" : `${Math.round(agent.confidence * 100)}%`}
        </span>
      </div>
      {isPlaceholder ? (
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{agent.error}</div>
      ) : d && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {d.shippingNotes && d.shippingNotes.length > 0 && (
            <div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Shipping Notes</div>
              <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                {d.shippingNotes.map((n: string, i: number) => (
                  <li key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.15rem" }}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          {d.packagingTips && d.packagingTips.length > 0 && (
            <div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Packaging Tips</div>
              <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                {d.packagingTips.map((t: string, i: number) => (
                  <li key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.15rem" }}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.25rem" }}>{agent.keyInsight}</div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────── */

export default function ShipBotClient({ items }: { items: ItemData[] }) {
  const searchParams = useSearchParams();
  const itemParam = searchParams.get("item");
  const [selectedId, setSelectedId] = useState<string | null>(
    (itemParam && items.some((i) => i.id === itemParam)) ? itemParam : items[0]?.id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Editable package profile
  const [dims, setDims] = useState<Dimensions>({ length: 18, width: 14, height: 8, weight: 5 });
  const [packaging, setPackaging] = useState<PackagingType>("box");
  const [fragile, setFragile] = useState(false);

  // Destination
  const [destQuery, setDestQuery] = useState("");
  const [destZip, setDestZip] = useState("");
  const [destLabel, setDestLabel] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CityEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const destRef = useRef<HTMLDivElement>(null);

  // Rates
  const [rates, setRates] = useState<CarrierRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"cheapest" | "fastest">("cheapest");
  const [fromZip, setFromZip] = useState("04101");

  // LTL Freight
  const [freightQuotes, setFreightQuotes] = useState<FreightQuote[]>([]);
  const [freightLoading, setFreightLoading] = useState(false);
  const [freightScheduled, setFreightScheduled] = useState(false);

  // Pickup
  const [pickupAddress, setPickupAddress] = useState("123 Main St, Waterville, ME 04901");
  const [pickupAvailability, setPickupAvailability] = useState("Weekdays 9 AM – 5 PM");
  const [pickupInstructions, setPickupInstructions] = useState("");

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  // Mega mode
  const [megaMode, setMegaMode] = useState(false);
  const [megaAnimating, setMegaAnimating] = useState(false);
  const [megaStep, setMegaStep] = useState(0);

  const item = items.find((i) => i.id === selectedId);
  const ai = useMemo(() => safeJson(item?.aiResult ?? null), [item?.aiResult]);

  const isLTL = dims.weight >= 40;

  // Auto-populate from AI analysis
  useEffect(() => {
    if (!item) return;
    const category = ai?.category || item.category || "general";
    const defaults = getCategoryDefaults(category);
    setDims(defaults.dims);
    setPackaging(defaults.packaging);
    setFragile(defaults.fragile);
    setFromZip("04901"); // Waterville, ME default
    setRates([]);
    setFreightQuotes([]);
    setDestQuery("");
    setDestZip("");
    setDestLabel("");
    setInitialized(true);
    setMegaMode(false);
    setMegaStep(0);
    setMegaAnimating(false);
    setFreightScheduled(false);
  }, [selectedId]);

  // City search
  useEffect(() => {
    if (destQuery.length >= 2) {
      const results = searchCities(destQuery);
      setCitySuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  }, [destQuery]);

  // Click outside to close suggestions
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectCity(city: CityEntry) {
    setDestZip(city.zip);
    setDestLabel(city.label);
    setDestQuery(city.label);
    setShowSuggestions(false);
  }

  // Standard/Mega agent results
  const standardResult = useMemo(() => {
    if (!item || !ai) return null;
    const priceMid = ai.estimated_value_mid || 55;
    return runStandardAnalysis(item.id, "shipping", { name: ai.item_name || item.title, category: ai.category || item.category || "General", priceMid });
  }, [item?.id, ai, item?.category]);

  const megaRun = useMemo<MultiAgentRun | null>(() => {
    if (!megaMode || !item || !ai) return null;
    const priceMid = ai.estimated_value_mid || 55;
    return runMegaAnalysis(item.id, "shipping", { name: ai.item_name || item.title, category: ai.category || item.category || "General", priceMid });
  }, [megaMode, item?.id, ai, item?.category]);

  function activateMega() {
    setMegaAnimating(true);
    setMegaStep(1);
    setTimeout(() => setMegaStep(2), 1500);
    setTimeout(() => { setMegaStep(3); setMegaAnimating(false); setMegaMode(true); }, 2500);
  }

  // Get carrier rates
  async function fetchRates() {
    if (!destZip || !fromZip) return;
    setRatesLoading(true);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromZip,
          toZip: destZip,
          weight: dims.weight,
          length: dims.length,
          width: dims.width,
          height: dims.height,
        }),
      });
      const json = await res.json();
      if (json.rates) {
        const mapped: CarrierRate[] = json.rates.map((r: any) => ({
          carrier: r.provider || r.carrier,
          service: r.servicelevel_name || r.service,
          rate: parseFloat(r.amount || r.rate) || 0,
          currency: r.currency || "USD",
          estimatedDays: r.estimated_days || r.estimatedDays || 5,
          isDemo: json.isMock || r.isDemo,
        }));
        setRates(mapped.filter((r) => r.rate > 0).sort((a, b) => a.rate - b.rate));
      }
    } catch { /* ignore */ }
    setRatesLoading(false);
  }

  // Get LTL freight quotes
  async function fetchFreight() {
    if (!destZip || !fromZip) return;
    setFreightLoading(true);
    try {
      const res = await fetch("/api/shipping/freight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quote",
          weight: dims.weight,
          length: dims.length,
          width: dims.width,
          height: dims.height,
          fromZip,
          toZip: destZip,
        }),
      });
      const json = await res.json();
      if (json.carriers) {
        setFreightQuotes(json.carriers.map((c: any) => ({
          carrier: c.carrier,
          service: c.service,
          totalCost: c.price,
          transitDays: c.transit,
          includedServices: c.guaranteed ? ["Guaranteed transit time"] : ["Standard transit"],
          extraOptions: [],
          isDemo: true,
        })));
      }
    } catch { /* ignore */ }
    setFreightLoading(false);
  }

  async function scheduleFreightPickup(carrier: string) {
    try {
      const res = await fetch("/api/shipping/freight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          carrier,
          pickupDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
          itemId: selectedId,
        }),
      });
      const json = await res.json();
      if (json.confirmed) {
        setFreightScheduled(true);
        showToast(`Freight pickup scheduled: ${json.confirmationNumber}`);
      }
    } catch { /* ignore */ }
  }

  // Sort rates
  const sortedRates = useMemo(() => {
    const r = [...rates];
    if (sortBy === "cheapest") return r.sort((a, b) => a.rate - b.rate);
    return r.sort((a, b) => a.estimatedDays - b.estimatedDays);
  }, [rates, sortBy]);

  const cheapestRate = rates.length > 0 ? Math.min(...rates.map((r) => r.rate)) : null;
  const fastestDays = rates.length > 0 ? Math.min(...rates.map((r) => r.estimatedDays)) : null;

  const ms = megaRun?.masterSummary;
  const cr = ms?.consensusResult;

  // Packaging tips from AI analysis
  const packagingTips = useMemo(() => {
    const tips: string[] = [];
    if (fragile) tips.push("Double-wrap in bubble wrap — use corner protectors for antiques and glass");
    if (dims.weight > 30) tips.push("Use double-walled corrugated box — reinforce bottom with extra tape");
    if (packaging === "crate") tips.push("Line crate interior with foam padding — secure item with straps");
    if (packaging === "tube") tips.push("Roll art between acid-free tissue paper — insert foam end caps");
    tips.push("Fill all void space with packing peanuts or crumpled kraft paper");
    if (isLTL) tips.push("Palletize and shrink-wrap for freight — must be strapped to pallet");
    if (ai?.category?.toLowerCase()?.includes("electronic")) tips.push("Use anti-static bags for electronics");
    return tips;
  }, [fragile, dims.weight, packaging, isLTL, ai?.category]);

  return (
    <div>
      <BotItemSelector
        items={items.map((i) => ({ id: i.id, title: i.title, photo: i.photo, status: i.status, hasAnalysis: i.hasAnalysis }))}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          background: "rgba(76,175,80,0.95)", color: "#fff", padding: "0.75rem 1.5rem",
          borderRadius: "0.75rem", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}>
          {toast}
        </div>
      )}

      {!item ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>📦</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Select an Item for Shipping</div>
          <div style={{ fontSize: "0.82rem" }}>Choose an item above to configure packaging and compare carrier rates.</div>
        </div>
      ) : (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Mode header + MegaBot button */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg-card, var(--ghost-bg))",
            border: "1px solid var(--border-card)", borderRadius: "1rem",
            padding: "0.75rem 1.25rem", flexWrap: "wrap", gap: "0.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: megaMode ? "#4caf50" : "var(--accent)" }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {megaMode ? "Mega Mode Active" : "Standard Mode — OpenAI Agent"}
              </span>
              {megaMode && (
                <span style={{ fontSize: "0.6rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(76,175,80,0.15)", color: "#4caf50" }}>4 AGENTS</span>
              )}
            </div>
            {!megaMode && !megaAnimating && (
              <button onClick={activateMega} style={{
                padding: "0.4rem 1rem", fontSize: "0.78rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "1px solid var(--accent)", background: "rgba(0,188,212,0.08)", color: "var(--accent)", cursor: "pointer",
              }}>
                ⚡ Run MegaBot — 5 credits
              </button>
            )}
          </div>

          {/* MegaBot activation animation */}
          {megaAnimating && !megaMode && (
            <div style={{ background: "var(--bg-card, var(--ghost-bg))", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "1.25rem", padding: "1.5rem" }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1rem", fontWeight: 600 }}>Activating MegaBot...</div>
              {[{ icon: "🟢", name: "OpenAI — Standard Rates", step: 1 }, { icon: "🟣", name: "Claude — Cost Optimizer", step: 2 }, { icon: "🔵", name: "Gemini — Logistics Analyzer", step: 3 }, { icon: "🌀", name: "Grok — Social Demand", step: 4 }].map((a) => (
                <div key={a.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
                  <span>{a.icon}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{a.name}</span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: "9999px", background: megaStep >= a.step ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)", color: megaStep >= a.step ? "#4caf50" : "#ff9800" }}>
                    {megaStep >= a.step ? "Complete" : "Analyzing..."}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* MEGA MODE: Agent cards + Shipping Master Summary */}
          {megaMode && megaRun && ms && cr && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {megaRun.agents.map((agent) => (
                  <AgentShipCard key={agent.agentName} agent={agent} />
                ))}
              </div>

              <div style={{ background: "var(--bg-card, var(--ghost-bg))", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "1.25rem", padding: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 600 }}>Shipping Master Summary</div>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 600, padding: "0.15rem 0.55rem", borderRadius: "9999px",
                    background: ms.agreeLevel === "strong" ? "rgba(76,175,80,0.15)" : ms.agreeLevel === "mixed" ? "rgba(255,152,0,0.15)" : "rgba(239,68,68,0.15)",
                    color: ms.agreeLevel === "strong" ? "#4caf50" : ms.agreeLevel === "mixed" ? "#ff9800" : "#ef5350",
                  }}>
                    {ms.agreeLevel === "strong" ? "Strong Agreement" : ms.agreeLevel === "mixed" ? "Mixed" : "Divergent"}
                  </span>
                </div>

                {ms.mergedInsights.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Merged Shipping Insights</div>
                    <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                      {ms.mergedInsights.map((f: string, i: number) => (
                        <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem", lineHeight: 1.5 }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.12)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.35rem", fontWeight: 600 }}>Recommendation</div>
                  <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{ms.recommendation}</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>What To Do Next</div>
                  <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
                    {ms.whatToDoNext.map((step: string, i: number) => (
                      <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem", lineHeight: 1.5 }}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}

          {/* ─── Item Shipping Profile ─────────────────────────────────── */}
          <div style={{
            background: "var(--bg-card, var(--ghost-bg))",
            border: "1px solid var(--border-card)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", fontWeight: 600 }}>Item Shipping Profile</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {fragile && <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(239,83,80,0.15)", color: "#ef5350", fontSize: "0.65rem", fontWeight: 600 }}>FRAGILE</span>}
                {isLTL && <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(156,39,176,0.15)", color: "#ce93d8", fontSize: "0.65rem", fontWeight: 600 }}>LTL FREIGHT</span>}
              </div>
            </div>

            {/* Dimension inputs */}
            <div className="bot-4col-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {[
                { label: "Length (in)", key: "length" as const },
                { label: "Width (in)", key: "width" as const },
                { label: "Height (in)", key: "height" as const },
                { label: "Weight (lbs)", key: "weight" as const },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>{field.label}</label>
                  <input
                    type="number"
                    value={dims[field.key]}
                    onChange={(e) => setDims({ ...dims, [field.key]: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.65rem",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      background: "var(--ghost-bg)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "0.5rem",
                      outline: "none",
                    }}
                    min={0}
                    step={field.key === "weight" ? 0.5 : 1}
                  />
                </div>
              ))}
            </div>

            {/* Packaging type + Fragile toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.35rem", display: "block" }}>Packaging Type</label>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {PACKAGING_TYPES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPackaging(p.value)}
                      style={{
                        padding: "0.35rem 0.65rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        borderRadius: "0.5rem",
                        border: packaging === p.value ? "1.5px solid var(--accent)" : "1px solid var(--border-card)",
                        background: packaging === p.value ? "rgba(0,188,212,0.1)" : "var(--bg-card)",
                        color: packaging === p.value ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <span style={{ fontSize: "0.9rem" }}>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.35rem", display: "block" }}>Fragile</label>
                <button
                  onClick={() => setFragile(!fragile)}
                  style={{
                    padding: "0.4rem 1rem",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    borderRadius: "0.5rem",
                    border: fragile ? "1.5px solid #ef5350" : "1px solid var(--border-card)",
                    background: fragile ? "rgba(239,83,80,0.12)" : "var(--bg-card)",
                    color: fragile ? "#ef5350" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {fragile ? "⚠️ FRAGILE" : "Not fragile"}
                </button>
              </div>
            </div>
          </div>

          {/* ─── Carrier Rate Comparison ───────────────────────────────── */}
          <div style={{
            background: "var(--bg-card, var(--ghost-bg))",
            border: "1px solid var(--border-card)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 600 }}>Carrier Rate Comparison</div>

            {/* Ship From + Ship To */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>Ship From (ZIP)</label>
                <input
                  type="text"
                  value={fromZip}
                  onChange={(e) => setFromZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="04901"
                  maxLength={5}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.65rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    background: "var(--ghost-bg)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "0.5rem",
                    outline: "none",
                  }}
                />
              </div>

              <div ref={destRef} style={{ position: "relative" }}>
                <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>Ship To (City or ZIP)</label>
                <input
                  type="text"
                  value={destQuery}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    // If they clear the field, clear zip
                    if (!e.target.value) { setDestZip(""); setDestLabel(""); }
                    // If they type a 5-digit zip directly
                    const zipMatch = e.target.value.match(/^(\d{5})$/);
                    if (zipMatch) { setDestZip(zipMatch[1]); setDestLabel(zipMatch[1]); }
                  }}
                  onFocus={() => { if (citySuggestions.length > 0) setShowSuggestions(true); }}
                  placeholder="Search city or enter ZIP..."
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.65rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    background: "var(--ghost-bg)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "0.5rem",
                    outline: "none",
                  }}
                />
                {/* City suggestions dropdown */}
                {showSuggestions && citySuggestions.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                    marginTop: "0.25rem",
                    background: "var(--bg-card, #1a1a2e)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}>
                    {citySuggestions.map((city) => (
                      <button
                        key={city.label}
                        onClick={() => selectCity(city)}
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "transparent",
                          border: "none",
                          borderBottom: "1px solid var(--border-default)",
                          color: "var(--text-primary)",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{city.label}</span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{city.zip}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Get Rates button */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <button
                onClick={() => { fetchRates(); if (isLTL) fetchFreight(); }}
                disabled={!destZip || !fromZip || ratesLoading}
                className="btn-primary"
                style={{ padding: "0.55rem 1.5rem", fontSize: "0.85rem", opacity: (!destZip || !fromZip) ? 0.5 : 1 }}
              >
                {ratesLoading ? "Getting rates..." : "Get Carrier Rates"}
              </button>
              {destLabel && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Shipping to {destLabel}</span>}
            </div>

            {/* Sort controls */}
            {rates.length > 0 && (
              <>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  {(["cheapest", "fastest"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        borderRadius: "9999px",
                        border: sortBy === s ? "1.5px solid var(--accent)" : "1px solid var(--border-card)",
                        background: sortBy === s ? "rgba(0,188,212,0.1)" : "transparent",
                        color: sortBy === s ? "var(--accent)" : "var(--text-muted)",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {s === "cheapest" ? "💰 Cheapest" : "⚡ Fastest"}
                    </button>
                  ))}
                  {rates[0]?.isDemo && (
                    <span style={{ marginLeft: "auto", fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", background: "rgba(255,152,0,0.12)", color: "#ff9800", fontWeight: 600 }}>DEMO RATES</span>
                  )}
                </div>

                {/* Carrier rate cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {sortedRates.map((r, i) => {
                    const isBestValue = r.rate === cheapestRate;
                    const isFastest = r.estimatedDays === fastestDays && r.estimatedDays < (sortedRates[sortedRates.length - 1]?.estimatedDays || 99);
                    return (
                      <div key={`${r.carrier}-${r.service}-${i}`} style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem 1.25rem",
                        borderRadius: "1rem",
                        border: isBestValue ? "1.5px solid var(--accent)" : "1px solid var(--border-card)",
                        background: isBestValue ? "rgba(0,188,212,0.06)" : "var(--bg-card)",
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>{r.carrier}</span>
                            {isBestValue && <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "var(--accent)", color: "#000" }}>BEST VALUE</span>}
                            {isFastest && !isBestValue && <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(76,175,80,0.8)", color: "#fff" }}>FASTEST</span>}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{r.service}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: isBestValue ? "var(--accent)" : "var(--text-primary)" }}>${r.rate.toFixed(2)}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.estimatedDays} day{r.estimatedDays !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {rates.length === 0 && !ratesLoading && destZip && (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Click &quot;Get Carrier Rates&quot; to compare shipping options
              </div>
            )}
          </div>

          {/* ─── LTL Freight Section ────────────────────────────────────── */}
          {isLTL && (
            <div style={{
              background: "rgba(156,39,176,0.06)",
              border: "1px solid rgba(156,39,176,0.2)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🚛</span>
                <div>
                  <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ce93d8", fontWeight: 600 }}>LTL Freight Required</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Item weighs {dims.weight} lbs — requires freight carrier pickup</div>
                </div>
              </div>

              {freightQuotes.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {freightQuotes.map((fq, i) => (
                    <div key={fq.carrier} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem 1.25rem",
                      borderRadius: "1rem",
                      border: i === 0 ? "1.5px solid rgba(156,39,176,0.4)" : "1px solid var(--border-default)",
                      background: i === 0 ? "rgba(156,39,176,0.08)" : "var(--bg-card)",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}>
                      <div style={{ flex: 1, minWidth: "140px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>{fq.carrier}</span>
                          {i === 0 && <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "#ce93d8", color: "#000" }}>BEST</span>}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{fq.service} · {fq.transitDays}</div>
                        {fq.includedServices.length > 0 && (
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                            {fq.includedServices.join(" · ")}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: i === 0 ? "#ce93d8" : "var(--text-primary)" }}>${fq.totalCost.toFixed(2)}</div>
                        </div>
                        {!freightScheduled && (
                          <button
                            onClick={() => scheduleFreightPickup(fq.carrier)}
                            style={{
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              borderRadius: "0.5rem",
                              border: "1px solid rgba(156,39,176,0.4)",
                              background: "rgba(156,39,176,0.1)",
                              color: "#ce93d8",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Schedule Pickup
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {freightScheduled && (
                    <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1rem" }}>✅</span>
                      <span style={{ fontSize: "0.82rem", color: "#4caf50", fontWeight: 600 }}>Freight pickup scheduled — carrier will contact you to confirm window</span>
                    </div>
                  )}
                </div>
              ) : destZip && !freightLoading ? (
                <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  Click &quot;Get Carrier Rates&quot; above to also get freight quotes
                </div>
              ) : freightLoading ? (
                <div style={{ textAlign: "center", padding: "1rem", color: "#ce93d8", fontSize: "0.82rem" }}>Getting freight quotes...</div>
              ) : (
                <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>Enter a destination to get freight carrier quotes</div>
              )}
            </div>
          )}

          {/* ─── Pickup Options ─────────────────────────────────────────── */}
          <div style={{
            background: "var(--bg-card, var(--ghost-bg))",
            border: "1px solid var(--border-card)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 600 }}>Pickup Options</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>Pickup Address</label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  style={{
                    width: "100%", padding: "0.5rem 0.65rem", fontSize: "0.85rem",
                    color: "var(--text-primary)", background: "var(--ghost-bg)",
                    border: "1px solid var(--border-card)", borderRadius: "0.5rem", outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>Availability</label>
                <input
                  type="text"
                  value={pickupAvailability}
                  onChange={(e) => setPickupAvailability(e.target.value)}
                  style={{
                    width: "100%", padding: "0.5rem 0.65rem", fontSize: "0.85rem",
                    color: "var(--text-primary)", background: "var(--ghost-bg)",
                    border: "1px solid var(--border-card)", borderRadius: "0.5rem", outline: "none",
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>Special Instructions</label>
              <textarea
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                placeholder="Ring doorbell, items on porch, etc."
                rows={2}
                style={{
                  width: "100%", padding: "0.5rem 0.65rem", fontSize: "0.85rem",
                  color: "var(--text-primary)", background: "var(--ghost-bg)",
                  border: "1px solid var(--border-card)", borderRadius: "0.5rem", outline: "none",
                  resize: "vertical", fontFamily: "inherit",
                }}
              />
            </div>
            <button
              onClick={() => showToast("Pickup preferences saved")}
              style={{
                marginTop: "0.75rem", padding: "0.4rem 1rem", fontSize: "0.78rem", fontWeight: 600,
                borderRadius: "0.5rem", border: "1px solid var(--accent)",
                background: "rgba(0,188,212,0.08)", color: "var(--accent)", cursor: "pointer",
              }}
            >
              Save Pickup Preferences
            </button>
          </div>

          {/* ─── Packaging Tips ──────────────────────────────────────────── */}
          {packagingTips.length > 0 && (
            <div style={{
              background: "rgba(0,188,212,0.06)",
              border: "1px solid rgba(0,188,212,0.15)",
              borderRadius: "1.25rem",
              padding: "1.25rem",
            }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.75rem", fontWeight: 600 }}>Packaging Tips</div>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {packagingTips.map((tip, i) => (
                  <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem", lineHeight: 1.5 }}>{tip}</li>
                ))}
              </ul>
              {(standardResult?.data?.packagingTips?.length ?? 0) > 0 && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(0,188,212,0.1)" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.35rem" }}>AI Agent Tips</div>
                  <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                    {standardResult!.data!.packagingTips!.map((tip: string, i: number) => (
                      <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.25rem", lineHeight: 1.4, fontStyle: "italic" }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <div style={{ textAlign: "center", marginTop: "1.5rem", marginBottom: "1rem" }}>
          <Link href={`/items/${selectedId}`} style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)",
            textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem",
            border: "1px solid var(--border-default)", transition: "border-color 0.15s ease",
          }}>
            ← Back to Item
          </Link>
        </div>
      )}
    </div>
  );
}
