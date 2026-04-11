"use client";

// CMD-BOT-LOADING-EXPERIENCE — April 10, 2026
// Premium 5-stage progress display with rotating cooking phrases.
// Makes 60-120s bot wait feel like a $1B AI product experience.
// Inline styles only — no Tailwind, no new className.
// Props: { botName: string } — backward-compatible, drop-in replacement.

import { useState, useEffect, useMemo, useRef } from "react";

/* ── 75 premium cooking phrases (Ryan's curated pool) ──────── */
const PHRASE_POOL: ReadonlyArray<string> = [
  "🍳 One Minute While We Cook",
  "☕ It's Percolating...",
  "🔥 Firing Up the Kitchen",
  "🔥 Don't Touch the Stove — We Got This",
  "🔥 Stoking the Fire",
  "🥘 Letting It Simmer",
  "🥘 Slow Cooker Mode: Activated",
  "🍲 Slow Cooking Your Results",
  "🍲 Grandma's Recipe Takes Time",
  "🧑‍🍳 The Chef Is Working",
  "🧑‍🍳 Our AI Chef Is Sweating a Little",
  "🥄 Stirring Things Up",
  "⏲️ Good Things Take Time to Bake",
  "🍞 Waiting for the Dough to Rise",
  "🍞 Waiting on the Bread... It Does What It Wants",
  "🌡️ Checking the Temperature",
  "🥗 Tossing Your Data Together",
  "🧂 Adding the Secret Ingredient",
  "🧂 Adding a Pinch of Magic",
  "🍕 In the Oven — Almost Ready",
  "🍕 We Promise We Didn't Burn It",
  "🫕 Everything's In the Pot",
  "🫕 Stirring the Pot (Professionally)",
  "🔪 Prepping the Ingredients",
  "🔪 Chopping Through Your Data",
  "🍖 Low and Slow Does It",
  "🧁 Frosting the Final Details",
  "🧁 The Frosting Is the Hardest Part",
  "🥞 Flipping It Over Now",
  "🥞 First Pancake Always Takes Longest",
  "🫙 Letting It Marinate",
  "🍜 The Noodles Know What They're Doing",
  "🥩 Getting a Good Sear",
  "🧇 Waffle Won't Be Long",
  "🧇 Waffle You Waiting For? Almost Done",
  "🍯 Drizzling the Final Touches",
  "🫖 Steeping Your Results",
  "🥣 Mixing the Ingredients",
  "🍋 Squeezing Out Every Detail",
  "🧈 Butter It Up — Almost Done",
  "🫔 Wrapping It All Together",
  "🥧 Pie's in the Oven",
  "🍰 Cutting You a Fresh Slice",
  "🍰 Worth Every Second — Promise",
  "🫒 Cold Pressed and Coming Soon",
  "🧆 Deep Frying the Good Stuff",
  "🍱 Plating Your Order Like a Michelin Chef",
  "🥐 Fresh Out of the Oven",
  "🥐 Croissants Take Layers — So Does This",
  "🍶 Warming Things Up",
  "🫗 Pouring It All Out for You",
  "🥫 Opening a Fresh Can of Data",
  "🥫 Fresh Can — No Preservatives",
  "🍽️ Your Table Is Almost Ready, Chef",
  "🥚 Eggs Are In — No Turning Back Now",
  "🧑‍🍳 Yes Chef — Working On It",
  "🫧 Deglazing the Pan — Stay With Us",
  "🥄 Don't Lick the Spoon Yet",
  "🍤 Something Good Is Frying",
  "🌮 Assembling Your Order",
  "🧀 Good Things Get Better With Age",
  "🍷 Letting It Breathe a Moment",
  "🫙 Pickling the Details — In a Good Way",
  "🍣 Rolling It Up Fresh for You",
  "🥙 Stuffing Every Last Detail In",
  "🍛 Simmering With All the Spices",
  "🧁 Don't Peek — It'll Collapse",
  "🫕 Reducing the Sauce — Almost There",
  "🍪 Batch Is In the Oven",
  "🧆 Double Fried for Extra Crunch",
  "🥩 Resting the Meat — Patience, Chef",
  "🫙 Sealed Fresh and Coming Your Way",
  "🥂 Almost Time to Toast",
  "🍦 Cooling It Down to the Perfect Temp",
  "🧑‍🍳 Three Michelin Stars Worth of Loading",
];

