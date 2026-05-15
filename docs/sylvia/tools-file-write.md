# Sylvia · file_write tool · architecture

> **Cylinder:** CMD-SYLVIA-TOOL-FILE-WRITE V20 v2.1 R29 P64 · Wave 13 Slot 2 · PATH X
> **Track:** B · B2-W2 · symmetry-clone of P63 file_read
> **Status:** SHIPPED 2026-05-15 PM · agent-2 worktree

---

## Substrate placement

```
lib/sylvia/tools/file-write.ts          # operation substrate · permission + write + audit
lib/sylvia/tools/types.ts               # shared shapes (FileWriteInput/Output/Mode)
app/api/sylvia/tools/file-write/route.ts  # HTTP POST route · auth + dispatch + audit emit
sylvia-data/audit/tool-{YYYY-MM-DD}.jsonl # audit log · appendToolAuditEntry channel (P63)
.env.sylvia                             # SYLVIA_TOOL_FILE_WRITE_ALLOW_PATHS (presence-only)
docs/sylvia/SYLVIA_TOOLS_OPENAPI.yaml   # OpenAPI 3.1 entry · Open WebUI re-register source
```

Symmetry-clone source: `lib/sylvia/tools/file-read.ts` (P63 commit `5ec136e`). BINDING #16 DELEGATE-CANONICAL honored · zero novel abstractions.

## Permission policy

### Allow-list (ENV var · CEO-routed expansion)

`SYLVIA_TOOL_FILE_WRITE_ALLOW_PATHS` · semicolon-separated globs. v1 ships with:

- `sylvia-data/identity/**`
- `sylvia-data/corpus/**`
- `sylvia-data/memory/**`
- `sylvia-data/vector-store/**`
- `docs/audits/**`
- `docs/wave-plans/**`

### Deny block (extends P63 file_read deny + write-specific protections)

Inherits P63: `.env*` · `secrets/` · `.git/` · `credentials*` · `*-token*` · `keychain*` · `.ssh/` · `.aws/`.

Adds write-specific (source-code + build infra + audit self-tamper):

- `lib/**` · `app/**` · `prisma/**` · `scripts/**` · `public/**` · `.github/**`
- `node_modules/**` · `.next/**`
- `CLAUDE.md` · `AGENTS.md` · `WORLD_CLASS_STANDARDS.md`
- `package.json` · `package-lock.json` · `pnpm-lock.yaml` · `yarn.lock`
- `sylvia-data/audit/**` (Sylvia cannot tamper with own audit log)

### Resolution order

1. `fs.realpath()` canonical resolve (drift-catch symlink escape · BINDING #28). If file does not yet exist, falls back to absolute parent path for deny+allow match.
2. HARD_DENY first → `outcome: "deny"` if hit
3. Allow-list match (default-deny if no `SYLVIA_TOOL_FILE_WRITE_ALLOW_PATHS` configured)
4. `maxBytes` cap check (512 KB)
5. Input credential-detect (count only · WARN log · NEVER blocks v1)
6. SHA256 16-char prefix content hash (chain-of-custody)
7. Mode dispatch (see below)

## Mode dispatch

| Mode | Behavior | Outcome on existing file |
|---|---|---|
| `create-only` (DEFAULT) | `fs.access()` probe → `fs.writeFile()` if absent | `outcome: "exists"` · HTTP 409 Conflict |
| `append` | `fs.appendFile()` (creates if absent · appends if present) | `outcome: "ok"` · `preExistedAtPath: true` |
| `overwrite` | `fs.writeFile()` unconditional | `outcome: "ok"` · `preExistedAtPath: true` |

**Default = `create-only`** (safest · refuses overwrite · CEO opts into `append` or `overwrite` per call). Audit captures `preExistedAtPath` for every successful write so chain-of-custody is preserved regardless of mode.

## Audit row shape

Same `ToolAuditEntry` interface as P63 (`lib/sylvia/memory-types.ts`). Each `file_write` call appends one JSONL row to `sylvia-data/audit/tool-{YYYY-MM-DD}.jsonl`:

```json
{
  "timestamp": "2026-05-15T...Z",
  "tool": "file_write",
  "caller": "sylvia-open-webui-<id>",
  "request": {
    "path": "sylvia-data/identity/scratch.md",
    "mode": "create-only",
    "contentBytes": 5,
    "contentHash": "5d41402abc4b2a76",
    "encoding": "utf-8"
  },
  "permission": {
    "outcome": "allow",
    "reason": null
  },
  "result": {
    "outcome": "ok",
    "duration_ms": 4,
    "bytes": 5,
    "credentialsRedacted": 0,
    "reason": null
  }
}
```

Failure paths (`deny` · `error` · `exists`) also row-emit with reason. BINDING #10 telemetry-lock canonical.

## Credential detect (input-side)

Patterns inherited from P63 output-side redact regex (3 layers):

1. OpenAI/Stripe-style: `sk-...` · `pk_...`
2. Generic high-entropy 40+ char near credential keyword (token · key · secret · password)
3. JWT three-part: `eyJ...`

v1 NEVER blocks on credential pattern · counts + WARN log + audit row only. CEO routes block-on-credential later if needed (banked future cyl).

## Forward-compat alignment (Phase 2/3 boundary)

- Phase 1 (this cyl): in-process · Next.js Vercel route · localhost
- Phase 2 (banked): HTTP seam contract preserved · routes can migrate to localhost-only Sylvia substrate without API change
- Phase 3 (banked): dedicated-box deployment per `docs/sylvia/SYLVIA_MIGRATION_PLAN.md`

## CEO route-expansion path

CEO can expand `SYLVIA_TOOL_FILE_WRITE_ALLOW_PATHS` glob list per future cyl. Recommended sub-doctrine: `tools.file_write.allow.expand` requires explicit CEO routing (path additions visible in `.env.sylvia` diff · presence-only via `grep -cE` per BINDING #5).

## BINDING #34 cite plan

§12 cites: (a) commit SHA = deploy SHA · (b) `dpl_<id>` Ready · (c) curl 3-route + Sylvia round-trip 6-check (tool-list includes file_read + file_write · positive write · create-only refusal · source-code deny · `.env*` deny · read-after-write coherence).

## Related cylinders

- **P63** CMD-SYLVIA-TOOL-FILE-READ V20 (commit `5ec136e`) — symmetry source
- **P65** CMD-SYLVIA-TOOL-BASH V20 (banked · sequential post-P64 §12 GREEN)
- **P58** Bridge cyl (Sylvia identity GREEN-WITH-NOTE)
- **P61** CMD-SYLVIA-MCP-FILE-WRITE V20 (DEPRECATED via §AMENDMENT · MCP-stdio superseded by HTTP-route PATH X)

---

*Authored 2026-05-15 PM · IT execute · Devin L2 spec · agent-2 worktree*
