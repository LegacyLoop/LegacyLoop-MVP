# Sylvia AI · HTTP API Contract (v1)

**Date:** 2026-05-08 · R22.6 · post NB Seed 1 · pre R24 brain wire
**Versioning:** v1 today (in-process) → v1 R24 (localhost HTTP · seam preserved) → v2 Phase 3 if response shape evolves (additive-only · v1 alias kept)
**Pattern source:** R16 P0 `615de06` constant-time auth · R22 P0 `f51ab90` triple-source secret pattern at `app/api/internal/scraper-comp-count/route.ts`

---

## §1 · Auth (canonical · cloned from R22 P0 pattern)

**Header:** `X-Sylvia-Internal-Secret: <SYLVIA_API_INTERNAL_SECRET>`
**Source:** `.env.sylvia` (chmod 600 · NEVER committed · NEVER read into a doc)
**Verify:** `crypto.timingSafeEqual` + length guard + `Buffer.from(utf8)` per BINDING DOC-CRYPTOGRAPHIC-CONSTANT-TIME-COMPARE (sub-doctrine of #22 · 2/5 progressing toward BINDING)
**On reject:** 401 with `{ error: "Unauthorized" }` · zero side effects · zero log body

**Triple-source resolution** (additive · all three accepted equivalent):
- `Authorization: Bearer <secret>` header
- `X-Sylvia-Internal-Secret: <secret>` header
- `?token=<secret>` query parameter

**Fail-closed:** if `SYLVIA_API_INTERNAL_SECRET` env var is missing/empty at runtime, every request returns 500 with `{ error: "Server misconfigured" }` (production misconfiguration is safer than open endpoint).

---

## §2 · Endpoints (4 total at R24 brain wire)

### 2.1 · `POST /api/sylvia/ask`

Single-agent low-stakes path · routes to one provider via `lib/sylvia/triage-router.ts` stakes classifier.

**Request:**
```json
{
  "question": "string",
  "stakes": "low" | "high",
  "maxTokens": 1024,
  "sessionId": "string?"
}
```

**Response (200):**
```json
{
  "answer": "string",
  "confidenceBand": 75,
  "provenance": [
    { "kind": "real-time", "source": "https://...", "timestamp": "2026-05-08T..." }
  ],
  "sessionId": "string",
  "costUsd": 0.0021,
  "latencyMs": 845
}
```

### 2.2 · `POST /api/sylvia/consensus`

High-stakes 4-or-5-AI dispatch with Truth Gate (Moat 10).

**Request:**
```json
{
  "question": "string",
  "providers": ["anthropic", "openai", "gemini", "xai", "perplexity"],
  "maxBudgetUsd": 0.50,
  "sessionId": "string?"
}
```

**Response (200):**
```json
{
  "answer": "string",
  "agreementScore": 87,
  "verdict": "verified" | "partial" | "refused",
  "provenance": [...],
  "perProvider": [
    { "provider": "anthropic", "answer": "...", "latencyMs": 920, "costUsd": 0.0035 },
    { "provider": "openai", "answer": "...", "latencyMs": 1100, "costUsd": 0.0028 }
  ],
  "sessionId": "string",
  "totalCostUsd": 0.0142,
  "totalLatencyMs": 1100
}
```

**Response (422 · refusal):**
```json
{
  "error": "Need more info",
  "code": "VALIDATION",
  "agreementScore": 62,
  "perProvider": [...]
}
```

### 2.3 · `POST /api/sylvia/corpus`

Domain corpus retrieval (Moat 11) · backed by `sylvia-data/corpus/` + `sylvia-data/vector-store/`.

**Request:**
```json
{
  "query": "string",
  "topK": 5,
  "filterCategory": "antiques" | "vehicles" | null
}
```

**Response (200):**
```json
{
  "hits": [
    {
      "docId": "string",
      "score": 0.87,
      "source": "scraper-comp-12345",
      "timestamp": "2026-04-15T...",
      "content": "string"
    }
  ],
  "totalCorpusSize": 18452,
  "queryLatencyMs": 42
}
```

### 2.4 · `GET /api/sylvia/health`

Provider liveness · ops dashboard · LegacyLoop status pages.

**Response (200):**
```json
{
  "status": "ok",
  "providersOk": {
    "anthropic": true,
    "openai": true,
    "gemini": true,
    "xai": true,
    "perplexity": true
  },
  "lastConsensusAt": "2026-05-08T...",
  "budgetUsedToday": 4.12,
  "budgetCapToday": 20.00,
  "corpusSize": 18452,
  "memorySize": 947
}
```

---

## §3 · Truth Gate semantics (Moat 10)

| `agreementScore` | `verdict` | UI signal |
|---|---|---|
| ≥ 85 | `verified` | "Verified by N AIs · {score}%" |
| 70–84 | `partial` | "AIs partially agree · {score}%" + caveat tooltip |
| < 70 | `refused` | 422 response · UI shows "Need more info" |

`agreementScore` derived from semantic similarity across `perProvider[].answer` (TF-IDF cosine + answer-length penalty · NO LLM in the score function · cheap + deterministic).

### §3.1 · Empirical validation (Anthropic Project Vend / employee marketplace · May 2026)

**The Truth Gate moat is empirically validated by Anthropic's own internal experiment.** In May 2026, Anthropic ran a Slack-based marketplace where 69 employees let Claude agents represent them in real transactions. Results published:

- 186 deals · ~$4,000 traded for real physical goods
- Anthropic secretly assigned half the participants Opus, the other half Haiku (without telling them)
- **Opus users completed ~2 more deals on average · extracted $2.68 more as sellers · paid $245 less as buyers** (same items)
- **Haiku-using employees rated their deals nearly identical in fairness to Opus users** — they did NOT notice they were getting worse outcomes

**Why this matters for Sylvia's Truth Gate:**

1. **Cheap-model AI agents extract less value AND users can't tell.** Without a Truth Gate · weaker-model users in autonomous-selling contexts get systematically worse deals while believing they got fair ones. This is the silent failure mode the agreementScore + 4-AI dispatch + provenance discipline are built to prevent.
2. **The 4-AI quartet (Anthropic + OpenAI + Gemini + xAI) prevents single-model bias** at the moment of valuation. If 3 of 4 say "this brooch is worth $50" and 1 says "$5,000", the agreementScore drops · the response shows partial-or-refused · the user is protected from a hallucinated price.
3. **LegacyLoop's Phase 8 Manus autonomous selling moat is the productized version of Project Vend** — the SellingPipeline state machine (R23 P1 · `prisma/schema.prisma`) walks the same LIST → MONITORING → NEGOTIATING → ACCEPTED → SHIPPED → CLOSED arc Anthropic's agents walked manually. Truth Gate is the trust layer that makes it safe for senior estate sellers (our primary users) who can't verify the AI's judgment themselves.

**Investor narrative anchor:** *"Anthropic ran the experiment that proves LegacyLoop's Phase 8 thesis. Weak models extract less value · users don't notice. Sylvia's Truth Gate is the structural fix — every high-stakes valuation cross-validated by four independent AI models before it reaches the seller."*

---

## §4 · Provenance shape (Moat 7)

Every answer's `provenance[]` array carries one of the four kinds:

```ts
type ProvenanceEntry =
  | { kind: "real-time"; source: string /* URL */; timestamp: string /* ISO8601 */ }
  | { kind: "memory";    file: string;             age: number /* days */ }
  | { kind: "training";  cutoff: string /* "2026-01" */ }
  | { kind: "inferred";  rationale: string }
```

**Discipline rule:** if any entry is `kind: "training"` or `kind: "inferred"` AND `stakes === "high"`, response sets `confidenceBand <= 60` automatically. UI shows yellow caveat. Forces the system to either retrieve real-time data or bail.

---

## §5 · Versioning strategy

| Version | When | Path | Compatibility |
|---|---|---|---|
| v1 (in-process) | today | `import { triageAndRoute } from "@/lib/sylvia"` | substrate live |
| v1 (HTTP) | R24 | `POST /api/sylvia/{ask,consensus,corpus}` | seam preserved · request/response shape identical |
| v2 (HTTP) | Phase 3+ if shape evolves | `POST /api/sylvia/v2/...` | additive only · v1 alias kept indefinitely |

**Never break v1.** New fields = optional. Removed fields = `null` in v1, absent in v2. v2 only ships if a real consumer needs incompatible shape.

---

## §6 · Rate limits + budget cap

**Per-question budget cap:** default `$0.50` · returns 429 if `consensus` dispatch exceeds mid-flight (cancels remaining provider calls).

**Daily budget cap:** default `$20/day` · matches LegacyLoop Vercel cap per BINDING #25 DOC-VERCEL-BUDGET-CAP-20.

**Sylvia budget ISOLATED from LegacyLoop production cap.** Dedicated `.env.sylvia` per-key daily caps. Zero cross-bleed: a Sylvia burst cannot exhaust LegacyLoop's Vercel allowance.

**Provider rate limits** enforced via `.env.sylvia` per-key budgets. Hit a provider rate limit mid-consensus = drop that provider from the response, mark `agreementScore` as N-1 denominator, log to `sylvia-data/audit/`.

---

## §7 · Error envelope (canonical)

```json
4xx: { "error": "string", "code": "AUTH" | "RATE" | "BUDGET" | "VALIDATION", "traceId": "string" }
5xx: { "error": "Internal error", "traceId": "string" }
```

**Zero internal stack traces in 5xx** (security · `traceId` correlates to server-side logs · client never sees stack).

**4xx codes:**
- `AUTH` — secret missing/mismatch (401)
- `RATE` — provider rate limit / per-question budget exhausted (429)
- `BUDGET` — daily budget cap reached (429)
- `VALIDATION` — request shape invalid OR Truth Gate refusal at 422

---

## §8 · Migration safety

This contract is **identical** in Phase 2 (localhost) and Phase 3 (dedicated box). The only difference is `SYLVIA_BASE_URL` env var:

```bash
# Phase 2 (R24 · localhost)
SYLVIA_BASE_URL=http://localhost:3000

# Phase 3 (post-seed · dedicated AI hardware)
SYLVIA_BASE_URL=https://sylvia.legacy-loop.com
```

LegacyLoop callsites use the env var verbatim:
```ts
const res = await fetch(`${process.env.SYLVIA_BASE_URL}/api/sylvia/consensus`, {
  method: "POST",
  headers: {
    "X-Sylvia-Internal-Secret": process.env.SYLVIA_API_INTERNAL_SECRET!,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ question, stakes: "high" }),
});
```

Phase 2 → Phase 3 cut is one env var update + DNS flip. Zero source code rewrite.

---

## §9 · Reference: V2 12-moat doc

Auth + provenance + Truth Gate semantics map to `Claude_Setup_Patterns_for_Sylvia_2026-05-08.md` V2:
- **M7** (Provenance) · §4 of this doc
- **M10** (Truth Gate) · §3 of this doc
- **M11** (Corpus) · §2.3 endpoint backed by `sylvia-data/corpus/`

---

End of `SYLVIA_API_CONTRACT.md` · R22.6 · audit-doc-only · zero source · zero auth secrets in doc.
