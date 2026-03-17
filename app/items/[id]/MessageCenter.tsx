"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  sender: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type Conversation = {
  id: string;
  buyerName: string;
  buyerEmail: string | null;
  platform: string;
  botScore: number;
  createdAt: string;
  messages: Message[];
};

interface Props {
  itemId: string;
  itemTitle: string;
  conversations: Conversation[];
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘", ebay: "🛒", craigslist: "📋", offerup: "🏷️",
  nextdoor: "🏘️", instagram: "📸", etsy: "🧶", direct: "💬",
};

const QUICK_REPLIES = [
  "Yes, still available!",
  "Thanks for your interest. Can we schedule a pickup?",
  "I can do that price. When are you available?",
  "Sorry, item is no longer available.",
  "Would you like more photos?",
  "Best offer is $___. Let me know!",
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function botLabel(score: number) {
  if (score >= 80) return { label: "✓ Human", color: "#15803d", bg: "#dcfce7" };
  if (score >= 50) return { label: "? Uncertain", color: "#854d0e", bg: "#fef9c3" };
  return { label: "⚠️ Bot", color: "#dc2626", bg: "#fee2e2" };
}

export default function MessageCenter({ itemId, itemTitle, conversations: initial }: Props) {
  const router = useRouter();
  const [convs, setConvs] = useState<Conversation[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newBuyer, setNewBuyer] = useState("");
  const [newPlatform, setNewPlatform] = useState("direct");
  const [newMsg, setNewMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = convs.find((c) => c.id === activeId) ?? null;

  const totalUnread = convs.reduce((s, c) => s + c.messages.filter((m) => m.sender === "buyer" && !m.isRead).length, 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, convs]);

  async function sendReply() {
    if (!reply.trim() || !activeId) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "seller", content: reply }),
    });
    if (res.ok) {
      const data = await res.json();
      setConvs((prev) => prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, { id: data.id, sender: "seller", content: reply, isRead: true, createdAt: new Date().toISOString() }] }
          : c
      ));
      setReply("");
    }
    setSending(false);
  }

  async function markRead(convId: string) {
    await fetch(`/api/conversations/${convId}/messages`, { method: "PATCH" });
    setConvs((prev) => prev.map((c) =>
      c.id === convId
        ? { ...c, messages: c.messages.map((m) => m.sender === "buyer" ? { ...m, isRead: true } : m) }
        : c
    ));
  }

  async function createConversation() {
    if (!newBuyer.trim() || !newMsg.trim()) return;
    setCreating(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, buyerName: newBuyer, platform: newPlatform, firstMessage: newMsg }),
    });
    if (res.ok) {
      const data = await res.json();
      const newConv: Conversation = {
        id: data.conversationId,
        buyerName: newBuyer,
        buyerEmail: null,
        platform: newPlatform,
        botScore: data.botScore ?? 50,
        createdAt: new Date().toISOString(),
        messages: [{ id: "tmp", sender: "buyer", content: newMsg, isRead: false, createdAt: new Date().toISOString() }],
      };
      setConvs((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      setShowNewForm(false);
      setNewBuyer(""); setNewMsg(""); setNewPlatform("direct");
    }
    setCreating(false);
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e7e5e4", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
            📬 Message Center
            {totalUnread > 0 && (
              <span style={{ marginLeft: "0.6rem", padding: "0.1rem 0.55rem", borderRadius: "9999px", background: "#dc2626", color: "#fff", fontSize: "0.72rem", fontWeight: 800 }}>
                {totalUnread} unread
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
            {convs.length} conversation{convs.length !== 1 ? "s" : ""} for "{itemTitle}"
          </div>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          style={{ padding: "0.4rem 0.9rem", background: "#0f766e", color: "#fff", borderRadius: "0.6rem", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
        >
          + Log Message
        </button>
      </div>

      {/* New conversation form */}
      {showNewForm && (
        <div style={{ padding: "1rem 1.5rem", background: "#f0fdfa", borderBottom: "1px solid #99f6e4" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.6rem", color: "#134e4a" }}>Log a buyer message</div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input value={newBuyer} onChange={(e) => setNewBuyer(e.target.value)} placeholder="Buyer name"
              style={{ flex: "1 1 140px", padding: "0.4rem 0.7rem", border: "1px solid #99f6e4", borderRadius: "0.5rem", fontSize: "0.85rem" }} />
            <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}
              style={{ flex: "1 1 120px", padding: "0.4rem 0.7rem", border: "1px solid #99f6e4", borderRadius: "0.5rem", fontSize: "0.85rem" }}>
              {["direct","facebook","ebay","craigslist","offerup","nextdoor","instagram","etsy"].map(p => (
                <option key={p} value={p}>{PLATFORM_ICONS[p] ?? "💬"} {p}</option>
              ))}
            </select>
            <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Their message..."
              style={{ flex: "3 1 260px", padding: "0.4rem 0.7rem", border: "1px solid #99f6e4", borderRadius: "0.5rem", fontSize: "0.85rem" }} />
            <button onClick={createConversation} disabled={creating || !newBuyer.trim() || !newMsg.trim()}
              style={{ padding: "0.4rem 1rem", background: "#0f766e", color: "#fff", borderRadius: "0.5rem", border: "none", fontSize: "0.82rem", cursor: "pointer", opacity: creating ? 0.6 : 1 }}>
              {creating ? "..." : "Add"}
            </button>
            <button onClick={() => setShowNewForm(false)}
              style={{ padding: "0.4rem 0.7rem", background: "none", border: "1px solid #d6d3d1", borderRadius: "0.5rem", fontSize: "0.82rem", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {convs.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
          <div style={{ fontWeight: 600 }}>No messages yet</div>
          <div style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>When buyers contact you, their messages will appear here.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "360px" }}>
          {/* Left: Conversation list */}
          <div style={{ borderRight: "1px solid #e7e5e4", overflowY: "auto", maxHeight: "440px" }}>
            {convs.map((conv) => {
              const unread = conv.messages.filter((m) => m.sender === "buyer" && !m.isRead).length;
              const last = conv.messages[conv.messages.length - 1];
              const bot = botLabel(conv.botScore);
              const isActive = conv.id === activeId;

              return (
                <button
                  key={conv.id}
                  onClick={() => { setActiveId(conv.id); markRead(conv.id); }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.85rem 1rem",
                    borderBottom: "1px solid #f5f5f4",
                    background: isActive ? "#f0fdf4" : "transparent",
                    borderLeft: isActive ? "3px solid #0f766e" : "3px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {PLATFORM_ICONS[conv.platform] ?? "💬"} {conv.buyerName}
                    </div>
                    {unread > 0 && (
                      <span style={{ flexShrink: 0, padding: "0.1rem 0.45rem", borderRadius: "9999px", background: "#dc2626", color: "#fff", fontSize: "0.65rem", fontWeight: 800 }}>
                        {unread}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "9999px", background: bot.bg, color: bot.color }}>
                      {bot.label}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{timeAgo(conv.createdAt)}</span>
                  </div>
                  {last && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {last.sender === "seller" ? "You: " : ""}{last.content}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Message thread */}
          {activeConv ? (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "440px" }}>
              {/* Thread header */}
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f5f5f4", background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {PLATFORM_ICONS[activeConv.platform] ?? "💬"} {activeConv.buyerName}
                    {activeConv.buyerEmail && <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.8rem" }}> · {activeConv.buyerEmail}</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    via {activeConv.platform} · Bot score: {activeConv.botScore}/100
                    {activeConv.botScore < 50 && <span style={{ color: "#dc2626", fontWeight: 700 }}> — likely bot, be cautious</span>}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {activeConv.messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: m.sender === "seller" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "0.5rem 0.85rem",
                        borderRadius: m.sender === "seller" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                        background: m.sender === "seller" ? "#0f766e" : "var(--bg-secondary)",
                        color: m.sender === "seller" ? "#fff" : "var(--text-primary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div>{m.content}</div>
                      <div style={{ fontSize: "0.68rem", marginTop: "0.2rem", opacity: 0.7, textAlign: "right" }}>
                        {timeAgo(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Quick replies */}
              <div style={{ padding: "0.4rem 0.75rem", display: "flex", gap: "0.4rem", flexWrap: "wrap", borderTop: "1px solid #f5f5f4" }}>
                {QUICK_REPLIES.slice(0, 4).map((qr) => (
                  <button
                    key={qr}
                    onClick={() => setReply(qr)}
                    style={{
                      padding: "0.25rem 0.65rem",
                      borderRadius: "9999px",
                      border: "1px solid #d6d3d1",
                      background: "var(--bg-card-solid)",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {qr.length > 30 ? qr.slice(0, 28) + "…" : qr}
                  </button>
                ))}
              </div>

              {/* Reply box */}
              <div style={{ padding: "0.6rem 0.75rem", borderTop: "1px solid #e7e5e4", display: "flex", gap: "0.5rem" }}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type your reply… (Enter to send)"
                  rows={2}
                  style={{ flex: 1, padding: "0.5rem 0.75rem", border: "1px solid #d6d3d1", borderRadius: "0.75rem", fontSize: "0.875rem", resize: "none", outline: "none", fontFamily: "inherit" }}
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  style={{ padding: "0.5rem 1rem", background: "#0f766e", color: "#fff", borderRadius: "0.75rem", border: "none", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", alignSelf: "flex-end", opacity: sending || !reply.trim() ? 0.5 : 1 }}
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Select a conversation
            </div>
          )}
        </div>
      )}
    </div>
  );
}
