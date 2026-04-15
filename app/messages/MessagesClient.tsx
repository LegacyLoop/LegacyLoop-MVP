"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { safeJson } from "@/lib/utils/json";
import ActiveOffersWidget from "@/app/components/ActiveOffersWidget";
import AiMessageToolbar from "@/app/components/messaging/AiMessageToolbar";
import AiSuggestionsPanel from "@/app/components/messaging/AiSuggestionsPanel";

type Message = {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type Conversation = {
  id: string;
  itemId: string;
  buyerName: string;
  buyerEmail: string | null;
  platform: string;
  botScore: number;
  createdAt: string;
  messages: Message[];
  item: {
    id: string;
    title: string | null;
    aiResult: { rawJson: string } | null;
    photos: { filePath: string }[];
  };
};

type NewConvForm = {
  itemId: string;
  buyerName: string;
  buyerEmail: string;
  firstMessage: string;
};

type Props = {
  initialConversations: Conversation[];
  itemsForForm: { id: string; displayTitle: string }[];
};

type FilterMode = "all" | "unread" | "bot" | "byItem" | "hot" | "needs_reply" | "agent" | "closed";

function getBotStyle(score: number) {
  if (score >= 80) return { label: "Likely Human", color: "var(--success-text)", bg: "var(--success-bg)", border: "var(--success-border)" };
  if (score >= 50) return { label: "Unverified", color: "var(--warning-text)", bg: "var(--warning-bg)", border: "var(--warning-border)" };
  return { label: "Possible Bot", color: "var(--error-text)", bg: "var(--error-bg)", border: "var(--error-border)" };
}

/** Returns a small colored dot for bot score indication */
function BotDot({ score }: { score: number }) {
  let dotColor = "var(--success-text)"; // green = human
  if (score < 80 && score >= 50) dotColor = "var(--warning-text)"; // yellow = suspicious
  if (score < 50) dotColor = "var(--error-text)"; // red = likely bot
  return (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: dotColor,
        flexShrink: 0,
      }}
      title={
        score >= 80
          ? "Likely human"
          : score >= 50
            ? "Suspicious"
            : "Likely bot"
      }
    />
  );
}

function getItemTitle(conv: Conversation): string {
  const ai = safeJson(conv.item.aiResult?.rawJson);
  return conv.item.title || ai?.item_name || `Item #${conv.itemId.slice(0, 6)}`;
}

function getLastMessage(conv: Conversation): string {
  if (conv.messages.length === 0) return "No messages yet";
  const last = conv.messages[conv.messages.length - 1];
  return last.content;
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return mins <= 1 ? "just now" : `${mins}m ago`;
  }
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TEMPLATES = [
  { label: "Still Available", text: "Hi! Yes, this item is still available. Let me know when you'd like to come by or arrange shipping!" },
  { label: "Price is Firm", text: "Hi! Thank you for your interest. The price is firm at the listed amount. Let me know if you'd like to proceed!" },
  { label: "Local Pickup", text: "Hi! This is available for local pickup. I'm flexible on timing -- when works best for you?" },
  { label: "Shipping Info", text: "Hi! I can ship this item. Once I have your ZIP code I can calculate the exact rate. Interested?" },
  { label: "Ask a Question", text: "Thanks for reaching out! Do you have any questions about the item that I can answer?" },
  { label: "Bulk Discount", text: "Great news -- if you're interested in purchasing multiple items, I can offer a package deal! Let me know what else catches your eye and I'll put together a bundle price." },
  { label: "Payment Methods", text: "I accept payment through LegacyLoop's secure checkout, as well as cash for local pickup. Which works best for you?" },
  { label: "Pickup Windows", text: "I'm generally available for pickup Thursday through Saturday, 9am-4pm. Which day and time works best for you?" },
  { label: "Estate Closing", text: "This is a one-time estate sale, so quantities are limited and items are first-come, first-served. Would you like to come view it in person or proceed with a purchase?" },
];

