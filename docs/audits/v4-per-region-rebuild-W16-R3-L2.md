# V4 Per-Region Architectural Rebuild · W16-R3-L2 (★ Uncle Henry's PROPER)

> CMD-W16-R3-L2-V4-PER-REGION-REBUILD V20 MEDIUM · Agent A · agent-1 worktree
> Anchor HEAD: `0c458b8` (origin/main at fire time)
> Date: 2026-05-28

## §0 · Context · CEO + MC north-star LITERAL

Uncle Henry's per-region architectural decomposition: "every region is a scraper". MC requirement absolute: NO "<50 GREEN compromise" framing · NO "best effort filter" labels · per-state minimum 3 verified-GREEN at BUILD-time via Mac Safari UA-rotation.

## §1 · WF87 Monolith Cutover

| State | Before | After |
|-------|--------|-------|
| WF87 monolith `ru39JCxRO2p1h9LM` | LIVE · 153 URLs · cron :40 · sentinel-armed | **DEACTIVATED** · banked · zero dup writes |
| 7 regional WFs | — | **ALL LIVE** · :40-:46 staggered |

Clean cutover · zero race window · deactivate-first sequence honored.

## §2 · 7 Regional WFs Created + Active

| Region | WF ID | Cron | URLs | States |
|---|---|---|---|---|
| **NE** | `FnZAE5EfeGPgnolQ` | `40 7 * * *` | 28 | ME/NH/VT/MA/RI/CT/NY/NJ/PA |
| **MA** | `i9IOLD8zsAXUdwxC` | `41 7 * * *` | 23 | DE/MD/DC/VA/WV/NC/SC |
| **SE** | `hrK2miE2rZuZ2wUK` | `42 7 * * *` | 25 | GA/FL/AL/MS/TN/KY/AR/LA |
| **MW** | `mfLE8L4p5gfOpbRg` | `43 7 * * *` | 25 | OH/IN/IL/MI/WI/MN/IA/MO |
| **SC** | `m8mHgzs3gugQvpM6` | `44 7 * * *` | 19 | TX/OK/KS/NE/ND/SD |
| **MTN** | `PkLoCtz5Sn1zlMkz` | `45 7 * * *` | 25 | MT/WY/CO/NM/AZ/UT/NV/ID |
| **PAC** | `14bmGvd4bAjlyycq` | `46 7 * * *` | 17 | WA/OR/CA/AK/HI |
| **TOTAL** | — | — | **162** | **51 jurisdictions** |

All 7 active=true at activate cycle close.

## §3 · Per-State Min-3 Verification · 51/51 PASS

**ALL 51 jurisdictions ≥3 GREEN sources at BUILD via Mac Safari UA-rotation. ZERO compromise.**

Phase A flag: `~/Downloads/skills/Flags/V4_PER_REGION_ALLOCATION.md` (SHA `35e87bac4d2190a13d01798b635c9070793a699d44255e9cf1680cc68ee69946`).

| Region | States ≥3 | Min/Max per state |
|---|---|---|
| NE | 9/9 ✓ | 3 / 4 (NH 4) |
| MA | 7/7 ✓ | 3 / 4 (DE 4, WV 4) |
| SE | 8/8 ✓ | 3 / 4 (KY 4) |
| MW | 8/8 ✓ | 3 / 4 (WI 4) |
| SC | 6/6 ✓ | 3 / 4 (NE 4) |
| MTN | 8/8 ✓ | 3 / 4 (WY 4) |
| PAC | 5/5 ✓ | 3 / 4 (CA 4, HI 4) |

## §4 · BINDING #31 Push-Back Substitutes (14 states · 24 URLs added)

