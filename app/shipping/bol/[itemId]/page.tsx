import { redirect } from "next/navigation";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Bill of Lading — LegacyLoop" };

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export default async function BolPage({ params }: { params: Promise<{ itemId: string }> }) {
  const user = await authAdapter.getSession();
  if (!user) redirect("/auth/login");

  const { itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      aiResult: true,
      valuation: true,
      photos: { where: { isPrimary: true }, take: 1 },
    },
  });

  if (!item || item.userId !== user.id) redirect("/dashboard");
  if (!item.ltlBolNumber) redirect(`/items/${itemId}`);

  const ai = safeJson(item.aiResult?.rawJson);
  const quote = safeJson(item.ltlQuoteJson);
  const itemName = ai?.item_name || item.title || `Item #${itemId.slice(0, 6)}`;
  const category = ai?.category || "General";
  const material = ai?.material || "N/A";
  const weight = (item as any).shippingWeight || quote?.weight || "N/A";
  const dims = (item as any).shippingLength && (item as any).shippingWidth && (item as any).shippingHeight
    ? `${(item as any).shippingLength} × ${(item as any).shippingWidth} × ${(item as any).shippingHeight} in`
    : "N/A";
  const isFragile = (item as any).isFragile || false;

  const bolStyle = {
    page: {
      maxWidth: "8.5in",
      margin: "0 auto",
      padding: "0.5in",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "10pt",
      color: "#111",
      background: "#fff",
      lineHeight: 1.4,
    } as React.CSSProperties,
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottom: "3px solid #111",
      paddingBottom: "0.25in",
      marginBottom: "0.2in",
    } as React.CSSProperties,
    title: {
      fontSize: "18pt",
      fontWeight: 800,
      letterSpacing: "0.05em",
      textTransform: "uppercase" as const,
    },
    subtitle: {
      fontSize: "8pt",
      color: "#666",
      marginTop: "2px",
    },
    bolNum: {
      fontSize: "14pt",
      fontWeight: 700,
      fontFamily: "monospace",
      textAlign: "right" as const,
    },
    section: {
      marginBottom: "0.15in",
      border: "1px solid #333",
    },
    sectionHeader: {
      background: "#111",
      color: "#fff",
      padding: "4px 8px",
      fontSize: "8pt",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
    },
    sectionBody: {
      padding: "8px",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0",
    },
    cell: {
      padding: "6px 8px",
      borderRight: "1px solid #ddd",
      borderBottom: "1px solid #ddd",
    },
    cellLabel: {
      fontSize: "7pt",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      color: "#666",
      marginBottom: "2px",
    },
    cellValue: {
      fontSize: "10pt",
      fontWeight: 600,
    },
    sigLine: {
      borderBottom: "1px solid #333",
      width: "60%",
      height: "0.3in",
      display: "inline-block",
      verticalAlign: "bottom",
    },
    footer: {
      marginTop: "0.3in",
      borderTop: "2px solid #111",
      paddingTop: "0.1in",
      fontSize: "7pt",
      color: "#666",
      textAlign: "center" as const,
    },
  };

  return (
    <div style={bolStyle.page}>
      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          nav, footer, .no-print { display: none !important; }
          @page { margin: 0.4in; size: letter; }
        }
        @media screen {
          body { background: #e5e5e5; }
        }
      `}</style>

      {/* Header */}
      <div style={bolStyle.header}>
        <div>
          <div style={bolStyle.title}>Bill of Lading</div>
          <div style={bolStyle.subtitle}>LegacyLoop Freight Shipment Document</div>
          <div style={{ fontSize: "8pt", marginTop: "4px" }}>
            Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={bolStyle.bolNum}>{item.ltlBolNumber}</div>
          {item.ltlTrackingNumber && (
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "2px" }}>
              PRO#: <strong>{item.ltlTrackingNumber}</strong>
            </div>
          )}
          <div style={{ fontSize: "8pt", color: "#999", marginTop: "4px" }}>
            Page 1 of 1
          </div>
        </div>
      </div>

      {/* Carrier Info */}
      <div style={bolStyle.section}>
        <div style={bolStyle.sectionHeader}>Carrier Information</div>
        <div style={{ ...bolStyle.grid2, ...bolStyle.sectionBody, padding: 0 }}>
          <div style={bolStyle.cell}>
            <div style={bolStyle.cellLabel}>Carrier Name</div>
            <div style={bolStyle.cellValue}>{item.ltlCarrierName || "TBD"}</div>
          </div>
          <div style={{ ...bolStyle.cell, borderRight: "none" }}>
            <div style={bolStyle.cellLabel}>PRO Number</div>
            <div style={bolStyle.cellValue}>{item.ltlTrackingNumber || "Pending"}</div>
          </div>
          <div style={bolStyle.cell}>
            <div style={bolStyle.cellLabel}>Pickup Date</div>
            <div style={bolStyle.cellValue}>
              {item.ltlPickupDate ? new Date(item.ltlPickupDate).toLocaleDateString() : "TBD"}
            </div>
          </div>
          <div style={{ ...bolStyle.cell, borderRight: "none" }}>
            <div style={bolStyle.cellLabel}>Estimated Delivery</div>
            <div style={bolStyle.cellValue}>
              {item.ltlDeliveryDate ? new Date(item.ltlDeliveryDate).toLocaleDateString() : "TBD"}
            </div>
          </div>
        </div>
      </div>

      {/* Ship From / Ship To */}
      <div style={bolStyle.section}>
        <div style={bolStyle.sectionHeader}>Shipping Addresses</div>
        <div style={{ ...bolStyle.grid2, padding: 0 }}>
          <div style={{ ...bolStyle.cell, borderBottom: "none" }}>
            <div style={bolStyle.cellLabel}>Ship From (Consignor)</div>
            <div style={{ fontSize: "10pt", marginTop: "4px" }}>
              <strong>Seller</strong><br />
              {item.saleZip ? `ZIP: ${item.saleZip}` : "Maine"}
            </div>
          </div>
          <div style={{ ...bolStyle.cell, borderRight: "none", borderBottom: "none" }}>
            <div style={bolStyle.cellLabel}>Ship To (Consignee)</div>
            <div style={{ fontSize: "10pt", marginTop: "4px" }}>
              <strong>Buyer</strong><br />
              {quote?.fromZip ? `Origin ZIP: ${quote.fromZip}` : "See carrier documentation"}
            </div>
          </div>
        </div>
      </div>

      {/* Commodity Description */}
      <div style={bolStyle.section}>
        <div style={bolStyle.sectionHeader}>Commodity Description</div>
        <div style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #ddd", fontWeight: 700 }}>Qty</th>
                <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #ddd", fontWeight: 700 }}>Description</th>
                <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #ddd", fontWeight: 700 }}>Weight (lbs)</th>
                <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #ddd", fontWeight: 700 }}>Dimensions</th>
                <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #ddd", fontWeight: 700 }}>Class</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>1</td>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>
                  <strong>{itemName}</strong>
                  <br />
                  <span style={{ fontSize: "8pt", color: "#666" }}>
                    {category} · {material}
                    {isFragile && " · FRAGILE"}
                  </span>
                </td>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee", fontWeight: 600 }}>{weight}</td>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>{dims}</td>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee" }}>See carrier</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Special Instructions */}
      <div style={bolStyle.section}>
        <div style={bolStyle.sectionHeader}>Special Instructions / Handling</div>
        <div style={bolStyle.sectionBody}>
          <div style={{ minHeight: "0.5in", fontSize: "9pt" }}>
            {isFragile && "FRAGILE — Handle with care. Do not stack. "}
            {material && /glass|ceramic|porcelain|crystal/i.test(material) && "Contains breakable material. "}
            {Number(weight) > 100 && "Heavy item — liftgate required at pickup and delivery. "}
            {!isFragile && Number(weight) <= 100 && "Standard handling."}
          </div>
        </div>
      </div>

      {/* Declared Value */}
      <div style={bolStyle.section}>
        <div style={bolStyle.sectionHeader}>Declared Value</div>
        <div style={{ ...bolStyle.grid2, padding: 0 }}>
          <div style={{ ...bolStyle.cell, borderBottom: "none" }}>
            <div style={bolStyle.cellLabel}>Declared Value</div>
            <div style={bolStyle.cellValue}>
              {item.valuation ? `$${Math.round(item.valuation.high).toLocaleString()}` : "Per carrier liability"}
            </div>
          </div>
          <div style={{ ...bolStyle.cell, borderRight: "none", borderBottom: "none" }}>
            <div style={bolStyle.cellLabel}>Insurance</div>
            <div style={bolStyle.cellValue}>Per carrier standard</div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3in", marginTop: "0.25in" }}>
        <div>
          <div style={{ fontSize: "8pt", fontWeight: 700, textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>Shipper Signature</div>
          <div style={bolStyle.sigLine} />
          <div style={{ fontSize: "7pt", color: "#999", marginTop: "4px" }}>Date: _______________</div>
        </div>
        <div>
          <div style={{ fontSize: "8pt", fontWeight: 700, textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>Carrier Signature</div>
          <div style={bolStyle.sigLine} />
          <div style={{ fontSize: "7pt", color: "#999", marginTop: "4px" }}>Date: _______________</div>
        </div>
      </div>

      {/* Receiver signature */}
      <div style={{ marginTop: "0.2in" }}>
        <div style={{ fontSize: "8pt", fontWeight: 700, textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>Received By (Consignee)</div>
        <div style={bolStyle.sigLine} />
        <div style={{ fontSize: "7pt", color: "#999", marginTop: "4px" }}>Date: _______________</div>
      </div>

      {/* Footer */}
      <div style={bolStyle.footer}>
        <div>LegacyLoop — AI Estate Resale Platform · legacyloopmaine.com</div>
        <div style={{ marginTop: "2px" }}>
          BOL# {item.ltlBolNumber} · Generated {new Date().toISOString().slice(0, 10)} · This document must accompany the shipment
        </div>
      </div>

      {/* Print button (screen only) */}
      <div className="no-print" style={{ textAlign: "center", marginTop: "1rem" }}>
        <button
          onClick={() => { if (typeof window !== "undefined") window.print(); }}
          style={{
            padding: "0.6rem 2rem",
            fontSize: "0.9rem",
            fontWeight: 700,
            borderRadius: "0.5rem",
            border: "none",
            background: "#00bcd4",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Print Bill of Lading
        </button>
      </div>
    </div>
  );
}