export default function MessagesClient({ initialConversations, itemsForForm }: Props) {
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get("itemId") || "";
  const [convs, setConvs] = useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(convs[0]?.id ?? null);
  const [composing, setComposing] = useState(false);

  // CMD-MOBILE-8D: mobile tab-switching state.
  // On mobile (≤768px): show sidebar OR thread, not both.
  // selectedId controls which "tab" is active.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [reply, setReply] = useState("");
  const [busyReply, setBusyReply] = useState(false);
  const [zone2Open, setZone2Open] = useState(true);
  const [newConvBusy, setNewConvBusy] = useState(false);
  const [newConvErr, setNewConvErr] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [newConv, setNewConv] = useState<NewConvForm>({
    itemId: itemsForForm[0]?.id ?? "",
    buyerName: "",
    buyerEmail: "",
    firstMessage: "",
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── AI Agent State ──────────────────────────────────────
  const [agentSuggestion, setAgentSuggestion] = useState<any>(null);

  // ── AI Agent Bridge: Fix 1 — Conversation selection event ──
  useEffect(() => {
    if (selectedId) {
      window.dispatchEvent(new CustomEvent("conversation-selected", { detail: { conversationId: selectedId } }));
    }
  }, [selectedId]);

  // ── AI Agent Bridge: Fix 2 — Listen for agent-fill-message ──
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message;
      if (msg) setReply(msg);
    };
    window.addEventListener("agent-fill-message", handler);
    return () => window.removeEventListener("agent-fill-message", handler);
  }, []);

  // ── AI Agent Bridge: Fix 3 — Dispatch conversation counts ──
  useEffect(() => {
    const hotCount = convs.filter((c) => c.botScore >= 80).length;
    const needsReplyCount = convs.filter((c) => {
      const msgs = c.messages || [];
      return msgs.length > 0 && msgs[msgs.length - 1]?.sender === "buyer";
    }).length;
    window.dispatchEvent(new CustomEvent("conversation-counts-updated", {
      detail: { hot: hotCount, needsReply: needsReplyCount, total: convs.length },
    }));
  }, [convs]);

  // ── Search & Filter State ─────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>(initialItemId ? "byItem" : "all");
  const [selectedItemFilter, setSelectedItemFilter] = useState<string>(initialItemId);
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(new Set());

  // Listen for AI Agent sidebar filter changes
  useEffect(() => {
    const handler = (e: Event) => {
      const filter = (e as CustomEvent).detail?.filter;
      if (filter) setFilterMode(filter as FilterMode);
    };
    window.addEventListener("inbox-filter-change", handler);
    return () => window.removeEventListener("inbox-filter-change", handler);
  }, []);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Live Polling — fetch new messages every 30s ──────
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return;
        const fresh: Conversation[] = await res.json();
        setConvs((prev) => {
          // Merge: keep new data but preserve local-only state (starred, etc.)
          const prevMap = new Map(prev.map((c) => [c.id, c]));
          const merged = fresh.map((fc) => {
            const existing = prevMap.get(fc.id);
            // If message count grew, use fresh data (new messages arrived)
            if (!existing || fc.messages.length > existing.messages.length) return fc;
            return existing;
          });
          // Also include any brand-new conversations from the server
          const freshIds = new Set(fresh.map((c) => c.id));
          const kept = prev.filter((c) => !freshIds.has(c.id)); // should be empty normally
          return [...merged, ...kept];
        });
      } catch {
        // Polling failure is non-critical — skip silently
      }
    };
    const interval = setInterval(poll, 10_000);
    return () => clearInterval(interval);
  }, []);

  const selected = convs.find((c) => c.id === selectedId) ?? null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length]);

  // Close item dropdown when clicking outside
  useEffect(() => {
    if (!itemDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-item-dropdown]")) {
        setItemDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [itemDropdownOpen]);

  // ── Computed Counts ───────────────────────────────────
  const unreadCount = (conv: Conversation) =>
    conv.messages.filter((m) => m.sender === "buyer" && !m.isRead).length;

  const totalUnread = useMemo(
    () => convs.reduce((sum, c) => sum + c.messages.filter((m) => m.sender === "buyer" && !m.isRead).length, 0),
    [convs]
  );
  const totalBotFlagged = useMemo(
    () => convs.filter((c) => c.botScore < 50).length,
    [convs]
  );

  // ── Filtering Logic ───────────────────────────────────
  const filteredConvs = useMemo(() => {
    let results = convs;

    // Apply filter mode
    if (filterMode === "unread") {
      results = results.filter((c) => unreadCount(c) > 0);
    } else if (filterMode === "bot") {
      results = results.filter((c) => c.botScore < 50);
    } else if (filterMode === "byItem" && selectedItemFilter) {
      results = results.filter((c) => c.itemId === selectedItemFilter);
    } else if (filterMode === "hot") {
      results = results.filter((c) => c.botScore >= 80);
    } else if (filterMode === "needs_reply") {
      results = results.filter((c) => c.messages.length > 0 && c.messages[c.messages.length - 1].sender === "buyer");
    } else if (filterMode === "agent") {
      results = []; // No agent-handled conversations yet
    } else if (filterMode === "closed") {
      results = []; // No closed status yet
    }

    // Apply search query (debounced)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      results = results.filter((c) => {
        const itemTitle = getItemTitle(c).toLowerCase();
        const buyerName = c.buyerName.toLowerCase();
        const buyerEmail = (c.buyerEmail || "").toLowerCase();
        const messagesText = c.messages.map((m) => m.content.toLowerCase()).join(" ");
        return (
          buyerName.includes(q) ||
          buyerEmail.includes(q) ||
          itemTitle.includes(q) ||
          messagesText.includes(q)
        );
      });
    }

    return results;
  }, [convs, filterMode, selectedItemFilter, debouncedQuery]);

  // ── Unique items for "By Item" dropdown ───────────────
  const itemsInConversations = useMemo(() => {
    const seen = new Map<string, string>();
    convs.forEach((c) => {
      if (!seen.has(c.itemId)) {
        seen.set(c.itemId, getItemTitle(c));
      }
    });
    return Array.from(seen.entries()).map(([id, title]) => ({ id, title }));
  }, [convs]);

  const handleSelectConv = async (conv: Conversation) => {
    setSelectedId(conv.id);
    if (unreadCount(conv) > 0) {
      await fetch(`/api/conversations/${conv.id}/messages`, { method: "PATCH" });
      setConvs((prev) =>
        prev.map((c) =>
          c.id === conv.id
            ? { ...c, messages: c.messages.map((m) => ({ ...m, isRead: true })) }
            : c
        )
      );
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    setBusyReply(true);
    const res = await fetch(`/api/conversations/${selected.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply.trim(), sender: "seller" }),
    });
    if (res.ok) {
      const msg = await res.json();
      setConvs((prev) =>
        prev.map((c) => c.id === selected.id ? { ...c, messages: [...c.messages, msg] } : c)
      );
      setReply("");
    }
    setBusyReply(false);
  };

  const handleNewConv = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewConvBusy(true);
    setNewConvErr("");

    // Validate required fields
    if (!newConv.buyerName.trim()) { setNewConvErr("Buyer name is required."); setNewConvBusy(false); return; }
    if (!newConv.firstMessage.trim()) { setNewConvErr("Please enter the buyer's message."); setNewConvBusy(false); return; }
    if (!newConv.itemId) { setNewConvErr("Please select an item."); setNewConvBusy(false); return; }

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: newConv.itemId,
        buyerName: newConv.buyerName,
        buyerEmail: newConv.buyerEmail || null,
        firstMessage: newConv.firstMessage,
      }),
    });
    if (!res.ok) { setNewConvErr(await res.text()); setNewConvBusy(false); return; }
    const { conversationId } = await res.json();
    setComposing(false);
    setNewConv({ itemId: itemsForForm[0]?.id ?? "", buyerName: "", buyerEmail: "", firstMessage: "" });
    // Refresh conversations
    const fresh = await fetch("/api/conversations").then((r) => r.json());
    setConvs(fresh);
    setSelectedId(conversationId);
    setNewConvBusy(false);
  };

  const useTemplate = (text: string) => {
    setReply(text);
    setCopiedTemplate(text.slice(0, 15));
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%", overflow: "hidden" }}>
      {/* ─── SEARCH & FILTER BAR ──────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          padding: "1rem 1.25rem",
          background: "var(--bg-card-solid)",
          border: "1px solid var(--border-default)",
          borderRadius: "1rem",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        {/* Search input */}
        <div style={{ position: "relative" }}>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              width: "16px",
              height: "16px",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: "2.25rem",
              width: "100%",
              height: "40px",
              borderRadius: "0.75rem",
              background: "var(--ghost-bg)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: "0.88rem",
              padding: "0 0.75rem 0 2.25rem",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "1rem",
                lineHeight: 1,
                padding: "0.2rem",
              }}
              title="Clear search"
            >
              x
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* All Messages */}
          <button
            onClick={() => { setFilterMode("all"); setSelectedItemFilter(""); window.dispatchEvent(new CustomEvent("inbox-filter-reset", { detail: { filter: "all" } })); }}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: filterMode === "all" ? "var(--accent)" : "var(--bg-card-hover)",
              color: filterMode === "all" ? "#fff" : "var(--text-muted)",
              borderColor: filterMode === "all" ? "var(--accent)" : "transparent",
            }}
          >
            All Messages
          </button>

          {/* Unread */}
          <button
            onClick={() => { setFilterMode("unread"); setSelectedItemFilter(""); }}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: filterMode === "unread" ? "var(--accent)" : "var(--bg-card-hover)",
              color: filterMode === "unread" ? "#fff" : "var(--text-muted)",
              borderColor: filterMode === "unread" ? "var(--accent)" : "transparent",
            }}
          >
            Unread
            {totalUnread > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9999px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "0 0.3rem",
                  background: filterMode === "unread" ? "var(--bg-card-hover)" : "var(--accent)",
                  color: "#fff",
                }}
              >
                {totalUnread}
              </span>
            )}
          </button>

          {/* Bot Flagged */}
          <button
            onClick={() => { setFilterMode("bot"); setSelectedItemFilter(""); }}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "1px solid",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: filterMode === "bot" ? "var(--accent)" : "var(--bg-card-hover)",
              color: filterMode === "bot" ? "#fff" : "var(--text-muted)",
              borderColor: filterMode === "bot" ? "var(--accent)" : "transparent",
            }}
          >
            Bot Flagged
            {totalBotFlagged > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "9999px",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "0 0.3rem",
                  background: filterMode === "bot" ? "var(--bg-card-hover)" : "var(--error-text)",
                  color: "#fff",
                }}
              >
                {totalBotFlagged}
              </span>
            )}
          </button>

          {/* By Item (dropdown) */}
          <div style={{ position: "relative" }} data-item-dropdown>
            <button
              onClick={() => {
                if (filterMode === "byItem" && !itemDropdownOpen) {
                  setItemDropdownOpen(true);
                } else if (filterMode !== "byItem") {
                  setFilterMode("byItem");
                  setItemDropdownOpen(true);
                } else {
                  setItemDropdownOpen(!itemDropdownOpen);
                }
              }}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                background: filterMode === "byItem" ? "var(--accent)" : "var(--bg-card-hover)",
                color: filterMode === "byItem" ? "#fff" : "var(--text-muted)",
                borderColor: filterMode === "byItem" ? "var(--accent)" : "transparent",
              }}
            >
              {filterMode === "byItem" && selectedItemFilter
                ? `Item: ${itemsInConversations.find((i) => i.id === selectedItemFilter)?.title?.slice(0, 20) || "..."}`
                : "By Item"}
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{
                  width: "12px",
                  height: "12px",
                  transform: itemDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {itemDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.35rem)",
                  left: 0,
                  minWidth: "220px",
                  maxHeight: "240px",
                  overflowY: "auto",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  zIndex: 50,
                  padding: "0.35rem",
                }}
              >
                {itemsInConversations.length === 0 ? (
                  <div style={{ padding: "0.75rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    No items with conversations
                  </div>
                ) : (
                  itemsInConversations.map((item) => {
                    const count = convs.filter((c) => c.itemId === item.id).length;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedItemFilter(item.id);
                          setFilterMode("byItem");
                          setItemDropdownOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                          width: "100%",
                          padding: "0.5rem 0.65rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.78rem",
                          fontWeight: selectedItemFilter === item.id ? 700 : 500,
                          background: selectedItemFilter === item.id ? "var(--bg-card-hover)" : "transparent",
                          color: selectedItemFilter === item.id ? "var(--accent)" : "var(--text-primary)",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            padding: "0.1rem 0.4rem",
                            borderRadius: "9999px",
                            background: "var(--bg-card-hover)",
                            color: "var(--text-muted)",
                            flexShrink: 0,
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Search results count when filtering */}
          {(debouncedQuery || filterMode !== "all") && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginLeft: "auto",
              }}
            >
              {filteredConvs.length} of {convs.length} conversations
            </span>
          )}
        </div>
      </div>

      {/* ─── MAIN LAYOUT (sidebar + thread + right panel) ── */}
      <div style={{ display: "flex", gap: 0, flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* ─── LEFT SIDEBAR ───────────────────────────────────── */}
        {/* CMD-MOBILE-8D: On mobile, sidebar is full-width when no thread
            selected, hidden when a thread is open or composing */}
        <div
          style={{
            width: isMobile ? "100%" : "300px",
            borderRight: isMobile ? "none" : "1px solid var(--border-default)",
            flexShrink: 0,
            display: isMobile && (selectedId !== null || composing) ? "none" : "flex",
            flexDirection: "column" as const,
            gap: "0.5rem",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Active offers widget */}
          <ActiveOffersWidget compact />

          {/* Conversation list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1, minHeight: 0, overflowY: "auto" }}>
            {filteredConvs.length === 0 ? (
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  padding: "1.5rem 0.75rem",
                  textAlign: "center",
                }}
              >
                {debouncedQuery
                  ? `No conversations matching "${debouncedQuery}"`
                  : filterMode === "unread"
                    ? "No unread conversations"
                    : filterMode === "bot"
                      ? "No bot-flagged conversations"
                      : filterMode === "byItem" && selectedItemFilter
                        ? "No conversations for this item"
                        : "No conversations yet."}
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const title = getItemTitle(conv);
                const unread = unreadCount(conv);
                const isSelected = conv.id === selectedId;
                const lastMsg = getLastMessage(conv);
                const lastMsgTime = conv.messages.length > 0
                  ? conv.messages[conv.messages.length - 1].createdAt
                  : conv.createdAt;
                const photo = conv.item.photos[0]?.filePath;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv)}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      minHeight: "56px",
                      borderRadius: "0.875rem",
                      border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border-default)"}`,
                      borderLeft: isSelected ? "3px solid var(--accent)" : "1.5px solid var(--border-default)",
                      background: isSelected ? "var(--accent-dim)" : "var(--bg-card-solid)",
                      cursor: "pointer",
                      display: "flex",
                      gap: "0.65rem",
                      alignItems: "flex-start",
                      position: "relative",
                      transition: "border-color 0.15s ease, background 0.15s ease",
                    }}
                  >
                    {/* Item thumbnail */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "var(--bg-card-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>
                          {/* camera icon placeholder */}
                          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: "18px", height: "18px" }}>
                            <path fillRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                      {/* Top row: buyer name + timestamp */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                        <div
                          style={{
                            fontWeight: unread > 0 ? 700 : 600,
                            fontSize: "0.85rem",
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {conv.buyerName}
                        </div>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--text-muted)",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatTimestamp(lastMsgTime)}
                        </span>
                      </div>

                      {/* Item name */}
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-secondary)",
                          marginTop: "0.1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {title}
                      </div>

                      {/* Last message preview */}
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                          marginTop: "0.25rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: unread > 0 ? 600 : 400,
                        }}
                      >
                        {lastMsg.length > 60 ? lastMsg.slice(0, 60) + "..." : lastMsg}
                      </div>

                      {/* Bottom row: bot dot + indicators */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginTop: "0.35rem",
                        }}
                      >
                        <BotDot score={conv.botScore} />
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          {conv.botScore >= 80
                            ? "Human"
                            : conv.botScore >= 50
                              ? "Suspicious"
                              : "Bot risk"}
                        </span>

                        {/* Offer Active badge */}
                        {conv.messages.some((m) => m.content.startsWith("OFFER ") || m.content.startsWith("COUNTER OFFER:")) && (
                          <span style={{
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: "var(--accent-dim)",
                            color: "var(--accent)",
                          }}>
                            Offer
                          </span>
                        )}

                        {/* Unread teal dot */}
                        {unread > 0 && (
                          <span
                            style={{
                              marginLeft: "auto",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "var(--accent)",
                              }}
                            />
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent)" }}>
                              {unread}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Star button */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setStarred(prev => {
                          const next = new Set(prev);
                          if (next.has(conv.id)) next.delete(conv.id);
                          else next.add(conv.id);
                          return next;
                        });
                      }}
                      style={{
                        cursor: "pointer",
                        padding: "2px",
                        fontSize: 14,
                        color: starred.has(conv.id) ? "#fbbf24" : "var(--text-muted)",
                        opacity: starred.has(conv.id) ? 1 : 0.3,
                        transition: "all 0.15s",
                        flexShrink: 0,
                        alignSelf: "flex-start",
                        marginTop: "0.2rem",
                      }}
                      title={starred.has(conv.id) ? "Remove star" : "Star this buyer"}
                    >
                      ★
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* New conversation button */}
          <button
            onClick={() => setComposing(true)}
            style={{ padding: "0.75rem", fontSize: "0.85rem", minHeight: "44px", width: "100%", background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", color: "#fff", fontWeight: 700, border: "none", borderRadius: "0.75rem", cursor: "pointer", boxShadow: "0 4px 12px var(--accent-glow)" }}
          >
            + New Conversation
          </button>
        </div>

        {/* ─── MAIN THREAD AREA ──────────────────────────────── */}
        {/* CMD-MOBILE-8D: Hidden when no thread selected on mobile */}
        <div style={{ flex: 1, display: isMobile && selectedId === null && !composing ? "none" : "flex", flexDirection: "column" as const, minWidth: 0, minHeight: 0, overflow: "hidden" }}>
          {composing ? (
            <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.5rem" }}>
              {/* CMD-MOBILE-8D: Back button in compose mode on mobile */}
              {isMobile && (
                <button
                  onClick={() => { setComposing(false); setSelectedId(null); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--accent)", display: "flex", alignItems: "center",
                    gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600,
                    padding: "0.3rem 0", marginBottom: "0.5rem", minHeight: "44px",
                  }}
                  aria-label="Back to conversations"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  ← Conversations
                </button>
              )}
              <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>
                New Conversation
              </div>
              <form onSubmit={handleNewConv} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Item</label>
                  <select
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.75rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: "0.88rem", outline: "none" }}
                    value={newConv.itemId}
                    onChange={(e) => setNewConv({ ...newConv, itemId: e.target.value })}
                  >
                    {itemsForForm.map((i) => (
                      <option key={i.id} value={i.id}>{i.displayTitle}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Buyer name / username</label>
                    <input
                      style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.75rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: "0.88rem", outline: "none" }}
                      value={newConv.buyerName}
                      onChange={(e) => setNewConv({ ...newConv, buyerName: e.target.value })}
                      placeholder="@john_smith or John S."
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Buyer email (optional)</label>
                    <input
                      style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.75rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: "0.88rem", outline: "none" }}
                      type="email"
                      value={newConv.buyerEmail}
                      onChange={(e) => setNewConv({ ...newConv, buyerEmail: e.target.value })}
                      placeholder="buyer@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Paste buyer&apos;s message</label>
                  <textarea
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.75rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: "0.88rem", outline: "none", minHeight: "100px", resize: "vertical" as const }}
                    rows={4}
                    value={newConv.firstMessage}
                    onChange={(e) => setNewConv({ ...newConv, firstMessage: e.target.value })}
                    placeholder="Paste the message you received from the buyer here..."
                    required
                  />
                </div>
                {newConvErr && (
                  <div style={{ padding: "0.5rem 0.75rem", background: "var(--error-bg)", color: "var(--error-text)", borderRadius: "0.5rem", fontSize: "0.82rem" }}>
                    {newConvErr}
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" disabled={newConvBusy} style={{ padding: "0.625rem 1.25rem", minHeight: "44px", background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", color: "#fff", fontWeight: 700, fontSize: "0.85rem", border: "none", borderRadius: "0.75rem", cursor: newConvBusy ? "wait" : "pointer", opacity: newConvBusy ? 0.6 : 1 }}>
                    {newConvBusy ? "Analyzing..." : "Analyze & Save"}
                  </button>
                  <button type="button" onClick={() => setComposing(false)} style={{ padding: "0.625rem 1.25rem", minHeight: "44px", background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)", fontSize: "0.85rem", borderRadius: "0.75rem", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selected ? (
            <>
              {/* Offer panel for this item (if any active offers) */}
              {selected.messages.some((m) => m.content.startsWith("OFFER ") || m.content.startsWith("COUNTER OFFER:")) && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <ActiveOffersWidget itemId={selected.itemId} />
                </div>
              )}

              {/* ═══ ZONE 0: Buyer Header (fixed) ═══ */}
              <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: "1px solid var(--border-default)", background: "var(--bg-card)" }}>
                {/* CMD-MOBILE-8D: Back button on mobile */}
                {isMobile && (
                  <button
                    onClick={() => setSelectedId(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      padding: "0.3rem 0",
                      marginBottom: "0.4rem",
                      minHeight: "44px",
                    }}
                    aria-label="Back to conversations"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    ← Conversations
                  </button>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{selected.buyerName}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {selected.platform !== "direct" && `via ${selected.platform} \u00b7 `}
                      {selected.buyerEmail && `${selected.buyerEmail} \u00b7 `}
                      {new Date(selected.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {(() => {
                    const b = getBotStyle(selected.botScore);
                    return (
                      <div style={{ padding: "4px 12px", borderRadius: 20, background: b.bg, color: b.color, border: `1.5px solid ${b.border}`, fontWeight: 700, fontSize: 11 }}>
                        {b.label} \u00b7 {selected.botScore}/100
                      </div>
                    );
                  })()}
                  {/* Item context (compact) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                    {selected.item.photos[0] && (
                      <img src={selected.item.photos[0].filePath} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                    )}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selected.item.title || "Item"}
                      </div>
                      <a href={`/items/${selected.item.id}`} style={{ fontSize: 10, color: "var(--accent)", textDecoration: "none" }}>View item →</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ ZONE 1: Message Thread (scrollable) ═══ */}
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "20px 20px 8px" }}>
                {selected.messages.map((msg, idx) => {
                  const isSeller = msg.sender === "seller";
                  const isSystem = msg.content.startsWith("OFFER ") || msg.content.startsWith("COUNTER OFFER:") || msg.content.startsWith("OFFER ACCEPTED") || msg.content.startsWith("OFFER WITHDRAWN");
                  const prevMsg = idx > 0 ? selected.messages[idx - 1] : null;
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                  return (
                    <div key={msg.id}>
                      {/* Date separator */}
                      {showDate && (
                        <div style={{ textAlign: "center", margin: "16px 0", position: "relative" }}>
                          <div style={{ height: 1, background: "var(--ghost-bg)", position: "absolute", left: 0, right: 0, top: "50%" }} />
                          <span style={{ position: "relative", zIndex: 1, background: "var(--bg-primary)", padding: "0 12px", fontSize: 10, color: "var(--text-muted)" }}>
                            {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      )}

                      {isSystem ? (
                        /* System message (centered) */
                        <div style={{ textAlign: "center", margin: "8px 0" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", padding: "4px 12px" }}>{msg.content}</span>
                        </div>
                      ) : (
                        /* Chat bubble */
                        <div style={{ display: "flex", flexDirection: "column", alignItems: isSeller ? "flex-end" : "flex-start", marginBottom: 12 }}>
                          <div style={{
                            maxWidth: isMobile ? "85%" : "72%",
                            padding: "10px 14px",
                            fontSize: 14,
                            lineHeight: 1.5,
                            wordBreak: "break-word" as const,
                            borderRadius: isSeller ? "1.25rem 1.25rem 0.25rem 1.25rem" : "1.25rem 1.25rem 1.25rem 0.25rem",
                            background: isSeller ? "linear-gradient(135deg, var(--accent), var(--accent-deep))" : "var(--ghost-bg)",
                            color: isSeller ? "#fff" : "var(--text-primary)",
                            fontWeight: isSeller ? 500 : 400,
                            border: isSeller ? "none" : "1px solid var(--border-default)",
                            boxShadow: isSeller ? "0 2px 8px var(--accent-glow)" : "none",
                          }}>
                            {msg.content}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4, ...(isSeller ? { paddingRight: 4 } : { paddingLeft: 4 }) }}>
                            {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            {msg.sender === "buyer" && !msg.isRead && (
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* ═══ ZONE 2: AI Tools + Templates (collapsible on mobile) ═══ */}
              <div style={{ flexShrink: 0, borderTop: "1px solid var(--border-default)", background: "var(--bg-secondary)", zIndex: 5 }}>
                {/* Toggle pill — visible on mobile only */}
                {isMobile && (
                  <button
                    onClick={() => setZone2Open(o => !o)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 16px", background: "transparent", border: "none",
                      color: "var(--accent)", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", minHeight: 36,
                    }}
                    aria-label={zone2Open ? "Collapse AI tools" : "Expand AI tools"}
                  >
                    <span>{"\u26A1"} AI Tools</span>
                    <span style={{ fontSize: 10, transition: "transform 0.2s ease", transform: zone2Open ? "rotate(180deg)" : "rotate(0deg)" }}>{"\u25BC"}</span>
                  </button>
                )}
                {/* Expandable content — always visible on desktop, toggled on mobile */}
                {(!isMobile || zone2Open) && (
                  <div style={{ maxHeight: 240, overflowY: "auto", padding: "8px 16px" }}>
                    {/* Reply templates */}
                    <div style={{ display: "flex", flexWrap: "nowrap", gap: 8, marginBottom: 6, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4, scrollbarWidth: "none" as any }}>
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.label}
                          onClick={() => useTemplate(t.text)}
                          style={{ padding: "6px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 500, minHeight: 32, whiteSpace: "nowrap", flexShrink: 0, border: "1px solid var(--border-default)", background: copiedTemplate === t.text.slice(0, 15) ? "var(--accent-dim)" : "transparent", color: copiedTemplate === t.text.slice(0, 15) ? "var(--accent)" : "var(--text-muted)", cursor: "pointer", transition: "all 0.15s ease" }}
                        >
                          {copiedTemplate === t.text.slice(0, 15) ? "✓" : t.label}
                        </button>
                      ))}
                    </div>
                    {/* AI Agent Toolbar + Suggestions */}
                    {selectedId && (
                      <div>
                        <AiMessageToolbar conversationId={selectedId} onResult={setAgentSuggestion} userDraft={reply} />
                        {agentSuggestion && (
                          <AiSuggestionsPanel data={agentSuggestion} onUseMessage={(msg) => { setReply(msg); setAgentSuggestion(null); }} onDismiss={() => setAgentSuggestion(null)} />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ═══ ZONE 3: Reply Input (always visible) ═══ */}
              <div style={{ flexShrink: 0, borderTop: "1px solid var(--border-default)", padding: "10px 16px", paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))", background: "var(--ghost-bg)" }}>
                <form onSubmit={handleReply} style={{ display: "flex", gap: 8 }}>
                  <textarea
                    style={{ flex: 1, resize: "none", padding: "10px 12px", fontSize: 14, background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 10, color: "var(--text-primary)", outline: "none", minHeight: 44, maxHeight: 100 }}
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(e as any); } }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-dim)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <button type="submit" disabled={busyReply || !reply.trim()} style={{ alignSelf: "flex-end", padding: "10px 20px", background: (!reply.trim() || busyReply) ? "var(--accent-glow)" : "linear-gradient(135deg, var(--accent), var(--accent-deep))", color: "#fff", fontWeight: 700, fontSize: 13, borderRadius: "0.75rem", border: "none", cursor: (!reply.trim() || busyReply) ? "not-allowed" : "pointer", minHeight: 44 }}>
                    {busyReply ? "..." : "Send"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-card-solid)", borderRadius: "1.25rem", padding: "2.5rem 1.5rem", textAlign: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "48px", height: "48px", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
              </svg>
              <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-primary)" }}>
                Select a conversation
              </div>
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", marginBottom: "1rem", fontSize: "0.88rem" }}>Your AI agent will analyze it and provide real-time intelligence.</p>
              <button
                onClick={() => setComposing(true)}
                style={{ padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "linear-gradient(135deg, var(--accent), var(--accent-deep))", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 4px 12px var(--accent-glow)", minHeight: 44 }}
              >
                + New Conversation
              </button>
            </div>
          )}
        </div>

        {/* Right sidebar removed — item context now in buyer header, intelligence in InboxCommandCenter panel */}
      </div>
    </div>
  );
}
