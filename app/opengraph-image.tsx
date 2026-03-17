import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LegacyLoop — AI-Powered Estate Sales";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f766e, #0d9488)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "48px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              background: "white",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f766e",
              fontWeight: 800,
              fontSize: 28,
            }}
          >
            LL
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 36 }}>LegacyLoop</span>
        </div>

        {/* Headline */}
        <div style={{ color: "white", fontWeight: 900, fontSize: 68, lineHeight: 1.1, maxWidth: "850px", marginBottom: "28px" }}>
          AI-Powered Estate Sales
        </div>

        {/* Subtext */}
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 28, maxWidth: "700px", lineHeight: 1.5, marginBottom: "40px" }}>
          Turn your family's belongings into meaningful income — with expert AI pricing, buyer matching, and white-glove service.
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: "48px" }}>
          {[
            { value: "847+", label: "Families served" },
            { value: "$2.4M", label: "In items sold" },
            { value: "4.9★", label: "Average rating" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#fbbf24", fontWeight: 900, fontSize: 32 }}>{s.value}</span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
