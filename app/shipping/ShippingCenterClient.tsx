"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "preSale" | "readyToShip" | "shipped" | "freight";

type ShipData = {
  preSale: any[];
  readyToShip: any[];
  shipped: any[];
};

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "preSale", label: "Pre-Sale Estimates", icon: "📊" },
  { key: "readyToShip", label: "Ready to Ship", icon: "📦" },
  { key: "shipped", label: "Shipped / Tracking", icon: "🚚" },
  { key: "freight", label: "Large Item / Freight", icon: "🚛" },
];

function StatsBar({ data }: { data: ShipData }) {
  const delivered = data.shipped.filter((s) => s.deliveryStatus === "DELIVERED").length;
  const inTransit = data.shipped.filter((s) => s.deliveryStatus === "IN_TRANSIT").length;
  const stats = [
    { label: "Pre-Sale", value: data.preSale.length, color: "var(--accent)" },
    { label: "Ready to Ship", value: data.readyToShip.length, color: "#ff9800" },
    { label: "In Transit", value: inTransit, color: "#00bcd4" },
    { label: "Delivered", value: delivered, color: "#4caf50" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          background: "var(--bg-card, rgba(255,255,255,0.05))",
          border: "1px solid var(--border-card, rgba(255,255,255,0.08))",
          borderRadius: "1rem",
          padding: "1rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginTop: "0.15rem" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    CREATED: { bg: "rgba(0,188,212,0.15)", color: "#00bcd4" },
    PICKED_UP: { bg: "rgba(0,188,212,0.15)", color: "#00bcd4" },
    IN_TRANSIT: { bg: "rgba(0,188,212,0.2)", color: "#00bcd4" },
    OUT_FOR_DELIVERY: { bg: "rgba(255,152,0,0.15)", color: "#ff9800" },
    DELIVERED: { bg: "rgba(76,175,80,0.15)", color: "#4caf50" },
    EXCEPTION: { bg: "rgba(255,152,0,0.2)", color: "#ff9800" },
  };
  const c = colors[status] || colors.CREATED;
  return (
    <span style={{ padding: "0.15rem 0.55rem", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 700, background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ItemRow({ item, children }: { item: any; children?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: "1rem",
      borderRadius: "0.75rem",
      border: "1px solid var(--border-default, rgba(255,255,255,0.06))",
      background: "rgba(255,255,255,0.02)",
      transition: "border-color 0.15s ease",
    }}>
      {item.photo ? (
        <img src={item.photo} alt="" style={{ width: 48, height: 48, borderRadius: "0.5rem", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/items/${item.id}`} style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)", textDecoration: "none" }}>
          {item.title}
        </Link>
      </div>
      {children}
    </div>
  );
}

/* ─── Pre-Sale Tab ─── */
function PreSaleTab({ items }: { items: any[] }) {
  const [estimating, setEstimating] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<Record<string, any>>({});

  async function getEstimate(itemId: string) {
    setEstimating(itemId);
    try {
      const res = await fetch("/api/shipping/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId }) });
      const data = await res.json();
      if (!data.error) setEstimates((prev) => ({ ...prev, [itemId]: data }));
    } catch { /* ignore */ }
    setEstimating(null);
  }

  if (items.length === 0) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>📊</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>No Items to Estimate</div>
      <div style={{ fontSize: "0.82rem" }}>Upload and analyze items to see shipping estimates here.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {items.map((item) => {
        const est = estimates[item.id];
        return (
          <div key={item.id}>
            <ItemRow item={item}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                {item.valuationLow && item.valuationHigh && (
                  <div style={{ textAlign: "right", marginRight: "0.25rem" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--accent)" }}>${item.valuationLow}–${item.valuationHigh}</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Est. value</div>
                  </div>
                )}
                {est ? (
                  <>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{est.weight} lbs · {est.box.label}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        From ${Math.min(...est.carriers.filter((c: any) => c.price > 0).map((c: any) => c.price)).toFixed(2)}
                        {est.isLTL && " (Freight)"}
                      </div>
                    </div>
                    <button onClick={() => getEstimate(item.id)} disabled={estimating === item.id} style={{ padding: "0.3rem 0.65rem", fontSize: "0.7rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                      {estimating === item.id ? "..." : "Update"}
                    </button>
                  </>
                ) : (
                  <button onClick={() => getEstimate(item.id)} disabled={estimating === item.id} style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "0.5rem", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", cursor: "pointer" }}>
                    {estimating === item.id ? "Estimating..." : "Get Estimate"}
                  </button>
                )}
              </div>
            </ItemRow>
            {est && (
              <div style={{ marginLeft: "4rem", marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {est.carriers.filter((c: any) => c.price > 0).map((c: any) => (
                  <div key={`${c.carrier}-${c.service}`} style={{ padding: "0.4rem 0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-default)", fontSize: "0.72rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.carrier}</span>
                    <span style={{ color: "var(--text-muted)" }}> {c.service} · ${c.price.toFixed(2)} · {c.days}d</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Ready to Ship Tab ─── */
function ReadyToShipTab({ items }: { items: any[] }) {
  const [generating, setGenerating] = useState<string | null>(null);

  async function generateLabel(itemId: string) {
    setGenerating(itemId);
    try {
      await fetch("/api/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, rateId: "mock-1", carrier: "USPS", service: "Priority Mail", weight: 5, deliveryMethod: "STANDARD", estimatedDays: 3, rateAmount: 8.95, fromAddress: { zip: "04101" }, toAddress: { zip: "10001" } }),
      });
      window.location.reload();
    } catch { /* ignore */ }
    setGenerating(null);
  }

  if (items.length === 0) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>📦</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nothing to Ship Yet</div>
      <div style={{ fontSize: "0.82rem" }}>When you sell an item, shipping options will appear here.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            {item.listingPrice && <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: "0.88rem" }}>${item.listingPrice}</span>}
            <button onClick={() => generateLabel(item.id)} disabled={generating === item.id} className="btn-primary" style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem" }}>
              {generating === item.id ? "Generating..." : "Generate Label"}
            </button>
          </div>
        </ItemRow>
      ))}
    </div>
  );
}

/* ─── Shipped Tab ─── */
function ShippedTab({ items }: { items: any[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copyTracking(tn: string) {
    navigator.clipboard.writeText(tn);
    setCopied(tn);
    setTimeout(() => setCopied(null), 2000);
  }

  if (items.length === 0) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>🚚</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>No Shipments Yet</div>
      <div style={{ fontSize: "0.82rem" }}>Your shipped items and tracking details will show up here.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {items.map((item) => (
        <ItemRow key={item.id} item={item}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.carrier}</div>
              <button onClick={() => copyTracking(item.trackingNumber)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: copied === item.trackingNumber ? "#4caf50" : "var(--accent)", fontFamily: "monospace" }}>
                {item.trackingNumber?.slice(0, 16)}... {copied === item.trackingNumber ? "✓" : "Copy"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
              <StatusBadge status={item.deliveryStatus} />
              {item.shipDate && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Shipped {item.shipDate}</span>}
              {item.estimatedDays && item.shipDate && item.deliveryStatus !== "DELIVERED" && (
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  Est. delivery ~{new Date(new Date(item.shipDate).getTime() + item.estimatedDays * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
              {item.rate && <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>${item.rate.toFixed(2)}</span>}
            </div>
          </div>
        </ItemRow>
      ))}
    </div>
  );
}

/* ─── Freight Tab ─── */
function FreightTab() {
  const [form, setForm] = useState({ weight: "", length: "48", width: "40", height: "36", fromZip: "04101", toZip: "", accessNotes: "", packaging: "palletized" });
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [pickupDate, setPickupDate] = useState("");

  async function getQuote() {
    setLoading(true);
    try {
      const res = await fetch("/api/shipping/freight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quote", ...form, weight: Number(form.weight) }),
      });
      const data = await res.json();
      if (!data.error) setQuote(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function schedulePickup(carrier: string) {
    if (!pickupDate) return;
    setScheduling(true);
    try {
      const res = await fetch("/api/shipping/freight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", carrier, pickupDate }),
      });
      const data = await res.json();
      if (data.confirmed) setConfirmation(data);
    } catch { /* ignore */ }
    setScheduling(false);
  }

  const inputStyle = { padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-default, rgba(255,255,255,0.1))", background: "var(--bg-input, rgba(255,255,255,0.05))", color: "var(--text-primary, #e7e5e4)", fontSize: "0.85rem", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ background: "rgba(156,39,176,0.06)", border: "1px solid rgba(156,39,176,0.15)", borderRadius: "1rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "1.5rem" }}>🚛</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#ce93d8" }}>LTL Freight Shipping</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>For furniture, appliances, and large antiques over 40 lbs.</div>
        </div>
      </div>

      {/* Dimensions form */}
      <div style={{ background: "var(--bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "1rem" }}>Item Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Length (in)</label>
            <input value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Width (in)</label>
            <input value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Height (in)</label>
            <input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Weight (lbs)</label>
            <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 85" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>From ZIP</label>
            <input value={form.fromZip} onChange={(e) => setForm({ ...form, fromZip: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>To ZIP</label>
            <input value={form.toZip} onChange={(e) => setForm({ ...form, toZip: e.target.value })} placeholder="Buyer ZIP" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Packaging</label>
            <select value={form.packaging} onChange={(e) => setForm({ ...form, packaging: e.target.value })} style={inputStyle}>
              <option value="palletized">Palletized</option>
              <option value="crated">Crated</option>
              <option value="blanket">Blanket Wrap</option>
              <option value="none">None / Needs packaging</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Access Notes</label>
            <input value={form.accessNotes} onChange={(e) => setForm({ ...form, accessNotes: e.target.value })} placeholder="Ground floor, stairs, etc." style={inputStyle} />
          </div>
        </div>
        <button onClick={getQuote} disabled={loading || !form.weight || !form.toZip} className="btn-primary" style={{ marginTop: "1rem", padding: "0.55rem 1.5rem", fontSize: "0.85rem" }}>
          {loading ? "Getting Quote..." : "Request Freight Quote"}
        </button>
      </div>

      {/* Quote results */}
      {quote && (
        <div style={{ background: "var(--bg-card, rgba(255,255,255,0.05))", border: "1px solid var(--border-card)", borderRadius: "1.25rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Freight Class</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--accent)" }}>{quote.freightClass}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Density</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>{quote.density} lbs/ft³</div>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>Volume</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>{quote.cubicFeet} ft³</div>
            </div>
          </div>

          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Carrier Options</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {quote.carriers.map((c: any) => (
              <div key={c.carrier} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border-default)", background: "rgba(255,255,255,0.02)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{c.carrier}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.service} · {c.transit}{c.guaranteed ? " · Guaranteed" : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent)" }}>${c.price.toFixed(2)}</span>
                  <button onClick={() => schedulePickup(c.carrier)} disabled={scheduling || !pickupDate} style={{ padding: "0.3rem 0.65rem", fontSize: "0.72rem", fontWeight: 600, borderRadius: "0.4rem", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", cursor: "pointer" }}>
                    Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>Pickup Date</label>
            <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
          </div>
        </div>
      )}

      {/* Confirmation */}
      {confirmation && (
        <div style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#4caf50", marginBottom: "0.5rem" }}>Pickup Scheduled</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong>Confirmation:</strong> {confirmation.confirmationNumber}<br />
            <strong>Carrier:</strong> {confirmation.carrier}<br />
            <strong>Pickup:</strong> {confirmation.pickupDate} ({confirmation.pickupWindow})<br />
            <strong>Est. Delivery:</strong> {confirmation.estimatedDelivery}<br />
            <em style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{confirmation.instructions}</em>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function ShippingCenterClient() {
  const [tab, setTab] = useState<Tab>("preSale");
  const [data, setData] = useState<ShipData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shipping/center")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "0.65rem",
              border: tab === t.key ? "1.5px solid var(--accent)" : "1px solid var(--border-default, rgba(255,255,255,0.08))",
              background: tab === t.key ? "rgba(0,188,212,0.1)" : "transparent",
              color: tab === t.key ? "var(--accent)" : "var(--text-muted)",
              fontSize: "0.82rem",
              fontWeight: tab === t.key ? 600 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>{t.icon}</span> {t.label}
            {t.key !== "freight" && data && (
              <span style={{ fontSize: "0.68rem", opacity: 0.7 }}>
                ({data[t.key as keyof ShipData]?.length ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      {data && <StatsBar data={data} />}

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "0.75rem", border: "1px solid var(--border-default, rgba(255,255,255,0.06))", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)" }} className="skeleton" />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: "60%", background: "rgba(255,255,255,0.06)", borderRadius: "0.25rem", marginBottom: "0.4rem" }} className="skeleton" />
                <div style={{ height: 10, width: "35%", background: "rgba(255,255,255,0.04)", borderRadius: "0.25rem" }} className="skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>⚠️</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Could Not Load Shipping Data</div>
          <div style={{ fontSize: "0.82rem" }}>Please try refreshing the page. If the problem persists, contact support.</div>
        </div>
      ) : (
        <>
          {tab === "preSale" && <PreSaleTab items={data?.preSale ?? []} />}
          {tab === "readyToShip" && <ReadyToShipTab items={data?.readyToShip ?? []} />}
          {tab === "shipped" && <ShippedTab items={data?.shipped ?? []} />}
          {tab === "freight" && <FreightTab />}
        </>
      )}
    </div>
  );
}
