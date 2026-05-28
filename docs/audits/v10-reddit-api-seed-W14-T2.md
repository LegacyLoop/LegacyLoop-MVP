# V10 Reddit Public JSON Seed · W14-T2 Audit

> CMD-V10-REDDIT-API-SEED V20 LOW · **PB1 INLINE G1 FALLBACK** · Agent A · agent-1 worktree
> Anchor HEAD: `7f00bf5` (origin/main at fire time)
> Date: 2026-05-28

## §0 · PB1 INLINE — G1 FALLBACK (BINDING #31)

**§0.5 17-check status**: 17/17 PASS · G1 sub-gate FAIL → FALLBACK confirmed.

**Empirical evidence**:
- `.env.sylvia` probe: `REDDIT_CLIENT_ID` count=0 · `REDDIT_CLIENT_SECRET` count=0 (per BINDING #5 count-only)
- Public JSON probe: `https://www.reddit.com/r/Flipping/new.json?limit=2` → **200 OK** · listing schema confirmed (`data.children[]` with `id`+`title`)
- UA: `Legacy-Loop-Bot/1.0 by /u/legacyloopmaine` accepted (Reddit ToS compliant)

**Spec G1 FALLBACK path activated** (BINDING #31 push-back-with-replacement · 39× cumulative):
- OAuth canonical → public JSON path (no client_credentials mint)
- Public throttle: ~1 req/sec · ~30 req/min (well under 6-sub fan-out)
- Yield projection unchanged (6 subs × 100 posts = 600 posts/cron)
- OAuth banked → W15 post CEO Reddit script-app registration

## §1 · Build Summary

| Field | Value |
|-------|-------|
| WF ID | `Z0HYWR8uLjmXEai3` |
| Name | WF81 V10 Reddit Public JSON (6 resale subs · G1 FALLBACK · no OAuth) |
| Clone source | WF63 (16th LAW canonical) |
| API host | `www.reddit.com/r/{sub}/new.json?limit=100` (public · zero auth) |
| User-Agent | `Legacy-Loop-Bot/1.0 by /u/legacyloopmaine` (Reddit ToS) |
| Schema | `data.children[].data` · fields: id · title · selftext · author · score · upvote_ratio · num_comments · permalink · flair · post_hint · url_overridden_by_dest |
| Vertical | V10 · domain: social-resale-reddit |
| Corpus | wf-v10-reddit-2026-05-28 |
| Cron | `34 7 * * *` |
| Active | true |

## §2 · 6 Resale Subreddits

| Sub | Coverage |
|---|---|
| r/Flipping | General resale community |
| r/Antiques | Antique identification + valuation |
| r/whatsmyitemworth | Community item valuation |
| r/ThriftStoreHauls | Thrift-find documentation |
| r/coins | Coin grading + identification |
| r/baseballcards | Sports card market |

## §3 · Patches Applied

| Patch | Status | Detail |
|-------|--------|--------|
| Source URLs | ✓ | 6 sub URLs · public JSON path · sourceName per sub |
| Extract | ✓ NEW | **JSON.parse PRE-BAKED** (W13-T2 root cause prevent) · `data.children[]` map · sentinel passthrough |
| BP V10 metadata | ✓ | V14→V10 · documents→social-resale-reddit · 6 sources cited |
| BP sentinel filter | ✓ INHERITED | `_loopPassthrough` filter from WF63 |
| HTTP Request UA | ✓ | Reddit-ToS-compliant UA on Fetch + Webhook nodes |
| Cron stagger | ✓ | 0 7→34 7 * * * |

## §4 · W13-T2 Lesson Applied (PRE-BAKE)

Per W13-T2 LOC post-exec discovery: WF63 inherited `responseFormat: "text"` wraps response body as STRING at `inputJson.data`. Extract MUST `JSON.parse(inputJson.data)` before accessing fields.

W14-T2 Extract pre-baked the JSON.parse pattern up-front to avoid 0-yield first execution. Doctrine candidate **DOC-N8N-HTTP-RESPONSE-FORMAT-TEXT-WRAPPER** (1/5 NEW · banked).

## §5 · CEO Manual Execute

PENDING — n8n API does not support remote execution trigger. CEO execute via n8n UI.
WF81 fires automatically on cron at 7:34 AM EDT daily.

Yield projection: ~600 posts/exec (6 subs × 100 posts).

## §6 · Banked

- **CMD-W15-V10-REDDIT-OAUTH-UPGRADE V20 LOW** — re-fire post CEO Reddit script-app registration at `reddit.com/prefs/apps` · paste client_id+secret to `.env.sylvia` · upgrades from public 30req/min → OAuth 100req/min · same WF81
- CMD-W15-V10-YOUTUBE-DATA-API V20 LOW (V10 expansion)
- CMD-W15-V10-X-RESALE-TREND V20 LOW (X/Twitter)

## §7 · Doctrine Sustained (ZERO NEW)

- **BINDING #31** push-back-with-replacement (39× cumulative · G1 FALLBACK inline)
- BINDING #16 clone-to-canonical
- BINDING #17 audit-first-wire (public JSON probed pre-clone)
- BINDING #20 PB3 pull mandatory
- BINDING #28 drift catch (G1 sub-gate caught pre-FIX-2)
- BINDING #38 empirical-cite (Reddit 200 + schema verified)
- BINDING #50 sentinel sustained (Extract custom + BP filter inherited)
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V10 metadata)
- DOC-N8N-POST-MINIMAL-FIELDS
- DOC-N8N-HTTP-RESPONSE-FORMAT-TEXT-WRAPPER (PRE-BAKED · W13-T2 lesson applied)
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE
- Phase C compendium §V10 verbatim (T1 Reddit Official API)
- V10 MISSING vertical CLOSE (Phase C 4-MISSING → 3-MISSING)
- ZERO new doctrines (CEO rule)
