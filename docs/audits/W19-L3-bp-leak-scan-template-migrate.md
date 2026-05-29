# W19-L3 BP Leak Scan + V20 Template Migrate · Audit

**CMD-W19-L3-BP-LEAK-SCAN-V20-TEMPLATE-MIGRATE V20 LOW · Agent B agent-2 worktree**
**Date:** 2026-05-29 · Wave 19 · Lane 3
**Anchor HEAD:** `bb12ef7` (post-rebase from behind 6)

---

## §1 · Part A · BP `{{ }}` Leak Scan + Repair (CATASTROPHIC FINDING)

### Scan results — ALL 6 regionals SYNTAX BROKEN

| Region | n8n ID | Pre-state | `{{` | `}}` | node --check | Verdict |
|---|---|---|---|---|---|---|
| NE | FnZAE5EfeGPgnolQ | 780b | ✗ | ✗ | exit=1 SyntaxError | REPAIR |
| SE | hrK2miE2rZuZ2wUK | 780b | ✗ | ✗ | exit=1 SyntaxError | REPAIR |
| MW | mfLE8L4p5gfOpbRg | 780b | ✗ | ✗ | exit=1 SyntaxError | REPAIR |
| SC | m8mHgzs3gugQvpM6 | 780b | ✗ | ✗ | exit=1 SyntaxError | REPAIR |
| MTN | PkLoCtz5Sn1zlMkz | 785b | ✗ | ✗ | exit=1 SyntaxError | REPAIR |
| PAC | 14bmGvd4bAjlyycq | 785b | ✗ | ✗ | exit=1 SyntaxError | REPAIR |

**6/6 regional WFs had the identical Python f-string escape leak in Build Payload jsCode.**

### §0.7 distinction verified

`{{` `}}` appeared inside JS Code node `jsCode` parameter as literal string content (inside `return [{{ json: {{ skip: true, ... }}}}]` JS expression). NOT a field-level n8n expression (those appear in URL/header/value parameters, not jsCode). Therefore: confirmed Python f-string leak (NOT valid n8n expression).

### Root cause (same as WF87-MA W18-L3 finding)

R3-L2 author wrote BP JS via Python f-string `f"return [{{ json: {{ skip: true, ... }}}}]"` where `{{` is Python escape for literal `{`. Generated JS string got stored with `{{` and `}}` LITERAL (forgotten unescape). The bug propagated to ALL 7 regional WFs (WF87-MA + 6 here). WF87-MA was fixed W18-L3 · 6 remaining repaired this cycle.

### Repair results

| Region | Pre-bytes | Post-bytes | node --check | active |
|---|---|---|---|---|
| NE | 780 | 768 | exit=0 ✓ | True |
| SE | 780 | 768 | exit=0 ✓ | True |
| MW | 780 | 768 | exit=0 ✓ | True |
| SC | 780 | 768 | exit=0 ✓ | True |
| MTN | 785 | 773 | exit=0 ✓ | True |
| PAC | 785 | 773 | exit=0 ✓ | True |

**6/6 repaired · 12 chars saved each (4 pairs of `{{`→`{` + 4 pairs of `}}`→`}`) · all PUT-cycled clean.**

### Silent-loss impact

All 6 regional webhook nodes had been crashing silently in BP since R3-L2 ship. Cron fires would have:
1. Source URLs → emit URLs ✓
2. Split URLs → loop ✓
3. Fetch HTML → fetch ✓
4. Rate Limit → wait ✓
5. Extract+Format → parse ✓
6. Aggregate Batch → collect ✓
7. **Build Payload → SyntaxError → workflow execution halts**
8. Webhook Callback → NEVER FIRED

**Zero V4 regional data delivered to Turso from these 6 WFs since R3-L2.** WF87-MA (single fixed in W18-L3) was the only regional getting through. ALL regional yield Sylvia saw was MA-only.

This is the same silent-loss class as the corpus envelope bug Agent 1 caught in W18-L1.

---

## §2 · Part B · V20 Template Migration

### Source

```
~/Desktop/skills/Command TEMPLATES/LegacyLoop_Command_Template_V20.md
```

### Mirror

```
docs/command-template/V20_COMMAND_TEMPLATE.md
docs/command-template/README.md (drift detection protocol)
```

### SHA verification

- Source SHA prefix: `41032a3acb62` (matches spec expected `41032a3a...` ✓)
- Repo mirror SHA prefix: `41032a3acb62` ✓ (byte-identical copy)
- 1,807 LOC migrated

### Rationale

Agent 1 W18-L1 carry-forward: external-only = single point of loss = doctrine risk. Repo mirror provides git history + reproducible CI reference + drift detection.

---

## §3 · CEO Manual Execute G2

| WF | n8n ID | Expected post-repair yield |
|---|---|---|
| NE | FnZAE5EfeGPgnolQ | Real V4 entries to Turso (FIRST time since R3-L2) |
| SE | hrK2miE2rZuZ2wUK | Real V4 entries (FIRST time since R3-L2) |
| MW | mfLE8L4p5gfOpbRg | Real V4 entries (FIRST time since R3-L2) |
| SC | m8mHgzs3gugQvpM6 | Real V4 entries (FIRST time since R3-L2) |
| MTN | PkLoCtz5Sn1zlMkz | Real V4 entries (FIRST time since R3-L2) |
| PAC | 14bmGvd4bAjlyycq | Real V4 entries (FIRST time since R3-L2) |

Per spec §5.X: "CEO-interactive: NONE · IT-autonomous". CEO may Manual Execute when convenient · cron will catch up next fire (cron staggered :40-:46).

---

## §4 · Doctrine Sustained (ZERO NEW)

- BINDING #5 cred-safe (n8n API key Keychain)
- BINDING #16 clone-to-canonical (existing WFs · jsCode repair only)
- BINDING #17 audit-first (per-WF scan with node --check pre-repair)
- BINDING #20 PB3 worktree FF-push (agent-2 isolated)
- BINDING #28 HEAD parity (rebased to bb12ef7 from behind 6 pre-fire)
- BINDING #30 §0.5 deep-dive PASS (MTN ID confirmed · template SHA matched · all 6 verified)
- BINDING #38 empirical cite (per-WF byte counts + node --check exit codes verbatim)
- BINDING #39 spec read 280 LOC end-to-end
- BINDING #50 LAW sentinel preserved (BP filter logic intact post-repair · `{` not `{{` swap-only)
- DOC-N8N-PUT-SCHEMA-STRIP-ALLOWED-ONLY (whitelist body · binaryMode + availableInMCP stripped)
- DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE × 6
- DOC-N8N-PYTHON-FSTRING-LEAK-SCAN 1/5 NEW (candidate)
- LAW #38 HARD GUARD attested (zero `lib/sylvia/*` · zero `app/*` · zero `lib/*` · zero `prisma/*`)
- CEO Rule 1 ZERO new doctrines (candidates frozen pending CEO ratify)

---

## §5 · LOCKED Diff Verify

```bash
git diff HEAD --name-only | grep -E "lib/|app/|scripts/"
# Expected: zero hits (only docs/ added)
```

---

## §6 · Banked W20+

- CMD-W20-WF63-CLONE-FULL-LEAK-AUDIT (scan ALL WF63 clones beyond regionals · catch this leak class across full fleet)
- V20 template PR-sync discipline (external ↔ repo · automated drift check)
- Regional yield re-verify post-cron (sentinel skip names should now show empirical regional yield · WAS BLOCKED at BP)
- MC notes: regional V4 yield re-verify Sylvia post-cron-fire (W19-W20 window)
