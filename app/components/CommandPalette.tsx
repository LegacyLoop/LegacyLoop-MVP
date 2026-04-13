"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Command {
  id: string;
  label: string;
  category: "Pages" | "Items" | "Actions" | "Help";
  icon: string;
  href?: string;
  action?: () => void;
}

const COMMANDS: Command[] = [
  // Pages
  { id: "dashboard", label: "Dashboard", category: "Pages", icon: "📊", href: "/dashboard" },
  { id: "messages", label: "Messages", category: "Pages", icon: "💬", href: "/messages" },
  { id: "analytics", label: "Analytics", category: "Pages", icon: "📈", href: "/analytics" },
  { id: "bots", label: "Bots", category: "Pages", icon: "🤖", href: "/bots" },
  { id: "credits", label: "Credits & Services", category: "Pages", icon: "💎", href: "/credits" },
  { id: "payments", label: "Earnings & Payouts", category: "Pages", icon: "💰", href: "/payments" },
  { id: "billing", label: "Billing", category: "Pages", icon: "🧾", href: "/billing" },
  { id: "settings", label: "Settings", category: "Pages", icon: "⚙️", href: "/settings" },
  { id: "pricing", label: "Pricing", category: "Pages", icon: "💳", href: "/pricing" },
  { id: "help", label: "Help Center", category: "Pages", icon: "❓", href: "/help" },
  { id: "heroes", label: "Heroes Program", category: "Pages", icon: "🏅", href: "/heroes" },
  { id: "referral", label: "Referral Program", category: "Pages", icon: "🎁", href: "/referral" },
  { id: "store", label: "My Store", category: "Pages", icon: "🏪", href: "/store" },
  { id: "admin", label: "Admin Portal", category: "Pages", icon: "🔒", href: "/admin" },
  // Actions
  { id: "new-item", label: "New Item", category: "Actions", icon: "➕", href: "/items/new" },
  { id: "buy-credits", label: "Buy Credits", category: "Actions", icon: "💎", href: "/credits" },
  { id: "view-earnings", label: "View Earnings", category: "Actions", icon: "💰", href: "/payments" },
  { id: "estate-quote", label: "Get Estate Quote", category: "Actions", icon: "🏡", href: "/quote" },
  { id: "search", label: "Search Items", category: "Actions", icon: "🔍", href: "/search" },
  { id: "whats-new", label: "What's New", category: "Actions", icon: "✨", href: "/whats-new" },
  // Help
  { id: "help-listing", label: "How to List an Item", category: "Help", icon: "📖", href: "/help" },
  { id: "help-shipping", label: "Shipping Without a Printer", category: "Help", icon: "📦", href: "/help" },
  { id: "help-pricing", label: "Understanding AI Pricing", category: "Help", icon: "🧠", href: "/help" },
  { id: "help-credits", label: "How Credits Work", category: "Help", icon: "💎", href: "/help" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = query.trim()
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : COMMANDS.slice(0, 10);

  // Group by category
  const groups = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flatFiltered = Object.values(groups).flat();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const meta = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+K to toggle
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
        return;
      }

      // Escape to close
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }

      // Other shortcuts (only when palette is NOT open and not typing)
      if (!open && meta) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;

        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault();
            router.push("/items/new");
            break;
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            break;
          case "/":
            e.preventDefault();
            const helpBtn = document.querySelector<HTMLButtonElement>('[aria-label="Help"]');
            helpBtn?.click();
            break;
        }
      }
    },
    [open, router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function selectCommand(cmd: Command) {
    setOpen(false);
    if (cmd.action) {
      cmd.action();
    } else if (cmd.href) {
      router.push(cmd.href);
    }
  }

  function handlePaletteKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatFiltered[selectedIndex]) {
        selectCommand(flatFiltered[selectedIndex]);
      }
    }
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="glass-backdrop"
        onClick={() => setOpen(false)}
        style={{
          zIndex: 200,
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Palette */}
      <div
        className="glass-modal"
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(560px, 90vw)",
          zIndex: 201,
          overflow: "hidden",
          animation: "slideDown 0.15s ease",
        }}
        onKeyDown={handlePaletteKeyDown}
      >
        {/* Search input */}
        <div style={{
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, help..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          />
          <kbd style={{
            padding: "0.15rem 0.4rem",
            borderRadius: "0.3rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border-default)",
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            fontWeight: 600,
          }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "360px", overflowY: "auto", padding: "0.5rem" }}>
          {flatFiltered.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(groups).map(([category, cmds]) => (
              <div key={category}>
                <div style={{
                  padding: "0.5rem 0.75rem 0.25rem",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}>
                  {category}
                </div>
                {cmds.map((cmd) => {
                  flatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  const idx = flatIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => selectCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "0.5rem",
                        background: isSelected ? "rgba(0,188,212,0.1)" : "transparent",
                        border: isSelected ? "1px solid rgba(0,188,212,0.2)" : "1px solid transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.1s ease",
                        color: "var(--text-primary)",
                        fontSize: "0.88rem",
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      <span style={{ fontSize: "1rem", width: "24px", textAlign: "center" }}>{cmd.icon}</span>
                      <span style={{ flex: 1 }}>{cmd.label}</span>
                      {isSelected && (
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>↵</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "0.5rem 1rem",
          borderTop: "1px solid var(--border-default)",
          display: "flex",
          gap: "1rem",
          fontSize: "0.65rem",
          color: "var(--text-muted)",
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
