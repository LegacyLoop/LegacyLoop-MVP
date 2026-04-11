"use client";
import { useState, useEffect } from "react";

interface Props {
  planName: string;
  currentTier: number;
  onClose: () => void;
  onCancelled: () => void;
}

const DOWNGRADE_MAP: Record<number, { tierKey: number; name: string; price: string; commission: string }> = {
  4: { tierKey: 3, name: "Power Seller", price: "$25/mo", commission: "5%" },
  3: { tierKey: 2, name: "DIY Seller", price: "$10/mo", commission: "8%" },
  2: { tierKey: 1, name: "Free", price: "$0/mo", commission: "12%" },
};

export default function CancelFlowModal({ planName, currentTier, onClose, onCancelled }: Props) {
  const [proRate, setProRate] = useState<{
    daysRemaining?: number;
    creditForUnused?: number;
    creditsEquivalent?: number;
    cashRefundAmount?: number;
    stripeFeeAmount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const downgradeOption = DOWNGRADE_MAP[currentTier] || null;
  const [step, setStep] = useState<"downgrade" | "options" | "immediate" | "confirm" | "done">(
    downgradeOption ? "downgrade" : "options"
  );
  const [selectedRefund, setSelectedRefund] = useState<string | null>(null);
  const [cancelType, setCancelType] = useState<"end_of_period" | "immediate">("end_of_period");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    cancelType?: string;
    refundType?: string;
    refundAmount?: number;
    effectiveDate?: string;
    daysRemaining?: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/billing/pro-rate?action=cancel")
      .then((r) => r.json())
      .then((d) => setProRate(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(refundType: string, type: "end_of_period" | "immediate" = "end_of_period") {
    setProcessing(true);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelType: type, refundType }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setStep("done");
        onCancelled();
      } else {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error || "Cancellation failed");
      }
    } catch {
      alert("Network error");
    }
    setProcessing(false);
  }

  async function handleDowngrade() {
    if (!downgradeOption) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/billing/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTier: downgradeOption.tierKey }),
      });
      if (res.ok) {
        onClose();
        window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error || "Downgrade failed");
      }
    } catch {
      alert("Network error");
    }
    setProcessing(false);
  }

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
          maxWidth: 500,
          width: "95%",
          padding: 28,
        }}
      >
        {step === "done" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              {"\u2705"}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
              }}
            >
              Plan Cancelled
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(207,216,220,0.6)",
                marginBottom: 16,
              }}
            >
              {result?.message || (result?.cancelType === "end_of_period"
                ? `Your plan stays active until ${result.effectiveDate ? new Date(result.effectiveDate).toLocaleDateString() : "the end of your billing period"}. No further charges.`
                : result?.refundType === "credits"
                  ? `${result.refundAmount} credits added to your balance`
                  : result?.refundType === "cash"
                    ? `$${(result.refundAmount ?? 0).toFixed(2)} refund processing (3-5 days)`
                    : "Your plan has been cancelled.")}
            </div>
            <button
              onClick={onClose}
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
              Close
            </button>
          </div>
        ) : step === "confirm" ? (
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Are you sure?
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(207,216,220,0.6)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {cancelType === "end_of_period"
                ? `Your plan stays active for ${proRate?.daysRemaining || 0} more days. No further charges will be made.`
                : selectedRefund === "credits"
                  ? `You'll receive ${proRate?.creditsEquivalent || 0} credits instantly. Credits never expire.`
                  : selectedRefund === "cash"
                    ? `You'll receive $${proRate?.cashRefundAmount || 0} back to your card. 3-5 business days.`
                    : "Your plan will be cancelled immediately. No refund."}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <button
                onClick={() => handleCancel(selectedRefund || "none", cancelType)}
                disabled={processing}
                style={{
                  height: 48,
                  background: "transparent",
                  border: "1px solid #f44336",
                  color: "#f44336",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  cursor: processing ? "wait" : "pointer",
                }}
              >
                {processing ? "Processing..." : "Yes, Cancel My Plan"}
              </button>
              <button
                onClick={() => setStep("options")}
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
                Go Back
              </button>
            </div>
          </div>
        ) : step === "downgrade" && downgradeOption ? (
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 6,
              }}
            >
              Before you cancel...
            </div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(207,216,220,0.6)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Would you like to downgrade instead? You{"'"}ll keep access until the end of your billing period.
            </div>

            <div
              style={{
                background: "rgba(0,188,212,0.06)",
                border: "1px solid rgba(0,188,212,0.25)",
                borderRadius: 14,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                {downgradeOption.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#00bcd4" }}>
                  {downgradeOption.price}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)" }}>
                {downgradeOption.commission} commission on sales
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <button
                onClick={handleDowngrade}
                disabled={processing}
                style={{
                  height: 52,
                  background: processing
                    ? "rgba(0,188,212,0.3)"
                    : "linear-gradient(135deg, #00bcd4, #0097a7)",
                  color: processing ? "rgba(0,0,0,0.5)" : "#000",
                  fontWeight: 800,
                  fontSize: 14,
                  borderRadius: 10,
                  border: "none",
                  cursor: processing ? "wait" : "pointer",
                }}
              >
                {processing ? "Processing..." : `Downgrade to ${downgradeOption.name}`}
              </button>
              <button
                onClick={() => setStep("options")}
                style={{
                  height: 36,
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                No thanks, I want to cancel
              </button>
            </div>
          </div>
        ) : step === "immediate" ? (
          /* ── Immediate cancel: refund options ── */
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              Cancel Immediately
            </div>
            <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginBottom: 20, lineHeight: 1.6 }}>
              Your plan will end today. Choose how to handle your unused balance.
            </div>

            {!loading && proRate && (
              <div style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: 16, marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                  {proRate.daysRemaining} days remaining
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#00bcd4", marginTop: 4 }}>
                  Unused value: ${proRate.creditForUnused?.toFixed(2)}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => { setCancelType("immediate"); setSelectedRefund("credits"); setStep("confirm"); }}
                style={{
                  height: 48, background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.3)",
                  color: "#00bcd4", fontWeight: 700, fontSize: 13, borderRadius: 10, cursor: "pointer", textAlign: "center",
                }}
              >
                <span>Get {proRate?.creditsEquivalent || 0} Platform Credits</span>
                <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)", marginTop: 2 }}>Instant — no fee</div>
              </button>
              <button
                onClick={() => { setCancelType("immediate"); setSelectedRefund("cash"); setStep("confirm"); }}
                style={{
                  height: 44, background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)", fontSize: 12, borderRadius: 10, cursor: "pointer", textAlign: "center",
                }}
              >
                <span>Get ${proRate?.cashRefundAmount?.toFixed(2) || "0.00"} Cash Back</span>
                <div style={{ fontSize: 10, color: "rgba(207,216,220,0.4)", marginTop: 2 }}>3-5 business days</div>
              </button>
              <button
                onClick={() => { setCancelType("immediate"); setSelectedRefund("none"); setStep("confirm"); }}
                style={{
                  height: 36, background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer",
                }}
              >
                Cancel without refund
              </button>
              <button
                onClick={() => setStep("options")}
                style={{
                  height: 36, background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer",
                }}
              >
                ← Go back
              </button>
            </div>
          </div>
        ) : (
          /* ── Options: cancel at period end (DEFAULT) vs immediate ── */
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              Cancel {planName}?
            </div>
            <div style={{ fontSize: 12, color: "rgba(207,216,220,0.6)", marginBottom: 20 }}>
              Choose how you'd like to cancel.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Keep plan — always first */}
              <button
                onClick={onClose}
                style={{
                  height: 52, background: "linear-gradient(135deg, #00bcd4, #0097a7)",
                  color: "#000", fontWeight: 800, fontSize: 14, borderRadius: 10, border: "none", cursor: "pointer",
                }}
              >
                Keep My Plan
              </button>

              {/* Cancel at period end — DEFAULT cancellation path */}
              <button
                onClick={() => { setCancelType("end_of_period"); setSelectedRefund("none"); setStep("confirm"); }}
                style={{
                  height: 52, background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.15)", color: "#fff",
                  fontWeight: 700, fontSize: 13, borderRadius: 10, cursor: "pointer", textAlign: "center",
                }}
              >
                <span>Cancel at End of Billing Period</span>
                <div style={{ fontSize: 10, color: "rgba(207,216,220,0.5)", marginTop: 2 }}>
                  Keep access until {proRate?.daysRemaining ? `${proRate.daysRemaining} more days` : "period end"} — no refund needed
                </div>
              </button>

              {/* Cancel immediately — secondary path */}
              <button
                onClick={() => setStep("immediate")}
                style={{
                  height: 40, background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer",
                }}
              >
                Cancel immediately + get a refund →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
