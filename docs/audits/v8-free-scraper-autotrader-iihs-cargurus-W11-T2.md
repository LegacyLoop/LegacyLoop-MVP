# V8 Free Scraper · AutoTrader + IIHS + CarGurus · W11-T2 Audit

> CMD-V8-FREE-SCRAPER-AUTOTRADER-IIHS-CARGURUS V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `e7175b2` (origin/main at fire time)
> Date: 2026-05-27

## §0 · Context

**PB1 INLINE**: MC briefing W11-T2 "WF45 V8 KBB free scraper" — empirical KBB ALL 403 AkamaiGHost (4 paths probed). KBB is the REASON WF45 uses Apify. Free path doesn't exist.

**Replacement roster** (Devin §0 verified):
- AutoTrader `/cars-for-sale/` → 200 ✅
- IIHS `/ratings` → 200 ✅
- CarGurus `/` → 301 → /Cars/ (200 final) ✅

## §1 · WF72 Configuration

| Field | Value |
|-------|-------|
| WF ID | `1WjJuWa25t4wPnPQ` |
| Name | WF72 V8 KBB-Free (AutoTrader + IIHS + CarGurus) |
| Clone source | WF63 (16th LAW canonical) |
| Sources | AutoTrader + IIHS + CarGurus (3-source roster) |
| Vertical | V8 (auto-research) |
| Cron | `26 7 * * *` (next free slot post WF71 :25) |
| Active | true |

## §2 · Patches Applied

| Patch | Status | Detail |
|-------|--------|--------|
| Source URLs | ✅ | 3 sources: autotrader-listings, iihs-safety-ratings, cargurus-listings · V8 metadata |
| Extract sentinel | ✅ (inherited) | `_loopPassthrough` already present in WF63 clone source |
| BP sentinel filter | ✅ | `_loopPassthrough` filter + skip-on-empty |
| BP V8 metadata | ✅ | verticalId V14→V8 · domain documents→auto-research · corpusId patched |
| Cron stagger | ✅ | 0 7→26 7 * * * |

## §3 · Post-Patch Verification

All 4 critical fields verified via GET:
- Source URLs: V8 refs ✓ · autotrader present ✓
- Extract: `_loopPassthrough` present ✓
- BP: `_loopPassthrough` filter ✓ · V8 ✓ · auto-research ✓
- Cron: `26 7 * * *` ✓

## §4 · CEO Manual Execute

**PENDING** — n8n API does not support remote execution trigger (POST /run → 405). CEO Manual Execute via n8n UI required for immediate yield verification.

WF72 will also fire automatically on cron at 7:26 AM EDT daily.

## §5 · n8n API Learnings

- POST `/api/v1/workflows/{id}/run` → 405 (not supported)
- POST `/api/v1/executions` → 405 (not supported)
- Manual execution requires n8n UI interaction
- Clone inherits sentinel from WF63 Extract node (WF63 was armed, contrary to spec's "unarmed" note)

## §6 · KBB Akamai Evidence (PB1)

```
kbb.com/cars-for-sale     403 AkamaiGHost ❌
kbb.com/car-values        403 AkamaiGHost ❌
kbb.com/honda/civic       403 AkamaiGHost ❌
kbb.com/used-cars         403 AkamaiGHost ❌
```

All 4 KBB paths Akamai-blocked. Free scraping impossible. AutoTrader + IIHS + CarGurus = viable free alternative.

## §7 · Banked

- CMD-V8-BBB-AUTO-FALLBACK V20 LOW — if 1-of-3 sources dead post-Execute
- WF45 Apify dependency — separate W12 wave (cap-saturated until 5/30)
