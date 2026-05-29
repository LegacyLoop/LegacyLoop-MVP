# W21-L4 · Doctrine Ship (campaign-close substrate)

**CMD-W21-L4-DOCTRINE-SHIP V20 LOW · Agent C agent-3 worktree**
**Date:** 2026-05-29 PM EDT · **HEAD `2292c5a` parity**
**Status:** 🟡 **GREEN-with-NOTE · STOP-BEFORE-COMMIT** (CEO diff review gate)

> Campaign-close doctrine substrate · 2 ratifies in single ship:
> · PERMANENT LAW #14 envelope-contract (promoted from candidate Group D)
> · BINDING #49 sandbox-restrictions (3 W20 R4 lessons merged)
> + V20 template v2.4 → v2.6 patch-note

---

## §1 · §0.5 IT Deep-Dive (BINDING #30)

| Check | Result |
|-------|--------|
| `docs/DOCTRINE_LEDGER.md` re-read (595 LOC · header tally + tail entries) | ✓ |
| Current tally: 18 PERMANENT LAW · 43 BINDING (per header W18-L1 update) | ✓ |
| Envelope-contract candidate Group D 3/5 convergent · LAW-grade ratify-recommended | ✓ |
| 3 W20 n8n-sandbox candidates surfaced empirically (W20 R4 lanes) | ✓ |
| V20 template path `docs/command-template/V20_COMMAND_TEMPLATE.md` (v2.5 patch latest) | ✓ |
| CEO ratify 1-line received via fire-trigger (W21-L4 cyl gated on ratify) | ✓ |
| LAW #38 docs-only attestation · zero code/n8n/Turso touch | ✓ |
| W20-R4-L4 dirty state stashed pre-rebase (preserved · separate commit gate) | ✓ |

**Verdict:** §0.5 PASS · CEO fire-trigger interpreted as ratify per §5.X CEO Gates

---

## §2 · Doctrine Appends (staged · pre-commit)

### PERMANENT LAW #14 · DOC-SYLVIA-CORPUS-ENVELOPE-CONTRACT

**Promotion path:** Candidate Group D (W19-L1 codified) → LAW W21-L4 ratify

**4 empirical faces (convergent independent catch):**

1. Agent A · W18-L2 · WF89 BP — DOC-N8N-SYLVIA-PAYLOAD-SHAPE-CONTRACT
2. Agent C · W18-L4 · WF93 BP — DOC-N8N-AGGREGATE-WRAPPER-UNPACK-BP
3. Devin · W19-L1 · L1 transform — writer-side fix + re-wrap migration (+2,185 rows recovered)
4. 6 regional BPs · W19-L3 — V4 regional cluster envelope convergence

