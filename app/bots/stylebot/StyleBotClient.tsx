"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import BotItemSelector from "../BotItemSelector";
import { runStandardAnalysis, runMegaAnalysis } from "@/lib/agents/runner";
import type { AgentResult, MultiAgentRun } from "@/lib/agents/runner";

type Photo = { id: string; path: string; isPrimary: boolean; caption: string | null };
type ItemData = {
  id: string;
  title: string;
  status: string;
  photo: string | null;
  hasAnalysis: boolean;
  aiResult: string | null;
  photoCount: number;
  photos: Photo[];
  category: string;
  photoQualityScore: number | null;
  photoTips: string[];
};

function safeJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

// ─── MegaBot helpers ─────────────────────────────────────────────────────────

const MEGA_PROVIDER_META: Record<string, { icon: string; label: string; color: string; specialty: string }> = {
  openai: { icon: "\u{1F916}", label: "OpenAI", color: "#10a37f", specialty: "Overall composition, lighting analysis, mainstream platform standards" },
  claude: { icon: "\u{1F9E0}", label: "Claude", color: "#d97706", specialty: "Antique/vintage photography nuance, detail capture, storytelling angles" },
  gemini: { icon: "\u{1F52E}", label: "Gemini", color: "#4285f4", specialty: "Platform-specific optimization, SEO image tagging, algorithm appeal" },
  grok: { icon: "\u{1F300}", label: "Grok (xAI)", color: "#00DC82", specialty: "Social media visual trends, viral staging, Gen Z buyer appeal" },
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
  const wrappers = ["photo_analysis", "photo_quality", "deep_dive", "megabot_enhancement"];
  for (const w of wrappers) { if (d[w] && typeof d[w] === "object") { for (const k of keys) { if (Array.isArray(d[w][k]) && d[w][k].length > 0) return d[w][k]; } } }
  return [];
}
function _megaField(d: any, ...keys: string[]): any {
  for (const k of keys) { if (d[k] != null && d[k] !== "" && d[k] !== "Unknown") return d[k]; }
  return null;
}

function extractMegaPB(p: any) {
  let d = _megaNormKeys(p.data || {});
  const topKeys = Object.keys(d);
  if (topKeys.length === 1 && _megaObj(d[topKeys[0]]) && Object.keys(d[topKeys[0]]).length >= 2) d = d[topKeys[0]];

  const qualityScore = _megaField(d, "overall_quality_score", "photo_quality_score", "quality_score", "overall_score") || 0;
  const perPhoto = _megaArr(d, "per_photo_scores", "per_photo_analysis", "individual_scores", "photo_scores");
  const missingAngles = _megaArr(d, "missing_angles", "missing_shots", "recommended_angles", "angles_needed");
  const improvementTips = _megaArr(d, "improvement_tips", "tips", "suggestions", "photo_tips", "improvements");
  const platformRecs = _megaArr(d, "platform_recommendations", "platform_specific", "platform_tips", "marketplace_tips");
  const stagingConcepts = _megaArr(d, "staging_concepts", "staging_ideas", "staging_suggestions", "staging");
  const mobileTips = _megaArr(d, "mobile_tips", "mobile_photography", "phone_tips");
  const videoStoryboard = _megaArr(d, "video_storyboard", "video_tips", "video_ideas", "reel_ideas");

  return {
    qualityScore: typeof qualityScore === "number" ? qualityScore : parseFloat(qualityScore) || 0,
    perPhoto, perPhotoCount: perPhoto.length,
    missingAngles, missingAngleCount: missingAngles.length,
    improvementTips, improvementTipCount: improvementTips.length,
    platformRecs, platformRecCount: platformRecs.length,
    stagingConcepts, stagingConceptCount: stagingConcepts.length,
    mobileTips,
    videoStoryboard,
    summary: d.executive_summary || d.summary || null,
  };
}

