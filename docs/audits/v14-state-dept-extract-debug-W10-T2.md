# V14 State Dept Extract Debug · W10-T2 Audit

> CMD-V14-STATE-DEPT-EXTRACT-DEBUG V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `69ceaf4` (origin/main at fire time)
> Date: 2026-05-27

## §0 · Context

W9-4: State.gov /press-releases/ returned 218KB HTML from n8n droplet · 0 regex yield from Extract node.
W9-3: State.gov returned 407 Proxy Auth Required from droplet IP (CloudFront ASN-discriminates).
W6-1: Local Mac curl returned 200 + 659KB.

Hypothesis matrix investigated:
- H1: Content in stripped tags (chrome-strip removes article content)
- H2: JS-rendered (n8n Fetch HTML doesn't execute JS)
- H3: WAF returns sanitized HTML to droplet

## §1 · Root Cause: HOST-SIDE OUTAGE (none of H1/H2/H3)

**State.gov has been serving a CloudFront error page site-wide since at least March 17, 2026.**

Evidence:

| Probe | Result |
|-------|--------|
| Mac curl `https://www.state.gov/` | 200 · 659,508 bytes · `<title>Technical Difficulties</title>` |
| Mac curl `/press-releases/` | 200 · 659,508 bytes · same etag |
| Mac curl `/press-releases/feed/` | 200 · 659,508 bytes · same etag (content-type: text/html, NOT RSS XML) |
| `last-modified` header | `Tue, 17 Mar 2026 01:57:29 GMT` (72+ days old) |
| `server` header | `AmazonS3` (origin is S3 error page bucket) |
| `x-cache` header | `Error from cloudfront` (CloudFront cannot reach real origin) |
| `etag` all 3 paths | `"9dd37e7649b54fb9bb8e9cafad781f59"` (identical = same static file) |
| Droplet IP | 407 Proxy Auth Required (CloudFront ASN-aware, harsher to datacenter IPs) |
| Structural HTML tags | 0 `<main>` · 0 `<article>` · 0 `<section>` · 0 `<h1-h3>` · 0 `href=` |
| JS-render markers | 0 `noscript` · 0 `react-root` · 0 `__next` · 0 `wp-content` |
| Press release content | 0 references to "press-release" or "press release" |

**Error page content**: "We're sorry, this site is currently experiencing technical difficulties. Please try again in a few moments."

## §2 · Hypothesis Classification

| Hypothesis | Status | Reasoning |
|------------|--------|-----------|
| H1 (regex wrong) | **MOOT** | Extract regex targets `<h1>`, `<title>`, `<main>`, `<article>`, `<body>` — standard patterns. Would work on real content. Error page has none of these. |
| H2 (JS-rendered) | **MOOT** | Site serves static S3 HTML. Zero JS framework markers. Not a SPA issue. |
| H3 (WAF/ASN) | **PARTIAL** | Droplet gets 407 (confirmed W9-3). Mac gets 200 + error page. Both get non-useful content. WAF is secondary blocker behind host outage. |
| **H4 (NEW)** | **CONFIRMED** | **Host-side outage. CloudFront origin unreachable. S3 error page served since 2026-03-17.** |

## §3 · WF71 Impact Assessment

WF71 Source URLs include 4 T6 gov sources:
1. `energy.gov/news` — operational
2. `epa.gov/newsreleases` — operational
3. `state.gov/press-releases/` — **DEAD (host outage)**
4. `doi.gov/news` — operational

3-of-4 sources functional. State Dept is dead weight yielding 0 items. No regex fix possible — source itself broken. WF71 sentinel filters State Dept entries as empty, so no data pollution downstream.

## §4 · Alt-Route Probe Results

| Alt-Route | Status | Notes |
|-----------|--------|-------|
| RSS `/press-releases/feed/` | DEAD | Same 659KB error page (text/html not XML) |
| GovInfo API | NOT AVAILABLE | State Dept press releases not in GovInfo collections |
| Wayback Machine | NO RECENT SNAPSHOTS | No 2026 captures of RSS feed |
| Direct social / briefing transcripts | NOT PROBED | Banked for W11 |

## §5 · Banked W11 Alt-Routes

1. **CMD-W11-STATE-DEPT-RECOVERY-MONITOR V20 LOW** — periodic curl probe for site recovery (check `<title>` != "Technical Difficulties"). When recovered, RSS `/press-releases/feed/` = first alt-route to test.
2. **CMD-W11-GOVINFO-API-UNIFIED V20 MEDIUM** — unified GovInfo API layer for federal sources that support it. State Dept NOT currently available but other agencies may be.
3. **CMD-W11-STATE-DEPT-SOCIAL-ALT V20 LOW** — probe State Dept social media / press briefing transcripts as interim content source.

## §6 · Doctrine

- **DOC-N8N-HOST-OUTAGE-CLASSIFICATION 1/5 NEW** — when scraper yields 0, check host health before debugging regex/WAF/JS-render. State.gov yielded 0 because entire site is down (200 + error page), not because of scraping logic.
- **DOC-N8N-ACTIVE-WF-DEACTIVATE-CYCLE** sustained (from W9-2)
- All 3 original hypotheses (H1/H2/H3) were MOOT — empirical investigation surfaced H4 (host outage) as true root cause. Validates BINDING #30 (§0.5 deep-dive before FIX).
