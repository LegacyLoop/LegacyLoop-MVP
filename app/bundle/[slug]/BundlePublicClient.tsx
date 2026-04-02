"use client";

import { useState } from "react";
import Link from "next/link";

/* ──────────────────────────────────────────────────────────────────────────────
   BundlePublicClient — Premium public bundle page
   Shown to buyers. No auth required.
   All inline style={{}} — no Tailwind.
   ────────────────────────────────────────────────────────────────────────────── */

const TEAL = "var(--accent)";
const TEAL_DIM = "var(--accent-dim)";
const GLASS = "var(--ghost-bg)";
const GLASS_BORDER = "var(--border-default)";
const TEXT_PRIMARY = "var(--text-primary)";
const TEXT_SECONDARY = "var(--text-secondary)";
const TEXT_MUTED = "var(--text-muted)";
const BG_PAGE = "var(--bg-body)";
const SUCCESS_GREEN = "#4caf50";

interface BundleItem {
  id: string;
  title: string;
  category: string;
  condition: string;
  price: number;
  photo: string | null;
  description: string;
  era: string | null;
  material: string | null;
  brand: string | null;
  isAntique: boolean;
}

interface BundleData {
  id: string;
  slug: string;
  title: string;
  description: string;
  bundleType: string;
  bundlePrice: number;
  allowOffers: boolean;
  createdAt: string;
  items: BundleItem[];
  seller: { id: string; name: string } | null;
}

function getDiscountColor(pct: number): string {
  if (pct >= 30) return "#f44336";
  if (pct >= 20) return "#ff9800";
  if (pct >= 10) return SUCCESS_GREEN;
  return "#00bcd4"; // brand teal — must be hex for template literal usage
}

