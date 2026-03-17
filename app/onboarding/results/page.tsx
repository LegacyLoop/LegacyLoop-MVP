"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Recommendation } from "@/lib/pricing/constants";
import {
  DIGITAL_TIERS,
  WHITE_GLOVE_TIERS,
  DISCOUNTS,
} from "@/lib/pricing/constants";

// ── Helper functions ──────────────────────────────────────────────────────────

function getTierName(tier: string): string {
  const map: Record<string, string> = {
    FREE: "Try It Out",
    STARTER: "DIY Seller",
    PLUS: "Power Seller",
    PRO: "Estate Manager",
    ESSENTIALS: "Estate Essentials",
    PROFESSIONAL: "Estate Professional",
    LEGACY: "Estate Legacy",
  };
  return map[tier] ?? tier;
}

function getTierPrice(tier: string): string {
  const isWG = ["ESSENTIALS", "PROFESSIONAL", "LEGACY"].includes(tier);
  if (isWG) {
    const wg = WHITE_GLOVE_TIERS[tier];
    if (!wg) return "Contact us";
    return `$${wg.preLaunchPrice.toLocaleString()} (pre-launch)`;
  }
  const dt = DIGITAL_TIERS[tier];
  if (!dt) return "Contact us";
  if (dt.monthlyPrice === 0) return "Free";
  return `$${dt.preLaunchMonthly ?? dt.monthlyPrice}/mo`;
}

function getTierHref(tier: string): string {
  const isWG = ["ESSENTIALS", "PROFESSIONAL", "LEGACY"].includes(tier);
  if (isWG) return "/quote";
  return "/auth/signup";
}

function getTierCtaLabel(tier: string): string {
  const map: Record<string, string> = {
    FREE: "Start Free",
    STARTER: "Start Free Trial",
    PLUS: "Start Free Trial",
    PRO: "Start Free Trial",
    ESSENTIALS: "Request Quote",
    PROFESSIONAL: "Request Quote",
    LEGACY: "Request Quote",
  };
  return map[tier] ?? "Get Started";
}

function getTierDescription(tier: string): string {
  const map: Record<string, string> = {
    FREE: "Perfect for testing the platform with up to 3 items at zero cost.",
    STARTER: "Great for casual sellers with a handful of items to move. AI pricing + basic analytics.",
    PLUS: "MegaBot pricing, Buyer Finder, and custom storefront for active sellers.",
    PRO: "The full suite — unlimited MegaBot, storytelling tools, legacy archives, and phone support.",
    ESSENTIALS: "Our team visits your home, photographs and lists up to 100 items, and handles all buyers.",
    PROFESSIONAL: "Complete estate management for 3–4 bedroom homes. MegaBot on every item, multiple visits.",
    LEGACY: "White-glove premium. Dedicated project manager, unlimited items, printed legacy book, and more.",
  };
  return map[tier] ?? "";
}

function getRecommendationReasons(
  rec: Recommendation
): Array<{ icon: string; title: string; description: string }> {
  const reasons: Array<{ icon: string; title: string; description: string }> = [];

  if (rec.serviceLevel === "whiteGlove") {
    reasons.push({
      icon: "🤝",
      title: "Full-service, hands-off experience",
      description:
        "Our team comes on-site, handles everything, and you just approve sales.",
    });
  } else {
    reasons.push({
      icon: "💪",
      title: "AI-powered tools at your pace",
      description:
        "Manage your sale on your own schedule with expert AI pricing and buyer matching.",
    });
  }

  if (rec.primaryCategory === "estate") {
    reasons.push({
      icon: "🏠",
      title: "Built for estate-scale selling",
      description:
        "This plan handles the volume and complexity of full-home liquidation.",
    });
  } else if (rec.primaryCategory === "garage") {
    reasons.push({
      icon: "📦",
      title: "Right-sized for your sale",
      description: "Perfect for smaller collections without paying for features you won't use.",
    });
  } else {
    reasons.push({
      icon: "🏘️",
      title: "Optimized for group selling",
      description:
        "Shared marketplace means more buyers, split costs, and a bigger event.",
    });
  }

  if (rec.needsAppraisal) {
    reasons.push({
      icon: "🔍",
      title: "Expert appraisal recommended",
      description:
        "Your antiques, jewelry, or art may be worth significantly more than expected. Don't leave money on the table.",
    });
  }

  if (rec.needsShipping) {
    reasons.push({
      icon: "📦",
      title: "Large item shipping covered",
      description:
        "We include shipping coordination for furniture and oversized items.",
    });
  }

  return reasons;
}

interface AltOption {
  tier: string;
  name: string;
  description: string;
  price: string;
  href: string;
}

