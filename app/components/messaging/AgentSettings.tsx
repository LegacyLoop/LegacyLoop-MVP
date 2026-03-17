"use client";
import { useState, useEffect } from "react";

export default function AgentSettings({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState({ permissionLevel: "monitor", defaultTone: "professional", autoReplyEnabled: false, checkInThreshold: 50, weeklyReportEnabled: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/messages/agent-settings").then(r => r.json()).then(d => setSettings(prev => ({ ...prev, ...d }))).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/messages/agent-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }).catch(() => {});
    setSaving(false);
  }

  const levels = [
    { key: "monitor", icon: "👁️", name: "Monitor Mode", desc: "Agent watches and alerts. Never sends." },
    { key: "copilot", icon: "🤝", name: "Co-Pilot Mode", desc: "Agent drafts replies. You approve before sending." },
    { key: "autopilot", icon: "🤖", name: "Auto-Pilot Mode", desc: "Agent handles routine messages autonomously." },
  ];

  const tones = ["professional", "friendly", "firm", "warm", "estate"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 320, zIndex: 201, background: "rgba(13,31,45,0.99)", backdropFilter: "blur(20px)", borderLeft: "1px solid rgba(0,188,212,0.2)", padding: 24, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>⚙️ Agent Settings</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 10 }}>Agent Permission Level</div>
        {levels.map(l => (
          <div key={l.key} onClick={() => setSettings(p => ({ ...p, permissionLevel: l.key }))} style={{ padding: 14, borderRadius: 10, cursor: "pointer", marginBottom: 8, background: settings.permissionLevel === l.key ? "rgba(0,188,212,0.1)" : "rgba(255,255,255,0.03)", border: settings.permissionLevel === l.key ? "2px solid #00bcd4" : "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{l.icon} {l.name}</div>
            <div style={{ fontSize: 11, color: "rgba(207,216,220,0.6)", marginTop: 2 }}>{l.desc}</div>
          </div>
        ))}

        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginTop: 20, marginBottom: 10 }}>Default Tone</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
          {tones.map(t => (
            <button key={t} onClick={() => setSettings(p => ({ ...p, defaultTone: t }))} style={{ padding: "6px 14px", fontSize: 10, borderRadius: 20, border: settings.defaultTone === t ? "none" : "1px solid rgba(0,188,212,0.3)", background: settings.defaultTone === t ? "#00bcd4" : "transparent", color: settings.defaultTone === t ? "#000" : "#00bcd4", cursor: "pointer", textTransform: "capitalize", fontWeight: 600 }}>{t}</button>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 6 }}>Check in when deal exceeds:</div>
        <input type="number" value={settings.checkInThreshold} onChange={e => setSettings(p => ({ ...p, checkInThreshold: Number(e.target.value) }))} style={{ width: "100%", padding: "8px 10px", fontSize: 14, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, color: "#00bcd4", outline: "none", marginBottom: 20 }} />

        <button onClick={save} disabled={saving} style={{ width: "100%", height: 44, background: "linear-gradient(135deg, #00bcd4, #0097a7)", color: "#000", fontWeight: 700, fontSize: 13, borderRadius: 8, border: "none", cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
