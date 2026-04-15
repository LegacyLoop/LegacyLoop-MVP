import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";
import type { Metadata } from "next";
import { TIERS, TIER_NUMBER_TO_KEY, calculateTotalWithFee, calculateTierPrice, PROCESSING_FEE } from "@/lib/constants/pricing";

export const metadata: Metadata = {
  title: "Billing · LegacyLoop",
  description: "Manage your subscription and billing",
};

export default async function BillingPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
  }).catch(() => null);

  const billingHistory = await prisma.paymentLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  }).catch(() => []);

  const currentTierKey = TIER_NUMBER_TO_KEY[user.tier] ?? "free";
  const currentTier = TIERS[currentTierKey];
  const currentPrice = calculateTierPrice(currentTierKey, "monthly", true);
  const { processingFee: currentFee, total: currentTotal } = calculateTotalWithFee(currentPrice);

  // Get upgrade tiers (above current)
  const tierOrder = ["free", "starter", "plus", "pro"];
  const currentIndex = tierOrder.indexOf(currentTierKey);
  const upgradeTiers = tierOrder.slice(currentIndex + 1).map((key) => {
    const tier = TIERS[key];
    const price = calculateTierPrice(key, "monthly", true);
    const { processingFee, total } = calculateTotalWithFee(price);
    return { key, tier, price, processingFee, total };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Billing" }]} />
      <div style={{ marginBottom: "2rem" }}>
        <div className="section-title">Account</div>
        <h1 className="h2 mt-2">Billing & Subscription</h1>
        <p className="muted mt-1">Manage your plan, view invoices, and update payment methods.</p>
      </div>

      {/* Current plan card */}
      <div style={{
        borderRadius: "1.25rem",
        background: "linear-gradient(135deg, rgba(0,188,212,0.1), rgba(0,188,212,0.03))",
        border: "2px solid rgba(0,188,212,0.25)",
        padding: "2rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)", marginBottom: "0.25rem" }}>Current Plan</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)" }}>
              {currentTier?.name || "Free"}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              {currentTier?.tagline}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {currentPrice > 0 ? (
              <>
                <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--accent)", letterSpacing: "-0.03em" }}>
                  ${currentPrice}<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/mo</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  +${currentFee.toFixed(2)} processing fee = ${currentTotal.toFixed(2)}/mo
                </div>
              </>
            ) : (
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#22c55e" }}>Free</div>
            )}
          </div>
        </div>

        {subscription && (
          <div style={{
            display: "flex", gap: "2rem", marginTop: "1.25rem",
            paddingTop: "1rem", borderTop: "1px solid rgba(0,188,212,0.15)",
            flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Status</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#22c55e", marginTop: "0.1rem" }}>{subscription.status}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Billing Period</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.1rem" }}>
                {subscription.billingPeriod === "annual" ? "Annual" : "Monthly"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Current Period</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginTop: "0.1rem" }}>
                {new Date(subscription.currentPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>Commission Rate</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent)", marginTop: "0.1rem" }}>
                {currentTier?.commissionPct ?? 5}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade options */}
      {upgradeTiers.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
            Upgrade Your Plan
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(upgradeTiers.length, 3)}, minmax(0, 1fr))`, gap: "1rem" }}>
            {upgradeTiers.map(({ key, tier, price, processingFee, total }) => (
              <div key={key} style={{
                borderRadius: "1rem",
                background: "var(--bg-card-solid)",
                border: tier.popular ? "2px solid var(--accent)" : "1px solid var(--border-default)",
                padding: "1.5rem",
                position: "relative",
              }}>
                {tier.popular && (
                  <div style={{
                    position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                    background: "var(--accent)", color: "#fff", padding: "0.15rem 0.7rem",
                    borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700,
                  }}>POPULAR</div>
                )}
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>{tier.name}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{tier.tagline}</div>
                <div style={{ marginTop: "0.75rem" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent)" }}>${price}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/mo</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  +${processingFee.toFixed(2)} fee = ${total.toFixed(2)}/mo
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  {tier.commissionPct}% commission
                </div>
                <ul style={{ marginTop: "0.75rem", paddingLeft: "1rem", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  {tier.features.slice(0, 4).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link href={`/pricing`} className="btn-primary" style={{
                  display: "block", textAlign: "center", marginTop: "1rem",
                  padding: "0.6rem", fontSize: "0.85rem", borderRadius: "0.6rem",
                }}>
                  Upgrade to {tier.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing history */}
      <div style={{
        borderRadius: "1rem",
        background: "var(--bg-card-solid)",
        border: "1px solid var(--border-default)",
        padding: "1.25rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "1rem" }}>
          Billing History
        </div>
        {billingHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No billing history yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", minWidth: "600px" }}>
            <thead>
              <tr>
                {["Date", "Description", "Subtotal", "Fee", "Total", "Status", ""].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "0.5rem 0.6rem", color: "var(--text-muted)", fontWeight: 600,
                    fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em",
                    borderBottom: "1px solid var(--border-default)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td style={{ padding: "0.6rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "0.6rem", color: "var(--text-primary)" }}>
                    <span style={{
                      fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.35rem", borderRadius: "0.25rem", marginRight: "0.4rem",
                      background: tx.type.includes("white_glove") ? "rgba(212,175,55,0.12)" : "rgba(0,188,212,0.08)",
                      color: tx.type.includes("white_glove") ? "#D4AF37" : "var(--accent)",
                      border: tx.type.includes("white_glove") ? "1px solid rgba(212,175,55,0.2)" : "1px solid rgba(0,188,212,0.15)",
                      textTransform: "uppercase", letterSpacing: "0.04em", verticalAlign: "middle",
                    }}>
                      {tx.type === "subscription" ? "Sub" : tx.type === "credit_pack" || tx.type === "custom_credit" ? "Credits" : tx.type === "item_purchase" ? "Purchase" : tx.type.includes("white_glove") ? "Estate" : tx.type === "estate_care" ? "Care" : tx.type}
                    </span>
                    {tx.description}
                  </td>
                  <td style={{ padding: "0.6rem", color: "var(--text-secondary)" }}>${tx.subtotal.toFixed(2)}</td>
                  <td style={{ padding: "0.6rem", color: "var(--text-muted)" }}>${tx.processingFee.toFixed(2)}</td>
                  <td style={{ padding: "0.6rem", fontWeight: 700, color: "var(--text-primary)" }}>${tx.totalCharged.toFixed(2)}</td>
                  <td style={{ padding: "0.6rem" }}>
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 700, padding: "0.12rem 0.4rem", borderRadius: "0.3rem",
                      background: tx.status === "completed" ? "rgba(22,163,74,0.12)" : "rgba(234,179,8,0.12)",
                      color: tx.status === "completed" ? "#22c55e" : "#eab308",
                      border: `1px solid ${tx.status === "completed" ? "rgba(22,163,74,0.2)" : "rgba(234,179,8,0.2)"}`,
                      textTransform: "uppercase",
                    }}>{tx.status}</span>
                  </td>
                  <td style={{ padding: "0.6rem", display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {(tx as any).receiptUrl ? (
                      <a
                        href={(tx as any).receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "0.15rem 0.5rem", borderRadius: "6px",
                          fontSize: "0.6rem", fontWeight: 600,
                          color: "var(--accent)", background: "rgba(0,188,212,0.08)",
                          border: "1px solid rgba(0,188,212,0.2)",
                          textDecoration: "none", whiteSpace: "nowrap",
                        }}
                      >
                        📄 Receipt
                      </a>
                    ) : (
                      <a
                        href={`/receipts/${tx.id}?type=payment`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "0.15rem 0.5rem", borderRadius: "6px",
                          fontSize: "0.6rem", fontWeight: 600,
                          color: "var(--text-muted)", background: "rgba(255,255,255,0.04)",
                          border: "1px solid var(--border-default)",
                          textDecoration: "none", whiteSpace: "nowrap",
                        }}
                      >
                        📄 Details
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Downgrade note */}
      <div style={{
        borderRadius: "1rem",
        background: "var(--bg-card-solid)",
        border: "1px solid var(--border-default)",
        padding: "1.25rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Downgrade or Cancel
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          To downgrade your plan, your current subscription will continue until the end of your billing period.
          After that, you'll be moved to the lower tier. No refunds are issued for the remaining period, but
          you'll receive a prorated credit toward your next billing cycle.
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "0.5rem" }}>
          To cancel, contact support at <a href="mailto:support@legacy-loop.com" style={{ color: "var(--accent)" }}>support@legacy-loop.com</a> or call <a href="tel:2075550127" style={{ color: "var(--accent)" }}>(207) 555-0127</a>.
        </p>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/pricing" className="btn-ghost" style={{ padding: "0.5rem 1.25rem", fontSize: "0.82rem" }}>Compare Plans</Link>
        <Link href="/payments" className="btn-ghost" style={{ padding: "0.5rem 1.25rem", fontSize: "0.82rem" }}>All Transactions</Link>
        <Link href="/dashboard" className="btn-ghost" style={{ padding: "0.5rem 1.25rem", fontSize: "0.82rem" }}>Dashboard</Link>
      </div>
    </div>
  );
}