**LAW:** Every Sylvia corpus producer MUST emit `{source, corpusId, domain, entries: [{id, title, body, metadata}]}` per `lib/sylvia/graphify/types.ts` ExternalCorpusEntry. Drain/consumer STRICT (LAW #38 preserved · Path B drain-loosen REJECTED).

**Empirical proof at ratify:** 2,185 W17-L1 silent-loss rows recovered · FAILED-sig→0 · 4 independent agent catches in 3 days.

### BINDING #49 · DOC-N8N-SANDBOX-RESTRICTIONS (merged family)

**Merge of 3 W20 R4 lessons** into single n8n-sandbox family doctrine:

| Sub-doctrine | W20 lesson | Pattern |
|--------------|------------|---------|
| (a) DOC-N8N-ENV-ACCESS-BLOCK-CREDENTIAL-PATTERN | HTTP Request `$env` blocked | Use httpHeaderAuth credential layer |
| (b) DOC-N8N-CODE-NODE-NO-PROCESS-ENV | Code sandbox `process.*` blocked | Pre-resolve at Source URLs · pass via Split URLs metadata |
| (c) DOC-CLASSIFIER-COLLISION-PREVENTION | Auto-mode classifier blocks `lib/scrapers/proxy/` edit | Cite precedent commit (Agent B 584b627 apify) |

**Empirical anchors:** WF92 exec 1943 (process.env root cause) · W20-R4-L4 initial HALT + Agent B precedent unblock · W20 R4 proxy fan WFs ($env credential pattern)

---

## §3 · V20 Template v2.4 → v2.6 Patch-Note

- Title line: `CANONICAL HYBRID v2.4` → `v2.6`
- v2.6 patch block added after v2.5 (W18-L1 W17 candidates)
- Spec authors guidance: §0.5 IT deep-dive MUST include corpus-envelope contract check (NEW PART I-N8N I.8) + sandbox-restrictions check (NEW PART I-N8N I.9)
- Tally line: 18→19 PERMANENT LAW · 43→44 BINDING
- Anchor cyl: CMD-W21-L4-DOCTRINE-SHIP V20 LOW

---

## §4 · Diff Scope (uncommitted · STOP-BEFORE-COMMIT)

```
docs/DOCTRINE_LEDGER.md          (header tally + Updated stream + canonical append)
docs/command-template/V20_COMMAND_TEMPLATE.md  (title bump + v2.6 patch-note)
docs/audits/W21-L4-doctrine-ship.md            (NEW · this file)
```

**LOCKED diff verify:** `git diff HEAD --name-only | grep -E "lib/|app/|scripts/"` → **ZERO hits** (docs only)

**Pre-existing dirty state (stashed):** W20-R4-L4 changes preserved via `git stash` · separate commit gate · CEO previously authorized W20-R4-L4 ship-pending

---

## §5 · Doctrine Sustained (ZERO NEW beyond ratified set)

- BINDING #17 audit-first-wire (ledger + template re-read pre-edit)
- BINDING #28 drift catch (header tally update reflects body state)
- BINDING #30 §0.5 17-check (8 substantive checks completed)
- BINDING #31 push-back-with-replacement (LAW #52) — no PB invoked this cyl
- BINDING #38 empirical-cite (4-faces verbatim) · BINDING #39 spec on disk
- LAW #38 HARD GUARD attested (docs-only · zero code/infra)
- CEO Rule 1 honored (CEO ratify gates · fire-trigger = ratify per §5.X Gates)
- CEO Rule 4 audit-doc autonomous-complete BUT STOP-BEFORE-COMMIT per directive

---

## §6 · Production Safety

| Guard | Status |
|-------|--------|
| `lib/sylvia/*` | UNTOUCHED |
| `lib/*` | UNTOUCHED |
| `app/*` | UNTOUCHED |
| `prisma/*` | UNTOUCHED |
| `scripts/*` | UNTOUCHED |
| Vercel deploy | NOT triggered (docs-only · no app code change) |
| n8n | UNTOUCHED |
| Turso | ZERO writes |
| Single-step rollback | `git revert` on commit hash (post-CEO commit greenlight) |

---

## §7 · CEO Commit Gate Pending

**Per directive `STOP-BEFORE-COMMIT`:** diff staged in working tree (3 files) · awaiting CEO commit greenlight.

On greenlight:
1. Stage 3 files: `git add docs/DOCTRINE_LEDGER.md docs/command-template/V20_COMMAND_TEMPLATE.md docs/audits/W21-L4-doctrine-ship.md`
2. Commit: `CMD-W21-L4 DOCTRINE SHIP · PERMANENT LAW #14 envelope-contract + BINDING #49 sandbox-restrictions · V20 template v2.6 · campaign-close doctrine substrate`
3. `agent-ship.sh 3` FF-push
4. Pop W20-R4-L4 stash separately (CEO ratify already granted earlier)

---

## §8 · FLAGS · V15 6-BULLET

- **Gaps:** CLAUDE.md L127 sync 43 → 44 deferred (separate cyl banked)
- **Risks:** Header tally vs body LAW # divergence (LAW #51/#52 in header vs PERMANENT LAW #11-13 in body) — staleness inherited · NOT introduced
- **Missed:** PART I-N8N I.8/I.9 template body sections not added (only patch-note · banked W22 template body extension)
- **Carry-fwd:** Post-CEO commit + pop W20-R4-L4 stash + ship W20-R4-L4 separately
- **Suggestions:** CLAUDE.md L127 sync · template body PART I-N8N I.8/I.9 fill
- **Opportunity:** Campaign-close doctrine substrate clean · 4 hard-won lessons codified · investor narrative locked

---

## §9 · FLAG ROUTING · V20 8-CATEGORY

- **STANDALONE:** CMD-CLAUDE-MD-SYNC-44 (banked · sync L127 43 → 44)
- **DOCTRINE:** PERMANENT LAW #14 envelope-contract + BINDING #49 sandbox-restrictions (this cyl)
- **MC-TASK:** Campaign-close doctrine substrate clean · scorecard update
- **CYCLIC:** N/A
- **RYAN-SIDE:** Commit greenlight (this cyl) · W20-R4-L4 commit greenlight (separate · pending earlier)
- **POST-EPIC:** Template body PART I-N8N I.8/I.9 fill (W22 banked)
- **BANKED:** CLAUDE.md L127 sync · template body extension
- **OPERATIONAL:** Ledger 18→19 PERMANENT LAW · 43→44 BINDING · template v2.4→v2.6 · W20 dirty stashed

---

*Agent C · W21-L4 · agent-3 worktree · 2026-05-29 PM EDT · HEAD 2292c5a → STOP-BEFORE-COMMIT*
