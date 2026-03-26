"use client";

import { useState, useEffect } from "react";

type Props = {
  saleMethod: string;
  itemId: string;
};

export default function SaleCongratsBar({ saleMethod, itemId }: Props) {
  const isOnline = saleMethod === "ONLINE_SHIPPING" || saleMethod === "BOTH";
  const isLocal = saleMethod === "LOCAL_PICKUP";

  const [glowing, setGlowing] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setGlowing(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const scrollToShipping = () => {
    const el = document.getElementById("shipping-panel");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        padding: "1.1rem 1.25rem",
        borderRadius: "0.75rem",
        background: "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(16,185,129,0.08))",
        border: "1px solid rgba(22,163,74,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        flexWrap: "wrap",
        boxShadow: glowing ? "0 0 20px rgba(34,197,94,0.2)" : "none",
        transition: "box-shadow 1.5s ease-out",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: "var(--success-text)", fontSize: "1rem" }}>
          🎉 Congratulations! This item is sold!
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem", lineHeight: 1.5 }}>
          {isLocal
            ? "Complete the pickup process below — schedule the meetup and confirm the handoff."
            : isOnline
            ? "Time to ship it to the buyer. Complete the shipping flow below."
            : "Choose how to fulfill this sale — ship it, schedule a pickup, or arrange freight."}
        </div>
      </div>
      <div>
        <button
          onClick={scrollToShipping}
          style={{
            padding: "0.55rem 1.25rem", fontSize: "0.78rem", fontWeight: 700,
            borderRadius: "0.5rem", border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #4caf50, #2e7d32)", color: "#fff",
            boxShadow: "0 2px 8px rgba(76,175,80,0.25)",
            transition: "all 0.2s ease", minHeight: "44px",
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            whiteSpace: "nowrap" as const,
          }}
        >
          {isLocal ? "🤝 Start Pickup →" : isOnline ? "📦 Ship Now →" : "Complete Sale →"}
        </button>
      </div>
    </div>
  );
}
