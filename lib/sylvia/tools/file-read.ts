// lib/sylvia/tools/file-read.ts
//
// CMD-SYLVIA-TOOL-FILE-READ V20 v2.1 R29 P63 · Wave 13 Slot 1 · 2026-05-15
//
// Operation substrate for Sylvia file_read HTTP tool. Called from
// app/api/sylvia/tools/file-read/route.ts after auth gate.
//
// Doctrine:
//   BINDING #5  · hard-coded deny for **/.env* · **/secrets/** · **/.git/**
//                 · **/credentials* · **/*-token* · **/keychain* ·
//                 **/.ssh/** · **/.aws/**
//   BINDING #9  · post-read credential-redact regex · count redactions
//   BINDING #28 · realpath() canonical resolve · symlink-escape drift catch
//   BINDING #16 · clones existing fs+permission pattern · zero novel abstractions

import { promises as fs } from "node:fs";
import { resolve } from "node:path";

import type { FileReadInput, FileReadOutput } from "./types";

const MAX_BYTES = 524288; // 512 KB hard cap (v1 · CEO routes expansion via spec amendment)

const HARD_DENY: RegExp[] = [
  /(^|\/)\.env(\.|$)/,
  /(^|\/)secrets(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)credentials/,
  /-token/,
  /(^|\/)keychain/,
  /(^|\/)\.ssh(\/|$)/,
  /(^|\/)\.aws(\/|$)/,
];

// Credential-redact patterns (clones consensus dispatcher patterns ·
// 3-layer defense · output-side · NEVER blocks read · just redacts + counts)
const CREDENTIAL_PATTERNS: RegExp[] = [
  /\b(sk-[A-Za-z0-9_-]{20,}|pk_[A-Za-z0-9_-]{20,})\b/g, // OpenAI/Stripe-style
  /\b[A-Za-z0-9_-]{40,}\b(?=.{0,40}(token|key|secret|password))/gi, // generic high-entropy near keyword
  /\b(eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})\b/g, // JWT
];

/**
 * Glob match: simple ** semantics
 * - `**` matches any path segment(s)
 * - `*` matches single segment char-by-char
 * - everything else literal
 * Sufficient for env-var path globs (no need for full picomatch).
 */
function globMatch(pattern: string, path: string): boolean {
  const regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // escape regex meta
    .replace(/\*\*/g, "::DOUBLE_STAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DOUBLE_STAR::/g, ".*");
  return new RegExp(`^${regexStr}$`).test(path);
}

function parseAllowList(): string[] {
  const raw = process.env.SYLVIA_TOOL_FILE_READ_ALLOW_PATHS ?? "";
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

function redactCredentials(content: string): { content: string; count: number } {
  let redactCount = 0;
  let out = content;
  for (const pat of CREDENTIAL_PATTERNS) {
    out = out.replace(pat, () => {
      redactCount += 1;
      return "[REDACTED]";
    });
  }
  return { content: out, count: redactCount };
}

interface HandlerContext {
  caller: string;
}

export async function handleFileRead(
  input: FileReadInput,
  _ctx: HandlerContext,
): Promise<FileReadOutput> {
  if (!input.path || typeof input.path !== "string") {
    return { outcome: "error", reason: "path required (non-empty string)" };
  }

  let canonical: string;
  try {
    canonical = await fs.realpath(resolve(input.path));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { outcome: "error", reason: `realpath failed: ${msg}` };
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
      reason: "SYLVIA_TOOL_FILE_READ_ALLOW_PATHS not configured · default-deny",
    };
  }
  const allowedBy = matchAllow(canonical, allowList);
  if (!allowedBy) {
    return { outcome: "deny", reason: `no allow-list match for: ${canonical}` };
  }

  // Size cap pre-read
  let stat;
  try {
    stat = await fs.stat(canonical);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { outcome: "error", reason: `stat failed: ${msg}` };
  }
  if (stat.size > MAX_BYTES) {
    return {
      outcome: "error",
      reason: `file ${stat.size} bytes exceeds cap ${MAX_BYTES}`,
    };
  }

  // Read
  let raw: string;
  try {
    raw = await fs.readFile(canonical, "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { outcome: "error", reason: `readFile failed: ${msg}` };
  }

  // Output-side credential redact
  const { content, count } = redactCredentials(raw);

  return {
    outcome: "ok",
    content,
    bytesRead: stat.size,
    credentialsRedacted: count,
  };
}
