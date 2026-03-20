"use client";

import { useState } from "react";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

type Props = {
  itemId: string;
  itemTitle: string;
  suggestedPrice?: number;
  itemStatus?: string;
};

export default function MakeOfferForm({ itemId, itemTitle, suggestedPrice, itemStatus }: Props) {
  const [amount, setAmount] = useState(suggestedPrice ? Math.round(suggestedPrice * 0.85).toString() : "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const offerNum = Number(amount) || 0;
  const fee = offerNum > 0 ? Math.round(offerNum * PROCESSING_FEE.buyerRate * 100) / 100 : 0;
  const totalIfAccepted = offerNum > 0 ? Math.round((offerNum + fee) * 100) / 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !name.trim() || !email.trim() || offerNum <= 0) return;
    setSending(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          buyerName: name.trim(),
          buyerEmail: email.trim(),
          amount: offerNum,
          message: message.trim(),
        }),
      });
      if (res.ok) setSubmitted(true);
    } catch (e) {
      console.error("Offer submit failed:", e);
    } finally {
      setSending(false);
    }
  }

  // OFFER_PENDING guard — item already has an active offer
  if (itemStatus === "OFFER_PENDING") {
    return (
      <div style={{
        padding: "1.5rem",
        borderRadius: "1rem",
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>&#9202;</div>
        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Offer in Progress</div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          This item currently has an active offer being negotiated. Check back soon or contact the seller directly.
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        padding: "1.5rem",
        borderRadius: "1rem",
        background: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.2)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#10003;</div>
        <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Offer Submitted!</div>
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Your offer of ${offerNum.toLocaleString()} for &quot;{itemTitle}&quot; has been sent to the seller.
          The seller will review it and respond to your email within 48 hours. Check your inbox for updates.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      padding: "1.25rem",
      borderRadius: "1rem",
      background: "var(--bg-card-solid)",
      border: "1px solid var(--border-default)",
    }}>
      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
        Make an Offer
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
            fontSize: "1rem", fontWeight: 700, color: "var(--text-muted)",
          }}>$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Your offer"
            min="1"
            step="1"
            className="input-dark"
            style={{ paddingLeft: "1.75rem", padding: "0.6rem 0.9rem 0.6rem 1.75rem", borderRadius: "0.6rem", fontSize: "1.1rem", fontWeight: 700, width: "100%" }}
            required
          />
        </div>

        {offerNum > 0 && (
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", paddingLeft: "0.25rem" }}>
            If accepted: ${offerNum.toFixed(2)} + ${fee.toFixed(2)} fee ({PROCESSING_FEE.buyerDisplay} — your share) = <strong style={{ color: "var(--text-primary)" }}>${totalIfAccepted.toFixed(2)} total</strong>
          </div>
        )}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="input-dark"
          style={{ padding: "0.55rem 0.9rem", borderRadius: "0.6rem", fontSize: "0.85rem" }}
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="input-dark"
          style={{ padding: "0.55rem 0.9rem", borderRadius: "0.6rem", fontSize: "0.85rem" }}
          required
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message to seller (optional)"
          className="input-dark"
          rows={2}
          style={{ padding: "0.55rem 0.9rem", borderRadius: "0.6rem", fontSize: "0.85rem", resize: "vertical" }}
        />

        <button
          type="submit"
          disabled={sending || offerNum <= 0}
          className="btn-ghost"
          style={{
            padding: "0.65rem",
            fontSize: "0.88rem",
            fontWeight: 700,
            borderRadius: "0.6rem",
            opacity: (sending || offerNum <= 0) ? 0.5 : 1,
          }}
        >
          {sending ? "Sending..." : "Submit Offer"}
        </button>

        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.25rem" }}>
          Sellers typically respond within 48 hours.
        </div>
      </div>
    </form>
  );
}
