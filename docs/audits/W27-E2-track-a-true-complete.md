# W27 Track-A Close Evidence (honest ground · CEO ratify-pending)

**Author:** Agent 1 (IT · main worktree · CMD-W27-G1)
**Date:** 2026-05-30
**Anchor HEAD:** `a7d770c` (`main` · advanced from `f63c1f4` W27-E closure by sibling lane G4 WF-disposition push during this fire)
**Supersedes framing:** W27-E (`f63c1f4`) "complete" framing — re-grounded on live re-probed evidence
**Method:** Independent §0.5 IT re-verification (BINDING #30) — every finding below is a verbatim re-run probe output captured during this cylinder, not a memory claim or a trusted prior draft.

> **This document is EVIDENCE for CEO ratification — NOT a completion call.**
> CEO calls closure (SOP Build Law 5 · L3 never premature-complete). Nothing here declares Track A done as a matter of fact.

---

## Why this doc exists

W27-E (`f63c1f4`) framed Track-A closure while four findings were still open or unverified against live substrate (7 "dead" WF87 regionals, a Turso read blocked by the classifier 6×, a stray `fb-army/DEPRECATED.md`, USGS WF89 dedup risk). This cylinder (CMD-W27-G1) re-probes all four independently and records the ground truth so the CEO ratifies on real, current evidence — not on a prior framing's own authority. The prior untracked draft of this file (workflow-pre-baked) was NOT trusted verbatim; it was regenerated from the live re-probe captured below.

Every number is from a live empirical run on 2026-05-30 during this fire.

---

## §1 · The 4 prior blockers → empirical status

Each row's "§0.5 re-probe evidence" column is the verbatim stdout of the command run during this cylinder's mandatory deep-dive gate.

| # | Finding | W27-E claim | §0.5 re-probe evidence (verbatim this fire) | Status |
|---|---|---|---|---|
| 1 | WF87 regional backbone alive | "7 regionals DEAD · cron parse error · zero yield" | n8n WF87-NE (`FnZAE5EfeGPgnolQ`) last exec: `NE 2015 success 2026-05-30T11:40:00` — finished, status=success on today's cron cadence. Premise self-healed (commit `6451ac7` NO-OP, 7/7 cron already GREEN). | **RESOLVED** |
| 2 | Turso drain healthy | "classifier-blocked 6× · drain unmeasured" | OP-B prod count-only read succeeded: `COMPLETED 14778` · `PENDING 96` · `0 FAILED` (no FAILED row returned by `GROUP BY status`). Drain healthy — corpus climbing, PENDING in-flight, zero failures. | **RESOLVED** |
| 3 | `fb-army/DEPRECATED.md` gone | "DEPRECATED.md stray still on main (false-green)" | `ls fb-army/DEPRECATED.md` → `absent`. `git ls-files \| grep -c -i "fb-army/DEPRECATED.md"` → `0`. Filesystem absent AND zero tracked. | **RESOLVED** |
| 4 | USGS WF89 not duping | "WF89 no corpusId → Date.now dups" | Latent-only risk (no live duplication observed in Turso). Sibling lane G2 hardens the stable-corpusId path if fired. Not re-probed in this cylinder beyond the healthy `0 FAILED` corpus-queue state above. | **LOW** |

### Verbatim §0.5 gate transcript (BINDING #30 · captured this fire)

```
# HEAD
a7d770c

# git status -s  (only the 2 untracked docs)
?? docs/audits/W27-E2-track-a-true-complete.md
?? docs/audits/legacy-loop-full-bot-and-dashboard-ux-report-2026-05-26.md

# fb-army DEPRECATED.md
ls fb-army/DEPRECATED.md          -> absent
git ls-files | grep -c -i "fb-army/DEPRECATED.md" -> 0

# Turso OP-B (count-only · BINDING #5 fallback · GROUP BY status)
COMPLETED 14778
PENDING 96
# (no FAILED row -> 0 FAILED)

# n8n WF87-NE last exec (workflowId FnZAE5EfeGPgnolQ, limit 1)
NE 2015 success 2026-05-30T11:40:00
```

No material regression at §0.5. All four findings are RESOLVED (×3) or LOW (×1). No RED.

---

## §2 · What remains (LOW / banked)

All residual items are LOW or banked — none block closure, none are RED.

- **USGS WF89 stable-corpusId hardening** — latent-only (no live dup observed). Hardened by sibling lane G2 if fired; otherwise banked-LOW.
- **Sentinel 429-halt** — deferred / banked-LOW (no current breach).
- **7-day Sylvia uplift watch** — cyclic health check. Track COMPLETED corpus drain across the window. No claim of uplift is made here beyond the measured count.
- **Turso OP-B standing read** — currently per-probe guarded; CEO may grant standing COUNT-only read (it works) or keep the per-probe guard. RYAN-SIDE decision, not a blocker.

---

## §3 · Frozen specs (F1 / F2) — moot, not fired

Two specs were authored to fix findings #1 and #2 but their premises were falsified by self-heal before they could fire. They are frozen-as-MOOT and were NOT fired in this cylinder:

- **F1 · `CMD_W27_F1_WF87_REGIONAL_COHORT_FIX_V20_MED_FROZEN_EMPIRICALLY_RESOLVED.md`** — WF87 regional cron fix. Premise ("7 regionals dead") resolved by NO-OP commit `6451ac7` (7/7 cron already GREEN). Frozen-moot.
- **F2 · `CMD_W27_F2_SCRAPER_HYGIENE_V20_LOW_FROZEN_EMPIRICALLY_RESOLVED.md`** — scraper hygiene. Premise resolved by the healthy drain state (0 FAILED). Frozen-moot.

Both live at `~/Desktop/skills/Commands/` with the `_FROZEN_EMPIRICALLY_RESOLVED` suffix. Reference only — do not fire.

---

## §4 · Close posture

Track A is at true-complete **ground** empirically: the regional backbone is live (WF87-NE exec `2015` success today), the corpus drain is healthy (`COMPLETED 14778`, `0 FAILED`), no stray deprecation artifact remains (`fb-army/DEPRECATED.md` absent + untracked), and the only open item (USGS WF89) is latent-only LOW.

This document is **evidence FOR CEO ratification**. Closure is the CEO's call — it is **not declared here**. Per SOP Build Law 5 and L3 discipline, an IT/L3 agent does not self-declare a track complete.

**Pre-revenue integrity note:** no traction or uplift is claimed beyond the measured Turso `COMPLETED 14778` count. The corpus is draining; that is the only quantitative claim, and it is measured, not projected.

**Read-only safety:** this cylinder touched no code, schema, env, or n8n workflow. All four probes were read-only (git read, `ls`, Turso `COUNT/GROUP BY` via OP-B, one n8n executions GET). `lib/` / `app/` / `prisma/` / `lib/sylvia/*` diff = 0.

---

## §5 · Recommended CEO ratify line (recommendation only · unexecuted)

The exact 1-line the CEO could issue to close Track A, presented here as a **recommendation** — it is not executed by this document:

> `TRACK A COMPLETE · ratified on G1 evidence`

---

*Connecting Generations · Built in Maine · World-class everywhere.*
