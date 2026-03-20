"use client";

import { useState } from "react";
import OfferHistoryTimeline from "./OfferHistoryTimeline";

interface OfferEvent {
  id: string;
  actorType: "BUYER" | "SELLER";
  action: string;
  price: number;
  message: string | null;
  createdAt: string;
}

interface OfferData {
  id: string;
  itemId: string;
  buyerName: string;
  buyerEmail: string;
  status: string;
  currentPrice: number;
  originalPrice: number;
  round: number;
  expiresAt: string;
  conversationId: string | null;
  createdAt: string;
  expired?: boolean;
  itemTitle?: string | null;
  listingPrice?: number | null;
}

interface Props {
  offer: OfferData;
  events: OfferEvent[];
  onAction?: (action: string) => void;
}

function dollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

function statusBadge(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case "PENDING": return { label: "Pending", bg: "rgba(0,188,212,0.12)", color: "#00bcd4" };
    case "COUNTERED": return { label: "Countered", bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
    case "ACCEPTED": return { label: "Accepted", bg: "rgba(34,197,94,0.12)", color: "#22c55e" };
    case "DECLINED": return { label: "Declined", bg: "rgba(239,68,68,0.12)", color: "#ef4444" };
    case "EXPIRED": return { label: "Expired", bg: "rgba(136,136,136,0.12)", color: "var(--text-muted)" };
    case "WITHDRAWN": return { label: "Withdrawn", bg: "rgba(136,136,136,0.12)", color: "var(--text-muted)" };
    default: return { label: status, bg: "rgba(136,136,136,0.12)", color: "var(--text-muted)" };
  }
}

