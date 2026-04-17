"use client";

import { useCallback } from "react";

interface V8Pill {
  label: string;
  value: number;
  color: string;
  bg: string;
  border: string;
  trustRing?: boolean;
}

export default function V8PillsStrip({ pills, itemId }: { pills: V8Pill[]; itemId: string }) {
  const trackTap = useCallback((label: string, value: number) => {
    try { (navigator as any)?.vibrate?.(6); } catch {}
    fetch("/api/user-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "PRICING_PILL_TAP", itemId, metadata: JSON.stringify({ pill: label, value }) }),
    }).catch(() => {});
  }, [itemId]);

  return (
    <>
      {pills.map((p, i) => (
        <button
          type="button"
          key={p.label}
          onClick={() => trackTap(p.label, p.value)}
          style={{
            textAlign: "center" as const, padding: "0.35rem 0.65rem", borderRadius: "0.5rem",
            background: p.bg, border: `1px solid ${p.border}`, minWidth: "55px", flexShrink: 0,
            cursor: "pointer", fontFamily: "inherit", animation: `fadeIn 0.3s ease-out ${i * 60}ms both`,
            boxShadow: p.trustRing ? "0 0 0 2px rgba(212,175,55,0.55), 0 0 12px rgba(212,175,55,0.2)" : undefined,
          }}
        >
          <div style={{ fontSize: "0.48rem", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: p.color, fontWeight: 700 }}>{p.label}</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 700, fontFamily: "var(--font-data)", color: p.color, letterSpacing: "-0.01em" }}>${p.value}</div>
        </button>
      ))}
    </>
  );
}
