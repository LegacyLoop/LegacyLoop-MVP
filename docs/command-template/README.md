# V20 Command Template · Repo Canonical Mirror

**Source:** `~/Desktop/skills/Command TEMPLATES/LegacyLoop_Command_Template_V20.md`
**Version:** V20 v2.5
**SHA-256 prefix:** `41032a3acb62` (full SHA in CI/MC ratify ledger)
**Mirror policy:** Repo canonical mirror. Update via PR alongside external. NEVER drift silently.

---

## Purpose

V20 command template lives external-only (Desktop) which is a single point of loss. This repo mirror provides:
- Git-tracked history for template evolution
- Reproducible CI/audit reference (SHA-locked)
- Drift detection (mismatch = either external or repo update needed)

## Update protocol

1. Edit template at canonical external path first
2. Cite NEW SHA in MC ratify ledger
3. Copy to repo: `cp "$EXTERNAL_PATH" docs/command-template/V20_COMMAND_TEMPLATE.md`
4. Update this README with new SHA prefix
5. Commit + ship via `agent-ship.sh`
6. Both paths MUST have matching SHA post-PR

## Drift detection

```bash
shasum -a 256 "/Users/ryanhallee/Desktop/skills/Command TEMPLATES/LegacyLoop_Command_Template_V20.md"
shasum -a 256 docs/command-template/V20_COMMAND_TEMPLATE.md
# MUST match. Mismatch → either external advanced OR repo stale.
```

## Lineage

- Initial migration: W19-L3 (2026-05-29 · Agent B agent-2 · CMD-W19-L3-BP-LEAK-SCAN-V20-TEMPLATE-MIGRATE)
- Rationale: Agent 1 W18-L1 carry-forward · external-only = doctrine risk