function getPhotoAssessment(item: ItemData) {
  const count = item.photos.length;
  const improvements: { label: string; before: string; after: string }[] = [];

  if (item.photoQualityScore != null && item.photoQualityScore > 0) {
    const aiScore = Math.round(item.photoQualityScore * 10);
    const tips = item.photoTips.length > 0 ? [...item.photoTips] : [];
    if (count < 3) tips.push("Upload at least 3-4 photos from different angles");
    if (count < 4 && count >= 3) tips.push("Add more photos \u2014 listings with 4+ images sell 2x faster");
    const cat = item.category.toLowerCase();
    if (cat.includes("furniture")) {
      improvements.push({ label: "Background", before: "Cluttered room", after: "Clean, neutral wall" });
    } else if (cat.includes("jewelry") || cat.includes("watch")) {
      improvements.push({ label: "Lighting", before: "Harsh overhead", after: "Diffused natural light" });
    } else if (cat.includes("electronics")) {
      improvements.push({ label: "Angle", before: "Top-down only", after: "45\u00B0 with screen on" });
    } else {
      improvements.push({ label: "Lighting", before: "Dim indoor", after: "Window natural light" });
    }
    return { score: Math.min(95, Math.max(20, aiScore)), tips, improvements, isAiScored: true };
  }

  let score = 30;
  const tips: string[] = [];
  if (count >= 4) { score += 25; } else if (count >= 2) { score += 15; tips.push("Add more photos \u2014 listings with 4+ images sell 2x faster"); }
  else { tips.push("Upload at least 3-4 photos from different angles"); }
  const cat = item.category.toLowerCase();
  if (cat.includes("furniture")) {
    tips.push("Show the piece from front, side, and detail angles");
    tips.push("Include a photo with an object for scale reference");
    improvements.push({ label: "Background", before: "Cluttered room", after: "Clean, neutral wall" });
  } else if (cat.includes("jewelry") || cat.includes("watch")) {
    tips.push("Use macro/close-up shots to show detail and markings");
    tips.push("Photograph on a dark velvet surface for contrast");
    improvements.push({ label: "Lighting", before: "Harsh overhead", after: "Diffused natural light" });
  } else if (cat.includes("electronics")) {
    tips.push("Show all ports, buttons, and any included accessories");
    tips.push("Power on the device to show it works");
    improvements.push({ label: "Angle", before: "Top-down only", after: "45\u00B0 with screen on" });
  } else if (cat.includes("clothing") || cat.includes("apparel")) {
    tips.push("Use a mannequin or flat-lay on clean white surface");
    tips.push("Show labels, tags, and any wear/damage clearly");
    improvements.push({ label: "Staging", before: "Bunched on floor", after: "Steamed on hanger" });
  } else {
    tips.push("Use natural daylight \u2014 avoid flash and yellow indoor lighting");
    tips.push("Clean the item before photographing \u2014 first impressions matter");
    improvements.push({ label: "Lighting", before: "Dim indoor", after: "Window natural light" });
  }
  if (count > 0) tips.push("Make sure your hero photo shows the most attractive angle");
  tips.push("Remove distracting items from the background");
  score += count >= 3 ? 20 : count >= 2 ? 10 : 0;
  score += 15;
  score = Math.min(95, Math.max(20, score));
  return { score, tips, improvements, isAiScored: false };
}

