"use client";

import { useState, useCallback } from "react";
import BotItemSelector from "@/app/bots/BotItemSelector";

type ItemData = {
  id: string;
  title: string;
  photo: string | null;
  status: string;
  hasAnalysis: boolean;
  videoBotResult?: string | null;
  videoBotRunAt?: string | null;
};

type Props = {
  items: ItemData[];
};

type VideoScript = {
  hook: string;
  body: string;
  cta: string;
  fullScript: string;
  hashtags: string[];
  duration: number;
  platform: string;
  voiceDirection: string;
};

type PipelineStep = {
  name: string;
  status: string;
  durationMs: number;
  error?: string;
};

type VideoBotResult = {
  success: boolean;
  videoUrl: string | null;
  script: VideoScript | null;
  narrationUrl: string | null;
  intelligence: any;
  steps: PipelineStep[];
  totalDurationMs: number;
  tier: string;
  platform: string;
  _isDemo?: boolean;
};

const TIERS = [
  { id: "standard", label: "Standard", credits: 8, desc: "FFmpeg video" },
  { id: "pro", label: "Pro", credits: 15, desc: "AI video ads" },
  { id: "mega", label: "MegaBot", credits: 25, desc: "4-AI consensus" },
] as const;

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: "T" },
  { id: "reels", label: "Reels", icon: "R" },
  { id: "shorts", label: "Shorts", icon: "S" },
  { id: "facebook", label: "FB", icon: "F" },
  { id: "all", label: "All", icon: "*" },
] as const;

const PROGRESS_STEPS = [
  "Gathering intelligence...",
  "Generating script...",
  "Assembling video...",
  "Creating narration...",
  "Final assembly...",
];

