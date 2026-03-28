"use client";

import { useState, useEffect, useCallback } from "react";

interface Sale {
  id: string;
  name: string;
  type: string;
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  ESTATE_SALE: "Estate",
  GARAGE_SALE: "Garage",
  MOVING_SALE: "Moving",
  YARD_SALE: "Yard",
  DOWNSIZING: "Downsize",
  ONLINE_SALE: "Online",
};

export default function SaleAssignment({ itemId, initialProjectId }: { itemId: string; initialProjectId: string | null }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedSaleId, setAssignedSaleId] = useState<string | null>(initialProjectId);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function assignToSale(saleId: string) {
    if (!saleId) return;
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
    } catch (e: any) {
      setError(e.message || "Failed");
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
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  const typeLabel = (type: string) => TYPE_LABELS[type] || type.replace(/_/g, " ");

  if (loading) {
    return <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>...</span>;
  }

  if (sales.length === 0) {
    return (
      <a href="/projects" style={{ fontSize: "0.6rem", color: "var(--accent)", textDecoration: "none" }}>
        + Create Sale
      </a>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
      <select
        value={assignedSaleId || ""}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            removeFromSale();
          } else {
            assignToSale(val);
          }
        }}
        disabled={actionLoading}
        style={{
          background: "var(--ghost-bg)",
          border: "1px solid var(--border-default)",
          borderRadius: "0.3rem",
          padding: "0.15rem 0.3rem",
          paddingRight: "1.2rem",
          color: assignedSaleId ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: "0.62rem",
          fontWeight: 500,
          cursor: actionLoading ? "wait" : "pointer",
          outline: "none",
          maxWidth: "160px",
          appearance: "auto" as any,
          opacity: actionLoading ? 0.6 : 1,
        }}
      >
        <option value="">No sale</option>
        {sales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({typeLabel(s.type)})
          </option>
        ))}
      </select>
      {error && <span style={{ fontSize: "0.52rem", color: "#ef4444" }}>{error}</span>}
    </div>
  );
}
