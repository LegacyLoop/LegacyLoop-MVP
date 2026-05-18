// lib/sylvia/obsidian/vault-writer.ts
//
// CMD-SYLVIA-OBSIDIAN-BIDIRECTIONAL-SYNC V20 v2.1 R29 P-WAVE-20-PHASE-5 · 2026-05-18
//
// Filesystem writer · per-namespace 8 sub-vault structure.
// Vault root: sylvia-data/obsidian-vault/
// BINDING #6 N/A · zero Prisma migration · zero Turso push.

import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { formatNote, parseNote } from "./formatter";
import type {
  ObsidianNote,
  VaultNamespace,
  VaultStructure,
} from "./types";

const VAULT_ROOT = join(process.cwd(), "sylvia-data", "obsidian-vault");

const SUB_VAULTS: string[] = [
  "swarm",
  "customer",
  "item",
  "platform",
  "skill",
  "episode",
  "pattern",
  "global",
];

function sanitize(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]/g, "_");
}

/** Map a VaultNamespace to its on-disk file path. */
export function namespaceToPath(namespace: VaultNamespace, key: string): string {
  if (namespace === "global") {
    return join(VAULT_ROOT, "global", `${sanitize(key)}.md`);
  }
  const [category, nsKey] = namespace.split(":");
  const subVault = SUB_VAULTS.includes(category) ? category : "global";
  const fileKey = nsKey ?? key;
  return join(VAULT_ROOT, subVault, `${sanitize(fileKey)}.md`);
}

/** Ensure 8 sub-vault directories exist under VAULT_ROOT. */
export async function ensureVaultStructure(): Promise<VaultStructure> {
  await fs.mkdir(VAULT_ROOT, { recursive: true });
  for (const sub of SUB_VAULTS) {
    await fs.mkdir(join(VAULT_ROOT, sub), { recursive: true });
  }
  return {
    root: VAULT_ROOT,
    subVaults: SUB_VAULTS as VaultNamespace[],
  };
}

export async function writeVaultNote(
  note: ObsidianNote,
  key?: string,
): Promise<string> {
  const fileKey = key ?? note.title;
  const path = namespaceToPath(note.namespace, fileKey);
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, formatNote(note), "utf8");
  return path;
}

export async function readVaultNote(filePath: string): Promise<ObsidianNote> {
  const raw = await fs.readFile(filePath, "utf8");
  return parseNote(raw, filePath);
}

export async function listVaultNotes(
  namespace: VaultNamespace,
): Promise<string[]> {
  const [category] = namespace.split(":");
  const subVault = SUB_VAULTS.includes(category) ? category : "global";
  const dir = join(VAULT_ROOT, subVault);
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((e) => e.endsWith(".md")).map((e) => join(dir, e));
  } catch {
    return [];
  }
}

export function getVaultRoot(): string {
  return VAULT_ROOT;
}
