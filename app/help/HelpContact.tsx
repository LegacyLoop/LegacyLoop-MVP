"use client";

import { useState } from "react";

export default function HelpContact() {
  const [form, setForm] = useState({ name: "", email: "", category: "general", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.email || !form.message) { setError("Please fill in your email and message."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/help/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setTicketId(data.ticketId); }
      else { setError(data.error || "Something went wrong."); }
    } catch { setError("Connection error — please try again."); }
    finally { setSubmitting(false); }
  };

  if (ticketId) {
    return (
      <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✅</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#22c55e", marginBottom: "0.5rem" }}>Message Sent!</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Your ticket ID is <strong>{ticketId}</strong>. We sent a confirmation to your email.</div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>We&apos;ll get back to you within 24 hours (usually much sooner).</div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border-default, #e2e8f0)", borderRadius: "12px", padding: "1.5rem" }}>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>📬 Contact Support</div>
      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
        Mon–Sat, 8am–8pm EST · <a href="tel:2075550127" style={{ color: "var(--accent)", textDecoration: "none" }}>(207) 555-0127</a> · <a href="mailto:support@legacy-loop.com" style={{ color: "var(--accent)", textDecoration: "none" }}>support@legacy-loop.com</a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: "1 1 200px", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)", background: "var(--bg-card, #fff)", color: "var(--text-primary)", fontSize: "0.88rem", minHeight: "48px", outline: "none" }} />
          <input placeholder="Email address *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ flex: "1 1 200px", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)", background: "var(--bg-card, #fff)", color: "var(--text-primary)", fontSize: "0.88rem", minHeight: "48px", outline: "none" }} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ flex: "1 1 180px", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)", background: "var(--bg-card, #fff)", color: "var(--text-primary)", fontSize: "0.88rem", minHeight: "48px" }}>
            <option value="general">General Question</option>
            <option value="billing">Billing</option>
            <option value="shipping">Shipping</option>
            <option value="bot-issue">Bot Issue</option>
            <option value="account">Account</option>
            <option value="feature-request">Feature Request</option>
            <option value="bug-report">Bug Report</option>
          </select>
          <input placeholder="Subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={{ flex: "1 1 200px", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)", background: "var(--bg-card, #fff)", color: "var(--text-primary)", fontSize: "0.88rem", minHeight: "48px", outline: "none" }} />
        </div>

        <textarea placeholder="How can we help? *" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} style={{ padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-default, #e2e8f0)", background: "var(--bg-card, #fff)", color: "var(--text-primary)", fontSize: "0.88rem", resize: "vertical", minHeight: "100px", outline: "none", lineHeight: 1.6 }} />

        {error && <div style={{ fontSize: "0.82rem", color: "#ef4444" }}>{error}</div>}

        <button onClick={handleSubmit} disabled={submitting} style={{ padding: "0.75rem 2rem", borderRadius: "8px", border: "none", background: submitting ? "rgba(0,188,212,0.4)" : "#00bcd4", color: "#fff", fontWeight: 700, fontSize: "0.92rem", cursor: submitting ? "default" : "pointer", minHeight: "48px", alignSelf: "flex-start" }}>
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </div>
    </div>
  );
}
