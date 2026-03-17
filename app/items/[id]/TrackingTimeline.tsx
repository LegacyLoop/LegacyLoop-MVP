"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StatusEntry = {
  status: string;
  timestamp: string;
  location?: string;
};

type Props = {
  labelId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
  rate: number;
  currentStatus: string;
  estimatedDays: number | null;
  statusHistory: StatusEntry[];
  createdAt: string;
};

const STEPS = [
  { key: "CREATED", label: "Label Created", icon: "🏷️" },
  { key: "PICKED_UP", label: "Picked Up", icon: "📦" },
  { key: "IN_TRANSIT", label: "In Transit", icon: "🚚" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "📍" },
  { key: "DELIVERED", label: "Delivered", icon: "✅" },
];

const STATUS_ORDER: Record<string, number> = {
  CREATED: 0,
  PICKED_UP: 1,
  IN_TRANSIT: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
};

const CARRIER_COLORS: Record<string, { primary: string; secondary: string; bg: string }> = {
  FEDEX:  { primary: "#4D148C", secondary: "#FF6200", bg: "rgba(77,20,140,0.08)" },
  UPS:    { primary: "#644117", secondary: "#FFB500", bg: "rgba(255,181,0,0.08)" },
  USPS:   { primary: "#333366", secondary: "#CC0000", bg: "rgba(51,51,102,0.08)" },
};

function getCarrierTheme(carrier: string) {
  const key = carrier.toUpperCase().replace(/\s+/g, "");
  if (key.includes("FEDEX")) return CARRIER_COLORS.FEDEX;
  if (key.includes("UPS")) return CARRIER_COLORS.UPS;
  if (key.includes("USPS")) return CARRIER_COLORS.USPS;
  return { primary: "#00bcd4", secondary: "#009688", bg: "rgba(0,188,212,0.06)" };
}

