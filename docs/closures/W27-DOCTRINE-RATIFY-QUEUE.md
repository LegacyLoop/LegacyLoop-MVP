# W27 · Doctrine Ratify Queue

**CMD:** CMD-W27-E-TRACK-A-COMPLETE-CLOSURE V20 LOW
**Date:** 2026-05-30 PM
**Anchor HEAD:** `df1043f`
**Format:** each candidate gets 1-line CEO ratify · ratified-as-candidate 1/5 lands in `docs/DOCTRINE_LEDGER.md` · graduates to BINDING after 5 sustained applications.

---

## Doctrine Candidates · Awaiting CEO 1-Line Ratify

### 1 · DOC-WF-DECISION-FORCED-NEVER-INDEFINITELY-PAUSED (1/5)

**Lesson:** when an n8n workflow is deactivated due to burn / cap risk / vendor issue / shape mismatch, the discipline is a FORCED VERDICT per WF (KILL · ARCHIVE · REPLACE · CONVERT-TO-FREE), NOT an indefinite "paused" state. Indefinite-paused becomes silent debt that re-bites later (cf. APIFY-BURN 2026-05-30 cars-com WFs scheduled every 6h while "off mind"). Each WF's verdict cites: actor · billing model · burn telemetry (if any) · gating doctrine.

**Sustains:** #28 AUDIT-DOC-DRIFT · BINDING #49 N8N-SANDBOX-RESTRICTIONS · APIFY-BURN root-cause discipline.

**Anchor commit:** W27-B `b796c8b` · `docs/audits/W27-B-deactivated-wf-decisions.md`.

**Ratify line:** `ratify OK · WF-DECISION-FORCED`

---

### 2 · DOC-LIFT-GENERIC-CORE-MULTI-CALLER (1/5)

**Lesson:** when a tightly-named module (e.g., `fb-army-*` · `rotation/`) implements logic that is genuinely backend-agnostic, the polish pattern is: **lift to generic location** (`lib/scrapers/orchestration/` · `lib/scrapers/safety/`) via `git mv` (preserves history) · **add thin re-export shims at old paths** (preserves back-compat) · **neutralize headers** with provenance line · **keep all callers wired** · **zero deprecation**. Result: one battle-tested core reused by N callers · zero rewrites later · CEO retains all activation optionality.

**Sustains:** #16 DELEGATE-CANONICAL · #20 NEVER-ABANDON · Rule #11 META-SAFETY (firewall coverage broadens to all future backends).

**Anchor commit:** W27-A polish `df1043f` · `docs/audits/W27-A-polish-generalize.md`.

**Ratify line:** `ratify OK · LIFT-GENERIC-CORE`

---

### 3 · DOC-MANUS-RUN-IDEMPOTENT-BOT-RUN-ID (1/5)

**Lesson:** any autonomous-runner backend (Manus · droplet workload · future async prong) MUST emit + receive an idempotent `bot_run_id` (UUID v4 or content-derived hash) on every job dispatch + every callback. Duplicate callbacks (network retry · webhook re-fire) collapse on the `bot_run_id` instead of double-billing or double-persisting. Runner failure mode without this: silent duplicate processing class · same root as W22-L1 silent-drop family.

**Sustains:** #28 AUDIT-DOC-DRIFT · PERMANENT LAW #14 SYLVIA-CORPUS-ENVELOPE-CONTRACT (envelope idempotency parallel).

**Anchor commit:** W27-M scope `220d668` · `docs/audits/W27-M-manus-autonomous-foundation-scope.md`.

**Ratify line:** `ratify OK · MANUS-BOT-RUN-ID`

---

### 4 · DOC-WORLD-A-B-FIREWALL-EMPIRICAL-PROOF (1/5)

