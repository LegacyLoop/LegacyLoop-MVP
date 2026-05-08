# Sylvia AI · Folder Architecture

**Date:** 2026-05-08 · R22.6 · post NB Seed 1 (R22 P1 `2d9ff63`) · pre R24 brain wire
**Status:** Architecture canon · names the parts before R24 wires the brain

---

## §1 · Substrate inventory at HEAD `2d9ff63` (grep-verified)

```
lib/sylvia/                    (793 LOC · 4 files · TypeScript)
├── index.ts                   (41 LOC · public surface re-exports)
├── triage-router.ts           (447 LOC · stakes classifier · routes
│                               low-stakes → single-AI · high-stakes
│                               → multi-AI consensus dispatch)
├── memory.ts                  (204 LOC · sylvia-data/memory R/W ·
│                               session + provenance persistence)
└── types.ts                   (101 LOC · forward-compat shapes ·
                                ModelAlias · TaskComplexity ·
                                SylviaMemory shape contracts)
```

```
sylvia-data/                   (gitignored at .gitignore:74)
├── audit/                     (audit log destination · per-call trace)
├── corpus/                    (scrape ingest landing zone · Moat 11)
├── memory/                    (collective memory layer · cross-agent)
└── vector-store/              (embedding cache · semantic retrieval)
```

```
.env.sylvia                    (chmod 600 · 2093 bytes · 5 API keys
                                + budget caps + rate limits)
                                ANTHROPIC_API_KEY_SYLVIA
                                OPENAI_API_KEY_SYLVIA
                                GEMINI_API_KEY_SYLVIA
                                XAI_GROK_API_KEY_SYLVIA
                                PERPLEXITY_API_KEY_SYLVIA
                                + per-key daily caps
                                + provider rate limits

NOTE: file content NEVER read into this doc · cite presence + bytes only
      per §3 LOCKED of CMD-SYLVIA-ARCHITECTURE-TRIO V19 R22.6 spec.
```

```
app/api/sylvia/                (FUTURE · R24 wire location)
├── consensus/route.ts          (Truth Gate · multi-AI dispatch · Moat 10)
├── ask/route.ts                (single-agent · low-stakes path)
├── corpus/route.ts             (KB query · Moat 11 retrieval)
└── health/route.ts             (provider liveness · ops dashboard)

NOTE: directory does NOT exist at HEAD 2d9ff63 · greenfield for R24.
```

```
lib/dossier/                   (NB Seed 1 · R22 P1 2d9ff63 · 104 LOC)
├── types.ts                   (49 LOC · DossierManifest shape)
└── render-stub.ts             (55 LOC · placeholder renderer)
                               Phase 7 NotebookLM-style dossier path
```

```
docs/sylvia/                   (this directory · architecture canon)
├── SYLVIA_FOLDER_ARCHITECTURE.md   (this file · R22.6)
├── SYLVIA_API_CONTRACT.md          (HTTP seam · v1 contract)
└── SYLVIA_MIGRATION_PLAN.md        (Phase 3 dedicated-box playbook)
```

---

## §2 · Boundary doctrine

Three phases · one migration-safe seam:

| Phase | Sylvia runs as | LegacyLoop calls via | Status |
|---|---|---|---|
| 1 (today) | In-process import from `lib/sylvia/*` | `import { triageAndRoute } from "@/lib/sylvia"` | LIVE at HEAD 2d9ff63 |
| 2 (R24) | localhost HTTP via `app/api/sylvia/*` | `fetch("http://localhost:3000/api/sylvia/...")` | GATED on R24 brain wire |
| 3 (post-seed) | External HTTPS on dedicated AI hardware | `fetch(SYLVIA_BASE_URL + "/api/sylvia/...")` | GATED on CEO hardware purchase |

**Migration invariant:** the HTTP contract (next doc) is identical across Phase 2 + Phase 3 · only `SYLVIA_BASE_URL` env var changes. Phase 3 is single-env-var-flip when the dedicated box is provisioned.

---

## §3 · Migration boundary spec

**Phase 1 → Phase 2 transition (R24 cylinder):**
- Author `app/api/sylvia/{ask,consensus,corpus,health}/route.ts`
- Each route imports from `lib/sylvia/*` (zero rewrite of substrate)
- Auth gate: `X-Sylvia-Internal-Secret` header per `feedback_pushback_means_replace.md` (reuse pattern from R22 P0 `app/api/internal/scraper-comp-count/route.ts` · constant-time compare cloned from R16 P0)
- LegacyLoop callsites swap from in-process import → `fetch("/api/sylvia/...")`

**Phase 2 → Phase 3 transition (post-seed migration):**
- Provision dedicated machine (Mac Studio · Threadripper · etc.)
- `git clone` LegacyLoop repo (read-only consumer of `lib/sylvia/*`)
- Stand up `app/api/sylvia/*` server on dedicated box port 3001
- DNS: `sylvia.legacy-loop.com` A-record to dedicated box
- TLS: Let's Encrypt or Tailscale MagicDNS
- LegacyLoop Vercel: set `SYLVIA_BASE_URL=https://sylvia.legacy-loop.com`
- Zero LegacyLoop source code changes (only env var)

---

## §4 · Reference: V2 12-moat doc

Maps to `Claude_Setup_Patterns_for_Sylvia_2026-05-08.md` V2 (12 moats):

| Moat | Sylvia surface |
|---|---|
| **M1** (Two-tier memory · auto-consolidation · stale detection) | `lib/sylvia/memory.ts` + `sylvia-data/memory/` |
| **M5b** (Hive-mind · Queen→Worker dispatch) | `lib/sylvia/triage-router.ts` stakes-based fan-out |
| **M7** (Provenance discipline · real-time vs memory vs training vs inferred) | `lib/sylvia/types.ts` provenance shape · enforced in `app/api/sylvia/*` (R24) |
| **M10** (Truth Gate · agreement-score consensus) | `app/api/sylvia/consensus/route.ts` (R24) |
| **M11** (Domain Corpus · ScraperComp + curated KB) | `sylvia-data/corpus/` + Phase 7 NotebookLM-style index |
| **M12** (Outreach · proactive nudges) | Phase 8 Manus autonomous lane (banked) |

---

## §5 · Lineage chain

```
Sylvia substrate (lib/sylvia/* · 793 LOC · live)
  ↓
R22.6 docs/sylvia/* (this fire · architecture canon)
  ↓
R24 brain wire (app/api/sylvia/{ask,consensus,corpus,health}/route.ts)
  ↓
NB Seed 1 (R22 P1 2d9ff63 · lib/dossier/* · 104 LOC)
  ↓
NB Seed 2 (R23 P0 banked · KB types · Manus prereq dovetail)
  ↓
Phase 7 NotebookLM-style dossier rendering
  ↓
M Seed 1 (R23 P1 banked · Manus autonomous outreach scaffold)
  ↓
M Seed 2-4 (banked · post-Phase-7 close)
  ↓
Phase 8 Manus autonomous lane (post-seed)
```

---

## §6 · ZERO-EDIT contract (this audit)

This document is a READ-ONLY description of substrate. It does NOT modify `lib/sylvia/*`, `lib/dossier/*`, `.env.sylvia` content, `sylvia-data/*` content, or any source code. `app/api/sylvia/*` is CITED as future location only — directory does not exist at HEAD `2d9ff63` and is not created by this fire.

End of `SYLVIA_FOLDER_ARCHITECTURE.md` · R22.6 · audit-doc-only.
