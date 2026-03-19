"use client";

import { useEffect, useState } from "react";
import OfferManagerPanel from "./OfferManagerPanel";

interface OfferEvent {
  id: string;
  actorType: "BUYER" | "SELLER";
  action: string;
  price: number;
  message: string | null;
  createdAt: string;
}

interface ActiveOffer {
  id: string;
  itemId: string;
  itemTitle: string | null;
  itemPhoto: string | null;
  listingPrice: number | null;
  buyerName: string;
  buyerEmail: string;
  status: string;
  currentPrice: number;
  originalPrice: number;
  round: number;
  expiresAt: string;
  conversationId: string | null;
  createdAt: string;
  events: OfferEvent[];
}

function dollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function expiryColor(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "#ef4444";
  if (ms < 6 * 60 * 60 * 1000) return "#ef4444"; // < 6h red
  if (ms < 24 * 60 * 60 * 1000) return "#f59e0b"; // < 24h amber
  return "#22c55e"; // > 24h green
}

function expiryLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

interface Props {
  /** If provided, only show offers for this item */
  itemId?: string;
  /** Compact mode (e.g., in sidebar) */
  compact?: boolean;
}

export default function ActiveOffersWidget({ itemId, compact }: Props) {
  const [offers, setOffers] = useState<ActiveOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<ActiveOffer | null>(null);

  useEffect(() => {
    const url = itemId ? `/api/offers/active?itemId=${itemId}` : `/api/offers/active`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.offers) setOffers(d.offers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <div style={{
        padding: "1rem",
        borderRadius: "0.75rem",
        background: "rgba(0,188,212,0.04)",
        border: "1px solid rgba(0,188,212,0.12)",
        textAlign: "center",
        color: "#888",
        fontSize: "0.82rem",
      }}>
        Loading offers...
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <>
      <div style={{
        borderRadius: "0.75rem",
        background: "rgba(0,188,212,0.04)",
        border: "1px solid rgba(0,188,212,0.15)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: compact ? "0.6rem 0.75rem" : "0.75rem 1rem",
          borderBottom: "1px solid rgba(0,188,212,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: compact ? "0.78rem" : "0.85rem",
            color: "#00bcd4",
          }}>
            Active Offers ({offers.length})
          </div>
        </div>

        {/* Offer cards */}
        {offers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => setSelectedOffer(offer)}
            style={{
              padding: compact ? "0.6rem 0.75rem" : "0.75rem 1rem",
              borderBottom: "1px solid var(--border-default)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,188,212,0.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {/* Item thumbnail */}
            {!compact && offer.itemPhoto && (
              <img
                src={offer.itemPhoto}
                alt=""
                style={{
                  width: 40, height: 40, borderRadius: "6px",
                  objectFit: "cover", flexShrink: 0,
                }}
              />
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600,
                fontSize: compact ? "0.78rem" : "0.82rem",
                color: "#e5e5e5",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {offer.buyerName}
                {!compact && offer.itemTitle && (
                  <span style={{ color: "#888", fontWeight: 400 }}> · {offer.itemTitle}</span>
                )}
              </div>
              <div style={{
                fontSize: compact ? "0.7rem" : "0.72rem",
                color: "#888",
                marginTop: "2px",
              }}>
                Round {offer.round} · {offer.status === "COUNTERED" ? "Countered" : "Pending"}
              </div>
            </div>

            {/* Price + expiry */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{
                fontSize: compact ? "0.85rem" : "0.92rem",
                fontWeight: 700,
                color: "#00bcd4",
              }}>
                ${dollars(offer.currentPrice)}
              </div>
              <div style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                color: expiryColor(offer.expiresAt),
                marginTop: "2px",
              }}>
                {expiryLabel(offer.expiresAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal overlay for OfferManagerPanel */}
      {selectedOffer && (
        <div
          onClick={() => setSelectedOffer(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "1rem",
              background: "#141414",
              border: "1px solid var(--border-default)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Close button */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "0.75rem 0.75rem 0",
            }}>
              <button
                onClick={() => setSelectedOffer(null)}
                style={{
                  background: "none", border: "none", color: "#888",
                  fontSize: "1.25rem", cursor: "pointer", padding: "4px 8px",
                }}
              >
                &#10005;
              </button>
            </div>

            <OfferManagerPanel
              offer={{
                ...selectedOffer,
                itemTitle: selectedOffer.itemTitle,
                listingPrice: selectedOffer.listingPrice,
              }}
              events={selectedOffer.events}
              onAction={() => {
                // Refresh offers list after action
                const url = itemId ? `/api/offers/active?itemId=${itemId}` : `/api/offers/active`;
                fetch(url)
                  .then((r) => r.json())
                  .then((d) => { if (d.offers) setOffers(d.offers); })
                  .catch(() => {});
                setSelectedOffer(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