function AppealScore({ score, isAiScored }: { score: number; isAiScored: boolean }) {
  const color = score >= 80 ? "#4caf50" : score >= 60 ? "#ff9800" : "#ef5350";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        border: `3px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: "1.3rem", fontWeight: 800, color }}>{score}</span>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>Visual Appeal: {label}</span>
          {isAiScored && (
            <span style={{ fontSize: "0.55rem", fontWeight: 600, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(0,188,212,0.15)", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              AI Scored
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{score >= 80 ? "Photos look great \u2014 ready to list!" : "Follow the tips below to improve."}</div>
      </div>
    </div>
  );
}

function AgentStyleCard({ agent }: { agent: AgentResult }) {
  const d = agent.data;
  const isPlaceholder = agent.status === "placeholder";
  return (
    <div style={{
      background: "var(--bg-card, rgba(255,255,255,0.05))",
      border: "1px solid var(--border-card, rgba(255,255,255,0.08))",
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
          background: isPlaceholder ? "rgba(255,255,255,0.06)" : "rgba(76,175,80,0.15)",
          color: isPlaceholder ? "var(--text-muted)" : "#4caf50",
        }}>
          {isPlaceholder ? "Coming Soon" : `${Math.round(agent.confidence * 100)}%`}
        </span>
      </div>
      {isPlaceholder ? (
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{agent.error}</div>
      ) : d && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Photo Score</span>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: d.photoScore >= 7 ? "#4caf50" : d.photoScore >= 4 ? "#ff9800" : "#ef5350" }}>{d.photoScore}/10</span>
          </div>
          {d.styleNotes && d.styleNotes.length > 0 && (
            <div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Style Notes</div>
              <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                {d.styleNotes.map((n, i) => (
                  <li key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.15rem" }}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          {d.photoTips.length > 0 && (
            <div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Photo Tips</div>
              <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                {d.photoTips.slice(0, 2).map((t, i) => (
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

export default function StyleBotClient({ items }: { items: ItemData[] }) {
  const searchParams = useSearchParams();
  const itemParam = searchParams.get("item");
  const [selectedId, setSelectedId] = useState<string | null>(
    (itemParam && items.some((i) => i.id === itemParam)) ? itemParam : items[0]?.id ?? null
  );
  const [megaMode, setMegaMode] = useState(false);
  const [megaAnimating, setMegaAnimating] = useState(false);
  const [megaStep, setMegaStep] = useState(0);

  const item = items.find((i) => i.id === selectedId);
  const ai = useMemo(() => safeJson(item?.aiResult ?? null), [item?.aiResult]);
  const assessment = item ? getPhotoAssessment(item) : null;

  const standardResult = useMemo(() => {
    if (!item || !ai) return null;
    const priceMid = ai.estimated_value_mid || 55;
    return runStandardAnalysis(item.id, "style", { name: ai.item_name || item.title, category: ai.category || item.category || "General", priceMid });
  }, [item?.id, ai, item?.category]);

  const megaRun = useMemo<MultiAgentRun | null>(() => {
    if (!megaMode || !item || !ai) return null;
    const priceMid = ai.estimated_value_mid || 55;
    return runMegaAnalysis(item.id, "style", { name: ai.item_name || item.title, category: ai.category || item.category || "General", priceMid });
  }, [megaMode, item?.id, ai, item?.category]);

  function activateMega() {
    setMegaAnimating(true);
    setMegaStep(1);
    setTimeout(() => setMegaStep(2), 1500);
    setTimeout(() => { setMegaStep(3); setMegaAnimating(false); setMegaMode(true); }, 2500);
  }

  // ─── MegaBot PhotoBot state ───
  const [megaBotData, setMegaBotData] = useState<any>(null);
  const [megaBotLoading, setMegaBotLoading] = useState(false);
  const [megaBotExpanded, setMegaBotExpanded] = useState<string | null>(null);

  useEffect(() => { setMegaMode(false); setMegaStep(0); setMegaAnimating(false); setMegaBotData(null); setMegaBotExpanded(null); }, [selectedId]);

  // Load existing MegaBot photobot data
  useEffect(() => {
    if (!selectedId) { setMegaBotData(null); return; }
    fetch(`/api/megabot/${selectedId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.results?.photobot) setMegaBotData(d.results.photobot);
        else setMegaBotData(null);
      })
      .catch(() => setMegaBotData(null));
  }, [selectedId]);

  const runMegaPhotoBot = useCallback(async () => {
    if (!selectedId || megaBotLoading) return;
    setMegaBotData(null);
    setMegaBotLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch(`/api/megabot/${selectedId}?bot=photobot`, { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.providers || data.consensus)) {
          setMegaBotData(data);
        }
      } else {
        console.warn("[MegaPhotoBot] API error:", res.status);
      }
    } catch (e: any) {
      console.warn("[MegaPhotoBot] fetch error:", e.message);
    }
    setMegaBotLoading(false);
  }, [selectedId, megaBotLoading]);

  const ms = megaRun?.masterSummary;
  const cr = ms?.consensusResult;

  return (
    <div>
      <BotItemSelector
        items={items.map((i) => ({ id: i.id, title: i.title, photo: i.photo, status: i.status, hasAnalysis: i.hasAnalysis }))}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {!item ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>🎨</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Select an Item for Photo Review</div>
          <div style={{ fontSize: "0.82rem" }}>Choose an item above to get photo quality tips and staging advice.</div>
        </div>
      ) : item.photoCount === 0 ? (
        <div style={{
          marginTop: "1.5rem",
          background: "var(--bg-card, rgba(255,255,255,0.05))",
          border: "1px solid var(--border-card)",
          borderRadius: "1.25rem",
          padding: "3rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📸</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No photos uploaded</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Upload photos first, then PhotoBot will assess and improve them.</p>
        </div>
      ) : assessment && (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Mode header + MegaBot button */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg-card, rgba(255,255,255,0.05))",
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
            <div style={{ background: "var(--bg-card, rgba(255,255,255,0.05))", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "1.25rem", padding: "1.5rem" }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1rem", fontWeight: 600 }}>Activating MegaBot...</div>
              {[{ icon: "🟢", name: "OpenAI Agent", step: 1 }, { icon: "🟣", name: "Claude Agent", step: 2 }, { icon: "🔵", name: "Gemini Agent", step: 3 }, { icon: "🌀", name: "Grok Agent", step: 4 }].map((a) => (
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

          {/* MEGA MODE: Agent cards + Style Master Summary */}
          {megaMode && megaRun && ms && cr && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                {megaRun.agents.map((agent) => (
                  <AgentStyleCard key={agent.agentName} agent={agent} />
                ))}
              </div>

              {/* Style Master Summary */}
              <div style={{ background: "var(--bg-card, rgba(255,255,255,0.05))", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "1.25rem", padding: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 600 }}>Style Master Summary</div>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 600, padding: "0.15rem 0.55rem", borderRadius: "9999px",
                    background: ms.agreeLevel === "strong" ? "rgba(76,175,80,0.15)" : ms.agreeLevel === "mixed" ? "rgba(255,152,0,0.15)" : "rgba(239,68,68,0.15)",
                    color: ms.agreeLevel === "strong" ? "#4caf50" : ms.agreeLevel === "mixed" ? "#ff9800" : "#ef5350",
                  }}>
                    {ms.agreeLevel === "strong" ? "Strong Agreement" : ms.agreeLevel === "mixed" ? "Mixed" : "Divergent"}
                  </span>
                </div>

                {/* Consensus photo score */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Consensus Photo Score</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      border: `3px solid ${cr.photoScore >= 7 ? "#4caf50" : cr.photoScore >= 4 ? "#ff9800" : "#ef5350"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: cr.photoScore >= 7 ? "#4caf50" : cr.photoScore >= 4 ? "#ff9800" : "#ef5350" }}>{cr.photoScore}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {cr.photoScore >= 7 ? "Good Photos" : cr.photoScore >= 4 ? "Acceptable" : "Needs Improvement"} (avg across 4 agents)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined photo tips */}
                {cr.photoTips.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Combined Photo Tips</div>
                    <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                      {cr.photoTips.map((tip, i) => (
                        <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem", lineHeight: 1.5 }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {ms.mergedInsights.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Merged Insights</div>
                    <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                      {ms.mergedInsights.map((f, i) => (
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
                    {ms.whatToDoNext.map((step, i) => (
                      <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem", lineHeight: 1.5 }}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}

          {/* STANDARD: Appeal score */}
          <div style={{
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-card)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}>
            <AppealScore score={assessment.score} isAiScored={assessment.isAiScored} />
          </div>

          {/* Photo grid */}
          <div style={{
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-card)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
          }}>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Your Photos ({item.photoCount})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.75rem" }}>
              {item.photos.map((p, i) => (
                <div key={p.id} style={{ position: "relative", borderRadius: "0.75rem", overflow: "hidden", aspectRatio: "1", border: p.isPrimary ? "2px solid var(--accent)" : "1px solid var(--border-default)" }}>
                  <img src={p.path} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {p.isPrimary && (
                    <div style={{ position: "absolute", top: 6, left: 6, padding: "0.1rem 0.45rem", borderRadius: "0.3rem", background: "var(--accent)", color: "#000", fontSize: "0.6rem", fontWeight: 700 }}>HERO</div>
                  )}
                  <div style={{ position: "absolute", bottom: 6, right: 6, padding: "0.1rem 0.4rem", borderRadius: "0.3rem", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.6rem" }}>#{i + 1}</div>
                </div>
              ))}
              {item.photoCount < 4 && (
                <div style={{
                  borderRadius: "0.75rem",
                  border: "2px dashed var(--border-default)",
                  aspectRatio: "1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                }}>
                  <span style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>+</span>
                  Add more
                </div>
              )}
            </div>
          </div>

          {/* Before/After improvements */}
          {assessment.improvements.length > 0 && (
            <div style={{
              background: "var(--bg-card, rgba(255,255,255,0.05))",
              border: "1px solid var(--border-card)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
            }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "1rem" }}>Suggested Improvements</div>
              {assessment.improvements.map((imp) => (
                <div key={imp.label} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", width: 80 }}>{imp.label}</span>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ padding: "0.35rem 0.75rem", borderRadius: "0.5rem", background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.2)", fontSize: "0.78rem", color: "#ef5350" }}>{imp.before}</span>
                    <span style={{ color: "var(--text-muted)" }}>&rarr;</span>
                    <span style={{ padding: "0.35rem 0.75rem", borderRadius: "0.5rem", background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.2)", fontSize: "0.78rem", color: "#4caf50" }}>{imp.after}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          <div style={{
            background: "rgba(233,30,99,0.06)",
            border: "1px solid rgba(233,30,99,0.15)",
            borderRadius: "1.25rem",
            padding: "1.25rem",
          }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#e91e63", marginBottom: "0.75rem", fontWeight: 600 }}>Styling Tips for {item.category || "This Item"}</div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {assessment.tips.map((tip, i) => (
                <li key={i} style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem", lineHeight: 1.5 }}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* ── SECTION: MegaBot Photo Quality Analysis ── */}

          {/* MegaBot Loading */}
          {megaBotLoading && (
            <div style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 16,
              padding: "1.25rem",
            }}>
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }}>&#x26A1;</div>
                <p style={{ fontSize: "0.85rem", color: "#a78bfa", fontWeight: 600, margin: "0 0 0.3rem" }}>4 AI photo specialists working...</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>OpenAI, Claude, Gemini, and Grok analyzing photo quality in parallel</p>
              </div>
            </div>
          )}

          {/* MegaBot Teaser (no data, not loading) */}
          {!megaBotLoading && !megaBotData && (
            <div style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.04), rgba(251,191,36,0.04))",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 16,
              padding: "1.25rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1rem" }}>&#x26A1;</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.06em" }}>MegaBot Photo Deep Dive</span>
              </div>
              <div style={{ textAlign: "center", padding: "1rem 0.5rem" }}>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                  Run 4 AI agents in parallel &mdash; OpenAI scores overall composition, Claude evaluates antique photography detail, Gemini optimizes for platform algorithms, and Grok surfaces viral staging trends.
                </p>
                <button onClick={runMegaPhotoBot} style={{
                  padding: "0.55rem 1.3rem", fontSize: "0.8rem", borderRadius: "0.5rem", fontWeight: 700,
                  background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(251,191,36,0.2))",
                  border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa", cursor: "pointer",
                }}>
                  &#x26A1; Run MegaBot Photo Analysis &mdash; 3 credits
                </button>
              </div>
            </div>
          )}

          {/* MegaBot Results */}
          {!megaBotLoading && megaBotData && (() => {
            const providers: any[] = megaBotData.providers || [];
            const successful = providers.filter((p: any) => !p.error);
            const failed = providers.filter((p: any) => p.error);
            const agreeRaw = megaBotData.agreementScore || megaBotData.agreement || 0.85;
            const agree = Math.round(agreeRaw > 1 ? agreeRaw : agreeRaw * 100);
            const allPB = successful.map((p: any) => extractMegaPB(p));
            const avgQuality = allPB.length > 0 ? Math.round(allPB.reduce((s: number, h: any) => s + h.qualityScore, 0) / allPB.length * 10) / 10 : 0;
            const totalMissing = new Set(allPB.flatMap((h: any) => h.missingAngles.map((a: any) => (typeof a === "string" ? a : a.angle || a.name || "").toLowerCase()))).size;
            const totalTips = allPB.reduce((s: number, h: any) => s + h.improvementTipCount, 0);

            return (
              <div style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,188,212,0.04))",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(139,92,246,0.2)",
                borderRadius: 16,
                padding: "1.25rem",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>&#x26A1;</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      MegaBot Photo Deep Dive &mdash; {successful.length} AI Experts
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {avgQuality}/10 avg quality &middot; {totalMissing} missing angles &middot; {totalTips} improvement tips
                    </div>
                  </div>
                  <div style={{ padding: "0.2rem 0.6rem", borderRadius: 99, background: agree >= 75 ? "rgba(76,175,80,0.15)" : "rgba(255,152,0,0.15)", color: agree >= 75 ? "#4caf50" : "#ff9800", fontSize: "0.72rem", fontWeight: 700 }}>
                    {agree}%
                  </div>
                </div>

                {/* Agreement bar */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${agree}%`, borderRadius: 99, background: agree >= 80 ? "#4caf50" : agree >= 60 ? "#ff9800" : "#ef4444" }} />
                  </div>
                </div>

                {/* Agent cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
                  {successful.map((p: any, idx: number) => {
                    const pm = MEGA_PROVIDER_META[p.provider] || { icon: "\u{1F916}", label: p.provider, color: "#888", specialty: "" };
                    const isExp = megaBotExpanded === p.provider;
                    const pb = allPB[idx];
                    const timeStr = (p.durationMs || p.responseTime) ? `${((p.durationMs || p.responseTime) / 1000).toFixed(1)}s` : "";

                    return (
                      <div key={p.provider} style={{
                        background: isExp ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                        borderTop: isExp ? `3px solid ${pm.color}` : undefined,
                        border: `1px solid ${isExp ? `${pm.color}30` : "rgba(255,255,255,0.06)"}`,
                        borderRadius: "0.5rem", overflow: "hidden",
                      }}>
                        {/* Collapsed row */}
                        <button
                          onClick={() => setMegaBotExpanded(isExp ? null : p.provider)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 0.65rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                          <span style={{ fontSize: "0.85rem" }}>{pm.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: "0.72rem", color: pm.color, minWidth: 52 }}>{pm.label}</span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                            {pb.qualityScore}/10 quality &middot; {pb.missingAngleCount} missing angles &middot; {pb.improvementTipCount} improvement tips
                          </span>
                          <span style={{ fontSize: "0.6rem", color: "#4caf50" }}>&#x2705; {timeStr}</span>
                          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>&#x25BE;</span>
                        </button>

                        {/* Expanded content */}
                        {isExp && (
                          <div style={{ padding: "0 0.75rem 0.75rem", borderTop: `1px solid ${pm.color}15` }}>

                            {/* Overall quality score */}
                            <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Overall Quality Score</div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{
                                  width: 44, height: 44, borderRadius: "50%",
                                  border: `3px solid ${pb.qualityScore >= 7 ? "#4caf50" : pb.qualityScore >= 4 ? "#ff9800" : "#ef5350"}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  <span style={{ fontSize: "1rem", fontWeight: 800, color: pb.qualityScore >= 7 ? "#4caf50" : pb.qualityScore >= 4 ? "#ff9800" : "#ef5350" }}>{pb.qualityScore}</span>
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                                  {pb.qualityScore >= 8 ? "Excellent photos" : pb.qualityScore >= 6 ? "Good photos with room to improve" : pb.qualityScore >= 4 ? "Acceptable but needs work" : "Significant improvements needed"}
                                </div>
                              </div>
                            </div>

                            {/* Per-photo analysis */}
                            {pb.perPhoto.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Per-Photo Analysis ({pb.perPhoto.length})</div>
                                {pb.perPhoto.slice(0, 8).map((photo: any, i: number) => {
                                  const pScore = photo.score || photo.quality_score || photo.rating || 0;
                                  return (
                                    <div key={i} style={{ padding: "0.3rem 0.4rem", marginBottom: "0.25rem", borderRadius: "0.35rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-primary)" }}>Photo #{photo.photo_number || photo.index || i + 1}</span>
                                        <span style={{
                                          fontSize: "0.72rem", fontWeight: 700,
                                          color: pScore >= 7 ? "#4caf50" : pScore >= 4 ? "#ff9800" : "#ef5350",
                                        }}>{pScore}/10</span>
                                      </div>
                                      {(photo.feedback || photo.notes || photo.comment) && (
                                        <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginTop: "0.1rem", lineHeight: 1.3 }}>
                                          {(photo.feedback || photo.notes || photo.comment || "").length > 140
                                            ? (photo.feedback || photo.notes || photo.comment).slice(0, 140) + "..."
                                            : (photo.feedback || photo.notes || photo.comment)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Missing angles */}
                            {pb.missingAngles.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Missing Angles ({pb.missingAngles.length})</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                                  {pb.missingAngles.slice(0, 8).map((angle: any, i: number) => {
                                    const label = typeof angle === "string" ? angle : angle.angle || angle.name || angle.shot || "Angle";
                                    return (
                                      <span key={i} style={{
                                        padding: "0.2rem 0.5rem", borderRadius: "9999px", fontSize: "0.62rem", fontWeight: 600,
                                        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef5350",
                                      }}>
                                        {label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Improvement tips */}
                            {pb.improvementTips.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Improvement Tips</div>
                                <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                                  {pb.improvementTips.slice(0, 6).map((tip: any, i: number) => {
                                    const text = typeof tip === "string" ? tip : tip.tip || tip.suggestion || tip.text || "";
                                    return (
                                      <li key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: "0.2rem", lineHeight: 1.4 }}>
                                        {text.length > 140 ? text.slice(0, 140) + "..." : text}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}

                            {/* Platform recommendations */}
                            {pb.platformRecs.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.3rem" }}>Platform Recommendations</div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <th style={{ textAlign: "left", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Platform</th>
                                        <th style={{ textAlign: "left", padding: "0.2rem 0.3rem", color: "var(--text-muted)", fontWeight: 600 }}>Recommendation</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pb.platformRecs.slice(0, 6).map((rec: any, i: number) => {
                                        const platform = typeof rec === "string" ? "" : rec.platform || rec.marketplace || rec.name || "";
                                        const tip = typeof rec === "string" ? rec : rec.recommendation || rec.tip || rec.advice || rec.notes || "";
                                        return (
                                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                            <td style={{ padding: "0.25rem 0.3rem", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap" }}>{platform || `Platform ${i + 1}`}</td>
                                            <td style={{ padding: "0.25rem 0.3rem", color: "var(--text-secondary)" }}>{tip.length > 120 ? tip.slice(0, 120) + "..." : tip}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Staging concepts */}
                            {pb.stagingConcepts.length > 0 && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(0,188,212,0.02))", borderRadius: "0.5rem", border: "1px solid rgba(139,92,246,0.15)" }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Staging Concepts</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                  {pb.stagingConcepts.slice(0, 4).map((concept: any, i: number) => {
                                    const text = typeof concept === "string" ? concept : concept.concept || concept.idea || concept.description || "";
                                    return (
                                      <div key={i} style={{ padding: "0.3rem", borderRadius: "0.3rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                                        <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                                          {"\u{1F3A8}"} {text.length > 150 ? text.slice(0, 150) + "..." : text}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Mobile tips + Video storyboard */}
                            {(pb.mobileTips.length > 0 || pb.videoStoryboard.length > 0) && (
                              <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.6rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                {pb.mobileTips.length > 0 && (
                                  <div style={{ marginBottom: pb.videoStoryboard.length > 0 ? "0.4rem" : 0 }}>
                                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.2rem" }}>Mobile Photography Tips</div>
                                    {pb.mobileTips.slice(0, 3).map((tip: any, i: number) => {
                                      const text = typeof tip === "string" ? tip : tip.tip || tip.text || "";
                                      return <div key={i} style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginBottom: "0.1rem" }}>{"\u{1F4F1}"} {text}</div>;
                                    })}
                                  </div>
                                )}
                                {pb.videoStoryboard.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.2rem" }}>Video Storyboard</div>
                                    {pb.videoStoryboard.slice(0, 3).map((idea: any, i: number) => {
                                      const text = typeof idea === "string" ? idea : idea.idea || idea.description || idea.step || "";
                                      return <div key={i} style={{ fontSize: "0.62rem", color: "var(--text-secondary)", marginBottom: "0.1rem" }}>{"\u{1F3AC}"} {text}</div>;
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Key insight / summary */}
                            {pb.summary && (
                              <div style={{ padding: "0.4rem 0.6rem", background: `${pm.color}08`, borderRadius: "0.4rem", borderLeft: `3px solid ${pm.color}50` }}>
                                <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: pm.color, fontWeight: 700, marginBottom: "0.15rem" }}>{pm.icon} What {pm.label} Found</div>
                                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                                  &ldquo;{typeof pb.summary === "string" && pb.summary.length > 300 ? pb.summary.slice(0, 300) + "..." : pb.summary}&rdquo;
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

                  {/* Failed agents */}
                  {failed.map((p: any) => {
                    const pm = MEGA_PROVIDER_META[p.provider] || { icon: "\u{1F916}", label: p.provider, color: "#888", specialty: "" };
                    return (
                      <div key={p.provider} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.5rem", opacity: 0.6, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: "0.4rem", fontSize: "0.65rem" }}>
                        <span>{pm.icon}</span>
                        <span style={{ fontWeight: 600, color: pm.color }}>{pm.label}</span>
                        <span style={{ color: "#ef4444", flex: 1 }}>&#x274C; {(p.error || "").slice(0, 60)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Comparison table */}
                {successful.length > 1 && (
                  <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>Photo Quality Comparison</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", fontSize: "0.7rem" }}>
                      {successful.map((p: any, i: number) => {
                        const pm = MEGA_PROVIDER_META[p.provider];
                        const pb = allPB[i];
                        return (
                          <span key={p.provider} style={{ color: pm?.color || "var(--text-secondary)" }}>
                            {pm?.icon} {pm?.label}: {pb.qualityScore}/10 quality &middot; {pb.missingAngleCount} missing &middot; {pb.improvementTipCount} tips
                          </span>
                        );
                      })}
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4caf50", marginTop: "0.1rem" }}>
                        &#x2705; Average: {avgQuality}/10 quality &middot; {totalMissing} missing angles &middot; {totalTips} tips total
                      </span>
                    </div>
                  </div>
                )}

                {/* MegaBot Summary */}
                <div style={{ background: "rgba(139,92,246,0.04)", borderLeft: "3px solid rgba(139,92,246,0.3)", borderRadius: "0 0.5rem 0.5rem 0", padding: "0.65rem 0.85rem", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a855f7", fontWeight: 700, marginBottom: "0.3rem" }}>MegaBot Photo Summary</div>
                  <p style={{ fontSize: "0.78rem", lineHeight: 1.55, color: "var(--text-secondary)", margin: 0 }}>
                    {(() => {
                      const parts: string[] = [];
                      parts.push(`${successful.length} AI photo specialists scored your photos at ${avgQuality}/10 average quality with ${totalMissing} missing angles and ${totalTips} improvement tips.`);
                      if (agree >= 80) parts.push(`Strong consensus (${agree}%) on photo assessment.`);
                      for (let i = 0; i < successful.length && parts.length < 6; i++) {
                        const pb = allPB[i];
                        const label = MEGA_PROVIDER_META[successful[i].provider]?.label || successful[i].provider;
                        if (pb.summary && typeof pb.summary === "string") {
                          const sentences = pb.summary.split(/(?<=[.!?])\s+/).slice(0, 1).join(" ");
                          if (sentences.length > 25) parts.push(`${label}: ${sentences}`);
                        }
                      }
                      return parts.join(" ");
                    })()}
                  </p>
                </div>

                {/* Re-run button */}
                <div style={{ textAlign: "center" }}>
                  <button onClick={runMegaPhotoBot} style={{
                    padding: "0.4rem 1rem", fontSize: "0.72rem", borderRadius: "0.4rem", fontWeight: 600,
                    background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", cursor: "pointer",
                  }}>
                    Re-Run MegaBot &mdash; 3 cr
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
