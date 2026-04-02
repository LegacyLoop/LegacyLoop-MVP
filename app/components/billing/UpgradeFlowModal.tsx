"use client";
import { useState, useEffect } from "react";

interface Props {
  currentTier: number;
  newTier: number;
  newPlanName: string;
  newPlanPrice: number;
  billingPeriod?: "monthly" | "annual";
  onClose: () => void;
  onUpgraded: () => void;
}

interface ProRateData {
  currentPlanCredit: number;
  newPlanCost: number;
  chargeToday: number;
  daysRemaining: number;
  billingPeriodEnd: string;
}

export default function UpgradeFlowModal({
  currentTier,
  newTier,
  newPlanName,
  newPlanPrice,
  billingPeriod = "monthly",
  onClose,
  onUpgraded,
}: Props) {
  const [proRate, setProRate] = useState<ProRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/billing/pro-rate?action=upgrade&newTier=${newTier}`)
      .then((r) => {
        if (!r.ok) throw new Error("Pro-rate unavailable");
        return r.json();
      })
      .then((d) => {
        if (d && typeof d.chargeToday === "number") {
          setProRate(d);
        } else {
          setProRate({
            currentPlanCredit: 0,
            newPlanCost: newPlanPrice,
            chargeToday: newPlanPrice,
            daysRemaining: 0,
            billingPeriodEnd: "",
          });
        }
      })
      .catch(() => {
        setProRate({
          currentPlanCredit: 0,
          newPlanCost: newPlanPrice,
          chargeToday: newPlanPrice,
          daysRemaining: 0,
          billingPeriodEnd: "",
        });
      })
      .finally(() => setLoading(false));
  }, [newTier, newPlanPrice]);

  async function handleUpgrade() {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTier, billing: billingPeriod }),
      });
      if (res.ok) {
        setDone(true);
        onUpgraded();
      } else {
        const err = await res.json().catch(() => ({}));
        setError((err as { error?: string }).error || "Upgrade failed");
      }
    } catch {
      setError("Network error");
    }
    setProcessing(false);
  }

  const chargeAmount = proRate?.chargeToday ?? newPlanPrice;
  const hasCredit = (proRate?.currentPlanCredit ?? 0) > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(12px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "rgba(13,31,45,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          maxWidth: 480,
          width: "95%",
          padding: 28,
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              {"\u{1F680}"}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
              }}
            >
              Upgraded to {newPlanName}!
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(207,216,220,0.6)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Your new plan is active immediately. All features are unlocked.
            </div>
            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              style={{
                padding: "10px 24px",
                background: "#00bcd4",
                color: "#000",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              Continue
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              {hasCredit ? "Upgrade" : "Subscribe"} to {newPlanName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(207,216,220,0.6)",
                marginBottom: 24,
              }}
            >
              ${newPlanPrice}/mo - Your {hasCredit ? "upgrade" : "subscription"} takes effect immediately.
            </div>

            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 0",
                  color: "rgba(207,216,220,0.5)",
                  fontSize: 13,
                }}
              >
                Loading details...
              </div>
            ) : proRate ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(207,216,220,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 12,
                  }}
                >
                  {hasCredit ? "Upgrade Summary" : "Subscription Summary"}
                </div>

                {hasCredit && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "rgba(207,216,220,0.7)" }}>
                      Current plan credit ({proRate.daysRemaining} days unused)
                    </span>
                    <span style={{ fontSize: 13, color: "#4caf50", fontWeight: 600 }}>
                      -${(proRate.currentPlanCredit ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: "rgba(207,216,220,0.7)" }}>
                    {newPlanName} {hasCredit ? "(remaining period)" : "(monthly)"}
                  </span>
                  <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
                    ${(proRate.newPlanCost ?? newPlanPrice).toFixed(2)}
                  </span>
                </div>

                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    marginTop: 12,
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 15, color: "#fff", fontWeight: 700 }}>
                    Charge today
                  </span>
                  <span
                    style={{ fontSize: 15, color: "#00bcd4", fontWeight: 800 }}
                  >
                    ${(proRate.chargeToday ?? newPlanPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : null}

            {error && (
              <div
                style={{
                  background: "rgba(244,67,54,0.1)",
                  border: "1px solid rgba(244,67,54,0.3)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 16,
                  fontSize: 12,
                  color: "#f44336",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <button
                onClick={handleUpgrade}
                disabled={processing || loading}
                style={{
                  height: 52,
                  background:
                    processing || loading
                      ? "rgba(0,188,212,0.3)"
                      : "linear-gradient(135deg, #00bcd4, #0097a7)",
                  color: processing || loading ? "rgba(0,0,0,0.5)" : "#000",
                  fontWeight: 800,
                  fontSize: 14,
                  borderRadius: 10,
                  border: "none",
                  cursor: processing || loading ? "wait" : "pointer",
                }}
              >
                {processing
                  ? "Processing..."
                  : `Confirm \u2014 Pay $${chargeAmount.toFixed(2)}`}
              </button>
              <button
                onClick={onClose}
                style={{
                  height: 40,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
