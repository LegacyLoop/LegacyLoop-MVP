# V4 Craigslist RSS Seed · W14-T3 Audit

**CMD-V4-CRAIGSLIST-RSS-SEED V20 LOW · Agent B agent-2 worktree (T3 canonical)**
**Date:** 2026-05-28 · **Wave 14 Lane T3**

> Class: T2 RSS keystone · V4 MISSING vertical CLOSE
> Apify: ZERO · ZERO auth · Craigslist official RSS feeds
> PB1 ABSORBED: WF57-proven `Legacy-Loop-Bot/1.0` UA (not Feedfetcher-Google)

---

## §1 · Build Summary

| Field | Value |
|---|---|
| n8n ID | `cLuij2hYYDQa5F89` |
| Name | WF82 V4 Craigslist Garage/Yard RSS (6 metros · ZERO auth · T2 keystone) · MISSING vertical close |
| Clone source | WF63 (`2PFlNsFr0VWQ9SIy`) · 16th LAW canonical · sentinel-armed |
| Cron | `35 7 * * *` (next free post WF81 :34) |
| Active | true |
| UA | `Legacy-Loop-Bot/1.0 (+contact: ryan@legacy-loop.com · RSS reader)` |
| Accept | `application/rss+xml, application/atom+xml, text/xml, */*` |
| Response format | text (XML body for regex parse) |
| Budget | $0.00 |

### 6-Metro Seed

| Metro | Slug | Endpoint |
|---|---|---|
| Maine | maine | `https://maine.craigslist.org/search/gms?format=rss` |
| New York | newyork | `https://newyork.craigslist.org/search/gms?format=rss` |
| Boston | boston | `https://boston.craigslist.org/search/gms?format=rss` |
| Philadelphia | philadelphia | `https://philadelphia.craigslist.org/search/gms?format=rss` |
| Chicago | chicago | `https://chicago.craigslist.org/search/gms?format=rss` |
| Los Angeles | losangeles | `https://losangeles.craigslist.org/search/gms?format=rss` |

Category: `gms` (garage/moving sales · primary V4 mission fit)

---

## §2 · PB1 Absorption (Critical Discovery)

### Spec PB1 INVALID
Spec claimed Mozilla UA 403 · Feedfetcher-Google 200. Empirical §0 probe from agent-2 local **proved ALL UAs return 403** (Feedfetcher-Google · Feedly · RSS Reader · Mozilla · curl · Googlebot · Safari — every UA tested).

### Root cause: IP-level block
Craigslist returned HTML `<title>blocked</title>` with `blockID=39468` — IP-level block on local IP, NOT UA filter. Same response regardless of UA.

### Resolution: n8n droplet has different IP
Verified WF57 (V3 Craigslist 5-State Antique Cluster) exec 1822 success 2026-05-28T13:00. n8n droplet IP is NOT blocked. WF57 uses `Legacy-Loop-Bot/1.0 (+contact: ryan@legacy-loop.com)` UA — proven working with Craigslist from droplet.

### Adopted: WF57-proven UA pattern
Switched WF82 from Feedfetcher-Google (spec) → `Legacy-Loop-Bot/1.0 (+contact: ryan@legacy-loop.com · RSS reader)`. BINDING #31 push-back-with-replacement: replaced unverifiable spec UA with empirically-proven WF57 droplet UA.

---

## §3 · 2-stage XML parse

- **Stage 1 (Fetch HTML)**: GET RSS endpoint with Legacy-Loop UA → returns XML body (text)
- **Stage 2 (Extract)**: Code node regex parse — matches `<item>`/`<entry>` blocks, extracts title/link/description/pubDate
- Cap: 50 items per metro
- Total ceiling: 6 × 50 = 300 items/cron

### Sentinel (BINDING #50 inherited from WF63)
Extract returns `_loopPassthrough` on:
- `no-rss-body-or-too-small` (Fetch failed or returned non-XML)
- `rss-parsed-0-items` (XML parsed but zero items extracted)

BP filters `_loopPassthrough` items pre-webhook.

---

## §4 · V4 Metadata

| Field | Value |
|---|---|
| verticalId | V4 |
| domain | garage-yard-sale-craigslist |
| corpusId | `wf-v4-craigslist-{date}` |
| source | craigslist-rss-6-metro |
| sourceTier | T2 |
| extractionMode | rss-xml-regex-parse |

Per-item metadata: `id · title · body · sourceUrl · metro · metroSlug · category · pubDate · ingestedAt`

---

## §5 · Execution Status

**Awaiting CEO Manual Execute** from n8n UI (`https://n8n.legacy-loop.com`).

n8n REST API has no `/run` endpoint (W11-T3 + W13-T3 lesson). CEO must click "Execute Workflow" in WF82 editor → cite exec_id for 17th LAW.

Expected yield: up to 300 items (6 metros × 50 cap). Sentinel catches per-metro zero-yield without crashing.

V4 baseline: 0 rows → expected post-Execute: ~150-300 V4 entries (MISSING vertical CLOSE).

---

## §6 · Doctrine Sustained (ZERO NEW per CEO rule)

- BINDING #16 clone-to-canonical (WF63 clone)
- BINDING #17 audit-first (UA probe pre-fire revealed PB1 invalid)
- BINDING #20 PB3 (agent-2 pre-fire pull)
- BINDING #28 drift catch (spec PB1 UA assumption ≠ empirical reality)
- BINDING #31 push-back-with-replacement (Feedfetcher-Google replaced with WF57-proven Legacy-Loop UA)
- BINDING #38 empirical cite (4-UA probe + WF57 exec 1822 verified)
- BINDING #39 spec read 412 LOC end-to-end
- BINDING #50 sentinel inherits + adapts for RSS XML failure modes
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V4 metadata)
- DOC-N8N-POST-MINIMAL-FIELDS (binaryMode + availableInMCP stripped)
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE
- Phase C compendium §V4 verbatim (T2 RSS keystone)
- T3 canonical · Agent B = agent-2 (CEO direct)

---

## §7 · Banked W15+

- CMD-W15-V4-OFFERUP-EXPAND (OfferUp local listings · T5 HTML sibling V4 source)
- WF82 yield verification post CEO Manual Execute (cite exec_id + per-metro items)
- 50-cap may be raised to 100 if first exec latency comfortable
- Investigate per-listing detail fetch if RSS-only signal too thin (per-detail = Apify-territory · banked)
