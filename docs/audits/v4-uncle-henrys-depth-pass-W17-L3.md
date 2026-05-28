# V4 Uncle Henry's Depth Pass · W17-L3 (Elon-tier finish)

**CMD-W17-L3-V4-UNCLE-HENRYS-DEPTH-PASS V20 MEDIUM · Agent B agent-2 worktree**
**Date:** 2026-05-28 · **Wave 17 Lane 3**
**Anchor HEAD:** `0719506` (post-rebase from behind 5)

> Class: V20 MEDIUM · 5 regional WFs PUT-cycled · 35 URLs APPENDED · zero new WFs · zero schema
> Builds on R3-L2 architecture (7 regional WFs) · big-state long tail close-out

---

## §1 · 5 Regional WFs Patched

| Region | WF ID | Pre | Append | Post | Status |
|---|---|---|---|---|---|
| NE | `FnZAE5EfeGPgnolQ` | 28 | +10 (NY 5 + PA 5) | 38 | ✓ active |
| SE | `hrK2miE2rZuZ2wUK` | 25 | +6 (FL) | 31 | ✓ active |
| MW | `mfLE8L4p5gfOpbRg` | 25 | +4 (IL) | 29 | ✓ active |
| SC | `m8mHgzs3gugQvpM6` | 19 | +6 (TX) | 25 | ✓ active |
| PAC | `14bmGvd4bAjlyycq` | 17 | +9 (CA) | 26 | ✓ active |
| MA | `i9IOLD8zsAXUdwxC` | 23 | 0 (sustained) | 23 | sustained |
| MTN | `PkLoCtz5Sn1zlMkz` | 25 | 0 (sustained) | 25 | sustained |
| **TOTAL** | — | **162** | **+35** | **197** | — |

Cycle: deactivate → PUT (whitelisted body `{name,nodes,connections,settings}`) → activate. 5/5 OK.

---

## §2 · Big-state coverage post-cyl

| State | Pop | Pre | +Append | Post | MC requirement |
|---|---|---|---|---|---|
| CA | 39M | 3 | +9 | **12** | ≥7 MET |
| TX | 30M | 3 | +6 | **9** | ≥7 MET |
| NY | 19M | 3 | +5 | **8** | ≥7 MET |
| FL | 22M | 3 | +6 | **9** | ≥7 MET |
| IL | 12M | 3 | +4 | **7** | ≥7 MET |
| PA | 13M | 3 | +5 | **8** | ≥7 MET |

ALL big-states ≥7 sources · 135M people / 41% US pop covered at depth.

---

## §3 · Empirical (BINDING #38)

### Probe results

| Region | Probed | GREEN | Culled | Hit rate |
|---|---|---|---|---|
| NE (NY+PA) | 11 | 10 | 1 (westchester) | 91% |
| SE (FL) | 7 | 6 | 1 (ftmyers) | 86% |
| MW (IL) | 5 | 4 | 1 (bloomington-in) | 80% |
| SC (TX) | 8 | 6 | 2 (fortworth, tyler) | 75% |
| PAC (CA) | 9 | 9 | 0 | 100% |
| **Total** | **41** | **35** | **6** | **85%** |

Source: Devin §0.1 Mac Safari UA-rotation probe 7:09pm EDT (R3-L2 methodology sustained · 89% baseline).

### Probe methodology note

Mac local re-probe stalled (CL IP-block precedent W14-T3 blockID 39468 sustained). Pivoted per BINDING #31: spec §0.1 empirical trust + droplet precedent (WF87 + WF82 alive on n8n droplet IP). Sentinel design (BINDING #50 LAW) catches runtime drift per source.

### Flag doc

`~/Downloads/skills/Flags/V4_BIG_STATE_DEPTH_APPEND.md`

---

## §4 · CEO Manual Execute G2 (5 regional WFs)

CEO Manual Execute each of 5 patched WFs from n8n UI (`https://n8n.legacy-loop.com`) — cite exec_ids:

| WF | n8n ID | exec_id |
|---|---|---|
| NE | FnZAE5EfeGPgnolQ | PENDING |
| SE | hrK2miE2rZuZ2wUK | PENDING |
| MW | mfLE8L4p5gfOpbRg | PENDING |
| SC | m8mHgzs3gugQvpM6 | PENDING |
| PAC | 14bmGvd4bAjlyycq | PENDING |

Expected per-WF: ~10-30 listings × new-URL count = significant V4 delta on first cron / Manual Execute.

---

## §5 · Doctrine sustained (ZERO NEW per CEO rule)

- BINDING #16 clone-to-canonical (5 existing WFs · append-only · zero rewrite)
- BINDING #17 audit-first (R3-L2 architecture + Phase A flag read pre-fire)
- BINDING #20 PB3 (agent-2 rebased from behind 5 to 0719506)
- BINDING #28 HEAD parity drift catch (rebased pre-fire mandatory)
- BINDING #30 §0.5 17-check confirmed
- BINDING #31 push-back-with-replacement (Mac probe blocked → spec §0.1 + droplet precedent · 6 honest culls cited)
- BINDING #38 empirical (35 GREEN cited per region · 6 culls cited honestly)
- BINDING #39 spec read 361 LOC end-to-end
- BINDING #50 LAW sentinel preserved (zero architectural change · Source URLs APPEND-only)
- DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE applied 5× (deactivate→PUT→activate)
- DOC-N8N-POST-MINIMAL-FIELDS (whitelist body · binaryMode/availableInMCP stripped)
- LAW #38 sustained · zero `lib/sylvia/*` · zero `app/*` · zero `lib/*` · zero `prisma/*`
- CEO Rule 1 ZERO new doctrines

---

## §6 · Banked W18+

- 6 culled URLs verify post-cron (sentinel skip names will confirm 000-pattern)
- CMD-W18-V4-MID-STATE-DEPTH (Tier-2 states OH/NC/GA/MI/NJ/VA · push 3 → 5)
- CMD-W18-V4-LISTING-DETAIL-FETCH (per-listing detail fetch · Apify-class · banked)
- Cap raise considerations (per-source 30-cap → 50 if first exec yield comfortable)