export default function TrackingTimeline({
  labelId,
  carrier,
  service,
  trackingNumber,
  rate,
  currentStatus,
  estimatedDays,
  statusHistory,
  createdAt,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(currentStatus === "DELIVERED");

  const currentIndex = STATUS_ORDER[currentStatus] ?? 0;
  const isDelivered = currentStatus === "DELIVERED";
  const isFinalPreDelivery = currentIndex === STATUS_ORDER.OUT_FOR_DELIVERY;
  const carrierTheme = getCarrierTheme(carrier);

  const refreshKeepScroll = () => {
    const scrollY = window.scrollY;
    router.refresh();
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  const copyTracking = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHistoryForStep = (stepKey: string): StatusEntry | null => {
    return statusHistory.find((h) => h.status === stepKey) ?? null;
  };

  const advanceStatus = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= STEPS.length) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/shipping/tracking/${labelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: STEPS[nextIndex].key }),
      });
      if (res.ok && STEPS[nextIndex].key === "DELIVERED") {
        setDeliveryConfirmed(true);
        setTimeout(() => refreshKeepScroll(), 1800);
      } else {
        refreshKeepScroll();
      }
    } catch { /* silent */ }
    setAdvancing(false);
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "16px",
      padding: "1.5rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Carrier branding header bar */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: `linear-gradient(90deg, ${carrierTheme.primary}, ${carrierTheme.secondary})`,
      }} />

      {/* Header with carrier branding */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        marginBottom: "1.25rem",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "10px",
            background: carrierTheme.bg,
            border: `1px solid ${carrierTheme.primary}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
          }}>
            📦
          </div>
          <div>
            <div style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}>
              {carrier}
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.4rem", fontSize: "0.82rem" }}>
                {service}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.1rem" }}>
              <code style={{
                fontSize: "0.72rem",
                color: carrierTheme.primary,
                background: carrierTheme.bg,
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}>
                {trackingNumber}
              </code>
              <button
                onClick={copyTracking}
                style={{
                  fontSize: "0.62rem",
                  color: "var(--accent)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
        <div style={{
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          textAlign: "right",
        }}>
          <div style={{ fontWeight: 600 }}>${rate.toFixed(2)}</div>
          {estimatedDays && !isDelivered && (
            <div style={{ fontSize: "0.68rem" }}>Est. {estimatedDays} day{estimatedDays !== 1 ? "s" : ""}</div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0",
        position: "relative",
        padding: "0.5rem 0",
      }}>
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex || (deliveryConfirmed && i <= STATUS_ORDER.DELIVERED);
          const isCurrent = !deliveryConfirmed && i === currentIndex;
          const isFuture = !deliveryConfirmed && i > currentIndex;
          const history = getHistoryForStep(step.key);

          return (
            <div
              key={step.key}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              {/* Connector line */}
              {i > 0 && (
                <div style={{
                  position: "absolute",
                  top: "0.75rem",
                  left: "-50%",
                  right: "50%",
                  height: "2px",
                  background: isCompleted || isCurrent
                    ? "linear-gradient(90deg, var(--accent), var(--accent))"
                    : "var(--bg-card-hover)",
                  zIndex: 0,
                  transition: "background 0.5s ease",
                }} />
              )}

              {/* Circle */}
              <div style={{
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "50%",
                background: isCompleted
                  ? "var(--accent)"
                  : isCurrent
                  ? "var(--accent)"
                  : "var(--bg-card-hover)",
                border: isCurrent
                  ? "2px solid var(--accent)"
                  : isCompleted
                  ? "2px solid var(--accent)"
                  : "2px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                position: "relative",
                boxShadow: isCurrent ? "0 0 14px rgba(0,188,212,0.45)" : "none",
                transition: "all 0.4s ease",
              }}>
                {isCompleted && (
                  <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 700 }}>✓</span>
                )}
                {isCurrent && (
                  <span style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    opacity: 0.4,
                    animation: "ttl-pulse 2s ease-in-out infinite",
                  }} />
                )}
              </div>

              {/* Label */}
              <div style={{
                marginTop: "0.4rem",
                fontSize: "0.62rem",
                fontWeight: isCurrent || isCompleted ? 700 : 500,
                color: isFuture ? "var(--text-muted)" : "var(--text-primary)",
                textAlign: "center",
                lineHeight: 1.3,
                transition: "color 0.3s ease",
              }}>
                {step.label}
              </div>

              {/* Timestamp/location */}
              {history && (
                <div style={{
                  marginTop: "0.15rem",
                  fontSize: "0.55rem",
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}>
                  {new Date(history.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {history.location && <div>{history.location}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delivery confirmed success banner */}
      {deliveryConfirmed && (
        <div style={{
          marginTop: "1rem",
          padding: "0.75rem 1rem",
          borderRadius: "10px",
          background: "rgba(22,163,74,0.08)",
          border: "1px solid rgba(22,163,74,0.25)",
          backdropFilter: "blur(10px)",
          textAlign: "center",
          animation: "ttl-fadeIn 0.5s ease",
        }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#16a34a" }}>
            Delivery confirmed. Sale closed. Funds released.
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Your earnings are now available for payout.
          </div>
        </div>
      )}

      {/* Estimated delivery — only when not delivered */}
      {estimatedDays && !isDelivered && !deliveryConfirmed && (
        <div style={{
          marginTop: "1rem",
          fontSize: "0.78rem",
          color: "var(--text-secondary)",
          textAlign: "center",
        }}>
          Estimated delivery: {estimatedDays} day{estimatedDays !== 1 ? "s" : ""} from label creation
        </div>
      )}

      {/* Action buttons */}
      {!isDelivered && !deliveryConfirmed && (
        <div style={{
          marginTop: "1rem",
          display: "flex",
          justifyContent: "center",
        }}>
          {isFinalPreDelivery ? (
            /* Final step — prominent Confirm Delivery button */
            <button
              onClick={advanceStatus}
              disabled={advancing}
              style={{
                background: advancing
                  ? "rgba(0,188,212,0.3)"
                  : "linear-gradient(135deg, #00bcd4, #009688)",
                border: "none",
                borderRadius: "10px",
                padding: "0.6rem 1.5rem",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: advancing ? "default" : "pointer",
                boxShadow: advancing ? "none" : "0 4px 15px rgba(0,188,212,0.3)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {advancing ? (
                <>
                  <span style={{
                    width: "0.85rem",
                    height: "0.85rem",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "ttl-spin 0.6s linear infinite",
                    display: "inline-block",
                  }} />
                  Confirming delivery...
                </>
              ) : (
                "Confirm Delivery"
              )}
            </button>
          ) : (
            /* Intermediate steps — subtle advance button */
            <button
              onClick={advanceStatus}
              disabled={advancing}
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.35rem 0.85rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              {advancing ? "Updating..." : "Advance to Next Step →"}
            </button>
          )}
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes ttl-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes ttl-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ttl-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
