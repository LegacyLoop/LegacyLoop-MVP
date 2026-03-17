"use client";

import { useState } from "react";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

type Props = {
  amount?: number; // If provided, show calculated fee amount
  style?: React.CSSProperties;
  compact?: boolean; // Smaller variant for tables
  showSplit?: boolean; // Show "charged to buyer" language (item sales only)
};

export default function ProcessingFeeTooltip({ amount, style, compact, showSplit = false }: Props) {
  const [show, setShow] = useState(false);

  const feeAmount = amount != null
    ? Math.round(amount * PROCESSING_FEE.rate * 100) / 100
    : null;

  const pctLabel = `${PROCESSING_FEE.rate * 100}%`;

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.3rem", ...style }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        fontSize: compact ? "0.7rem" : "0.78rem",
        color: "var(--text-muted)",
      }}>
        {feeAmount != null ? (
          <>+${feeAmount.toFixed(2)} fee</>
        ) : (
          <>{pctLabel} processing fee</>
        )}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        aria-label="Processing fee info"
        style={{
          cursor: "pointer",
          padding: 0,
          fontSize: compact ? "0.65rem" : "0.72rem",
          color: "var(--text-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: compact ? "14px" : "16px",
          height: compact ? "14px" : "16px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid var(--border-default)",
          flexShrink: 0,
        }}
      >
        ?
      </button>

      {show && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--bg-card-solid)",
          border: "1px solid var(--border-default)",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          width: "260px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          zIndex: 50,
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem", fontSize: "0.78rem" }}>
            {PROCESSING_FEE.label} ({pctLabel})
          </div>
          <p style={{ margin: 0 }}>
            {showSplit ? (
              <>Square applies a {pctLabel} payment processing fee on all transactions,
              charged to the buyer.{" "}
              <strong style={{ color: "var(--accent)" }}>Sellers pay no processing fees</strong>.</>
            ) : (
              <>Square applies a {pctLabel} payment processing fee on all transactions.</>
            )}
          </p>
          {feeAmount != null && amount != null && (
            <div style={{
              marginTop: "0.5rem",
              padding: "0.4rem 0.6rem",
              background: "rgba(0,188,212,0.06)",
              borderRadius: "0.4rem",
              border: "1px solid rgba(0,188,212,0.15)",
              fontSize: "0.72rem",
              color: "var(--text-primary)",
            }}>
              ${amount.toFixed(2)} + ${feeAmount.toFixed(2)} fee{showSplit ? <> (charged to buyer)</> : null} = <strong>${(amount + feeAmount).toFixed(2)}</strong>
            </div>
          )}
          {/* Arrow */}
          <div style={{
            position: "absolute",
            bottom: "-6px",
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: "12px",
            height: "12px",
            background: "var(--bg-card-solid)",
            borderRight: "1px solid var(--border-default)",
            borderBottom: "1px solid var(--border-default)",
          }} />
        </div>
      )}
    </span>
  );
}
