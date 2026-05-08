// lib/sylvia/dispatcher/agreement.ts
//
// CMD-SYLVIA-TRUTH-GATE-DISPATCHER V19 · R24 P0 · 2026-05-08
//
// Pairwise agreementScore calculator. v1 implementation: deterministic,
// cheap, zero LLM cost. Improvable in R25+ via embedding similarity.
//
// Algorithm:
//   1. Extract a primary numeric signal from each response (first $-prefixed
//      number, else first standalone number) when high-stakes valuation.
//   2. For non-numeric responses, normalize text and use Jaccard token
//      overlap as the similarity score.
//   3. Compute pairwise similarity (n choose 2 pairs).
//   4. Weighted average across pairs · degrade flag if <2 providers
//      responded.

export interface ProviderResponse {
  provider: string;       // "claude-haiku-4-5" | "gpt-4o-mini" | etc
  answer: string;
  costUsd: number;
  latencyMs: number;
  ok: boolean;
}

export interface PairScore {
  pair: [string, string];
  score: number;          // 0-100
}

export interface AgreementResult {
  score: number;          // 0-100 weighted average
  perPair: PairScore[];
  degraded: boolean;      // true when fewer than 2 successful responses
  successfulCount: number;
}

const NUMERIC_RX = /\$?\s*([0-9]{1,3}(?:[,_][0-9]{3})*(?:\.[0-9]+)?|\d+(?:\.\d+)?)/;
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "of", "in", "on", "at", "to", "for", "with", "by", "and", "or", "but",
  "i", "you", "it", "this", "that", "these", "those", "as",
]);

function extractNumeric(text: string): number | null {
  const match = text.match(NUMERIC_RX);
  if (!match) return null;
  const cleaned = match[1].replace(/[,_]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 2 && !STOPWORDS.has(t))
  );
}

function numericSimilarity(a: number, b: number): number {
  if (a === 0 && b === 0) return 100;
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max === 0) return 100;
  const pctDiff = Math.abs(a - b) / max;
  return Math.max(0, Math.min(100, Math.round((1 - pctDiff) * 100)));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 100;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return Math.round((intersection / union) * 100);
}

function pairwiseScore(a: ProviderResponse, b: ProviderResponse): number {
  const numA = extractNumeric(a.answer);
  const numB = extractNumeric(b.answer);
  if (numA !== null && numB !== null) return numericSimilarity(numA, numB);
  return jaccardSimilarity(tokenize(a.answer), tokenize(b.answer));
}

export function computeAgreement(responses: ProviderResponse[]): AgreementResult {
  const successful = responses.filter(r => r.ok);
  if (successful.length < 2) {
    return {
      score: 0,
      perPair: [],
      degraded: true,
      successfulCount: successful.length,
    };
  }

  const perPair: PairScore[] = [];
  for (let i = 0; i < successful.length; i++) {
    for (let j = i + 1; j < successful.length; j++) {
      perPair.push({
        pair: [successful[i].provider, successful[j].provider],
        score: pairwiseScore(successful[i], successful[j]),
      });
    }
  }

  const avg = perPair.reduce((sum, p) => sum + p.score, 0) / perPair.length;
  return {
    score: Math.round(avg),
    perPair,
    degraded: successful.length < responses.length,
    successfulCount: successful.length,
  };
}