export default function VideoBotClient({ items }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [selectedTier, setSelectedTier] = useState<string>("standard");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<VideoBotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videosGenerated, setVideosGenerated] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [copied, setCopied] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  // Load existing result on item select
  const handleSelectItem = useCallback(async (id: string) => {
    setSelectedId(id);
    setResult(null);
    setError(null);
    const item = items.find((i) => i.id === id);
    if (item?.videoBotResult) {
      try {
        const parsed = typeof item.videoBotResult === "string" ? JSON.parse(item.videoBotResult) : item.videoBotResult;
        setResult(parsed);
      } catch { /* ignore parse errors */ }
    } else {
      // Try fetching from API
      try {
        const res = await fetch(`/api/bots/videobot/${id}`);
        const data = await res.json();
        if (data.hasResult && data.result) {
          setResult(data.result);
        }
      } catch { /* non-critical */ }
    }
  }, [items]);

  const handleGenerate = async () => {
    if (!selectedId || !selectedItem?.hasAnalysis) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgressStep(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgressStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const res = await fetch(`/api/bots/videobot/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, platform: selectedPlatform }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "VideoBot failed");
      }

      if (data.result) {
        setResult(data.result);
        setVideosGenerated((p) => p + 1);
        const tierCost = TIERS.find((t) => t.id === selectedTier)?.credits ?? 8;
        setCreditsUsed((p) => p + tierCost);
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate video");
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const copyScript = () => {
    if (!result?.script?.fullScript) return;
    navigator.clipboard.writeText(result.script.fullScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Styles ──
  const card: React.CSSProperties = {
    background: "var(--bg-card, rgba(255,255,255,0.05))",
    border: "1px solid var(--border-default, rgba(255,255,255,0.08))",
    borderRadius: "1rem",
    padding: "1.25rem",
    marginBottom: "1rem",
  };

  const glassPill = (active: boolean): React.CSSProperties => ({
    padding: "0.5rem 1rem",
    borderRadius: "9999px",
    border: active ? "1.5px solid var(--accent, #00bcd4)" : "1px solid var(--border-default, rgba(255,255,255,0.1))",
    background: active ? "rgba(0,188,212,0.15)" : "var(--bg-card, rgba(255,255,255,0.03))",
    color: active ? "var(--accent, #00bcd4)" : "var(--text-secondary, #a8a29e)",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: active ? 600 : 400,
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
  });

  const ctaBtn: React.CSSProperties = {
    width: "100%",
    padding: "1rem 2rem",
    borderRadius: "0.75rem",
    border: "none",
    background: "linear-gradient(135deg, #00bcd4 0%, #009688 100%)",
    color: "#fff",
    fontSize: "1.1rem",
    fontWeight: 700,
    cursor: loading || !selectedItem?.hasAnalysis ? "not-allowed" : "pointer",
    opacity: loading || !selectedItem?.hasAnalysis ? 0.5 : 1,
    transition: "all 0.2s ease",
    letterSpacing: "0.02em",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--text-muted, #78716c)",
    marginBottom: "0.75rem",
  };

  return (
    <div>
      {/* Stats Bar */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ ...card, flex: 1, display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 0 }}>
          <span style={{ fontSize: "1.5rem" }}>🎬</span>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary, #e7e5e4)" }}>{videosGenerated}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #78716c)" }}>Videos Generated</div>
          </div>
        </div>
        <div style={{ ...card, flex: 1, display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 0 }}>
          <span style={{ fontSize: "1.5rem" }}>💎</span>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary, #e7e5e4)" }}>{creditsUsed}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #78716c)" }}>Credits Used</div>
          </div>
        </div>
      </div>

      {/* Item Selector */}
      <div style={card}>
        <div style={sectionTitle}>Select Item</div>
        <BotItemSelector items={items} selectedId={selectedId} onSelect={handleSelectItem} />
      </div>

      {/* Video Preview */}
      <div style={card}>
        <div style={sectionTitle}>Video Preview</div>
        <div style={{
          width: "100%",
          maxWidth: 360,
          aspectRatio: "9/16",
          margin: "0 auto",
          borderRadius: "0.75rem",
          overflow: "hidden",
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative" as const,
        }}>
          {result?.videoUrl ? (
            <video
              src={result.videoUrl}
              controls
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              playsInline
            />
          ) : selectedItem?.photo ? (
            <div style={{ position: "relative" as const, width: "100%", height: "100%" }}>
              <img
                src={selectedItem.photo}
                alt={selectedItem.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
              />
              <div style={{
                position: "absolute" as const,
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column" as const,
                gap: "0.5rem",
              }}>
                <span style={{ fontSize: "3rem", opacity: 0.8 }}>🎬</span>
                <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>Generate video to preview</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted, #78716c)" }}>
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem" }}>🎬</span>
              <span style={{ fontSize: "0.85rem" }}>Select an item to start</span>
            </div>
          )}
        </div>
      </div>

      {/* Tier Selector */}
      <div style={card}>
        <div style={sectionTitle}>Video Tier</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
          {TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              style={glassPill(selectedTier === tier.id)}
            >
              <span>{tier.label}</span>
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{tier.credits} cr</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #78716c)", marginTop: "0.5rem" }}>
          {TIERS.find((t) => t.id === selectedTier)?.desc || ""}
        </div>
      </div>

      {/* Platform Selector */}
      <div style={card}>
        <div style={sectionTitle}>Platform</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              style={glassPill(selectedPlatform === p.id)}
            >
              <span style={{ fontWeight: 700, fontSize: "0.7rem", width: 18, height: 18, borderRadius: "50%", background: selectedPlatform === p.id ? "var(--accent, #00bcd4)" : "rgba(255,255,255,0.1)", color: selectedPlatform === p.id ? "#fff" : "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {p.icon}
              </span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate CTA */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={handleGenerate} disabled={loading || !selectedItem?.hasAnalysis} style={ctaBtn}>
          {loading ? "Generating..." : "🎬 Generate Video Ad"}
        </button>
        {!selectedItem?.hasAnalysis && selectedItem && (
          <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.5rem", textAlign: "center" }}>
            Run AI analysis on this item first
          </p>
        )}
      </div>

      {/* Loading Progress */}
      {loading && (
        <div style={card}>
          <div style={sectionTitle}>Generating Video</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
            {PROGRESS_STEPS.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  background: i <= progressStep
                    ? i < progressStep ? "rgba(76,175,80,0.2)" : "rgba(0,188,212,0.2)"
                    : "rgba(255,255,255,0.05)",
                  color: i <= progressStep
                    ? i < progressStep ? "#4caf50" : "var(--accent, #00bcd4)"
                    : "var(--text-muted, #78716c)",
                  border: i === progressStep ? "1.5px solid var(--accent, #00bcd4)" : "1px solid transparent",
                }}>
                  {i < progressStep ? "\u2713" : i + 1}
                </div>
                <span style={{
                  fontSize: "0.82rem",
                  color: i <= progressStep ? "var(--text-primary, #e7e5e4)" : "var(--text-muted, #78716c)",
                  fontWeight: i === progressStep ? 600 : 400,
                }}>
                  {step}
                </span>
                {i === progressStep && (
                  <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--accent, #00bcd4)" }}>
                    Running...
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ ...card, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
          <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Script Preview */}
      {result?.script && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div style={sectionTitle}>Script Preview</div>
            <button onClick={copyScript} style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border-default, rgba(255,255,255,0.1))",
              background: "transparent",
              color: "var(--accent, #00bcd4)",
              fontSize: "0.72rem",
              cursor: "pointer",
            }}>
              {copied ? "Copied!" : "Copy Script"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#f59e0b", display: "block", marginBottom: "0.25rem" }}>HOOK</span>
              <p style={{ fontSize: "0.85rem", color: "var(--text-primary, #e7e5e4)", margin: 0, lineHeight: 1.5 }}>{result.script.hook}</p>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent, #00bcd4)", display: "block", marginBottom: "0.25rem" }}>BODY</span>
              <p style={{ fontSize: "0.85rem", color: "var(--text-primary, #e7e5e4)", margin: 0, lineHeight: 1.5 }}>{result.script.body}</p>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#4caf50", display: "block", marginBottom: "0.25rem" }}>CTA</span>
              <p style={{ fontSize: "0.85rem", color: "var(--text-primary, #e7e5e4)", margin: 0, lineHeight: 1.5 }}>{result.script.cta}</p>
            </div>
            {result.script.hashtags.length > 0 && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const }}>
                {result.script.hashtags.map((tag) => (
                  <span key={tag} style={{
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    background: "rgba(0,188,212,0.1)",
                    color: "var(--accent, #00bcd4)",
                    fontSize: "0.72rem",
                  }}>{tag}</span>
                ))}
              </div>
            )}
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #78716c)" }}>
              {result.script.duration}s | {result.script.platform} | Voice: {result.script.voiceDirection}
            </div>
          </div>
        </div>
      )}

      {/* Platform Distribution */}
      {result?.script && (
        <div style={card}>
          <div style={sectionTitle}>Platform Distribution</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.5rem" }}>
            {[
              { name: "TikTok", ready: selectedPlatform === "tiktok" || selectedPlatform === "all" },
              { name: "Instagram Reels", ready: selectedPlatform === "reels" || selectedPlatform === "all" },
              { name: "YouTube Shorts", ready: selectedPlatform === "shorts" || selectedPlatform === "all" },
              { name: "Facebook", ready: selectedPlatform === "facebook" || selectedPlatform === "all" },
              { name: "Pinterest", ready: false },
              { name: "Twitter/X", ready: false },
            ].map((p) => (
              <div key={p.name} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-default, rgba(255,255,255,0.05))",
              }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-primary, #e7e5e4)" }}>{p.name}</span>
                {p.ready ? (
                  <span style={{
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "rgba(76,175,80,0.15)",
                    color: "#4caf50",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                  }}>Ready</span>
                ) : (
                  <span style={{
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "rgba(255,255,255,0.05)",
                    color: "var(--text-muted, #78716c)",
                    fontSize: "0.68rem",
                  }}>Coming Soon</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Steps (if result has them) */}
      {result?.steps && result.steps.length > 0 && (
        <div style={card}>
          <div style={sectionTitle}>Pipeline Steps</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem" }}>
            {result.steps.map((step) => (
              <div key={step.name} style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.78rem",
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: step.status === "done" ? "#4caf50"
                    : step.status === "skipped" ? "var(--text-muted, #78716c)"
                    : step.status === "error" ? "#ef4444"
                    : "var(--accent, #00bcd4)",
                  flexShrink: 0,
                }} />
                <span style={{ color: "var(--text-primary, #e7e5e4)", flex: 1 }}>{step.name}</span>
                <span style={{ color: "var(--text-muted, #78716c)", fontSize: "0.7rem" }}>
                  {step.status === "skipped" ? "skipped" : `${step.durationMs}ms`}
                </span>
              </div>
            ))}
          </div>
          {result.totalDurationMs > 0 && (
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #78716c)", marginTop: "0.5rem", textAlign: "right" }}>
              Total: {(result.totalDurationMs / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      )}

      {/* Demo indicator */}
      {result?._isDemo && (
        <div style={{
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          background: "rgba(251,191,36,0.1)",
          border: "1px solid rgba(251,191,36,0.2)",
          fontSize: "0.75rem",
          color: "#fbbf24",
          textAlign: "center",
        }}>
          Demo Mode -- Video generation simulated. Connect APIs for real video output.
        </div>
      )}
    </div>
  );
}
