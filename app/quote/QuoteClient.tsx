"use client";

import { useState } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

interface StepOption {
  id: string;
  label: string;
  icon: string;
  subtitle?: string;
}

interface StepDef {
  key: string;
  question: string;
  subtitle?: string;
  type: "single" | "multi" | "location" | "contact";
  options?: StepOption[];
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  wantAccount: boolean;
}

interface LocationInfo {
  address: string;
  city: string;
  zip: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Step definitions (7 steps)
───────────────────────────────────────────────────────────────────────────── */

const STEPS: StepDef[] = [
  {
    key: "propertyType",
    question: "What type of property?",
    subtitle: "This helps us understand the scope of the estate.",
    type: "single",
    options: [
      { id: "house_small", label: "House (1-2 BR)", icon: "🏡", subtitle: "Small home, apartment, or condo" },
      { id: "house_medium", label: "House (3-4 BR)", icon: "🏠", subtitle: "Average single-family home" },
      { id: "large_estate", label: "Large Estate (5+ BR)", icon: "🏰", subtitle: "Large home or multi-story estate" },
      { id: "apartment_condo", label: "Apartment / Condo", icon: "🏢", subtitle: "Unit in a multi-family building" },
      { id: "storage_unit", label: "Storage Unit", icon: "📦", subtitle: "One or more storage units" },
      { id: "other", label: "Other", icon: "💬", subtitle: "Barn, office, workshop, etc." },
    ],
  },
  {
    key: "itemCount",
    question: "Roughly how many items need to be sold?",
    subtitle: "A ballpark estimate is fine -- we will get exact counts later.",
    type: "single",
    options: [
      { id: "under_50", label: "Under 50", icon: "1️⃣", subtitle: "A few rooms worth" },
      { id: "50_100", label: "50 - 100", icon: "2️⃣", subtitle: "About half a house" },
      { id: "100_300", label: "100 - 300", icon: "3️⃣", subtitle: "Most of a typical house" },
      { id: "300_500", label: "300 - 500", icon: "4️⃣", subtitle: "A full house with garage and attic" },
      { id: "500_plus", label: "500+", icon: "5️⃣", subtitle: "Large estate or multiple properties" },
    ],
  },
  {
    key: "categories",
    question: "What categories are most of the items?",
    subtitle: "Select all that apply. This helps us plan the right team and tools.",
    type: "multi",
    options: [
      { id: "furniture", label: "Furniture", icon: "🛋️" },
      { id: "collectibles_antiques", label: "Collectibles / Antiques", icon: "🏺" },
      { id: "jewelry_watches", label: "Jewelry / Watches", icon: "💍" },
      { id: "art_frames", label: "Art / Frames", icon: "🖼️" },
      { id: "books_media", label: "Books / Media", icon: "📚" },
      { id: "kitchen_housewares", label: "Kitchen / Housewares", icon: "🍳" },
      { id: "tools_equipment", label: "Tools / Equipment", icon: "🔧" },
      { id: "clothing_accessories", label: "Clothing / Accessories", icon: "👗" },
      { id: "electronics", label: "Electronics", icon: "💻" },
      { id: "other", label: "Other", icon: "📦" },
    ],
  },
  {
    key: "highValue",
    question: "Are any items potentially high-value? (over $500)",
    subtitle: "High-value items may benefit from professional appraisal.",
    type: "single",
    options: [
      { id: "yes_several", label: "Yes, several", icon: "💎", subtitle: "Multiple items likely worth $500+" },
      { id: "maybe_few", label: "Maybe a few", icon: "🤔", subtitle: "A couple items could be valuable" },
      { id: "not_sure", label: "I'm not sure", icon: "❓", subtitle: "Would like help figuring that out" },
      { id: "no", label: "No", icon: "📦", subtitle: "Mostly everyday household items" },
    ],
  },
  {
    key: "timeline",
    question: "How soon do you need this completed?",
    subtitle: "We work at your pace. There is no wrong answer.",
    type: "single",
    options: [
      { id: "asap", label: "ASAP (under 2 weeks)", icon: "⚡", subtitle: "Urgent -- need things moving fast" },
      { id: "2_4_weeks", label: "2 - 4 weeks", icon: "📅", subtitle: "Some time, but want to get started" },
      { id: "1_2_months", label: "1 - 2 months", icon: "🗓️", subtitle: "Flexible but within a reasonable window" },
      { id: "no_rush", label: "No rush", icon: "🕰️", subtitle: "Taking my time to do it right" },
    ],
  },
  {
    key: "location",
    question: "Where is the property located?",
    subtitle: "We use this to estimate logistics, local buyers, and market demand.",
    type: "location",
  },
  {
    key: "contact",
    question: "How should we contact you?",
    subtitle: "We will only use this to follow up on your quote. No spam, ever.",
    type: "contact",
  },
];

const TOTAL_STEPS = STEPS.length;

/* ─────────────────────────────────────────────────────────────────────────────
   Shared inline styles
───────────────────────────────────────────────────────────────────────────── */

const glassCard: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid var(--border-default)",
  borderRadius: "0.875rem",
  padding: "1rem 1.25rem",
  cursor: "pointer",
  transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  minHeight: "64px",
  width: "100%",
};

