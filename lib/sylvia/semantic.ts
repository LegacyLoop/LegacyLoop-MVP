// lib/sylvia/semantic.ts
//
// CMD-SYLVIA-SEMANTIC-MEMORY-BRIDGE V20 v2.1 R29 P73 · Wave 15 Slot B · 2026-05-16
//
// Semantic memory primitive · maps 239 skill packs + Phase 3 SSA
// structure to routable knowledge graph.
//
// Store decision (CEO §5.X Gate 1): PATH A file-system-v1 SHIPPED.
// PATH B ruvector.db cross-process consumer = banked follow-on cyl.
//
// Doctrine:
//   BINDING #16 · clones lib/sylvia/memory.ts queryMemoryByTopic pattern
//   BINDING #17 · §0.3 substrate read verbatim · 239 skill packs counted
//   BINDING #25 · zero AI spend v1 · embeddings banked Phase 9.1
//
// Public API:
//   - recallByEntity({ entity, type?, limit?, fuzzy? }) → SemanticEntry[]
//   - relatedSkills(skillId, depth=2) → SemanticEntry[]
//   - crossDomainQuery(domain, { limit? }) → SemanticEntry[]
//   - indexSkillPack(path) → SemanticEntry
//   - rebuildIndex({ dryRun? }) → { scanned, indexed, errors }

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, basename, dirname, sep } from "node:path";
import type { SemanticEntry, SemanticEntityType } from "./memory-types";

const SKILLS_DIR = join(process.cwd(), "lib", "bots", "skills");
const SEMANTIC_DIR = join(process.cwd(), "sylvia-data", "semantic");
const INDEX_PATH = join(SEMANTIC_DIR, "skill-index.json");

interface IndexFile {
  version: number;
  generatedAt: string;
  entryCount: number;
  entries: SemanticEntry[];
}

let memoryCache: IndexFile | null = null;
let cacheMtime = 0;

function pathHash(p: string): string {
  return createHash("sha256").update(p).digest("hex").slice(0, 12);
}

async function loadIndex(): Promise<IndexFile> {
  try {
    const stat = await fs.stat(INDEX_PATH);
    if (memoryCache && stat.mtimeMs === cacheMtime) {
      return memoryCache;
    }
    const raw = await fs.readFile(INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw) as IndexFile;
    memoryCache = parsed;
    cacheMtime = stat.mtimeMs;
    return parsed;
  } catch {
    return { version: 1, generatedAt: "1970-01-01T00:00:00.000Z", entryCount: 0, entries: [] };
  }
}

function parseYamlFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  if (!content.startsWith("---\n")) {
    return { meta: {}, body: content };
  }
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return { meta: {}, body: content };
  const yamlBlock = content.slice(4, end);
  const meta: Record<string, unknown> = {};
  for (const line of yamlBlock.split("\n")) {
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let value: unknown = m[2].trim();
    if (typeof value === "string") {
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map(s => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else {
        value = value.replace(/^["']|["']$/g, "");
      }
    }
    meta[key] = value;
  }
  return { meta, body: content.slice(end + 5) };
}

function inferDomain(filePath: string): string {
  // lib/bots/skills/<bot>/<skill>.md → <bot>
  const rel = relative(SKILLS_DIR, filePath);
  const parts = rel.split(sep);
  return parts[0] ?? "unknown";
}

function extractTags(meta: Record<string, unknown>, body: string): string[] {
  const tags = new Set<string>();
  if (Array.isArray(meta.tags)) for (const t of meta.tags) tags.add(String(t));
  if (Array.isArray(meta.keywords)) for (const t of meta.keywords) tags.add(String(t));
  // Lightweight keyword extraction: capture first ## headings
  for (const line of body.split("\n").slice(0, 50)) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      const heading = m[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (heading) tags.add(heading);
    }
  }
  return Array.from(tags).slice(0, 15);
}

/**
 * Index a single skill-pack .md file into a SemanticEntry.
 */
export async function indexSkillPack(path: string): Promise<SemanticEntry> {
  const content = await fs.readFile(path, "utf8");
  const { meta, body } = parseYamlFrontmatter(content);
  const domain = inferDomain(path);
  const name = typeof meta.name === "string"
    ? meta.name
    : basename(path, ".md");
  const id = `skill:${domain}:${pathHash(path)}`;
  return {
    id,
    type: "skill",
    name,
    path: relative(process.cwd(), path),
    domain,
    tags: extractTags(meta, body),
    related: [],
    body: body.slice(0, 2000), // first 2KB as preview · embeddings Phase 9.1
    lastIndexed: new Date().toISOString(),
  };
}

async function* walkSkills(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkSkills(full);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      yield full;
    }
  }
}

