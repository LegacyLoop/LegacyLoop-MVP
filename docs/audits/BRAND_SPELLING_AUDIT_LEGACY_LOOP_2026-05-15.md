# Brand Spelling Audit · Legacy-Loop Canonical · 2026-05-15

> **Status:** Audit-doc · investigate-only · ZERO STRING REPLACE THIS CYL
> **Anchor:** CEO 2026-05-15 brand correction · canonical = "Legacy-Loop" hyphenated
> **Cylinder:** CMD-BRAND-SPELLING-AUDIT-LEGACY-LOOP-CANONICAL V20 v2.1 R29 P54 Wave 10 Slot C
> **Track:** A · Legacy-Loop Claude system
> **Worktree:** agent-3 · post-rebase HEAD `6442166`

## §1 · Canonical brand discipline (CEO 2026-05-15)

- **Brand:** Legacy-Loop (hyphenated · NEVER "LegacyLoop" one-word · NEVER "Legacy Loop" space)
- **Legal entity:** Legacy-Loop Tech LLC · EIN 42-1834363
- **Domain:** legacy-loop.com (kebab-case · NEVER "legacyloop.com")
- **Slack channel:** `#all-legacyloop` (lowercase no-hyphen · already canonical · DO NOT change · Slack constraint)
- **GitHub repo:** `LegacyLoop/LegacyLoop-MVP` (legacy URL · PROTECTED · post-PIVOT rename optional · CEO decision)
- **Vercel project ID:** `prj_br8eXVFqKFbZLvKczG6JkvYgwVg2` (immutable · PROTECTED)

## §2 · Sweep scope (empirical · §0.5 grep)

| Surface | LegacyLoop count |
|---|---|
| `CLAUDE.md` | 4 |
| `AGENTS.md` | 2 |
| `WORLD_CLASS_STANDARDS.md` | 3 |
| `docs/DOCTRINE_LEDGER.md` | 2 |
| V20 template (`~/Downloads/skills/LegacyLoop_Command_Template_V20.md`) | 13 |
| `docs/` aggregate (all .md) | 128 |
| `~/Downloads/skills/*.md` aggregate | 142 |
| **TOTAL** | **294** |

Sub-total in 5 core canonical = 24. Sub-total in audit/skill prose dirs = 270. Pre-cyl Devin estimate "~290+" matches empirical.

Code surface (.ts/.tsx/.js in `app/` + `lib/`): ~30 hits · ALL user-facing string literals (page titles · metadata · alt text · UI prose · receipt body) · **ZERO identifier drift** (`class LegacyLoop` · `function legacyLoop` · `const legacyLoop` grep all empty). Clean .ts/.tsx surface = sweep can be near-mechanical inside string-literal contexts.

`package.json` + `prisma/schema.prisma`: ZERO hits.

## §3 · PROTECTED class (DO NOT SWEEP · cite verbatim)

### §3.1 File paths · directory names

| Path | Action |
|---|---|
| `~/Downloads/skills/LegacyLoop_Command_Template_V20.md` (this spec template) | NEVER rename · post-PIVOT optional |
| `~/Downloads/skills/LegacyLoop_Command_Template_V19.md` · `..._V18.md` | NEVER rename · historical specs |
| `~/Downloads/skills/LegacyLoop-WorldClass-Standards-Audit.html` | NEVER rename · cited verbatim across docs |
| `~/Downloads/skills/LegacyLoop-Competitor-Audit.html` | NEVER rename |
| `~/Downloads/skills/LegacyLoop_Master_Roadmap_FULL_BUILD_2026-05-14.md` | NEVER rename |
| `~/Downloads/skills/LegacyLoop_Master_Navigation_Guide_April_2026.md` | NEVER rename |
| `~/Downloads/skills/LegacyLoop_Gap_Audit_Report_*.{md,pdf}` (4 files) | NEVER rename · historical artifacts |
| `~/Downloads/skills/LegacyLoop_Advisor_Review_Command_April_2026.{md,pdf}` | NEVER rename |
| `~/Downloads/skills/LegacyLoop_27950_SrDev_Decision_Brief_April_2026.{md,pdf}` | NEVER rename |
| `~/Downloads/skills/LegacyLoop_Investment_Options_Menu.{docx,pdf}` | NEVER rename |
| `~/Downloads/skills/LegacyLoop_Gap_Audit_and_Build_Plan.{docx,pdf}` | NEVER rename |
| `~/Downloads/skills/Master Plans/LegacyLoop_*.md` (2 files) | NEVER rename |
| `~/Downloads/skills/PassOffs/LegacyLoop_Senior_Advisor_PassOff_April_2026.{md,pdf}` | NEVER rename |
| `~/Downloads/skills/n8n/LegacyLoop_N8N_*.{md,pdf,docx}` (3 files) | NEVER rename |
| Repo root `LegacyLoop-Command-Template-v9.md` · `v10.pdf` · `LegacyLoop-ShippingCenter-TMS-Command-CORRECTED.pdf` | NEVER rename |