function getAlternativeOptions(rec: Recommendation): AltOption[] {
  const allOptions: AltOption[] = [
    {
      tier: "FREE",
      name: "Try It Out",
      description: "Test the platform with 3 items at no cost.",
      price: "Free",
      href: "/auth/signup",
    },
    {
      tier: "STARTER",
      name: "DIY Seller",
      description: "25 items, AI pricing, basic analytics.",
      price: "$10/mo pre-launch",
      href: "/auth/signup",
    },
    {
      tier: "PLUS",
      name: "Power Seller",
      description: "100 items, MegaBot, Buyer Finder.",
      price: "$25/mo pre-launch",
      href: "/auth/signup",
    },
    {
      tier: "PRO",
      name: "Estate Manager",
      description: "300 items, unlimited MegaBot, storytelling.",
      price: "$75/mo pre-launch",
      href: "/auth/signup",
    },
    {
      tier: "ESSENTIALS",
      name: "Estate Essentials",
      description: "On-site white-glove for smaller homes.",
      price: "$1,750 pre-launch",
      href: "/quote",
    },
    {
      tier: "PROFESSIONAL",
      name: "Estate Professional",
      description: "Full white-glove for 3–4 bedroom homes.",
      price: "$3,500 pre-launch",
      href: "/quote",
    },
  ];

  return allOptions.filter((o) => o.tier !== rec.recommendedTier).slice(0, 2);
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    estate: "🏠",
    garage: "📦",
    neighborhood: "🏘️",
  };
  return map[cat] ?? "🏠";
}

// ── Results inner (needs useSearchParams) ────────────────────────────────────

