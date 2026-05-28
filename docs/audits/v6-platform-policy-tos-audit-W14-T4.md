# V6 Platform Policy ToS Audit · W14-T4 Audit

**CMD-V6-PLATFORM-POLICY-TOS-AUDIT V20 LOW · Agent C agent-3 worktree (T4 canonical)**
**Date:** 2026-05-28 · **Wave 14 Lane T4**

> Audit-doc-only cyl · ZERO n8n write · ZERO CEO keys
> Flag doc: ~/Downloads/skills/Flags/V6_PLATFORM_POLICY_TOS_AUDIT.md
> W15 fire-list: 8 platform ToS spec stubs banked

---

## §1 · Output

- Flag doc shipped: `V6_PLATFORM_POLICY_TOS_AUDIT.md` (~150 LOC)
- 8 W15 spec stubs authored (one per platform)
- Repo audit doc (this file)
- ALL gated on CEO W15 ratify (bundle vs separate decision)

## §2 · 8 Platforms Cataloged

| # | Platform | HEAD | Tier |
|---|----------|------|------|
| 1 | eBay | 303 (redirect) | T5 HTML |
| 2 | Etsy | 200 ✓ | T5 HTML |
| 3 | Mercari | 403 | T6 Wayback fallback |
| 4 | Poshmark | 200 ✓ | T5 HTML |
| 5 | Whatnot | 403 | T6 Wayback fallback |
| 6 | Depop | 403 | T6 Wayback fallback |
| 7 | OfferUp | 200 ✓ | T5 HTML |
| 8 | TheRealReal | 200 ✓ | T5 HTML |

**Tier distribution:** 5 T5 HTML direct + 3 T6 Wayback fallback (bot-walled live)

Wayback verified functional (sample probe 302 → snapshot).

## §3 · CEO Decisions Pending W15

- Bundle 8 platforms into single WF (recommend) OR 8 separate WFs
- Diff-alert Slack webhook URL (sibling to WF74)
- Wayback baseline cadence (monthly vs quarterly)
- Cron day-of-week (Monday recommended · aligns WF74)

## §4 · Diff-Monitoring Strategy

- T5 sources: etag + If-Modified-Since 24h cache · weekly Wayback compare
- T6 fallback: Wayback snapshot-to-snapshot diff · weekly
- Slack alert on detected change · sibling pattern to WF74 State.gov recovery

## §5 · Doctrine Sustained (ZERO NEW)

- BINDING #17 audit-first-wire (Phase C §V6 + 8 HEAD probes)
- BINDING #28 drift catch (V6=0 baseline)
- BINDING #38 empirical-cite (URLs + HEAD codes)
- DOC-AUDIT-DOC-AUTONOMOUS-COMPLETE (W11+W12+W13+W14 sustained)
- DOC-MAX-LEGAL-ACCESS-LADDER #49 ratchet (5 T5 + 3 T6 Wayback)
- Phase C compendium §V6 verbatim
- T4 canonical: Agent C = agent-3 (CEO direct)
- **ZERO new doctrines (CEO Rule 1)**

---

*Agent C · W14-T4 · HEAD 7f00bf5 · agent-3 worktree · 2026-05-28*