**Sweep cyl rule:** any `*LegacyLoop*` filename string occurring in markdown cross-reference → cite verbatim · do NOT alter (e.g. V20 template L158/L159/L1294/L1296/L1314/L1368/L1370/L1441 all reference `LegacyLoop-*.html` audit doc filenames PROTECTED).

### §3.2 Code identifiers · Vercel/GitHub IDs · Slack

| Class | Status | Action |
|---|---|---|
| `class LegacyLoop` / `function legacyLoop` / `const legacyLoop` | ZERO hits in app/ + lib/ | N/A · no refactor needed |
| Vercel project ID `prj_br8eXVFqKFbZLvKczG6JkvYgwVg2` | immutable | NEVER alter |
| GitHub repo `LegacyLoop/LegacyLoop-MVP` (`.git/config` remote URL) | legacy URL | PROTECTED · post-PIVOT rename optional · CEO decision |
| Slack channel `#all-legacyloop` (lowercase) | already canonical | DO NOT change · Slack constraint |
| Slack channel ID `C08S7BGQABH` | immutable | N/A |
| Test account password `LegacyLoop123!` (CLAUDE.md:70) | live auth surface | NEVER alter without DB sync |

## §4 · LEGAL-VERBATIM class

### §4.1 Already canonical (hyphenated ✓)

- `CLAUDE.md:9` cites entity `Legacy-Loop Tech LLC · EIN 42-1834363` — PRESENT hyphenated ✓
- `docs/DOCTRINE_LEDGER.md` legal cite blocks (verify in sweep cyl) — anticipated hyphenated

### §4.2 Drift class · entity cite NOT hyphenated (legal-correction SAFE-TO-SWEEP)

| Surface | Line:col | Current | Sweep target |
|---|---|---|---|
| `app/page.tsx` | 392 | `© 2026 LegacyLoop Tech LLC.` | `© 2026 Legacy-Loop Tech LLC.` |
| `app/receipts/[id]/page.tsx` | 255 | `LegacyLoop Tech LLC · legacy-loop.com · Receipt {rn}` | `Legacy-Loop Tech LLC · legacy-loop.com · Receipt {rn}` |

**Note:** These two cites are LEGAL ENTITY NAME on user-facing surface (receipt + footer copyright). Per CEO 2026-05-15 directive entity name hyphenated · these qualify as SAFE-TO-SWEEP with LEGAL-cite priority. Receipt + copyright legal-cite class.

### §4.3 Articles of Org · Operating Agreement quoted blocks

ZERO direct quotes found in canonical docs scope. Banked verify: if discovered during sweep cyl execution → CITE VERBATIM · do NOT alter (legal documents are immutable text).

## §5 · SAFE-TO-SWEEP class (prose · doc · UI strings)

### §5.1 Core 5 canonical docs (verbatim line cites)

#### `CLAUDE.md` (4 hits)

