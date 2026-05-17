# Agent Memory vs claude-mem — Evaluation Audit

**CMD:** CMD-AGENT-MEMORY-EVALUATE V19
**Date:** 2026-05-13 Wed
**Author:** Devin L1 background · evaluation only · zero state mutation
**Anchor HEAD:** `074f778`
**Track:** R28 P1 · Wave A8
**Pairs with:** banked claude-mem decision D1 (Agent C R3 DEFER) · Sylvia QW B6.1a memory bridge gate
**Doctrine:** BINDING #17 audit-first-wire · BINDING #28 drift-catch · DOC-PUSHBACK-WITH-REPLACEMENT (CEO single-package assumption → Devin 4-candidate substitute)

---

## §0 · TL;DR · WINNER

> **P0 · `@agentmemory/agentmemory` (rohitg00)** — 32.0 / 35 (91%)
>
> Matches CEO ref #22 verbatim: npx-runnable, cross-session memory, beats claude-mem benchmarks (95.2% R@5 vs claude-mem token-summarization tier). Native MCP server (51 tools), 10+ agent compatibility, SQLite + vector + knowledge-graph backend, 4-tier memory model that maps Sylvia Moat #1 Two-Tier pattern cleanly.
>
> **Runner-up:** P5 status quo native discipline — 27.6 (79%). Cheap, doctrine-aligned, but no cross-tool reach.
>
> **CEO decision required:** greenlight P0 install cylinder OR override to runner-up. NO INSTALL fired this cylinder.

---

## §1 · PUSH-BACK · EMPIRICAL FINDING

CEO wake-up ref #22 named "agent-memory (npx) · cross-session memory · supersedes claude-mem" as if singular. **Empirical `npm search agent-memory` surfaced 3 unrelated packages**, NONE of which match the "supersedes claude-mem benchmarks" claim. WebSearch surfaced a **4th candidate** — `@agentmemory/agentmemory` published by rohitg00 — that DOES match. The 4th candidate is the real CEO target; the npm-search trio is namespace noise.

Per `feedback_pushback_means_replace.md`: substitute identification surfaced before install. Avoids 81-skill-metadata-budget repeat (CodeBurn "less is more").

---

## §2 · CANDIDATE INVENTORY

### P0 · `@agentmemory/agentmemory` (rohitg00) — REAL CEO TARGET

| Field | Value |
|---|---|
| Source | github.com/rohitg00/agentmemory |
| npx | `npx @agentmemory/agentmemory` |
| License | Apache-2.0 |
| Stars | 6.9K |
| Latest | v0.9.11 (May 2026) |
| Tests | 827 passing |
| Backend | SQLite + vector (`all-MiniLM-L6-v2` local embed) + knowledge graph |
| Search | BM25 + vector + graph with RRF fusion |
| MCP | native server · 51 tools (`memory_smart_search`, `memory_save`, `memory_recall`, …) |
| REST | 107 endpoints port 3111 · bearer auth via `AGENTMEMORY_SECRET` |
| Viewer | localhost:3113 real-time dashboard |
| Memory tiers | Working → Episodic → Semantic → Procedural · decay + consolidation |
| Capture | 12 automatic hooks · zero manual entry |
| Tools supported | Claude Code · Cursor · Codex CLI · Gemini CLI · Hermes · OpenClaw · Cline · Windsurf · Roo Code · any MCP client |
| Benchmarks | 95.2% R@5 LongMemEval-S vs mem0 68.5% · Letta 83.2% |
| Token efficiency | ~170K tokens/yr ($10) vs 650K+ LLM-summarization |
| Privacy | "Privacy filter (strip secrets, API keys)" in PostToolUse hook · patterns undocumented |
| Isolation | per-project by default (Project path + session ID) · optional `TEAM_ID` + `USER_ID` namespace |
| Upgrade | `npx @agentmemory/agentmemory upgrade` (calls `cargo install iii-engine --force`) |
| Budget | `TOKEN_BUDGET=2000` injection cap (no $ tracking) |

### P1 · `agent-memory` (kenryu) — SQUATTER STUB

| Field | Value |
|---|---|
| Source | npm only · no repository field |
| Size | **248 BYTES** · 1 file |
| License | ISC |
| Description | _(empty)_ |
| README | none |
| Maintainer | kenryu `<ken0ryu@gmail.com>` |
| Published | 2025-10-27 |
| Verdict | **name-squat / stub** · no functional code · not a candidate |

### P2 · `@cafitac/agent-memory` (cafitac) — HERMES-FIRST

| Field | Value |
|---|---|
| Source | github.com/cafitac/agent-memory |
| npm | `npm install -g @cafitac/agent-memory` |
| License | MIT |
| Stars | 2 |
| Latest | v0.1.155 (2026-05-13 same-day) |
| Backend | Local SQLite at `~/.agent-memory/memory.db` |
| Tools | Hermes primary (pre-LLM hook) · Claude/Codex via prompt wrapper |
| MCP | none documented |
| Privacy | explicit secret-scan with `rejected_reason=secret_like_text` block |
| Implementation | Python CLI under thin npm launcher (Python 99.8%) |
| Verdict | Hermes-tuned, requires Python env, low signal · not aligned with Claude-Code-first stack |

