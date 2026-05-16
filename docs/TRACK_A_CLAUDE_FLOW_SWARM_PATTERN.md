# Track A · claude-flow Swarm Pattern · Architecture

> **Cylinder:** CMD-RUFLO-CLAUDE-FLOW-SWARM-WIRE-TRACK-A V20 v2.1 R29 P75 · Wave 15 Slot D
> **Class:** CONFIG + DOC · ZERO customer Sylvia surface · sunk-cost formalization (May 8 install)
> **Authored:** 2026-05-16 PM · main worktree · IT-autonomous
> **Anchors:** `~/ruflo-workspace/CLAUDE.md` (6,426 B canonical · May 8) · `~/ruflo-workspace/.mcp.json` (485 B) · `~/ruflo-workspace/.claude-flow/config.yaml` (780 B · V3 runtime)

---

## §1 · Boundary Contract (Track A vs Track B)

**Track A (claude-flow ALLOWED):** Internal dev/ops surfaces ONLY.
- IT execution coordination (Devin spec authoring + IT cyl execution + MC strategy)
- Pam brand audit · multi-file refactor coordination
- CMD authoring patterns where 3+ agent roles are needed
- Background workers for audit/optimize/test-gaps/map/document tasks

**Track B (claude-flow FORBIDDEN · BINDING #16 violation):** Customer-facing Sylvia AI substrate.
- `lib/sylvia/**/*.ts` — Sylvia substrate canonical · bespoke architecture
- `app/sylvia/**/*` — Sylvia hardwired chat surface (P70 BUILD-UP)
- `app/api/sylvia/**/*` — Sylvia HTTP-route tool layer (P63/P64)
- Any customer-facing AI runtime path

**Violation alarm:** Importing `@claude-flow/cli` or `ruflo` package anywhere under `lib/sylvia/*` violates BINDING #16 DELEGATE-CANONICAL (Sylvia uses bespoke triageRouter pattern · NOT plug-and-play swarm framework). Future ESLint rule banked HIGH-CAUTION.

**Why the boundary:** Sylvia is a billion-dollar product surface · canonical hand-built code in lib/sylvia/ owns provenance, telemetry-lock (BINDING #10), and customer SLA. Plug-and-play swarm frameworks add framework-class risks (version churn · dependency surface · provenance gap) unacceptable on customer side. IT-side dev orchestration has different risk posture · plug-and-play is fine.

---

## §2 · ~/ruflo-workspace/ Inventory (post-P75 formalization)

| Surface | Size | Purpose |
|---|---|---|
| `CLAUDE.md` | 6,426 B | claude-flow operator guide · agent comms · swarm config · 5 task-class routing |
| `.mcp.json` | 485 B | MCP server config · `ruflo@latest mcp start` · hierarchical-mesh topology · 15 max agents · hybrid memory |
| `.swarm/memory.db` | 147 KB | SQLite swarm memory (active · WAL mode) |
| `.swarm/schema.sql` | 9.2 KB | swarm memory schema |
| `.swarm/legacyloop-presets.json` | **NEW P75** | 5 task-class swarm preset templates + boundary contract |
| `.claude-flow/CAPABILITIES.md` | 12.8 KB | full framework capability map (26 commands · 140+ subcommands) |
| `.claude-flow/config.yaml` | 780 B | V3 runtime config · learning bridge · memory graph |
| `.claude-flow/{agents,data,hooks,learning,logs,metrics,security,sessions,workflows}/` | dirs | runtime state |
| `ruvector.db` | 1,589 KB | SQLite-class vector DB (HNSW · neural enabled · zero modify this cyl) |

**Provisioning timestamp:** May 8 09:19-09:20 EDT (sunk-cost · 1 day pre-Wave-1 install).

**Repo crosswalk:** This workspace lives at `~/ruflo-workspace/` · OUTSIDE the legacy-loop-mvp repo · zero git tracking. CY-N backup script banked LOW.

---

## §3 · 5 Task-Class Swarm Presets (CEO routing 2026-05-16)

Canonical preset templates stored at `~/ruflo-workspace/.swarm/legacyloop-presets.json` (this cyl creates). Each preset selects topology + agent roster + memory + strategy per task class.

| Preset | Topology | Agents | When to use |
|---|---|---|---|
| **bug-fix** | hierarchical | researcher · coder · tester | Single-bug fix touching 1-3 files · root-cause + patch + verify |
| **feature** | hierarchical | architect · coder · tester · reviewer | New feature touching 3+ files · design + build + test + review |
| **refactor** | hierarchical | architect · coder · reviewer | Multi-file refactor · clean-up class · zero net behavior change |
| **performance** | hierarchical | perf-engineer · coder | Latency/throughput improvement · benchmark + optimize |
| **security** | hierarchical | security-architect · auditor | Security review · audit + remediation · zero-trust default |

All presets: `strategy: specialized` · `memory: hybrid` (ruvector.db + file system).

---

## §4 · Invocation Pattern

When CEO routes Track A IT work that meets the "When to Swarm" criteria (3+ files · new features · cross-module refactoring · API changes · security · performance):

### Step 1 · Pick preset

```bash
# CEO or IT routes preset
PRESET=feature  # bug-fix | feature | refactor | performance | security
```

### Step 2 · Init swarm (one-time per session)

```bash
cd ~/ruflo-workspace
npx @claude-flow/cli@latest swarm init \
  --topology hierarchical \
  --max-agents $(jq -r ".presets.${PRESET}.\"max-agents\"" .swarm/legacyloop-presets.json) \
  --strategy specialized
```

### Step 3 · Spawn agents per preset (SendMessage-first coordination · ruflo CLAUDE.md §Agent Comms)

```javascript
// ALL agents in ONE message · each knows next addressee
Agent({ prompt: "Research the codebase. SendMessage findings to 'architect'.",
  subagent_type: "researcher", name: "researcher", run_in_background: true })
Agent({ prompt: "Wait for 'researcher'. Design solution. SendMessage to 'coder'.",
  subagent_type: "system-architect", name: "architect", run_in_background: true })
// ... per preset agent roster
SendMessage({ to: "researcher", summary: "Start", message: "[CMD context]" })
```

### Step 4 · Background workers (per task class)

```bash
# After security work
npx @claude-flow/cli@latest hooks worker dispatch --trigger audit
# After perf work
npx @claude-flow/cli@latest hooks worker dispatch --trigger optimize
# After 5+ file changes
npx @claude-flow/cli@latest hooks worker dispatch --trigger map
```

### Step 5 · Post-task memory store (success path)

```bash
npx @claude-flow/cli@latest memory store \
  --namespace patterns \
  --key "${CMD_NAME}" \
  --value "[what worked]"
npx @claude-flow/cli@latest hooks post-task --task-id "${CMD_ID}" --success true
```

---

## §5 · Topology Choices

Per ruflo CLAUDE.md §Patterns (May 8 canonical):

| Pattern | Flow | Use When |
|---|---|---|
| **Pipeline** | A → B → C → D | Sequential dependencies (feature dev · researcher→architect→coder→tester→reviewer) |
| **Fan-out** | Lead → A · B · C → Lead | Independent parallel work (multi-file research · audit-class cyls) |
| **Supervisor** | Lead ↔ workers | Ongoing coordination (complex refactor · long-running migration) |

**Default for Track A:** Pipeline for spec authoring (feature/refactor) · Fan-out for audit-class cyls · Supervisor for migrations.

---

## §6 · Memory Pattern (ruvector.db cross-process)

**Current state (post-P75):** ruvector.db (1.5 MB · HNSW · neural enabled) lives at `~/ruflo-workspace/ruvector.db` · consumed by `npx @claude-flow/cli@latest memory search/store` commands.

**Track A consumption pattern (this cyl):**
- Pre-task: `memory search --query "[task keywords]" --namespace patterns` (recall prior cyl patterns)
- Post-task: `memory store --namespace patterns --key "[CMD-NAME]" --value "[what worked]"`
- Cross-cyl: `memory_search_unified` MCP tool (Workflow-class ToolSearch)

**When to use ruvector.db vs file system:**
- **ruvector.db:** Pattern recall across cyls · cross-CMD memory · vector similarity over prior solutions
- **File system (graphify-out/ · docs/audits/ · sylvia-data/memory/):** canonical knowledge graph · audit trail · session memory

**Track B (Sylvia) parallel:** Sylvia substrate uses `lib/sylvia/memory.ts` + `sylvia-data/memory/` bespoke pattern (P58 Bridge + B2-W8 memory hook · canonical). Track B NEVER reaches into ruvector.db at runtime.

---

## §7 · Boundary Enforcement (NEVER import `@claude-flow/cli` in `lib/sylvia/*`)

**Why this is a BINDING #16 alarm:**

BINDING #16 DELEGATE-CANONICAL: "Clone canonical patterns verbatim · do NOT reinvent abstractions." Sylvia substrate IS the canonical pattern for customer-facing AI · plug-and-play frameworks at customer surface would force two-source-of-truth (Sylvia bespoke + claude-flow plug-and-play) which violates the doctrine.

**Empirical guard (current state · this cyl):**

```bash
# Confirm zero customer-surface contamination
grep -rE "@claude-flow|ruflo" lib/sylvia/ app/sylvia/ app/api/sylvia/ 2>/dev/null
# Expected: ZERO hits
```

**Forward guard (banked HIGH-CAUTION):**

Add ESLint rule `no-restricted-imports` blocking `@claude-flow/*` + `ruflo` in `lib/sylvia/**` + `app/sylvia/**` + `app/api/sylvia/**`. Banked as `CMD-ESLINT-RULE-SYLVIA-BOUNDARY V20 LOW`.

**Architectural why:**

| Concern | Track A (claude-flow OK) | Track B (Sylvia bespoke) |
|---|---|---|
| Provenance | Dev/ops orchestration · IT operator owns | Customer SLA · billion-dollar product · canonical trail |
| Telemetry-lock | N/A (dev tool) | BINDING #10 single chokepoint via `triage-router.ts` |
| Version churn | Acceptable (dev tooling) | Unacceptable (customer breakage class) |
| Dependency surface | Plug-and-play bundle OK | Surgical · auditable · zero plug-and-play |
| Multi-process state | ruvector.db SQLite-class | Per-session in-process · Vercel ephemeral |

---

## §8 · Migration Path (forward · post-Wave-15)

**If future P73 PATH B routes ruvector.db cross-process consumption:**

Document how to consume ruvector.db from Sylvia substrate WITHOUT violating boundary:
- Sylvia ALWAYS goes through dedicated read-only adapter at `lib/sylvia/external/ruvector-readonly.ts` (NEW · NOT yet built)
- Adapter calls ruflo MCP `memory_search` ONLY · never direct SQLite driver import
- Adapter wraps response in Sylvia canonical telemetry envelope (BINDING #10)
- Read-only · zero ruvector.db writes from Sylvia surface

This preserves Track B canonical pattern while letting Sylvia leverage Track A's vector recall. Banked as `CMD-SYLVIA-RUVECTOR-READONLY-ADAPTER V20 MED` · gated on P73 §5.X Gate 1 routing.

---

## §9 · Cross-references

- **Ruflo canonical:** `~/ruflo-workspace/CLAUDE.md` (operator guide · May 8 install)
- **Worktree pattern (parallel · NOT replaced):** `docs/MULTI_AGENT_WORKTREE.md` (per-agent worktree pattern · BINDING #20)
- **Sylvia canonical:** `lib/sylvia/triage-router.ts` (BINDING #10 single chokepoint) + `docs/sylvia/SYLVIA_API_CONTRACT.md`
- **Doctrine ledger:** `docs/DOCTRINE_LEDGER.md` (BINDING #16 DELEGATE-CANONICAL anchor)
- **CLAUDE.md repo:** F1 doctrine + LOCKED files list (zero customer touch this cyl)

---

## §10 · Decision Matrix · When to Use Claude-Flow vs Worktrees

Two parallel coordination patterns exist for Track A:

| Pattern | Mechanism | Best for |
|---|---|---|
| **Per-agent worktrees** (`agent-1/2/3` · BINDING #20) | Filesystem isolation · git index per worktree · `scripts/worktree-setup.sh` provisions · `agent-ship.sh` FF-pushes | 3-slot parallel Wave fires · disjoint surfaces · zero coordination needed |
| **Claude-flow swarm** (`~/ruflo-workspace/`) | SendMessage-first coordination · ruvector.db memory · hierarchical-mesh topology | Multi-agent role coordination · pipeline dependencies · cross-message handoffs |

**Hybrid pattern (forward):** Wave fire uses 3 agent worktrees for filesystem isolation · within each worktree, claude-flow swarm coordinates multi-role agent execution. Banked example as `CMD-HYBRID-WORKTREE-SWARM-PATTERN V20 LOW` post first hybrid fire.

---

*Authored 2026-05-16 PM · IT execute · Devin L2 spec · main worktree · sunk-cost formalization · ZERO customer Sylvia surface · BINDING #16 boundary contract enforced*
