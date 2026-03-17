"use client";

interface OfferEvent {
  id: string;
  actorType: "BUYER" | "SELLER";
  action: string;
  price: number;
  message: string | null;
  createdAt: string;
}

interface Props {
  events: OfferEvent[];
  originalPrice: number;
  currentPrice: number;
  buyerName: string;
}

function dollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function actionLabel(action: string): string {
  switch (action) {
    case "SUBMITTED": return "Offer Submitted";
    case "ACCEPTED": return "Accepted";
    case "DECLINED": return "Declined";
    case "COUNTERED": return "Counter Offer";
    case "EXPIRED": return "Expired";
    case "WITHDRAWN": return "Withdrawn";
    default: return action;
  }
}

function actionColor(action: string): string {
  switch (action) {
    case "SUBMITTED": return "#00bcd4";
    case "ACCEPTED": return "#22c55e";
    case "DECLINED": return "#ef4444";
    case "COUNTERED": return "#f59e0b";
    case "EXPIRED": return "#888888";
    case "WITHDRAWN": return "#888888";
    default: return "#aaaaaa";
  }
}

function actorLabel(actorType: string, buyerName: string): string {
  return actorType === "BUYER" ? buyerName : "You (Seller)";
}

export default function OfferHistoryTimeline({ events, originalPrice, currentPrice, buyerName }: Props) {
  if (events.length === 0) {
    return (
      <div style={{
        padding: "1.25rem",
        borderRadius: "0.75rem",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        textAlign: "center",
        color: "#888",
        fontSize: "0.85rem",
      }}>
        No negotiation history yet.
      </div>
    );
  }

  return (
    <div style={{
      padding: "1.25rem",
      borderRadius: "0.75rem",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{
        fontWeight: 700,
        fontSize: "0.85rem",
        color: "#aaa",
        marginBottom: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span>Negotiation History</span>
        <span style={{ fontSize: "0.75rem", color: "#666" }}>
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
        {/* Vertical timeline line */}
        <div style={{
          position: "absolute",
          left: "7px",
          top: "8px",
          bottom: "8px",
          width: "2px",
          background: "rgba(255,255,255,0.08)",
        }} />

        {events.map((ev, i) => {
          const color = actionColor(ev.action);
          const isLast = i === events.length - 1;

          return (
            <div key={ev.id} style={{
              position: "relative",
              marginBottom: isLast ? 0 : "1rem",
              paddingBottom: isLast ? 0 : "0.25rem",
            }}>
              {/* Dot */}
              <div style={{
                position: "absolute",
                left: "-1.5rem",
                top: "4px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: isLast ? color : "rgba(255,255,255,0.05)",
                border: `2px solid ${color}`,
                boxShadow: isLast ? `0 0 8px ${color}40` : "none",
              }} />

              {/* Content */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: ev.actorType === "BUYER" ? "rgba(0,188,212,0.12)" : "rgba(168,85,247,0.12)",
                      color: ev.actorType === "BUYER" ? "#00bcd4" : "#a855f7",
                    }}>
                      {actorLabel(ev.actorType, buyerName)}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color }}>
                      {actionLabel(ev.action)}
                    </span>
                  </div>
                  {ev.message && (
                    <div style={{
                      fontSize: "0.78rem",
                      color: "#888",
                      marginTop: "4px",
                      fontStyle: "italic",
                      lineHeight: 1.4,
                    }}>
                      &ldquo;{ev.message}&rdquo;
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#e5e5e5" }}>
                    ${dollars(ev.price)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#666" }}>
                    {new Date(ev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" "}
                    {new Date(ev.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price change summary */}
      {originalPrice !== currentPrice && (
        <div style={{
          marginTop: "1rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.78rem",
          color: "#888",
        }}>
          <span>Original: ${dollars(originalPrice)}</span>
          <span>Current: <strong style={{ color: "#00bcd4" }}>${dollars(currentPrice)}</strong></span>
        </div>
      )}
    </div>
  );
}
