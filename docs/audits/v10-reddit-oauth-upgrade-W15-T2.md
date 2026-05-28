# V10 Reddit OAuth Upgrade · W15-T2 Audit · PATH B YouTube Pivot

> CMD-V10-REDDIT-OAUTH-UPGRADE V20 LOW · **PATH B (YouTube Data API · ZERO ASN risk)** · Agent A · agent-1 worktree
> Anchor HEAD: `a6ada2b` (origin/main at fire time)
> Date: 2026-05-28

## §0 · Path Selected · PATH B YouTube (BINDING #31)

**§0.5 17-check status**: 17/17 PASS after CEO YouTube API key registration + key typo fix.

**Pre-flight history**:
- §0.5 first probe: `YOUTUBE_API_KEY` absent → push-back A/B/C/D · CEO selected B
- CEO registered API key at console.cloud.google.com/apis/credentials (project `legacyloop-n8n` · YouTube Data API v3 enabled · no restrictions)
- §0.5 second probe: key 39 chars `AIzaSy...9zGE` but 400 `API_KEY_INVALID`
- Diagnostic cascade ruled out: project drift · API not enabled · restrictions · billing
- CEO root-cause: single-char transcription typo (capital-I vs lowercase-l · Google Sans renders identical)
- §0.5 third probe (corrected key): **200 OK** · key works
- 4 Phase C §V10 channel ID lookups: all 4 resolved via search API

**PATH B selection rationale**:
- Reddit ASN-block: 3 W14-T2 attempts confirm datacenter discrimination on www/old subdomains
- OAuth bypass UNTESTED: risk OAuth flow STILL blocked at edge
- YouTube Data API v3: Google CDN treats all IPs uniformly · zero ASN risk
- Phase C §V10 4 resale channels canonical · Reddit WF81 banked W16+

## §1 · Build Summary

| Field | Value |
|-------|-------|
| WF ID | `mFJLpn2Fwp6BviRc` |
| Name | WF85 V10 YouTube Resale Channels (4 channels · Phase C §V10 alt · ZERO ASN risk) |
| Clone source | WF63 (16th LAW canonical) |
| API host | `www.googleapis.com/youtube/v3/search` |
| Auth | n8n queryAuth credential `YouTube-Data-API-Key` (id `UQl3q5f8dP0rEQxM`) auto-injects `key={KEY}` query param |
| Vertical | V10 · domain: social-resale-youtube |
| Corpus | wf-v10-youtube-2026-05-28 |
| Cron | `38 7 * * *` |
| Active | true |

## §2 · 4 Phase C §V10 Resale Channels

| Channel | YouTube channelId | Top Match Confirmation |
|---|---|---|
| Resale Rabbit | `UCzdy2fCmQ_d9TC5u_Ba1-8A` | "Resale Rabbit" (exact) |
| Hairy Tornado | `UCMwfatunsnAfRqaQBDD1uUw` | "Hairy Tornado" — Full-time husband & wife reselling content creators |
| Lindey Glenn | `UCkU_KcVKHrxgE4uhbIWaQtg` | "Lindey Glenn" — internet personality channel |
| Ralli Roots | `UCRvyCd-JyXV_W6zwPpMgWTg` | "RALLI ROOTS" — Full-Time online resellers · $200 into Millions |

## §3 · Patches Applied (clone WF63 → WF85)

| Patch | Status | Detail |
|-------|--------|--------|
| Source URLs | ✓ | 4 channel URLs `/youtube/v3/search?part=snippet&channelId={ID}&order=date&maxResults=50&type=video` |
| HTTP Fetch auth | ✓ | `genericCredentialType` + `httpQueryAuth` cred bound (`YouTube-Data-API-Key`) · Accept `application/json` |
| Extract | ✓ NEW | **JSON.parse PRE-BAKED** (W13-T2 lesson) · YouTube `items[]` map · sentinel passthrough · youtube-api-error detect |
| BP V10 metadata | ✓ | V14→V10 · documents→social-resale-youtube · corpusId patched · 4 sources cited |
| BP sentinel filter | ✓ INHERITED | `_loopPassthrough` from WF63 |
| Cron stagger | ✓ | 0 7→38 7 * * * |

