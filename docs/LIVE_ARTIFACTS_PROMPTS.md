# LegacyLoop · Claude Live Artifacts · Paste-Ready Prompt Pack

**Anthropic dropped Live Artifacts in early May 2026** · live-updating dashboards INSIDE Claude that pull from connected MCPs (Gmail · Calendar · Stripe · etc.) and refresh in real-time. Each artifact takes ~2 minutes to set up.

This file holds 5 paste-ready prompts tuned for LegacyLoop daily ops + investor demos.

**How to use:** open `claude.ai` (the web app · NOT Claude Code) → start a new chat → paste one of the prompts below → confirm MCP connections it requests → Claude generates the live dashboard. Pin the artifact in the chat or save to your library. Refresh = re-run the prompt or click the artifact's refresh button.

**Pre-reqs:** the Claude.ai app must have the relevant MCPs connected (`Gmail` · `Google Calendar` · `Slack` · `Stripe`). Per `claude mcp list` today, all 4 are ✓ Connected on Ryan's account.

---

## §1 · Morning Command Center (daily ops · Ryan-focused)

**When to use:** every weekday morning · 7-8 AM ET. Replaces 30 minutes of app-hopping.

**Paste this:**

```
Build a Live Artifact "LegacyLoop Morning Command Center" that shows everything I need at the start of my day in one clean dashboard. Use the Apple Swiss visual language: warm off-white background (#fafafa), white cards with subtle box-shadow, system-ui fonts, generous whitespace, accent colors only for status (red urgent · orange attention · blue info · green good).

Pull live data from these MCPs:
- Google Calendar: today's meetings + free blocks (chronological)
- Gmail: urgent unread requiring response today (skip newsletters/promo)
- Slack #all-legacyloop: any messages mentioning me or my agents (Devin/Pam/MC) since yesterday EOD

Then synthesize and display:
1. 3 priorities for today (rank by deadline + business impact)
2. Calendar overview (timeline format · flag back-to-back gaps)
3. Inbox triage: urgent (suggest 1-line replies) · needs response · FYI · count of skipped
4. Slack pulse: recent agent activity · open §12 reports · any HALT/blocker flags
5. LegacyLoop ops bar: production HEAD short-hash · last Vercel deploy state · cron health · Turso schema sync flag

Keep the page clean · 5 sections max · readable in 60 seconds. Update timestamp at top.
```

**Refresh cadence:** manual on demand · or pin and re-run hourly during morning ramp.

---

## §2 · Stripe Revenue Tracker (commerce health · investor-demo ready)

**When to use:** weekly review · investor screen-shares (Dr. Clark · Austin) · before pricing meetings.

**Paste this:**

```
Build a Live Artifact "LegacyLoop Stripe Revenue Tracker" pulling live from the Stripe MCP.

Layout the Apple Swiss visual language. Accent: teal (#00BCD4) for headline numbers (LegacyLoop brand · Barlow Condensed font for all numerics).

Data to surface:
1. MRR right now (subscriptions only · annualized) + 7-day trend sparkline
2. This month's gross revenue vs last month (% delta · color-coded)
3. Active subscriptions by tier: Free · DIY Seller ($20) · Power Seller ($49) · Estate Manager ($99)
4. Outstanding invoices: count + total · sorted oldest first
5. Recent successful payments (last 7 days · max 10 rows · timestamp · amount · description)
6. Recent failed payments (last 30 days · with retry status)
7. Refunds last 30 days

Use status colors: green for collected, orange for pending, red for failed. Show currency in USD. Footer: "Last refreshed: {timestamp} · LegacyLoop Tech LLC · EIN 42-1834363".

If no Stripe live data yet (pre-launch), display a graceful empty state: "Stripe live keys pending bank account confirmation. Test-mode metrics will populate here once we go live."
```

**Refresh cadence:** weekly during investor prep · pin during demo days.

---

## §3 · Dr. Clark Meeting Prep Dashboard (investor demo · pre-call)

**When to use:** 30 min before any investor or advisor call. Surfaces context · talking points · open commitments.

**Paste this (replace `<MEETING_TITLE>` and `<ATTENDEES>` with the actual values):**

```
Build a Live Artifact "Meeting Prep · <MEETING_TITLE>" for my upcoming call with <ATTENDEES>.

Pull from Google Calendar: meeting details (start time · duration · location · agenda if attached).

Pull from Gmail: last 3 email threads with each attendee · summarize each in one line (subject + last reply gist).

Pull from Slack search: any mentions of attendees in #all-legacyloop or other channels in the last 30 days · 3 most recent.

Synthesize:
1. WHO is in the meeting (name · role · last interaction · what they care about)
2. AGENDA (from calendar invite · or inferred from email thread)
3. 3 TALKING POINTS Ryan should hit (specific to this audience · cite recent LegacyLoop wins from Slack)
4. OPEN COMMITMENTS (what Ryan promised them · what they promised Ryan · any overdue)
5. PROBABLE OBJECTIONS + 1-line counters (for investor calls especially)
6. ASK (specific thing Ryan wants from this meeting · suggest one if not obvious)

Visual language: Apple Swiss · clean cards · accent teal for headers · max 1 page on a 13" laptop.
```

