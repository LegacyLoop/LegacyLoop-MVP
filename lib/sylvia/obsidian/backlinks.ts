// lib/sylvia/obsidian/backlinks.ts
//
// CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 v2.1 R29 P-WAVE-20-PHASE-5 · 2026-05-18
//
// Compute reverse-graph backlinks across vault notes.
// `[[wikilink]]` from note A → note B yields backlink record at B referencing A.

import { promises as fs } from "node:fs";
import { join, basename } from "node:path";
import { parseNote, extractWikilinks } from "./formatter";
import { getVaultRoot } from "./vault-writer";

const SUB_VAULTS = [
  "swarm",
  "customer",
  "item",
  "platform",
  "skill",
  "episode",
  "pattern",
  "global",
];

export interface BacklinkRecord {
  targetTitle: string;       // the note being linked TO
  sources: string[];         // titles of notes linking IN
}

/**
 * Walk all sub-vaults · parse every .md · build reverse-graph map.
 * Returns: Map<targetTitle, BacklinkRecord>
 */
export async function computeBacklinks(): Promise<Map<string, BacklinkRecord>> {
  const root = getVaultRoot();
  const reverse = new Map<string, BacklinkRecord>();

  for (const sub of SUB_VAULTS) {
    let entries: string[];
    try {
      entries = await fs.readdir(join(root, sub));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      const filePath = join(root, sub, entry);
      let raw: string;
      try {
        raw = await fs.readFile(filePath, "utf8");
      } catch {
        continue;
      }
      const note = parseNote(raw, filePath);
      const sourceTitle = note.title;
      const links = extractWikilinks(note.body);
      for (const target of links) {
        const existing = reverse.get(target);
        if (existing) {
          if (!existing.sources.includes(sourceTitle)) {
            existing.sources.push(sourceTitle);
          }
        } else {
          reverse.set(target, { targetTitle: target, sources: [sourceTitle] });
        }
      }
    }
  }

  return reverse;
}

/** Lookup backlinks for one target title. */
export async function getBacklinksFor(targetTitle: string): Promise<string[]> {
  const map = await computeBacklinks();
  return map.get(targetTitle)?.sources ?? [];
}
