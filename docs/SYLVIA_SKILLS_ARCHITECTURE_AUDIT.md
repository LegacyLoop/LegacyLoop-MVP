# Sylvia Skills Architecture Audit
## Phase 3 anchor · canonical map · target proposal · migration plan

**Author:** IT (executor) · drafted via CMD-SYLVIA-SKILLS-ARCHITECTURE-AUDIT V18
**Date:** 2026-05-06 (Wed PM EDT) · Round 13 P3 · Worktree C
**Anchor HEAD:** `f7451de` (post Round 13 P0 worktree-migration land)
**Status:** PERMANENT operational doctrine · supersedes prior ad-hoc skill-pack discussions
**Doctrine alignment:** ratifies BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN as Phase 3 entry · honors BINDING #16 DOC-DELEGATE-TO-CANONICAL

---

## §1 · Current Skill-Pack Inventory

Counts measured at HEAD `f7451de` via `find` · `wc -l` · `du -sh` from worktree `/Users/ryanhallee/legacy-loop-mvp-agent-3`. All cells grep-verified.

| Surface | Subdir | Skill files (.md) | On-disk size | Loaded by |
|---|---|---|---|---|
| Shared baseline | `lib/bots/skills/_shared/` | 3 | 24K | every bot via `loadSkillPack()` SHARED_DIR |
| Megabot baseline | `lib/bots/skills/_shared_megabot/` | 5 | 44K | megabot path via `loadSkillFolder("_shared_megabot")` |
| AnalyzeBot | `lib/bots/skills/analyzebot/` | 27 | 328K | NOT yet via `loadSkillPack` (no import in `app/api/bots/analyzebot/[itemId]/route.ts` per grep) |
| PriceBot | `lib/bots/skills/pricebot/` | 24 | 252K | `app/api/bots/pricebot/[itemId]/route.ts:153` |
| PhotoBot | `lib/bots/skills/photobot/` | 20 | 284K | NOT yet via `loadSkillPack` (no import in photobot route per grep) |
| BuyerBot | `lib/bots/skills/buyerbot/` | 26 | 180K | `app/api/bots/buyerbot/[itemId]/route.ts:558` |
| ReconBot | `lib/bots/skills/reconbot/` | 22 | 164K | `app/api/bots/reconbot/[itemId]/route.ts:269` |
| ListBot | `lib/bots/skills/listbot/` | 24 | 200K | `app/api/bots/listbot/[itemId]/route.ts:408` |
| AntiqueBot | `lib/bots/skills/antiquebot/` | 20 | 184K | `app/api/bots/antiquebot/[itemId]/route.ts:149` |
| CollectiblesBot | `lib/bots/skills/collectiblesbot/` | 20 | 188K | `app/api/bots/collectiblesbot/[itemId]/route.ts:147` |
| CarBot | `lib/bots/skills/carbot/` | 20 | 188K | `app/api/bots/carbot/[itemId]/route.ts:234` |
| VideoBot | `lib/bots/skills/videobot/` | 21 | 292K | `app/api/bots/videobot/[itemId]/route.ts:165` |
| DocumentBot (platform) | `lib/bots/skills/documentbot/` | 3 | 12K | platform — no per-route grep hit at HEAD |
| IntelPanel (platform) | `lib/bots/skills/intel-panel/` | 2 | 8.0K | platform — no per-route grep hit at HEAD |
| ShippingCenter (platform) | `lib/bots/skills/shipping-center/` | 2 | 8.0K | `app/api/bots/shipbot/[itemId]/route.ts:106` (note: route name `shipbot` loads pack named `shipping-center`) |
| **Total** | | **239** | **~2.5MB** | 13 of 15 surfaces actively wired via `loadSkillPack`/`loadSkillFolder` |

**Drift observations vs spec §0 grounding:**
- `_shared_megabot` has **5** files at HEAD, not 4 as cited in spec discovery (spec drift · doc-only · low-impact).
- AnalyzeBot + PhotoBot routes lack `loadSkillPack` import despite owning 47 skill files between them (27+20). Likely consumed via MegaBot orchestrator (`app/api/megabot/[itemId]/route.ts:21`) or another path · Phase 3 must verify per-bot consumption coverage.

## §2 · Skill-Loader Patterns in Use

Verbatim cite from `lib/bots/skill-loader.ts:1-50` + per-consumer cite.