| Line | Current | Sweep target |
|---|---|---|
| 9 | `LegacyLoop is an AI-powered resale automation platform.` | `Legacy-Loop is an AI-powered resale automation platform.` |
| 57 | `These specific gotchas are LegacyLoop pain that cost rebuilds:` | `These specific gotchas are Legacy-Loop pain that cost rebuilds:` |
| 70 | `LegacyLoop123!` (PASSWORD) | **PROTECTED · do NOT sweep · live auth surface** |
| 107 | `daily $20 cap matches LegacyLoop production cap` | `daily $20 cap matches Legacy-Loop production cap` |

**Net CLAUDE.md sweep:** 3 SAFE · 1 PROTECTED.

#### `AGENTS.md` (2 hits · both SAFE)

| Line | Current | Sweep target |
|---|---|---|
| 8 | `# Applies to ALL LegacyLoop repositories.` | `# Applies to ALL Legacy-Loop repositories.` |
| 141 | `"LegacyLoop is not a side project. It is a company..."` (quoted prose) | `"Legacy-Loop is not a side project. It is a company..."` |

#### `WORLD_CLASS_STANDARDS.md` (3 hits · 2 SAFE + 1 SPECIAL)

| Line | Current | Sweep target |
|---|---|---|
| 7 | `LegacyLoop exists to connect generations.` | `Legacy-Loop exists to connect generations.` |
| **169** | `**LegacyLoop** — one word · camelCase · NOT "Legacy Loop" / "legacyloop"` | **SPECIAL · brand-rule self-reversal · REWRITE LINE** to new doctrine: `**Legacy-Loop** — hyphenated · NEVER "LegacyLoop" one-word · NEVER "Legacy Loop" space` |
| 213 | `We are building LegacyLoop to a billion-dollar standard from day one.` | `We are building Legacy-Loop to a billion-dollar standard from day one.` |

**WCS L169 SPECIAL:** This line IS the current canonical brand rule · CEO 2026-05-15 directive INVERTS this rule. Sweep cyl MUST rewrite line content (not just substitute string) to match new canonical. Without rewrite · `LegacyLoop` substring becomes self-contradicting rule.

#### `docs/DOCTRINE_LEDGER.md` (2 hits)

| Line | Current | Class | Sweep target |
|---|---|---|---|
| 1 | `# LegacyLoop Doctrine Ledger` | SAFE prose title | `# Legacy-Loop Doctrine Ledger` |
| 202 | `/Users/ryanhallee/Downloads/LegacyLoop_Master_Roadmap_*.md` | **PROTECTED file path** | NEVER alter (matches `~/Downloads/` filename glob) |

**Net DOCTRINE_LEDGER sweep:** 1 SAFE · 1 PROTECTED.

#### V20 template (`~/Downloads/skills/LegacyLoop_Command_Template_V20.md`) — 13 hits

| Line | Class | Action |
|---|---|---|
| 34 | SAFE prose `LegacyLoop is built to a **$1B product bar**` | substitute |
| 158 | PROTECTED · cites `LegacyLoop-WorldClass-Standards-Audit.html` filename | NEVER alter |
| 159 | PROTECTED · cites `LegacyLoop-Competitor-Audit.html` filename | NEVER alter |
| 605 | SAFE prose `Project | LegacyLoop MVP` | substitute |
| 824 | SAFE §12 box header `LegacyLoop | <DATE> | V20` | substitute |
| 1294 | PROTECTED filename ref `from LegacyLoop-WorldClass-Standards-Audit.html` | NEVER alter |
| 1296 | PROTECTED filename ref | NEVER alter |
| 1314 | PROTECTED filename ref | NEVER alter |
| 1368 | PROTECTED filename ref `from LegacyLoop-Competitor-Audit.html` | NEVER alter |
| 1370 | PROTECTED filename ref | NEVER alter |
| 1435 | SAFE prose `LegacyLoop V20 Command Template` (doc title) | substitute |
| 1441 | PROTECTED filename ref `LegacyLoop_Command_Template_V20.md` | NEVER alter |
| 1457 | SAFE end-marker `*End of LegacyLoop V20 Command Template ...*` | substitute |

