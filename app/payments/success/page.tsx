import Link from "next/link";
import type { Metadata } from "next";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

export const metadata: Metadata = {
  title: "Payment Successful · LegacyLoop",
};

type SearchParams = Promise<{
  type?: string;
  amount?: string;
  fee?: string;
  total?: string;
  credits?: string;
  tier?: string;
  item?: string;
}>;

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const type = sp.type || "payment";
  const amount = sp.amount ? Number(sp.amount) : null;
  const fee = sp.fee ? Number(sp.fee) : null;
  const total = sp.total ? Number(sp.total) : null;
  const credits = sp.credits ? Number(sp.credits) : null;
  const tier = sp.tier || null;
  const itemTitle = sp.item || null;

  const titles: Record<string, string> = {
    credit_pack: "Credits Purchased!",
    subscription: "Plan Upgraded!",
    item_purchase: "Purchase Complete!",
    payment: "Payment Successful!",
  };

  const descriptions: Record<string, string> = {
    credit_pack: credits
      ? `${credits} credits have been added to your account.`
      : "Your credits have been added to your account.",
    subscription: tier
      ? `You're now on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan.`
      : "Your subscription has been updated.",
    item_purchase: itemTitle
      ? `You purchased "${itemTitle}". The seller has been notified.`
      : "Your purchase is confirmed. The seller has been notified.",
    payment: "Your payment has been processed successfully.",
  };

  const nextLinks: Record<string, { href: string; label: string }> = {
    credit_pack: { href: "/credits", label: "View Credits" },
    subscription: { href: "/billing", label: "View Billing" },
    item_purchase: { href: "/dashboard", label: "Go to Dashboard" },
    payment: { href: "/dashboard", label: "Go to Dashboard" },
  };

  const next = nextLinks[type] || nextLinks.payment;

  return (
    <div className="mx-auto max-w-lg" style={{ paddingTop: "3rem" }}>
      <div style={{
        textAlign: "center",
        borderRadius: "1.5rem",
        background: "var(--bg-card-solid)",
        border: "1px solid var(--border-default)",
        padding: "3rem 2rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Animated checkmark */}
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(0,188,212,0.2), rgba(0,188,212,0.08))",
          border: "3px solid var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
          animation: "successPulse 2s ease-in-out infinite",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}>
          {titles[type] || titles.payment}
        </h1>

        <p style={{
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          marginBottom: "1.5rem",
          lineHeight: 1.5,
        }}>
          {descriptions[type] || descriptions.payment}
        </p>

        {/* Payment breakdown */}
        {(amount != null || total != null) && (
          <div style={{
            background: "rgba(0,188,212,0.04)",
            border: "1px solid rgba(0,188,212,0.15)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            textAlign: "left",
          }}>
            <div style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
            }}>
              Payment Summary
            </div>

            {amount != null && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                <span>Subtotal</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            )}
            {fee != null && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                <span>{type === "item_purchase" ? `Processing fee (${PROCESSING_FEE.display} charged to buyer)` : `Processing fee (${PROCESSING_FEE.display})`}</span>
                <span>${fee.toFixed(2)}</span>
              </div>
            )}
            {total != null && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                borderTop: "1px solid var(--border-default)",
                paddingTop: "0.4rem",
                marginTop: "0.3rem",
              }}>
                <span>Total charged</span>
                <span style={{ color: "var(--accent)" }}>${total.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Additional info chips */}
        {credits != null && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "9999px",
            padding: "0.4rem 1rem",
            marginBottom: "1.5rem",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#22c55e",
          }}>
            +{credits} credits added
          </div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
          <Link
            href={next.href}
            className="btn-primary"
            style={{
              display: "inline-flex",
              padding: "0.75rem 2rem",
              fontSize: "0.95rem",
              borderRadius: "0.75rem",
            }}
          >
            {next.label}
          </Link>
          <Link
            href="/dashboard"
            style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Processing fee note */}
        {fee != null && (
          <div style={{
            marginTop: "1.5rem",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}>
            A {PROCESSING_FEE.display} processing fee is charged to the buyer on all transactions by our payment provider (Square).
          </div>
        )}
      </div>

      {/* Inline keyframe animation */}
      <style>{`
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,188,212,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(0,188,212,0); }
        }
      `}</style>
    </div>
  );
}
