"use client";

import { useState, useEffect } from "react";
import { PROCESSING_FEE } from "@/lib/constants/pricing";

function AccordionHeader({
  id, icon, title, subtitle, isOpen, onToggle, accentColor, badge,
}: {
  id: string; icon: string; title: string; subtitle?: string;
  isOpen: boolean; onToggle: (id: string) => void;
  accentColor?: string; badge?: string;
}) {
  return (
    <button
      onClick={() => onToggle(id)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", background: isOpen ? "rgba(0,188,212,0.02)" : "transparent",
        border: "none", borderBottom: isOpen ? "1px solid var(--border-default)" : "1px solid transparent",
        padding: "0.65rem 0.5rem", cursor: "pointer", transition: "all 0.2s ease",
        borderRadius: isOpen ? "0.4rem 0.4rem 0 0" : "0.4rem", minHeight: "40px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontSize: "1rem" }}>{icon}</span>
        <span style={{
          fontSize: "0.65rem", fontWeight: 700,
          color: accentColor || "var(--text-secondary)",
          letterSpacing: "0.05em", textTransform: "uppercase" as const,
        }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: "0.5rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px",
            background: `${accentColor || "#00bcd4"}18`, color: accentColor || "#00bcd4",
          }}>{badge}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        {subtitle && !isOpen && (
          <span style={{
            fontSize: "0.55rem", color: "var(--text-muted)", maxWidth: "200px",
            overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap" as const, fontWeight: 500,
          }}>{subtitle}</span>
        )}
        <span style={{
          fontSize: "0.55rem", color: "var(--text-muted)",
          transition: "transform 0.25s ease",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "22px", height: "22px", borderRadius: "50%",
          background: isOpen ? "rgba(0,188,212,0.08)" : "transparent",
        }}>▼</span>
      </div>
    </button>
  );
}

interface CarBotPickupData {
  viewing_location?: string;
  safety_tips?: string[];
  payment_methods?: string;
  title_transfer_checklist?: string[];
  state_specific_notes?: string;
  test_drive_tips?: string[];
}

interface Props {
  itemId: string;
  saleZip: string | null;
  saleRadius: number;
  isVehicle?: boolean;
  itemWeight?: number;
  isFragile?: boolean;
  isAntique?: boolean;
  itemDimensions?: string | null;
  listingPrice?: number;
  carBotPickup?: CarBotPickupData | null;
}

const RADIUS_OPTIONS = [10, 25, 50, 100];
const TIME_SLOTS = [
  { label: "Morning", detail: "8 AM – 12 PM" },
  { label: "Afternoon", detail: "12 PM – 5 PM" },
  { label: "Evening", detail: "5 PM – 8 PM" },
  { label: "Flexible", detail: "Any time works" },
];

const LOCATION_OPTIONS = [
  { key: "my_location", icon: "📍", label: "My location", desc: "City-level only until confirmed" },
  { key: "police_station", icon: "🏛️", label: "Police station / public safety", desc: "Safest option" },
  { key: "bank", icon: "🏦", label: "Bank parking lot", desc: "Public and secure" },
  { key: "coffee_shop", icon: "☕", label: "Coffee shop / restaurant", desc: "Casual and public" },
  { key: "post_office", icon: "📬", label: "Post office", desc: "Public building" },
  { key: "other", icon: "📍", label: "Other public place", desc: "Specify below" },
];

const CONTACT_OPTIONS = [
  { key: "in_app", icon: "💬", label: "In-app message", desc: "Safest — keeps communication in our system" },
  { key: "text", icon: "📱", label: "Text message", desc: "Phone masked until both confirm" },
  { key: "email", icon: "📧", label: "Email", desc: "Email masked until both confirm" },
];

const PAYMENT_OPTIONS = [
  { key: "legacyloop", icon: "💳", label: "Through LegacyLoop", desc: "Secure buyer protection", recommended: true },
  { key: "cash", icon: "💵", label: "Cash at meetup", desc: "No buyer protection" },
  { key: "venmo", icon: "💳", label: "Venmo/Zelle at meetup", desc: "Direct transfer" },
  { key: "decide_later", icon: "🤝", label: "Decide when we meet", desc: "Discuss at pickup" },
];