**Lesson:** the World-A↔World-B firewall MUST be PROVEN empirically (not just designed). Proof = three converging signals: (1) `grep -rE "from.*['\"].*fb-army"` in `lib/`+`app/` returns 0-or-expected-N matches with each match audit-traceable · (2) CI guard `scripts/fb-army-safety-guard.sh` PASS on every push touching `fb-army/` or `lib/fb-army-safety/` (now `lib/scrapers/safety/`) · (3) runtime `assertNoWorldAReference()` returns `{ok: true}` for every World-B prong activation. Convergence = structural firewall. Any one signal missing = drift class.

**Sustains:** Rule #11 META-SAFETY-ABSOLUTE · #38 LAW lib/sylvia LOCKED (parallel structural proof pattern).

**Anchor commit:** W27-D `fed0194` · `docs/audits/W27-D-world-a-b-firewall-empirical.md`.

**Ratify line:** `ratify OK · FIREWALL-EMPIRICAL-PROOF`

---

## WF Execution Ratify (separate from doctrine · CEO 1-line each)

| WF | Verdict | One-line ratify |
|---|---|---|
| WF45 KBB Vehicle | KILL (2× burn · ~$13/run · maxItems=40 ignored) | `kill WF45 OK` |
| WF40 ClassicCars | KILL (shared `legacyloop-cars-com` actor) | `kill WF40 OK` |
| WF92 duplicate | KILL (`IgpUQKexy7jIs0Nd` duplicate · BINDING #49) | `kill WF92 OK` |
| WF93 FB-Marketplace | ARCHIVE (Rule #11 META-SAFETY-ABSOLUTE blocks FB-Army pre-Phase-1) | `archive WF93 OK · pre-Phase-1` |
| WF94 FB-Groups | ARCHIVE (same FB-Army gate as WF93) | `archive WF94 OK · pre-Phase-1` |
| WF91 Reddit-Apify | REPLACE (free Reddit JSON API per WF72 pattern) | `replace WF91 OK · free-API` |

After CEO ratify, MC opens W28+ execution cyl per verdict. **No execution in this artifact.**

---

## Open Decisions (non-WF · CEO 1-line)

| # | Decision | Ratify line |
|---|---|---|
| A | USGS WF89 dedup-broken fix cyl (corpusId before any lift · pre-existing bug · banked) | `bank USGS dedup-fix W28` |
| B | Turso classifier resolution (prod-read grant OR accept permanent guard · classifier blocked 6×) | `grant Turso prod-read` OR `keep guard permanent` |
| C | Codex 2026-05-26 audit doc `docs/audits/legacy-loop-full-bot-and-dashboard-ux-report-2026-05-26.md` untracked → doc-stewardship commit | `commit codex audit OK` |
| D | Droplet rebrand `legacy-loop-autonomous-01` (CEO DigitalOcean UI · cosmetic) | `rebrand droplet OK` |
| E | FB-Army Phase-1 spend authorization ($80-150/mo) | `authorize Phase-1 spend` OR `hold` |

---

## How to Ratify (CEO)

1. Read this file end-to-end.
2. Reply in chat with the 1-line ratify text for each candidate / WF / decision you greenlight. Examples:
   - `ratify OK · WF-DECISION-FORCED`
   - `ratify OK · LIFT-GENERIC-CORE`
   - `kill WF45 OK · kill WF40 OK · kill WF92 OK`
   - `archive WF93 OK · pre-Phase-1`
   - `bank USGS dedup-fix W28`
3. Items NOT ratified stay banked at 1/5 for the next sustain opportunity.
4. After CEO ratify lines, MC opens execution cyls (W28+). IT does NOT auto-execute.

---

## Ratify Path Reference

- Candidate stays banked until 5 sustained applications cited across separate cylinders.
- Each sustain MUST cite the candidate by name in §12 PART G DOCTRINE SELF-AUDIT.
- After 5 sustains + Devin §12 + CEO + MC trio review → graduates to BINDING in `docs/DOCTRINE_LEDGER.md`.

---

**Connecting Generations · Doctrine forward · CEO authority absolute.**
