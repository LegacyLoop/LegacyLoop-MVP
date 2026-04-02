"use client";

import { useTheme } from "@/app/components/ThemeProvider";

export default function GradientOrbs() {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {/* Orb 1 — Cyan, top center */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "50%",
          width: 900,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,188,212,${isDark ? 0.07 : 0.035}) 0%, transparent 70%)`,
          animation: "orbFloat1 14s ease-in-out infinite",
          transition: "background 0.5s ease",
        }}
      />
      {/* Orb 2 — Teal, bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-10%",
          width: 800,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,150,136,${isDark ? 0.06 : 0.03}) 0%, transparent 70%)`,
          animation: "orbFloat2 18s ease-in-out infinite",
          transition: "background 0.5s ease",
        }}
      />
      {/* Orb 3 — Gold/Antique accent, right side */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          right: "-8%",
          width: 700,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(212,160,23,${isDark ? 0.04 : 0.02}) 0%, transparent 70%)`,
          animation: "orbFloat3 22s ease-in-out infinite",
          transition: "background 0.5s ease",
        }}
      />
    </div>
  );
}