**Refresh cadence:** create fresh per meeting · 5 min before call · re-paste as needed.

---

## §4 · Competitor Tracker (resale niche · scraped daily)

**When to use:** daily content/strategy review · pricing reviews · investor conversations about market positioning.

**Paste this:**

```
Build a Live Artifact "LegacyLoop Competitor Tracker" that surfaces what's happening in the resale automation space today.

Sources to pull (use available MCPs · web fetch where MCPs unavailable):
- Apify scrapes from connected Apify workflows: any new listings/features from Mercari · Facebook Marketplace · Poshmark · TheRealReal · WhatNot · eBay · LiveAuctioneers
- Web fetch: TechCrunch + The Information for "AI selling" / "resale automation" / "estate sale" / "antique pricing AI" coverage in the last 24 hours
- Slack search #all-legacyloop: any competitor mentions in recent agent reports

Surface in dashboard:
1. NEW competitor moves in last 24 hours (max 5 · with link · 1-line summary)
2. PRICING signals: any competitor changed prices · added tiers · ran promos
3. FEATURE drops: anything our 14 AI systems should react to
4. CONTENT hooks: 3 angles LegacyLoop's CMO/marketing could use today (riff on competitor moves · differentiate on Truth Gate / domain corpus / senior-friendly)
5. THREAT bar: rate today 0-10 on existential-threat scale · 1-line why

Visual language: Apple Swiss · max 1 page · accent red for threats · accent green for opportunities.
```

**Refresh cadence:** daily 8 AM · or before any board prep / pitch deck refresh.

---

## §5 · Skills + Cylinder Dashboard (Devin/MC operational view)

**When to use:** weekly engineering review · before authoring new V19 specs · post-§12 closes to confirm doctrine state.

**Paste this:**

```
Build a Live Artifact "LegacyLoop Skills + Cylinder Dashboard" showing the operational state of the multi-agent build system.

Pull from Slack #all-legacyloop (last 7 days):
- Most recent §12 V19 reports (cylinder name · HEAD · PASS/HALT/BANKED)
- Any DOC-* doctrine progressions cited
- Pending CFs (carry-forwards) by priority

Pull from connected file MCPs (Google Drive · iCloud) if available · else surface from chat history:
- BINDING ledger state (count of canonical BINDINGs · count of candidates at 5/5)

Synthesize into dashboard:
1. PRODUCTION STATE: HEAD short-hash · last deploy state · curl health
2. RECENT CYLINDERS (last 7 days · max 10 rows · cyl name · HEAD · status · doctrine ratifications)
3. PENDING CFs (priority sorted · with age in days)
4. DOCTRINE LEDGER: BINDING count · candidates at 5/5 awaiting ratification · NEW candidates this week
5. NEXT WAVE: what's banked · what's ready to fire · what's gating
6. BURN: today's cost from CodeBurn (if accessible) · weekly trend

Visual language: Apple Swiss · accent teal for green status · orange for in-flight · red for HALT/blocker. This is for Ryan's daily ops + Devin/MC engineering visibility.
```

**Refresh cadence:** Monday morning planning · post-§12 close · before authoring new directives.

---

## §6 · Setup notes + caveats

### MCPs required (per `claude mcp list`)
- `claude.ai Gmail` — Connected ✓ (used in §1, §3, §4)
- `claude.ai Google Calendar` — Connected ✓ (used in §1, §3)
- `claude.ai Slack` — Connected ✓ (used in §1, §3, §4, §5)
- `claude.ai Stripe` — needs auth (used in §2)
- `Google Drive` — Connected ✓ (used in §5 if enabled)
- `Apify` — connection needed for §4 (banked carry-forward)

### Cost discipline
Live Artifacts re-run their data fetches on each refresh. Each refresh = MCP calls + a Claude turn to synthesize. Per-artifact daily cost: ~$0.05-0.20 if refreshed 5-10x. Pin only the dashboards you USE daily.

### Investor demo prep checklist
Before any Dr. Clark / Austin / advisor call:
1. Pre-load §3 (Meeting Prep) with their name + last 3 email threads
2. Have §2 (Stripe Revenue) pinned + refreshed
3. Have §5 (Skills/Cylinder) pinned to show engineering velocity
4. The dashboards become live evidence of operational maturity · not just slideware

### Banked extensions (when we have time)
- Sylvia consensus latency dashboard (post-R24 P2 ship)
- Manus selling-pipeline state distribution (post-Phase 8 ship)
- National scrape corpus growth ticker (post-Cyl 7G ship)
- Founding-100 signup progress dashboard (when pre-launch campaign ships)

---

## §7 · Provenance

Pattern source: Anthropic Live Artifacts release · early May 2026 · YouTube reference index #15 in Ryan's morning ops backlog. Banked into LegacyLoop ops doctrine on 2026-05-08 PM as part of the WCS+AGENTS trim cylinder follow-up batch.
