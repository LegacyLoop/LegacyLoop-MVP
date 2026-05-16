// lib/sylvia/chat/tools-bridge.ts
//
// CMD-SYLVIA-HARDWIRED-CHAT-V1 V20 v2.1 R29 P70 · Wave 14 Slot C · 2026-05-16
//
// Native tool dispatch bridge · NO HTTP roundtrip · NO OWU dependency.
// Maps OpenAI-compat tool_call → direct function call into
// lib/sylvia/tools/{file-read,file-write}.ts substrate.
//
// Doctrine:
//   BINDING #10 · LiteLLM Gateway remains single AI egress
//                · tool dispatch is local JS function call (NOT external)
//   BINDING #16 · clones tool handler signatures verbatim · zero novel abstraction
//   BINDING #17 · operates on canonical substrate (handleFileRead/handleFileWrite)

import { handleFileRead } from "@/lib/sylvia/tools/file-read";
import { handleFileWrite } from "@/lib/sylvia/tools/file-write";
import { appendToolAuditEntry } from "@/lib/sylvia/memory";
import type { ToolAuditEntry } from "@/lib/sylvia/memory-types";
import type { SylviaToolCall, ChatHandlerContext } from "./types";

export interface ToolBridgeResult {
  toolCallId: string;
  toolName: string;
  outcome: "ok" | "deny" | "error" | "exists" | "timeout" | "unknown_tool";
  contentForLLM: string; // JSON-encoded result · injected as tool-role message content
  summaryForClient: string; // short human-readable summary for SSE event
}

const TOOL_SCHEMA = [
  {
    type: "function" as const,
    function: {
      name: "file_read",
      description:
        "Read a file from the local filesystem. Permission-gated: ENV allow-list + hard deny for .env*, secrets/, .git/, etc. Returns file content (credential-redacted) and bytesRead. Max 512KB per call.",
      parameters: {
        type: "object",
        required: ["path"],
        properties: {
          path: { type: "string", description: "Absolute or relative path to the file" },
          encoding: { type: "string", enum: ["utf-8", "base64"], default: "utf-8" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "file_write",
      description:
        "Write a file to the local filesystem. Permission-gated. Default mode 'create-only' refuses overwrite. Modes: create-only | append | overwrite. Max 512KB per call. Source-code paths and core docs are DENY by default.",
      parameters: {
        type: "object",
        required: ["path", "content"],
        properties: {
          path: { type: "string" },
          content: { type: "string" },
          mode: {
            type: "string",
            enum: ["create-only", "append", "overwrite"],
            default: "create-only",
          },
        },
      },
    },
  },
];

export function getSylviaToolSchema() {
  return TOOL_SCHEMA;
}

async function safeAppendAudit(entry: ToolAuditEntry): Promise<void> {
  try {
    await appendToolAuditEntry(entry);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[sylvia-chat-tools-bridge] audit write failed: ${msg}`);
  }
}

export async function executeToolBridge(
  toolCall: SylviaToolCall,
  ctx: ChatHandlerContext,
): Promise<ToolBridgeResult> {
  const startedAt = Date.now();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(toolCall.function.arguments);
  } catch {
    const result: ToolBridgeResult = {
      toolCallId: toolCall.id,
      toolName: toolCall.function.name,
      outcome: "error",
      contentForLLM: JSON.stringify({ error: "Invalid JSON arguments" }),
      summaryForClient: `error · invalid arguments`,
    };
    return result;
  }

  const name = toolCall.function.name;

  if (name === "file_read") {
    const path = typeof parsed.path === "string" ? parsed.path : "";
    const encoding =
      parsed.encoding === "base64" || parsed.encoding === "utf-8"
        ? (parsed.encoding as "utf-8" | "base64")
        : "utf-8";
    const out = await handleFileRead({ path, encoding }, { caller: ctx.caller });
    const audit: ToolAuditEntry = {
      timestamp: new Date().toISOString(),
      tool: "file_read",
      caller: ctx.caller,
      request: { path, encoding },
      permission: {
        outcome: out.outcome === "deny" ? "deny" : "allow",
        reason: out.outcome === "deny" ? out.reason : undefined,
      },
      result: {
        outcome: out.outcome,
        duration_ms: Date.now() - startedAt,
        bytes: out.bytesRead,
        credentialsRedacted: out.credentialsRedacted,
        reason: out.reason,
      },
    };
    await safeAppendAudit(audit);
    return {
      toolCallId: toolCall.id,
      toolName: name,
      outcome: out.outcome,
      contentForLLM: JSON.stringify({
        outcome: out.outcome,
        content: out.content,
        bytesRead: out.bytesRead,
        credentialsRedacted: out.credentialsRedacted,
        reason: out.reason,
      }),
      summaryForClient:
        out.outcome === "ok"
          ? `read ${out.bytesRead ?? 0} bytes from ${path}`
          : `${out.outcome}: ${out.reason ?? path}`,
    };
  }

  if (name === "file_write") {
    const path = typeof parsed.path === "string" ? parsed.path : "";
    const content = typeof parsed.content === "string" ? parsed.content : "";
    const mode =
      parsed.mode === "append" || parsed.mode === "overwrite"
        ? (parsed.mode as "append" | "overwrite")
        : "create-only";
    const out = await handleFileWrite({ path, content, mode }, { caller: ctx.caller });
    const audit: ToolAuditEntry = {
      timestamp: new Date().toISOString(),
      tool: "file_write",
      caller: ctx.caller,
      request: { path, mode, contentBytes: content.length },
      permission: {
        outcome: out.outcome === "deny" ? "deny" : "allow",
        reason: out.outcome === "deny" ? out.reason : undefined,
      },
      result: {
        outcome: out.outcome,
        duration_ms: Date.now() - startedAt,
        bytes: out.bytesWritten,
        reason: out.reason,
      },
    };
    await safeAppendAudit(audit);
    return {
      toolCallId: toolCall.id,
      toolName: name,
      outcome: out.outcome,
      contentForLLM: JSON.stringify({
        outcome: out.outcome,
        bytesWritten: out.bytesWritten,
        preExistedAtPath: out.preExistedAtPath,
        contentHash: out.contentHash,
        credentialsDetectedInInput: out.credentialsDetectedInInput,
        reason: out.reason,
      }),
      summaryForClient:
        out.outcome === "ok"
          ? `wrote ${out.bytesWritten ?? 0} bytes to ${path} (mode=${mode})`
          : `${out.outcome}: ${out.reason ?? path}`,
    };
  }

  return {
    toolCallId: toolCall.id,
    toolName: name,
    outcome: "unknown_tool",
    contentForLLM: JSON.stringify({ error: `Unknown tool: ${name}` }),
    summaryForClient: `unknown tool: ${name}`,
  };
}
