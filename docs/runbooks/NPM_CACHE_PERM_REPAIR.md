# NPM Cache Permission Repair · Runbook Note

> **Status:** Documentation-only · DO NOT EXECUTE without explicit CEO routing.
> **Source:** Wave 1 Slot 2 P25 RuFlo Diagnose · §12 evidence section
> **Anchor:** Slot 3 P26 ENOTEMPTY race root cause · `npm cache clean --force` returns EACCES
> **Banked cyl:** CMD-NPM-CACHE-PERM-REPAIR V19 LOW (one-time interactive · separate fire)

## What broke (Wave 1 Slot 2 evidence)

During RuFlo MCP diagnose · `claude mcp list` health-check spawns `npx -y ruflo@latest mcp start` repeatedly. Each invocation races with `~/.npm/_npx/2ed56890c96f58f7/node_modules/.ruflo-*` staging directory → `ENOTEMPTY` errno -66.

Trivial fix attempt #1 (`rm -rf ~/.npm/_npx/2ed56890c96f58f7`) succeeded transiently · next health-check re-races. Trivial fix attempt #2 (`npm cache clean --force`) returned **EACCES** — `~/.npm` ownership mismatch with current user.

## One-time fix (DO NOT EXECUTE without CEO directive)

```bash
sudo chown -R 501:20 ~/.npm
```

- Resets `~/.npm` ownership to `501:20` (default macOS user:group · matches `id -u` and `id -g`)
- Enables future `npm cache clean --force` to succeed without EACCES
- Prereq for RuFlo install-stabilize cyl path (c) per CMD-RUFLO-MCP-INSTALL-STABILIZE V19 HIGH (banked Phase B Wave 3+)
- One-time · monthly hygiene per CY-14 NEW

## Why note-only this cyl

Slot 3 R29 P32 directive is "document in relevant runbook · do NOT execute." Execution carries:
- Sudo password prompt (CEO interactive)
- Full-tree chown (~/.npm can be GB-class on heavy-use machines · takes minutes)
- Cross-impact: other npm-using tools (Vercel CLI · n8n · etc.) hit fresh permission state simultaneously

Defer execution to dedicated `CMD-NPM-CACHE-PERM-REPAIR V19 LOW` cyl when CEO routes one-time interactive window.

## Cross-references

- Wave 1 Slot 2 P25 §12 box (RuFlo diagnose · npx race root cause)
- Wave 1 flag registry §2 P1-NEW-2
- BINDING #29 DOC-PRE-FIRE-UPSTREAM-PROBE (this is upstream-probe output for any future ruflo install attempt)
- CY-14 NEW monthly `~/.npm` cache permission check (banked CYCLIC)

## Last updated

2026-05-14 (Thu) · Wave 2 Slot 3 P32 rider per DOC-FLAG-RIDER-PER-CYLINDER 1/5 NEW
