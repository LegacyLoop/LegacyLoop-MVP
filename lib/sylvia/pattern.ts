// lib/sylvia/pattern.ts
//
// CMD-SYLVIA-PATTERN-ENGINE-CONSOLIDATE V20 v2.1 R29 P74 · Wave 15 Slot C · 2026-05-16
//
// Unified pattern recognizer · consumes episodic (P72) + semantic (P73) +
// historical Truth Gate agreement signals · feeds classify.ts as additive
// `complexityHint` source (feature-flag gated · default OFF).
//
// Doctrine:
//   BINDING #16 · clones dispatcher/agreement.ts numeric-scoring pattern verbatim
//   BINDING #17 · §0.3 substrate read verbatim
//   BINDING #25 · zero AI spend v1 · rule-based recognizer · LLM escalation
//                 banked Phase 9.9 self-introspection loop closure
//
// Public API:
//   - recognizePattern({ promptHash, prompt, sessionId, historyWindowDays? })
//   - recognizeBatch(inputs[])
//   - getRecognizerStats()

import { recallByCause } from "./episodic";
import { recallByEntity } from "./semantic";
import type { EpisodicEntry } from "./memory-types";
import type { TaskComplexity } from "./types";

const DEFAULT_WINDOW_DAYS = 30;
const HISTORY_LIMIT = 50;
const SEMANTIC_LIMIT = 10;

// Confidence thresholds (rule-based · banked LLM-derived Phase 9.9)
const CONF_STRONG = 75;
const CONF_MODERATE = 50;
const CONF_WEAK = 25;

export interface PatternRecognizerInput {
  promptHash: string;
  prompt: string;
  sessionId: string;
  historyWindowDays?: number; // default 30
}

export interface PatternRecognizerResult {
  recognized: boolean;
  patternId?: string;
  confidence: number; // 0-100
  suggestedComplexity?: TaskComplexity;
  rationale: string;
  historyCount: number;
  agreementMedian?: number;
}

/** Median over a numeric array. Returns undefined for empty input. */
function median(xs: number[]): number | undefined {
  if (xs.length === 0) return undefined;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Pull a "head word" from a prompt for semantic recall. */
function topicHint(prompt: string): string {
  const cleaned = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 4)
    .slice(0, 3);
  return cleaned.join(" ") || prompt.slice(0, 24).toLowerCase();
}

/** Derive suggested complexity from agreement median + history density. */
function suggestComplexity(
  agreement: number | undefined,
  historyCount: number,
  semanticHitCount: number,
): TaskComplexity | undefined {
  if (historyCount === 0 && semanticHitCount === 0) return undefined;

  // Strong agreement with abundant history → simple (well-trodden path)
  if (agreement !== undefined && agreement >= 85 && historyCount >= 8) return "simple";
  // Low agreement → complex (ambiguous · dispatcher-friendly)
  if (agreement !== undefined && agreement < 60) return "complex";
  // Rich semantic neighborhood + moderate history → medium
  if (semanticHitCount >= 5 && historyCount >= 3) return "medium";
  // Sparse history + sparse semantic → specialized (novel territory)
  if (historyCount <= 2 && semanticHitCount <= 2) return "specialized";

  return "medium";
}

function computeConfidence(
  historyCount: number,
  semanticHitCount: number,
  agreement: number | undefined,
): number {
  // 3 sources · weighted blend · capped 0-100
  const historyScore = Math.min(100, historyCount * 8);
  const semanticScore = Math.min(100, semanticHitCount * 12);
  const agreementScore = agreement ?? 0;
  // 40% history · 30% semantic · 30% agreement
  return Math.round(historyScore * 0.4 + semanticScore * 0.3 + agreementScore * 0.3);
}

function patternId(promptHash: string, complexity: TaskComplexity | undefined): string {
  return `pattern:${complexity ?? "unknown"}:${promptHash.slice(0, 8)}`;
}

/**
 * Recognize a pattern from historical triage stream + semantic context.
 * Rule-based v1 · LLM escalation banked Phase 9.9.
 */
