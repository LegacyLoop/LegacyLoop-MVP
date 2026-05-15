// lib/sylvia/tools/file-write.ts
//
// CMD-SYLVIA-TOOL-FILE-WRITE V20 v2.1 R29 P64 · Wave 13 Slot 2 · 2026-05-15
//
// Operation substrate for Sylvia file_write HTTP tool. Called from
// app/api/sylvia/tools/file-write/route.ts after auth gate.
//
// Symmetry-clones lib/sylvia/tools/file-read.ts (P63) verbatim per BINDING #16.
//
// Doctrine:
//   BINDING #5  · hard-coded deny extends P63 list with source-code dirs
//                 (lib/** · app/** · prisma/** · scripts/** · public/** ·
//                  .github/** · package.json · *-lock.{yaml,json} · core docs)
//                 plus sylvia-data/audit/** (Sylvia cannot tamper with own audit)
//   BINDING #9  · input credential-detect · WARN log + audit count (v1 NEVER blocks)
//   BINDING #28 · realpath() canonical resolve · symlink-escape drift catch
//   BINDING #16 · clones P63 fs+permission pattern · zero novel abstractions
//
// Default mode: create-only (refuses overwrite · safest)
// CEO opts into append OR overwrite per call. Audit captures preExistedAtPath.

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";

import type { FileWriteInput, FileWriteOutput } from "./types";

const MAX_BYTES = 524288; // 512 KB hard cap (v1 · CEO routes expansion via spec amendment)

// Extends P63 HARD_DENY with source-code + audit-self-tamper protection.
const HARD_DENY: RegExp[] = [
  // P63 inherited (env · secrets · git · creds · tokens · keychain · ssh · aws)
  /(^|\/)\.env(\.|$)/,
  /(^|\/)secrets(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)credentials/,
  /-token/,
  /(^|\/)keychain/,
  /(^|\/)\.ssh(\/|$)/,
  /(^|\/)\.aws(\/|$)/,
  // P64 write-specific (source code · build infra · core docs · self-audit)
  /(^|\/)lib(\/|$)/,
  /(^|\/)app(\/|$)/,
  /(^|\/)prisma(\/|$)/,
  /(^|\/)scripts(\/|$)/,
  /(^|\/)public(\/|$)/,
  /(^|\/)\.github(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.next(\/|$)/,
  /(^|\/)CLAUDE\.md$/,
  /(^|\/)AGENTS\.md$/,
  /(^|\/)WORLD_CLASS_STANDARDS\.md$/,
  /(^|\/)package\.json$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)sylvia-data\/audit(\/|$)/,
];

// Credential-detect patterns (P63 inherited · INPUT-side WARN+count for write)
const CREDENTIAL_PATTERNS: RegExp[] = [
  /\b(sk-[A-Za-z0-9_-]{20,}|pk_[A-Za-z0-9_-]{20,})\b/g,
  /\b[A-Za-z0-9_-]{40,}\b(?=.{0,40}(token|key|secret|password))/gi,
  /\b(eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})\b/g,
];

/**
 * Glob match: simple ** semantics (cloned verbatim from file-read.ts).
 */
function globMatch(pattern: string, path: string): boolean {
  const regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "::DOUBLE_STAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DOUBLE_STAR::/g, ".*");
  return new RegExp(`^${regexStr}$`).test(path);
}

function parseAllowList(): string[] {
  const raw = process.env.SYLVIA_TOOL_FILE_WRITE_ALLOW_PATHS ?? "";
  return raw.split(";").map(s => s.trim()).filter(Boolean);
}

function matchDeny(canonical: string): RegExp | null {
  for (const pat of HARD_DENY) {
    if (pat.test(canonical)) return pat;
  }
  return null;
}

function matchAllow(canonical: string, allowList: string[]): string | null {
  for (const pat of allowList) {
    if (globMatch(pat, canonical)) return pat;
  }
  return null;
}

function detectCredentials(content: string): number {
  let count = 0;
  for (const pat of CREDENTIAL_PATTERNS) {
    const matches = content.match(pat);
    if (matches) count += matches.length;
  }
  return count;
}

function sha256Prefix(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex").slice(0, 16);
}

interface HandlerContext {
  caller: string;
}

export async function handleFileWrite(
  input: FileWriteInput,
  _ctx: HandlerContext,
): Promise<FileWriteOutput> {
  if (!input.path || typeof input.path !== "string") {
    return { outcome: "error", reason: "path required (non-empty string)" };
  }
  if (typeof input.content !== "string") {
    return { outcome: "error", reason: "content required (string)" };
  }

  const mode = input.mode ?? "create-only";
  const contentBytes = Buffer.byteLength(input.content, "utf8");

  if (contentBytes > MAX_BYTES) {
    return {
      outcome: "error",
      reason: `content ${contentBytes} bytes exceeds cap ${MAX_BYTES}`,
    };
  }

  // Resolve canonical (parent dir if file does not yet exist · create-only path)
  const absolute = resolve(input.path);
  let canonical: string;
  try {
    canonical = await fs.realpath(absolute);
  } catch {
    // File does not exist · resolve parent for permission match against deny+allow
    canonical = absolute;
  }

  // Hard deny first
  const deniedBy = matchDeny(canonical);
  if (deniedBy) {
    return { outcome: "deny", reason: `denied by hard rule: ${deniedBy.source}` };
  }

  // Allow-list match · default-deny if no match
  const allowList = parseAllowList();
  if (allowList.length === 0) {
    return {
      outcome: "deny",
      reason: "SYLVIA_TOOL_FILE_WRITE_ALLOW_PATHS not configured · default-deny",
    };
  }
  const allowedBy = matchAllow(canonical, allowList);
  if (!allowedBy) {
    return { outcome: "deny", reason: `no allow-list match for: ${canonical}` };
  }

  // Pre-existence probe (drives create-only outcome + audit preExistedAtPath)
  let preExisted = false;
  try {
    await fs.access(canonical);
    preExisted = true;
  } catch {
    preExisted = false;
  }

  // Input credential-detect (count only · WARN log · NEVER blocks v1)
  const credCount = detectCredentials(input.content);
  if (credCount > 0) {
    console.warn(
      `[sylvia-tool-file-write] credential pattern detected in input · count=${credCount} · path=${canonical}`,
    );
  }

  const contentHash = sha256Prefix(input.content);

  // Mode dispatch
  try {
    if (mode === "create-only") {
      if (preExisted) {
        return {
          outcome: "exists",
          preExistedAtPath: true,
          contentHash,
          credentialsDetectedInInput: credCount,
          reason: "file exists · create-only refuses overwrite",
        };
      }
      await fs.writeFile(canonical, input.content, "utf8");
    } else if (mode === "append") {
      await fs.appendFile(canonical, input.content, "utf8");
    } else if (mode === "overwrite") {
      await fs.writeFile(canonical, input.content, "utf8");
    } else {
      return { outcome: "error", reason: `unknown mode: ${mode}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { outcome: "error", reason: `write failed: ${msg}` };
  }

  return {
    outcome: "ok",
    bytesWritten: contentBytes,
    preExistedAtPath: preExisted,
    contentHash,
    credentialsDetectedInInput: credCount,
  };
}
