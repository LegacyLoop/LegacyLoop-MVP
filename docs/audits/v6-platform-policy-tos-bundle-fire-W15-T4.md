# V6 Platform Policy ToS Bundle Fire · W15-T4a Audit

**CMD-V6-PLATFORM-POLICY-TOS-BUNDLE-FIRE V20 LOW · Agent C agent-3 worktree**
**Date:** 2026-05-28 · **Wave 15 Lane T4a**

> WF84 LIVE · 8-platform bundle (5 T5 + 3 T6 Wayback) · cron :37 7 * * *
> Cloned from WF63 (16th LAW canonical) · sentinel inherited · V6 metadata patched

---

## §0 · Anchor

- HEAD: `a6ada2b` (agent-3 parity)
- WF84 id: `rqYal2WkxkcGFFC8`
- Clone source: WF63 `2PFlNsFr0VWQ9SIy`

## §1 · 8-Platform Bundle

| # | Slug | URL | Tier |
|---|------|-----|------|
| 1 | ebay | www.ebay.com/help/policies/default/seller-policies | T5 |
| 2 | etsy | www.etsy.com/legal/sellers | T5 |
| 3 | poshmark | poshmark.com/community_guidelines | T5 |
| 4 | offerup | offerup.com/terms | T5 |
| 5 | therealreal | www.therealreal.com/terms | T5 |
| 6 | mercari | web.archive.org/web/2025/.../mercari/help_center/ | T6 Wayback |
| 7 | whatnot | web.archive.org/web/2025/.../whatnot/legal/terms | T6 Wayback |
| 8 | depop | web.archive.org/web/2025/.../depop/policies/community-guidelines | T6 Wayback |

## §2 · WF84 Build

- Clone WF63 minimal POST (name/nodes/connections/settings)
- Patch Source URLs → 8-platform array
- Patch Build Payload → V6 metadata (verticalId=V6, domain=platform-policy-tos, corpusId=wf-v6-tos-bundle-{date})
- Patch Cron → `37 7 * * *`
- Sentinel: Extract=True · BP=True (inherited from WF63)
- Active=True

## §3 · CEO G2 Pending

CEO Manual Execute WF84 from n8n UI · cite exec_id (17th LAW). Expected: 8 Split iters · 8 Extract · 5-8 BP ingest (Wayback may sentinel if snapshot missing).

## §4 · Doctrine

- BINDING #16 clone-to-canonical (WF63 16th LAW)
- BINDING #17 audit-first-wire
- BINDING #28 drift catch (V6=0→8 baseline shift)
- BINDING #38 empirical-cite (W14-T4 audit anchor)
- BINDING #50 sentinel preserved
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH
- Phase C compendium §V6 verbatim
- ZERO new doctrines (CEO Rule 1)

## FLAGS

- Wayback snapshot freshness: 2025 snapshots may be stale · alt year `web/{current_year}/...` may be more current
- T5 sites may have HTML structure variance · Extract regex inherited from WF63 (T6 gov source pattern) may need adaptation
- BANKED W16: Slack diff-monitor cyl (sibling WF74 State.gov pattern)

---

*Agent C · W15-T4a · WF84 rqYal2WkxkcGFFC8 · 2026-05-28*
