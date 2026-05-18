// lib/sylvia/graphify/graph-builder.ts
//
// CMD-SYLVIA-GRAPHIFY-SELF-INTROSPECTION V20 v2.1 R29 P-WAVE-20-PHASE-6 · 2026-05-18
//
// Read Phase 5 vault · parse markdown · extract [[wikilink]] edges ·
// build GraphNode + GraphEdge collections. AST-only · zero new HTTP.

import {
  listVaultNotes,
  readVaultNote,
  extractWikilinks,
  getVaultRoot,
} from "../obsidian";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { GraphNode, GraphEdge, GraphNamespace } from "./types";

const SUB_VAULTS: GraphNamespace[] = [
  "swarm:active",
  "customer:default",
  "item:default",
  "platform:default",
  "skill:default",
  "episode:default",
  "pattern:default",
  "global",
] as GraphNamespace[];

const SUB_VAULT_DIRS = [
  "swarm",
  "customer",
  "item",
  "platform",
  "skill",
  "episode",
  "pattern",
  "global",
];

export interface BuildOptions {
  scope?: GraphNamespace; // restrict build to single namespace
}

export async function buildGraphFromVault(
  options: BuildOptions = {},
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const root = getVaultRoot();
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const titleToId = new Map<string, string>();

  // Phase 1: scan all sub-vaults → nodes
  for (const sub of SUB_VAULT_DIRS) {
    if (options.scope) {
      const [category] = options.scope.split(":");
      if (category !== sub) continue;
    }
    let entries: string[];
    try {
      entries = await fs.readdir(join(root, sub));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      const filePath = join(root, sub, entry);
      let note;
      try {
        note = await readVaultNote(filePath);
      } catch {
        continue;
      }
      const id = `${sub}/${entry.replace(/\.md$/, "")}`;
      titleToId.set(note.title, id);
      nodes.push({
        id,
        namespace: note.namespace as GraphNamespace,
        title: note.title,
        weight: 1, // initial · refined by god-nodes centrality pass
        metadata: {
          filePath,
          provenance: note.frontmatter.provenance,
          embeddingHash: note.frontmatter.embeddingHash,
          ...(note.frontmatter.platforms
            ? { platforms: note.frontmatter.platforms }
            : {}),
        },
      });
    }
  }

  // Phase 2: extract wikilink edges
  for (const node of nodes) {
    const filePath = node.metadata.filePath as string;
    let note;
    try {
      note = await readVaultNote(filePath);
    } catch {
      continue;
    }
    const links = extractWikilinks(note.body);
    for (const targetTitle of links) {
      const targetId = titleToId.get(targetTitle);
      if (!targetId || targetId === node.id) continue;
      edges.push({
        source: node.id,
        target: targetId,
        type: "explicit-link",
        weight: 1,
      });
    }
  }

  return { nodes, edges };
}

/** Walk vault for stats only · zero parse · cheap. */
export async function countVaultNotes(): Promise<number> {
  const root = getVaultRoot();
  let total = 0;
  for (const sub of SUB_VAULT_DIRS) {
    try {
      const entries = await fs.readdir(join(root, sub));
      total += entries.filter((e) => e.endsWith(".md")).length;
    } catch {
      // sub-vault missing · skip
    }
  }
  return total;
}
