"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════
   Receipt Page — Professional, printable, Anthropic-quality receipts
   Supports: credit, payment, earning, shipping transaction types
   ═══════════════════════════════════════════════════════════════════════ */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function receiptNumber(id: string, date: string): string {
  const d = new Date(date);
  const prefix = `LL-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const suffix = id.slice(-6).toUpperCase();
  return `${prefix}-${suffix}`;
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "auto";
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/receipts/${id}?type=${type}`);
        const d = await res.json();
        if (res.ok) setData(d);
        else setError(d.error || "Receipt not found");
      } catch { setError("Failed to load receipt"); }
      setLoading(false);
    }
    load();
  }, [id, type]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "var(--font-body), -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ fontSize: "14px", color: "#94a3b8" }}>Loading receipt...</div>
    </div>
  );

  if (error || !data) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "var(--font-body), -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>Receipt Not Found</div>
        <div style={{ fontSize: "14px", color: "#94a3b8" }}>{error}</div>
        <a href="/credits" style={{ display: "inline-block", marginTop: "20px", fontSize: "13px", color: "#00bcd4", textDecoration: "none", fontWeight: 600 }}>Back to Account</a>
      </div>
    </div>
  );

  const rn = receiptNumber(data.id, data.date);

  return (
    <>
      <style>{`
        @media print {
          .receipt-actions { display: none !important; }
          .receipt-container { box-shadow: none !important; border: none !important; }
          body { background: #fff !important; }
        }
        @page { margin: 0.75in; }
      `}</style>

      <div style={{
        minHeight: "100vh", padding: "32px 16px",
        background: "#f8fafc",
        fontFamily: "var(--font-body), -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        {/* ── Action Buttons ── */}
        <div className="receipt-actions" style={{
          maxWidth: "620px", margin: "0 auto 20px", display: "flex", gap: "10px", justifyContent: "flex-end",
        }}>
          <button onClick={() => window.print()} style={{
            padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
            background: "#fff", border: "1px solid #e2e8f0", color: "#475569", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ fontSize: "15px" }}>🖨️</span> Print
          </button>
          <button onClick={() => window.print()} style={{
            padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 700,
            background: "#1e293b", border: "none", color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ fontSize: "15px" }}>⬇️</span> Download PDF
          </button>
        </div>

        {/* ── Receipt Card ── */}
        <div className="receipt-container" style={{
          maxWidth: "620px", margin: "0 auto", background: "#fff",
          borderRadius: "12px", border: "1px solid #e2e8f0",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: "28px 32px 24px", borderBottom: "1px solid #f1f5f9",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: "linear-gradient(135deg, #00bcd4, #009688)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "18px", color: "#fff", fontWeight: 800,
                }}>L</div>
                <span style={{ fontSize: "17px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.02em" }}>LegacyLoop</span>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", lineHeight: 1.5 }}>
                AI-Powered Estate Resale Platform<br />
                legacy-loop.com
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                color: data.status === "completed" || data.status === "available" || data.type === "purchase" ? "#16a34a" : data.status === "refunded" ? "#dc2626" : "#f59e0b",
                padding: "3px 10px", borderRadius: "20px",
                background: data.status === "completed" || data.status === "available" || data.type === "purchase" ? "rgba(22,163,74,0.08)" : data.status === "refunded" ? "rgba(220,38,38,0.08)" : "rgba(245,158,11,0.08)",
                border: `1px solid ${data.status === "completed" || data.status === "available" || data.type === "purchase" ? "rgba(22,163,74,0.2)" : data.status === "refunded" ? "rgba(220,38,38,0.2)" : "rgba(245,158,11,0.2)"}`,
                display: "inline-block",
              }}>
                {data.status === "completed" || data.status === "available" || data.type === "purchase" || data.type === "spend" || data.type === "bonus"
                  ? "Paid" : data.status === "refunded" ? "Refunded" : data.status || "Processed"}
              </div>
            </div>
          </div>

          {/* ── Amount ── */}
          <div style={{ padding: "24px 32px", textAlign: "center", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "6px" }}>
              {data.receiptType === "credit" ? (data.type === "purchase" ? "Amount Paid" : data.type === "spend" ? "Credits Used" : "Credits") :
               data.receiptType === "earning" ? "Net Earnings" :
               data.receiptType === "shipping" ? "Shipping Cost" : "Total Charged"}
            </div>
            <div style={{ fontSize: "38px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
              {data.receiptType === "credit"
                ? (data.paymentAmount ? formatCurrency(data.paymentAmount) : `${Math.abs(data.amount)} cr`)
                : data.receiptType === "earning" ? formatCurrency(data.netEarnings)
                : data.receiptType === "shipping" ? formatCurrency(data.rate)
                : formatCurrency(data.totalCharged)}
            </div>
          </div>

          {/* ── Details ── */}
          <div style={{ padding: "20px 32px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <DetailRow label="Receipt number" value={rn} />
                <DetailRow label="Date" value={formatDate(data.date)} />
                {data.user?.name && <DetailRow label="Customer" value={data.user.name} />}
                {data.user?.email && <DetailRow label="Email" value={data.user.email} />}
                <DetailRow label="Description" value={data.description} />

                {/* Type-specific details */}
                {data.receiptType === "credit" && data.type === "purchase" && (
                  <>
                    <DetailRow label="Credits added" value={`+${data.amount} credits`} />
                    <DetailRow label="Credit balance" value={`${data.balance} credits`} />
                  </>
                )}
                {data.receiptType === "credit" && data.type === "spend" && (
                  <>
                    <DetailRow label="Credits used" value={`${Math.abs(data.amount)} credits`} />
                    {data.itemId && <DetailRow label="Item ID" value={data.itemId} />}
                    <DetailRow label="Balance after" value={`${data.balance} credits`} />
                  </>
                )}
                {data.receiptType === "payment" && (
                  <>
                    <DetailRow label="Subtotal" value={formatCurrency(data.subtotal)} />
                    <DetailRow label="Processing fee (3.5%)" value={formatCurrency(data.processingFee)} />
                    <DetailRow label="Total charged" value={formatCurrency(data.totalCharged)} bold />
                    {data.squarePaymentId && <DetailRow label="Payment ID" value={data.squarePaymentId} mono />}
                    {data.metadata?.creditCount && <DetailRow label="Credits" value={`+${data.metadata.creditCount} credits`} />}
                    {data.metadata?.tierName && <DetailRow label="Plan" value={data.metadata.tierName} />}
                  </>
                )}
                {data.receiptType === "earning" && (
                  <>
                    <DetailRow label="Sale amount" value={formatCurrency(data.saleAmount)} />
                    <DetailRow label={`Commission (${Math.round(data.commissionRate * 100)}%)`} value={`-${formatCurrency(data.commissionAmount)}`} />
                    <DetailRow label="Net earnings" value={formatCurrency(data.netEarnings)} bold />
                    <DetailRow label="Payout status" value={data.status === "paid_out" ? `Paid out ${data.paidOutAt ? formatDate(data.paidOutAt) : ""}` : data.status} />
                  </>
                )}
                {data.receiptType === "shipping" && (
                  <>
                    <DetailRow label="Carrier" value={data.carrier} />
                    <DetailRow label="Service" value={data.service} />
                    <DetailRow label="Tracking" value={data.trackingNumber || "Pending"} mono />
                    {data.itemTitle && <DetailRow label="Item" value={data.itemTitle} />}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Line Items (for payments) ── */}
          {data.receiptType === "payment" && (
            <div style={{ padding: "0 32px 20px" }}>
              <div style={{ borderRadius: "8px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#94a3b8", textAlign: "left" }}>Item</th>
                      <th style={{ padding: "8px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#94a3b8", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#1e293b", borderTop: "1px solid #f1f5f9" }}>{data.description}</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", color: "#1e293b", textAlign: "right", fontVariantNumeric: "tabular-nums", borderTop: "1px solid #f1f5f9" }}>{formatCurrency(data.subtotal)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 12px", fontSize: "12px", color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>Processing fee</td>
                      <td style={{ padding: "8px 12px", fontSize: "12px", color: "#94a3b8", textAlign: "right", fontVariantNumeric: "tabular-nums", borderTop: "1px solid #f1f5f9" }}>{formatCurrency(data.processingFee)}</td>
                    </tr>
                    <tr style={{ background: "#f8fafc" }}>
                      <td style={{ padding: "10px 12px", fontSize: "13px", fontWeight: 700, color: "#1e293b", borderTop: "1px solid #e2e8f0" }}>Total</td>
                      <td style={{ padding: "10px 12px", fontSize: "13px", fontWeight: 700, color: "#1e293b", textAlign: "right", fontVariantNumeric: "tabular-nums", borderTop: "1px solid #e2e8f0" }}>{formatCurrency(data.totalCharged)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{
            padding: "16px 32px", borderTop: "1px solid #f1f5f9",
            background: "#fafbfc", textAlign: "center",
          }}>
            <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.6 }}>
              Thank you for using LegacyLoop.<br />
              Questions? Contact support@legacy-loop.com
            </div>
            <div style={{ fontSize: "9px", color: "#cbd5e1", marginTop: "8px" }}>
              LegacyLoop Tech LLC &middot; legacy-loop.com &middot; Receipt {rn}
            </div>
          </div>
        </div>

        {/* ── Back Link ── */}
        <div className="receipt-actions" style={{ maxWidth: "620px", margin: "20px auto 0", textAlign: "center" }}>
          <a href="/credits" style={{ fontSize: "13px", color: "#00bcd4", textDecoration: "none", fontWeight: 600 }}>
            &larr; Back to Account
          </a>
        </div>
      </div>
    </>
  );
}

/* ── Detail Row Component ── */
function DetailRow({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <tr>
      <td style={{ padding: "8px 0", fontSize: "13px", color: "#64748b", borderBottom: "1px solid #f8fafc", verticalAlign: "top", width: "40%" }}>{label}</td>
      <td style={{
        padding: "8px 0", fontSize: "13px", borderBottom: "1px solid #f8fafc",
        color: bold ? "#1e293b" : "#475569",
        fontWeight: bold ? 700 : 500,
        fontFamily: mono ? "'SF Mono', 'Fira Code', monospace" : "inherit",
        textAlign: "right", wordBreak: "break-all" as const,
      }}>{value}</td>
    </tr>
  );
}