## §4 · n8n Credential (BINDING #9 compliant)

Created `YouTube-Data-API-Key` (type `httpQueryAuth` · id `UQl3q5f8dP0rEQxM`) via n8n API · key value NEVER pasted to file/log/transcript. Credential auto-injects `key={VALUE}` query param on every Fetch.

## §5 · CEO Manual Execute exec=1844 (2026-05-28 16:05 UTC) · 🟢 GREEN · 200 videos

**STATUS: 🟢 GREEN · first-execution success · zero sentinels · zero retry cycles**

| Channel | Videos | Latest Title |
|---------|--------|--------------|
| Resale Rabbit | 50 | "We Auctioned Off An Entire Commercial Daycare Center" |
| Hairy Tornado | 50 | "Goodwill Flip: New Balance Shoes & Giant Turtle!" |
| Lindey Glenn | 50 | "People Forget the Drive-Thru Mic Is ON… WAY Too Often" |
| RALLI ROOTS | 50 | "Did Social Media RUIN Thrifting?" |

- Runtime: 11.8 sec
- Webhook callbacks: 4 (1 per channel)
- Real videos: **200** (exact projection match · 4 × 50)
- Sentinels: 0
- Status: success · finished=true

**W13-T2 + W14-T2 lessons paid off:** JSON.parse pre-baked + Accept: application/json pre-baked + queryAuth credential pre-bound = zero post-exec patch cycles required. Substrate engineering done right first time.

**V10 MISSING vertical CLOSED** · "Social Resale Culture" anchor LIVE.
Phase C 4-MISSING → 3-MISSING (V10 closed via YouTube alt path).

YouTube Data API v3 quota: 100 units per `search.list` call · 4 calls = 400 units/exec · daily budget 10,000 units → ~25 execs/day capacity (1 cron = sustainable).

## §6 · Reddit (WF81) Banked

WF81 last state: deactivated · `old.reddit.com` swap · sentinel chain · 0 yield from 3 W14-T2 attempts. State preserved for W16+ revisit when:
- Reddit ASN policy changes
- OAuth via `oauth.reddit.com` tested (CEO 5-min script app reg)
- Residential proxy budget approval ($50/mo last resort)

## §7 · Doctrine Sustained (ZERO NEW)

- **BINDING #31** push-back-with-replacement (40× cumulative · A/B/C/D push-back + PATH B selection)
- BINDING #16 clone-to-canonical (WF63)
- BINDING #17 audit-first-wire (YouTube probed pre-clone · key validated · channel IDs verified)
- BINDING #20 PB3 pull mandatory
- BINDING #28 drift catch (G1 sub-gate caught pre-FIX-2 · TWICE · including typo diag)
- BINDING #38 empirical-cite (200 OK + 4 channel IDs cited)
- BINDING #50 sentinel sustained (Extract custom + BP filter inherited)
- BINDING #5/#9 cred isolation (n8n queryAuth credential vs jsCode embed)
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V10 metadata)
- DOC-N8N-HTTP-RESPONSE-FORMAT-TEXT-WRAPPER (PRE-BAKED · W13-T2 lesson · also Accept:json patch W14-T2)
- DOC-N8N-QUERY-AUTH-CRED-BIND-PATTERN (n8n httpQueryAuth for URL-key APIs · pattern reusable)
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE
- Phase C compendium §V10 verbatim (T1 YouTube Data API)
- V10 MISSING vertical CLOSE attempt 2 (W14-T2 Reddit failed · W15-T2 YouTube succeeds at substrate level pre-exec)
- ZERO new doctrines (CEO rule)

## §8 · Banked

- CMD-W16-V10-REDDIT-OAUTH-RE-ATTEMPT V20 LOW (OAuth bypass test · post CEO Reddit script-app reg)
- CMD-W16-V10-X-TWITTER-RESALE V20 LOW (X/Twitter alt social-resale source)
- CMD-W16-V10-YOUTUBE-EXPAND V20 LOW (add Phase C §V10 supplementary channels · adapt search → channels.list approach for richer metadata)