function ResultsContent() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("r") ?? "{}";

  let rec: Recommendation;
  try {
    rec = JSON.parse(decodeURIComponent(raw));
  } catch {
    rec = {
      primaryCategory: "estate",
      serviceLevel: "diy",
      recommendedTier: "STARTER",
      needsAppraisal: false,
      needsShipping: false,
      hasVehicles: false,
      scores: {},
      confidence: 70,
    };
  }

  const tierName = getTierName(rec.recommendedTier);
  const tierPrice = getTierPrice(rec.recommendedTier);
  const tierDesc = getTierDescription(rec.recommendedTier);
  const tierHref = getTierHref(rec.recommendedTier);
  const ctaLabel = getTierCtaLabel(rec.recommendedTier);
  const reasons = getRecommendationReasons(rec);
  const alternatives = getAlternativeOptions(rec);

  const isWhiteGlove = rec.serviceLevel === "whiteGlove";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%)",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          marginBottom: "2rem",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "#0f766e",
            color: "#fff",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
          }}
        >
          LL
        </div>
        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1c1917" }}>
          LegacyLoop
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: "720px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: isWhiteGlove
                ? "linear-gradient(135deg, #1c1917, #292524)"
                : "linear-gradient(135deg, #f0fdfa, #ecfdf5)",
              fontSize: "2.5rem",
              marginBottom: "1rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            }}
          >
            {getCategoryEmoji(rec.primaryCategory)}
          </div>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "#1c1917",
              marginBottom: "0.5rem",
            }}
          >
            Perfect — we found your match!
          </h1>
          <p style={{ color: "#78716c", fontSize: "1rem" }}>
            Based on your answers, here's what we recommend:
          </p>

          {/* Confidence bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "0.75rem",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#a8a29e" }}>Confidence:</span>
            <div
              style={{
                width: "120px",
                height: "6px",
                background: "#e7e5e4",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${rec.confidence}%`,
                  height: "100%",
                  background: "#0f766e",
                  borderRadius: "999px",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#0f766e",
              }}
            >
              {rec.confidence}%
            </span>
          </div>
        </div>

        {/* Primary recommendation card */}
        <div
          style={{
            background: isWhiteGlove
              ? "linear-gradient(135deg, #1c1917, #292524)"
              : "linear-gradient(135deg, #0f766e, #0d9488)",
            borderRadius: "1.5rem",
            padding: "2rem",
            color: "#fff",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  marginBottom: "0.25rem",
                }}
              >
                Recommended for you
              </p>
              <h2
                style={{ fontSize: "1.75rem", fontWeight: 900, marginBottom: "0" }}
              >
                {tierName}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "0.15rem",
                }}
              >
                Starting at
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  color: isWhiteGlove ? "#fbbf24" : "#fff",
                }}
              >
                {tierPrice}
              </p>
            </div>
          </div>

          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.92rem",
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
            {tierDesc}
          </p>

          {/* Pre-launch callout */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "0.75rem",
              padding: "0.6rem 1rem",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.85)",
              marginBottom: "1.25rem",
            }}
          >
            ⚡ <strong>Pre-launch pricing:</strong> Lock in this rate forever —{" "}
            {DISCOUNTS.preLaunch.spotsRemaining} of {DISCOUNTS.preLaunch.totalSpots} founding
            member spots remaining.
          </div>

          <Link
            href={tierHref}
            style={{
              display: "block",
              textAlign: "center",
              padding: "0.9rem",
              background: "#fff",
              color: isWhiteGlove ? "#1c1917" : "#0f766e",
              borderRadius: "0.875rem",
              fontWeight: 800,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            {ctaLabel} →
          </Link>
        </div>

        {/* Why we recommend this */}
        <div
          style={{
            background: "#fff",
            borderRadius: "1.25rem",
            padding: "1.75rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#1c1917",
              marginBottom: "1rem",
            }}
          >
            Why we recommend this:
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {reasons.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  background: "#fafaf9",
                  borderRadius: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#1c1917",
                      fontSize: "0.9rem",
                      marginBottom: "0.15rem",
                    }}
                  >
                    {r.title}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#57534e", lineHeight: 1.5 }}>
                    {r.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expert appraisal upsell */}
        {rec.needsAppraisal && (
          <div
            style={{
              background: "#fef9c3",
              border: "2px solid #fde68a",
              borderRadius: "1.25rem",
              padding: "1.25rem 1.5rem",
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>💡</span>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: "#92400e",
                  marginBottom: "0.25rem",
                }}
              >
                Consider adding Expert Appraisals ($15/item)
              </div>
              <p style={{ fontSize: "0.85rem", color: "#78350f", lineHeight: 1.5 }}>
                You mentioned antiques, jewelry, or art. A certified appraiser review can
                unlock 30–200% more accurate pricing. Don't leave money on the table.
              </p>
            </div>
          </div>
        )}

        {/* Vehicle note */}
        {rec.hasVehicles && (
          <div
            style={{
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              borderRadius: "1.25rem",
              padding: "1.25rem 1.5rem",
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🚗</span>
            <div>
              <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: "0.25rem" }}>
                Vehicle selling is a specialty service
              </div>
              <p style={{ fontSize: "0.85rem", color: "#1e3a8a", lineHeight: 1.5 }}>
                Vehicles (cars, boats, RVs) are handled separately. Contact us at{" "}
                <strong>hello@legacyloop.com</strong> and we'll connect you with the right buyer
                network.
              </p>
            </div>
          </div>
        )}

        {/* Alternatives */}
        <div
          style={{
            background: "#fff",
            borderRadius: "1.25rem",
            padding: "1.75rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            marginBottom: "2rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#1c1917",
              marginBottom: "1rem",
            }}
          >
            Other options to consider:
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "0.875rem",
            }}
          >
            {alternatives.map((alt) => (
              <Link
                key={alt.tier}
                href={alt.href}
                style={{
                  display: "block",
                  padding: "1rem 1.25rem",
                  border: "2px solid #e7e5e4",
                  borderRadius: "0.875rem",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#1c1917",
                    marginBottom: "0.2rem",
                  }}
                >
                  {alt.name}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "#57534e",
                    marginBottom: "0.5rem",
                    lineHeight: 1.4,
                  }}
                >
                  {alt.description}
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "#0f766e",
                  }}
                >
                  {alt.price}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ textAlign: "center" }}>
          <Link
            href={tierHref}
            style={{
              display: "inline-block",
              padding: "0.9rem 2.5rem",
              background: "#0f766e",
              color: "#fff",
              borderRadius: "9999px",
              fontWeight: 800,
              fontSize: "1rem",
              textDecoration: "none",
              marginBottom: "1rem",
            }}
          >
            Continue with {tierName} →
          </Link>
          <div
            style={{ fontSize: "0.82rem", color: "#a8a29e", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link
              href="/onboarding/quiz"
              style={{ color: "#0f766e", textDecoration: "none" }}
            >
              ← Retake quiz
            </Link>
            <span style={{ color: "#d6d3d1" }}>·</span>
            <Link
              href="/pricing"
              style={{ color: "#0f766e", textDecoration: "none" }}
            >
              View all pricing
            </Link>
            <span style={{ color: "#d6d3d1" }}>·</span>
            <Link
              href="/auth/signup"
              style={{ color: "#0f766e", textDecoration: "none" }}
            >
              Start free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page (Suspense wrapper required for useSearchParams) ─────────────────────

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "#78716c",
            fontSize: "1rem",
          }}
        >
          Loading your results…
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