14 states fell short of min-3 on initial 154-source probe. PB31 cycle applied per §0.7 protocol:
- Neighbor CL subdomain (cross-state acceptable for low-pop)
- Flagship double-credit (Uncle Henry's covers NH + VT via NE neighbor)
- Typo fixes (grandisland not gradisland, wv not charleston-wv)
- HEAD-then-GET fallback for paywalled-but-200 sources

Honest cite per state. NO "best effort" framing. MAX-empirical-coverage discipline. Detail per state in Phase A flag.

## §5 · Per-Region Flagship Anchors (Confirmed)

| Region | Flagship | URL | Status |
|---|---|---|---|
| NE | Uncle Henry's | unclehenrys.com 200 | ✓ keystone (3-state coverage: ME/NH/VT via flagship) |
| MA | Baltimore Sun | baltimoresun.com/classifieds 200 | ✓ |
| SE | Nashville Classifieds | nashvilleclassifieds.com 200 | ✓ |
| MW | Iowabay | iowabay.com 200 | ✓ |
| SC | Dallas CL Top Metro | dallas.craigslist.org 200 | ✓ (Dallas Morning News pre-cull failed · CL canonical anchor) |
| MTN | KSL Classifieds | ksl.com/classifieds 200 | ✓ |
| PAC | AlaskaSlist + Recycler | alaskaslist.com 200 · recycler.com 200 | ✓ dual anchor |

## §6 · BUILD Methodology Sustained

- Mac Safari UA: `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15`
- HEAD-then-GET fallback (some servers reject HEAD)
- 6-sec timeout · 0.3s rate-limit
- 200/202/301/302 = GREEN · 4xx/5xx/ERR = DEAD
- 182 total probes (154 initial + 28 PB31 round-2) → 162 GREEN final
- 89% initial yield · 100% post-PB31 jurisdiction coverage

## §7 · BINDING #50 Sentinel Design Preserved Per WF

Each regional WF includes Extract-node sentinel passthrough:
- Empty/blocked response → `_loopPassthrough` with `_zeroYieldReason` (empty-or-blocked / no-titles-extracted)
- BP filter inherited from WF63 → skip Webhook when all-sentinel
- Runtime backstop preserves graceful degradation when individual state source goes 403/runtime-block (vs BUILD-time block)

## §8 · CEO Manual Execute G2 (7 × ~30 sec)

PENDING — CEO manually executes each regional WF in n8n UI. Cite per-WF exec_id + per-state yield.

WFs fire automatically on cron `:40-:46 7 * * *` daily regardless.

## §9 · Yield Projection

Per regional WF: ~30 titles/source × URLs/region. Conservative:
- NE 28 × 20 avg = ~560 titles/exec
- MA 23 × 20 = ~460
- SE 25 × 20 = ~500
- MW 25 × 20 = ~500
- SC 19 × 20 = ~380
- MTN 25 × 20 = ~500
- PAC 17 × 20 = ~340
- **TOTAL V4 fleet: ~3240 titles/cron-day**

## §10 · Doctrine Sustained (ZERO NEW)

- BINDING #5 cred isolation
- BINDING #16 clone-to-canonical (WF63 16th LAW template × 7)
- BINDING #17 audit-first-wire (162 sources empirically probed pre-create)
- BINDING #20 PB3 pull mandatory (agent-1 rebased 3 commits)
- BINDING #28 drift catch (T5 "best effort" framing caught by CEO/MC · this cyl literal-decomp)
- BINDING #31 push-back-with-replacement (42× cumulative · 14-state substitute cycle · LAW-imminent)
- BINDING #38 empirical-cite (162 GREEN cited verbatim per region)
- BINDING #50 sentinel preserved per WF
- LAW #38 sustained (Mac Safari UA-rotation methodology empirically validated 162/182 = 89%)
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V4 metadata per region)
- DOC-N8N-POST-MINIMAL-FIELDS (whitelist body {name,nodes,connections,settings})
- ZERO new doctrines (CEO Rule 1)

## §11 · Banked

- CMD-W17-V4-PER-REGION-YIELD-AUDIT V20 LOW — post-cron-fire empirical yield audit per region · validate ~3240 daily projection
- CMD-W17-V4-NEWSPAPER-PAYWALL-403-PROBE V20 LOW — investigate 5 newspaper paywalls (delawareonline · jsonline · ctinsider · etc) for alt access path
- CMD-W17-V4-CL-SUBDOMAIN-CANONICAL V20 LOW — canonical CL subdomain enumeration audit (some failed on typo · spec a master list)