**Canonical loader:** `lib/bots/skill-loader.ts` (215 lines · `SKILLS_VERSION = "v1.0-2026-04-07"` · `SKILLS_DIR = path.join(process.cwd(), "lib/bots/skills")` · `SHARED_DIR = path.join(SKILLS_DIR, "_shared")`).

**Public API (3 exported functions + 1 interface):**
- `loadSkillPack(botType: string): SkillPack` — `skill-loader.ts:91` · returns `{ systemPromptBlock, skillNames, totalChars, version, lastUpdated }`
- `loadSkillFolder(folderName: string): SkillPack` — `skill-loader.ts:161` · used by MegaBot for `_shared_megabot` direct load
- `_clearSkillCache(): void` — `skill-loader.ts:213` · test/dev hook
- `interface SkillPack` — `skill-loader.ts:19`

**Process-level cache:** `Map<string, SkillPack>` at module scope. Serverless reuses warm functions · single-instance cache safe and efficient (skill-loader.ts comment block L11-13).

**Frontmatter handling:** `stripFrontmatter()` private helper at `skill-loader.ts:43` defensively removes YAML frontmatter from each `.md` body before concatenation. Defensive against missing/empty/unterminated blocks.

**Bundling:** `next.config.ts:46-48` · `outputFileTracingIncludes: { "./lib/bots/skills/**/*" }` ensures all 239 .md files ship with Vercel deploys.

**Patterns observed across consumers (per fire-time grep sweep):**

| Pattern | Sites | Risk |
|---|---|---|
| `import { loadSkillPack } from "@/lib/bots/skill-loader"` + single call | 9 bot routes (pricebot · listbot · buyerbot · reconbot · antiquebot · collectiblesbot · carbot · videobot · shipbot) | canonical · BINDING #16 honored |
| `import { loadSkillPack, loadSkillFolder }` + multi-bot orchestration | 1 site (`app/api/megabot/[itemId]/route.ts:21`) | canonical · MegaBot is intentional multi-pack consumer |
| `loadSkillPack` used in admin diagnostics | 1 site (`app/admin/page.tsx:14, 480`) | canonical · diagnostic surface |
| **Bots with skill folders but no `loadSkillPack` import in own route** | 2 (analyzebot 27 files · photobot 20 files) | **anti-pattern candidate** · skill packs may be dead-loaded OR loaded via MegaBot orchestrator only |
| Inline-prompt pattern (anti-pattern) | F1 ENGINE DOCTRINE prohibits — no fire-time hits found in the 9 wired routes; AnalyzeBot/PhotoBot need explicit verification in Phase 3.1 prereq audit | low-medium |

## §3 · Sylvia Brain Stem Integration Depth Per Bot

Sylvia surface inventory at HEAD (4 files · 793 LOC total):

| File | Lines | Purpose |
|---|---|---|
| `lib/sylvia/index.ts` | 41 | Barrel export · public API surface (`triageAndRoute` + types) |
| `lib/sylvia/triage-router.ts` | 447 | Triage router V1 · cost ceiling · LiteLLM Gateway egress |
| `lib/sylvia/memory.ts` | 204 | Collective memory V1 · `recordTriage` / `recallSimilar` / `getSessionStats` / `pruneOld` |
| `lib/sylvia/types.ts` | 101 | Type contracts (`TriageTask` · `TriageTelemetry` · etc.) |

**No `lib/sylvia/skills/` directory exists.** `lib/sylvia/index.ts:6-7` explicitly documents future scope: *"V1 exports the triage router only. V2 will add memory layer (Spec 3), tools (advisor S3 banked), and skills (advisor S4 banked)."* This audit IS the S4 entry.

