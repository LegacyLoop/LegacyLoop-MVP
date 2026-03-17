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
    question: "What brings you to LegacyLoop?",
    type: "single",
    options: [
      {
        id: "downsizing",
        text: "Downsizing or moving to a smaller home",
        icon: "🏠",
        points: { estate: 10, garage: 2 },
      },
      {
        id: "inheritance",
        text: "Managing an inherited estate",
        icon: "👴",
        points: { estate: 10, whiteGlove: 3 },
      },
      {
        id: "decluttering",
        text: "Spring cleaning or general decluttering",
        icon: "🧹",
        points: { garage: 10, neighborhood: 3, diy: 5 },
      },
      {
        id: "moving",
        text: "Moving and need to sell items",
        icon: "📦",
        points: { estate: 3, garage: 8, diy: 4 },
      },
      {
        id: "community",
        text: "Organizing a neighborhood or group sale",
        icon: "🏘️",
        points: { neighborhood: 10, diy: 3 },
      },
    ],
  },

  {
    id: "itemCount",
    question: "How many items do you need to sell?",
    type: "single",
    options: [
      {
        id: "few",
        text: "Just a few (1–10 items)",
        icon: "📦",
        points: { garage: 10, diy: 8 },
      },
      {
        id: "some",
        text: "A decent amount (10–50 items)",
        icon: "📦",
        points: { estate: 2, garage: 10, neighborhood: 5, diy: 5 },
      },
      {
        id: "many",
        text: "Quite a lot (50–200 items)",
        icon: "🏠",
        points: { estate: 8, garage: 3, diy: 3, whiteGlove: 3 },
      },
      {
        id: "entire",
        text: "An entire household (200+ items)",
        icon: "🏰",
        points: { estate: 10, whiteGlove: 8 },
      },
    ],
  },

  {
    id: "timeline",
    question: "What's your timeline?",
    type: "single",
    options: [
      {
        id: "asap",
        text: "ASAP — need it done quickly",
        icon: "⚡",
        points: { whiteGlove: 6, estate: 5 },
      },
      {
        id: "weeks",
        text: "A few weeks is fine",
        icon: "📅",
        points: { estate: 5, garage: 6, neighborhood: 6, diy: 5 },
      },
      {
        id: "months",
        text: "No rush, within a few months",
        icon: "🗓️",
        points: { garage: 8, diy: 8 },
      },
      {
        id: "flexible",
        text: "Very flexible — whatever works best",
        icon: "⏰",
        points: { garage: 7, neighborhood: 8, diy: 7 },
      },
    ],
  },

  {
    id: "helpLevel",
    question: "How much help do you want?",
    type: "single",
    options: [
      {
        id: "fullService",
        text: "Do it all for me — I'm overwhelmed",
        icon: "🙏",
        points: { whiteGlove: 10 },
      },
      {
        id: "someHelp",
        text: "Help with the complicated parts",
        icon: "🤝",
        points: { whiteGlove: 4, diy: 4 },
      },
      {
        id: "diy",
        text: "I'll do it myself with AI tools",
        icon: "💪",
        points: { diy: 10 },
      },
      {
        id: "learning",
        text: "I want to learn while doing it",
        icon: "📚",
        points: { diy: 9, garage: 2 },
      },
    ],
  },

  {
    id: "budget",
    question: "What's your budget for getting started?",
    type: "single",
    options: [
      {
        id: "free",
        text: "Free or very low cost",
        icon: "🆓",
        recommendedTier: "FREE",
        points: { diy: 8 },
      },
      {
        id: "affordable",
        text: "$10–$25/month subscription",
        icon: "💵",
        recommendedTier: "STARTER",
        points: { diy: 7 },
      },
      {
        id: "invest",
        text: "$25–$75/month for full features",
        icon: "💳",
        recommendedTier: "PLUS",
        points: { diy: 6, estate: 3 },
      },
      {
        id: "premium",
        text: "$1,500+ for professional on-site help",
        icon: "💎",
        recommendedTier: "ESSENTIALS",
        points: { whiteGlove: 10 },
      },
    ],
  },

  {
    id: "specialItems",
    question: "Do you have any of these?",
    subtitle: "Select all that apply — we'll tailor our recommendation",
    type: "multiple",
    options: [
      {
        id: "antiques",
        text: "Antiques or collectibles",
        icon: "🏺",
        needsAppraisal: true,
      },
      {
        id: "jewelry",
        text: "Jewelry or precious metals",
        icon: "💍",
        needsAppraisal: true,
      },
      {
        id: "art",
        text: "Art or sculptures",
        icon: "🖼️",
        needsAppraisal: true,
      },
      {
        id: "furniture",
        text: "Large furniture (sofas, dressers, etc.)",
        icon: "🛋️",
        needsShipping: true,
      },
      {
        id: "vehicles",
        text: "Vehicles (car, boat, RV)",
        icon: "🚗",
        specialCategory: true,
      },
      {
        id: "normal",
        text: "Mostly regular household items",
        icon: "📦",
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

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progressPct = Math.round(
    ((currentQuestion) / QUIZ_QUESTIONS.length) * 100
  );

  const selectedIds = (() => {
    const a = answers[question.id];
    if (!a) return [];
    return Array.isArray(a) ? a : [a];
  })();

  const navigateToResults = (finalScores: Scores, finalAnswers: Record<string, string | string[]>) => {
    const rec = calculateRecommendation(finalScores, finalAnswers);
    router.push(
      `/onboarding/results?r=${encodeURIComponent(JSON.stringify(rec))}`
    );
  };

  const advanceTo = (
    nextIndex: number,
    finalScores: Scores,
    finalAnswers: Record<string, string | string[]>
  ) => {
    setFading(true);
    setTimeout(() => {
      if (nextIndex >= QUIZ_QUESTIONS.length) {
        navigateToResults(finalScores, finalAnswers);
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
    setTimeout(() => advanceTo(currentQuestion + 1, newScores, newAnswers), 300);
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
        background: "linear-gradient(135deg, #f0fdfa 0%, #eff6ff 100%)",
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

      <div style={{ width: "100%", maxWidth: "680px" }}>
        {/* Progress */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: "#78716c",
              marginBottom: "0.5rem",
            }}
          >
            <span>
              Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
            </span>
            <span style={{ color: "#0f766e", fontWeight: 700 }}>
              {progressPct}% complete
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "#e7e5e4",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "linear-gradient(90deg, #0f766e, #0d9488)",
                borderRadius: "999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "1.5rem",
            padding: "2.5rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            opacity: fading ? 0 : 1,
            transform: fading ? "translateX(12px)" : "translateX(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#1c1917",
              marginBottom: "0.25rem",
              lineHeight: 1.3,
            }}
          >
            {question.question}
          </h2>

          {question.subtitle && (
            <p style={{ fontSize: "0.88rem", color: "#78716c", marginBottom: "1.5rem" }}>
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
                    border: `2px solid ${isSelected ? "#0f766e" : "#e7e5e4"}`,
                    background: isSelected ? "#f0fdfa" : "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
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
                      color: isSelected ? "#0f766e" : "#1c1917",
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
                        border: `2px solid ${isSelected ? "#0f766e" : "#d6d3d1"}`,
                        background: isSelected ? "#0f766e" : "#fff",
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
                          ✓
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
                        background: "#0f766e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 800 }}>
                        ✓
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
                color: currentQuestion === 0 ? "#d6d3d1" : "#78716c",
                cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                fontSize: "0.88rem",
                fontWeight: 600,
              }}
            >
              ← Back
            </button>

            {question.type === "multiple" && (
              <button
                onClick={handleMultipleAdvance}
                style={{
                  padding: "0.7rem 1.75rem",
                  background: "#0f766e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {currentQuestion === QUIZ_QUESTIONS.length - 1
                  ? "See My Results →"
                  : "Next →"}
              </button>
            )}

            {question.type === "single" && (
              <span style={{ fontSize: "0.78rem", color: "#a8a29e" }}>
                Select an option to continue
              </span>
            )}
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.78rem",
            color: "#a8a29e",
            marginTop: "1.25rem",
          }}
        >
          No account needed · Takes about 2 minutes
        </p>
      </div>
    </div>
  );
}
