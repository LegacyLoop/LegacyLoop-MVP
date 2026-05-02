# Cyl 7 Epic Close-Out · Data Flywheel Foundation

**LegacyLoop MVP · Sat 2026-05-02 · Production GREEN · 19 BINDING doctrines**

---

## §1 Executive Summary

The Cyl 7 epic landed the foundational data-flywheel pipeline that gates advisor I3's 100-item investor-intros milestone. Five cylinders shipped Saturday — n8n webhook receipt → Ollama Gateway parse → Prisma persist → Vercel maxDuration hot-fix → forward-compat type consolidation — with zero rollbacks, four BINDING doctrine ratifications, and thirteen NEW candidates banked. Production at app.legacy-loop.com serves the consolidated stack, ready to receive real Apify traffic Mon–Wed.

## §2 Architecture

```
n8n droplet (DigitalOcean)
        │
        ├── POST /api/webhooks/n8n     scraper.catch  (Cyl 7A)
        │       └── ScraperUsageLog (botName=n8n_scraper_catch)
        │
        └── POST /api/cron/scraper-parse  parsed_fields  (Cyl 7B · Option A fan-out)
                │
                ▼
        LiteLLM Gateway  /v1/chat/completions  (Cyl 7B · advisor A1 · zero LangChain)
                │
                ▼
        ScraperParsedItem  (Cyl 7B canonical types)
                │
                ▼
        toEnrichmentInput()  (Cyl 7C-V2 adapter · JSON-string → array)
                │
                ▼
        persistEnrichmentComps()  (Cyl 7C delegating to canonical writer)
                │
                ▼
        ScraperComp  @@unique([slug, sourceUrl])  (idempotency at DB layer)
                │
                ▼
        ScraperUsageLog  (4 botName discriminators across the pipeline)
```

**Telemetry channels:** four `botName` discriminators on `ScraperUsageLog` provide a full provenance audit trail across the pipeline:
- `n8n_scraper_catch` — Cyl 7A webhook receipt
- `ollama_parser_complete` / `ollama_parser_failed` — Cyl 7B parse outcome
- `n8n_scraper_persist` — Cyl 7C persist outcome (slug carries scraperId pass-through from 7A)

## §3 5-Cylinder Arc

| Commit | Cylinder | Scope | Doctrine impact |
|---|---|---|---|
| `7f0c456` | Cyl 7A · CMD-CYLINDER-7A-N8N-WEBHOOK | scraper.catch action · 24h dedupe via ScraperUsageLog · 5/5 smokes PASS · file 31→121 (+90/-0) · 277 routes unchanged | #19 PRE-STAGE-NON-IDP-PREFETCH ratified BINDING |
| `0e4b64f` | Cyl 7B · CMD-CYLINDER-7B-OLLAMA-GATEWAY-PARSE | Ollama parser via LiteLLM Gateway · zero LangChain (advisor A1) · 4-of-5 smokes PASS · live spec-drift catch on `/openai/v1` → `/v1` path | DOC-LITELLM-LOCAL-MODEL-PATH banked · #21 SPEC-GROUNDING-VERIFY proof point #5 |
| `023c54f` | Cyl 7C · CMD-CYLINDER-7C-PRISMA-PERSIST | thin adapter delegating to `persistEnrichmentComps()` · 145 LOC · idempotent at `@@unique([slug, sourceUrl])` · 4/4 smokes PASS · zero schema migration | DOC-DELEGATE-TO-CANONICAL ratified BINDING · DOC-EMIT-WITH-PROVENANCE banked |
| `8640cdc` | HOTFIX · CMD-VERCEL-MAXDURATION-HOTFIX | maxDuration 800→60 unblocks Hobby tier deploy · single-line surgical fix · ~12 min total incident-to-green | DOC-VERCEL-PLAN-MAXDURATION-CHECK banked · DOC-EMPIRICAL-PROD-STATE-CHECK banked |
| `2f4dad2` | Cyl 7C-V2 · CMD-CYLINDER-7C-V2-CANONICAL-TYPE-IMPORT | forward-compat shim → canonical import from `@/lib/scraper-parser/types` · adapter mapping JSON-string → array · smoke 1+2 STRUCTURALLY IDENTICAL to 7C baseline · re-export preserves caller surface | DOC-FORWARD-COMPAT-TYPE-CONSOLIDATION ratified BINDING (1st pattern proof) |

## §4 Doctrine Ratifications Today

**Four BINDING ratifications** (current count: 19 · was 15 Fri EOD)