export default function OfferManagerPanel({ offer, events, onAction }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [confirmDecline, setConfirmDecline] = useState(false);

  const isActive = ["PENDING", "COUNTERED"].includes(offer.status) && !offer.expired;
  const badge = statusBadge(offer.expired ? "EXPIRED" : offer.status);

  async function handleAction(action: "accept" | "decline" | "counter") {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      let url = "";
      let body: any = {};

      if (action === "accept") {
        url = `/api/offers/${offer.id}/accept`;
      } else if (action === "decline") {
        url = `/api/offers/${offer.id}/decline`;
      } else if (action === "counter") {
        if (!counterAmount || Number(counterAmount) <= 0) {
          setSubmitting(false);
          return;
        }
        url = `/api/offers/${offer.id}/counter`;
        body = { counterPrice: Number(counterAmount), message: counterMessage.trim() || undefined };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (result.success) {
        setActionDone(action.toUpperCase());
        onAction?.(action);
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch {
      setError("Failed to process action");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Action completed state ──
  if (actionDone) {
    const msgs: Record<string, { title: string; desc: string; color: string }> = {
      ACCEPT: { title: "Offer Accepted!", desc: "The buyer has been notified and can now complete their purchase.", color: "#22c55e" },
      DECLINE: { title: "Offer Declined", desc: "The buyer has been notified. The item is back to Listed status.", color: "var(--text-muted)" },
      COUNTER: { title: "Counter Sent!", desc: "The buyer received an email with your counter offer. They have 48 hours to respond.", color: "#00bcd4" },
    };
    const m = msgs[actionDone] || msgs.DECLINE;

    return (
      <div style={{
        padding: "1.5rem",
        borderRadius: "0.75rem",
        background: "var(--ghost-bg)",
        border: "1px solid var(--border-default)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          {actionDone === "ACCEPT" ? "\u2705" : actionDone === "COUNTER" ? "\u21A9\uFE0F" : "\u2716\uFE0F"}
        </div>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: m.color, marginBottom: "0.5rem" }}>{m.title}</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{m.desc}</div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: "0.75rem",
      background: "var(--ghost-bg)",
      border: "1px solid var(--border-default)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border-default)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
            Offer from {offer.buyerName}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
            {offer.buyerEmail} · Round {offer.round}
          </div>
        </div>
        <div style={{
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "0.72rem",
          fontWeight: 700,
          background: badge.bg,
          color: badge.color,
        }}>
          {badge.label}
        </div>
      </div>

      {/* Price display */}
      <div style={{
        padding: "1.25rem",
        textAlign: "center",
        borderBottom: "1px solid var(--border-default)",
      }}>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "4px" }}>
          {offer.status === "COUNTERED" ? "Current Counter" : "Offer Amount"}
        </div>
        <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "#00bcd4" }}>
          ${dollars(offer.currentPrice)}
        </div>
        {offer.listingPrice != null && (
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Listed at ${Number(offer.listingPrice).toLocaleString()} ·{" "}
            {offer.currentPrice >= Math.round(Number(offer.listingPrice) * 100)
              ? <span style={{ color: "#22c55e" }}>At or above asking</span>
              : <span style={{ color: "#f59e0b" }}>
                  {Math.round((offer.currentPrice / (Number(offer.listingPrice) * 100)) * 100)}% of asking
                </span>
            }
          </div>
        )}
        {isActive && (
          <div style={{ fontSize: "0.78rem", color: "#f59e0b", marginTop: "8px" }}>
            {timeRemaining(offer.expiresAt)}
          </div>
        )}
      </div>

      {/* Action buttons — only if active */}
      {isActive && (
        <div style={{ padding: "1.25rem" }}>
          {error && (
            <div style={{
              padding: "0.6rem 0.75rem",
              borderRadius: "6px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              fontSize: "0.82rem",
              marginBottom: "0.75rem",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {/* Accept */}
            <button
              onClick={() => handleAction("accept")}
              disabled={submitting}
              style={{
                padding: "14px",
                fontSize: "1rem",
                fontWeight: 700,
                border: "none",
                borderRadius: "10px",
                background: "#22c55e",
                color: "#000",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                minHeight: "52px",
              }}
            >
              {submitting ? "Processing..." : `Accept Offer ($${dollars(offer.currentPrice)})`}
            </button>

            {/* Counter toggle / form */}
            {!showCounter ? (
              <button
                onClick={() => setShowCounter(true)}
                disabled={submitting}
                style={{
                  padding: "12px",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  border: "1px solid rgba(0,188,212,0.4)",
                  borderRadius: "10px",
                  background: "rgba(0,188,212,0.08)",
                  color: "#00bcd4",
                  cursor: "pointer",
                  minHeight: "48px",
                }}
              >
                Counter Offer
              </button>
            ) : (
              <div style={{
                padding: "1rem",
                borderRadius: "10px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                  Your Counter Price
                </div>
                <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                  <span style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    fontSize: "1.1rem", fontWeight: 700, color: "var(--text-muted)",
                  }}>$</span>
                  <input
                    type="number"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    placeholder="Your price"
                    min="1"
                    step="1"
                    style={{
                      width: "100%", padding: "12px 12px 12px 28px", fontSize: "1.1rem", fontWeight: 700,
                      background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                      borderRadius: "8px", color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Message to buyer (optional)"
                  rows={2}
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "0.85rem",
                    background: "var(--ghost-bg)", border: "1px solid var(--border-default)",
                    borderRadius: "8px", color: "var(--text-primary)", outline: "none", resize: "vertical",
                    marginBottom: "0.5rem", boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleAction("counter")}
                    disabled={submitting || !counterAmount || Number(counterAmount) <= 0}
                    style={{
                      flex: 1, padding: "12px", fontSize: "0.9rem", fontWeight: 700, border: "none",
                      borderRadius: "8px", background: "#00bcd4", color: "#000",
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting || !counterAmount || Number(counterAmount) <= 0 ? 0.5 : 1,
                      minHeight: "48px",
                    }}
                  >
                    {submitting ? "Sending..." : "Send Counter"}
                  </button>
                  <button
                    onClick={() => setShowCounter(false)}
                    style={{
                      padding: "12px 16px", fontSize: "0.85rem", border: "1px solid var(--border-default)",
                      borderRadius: "8px", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                      minHeight: "48px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Decline with confirmation */}
            {!confirmDecline ? (
              <button
                onClick={() => setConfirmDecline(true)}
                disabled={submitting}
                style={{
                  padding: "12px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  border: "1px solid var(--border-default)",
                  borderRadius: "10px",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  minHeight: "48px",
                }}
              >
                Decline Offer
              </button>
            ) : (
              <div style={{
                padding: "1rem",
                borderRadius: "10px",
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                  Are you sure you want to decline this offer?
                </div>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                  <button
                    onClick={() => handleAction("decline")}
                    disabled={submitting}
                    style={{
                      padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, border: "none",
                      borderRadius: "8px", background: "#ef4444", color: "#fff",
                      cursor: submitting ? "not-allowed" : "pointer",
                      minHeight: "44px",
                    }}
                  >
                    {submitting ? "Declining..." : "Yes, Decline"}
                  </button>
                  <button
                    onClick={() => setConfirmDecline(false)}
                    style={{
                      padding: "10px 20px", fontSize: "0.85rem", border: "1px solid var(--border-default)",
                      borderRadius: "8px", background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                      minHeight: "44px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ padding: "0 1.25rem 1.25rem" }}>
        <OfferHistoryTimeline
          events={events}
          originalPrice={offer.originalPrice}
          currentPrice={offer.currentPrice}
          buyerName={offer.buyerName}
        />
      </div>
    </div>
  );
}
