"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Breadcrumbs from "@/app/components/Breadcrumbs";

interface BotSpend { botName: string; creditsSpent: number; costDollars: number; runCount: number; }
interface TopItem { itemId: string; title: string; creditsSpent: number; costDollars: number; estimatedValue: number | null; roiPercent: number | null; }
interface Tx { id: string; description: string; amount: number; balance: number; itemId: string | null; createdAt: string; }
interface SpendingData {
  credits: { balance: number; lifetime: number; spent: number; purchased: number; earned: number };
  spending: { totalCreditsSpent: number; totalCostDollars: number; byBot: BotSpend[]; topItems: TopItem[]; recentTransactions: Tx[] };
  portfolio: { totalEstimatedValue: number; totalSoldRevenue: number; totalItems: number; analyzedItems: number; soldItems: number };
  overallRoi: { totalValueGenerated: number; totalCostDollars: number; roiPercent: number | null; roiLabel: string };
  creditCostRate: number;
}

const CARD: React.CSSProperties = {
  background: "var(--bg-card)", backdropFilter: "blur(20px)", border: "1px solid var(--border-default)",
  borderRadius: "16px", padding: "1.25rem", boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
};

export default function SpendingPage() {
  const [data, setData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spending").then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>Loading spending data...</div>
    </div>
  );

  if (!data) return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
        <p>Could not load spending data.</p>
        <Link href="/auth/login" style={{ color: "var(--accent)", textDecoration: "none" }}>Log in →</Link>
      </div>
    </div>
  );

  const maxBotSpend = Math.max(...data.spending.byBot.map((b) => b.creditsSpent), 1);
  const roiColor = data.overallRoi.roiPercent != null
    ? data.overallRoi.roiPercent > 0 ? "#22c55e" : data.overallRoi.roiPercent > -50 ? "#f59e0b" : "#ef4444"
    : "var(--text-muted)";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Spending" }]} />
      <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "0.25rem" }}>AI Spending & ROI</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "2rem" }}>Track your AI investment and see the value it creates.</p>

      {/* Section 1: KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { icon: "💳", label: "Balance", value: `${data.credits.balance} cr`, sub: `$${(data.credits.balance * data.creditCostRate).toFixed(2)} value`, color: "var(--accent)" },
          { icon: "📊", label: "Total Spent", value: `${data.spending.totalCreditsSpent} cr`, sub: `$${data.spending.totalCostDollars.toFixed(2)}`, color: "#f59e0b" },
          { icon: "💰", label: "Portfolio Value", value: `$${data.portfolio.totalEstimatedValue.toLocaleString()}`, sub: `${data.portfolio.analyzedItems} items analyzed`, color: "#22c55e" },
          { icon: "📈", label: "Overall ROI", value: data.overallRoi.roiPercent != null ? `${data.overallRoi.roiPercent.toLocaleString()}%` : "—", sub: data.overallRoi.roiLabel, color: roiColor },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...CARD }}>
            <div style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>{kpi.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginTop: "0.2rem" }}>{kpi.label}</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Section 2: Spending by Bot */}
      <div style={{ ...CARD, marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>Spending by AI Bot</h2>
        {data.spending.byBot.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No spending yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {data.spending.byBot.map((b) => (
              <div key={b.botName} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", minWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.botName}</span>
                <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "var(--ghost-bg)", overflow: "hidden" }}>
                  <div style={{ width: `${(b.creditsSpent / maxBotSpend) * 100}%`, height: "100%", borderRadius: "4px", background: "linear-gradient(90deg, var(--accent), var(--accent-deep))", transition: "width 0.5s ease" }} />
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", minWidth: "40px", textAlign: "right" }}>{b.creditsSpent} cr</span>
                <span style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 700, minWidth: "50px", textAlign: "right" }}>${b.costDollars.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Top Items */}
      {data.spending.topItems.length > 0 && (
        <div style={{ ...CARD, marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>Top Items by AI Cost</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Item</th>
                  <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Credits</th>
                  <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Cost</th>
                  <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Value</th>
                  <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.spending.topItems.map((item) => {
                  const rc = item.roiPercent != null ? (item.roiPercent > 0 ? "#22c55e" : item.roiPercent > -50 ? "#f59e0b" : "#ef4444") : "var(--text-muted)";
                  return (
                    <tr key={item.itemId} style={{ borderBottom: "1px solid var(--border-default)" }}>
                      <td style={{ padding: "0.5rem" }}>
                        <Link href={`/items/${item.itemId}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>{item.title}</Link>
                      </td>
                      <td style={{ padding: "0.5rem", textAlign: "right", color: "var(--text-secondary)" }}>{item.creditsSpent}</td>
                      <td style={{ padding: "0.5rem", textAlign: "right", color: "var(--text-secondary)" }}>${item.costDollars.toFixed(2)}</td>
                      <td style={{ padding: "0.5rem", textAlign: "right", color: "var(--text-primary)", fontWeight: 600 }}>{item.estimatedValue != null ? `$${item.estimatedValue.toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "0.5rem", textAlign: "right", color: rc, fontWeight: 700 }}>{item.roiPercent != null ? `${item.roiPercent}%` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 4: Recent Activity */}
      <div style={{ ...CARD }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>Recent Activity</h2>
        {data.spending.recentTransactions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No transactions yet.</p>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {data.spending.recentTransactions.map((tx) => (
              <div key={tx.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.5rem 0", borderBottom: "1px solid var(--border-default)", fontSize: "0.78rem",
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{tx.description}</span>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
                <span style={{
                  fontWeight: 700, minWidth: "50px", textAlign: "right",
                  color: tx.amount > 0 ? "#22c55e" : tx.amount < 0 ? "#ef4444" : "var(--text-muted)",
                }}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", minWidth: "40px", textAlign: "right" }}>
                  {tx.balance} cr
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
