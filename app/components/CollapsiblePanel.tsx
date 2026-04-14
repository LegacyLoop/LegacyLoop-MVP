"use client";

import { useState, useRef, useEffect } from "react";
import { usePersistedState } from "@/lib/hooks/usePersistedState";

type Props = {
  title: string;
  subtitle?: string;
  icon: string;
  preview?: string;
  defaultOpen?: boolean;
  accentColor?: string;
  storageKey?: string;
  children: React.ReactNode;
};

export default function CollapsiblePanel({
  title,
  subtitle,
  icon,
  preview,
  defaultOpen = false,
  accentColor = "var(--accent, #00bcd4)",
  storageKey,
  children,
}: Props) {
  const [open, setOpen] = usePersistedState(storageKey ?? "", defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      setHeight(contentRef.current.scrollHeight);
      const t = setTimeout(() => setHeight(undefined), 350);
      return () => clearTimeout(t);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open]);

  return (
    <div
      style={{
        background: "var(--bg-card, var(--ghost-bg))",
        border: "1px solid var(--border-card, var(--border-default))",
        borderRadius: "1.25rem",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1.25rem 1.5rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "var(--text-primary, #e7e5e4)",
        }}
      >
        <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{title}</span>
          {subtitle && <div style={{ fontSize: "0.72rem", color: "var(--text-muted, #a8a29e)", fontWeight: 400, marginTop: "0.1rem" }}>{subtitle}</div>}
        </div>
        {!open && preview && (
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted, #a8a29e)",
              maxWidth: "50%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {preview}
          </span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            flexShrink: 0,
          }}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        ref={contentRef}
        style={{
          height: height !== undefined ? `${height}px` : "auto",
          overflow: "hidden",
          transition: "height 0.3s ease",
        }}
      >
        <div style={{ padding: "0 1.5rem 1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}
