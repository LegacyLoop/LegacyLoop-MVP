"use client";

import { useState } from "react";

interface Props {
  itemId: string;
  itemTitle: string;
}

export default function ContactForm({ itemId, itemTitle }: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState(`Hi, I'm interested in "${itemTitle}". Is it still available?`);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, buyerName: name, firstMessage: message }),
    });
    setSent(true);
    setSending(false);
  }

  if (sent) {
    return (
      <div style={{ padding: "1.25rem", background: "var(--success-bg)", borderRadius: "1rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>✅</div>
        <div style={{ fontWeight: 700, color: "var(--success-text)" }}>Message sent!</div>
        <div style={{ fontSize: "0.85rem", color: "var(--success-text)", marginTop: "0.25rem" }}>The seller will reply to you soon.</div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-default)", borderRadius: "1rem", padding: "1.25rem" }}>
      <div style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--text-primary)" }}>💬 Contact Seller</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: "0.55rem 0.85rem", border: "1px solid var(--border-default)", borderRadius: "0.65rem", fontSize: "0.9rem", background: "var(--bg-card-solid)", color: "var(--text-primary)" }}
        />
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ padding: "0.55rem 0.85rem", border: "1px solid var(--border-default)", borderRadius: "0.65rem", fontSize: "0.9rem", resize: "vertical", background: "var(--bg-card-solid)", color: "var(--text-primary)" }}
        />
        <button
          onClick={send}
          disabled={sending || !name.trim() || !message.trim()}
          className="btn-primary py-3"
        >
          {sending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </div>
  );
}
