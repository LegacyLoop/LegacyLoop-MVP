"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface OfferEvent {
  id: string;
  actorType: "BUYER" | "SELLER";
  action: string;
  price: number;
  message: string | null;
  createdAt: string;
}

interface OfferData {
  expired: boolean;
  offer: {
    id: string;
    status: string;
    currentPrice: number;
    originalPrice: number;
    round: number;
    expiresAt: string;
    buyerName: string;
    createdAt: string;
  };
  item: {
    id: string;
    title: string | null;
    description: string | null;
    listingPrice: number | null;
    photos: Array<{ filePath: string; isPrimary: boolean; caption: string | null }>;
  };
  events: OfferEvent[];
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

export default function BuyerOfferPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/offers/respond/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load offer"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAction(action: "ACCEPT" | "DECLINE" | "COUNTER") {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { action };
      if (action === "COUNTER") {
        if (!counterAmount || Number(counterAmount) <= 0) {
          setSubmitting(false);
          return;
        }
        payload.counterPrice = Number(counterAmount);
        payload.message = counterMessage.trim() || undefined;
      }

      const res = await fetch(`/api/offers/respond/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        setActionDone(action);
        if (result.checkoutUrl) setCheckoutUrl(result.checkoutUrl);
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch {
      setError("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#888", fontSize: "1.1rem" }}>Loading offer...</div>
      </div>
    );
  }

  // ── Error state ──
  if (error && !data) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>&#128683;</div>
          <div style={{ fontSize: "1.2rem", color: "#e5e5e5", fontWeight: 700, marginBottom: "0.5rem" }}>Offer Not Found</div>
          <div style={{ fontSize: "0.9rem", color: "#888" }}>This offer link may have expired or is invalid.</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { offer, item, events, expired } = data;
  const primaryPhoto = item.photos.find((p) => p.isPrimary) || item.photos[0];
  const isTerminal = ["ACCEPTED", "DECLINED", "EXPIRED", "WITHDRAWN"].includes(offer.status);

  // ── Action done state ──
  if (actionDone) {
    const msgs: Record<string, { title: string; desc: string; color: string }> = {
      ACCEPT: { title: "Offer Accepted!", desc: "The seller has been notified. Complete your purchase to secure the item.", color: "#22c55e" },
      DECLINE: { title: "Offer Declined", desc: "The seller has been notified. You can still view the item and make a new offer.", color: "#888" },
      COUNTER: { title: "Counter Offer Sent!", desc: "Your counter offer has been sent to the seller. You'll receive an email when they respond.", color: "#00bcd4" },
    };
    const m = msgs[actionDone] || msgs.DECLINE;

    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{actionDone === "ACCEPT" ? "\u2705" : actionDone === "COUNTER" ? "\u21A9\uFE0F" : "\u2716\uFE0F"}</div>
          <div style={{ fontSize: "1.4rem", color: m.color, fontWeight: 700, marginBottom: "0.75rem" }}>{m.title}</div>
          <div style={{ fontSize: "0.95rem", color: "#aaa", lineHeight: 1.6, marginBottom: "1.5rem" }}>{m.desc}</div>
          {checkoutUrl && (
            <a href={checkoutUrl} style={{
              display: "inline-block", padding: "14px 28px", background: "#22c55e", color: "#000",
              fontWeight: 700, fontSize: "1rem", textDecoration: "none", borderRadius: "8px",
            }}>Complete Purchase</a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e5e5", padding: "1.5rem" }}>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#00bcd4" }}>LegacyLoop</span>
        </div>

        {/* Item card */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem",
          display: "flex", gap: "1rem", alignItems: "center",
        }}>
          {primaryPhoto && (
            <img
              src={primaryPhoto.filePath}
              alt={item.title || "Item"}
              style={{ width: 80, height: 80, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
            />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#e5e5e5" }}>{item.title || "Item"}</div>
            {item.listingPrice && (
              <div style={{ fontSize: "0.85rem", color: "#888", marginTop: "4px" }}>Listed at ${Number(item.listingPrice).toLocaleString()}</div>
            )}
          </div>
        </div>

        {/* Current offer */}
        <div style={{
          background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.25)",
          borderRadius: "12px", padding: "1.5rem", textAlign: "center", marginBottom: "1.25rem",
        }}>
          <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: "4px" }}>
            {offer.status === "COUNTERED" ? "Counter Offer on the Table" : "Current Offer"}
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#00bcd4" }}>${dollars(offer.currentPrice)}</div>
          {offer.round > 1 && (
            <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "4px" }}>Round {offer.round} of negotiation</div>
          )}
          {!expired && !isTerminal && (
            <div style={{ fontSize: "0.82rem", color: "#f59e0b", marginTop: "8px" }}>
              {timeRemaining(offer.expiresAt)}
            </div>
          )}
          {expired && (
            <div style={{ fontSize: "0.82rem", color: "#ef4444", marginTop: "8px" }}>This offer has expired</div>
          )}
          {isTerminal && !expired && (
            <div style={{
              fontSize: "0.82rem", marginTop: "8px",
              color: offer.status === "ACCEPTED" ? "#22c55e" : offer.status === "DECLINED" ? "#ef4444" : "#888",
            }}>
              Status: {offer.status}
            </div>
          )}
        </div>

        {/* Offer history */}
        {events.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "1rem", marginBottom: "1.25rem",
          }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#aaa", marginBottom: "0.75rem" }}>Offer History</div>
            {events.map((ev) => (
              <div key={ev.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                    background: ev.actorType === "BUYER" ? "rgba(0,188,212,0.15)" : "rgba(168,85,247,0.15)",
                    color: ev.actorType === "BUYER" ? "#00bcd4" : "#a855f7",
                    marginRight: "8px",
                  }}>
                    {ev.actorType}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#ccc" }}>{ev.action}</span>
                  {ev.message && (
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px", marginLeft: "4px" }}>{ev.message}</div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#e5e5e5" }}>${dollars(ev.price)}</div>
                  <div style={{ fontSize: "0.7rem", color: "#666" }}>
                    {new Date(ev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons — only if not expired and not terminal */}
        {!expired && !isTerminal && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Accept */}
            <button
              onClick={() => handleAction("ACCEPT")}
              disabled={submitting}
              style={{
                padding: "16px", fontSize: "1.05rem", fontWeight: 700, border: "none", borderRadius: "10px",
                background: "#22c55e", color: "#000", cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1, minHeight: "52px",
              }}
            >
              {submitting ? "Processing..." : `Accept This Offer ($${dollars(offer.currentPrice)})`}
            </button>

            {/* Counter toggle */}
            {!showCounter ? (
              <button
                onClick={() => setShowCounter(true)}
                disabled={submitting}
                style={{
                  padding: "14px", fontSize: "0.95rem", fontWeight: 600, border: "1px solid rgba(0,188,212,0.4)",
                  borderRadius: "10px", background: "rgba(0,188,212,0.08)", color: "#00bcd4",
                  cursor: "pointer", minHeight: "52px",
                }}
              >
                Counter with Different Price
              </button>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", padding: "1rem",
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#aaa", marginBottom: "0.75rem" }}>Your Counter Offer</div>
                <div style={{ position: "relative", marginBottom: "0.6rem" }}>
                  <span style={{
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                    fontSize: "1.1rem", fontWeight: 700, color: "#888",
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
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px", color: "#e5e5e5", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Message to seller (optional)"
                  rows={2}
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: "0.85rem",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px", color: "#e5e5e5", outline: "none", resize: "vertical",
                    marginBottom: "0.6rem", boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleAction("COUNTER")}
                    disabled={submitting || !counterAmount || Number(counterAmount) <= 0}
                    style={{
                      flex: 1, padding: "12px", fontSize: "0.9rem", fontWeight: 700, border: "none",
                      borderRadius: "8px", background: "#00bcd4", color: "#000",
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting || !counterAmount || Number(counterAmount) <= 0 ? 0.5 : 1,
                      minHeight: "48px",
                    }}
                  >
                    {submitting ? "Sending..." : "Submit Counter"}
                  </button>
                  <button
                    onClick={() => setShowCounter(false)}
                    style={{
                      padding: "12px 16px", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px", background: "transparent", color: "#888", cursor: "pointer",
                      minHeight: "48px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Decline */}
            <button
              onClick={() => handleAction("DECLINE")}
              disabled={submitting}
              style={{
                padding: "14px", fontSize: "0.9rem", fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px", background: "transparent", color: "#888",
                cursor: submitting ? "not-allowed" : "pointer", minHeight: "52px",
              }}
            >
              Decline
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "#555" }}>
          Powered by LegacyLoop — AI Estate Resale
        </div>
      </div>
    </div>
  );
}