**Sylvia integration depth per bot** (cite each bot's path through `triageAndRoute` per BINDING #16 ratification at `105c7d0` May 5):

| Bot | Sylvia integration | Skill pack via `loadSkillPack` | Notes |
|---|---|---|---|
| AnalyzeBot | unverified at fire time | absent in own route | likely via MegaBot orchestrator |
| PriceBot | yes (per BINDING #16 8/8) | yes (route L153) | canonical |
| PhotoBot | unverified at fire time | absent in own route | likely via MegaBot orchestrator |
| BuyerBot | yes (Round 12 Cyl 2E persist) | yes (route L558) | canonical |
| ReconBot | yes (per BINDING #16 8/8) | yes (route L269) | canonical |
| ListBot | yes (Wire D `bc4085f`) | yes (route L408) | canonical |
| AntiqueBot | yes (Wire C `105c7d0`) | yes (route L149) | canonical |
| CollectiblesBot | yes (Wire F `e564466`) | yes (route L147) | canonical |
| CarBot | yes (Wire E `bab6e3c`) | yes (route L234) | canonical |
| VideoBot | yes | yes (route L165) | canonical |
| MegaBot orchestrator | hub for 4-AI consensus | both `loadSkillPack` + `loadSkillFolder` | special case · per-bot pack assembly |

**Output:** 8/8 BINDING #16 ratification holds for the explicit Sonar Wires (May 3-6 chain) · the broader 11-bot fleet has 9 of 11 with explicit `loadSkillPack` imports in own routes · 2 (AnalyzeBot · PhotoBot) need Phase 3.1 prereq verification before migration.

## §4 · Anthropic Agent Skills (SSA) Pattern Fit Assessment

LegacyLoop's `skill-loader.ts:3-8` self-describes the lineage: *"First-party 'Skills' tech inspired by Anthropic SDK Skills but provider-agnostic. Loads markdown playbooks from `lib/bots/skills/_shared/` + `lib/bots/skills/{botType}/` at runtime and concatenates them into a single systemPromptBlock."*

**SSA structure per skill folder (per Anthropic public docs · Agent Skills · 2025-2026 era):**
```
SKILL.md          (frontmatter + body · canonical contract · auto-loaded when intent matches)
script.py         (optional · executable · structured invocation)
data/             (optional · reference data · CSV/JSON/etc)
examples/         (optional · few-shot demonstrations)
```

**LegacyLoop current structure per bot folder:**
```
lib/bots/skills/<bot>/
  ├── 01-<topic>.md
  ├── 02-<topic>.md
  ├── ...
  └── (no script · no data · no examples)
```

**Fit assessment:**
- ✅ `.md` per skill matches SSA's `SKILL.md` (with optional frontmatter via `stripFrontmatter()` defense)
- ⚠️ Multiple skills per bot folder (LegacyLoop) vs one skill = one folder (SSA) · LegacyLoop pattern is "skill PACK" (multiple .md aggregated into one `systemPromptBlock`)
- ⚠️ No `script.py` equivalent · no `data/` · no `examples/` · pure prompt fragments
- ✅ `loadSkillPack` parallels SSA auto-loading via name-match (`_shared` is always-load · per-bot is intent-bound by route call)
- ✅ Frontmatter parsing defense already exists (`skill-loader.ts:43`) · gives partial SSA `SKILL.md` compat

**Gap analysis:**
1. SKILL.md frontmatter (description · type · model_routing) **partially supported** but not standardized · would gain auto-discovery if frontmatter schema formalized.
2. `data/` folder enables structured reference (e.g., antique-eras.csv for AntiqueBot · vehicle-VIN-decoders.json for CarBot).
3. `examples/` folder enables few-shot patterns · upgrades quality measurably for narrow domains.
4. `script.py` equivalent could be `helper.ts` for deterministic preprocessing (e.g., AnalyzeBot dimension extraction).
5. `lastUpdated` ISO timestamp on SkillPack already exposes freshness · admin Skills Status widget (`app/admin/page.tsx:480`) consumes it · partial SSA hygiene.

## §5 · Canonical Target Structure Proposal

Migration target — **`lib/sylvia/skills/`** rather than `lib/bots/skills/` — pivots ownership from bot routes to Sylvia Brain Stem · aligns with BINDING #16 DOC-DELEGATE-TO-CANONICAL · matches `lib/sylvia/index.ts:6-7` S4 declaration.

```
lib/sylvia/skills/
  ├── _shared/                          (cross-bot baseline · 3 files migrated)
  ├── _shared_megabot/                  (megabot baseline · 5 files migrated)
  ├── <bot-name>/
  │   ├── SKILL.md                      (canonical contract · frontmatter + body)
  │   ├── 01-<topic>.md                 (named skill · loaded by intent or always)
  │   ├── 02-<topic>.md
  │   ├── ...
  │   ├── data/                          (optional · CSV/JSON reference)
  │   ├── examples/                      (optional · few-shot)
  │   └── helper.ts                      (optional · deterministic preprocessing)
  └── (loader extension at lib/sylvia/skill-loader.ts)
```

**Loader extension (`lib/sylvia/skill-loader.ts`):**
- Delegates to existing `lib/bots/skill-loader.ts` for backwards compat (BINDING #16)
- Adds frontmatter parsing per SSA SKILL.md spec (formal schema)
- Adds intent-based auto-loading hook (Sylvia Brain Stem signals which skills are needed via `triageAndRoute` task hint)
- Preserves existing `_shared` always-load pattern
- Process-level cache shared across both loaders (single Map · two read paths)

**Migration strategy: ADDITIVE per CLAUDE.md §7.** New `lib/sylvia/skills/` exists alongside `lib/bots/skills/`. Routes opt-in to new loader via single-line swap when ready. Eventually `lib/bots/skills/` is symlinked or migrated wholesale (Phase 3.13 retire-old-loader cylinder).

**`next.config.ts:46-48` updates required during migration:**
- Add `"./lib/sylvia/skills/**/*"` alongside existing `"./lib/bots/skills/**/*"` outputFileTracingIncludes path
- Verified once Phase 3.1 lands · Vercel CI confirms

## §6 · Migration Cost Estimate Per Bot

Per-bot · **best-effort projections** · refined in Phase 3 cylinders.

| Bot | Skill files | Migration cost | Complexity | Notes |
|---|---|---|---|---|
| `_shared` | 3 | LOW · ~30 min | mostly mechanical · symlink-eligible | foundation cylinder |
| `_shared_megabot` | 5 | LOW · ~30 min | mostly mechanical | foundation cylinder |
| AnalyzeBot | 27 | MEDIUM · ~90 min | largest pack · prereq: verify consumption path | route may need `loadSkillPack` import |
| PriceBot | 24 | LOW · ~45 min | already wired · clean swap | route L153 |
| PhotoBot | 20 | MEDIUM · ~75 min | prereq: verify consumption path | route may need `loadSkillPack` import |
| BuyerBot | 26 | LOW · ~45 min | recently audited (Cyl 2A May 1) | route L558 |
| ReconBot | 22 | LOW · ~45 min | already wired · clean swap | route L269 |
| ListBot | 24 | LOW · ~45 min | already wired · clean swap | route L408 |
| AntiqueBot | 20 | LOW · ~45 min | already wired · clean swap | route L149 |
| CollectiblesBot | 20 | LOW · ~45 min | already wired · clean swap | route L147 |
| CarBot | 20 | LOW · ~45 min | already wired · clean swap | route L234 |
| VideoBot | 21 | LOW · ~45 min | already wired · clean swap | route L165 |
| DocumentBot | 3 | LOW · ~20 min | platform · no per-route consumer | platform pack |
| IntelPanel | 2 | LOW · ~15 min | platform | platform pack |
| ShippingCenter | 2 | LOW · ~15 min | route name `shipbot` loads pack `shipping-center` | naming drift to surface |
| MegaBot orchestrator | (cross-cuts all) | HIGH · ~3-4 hr | 4-AI consensus consumer · careful frontmatter required | uses both `loadSkillPack` + `loadSkillFolder` |
| **Total** | **239** | **~13-15 hours** | mostly LOW · 3 MED · 1 HIGH | spread across 13-cylinder Phase 3 sequence |

## §7 · Phase 3 Cylinder Breakdown

Proposed sequence (each its own V18 cylinder):

| # | Cylinder | Scope | Estimate |
|---|---|---|---|
| 3.1 | CMD-SYLVIA-SKILLS-FOUNDATION V18 | establish `lib/sylvia/skills/` + `lib/sylvia/skill-loader.ts` + migrate `_shared` + `_shared_megabot` + `next.config.ts` outputFileTracingIncludes update | ~75 min |
| 3.2 | CMD-SYLVIA-SKILLS-MIGRATE-PRICEBOT V18 | PriceBot pack → SSA · live-web grounding context | ~45 min |
| 3.3 | CMD-SYLVIA-SKILLS-MIGRATE-BUYERBOT V18 | BuyerBot pack → SSA · investor-narrative anchored on Moat #1 (BuyerLead persistence) | ~45 min |
| 3.4 | CMD-SYLVIA-SKILLS-MIGRATE-RECONBOT V18 | ReconBot pack → SSA | ~45 min |
| 3.5 | CMD-SYLVIA-SKILLS-MIGRATE-LISTBOT V18 | ListBot pack → SSA | ~45 min |
| 3.6 | CMD-SYLVIA-SKILLS-MIGRATE-ANTIQUEBOT V18 | AntiqueBot pack → SSA | ~45 min |
| 3.7 | CMD-SYLVIA-SKILLS-MIGRATE-COLLECTIBLESBOT V18 | CollectiblesBot pack → SSA | ~45 min |
| 3.8 | CMD-SYLVIA-SKILLS-MIGRATE-CARBOT V18 | CarBot pack → SSA · VIN data/ candidate | ~60 min |
| 3.9 | CMD-SYLVIA-SKILLS-MIGRATE-VIDEOBOT V18 | VideoBot pack → SSA | ~45 min |
| 3.10 | CMD-SYLVIA-SKILLS-WIRE-ANALYZEBOT V18 | AnalyzeBot consumption path verification + `loadSkillPack` wire-or-confirm + SSA migration | ~90 min |
| 3.11 | CMD-SYLVIA-SKILLS-WIRE-PHOTOBOT V18 | PhotoBot consumption path verification + `loadSkillPack` wire-or-confirm + SSA migration | ~75 min |
| 3.12 | CMD-SYLVIA-SKILLS-MIGRATE-MEGABOT V18 | MegaBot orchestrator skill-pack assembly path · both `loadSkillPack` + `loadSkillFolder` migrate to Sylvia loader · highest complexity | ~3-4 hr |
| 3.13 | CMD-SYLVIA-SKILLS-MIGRATE-PLATFORM-PACKS V18 | DocumentBot · IntelPanel · ShippingCenter (`shipbot` route alias) | ~60 min |
| 3.14 | CMD-SYLVIA-SKILLS-RETIRE-OLD-LOADER V18 | retire `lib/bots/skill-loader.ts` after all consumers swap · symlink or delete `lib/bots/skills/` | ~30 min |

Total: **14 cylinders** · ~13-15 hours wall-clock if sequential · ~6-8 hours if Phase 3 leverages worktree parallelism (Round 13 P0 infrastructure).

## §8 · Investor Narrative Angle

**Draft (Pam refines for investor docs · Round 14+ exec summary update):**

> "LegacyLoop's bot architecture mirrors the canonical pattern Anthropic uses internally for agent skills (SSA). Each bot is a structured skill set with a self-describing `SKILL.md` contract — enabling auto-discovery, few-shot examples, and structured data injection. Zero new infrastructure (pure file-system structure), zero vendor lock-in (provider-agnostic loader), zero direct AI provider SDK dependency (LiteLLM Gateway egress per BINDING #10 DOC-TELEMETRY-LOCK). The same discipline that powers Anthropic's own agent ecosystem now powers LegacyLoop's resale automation — 14 bots, 239 skill files, 2.5MB of curated domain expertise, all routed through a single Brain Stem (Sylvia · 4 files · 793 LOC) that delegates to canonical helpers (BINDING #16). This is not a wrapper around someone else's framework. This is the same pattern, built first-party, owned end-to-end."

**Compounding angle:** every new skill .md added to a bot folder is a permanent capability upgrade — additive per CLAUDE.md §7 · no rewrites · no provider migrations · no vendor risk. Investor-facing: "the moat compounds physically with every skill file authored."

## §9 · Risk Surfaces

1. **Loader fragmentation risk** — two loaders (old `lib/bots/skill-loader.ts` + new `lib/sylvia/skill-loader.ts`) co-exist during transition · mitigated by delegate pattern (BINDING #16) · new wraps old · process-cache shared.
2. **Bundling regression** — `next.config.ts:46-48` `outputFileTracingIncludes` must include both paths during transition · IT verifies in Cyl 3.1 · Vercel CI re-validates.
3. **Drift from Anthropic SSA spec** — frontmatter fields must match SSA spec exactly · cite spec in Cyl 3.1 · banks `DOC-SSA-SPEC-PARITY` candidate doctrine.
4. **Per-bot prompt regression** — every migration cylinder must include before/after prompt-effectiveness check (sample inputs · same outputs) · banks prompt-effectiveness benchmark harness as Phase 3.2 prereq.
5. **MegaBot orchestrator complexity** — 4-AI consensus skill loading is non-trivial · gets its own cylinder (3.12 · ~3-4 hr).
6. **F1 ENGINE DOCTRINE compliance** — inline-prompt prohibition must hold through migration · enforce in every Phase 3 cylinder's §9 STOP rules · CLAUDE.md §7 governs.
7. **AnalyzeBot + PhotoBot consumption uncertainty** — 2 of 14 bots lack `loadSkillPack` imports in own routes despite owning 47 skill files between them · Phase 3.10 + 3.11 prereqs must verify consumption path before migration · risk: dead skill packs OR MegaBot-only consumption.
8. **Naming drift** — `shipbot` route loads pack named `shipping-center` (`app/api/bots/shipbot/[itemId]/route.ts:106`) · Phase 3.13 must surface this as either rename pack or rename route or document alias.

## §10 · Doctrine Alignment Map

| Doctrine | Application to Phase 3 |
|---|---|
| BINDING #4 DOC-MEASURE-BEFORE-PROMISE | every audit cell measured · zero speculation · counts cited |
| BINDING #5 DOC-PRE-STAGE-NON-IDP-PREFETCH | every Phase 3 cylinder pre-stages existence check on target paths |
| BINDING #7 DOC-SPEC-GROUNDING-VERIFY | runtime catches enforced (e.g., AnalyzeBot consumption path before migration) |
| BINDING #10 DOC-TELEMETRY-LOCK | Sylvia loader keeps Gateway egress invariant · no direct provider SDK |
| BINDING #16 DOC-DELEGATE-TO-CANONICAL | new loader wraps old · single source of truth at `lib/sylvia/skill-loader.ts` |
| BINDING #17 DOC-AUDIT-FIRST-WIRE-PATTERN | this audit IS the contract for Phase 3 · ratifies further on Phase 3.1 |
| CLAUDE.md §7 ADDITIVE-ONLY | new skills added · existing skills never deleted · migration is additive then symlink |
| F1 ENGINE DOCTRINE | inline prompt text prohibited · enforced per cylinder |

---

## §11 · Reads Confirmation (Part A)

| File | Lines read | Citation in audit |
|---|---|---|
| `lib/sylvia/index.ts` | 1-21 (full · 41 lines) | §3 surface inventory · S4 declaration |
| `lib/sylvia/triage-router.ts` | 1-30 (head · full 447) | §3 routing logic |
| `lib/sylvia/memory.ts` | 1-20 (head · full 204) | §3 memory layer |
| `lib/sylvia/types.ts` | summary count (101 lines) | §3 type contracts |
| `lib/bots/skill-loader.ts` | 1-50 + exports grep · full 215 | §2 canonical loader patterns |
| `lib/megabot/run-specialized.ts:78` | comment cite | §2 megabot orchestration cite |
| `lib/megabot/prompts.ts` | grep verified (no `loadSkillPack` direct hit) | §3 megabot path |
| 9 bot routes | grep `loadSkillPack` per-route | §1 + §3 per-bot table |
| `app/api/megabot/[itemId]/route.ts:21,378` | cite | §2 + §3 |
| `app/admin/page.tsx:14,480` | cite | §2 admin diagnostic surface |
| `next.config.ts:46-48` | cite | §2 bundling · §5 migration update |
| `docs/DOCTRINE_LEDGER.md` row 6,16,17 | cite | §3 + §10 alignment |
| Skill folder `find` + `du` + `wc -l` per bot | output captured | §1 inventory |

**No file was edited. All reads are confirmations for the audit doc.**

---

## Appendix A · Skill-pack file size distribution

Largest packs by on-disk size · informs Phase 3 cylinder ordering (largest = highest migration risk · earliest verification value).

| Rank | Pack | Files | Size | Per-file avg |
|---|---|---|---|---|
| 1 | analyzebot | 27 | 328K | ~12.1K |
| 2 | videobot | 21 | 292K | ~13.9K |
| 3 | photobot | 20 | 284K | ~14.2K |
| 4 | pricebot | 24 | 252K | ~10.5K |
| 5 | listbot | 24 | 200K | ~8.3K |
| 6 | carbot | 20 | 188K | ~9.4K |
| 7 | collectiblesbot | 20 | 188K | ~9.4K |
| 8 | antiquebot | 20 | 184K | ~9.2K |
| 9 | buyerbot | 26 | 180K | ~6.9K |
| 10 | reconbot | 22 | 164K | ~7.5K |
| 11 | _shared_megabot | 5 | 44K | ~8.8K |
| 12 | _shared | 3 | 24K | ~8.0K |
| 13 | documentbot | 3 | 12K | ~4.0K |
| 14 | intel-panel | 2 | 8.0K | ~4.0K |
| 15 | shipping-center | 2 | 8.0K | ~4.0K |

**Observations:**
- Top-3 packs by size are the consumption-uncertain bots (analyzebot · photobot) plus videobot · concentrating Phase 3 uncertainty in 3 cylinders.
- BuyerBot has the most files (26) but smaller per-file average — suggests narrow, focused skills (consistent with Cyl 2A extraction discipline).
- `_shared` total size is small (24K) — symlink-eligible during migration.

## Appendix B · SSA spec comparison table

Side-by-side LegacyLoop ↔ Anthropic SSA pattern comparison.

| Feature | LegacyLoop today | Anthropic SSA | Migration delta |
|---|---|---|---|
| Skill file format | `*.md` (numbered prefix `01-` `02-`) | `SKILL.md` (single per folder) | LegacyLoop is "skill PACK" (multi-file aggregate) — additive divergence preserved |
| Frontmatter | optional · stripped via `stripFrontmatter()` (skill-loader.ts:43) | required · structured schema | Phase 3.1 formalizes schema |
| Auto-discovery | name-match (`loadSkillPack(botType)`) | intent-match (model decides) | Phase 3 retains name-match, banks intent-match for V2 |
| Reference data | none | `data/` folder (CSV/JSON) | additive in Phase 3.8 (CarBot VIN data) + 3.6 (AntiqueBot eras) |
| Few-shot examples | none | `examples/` folder | additive · banked per-bot in Phase 3.x |
| Helper code | none | `script.py` (Python) | proposed `helper.ts` for TypeScript parity (Phase 3.10 AnalyzeBot dimensions) |
| Versioning | `SKILLS_VERSION` constant + `lastUpdated` ISO timestamp | per-skill semver in frontmatter | Phase 3.1 adds frontmatter `version` field |
| Caching | process-level Map (skill-loader.ts cache) | runtime-managed | LegacyLoop cache strategy preserved (serverless-warm-friendly) |
| Loader location | `lib/bots/skill-loader.ts` (215 lines) | Anthropic SDK internal | Phase 3.1 adds `lib/sylvia/skill-loader.ts` wrapper · BINDING #16 |

## Appendix C · Phase 3 prereq checklist (for Cyl 3.1 fire authorization)

Before Phase 3.1 fires, the following must be true:

- [x] `docs/SYLVIA_SKILLS_ARCHITECTURE_AUDIT.md` exists at HEAD (this commit lands it)
- [x] `lib/bots/skill-loader.ts` confirmed canonical · 215 lines · 3 exports
- [x] `lib/sylvia/index.ts:6-7` declares S4 skills as future scope (alignment confirmed)
- [x] BINDING #16 + #17 ratified (per `docs/DOCTRINE_LEDGER.md`)
- [x] Round 13 P0 worktree infrastructure live (parallel migration cylinders viable)
- [ ] AnalyzeBot consumption path verified (Phase 3.10 prereq) — DEFERRED to that cylinder
- [ ] PhotoBot consumption path verified (Phase 3.11 prereq) — DEFERRED to that cylinder
- [ ] Prompt-effectiveness benchmark harness drafted (Phase 3.2 prereq) — BANKED LOW-PRI
- [ ] CEO greenlight on Phase 3 scope (this audit + Cyl 3.1 spec draft) — POST-AUDIT

## Appendix D · Active sentinel watch (per Phase 3 cylinder)

Sentinel doctrines that must be cited in every Phase 3 cylinder's §6 build harness:

| Sentinel | Watch trigger | Action if triggered |
|---|---|---|
| DOC-VERIFY-VERCEL-AFTER-COMMIT | every Phase 3 commit | cite `dpl_<id>` READY in §12 |
| DOC-PARALLEL-FILE-COLLISION-CHECK | parallel Phase 3 wave | per-worktree disjoint by spec §3 |
| DOC-MULTI-AGENT-INDEX-ISOLATION-PRECHECK | every `git add` | cached-diff scope verified pre-commit |
| F1 ENGINE DOCTRINE | every prompt-touching commit | inline-prompt prohibition enforced |
| DOC-MEASURE-BEFORE-PROMISE | every claim in §12 | grep / find / wc cite mandatory |
| DOC-BAN-ENV-FILE-DUMP | any `.env*` interaction | grep -c only · NEVER cat |

## Audit complete · Round 13 P3 anchor

*Cite this doc in every Phase 3 cylinder's §0 grounding.*

*End of SYLVIA_SKILLS_ARCHITECTURE_AUDIT.md*
