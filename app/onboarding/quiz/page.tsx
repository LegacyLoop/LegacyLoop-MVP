"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Recommendation } from "@/lib/pricing/constants";

// ── Types ────────────────────────────────────────────────────────────────────

interface Scores {
  estate: number;
  garage: number;
  neighborhood: number;
  whiteGlove: number;
  diy: number;
}

interface QuizOption {
  id: string;
  text: string;
  icon: string;
  points?: Partial<Scores>;
  recommendedTier?: string;
  needsAppraisal?: boolean;
  needsShipping?: boolean;
  specialCategory?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  subtitle?: string;
  type: "single" | "multiple";
  options: QuizOption[];
}

// ── Quiz Data ─────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "situation",
    question: "What\u2019s happening in your life right now?",
    type: "single",
    options: [
      {
        id: "downsizing",
        text: "Downsizing or moving to a smaller home",
        icon: "\u{1F3E0}",
        points: { estate: 10, garage: 2 },
      },
      {
        id: "inheritance",
        text: "Managing an inherited estate",
        icon: "\u{1F474}",
        points: { estate: 10, whiteGlove: 3 },
      },
      {
        id: "decluttering",
        text: "Spring cleaning or general decluttering",
        icon: "\u{1F9F9}",
        points: { garage: 10, neighborhood: 3, diy: 5 },
      },
      {
        id: "moving",
        text: "Moving and need to sell items",
        icon: "\u{1F4E6}",
        points: { estate: 3, garage: 8, diy: 4 },
      },
      {
        id: "community",
        text: "Organizing a neighborhood or group sale",
        icon: "\u{1F3D8}\u{FE0F}",
        points: { neighborhood: 10, diy: 3 },
      },
    ],
  },

  {
    id: "itemCount",
    question: "How many items do you need to sell?",
    subtitle: "Takes 5 seconds to tell us",
    type: "single",
    options: [
      {
        id: "few",
        text: "Just a few (1\u201310 items)",
        icon: "\u{1F4E6}",
        points: { garage: 10, diy: 8 },
      },
      {
        id: "some",
        text: "A decent amount (10\u201350 items)",
        icon: "\u{1F4E6}",
        points: { estate: 2, garage: 10, neighborhood: 5, diy: 5 },
      },
      {
        id: "many",
        text: "Quite a lot (50\u2013200 items)",
        icon: "\u{1F3E0}",
        points: { estate: 8, garage: 3, diy: 3, whiteGlove: 3 },
      },
      {
        id: "entire",
        text: "An entire household (200+ items)",
        icon: "\u{1F3F0}",
        points: { estate: 10, whiteGlove: 8 },
      },
    ],
  },

  {
    id: "timeline",
    question: "What\u2019s your timeline?",
    subtitle: "Keep it simple, we\u2019ll dig in later",
    type: "single",
    options: [
      {
        id: "asap",
        text: "ASAP \u2014 need it done quickly",
        icon: "\u26A1",
        points: { whiteGlove: 6, estate: 5 },
      },
      {
        id: "weeks",
        text: "A few weeks is fine",
        icon: "\u{1F4C5}",
        points: { estate: 5, garage: 6, neighborhood: 6, diy: 5 },
      },
      {
        id: "months",
        text: "No rush, within a few months",
        icon: "\u{1F5D3}\u{FE0F}",
        points: { garage: 8, diy: 8 },
      },
      {
        id: "flexible",
        text: "Very flexible \u2014 whatever works best",
        icon: "\u23F0",
        points: { garage: 7, neighborhood: 8, diy: 7 },
      },
    ],
  },

  {
    id: "helpLevel",
    question: "How would you like us to help?",
    type: "single",
    options: [
      {
        id: "fullService",
        text: "Do it all for me \u2014 I\u2019m overwhelmed",
        icon: "\u{1F64F}",
        points: { whiteGlove: 10 },
      },
      {
        id: "someHelp",
        text: "Help with the complicated parts",
        icon: "\u{1F91D}",
        points: { whiteGlove: 4, diy: 4 },
      },
      {
        id: "diy",
        text: "I\u2019ll do it myself with AI tools",
        icon: "\u{1F4AA}",
        points: { diy: 10 },
      },
      {
        id: "learning",
        text: "I want to learn while doing it",
        icon: "\u{1F4DA}",
        points: { diy: 9, garage: 2 },
      },
    ],
  },

  {
    id: "budget",
    question: "What level of investment feels right?",
    type: "single",
    options: [
      {
        id: "free",
        text: "Free or very low cost",
        icon: "\u{1F193}",
        recommendedTier: "FREE",
        points: { diy: 8 },
      },
      {
        id: "affordable",
        text: "$10\u2013$25/month subscription",
        icon: "\u{1F4B5}",
        recommendedTier: "STARTER",
        points: { diy: 7 },
      },
      {
        id: "invest",
        text: "$25\u2013$75/month for full features",
        icon: "\u{1F4B3}",
        recommendedTier: "PLUS",
        points: { diy: 6, estate: 3 },
      },
      {
        id: "premium",
        text: "$1,500+ for professional on-site help",
        icon: "\u{1F48E}",
        recommendedTier: "ESSENTIALS",
        points: { whiteGlove: 10 },
      },
    ],
  },

  {
    id: "specialItems",
    question: "Do you have any of these?",
    subtitle: "Select all that apply \u2014 we\u2019ll tailor our recommendation",
    type: "multiple",
    options: [
      {
        id: "antiques",
        text: "Antiques or collectibles",
        icon: "\u{1F3FA}",
        needsAppraisal: true,
      },
      {
        id: "jewelry",
        text: "Jewelry or precious metals",
        icon: "\u{1F48D}",
        needsAppraisal: true,
      },
      {
        id: "art",
        text: "Art or sculptures",
        icon: "\u{1F5BC}\u{FE0F}",
        needsAppraisal: true,
      },
      {
        id: "furniture",
        text: "Large furniture (sofas, dressers, etc.)",
        icon: "\u{1F6CB}\u{FE0F}",
        needsShipping: true,
      },
      {
        id: "vehicles",
        text: "Vehicles (car, boat, RV)",
        icon: "\u{1F697}",
        specialCategory: true,
      },
      {
        id: "normal",
        text: "Mostly regular household items",
        icon: "\u{1F4E6}",
      },
    ],
  },
];