export default function LocalPickupPanel({
  itemId, saleZip, saleRadius, isVehicle, itemWeight, isFragile, isAntique, itemDimensions, listingPrice, carBotPickup: carBotPickupProp,
}: Props) {
  const [fetchedPickup, setFetchedPickup] = useState<CarBotPickupData | null>(null);

  // Self-fetch CarBot pickup data when isVehicle and no prop provided
  useEffect(() => {
    if (!isVehicle || carBotPickupProp) return;
    fetch(`/api/bots/carbot/${itemId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const pickup = d?.result?.local_pickup_plan || d?.result?.pickup_plan || null;
        if (pickup) setFetchedPickup(pickup);
      })
      .catch(() => null);
  }, [itemId, isVehicle, carBotPickupProp]);

  const carBotPickup = carBotPickupProp || fetchedPickup;
  const [selectedRadius, setSelectedRadius] = useState(saleRadius || 25);
  const [pickupDate, setPickupDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [location, setLocation] = useState(isVehicle ? "my_location" : "");
  const [otherLocation, setOtherLocation] = useState("");
  const [contactMethod, setContactMethod] = useState("in_app");
  const [paymentMethod, setPaymentMethod] = useState(isVehicle ? "legacyloop" : "legacyloop");
  const [testDrive, setTestDrive] = useState(false);
  const [titleReady, setTitleReady] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [sending, setSending] = useState(false);
  // Precision location
  const [preciseAddress, setPreciseAddress] = useState("");
  const [preciseMapLink, setPreciseMapLink] = useState("");
  const [precisionSpot, setPrecisionSpot] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationSubSpot, setLocationSubSpot] = useState("");
  // Payment sub-options
  const [denomPref, setDenomPref] = useState("Any");
  const [venmoService, setVenmoService] = useState("");
  const [venmoHandle, setVenmoHandle] = useState("");
  const [venmoTiming, setVenmoTiming] = useState("");
  // Contact sub-options
  const [contactPhone, setContactPhone] = useState("");
  const [contactTimePref, setContactTimePref] = useState("");
  const [contactEmailAddr, setContactEmailAddr] = useState("");
  const [contactResponseTime, setContactResponseTime] = useState("");
  const [contactNotifyPref, setContactNotifyPref] = useState("");
  const [useDiffEmail, setUseDiffEmail] = useState(false);

  const [openPickupSections, setOpenPickupSections] = useState<Set<string>>(
    new Set(["pickup-location"])
  );
  const togglePickupSection = (id: string) => {
    setOpenPickupSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSlot = (detail: string) => {
    setSelectedSlots((prev) =>
      prev.includes(detail) ? prev.filter((s) => s !== detail) : prev.length < 3 ? [...prev, detail] : prev
    );
  };

  const [pickupError, setPickupError] = useState<string | null>(null);

  const sendInvite = async () => {
    setSending(true);
    setPickupError(null);
    try {
      const res = await fetch(`/api/shipping/pickup/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set",
          status: "INVITE_SENT",
          location: JSON.stringify({
            type: location,
            name: locationName || location,
            address: preciseAddress,
            mapLink: preciseMapLink,
            spot: precisionSpot || locationSubSpot,
          }),
          notes: instructions,
          timeSlots: JSON.stringify(selectedSlots),
          contactMethod,
          paymentMethod,
          radius: selectedRadius,
          scheduledDate: pickupDate,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setPickupError(data.error);
      } else {
        setInviteSent(true);
      }
    } catch {
      setPickupError("Failed to send pickup invite. Please try again.");
    }
    setSending(false);
  };

  const header = isVehicle ? "🚗 Vehicle Pickup" : "🤝 Local Pickup — Schedule a Meetup";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {header}
      </div>

      {/* Item handling notes from AI */}
      {(itemWeight || isFragile || isAntique || itemDimensions) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.5rem 0.65rem", borderRadius: "0.5rem", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", fontSize: "0.85rem" }}>
          {itemWeight != null && itemWeight > 30 && (
            <div style={{ color: "var(--warning-text, #b45309)" }}>⚠️ This item weighs approximately {itemWeight} lbs. Buyer may need help loading.</div>
          )}
          {isFragile && (
            <div style={{ color: "var(--warning-text, #b45309)" }}>⚠️ Fragile item — bring padding or blankets for transport</div>
          )}
          {itemDimensions && (
            <div style={{ color: "var(--text-secondary)" }}>📏 Item dimensions: approximately {itemDimensions}. Make sure your vehicle can fit it.</div>
          )}
          {isAntique && (
            <div style={{ color: "var(--text-secondary)" }}>🏛️ Antique item — handle with extra care</div>
          )}
        </div>
      )}

      {/* Expand All / Collapse All */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.25rem" }}>
        <button
          onClick={() => {
            const allIds = ["pickup-location", "pickup-time", "pickup-contact", "pickup-payment", "pickup-notes"];
            setOpenPickupSections(prev => prev.size >= allIds.length ? new Set() : new Set(allIds));
          }}
          style={{
            fontSize: "0.5rem", fontWeight: 600, color: "var(--text-muted)",
            background: "transparent", border: "none", cursor: "pointer",
            padding: "0.2rem 0.4rem", borderRadius: "0.25rem",
          }}
        >
          {openPickupSections.size >= 5 ? "▲ Collapse All" : "▼ Expand All"}
        </button>
      </div>

      {/* Section 1: Meetup Location */}
      <AccordionHeader
        id="pickup-location"
        icon="📍"
        title="MEETUP LOCATION"
        subtitle={locationName || "Choose a safe location"}
        isOpen={openPickupSections.has("pickup-location")}
        onToggle={togglePickupSection}
        accentColor="#00bcd4"
      />
      {openPickupSections.has("pickup-location") && (
      <div style={{ padding: "0.5rem 0" }}>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Meetup Location
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {LOCATION_OPTIONS.map((opt) => (
            <div key={opt.key}>
              <label
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.6rem",
                  borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem",
                  border: `1px solid ${location === opt.key ? "var(--accent)" : "var(--border-default)"}`,
                  background: location === opt.key ? "rgba(0,188,212,0.06)" : "transparent",
                }}
              >
                <input type="radio" name="location" checked={location === opt.key} onChange={() => setLocation(opt.key)} style={{ accentColor: "var(--accent)" }} />
                <span>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: location === opt.key ? "var(--accent)" : "var(--text-primary)", fontWeight: 500 }}>{opt.label}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: "0.4rem", fontSize: "0.7rem" }}>— {opt.desc}</span>
                </div>
              </label>
              {location === "my_location" && opt.key === "my_location" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(0,188,212,0.04)", border: "1px solid rgba(0,188,212,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Choose how to specify your location:</div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📍 Enter address or intersection</label>
                    <input type="text" placeholder="e.g. 123 Main St, Waterville ME or Main & Elm" value={preciseAddress} onChange={e => setPreciseAddress(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                    <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "0.25rem" }}>🔒 Exact address only shared with confirmed buyer</div>
                  </div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>🗺️ Or drop a pin on Google Maps</label>
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "8px", padding: "0.45rem 0.85rem", color: "#00bcd4", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>📍 Open Google Maps — drop a pin and paste the link below</a>
                    <input type="text" placeholder="Paste Google Maps link here..." value={preciseMapLink} onChange={e => setPreciseMapLink(e.target.value)} style={{ width: "100%", marginTop: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>📝 Precise meetup instructions</label>
                    <input type="text" placeholder="e.g. I'll be parked in the blue truck near the entrance" value={precisionSpot} onChange={e => setPrecisionSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              )}
              {location === "police_station" && opt.key === "police_station" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>🚔 Find a police station near you:</div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a href={`https://www.google.com/maps/search/police+station+near+${saleZip || ""}`} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "0.5rem 0.85rem", color: "#10b981", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>🔍 Find Nearby →</a>
                  </div>
                  <input type="text" placeholder="Station name or address (e.g. Waterville Police Dept, 9 Colby St)" value={locationName} onChange={e => setLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  <input type="text" placeholder="Precise spot (e.g. visitor parking lot, front entrance)" value={locationSubSpot} onChange={e => setLocationSubSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  <div style={{ color: "rgba(16,185,129,0.7)", fontSize: "0.7rem" }}>✓ Safest option — many departments offer exchange programs</div>
                </div>
              )}
              {location === "bank" && opt.key === "bank" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>🏦 Find a bank near you:</div>
                  <a href={`https://www.google.com/maps/search/bank+near+${saleZip || ""}`} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "flex-start", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "0.5rem 0.85rem", color: "#10b981", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none" }}>🔍 Find Nearby Banks →</a>
                  <input type="text" placeholder="Bank name (e.g. TD Bank, 15 Elm St)" value={locationName} onChange={e => setLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  <input type="text" placeholder="Which entrance or section of parking lot?" value={locationSubSpot} onChange={e => setLocationSubSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}
              {location === "coffee_shop" && opt.key === "coffee_shop" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>☕ Find a coffee shop or restaurant near you:</div>
                  <a href={`https://www.google.com/maps/search/coffee+shop+near+${saleZip || ""}`} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "flex-start", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "0.5rem 0.85rem", color: "#10b981", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none" }}>🔍 Find Nearby →</a>
                  <input type="text" placeholder="Name of coffee shop or restaurant" value={locationName} onChange={e => setLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  <input type="text" placeholder="Where to meet — inside? outside? which table?" value={locationSubSpot} onChange={e => setLocationSubSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}
              {location === "post_office" && opt.key === "post_office" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>📬 Find a post office near you:</div>
                  <a href={`https://www.google.com/maps/search/post+office+near+${saleZip || ""}`} target="_blank" rel="noopener noreferrer" style={{ alignSelf: "flex-start", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "0.5rem 0.85rem", color: "#10b981", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none" }}>🔍 Find Nearby USPS →</a>
                  <input type="text" placeholder="Post office address" value={locationName} onChange={e => setLocationName(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  <input type="text" placeholder="Where to meet (e.g. parking lot, front entrance)" value={locationSubSpot} onChange={e => setLocationSubSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}
              {location === "other" && opt.key === "other" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <input type="text" placeholder="Name of the meetup place" value={otherLocation} onChange={e => setOtherLocation(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  <input type="text" placeholder="Address" value={preciseAddress} onChange={e => setPreciseAddress(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  <div>
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(0,188,212,0.08)", border: "1px solid rgba(0,188,212,0.25)", borderRadius: "8px", padding: "0.45rem 0.85rem", color: "#00bcd4", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}>📍 Open Google Maps — drop a pin and paste the link</a>
                    <input type="text" placeholder="Paste Google Maps link here..." value={preciseMapLink} onChange={e => setPreciseMapLink(e.target.value)} style={{ width: "100%", marginTop: "0.4rem", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <input type="text" placeholder="Precise meetup instructions" value={precisionSpot} onChange={e => setPrecisionSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.35rem", fontStyle: "italic" }}>
          💡 We recommend public meetup spots for safety
        </div>
        {location && (
          <div style={{ marginTop: "0.75rem", padding: "0.85rem", background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "10px" }}>
            <div style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.4rem" }}>📌 Precision Meetup Point</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginBottom: "0.55rem" }}>Give the buyer a precise spot so there&apos;s no confusion — &quot;north entrance&quot;, &quot;blue Honda&quot;, &quot;table by the window&quot;</div>
            <input type="text" placeholder="e.g. I'll be in the blue truck at the north end of the parking lot" value={precisionSpot} onChange={e => setPrecisionSpot(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
      </div>

      {/* Radius selector */}
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.4rem" }}>Pickup Radius</div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRadius(r)}
              style={{
                padding: "0.4rem 0.75rem", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem",
                fontWeight: selectedRadius === r ? 600 : 400,
                border: selectedRadius === r ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                background: selectedRadius === r ? "rgba(0,188,212,0.08)" : "transparent",
                color: selectedRadius === r ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              {r} mi — {r <= 10 ? "Neighborhood" : r <= 25 ? "City" : r <= 50 ? "Regional" : "Extended"}
            </button>
          ))}
        </div>
        {saleZip && (
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>Centered around ZIP: {saleZip}</div>
        )}
      </div>
      </div>
      )}

      {/* Section 2: Time & Availability */}
      <AccordionHeader
        id="pickup-time"
        icon="🕐"
        title="TIME & AVAILABILITY"
        subtitle="Schedule pickup windows"
        isOpen={openPickupSections.has("pickup-time")}
        onToggle={togglePickupSection}
      />
      {openPickupSections.has("pickup-time") && (
      <div style={{ padding: "0.5rem 0" }}>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Availability <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 400 }}>(select up to 3 time slots)</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
          <input
            type="date"
            className="input"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            style={{ fontSize: "0.85rem", width: "auto" }}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {TIME_SLOTS.map((slot) => {
            const active = selectedSlots.includes(slot.detail);
            return (
              <button
                key={slot.label}
                onClick={() => toggleSlot(slot.detail)}
                style={{
                  padding: "0.35rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem", cursor: "pointer",
                  fontWeight: active ? 600 : 400,
                  border: active ? "1.5px solid var(--accent)" : "1px solid var(--border-default)",
                  background: active ? "rgba(0,188,212,0.08)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                {slot.label} <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>({slot.detail})</span>
              </button>
            );
          })}
        </div>
      </div>
      </div>
      )}

      {/* Section 3: Contact Information */}
      <AccordionHeader
        id="pickup-contact"
        icon="📱"
        title="CONTACT INFORMATION"
        subtitle="How the buyer reaches you"
        isOpen={openPickupSections.has("pickup-contact")}
        onToggle={togglePickupSection}
      />
      {openPickupSections.has("pickup-contact") && (
      <div style={{ padding: "0.5rem 0" }}>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          How should the buyer reach you?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {CONTACT_OPTIONS.map((opt) => (
            <div key={opt.key}>
              <label
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.5rem",
                  borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem",
                  border: `1px solid ${contactMethod === opt.key ? "var(--accent)" : "var(--border-default)"}`,
                  background: contactMethod === opt.key ? "rgba(0,188,212,0.06)" : "transparent",
                }}
              >
                <input type="radio" name="contact" checked={contactMethod === opt.key} onChange={() => setContactMethod(opt.key)} style={{ accentColor: "var(--accent)" }} />
                <span>{opt.icon} {opt.label}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "auto" }}>{opt.desc}</span>
              </label>
              {contactMethod === "in_app" && opt.key === "in_app" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(0,188,212,0.05)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <div style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.85rem" }}>💬 In-App Messaging</div>
                  <div style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "0.65rem" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginBottom: "0.4rem", textAlign: "center" }}>Message thread preview</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <div style={{ alignSelf: "flex-end", background: "rgba(0,188,212,0.15)", borderRadius: "10px 10px 2px 10px", padding: "0.35rem 0.65rem", maxWidth: "80%" }}>
                        <span style={{ color: "var(--text-primary)", fontSize: "0.72rem" }}>Hi! Ready to schedule pickup?</span>
                      </div>
                      <div style={{ alignSelf: "flex-start", background: "var(--ghost-bg)", borderRadius: "10px 10px 10px 2px", padding: "0.35rem 0.65rem", maxWidth: "80%" }}>
                        <span style={{ color: "var(--text-primary)", fontSize: "0.72rem" }}>Yes! How&apos;s Thursday afternoon?</span>
                      </div>
                    </div>
                  </div>
                  {["✓ Identity verified — both parties are LegacyLoop users", "✓ Messages logged for dispute resolution", "✓ No personal info shared until both confirm", "✓ Notifications via app and email", "✓ Message history saved with your transaction"].map(f => (
                    <div key={f} style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>{f}</div>
                  ))}
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginBottom: "0.35rem" }}>Notify me when buyer messages via:</div>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      {["App notification", "Email", "Both"].map(opt => (
                        <button key={opt} onClick={() => setContactNotifyPref(opt)} type="button" style={{ background: contactNotifyPref === opt ? "rgba(0,188,212,0.15)" : "rgba(0,188,212,0.06)", border: `1px solid ${contactNotifyPref === opt ? "rgba(0,188,212,0.4)" : "rgba(0,188,212,0.15)"}`, borderRadius: "20px", padding: "0.2rem 0.55rem", color: "#00bcd4", fontSize: "0.7rem", cursor: "pointer" }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {contactMethod === "text" && opt.key === "text" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <div style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>📱 Text Message Setup</div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Your phone number for this transaction</label>
                    <input type="tel" placeholder="(207) 555-0000" value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: "8px", padding: "0.55rem" }}>
                    <div style={{ color: "#10b981", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.35rem" }}>🔒 How we protect your number</div>
                    {["Your number is masked until both parties confirm the meetup", "Buyer sees only the last 4 digits until confirmation", "Full number revealed only after mutual confirmation", "Number is never stored in buyer's LegacyLoop profile"].map(s => (
                      <div key={s} style={{ color: "var(--text-secondary)", fontSize: "0.7rem", marginBottom: "0.15rem" }}>• {s}</div>
                    ))}
                  </div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 600, display: "block", marginBottom: "0.35rem" }}>Best time to text you</label>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {["Anytime", "Morning", "Afternoon", "Evening"].map(t => (
                        <button key={t} onClick={() => setContactTimePref(t)} type="button" style={{ background: contactTimePref === t ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.06)", border: `1px solid ${contactTimePref === t ? "rgba(16,185,129,0.35)" : "rgba(16,185,129,0.15)"}`, borderRadius: "20px", padding: "0.2rem 0.55rem", color: "#10b981", fontSize: "0.7rem", cursor: "pointer" }}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {contactMethod === "email" && opt.key === "email" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <div style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "0.85rem" }}>📧 Email Contact Setup</div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Email address to use for this transaction</label>
                    <input type="email" placeholder="your@email.com" value={contactEmailAddr} onChange={e => setContactEmailAddr(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                    <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "0.25rem" }}>🔒 Shown as r****@****.com until both parties confirm</div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={useDiffEmail} onChange={e => setUseDiffEmail(e.target.checked)} style={{ accentColor: "#8b5cf6" }} />
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Use a different email than my account email</span>
                  </label>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginBottom: "0.35rem" }}>Typical response time:</div>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      {["Within 1hr", "Same day", "Within 24hrs"].map(t => (
                        <button key={t} onClick={() => setContactResponseTime(t)} type="button" style={{ background: contactResponseTime === t ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.06)", border: `1px solid ${contactResponseTime === t ? "rgba(139,92,246,0.35)" : "rgba(139,92,246,0.15)"}`, borderRadius: "20px", padding: "0.2rem 0.55rem", color: "#8b5cf6", fontSize: "0.7rem", cursor: "pointer" }}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Your contact info is shared only after both parties confirm the meetup
        </div>
      </div>
      </div>
      )}

      {/* Section 4: Payment Method */}
      <AccordionHeader
        id="pickup-payment"
        icon="💳"
        title="PAYMENT METHOD"
        subtitle="How you get paid"
        isOpen={openPickupSections.has("pickup-payment")}
        onToggle={togglePickupSection}
      />
      {openPickupSections.has("pickup-payment") && (
      <div style={{ padding: "0.5rem 0" }}>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          How do you want to get paid?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {PAYMENT_OPTIONS.map((opt) => (
            <div key={opt.key}>
              <label
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.5rem",
                  borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.85rem",
                  border: `1px solid ${paymentMethod === opt.key ? "var(--accent)" : "var(--border-default)"}`,
                  background: paymentMethod === opt.key ? "rgba(0,188,212,0.06)" : "transparent",
                }}
              >
                <input type="radio" name="payment" checked={paymentMethod === opt.key} onChange={() => setPaymentMethod(opt.key)} style={{ accentColor: "var(--accent)" }} />
                <span>{opt.icon} {opt.label}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginLeft: "auto" }}>{opt.desc}</span>
                {opt.recommended && <span style={{ fontSize: "0.58rem", fontWeight: 700, background: "rgba(0,188,212,0.12)", color: "var(--accent)", padding: "0.1rem 0.3rem", borderRadius: "9999px" }}>Recommended</span>}
              </label>
              {paymentMethod === "legacyloop" && opt.key === "legacyloop" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(0,188,212,0.05)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <div style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.85rem" }}>💳 How LegacyLoop Escrow Works</div>
                  {[{ step: "1", text: "Buyer pays at checkout — funds held securely" }, { step: "2", text: "You meet and complete the handoff" }, { step: "3", text: "Both confirm handoff in app" }, { step: "4", text: "Funds released to your account within 24hrs" }].map(s => (
                    <div key={s.step} style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                      <div style={{ width: "1.3rem", height: "1.3rem", background: "rgba(0,188,212,0.15)", border: "1px solid rgba(0,188,212,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#00bcd4", fontSize: "0.68rem", fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
                      <span style={{ color: "var(--text-primary)", fontSize: "0.75rem" }}>{s.text}</span>
                    </div>
                  ))}
                  <div style={{ background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.65rem" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.35rem", fontWeight: 700, letterSpacing: "0.04em" }}>PROCESSING FEE</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Buyer pays</span>
                      <span style={{ color: "#00bcd4", fontWeight: 700, fontSize: "0.75rem" }}>{PROCESSING_FEE.buyerDisplay}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Seller pays</span>
                      <span style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.75rem" }}>{PROCESSING_FEE.sellerDisplay}</span>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: "0.3rem", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>Total processing fee</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>{PROCESSING_FEE.display}</span>
                    </div>
                  </div>
                  <div style={{ color: "rgba(16,185,129,0.8)", fontSize: "0.7rem" }}>✓ Dispute resolution included · ✓ Buyer protection · ✓ Seller guarantee</div>
                </div>
              )}
              {paymentMethod === "cash" && opt.key === "cash" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.85rem" }}>💵 Cash Payment Details</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>Exact amount to request</span>
                    <span style={{ color: "#f59e0b", fontWeight: 800, fontSize: "0.95rem" }}>${listingPrice ?? "—"}</span>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: "0.35rem" }}>Preferred denominations:</div>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {["Any", "All $20s", "Larger bills OK", "Exact change only"].map(opt => (
                        <button key={opt} onClick={() => setDenomPref(opt)} type="button" style={{ background: denomPref === opt ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.08)", border: `1px solid ${denomPref === opt ? "rgba(245,158,11,0.4)" : "rgba(245,158,11,0.2)"}`, borderRadius: "20px", padding: "0.2rem 0.55rem", color: "#f59e0b", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: "8px", padding: "0.55rem" }}>
                    <div style={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.35rem" }}>⚠️ Cash Safety Tips</div>
                    {["Count bills before handing over the item", "Meet in a well-lit public location", "Bring a friend for large transactions", "No buyer protection with cash — trust your instincts"].map(tip => (
                      <div key={tip} style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginBottom: "0.15rem" }}>• {tip}</div>
                    ))}
                  </div>
                  <div style={{ color: "rgba(245,158,11,0.6)", fontSize: "0.7rem" }}>⚠️ Cash transactions have no buyer or seller protection</div>
                </div>
              )}
              {paymentMethod === "venmo" && opt.key === "venmo" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  <div style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "0.85rem" }}>📱 Venmo / Zelle Setup</div>
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: "0.35rem" }}>Which service will you use?</div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {["Venmo", "Zelle", "Either works"].map(opt => (
                        <button key={opt} onClick={() => setVenmoService(opt)} type="button" style={{ background: venmoService === opt ? "rgba(139,92,246,0.18)" : "rgba(139,92,246,0.08)", border: `1px solid ${venmoService === opt ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.2)"}`, borderRadius: "20px", padding: "0.25rem 0.75rem", color: "#8b5cf6", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Your Venmo/Zelle handle or phone number</label>
                    <input type="text" placeholder="@yourhandle or phone number" value={venmoHandle} onChange={e => setVenmoHandle(e.target.value)} style={{ width: "100%", background: "var(--ghost-bg)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "0.55rem 0.75rem", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
                    <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginTop: "0.25rem" }}>🔒 Only shared with buyer after both parties confirm meetup</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", marginBottom: "0.35rem" }}>When should buyer send payment?</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {[{ value: "before", label: "Before handoff — item stays with me until confirmed" }, { value: "after", label: "After handoff — I trust the buyer" }, { value: "simultaneous", label: "Simultaneous — we confirm together on-site" }].map(opt => (
                        <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                          <input type="radio" name="venmoTiming" value={opt.value} checked={venmoTiming === opt.value} onChange={() => setVenmoTiming(opt.value)} style={{ accentColor: "#8b5cf6" }} />
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ color: "rgba(139,92,246,0.6)", fontSize: "0.7rem" }}>⚠️ Limited dispute protection — LegacyLoop escrow recommended for added security</div>
                </div>
              )}
              {paymentMethod === "decide_later" && opt.key === "decide_later" && (
                <div style={{ marginTop: "0.5rem", padding: "0.85rem", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "10px" }}>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "0.4rem" }}>💬 You&apos;ll discuss payment when you meet. The buyer knows payment hasn&apos;t been decided yet.</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>Tip: Decide before you meet to avoid awkward conversations — LegacyLoop escrow is the easiest option.</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
      )}

      {/* Section 5: Notes & Instructions */}
      <AccordionHeader
        id="pickup-notes"
        icon="📝"
        title="NOTES & INSTRUCTIONS"
        subtitle="Additional pickup details"
        isOpen={openPickupSections.has("pickup-notes")}
        onToggle={togglePickupSection}
      />
      {openPickupSections.has("pickup-notes") && (
      <div style={{ padding: "0.5rem 0" }}>

      {/* Vehicle-specific toggles */}
      {isVehicle && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Vehicle Details</div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={testDrive} onChange={(e) => setTestDrive(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
            Test drive available?
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={titleReady} onChange={(e) => setTitleReady(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
            Title transfer ready?
          </label>
          {testDrive && (
            <div style={{ fontSize: "0.7rem", color: "var(--warning-text, #b45309)", padding: "0.3rem 0.5rem", borderRadius: "0.4rem", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)" }}>
              Buyer must bring their own insurance for test drive
            </div>
          )}
        </div>
      )}

      {/* CarBot Pickup Intelligence */}
      {isVehicle && carBotPickup && (
        <div style={{
          marginTop: "1rem", padding: "0.85rem 1rem",
          background: "rgba(0,188,212,0.04)",
          border: "1px solid rgba(0,188,212,0.15)",
          borderRadius: "0.65rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem" }}>🤖</span>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>CarBot Pickup Intelligence</span>
            <span style={{ fontSize: "0.5rem", padding: "1px 6px", borderRadius: "4px", background: "rgba(76,175,80,0.1)", color: "#4caf50", fontWeight: 600, marginLeft: "auto" }}>AI</span>
          </div>

          {carBotPickup.viewing_location && (
            <div style={{ padding: "0.5rem 0.6rem", background: "rgba(245,158,11,0.06)", borderRadius: "0.4rem", borderLeft: "3px solid #f59e0b", marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" as const, marginBottom: "0.15rem" }}>Recommended Viewing Location</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{carBotPickup.viewing_location}</div>
            </div>
          )}

          {carBotPickup.safety_tips && carBotPickup.safety_tips.length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.2rem" }}>🛡️ Safety Guidelines</div>
              {carBotPickup.safety_tips.map((tip: string, i: number) => (
                <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", padding: "0.2rem 0", lineHeight: 1.4 }}>
                  {i + 1}. {tip}
                </div>
              ))}
            </div>
          )}

          {carBotPickup.title_transfer_checklist && carBotPickup.title_transfer_checklist.length > 0 && (
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#00bcd4", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.2rem" }}>📋 Title Transfer Checklist</div>
              {carBotPickup.title_transfer_checklist.map((step: string, i: number) => (
                <div key={i} style={{ fontSize: "0.68rem", color: "var(--text-secondary)", padding: "0.15rem 0", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.6rem" }}>☐</span> {step}
                </div>
              ))}
            </div>
          )}

          {carBotPickup.state_specific_notes && (
            <div style={{ padding: "0.4rem 0.6rem", background: "rgba(0,188,212,0.06)", borderRadius: "0.35rem", borderLeft: "3px solid #00bcd4", fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700, color: "#00bcd4" }}>State Note: </span>{carBotPickup.state_specific_notes}
            </div>
          )}
        </div>
      )}

      {/* Vehicle Transport Options */}
      {isVehicle && (
        <div style={{
          marginTop: "0.75rem", padding: "0.65rem 0.85rem",
          background: "var(--ghost-bg)",
          border: "1px solid var(--border-default)",
          borderRadius: "0.5rem",
        }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.3rem" }}>
            🚚 Buyer Wants It Shipped?
          </div>
          <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 0.4rem" }}>
            If your buyer can&apos;t pick up locally, they can arrange professional vehicle transport. Share these options:
          </p>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" as const }}>
            {[
              { name: "uShip", desc: "Marketplace — buyers bid on transport", color: "#00bcd4" },
              { name: "Montway", desc: "Fixed-price nationwide transport", color: "#4ade80" },
              { name: "Central Dispatch", desc: "Dealer-grade carrier network", color: "#f59e0b" },
            ].map((svc) => (
              <div key={svc.name} style={{
                padding: "0.35rem 0.55rem", borderRadius: "0.4rem",
                background: `${svc.color}08`, border: `1px solid ${svc.color}25`,
                fontSize: "0.62rem", textAlign: "center" as const, flex: "1 1 0", minWidth: "80px",
              }}>
                <div style={{ fontWeight: 700, color: svc.color }}>{svc.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.55rem", marginTop: "0.1rem" }}>{svc.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", margin: "0.35rem 0 0", fontStyle: "italic" }}>
            Transport is arranged and paid by the buyer. LegacyLoop does not handle vehicle shipping directly.
          </p>
        </div>
      )}

      {/* Notes */}
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          Anything the buyer should know?
        </div>
        <textarea
          className="input"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Ex: I'll be in a blue truck. Ring doorbell. Item is heavy, bring help. Cash preferred."
          rows={2}
          style={{ resize: "vertical", width: "100%", fontSize: "0.85rem" }}
        />
      </div>
      </div>
      )}

      {/* Confirmation / Send */}
      {!inviteSent ? (
        !showConfirmation ? (
          <button
            className="btn-primary"
            onClick={() => setShowConfirmation(true)}
            style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
          >
            Preview Pickup Invite
          </button>
        ) : (
          <div style={{ padding: "0.75rem", borderRadius: "0.6rem", border: "1px solid rgba(22,163,74,0.25)", background: "rgba(22,163,74,0.04)" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--success-text)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              📋 Pickup Details
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Location</span>
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                  {LOCATION_OPTIONS.find((o) => o.key === location)?.label || "Not set"}{location === "other" && otherLocation ? ` — ${otherLocation}` : ""}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Area</span>
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>Within {selectedRadius} mi of {saleZip || "your location"}</span>
              </div>
              {pickupDate && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Date</span>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                    {new Date(pickupDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
              {selectedSlots.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Time slots</span>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{selectedSlots.join(", ")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Contact</span>
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{CONTACT_OPTIONS.find((o) => o.key === contactMethod)?.label}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Payment</span>
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{PAYMENT_OPTIONS.find((o) => o.key === paymentMethod)?.label}</span>
              </div>
              {isVehicle && testDrive && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Test drive</span>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>Available</span>
                </div>
              )}
              {instructions && (
                <div style={{ marginTop: "0.25rem", padding: "0.35rem 0.5rem", borderRadius: "0.4rem", background: "var(--bg-card-hover, var(--bg-card))", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                  {instructions}
                </div>
              )}
            </div>
            {pickupError && (
              <div style={{
                padding: "0.5rem 0.6rem", borderRadius: "0.4rem", marginBottom: "0.3rem",
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                fontSize: "0.55rem", color: "#ef4444",
              }}>
                ⚠️ {pickupError}
              </div>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
              <button
                onClick={sendInvite}
                disabled={sending || inviteSent}
                style={{
                  padding: "0.5rem 1.25rem", fontSize: "0.82rem", fontWeight: 700,
                  borderRadius: "0.5rem", border: "none", cursor: sending ? "wait" : "pointer",
                  background: inviteSent ? "linear-gradient(135deg, #4caf50, #2e7d32)" : "linear-gradient(135deg, #00bcd4, #009688)",
                  color: "#fff", boxShadow: "0 2px 8px rgba(0,188,212,0.25)",
                  transition: "all 0.2s ease", minHeight: "44px",
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? "⏳ Sending..." : inviteSent ? "✅ Invite Sent!" : "📤 Send Pickup Invite to Buyer"}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: "0.5rem 0.75rem", fontSize: "0.82rem", fontWeight: 600,
                  borderRadius: "0.5rem", cursor: "pointer",
                  border: "1.5px solid var(--accent, #00bcd4)",
                  background: "rgba(0,188,212,0.06)", color: "var(--accent, #00bcd4)",
                }}
              >
                Edit
              </button>
            </div>
          </div>
        )
      ) : (
        <div style={{ padding: "0.6rem 0.75rem", borderRadius: "0.5rem", background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", fontSize: "0.82rem" }}>
          <div style={{ color: "var(--success-text, #16a34a)", fontWeight: 600 }}>✅ Pickup invite sent!</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>We&apos;ll notify you when the buyer responds.</div>
          <div style={{ marginTop: "0.3rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>Status: <span style={{ color: "var(--warning-text, #b45309)", fontWeight: 600 }}>Pending buyer response</span></div>
        </div>
      )}
    </div>
  );
}