- **DOC-PRE-STAGE-NON-IDP-PREFETCH (#19)** — pre-stage briefs drafted ahead of fire; IT executes with re-anchor only. Sat AM proof: Cyl 7A spec drafted Fri PM, fired Sat AM in ~5 min execute time.
- **DOC-V18-TEMPLATE-CANONICAL-FILE** — canonical V18 template lives at promised path; onboarding parity established for IT agents across terminals.
- **DOC-DELEGATE-TO-CANONICAL** — when a canonical helper exists in a LOCKED module, new cylinders MUST consume rather than reimplement. Cyl 7C is the proof: 145 LOC adapter delegating to shipped `persistEnrichmentComps()`.
- **DOC-FORWARD-COMPAT-TYPE-CONSOLIDATION** — parallel-fire shim → consolidation cylinder. Velocity moat: downstream cylinders never block on type producers; consolidation cylinder ships post-ratify with smoke-regression equivalence proof.

**Thirteen NEW Candidates banked today** (cited by name; full bodies in Saturday flag registry rev 2)

- DOC-FORWARD-COMPAT-TYPE-CONSOLIDATION (now BINDING)
- DOC-V18-TEMPLATE-CANONICAL-FILE (now BINDING)
- DOC-IT-AGENT-PROMPT-COMPACT (5-line paste-pointer format)
- DOC-CEO-SCHEDULE-AUTHORITY (validated 2× today by stand-downs)
- DOC-EMIT-WITH-PROVENANCE
- DOC-DELEGATE-TO-CANONICAL (now BINDING)
- DOC-ENV-VALUE-EXTRACTION-QUOTE-STRIP
- DOC-NEXT-CACHE-SWEEP-ON-REVERT
- DOC-LITELLM-LOCAL-MODEL-PATH
- DOC-STAND-DOWN-GATE-AUDIT-TABLE
- DOC-CPU-LOCAL-INFERENCE-DEV-ARTIFACT
- DOC-VERCEL-PLAN-MAXDURATION-CHECK
- DOC-EMPIRICAL-PROD-STATE-CHECK

## §5 Investor Narrative Threads

1. **Data flywheel foundation LIVE.** Five-cylinder arc shipped Saturday with zero rollbacks. Advisor I3's 100-item investor-intros gate path is INSTRUMENTED end-to-end. Real Apify traffic Mon–Wed fills the milestone. Production at app.legacy-loop.com serves the consolidated stack today.
2. **Live spec-drift catch on Cyl 7B validates DOC-SPEC-GROUNDING-VERIFY (#21) at runtime.** IT discovered LiteLLM Gateway path delta (`/openai/v1` vs `/v1` for local model_list aliases) at fire time, empirically verified, adapter fix landed in same cylinder. #21 proof point #5; doctrine compounds with each catch.
3. **DOC-CEO-SCHEDULE-AUTHORITY validated twice today by stand-downs.** IT agents cited technical blockers FIRST per §9 STOP RULE 1 — never schedule language. Authority hierarchy locked: technical gates trump time pressure.
4. **Production-red incident handled in ~12 min total.** Diagnosed via Vercel MCP empirical state confirmation; 1-line hot-fix unblocked Hobby tier; Pro upgrade decision banked as separate informed business call. DOC-EMPIRICAL-PROD-STATE-CHECK proves the discipline.
5. **Forward-compat type consolidation pattern proven.** First BINDING ratification of DOC-FORWARD-COMPAT-TYPE-CONSOLIDATION. Velocity moat compounds: parallel-fire safety + clean type consolidation = no blocking on type producers, ever.

## §6 Outstanding Follow-ups

- **Cyl 7D · CMD-CYLINDER-7D-N8N-WORKFLOW-CONFIG V18** — Mon AM Ryan-side · n8n droplet GUI · 5-platform smoke matrix
- **Cyl 7E · CMD-CYLINDER-7E-HMAC-UPGRADE V18** — banks SP-N · defense-in-depth HMAC verification on `/api/webhooks/n8n` if/when n8n traffic crosses the public surface · drafted concurrent with this close-out
- **Cyl 7F · CMD-CYLINDER-7F-100-ITEM-MILESTONE-METRICS V18** — Wed+ post-100-items · advisor I3 gate instrumentation · marker row in ScraperUsageLog (`botName=cyl7_milestone_crossed`) is the audit-trail proof
- **CMD-CYLINDER-7B-V2-CPU-BUDGET-TUNE** — banks · telemetry-driven Sat PM decision based on Smoke 3 YELLOW root cause
- **CMD-CYLINDER-7B-V2-PARSER-HARDEN V18** — `LIMIT_PER_FIRE` 20→8 + cosmetics · firing parallel with this close-out
- **PRO-TIER-UPGRADE-DECISION** — Ryan-side · separate business call · informed by post-Mon traffic telemetry
- **CMD-V18-TEMPLATE-PAM-HARDENING** — Pam-side · §0 #21 grep-verify table extension to include maxDuration ceiling check (banked from HOTFIX root cause)

## §7 100-Item Milestone Status

Advisor I3 ruling: **investor intros open at 100 ScraperComp rows accumulated through real n8n+Apify pipeline.**

Current state: zero items. No n8n→Apify traffic has fired; the gate is on Cyl 7D Mon AM Ryan-side activation.

Path forward:
1. **Mon AM** · Ryan deploys n8n workflow on droplet (Cyl 7D)
2. **Mon–Tue** · scraper runs accumulate ScraperComp rows
3. **Wed+** · 100-item threshold cleared · Cyl 7F MILESTONE-METRICS fires with real data
4. **Thu+** · investor demo · marker row in ScraperUsageLog (`botName=cyl7_milestone_crossed`) is the audit-trail proof

## §8 Production State

- **HEAD:** `2f4dad2` · production GREEN at app.legacy-loop.com
- **19 BINDING DOCTRINES** (was 15 Fri EOD · +4 ratifications today)
- **Zero rollbacks** across 5 cylinders today + 17 cylinders since Apr 28
- **Daemon QUARTET** (ollama · litellm · stay-awake · Open WebUI) all under launchctl supervision
- **LiteLLM Gateway** · 11 aliases live (4 cloud + 3 Ollama + 4 Sonar)
- **Sonar pathway** end-to-end LIVE
- **DEV/PROD bleed surface** PERMANENTLY closed (R2 DEV-PROD-DB-ISOLATION Friday EOD)
- **TouchID closure** (Cyl 37 Friday EOD)
- **Eight investor moats** locked

---

*End of Cyl 7 Epic Close-Out · Sat 2026-05-02 · LegacyLoop Tech LLC · Confidential — Engineering Audit Artifact*
