"use client";

type ItemOption = {
  id: string;
  title: string;
  photo: string | null;
  status: string;
  hasAnalysis: boolean;
};

type Props = {
  items: ItemOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function BotItemSelector({ items, selectedId, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
        <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>No items yet</p>
        <p style={{ fontSize: "0.85rem" }}>Upload an item first, then come back to run bot analysis.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            border: selectedId === item.id ? "1.5px solid var(--accent, #00bcd4)" : "1px solid var(--border-default, rgba(255,255,255,0.08))",
            background: selectedId === item.id ? "rgba(0,188,212,0.1)" : "var(--bg-card, rgba(255,255,255,0.03))",
            cursor: "pointer",
            whiteSpace: "nowrap",
            color: "var(--text-primary, #e7e5e4)",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
        >
          {item.photo && (
            <img
              src={item.photo}
              alt=""
              style={{ width: 28, height: 28, borderRadius: "0.4rem", objectFit: "cover" }}
            />
          )}
          <span style={{ fontSize: "0.82rem", fontWeight: selectedId === item.id ? 600 : 400 }}>
            {item.title || `Item #${item.id.slice(0, 6)}`}
          </span>
          {item.hasAnalysis && (
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent, #00bcd4)", flexShrink: 0 }} />
          )}
        </button>
      ))}
    </div>
  );
}
