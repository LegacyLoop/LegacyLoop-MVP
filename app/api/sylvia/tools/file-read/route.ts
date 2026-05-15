// app/api/sylvia/tools/file-read/route.ts
//
// CMD-SYLVIA-TOOL-FILE-READ V20 v2.1 R29 P63 · Wave 13 Slot 1 · 2026-05-15
//
// POST /api/sylvia/tools/file-read — Sylvia file_read tool · HTTP-route canonical.
// Clones app/api/sylvia/consensus/route.ts pattern verbatim per BINDING #16.
//
// Auth: verifySylviaInternalSecret · triple-source · timingSafeEqual
// Audit: appendToolAuditEntry → sylvia-data/audit/tool-{YYYY-MM-DD}.jsonl
// Permission: ENV var SYLVIA_TOOL_FILE_READ_ALLOW_PATHS (semicolon-separated globs)
// Doctrine: BINDING #5 (never .env*) · #9 (cred-redact output) · #10 (single audit chokepoint)
//           · #16 (clones consensus route) · #17 (audit-first) · #34 (widened cite)

import { NextResponse, type NextRequest } from "next/server";
import { verifySylviaInternalSecret } from "@/lib/sylvia/dispatcher";
import { appendToolAuditEntry } from "@/lib/sylvia/memory";
import { handleFileRead } from "@/lib/sylvia/tools/file-read";
import type { FileReadInput } from "@/lib/sylvia/tools/types";
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
    console.error(`[sylvia-tool-file-read] audit write failed: ${msg}`);
  }
}

export async function POST(req: NextRequest) {
  // Auth
  const auth = verifySylviaInternalSecret(req);
  if (!auth.ok) {
    return errorEnvelope(auth.status, auth.reason, auth.status === 401 ? "AUTH" : undefined);
  }

  // Parse
  let body: FileReadInput;
  try {
    body = (await req.json()) as FileReadInput;
  } catch {
    return errorEnvelope(400, "Invalid JSON body", "VALIDATION");
  }
  if (!body.path || typeof body.path !== "string") {
    return errorEnvelope(400, "path required", "VALIDATION");
  }

  const caller = req.headers.get("x-sylvia-caller") ?? "unknown";
  const startedAt = Date.now();

  try {
    const result = await handleFileRead(body, { caller });
    const auditEntry: ToolAuditEntry = {
      timestamp: new Date().toISOString(),
      tool: "file_read",
      caller,
      request: { path: body.path, encoding: body.encoding ?? "utf-8" },
      permission: {
        outcome: result.outcome === "deny" ? "deny" : "allow",
        reason: result.outcome === "deny" ? result.reason : undefined,
      },
      result: {
        outcome: result.outcome,
        duration_ms: Date.now() - startedAt,
        bytes: result.bytesRead,
        credentialsRedacted: result.credentialsRedacted,
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
    return NextResponse.json({
      content: result.content,
      bytesRead: result.bytesRead,
      credentialsRedacted: result.credentialsRedacted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[sylvia-tool-file-read] handler error: ${msg}`);
    return errorEnvelope(500, "Internal error");
  }
}
