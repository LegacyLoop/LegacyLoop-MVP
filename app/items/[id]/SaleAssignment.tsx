"use client";

import { useState, useEffect, useCallback } from "react";

interface Sale {
  id: string;
  name: string;
  type: string;
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  ESTATE_SALE: "Estate Sale",
  GARAGE_SALE: "Garage Sale",
  MOVING_SALE: "Moving Sale",
  YARD_SALE: "Yard Sale",
  DOWNSIZING: "Downsizing",
  ONLINE_SALE: "Online Sale",
};

export default function SaleAssignment({ itemId, initialProjectId }: { itemId: string; initialProjectId: string | null }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedSaleId, setAssignedSaleId] = useState<string | null>(initialProjectId);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      setSales(Array.isArray(data) ? data.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type || "ESTATE_SALE",
        status: p.status || "DRAFT",
      })) : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const assignedSale = sales.find((s) => s.id === assignedSaleId);

  async function assignToSale(saleId: string) {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addItemId: itemId }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      setAssignedSaleId(saleId);
      setShowSelector(false);
    } catch (e: any) {
      setError(e.message || "Failed to assign item to sale");
    } finally {
      setActionLoading(false);
    }
  }

  async function removeFromSale() {
    if (!assignedSaleId) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${assignedSaleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeItemId: itemId }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      setAssignedSaleId(null);
      setShowSelector(false);
    } catch (e: any) {
      setError(e.message || "Failed to remove item from sale");
    } finally {
      setActionLoading(false);
    }
  }

  const typeLabel = (type: string) => TYPE_LABELS[type] || type.replace(/_/g, " ");

  // Loading state
  if (loading) {
    return (
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "0.75rem",
        padding: "1rem 1.25rem",
        marginTop: 0,
      }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          🏷️ Sale Assignment
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>Loading sales...</div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "0.75rem",
      padding: "1rem 1.25rem",
      marginTop: 0,
    }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.6rem" }}>
        🏷️ Sale Assignment
      </div>

      {error && (
        <div style={{
          fontSize: "0.75rem",
          color: "#ef4444",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: "0.5rem",
          padding: "0.5rem 0.75rem",
          marginBottom: "0.6rem",
        }}>
          {error}
        </div>
      )}

      {/* STATE B — Assigned to a sale */}
      {assignedSale && !showSelector ? (
        <div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "20px",
            background: "rgba(0,188,212,0.1)",
            border: "1px solid rgba(0,188,212,0.25)",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "rgba(0,188,212,0.95)",
          }}>
            ✓ {assignedSale.name} · {typeLabel(assignedSale.type)}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
            <button
              onClick={() => setShowSelector(true)}
              disabled={actionLoading}
              style={{
                padding: "8px 14px",
                minHeight: "48px",
                fontSize: "0.78rem",
                fontWeight: 600,
                borderRadius: "0.5rem",
                border: "1px solid var(--border-default)",
                background: "var(--ghost-bg)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                flex: 1,
              }}
            >
              Move to Different Sale
            </button>
            <button
              onClick={removeFromSale}
              disabled={actionLoading}
              style={{
                padding: "8px 14px",
                minHeight: "48px",
                fontSize: "0.78rem",
                fontWeight: 600,
                borderRadius: "0.5rem",
                border: "1px solid rgba(239,68,68,0.2)",
                background: "transparent",
                color: "#ef4444",
                cursor: actionLoading ? "wait" : "pointer",
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              {actionLoading ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      ) : sales.length === 0 ? (
        /* STATE D — No sales exist */
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            No active sales. Create a sale first.
          </div>
          <a
            href="/projects"
            style={{
              display: "inline-block",
              marginTop: "0.5rem",
              padding: "8px 16px",
              minHeight: "48px",
              lineHeight: "32px",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderRadius: "0.5rem",
              background: "rgba(0,188,212,0.12)",
              color: "var(--accent)",
              border: "1px solid rgba(0,188,212,0.25)",
              textDecoration: "none",
            }}
          >
            Go to Sales →
          </a>
        </div>
      ) : (
        /* STATE A — Select a sale */
        <div>
          {showSelector && assignedSale && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Currently in: <span style={{ color: "var(--accent)" }}>{assignedSale.name}</span> — select a new sale below:
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {sales.map((sale) => (
              <button
                key={sale.id}
                onClick={() => assignToSale(sale.id)}
                disabled={actionLoading || sale.id === assignedSaleId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "10px 14px",
                  minHeight: "48px",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  borderRadius: "0.6rem",
                  border: sale.id === assignedSaleId
                    ? "1px solid rgba(0,188,212,0.3)"
                    : "1px solid var(--border-default)",
                  background: sale.id === assignedSaleId
                    ? "rgba(0,188,212,0.08)"
                    : "var(--bg-card)",
                  color: sale.id === assignedSaleId
                    ? "var(--accent)"
                    : "var(--text-primary)",
                  cursor: actionLoading || sale.id === assignedSaleId ? "default" : "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                  textAlign: "left" as const,
                }}
              >
                <span style={{ flex: 1 }}>
                  {sale.name}
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "6px" }}>
                    {typeLabel(sale.type)}
                  </span>
                </span>
                {sale.id === assignedSaleId && (
                  <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 700 }}>Current</span>
                )}
              </button>
            ))}
          </div>
          {showSelector && (
            <button
              onClick={() => setShowSelector(false)}
              style={{
                marginTop: "0.5rem",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 500,
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
