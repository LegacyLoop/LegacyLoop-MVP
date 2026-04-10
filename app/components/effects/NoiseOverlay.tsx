"use client";

import { useTheme } from "@/app/components/ThemeProvider";

export default function NoiseOverlay() {
  const { resolved } = useTheme();
  const opacity = resolved === "dark" ? 0.035 : 0.018;

  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="ll-noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves={3}
              stitchTiles="stitch"
            />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity,
          filter: "url(#ll-noise-filter)",
          background: "rgba(255,255,255,1)",
          transition: "opacity 0.3s ease",
        }}
        aria-hidden="true"
      />
    </>
  );
}
