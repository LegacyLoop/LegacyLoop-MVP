"use client";

type Props = {
  saleMethod: string;
  itemId: string;
};

export default function SaleCongratsBar({ saleMethod, itemId }: Props) {
  const isOnline = saleMethod === "ONLINE_SHIPPING" || saleMethod === "BOTH";
  const isLocal = saleMethod === "LOCAL_PICKUP";

  const scrollToShipping = () => {
    const el = document.getElementById("shipping-panel");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderRadius: "0.75rem",
        background: "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(16,185,129,0.08))",
        border: "1px solid rgba(22,163,74,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: "var(--success-text)", fontSize: "0.95rem" }}>
          Congratulations! This item is sold!
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
          {isLocal
            ? "Complete the pickup process below — schedule the meetup and confirm the handoff."
            : isOnline
            ? "Time to ship it to the buyer. Complete the shipping flow below."
            : "Choose how to fulfill this sale — ship it, schedule a pickup, or arrange freight."}
        </div>
      </div>
      <div>
        <button
          onClick={scrollToShipping}
          className="btn-primary"
          style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
        >
          {isLocal ? "🤝 Start Pickup →" : isOnline ? "📦 Ship Now →" : "Complete Sale →"}
        </button>
      </div>
    </div>
  );
}
