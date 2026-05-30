# W27-D · World-A / World-B Firewall — Empirical Proof

**CMD:** CMD-W27-D-DRAIN-AUDIT-SENTINEL-FIREWALL · V20 MED · Track A
**Date:** 2026-05-30 · **Agent:** C (agent-3) · **Anchor:** `b7e822e` · **Budget:** $0
**Purpose:** Independent confirmation of the Lane-A sever — investor + Track-A closure artifact.

---

## Result: ✅ FIREWALL PROVEN — zero World-A ↔ World-B coupling

**World-A** = the live Next.js app (`app/`, `lib/`) — official Meta channel, customer-facing.
**World-B** = the standalone `fb-army/` droplet scraper module (own package, NOT in the Next build).

---

## Evidence A — cross-import scan (the core test)

```
grep -rnE "from '…/fb-army/(src|index)' | require('…/fb-army/(src|index)')" app/ lib/
→ 0 matches
```

**No World-A file imports the standalone `fb-army/` droplet module.** The droplet
code never enters the production bundle.

## Evidence B — every `fb-army` reference in app/lib (16 total · all controlled)

All 16 string references live in exactly **3 controlled boundary locations** — none
is World-A business logic reaching into World-B:

| Location | Role | World |
|---|---|---|
| `lib/fb-army-safety/*` (isolation, pace-floor, burner-identity, kill-switch) | Safety substrate (W24-L1) — guards, not callers | boundary |
| `lib/scrapers/proxy/adapters/fb-army.ts` | **Dormant** proxy ingest adapter (gated on `FB_ARMY_INGEST_SECRET`) | boundary |
| `lib/scrapers/proxy/{registry,types}.ts` | Registers the dormant adapter by name | boundary |

The remaining mentions are comments referencing `fb-army/src/*` (documentation), not imports.

## Evidence C — `FB_ARMY_*` env reads (2 sites · both gated)

```
lib/fb-army-safety/kill-switch.ts:13   FB_ARMY_KILL_FLAG_PATH   (kill-switch path)
lib/scrapers/proxy/adapters/fb-army.ts FB_ARMY_INGEST_SECRET    (dormant gate — throws if unset)
```

The proxy adapter is **dormant by default**: with `FB_ARMY_INGEST_SECRET` unset it
throws `"fb-army: ... not set (dormant)"`. No live World-B activation in World-A.

## Evidence D — CI guard active (`.github/workflows/fb-army-safety.yml`)

Two enforcing jobs:
1. **`world-a-grep-guard`** → `bash scripts/fb-army-safety-guard.sh` (fails build on any World-A reference inside `fb-army/`).
2. **`verify-suite`** → `node --test lib/fb-army-safety/verify-suite.mjs` (6-check Meta-safety suite).

## Evidence E — doctrine pin

`CLAUDE.md` NON-NEGOTIABLE RULE **#11 DOC-META-SAFETY-ABSOLUTE** (candidate 1/5):
all FB-Army activation BLOCKED until live-mode 6/6 verify PASS + CEO
`activate OK · FB-ARMY` sign-off.

---

## Verdict

- World-A → World-B droplet imports: **0** ✅
- `fb-army` refs: 16, **all in safety/proxy boundary** (zero business-logic coupling) ✅
- World-B activation in World-A: **dormant / gated** ✅
- CI grep guard + 6-check verify suite: **active** ✅
- Rule #11 doctrine: **pinned** ✅

**Rule #11 firewall holds. The Lane-A sever is real and independently confirmed.**

**Connecting Generations · Built in Maine · World-class everywhere.**