/**
 * Walk lib/bots/skills/* · index each .md · write atomic index.
 * Idempotent · safe to re-run.
 */
export async function rebuildIndex(opts: { dryRun?: boolean } = {}): Promise<{
  scannedCount: number;
  indexedCount: number;
  errorCount: number;
}> {
  const dryRun = opts.dryRun ?? false;
  let scannedCount = 0;
  let indexedCount = 0;
  let errorCount = 0;
  const entries: SemanticEntry[] = [];

  for await (const path of walkSkills(SKILLS_DIR)) {
    scannedCount++;
    try {
      const entry = await indexSkillPack(path);
      entries.push(entry);
      indexedCount++;
    } catch (err) {
      errorCount++;
      console.error(`[sylvia-semantic] indexSkillPack failed for ${path}:`, err);
    }
  }

  // Wire `related` field via shared domain (cheap v1 · semantic-similarity Phase 9.1)
  const byDomain = new Map<string, string[]>();
  for (const e of entries) {
    const list = byDomain.get(e.domain ?? "unknown") ?? [];
    list.push(e.id);
    byDomain.set(e.domain ?? "unknown", list);
  }
  for (const e of entries) {
    const siblings = byDomain.get(e.domain ?? "unknown") ?? [];
    e.related = siblings.filter(id => id !== e.id).slice(0, 10);
  }

  if (!dryRun) {
    await fs.mkdir(SEMANTIC_DIR, { recursive: true });
    const indexFile: IndexFile = {
      version: 1,
      generatedAt: new Date().toISOString(),
      entryCount: entries.length,
      entries,
    };
    const tmp = `${INDEX_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(indexFile, null, 2), "utf8");
    await fs.rename(tmp, INDEX_PATH);
    memoryCache = null; // invalidate
    cacheMtime = 0;
  }

  return { scannedCount, indexedCount, errorCount };
}

export interface RecallByEntityOpts {
  entity: string;
  type?: SemanticEntityType;
  limit?: number;
  fuzzy?: boolean; // default true · substring fallback
}

/**
 * Recall semantic entries matching an entity name or substring.
 */
export async function recallByEntity(opts: RecallByEntityOpts): Promise<SemanticEntry[]> {
  const index = await loadIndex();
  const limit = opts.limit ?? 25;
  const fuzzy = opts.fuzzy ?? true;
  const needle = opts.entity.toLowerCase().trim();
  if (!needle) return [];

  const candidates = opts.type
    ? index.entries.filter(e => e.type === opts.type)
    : index.entries;

  // Exact match first
  const exact: SemanticEntry[] = [];
  const fuzzyHits: SemanticEntry[] = [];

  for (const e of candidates) {
    const name = e.name.toLowerCase();
    if (name === needle || (e.tags ?? []).some(t => t.toLowerCase() === needle)) {
      exact.push(e);
      continue;
    }
    if (!fuzzy) continue;
    const haystack = `${name} ${(e.tags ?? []).join(" ")} ${e.domain ?? ""} ${(e.body ?? "").slice(0, 500)}`
      .toLowerCase();
    if (haystack.includes(needle)) {
      fuzzyHits.push(e);
    }
  }

  return [...exact, ...fuzzyHits].slice(0, limit);
}

/**
 * BFS traversal via related[] · max depth 2 default.
 */
export async function relatedSkills(skillId: string, depth = 2): Promise<SemanticEntry[]> {
  const index = await loadIndex();
  const byId = new Map(index.entries.map(e => [e.id, e]));
  const visited = new Set<string>([skillId]);
  let frontier = [skillId];
  const out: SemanticEntry[] = [];

  for (let d = 0; d < depth && frontier.length > 0; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      const entry = byId.get(id);
      if (!entry) continue;
      for (const relId of entry.related ?? []) {
        if (visited.has(relId)) continue;
        visited.add(relId);
        const rel = byId.get(relId);
        if (rel) {
          out.push(rel);
          next.push(relId);
        }
      }
    }
    frontier = next;
  }
  return out;
}

/**
 * Filter index by domain · sorted by lastIndexed desc.
 */
export async function crossDomainQuery(
  domain: string,
  opts: { limit?: number } = {},
): Promise<SemanticEntry[]> {
  const index = await loadIndex();
  const limit = opts.limit ?? 50;
  return index.entries
    .filter(e => e.domain === domain)
    .sort((a, b) => b.lastIndexed.localeCompare(a.lastIndexed))
    .slice(0, limit);
}

export type { SemanticEntry, SemanticEntityType } from "./memory-types";
