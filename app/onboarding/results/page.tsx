"use client";

import { Suspense, useEffect, useState } from "react";
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

function getTierHref(tier: string, loggedIn: boolean): string {
  const isWG = ["ESSENTIALS", "PROFESSIONAL", "LEGACY"].includes(tier);
  if (isWG) return "/quote";
  return loggedIn ? "/subscription" : "/auth/signup";
}

function getTierCtaLabel(tier: string, loggedIn: boolean): string {
  if (loggedIn && !["ESSENTIALS", "PROFESSIONAL", "LEGACY"].includes(tier)) {
    return "Choose This Plan";
  }
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
    PRO: "The full suite \u2014 unlimited MegaBot, storytelling tools, legacy archives, and phone support.",
    ESSENTIALS: "Our team visits your home, photographs and lists up to 100 items, and handles all buyers.",
    PROFESSIONAL: "Complete estate management for 3\u20134 bedroom homes. MegaBot on every item, multiple visits.",
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
      icon: "\u{1F91D}",
      title: "Full-service, hands-off experience",
      description:
        "Our team comes on-site, handles everything, and you just approve sales.",
    });
  } else {
    reasons.push({
      icon: "\u{1F4AA}",
      title: "AI-powered tools at your pace",
      description:
        "Manage your sale on your own schedule with expert AI pricing and buyer matching.",
    });
  }

  if (rec.primaryCategory === "estate") {
    reasons.push({
      icon: "\u{1F3E0}",
      title: "Built for estate-scale selling",
      description:
        "This plan handles the volume and complexity of full-home liquidation.",
    });
  } else if (rec.primaryCategory === "garage") {
    reasons.push({
      icon: "\u{1F4E6}",
      title: "Right-sized for your sale",
      description: "Perfect for smaller collections without paying for features you won\u2019t use.",
    });
  } else {
    reasons.push({
      icon: "\u{1F3D8}\u{FE0F}",
      title: "Optimized for group selling",
      description:
        "Shared marketplace means more buyers, split costs, and a bigger event.",
    });
  }

  if (rec.needsAppraisal) {
    reasons.push({
      icon: "\u{1F50D}",
      title: "Expert appraisal recommended",
      description:
        "Your antiques, jewelry, or art may be worth significantly more than expected. Don\u2019t leave money on the table.",
    });
  }

  if (rec.needsShipping) {
    reasons.push({
      icon: "\u{1F4E6}",
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
      description: "Full white-glove for 3\u20134 bedroom homes.",
      price: "$3,500 pre-launch",
      href: "/quote",
    },
  ];

  return allOptions.filter((o) => o.tier !== rec.recommendedTier).slice(0, 2);
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    estate: "\u{1F3E0}",
    garage: "\u{1F4E6}",
    neighborhood: "\u{1F3D8}\u{FE0F}",
  };
  return map[cat] ?? "\u{1F3E0}";
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

  // Part B URL params
  const wantsHelp = searchParams.get("wantsHelp") === "true";
  const userNotes = searchParams.get("userNotes") || "";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(document.cookie.includes("auth-token"));
  }, []);

  const tierName = getTierName(rec.recommendedTier);
  const tierPrice = getTierPrice(rec.recommendedTier);
  const tierDesc = getTierDescription(rec.recommendedTier);
  const tierHref = getTierHref(rec.recommendedTier, isLoggedIn);
  const ctaLabel = getTierCtaLabel(rec.recommendedTier, isLoggedIn);
  const reasons = getRecommendationReasons(rec);
  const alternatives = getAlternativeOptions(rec);

  const isWhiteGlove = rec.serviceLevel === "whiteGlove";
  const isDigital = !isWhiteGlove;

  // Personalization
  const categoryLabel: Record<string, string> = {
    estate: "estate transition",
    garage: "garage sale",
    neighborhood: "neighborhood sale",
  };

  // Conditional sections
  const showNeighborhoodBundle =
    rec.primaryCategory === "neighborhood" && (rec.scores?.neighborhood ?? 0) > 8;
  const showCreditTip = isDigital;
  const showWhiteGloveSoftSurface =
    isDigital && (wantsHelp || (rec.scores?.whiteGlove ?? 0) >= 8);

  // WG pricing transparency
  const wgPricingDetail: Record<string, string> = {
    ESSENTIALS: "Includes on-site visit, AI photography, up to 100 items, and full buyer management.",
    PROFESSIONAL: "Full estate management for 3-4 bedrooms. Multiple visits, MegaBot analysis on every item, dedicated team coordination.",
    LEGACY: "Unlimited items, dedicated project manager, printed legacy book, premium photography, and white-glove everything.",
  };

  // Persist quiz completion to localStorage (bridge until schema migration)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      localStorage.setItem("legacyloop_quiz_completed", new Date().toISOString());
      localStorage.setItem("legacyloop_quiz_results", JSON.stringify(rec));
    } catch {
      // localStorage not available — silently fail
    }
  }, []);

  // userNotes available for future storage/display
  void userNotes;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
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
            background: "var(--accent-theme)",
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
        <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
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
                : "var(--bg-primary)",
              fontSize: "2.5rem",
              marginBottom: "1rem",
              boxShadow: "var(--card-shadow)",
            }}
          >
            {getCategoryEmoji(rec.primaryCategory)}
          </div>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Perfect {"\u2014"} we found your match!
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            Based on your {categoryLabel[rec.primaryCategory] || "sale"}, here{"\u2019"}s what we recommend:
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
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              We{"\u2019"}re {rec.confidence}% confident this is the right plan for you.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <div
              style={{
                width: "140px",
                height: "6px",
                background: "var(--ghost-bg)",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${rec.confidence}%`,
                  height: "100%",
                  background: "var(--accent-theme)",
                  borderRadius: "999px",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--accent-theme)",
              }}
            >
              {rec.confidence}%
            </span>
          </div>
        </div>

        {/* ── Primary recommendation card (always-dark surface — hardcoded light text) ── */}
        <div
          style={{
            background: isWhiteGlove
              ? "linear-gradient(135deg, #1c1917, #292524)"
              : "linear-gradient(135deg, var(--accent-theme), var(--accent))",
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
                  color: "rgba(255,255,255,0.7)",
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
                  color: "rgba(255,255,255,0.7)",
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
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.92rem",
              lineHeight: 1.6,
              marginBottom: "1rem",
            }}
          >
            {tierDesc}
          </p>

          {/* WG pricing transparency */}
          {isWhiteGlove && wgPricingDetail[rec.recommendedTier] && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.5,
                marginBottom: "1.25rem",
                paddingLeft: "0.75rem",
                borderLeft: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              {wgPricingDetail[rec.recommendedTier]}
            </p>
          )}

          {/* Pre-launch callout */}
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "0.75rem",
              padding: "0.6rem 1rem",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.9)",
              marginBottom: "1.25rem",
            }}
          >
            {"\u26A1"} <strong>Pre-launch pricing:</strong> Lock in this rate forever {"\u2014"}{" "}
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
            {ctaLabel} {"\u2192"}
          </Link>
        </div>

        {/* ── Neighborhood Bundle (conditional) ── */}
        {showNeighborhoodBundle && (
          <div
            style={{
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{"\u{1F3D8}\u{FE0F}"}</span>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  fontSize: "1.05rem",
                  marginBottom: "0.35rem",
                }}
              >
                Neighborhood Bundle {"\u2014"} Perfect for You
              </div>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "0.75rem",
                }}
              >
                You mentioned organizing a group or community sale.
                Our Neighborhood Bundle lets you coordinate with neighbors,
                share the costs, and turn it into a real event.
                More buyers. Less hassle. Better prices for everyone.
              </p>
              <Link
                href="/services/neighborhood-bundle"
                style={{
                  fontSize: "0.88rem",
                  color: "var(--accent-theme)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Learn More About Neighborhood Bundles {"\u2192"}
              </Link>
            </div>
          </div>
        )}

        {/* ── Credit add-ons tip (digital tiers only) ── */}
        {showCreditTip && (
          <div
            style={{
              background: "var(--ghost-bg)",
              border: "1px solid var(--border-default)",
              borderRadius: "1rem",
              padding: "1rem 1.25rem",
              display: "flex",
              gap: "0.6rem",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{"\u{1F4A1}"}</span>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>Pro tip:</strong> Boost your results
              with AI-powered add-ons like Expert Appraisals, Buyer Outreach, and Market Reports.
              Credit packs start at just $25.
            </p>
          </div>
        )}

        {/* ── White Glove soft-surface (digital + wantsHelp) ── */}
        {showWhiteGloveSoftSurface && (
          <div
            style={{
              background: "linear-gradient(135deg, var(--bg-card-solid), var(--ghost-bg))",
              border: "1px solid var(--accent-border)",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{"\u{1F91D}"}</span>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  fontSize: "1.05rem",
                  marginBottom: "0.35rem",
                }}
              >
                Want us to handle it all?
              </div>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "0.75rem",
                }}
              >
                Our White Glove service starts at $1,495.
                We come to your home, photograph everything, price with AI,
                and manage all buyers and shipping. You just approve sales.
              </p>
              <Link
                href="/white-glove"
                style={{
                  fontSize: "0.88rem",
                  color: "var(--accent-theme)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Explore White Glove Options {"\u2192"}
              </Link>
            </div>
          </div>
        )}

        {/* Why we recommend this */}
        <div
          style={{
            background: "var(--bg-card-solid)",
            borderRadius: "1.25rem",
            padding: "1.75rem",
            boxShadow: "var(--card-shadow)",
            border: "1px solid var(--border-default)",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
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
                  background: "var(--ghost-bg)",
                  borderRadius: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      fontSize: "0.9rem",
                      marginBottom: "0.15rem",
                    }}
                  >
                    {r.title}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {r.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expert appraisal upsell (always gold — intentional) */}
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
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{"\u{1F4A1}"}</span>
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
                unlock 30{"\u2013"}200% more accurate pricing. Don{"\u2019"}t leave money on the table.
              </p>
            </div>
          </div>
        )}

        {/* Vehicle note (always blue — intentional) */}
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
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{"\u{1F697}"}</span>
            <div>
              <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: "0.25rem" }}>
                Vehicle selling is a specialty service
              </div>
              <p style={{ fontSize: "0.85rem", color: "#1e3a8a", lineHeight: 1.5 }}>
                Vehicles (cars, boats, RVs) are handled separately. Contact us at{" "}
                <strong>support@legacy-loop.com</strong> and we{"\u2019"}ll connect you with the right buyer
                network.
              </p>
            </div>
          </div>
        )}

        {/* Alternatives */}
        <div
          style={{
            background: "var(--bg-card-solid)",
            borderRadius: "1.25rem",
            padding: "1.75rem",
            boxShadow: "var(--card-shadow)",
            border: "1px solid var(--border-default)",
            marginBottom: "2rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
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
                href={getTierHref(alt.tier, isLoggedIn)}
                style={{
                  display: "block",
                  padding: "1rem 1.25rem",
                  border: "2px solid var(--ghost-bg)",
                  borderRadius: "0.875rem",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "0.2rem",
                  }}
                >
                  {alt.name}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
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
                    color: "var(--accent-theme)",
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
              background: "var(--accent-theme)",
              color: "#fff",
              borderRadius: "9999px",
              fontWeight: 800,
              fontSize: "1rem",
              textDecoration: "none",
              marginBottom: "1rem",
            }}
          >
            Continue with {tierName} {"\u2192"}
          </Link>
          <div
            style={{
              fontSize: "0.82rem",
              color: "var(--muted-color)",
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/onboarding/quiz"
              style={{ color: "var(--accent-theme)", textDecoration: "none" }}
            >
              {"\u2190"} Retake quiz
            </Link>
            <span style={{ color: "var(--border-default)" }}>{"\u00B7"}</span>
            <Link
              href="/pricing"
              style={{ color: "var(--accent-theme)", textDecoration: "none" }}
            >
              View all pricing
            </Link>
            <span style={{ color: "var(--border-default)" }}>{"\u00B7"}</span>
            <Link
              href="/auth/signup"
              style={{ color: "var(--accent-theme)", textDecoration: "none" }}
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
            color: "var(--text-muted)",
            fontSize: "1rem",
          }}
        >
          Loading your results{"\u2026"}
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
