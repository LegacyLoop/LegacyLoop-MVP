"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import VehicleSpecsCard from "@/app/items/[id]/VehicleSpecsCard";
import BotLoadingState from "@/app/components/BotLoadingState";

type ItemPhoto = { id: string; filePath: string };

type Item = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  photos: ItemPhoto[];
  hasAnalysis: boolean;
  aiResult: string | null;
  carBotResult: string | null;
  carBotRunAt: string | null;
  category: string;
  vehicleYear: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleMileage: string | null;
  vinVisible: boolean;
  conditionScore: number | null;
  valuation: { low: number; mid: number; high: number } | null;
};

// Strict vehicle keywords — NO "car" (matches "card", "carbon", "carpet")
// Word-boundary regex prevents partial matches like "van" in "advantage"
const VEHICLE_KEYWORDS = [
  "vehicle", "automobile", "automotive", "truck", "pickup", "suv",
  "sedan", "coupe", "convertible", "minivan", "motorcycle", "boat",
  "tractor", "trailer", "rv", "camper", "atv", "motorhome",
];
const VEHICLE_REGEX = VEHICLE_KEYWORDS.map((kw) => new RegExp(`\\b${kw}\\b`, "i"));

function isVehicleText(text: string): boolean {
  return VEHICLE_REGEX.some((rx) => rx.test(text));
}

// Validate vehicleYear is a real car year (not "1990s" era from generic AI)
function looksLikeCarYear(v: string | null): boolean {
  if (!v) return false;
  const trimmed = v.trim();
  return /^\d{4}$/.test(trimmed) && parseInt(trimmed, 10) >= 1886 && parseInt(trimmed, 10) <= 2030;
}

// Known auto manufacturers — prevents "Boss", "Fender", "Apple" etc. from matching
const AUTO_MAKES = new Set([
  "acura", "alfa romeo", "amc", "aston martin", "audi", "bentley", "bmw",
  "buick", "cadillac", "chevrolet", "chevy", "chrysler", "datsun", "dodge",
  "ferrari", "fiat", "ford", "genesis", "gmc", "harley-davidson", "honda",
  "hummer", "hyundai", "infiniti", "isuzu", "jaguar", "jeep", "kawasaki",
  "kia", "lamborghini", "land rover", "lexus", "lincoln", "lotus", "maserati",
  "mazda", "mclaren", "mercedes", "mercury", "mini", "mitsubishi", "nissan",
  "oldsmobile", "plymouth", "pontiac", "porsche", "ram", "rivian", "rolls-royce",
  "saab", "saturn", "scion", "subaru", "suzuki", "tesla", "toyota", "triumph",
  "volkswagen", "volvo", "vw", "yamaha",
]);
function looksLikeAutoMake(v: string | null): boolean {
  if (!v) return false;
  return AUTO_MAKES.has(v.toLowerCase().trim());
}

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

// ─── MegaBot helpers ─────────────────────────────────────────────────────────

const MEGA_PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "🤖", label: "OpenAI", color: "#10a37f", specialty: "Comprehensive vehicle identification and market-wide pricing" },
  claude: { icon: "🧠", label: "Claude", color: "#d97706", specialty: "Deep condition analysis, mechanical insights, and ownership history clues" },
  gemini: { icon: "🔮", label: "Gemini", color: "#4285f4", specialty: "Market trend analytics, regional demand, and optimal listing timing" },
  grok: { icon: "🌀", label: "Grok (xAI)", color: "#00DC82", specialty: "Enthusiast communities, social sentiment, and viral vehicle appeal" },
};

function _megaNormKeys(o: any): any {
  if (!o || typeof o !== "object" || Array.isArray(o)) return o;
  const out: any = {};
  for (const key of Object.keys(o)) {
    const lk = key.toLowerCase();
    const val = o[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const inner: any = {};
      for (const ik of Object.keys(val)) inner[ik.toLowerCase()] = val[ik];
      out[lk] = inner;
    } else { out[lk] = val; }
  }
  return out;
}
const _megaObj = (v: any) => (v && typeof v === "object" && !Array.isArray(v)) ? v : null;

function _megaArr(d: any, ...keys: string[]): any[] {
  for (const k of keys) { if (Array.isArray(d[k]) && d[k].length > 0) return d[k]; }
  const wrappers = ["vehicle_evaluation", "car_analysis", "deep_dive", "megabot_enhancement"];
  for (const w of wrappers) { if (d[w] && typeof d[w] === "object") { for (const k of keys) { if (Array.isArray(d[w][k]) && d[w][k].length > 0) return d[w][k]; } } }
  return [];
}
function _megaField(d: any, ...keys: string[]): any {
  for (const k of keys) { if (d[k] != null && d[k] !== "" && d[k] !== "Unknown") return d[k]; }
  return null;
}

function extractMegaCarData(p: any) {
  let d = _megaNormKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _megaObj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];

  const identification = _megaObj(d.identification) || _megaObj(d.vehicle_identification) || null;
  const conditionAssessment = _megaObj(d.condition_assessment) || _megaObj(d.condition) || null;
  const valuation = _megaObj(d.valuation) || _megaObj(d.pricing) || null;
  const vehicleHistory = _megaObj(d.vehicle_history_context) || _megaObj(d.history) || null;
  const marketAnalysis = _megaObj(d.market_analysis) || _megaObj(d.market) || null;
  const sellingStrategy = _megaObj(d.selling_strategy) || _megaObj(d.strategy) || null;
  const commonIssues = _megaArr(d, "common_issues", "common_problems", "known_issues", "issues");
  const executiveSummary = _megaField(d, "executive_summary", "summary", "overall_summary");

  // Extract year/make/model from identification
  const year = identification?.year || _megaField(d, "year");
  const make = identification?.make || _megaField(d, "make");
  const model = identification?.model || _megaField(d, "model");
  const trim = identification?.trim || _megaField(d, "trim");

  // Extract condition grades
  const exteriorGrade = conditionAssessment?.exterior?.score || conditionAssessment?.exterior_score || conditionAssessment?.exterior_grade || null;
  const interiorGrade = conditionAssessment?.interior?.score || conditionAssessment?.interior_score || conditionAssessment?.interior_grade || null;
  const mechanicalGrade = conditionAssessment?.mechanical?.score || conditionAssessment?.mechanical_score || conditionAssessment?.mechanical_grade || null;
  const overallGrade = conditionAssessment?.overall_grade || conditionAssessment?.overall || null;

  // Extract valuation ranges
  const retailValue = valuation?.retail_value || valuation?.retail || null;
  const privatePartyValue = valuation?.private_party_value || valuation?.private_party || null;
  const tradeInValue = valuation?.trade_in_value || valuation?.trade_in || null;

  // Price low/high from any available
  const priceLow = retailValue?.low || privatePartyValue?.low || tradeInValue?.low || valuation?.low || null;
  const priceHigh = retailValue?.high || privatePartyValue?.high || tradeInValue?.high || valuation?.high || null;

  return {
    identification, conditionAssessment, valuation, vehicleHistory, marketAnalysis, sellingStrategy,
    commonIssues, executiveSummary,
    year, make, model, trim,
    exteriorGrade, interiorGrade, mechanicalGrade, overallGrade,
    retailValue, privatePartyValue, tradeInValue, priceLow, priceHigh,
  };
}

// Color constants
const AUTO_BLUE = "#00bcd4";
const AUTO_BLUE_BG = "rgba(0,188,212,0.08)";
const AUTO_BLUE_BORDER = "rgba(0,188,212,0.2)";

function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999,
      background: AUTO_BLUE, color: "#fff", padding: "0.75rem 1.25rem",
      borderRadius: "0.75rem", fontWeight: 600, fontSize: "0.85rem",
      boxShadow: `0 8px 32px rgba(33,150,243,0.4)`,
      animation: "fadeSlideUp 0.3s ease",
    }}>
      {message}
    </div>
  );
}

function GradeDisplay({ grade, label }: { grade: string; label: string }) {
  const color = grade.startsWith("A") ? "#4ade80" : grade.startsWith("B") ? "#f59e0b" : grade.startsWith("C") ? "#fb923c" : "#ef4444";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 900, color, lineHeight: 1 }}>{grade}</div>
      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.2rem" }}>{label}</div>
    </div>
  );
}

