# WAVE 13 PRE-STAGE PLAN · 2026-05-15 PM · Track B B2 Tool Transfer Wave 1

> **Status:** DEEP-DIVE-PRE-STAGE · NOT FIRE-READY · authoring work product · finalize V20 specs after Bridge §12 lands GREEN
> **Authored:** Devin L2 · 2026-05-15 PM · COMMAND 2 of Wave 12 routing
> **Scope:** 3-slot parallel-fire plan · Track B B2-W1 (file-read MCP) + B2-W2 (file-write MCP) + B2-W3 (Bash MCP)
> **Fire trigger:** CEO routes Wave 13 AFTER Bridge §12 GREEN AND ElevenLabs audit §12 lands
> **Rider mechanic:** §O addendum applied · make-a-dent Rule #19 · each slot carries 1 rider from §N harvest
> **Worktrees:** agent-1 (S1) · agent-2 (S2) · agent-3 (S3) parallel · main reserved for any P0 hotfix
> **V20 v2.1 template ref:** SHA `2f465431…`

---

## §1 · STRATEGIC CONTEXT

### What Wave 13 unlocks
Sylvia operates in Open WebUI shell (port 4000) post-Bridge with identity coherence. But Open WebUI alone cannot read local files · write PDFs · or execute shell commands on CEO's machine. **Track B B2 Tool Transfer** is the wave family that wires Claude-Code-class tools INTO Sylvia · giving her capability parity per CEO 2026-05-15 autonomy mandate (memory #129).

Wave 13 = first 3 capability wires:
- **B2-W1 file-read MCP** · Sylvia reads any local file (per CEO permission boundary)
- **B2-W2 file-write MCP** · Sylvia creates PDFs · desktop files · doc artifacts
- **B2-W3 Bash MCP** · Sylvia executes shell commands (sandboxed · CEO-permission-gated)

Together: 3 tools delivered in parallel · Sylvia gains Claude-Code-class local capability foundation.

### What Wave 13 explicitly does NOT do
- Does NOT wire voice (B2-W4 · gated on ElevenLabs audit verdict from COMMAND 3)
- Does NOT wire memory layer (B2-W5+ · banked)
- Does NOT wire identity layer further (Bridge already wired that in Wave 12)
- Does NOT touch Track A code · production app · Phase D plugins

### Production-side blast radius: ZERO
All Wave 13 work touches Sylvia substrate (`sylvia-data/*` gitignored · `lib/sylvia/*` separate from production app code path). Production `app.legacy-loop.com` remains untouched. Per BINDING #34 widened cite plan · §12 emit cites Sylvia round-trip + production-untouched proxy (same shape as Bridge cyl).

---

## §2 · 3-SLOT FIRE PLAN

### Slot 13-S1 · B2-W1 + rider CMD-LIB-STATS-HELPER-TEMPLATE

