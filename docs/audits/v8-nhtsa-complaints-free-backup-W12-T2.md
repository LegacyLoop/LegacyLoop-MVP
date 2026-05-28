# V8 NHTSA Complaints Free-Backup · W12-T2 Audit

> CMD-V8-NHTSA-COMPLAINTS-FREE-BACKUP V20 LOW · Agent A · agent-1 worktree
> Anchor HEAD: `26e36f7` (origin/main at fire time)
> Date: 2026-05-27

## §1 · Build Summary

| Field | Value |
|-------|-------|
| WF ID | `5Cm14cQ1mOcVDOhC` |
| Name | WF75 V8 NHTSA Complaints-Free (CarComplaints + CarProblemZoo) |
| Clone source | WF63 (16th LAW canonical) |
| Sources | CarComplaints (200 ✓) + CarProblemZoo (200 ✓) |
| Vertical | V8 · domain: auto-complaints |
| Corpus | wf-v8-nhtsa-complaints-free-2026-05-27 |
| Cron | `28 7 * * *` (next free slot post WF73 :27) |
| Active | true |

## §2 · Patches Applied

| Patch | Status | Detail |
|-------|--------|--------|
| Source URLs | ✓ | 2 sources: carcomplaints + carproblemzoo · V8 metadata |
| Extract sentinel | ✓ INHERITED | `_loopPassthrough` present from WF63 clone (ARMED W9-1) |
| BP sentinel filter | ✓ INHERITED | `_loopPassthrough` filter inherited from WF63 |
| BP V8 metadata | ✓ PATCHED | V14→V8 · documents→auto-complaints · corpusId patched |
| Cron stagger | ✓ | 0 7→28 7 * * * |

## §3 · CEO Manual Execute

PENDING — n8n API does not support remote execution (405). CEO execute via n8n UI.
WF75 fires automatically on cron at 7:28 AM EDT daily.

## §4 · Context

CEO directive: every Apify-dep scraper requires parallel FREE backup running continuously.
NHTSA Complaints custom-actor Apify-dep banked W6-4 (api.nhtsa.gov/complaints 403-wall).
Cap-saturated. CarComplaints + CarProblemZoo = viable free alternative.

## §5 · Doctrine Sustained

- BINDING #16 clone-to-canonical (WF63 16th LAW)
- BINDING #17 audit-first-wire (WF63 JSON read pre-clone)
- BINDING #20 PB3 pull (agent-1 pre-fire)
- BINDING #28 drift catch (stub sources re-verified 200 OK)
- BINDING #38 empirical-cite (200 probes)
- BINDING #50 sentinel sustained (clone inherits Extract + BP)
- DOC-N8N-CLONE-BUILD-PAYLOAD-METADATA-PATCH (V8 metadata patched)
- DOC-N8N-POST-MINIMAL-FIELDS (read-only stripped)
- ZERO new doctrines (CEO rule)

## §6 · Banked

- CMD-W13-V8-NHTSA-COMPLAINTS-APIFY-CUSTOM-ACTOR V20 MEDIUM (post-renewal)
