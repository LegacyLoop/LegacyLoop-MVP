import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TIERS, TIER_NUMBER_TO_KEY, PROCESSING_FEE } from "@/lib/constants/pricing";

export const metadata: Metadata = {
  title: "Earnings & Payouts · LegacyLoop",
  description: "Track your earnings, commissions, and payout history",
};

export default async function PaymentsPage() {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  // ── Fetch real data ───────────────────────────────────────────────────────
  const earnings = await prisma.sellerEarnings
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const ledger = await prisma.paymentLedger
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  // Fetch item titles for earnings display
  const itemIds = earnings.filter((e) => e.itemId).map((e) => e.itemId!);
  const items =
    itemIds.length > 0
      ? await prisma.item
          .findMany({
            where: { id: { in: itemIds } },
            select: { id: true, title: true },
          })
          .catch(() => [])
      : [];
  const itemMap = new Map(items.map((i) => [i.id, i.title]));

  // ── Calculate balances from SellerEarnings ────────────────────────────────
  const now = new Date();

  const available = earnings
    .filter(
      (e) =>
        e.status === "available" ||
        (e.status === "pending" && e.holdUntil && new Date(e.holdUntil) < now)
    )
    .reduce((sum, e) => sum + e.netEarnings, 0);

  const pending = earnings
    .filter(
      (e) =>
        e.status === "pending" &&
        (!e.holdUntil || new Date(e.holdUntil) >= now)
    )
    .reduce((sum, e) => sum + e.netEarnings, 0);

  const totalEarned = earnings
    .filter((e) => e.status !== "refunded")
    .reduce((sum, e) => sum + e.netEarnings, 0);

  const totalCommissions = earnings
    .filter((e) => e.status !== "refunded")
    .reduce((sum, e) => sum + e.commissionAmount, 0);

  // ── Tier info ─────────────────────────────────────────────────────────────
  const tierKey = TIER_NUMBER_TO_KEY[user.tier] ?? "free";
  const currentTier = TIERS[tierKey];
  const commissionPct = currentTier?.commissionPct ?? 5;
  const tierName = currentTier?.name ?? "Free";

  // ── Status chip styles ────────────────────────────────────────────────────
  const EARNINGS_STATUS: Record<
    string,
    { bg: string; color: string; border: string; label: string }
  > = {
    available: {
      bg: "rgba(22,163,74,0.12)",
      color: "#22c55e",
      border: "rgba(22,163,74,0.2)",
      label: "Available",
    },
    pending: {
      bg: "rgba(234,179,8,0.12)",
      color: "#eab308",
      border: "rgba(234,179,8,0.2)",
      label: "Pending",
    },
    paid_out: {
      bg: "rgba(59,130,246,0.12)",
      color: "#3b82f6",
      border: "rgba(59,130,246,0.2)",
      label: "Paid Out",
    },
    refunded: {
      bg: "rgba(239,68,68,0.12)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.2)",
      label: "Refunded",
    },
  };

  const LEDGER_STATUS: Record<
    string,
    { bg: string; color: string; border: string; label: string }
  > = {
    completed: {
      bg: "rgba(22,163,74,0.12)",
      color: "#22c55e",
      border: "rgba(22,163,74,0.2)",
      label: "Completed",
    },
    pending: {
      bg: "rgba(234,179,8,0.12)",
      color: "#eab308",
      border: "rgba(234,179,8,0.2)",
      label: "Pending",
    },
    failed: {
      bg: "rgba(239,68,68,0.12)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.2)",
      label: "Failed",
    },
    refunded: {
      bg: "rgba(239,68,68,0.12)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.2)",
      label: "Refunded",
    },
  };

  const canWithdraw = available >= 25;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="section-title">Financials</div>
          <h1 className="h2 mt-2">Earnings & Payouts</h1>
          <p className="muted mt-3">
            Track your sales earnings, commissions, and transaction history.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/analytics" className="btn-ghost py-2 px-4 text-sm">
            Analytics
          </Link>
          <Link href="/dashboard" className="btn-ghost py-2 px-4 text-sm">
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── 4 Stat Cards ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Available Balance — teal accent */}
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "1rem",
            background:
              "linear-gradient(135deg, rgba(0,188,212,0.08), rgba(0,188,212,0.02))",
            border: "1px solid rgba(0,188,212,0.2)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--accent)",
            }}
          >
            Available Balance
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "var(--accent)",
              marginTop: "0.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            ${available.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: "0.1rem",
            }}
          >
            Ready to withdraw
          </div>
          <button
            className="btn-primary"
            style={{
              marginTop: "0.75rem",
              width: "100%",
              padding: "0.5rem",
              fontSize: "0.8rem",
              borderRadius: "0.6rem",
              opacity: canWithdraw ? 1 : 0.5,
              cursor: canWithdraw ? "pointer" : "not-allowed",
            }}
            disabled={!canWithdraw}
          >
            {canWithdraw ? "Request Payout" : "Min $25 to withdraw"}
          </button>
        </div>

        {/* Pending — yellow */}
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "1rem",
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
            }}
          >
            Pending
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "#eab308",
              marginTop: "0.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            ${pending.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: "0.1rem",
            }}
          >
            Held until delivery confirmed
          </div>
        </div>

        {/* Total Earned — green */}
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "1rem",
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
            }}
          >
            Total Earned
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "#22c55e",
              marginTop: "0.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            ${totalEarned.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: "0.1rem",
            }}
          >
            {earnings.filter((e) => e.status !== "refunded").length} sale
            {earnings.filter((e) => e.status !== "refunded").length !== 1
              ? "s"
              : ""}{" "}
            total
          </div>
        </div>

        {/* Commission Paid — red */}
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "1rem",
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
            }}
          >
            Commission Paid
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "#ef4444",
              marginTop: "0.25rem",
              letterSpacing: "-0.02em",
            }}
          >
            -${totalCommissions.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: "0.1rem",
            }}
          >
            {commissionPct}% on {tierName} plan
          </div>
        </div>
      </div>

      {/* ── Main content: tables + sidebar ────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* Left column: tables */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* ── Seller Earnings Table ───────────────────────────────────── */}
          <div
            style={{
              borderRadius: "1rem",
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-default)",
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                }}
              >
                Seller Earnings
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                  }}
                >
                  ({earnings.length})
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Sale Amount - Commission = Net Earnings
              </div>
            </div>

            {earnings.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 1rem",
                  color: "var(--text-muted)",
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    marginBottom: "0.75rem",
                    opacity: 0.4,
                  }}
                >
                  $
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "0.4rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  No earnings yet
                </div>
                <p style={{ fontSize: "0.82rem" }}>
                  Sell your first item to see your earnings here.
                </p>
                <Link
                  href="/dashboard"
                  className="btn-ghost mt-4 inline-flex text-sm"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.82rem",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Date",
                        "Item",
                        "Sale Amount",
                        "Commission",
                        "Net Earnings",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "0.5rem 0.6rem",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            borderBottom: "1px solid var(--border-default)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((e) => {
                      const chip =
                        EARNINGS_STATUS[e.status] ?? EARNINGS_STATUS.pending;
                      const itemTitle = e.itemId
                        ? itemMap.get(e.itemId) ?? "Unknown Item"
                        : "—";
                      return (
                        <tr
                          key={e.id}
                          style={{
                            borderBottom: "1px solid var(--border-default)",
                          }}
                        >
                          <td
                            style={{
                              padding: "0.6rem",
                              color: "var(--text-muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(e.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td
                            style={{
                              padding: "0.6rem",
                              fontWeight: 500,
                              color: "var(--text-primary)",
                              maxWidth: "180px",
                            }}
                          >
                            {e.itemId ? (
                              <Link
                                href={`/items/${e.itemId}`}
                                style={{
                                  color: "var(--accent)",
                                  textDecoration: "none",
                                }}
                              >
                                {itemTitle.slice(0, 30)}
                              </Link>
                            ) : (
                              <span>{itemTitle}</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "0.6rem",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            ${e.saleAmount.toFixed(2)}
                          </td>
                          <td style={{ padding: "0.6rem", color: "#ef4444" }}>
                            -${e.commissionAmount.toFixed(2)}
                            <span
                              style={{
                                fontSize: "0.6rem",
                                color: "var(--text-muted)",
                                marginLeft: "0.25rem",
                              }}
                            >
                              ({(e.commissionRate * 100).toFixed(0)}%)
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "0.6rem",
                              fontWeight: 700,
                              color: "#22c55e",
                            }}
                          >
                            ${e.netEarnings.toFixed(2)}
                          </td>
                          <td style={{ padding: "0.6rem" }}>
                            <span
                              style={{
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                padding: "0.12rem 0.4rem",
                                borderRadius: "0.3rem",
                                background: chip.bg,
                                color: chip.color,
                                border: `1px solid ${chip.border}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {chip.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Transaction History (PaymentLedger) ─────────────────────── */}
          <div
            style={{
              borderRadius: "1rem",
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-default)",
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                }}
              >
                Transaction History
                <span
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                  }}
                >
                  ({ledger.length})
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Purchases & payments
              </div>
            </div>

            {ledger.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1rem",
                  color: "var(--text-muted)",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "0.4rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  No transactions yet
                </div>
                <p style={{ fontSize: "0.82rem" }}>
                  Subscriptions, credit purchases, and item purchases will
                  appear here.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.82rem",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Date",
                        "Description",
                        "Subtotal",
                        "Fee",
                        "Total",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "0.5rem 0.6rem",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            borderBottom: "1px solid var(--border-default)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((tx) => {
                      const chip =
                        LEDGER_STATUS[tx.status] ?? LEDGER_STATUS.pending;
                      return (
                        <tr
                          key={tx.id}
                          style={{
                            borderBottom: "1px solid var(--border-default)",
                          }}
                        >
                          <td
                            style={{
                              padding: "0.6rem",
                              color: "var(--text-muted)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(tx.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td
                            style={{
                              padding: "0.6rem",
                              fontWeight: 500,
                              color: "var(--text-primary)",
                              maxWidth: "200px",
                            }}
                          >
                            <div>{tx.description.slice(0, 40)}</div>
                            <div
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--text-muted)",
                                marginTop: "0.1rem",
                              }}
                            >
                              {tx.type.replace(/_/g, " ")}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "0.6rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            ${tx.subtotal.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "0.6rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            ${tx.processingFee.toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "0.6rem",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            ${tx.totalCharged.toFixed(2)}
                          </td>
                          <td style={{ padding: "0.6rem" }}>
                            <span
                              style={{
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                padding: "0.12rem 0.4rem",
                                borderRadius: "0.3rem",
                                background: chip.bg,
                                color: chip.color,
                                border: `1px solid ${chip.border}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {chip.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ───────────────────────────────────────────────── */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* Payout Methods */}
          <div
            style={{
              borderRadius: "1rem",
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-default)",
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "var(--text-primary)",
                marginBottom: "1rem",
              }}
            >
              Payout Methods
            </div>

            {/* Bank ACH */}
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.625rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-default)",
                marginBottom: "0.625rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,188,212,0.1)",
                    fontSize: "0.75rem",
                  }}
                >
                  $
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Bank Account (ACH)
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    2-3 business days
                  </div>
                </div>
              </div>
              <button
                className="btn-primary"
                style={{
                  marginTop: "0.5rem",
                  width: "100%",
                  padding: "0.35rem",
                  fontSize: "0.72rem",
                  borderRadius: "0.4rem",
                }}
              >
                Connect Bank
              </button>
            </div>

            {/* PayPal */}
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.625rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-default)",
                marginBottom: "0.625rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,48,135,0.15)",
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    color: "#3b82f6",
                  }}
                >
                  PP
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    PayPal
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Instant transfer
                  </div>
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{
                  marginTop: "0.5rem",
                  width: "100%",
                  padding: "0.35rem",
                  fontSize: "0.72rem",
                  borderRadius: "0.4rem",
                }}
              >
                Link PayPal
              </button>
            </div>

            {/* Check */}
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.625rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-default)",
                marginBottom: "0.625rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(107,114,128,0.12)",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                  }}
                >
                  Ck
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Check by Mail
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>

            {/* Venmo / CashApp / Zelle */}
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.625rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(107,114,128,0.12)",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                  }}
                >
                  V/Z
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Venmo / CashApp / Zelle
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Coming Soon
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Schedule */}
            <div style={{ marginTop: "0.75rem" }}>
              <div
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                  marginBottom: "0.4rem",
                }}
              >
                Payout Schedule
              </div>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {["Daily", "Weekly", "Monthly"].map((s) => (
                  <button
                    key={s}
                    style={{
                      flex: 1,
                      padding: "0.35rem",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      borderRadius: "0.4rem",
                      cursor: "pointer",
                      background:
                        s === "Weekly" ? "var(--accent)" : "transparent",
                      color: s === "Weekly" ? "#000" : "var(--text-muted)",
                      border:
                        s === "Weekly"
                          ? "none"
                          : "1px solid var(--border-default)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Commission Rate Card */}
          <div
            style={{
              borderRadius: "1rem",
              background: "var(--bg-card-solid)",
              border: "1px solid var(--border-default)",
              padding: "1.25rem",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
              }}
            >
              Commission Rate
            </div>
            <div
              style={{
                textAlign: "center",
                padding: "1rem",
                borderRadius: "0.75rem",
                background: "rgba(0,188,212,0.06)",
                border: "1px solid rgba(0,188,212,0.15)",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 900,
                  color: "var(--accent)",
                  letterSpacing: "-0.03em",
                }}
              >
                {commissionPct}%
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                }}
              >
                {tierName} plan
              </div>
            </div>

            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              Commission is deducted only when items sell. The {PROCESSING_FEE.display} processing
              fee is charged to the buyer by our payment provider (Square).
            </div>

            {/* All tier rates */}
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              {Object.entries(TIERS).map(([key, t]) => {
                const isActive = tierKey === key;
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.3rem 0.5rem",
                      borderRadius: "0.35rem",
                      background: isActive
                        ? "rgba(0,188,212,0.08)"
                        : "transparent",
                      fontSize: "0.72rem",
                    }}
                  >
                    <span
                      style={{
                        color: isActive
                          ? "var(--accent)"
                          : "var(--text-muted)",
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {t.name}
                      {isActive && " (you)"}
                    </span>
                    <span
                      style={{
                        color: isActive
                          ? "var(--accent)"
                          : "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      {t.commissionPct}%
                    </span>
                  </div>
                );
              })}
            </div>

            <Link
              href="/pricing"
              className="btn-ghost"
              style={{
                display: "block",
                marginTop: "0.75rem",
                textAlign: "center",
                fontSize: "0.75rem",
                padding: "0.5rem",
              }}
            >
              View All Plans
            </Link>
          </div>

          {/* Square Payments */}
          <div
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              background:
                "linear-gradient(135deg, rgba(0,188,212,0.1), rgba(0,188,212,0.03))",
              border: "1px solid rgba(0,188,212,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Square Payments
              </span>
              <span
                style={{
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  padding: "0.1rem 0.35rem",
                  borderRadius: "0.25rem",
                  background: "rgba(0,188,212,0.15)",
                  color: "var(--accent)",
                  border: "1px solid rgba(0,188,212,0.25)",
                }}
              >
                SANDBOX
              </span>
            </div>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginBottom: "0.75rem",
              }}
            >
              Square handles all checkout securely. The{" "}
              {(PROCESSING_FEE.rate * 100).toFixed(1)}% processing fee is
              transparently added at checkout.
            </p>
            <button
              className="btn-primary"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                fontWeight: 700,
                fontSize: "0.78rem",
              }}
            >
              View Square Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
