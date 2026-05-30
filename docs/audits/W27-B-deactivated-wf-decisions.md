# W27-B · Deactivated WF Decision Matrix
**Date:** 2026-05-30 · **Lane:** Track A · Wave 27 · Lane B · **Agent:** A (agent-1)
**Spec:** CMD-W27-B-APIFY-AUDIT-WF-DECISIONS V20 MED · anchor `b7e822e`
**Status:** 🟢 GREEN · audit-only · zero WF cron touched

> Every deactivated paid-vendor WF gets an explicit decision: **RE-ENABLE · ARCHIVE · REPLACE · KILL**.
> No "paused indefinitely". (Doctrine candidate **DOC-WF-DECISION-FORCED-NEVER-INDEFINITELY-PAUSED 1/5**.)
> **None of these decisions auto-fire.** They route to CEO for one-line ratify.

---

## Verdict matrix

| WF | Name | Apify actor | Billing | Burn telemetry | **Decision (CEO ratify)** |
|---|---|---|---|---|---|
| **WF45** | KBB Vehicle | `legacyloop-cars-com` (fatihtahta `54fUapdcuXQvnj5Zl`) | `PAY_PER_EVENT` outputrecord (+contactrecord 2026-06-07) | 2× burn incidents (2026-05-22 + 2026-05-30 · 4 runs each · ~$13/run · maxItems=40 ignored) | **★ KILL** |
| **WF40** | ClassicCars | `legacyloop-cars-com` (same actor as WF45 · `z67pIt9E4Xaq2cXN`) | same | same burn telemetry (shared actor) | **★ KILL** |
| **WF91** | Reddit-Apify | `legacyloop-reddit` (trudax) | `PAY_PER_EVENT` outputrecord | NO burn telemetry · cheap actor (~$0.009/run per incident note) | **REPLACE** (free Reddit JSON API via WF72 pattern) |
| **WF93** | FB-Marketplace | `legacyloop-fb-marketplace` (apify) | `PAY_PER_EVENT` outputrecord | NO burn telemetry · cheap · but Rule #11 META-SAFETY-ABSOLUTE blocks all FB-Army activation pre-Phase-1 sign-off | **ARCHIVE** until FB-Army Phase-1 verify suite 6/6 PASS + CEO `activate OK · FB-ARMY` |
| **WF94** | FB-Groups | `legacyloop-fb-groups` (apify) | `PAY_PER_EVENT` outputrecord | same as WF93 | **ARCHIVE** (same FB-Army gate as WF93) |
| **WF92** | dup (`IgpUQKexy7jIs0Nd`) | (duplicate of another WF · BINDING #49 candidate) | n/a | duplicate — never canonical | **KILL** (delete dup; no re-enable path) |

---

## Per-WF rationale

### ★ WF45 · KBB Vehicle — **KILL**

- **Root cause of burn cycle.** Daily `* 7 * * *` cron firing `legacyloop-cars-com` per item in a loop. `maxItems=40` did not bind. Two confirmed burn events in 8 days (2026-05-22 + 2026-05-30 · ~$52 each).
- The actor itself works, but its per-record rate × unbounded record count makes any scheduled invocation a budget-burn class.
- KBB is not core to the resale flow (Legacy-Loop sells antiques + collectibles + estate items, not vehicles). The vehicle vertical is currently unused in product surface.
- **Action:** delete WF45 + remove the n8n workflow record. Do NOT reactivate even on manual fire — the actor itself should be retired in favor of a vetted per-result vehicle actor or the free WF72/WF76 path.
- **Doctrine:** reinforces DOC-NO-UNATTENDED-PAID-VENDOR-SCHEDULE.
- **CEO 1-line ratify:** `kill WF45 OK`.

### ★ WF40 · ClassicCars — **KILL**

- Shares the cars-com actor with WF45. Same burn vector. Same vertical (vehicles · not core).
- **Action:** delete WF40. Same as WF45.
- **CEO 1-line ratify:** `kill WF40 OK`.

### WF91 · Reddit-Apify — **REPLACE**

- Cheap actor (~$0.009/run · MEDIUM burn-risk only because it is `PAY_PER_EVENT`).
- No burn telemetry attributable to this WF.
- Reddit has a free JSON API (`https://www.reddit.com/r/{sub}/new.json?limit=100`) suitable for community discovery without paying Apify.
- **Action:** replace with a free Reddit JSON-API n8n WF mirroring the WF72 pattern (zero-paid-vendor lane). Retire WF91 cron.
- **CEO 1-line ratify:** `replace WF91 OK · free-API path`.

### WF93 · FB-Marketplace — **ARCHIVE (FB-Army-gated)**

- Cheap actor per incident telemetry, but **Rule #11 META-SAFETY-ABSOLUTE** absolutely blocks any FB-Army activation until the Phase-1 6/6 verify suite passes at provision AND CEO `activate OK · FB-ARMY` sign-off lands.
- WF93 is a scheduled Apify scraper against FB Marketplace — exactly the activation surface Rule #11 freezes.
- **Action:** archive the n8n WF (rename to `WF93_FB_MKT_ARCHIVED_pre_phase1`) and bank reactivation behind W26-A1 FB-Army wiring. Keep the WF JSON for reference; remove the schedule node before any future reactivate.
- **Doctrine:** reinforces Rule #11.
- **CEO 1-line ratify:** `archive WF93 OK · pre-Phase-1`.

### WF94 · FB-Groups — **ARCHIVE (FB-Army-gated)**

- Identical posture to WF93 (Rule #11 gate · FB-Army surface).
- **Action:** archive the same way. Reactivation pinned to FB-Army Phase-1 sign-off.
- **CEO 1-line ratify:** `archive WF94 OK · pre-Phase-1`.

### WF92 (duplicate `IgpUQKexy7jIs0Nd`) — **KILL**

- Duplicate WF · BINDING #49 candidate (silent-duplicate pattern · banked from W23-L4 audit).
- Never a canonical version of anything; only the original is reachable.
- **Action:** delete from n8n. Document the duplicate-id in BINDING #49 audit log for completeness.
- **CEO 1-line ratify:** `kill WF92 dup OK`.

---

## Aggregate posture

| Decision | Count | WFs |
|---|---:|---|
| KILL | 3 | WF45 · WF40 · WF92 dup |
| ARCHIVE | 2 | WF93 · WF94 (FB-Army-gated) |
| REPLACE | 1 | WF91 (free Reddit API) |
| RE-ENABLE | 0 | (none of the watch-6 carries a safe re-enable case) |

**Zero "indefinitely paused".** Every WF gets a verdict that CEO can ratify with a one-liner.

---

## What this lane does NOT do

- **Does not** touch any active WF cron.
- **Does not** raise the $29 Apify cap.
- **Does not** reactivate any WF.
- **Does not** delete any actor task (CEO can delete tasks in Apify dashboard if desired).
- **Does not** wire the rotation cost-sentinel (banked for W27-D / W28).

---

## Doctrine candidate

**DOC-WF-DECISION-FORCED-NEVER-INDEFINITELY-PAUSED 1/5** — every deactivated paid-vendor WF must carry an explicit verdict (RE-ENABLE / ARCHIVE / REPLACE / KILL) with a one-liner CEO ratify path. "Paused indefinitely" is not a posture; it is a deferred decision that calcifies into forgotten attack surface (which is how the cars-com burn pattern survived three monthly cycles).

**Connecting Generations · Built in Maine · World-class everywhere.**