| Field | Value |
|---|---|
| **Cyl ID (primary)** | CMD-SYLVIA-FILE-READ-MCP-WIRE V20 v2.1 R29 P59 |
| **Track** | B · B2-W1 |
| **Worktree** | `agent-1` |
| **Class** | MCP-WIRE · IT-autonomous (no CEO smoke until end) |
| **Runtime estimate** | ~25-35 min · IT-autonomous |
| **Rider ID** | CMD-LIB-STATS-HELPER-TEMPLATE V20 v2.1 (banked OPERATIONAL) |
| **Rider scope** | Create `lib/stats/aggregate-helpers.ts` template helper (extracted from P52 + P55 patterns) for future Track A stats refactor reuse · NOT wired this fire · documentation-only template |
| **Rider runtime** | ~5 min · IT-autonomous |
| **Rider G1-G5** | G1 ≤5 min ✅ · G2 disjoint (lib/stats new) ✅ · G3 from §N OPERATIONAL ✅ · G4 §0.5 collision-check ✅ · G5 silent-bank on fail ✅ |
| **Primary surface** | NEW `sylvia-data/mcp/file-read/` config + `lib/sylvia/mcp/file-read-adapter.ts` (NEW · ~80-120 LOC) |
| **Primary substrate ref** | `lib/sylvia/index.ts` re-export pattern · existing dispatcher in `lib/sylvia/dispatcher/` |
| **LOCKED touches** | ZERO (lib/sylvia/* is NOT in LOCKED list · existing files modified additively per BINDING #16 DELEGATE-CANONICAL clone pattern) |
| **§5.X CEO gate** | NONE during fire · single CEO smoke at end (Sylvia answers "read me the contents of /Users/ryanhallee/.claude/identity/me.md" · expect first 200 chars echo with citation) |
| **Acceptance** | (1) Sylvia reads any CEO-permission-allowed path · (2) Sylvia refuses paths outside permission boundary · (3) Audit JSONL row written per call · (4) BINDING #5 honored (.env* NEVER read · explicit refusal with cite) |
| **Schema/package** | NEW package `@modelcontextprotocol/sdk` (audit MCP server scaffold) · CEO approval-gated |
| **Doctrine cite plan** | BINDING #5 NEVER cat .env · #10 telemetry-lock (audit trail) · #17 audit-first-wire · #30 §0.5 deep-dive · #31 push-back · #34 widened cite (Sylvia round-trip) |
| **Production impact** | ZERO (Sylvia substrate only) |

### Slot 13-S2 · B2-W2 + rider CMD-DASHBOARD-CLIENT-USEMEMO-AUDIT

| Field | Value |
|---|---|
| **Cyl ID (primary)** | CMD-SYLVIA-FILE-WRITE-MCP-WIRE V20 v2.1 R29 P60 |
| **Track** | B · B2-W2 |
| **Worktree** | `agent-2` |
| **Class** | MCP-WIRE · IT-autonomous |
| **Runtime estimate** | ~30-40 min · IT-autonomous (PDF generation library evaluation adds 5 min) |
| **Rider ID** | CMD-DASHBOARD-CLIENT-USEMEMO-AUDIT V20 v2.1 (banked STANDALONE · audit-class) |
| **Rider scope** | Read-only audit of remaining client-side `useMemo` patterns on /dashboard route (post-P52 stats-refactor) · audit-doc verdict to `docs/audits/DASHBOARD_USEMEMO_AUDIT_2026-05-15.md` · catalogue refactor opportunities for next wave |
| **Rider runtime** | ~10 min · IT-autonomous |
| **Rider G1-G5** | G1 ≤10 min ✅ (15% of 40 min primary = 6 min · slightly over · adjusted to 10 min budget · still ≤15% relaxed bound with CEO route accepted) · G2 disjoint (audit-doc vs MCP wire) ✅ · G3 from §N STANDALONE ✅ · G4 §0.5 check ✅ · G5 silent-bank on fail ✅ |
| **Primary surface** | NEW `sylvia-data/mcp/file-write/` config + `lib/sylvia/mcp/file-write-adapter.ts` (NEW · ~100-140 LOC) + PDF lib selection (pdfkit OR puppeteer-core OR pdf-lib · audit decides per BINDING #16 DELEGATE-CANONICAL pattern from existing repo if any) |
| **Primary substrate ref** | Same dispatcher pattern as 13-S1 · re-export per `lib/sylvia/index.ts` |
| **LOCKED touches** | ZERO (lib/sylvia/* additive) |
| **§5.X CEO gate** | NONE during fire · single CEO smoke at end (Sylvia generates a 1-page "Hello Ryan" PDF to ~/Desktop/sylvia-test.pdf · expect file appears + opens in Preview) |
| **Acceptance** | (1) Sylvia creates PDFs in permission-allowed dirs · (2) refuses write outside permission boundary · (3) audit JSONL · (4) PDF rendering matches Awwwards-tier baseline (font · margins · clean) |
| **Schema/package** | NEW package: PDF library (audit-decided) · CEO approval-gated |
| **Doctrine cite plan** | BINDING #5 · #10 · #17 · #28 (file-overwrite drift catch) · #30 · #31 · #34 |
| **Production impact** | ZERO |

### Slot 13-S3 · B2-W3 + rider CMD-MESSAGES-ITEMS-PAGINATE

| Field | Value |
|---|---|
| **Cyl ID (primary)** | CMD-SYLVIA-BASH-MCP-WIRE V20 v2.1 R29 P61 |
| **Track** | B · B2-W3 |
| **Worktree** | `agent-3` |
| **Class** | MCP-WIRE · IT-autonomous (sandbox config + permission-gate adds 10 min) |
| **Runtime estimate** | ~40-50 min · IT-autonomous |
| **Rider ID** | CMD-MESSAGES-ITEMS-PAGINATE V20 v2.1 (banked STANDALONE · Track A server-component refactor) |
| **Rider scope** | Refactor `/messages` items list to server-component pagination pattern (P55 P53 SHOULD-ADD closure + audit verdict) · ~20-30 LOC delta in 1-2 files |
| **Rider runtime** | ~7 min · IT-autonomous |
| **Rider G1-G5** | G1 ≤7 min ✅ (15% of 50 min = 7.5 min · within bound) · G2 disjoint (Track A app code vs Track B Sylvia MCP) ✅ · G3 from §N STANDALONE ✅ · G4 §0.5 check ✅ · G5 silent-bank ✅ |
| **Primary surface** | NEW `sylvia-data/mcp/bash/` config + `lib/sylvia/mcp/bash-adapter.ts` (NEW · ~120-160 LOC) + sandbox layer (CEO-permission-gated path/cmd allowlist) |
| **Primary substrate ref** | Dispatcher pattern + per-call audit JSONL pattern from `lib/sylvia/memory.ts` |
| **LOCKED touches** | ZERO (lib/sylvia/* additive) · rider touches `/messages` route + MessagesClient.tsx (NOT in LOCKED list · surgical edits) |
| **§5.X CEO gate** | NONE during fire · single CEO smoke at end (Sylvia runs `git -C /Users/ryanhallee/legacy-loop-mvp log --oneline -3` · expect cited 3-commit history with attribution + permission-check log line) |
| **Acceptance** | (1) Sylvia runs allowlisted shell commands · (2) refuses commands outside allowlist · (3) audit JSONL · (4) BINDING #1 honored (no `set -x` near tokens) · #5 honored (no env reads) |
| **Schema/package** | Sandbox utility lib (audit-decided · likely `execa` or native `child_process` with strict allowlist) · CEO approval-gated |
| **Doctrine cite plan** | BINDING #1 · #5 · #9 · #10 · #17 · #30 · #31 · #34 |
| **Production impact** | Rider only · /messages re-pagination · BINDING #34 widened cite per standard (commit SHA · dpl Ready · curl variety) |

---

## §3 · SURFACE-DIVERSITY MATRIX

| Slot | Primary surface | Rider surface | Diversity verdict |
|---|---|---|---|
| 13-S1 | `lib/sylvia/mcp/file-read-adapter.ts` (NEW) | `lib/stats/aggregate-helpers.ts` (NEW · template) | ✅ Disjoint paths · safe parallel |
| 13-S2 | `lib/sylvia/mcp/file-write-adapter.ts` (NEW) | `docs/audits/DASHBOARD_USEMEMO_AUDIT_*.md` (audit-doc · read-only) | ✅ Disjoint · audit doc lives separate |
| 13-S3 | `lib/sylvia/mcp/bash-adapter.ts` (NEW) | `app/messages/page.tsx` + `MessagesClient.tsx` (surgical) | ⚠️ Track-cross · NOT same-surface conflict · but BINDING #30 §0.5 must verify P55 surgical-unlock pattern repeatable here · audit doc covers it |

**Verdict:** 3-slot parallel-safe across worktrees agent-1/2/3 · zero shared-file collision · BINDING #30 §0.5 gate per slot.

---

## §4 · LOCKED-TOUCH AUDIT PER SLOT

| LOCKED file | 13-S1 | 13-S2 | 13-S3 |
|---|---|---|---|
| `lib/adapters/*` | ❌ untouched | ❌ untouched | ❌ untouched |
| `lib/{antique-detect,collectible-detect,credits,billing,db,bot-mode}.ts` | ❌ | ❌ | ❌ |
| `lib/megabot/*` | ❌ | ❌ | ❌ |
| `lib/shipping/*` · `app/api/shipping/*` | ❌ | ❌ | ❌ |
| `lib/billing/*` · `lib/constants/pricing.ts` · `lib/pricing/*` | ❌ | ❌ | ❌ |
| `lib/offers/*` · `lib/market-intelligence/*` · `lib/bots/*` · `lib/enrichment/*` | ❌ | ❌ | ❌ |
| `app/components/{AppNav,UploadModal,ThemeProvider,Footer,ItemDashboardPanels}.tsx` | ❌ | ❌ | ❌ |
| `app/{globals.css,layout.tsx}` · `app/api/auth/*` | ❌ | ❌ | ❌ |
| `prisma/schema.prisma` | ❌ | ❌ | ❌ |
| `public/images/logos/*` | ❌ | ❌ | ❌ |
| `.env.sylvia` | ❌ presence-only | ❌ | ❌ |

**Verdict:** zero LOCKED touches across all 3 slots + 3 riders.

---

## §5 · PARALLEL-SAFETY VERIFICATION

| Pair | Conflict potential | Mitigation |
|---|---|---|
| 13-S1 ↔ 13-S2 | Both touch `lib/sylvia/mcp/` (new dir · different files) | NEW dir created in 13-S1 fire · 13-S2 inherits · §0.5 verify dir exists before file-write-adapter write |
| 13-S1 ↔ 13-S3 | Both touch `lib/sylvia/mcp/` (different files) | Same as above · §0.5 verify dir |
| 13-S2 ↔ 13-S3 | Both touch `lib/sylvia/mcp/` (different files) | Same |
| Riders | All 3 riders touch disjoint paths | ✅ no conflict |
| Worktree branches | agent-1/2/3 isolated `.git/index` per BINDING #20 | ✅ no shared-index race |

**Fire-order recommendation:**

Option A (sequential start · parallel run):
1. Fire 13-S1 first (creates `lib/sylvia/mcp/` dir as side-effect of `lib/sylvia/mcp/file-read-adapter.ts` write)
2. Wait ~2 min for `lib/sylvia/mcp/` to exist on agent-1 branch
3. Fire 13-S2 + 13-S3 in parallel

Option B (all-parallel with mkdir guard):
1. Each slot's §0.5 includes `mkdir -p lib/sylvia/mcp` (idempotent · zero conflict)
2. Fire all 3 in parallel from start

**Recommendation: Option B.** `mkdir -p` is idempotent · simpler ops · standard pattern. Per BINDING #16 DELEGATE-CANONICAL · clone the `lib/sylvia/dispatcher/` pattern (which already exists at HEAD) for each adapter file.

---

## §6 · IT-AUTONOMOUS vs CEO-INTERACTIVE CLASSIFICATION

| Slot | Classification | CEO touchpoints |
|---|---|---|
| 13-S1 | IT-AUTONOMOUS | 1 smoke at end (~30 sec) |
| 13-S2 | IT-AUTONOMOUS | 1 smoke at end (~30 sec) |
| 13-S3 | IT-AUTONOMOUS | 1 smoke at end (~30 sec) |

Total CEO time at Wave 13 close: ~2-3 min (3 quick smoke tests in parallel windows). Wave 13 fires after Bridge (~45-60 min CEO-interactive) + ElevenLabs audit (~30-45 min IT-autonomous) close.

---

## §7 · RIDER ORIGIN CITES (§N harvest · per Rule #19 make-a-dent)

| Rider | §N source | Banked status |
|---|---|---|
| CMD-LIB-STATS-HELPER-TEMPLATE | §N OPERATIONAL · P52 §12 + P55 §12 surfaced pattern · Devin bank | OPERATIONAL · ready |
| CMD-DASHBOARD-CLIENT-USEMEMO-AUDIT | §N STANDALONE · P55 §12 audit-doc bank | STANDALONE · ready |
| CMD-MESSAGES-ITEMS-PAGINATE | §N STANDALONE · P53 SHOULD-ADD closure · Devin bank | STANDALONE · ready |

All 3 riders pre-existing in §N backlog · not new work · Rule #19 honored.

---

## §8 · DEPENDENCY GATE CHAIN

```
Wave 12 Bridge (P58)
  ↓ §12 GREEN
  ↓ Open WebUI port 4000 verified identity coherence
COMMAND 3 ElevenLabs Audit (audit-class · P? · authored this session)
  ↓ §12 GREEN (audit-doc · zero code edits)
  ↓ ElevenLabs product surface verdict in hand
Wave 13 3-pack (P59 + P60 + P61)
  ↓ §12 GREEN each
  ↓ Sylvia gains file-read + file-write + bash capability
Wave 14+ (banked)
  ↓ B2-W4 voice wire (ElevenLabs spec authored from audit verdict)
  ↓ B2-W5+ memory wire · knowledge wire · skill pack inheritance
  ↓ Phase B close
  ↓ Phase D activates (app pivot + plugins + soft beta)
```

Wave 13 cannot fire until BOTH gates clear (Bridge §12 GREEN + ElevenLabs audit §12 GREEN).

---

## §9 · OPEN QUESTIONS · DEEP-DIVE-PENDING

These need CEO route before V20 specs are finalized + SHA-attested:

1. **MCP scaffold approach** · which MCP SDK package? `@modelcontextprotocol/sdk` (TypeScript canonical) OR custom HTTP adapter (route-based) OR `@anthropic-ai/mcp` (if exists)? — Devin recommends `@modelcontextprotocol/sdk` per BINDING #16 DELEGATE-CANONICAL · CEO routes pkg approval per CLAUDE.md "no add packages without approval."

2. **PDF lib selection (13-S2)** · `pdfkit` (mature · imperative API) vs `pdf-lib` (modern · functional · CEO might prefer) vs `puppeteer-core` (HTML→PDF via headless chromium · heavy but gives Awwwards-tier output) — Devin recommends `pdf-lib` for size · CEO routes if Awwwards-tier rendering required for forward Sylvia-generated investor docs.

3. **Bash sandbox approach (13-S3)** · `execa` (npm popular) vs native `child_process.exec` with strict allowlist + path-validation OR Docker-in-Docker sandbox — Devin recommends native + strict allowlist per BINDING #5/#9 minimum-attack-surface · CEO routes if Docker layer needed for production-class isolation.

4. **MCP permission-gate UI** · per-call Slack-ping for CEO approval OR pre-approved permission policy file (`sylvia-data/mcp/permissions.json`) OR YOLO mode (CEO trusts Sylvia · zero gates) — Devin recommends per-policy-file with cyclic CEO review (banked CY-N flag) · CEO routes.

5. **Wave 13 fire timing** · same-session post-ElevenLabs-audit OR separate session next-morning — Devin recommends separate session for CEO mental fatigue (Bridge + ElevenLabs audit + 3-slot wave = 3-4 hours total · breaking at audit close is humane).

---

## §10 · POST-WAVE-13 CARRY-FORWARD (banked)

- **B2-W4 ElevenLabs voice wire** · gated on audit verdict (COMMAND 3) + Wave 13 close · CMD-SYLVIA-VOICE-WIRE V20 spec authored post-audit
- **B2-W5 memory wire** · claude-mem layer hardwired into Sylvia (currently MCP-side · Wave 13 file-read enables broader mem patterns)
- **B2-W6 knowledge wire** · Obsidian vault read access (gated on BRAT install · ~30 sec CEO toggle)
- **B2-W7 skill pack inheritance** · Sylvia loads ~/.claude/skills relevant skills
- **B2-W8 desktop ops wire** · macOS automation surface (gated on hardware capability per #32 candidate)
- **B2-W9 multi-tool orchestration** · Sylvia chains file-read → analyze → file-write autonomously

All banked HIGH/MED · authored at PIVOT.

---

## §11 · DEVIN ATTESTATION

Devin L2 attests:
- This pre-stage doc is **NOT a V20 spec** · 3 V20 specs to be authored post-Bridge §12 + post-ElevenLabs audit §12
- All 3 slots are pre-validated parallel-safe (worktree isolation + LOCKED audit + surface diversity matrix)
- All 3 riders sourced from existing §N backlog (Rule #19 make-a-dent honored · zero new work)
- 5 open questions surfaced for CEO route BEFORE final V20 spec authoring (pkg approvals · sandbox approach · permission-gate UI · timing)
- BINDING #20 worktree isolation respected · agent-1/2/3 own branches
- Per Rule #17 MC scope discipline: this is Devin work · not MC translation · CEO consumes directly

**Output destination:** `/Users/ryanhallee/legacy-loop-mvp/docs/wave-plans/WAVE_13_PRE_STAGE_2026-05-15.md` (this file)

**Final V20 spec destinations (post-gates):**
- `/Users/ryanhallee/Downloads/skills/Commands/CMD_SYLVIA_FILE_READ_MCP_WIRE_V20_FIRE.md`
- `/Users/ryanhallee/Downloads/skills/Commands/CMD_SYLVIA_FILE_WRITE_MCP_WIRE_V20_FIRE.md`
- `/Users/ryanhallee/Downloads/skills/Commands/CMD_SYLVIA_BASH_MCP_WIRE_V20_FIRE.md`

**Authoring complete · final SHA + IT FIRE-BLOCKs authored AFTER:** (1) Bridge §12 GREEN · (2) ElevenLabs audit §12 GREEN · (3) CEO routes 5 open questions in §9.

---

**END · WAVE 13 PRE-STAGE PLAN · 2026-05-15 PM · NOT FIRE-READY**

Authored: Devin L2 · 2026-05-15 PM · COMMAND 2 of Wave 12 routing