export default function CarBotClient({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("condition");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [megaBotExpanded, setMegaBotExpanded] = useState<string | null>(null);
  const [vin, setVin] = useState('');
  const [vinData, setVinData] = useState<any>(null);
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState('');
  const [mileage, setMileage] = useState('');
  const [mileageType, setMileageType] = useState<'exact' | 'estimated'>('exact');
  const [sellerDetails, setSellerDetails] = useState<any>({});
  const [savingData, setSavingData] = useState(false);
  const [plateBlurred, setPlateBlurred] = useState(false);
  const [blurringPlates, setBlurringPlates] = useState(false);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [itemPhotos, setItemPhotos] = useState<ItemPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Auto-select from URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const itemParam = params.get("item");
    if (itemParam) {
      setSelectedId(itemParam);
      const item = items.find((i) => i.id === itemParam);
      if (item?.carBotResult) setResult(safeJson(item.carBotResult));
    }
  }, [items]);

  useEffect(() => {
    if (!selectedId) { setResult(null); return; }
    setPlateBlurred(false);
    const item = items.find((i) => i.id === selectedId);
    if (item?.carBotResult) {
      setResult(safeJson(item.carBotResult));
    } else {
      setResult(null);
      fetch(`/api/bots/carbot/${selectedId}`)
        .then((r) => r.json())
        .then((d) => { if (d.hasResult) setResult(d.result); })
        .catch(() => {});
    }
  }, [selectedId, items]);

  async function runCarBot() {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bots/carbot/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
        showToast("CarBot analysis complete!");
      } else {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        showToast(err.error || "Analysis failed");
      }
    } catch {
      showToast("Analysis failed");
    }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Load MegaBot data
  useEffect(() => {
    if (!selectedId) { setMegaBotData(null); return; }
    fetch(`/api/megabot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.results?.carbot) setMegaBotData(d.results.carbot);
        else setMegaBotData(null);
      })
      .catch(() => setMegaBotData(null));
  }, [selectedId]);

  // Load vehicle data when selected item changes
  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/bots/carbot/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.vehicleData) {
          setVin(data.vehicleData.vin || '');
          setVinData(data.vehicleData.vinDecoded || null);
          setMileage(data.vehicleData.mileage || '');
          setMileageType(data.vehicleData.mileageType || 'exact');
          setSellerDetails(data.vehicleData);
        } else {
          setVin('');
          setVinData(null);
          setMileage('');
          setMileageType('exact');
          setSellerDetails({});
        }
      })
      .catch(() => {});
  }, [selectedId]);

  function formatVin(v: string): string {
    return v.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').substring(0, 17);
  }

  async function decodeVin() {
    if (vin.length !== 17) { setVinError('VIN must be 17 characters'); return; }
    setVinLoading(true);
    setVinError('');
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      const data = await res.json();
      const results = (data.Results || []).filter((r: any) => r.Value && r.Value.trim() && r.Value !== 'Not Applicable');
      const decoded: Record<string, string> = {};
      for (const r of results) decoded[r.Variable] = r.Value;
      setVinData(decoded);
      setVinError('');
      // Auto-save
      saveVehicleData({ ...sellerDetails, vin, vinDecoded: decoded });
    } catch {
      setVinError('VIN lookup failed — please try again');
    }
    setVinLoading(false);
  }

  async function saveVehicleData(data?: any) {
    if (!selectedId) return;
    setSavingData(true);
    const payload = data || {
      ...sellerDetails,
      vin: vin || undefined,
      vinDecoded: vinData || undefined,
      mileage: mileage || undefined,
      mileageType,
    };
    try {
      await fetch(`/api/bots/carbot/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch { /* ignore */ }
    setSavingData(false);
  }

  const runMegaCarBot = useCallback(async () => {
    if (!selectedId || megaBotLoading) return;
    setMegaBotData(null);
    setMegaBotLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch(`/api/megabot/${selectedId}?bot=carbot`, { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.providers || data.consensus)) {
          setMegaBotData(data);
        }
      } else {
        console.warn("[MegaCarBot] API error:", res.status);
      }
    } catch (e: any) {
      console.warn("[MegaCarBot] fetch error:", e.message);
    }
    setMegaBotLoading(false);
  }, [selectedId, megaBotLoading]);

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const selected = items.find((i) => i.id === selectedId);
  const ai = safeJson(selected?.aiResult ?? null);
  const isVehicle = selected ? (
    isVehicleText(selected.category) || isVehicleText(selected.title)
    || (looksLikeCarYear(selected.vehicleYear) && looksLikeAutoMake(selected.vehicleMake))
    || !!selected.carBotResult
  ) : false;
  const vehicleItems = items.filter((i) => {
    // Require BOTH valid year AND known auto make (prevents "Boss" pedals, "1990s" eras)
    const hasVehicleAI = looksLikeCarYear(i.vehicleYear) && looksLikeAutoMake(i.vehicleMake);
    return hasVehicleAI || isVehicleText(i.category) || isVehicleText(i.title) || !!i.carBotResult;
  });
  const analyzedItems = items.filter((i) => i.hasAnalysis);

  // Auto-blur license plates when vehicle detected
  useEffect(() => {
    if (!selectedId || !isVehicle || !result || plateBlurred || blurringPlates) return;
    setBlurringPlates(true);
    fetch(`/api/blur-plate/${selectedId}`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => { if (data.ok) setPlateBlurred(true); })
      .catch(() => {})
      .finally(() => setBlurringPlates(false));
  }, [selectedId, isVehicle, result, plateBlurred, blurringPlates]);

  // Sync photos when selected item changes
  useEffect(() => {
    if (!selected) { setItemPhotos([]); return; }
    setItemPhotos(selected.photos || []);
  }, [selected]);

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || !files.length || !selectedId) return;
    setUploadingPhotos(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("photos[]", files[i]);
      const res = await fetch(`/api/items/photos/${selectedId}`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.paths && Array.isArray(data.paths)) {
        setItemPhotos((prev) => [
          ...prev,
          ...data.paths.map((fp: string, idx: number) => ({ id: `new-${Date.now()}-${idx}`, filePath: fp })),
        ]);
      }
    } catch {
      setPhotoError("Photo upload failed. Please try again.");
      setTimeout(() => setPhotoError(null), 3000);
    }
    setUploadingPhotos(false);
  }

  const ident = result?.identification;
  const cond = result?.condition_assessment;
  const val = result?.valuation;
  const hist = result?.vehicle_history_context;
  const market = result?.market_analysis;
  const strategy = result?.selling_strategy;
  const pickup = result?.local_pickup_plan;
  const fun = result?.fun_facts;
  const nhtsaReport = result?.nhtsaReport;
  const nhtsaRecalls = nhtsaReport?.recalls?.items || [];
  const nhtsaComplaints = nhtsaReport?.complaints?.items || [];
  const nhtsaSafety = nhtsaReport?.safetyRatings;
  const vinFromPhoto = result?.identification?.vin_from_photo || result?.vin_from_photo;
  const odometerFromPhoto = result?.identification?.odometer_from_photo || result?.odometer_from_photo;

  return (
    <div style={{ paddingBottom: selectedId && selected ? "5rem" : undefined }}>
      {toast && <Toast message={toast} />}

      {/* Hero */}
      <div style={{
        borderRadius: "1rem", padding: "3px", marginBottom: "1.5rem",
        background: `linear-gradient(135deg, ${AUTO_BLUE}, #00838f, ${AUTO_BLUE})`,
        boxShadow: `0 4px 24px rgba(0,188,212,0.15)`,
      }}>
        <div style={{
          background: "var(--bg-card-solid)",
          borderRadius: "calc(1rem - 3px)",
          padding: "1.5rem 2rem",
        }}>
          {/* Top Row: Branding + Badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "14px",
                background: `linear-gradient(135deg, ${AUTO_BLUE}18, ${AUTO_BLUE}08)`,
                border: `1px solid ${AUTO_BLUE}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", flexShrink: 0,
              }}>🚗</div>
              <div>
                <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                  CarBot
                </h1>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.15rem 0 0", fontWeight: 500 }}>
                  Vehicle Specialist · AI-Powered Evaluation
                </p>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.35rem 0.85rem", borderRadius: "999px",
              background: `linear-gradient(135deg, ${AUTO_BLUE}15, ${AUTO_BLUE}08)`,
              border: `1px solid ${AUTO_BLUE}35`,
            }}>
              <span style={{ fontSize: "0.65rem" }}>🏠</span>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: AUTO_BLUE, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                Local Pickup Only
              </span>
            </div>
          </div>

          {/* Selected Vehicle Summary */}
          {selected && isVehicle && result && ident && (
            <div style={{
              background: "var(--ghost-bg)",
              border: "1px solid var(--border-default)",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "1.25rem",
              alignItems: "center",
              marginBottom: "1rem",
            }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.35rem", letterSpacing: "-0.01em" }}>
                  {[ident.year, ident.make, ident.model, ident.trim].filter(Boolean).join(" ") || selected.title}
                </h2>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                  {[ident.body_style, ident.engine, ident.drivetrain, ident.transmission].filter(Boolean).map((spec: string) => (
                    <span key={spec} style={{
                      padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.62rem", fontWeight: 600,
                      background: `${AUTO_BLUE}10`, color: "#0097a7", border: `1px solid ${AUTO_BLUE}20`,
                    }}>{spec}</span>
                  ))}
                </div>
                {(mileage || sellerDetails.titleStatus) && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.4rem 0 0", fontWeight: 500 }}>
                    {mileage ? `${Number(mileage).toLocaleString()} miles` : ""}
                    {mileage && sellerDetails.titleStatus ? " · " : ""}
                    {sellerDetails.titleStatus ? `${sellerDetails.titleStatus} Title` : ""}
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right" as const, minWidth: 80 }}>
                {cond?.overall_grade && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 40, height: 40, borderRadius: "10px", marginBottom: "0.3rem",
                    fontSize: "1.1rem", fontWeight: 900,
                    background: String(cond.overall_grade).startsWith("A") ? "rgba(74,222,128,0.12)"
                      : String(cond.overall_grade).startsWith("B") ? "rgba(251,191,36,0.12)" : "rgba(239,68,68,0.12)",
                    color: String(cond.overall_grade).startsWith("A") ? "#22c55e"
                      : String(cond.overall_grade).startsWith("B") ? "#eab308" : "#ef4444",
                    border: `1px solid ${String(cond.overall_grade).startsWith("A") ? "rgba(74,222,128,0.3)"
                      : String(cond.overall_grade).startsWith("B") ? "rgba(251,191,36,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}>
                    {cond.overall_grade}
                  </div>
                )}
                {val?.private_party_value?.mid && (
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: AUTO_BLUE }}>
                    ${Number(val.private_party_value.mid).toLocaleString()}
                  </div>
                )}
                <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Private Party Est.</div>
              </div>
            </div>
          )}

          {/* Privacy + Stats Strip */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              {plateBlurred && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.68rem", color: "#22c55e", fontWeight: 600 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "rgba(34,197,94,0.12)", fontSize: "0.6rem" }}>🛡️</span>
                  License plates auto-blurred
                </div>
              )}
              {blurringPlates && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: "var(--ghost-bg)", fontSize: "0.6rem" }}>🛡️</span>
                  Scanning for license plates...
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.72rem" }}>
              {[
                { label: "Vehicles", count: vehicleItems.length },
                { label: "Evaluated", count: items.filter((i) => i.carBotResult).length },
                { label: "Analyzed", count: analyzedItems.length },
              ].map((s) => (
                <span key={s.label} style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                  <strong style={{ color: AUTO_BLUE, fontWeight: 800 }}>{s.count}</strong> {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STATS BANNER (clickable) ═══ */}
      {(() => {
        const scannedItems = items.filter(i => i.carBotResult);
        const valVehicles = vehicleItems.filter(i => i.valuation?.mid);
        const totalVal = valVehicles.reduce((a, b) => a + (b.valuation?.mid ?? 0), 0);
        const avgVal = valVehicles.length ? Math.round(totalVal / valVehicles.length) : 0;
        const highItem = valVehicles.length ? valVehicles.reduce((a, b) => (a.valuation?.mid ?? 0) > (b.valuation?.mid ?? 0) ? a : b) : null;
        const lowItem = valVehicles.length ? valVehicles.reduce((a, b) => (a.valuation?.mid ?? 0) < (b.valuation?.mid ?? 0) ? a : b) : null;
        const statPanels = [
          { key: "total", label: "Total Items", value: items.length, icon: "📦" },
          { key: "vehicles", label: "Vehicles", value: vehicleItems.length, icon: "🚗" },
          { key: "scanned", label: "Scanned", value: scannedItems.length, icon: "🔬" },
          { key: "value", label: "Avg Value", value: avgVal ? `$${avgVal.toLocaleString()}` : "$--", icon: "💰" },
        ];
        return (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
              {statPanels.map((s) => (
                <div
                  key={s.key}
                  onClick={() => setExpandedStat(expandedStat === s.key ? null : s.key)}
                  style={{
                    background: expandedStat === s.key ? "rgba(0,188,212,0.06)" : "var(--bg-card-solid)",
                    border: expandedStat === s.key ? `2px solid ${AUTO_BLUE}` : "1px solid var(--border-default)",
                    borderRadius: "12px",
                    padding: "1rem 0.85rem", textAlign: "center" as const,
                    boxShadow: expandedStat === s.key ? `0 4px 16px rgba(0,188,212,0.15)` : "0 1px 3px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    transform: expandedStat === s.key ? "translateY(-2px)" : "none",
                    userSelect: "none" as const,
                  }}
                >
                  <div style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{s.icon}</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: AUTO_BLUE }}>{s.value}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: "0.15rem" }}>
                    {s.label} <span style={{ fontSize: "0.5rem", opacity: 0.6 }}>{expandedStat === s.key ? "▲" : "▼"}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Expanded stat detail panel */}
            {expandedStat && (
              <div style={{
                marginTop: "0.75rem", padding: "1rem 1.25rem", borderRadius: "12px",
                background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                {expandedStat === "total" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: AUTO_BLUE, fontWeight: 700, marginBottom: "0.65rem" }}>All Items Overview</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {[
                        { l: "Analyzed", v: analyzedItems.length },
                        { l: "Not Analyzed", v: items.length - analyzedItems.length },
                        { l: "Vehicles", v: vehicleItems.length },
                        { l: "With Value", v: valVehicles.length },
                      ].map(d => (
                        <div key={d.l} style={{ padding: "0.45rem 0.5rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", textAlign: "center" as const }}>
                          <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>{d.v}</div>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{d.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ maxHeight: "160px", overflowY: "auto" as const }}>
                      {items.slice(0, 12).map(it => (
                        <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.4rem",
                          borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                        }}>
                          {it.photo && <img src={it.photo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" as const }} />}
                          <span style={{ flex: 1, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</span>
                          <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", flexShrink: 0 }}>{it.status}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {expandedStat === "vehicles" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: AUTO_BLUE, fontWeight: 700, marginBottom: "0.65rem" }}>Detected Vehicles</div>
                    {vehicleItems.length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>No vehicles detected yet. Upload vehicle photos and run AI analysis.</p>
                    ) : (
                      <div style={{ maxHeight: "200px", overflowY: "auto" as const }}>
                        {vehicleItems.map(it => {
                          const ymm = [it.vehicleYear, it.vehicleMake, it.vehicleModel].filter(Boolean).join(" ");
                          return (
                            <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                              display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                              borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                            }}>
                              {it.photo && <img src={it.photo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{ymm || it.category}{it.carBotResult ? " · ✅ Evaluated" : ""}</div>
                              </div>
                              {it.valuation?.mid && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#10b981", flexShrink: 0 }}>${it.valuation.mid.toLocaleString()}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {expandedStat === "scanned" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: AUTO_BLUE, fontWeight: 700, marginBottom: "0.65rem" }}>CarBot Scan History</div>
                    {scannedItems.length === 0 ? (
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>No items scanned yet. Select a vehicle and run CarBot.</p>
                    ) : (
                      <div style={{ maxHeight: "200px", overflowY: "auto" as const }}>
                        {scannedItems.map(it => {
                          const cbr = safeJson(it.carBotResult);
                          const grade = cbr?.condition_assessment?.overall_grade ?? null;
                          return (
                            <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                              display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.45rem 0.4rem",
                              borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                            }}>
                              {it.photo && <img src={it.photo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" as const }} />}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</div>
                                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Scanned {it.carBotRunAt ? new Date(it.carBotRunAt).toLocaleDateString() : ""}</div>
                              </div>
                              {grade && <span style={{ padding: "0.1rem 0.45rem", borderRadius: 99, fontSize: "0.62rem", fontWeight: 700, background: "rgba(0,188,212,0.1)", color: AUTO_BLUE }}>{grade}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {expandedStat === "value" && (
                  <>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase" as const, letterSpacing: "0.1em", color: AUTO_BLUE, fontWeight: 700, marginBottom: "0.65rem" }}>Valuation Summary</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      {[
                        { l: "Portfolio Total", v: `$${totalVal.toLocaleString()}`, c: "#10b981" },
                        { l: "Average", v: `$${avgVal.toLocaleString()}`, c: AUTO_BLUE },
                        { l: "Highest", v: highItem ? `$${(highItem.valuation?.mid ?? 0).toLocaleString()}` : "--", c: "#10b981" },
                        { l: "Lowest", v: lowItem ? `$${(lowItem.valuation?.mid ?? 0).toLocaleString()}` : "--", c: "var(--text-muted)" },
                      ].map(d => (
                        <div key={d.l} style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "var(--ghost-bg)", textAlign: "center" as const }}>
                          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: d.c }}>{d.v}</div>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{d.l}</div>
                        </div>
                      ))}
                    </div>
                    {valVehicles.length > 0 && (
                      <div style={{ maxHeight: "140px", overflowY: "auto" as const }}>
                        {valVehicles.sort((a, b) => (b.valuation?.mid ?? 0) - (a.valuation?.mid ?? 0)).map(it => (
                          <div key={it.id} onClick={() => { setSelectedId(it.id); setExpandedStat(null); }} style={{
                            display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.4rem",
                            borderBottom: "1px solid var(--border-default)", cursor: "pointer",
                          }}>
                            {it.photo && <img src={it.photo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" as const }} />}
                            <span style={{ flex: 1, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>{it.title}</span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#10b981", flexShrink: 0 }}>${(it.valuation?.mid ?? 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Item Selector */}
      <div style={{
        background: "var(--bg-card)", border: `1px solid ${AUTO_BLUE_BORDER}`,
        borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
      }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          Select Vehicle for Evaluation
        </div>
        {vehicleItems.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
            {vehicleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.65rem", borderRadius: "0.5rem",
                  background: selectedId === item.id ? `${AUTO_BLUE}15` : "var(--bg-card)",
                  border: `1.5px solid ${selectedId === item.id ? AUTO_BLUE : "var(--border-default)"}`,
                  cursor: "pointer", textAlign: "left", color: "inherit", width: "100%",
                }}
              >
                {item.photo ? (
                  <img src={item.photo} alt="" style={{ width: 32, height: 32, borderRadius: "0.35rem", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: "0.35rem", background: "var(--ghost-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>📷</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>
                    🚗 Vehicle{!item.hasAnalysis ? " · Needs analysis" : ""}{item.carBotResult ? " · ✅ Evaluated" : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🚗</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No vehicles found in your inventory</div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 400, margin: "0 auto 1rem", lineHeight: 1.5 }}>
              Upload photos of a car, truck, motorcycle, or boat and run AI analysis to get started.
            </p>
            <Link href="/items/new" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 700,
              background: `linear-gradient(135deg, ${AUTO_BLUE}, #00838f)`,
              color: "#fff", borderRadius: "0.75rem", textDecoration: "none",
              boxShadow: `0 4px 14px ${AUTO_BLUE}40`,
            }}>
              📷 Upload Vehicle Photos
            </Link>
          </div>
        )}
      </div>

      {/* Not a vehicle warning */}
      {selected && !isVehicle && (
        <div style={{
          background: AUTO_BLUE_BG, border: `1px solid ${AUTO_BLUE_BORDER}`,
          borderRadius: "1rem", padding: "2rem", textAlign: "center", marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🚗</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Not a Vehicle</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 400, margin: "0.5rem auto 0" }}>
            This item was identified as &ldquo;{selected.category}&rdquo;. CarBot only works with vehicles.
          </p>
        </div>
      )}

      {/* Run Action Bar */}
      {selected && isVehicle && (
        <div style={{
          background: "var(--ghost-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(0,188,212,0.2)",
          borderRadius: "14px",
          padding: "0.9rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
        }}>
          <div>
            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.01em" }}>
              {selected.vehicleYear || ""} {selected.vehicleMake || ""} {selected.vehicleModel || selected.title}
            </span>
            {selected.valuation ? <span style={{ color: "#00bcd4", fontWeight: 600, fontSize: "0.95rem", marginLeft: "0.5rem" }}>· Est. ${selected.valuation.mid.toLocaleString()}</span> : null}
          </div>
          <button
            onClick={runCarBot}
            disabled={loading || !selected.hasAnalysis}
            style={{
              background: loading ? "var(--ghost-bg)" : "linear-gradient(135deg, #00bcd4, #009688)",
              border: "none",
              borderRadius: "10px",
              padding: "0.55rem 1.1rem",
              color: loading ? "var(--text-muted)" : "white",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              boxShadow: loading ? "none" : "0 2px 12px rgba(0,188,212,0.25)",
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: "0.85rem", height: "0.85rem", border: "2px solid var(--border-default)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                Analyzing...
              </>
            ) : result ? "🔄 Re-Evaluate — 1 cr" : "🚗 Run CarBot — 1 cr"}
          </button>
        </div>
      )}

      {/* Photo Gallery */}
      {selected && isVehicle && (
        <div style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(0,188,212,0.15)",
          borderRadius: "16px",
          padding: "1.25rem",
          marginTop: "1rem",
          marginBottom: "1.5rem",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem" }}>
              Vehicle Photos
            </span>
            <span style={{
              background: "rgba(0,188,212,0.15)",
              color: "#00bcd4",
              borderRadius: "20px",
              padding: "0.2rem 0.7rem",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}>
              {itemPhotos.length} photo{itemPhotos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Photo Grid */}
          {itemPhotos.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.75rem",
            }}>
              {itemPhotos.map((p) => (
                <div key={p.id} style={{
                  position: "relative",
                  borderRadius: "10px",
                  overflow: "hidden",
                  aspectRatio: "4/3",
                  background: "var(--ghost-bg)",
                  border: "1px solid rgba(0,188,212,0.1)",
                }}>
                  <img
                    src={p.filePath}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>
              No photos yet. Add photos below.
            </div>
          )}

          {/* Add Photo Button */}
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(0,188,212,0.08)",
            border: "1px dashed rgba(0,188,212,0.4)",
            borderRadius: "10px",
            padding: "0.75rem 1.25rem",
            color: "#00bcd4",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: uploadingPhotos ? "not-allowed" : "pointer",
            marginTop: "0.75rem",
            width: "100%",
            justifyContent: "center",
            opacity: uploadingPhotos ? 0.6 : 1,
          }}>
            <input
              type="file"
              accept="image/*,image/heic"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handlePhotoUpload(e.target.files)}
              disabled={uploadingPhotos}
            />
            {uploadingPhotos ? "Uploading..." : "+ Add Photos"}
          </label>

          {/* Upload error */}
          {photoError && (
            <div style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.5rem", textAlign: "center" }}>
              {photoError}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && selected && isVehicle && (
        <div>
          {/* Freshness Indicator */}
          {selected?.carBotRunAt && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", fontSize: "0.68rem", color: "var(--text-muted)" }}>
              <span>🕐</span>
              <span>Last evaluated: {(() => {
                const diff = Date.now() - new Date(selected.carBotRunAt).getTime();
                const hours = Math.floor(diff / 3600000);
                if (hours < 1) return "Just now";
                if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
                const days = Math.floor(hours / 24);
                return `${days} day${days !== 1 ? "s" : ""} ago`;
              })()}</span>
              {(() => {
                const diff = Date.now() - new Date(selected.carBotRunAt).getTime();
                const hours = Math.floor(diff / 3600000);
                return hours > 72 ? (
                  <span style={{ fontSize: "0.55rem", padding: "1px 6px", borderRadius: "4px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 600 }}>Consider re-running</span>
                ) : (
                  <span style={{ fontSize: "0.55rem", padding: "1px 6px", borderRadius: "4px", background: "rgba(76,175,80,0.1)", color: "#4caf50", fontWeight: 600 }}>Fresh</span>
                );
              })()}
            </div>
          )}
          {/* Section A — Vehicle ID Hero */}
          {ident && (
            <div style={{
              borderRadius: "1rem", padding: "3px", marginBottom: "1.5rem",
              background: `linear-gradient(135deg, ${AUTO_BLUE}, #00838f)`,
              boxShadow: `0 0 24px ${AUTO_BLUE}40`,
            }}>
              <div style={{ background: "var(--bg-card)", borderRadius: "calc(1rem - 3px)", padding: "1.5rem 2rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: AUTO_BLUE }}>Vehicle Identification</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                      {ident.year} {ident.make} {ident.model} {ident.trim || ""}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                      {[ident.generation, ident.body_style, ident.drivetrain, ident.engine, ident.transmission].filter(Boolean).map((tag: string) => (
                        <span key={tag} style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 600, background: "rgba(0,188,212,0.12)", color: "#0097a7", border: "1px solid rgba(0,188,212,0.2)" }}>{tag}</span>
                      ))}
                    </div>
                    {ident.color_exterior && (
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                        Color: {ident.color_exterior}{ident.color_interior ? ` / ${ident.color_interior}` : ""}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: AUTO_BLUE }}>{ident.identification_confidence}%</div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Confidence</div>
                  </div>
                </div>

                {/* LOCAL PICKUP ONLY banner */}
                <div style={{
                  marginTop: "1rem", padding: "0.75rem 1.25rem", borderRadius: "10px",
                  background: "var(--bg-card-solid)",
                  border: "1px solid rgba(0,188,212,0.35)",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>🚗</span>
                  <span style={{
                    color: "#0097a7", fontWeight: 700, fontSize: "0.78rem",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>
                    Local Pickup Only — Vehicles cannot be shipped through our platform
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIN + Mileage + Seller Data Section */}
          <div style={{
            background: "var(--bg-card)", border: `1px solid ${AUTO_BLUE_BORDER}`,
            borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
          }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.85rem" }}>
              Vehicle Data
            </div>

            {/* VIN Photo Suggestion */}
            <div style={{ padding: "0.65rem 0.85rem", marginBottom: "0.65rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "0.5rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "0.1rem" }}>📷</span>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Pro Tip: Our AI Can Read Your VIN</div>
                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>Upload a clear photo of your VIN plate and our AI will extract it automatically. VIN locations: dashboard (through windshield), driver door jamb, or engine bay.</p>
                <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "0.2rem 0 0", fontStyle: "italic" }}>A decoded VIN unlocks recall history, safety ratings, and complete factory specifications.</p>
              </div>
            </div>

            {/* VIN Detected from Photos */}
            {vinFromPhoto && (
              <div style={{ padding: "0.6rem 0.85rem", marginBottom: "0.75rem", background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1rem" }}>🔍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4caf50", marginBottom: "0.1rem" }}>VIN Detected in Vehicle Photos</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace", letterSpacing: "0.12em" }}>{vinFromPhoto}</div>
                </div>
                {!vin && (
                  <button onClick={() => { setVin(formatVin(vinFromPhoto)); }} style={{ padding: "0.35rem 0.75rem", fontSize: "0.72rem", fontWeight: 700, background: "linear-gradient(135deg, #00bcd4, #009688)", color: "#fff", border: "none", borderRadius: "0.4rem", cursor: "pointer", minHeight: "44px" }}>
                    Use This VIN
                  </button>
                )}
              </div>
            )}

            {/* Odometer Detected from Photos */}
            {odometerFromPhoto && (
              <div style={{ padding: "0.4rem 0.85rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem" }}>🔢</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Odometer detected: <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{odometerFromPhoto} miles</span>
                </span>
                {!mileage && (
                  <button onClick={() => setMileage(String(odometerFromPhoto).replace(/[^\d]/g, ""))} style={{ padding: "0.2rem 0.5rem", fontSize: "0.62rem", fontWeight: 600, background: "rgba(0,188,212,0.1)", color: "#00bcd4", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "0.3rem", cursor: "pointer" }}>
                    Use This Reading
                  </button>
                )}
              </div>
            )}

            {/* VIN Input */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                VIN (Vehicle Identification Number)
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(formatVin(e.target.value))}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  style={{
                    flex: 1, padding: "0.55rem 0.75rem", fontSize: "0.85rem", fontFamily: "monospace",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: "var(--ghost-bg)", border: `1px solid ${vin.length === 17 ? AUTO_BLUE : "var(--border-default)"}`,
                    borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none",
                  }}
                />
                <button
                  onClick={decodeVin}
                  disabled={vin.length !== 17 || vinLoading}
                  style={{
                    padding: "0.55rem 1rem", fontSize: "0.78rem", fontWeight: 700,
                    borderRadius: "0.5rem", border: "none", cursor: vin.length === 17 && !vinLoading ? "pointer" : "not-allowed",
                    background: vin.length === 17 ? `linear-gradient(135deg, ${AUTO_BLUE}, #00838f)` : "var(--ghost-bg)",
                    color: vin.length === 17 ? "#fff" : "var(--text-muted)",
                    opacity: vin.length !== 17 ? 0.5 : 1,
                  }}
                >
                  {vinLoading ? "Decoding..." : "Decode VIN"}
                </button>
              </div>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {vin.length}/17 characters — Found on door jamb, registration, or insurance card
              </div>
              {vinError && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: "0.3rem" }}>{vinError}</div>}
            </div>

            {/* VIN Decoded Results */}
            {vinData && (
              <div style={{
                marginBottom: "1rem", padding: "0.85rem", borderRadius: "0.65rem",
                background: `${AUTO_BLUE}08`, border: `1px solid ${AUTO_BLUE_BORDER}`,
              }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                  VIN Decoded Successfully
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem 1.5rem", fontSize: "0.75rem" }}>
                  {[
                    { label: "Make", value: vinData.Make },
                    { label: "Model", value: vinData.Model },
                    { label: "Year", value: vinData["Model Year"] },
                    { label: "Trim", value: vinData.Trim || vinData.Series },
                    { label: "Body", value: vinData["Body Class"] },
                    { label: "Drive", value: vinData["Drive Type"] },
                    { label: "Engine", value: vinData["Displacement (L)"] ? `${vinData["Displacement (L)"]}L ${vinData["Engine Number of Cylinders"] || ""}cyl` : null },
                    { label: "Fuel", value: vinData["Fuel Type - Primary"] },
                    { label: "Trans", value: vinData["Transmission Style"] },
                    { label: "Plant", value: vinData["Plant City"] ? `${vinData["Plant City"]}, ${vinData["Plant State"] || ""}` : null },
                    { label: "GVWR", value: vinData["Gross Vehicle Weight Rating From"] ? `${vinData["Gross Vehicle Weight Rating From"]} lbs` : null },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.15rem 0" }}>
                      <span style={{ color: "var(--text-muted)" }}>{f.label}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{f.value}</span>
                    </div>
                  ))}
                </div>
                {/* Safety features */}
                {(() => {
                  const safety = [
                    vinData["Anti-lock Braking System (ABS)"] === "Standard" && "ABS",
                    vinData["Electronic Stability Control (ESC)"] === "Standard" && "ESC",
                    vinData["Traction Control"] === "Standard" && "Traction Control",
                    vinData["Backup Camera"] === "Standard" && "Backup Camera",
                    vinData["Blind Spot Warning (BSW)"] === "Standard" && "BSW",
                    vinData["Forward Collision Warning (FCW)"] === "Standard" && "FCW",
                  ].filter(Boolean);
                  return safety.length > 0 ? (
                    <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                      {safety.map((s) => (
                        <span key={s as string} style={{ padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.55rem", fontWeight: 600, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Mileage Input */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Mileage
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="text"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value.replace(/[^\d]/g, ''))}
                  onBlur={() => { if (mileage) saveVehicleData(); }}
                  placeholder="e.g. 87000"
                  style={{
                    width: "140px", padding: "0.55rem 0.75rem", fontSize: "0.85rem",
                    background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                    borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none",
                  }}
                />
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>miles</span>
                <div style={{ display: "flex", gap: "0.75rem", marginLeft: "0.5rem" }}>
                  {(["exact", "estimated"] as const).map((t) => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", fontSize: "0.72rem", color: mileageType === t ? AUTO_BLUE : "var(--text-muted)" }}>
                      <input type="radio" name="mileageType" checked={mileageType === t} onChange={() => setMileageType(t)} style={{ accentColor: AUTO_BLUE }} />
                      {t === "exact" ? "Exact" : "Estimated"}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Seller Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              {[
                { key: "titleStatus", label: "Title Status", placeholder: "Clean / Salvage / Rebuilt", options: ["Clean", "Salvage", "Rebuilt", "Lemon"] },
                { key: "owners", label: "Number of Owners", placeholder: "1 / 2 / 3+", options: ["1", "2", "3+", "Unknown"] },
                { key: "accidents", label: "Accident History", placeholder: "None known", options: ["none", "Minor", "Major", "Unknown"] },
                { key: "drivetrain", label: "Drivetrain", placeholder: "FWD / RWD / AWD / 4WD", options: ["FWD", "RWD", "AWD", "4WD"] },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: "block", fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{field.label}</label>
                  <select
                    value={sellerDetails[field.key] || ""}
                    onChange={(e) => setSellerDetails((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                    style={{
                      width: "100%", padding: "0.45rem 0.6rem", fontSize: "0.78rem",
                      background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                      borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none",
                      appearance: "auto" as any,
                    }}
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options.map((o) => <option key={o} value={o}>{o === "none" ? "No accidents known" : o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Free text fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginTop: "0.65rem" }}>
              {[
                { key: "knownIssues", label: "Known Issues", placeholder: "Any problems the buyer should know about?", inputMode: undefined as ("numeric" | undefined) },
                { key: "recentService", label: "Recent Service/Repairs", placeholder: "Recent oil change, new brakes, etc.", inputMode: undefined as ("numeric" | undefined) },
                { key: "modifications", label: "Aftermarket Modifications", placeholder: "Lift kit, exhaust, wheels, etc.", inputMode: undefined as ("numeric" | undefined) },
                { key: "askingPrice", label: "Asking Price ($)", placeholder: "Optional", inputMode: "numeric" as ("numeric" | undefined) },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: "block", fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{field.label}</label>
                  <input
                    type="text"
                    inputMode={field.inputMode}
                    value={sellerDetails[field.key] || ""}
                    onChange={(e) => setSellerDetails((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "0.45rem 0.6rem", fontSize: "0.78rem",
                      background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                      borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Service records checkbox */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.65rem", flexWrap: "wrap" }}>
              {[
                { key: "serviceRecords", label: "Service Records Available" },
                { key: "windowSticker", label: "Original Window Sticker" },
                { key: "spareKey", label: "Spare Key Available" },
              ].map((cb) => (
                <label key={cb.key} style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={!!sellerDetails[cb.key]}
                    onChange={(e) => setSellerDetails((prev: any) => ({ ...prev, [cb.key]: e.target.checked }))}
                    style={{ accentColor: AUTO_BLUE }}
                  />
                  {cb.label}
                </label>
              ))}
            </div>

            {/* Save button */}
            <div style={{ marginTop: "0.85rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => saveVehicleData()}
                disabled={savingData}
                style={{
                  padding: "0.5rem 1.25rem", fontSize: "0.78rem", fontWeight: 700,
                  borderRadius: "0.5rem", border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${AUTO_BLUE}, #00838f)`,
                  color: "#fff", opacity: savingData ? 0.6 : 1,
                }}
              >
                {savingData ? "Saving..." : "Save Vehicle Data"}
              </button>
            </div>
          </div>

          {/* Vehicle History Placeholder */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
          }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
              Vehicle History Report
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {[
                { icon: "checkmark-free", label: "FREE NHTSA VIN Decode", desc: "Specs, safety, plant info" },
                { icon: "checkmark-ai", label: "AI Vehicle Intelligence", desc: "Common issues, reliability, costs" },
                { icon: "checkmark-market", label: "Market Analysis", desc: "Demand, pricing, competition" },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", fontSize: "0.72rem" }}>
                  <span style={{ color: "#4ade80", fontWeight: 700 }}>&#10003;</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{f.label}</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "0.65rem", borderRadius: "0.5rem", background: "var(--bg-card)", border: "1px dashed var(--border-default)" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.3rem" }}>Coming with future update:</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.62rem", color: "var(--text-muted)" }}>
                {["Full accident history", "Ownership chain", "Service records", "Odometer verification", "Title history", "Recall status"].map((f) => (
                  <span key={f} style={{ padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "var(--ghost-bg)", border: "1px solid var(--border-default)" }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {([
              { key: "condition", label: "📋 Condition", show: !!cond },
              { key: "valuation", label: "💰 Valuation", show: !!val },
              { key: "history", label: "🔧 History", show: !!hist },
              { key: "nhtsa", label: "📋 NHTSA", show: !!(nhtsaRecalls.length > 0 || nhtsaComplaints.length > 0 || nhtsaSafety) },
              { key: "market", label: "📊 Market", show: !!market },
              { key: "strategy", label: "🏷️ Strategy", show: !!strategy },
              { key: "pickup", label: "📍 Pickup", show: !!pickup },
              { key: "fun", label: "🎉 Fun Facts", show: !!fun },
            ]).filter((t) => t.show).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "0.45rem 0.85rem", borderRadius: "0.5rem",
                  fontSize: "0.75rem", fontWeight: 600, border: "none", cursor: "pointer",
                  background: activeTab === tab.key ? `${AUTO_BLUE}20` : "var(--bg-card)",
                  color: activeTab === tab.key ? AUTO_BLUE : "var(--text-muted)",
                  borderBottom: activeTab === tab.key ? `2px solid ${AUTO_BLUE}` : "2px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ background: "var(--bg-card)", border: `1px solid ${AUTO_BLUE_BORDER}`, borderRadius: "1rem", padding: "1.5rem", marginBottom: "1.5rem" }}>

            {/* ── Condition Tab ── */}
            {activeTab === "condition" && cond && (
              <div>
                {/* Overall grade + 3 gauges */}
                <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                  <GradeDisplay grade={cond.overall_grade || "B"} label="Overall Grade" />
                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    {[
                      { label: "Exterior", score: cond.exterior?.score, icon: "🎨" },
                      { label: "Interior", score: cond.interior?.score, icon: "🪑" },
                      { label: "Mechanical", score: cond.mechanical?.score, icon: "⚙️" },
                    ].map((g) => (
                      <div key={g.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.65rem", marginBottom: "0.1rem" }}>{g.icon}</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: g.score >= 7 ? "#4ade80" : g.score >= 4 ? "#f59e0b" : "#ef4444" }}>{g.score}/10</div>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{g.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VehicleSpecsCard */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <VehicleSpecsCard
                    year={String(ident?.year || selected.vehicleYear || "")}
                    make={ident?.make || selected.vehicleMake || undefined}
                    model={ident?.model || selected.vehicleModel || undefined}
                    mileage={selected.vehicleMileage || undefined}
                    vinVisible={selected.vinVisible}
                    conditionExterior={cond.exterior?.score}
                    conditionInterior={cond.interior?.score}
                    conditionMechanical={cond.mechanical?.score}
                    saleMethod="LOCAL_PICKUP"
                    nhtsaSafetyRating={nhtsaSafety?.overallRating != null ? Number(nhtsaSafety.overallRating) : null}
                    nhtsaRecallCount={nhtsaRecalls?.length ?? null}
                  />
                </div>

                {/* Expandable detail sections */}
                {[
                  { id: "ext", title: "🎨 Exterior Details", notes: cond.exterior?.overall_exterior_notes, items: [
                    { label: "Paint", value: cond.exterior?.paint_condition },
                    { label: "Glass", value: cond.exterior?.glass_condition },
                    { label: "Lights", value: cond.exterior?.lights_condition },
                    { label: "Tires", value: cond.exterior?.tire_condition },
                    { label: "Chrome/Trim", value: cond.exterior?.chrome_trim },
                  ] },
                  { id: "int", title: "🪑 Interior Details", notes: cond.interior?.overall_interior_notes, items: [
                    { label: "Seats", value: cond.interior?.seats },
                    { label: "Dashboard", value: cond.interior?.dashboard },
                    { label: "Steering", value: cond.interior?.steering_wheel },
                    { label: "Carpet/Headliner", value: cond.interior?.carpet_headliner },
                    { label: "Electronics", value: cond.interior?.electronics },
                  ] },
                  { id: "mech", title: "⚙️ Mechanical Details", notes: cond.mechanical?.overall_mechanical_notes, items: [
                    { label: "Engine Bay", value: cond.mechanical?.engine_bay },
                    { label: "Undercarriage", value: cond.mechanical?.undercarriage },
                    { label: "Suspension", value: cond.mechanical?.suspension_clues },
                    { label: "Exhaust", value: cond.mechanical?.exhaust },
                  ] },
                ].map((section) => (
                  <div key={section.id} style={{ marginBottom: "0.75rem", border: "1px solid var(--border-default)", borderRadius: "0.5rem" }}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      style={{ width: "100%", padding: "0.65rem 0.85rem", background: "var(--bg-card)", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: "inherit", borderRadius: "0.5rem" }}
                    >
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{section.title}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{expandedSections.has(section.id) ? "▼" : "▶"}</span>
                    </button>
                    {expandedSections.has(section.id) && (
                      <div style={{ padding: "0 0.85rem 0.85rem" }}>
                        {section.items.filter((i) => i.value).map((i) => (
                          <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: "1px solid var(--border-default)", fontSize: "0.75rem" }}>
                            <span style={{ color: "var(--text-muted)" }}>{i.label}</span>
                            <span style={{ color: "var(--text-secondary)", maxWidth: "60%", textAlign: "right" }}>{i.value}</span>
                          </div>
                        ))}
                        {section.notes && <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "0.5rem", marginBottom: 0 }}>{section.notes}</p>}
                      </div>
                    )}
                  </div>
                ))}

                {/* Body damage list */}
                {cond.exterior?.body_damage?.length > 0 && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", marginBottom: "0.3rem" }}>Visible Damage</div>
                    {cond.exterior.body_damage.map((d: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.2rem 0" }}>• {d}</div>
                    ))}
                  </div>
                )}

                {cond.condition_vs_seller_claim && (
                  <div style={{ marginTop: "1rem", padding: "0.65rem", borderLeft: `3px solid ${AUTO_BLUE}`, background: AUTO_BLUE_BG, borderRadius: "0 0.5rem 0.5rem 0" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", marginBottom: "0.2rem" }}>Condition vs Seller Claim</div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{cond.condition_vs_seller_claim}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Valuation Tab ── */}
            {activeTab === "valuation" && val && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  {[
                    { label: "🏷️ Private Party", data: val.private_party_value, highlight: true },
                    { label: "🏪 Dealer Trade-In", data: val.trade_in_value },
                    { label: "💰 Retail", data: val.retail_value },
                    { label: "🔨 Auction", data: val.auction_value },
                  ].map((v) => (
                    <div key={v.label} style={{
                      background: v.highlight ? `${AUTO_BLUE}12` : "var(--bg-card)",
                      border: `1.5px solid ${v.highlight ? AUTO_BLUE : "var(--border-default)"}`,
                      borderRadius: "0.75rem", padding: "0.85rem", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>{v.label}</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: v.highlight ? AUTO_BLUE : "var(--text-primary)" }}>
                        ${v.data?.low?.toLocaleString()} – ${v.data?.high?.toLocaleString()}
                      </div>
                      {v.data?.mid && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Mid: ${v.data.mid.toLocaleString()}</div>}
                    </div>
                  ))}
                </div>

                {val.kbb_range_estimate && (
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    {[
                      { label: "KBB Est.", value: val.kbb_range_estimate },
                      { label: "NADA Est.", value: val.nada_range_estimate },
                    ].filter((v) => v.value).map((v) => (
                      <div key={v.label} style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.65rem" }}>
                        <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{v.label}</div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{v.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {val.price_vs_market && (
                  <div style={{
                    padding: "0.5rem 0.75rem", borderRadius: "0.5rem", marginBottom: "1rem",
                    background: val.price_vs_market === "Underpriced" || val.price_vs_market === "Steal" ? "rgba(74,222,128,0.08)" : val.price_vs_market === "Overpriced" ? "rgba(239,68,68,0.08)" : AUTO_BLUE_BG,
                    border: `1px solid ${val.price_vs_market === "Underpriced" || val.price_vs_market === "Steal" ? "rgba(74,222,128,0.25)" : val.price_vs_market === "Overpriced" ? "rgba(239,68,68,0.25)" : AUTO_BLUE_BORDER}`,
                  }}>
                    <span style={{ fontWeight: 700, fontSize: "0.78rem", color: val.price_vs_market === "Underpriced" || val.price_vs_market === "Steal" ? "#4ade80" : val.price_vs_market === "Overpriced" ? "#ef4444" : AUTO_BLUE }}>
                      {val.price_vs_market === "Steal" ? "🔥" : val.price_vs_market === "Underpriced" ? "📉" : val.price_vs_market === "Overpriced" ? "📈" : "✅"} {val.price_vs_market}
                    </span>
                  </div>
                )}

                {val.valuation_factors?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>Value Factors</div>
                    {val.valuation_factors.map((f: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid var(--border-default)", fontSize: "0.75rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>{f.factor}</span>
                        <span style={{ fontWeight: 700, color: f.impact?.includes("+") ? "#4ade80" : f.impact?.includes("-") ? "#ef4444" : "var(--text-primary)" }}>{f.impact}</span>
                      </div>
                    ))}
                  </div>
                )}

                {val.mileage_impact && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0.5rem 0 0" }}>{val.mileage_impact}</p>}
              </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === "history" && hist && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  {[
                    { label: "Reliability", value: hist.reliability_rating },
                    { label: "Maint. Cost", value: hist.maintenance_costs },
                    { label: "Fuel Economy", value: hist.fuel_economy },
                    { label: "Insurance Est.", value: hist.insurance_estimate },
                  ].filter((h) => h.value).map((h) => (
                    <div key={h.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem 0.65rem" }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{h.label}</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>{h.value}</div>
                    </div>
                  ))}
                </div>

                {hist.common_problems?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>⚠️ Common Problems — Buyers Will Ask</div>
                    {hist.common_problems.map((p: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", padding: "0.3rem 0", borderBottom: "1px solid var(--border-default)" }}>{i + 1}. {p}</div>
                    ))}
                  </div>
                )}

                {hist.recalls?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", marginBottom: "0.3rem" }}>Known Recalls</div>
                    {hist.recalls.map((r: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.2rem 0" }}>• {r}</div>
                    ))}
                  </div>
                )}

                {(hist.years_this_model_to_buy?.length > 0 || hist.years_this_model_to_avoid?.length > 0) && (
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {hist.years_this_model_to_buy?.length > 0 && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", marginBottom: "0.2rem" }}>Best Years</div>
                        {hist.years_this_model_to_buy.map((y: string, i: number) => (
                          <div key={i} style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>✅ {y}</div>
                        ))}
                      </div>
                    )}
                    {hist.years_this_model_to_avoid?.length > 0 && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", marginBottom: "0.2rem" }}>Avoid</div>
                        {hist.years_this_model_to_avoid.map((y: string, i: number) => (
                          <div key={i} style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>❌ {y}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── NHTSA Tab ── */}
            {activeTab === "nhtsa" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Data Source Banner */}
                <div style={{ padding: "0.5rem 0.75rem", background: "rgba(76,175,80,0.06)", borderRadius: "0.5rem", border: "1px solid rgba(76,175,80,0.2)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.5rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(76,175,80,0.15)", color: "#4caf50", fontWeight: 700 }}>VERIFIED DATA</span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>Source: National Highway Traffic Safety Administration (NHTSA)</span>
                </div>

                {/* Safety Rating */}
                {nhtsaSafety && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "rgba(0,188,212,0.04)", borderRadius: "0.65rem", border: "1px solid rgba(0,188,212,0.15)" }}>
                    <div style={{ textAlign: "center", minWidth: "60px" }}>
                      <div style={{ fontSize: "2rem", fontWeight: 900, color: Number(nhtsaSafety.overallRating) >= 4 ? "#4ade80" : Number(nhtsaSafety.overallRating) >= 3 ? "#f59e0b" : "#ef4444", lineHeight: 1 }}>{nhtsaSafety.overallRating}</div>
                      <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>/ 5 Stars</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>NHTSA Safety Rating</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.4 }}>Government crash test rating for this year, make, and model</div>
                    </div>
                  </div>
                )}

                {/* Recalls */}
                <div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: nhtsaRecalls.length > 0 ? "#ef4444" : "#4ade80", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                    {nhtsaRecalls.length > 0 ? `🚨 ${nhtsaRecalls.length} Active Recalls` : "✅ No Active Recalls Found"}
                  </div>
                  {nhtsaRecalls.map((r: any, i: number) => (
                    <div key={i} style={{ padding: "0.65rem 0.75rem", marginBottom: "0.4rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.04)", borderLeft: "3px solid rgba(239,68,68,0.4)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{r.component}</div>
                        {r.reportDate && <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{r.reportDate}</span>}
                      </div>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 0.3rem" }}>{r.summary}</p>
                      {r.consequence && <p style={{ fontSize: "0.68rem", color: "#ef4444", lineHeight: 1.4, margin: "0 0 0.2rem" }}>Risk: {r.consequence}</p>}
                      {r.remedy && <p style={{ fontSize: "0.68rem", color: "#4ade80", lineHeight: 1.4, margin: 0 }}>Fix: {r.remedy}</p>}
                      {r.campaignNumber && <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Campaign: {r.campaignNumber}</div>}
                    </div>
                  ))}
                </div>

                {/* Complaints */}
                <div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: nhtsaComplaints.length > 0 ? "#f59e0b" : "#4ade80", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                    {nhtsaComplaints.length > 0 ? `⚠️ ${nhtsaComplaints.length} Consumer Complaints` : "✅ No Consumer Complaints Found"}
                  </div>
                  {nhtsaComplaints.slice(0, 10).map((c: any, i: number) => (
                    <div key={i} style={{ padding: "0.55rem 0.75rem", marginBottom: "0.35rem", borderRadius: "0.45rem", background: "rgba(245,158,11,0.04)", borderLeft: "3px solid rgba(245,158,11,0.3)" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.15rem" }}>{c.component}</div>
                      <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{c.summary}</p>
                      {(c.crash || c.fire) && <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem" }}>
                        {c.crash && <span style={{ fontSize: "0.55rem", color: "#ef4444", fontWeight: 600 }}>💥 Crash reported</span>}
                        {c.fire && <span style={{ fontSize: "0.55rem", color: "#ef4444", fontWeight: 600 }}>🔥 Fire reported</span>}
                      </div>}
                    </div>
                  ))}
                  {nhtsaComplaints.length > 10 && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center" }}>Showing 10 of {nhtsaComplaints.length} complaints</div>}
                </div>

                {/* No data fallback */}
                {!nhtsaSafety && nhtsaRecalls.length === 0 && nhtsaComplaints.length === 0 && (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📋</div>
                    <p style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>No NHTSA data available. Run CarBot with the correct year, make, and model to fetch vehicle history.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Market Tab ── */}
            {activeTab === "market" && market && (
              <div>
                <div className="bot-3col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  {[
                    { label: "Demand", value: market.demand_level },
                    { label: "Trend", value: market.demand_trend },
                    { label: "Time to Sell", value: market.time_to_sell_estimate },
                  ].map((m) => (
                    <div key={m.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "0.5rem", padding: "0.5rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{m.label}</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: m.value === "Hot" || m.value === "Rising" ? "#4ade80" : m.value === "Weak" || m.value === "Declining" ? "#ef4444" : "var(--text-primary)", marginTop: "0.1rem" }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {market.local_market && (
                  <div style={{ background: AUTO_BLUE_BG, border: `1px solid ${AUTO_BLUE_BORDER}`, borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", marginBottom: "0.3rem" }}>Local Market</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{market.local_market.demand_in_area}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.72rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Local listings: {market.local_market.comparable_local_listings}</span>
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{market.local_market.local_price_range}</span>
                    </div>
                  </div>
                )}

                {market.seasonal_factors && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 0.75rem" }}>⏰ {market.seasonal_factors}</p>}
                {market.buyer_demographics && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>👤 {market.buyer_demographics}</p>}
              </div>
            )}

            {/* ── Strategy Tab ── */}
            {activeTab === "strategy" && strategy && (
              <div>
                {strategy.best_selling_venue && (
                  <div style={{ padding: "0.75rem", background: AUTO_BLUE_BG, borderRadius: "0.5rem", borderLeft: `3px solid ${AUTO_BLUE}`, marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", marginBottom: "0.2rem" }}>Best Venue</div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>{strategy.best_selling_venue}</p>
                  </div>
                )}

                {strategy.listing_price && (
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ flex: 1, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "0.5rem", padding: "0.5rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase", color: "var(--text-muted)" }}>List Price</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4ade80" }}>${strategy.listing_price.toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.5rem", padding: "0.5rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.5rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Floor Price</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ef4444" }}>${strategy.minimum_accept.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {strategy.recommended_platforms?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>Platform Comparison</div>
                    {strategy.recommended_platforms.map((p: any, i: number) => (
                      <div key={i} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{p.platform}</span>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{p.time_to_sell} · {p.fees}</div>
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: AUTO_BLUE }}>${p.expected_price?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}

                {strategy.what_to_fix_before_selling?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", marginBottom: "0.4rem" }}>Fix Before Selling</div>
                    {strategy.what_to_fix_before_selling.map((f: any, i: number) => (
                      <div key={i} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border-default)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{f.fix}</span>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: f.worth_it ? "#4ade80" : "#ef4444" }}>{f.worth_it ? "✅ Worth It" : "❌ Skip"}</span>
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                          Cost: {f.estimated_cost} · Value: {f.value_added}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {strategy.negotiation_tips && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>💬 {strategy.negotiation_tips}</p>}
              </div>
            )}

            {/* ── Pickup Tab ── */}
            {activeTab === "pickup" && pickup && (
              <div>
                {pickup.viewing_location && (
                  <div style={{ padding: "0.75rem", background: "rgba(245,158,11,0.06)", borderRadius: "0.5rem", borderLeft: "3px solid #f59e0b", marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", marginBottom: "0.2rem" }}>Viewing Location</div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{pickup.viewing_location}</p>
                  </div>
                )}

                {pickup.safety_tips?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>🛡️ Safety Tips</div>
                    {pickup.safety_tips.map((tip: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", padding: "0.3rem 0", borderBottom: "1px solid var(--border-default)" }}>
                        {i + 1}. {tip}
                      </div>
                    ))}
                  </div>
                )}

                {pickup.payment_methods && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", marginBottom: "0.3rem" }}>Payment Methods</div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{pickup.payment_methods}</p>
                  </div>
                )}

                {pickup.title_transfer_checklist?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Title Transfer Checklist</div>
                    {pickup.title_transfer_checklist.map((step: string, i: number) => (
                      <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0.2rem 0" }}>☐ {step}</div>
                    ))}
                  </div>
                )}

                {pickup.state_specific_notes && (
                  <div style={{ padding: "0.65rem", background: AUTO_BLUE_BG, borderRadius: "0.5rem", borderLeft: `3px solid ${AUTO_BLUE}` }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", marginBottom: "0.2rem" }}>State-Specific Notes</div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>{pickup.state_specific_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Fun Facts Tab ── */}
            {activeTab === "fun" && fun && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { label: "🎯 Vehicle Trivia", value: fun.vehicle_trivia },
                  { label: "🏭 Production", value: fun.production_numbers },
                  { label: "🌟 Pop Culture", value: fun.celebrity_connection },
                  { label: "👥 Community", value: fun.enthusiast_community },
                  { label: "🔧 Mod Potential", value: fun.modifier_potential },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>{f.label}</div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Executive Summary */}
          {result.executive_summary && (
            <div style={{
              background: `${AUTO_BLUE}08`, border: `1.5px solid ${AUTO_BLUE_BORDER}`,
              borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem",
              borderLeft: `4px solid ${AUTO_BLUE}`,
            }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: AUTO_BLUE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Expert Summary</div>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                {result.executive_summary}
              </p>
            </div>
          )}

          {/* ── MegaBot Vehicle Evaluation ── */}
          {megaBotLoading && (
            <div style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))",
              border: "1px solid rgba(167,139,250,0.2)", borderRadius: "1rem", padding: "1.5rem",
              marginBottom: "1.5rem", backdropFilter: "blur(12px)",
            }}>
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }}>⚡</div>
                <p style={{ fontSize: "0.85rem", color: "#a78bfa", fontWeight: 600 }}>4 AI vehicle specialists working...</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>OpenAI, Claude, Gemini, and Grok evaluating your vehicle in parallel</p>
              </div>
            </div>
          )}

          {!megaBotLoading && !megaBotData && (
            <div style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))",
              border: "1px solid rgba(167,139,250,0.2)", borderRadius: "1rem", padding: "1.25rem",
              marginBottom: "1.5rem", backdropFilter: "blur(12px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1rem" }}>⚡</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.06em" }}>MegaBot Vehicle Deep Dive</span>
              </div>
              <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                  Run 4 AI agents in parallel — OpenAI identifies the vehicle and prices it, Claude analyzes condition and mechanical clues, Gemini tracks market trends and regional demand, and Grok surfaces enthusiast community sentiment.
                </p>
                <button onClick={runMegaCarBot} style={{
                  padding: "0.55rem 1.3rem", fontSize: "0.8rem", borderRadius: "0.5rem", fontWeight: 700,
                  background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(251,191,36,0.2))",
                  border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa", cursor: "pointer",
                }}>
                  ⚡ Run MegaBot Vehicle Evaluation — 5 credits
                </button>
              </div>
            </div>
          )}

          {!megaBotLoading && megaBotData && (() => {
            const providers: any[] = megaBotData.providers || [];
            const successful = providers.filter((p: any) => !p.error);
            const failed = providers.filter((p: any) => p.error);
            const agreeRaw = megaBotData.agreementScore || megaBotData.agreement || 0.85;
            const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
            const allCD = successful.map((p: any) => extractMegaCarData(p));

            return (
              <div style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))",
                border: "1px solid rgba(139,92,246,0.2)", borderRadius: "1rem", padding: "1.25rem",
                marginBottom: "1.5rem", backdropFilter: "blur(12px)",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      MegaBot Vehicle Deep Dive — {successful.length} AI Experts
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {successful.length} agents evaluated · {agree}% agreement
                    </div>
                  </div>
                  <div style={{ padding: "0.2rem 0.6rem", borderRadius: 99, background: agree >= 75 ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)", color: agree >= 75 ? "#4caf50" : "#ff9800", fontSize: "0.72rem", fontWeight: 700 }}>
                    {agree}%
                  </div>
                </div>

                {/* Agreement bar */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ height: 5, borderRadius: 99, background: "var(--ghost-bg)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${agree}%`, borderRadius: 99, background: agree >= 80 ? "#4caf50" : agree >= 60 ? "#ff9800" : "#ef4444" }} />
                  </div>
                </div>

                {/* 4 Agent cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
                  {successful.map((p: any, idx: number) => {
                    const pm = MEGA_PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                    const isExp = megaBotExpanded === p.provider;
                    const cd = allCD[idx];
                    const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";

                    // Build collapsed one-liner
                    const ymm = [cd.year, cd.make, cd.model].filter(Boolean).join(" ") || "Vehicle";
                    const grade = cd.overallGrade || "";
                    const priceRange = (cd.priceLow && cd.priceHigh) ? `$${Number(cd.priceLow).toLocaleString()}-$${Number(cd.priceHigh).toLocaleString()}` : "";

                    return (
                      <div key={p.provider} style={{
                        background: isExp ? "var(--ghost-bg)" : "var(--bg-card)",
                        borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                        border: `1px solid ${isExp ? `${pm.color}30` : "var(--border-default)"}`,
                        borderRadius: "0.5rem", overflow: "hidden",
                      }}>
                        <button
                          onClick={() => setMegaBotExpanded(isExp ? null : p.provider)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.65rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                          <span style={{ fontSize: "0.85rem" }}>{pm.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: "0.72rem", color: pm.color, minWidth: 52 }}>{pm.label}</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {ymm}{grade ? ` · Grade ${grade}` : ""}{priceRange ? ` · ${priceRange}` : ""}
                          </span>
                          <span style={{ fontSize: "0.6rem", color: "#4caf50" }}>✅ {timeStr}</span>
                          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                        </button>

                        {isExp && (
                          <div style={{ padding: "0 0.75rem 0.75rem", borderTop: `1px solid ${pm.color}15` }}>
                            {/* Identification */}
                            {cd.identification && (
                              <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Vehicle Identification</div>
                                <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                                  {cd.year} {cd.make} {cd.model} {cd.trim || ""}
                                </div>
                                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                  {[cd.identification.generation, cd.identification.body_style, cd.identification.drivetrain, cd.identification.engine, cd.identification.transmission].filter(Boolean).map((tag: string, ti: number) => (
                                    <span key={ti} style={{ padding: "0.1rem 0.4rem", borderRadius: "9999px", fontSize: "0.58rem", fontWeight: 600, background: `${pm.color}12`, color: pm.color, border: `1px solid ${pm.color}25` }}>{tag}</span>
                                  ))}
                                </div>
                                {cd.identification.identification_confidence && (
                                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Confidence: {cd.identification.identification_confidence}%</div>
                                )}
                              </div>
                            )}

                            {/* Condition Assessment */}
                            {cd.conditionAssessment && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Condition Assessment</div>
                                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                                  {cd.overallGrade && (
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: String(cd.overallGrade).startsWith("A") ? "#4ade80" : String(cd.overallGrade).startsWith("B") ? "#f59e0b" : "#ef4444", lineHeight: 1 }}>{cd.overallGrade}</div>
                                      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Overall</div>
                                    </div>
                                  )}
                                  {[
                                    { label: "Exterior", score: cd.exteriorGrade, icon: "🎨" },
                                    { label: "Interior", score: cd.interiorGrade, icon: "🪑" },
                                    { label: "Mechanical", score: cd.mechanicalGrade, icon: "⚙️" },
                                  ].filter((g) => g.score != null).map((g) => (
                                    <div key={g.label} style={{ textAlign: "center" }}>
                                      <div style={{ fontSize: "0.55rem", marginBottom: "0.05rem" }}>{g.icon}</div>
                                      <div style={{ fontSize: "1rem", fontWeight: 800, color: Number(g.score) >= 7 ? "#4ade80" : Number(g.score) >= 4 ? "#f59e0b" : "#ef4444" }}>{g.score}/10</div>
                                      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{g.label}</div>
                                    </div>
                                  ))}
                                </div>
                                {cd.conditionAssessment.condition_vs_seller_claim && (
                                  <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.2rem", padding: "0.3rem 0.4rem", background: `${pm.color}06`, borderRadius: "0.3rem", borderLeft: `2px solid ${pm.color}40` }}>
                                    {cd.conditionAssessment.condition_vs_seller_claim}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Valuation */}
                            {cd.valuation && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Valuation</div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                                        <th style={{ textAlign: "left", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Type</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Low</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Mid</th>
                                        <th style={{ textAlign: "right", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>High</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[
                                        { label: "💰 Retail", data: cd.retailValue },
                                        { label: "🏷️ Private Party", data: cd.privatePartyValue },
                                        { label: "🏪 Trade-In", data: cd.tradeInValue },
                                      ].filter((v) => v.data).map((v) => (
                                        <tr key={v.label} style={{ borderBottom: "1px solid var(--border-default)" }}>
                                          <td style={{ padding: "0.25rem 0.3rem", color: "var(--text-primary)", fontWeight: 600 }}>{v.label}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-secondary)" }}>{v.data?.low != null ? `$${Number(v.data.low).toLocaleString()}` : "—"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: pm.color, fontWeight: 600 }}>{v.data?.mid != null ? `$${Number(v.data.mid).toLocaleString()}` : "—"}</td>
                                          <td style={{ padding: "0.25rem 0.3rem", textAlign: "right", color: "var(--text-secondary)" }}>{v.data?.high != null ? `$${Number(v.data.high).toLocaleString()}` : "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {cd.valuation.price_vs_market && (
                                  <div style={{ marginTop: "0.3rem", padding: "0.2rem 0.4rem", borderRadius: "0.3rem", fontSize: "0.62rem", fontWeight: 700, display: "inline-block", background: (cd.valuation.price_vs_market === "Underpriced" || cd.valuation.price_vs_market === "Steal") ? "rgba(74,222,128,0.1)" : cd.valuation.price_vs_market === "Overpriced" ? "rgba(239,68,68,0.1)" : "rgba(0,188,212,0.1)", color: (cd.valuation.price_vs_market === "Underpriced" || cd.valuation.price_vs_market === "Steal") ? "#4ade80" : cd.valuation.price_vs_market === "Overpriced" ? "#ef4444" : "var(--accent)" }}>
                                    {cd.valuation.price_vs_market}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Common Issues */}
                            {cd.commonIssues.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#f59e0b", fontWeight: 700, marginBottom: "0.3rem" }}>⚠️ Common Issues</div>
                                {cd.commonIssues.slice(0, 5).map((issue: any, i: number) => (
                                  <div key={i} style={{ padding: "0.2rem 0", borderBottom: i < Math.min(cd.commonIssues.length, 5) - 1 ? "1px solid var(--border-default)" : "none", fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                                    {typeof issue === "string" ? `• ${issue}` : `• ${issue.problem || issue.issue || issue.description || JSON.stringify(issue)}`}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Market Analysis */}
                            {cd.marketAnalysis && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.35rem" }}>Market Analysis</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                  {cd.marketAnalysis.demand_level && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>📊 Demand: <span style={{ fontWeight: 700, color: cd.marketAnalysis.demand_level === "Hot" || cd.marketAnalysis.demand_level === "High" ? "#4ade80" : "var(--text-primary)" }}>{cd.marketAnalysis.demand_level}</span></div>}
                                  {cd.marketAnalysis.demand_trend && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>📈 Trend: {cd.marketAnalysis.demand_trend}</div>}
                                  {cd.marketAnalysis.time_to_sell_estimate && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>⏰ Time to sell: {cd.marketAnalysis.time_to_sell_estimate}</div>}
                                  {cd.marketAnalysis.seasonal_factors && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>🌸 Seasonal: {typeof cd.marketAnalysis.seasonal_factors === "string" && cd.marketAnalysis.seasonal_factors.length > 100 ? cd.marketAnalysis.seasonal_factors.slice(0, 100) + "..." : cd.marketAnalysis.seasonal_factors}</div>}
                                  {cd.marketAnalysis.buyer_demographics && <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>👤 Buyers: {typeof cd.marketAnalysis.buyer_demographics === "string" && cd.marketAnalysis.buyer_demographics.length > 100 ? cd.marketAnalysis.buyer_demographics.slice(0, 100) + "..." : cd.marketAnalysis.buyer_demographics}</div>}
                                  {cd.marketAnalysis.local_market && (
                                    <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
                                      📍 Local: {cd.marketAnalysis.local_market.demand_in_area || ""}{cd.marketAnalysis.local_market.local_price_range ? ` · ${cd.marketAnalysis.local_market.local_price_range}` : ""}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Selling Strategy */}
                            {cd.sellingStrategy && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Selling Strategy</div>
                                {cd.sellingStrategy.best_selling_venue && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "0.15rem" }}>🏆 Best venue: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{cd.sellingStrategy.best_selling_venue}</span></div>}
                                {cd.sellingStrategy.listing_price && <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "0.15rem" }}>💰 List at: <span style={{ fontWeight: 700, color: "#4ade80" }}>${Number(cd.sellingStrategy.listing_price).toLocaleString()}</span>{cd.sellingStrategy.minimum_accept ? ` · Floor: $${Number(cd.sellingStrategy.minimum_accept).toLocaleString()}` : ""}</div>}
                                {cd.sellingStrategy.negotiation_tips && <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.15rem" }}>💬 {typeof cd.sellingStrategy.negotiation_tips === "string" && cd.sellingStrategy.negotiation_tips.length > 120 ? cd.sellingStrategy.negotiation_tips.slice(0, 120) + "..." : cd.sellingStrategy.negotiation_tips}</div>}
                              </div>
                            )}

                            {/* Key insight / Executive Summary */}
                            {cd.executiveSummary && (
                              <div style={{ padding: "0.4rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.4rem", borderLeft: `3px solid ${pm.color}50` }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} What {pm.label} Found</div>
                                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                                  &ldquo;{typeof cd.executiveSummary === "string" && cd.executiveSummary.length > 300 ? cd.executiveSummary.slice(0, 300) + "..." : cd.executiveSummary}&rdquo;
                                </p>
                              </div>
                            )}

                            <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "0.35rem" }}>
                              {pm.icon} {pm.label}: {pm.specialty}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {failed.map((p: any) => {
                    const pm = MEGA_PROVIDER_META[p.provider] || { icon: "🤖", label: p.provider, color: "#888", specialty: "" };
                    return (
                      <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.5rem", opacity: 0.6, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: "0.4rem", fontSize: "0.65rem" }}>
                        <span>{pm.icon}</span>
                        <span style={{ fontWeight: 600, color: pm.color }}>{pm.label}</span>
                        <span style={{ color: "#ef4444", flex: 1 }}>❌ {(p.error || "").slice(0, 60)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Comparison */}
                {successful.length > 1 && (
                  <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-card)", borderRadius: "0.5rem", border: "1px solid var(--border-default)" }}>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Vehicle Evaluation Comparison</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.7rem" }}>
                      {successful.map((p: any, i: number) => {
                        const pm = MEGA_PROVIDER_META[p.provider];
                        const cd = allCD[i];
                        const ymm = [cd.year, cd.make, cd.model].filter(Boolean).join(" ") || "—";
                        const priceRange = (cd.priceLow && cd.priceHigh) ? `$${Number(cd.priceLow).toLocaleString()}-$${Number(cd.priceHigh).toLocaleString()}` : "—";
                        return (
                          <span key={p.provider} style={{ color: pm?.color || "var(--text-secondary)" }}>
                            {pm?.icon} {pm?.label}: {ymm} · {cd.overallGrade ? `Grade ${cd.overallGrade}` : "—"} · {priceRange}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div style={{ background: "rgba(139,92,246,0.04)", borderLeft: "3px solid rgba(139,92,246,0.3)", borderRadius: "0 0.5rem 0.5rem 0", padding: "0.65rem 0.85rem", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>MegaBot Vehicle Summary</div>
                  <p style={{ fontSize: "0.78rem", lineHeight: 1.55, color: "var(--text-secondary)", margin: 0 }}>
                    {(() => {
                      const parts: string[] = [];
                      parts.push(`${successful.length} AI vehicle specialists evaluated this vehicle with ${agree}% agreement.`);
                      for (let i = 0; i < successful.length && parts.length < 6; i++) {
                        const cd = allCD[i];
                        const label = MEGA_PROVIDER_META[successful[i].provider]?.label || successful[i].provider;
                        if (cd.executiveSummary && typeof cd.executiveSummary === "string") {
                          const sentences = cd.executiveSummary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
                          if (sentences.length > 25) parts.push(`${label}: ${sentences}`);
                        }
                      }
                      return parts.join(" ");
                    })()}
                  </p>
                </div>

                {/* Re-run */}
                <div style={{ textAlign: "center" }}>
                  <button onClick={runMegaCarBot} style={{
                    padding: "0.4rem 1rem", fontSize: "0.72rem", borderRadius: "0.4rem", fontWeight: 600,
                    background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", cursor: "pointer",
                  }}>
                    Re-Run MegaBot — 3 cr
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Next Steps */}
          <div style={{
            marginTop: "1rem", padding: "1rem 1.25rem",
            background: "var(--ghost-bg)", borderRadius: "0.75rem",
            border: "1px solid var(--border-default)",
          }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Next Steps
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <Link href={`/bots/listbot?item=${selectedId}`} style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.75rem 1rem", borderRadius: "0.6rem",
                background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
                textDecoration: "none", transition: "border-color 0.15s ease",
              }}>
                <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>✍️</span>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>Create Vehicle Listing</div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Auto-generate optimized listings for marketplaces</div>
                </div>
              </Link>
              <Link href={`/bots/buyerbot?item=${selectedId}`} style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.75rem 1rem", borderRadius: "0.6rem",
                background: "var(--bg-card-solid)", border: "1px solid var(--border-default)",
                textDecoration: "none", transition: "border-color 0.15s ease",
              }}>
                <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>🎯</span>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>Find Vehicle Buyers</div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Match with interested buyers in your area</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && selected && (
        <div style={{
          background: "var(--bg-card)", border: `1px solid rgba(0,188,212,0.15)`,
          borderRadius: "1rem",
        }}>
          <BotLoadingState botName="CarBot" />
        </div>
      )}

      {/* No results placeholder */}
      {!result && selected && isVehicle && !loading && (
        <div style={{
          background: "var(--bg-card)", border: `1px solid ${AUTO_BLUE_BORDER}`,
          borderRadius: "1rem", padding: "3rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🚗</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Ready for Vehicle Evaluation</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 400, margin: "0 auto 1rem", lineHeight: 1.5 }}>
            Run CarBot to get comprehensive vehicle identification, condition grading, market pricing, KBB/NADA estimates, and expert selling strategy.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {["VIN Decode", "Condition Report", "Market Analysis", "KBB/NADA Est.", "Selling Strategy", "Safety Tips"].map((f) => (
              <span key={f} style={{ padding: "0.2rem 0.5rem", borderRadius: "9999px", background: AUTO_BLUE_BG, border: `1px solid ${AUTO_BLUE_BORDER}`, color: AUTO_BLUE, fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STICKY BOTTOM ACTION BAR ═══ */}
      {selectedId && selected && (
        <div data-no-print style={{
          position: "sticky", bottom: 0, zIndex: 100,
          background: "var(--bg-card-solid)", backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border-default)",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
          padding: "0.85rem 2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
            {selected.photo && (
              <img src={selected.photo} alt="" style={{ width: 32, height: 32, borderRadius: "0.35rem", objectFit: "cover" as const, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }}>
              {selected.title}
            </span>
            {selected.valuation?.mid && (
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: AUTO_BLUE, flexShrink: 0 }}>
                ${selected.valuation.mid.toLocaleString()}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={runCarBot}
              disabled={loading}
              style={{
                minHeight: "44px", padding: "0 1.25rem",
                background: loading ? "var(--ghost-bg)" : `linear-gradient(135deg, ${AUTO_BLUE}, #0097a7)`,
                color: loading ? "var(--text-muted)" : "#fff",
                border: "none", borderRadius: "0.65rem",
                fontSize: "0.78rem", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: loading ? "none" : `0 4px 14px rgba(0,188,212,0.3)`,
              }}
            >
              {loading ? "Running..." : result ? "Re-Run CarBot" : "Run CarBot"}
            </button>
            <button
              onClick={runMegaCarBot}
              disabled={megaBotLoading}
              style={{
                minHeight: "44px", padding: "0.45rem 1rem",
                background: megaBotLoading ? "var(--ghost-bg)" : `linear-gradient(135deg, rgba(0,188,212,0.15), rgba(0,151,167,0.1))`,
                color: megaBotLoading ? "var(--text-muted)" : AUTO_BLUE,
                border: `1px solid ${AUTO_BLUE_BORDER}`,
                borderRadius: "10px",
                fontSize: "0.75rem", fontWeight: 700,
                cursor: megaBotLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {megaBotLoading ? "Boosting..." : "MegaBot Boost"}
            </button>
            <Link
              href={`/items/${selectedId}`}
              style={{
                minHeight: "44px", padding: "0.45rem 0.85rem",
                display: "inline-flex", alignItems: "center",
                background: "var(--ghost-bg)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                fontSize: "0.72rem", fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              View Item →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
