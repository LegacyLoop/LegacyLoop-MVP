// lib/sylvia/obsidian/formatter.ts
//
// CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 v2.1 R29 P-WAVE-20-PHASE-5 · 2026-05-18
//
// Markdown emission + parse · YAML frontmatter · Obsidian-native `[[wikilinks]]`.
// Custom-written · zero npm dep · BINDING #16 ABSOLUTE preserved.

import type { NoteFrontmatter, ObsidianNote } from "./types";

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

/**
 * Render an ObsidianNote to YAML-frontmatter + markdown body string.
 * Frontmatter keys serialize in stable order for diff-friendliness.
 */
export function formatNote(note: ObsidianNote): string {
  const lines: string[] = ["---"];
  const fm = note.frontmatter;

  // Stable-order canonical keys first
  lines.push(`namespace: ${fm.namespace}`);
  lines.push(`created: ${fm.created}`);
  lines.push(`updated: ${fm.updated}`);
  if (fm.embeddingHash) lines.push(`embedding-hash: ${fm.embeddingHash}`);
  lines.push(`provenance: ${fm.provenance}`);

  // MPMA / CCL extensions if present
  if (fm.platforms && fm.platforms.length > 0) {
    lines.push(`platforms: [${fm.platforms.join(", ")}]`);
  }
  if (fm.condition) lines.push(`condition: ${fm.condition}`);
  if (typeof fm.priceUsd === "number") lines.push(`price-usd: ${fm.priceUsd}`);
  if (fm.customerId) lines.push(`customer-id: ${fm.customerId}`);

  // Any other forward-compat keys (skip already-emitted canonical keys)
  const canonical = new Set([
    "namespace",
    "created",
    "updated",
    "embeddingHash",
    "provenance",
    "platforms",
    "condition",
    "priceUsd",
    "customerId",
  ]);
  for (const [k, v] of Object.entries(fm)) {
    if (canonical.has(k)) continue;
    if (v === null || v === undefined) continue;
    lines.push(`${k}: ${JSON.stringify(v)}`);
  }

  lines.push("---");
  lines.push("");
  lines.push(`# ${note.title}`);
  lines.push("");
  lines.push(note.body);

  if (note.backlinks.length > 0) {
    lines.push("");
    lines.push("## Backlinks");
    lines.push("");
    for (const link of note.backlinks) {
      lines.push(`- [[${link}]]`);
    }
  }

  return lines.join("\n") + "\n";
}

/**
 * Parse a markdown file string into ObsidianNote.
 * Tolerant: missing frontmatter → empty NoteFrontmatter with current timestamps.
 */
export function parseNote(
  raw: string,
  filePath: string,
): ObsidianNote {
  const now = new Date().toISOString();
  const lines = raw.split("\n");
  let body = raw;
  const fm: Partial<NoteFrontmatter> = {};

  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (end > 0) {
      const fmLines = lines.slice(1, end);
      for (const line of fmLines) {
        const m = /^([a-zA-Z_-]+):\s*(.*)$/.exec(line);
        if (!m) continue;
        const key = m[1];
        const value = m[2].trim();
        if (key === "namespace") fm.namespace = value as NoteFrontmatter["namespace"];
        else if (key === "created") fm.created = value;
        else if (key === "updated") fm.updated = value;
        else if (key === "embedding-hash") fm.embeddingHash = value;
        else if (key === "provenance") fm.provenance = value;
        else if (key === "platforms") {
          const inner = value.replace(/^\[|\]$/g, "");
          fm.platforms = inner.split(",").map((s) => s.trim()).filter(Boolean);
        } else if (key === "condition") fm.condition = value;
        else if (key === "price-usd") fm.priceUsd = Number(value);
        else if (key === "customer-id") fm.customerId = value;
        else fm[key] = value;
      }
      body = lines.slice(end + 1).join("\n").trim();
    }
  }

  // Extract title from first H1
  let title = filePath.split("/").pop()?.replace(/\.md$/, "") ?? "untitled";
  const h1 = /^#\s+(.+)$/m.exec(body);
  if (h1) {
    title = h1[1].trim();
    body = body.replace(h1[0], "").trim();
  }

  // Strip Backlinks section
  body = body.replace(/##\s+Backlinks[\s\S]*$/m, "").trim();

  // Resolve wikilinks
  const backlinks: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_RE.exec(body)) !== null) {
    const target = match[1].trim();
    if (!seen.has(target)) {
      backlinks.push(target);
      seen.add(target);
    }
  }

  return {
    namespace: fm.namespace ?? "global",
    filePath,
    title,
    body,
    frontmatter: {
      namespace: fm.namespace ?? "global",
      created: fm.created ?? now,
      updated: fm.updated ?? now,
      embeddingHash: fm.embeddingHash,
      provenance: fm.provenance ?? "vault-edit",
      ...fm,
    },
    backlinks,
  };
}

/**
 * Build wikilink target list from a body. Used by backlinks.ts.
 */
export function extractWikilinks(body: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((match = WIKILINK_RE.exec(body)) !== null) {
    const target = match[1].trim();
    if (!seen.has(target)) {
      out.push(target);
      seen.add(target);
    }
  }
  return out;
}