export async function recognizePattern(
  input: PatternRecognizerInput,
): Promise<PatternRecognizerResult> {
  const windowDays = input.historyWindowDays ?? DEFAULT_WINDOW_DAYS;

  // 1. Pull historical triage stream
  let history: EpisodicEntry[] = [];
  try {
    history = await recallByCause("triage", windowDays, HISTORY_LIMIT);
  } catch (err) {
    console.error("[sylvia-pattern] recallByCause failed:", err);
  }

  // 2. Filter by promptHash similarity (exact match in payload) for cheap dedup
  const matched = history.filter(h => {
    const payload = h.payload as Record<string, unknown>;
    return payload?.promptHash === input.promptHash || payload?.sessionId === input.sessionId;
  });
  const historyCount = matched.length || history.length;

  // 3. Pull semantic context around topic hint
  const topic = topicHint(input.prompt);
  let semanticHits: Awaited<ReturnType<typeof recallByEntity>> = [];
  try {
    semanticHits = await recallByEntity({ entity: topic, limit: SEMANTIC_LIMIT, fuzzy: true });
  } catch (err) {
    console.error("[sylvia-pattern] recallByEntity failed:", err);
  }
  const semanticHitCount = semanticHits.length;

  // 4. Extract agreement scores from prior consensus events (if present in payload)
  const agreements: number[] = [];
  for (const ev of history) {
    const payload = ev.payload as Record<string, unknown>;
    const score = payload?.agreementScore;
    if (typeof score === "number" && score >= 0 && score <= 100) agreements.push(score);
  }
  const agreementMedian = median(agreements);

  // 5. Derive complexity + confidence
  const suggestedComplexity = suggestComplexity(
    agreementMedian,
    historyCount,
    semanticHitCount,
  );
  const confidence = computeConfidence(historyCount, semanticHitCount, agreementMedian);

  const recognized = confidence >= CONF_WEAK && suggestedComplexity !== undefined;

  // 6. Build rationale string
  const rationaleParts: string[] = [];
  rationaleParts.push(`history=${historyCount}`);
  rationaleParts.push(`semantic=${semanticHitCount}`);
  if (agreementMedian !== undefined) rationaleParts.push(`agreement=${agreementMedian.toFixed(0)}`);
  rationaleParts.push(`conf=${confidence}`);
  if (suggestedComplexity) rationaleParts.push(`→${suggestedComplexity}`);
  if (confidence >= CONF_STRONG) rationaleParts.push("[strong]");
  else if (confidence >= CONF_MODERATE) rationaleParts.push("[moderate]");
  else if (confidence >= CONF_WEAK) rationaleParts.push("[weak]");
  else rationaleParts.push("[insufficient]");

  return {
    recognized,
    patternId: recognized ? patternId(input.promptHash, suggestedComplexity) : undefined,
    confidence,
    suggestedComplexity,
    rationale: rationaleParts.join(" · "),
    historyCount,
    agreementMedian,
  };
}

/** Batch recognizer · Promise.all parallel. */
export async function recognizeBatch(
  inputs: PatternRecognizerInput[],
): Promise<PatternRecognizerResult[]> {
  return Promise.all(inputs.map(input => recognizePattern(input)));
}

/**
 * Aggregate stats over recent recognizer activity.
 * v1 derives from episodic triage stream · banked AgentDB-native counts.
 */
export async function getRecognizerStats(): Promise<{
  totalPatterns: number;
  byComplexity: Record<TaskComplexity, number>;
  avgConfidence: number;
}> {
  const byComplexity: Record<TaskComplexity, number> = {
    simple: 0,
    medium: 0,
    complex: 0,
    specialized: 0,
  };
  let totalPatterns = 0;
  let confidenceSum = 0;

  try {
    const history = await recallByCause("triage", DEFAULT_WINDOW_DAYS, HISTORY_LIMIT);
    for (const ev of history) {
      const payload = ev.payload as Record<string, unknown>;
      const complexity = payload?.complexity;
      const confidence = payload?.confidence;
      if (typeof complexity === "string" && complexity in byComplexity) {
        byComplexity[complexity as TaskComplexity]++;
        totalPatterns++;
      }
      if (typeof confidence === "number") confidenceSum += confidence;
    }
  } catch (err) {
    console.error("[sylvia-pattern] getRecognizerStats failed:", err);
  }

  const avgConfidence = totalPatterns > 0 ? Math.round(confidenceSum / totalPatterns) : 0;
  return { totalPatterns, byComplexity, avgConfidence };
}
