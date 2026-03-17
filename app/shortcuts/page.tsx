export default function ShortcutsPage() {
  const shortcuts = [
    { keys: "Ctrl + K", action: "Quick search" },
    { keys: "Ctrl + N", action: "New item" },
    { keys: "Ctrl + D", action: "Go to dashboard" },
    { keys: "Ctrl + /", action: "Toggle help widget" },
    { keys: "?", action: "Show keyboard shortcuts" },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <div className="section-title">Reference</div>
      <h1 className="h2 mt-2">Keyboard Shortcuts</h1>
      <p className="muted mt-3">Navigate faster with keyboard shortcuts.</p>

      <div className="card p-6 mt-8">
        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.keys} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-default)" }}>
              <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{s.action}</span>
              <kbd style={{
                fontSize: "0.75rem", fontWeight: 600, fontFamily: "monospace",
                padding: "0.25rem 0.6rem", borderRadius: "0.4rem",
                background: "var(--bg-card-hover)", border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