**Net V20 template sweep:** 5 SAFE · 8 PROTECTED. Spec authors going forward use hyphenated form in §12 boxes + prose · keep filename refs PROTECTED.

### §5.2 Code surface (~30 hits · all user-facing strings · ZERO identifier drift)

| File | Lines | Class | Sweep action |
|---|---|---|---|
| `app/opengraph-image.tsx` | 4, 42 | UI prose · OG image alt + label | substitute (UI display) |
| `app/error.tsx` | 12 | alt text | substitute |
| `app/not-found.tsx` | 6 | alt text | substitute |
| `app/layout.tsx` | 58, 70, 73, 79, 155 | page title · siteName · apple-mobile-web-app-title | substitute (5 hits · marketing metadata) |
| `app/page.tsx` | 8, 11, 17, 56, 328, 358 | title · OG · twitter · testimonial · community prose · footer brand | substitute |
| `app/page.tsx` | 392 | `© 2026 LegacyLoop Tech LLC.` | legal-cite class · substitute to `Legacy-Loop Tech LLC` |
| `app/sale/[projectId]/page.tsx` | 15, 18, 20, 102, 228 | page title · OG description · footer brand | substitute (5 hits) |
| `app/receipts/[id]/page.tsx` | 123, 251, 255 | logo label · thank-you prose · receipt legal-cite | substitute (legal-cite class on L255) |
| `app/bots/pricebot/page.tsx` | 11 | metadata title | substitute |
| `app/bots/shipbot/page.tsx` | 10 | metadata title | substitute |
| `app/bots/page.tsx` | 7 | metadata title | substitute |
| `app/bots/megabot/MegaBotClient.tsx` | 3213, 3273, 3274 | report header · disclaimer · report ID footer | substitute (3 hits · branded UI) |

**Net code surface sweep:** ~30 user-facing strings substitute. ZERO identifier rename. Sweep cyl uses Edit tool per file (Write tool risks large-file overwrite on `MegaBotClient.tsx` 9000+ LOC neighbor pattern).

**LOCKED concern:** `app/bots/megabot/MegaBotClient.tsx` is 9000+ LOC class · NOT in CLAUDE.md LOCKED list but adjacent to `ItemDashboardPanels.tsx` LOCKED. Sweep cyl uses surgical Edit tool · 3 line-targets only · zero scope creep.

### §5.3 docs/ aggregate (128 hits) · skills/*.md aggregate (142 hits)

Sweep cyl enumerates per-file at execution time (too long to enumerate in audit · pattern is `grep -rn "LegacyLoop" docs/ ~/Downloads/skills/*.md` produces ledger). Vast majority SAFE prose · expect ~10-20% PROTECTED filename refs.

**Recommended sweep batching for follow-on cyl:**

