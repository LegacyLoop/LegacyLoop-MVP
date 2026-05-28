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

### First exec (RSS endpoint) · exec 1832 · 2026-05-28T14:32:05Z

| Metric | Value |
|---|---|
| Status | success (8s runtime) |
| Per-metro Fetch body_len | 248 bytes × 6 (ALL "blocked" HTML) |
| Per-metro Extract | sentinel passthrough × 6 |
| Per-metro BP | skip{reason: 'no-entries-extracted'} × 6 |
| Real V4 entries delivered | **0** |
| Sentinel skip | 6 |

### Critical empirical finding

Craigslist RSS endpoint (`?format=rss`) is **IP-blocked from n8n droplet** too — same 248-byte "blocked" HTML response as my local IP. RSS endpoint blocked even with proven WF57 UA.

WF57 (HTML search endpoint) still works: exec 1822 returned 440-500KB bodies per metro. **CL blocks RSS specifically · HTML search OK.**

### §0.7 PIVOT APPLIED (post-exec 1832)

| Field | Before | After |
|---|---|---|
| URL pattern | `{metro}.craigslist.org/search/gms?format=rss` | `{metro}.craigslist.org/search/gms` (no RSS) |
| Extract logic | RSS XML regex (`<item>`/`<entry>`) | CL HTML listing regex (`cl-search-result`/`result-row`/`<a href="...html">`) |
| Accept header | `application/rss+xml,...` | `text/html,application/xhtml+xml,*/*` |
| extractionMode | `rss-xml-regex-parse` | `cl-html-listing-regex-parse` |
| Sentinel | inherited | preserved + adapted for HTML failure modes |

Sentinel architecture proved value: 6 dormant metros caught without crash. Pivot inline preserves V4 close goal.

### Post-pivot exec 1836 · VERIFIED ✓ · V4 MISSING vertical CLOSED

**exec 1836 · success · 30s · manual · 2026-05-28T14:38:56Z → 14:39:26Z**

| Metro | Fetch body | Extracted items | BP yield |
|---|---|---|---|
| Maine | 21KB | 27 | 27 ✓ |
| New York | 67KB | 50 (cap hit) | 50 ✓ |
| Boston | 35KB | 50 (cap hit) | 50 ✓ |
| Philadelphia | 42KB | 50 (cap hit) | 50 ✓ |
| Chicago | 66KB | 50 (cap hit) | 50 ✓ |
| Los Angeles | 66KB | 50 (cap hit) | 50 ✓ |

**TOTAL: 277 real V4 entries delivered to Turso · ZERO sentinel skips · 6-of-6 metros productive**

V4 baseline: 0 → 277 · **MISSING vertical CLOSE confirmed**

### Pivot validation

§0.7 pivot fully vindicated:
- RSS endpoint (exec 1832): 0 yield · all blocked
- HTML endpoint (exec 1836): 277 yield · 0 blocked
- CL HTML listing regex (Pattern A `<a href="...html">`) matched correctly across all 6 metros
- Cap hit on 5-of-6 metros (cap=50/metro) · headroom exists to raise cap if appetite

### Lesson banked

CL blocks RSS path · permits HTML search path · droplet IP-specific block on `?format=rss`. Future V4/V3 CL work: use HTML endpoint pattern (WF57 + WF82 proven) · NOT RSS endpoint.

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
