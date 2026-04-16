"use client";
import { useState, useEffect } from "react";

export default function WeeklyReportCard() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [counts, setCounts] = useState({ hot: 0, needsReply: 0, total: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d) setCounts({ hot: d.hot || 0, needsReply: d.needsReply || 0, total: d.total || 0 });
    };
    window.addEventListener("conversation-counts-updated", handler);
    return () => window.removeEventListener("conversation-counts-updated", handler);
  }, []);

  if (dismissed || isMobile) return null;

  const metrics = [
    { label: "Messages", value: counts.total || "—" },
    { label: "Hot Leads", value: counts.hot || "—" },
    { label: "Needs Reply", value: counts.needsReply || "—" },
    { label: "Avg Response", value: "—" },
  ];

  return (
    <div style={{ background: expanded ? "var(--accent-dim)" : "linear-gradient(135deg, var(--accent-dim), transparent)", border: "1px solid var(--accent-border)", borderRadius: "1.25rem", padding: expanded ? "18px 20px" : "14px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>📊 Your Weekly Intelligence Report is ready</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 11, fontWeight: 600, padding: "6px 14px", minHeight: 36, borderRadius: "0.5rem", border: "1px solid var(--accent-border)", background: "transparent", color: "var(--accent)", cursor: "pointer", transition: "all 0.15s ease" }}>{expanded ? "Collapse" : "View Report"}</button>
          <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 14, cursor: "pointer", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {metrics.map((s, i) => (
              <div key={i} style={{ flex: 1, background: "var(--ghost-bg)", borderRadius: "0.75rem", padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-data)" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", borderRadius: "0.75rem", padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "var(--accent)", lineHeight: 1.5 }}>💡 Keep engaging with buyers. Consistency closes deals. Run the AI agent report after your first week of active messaging.</div>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 10 }}>Next report: Sunday</div>
        </div>
      )}
    </div>
  );
}
