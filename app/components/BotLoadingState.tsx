"use client";

import { useState, useEffect } from "react";

const BOT_SUBTEXTS: Record<string, string[]> = {
  AnalyzeBot: [
    "Identifying your item with AI...",
    "Examining photos for details...",
    "This usually takes 10-20 seconds",
  ],
  PriceBot: [
    "Scanning market prices...",
    "Comparing recent sales data...",
    "Checking regional demand...",
  ],
  ListBot: [
    "Crafting the perfect listing...",
    "Optimizing title and description...",
    "This usually takes 10-20 seconds",
  ],
  BuyerBot: [
    "Finding interested buyers nearby...",
    "Scanning buyer networks...",
    "Matching item to collectors...",
  ],
  ReconBot: [
    "Monitoring the competitive market...",
    "Scanning competitor listings...",
    "Analyzing pricing trends...",
  ],
  CarBot: [
    "Running vehicle analysis...",
    "Checking VIN databases...",
    "Comparing similar vehicles...",
  ],
  AntiqueBot: [
    "Evaluating authenticity and age...",
    "Cross-referencing maker marks...",
    "Consulting historical records...",
  ],
  CollectiblesBot: [
    "Grading your collectible...",
    "Checking collector databases...",
    "Evaluating rarity and condition...",
  ],
  PhotoBot: [
    "Enhancing your photos...",
    "Optimizing image quality...",
    "Adjusting lighting and contrast...",
  ],
  MegaBot: [
    "Consulting all AI experts...",
    "Running multi-model analysis...",
    "Comparing expert opinions...",
  ],
  ShipBot: [
    "Calculating shipping options...",
    "Comparing carrier rates...",
    "Optimizing package dimensions...",
  ],
  StyleBot: [
    "Analyzing style and aesthetics...",
    "Identifying design patterns...",
    "Matching to style categories...",
  ],
};

const DEFAULT_SUBTEXTS = [
  "Our AI is analyzing your item...",
  "Checking market prices...",
  "Finding the best buyers...",
  "Analyzing condition and value...",
  "This usually takes 10-20 seconds",
];

export default function BotLoadingState({ botName }: { botName: string }) {
  const [subtextIndex, setSubtextIndex] = useState(0);
  const subtexts = BOT_SUBTEXTS[botName] ?? DEFAULT_SUBTEXTS;

  useEffect(() => {
    const timer = setInterval(() => {
      setSubtextIndex((prev) => (prev + 1) % subtexts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [subtexts.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2rem",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Teal pulse glow behind emoji */}
      <div
        style={{
          position: "absolute",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,188,212,0.15) 0%, transparent 70%)",
          animation: "botPulseGlow 2s ease-in-out infinite",
          top: "calc(50% - 100px)",
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      />

      {/* Cooking emoji with gentle bounce */}
      <div
        style={{
          fontSize: "3rem",
          marginBottom: "1.25rem",
          animation: "botCookBounce 2s ease-in-out infinite",
          position: "relative",
          zIndex: 1,
        }}
      >
        🍳
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "#fff",
          marginBottom: "0.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        One minute while we cook...
      </div>

      {/* Rotating subtext */}
      <div
        style={{
          fontSize: "0.85rem",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "1.5rem",
          minHeight: "1.5em",
          position: "relative",
          zIndex: 1,
        }}
      >
        {subtexts[subtextIndex]}
      </div>

      {/* Animated progress dots */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#00bcd4",
              animation: `botDotFade 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes botPulseGlow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
        }
        @keyframes botCookBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes botDotFade {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
