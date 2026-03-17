"use client";

import { useTheme } from "@/app/components/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

type ThemeMode = "light" | "dark" | "auto";

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun; desc: string }[] = [
  { mode: "light", label: "Light", icon: Sun, desc: "Always use light theme" },
  { mode: "dark", label: "Dark", icon: Moon, desc: "Always use dark theme" },
  { mode: "auto", label: "Auto", icon: Monitor, desc: "Match your system setting" },
];

export default function ThemeSettings() {
  const { mode, setMode, resolved } = useTheme();

  return (
    <div className="card p-6 mb-4">
      <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-card)", marginBottom: "0.25rem" }}>
        Appearance
      </div>
      <div style={{ color: "var(--muted-card)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
        Choose how LegacyLoop looks to you. Currently using <strong>{resolved}</strong> mode.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
        {OPTIONS.map(({ mode: m, label, icon: Icon, desc }) => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1.25rem 0.75rem",
                borderRadius: "0.875rem",
                border: `2px solid ${active ? "var(--accent)" : "var(--border-default)"}`,
                background: active ? "var(--accent-dim)" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon
                size={22}
                style={{
                  color: active ? "var(--accent)" : "var(--text-muted)",
                }}
              />
              <span style={{
                fontSize: "0.85rem",
                fontWeight: active ? 700 : 500,
                color: active ? "var(--accent)" : "var(--text-card)",
              }}>
                {label}
              </span>
              <span style={{
                fontSize: "0.72rem",
                color: "var(--muted-card)",
                textAlign: "center",
              }}>
                {desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
