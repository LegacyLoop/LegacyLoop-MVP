"use client";
import { useState, useEffect, useCallback } from "react";

interface EarningEntry {
  id: string;
  itemName: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netEarnings: number;
  soldAt: string;
  status: string;
}

interface EarningsSummary {
  totalEarned: number;
  totalCommission: number;
  itemsSold: number;
  commissionRate: number;
  tierName: string;
  entries: EarningEntry[];
}

export default function EarningsBreakdown() {
  const [data, setData] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/earnings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load earnings");
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = useCallback(() => {
    if (!data || data.entries.length === 0) return;

    const headers = ["Item", "Sale Date", "Sale Amount", "Commission Rate", "Commission", "Net Earnings", "Status"];
    const rows = data.entries.map((e) => [
      `"${e.itemName.replace(/"/g, '""')}"`,
      new Date(e.soldAt).toLocaleDateString(),
      e.saleAmount.toFixed(2),
      `${(e.commissionRate * 100).toFixed(0)}%`,
      e.commissionAmount.toFixed(2),
      e.netEarnings.toFixed(2),
      e.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `legacyloop-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [data]);

  if (loading) {
    return (
      <div
        style={{
          background: "rgba(13,31,45,0.98)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          padding: 28,
        }}
      >
        <div style={{ color: "rgba(207,216,220,0.5)", fontSize: 13, textAlign: "center" }}>
          Loading earnings...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "rgba(13,31,45,0.98)",
          border: "1px solid var(--border-default)",
          borderRadius: 16,
          padding: 28,
        }}
      >
        <div style={{ color: "#f44336", fontSize: 13, textAlign: "center" }}>{error}</div>
      </div>
    );
  }

  const summary = data!;

  return (
    <div
      style={{
        background: "rgba(13,31,45,0.98)",
        border: "1px solid var(--border-default)",
        borderRadius: 16,
        padding: 28,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
          Earnings Breakdown
        </div>
        <button
          onClick={exportCSV}
          disabled={summary.entries.length === 0}
          style={{
            padding: "6px 14px",
            background: summary.entries.length === 0 ? "var(--bg-card)" : "rgba(0,188,212,0.1)",
            border: `1px solid ${summary.entries.length === 0 ? "var(--border-default)" : "rgba(0,188,212,0.3)"}`,
            color: summary.entries.length === 0 ? "var(--text-muted)" : "#00bcd4",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            cursor: summary.entries.length === 0 ? "default" : "pointer",
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "rgba(0,188,212,0.08)",
            border: "1px solid rgba(0,188,212,0.2)",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(0,188,212,0.7)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Total Earned
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#00bcd4" }}>
            ${summary.totalEarned.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            background: "var(--ghost-bg)",
            border: "1px solid var(--border-default)",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(207,216,220,0.5)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Commission Paid
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "rgba(207,216,220,0.7)" }}>
            ${summary.totalCommission.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            background: "var(--ghost-bg)",
            border: "1px solid var(--border-default)",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(207,216,220,0.5)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Items Sold
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
            {summary.itemsSold}
          </div>
        </div>
      </div>

      {/* Commission rate callout */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
            Your commission rate: {(summary.commissionRate * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 11, color: "rgba(207,216,220,0.5)", marginTop: 2 }}>
            {summary.tierName} plan
          </div>
        </div>
        {summary.commissionRate > 0.04 && (
          <a
            href="/pricing"
            style={{
              padding: "6px 14px",
              background: "rgba(0,188,212,0.1)",
              border: "1px solid rgba(0,188,212,0.3)",
              color: "#00bcd4",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 8,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Upgrade to save more
          </a>
        )}
      </div>

      {/* Per-sale table */}
      {summary.entries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "30px 0",
            color: "rgba(207,216,220,0.4)",
            fontSize: 13,
          }}
        >
          No sales yet. Your earnings will appear here once you make your first sale.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                {["Item", "Sold", "Commission", "Earnings"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Item" ? "left" : "right",
                      padding: "8px 10px",
                      color: "rgba(207,216,220,0.5)",
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid var(--border-default)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.entries.map((entry) => (
                <tr key={entry.id}>
                  <td
                    style={{
                      padding: "10px 10px",
                      color: "#fff",
                      fontWeight: 500,
                      borderBottom: "1px solid var(--border-default)",
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div>{entry.itemName}</div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(207,216,220,0.4)",
                        marginTop: 2,
                      }}
                    >
                      ${entry.saleAmount.toFixed(2)} sale
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      color: "rgba(207,216,220,0.6)",
                      textAlign: "right",
                      borderBottom: "1px solid var(--border-default)",
                    }}
                  >
                    {new Date(entry.soldAt).toLocaleDateString()}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      color: "rgba(207,216,220,0.5)",
                      textAlign: "right",
                      borderBottom: "1px solid var(--border-default)",
                    }}
                  >
                    <div>${entry.commissionAmount.toFixed(2)}</div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(207,216,220,0.35)",
                        marginTop: 1,
                      }}
                    >
                      {(entry.commissionRate * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      color: "#00bcd4",
                      fontWeight: 700,
                      textAlign: "right",
                      borderBottom: "1px solid var(--border-default)",
                    }}
                  >
                    ${entry.netEarnings.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
