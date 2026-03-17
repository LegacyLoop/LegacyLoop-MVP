"use client";
import { useState, useEffect } from "react";

interface Props {
  planName: string;
  currentTier: number;
  onClose: () => void;
  onCancelled: () => void;
}

const DOWNGRADE_MAP: Record<number, { tierKey: string; name: string; price: string; commission: string }> = {
  4: { tierKey: "PLUS", name: "Power Seller", price: "$25/mo", commission: "5%" },
  3: { tierKey: "STARTER", name: "DIY Seller", price: "$10/mo", commission: "8%" },
  2: { tierKey: "FREE", name: "Free", price: "$0/mo", commission: "12%" },
};

export default function CancelFlowModal({ planName, currentTier, onClose, onCancelled }: Props) {
  const [proRate, setProRate] = useState<{
    daysRemaining?: number;
    creditForUnused?: number;
    creditsEquivalent?: number;
    cashRefundAmount?: number;
    squareFeeAmount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const downgradeOption = DOWNGRADE_MAP[currentTier] || null;
  const [step, setStep] = useState<"downgrade" | "options" | "confirm" | "done">(
    downgradeOption ? "downgrade" : "options"
  );
  const [selectedRefund, setSelectedRefund] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    refundType?: string;
    refundAmount?: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/billing/pro-rate?action=cancel")
      .then((r) => r.json())
      .then((d) => setProRate(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(refundType: string) {
    setProcessing(true);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundType }),
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
              {result?.refundType === "credits"
                ? `${result.refundAmount} credits added to your balance`
                : result?.refundType === "cash"
                  ? `$${result.refundAmount} refund processing`
                  : "Your plan will remain active until the end of the billing period."}
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
              {selectedRefund === "credits"
                ? `You'll receive ${proRate?.creditsEquivalent || 0} credits instantly. Credits never expire.`
                : selectedRefund === "cash"
                  ? `You'll receive $${proRate?.cashRefundAmount || 0} back to your card after 3.5% Square processing fee ($${proRate?.squareFeeAmount || 0}). 3-5 business days.`
                  : "Your plan stays active until the end of the current billing period."}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <button
                onClick={() => handleCancel(selectedRefund || "none")}
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
        ) : (
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 6,
              }}
            >
              Cancel {planName}?
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(207,216,220,0.6)",
                marginBottom: 20,
              }}
            >
              Your plan stays active until the end of the billing period.
            </div>

            {!loading && proRate && (
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
                  style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}
                >
                  You have {proRate.daysRemaining} days remaining
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#00bcd4",
                    marginTop: 4,
                  }}
                >
                  Unused value: ${proRate.creditForUnused?.toFixed(2)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(207,216,220,0.5)",
                    marginTop: 6,
                  }}
                >
                  Would you like a refund for unused days?
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  height: 52,
                  background: "linear-gradient(135deg, #00bcd4, #0097a7)",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: 14,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Keep My Plan
              </button>
              <button
                onClick={() => {
                  setSelectedRefund("credits");
                  setStep("confirm");
                }}
                style={{
                  height: 48,
                  background: "rgba(0,188,212,0.08)",
                  border: "1px solid rgba(0,188,212,0.3)",
                  color: "#00bcd4",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <span>Cancel + Get {proRate?.creditsEquivalent || 0} Credits</span>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(207,216,220,0.5)",
                    marginTop: 2,
                  }}
                >
                  Instant - No fee
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedRefund("cash");
                  setStep("confirm");
                }}
                style={{
                  height: 44,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <span>
                  Cancel + Get ${proRate?.cashRefundAmount?.toFixed(2) || "0.00"} Cash
                  Back
                </span>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(207,216,220,0.4)",
                    marginTop: 2,
                  }}
                >
                  After 3.5% fee - 3-5 business days
                </div>
              </button>
              <button
                onClick={() => {
                  setSelectedRefund("none");
                  setStep("confirm");
                }}
                style={{
                  height: 36,
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Cancel without refund
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
