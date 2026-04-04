type Log = {
  id: string;
  eventType: string;
  payload: string | null;
  createdAt: string;
};

interface Props {
  itemId: string;
  itemTitle: string;
  logs: Log[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type EventMeta = {
  icon: string;
  label: (payload: any) => string;
  color: string;
};

const EVENT_META: Record<string, EventMeta> = {
  ANALYZED: {
    icon: "🤖",
    label: (p) => `AI analysis complete · ${p?.comps ?? 0} comps · ${p?.pricingSource ?? "AI estimate"}`,
    color: "#0f766e",
  },
  ANALYZED_FORCE: {
    icon: "🔄",
    label: (p) => `Re-analyzed · ${p?.comps ?? 0} comps · ${p?.pricingSource ?? "AI estimate"}`,
    color: "#0369a1",
  },
  MEGABOT_ANALYSIS: {
    icon: "⚡",
    label: (p) => `MegaBot ran · ${p?.agreementScore ?? "?"}% agreement · 4-AI consensus`,
    color: "#7c3aed",
  },
  STATUS_CHANGE: {
    icon: "🏷️",
    label: (p) => `Status changed: ${p?.from ?? "?"} → ${p?.to ?? "?"}`,
    color: "var(--text-secondary)",
  },
};

function safePayload(raw: string | null): any {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function ActivityLog({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="card p-6">
        <div className="section-title mb-3">📊 Activity Log</div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          No activity recorded yet. Analyze the item to start tracking events.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="section-title mb-4">📊 Activity Log</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {logs.map((log, i) => {
          const meta = EVENT_META[log.eventType];
          const payload = safePayload(log.payload);
          const icon = meta?.icon ?? "📌";
          const label = meta ? meta.label(payload) : log.eventType.replace(/_/g, " ").toLowerCase();
          const color = meta?.color ?? "var(--text-muted)";

          return (
            <div
              key={log.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "0.75rem 0",
                borderBottom: i < logs.length - 1 ? "1px solid var(--border-default)" : "none",
              }}
            >
              {/* Timeline dot + line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "0.15rem" }}>
                <div style={{ width: "2rem", height: "2rem", borderRadius: "9999px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
                  {icon}
                </div>
                {i < logs.length - 1 && (
                  <div style={{ width: "2px", flex: 1, minHeight: "12px", background: "var(--border-default)", marginTop: "0.2rem" }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>{label}</div>

                {/* Pricing source detail */}
                {(log.eventType === "ANALYZED" || log.eventType === "ANALYZED_FORCE") && payload?.suggestMegabot && (
                  <div style={{ fontSize: "0.75rem", color: "#7c3aed", marginTop: "0.15rem" }}>
                    ⚡ Low confidence — consider MegaBot for better accuracy
                  </div>
                )}

                {/* MegaBot provider detail */}
                {log.eventType === "MEGABOT_ANALYSIS" && payload?.providers && (
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.15rem", display: "flex", gap: "0.5rem" }}>
                    {payload.providers.map((p: any) => (
                      <span key={p.provider} style={{ padding: "0.1rem 0.4rem", borderRadius: "9999px", background: p.error ? "#fee2e2" : "#dcfce7", color: p.error ? "#dc2626" : "#15803d" }}>
                        {p.provider} {p.error ? "✗" : "✓"}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {timeAgo(log.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
