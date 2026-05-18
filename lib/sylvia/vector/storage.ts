// lib/sylvia/vector/storage.ts
//
// CMD-SYLVIA-RUVECTOR-HNSW-SUBSTRATE V20 v2.1 R29 P-WAVE-20-PHASE-3 · 2026-05-18
//
// File-based JSONL persistence per namespace.
// BINDING #6 N/A · zero Prisma migration · zero Turso push v1.
// Phase 4+ may migrate to Turso vector_entries table if scale warrants
// (banked decision · interface preserves swap).

import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { VectorEntry, VectorNamespace } from "./types";
import { _globalIndex } from "./hnsw";

const STORE_ROOT = join(process.cwd(), "sylvia-data", "vector-store");

/** Map a namespace to its on-disk JSONL path. */
function namespacePath(namespace: VectorNamespace): string {
  if (namespace === "global") return join(STORE_ROOT, "global.jsonl");
  const [category, key] = namespace.split(":");
  if (!key) return join(STORE_ROOT, `${category}.jsonl`);
  return join(STORE_ROOT, category, `${sanitize(key)}.jsonl`);
}

function sanitize(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]/g, "_");
}

async function ensureDir(filePath: string): Promise<void> {
  const dir = filePath.substring(0, filePath.lastIndexOf("/"));
  await fs.mkdir(dir, { recursive: true });
}

interface SerializedEntry {
  id: string;
  namespace: VectorNamespace;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function serialize(entry: VectorEntry): string {
  const obj: SerializedEntry = {
    id: entry.id,
    namespace: entry.namespace,
    embedding: Array.from(entry.embedding),
    metadata: entry.metadata,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
  return JSON.stringify(obj);
}

function deserialize(line: string): VectorEntry | null {
  try {
    const obj = JSON.parse(line) as SerializedEntry;
    return {
      id: obj.id,
      namespace: obj.namespace,
      embedding: Float32Array.from(obj.embedding),
      metadata: obj.metadata,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  } catch {
    return null;
  }
}

/** Append a single VectorEntry to the namespace JSONL file. */
export async function persistEntry(entry: VectorEntry): Promise<void> {
  const path = namespacePath(entry.namespace);
  await ensureDir(path);
  await fs.appendFile(path, serialize(entry) + "\n", "utf8");
}

/** Load all entries for a namespace into the global flat-search index. */
export async function loadNamespace(namespace: VectorNamespace): Promise<number> {
  const path = namespacePath(namespace);
  let raw: string;
  try {
    raw = await fs.readFile(path, "utf8");
  } catch {
    return 0;
  }
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const entries: VectorEntry[] = [];
  for (const line of lines) {
    const e = deserialize(line);
    if (e) entries.push(e);
  }
  _globalIndex._bulkLoad(namespace, entries);
  return entries.length;
}

/** Best-effort delete via rewrite (small N flat-file pattern). */
export async function persistDelete(
  namespace: VectorNamespace,
  id: string,
): Promise<void> {
  const path = namespacePath(namespace);
  let raw: string;
  try {
    raw = await fs.readFile(path, "utf8");
  } catch {
    return;
  }
  const kept: string[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const e = deserialize(line);
    if (e && e.id !== id) kept.push(line);
  }
  await fs.writeFile(path, kept.join("\n") + (kept.length ? "\n" : ""), "utf8");
}
