import { ImageResponse } from "next/og";

export const runtime     = "edge";
export const size        = { width: 32, height: 32 };
export const contentType = "image/png";

// Generated favicon — matches teal brand. To use the actual logo PNG:
// copy public/images/logos/logo-icon.png → app/icon.png (Next.js will serve it automatically).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#090912",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 58% 42%, rgba(0,188,212,0.28) 0%, transparent 72%)",
          }}
        />
        {/* Crescent mark: large teal circle with cutout */}
        <div style={{ position: "relative", width: 20, height: 20 }}>
          <div
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#00bcd4",
              top: 1,
              left: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#090912",
              top: -1,
              left: 6,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