export default function BundlePublicClient({ bundle }: { bundle: BundleData }) {
  const [copied, setCopied] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState(0);
  const [offerSent, setOfferSent] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const individualTotal = bundle.items.reduce((s, i) => s + (i.price || 0), 0);
  const discountPercent =
    individualTotal > 0
      ? Math.round(((individualTotal - bundle.bundlePrice) / individualTotal) * 100)
      : 0;
  const savings = individualTotal - bundle.bundlePrice;
  const discountColor = getDiscountColor(discountPercent);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function sendContact() {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    try {
      // Post to conversations API (no auth needed for buyers)
      await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: bundle.items[0]?.id,
          senderName: contactName.trim(),
          senderEmail: contactEmail.trim(),
          message: `[Bundle Inquiry: ${bundle.title}] ${contactMessage.trim()}`,
        }),
      });
      setContactSent(true);
    } catch {
      alert("Failed to send message. Please try again.");
    }
  }

  async function sendOffer() {
    if (offerAmount <= 0) return;
    try {
      await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: bundle.items[0]?.id,
          senderName: contactName.trim() || "Bundle Buyer",
          senderEmail: contactEmail.trim() || "",
          message: `[Bundle Offer: ${bundle.title}] I'd like to offer $${offerAmount.toLocaleString()} for this ${bundle.items.length}-item bundle (listed at $${bundle.bundlePrice.toLocaleString()}).`,
        }),
      });
      setOfferSent(true);
    } catch {
      alert("Failed to send offer. Please try again.");
    }
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{`
        .bundle-layout { display: grid; grid-template-columns: 1fr 380px; gap: 32px; align-items: start; }
        .bundle-sidebar { position: sticky; top: 80px; }
        @media (max-width: 768px) {
          .bundle-layout { grid-template-columns: 1fr; }
          .bundle-sidebar { position: static !important; }
        }
      `}</style>
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</a>
        <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>/</span>
        <a href="/bundles" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Bundles</a>
        <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>/</span>
        <span style={{ color: "var(--text-primary)" }}>{bundle.title}</span>
      </div>

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={selectedPhoto}
            alt=""
            loading="lazy"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }}
          />
        </div>
      )}

      {/* Hero section with photo grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px 0" }}>
        {/* Photo grid hero */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: bundle.items.length >= 4 ? "2fr 1fr 1fr" : bundle.items.length >= 2 ? "1fr 1fr" : "1fr",
            gridTemplateRows: bundle.items.length >= 4 ? "1fr 1fr" : "auto",
            gap: 4,
            borderRadius: 18,
            overflow: "hidden",
            maxHeight: 420,
          }}
        >
          {bundle.items.slice(0, 5).map((item, i) => {
            const isHero = i === 0 && bundle.items.length >= 4;
            return (
              <div
                key={item.id}
                onClick={() => item.photo && setSelectedPhoto(item.photo)}
                style={{
                  gridRow: isHero ? "1 / 3" : "auto",
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: item.photo ? "zoom-in" : "default",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: isHero ? 0 : 180,
                }}
              >
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt={item.title}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 40, opacity: 0.2 }}>{"\uD83D\uDDBC"}</span>
                )}
                {/* Overlay label */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    padding: "20px 12px 8px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                    {item.title}
                  </div>
                </div>
              </div>
            );
          })}
          {bundle.items.length > 5 && (
            <div
              style={{
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: TEXT_PRIMARY }}>
                +{bundle.items.length - 5}
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>more items</div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px 80px" }}>
        <div className="bundle-layout">
          {/* Left column: Bundle details */}
          <div>
            {/* Title + seller */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    background: "var(--accent-dim)",
                    color: TEAL,
                    border: "1px solid var(--accent-border)",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {bundle.bundleType === "FULL_SALE"
                    ? "Full Estate Sale"
                    : bundle.bundleType === "CATEGORY"
                    ? "Category Bundle"
                    : "Custom Bundle"}
                </span>
                {bundle.items.some((i) => i.isAntique) && (
                  <span
                    style={{
                      background: "rgba(255,152,0,0.15)",
                      color: "#ff9800",
                      border: "1px solid rgba(255,152,0,0.3)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Contains Antiques
                  </span>
                )}
              </div>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: TEXT_PRIMARY,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {bundle.title}
              </h1>
              {bundle.seller && (
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 8 }}>
                  Sold by{" "}
                  <Link
                    href={`/store/${bundle.seller.id}`}
                    style={{ color: TEAL, textDecoration: "none", fontWeight: 600 }}
                  >
                    {bundle.seller.name}
                  </Link>
                  {" \u00B7 "}
                  {bundle.items.length} items
                  {" \u00B7 "}
                  Listed {new Date(bundle.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Description */}
            {bundle.description && (
              <div
                style={{
                  background: GLASS,
                  border: `1px solid ${GLASS_BORDER}`,
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.7 }}>
                  {bundle.description}
                </div>
              </div>
            )}

            {/* Price comparison banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(0,188,212,0.07), rgba(0,188,212,0.04))",
                border: "1px solid var(--accent-border)",
                borderRadius: 14,
                padding: 24,
                marginBottom: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  Bundle Deal
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: TEAL }}>
                    ${bundle.bundlePrice.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: TEXT_MUTED,
                      textDecoration: "line-through",
                    }}
                  >
                    ${individualTotal.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>
                  You save ${savings.toLocaleString()} buying as a bundle
                </div>
              </div>
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${discountColor}22, ${discountColor}44)`,
                  border: `3px solid ${discountColor}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 30px ${discountColor}25`,
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: discountColor, lineHeight: 1 }}>
                  {discountPercent}%
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: discountColor, letterSpacing: 2, textTransform: "uppercase" }}>
                  OFF
                </div>
              </div>
            </div>

            {/* Items grid */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 16 }}>
                What{"'"}s Included ({bundle.items.length} items)
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                {bundle.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: GLASS,
                      border: `1px solid ${GLASS_BORDER}`,
                      borderRadius: 14,
                      overflow: "hidden",
                      transition: "border-color 0.2s",
                    }}
                  >
                    {/* Photo */}
                    <div
                      onClick={() => item.photo && setSelectedPhoto(item.photo)}
                      style={{
                        width: "100%",
                        height: 160,
                        background: "rgba(0,0,0,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        cursor: item.photo ? "zoom-in" : "default",
                        position: "relative",
                      }}
                    >
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.title}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: 36, opacity: 0.2 }}>{"\uD83D\uDDBC"}</span>
                      )}
                      {item.isAntique && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            background: "rgba(255,152,0,0.9)",
                            color: "#fff",
                            borderRadius: 4,
                            padding: "2px 8px",
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Antique
                        </div>
                      )}
                    </div>

                    {/* Item info */}
                    <div style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: TEXT_PRIMARY,
                          marginBottom: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </div>

                      {/* Chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                        <span
                          style={{
                            background: "var(--ghost-bg)",
                            color: TEXT_MUTED,
                            borderRadius: 4,
                            padding: "2px 7px",
                            fontSize: 10,
                          }}
                        >
                          {item.category}
                        </span>
                        {item.condition && (
                          <span
                            style={{
                              background: "var(--ghost-bg)",
                              color: TEXT_MUTED,
                              borderRadius: 4,
                              padding: "2px 7px",
                              fontSize: 10,
                            }}
                          >
                            {item.condition}
                          </span>
                        )}
                        {item.era && (
                          <span
                            style={{
                              background: "var(--ghost-bg)",
                              color: TEXT_MUTED,
                              borderRadius: 4,
                              padding: "2px 7px",
                              fontSize: 10,
                            }}
                          >
                            {item.era}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_MUTED, textDecoration: "line-through" }}>
                          ${(item.price || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 10, color: TEAL, fontWeight: 600 }}>
                          Included in bundle
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share section */}
            <div
              style={{
                background: GLASS,
                border: `1px solid ${GLASS_BORDER}`,
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 12 }}>
                Share This Bundle
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={copyLink}
                  style={{
                    background: copied ? `${SUCCESS_GREEN}22` : TEAL_DIM,
                    color: copied ? SUCCESS_GREEN : TEAL,
                    border: `1px solid ${copied ? `${SUCCESS_GREEN}44` : "var(--accent-border)"}`,
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {copied ? "Link Copied!" : "Copy Link"}
                </button>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#1877f222",
                    color: "#1877f2",
                    border: "1px solid #1877f244",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(bundle.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#1da1f222",
                    color: "#1da1f2",
                    border: "1px solid #1da1f244",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Twitter
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(bundle.title)}&body=${encodeURIComponent(`Check out this bundle sale: ${shareUrl}`)}`}
                  style={{
                    background: "#ff980022",
                    color: "#ff9800",
                    border: "1px solid #ff980044",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Email
                </a>
              </div>
            </div>
          </div>

          {/* Right column: Sticky purchase panel */}
          <div className="bundle-sidebar">
            <div
              style={{
                background: GLASS,
                border: `1px solid ${GLASS_BORDER}`,
                borderRadius: 18,
                padding: 28,
              }}
            >
              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: TEAL }}>
                    ${bundle.bundlePrice.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 15, color: TEXT_MUTED, textDecoration: "line-through" }}>
                    ${individualTotal.toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    background: `${discountColor}22`,
                    color: discountColor,
                    border: `1px solid ${discountColor}44`,
                    borderRadius: 6,
                    padding: "4px 12px",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  Save {discountPercent}% ({`$${savings.toLocaleString()}`})
                </div>
              </div>

              {/* Item count */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>{"\uD83D\uDCE6"}</span>
                <span style={{ fontSize: 13, color: TEXT_SECONDARY }}>
                  {bundle.items.length} items included in this bundle
                </span>
              </div>

              {/* CTA buttons */}
              <button
                onClick={() => {
                  // In demo, scroll to contact or open message
                  setShowContact(true);
                  setShowOffer(false);
                }}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #00bcd4, #0097a7)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 0",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 10,
                  boxShadow: "0 4px 20px var(--accent-glow)",
                  transition: "transform 0.15s",
                }}
              >
                Buy Complete Bundle
              </button>

              {bundle.allowOffers && (
                <button
                  onClick={() => {
                    setShowOffer(true);
                    setShowContact(false);
                  }}
                  style={{
                    width: "100%",
                    background: GLASS,
                    color: TEAL,
                    border: "1px solid var(--accent-border)",
                    borderRadius: 12,
                    padding: "12px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: 10,
                    transition: "background 0.2s",
                  }}
                >
                  Make an Offer
                </button>
              )}

              <button
                onClick={() => {
                  setShowContact(true);
                  setShowOffer(false);
                }}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: TEXT_SECONDARY,
                  border: `1px solid ${GLASS_BORDER}`,
                  borderRadius: 12,
                  padding: "12px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                Message Seller
              </button>

              {/* Trust badges */}
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: `1px solid ${GLASS_BORDER}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[
                  { icon: "\uD83D\uDD12", text: "Secure transaction" },
                  { icon: "\uD83D\uDCF8", text: "AI-verified photos" },
                  { icon: "\uD83D\uDCB0", text: "Fair pricing guaranteed" },
                ].map((badge) => (
                  <div
                    key={badge.text}
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: TEXT_MUTED }}
                  >
                    <span style={{ fontSize: 13 }}>{badge.icon}</span>
                    {badge.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Seller card */}
            {bundle.seller && (
              <div
                style={{
                  background: GLASS,
                  border: `1px solid ${GLASS_BORDER}`,
                  borderRadius: 14,
                  padding: 20,
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: TEAL_DIM,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: TEAL,
                    flexShrink: 0,
                  }}
                >
                  {bundle.seller.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>
                    {bundle.seller.name}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>Seller on LegacyLoop</div>
                </div>
                <Link
                  href={`/store/${bundle.seller.id}`}
                  style={{ fontSize: 11, fontWeight: 600, color: TEAL, textDecoration: "none" }}
                >
                  View Store
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Contact modal */}
        {showContact && !contactSent && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowContact(false); }}
          >
            <div
              style={{
                background: "var(--bg-card-solid)",
                border: `1px solid ${GLASS_BORDER}`,
                borderRadius: 18,
                padding: 32,
                maxWidth: 440,
                width: "100%",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: "0 0 4px" }}>
                Contact Seller
              </h3>
              <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 20 }}>
                About: {bundle.title}
              </p>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: TEXT_PRIMARY,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Your Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: TEXT_PRIMARY,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Message
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: TEXT_PRIMARY,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                  placeholder="I'm interested in this bundle..."
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowContact(false)}
                  style={{
                    flex: 1,
                    background: GLASS,
                    color: TEXT_SECONDARY,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 10,
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendContact}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #00bcd4, #0097a7)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact sent confirmation */}
        {showContact && contactSent && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => { setShowContact(false); setContactSent(false); }}
          >
            <div
              style={{
                background: "var(--bg-card-solid)",
                border: `1px solid ${GLASS_BORDER}`,
                borderRadius: 18,
                padding: 40,
                maxWidth: 400,
                width: "100%",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2709\uFE0F"}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: "0 0 8px" }}>
                Message Sent!
              </h3>
              <p style={{ fontSize: 13, color: TEXT_SECONDARY }}>
                The seller will receive your message and get back to you soon.
              </p>
            </div>
          </div>
        )}

        {/* Offer modal */}
        {showOffer && !offerSent && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowOffer(false); }}
          >
            <div
              style={{
                background: "var(--bg-card-solid)",
                border: `1px solid ${GLASS_BORDER}`,
                borderRadius: 18,
                padding: 32,
                maxWidth: 440,
                width: "100%",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: "0 0 4px" }}>
                Make an Offer
              </h3>
              <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 20 }}>
                Bundle price: ${bundle.bundlePrice.toLocaleString()} &middot; {bundle.items.length} items
              </p>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: TEXT_PRIMARY,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Your Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: TEXT_PRIMARY,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4 }}>
                  Your Offer
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: TEXT_MUTED }}>$</span>
                  <input
                    type="number"
                    value={offerAmount || ""}
                    onChange={(e) => setOfferAmount(Math.max(0, Number(e.target.value)))}
                    style={{
                      flex: 1,
                      background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${GLASS_BORDER}`,
                      borderRadius: 8,
                      padding: "12px 14px",
                      fontSize: 20,
                      fontWeight: 700,
                      color: TEAL,
                      outline: "none",
                    }}
                    placeholder="0"
                    min={0}
                  />
                </div>
                {offerAmount > 0 && offerAmount < bundle.bundlePrice && (
                  <div style={{ fontSize: 11, color: "#ff9800", marginTop: 6 }}>
                    {Math.round(((bundle.bundlePrice - offerAmount) / bundle.bundlePrice) * 100)}% below asking price
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowOffer(false)}
                  style={{
                    flex: 1,
                    background: GLASS,
                    color: TEXT_SECONDARY,
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 10,
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={sendOffer}
                  disabled={offerAmount <= 0}
                  style={{
                    flex: 1,
                    background: offerAmount > 0 ? "linear-gradient(135deg, #00bcd4, #0097a7)" : "var(--ghost-bg)",
                    color: offerAmount > 0 ? "#fff" : TEXT_MUTED,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: offerAmount > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  Submit Offer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Offer sent confirmation */}
        {showOffer && offerSent && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => { setShowOffer(false); setOfferSent(false); }}
          >
            <div
              style={{
                background: "var(--bg-card-solid)",
                border: `1px solid ${GLASS_BORDER}`,
                borderRadius: 18,
                padding: 40,
                maxWidth: 400,
                width: "100%",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83D\uDCB0"}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: "0 0 8px" }}>
                Offer Submitted!
              </h3>
              <p style={{ fontSize: 13, color: TEXT_SECONDARY }}>
                Your offer of ${offerAmount.toLocaleString()} has been sent to the seller.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer trust bar */}
      <div
        style={{
          borderTop: `1px solid ${GLASS_BORDER}`,
          padding: "20px 16px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 11, color: TEXT_MUTED }}>
          Powered by LegacyLoop &middot; AI-Verified Estate Sales &middot; Secure Transactions
        </div>
      </div>
    </div>
  );
}