/* ── Stage definitions ─────────────────────────────────────── */
const STAGES = [
  { label: "Identifying your item...",             startSec: 0,   pct: 8  },
  { label: "Searching live market prices...",       startSec: 10,  pct: 25 },
  { label: "Running 4 AI engines in parallel...",   startSec: 30,  pct: 50 },
  { label: "Building AI consensus...",              startSec: 60,  pct: 72 },
  { label: "Finalizing your report...",             startSec: 90,  pct: 90 },
  { label: "Taking a bit longer — complex item...", startSec: 120, pct: 95 },
] as const;

function getStageIndex(elapsed: number): number {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (elapsed >= STAGES[i].startSec) return i;
  }
  return 0;
}

/* ── Fisher-Yates shuffle ──────────────────────────────────── */
function shufflePhrases<T>(arr: ReadonlyArray<T>): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ── Component ─────────────────────────────────────────────── */
export default function BotLoadingState({ botName }: { botName: string }) {
  const shuffledPhrases = useMemo(() => shufflePhrases(PHRASE_POOL), []);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  // Phrase rotation: 3.2s per phrase, 400ms crossfade
  useEffect(() => {
    const ROTATION_MS = 3200;
    const FADE_MS = 400;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((prev) => (prev + 1) % shuffledPhrases.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATION_MS);
    return () => clearInterval(interval);
  }, [shuffledPhrases.length]);

  // Elapsed seconds counter — 1 Hz tick
  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const stageIndex = getStageIndex(elapsed);
  const progressPct = STAGES[stageIndex].pct;
  const currentPhrase = shuffledPhrases[phraseIndex];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${botName} is processing`}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2.5rem 2rem",
        minHeight: "340px",
        overflow: "hidden",
      }}
    >
      {/* ── Pulsing teal glow sphere ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,188,212,0.10) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          animation: "botPulseGlow 2s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* ── Header: Bot name + elapsed ── */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: "0.5rem" }}>
        <div style={{
          fontFamily: "'Exo 2', sans-serif",
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "#f1f5f9",
          letterSpacing: "0.02em",
        }}>
          {botName} is running…
        </div>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "0.75rem",
          color: "#64748b",
          marginTop: "0.25rem",
        }}>
          Usually 60–120 seconds
        </div>
      </div>

      {/* ── Rotating phrase ── */}
      <div style={{
        position: "relative",
        zIndex: 1,
        fontSize: "1.35rem",
        fontWeight: 600,
        color: "#f1f5f9",
        textAlign: "center",
        maxWidth: "32rem",
        lineHeight: 1.4,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
        transition: "opacity 400ms ease, transform 400ms ease",
        margin: "1.25rem 0 1.5rem",
        minHeight: "2.5em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {currentPhrase}
      </div>

      {/* ── Stage rows ── */}
      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        width: "100%",
        maxWidth: "340px",
        marginBottom: "1.5rem",
      }}>
        {STAGES.map((stage, i) => {
          const isCompleted = i < stageIndex;
          const isActive = i === stageIndex;
          const isPending = i > stageIndex;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                opacity: isPending ? 0.45 : 1,
                transition: "opacity 600ms ease",
              }}
            >
              {/* Status icon */}
              <div style={{
                flexShrink: 0,
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...(isCompleted ? {
                  background: "rgba(0,188,212,0.18)",
                  border: "1.5px solid #00BCD4",
                } : isActive ? {
                  background: "rgba(0,188,212,0.10)",
                  border: "1.5px solid #00BCD4",
                  animation: "botStagePulse 1.6s ease-in-out infinite",
                } : {
                  background: "transparent",
                  border: "1.5px solid #334155",
                }),
              }}>
                {isCompleted && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d="M2 5.5L4 7.5L8 3" stroke="#00BCD4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isActive && (
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#00BCD4",
                  }} />
                )}
              </div>

              {/* Label + elapsed */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 500 : 400,
                  color: isCompleted ? "#00BCD4" : isActive ? "#f1f5f9" : "#64748b",
                  lineHeight: 1.3,
                  transition: "color 400ms ease",
                }}>
                  {stage.label}
                </div>
                {isActive && (
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "0.6875rem",
                    color: "#64748b",
                    marginTop: "1px",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {elapsed}s
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Progress bar ── */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "340px",
        height: "3px",
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${progressPct}%`,
          background: "#00BCD4",
          transition: "width 800ms ease",
          boxShadow: "0 0 8px rgba(0,188,212,0.4)",
        }} />
      </div>

      <style>{`
        @keyframes botPulseGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50%      { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }
        @keyframes botStagePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,188,212,0.3); }
          50%      { box-shadow: 0 0 0 5px rgba(0,188,212,0); }
        }
      `}</style>
    </div>
  );
}