// ── Scoring / Recommendation Logic ────────────────────────────────────────────

function calculateConfidence(scores: Scores): number {
  const vals = Object.values(scores).filter((v) => v > 0);
  if (vals.length === 0) return 50;
  const max = Math.max(...vals);
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.min(97, Math.round(50 + (max / sum) * 50));
}

function calculateRecommendation(
  scores: Scores,
  answers: Record<string, string | string[]>
): Recommendation {
  const { estate, garage, neighborhood, whiteGlove, diy } = scores;

  // Primary category
  const categoryScores = { estate, garage, neighborhood };
  const primaryCategory = (
    Object.keys(categoryScores) as Array<keyof typeof categoryScores>
  ).reduce((a, b) => (categoryScores[a] >= categoryScores[b] ? a : b));

  // Service level
  const serviceLevel = whiteGlove > diy ? "whiteGlove" : "diy";

  // Budget signal
  const budget = answers.budget as string | undefined;

  // Determine recommended tier
  let recommendedTier: string;

  if (budget === "premium" || (whiteGlove >= 10 && serviceLevel === "whiteGlove")) {
    // White-glove
    if (estate > 12 || (answers.itemCount === "entire")) {
      recommendedTier = "LEGACY";
    } else if (estate > 6 || (answers.itemCount === "many")) {
      recommendedTier = "PROFESSIONAL";
    } else {
      recommendedTier = "ESSENTIALS";
    }
  } else {
    // DIY digital
    if (budget === "free") {
      recommendedTier = "FREE";
    } else if (
      budget === "invest" ||
      (estate > 7 && diy > 4) ||
      answers.itemCount === "many"
    ) {
      recommendedTier = "PLUS";
    } else if (budget === "affordable" || (estate + garage) > 5) {
      recommendedTier = "STARTER";
    } else {
      recommendedTier = "STARTER";
    }

    // Bump to PRO for very large estates doing DIY
    if (answers.itemCount === "entire" && diy > whiteGlove) {
      recommendedTier = "PRO";
    }

    // Neighborhood override
    if (primaryCategory === "neighborhood" && neighborhood > 8) {
      recommendedTier = "STARTER"; // bundle upsell on results page
    }
  }

  const specialItems = (answers.specialItems as string[] | undefined) ?? [];
  const needsAppraisal = specialItems.some((id) =>
    ["antiques", "jewelry", "art"].includes(id)
  );
  const needsShipping = specialItems.includes("furniture");
  const hasVehicles = specialItems.includes("vehicles");

  return {
    primaryCategory,
    serviceLevel: ["ESSENTIALS", "PROFESSIONAL", "LEGACY"].includes(
      recommendedTier
    )
      ? "whiteGlove"
      : "diy",
    recommendedTier,
    needsAppraisal,
    needsShipping,
    hasVehicles,
    scores: scores as unknown as Record<string, number>,
    confidence: calculateConfidence(scores),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingQuiz() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [scores, setScores] = useState<Scores>({
    estate: 0,
    garage: 0,
    neighborhood: 0,
    whiteGlove: 0,
    diy: 0,
  });
  const [fading, setFading] = useState(false);
  const [showWhiteGlovePreview, setShowWhiteGlovePreview] = useState(false);
  const [showNotesStep, setShowNotesStep] = useState(false);
  const [userNotes, setUserNotes] = useState("");

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progressPct = showWhiteGlovePreview
    ? Math.round(((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100)
    : showNotesStep
    ? 95
    : Math.round((currentQuestion) / QUIZ_QUESTIONS.length * 100);

  const selectedIds = (() => {
    const a = answers[question.id];
    if (!a) return [];
    return Array.isArray(a) ? a : [a];
  })();

  const finalizeQuiz = (notes: string) => {
    const rec = calculateRecommendation(scores, answers);
    const helpLevel = answers.helpLevel as string | undefined;
    const budget = answers.budget as string | undefined;
    const wantsHelp = helpLevel === "fullService" || helpLevel === "someHelp";
    const budgetBlocksWhiteGlove = budget === "free" || budget === "affordable";

    // Budget guard: route fullService + sufficient budget to /white-glove
    if (helpLevel === "fullService" && !budgetBlocksWhiteGlove) {
      const params = new URLSearchParams();
      params.set("wantsHelp", "true");
      params.set("r", JSON.stringify(rec));
      if (notes) params.set("userNotes", notes);
      router.push(`/white-glove?${params.toString()}`);
      return;
    }

    // Standard results route
    const params = new URLSearchParams();
    params.set("r", JSON.stringify(rec));
    if (wantsHelp) params.set("wantsHelp", "true");
    if (notes) params.set("userNotes", notes);
    router.push(`/onboarding/results?${params.toString()}`);
  };

  const advanceTo = (
    nextIndex: number,
    finalScores: Scores,
    finalAnswers: Record<string, string | string[]>
  ) => {
    setFading(true);
    setTimeout(() => {
      if (nextIndex >= QUIZ_QUESTIONS.length) {
        // Show optional notes step instead of navigating directly
        setShowNotesStep(true);
        setFading(false);
      } else {
        setCurrentQuestion(nextIndex);
        setFading(false);
      }
    }, 220);
  };

  const handleSingleAnswer = (option: QuizOption) => {
    const newAnswers = { ...answers, [question.id]: option.id };
    const newScores = { ...scores };
    if (option.points) {
      for (const [k, v] of Object.entries(option.points) as [
        keyof Scores,
        number
      ][]) {
        newScores[k] = (newScores[k] ?? 0) + v;
      }
    }
    setAnswers(newAnswers);
    setScores(newScores);

    // White Glove preview intercept after Q4 (helpLevel)
    if (question.id === "helpLevel" && (option.id === "fullService" || option.id === "someHelp")) {
      setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setShowWhiteGlovePreview(true);
          setFading(false);
        }, 220);
      }, 300);
      return;
    }

    setTimeout(() => advanceTo(currentQuestion + 1, newScores, newAnswers), 300);
  };

  const handleWhiteGloveContinue = () => {
    setFading(true);
    setTimeout(() => {
      setShowWhiteGlovePreview(false);
      setCurrentQuestion(currentQuestion + 1);
      setFading(false);
    }, 220);
  };

  const handleMultipleToggle = (optionId: string) => {
    setAnswers((prev) => {
      const current = (prev[question.id] as string[]) ?? [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [question.id]: updated };
    });
  };

  const handleMultipleAdvance = () => {
    advanceTo(currentQuestion + 1, scores, answers);
  };

  const goBack = () => {
    if (showWhiteGlovePreview) {
      setFading(true);
      setTimeout(() => {
        setShowWhiteGlovePreview(false);
        setFading(false);
      }, 220);
      return;
    }
    if (showNotesStep) {
      setFading(true);
      setTimeout(() => {
        setShowNotesStep(false);
        setFading(false);
      }, 220);
      return;
    }
    if (currentQuestion === 0) return;
    setFading(true);
    setTimeout(() => {
      setCurrentQuestion((p) => p - 1);
      setFading(false);
    }, 220);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem",
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

      <div style={{ width: "100%", maxWidth: "680px" }}>
        {/* Progress */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
            }}
          >
            <span>
              {showNotesStep
                ? "One last thing"
                : showWhiteGlovePreview
                ? "Personalized for you"
                : `Question ${currentQuestion + 1} of ${QUIZ_QUESTIONS.length}`}
            </span>
            <span style={{ color: "var(--accent-theme)", fontWeight: 700 }}>
              {showNotesStep ? "Optional" : `${progressPct}% complete`}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "var(--ghost-bg)",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--accent-theme), var(--accent))",
                borderRadius: "999px",
                transition: "width 0.4s ease",
                boxShadow: progressPct > 0 ? "0 0 8px var(--accent-glow)" : "none",
              }}
            />
          </div>
        </div>

        {/* ── White Glove Preview ── */}
        {showWhiteGlovePreview ? (
          <div
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? "translateX(12px)" : "translateX(0)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            <div
              style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--accent-theme)",
                borderRadius: "1.5rem",
                padding: "2rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.4rem" }}>{"\u2728"}</span>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  White Glove Preview
                </h3>
              </div>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  marginBottom: "1.25rem",
                  marginTop: "0.25rem",
                }}
              >
                Premium hands-on support for your collection
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
                {[
                  "Expert consultation on value and care",
                  "Market research and insurance guidance",
                  "Direct access to trusted buyers (if selling)",
                  "Personalized recommendations for growth",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span
                      style={{
                        color: "var(--accent-theme)",
                        fontSize: "0.85rem",
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    >
                      {"\u2713"}
                    </span>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/white-glove"
                style={{
                  fontSize: "0.85rem",
                  color: "var(--accent-theme)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Learn more {"\u2192"}
              </Link>
            </div>

            {/* Navigation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <button
                onClick={goBack}
                style={{
                  padding: "0.6rem 1.25rem",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
              >
                {"\u2190"} Back
              </button>
              <button
                onClick={handleWhiteGloveContinue}
                style={{
                  padding: "0.7rem 1.75rem",
                  background: "var(--accent-theme)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.875rem",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Continue to budget {"\u2192"}
              </button>
            </div>
          </div>

        ) : showNotesStep ? (
          /* ── Optional Notes Step ── */
          <div
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? "translateX(12px)" : "translateX(0)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            <div
              style={{
                background: "var(--bg-card-solid)",
                borderRadius: "1.5rem",
                padding: "2.5rem",
                boxShadow: "var(--card-shadow)",
                border: "1px solid var(--border-default)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                  lineHeight: 1.3,
                }}
              >
                Anything else we should know?
              </h2>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                Tell us anything that might help us serve you better (optional)
              </p>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="For example: items in several categories, planning to sell soon, interested in insurance..."
                style={{
                  width: "100%",
                  height: "120px",
                  background: "var(--ghost-bg)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "0.75rem",
                  padding: "0.875rem",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  textAlign: "right",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: "0.375rem",
                }}
              >
                {userNotes.length}/500
              </div>

              {/* Navigation */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1.25rem",
                }}
              >
                <button
                  onClick={goBack}
                  style={{
                    padding: "0.6rem 1.25rem",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                  }}
                >
                  {"\u2190"} Back
                </button>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => finalizeQuiz("")}
                    style={{
                      padding: "0.7rem 1.25rem",
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                    }}
                  >
                    Skip {"\u2192"}
                  </button>
                  <button
                    onClick={() => finalizeQuiz(userNotes)}
                    style={{
                      padding: "0.7rem 1.75rem",
                      background: "var(--accent-theme)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.875rem",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                    }}
                  >
                    See My Results {"\u2192"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        ) : (
          /* ── Question Card (standard quiz flow) ── */
          <div
            style={{
              background: "var(--bg-card-solid)",
              borderRadius: "1.5rem",
              padding: "2.5rem",
              boxShadow: "var(--card-shadow)",
              border: "1px solid var(--border-default)",
              opacity: fading ? 0 : 1,
              transform: fading ? "translateX(12px)" : "translateX(0)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "0.25rem",
                lineHeight: 1.3,
              }}
            >
              {question.question}
            </h2>

            {question.subtitle && (
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                {question.subtitle}
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
                marginTop: question.subtitle ? 0 : "1.5rem",
              }}
            >
              {question.options.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (question.type === "single") {
                        handleSingleAnswer(option);
                      } else {
                        handleMultipleToggle(option.id);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem 1.25rem",
                      borderRadius: "0.875rem",
                      border: `2px solid ${isSelected ? "var(--accent-theme)" : "var(--ghost-bg)"}`,
                      background: isSelected ? "var(--accent-dim)" : "var(--bg-card-solid)",
                      boxShadow: isSelected ? "0 0 0 3px var(--accent-glow)" : "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>
                      {option.icon}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "0.95rem",
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "var(--accent-theme)" : "var(--text-primary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {option.text}
                    </span>
                    {question.type === "multiple" && (
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          border: `2px solid ${isSelected ? "var(--accent-theme)" : "var(--border-default)"}`,
                          background: isSelected ? "var(--accent-theme)" : "var(--bg-card-solid)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                      >
                        {isSelected && (
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "0.7rem",
                              fontWeight: 800,
                            }}
                          >
                            {"\u2713"}
                          </span>
                        )}
                      </div>
                    )}
                    {question.type === "single" && isSelected && (
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "var(--accent-theme)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 800 }}>
                          {"\u2713"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1.75rem",
              }}
            >
              <button
                onClick={goBack}
                disabled={currentQuestion === 0}
                style={{
                  padding: "0.6rem 1.25rem",
                  background: "none",
                  border: "none",
                  color: currentQuestion === 0 ? "var(--border-default)" : "var(--text-muted)",
                  cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                }}
              >
                {"\u2190"} Back
              </button>

              {question.type === "multiple" && (
                <button
                  onClick={handleMultipleAdvance}
                  style={{
                    padding: "0.7rem 1.75rem",
                    background: "var(--accent-theme)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.875rem",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  {currentQuestion === QUIZ_QUESTIONS.length - 1
                    ? "See My Results \u2192"
                    : "Next \u2192"}
                </button>
              )}

              {question.type === "single" && (
                <span style={{ fontSize: "0.78rem", color: "var(--muted-color)" }}>
                  Select an option to continue
                </span>
              )}
            </div>
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            fontSize: "0.78rem",
            color: "var(--muted-color)",
            marginTop: "1.25rem",
          }}
        >
          No account needed {"\u00B7"} Takes about 2 minutes
        </p>
      </div>
    </div>
  );
}
