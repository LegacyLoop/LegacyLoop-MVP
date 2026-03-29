export default function ShortcutsPage() {
  const sections = [
    { title: "Navigation", icon: "🧭", shortcuts: [
      { keys: "Ctrl + K", action: "Quick search & command palette" },
      { keys: "Ctrl + N", action: "Create new item" },
      { keys: "Ctrl + D", action: "Go to dashboard" },
      { keys: "Ctrl + /", action: "Toggle help widget" },
      { keys: "?", action: "Show keyboard shortcuts" },
    ]},
    { title: "Item Actions", icon: "📦", shortcuts: [
      { keys: "Ctrl + S", action: "Save current item" },
      { keys: "Ctrl + E", action: "Edit current item" },
      { keys: "Ctrl + A", action: "Run AI analysis" },
      { keys: "Ctrl + P", action: "Run PriceBot" },
      { keys: "Ctrl + L", action: "Run ListBot" },
    ]},
    { title: "Bot Hub", icon: "🤖", shortcuts: [
      { keys: "Ctrl + B", action: "Open Bot Hub" },
      { keys: "Ctrl + M", action: "Run MegaBot" },
      { keys: "Ctrl + Shift + B", action: "Run BuyerBot" },
      { keys: "Ctrl + Shift + R", action: "Run ReconBot" },
    ]},
    { title: "View Controls", icon: "👁️", shortcuts: [
      { keys: "Ctrl + T", action: "Toggle dark / light theme" },
      { keys: "Ctrl + [", action: "Collapse all panels" },
      { keys: "Ctrl + ]", action: "Expand all panels" },
      { keys: "Esc", action: "Close modal or dropdown" },
    ]},
    { title: "Shipping & Sales", icon: "🚚", shortcuts: [
      { keys: "Ctrl + Shift + S", action: "Open Shipping Center" },
      { keys: "Ctrl + Shift + P", action: "Open payments" },
      { keys: "Ctrl + Shift + M", action: "Open messages" },
    ]},
  ];

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent, #00bcd4)", marginBottom: "0.5rem" }}>Reference</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>Keyboard Shortcuts</h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>Navigate faster with keyboard shortcuts. Works on desktop browsers.</p>
      </div>

      {sections.map(section => (
        <div key={section.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.1rem" }}>{section.icon}</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{section.title}</span>
          </div>
          {section.shortcuts.map(s => (
            <div key={s.keys} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-default)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{s.action}</span>
              <kbd style={{ fontSize: "0.72rem", fontWeight: 600, fontFamily: "monospace", padding: "0.2rem 0.55rem", borderRadius: "6px", background: "var(--bg-card-hover)", border: "1px solid var(--border-default)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
        Not all shortcuts may be active yet — we&apos;re adding more with every update.
      </div>
    </div>
  );
}
