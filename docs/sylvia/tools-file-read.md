# Sylvia Tool · file_read · Architecture

> **Cylinder:** CMD-SYLVIA-TOOL-FILE-READ V20 v2.1 R29 P63 · Wave 13 Slot 1 · PATH X
> **Pattern source:** `app/api/sylvia/consensus/route.ts` verbatim clone
> **Supersedes:** CMD-SYLVIA-MCP-FILE-READ V20 P60 (DEPRECATED · MCP-stdio path)
> **Authored:** 2026-05-15 · IT execute · Devin L2 spec
> **Class:** TOOL-WIRE · BUILD-UP (production-grade)

---

## §1 · Overview

HTTP-route Sylvia operational tool. Open WebUI (port 4000) registers this route as an OpenAPI tool · Sylvia chat invokes it via standard HTTP POST · Next.js serverless handler enforces auth + permission + credential-redact + audit JSONL.

**Why HTTP-route (not MCP-stdio):** consensus dispatcher at `app/api/sylvia/consensus/route.ts` is the canonical Sylvia integration pattern. HTTP-route inherits auth surface (`verifySylviaInternalSecret` triple-source) + audit pattern (`appendAuditEntry` JSONL) + `errorEnvelope()` traceId pattern. MCP-stdio was alternative path · superseded post substrate-audit.

---

## §2 · Route surface

```
POST /api/sylvia/tools/file-read

Headers:
  Authorization: Bearer <SYLVIA_API_INTERNAL_SECRET>
  Content-Type: application/json
  X-Sylvia-Caller: <optional · session/caller ID for audit>

Body:
  { "path": "<absolute or relative path>", "encoding": "utf-8" | "base64" }

Response (200 · ok):
  { "content": "<file content>", "bytesRead": 1234, "credentialsRedacted": 0 }

Response (400 VALIDATION):
  { "error": "path required", "code": "VALIDATION", "traceId": "..." }

Response (401 AUTH):
  { "error": "...", "code": "AUTH", "traceId": "..." }

Response (403 PERMISSION):
  { "error": "<deny reason>", "code": "PERMISSION", "traceId": "..." }

Response (500 INTERNAL):
  { "error": "<reason>", "code": "INTERNAL", "traceId": "..." }
```

---

## §3 · Permission policy

**Source:** ENV var `SYLVIA_TOOL_FILE_READ_ALLOW_PATHS` (semicolon-separated globs)

**Default value** (per R29 P63 CEO OQ default):
```
/Users/ryanhallee/legacy-loop-mvp/sylvia-data/**
/Users/ryanhallee/legacy-loop-mvp/docs/**
/Users/ryanhallee/.claude/identity/**
/Users/ryanhallee/legacy-loop-mvp/CLAUDE.md
/Users/ryanhallee/legacy-loop-mvp/AGENTS.md
/Users/ryanhallee/legacy-loop-mvp/WORLD_CLASS_STANDARDS.md
```

