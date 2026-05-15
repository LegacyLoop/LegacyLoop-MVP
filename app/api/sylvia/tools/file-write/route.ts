// app/api/sylvia/tools/file-write/route.ts
//
// CMD-SYLVIA-TOOL-FILE-WRITE V20 v2.1 R29 P64 · Wave 13 Slot 2 · 2026-05-15
//
// POST /api/sylvia/tools/file-write — Sylvia file_write tool · HTTP-route canonical.
// Symmetry-clones app/api/sylvia/tools/file-read/route.ts (P63) verbatim per BINDING #16.
//
// Auth: verifySylviaInternalSecret · triple-source · timingSafeEqual
// Audit: appendToolAuditEntry → sylvia-data/audit/tool-{YYYY-MM-DD}.jsonl
// Permission: ENV var SYLVIA_TOOL_FILE_WRITE_ALLOW_PATHS (semicolon-separated globs)
// Doctrine: BINDING #5 (extended deny block · source code + audit-self-tamper)
//           · #9 (input cred-detect count) · #10 (single audit chokepoint)
//           · #16 (clones P63 route) · #17 (audit-first) · #34 (widened cite)

import { NextResponse, type NextRequest } from "next/server";
import { verifySylviaInternalSecret } from "@/lib/sylvia/dispatcher";
import { appendToolAuditEntry } from "@/lib/sylvia/memory";
import { handleFileWrite } from "@/lib/sylvia/tools/file-write";
import type { FileWriteInput } from "@/lib/sylvia/tools/types";
import type { ToolAuditEntry } from "@/lib/sylvia/memory-types";

export const runtime = "nodejs";
export const maxDuration = 30;

function errorEnvelope(status: number, message: string, code?: string) {
  return NextResponse.json(
    code
      ? { error: message, code, traceId: crypto.randomUUID() }
      : { error: message, traceId: crypto.randomUUID() },
    { status },
  );
}

async function safeAppendToolAudit(entry: ToolAuditEntry): Promise<void> {
  try {
    await appendToolAuditEntry(entry);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[sylvia-tool-file-write] audit write failed: ${msg}`);
  }
}

export async function POST(req: NextRequest) {
  // Auth
  const auth = verifySylviaInternalSecret(req);
  if (!auth.ok) {
    return errorEnvelope(auth.status, auth.reason, auth.status === 401 ? "AUTH" : undefined);
  }

  // Parse
  let body: FileWriteInput;
  try {
    body = (await req.json()) as FileWriteInput;
  } catch {
    return errorEnvelope(400, "Invalid JSON body", "VALIDATION");
  }
  if (!body.path || typeof body.path !== "string") {
    return errorEnvelope(400, "path required", "VALIDATION");
  }
  if (typeof body.content !== "string") {
    return errorEnvelope(400, "content required (string)", "VALIDATION");
  }

  const mode = body.mode ?? "create-only";
  const caller = req.headers.get("x-sylvia-caller") ?? "unknown";
  const startedAt = Date.now();

  try {
    const result = await handleFileWrite(body, { caller });
    const auditEntry: ToolAuditEntry = {
      timestamp: new Date().toISOString(),
      tool: "file_write",
      caller,
      request: {
        path: body.path,
        mode,
        contentBytes: Buffer.byteLength(body.content, "utf8"),
        contentHash: result.contentHash,
        encoding: body.encoding ?? "utf-8",
      },
      permission: {
        outcome: result.outcome === "deny" ? "deny" : "allow",
        reason: result.outcome === "deny" ? result.reason : undefined,
      },
      result: {
        outcome: result.outcome,
        duration_ms: Date.now() - startedAt,
        bytes: result.bytesWritten,
        credentialsRedacted: result.credentialsDetectedInInput,
        reason: result.reason,
      },
    };
    await safeAppendToolAudit(auditEntry);

    if (result.outcome === "deny") {
      return errorEnvelope(403, result.reason ?? "Permission denied", "PERMISSION");
    }
    if (result.outcome === "error") {
      return errorEnvelope(500, result.reason ?? "Internal error", "INTERNAL");
    }
    // create-only refusal returns 409 Conflict · not error
    if (result.outcome === "exists") {
      return NextResponse.json(
        {
          outcome: "exists",
          preExistedAtPath: true,
          contentHash: result.contentHash,
          reason: result.reason,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({
      outcome: "ok",
      bytesWritten: result.bytesWritten,
      preExistedAtPath: result.preExistedAtPath,
      contentHash: result.contentHash,
      credentialsDetectedInInput: result.credentialsDetectedInInput,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[sylvia-tool-file-write] handler error: ${msg}`);
    return errorEnvelope(500, "Internal error");
  }
}
