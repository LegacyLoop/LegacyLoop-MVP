// lib/sylvia/dispatcher/budget.ts
//
// CMD-SYLVIA-TRUTH-GATE-DISPATCHER V19 · R24 P0 · 2026-05-08
//
// Two-tier budget cap enforcement:
//   · Per-question (default $0.50 · override via maxBudgetUsd request field)
//   · Daily ($20/day · matches BINDING #25 DOC-VERCEL-BUDGET-CAP-20)
//
// v1 storage: in-memory rolling counter for daily cap. Restart-on-deploy
// resets it (acceptable v1 · R25+ promotes to Redis or sylvia-data/audit/
// derived counter).

const DEFAULT_PER_QUESTION_USD = 0.5;
const DEFAULT_DAILY_USD = parseFloat(process.env.SYLVIA_DAILY_BUDGET_USD ?? "20");

let dailySpentUsd = 0;
let dailyWindowStart = Date.now();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function rolloverIfNeeded(): void {
  if (Date.now() - dailyWindowStart >= ONE_DAY_MS) {
    dailySpentUsd = 0;
    dailyWindowStart = Date.now();
  }
}

export interface BudgetExceeded {
  scope: "question" | "daily";
  cap: number;
  spent: number;
}

export class BudgetTracker {
  private spentUsd = 0;
  private readonly perQuestionCapUsd: number;

  constructor(maxBudgetUsd?: number) {
    this.perQuestionCapUsd = maxBudgetUsd ?? DEFAULT_PER_QUESTION_USD;
    rolloverIfNeeded();
  }

  /**
   * Pre-call check · throws BudgetExceeded if either cap would be hit
   * by an estimated additional spend. Caller catches + returns 429
   * envelope.
   */
  reserve(estimateUsd: number): BudgetExceeded | null {
    rolloverIfNeeded();
    if (this.spentUsd + estimateUsd > this.perQuestionCapUsd) {
      return {
        scope: "question",
        cap: this.perQuestionCapUsd,
        spent: this.spentUsd,
      };
    }
    if (dailySpentUsd + estimateUsd > DEFAULT_DAILY_USD) {
      return {
        scope: "daily",
        cap: DEFAULT_DAILY_USD,
        spent: dailySpentUsd,
      };
    }
    return null;
  }

  record(actualUsd: number): void {
    rolloverIfNeeded();
    this.spentUsd += actualUsd;
    dailySpentUsd += actualUsd;
  }

  getQuestionSpent(): number {
    return this.spentUsd;
  }

  getDailySpent(): number {
    rolloverIfNeeded();
    return dailySpentUsd;
  }
}
