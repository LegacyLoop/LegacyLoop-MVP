/**
 * LegacyLoop Skill Pack Loader
 *
 * First-party "Skills" tech inspired by Anthropic SDK Skills but
 * provider-agnostic. Loads markdown playbooks from
 * lib/bots/skills/_shared/ + lib/bots/skills/{botType}/ at runtime
 * and concatenates them into a single systemPromptBlock for
 * injection into bot prompts.
 *
 * Process-level cache: Map<botType, SkillPack>. Serverless reuses
 * warm functions, so single-instance cache is safe and efficient.
 *
 * Built: April 7, 2026 — CMD-SKILLS-INFRA-A
 */

import fs from "fs";
import path from "path";

export interface SkillPack {
  systemPromptBlock: string;
  skillNames: string[];
  totalChars: number;
  version: string;
  // CMD-BUYERBOT-SKILLS: ISO timestamp of newest .md file mtime
  // across all loaded skill files (shared + bot-specific). Used by
  // /admin Skills Status widget to show pack freshness at a glance.
  // Empty packs return new Date(0).toISOString() (epoch fallback).
  lastUpdated: string;
}

const SKILLS_VERSION = "v1.0-2026-04-07";
const SKILLS_DIR = path.join(process.cwd(), "lib/bots/skills");
const SHARED_DIR = path.join(SKILLS_DIR, "_shared");

const cache = new Map<string, SkillPack>();

/**
 * Strip YAML frontmatter from a markdown body. Defensive: handles
 * missing frontmatter, empty frontmatter, and unterminated
 * frontmatter blocks (returns the original content trimmed).
 */
function stripFrontmatter(content: string): string {
  if (!content.startsWith("---")) return content.trim();
  const end = content.indexOf("---", 3);
  if (end === -1) return content.trim();
  return content.slice(end + 3).trim();
}

/**
 * Read every .md file from a folder, in directory order. Returns
 * an empty array when the folder is missing or unreadable — never
 * throws. Each entry { name, body, mtimeMs } has frontmatter
 * stripped and the file's mtime captured for freshness telemetry
 * (CMD-BUYERBOT-SKILLS).
 */
function readSkillFolder(folderPath: string): { name: string; body: string; mtimeMs: number }[] {
  if (!fs.existsSync(folderPath)) return [];
  let entries: string[];
  try {
    entries = fs.readdirSync(folderPath);
  } catch (err) {
    console.warn(`[skill-loader] readdirSync failed for ${folderPath}:`, err);
    return [];
  }
  const skills: { name: string; body: string; mtimeMs: number }[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".md")) continue;
    const full = path.join(folderPath, entry);
    try {
      const raw = fs.readFileSync(full, "utf8");
      const stat = fs.statSync(full);
      const body = stripFrontmatter(raw);
      const name = entry.replace(/^\d+-/, "").replace(/\.md$/, "");
      skills.push({ name, body, mtimeMs: stat.mtimeMs });
    } catch (err) {
      console.warn(`[skill-loader] Failed to read ${full}:`, err);
    }
  }
  return skills;
}

/**
 * Load the skill pack for a given bot type. Concatenates
 * _shared/*.md + {botType}/*.md into a single systemPromptBlock.
 *
 * Process-cached on first call per bot — subsequent calls return
 * the cached object (zero disk I/O). Safe to call multiple times
 * per request. Returns an empty pack (with metadata) when no
 * skills exist for the bot — never throws.
 */
export function loadSkillPack(botType: string): SkillPack {
  const cached = cache.get(botType);
  if (cached) return cached;

  let shared: { name: string; body: string; mtimeMs: number }[] = [];
  let botSkills: { name: string; body: string; mtimeMs: number }[] = [];
  try {
    shared = readSkillFolder(SHARED_DIR);
    const botFolder = path.join(SKILLS_DIR, botType);
    botSkills = readSkillFolder(botFolder);
  } catch (err) {
    console.warn(`[skill-loader] loadSkillPack(${botType}) failed:`, err);
  }

  const all = [...shared, ...botSkills];

  if (all.length === 0) {
    const empty: SkillPack = {
      systemPromptBlock: "",
      skillNames: [],
      totalChars: 0,
      version: SKILLS_VERSION,
      // CMD-BUYERBOT-SKILLS: epoch fallback for empty packs.
      lastUpdated: new Date(0).toISOString(),
    };
    cache.set(botType, empty);
    return empty;
  }

  const systemPromptBlock = all
    .map((s) => `# SKILL PACK: ${s.name}\n\n${s.body}`)
    .join("\n\n---\n\n");

  // CMD-BUYERBOT-SKILLS: track newest .md mtime across all loaded
  // files (shared + bot-specific). Surfaced via /admin Skills
  // Status widget for at-a-glance freshness.
  let maxMtimeMs = 0;
  for (const s of all) {
    if (s.mtimeMs > maxMtimeMs) maxMtimeMs = s.mtimeMs;
  }

  const pack: SkillPack = {
    systemPromptBlock,
    skillNames: all.map((s) => s.name),
    totalChars: systemPromptBlock.length,
    version: SKILLS_VERSION,
    lastUpdated: maxMtimeMs > 0
      ? new Date(maxMtimeMs).toISOString()
      : new Date(0).toISOString(),
  };

  cache.set(botType, pack);
  return pack;
}

/**
 * CMD-MEGABOT-SHARED-SKILLS: Load a SINGLE named skill folder
 * WITHOUT prepending _shared/ packs. Used by the megabot route
 * to load _shared_megabot/ packs that should only fire during
 * MegaBot 4-AI consensus runs, never during normal single-AI
 * bot scans.
 *
 * Process-cached on first call per folder — subsequent calls
 * return the cached object (zero disk I/O). Safe to call
 * multiple times per request. Returns an empty pack when no
 * .md files exist in the folder — never throws.
 *
 * Unlike loadSkillPack(botType), this function does NOT
 * concatenate _shared/ packs. It reads ONLY the named folder.
 */
export function loadSkillFolder(folderName: string): SkillPack {
  const cacheKey = `__folder__${folderName}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const folderPath = path.join(SKILLS_DIR, folderName);
  let skills: { name: string; body: string; mtimeMs: number }[] = [];
  try {
    skills = readSkillFolder(folderPath);
  } catch (err) {
    console.warn(`[skill-loader] loadSkillFolder(${folderName}) failed:`, err);
  }

  if (skills.length === 0) {
    const empty: SkillPack = {
      systemPromptBlock: "",
      skillNames: [],
      totalChars: 0,
      version: SKILLS_VERSION,
      lastUpdated: new Date(0).toISOString(),
    };
    cache.set(cacheKey, empty);
    return empty;
  }

  const systemPromptBlock = skills
    .map((s) => `# SKILL PACK: ${s.name}\n\n${s.body}`)
    .join("\n\n---\n\n");

  let maxMtimeMs = 0;
  for (const s of skills) {
    if (s.mtimeMs > maxMtimeMs) maxMtimeMs = s.mtimeMs;
  }

  const pack: SkillPack = {
    systemPromptBlock,
    skillNames: skills.map((s) => s.name),
    totalChars: systemPromptBlock.length,
    version: SKILLS_VERSION,
    lastUpdated: maxMtimeMs > 0
      ? new Date(maxMtimeMs).toISOString()
      : new Date(0).toISOString(),
  };

  cache.set(cacheKey, pack);
  return pack;
}

/**
 * Internal helper for tests / debug — clears the process cache.
 * Not exported for production use.
 */
export function _clearSkillCache(): void {
  cache.clear();
}