### P3 · `@xianlinyi/agent-memory` (xianlinyi) — OBSIDIAN + COPILOT

| Field | Value |
|---|---|
| Source | publishes under `@agent-memory/knowledge-graph` install path |
| Install | `npm install -g @agent-memory/knowledge-graph` |
| License | MIT |
| Latest | v0.1.7 (2026-04-19) |
| Size | 87 files · 383KB |
| Backend | Obsidian-compatible Markdown vault + SQLite FTS5 |
| Requires | Node ≥22.13 + GitHub Copilot CLI/SDK auth |
| Tools | CLI + TS SDK only · no MCP |
| Privacy | no redaction documented |
| Verdict | Ideologically closest to Sean Facer ideaverse 3-layer (ideas ref #19) but Copilot-SDK lock-in disqualifies for Legacy-Loop multi-AI stack |

### P4 · `claude-mem` (thedotmack) — BANKED R27 DEFER

| Field | Value |
|---|---|
| Install | `npx claude-mem install` |
| Stars | 46.1K |
| Tools | Claude Code · OpenClaw · Codex · Gemini · Hermes · Copilot · OpenCode |
| Backend | AI-compressed session summaries |
| Token cost | ~650K tokens/yr (LLM compression at each cycle) |
| Status | DEFERRED per Agent C R3 verdict — "95% reduction claim overkill for current state" |

### P5 · status quo native discipline (no install)

Native `MEMORY.md` + per-topic memory files + manual + auto-consolidate hook (banked R28+). Current state: HEALTHY (34.5% line cap · 25.3% byte cap per Agent C R1/R2/R3/R4 §12). Zero deps. Manual redaction discipline.

### P6 · custom Sylvia-native build (Phase B1 absorb)

Build memory directly inside Sylvia substrate · perfect Moat #1 fit · all engineering owned in-house. High eng cost · long lead time.

---

## §3 · DECISION MATRIX · 7 PATHS × 7 CRITERIA

### Criteria + weights

| Criterion | Weight | Why |
|---|---:|---|
| Install simplicity | 1.0 | matters today |
| MCP compatibility | 1.0 | must compose with Claude Code MCP stack |
| Cross-tool reach | 0.8 | CEO uses multiple AI tools |
| API-key auto-redaction | 1.5 | BINDING #5 + #9 · PII risk |
| Cost ($) | 0.7 | budget tight |
| Sylvia template fit (Moat #1) | 1.5 | future-proofs Phase B |
| Maintenance / community | 0.5 | longevity |

**Max possible weighted score:** 5 × (1.0 + 1.0 + 0.8 + 1.5 + 0.7 + 1.5 + 0.5) = **35.0**

### Scores (1-5 honest · no inflation)

| Path | Install (1.0) | MCP (1.0) | Cross (0.8) | Redact (1.5) | Cost (0.7) | Sylvia (1.5) | Maint (0.5) | **Weighted** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|
| **P0 rohitg00 `@agentmemory/agentmemory`** | 5 | 5 | 5 | 4 | 5 | 4 | 5 | **32.0** |
| P1 kenryu stub | 1 | 1 | 1 | 1 | 5 | 1 | 1 | 9.8 |
| P2 cafitac (Hermes/Python) | 3 | 2 | 2 | 4 | 5 | 2 | 2 | 20.1 |
| P3 xianlinyi (Obsidian/Copilot) | 3 | 2 | 3 | 2 | 4 | 4 | 2 | 20.2 |
| P4 claude-mem (banked) | 5 | 4 | 4 | 3 | 3 | 3 | 5 | 25.8 |
| P5 status quo native | 5 | 3 | 2 | 5 | 5 | 3 | 5 | 27.6 |
| P6 custom Sylvia build | 1 | 5 | 3 | 5 | 2 | 5 | 2 | 25.8 |

### Per-criterion scoring rationale

- **Install:** npx-single-command = 5 · npm-global = 4 · Python-env + npm = 3 · build-from-scratch = 1
- **MCP:** native MCP server + tools = 5 · 4 = announced support but partial · 2-3 = adapter wrapping · 1 = none
- **Cross-tool:** 10+ tools = 5 · 5-7 = 4 · 2-3 = 2-3 · 1 = single
- **Redact:** documented patterns + secret-scan block = 5 · filter exists but patterns undocumented = 4 · LLM-mediated indirect = 3 · none = 1-2
- **Cost:** local-only $0 ongoing = 5 · ~$10/yr local embed = 5 · LLM-summarized 650K tok/yr = 3 · eng-time only = 2 · none = 5 free
- **Sylvia fit:** 4-tier matches Moat #1 = 4-5 · 3-layer Obsidian alignment = 4 · doctrine-only inheritance = 3 · external runtime coupling = 2
- **Maint:** 6.9K+ stars · 800+ tests = 5 · 46K stars but DEFERRED = 5 · 2 stars or 0.1.x = 2 · zero deps doctrine = 5

### Winner

**P0 · `@agentmemory/agentmemory` (rohitg00)** at 32.0 / 35 (**91%**).

1-line justification: *Native MCP + cross-tool + 4-tier memory model · matches CEO ref #22 verbatim · benchmarks beat claude-mem · privacy filter present (gap: patterns undocumented · flagged below).*

Runner-up: **P5 status quo** at 27.6 (79%). Strongest on redaction + cost + maintenance. Weakest on cross-tool reach + MCP composition.

Gap between P0 and P5: 4.4 points · driven by MCP (+2.0) and Cross-tool (+2.4). Closes IF CEO does not use Cursor/Codex/Windsurf — then P5 ties.

---

## §4 · SYLVIA INHERITANCE PATH (Moat #1 Two-Tier Memory)

P0's 4-tier model (Working → Episodic → Semantic → Procedural) maps cleanly:

| P0 tier | Sylvia substrate |
|---|---|
| Working (session-scoped) | `lib/sylvia/memory.ts` in-flight context |
| Episodic (per-session log) | `sylvia-data/identity/sessions/` (banked B6.1a) |
| Semantic (consolidated facts) | `sylvia-kb/` (KB type surface already exists) |
| Procedural (skill / workflow) | `lib/bots/skills/*` skill packs (F1 doctrine) |

Phase B1 Sylvia memory upgrade clones the 4-tier shape · interop with `@agentmemory/agentmemory` via MCP IF CEO chooses dual-stack. Otherwise pattern-only inheritance.

---

## §5 · GAPS · FLAGS

| Gap | Severity | Note |
|---|---|---|
| P0 redaction patterns undocumented | MEDIUM | Verify on install by reading `src/privacy/*` · refuse adoption if regex-only naive filter |
| P0 `cargo install iii-engine --force` on upgrade | LOW | Rust toolchain dependency · check `rustc` present pre-install |
| P0 REST endpoint at 3111 + viewer at 3113 port conflict | LOW | Confirm vs Legacy-Loop dev ports (3000 Next.js · QUARTET range) |
| BINDING #10 telemetry-lock interaction | MEDIUM | P0 makes ANTHROPIC/OPENAI/GEMINI calls if compression enabled — must route through `lib/sylvia/triage-router.ts` or disable compression |
| Sylvia QW B6.1a memory bridge | INFO | Winner pattern feeds bridge design · cross-link |

---

## §6 · CARRY-FORWARDS

1. **CMD-AGENT-MEMORY-INSTALL-ROHITG00 V19** — post-CEO-greenlight install cylinder (banked)
2. **CMD-AGENT-MEMORY-PRIVACY-VERIFY V19** — read `src/privacy/*` for redaction patterns before global trust (banked)
3. **CMD-AGENT-MEMORY-TELEMETRY-LOCK-WIRE V19** — route P0 LLM-compression calls through triage-router (banked · BINDING #10)
4. **Cross-link Sylvia QW B6.1a memory bridge** — winner 4-tier model feeds bridge spec
5. **IF CEO overrides to P5 status quo** — bank CMD-MEMORY-AUTO-CONSOLIDATE-HOOK V19 (already banked R28+)

---

## §7 · DOCTRINE SELF-AUDIT

| Doctrine | Status |
|---|---|
| #5 DOC-BAN-ENV-FILE-DUMP | APPLIED (zero env reads) |
| #16 DOC-DELEGATE-CANONICAL | APPLIED (`npm view` + `npm pack` canonical) |
| #17 DOC-AUDIT-FIRST-WIRE | APPLIED · this IS the audit |
| #20 DOC-PER-AGENT-WORKTREE | APPLIED (Devin · zero IT) |
| #25 DOC-VERCEL-BUDGET-CAP-20 | APPLIED ($0) |
| #28 DOC-AUDIT-DOC-DRIFT-CATCH | APPLIED · 4th candidate discovered pre-spec resolution |
| DOC-PUSHBACK-WITH-REPLACEMENT | APPLIED · CEO single-package assumption → 4-candidate substitute |
| DOC-MEASURE-BEFORE-PROMISE | APPLIED · 1-5 honest scoring · 9.8 floor for stub · zero inflation |

---

## §8 · CEO DECISION SURFACE

Pick one:

- [ ] **GREENLIGHT P0** · install `@agentmemory/agentmemory` via separate V19 install cylinder
- [ ] **OVERRIDE to P5** · ratify status quo + fire auto-consolidate-hook V19
- [ ] **OVERRIDE to P4** · revisit claude-mem (flip D1 DEFER → GREENLIGHT)
- [ ] **OVERRIDE to P6** · push to Phase B1 Sylvia-native custom build
- [ ] **MORE INFO** · fire CMD-AGENT-MEMORY-PRIVACY-VERIFY before greenlight

---

*End of audit. Zero state mutation. Zero installs fired.*