1. **Batch A · 5 core canonical** (CLAUDE.md · AGENTS.md · WCS · DOCTRINE_LEDGER · V20 template) — 24 hits · 18 SAFE + 6 PROTECTED · WCS L169 SPECIAL rewrite
2. **Batch B · code surface** (~30 .ts/.tsx hits) — surgical Edit per file · ZERO identifier rename
3. **Batch C · docs/** (128 hits across 20-30 files) — sed-based per-file with PROTECTED filename glob exclusion
4. **Batch D · ~/Downloads/skills/*.md** (142 hits across ~40-60 files) — same pattern as Batch C · spec template + V19 template + audit-doc-set + Master Plans/* + PassOffs/* + n8n/* etc.

## §6 · Sweep-ready surgical-unlock list (banked follow-on)

`CMD-BRAND-SPELLING-SWEEP-LEGACY-LOOP V20` (banked HIGH · post-P54 close · ~30-60 min):

```
Surgical-unlock per command authority required for:
- CLAUDE.md (3 lines · L9 L57 L107)
- AGENTS.md (2 lines · L8 L141)
- WORLD_CLASS_STANDARDS.md (3 lines · L7 L169 SPECIAL-REWRITE L213)
- docs/DOCTRINE_LEDGER.md (1 line · L1)
- V20 template (5 lines · L34 L605 L824 L1435 L1457)
- ~30 .ts/.tsx user-facing strings (Edit-tool surgical · per-file)
- docs/ aggregate (128 hits across ~20-30 files · sed pattern w/ PROTECTED filename exclusion)
- ~/Downloads/skills/*.md (142 hits across ~40-60 files · same pattern)

Skip lists (HARD GATE):
- ALL filenames matching `*LegacyLoop*` (30+ files enumerated §3.1)
- CLAUDE.md:70 password `LegacyLoop123!`
- DOCTRINE_LEDGER L202 file-path glob
- V20 template L158 L159 L1294 L1296 L1314 L1368 L1370 L1441 PROTECTED filename refs
- ~/.git/config remote URL `LegacyLoop/LegacyLoop-MVP`
- Vercel project ID strings
- Slack channel name `#all-legacyloop`
- Already-shipped commit messages · §12 historic reports (audit trail immutable)
```

## §7 · Excluded scope (clarity)

- File renames: out-of-scope (PROTECTED class · 30+ files)
- Class/function/variable renames: ZERO drift found · no refactor cyl needed
- GitHub repo rename `LegacyLoop/LegacyLoop-MVP` → CEO decision · post-PIVOT
- Vercel project rename: CEO decision · involves env var sync + DNS verify
- Already-shipped commit messages: immutable audit trail · NOT swept
- §12 historic reports in this repo: immutable · NOT swept (going-forward §12s use hyphenated form)
- Slack #all-legacyloop channel: lowercase no-hyphen IS canonical Slack-lowercase constraint · NOT swept
- Test account password CLAUDE.md L70: live auth surface · NEVER alter without DB sync

## §8 · Cross-references

- CEO 2026-05-15 brand directive (this chat anchor + Wave 10 fire prompt)
- P50 §12 brand-correction Opportunity flag (Wave 9 Slot 2 · `9c338c5`)
- V20 v2.1 template self-sweep candidate per §5.1
- BINDING #28 DRIFT-CATCH (this cyl is canonical drift-catch application · ratifies 38× sustained)
- BINDING #17 AUDIT-FIRST-WIRE (audit-then-sweep pattern · classic application)

## §9 · Recommended follow-on cyl

**CMD-BRAND-SPELLING-SWEEP-LEGACY-LOOP V20 · HIGH** (banked · post-P54 close)

- Worktree: main OR agent-1 (multi-file edit · single worktree preferred to avoid cross-agent index race)
- Class: SURGICAL-SWEEP (Edit-tool per file · sed for high-density docs/)
- Scope: SAFE-TO-SWEEP class only per §5
- WCS L169 SPECIAL: rewrite line content (not substring substitute)
- Acceptance gate: post-sweep `grep -rn "LegacyLoop" CLAUDE.md AGENTS.md WORLD_CLASS_STANDARDS.md docs/ ~/Downloads/skills/*.md` returns ONLY PROTECTED filename refs + CLAUDE.md L70 password
- ~30-60 min IT-autonomous · zero CEO-interactive
- Doctrine: ratifies DOC-BRAND-CANONICAL-AUDIT-FIRST 2/5 (this audit = 1/5 · sweep = 2/5)

## §10 · Doctrine candidate

**DOC-BRAND-CANONICAL-AUDIT-FIRST 1/5 NEW** · this cyl establishes audit-then-sweep pattern for brand-class drift. Reusable for future brand evolution (Sylvia branding · MegaBot · Connecting Generations cite · post-pivot rebrand if any). Sub-doctrine of #17 DOC-AUDIT-FIRST-WIRE-PATTERN.

---

*Authored R29 P54 Wave 10 Slot C · 2026-05-15 · Track A · Legacy-Loop · agent-3 worktree · Devin L1 spec · IT execute*