**Hard-coded deny** (always blocks · regardless of allow-list · BINDING #5):
- `**/.env*` · `**/secrets/**` · `**/.git/**`
- `**/credentials*` · `**/*-token*` · `**/keychain*`
- `**/.ssh/**` · `**/.aws/**`

**Resolution order:**
1. `fs.realpath()` canonical resolve (BINDING #28 symlink-escape drift catch)
2. Match hard-deny patterns → 403 if hit
3. Match allow-list globs → 403 if no match (default-deny)
4. Size cap check (`MAX_BYTES = 524288` · 512 KB v1 hard cap)
5. Read · post-read credential-redact · count redactions

**CEO routes expansion via:**
- New ENV value pasted via Slack STATUS (BINDING #5 presence-only)
- OR spec amendment if hard-deny pattern changes (audit-class doctrine)

---

## §4 · Audit row

Written to `sylvia-data/audit/tool-{YYYY-MM-DD}.jsonl` via `appendToolAuditEntry()` in `lib/sylvia/memory.ts`. Separate file prefix (`tool-`) distinguishes operational lane from consensus dispatch lane (`{YYYY-MM-DD}.jsonl`).

Shape (per `ToolAuditEntry` in `lib/sylvia/memory-types.ts`):
```typescript
{
  timestamp: string;          // ISO8601
  tool: "file_read";
  caller: string;             // X-Sylvia-Caller header or "unknown"
  request: { path, encoding };
  permission: { outcome: "allow" | "deny", reason?: string };
  result: { outcome: "ok" | "deny" | "error", duration_ms, bytes?, credentialsRedacted?, reason? };
}
```

Audit failures NEVER fail the consumer response (wrapped in `safeAppendToolAudit`).

**Ephemeral note (Vercel):** `/tmp` + cwd writes survive only within warm-lambda window. R25+ AgentDB cylinder banked for durable audit.

---

## §5 · Open WebUI registration

Two paths:

**Path A · OpenAPI URL** (preferred · auto-discovery):
1. Open WebUI Settings → Tools
2. Add tool · OpenAPI URL: `http://host.docker.internal:3000/api/sylvia/tools/openapi`
   (NOTE: OpenAPI endpoint banked as separate cyl `CMD-SYLVIA-TOOLS-OPENAPI-SERVE V20 LOW`)
3. Save · Sylvia auto-discovers `file_read` tool surface

**Path B · Manual JSON** (v1 path):
1. Settings → Tools → Add Tool (manual)
2. Paste tool definition:
   ```json
   {
     "name": "file_read",
     "description": "Read a file from local filesystem · permission-gated",
     "url": "http://host.docker.internal:3000/api/sylvia/tools/file-read",
     "method": "POST",
     "headers": { "Authorization": "Bearer ${SYLVIA_API_INTERNAL_SECRET}" },
     "input_schema": {
       "type": "object",
       "properties": {
         "path": { "type": "string", "description": "Absolute path" },
         "encoding": { "type": "string", "enum": ["utf-8", "base64"], "default": "utf-8" }
       },
       "required": ["path"]
     }
   }
   ```

---

## §6 · Smoke tests

**Positive** (expects content + bytesRead):
```bash
curl -X POST http://localhost:3000/api/sylvia/tools/file-read \
  -H "Authorization: Bearer $SYLVIA_API_INTERNAL_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"path":"docs/CLAUDE_HISTORY.md"}'
```

**Negative** (expects 403 deny · audit row outcome=deny):
```bash
curl -X POST http://localhost:3000/api/sylvia/tools/file-read \
  -H "Authorization: Bearer $SYLVIA_API_INTERNAL_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"path":".env.sylvia"}'
```

---

## §7 · Doctrine

- **BINDING #5** · hard-coded `.env*` deny · never bypassable
- **BINDING #9** · credential-redact regex post-read · counts redactions in audit
- **BINDING #10** · single audit chokepoint via `appendToolAuditEntry`
- **BINDING #16** · canonical clone of consensus route auth+audit pattern
- **BINDING #17** · §0.3 substrate read end-to-end before authoring
- **BINDING #28** · realpath canonical resolve · drift catch
- **BINDING #34** · widened cite (commit SHA = deploy SHA · dpl Ready · curl variety + Sylvia round-trip 5-check)

---

## §8 · Cross-references

- Pattern source: `app/api/sylvia/consensus/route.ts`
- Auth source: `lib/sylvia/dispatcher/auth.ts` (verifySylviaInternalSecret)
- Audit source: `lib/sylvia/memory.ts` (appendAuditEntry pattern)
- Type source: `lib/sylvia/memory-types.ts` (AuditEntry forward-compat shape)
- Sibling cyls: P64 file-write (gated) · P65 bash (gated)
- Substrate audit: `docs/audits/SYLVIA_SUBSTRATE_DEEP_DIVE_2026-05-15.md`

---

*Authored R29 P63 Wave 13 Slot 1 · 2026-05-15 · Track B B2-W1 · agent-1 worktree*