const glassCardHover: React.CSSProperties = {
  ...glassCard,
  background: "rgba(255, 255, 255, 0.06)",
};

const glassCardSelected: React.CSSProperties = {
  ...glassCard,
  borderColor: "var(--accent)",
  background: "rgba(0, 188, 212, 0.06)",
  boxShadow: "0 0 0 1px var(--accent), 0 0 16px rgba(0,188,212,0.08)",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */

export default function QuoteClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [location, setLocation] = useState<LocationInfo>({ address: "", city: "", zip: "" });
  const [contact, setContact] = useState<ContactInfo>({
    name: "",
    email: "",
    phone: "",
    wantAccount: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [fading, setFading] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const current = STEPS[step];
  const progressPct = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  /* ── Selection helpers ── */

  function getSelected(): string[] {
    const val = answers[current.key];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }

  function handleSingleSelect(id: string) {
    setAnswers((prev) => ({ ...prev, [current.key]: id }));
  }

  function handleMultiToggle(id: string) {
    setAnswers((prev) => {
      const arr = (prev[current.key] as string[]) ?? [];
      const updated = arr.includes(id)
        ? arr.filter((x) => x !== id)
        : [...arr, id];
      return { ...prev, [current.key]: updated };
    });
  }

  /* ── Navigation ── */

  function canAdvance(): boolean {
    if (current.type === "single") {
      return !!answers[current.key];
    }
    if (current.type === "multi") {
      const sel = getSelected();
      return sel.length > 0;
    }
    if (current.type === "location") {
      return location.zip.trim().length >= 5;
    }
    if (current.type === "contact") {
      return !!(contact.name.trim() && contact.email.trim());
    }
    return false;
  }

  function goNext() {
    if (!canAdvance()) return;
    setFading(true);
    setTimeout(() => {
      if (step < TOTAL_STEPS - 1) {
        setStep((s) => s + 1);
      }
      setFading(false);
    }, 200);
  }

  function goBack() {
    if (step === 0) return;
    setFading(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setFading(false);
    }, 200);
  }

  async function handleSubmit() {
    if (!canAdvance()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...answers,
        address: location.address,
        city: location.city,
        zip: location.zip,
        contactName: contact.name,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        wantAccount: contact.wantAccount,
        submittedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      setReferenceId(data.referenceId || `QR-${Date.now()}`);
      setSubmitted(true);
    } catch {
      setReferenceId(`QR-${Date.now()}`);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Confirmation screen ── */

  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            width: "100%",
            textAlign: "center",
            animation: "fadeSlideUp 0.6s ease-out both",
          }}
        >
          {/* Success icon */}
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              background: "var(--success-bg)",
              border: "2px solid var(--success-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "2.25rem",
            }}
          >
            &#10003;
          </div>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Quote Request Received!
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: "0.75rem",
            }}
          >
            We&apos;ll call within{" "}
            <strong style={{ color: "var(--accent)" }}>24 hours</strong> to
            discuss your estate and next steps.
          </p>

          {/* Reference number */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(0, 188, 212, 0.06)",
              border: "1px solid var(--accent-border)",
              borderRadius: "0.75rem",
              padding: "0.65rem 1.25rem",
              marginBottom: "2rem",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Reference:
            </span>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "0.04em",
                fontFamily: "monospace",
              }}
            >
              {referenceId}
            </span>
          </div>

          {/* What happens next card */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-default)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              textAlign: "left",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
                fontSize: "1rem",
              }}
            >
              What happens next:
            </div>
            <ol
              style={{
                paddingLeft: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
                fontSize: "0.95rem",
                color: "var(--text-secondary)",
                lineHeight: 1.65,
              }}
            >
              <li>We review your answers and prepare a personalized quote</li>
              <li>A team member contacts you within 24 hours</li>
              <li>Free phone or video consultation to discuss your needs</li>
              <li>Receive a detailed written proposal with pricing</li>
            </ol>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/pricing" className="btn-ghost" style={{ padding: "0.75rem 1.5rem" }}>
              View Pricing
            </Link>
            <Link href="/" className="btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main wizard ── */

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem 4rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "640px" }}>
        {/* ── Page heading ── */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: "0.35rem",
            }}
          >
            Request a Free Quote
          </h1>
          <p
            style={{
              fontSize: "0.92rem",
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            Answer 7 quick questions and we&apos;ll build a personalized plan for your estate.
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.6rem",
            }}
          >
            <span
              style={{
                fontSize: "0.84rem",
                fontWeight: 600,
                color: "var(--text-muted)",
              }}
            >
              Step {step + 1} of {TOTAL_STEPS}
            </span>
            <span
              style={{
                fontSize: "0.84rem",
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {progressPct}%
            </span>
          </div>

          {/* Teal gradient progress bar */}
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "var(--border-default)",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--accent-deep, #0097a7), var(--accent, #00bcd4), var(--accent-bright, #22d3ee))",
                borderRadius: "999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* ── Question area ── */}
        <div
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {/* Question title */}
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.35rem",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {current.question}
          </h2>
          {current.subtitle && (
            <p
              style={{
                fontSize: "0.92rem",
                color: "var(--text-secondary)",
                marginBottom: "1.75rem",
                lineHeight: 1.6,
              }}
            >
              {current.subtitle}
            </p>
          )}

          {/* ── Single-select options ── */}
          {current.type === "single" && current.options && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              {current.options.map((opt) => {
                const selected = answers[current.key] === opt.id;
                const hovered = hoveredOption === `${current.key}-${opt.id}`;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSingleSelect(opt.id)}
                    onMouseEnter={() => setHoveredOption(`${current.key}-${opt.id}`)}
                    onMouseLeave={() => setHoveredOption(null)}
                    style={
                      selected
                        ? glassCardSelected
                        : hovered
                        ? glassCardHover
                        : glassCard
                    }
                  >
                    <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: selected ? 700 : 600,
                          color: selected ? "var(--accent)" : "var(--text-primary)",
                          lineHeight: 1.3,
                        }}
                      >
                        {opt.label}
                      </div>
                      {opt.subtitle && (
                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-muted)",
                            marginTop: "0.15rem",
                            lineHeight: 1.4,
                          }}
                        >
                          {opt.subtitle}
                        </div>
                      )}
                    </div>
                    {selected && (
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                          }}
                        >
                          &#10003;
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Multi-select options ── */}
          {current.type === "multi" && current.options && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              {current.options.map((opt) => {
                const sel = getSelected();
                const selected = sel.includes(opt.id);
                const hovered = hoveredOption === `${current.key}-${opt.id}`;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleMultiToggle(opt.id)}
                    onMouseEnter={() => setHoveredOption(`${current.key}-${opt.id}`)}
                    onMouseLeave={() => setHoveredOption(null)}
                    style={
                      selected
                        ? glassCardSelected
                        : hovered
                        ? glassCardHover
                        : glassCard
                    }
                  >
                    <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: selected ? 700 : 600,
                          color: selected ? "var(--accent)" : "var(--text-primary)",
                          lineHeight: 1.3,
                        }}
                      >
                        {opt.label}
                      </div>
                    </div>
                    {/* Teal checkbox */}
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "6px",
                        border: `2px solid ${selected ? "var(--accent)" : "var(--border-default)"}`,
                        background: selected ? "var(--accent)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {selected && (
                        <span
                          style={{
                            color: "#fff",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                          }}
                        >
                          &#10003;
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Location form (step 6) ── */}
          {current.type === "location" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                maxWidth: "480px",
              }}
            >
              {/* Address */}
              <div>
                <label className="label">
                  Address or City{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="123 Main St, Bangor"
                  value={location.address}
                  onChange={(e) =>
                    setLocation((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>

              {/* City */}
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Bangor"
                  value={location.city}
                  onChange={(e) =>
                    setLocation((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>

              {/* ZIP Code */}
              <div>
                <label className="label">
                  ZIP Code <span style={{ color: "var(--error-text)" }}>*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="e.g. 04901"
                  value={location.zip}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setLocation((prev) => ({ ...prev, zip: val }));
                  }}
                  style={{ fontSize: "1.15rem", letterSpacing: "0.12em" }}
                />
              </div>

              {location.zip.length === 5 && (
                <p
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  We will factor in local market conditions for your area.
                </p>
              )}

              {/* Maine service note */}
              <div
                style={{
                  background: "rgba(0, 188, 212, 0.04)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: "0.75rem",
                  padding: "0.85rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                }}
              >
                <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>📍</span>
                <span
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  Currently serving <strong style={{ color: "var(--accent)" }}>all of Maine</strong>.
                  Expanding to other states soon.
                </span>
              </div>
            </div>
          )}

          {/* ── Contact form (step 7) ── */}
          {current.type === "contact" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                maxWidth: "480px",
              }}
            >
              {/* Name */}
              <div>
                <label className="label">
                  Full Name <span style={{ color: "var(--error-text)" }}>*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Jane Smith"
                  value={contact.name}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, name: e.target.value }))
                  }
                />
              </div>

              {/* Email */}
              <div>
                <label className="label">
                  Email Address <span style={{ color: "var(--error-text)" }}>*</span>
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="jane@example.com"
                  value={contact.email}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, email: e.target.value }))
                  }
                />
              </div>

              {/* Phone */}
              <div>
                <label className="label">
                  Phone Number{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  className="input"
                  type="tel"
                  placeholder="(207) 555-0100"
                  value={contact.phone}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, phone: e.target.value }))
                  }
                />
              </div>

              {/* Account checkbox */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                  padding: "0.85rem 1rem",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${contact.wantAccount ? "var(--accent)" : "var(--border-default)"}`,
                  borderRadius: "0.75rem",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    border: `2px solid ${contact.wantAccount ? "var(--accent)" : "var(--border-default)"}`,
                    background: contact.wantAccount ? "var(--accent)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  {contact.wantAccount && (
                    <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 800 }}>
                      &#10003;
                    </span>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={contact.wantAccount}
                  onChange={(e) =>
                    setContact((c) => ({ ...c, wantAccount: e.target.checked }))
                  }
                  style={{ display: "none" }}
                />
                <span
                  style={{
                    fontSize: "0.92rem",
                    color: contact.wantAccount ? "var(--accent)" : "var(--text-secondary)",
                    fontWeight: contact.wantAccount ? 600 : 500,
                    lineHeight: 1.4,
                  }}
                >
                  I&apos;d also like a digital platform account
                </span>
              </label>
            </div>
          )}
        </div>

        {/* ── Navigation buttons ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "2.5rem",
          }}
        >
          <button
            onClick={goBack}
            disabled={step === 0}
            className="btn-ghost"
            style={{
              opacity: step === 0 ? 0.35 : 1,
              cursor: step === 0 ? "not-allowed" : "pointer",
              padding: "0.75rem 1.5rem",
            }}
          >
            Back
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={goNext}
              disabled={!canAdvance()}
              className="btn-primary"
              style={{ padding: "0.75rem 2rem" }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
              className="btn-primary"
              style={{ padding: "0.75rem 2rem" }}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          )}
        </div>

        {/* ── Footer note ── */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            marginTop: "2rem",
            lineHeight: 1.6,
          }}
        >
          No account needed. Free consultation. Takes about 2 minutes.
        </p>
      </div>
    </div>
  );
}
