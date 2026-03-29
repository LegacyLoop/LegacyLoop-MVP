"use client";
import { useState, useEffect } from "react";

export default function ReturnRequestClient({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/refunds/return/${token}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d); else setError(d.error || "Return request not found"); })
      .catch(() => setError("Failed to load return details"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1117" }}>
      <div style={{ textAlign: "center", color: "#e2e8f0" }}>
        <div style={{ width: "2rem", height: "2rem", border: "3px solid rgba(0,188,212,0.2)", borderTopColor: "#00bcd4", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 1rem" }} />
        <div style={{ fontSize: "0.85rem" }}>Loading return details...</div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1117" }}>
      <div style={{ maxWidth: 420, padding: "2rem", background: "#161b22", borderRadius: "1rem", border: "1px solid rgba(0,188,212,0.15)", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>❌</div>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.5rem" }}>Return Not Found</div>
        <p style={{ fontSize: "0.82rem", color: "#8b949e", lineHeight: 1.5 }}>{error || "This return link may have expired or is invalid."}</p>
      </div>
    </div>
  );

  const statusColors: Record<string, string> = { PENDING: "#f59e0b", APPROVED: "#22c55e", DENIED: "#ef4444" };
  const statusLabels: Record<string, string> = { PENDING: "Pending Review", APPROVED: "Approved", DENIED: "Denied" };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", padding: "2rem 1rem", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 500, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📦</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#e2e8f0" }}>Return Request</div>
          <div style={{ fontSize: "0.72rem", color: "#8b949e", marginTop: "0.25rem" }}>LegacyLoop Buyer Protection</div>
        </div>

        {/* Item Card */}
        <div style={{ background: "#161b22", borderRadius: "0.75rem", border: "1px solid rgba(0,188,212,0.15)", padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {data.itemPhoto && <img src={data.itemPhoto} alt="" style={{ width: 60, height: 60, borderRadius: "0.5rem", objectFit: "cover" }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e2e8f0" }}>{data.itemTitle}</div>
              <div style={{ fontSize: "0.68rem", color: "#8b949e", marginTop: "0.15rem" }}>
                Purchased for ${data.saleAmount} · {data.daysSinceSale} days ago
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ background: "#161b22", borderRadius: "0.75rem", border: "1px solid rgba(0,188,212,0.15)", padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", fontWeight: 700 }}>Return Status</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: statusColors[data.status] || "#8b949e" }}>{statusLabels[data.status] || data.status}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", fontWeight: 700 }}>Refund Amount</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#00bcd4" }}>${data.refundAmount}</div>
              <div style={{ fontSize: "0.55rem", color: "#8b949e" }}>Processing fee (${data.processingFee}) non-refundable</div>
            </div>
          </div>

          {/* Return Timeline */}
          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ position: "relative", paddingLeft: "1rem" }}>
              <div style={{ position: "absolute", left: "3px", top: 0, bottom: 0, width: "2px", background: "rgba(255,255,255,0.1)" }} />
              {[
                { label: "Return Requested", done: true, color: "#00bcd4" },
                { label: "Seller Review", done: data.status !== "PENDING", color: data.status === "APPROVED" ? "#22c55e" : data.status === "DENIED" ? "#ef4444" : "#f59e0b" },
                { label: data.status === "APPROVED" ? "Approved" : data.status === "DENIED" ? "Denied" : "Awaiting Response", done: data.status !== "PENDING", color: data.status === "APPROVED" ? "#22c55e" : data.status === "DENIED" ? "#ef4444" : "#8b949e" },
              ].map((step, i) => (
                <div key={i} style={{ position: "relative", marginBottom: "0.5rem", paddingLeft: "0.75rem" }}>
                  <div style={{ position: "absolute", left: "-1rem", top: "0.15rem", width: 8, height: 8, borderRadius: "50%", background: step.done ? step.color : "rgba(255,255,255,0.15)" }} />
                  <span style={{ fontSize: "0.68rem", color: step.done ? "#e2e8f0" : "#8b949e", fontWeight: step.done ? 600 : 400 }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div style={{ background: "#161b22", borderRadius: "0.75rem", border: "1px solid rgba(0,188,212,0.15)", padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", fontWeight: 700, marginBottom: "0.3rem" }}>Reason</div>
          <div style={{ fontSize: "0.78rem", color: "#e2e8f0", marginBottom: "0.5rem" }}>{data.reason}</div>
          {data.description && (
            <>
              <div style={{ fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", fontWeight: 700, marginBottom: "0.2rem" }}>Details</div>
              <div style={{ fontSize: "0.72rem", color: "#8b949e", lineHeight: 1.5 }}>{data.description}</div>
            </>
          )}
          {data.status === "DENIED" && data.denyReason && (
            <div style={{ marginTop: "0.5rem", padding: "0.5rem", borderRadius: "0.4rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#ef4444" }}>Denial Reason</div>
              <div style={{ fontSize: "0.72rem", color: "#e2e8f0", marginTop: "0.15rem" }}>{data.denyReason}</div>
            </div>
          )}
          {data.status === "APPROVED" && (
            <div style={{ marginTop: "0.5rem", padding: "0.5rem", borderRadius: "0.4rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#22c55e" }}>Return Approved</div>
              <div style={{ fontSize: "0.72rem", color: "#e2e8f0", marginTop: "0.15rem" }}>Your refund of ${data.refundAmount} will be processed. Ship the item back to the seller using a tracked shipping method.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "0.62rem", color: "#484f58", lineHeight: 1.5 }}>
          14-day return window · Processing fee non-refundable · Seller responds within 48 hours
          <br />LegacyLoop.com
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
