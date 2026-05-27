# WF50 V17 StockX Free Alt · W11-T3 · 2026-05-27

> **Status:** WF73 LIVE · awaiting CEO Manual Execute · 2-source sneaker free
> **Anchor:** HEAD `e9f555b` · agent-3 worktree
> **Builds on:** WF63 clone pattern · sentinel inline · BINDING #50

---

## §1 · Source Probe (PB2 REPLACEMENT)

| Source | URL | Status | Verdict |
|---|---|---|---|
| GOAT | `/sneakers` | 403 | ❌ blocked |
| SneakerNews | — | 403 | ❌ blocked |
| eBay | `/b/Sneakers/15709` | 302 → `/n/error` | ❌ redirect-to-error |
| KicksOnFire | — | 204 | ❌ no content |
| **StadiumGoods** | `/en-us/shopping` | **301 → 200** | ✅ redirect-follow |
| **StockX** | `/sneakers` | **308 → 200** | ✅ redirect-follow |

PB2 replacement: 2-source (StadiumGoods + StockX) · IT §0.5 200-final confirmed via `curl -sIL`.

Redirect chains:
- StadiumGoods: `301` → `/collections/all` → `200`
- StockX: `308` → `/category/sneakers` → `200`

---

## §2 · WF73 Configuration

| Field | Value |
|---|---|
| n8n ID | `wDTG1FbrLlEwq8jR` |
| Name | WF73 V17 Sneaker-Free (StadiumGoods + StockX redirect-follow) |
| Clone source | WF63 (`2PFlNsFr0VWQ9SIy`) |
| Cron | `27 7 * * *` (post WF72 :26) |
| Active | true |
| Sentinel | ✅ Extract + BP (cloned from WF63 W9-1 patch) |

### Source URLs (2 sources)

| Source | URL | Tier |
|---|---|---|
| stadiumgoods-sneakers | `https://www.stadiumgoods.com/en-us/shopping` | T1 |
| stockx-sneakers | `https://stockx.com/sneakers` | T1 |

### V17 Metadata

| Field | Value |
|---|---|
| verticalId | V17 |
| domain | sneaker-pricing |
| corpusId | `wf-v17-sneaker-free-{date}` |
| source | sneaker-free-redirect-follow |

---

## §3 · Execution Status

**Awaiting CEO Manual Execute** from n8n UI (`https://n8n.legacy-loop.com`).

n8n REST API does not expose execution trigger via API key auth. CEO must click "Execute Workflow" in WF73 editor.

Expected yield: 2-of-2 items (1 per source). Sentinel catches any source that returns empty body.

---

## §4 · Banked

1. **CMD-W12-V17-GOAT-CHEAP-APIFY** — GOAT via low-cost Apify actor (post billing renewal)
2. **GOAT residential proxy** — alt approach if Apify too expensive
3. **WF73 yield verification** — post CEO Manual Execute, cite exec_id + per-source items
