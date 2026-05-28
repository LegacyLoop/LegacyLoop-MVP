# V4 Regional Classifieds Source Map · W15-T4b Audit

**CMD-V4-REGIONAL-CLASSIFIEDS-SOURCE-MAP-AUDIT V20 LOW · Agent C agent-3 worktree**
**Date:** 2026-05-28 · **Wave 15 Lane T4b** (companion to V6 ToS bundle T4a)

> Audit-doc only · 50-state empirical probe · 7 regional W16 stubs banked
> CEO directive 2026-05-28 ~10:30 AM EDT · campaign-close regional track
> Flag doc: ~/Downloads/skills/Flags/V4_REGIONAL_CLASSIFIEDS_SOURCE_MAP.md

---

## §1 · Output

- Flag doc shipped: `V4_REGIONAL_CLASSIFIEDS_SOURCE_MAP.md` (~280 LOC)
- 7 W16 regional spec stubs authored
- Repo audit doc (this file)

## §2 · Key Findings (empirical reality vs MC original spec)

**MC original assumed:** 2-3 newspaper classifieds per state = ~100-150 sites
**Empirical reality:** ~20% hit rate on newspaper classifieds (60%+ deprecated/404)

**Revised total GREEN sources:** ~25-30 (not 100-150)

| Layer | Source count | Pattern |
|-------|-------------|---------|
| RSS keystone | 1 (Uncle Henry's Maine) | T2 RSS direct |
| Regional newspapers | ~20 (1-2 per region · NOT 2-3 per state) | T5 HTML |
| National geo-filter platforms | 6 (Hoobly · USFreeAds · Recycler · 5miles · Geebo · Bookoo) | T5 HTML |
| Craigslist subdomains | per-state (W14-T3 pattern · droplet-blocked · UA-rotation needed) | T2 RSS via HTML pivot |

## §3 · 7 W16 Regional Stubs

| Region | GREEN sites | Stub file |
|--------|------------|-----------|
| NE | Uncle Henry's + Union Leader | CMD_W16_V4_NE_CLASSIFIEDS_FAN_V20_LOW_STUB.md |
| MID-ATL | Baltimore Sun + Richmond + WV Gazette | CMD_W16_V4_MID_ATLANTIC_*_STUB.md |
| SE | National only (0 regional GREEN) | CMD_W16_V4_SOUTHEAST_*_STUB.md |
| MW | Chicago Trib + JSOnline + Des Moines + StL | CMD_W16_V4_MIDWEST_*_STUB.md |
| SC | Dallas + NOLA + Arkansas + Tulsa + Bismarck | CMD_W16_V4_SOUTH_CENTRAL_*_STUB.md |
| MW-W | Trib + Denver Post + Review Journal | CMD_W16_V4_MOUNTAIN_WEST_*_STUB.md |
| PAC | LA Times + Seattle Times + ADN | CMD_W16_V4_PACIFIC_*_STUB.md |

## §4 · CEO Decisions Pending W16

1. Strategy approval: revised scope (~25-30 GREEN, not 100-150 per MC original)
2. Bundle vs separate: 7 region WFs OR single bundle (recommend bundle)
3. National platform layer inclusion (recommend YES · fills newspaper deprecation gap)
4. Craigslist treatment (UA-rotation/Apify OR skip · already V4 keystone)

## §5 · Doctrine Sustained (ZERO NEW)

- BINDING #17 audit-first-wire (Phase C §V4 + 60+ HEAD probes)
- BINDING #28 drift catch (V4 expansion gap surfaced)
- BINDING #31 push-back-with-replacement (MC "2-3 per state" → reality "1-2 per region")
- BINDING #38 empirical-cite (HTTP codes verbatim)
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE
- DOC-MAX-LEGAL-ACCESS-LADDER #49 ratchet
- Phase C compendium §V4 verbatim
- T4 canonical: Agent C = agent-3 (CEO direct)
- **ZERO new doctrines (CEO Rule 1)**

---

*Agent C · W15-T4b · HEAD 0cdc523 · agent-3 worktree · 2026-05-28*
