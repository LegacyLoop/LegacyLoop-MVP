"use client";
import { useState } from "react";

export default function WeeklyReportCard() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{ background: expanded ? "rgba(0,188,212,0.06)" : "linear-gradient(135deg, rgba(0,188,212,0.08), transparent)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: 12, padding: expanded ? "18px 20px" : "14px 18px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>📊 Your Weekly Intelligence Report is ready</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(0,188,212,0.3)", background: "transparent", color: "#00bcd4", cursor: "pointer" }}>{expanded ? "Collapse" : "View Report"}</button>
          <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer" }}>✕</button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[{ label: "Messages", value: "—" }, { label: "Agent Assists", value: "—" }, { label: "Deals Closed", value: "—" }, { label: "Avg Response", value: "—" }].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 9, color: "rgba(207,216,220,0.5)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#00bcd4", lineHeight: 1.5 }}>💡 Keep engaging with buyers. Consistency closes deals. Run the AI agent report after your first week of active messaging.</div>
          </div>
          <div style={{ fontSize: 10, color: "rgba(207,216,220,0.4)", marginTop: 10 }}>Next report: Sunday</div>
        </div>
      )}
    </div>
  );
}
