"use client";

// CMD-LOADER-PHRASES-A — April 7, 2026
// 75-phrase universal pool (PHRASE_POOL), smooth crossfade rotation,
// elapsed counter, accessible status announcements. Backward-compatible:
// signature still accepts only { botName: string }. Every existing call
// site renders unchanged. Inline styles only — no Tailwind utilities.

import { useState, useEffect, useMemo, useRef } from "react";

/**
 * Universal master pool of 75 fun, premium, food/cooking-themed phrases
 * shown by every bot's loading state. Shuffled per mount so two scans
 * in a row feel different. Source: Ryan's hand-curated master list.
 */
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

/**
 * Fisher-Yates shuffle. Module-scoped so it's stable across renders
 * and only ever invoked once per component mount via useMemo.
 */
function shufflePhrases<T>(arr: ReadonlyArray<T>): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function BotLoadingState({ botName }: { botName: string }) {
  // Stable shuffled order per mount — different every time the loader appears.
  const shuffledPhrases = useMemo(() => shufflePhrases(PHRASE_POOL), []);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  // Phrase rotation: 3.2s per phrase, 400ms crossfade.
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

  // Elapsed seconds counter — 1 Hz tick.
  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const currentPhrase = shuffledPhrases[phraseIndex];
  const elapsedDisplay = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

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
        padding: "3rem 2rem",
        minHeight: "240px",
        overflow: "hidden",
      }}
    >
      {/* Pulsing teal glow sphere */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,188,212,0.15) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          animation: "botPulseGlow 2s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Subtle horizontal scan line — high-tech accent */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(0,188,212,0.4) 50%, transparent 100%)",
          animation: "botScanLine 3s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Bot label pill with elapsed timer */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.375rem 0.875rem",
          borderRadius: "9999px",
          background: "rgba(0,188,212,0.12)",
          border: "1px solid rgba(0,188,212,0.3)",
          color: "var(--accent, #00bcd4)",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "1.25rem",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ⚡ {botName} · {elapsedDisplay}
      </div>

      {/* Rotating phrase — crossfade between members of the 75-phrase pool */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          textAlign: "center",
          maxWidth: "32rem",
          lineHeight: 1.4,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 400ms ease, transform 400ms ease",
          marginBottom: "1.5rem",
          minHeight: "2.5em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {currentPhrase}
      </div>

      {/* Sub-line — single static, theme-muted */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: "1.25rem",
          fontStyle: "italic",
        }}
      >
        This usually takes 10–25 seconds…
      </div>

      {/* Progress dots — 3 cascading teal */}
      <div
        aria-hidden
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: "0.5rem",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--accent, #00bcd4)",
              animation: `botDotFade 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes botPulseGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50%      { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }
        @keyframes botDotFade {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%      { opacity: 1; transform: scale(1.2); }
        }
        @keyframes botScanLine {
          0%, 100% { opacity: 0; transform: translateY(-40px); }
          50%      { opacity: 1; transform: translateY(40px); }
        }
      `}</style>
    </div>
  );
}
