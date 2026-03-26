import fs from "fs";
import path from "path";
import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────

export interface MegaBotAgentResult {
  provider: "openai" | "claude" | "gemini" | "grok";
  data: any;
  raw?: string;
  responseTime: number;
  error?: string;
}

export interface MegaBotResult {
  botType: string;
  itemId: string;
  timestamp: string;
  agents: {
    openai: MegaBotAgentResult | null;
    claude: MegaBotAgentResult | null;
    gemini: MegaBotAgentResult | null;
    grok: MegaBotAgentResult | null;
  };
  successCount: number;
  failCount: number;
  consensus: any;
  agreementScore: number;
  summary: string;
}

// ─── Agent specialty suffixes ─────────────────────────────────────────────

const AGENT_SUFFIXES: Record<string, string> = {
  openai: `\n\nYOUR ROLE — PRIMARY WEB RESEARCHER:
You have web search enabled. USE IT AGGRESSIVELY.
- Search eBay for "[item] sold" to find REAL completed sales with prices and dates
- Search Facebook Marketplace and Craigslist for current local listings
- Search Poshmark, Mercari, OfferUp for active listings
- Search auction house results (LiveAuctioneers, Heritage, Sotheby's) for high-value items
- Search "[brand] [model] value guide" for collector pricing databases
- Cross-reference at least 3 sources before making pricing claims
- Cite specific URLs when possible
Your job: REAL DATA. Not estimates. Not guesses. Real sold prices from real platforms.`,
  claude: `\n\nYOUR ROLE — DEEP KNOWLEDGE SPECIALIST:
You do NOT have web search. That is your STRENGTH — you focus purely on expertise.
- AUTHENTICATE: Analyze construction techniques, joinery methods, materials, and finishes to verify age and origin
- MAKER IDENTIFICATION: Cross-reference maker marks, stamps, labels, and signatures against your extensive training knowledge
- PROVENANCE ANALYSIS: Assess likely origin, production era, and regional style based on design elements
- RESTORATION VALUE: Estimate how much value professional restoration would add
- FORGERY DETECTION: Flag any indicators that suggest reproduction, fake, or misattributed item
- MATERIAL SCIENCE: Identify wood species, metal compositions, textile weaves, ceramic glazes
- HISTORICAL CONTEXT: Place the item within its design movement, cultural period, and market history
Your job: Be the EXPERT APPRAISER that no search engine can replace.`,
  gemini: `\n\nYOUR ROLE — MARKET INTELLIGENCE ANALYST:
You have Google Search grounding enabled. USE IT for market intelligence.
- Search for current market trends affecting this item category
- Find recent auction results and price movement data
- Search collector forums and enthusiast communities for demand signals
- Find value guide articles and price databases
- Analyze seasonal patterns and regional demand differences
- Search for similar items currently listed to assess competition
- Identify emerging trends that affect future value
Your job: MARKET INTELLIGENCE. Current trends, demand analysis, competitive landscape.`,
  grok: `\n\nYOUR ROLE — SOCIAL & CULTURAL INTELLIGENCE:
You specialize in real-time cultural awareness and social media trends.
- Assess this item's VIRAL POTENTIAL — would it trend on TikTok, Instagram, or Reddit?
- Evaluate GEN Z / MILLENNIAL appeal — nostalgia value, aesthetic trends (cottagecore, dark academia, etc.)
- Identify INFLUENCER ANGLE — what type of content creator would feature this item?
- Find NICHE COMMUNITIES — Reddit subreddits, Discord servers, Facebook groups
- Evaluate GIFT POTENTIAL — unique, shareable gift? For what occasions?
- Identify UNCONVENTIONAL BUYERS — interior designers, prop stylists, museum curators, film production
Your job: Find the buyers nobody else thinks of. The social angle. The culture play.`,
};

// ─── Shared helpers ───────────────────────────────────────────────────────

function fileToDataUrl(absPath: string) {
  const ext = path.extname(absPath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const base64 = fs.readFileSync(absPath, "base64");
  return { dataUrl: `data:${mime};base64,${base64}`, base64, mime };
}

function publicUrlToAbsPath(publicUrl: string) {
  const clean = publicUrl.startsWith("/") ? publicUrl.slice(1) : publicUrl;
  return path.join(process.cwd(), "public", clean);
}

/** Bulletproof JSON extraction: handles raw, markdown-fenced, text-wrapped, BOM, etc. */
function parseAgentResponse(raw: string, provider: string): any {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error(`${provider} returned empty response`);
  }

  let content = raw.trim();

  // STRATEGY 1: Try direct parse (fastest path)
  try { return JSON.parse(content); } catch {}

  // STRATEGY 2: Remove ALL markdown code fences aggressively
  let stripped = content
    .replace(/^```\s*json?\s*\r?\n?/im, "")   // opening fence at start
    .replace(/\r?\n?```\s*$/im, "")             // closing fence at end
    .replace(/^```\s*\r?\n/gm, "")              // any opening fence
    .replace(/\r?\n```\s*$/gm, "")              // any closing fence
    .trim();
  try { return JSON.parse(stripped); } catch {}

  // STRATEGY 3: Extract content between FIRST ``` and LAST ```
  const fencePattern = /```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/;
  const fenceMatch = content.match(fencePattern);
  if (fenceMatch && fenceMatch[1]) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // STRATEGY 4: Split on ``` and try each segment
  if (content.includes("```")) {
    const parts = content.split("```");
    for (const part of parts) {
      const trimmed = part.replace(/^\s*json\s*/i, "").trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try { return JSON.parse(trimmed); } catch {}
      }
    }
  }

  // STRATEGY 5: Depth-tracked brace matching — find outermost JSON object
  const firstBrace = content.indexOf("{");
  if (firstBrace >= 0) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = firstBrace; i < content.length; i++) {
      const ch = content[i];

      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"' && !escaped) { inString = !inString; continue; }
      if (inString) continue;

      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          const candidate = content.substring(firstBrace, i + 1);
          try { return JSON.parse(candidate); } catch {}
          break;
        }
      }
    }
  }

  // STRATEGY 6: Try first 3 opening braces, each matched to the LAST } after it
  const allOpens: number[] = [];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "{") allOpens.push(i);
  }
  for (const start of allOpens.slice(0, 3)) {
    for (let end = content.length - 1; end > start; end--) {
      if (content[end] === "}") {
        try { return JSON.parse(content.substring(start, end + 1)); } catch {}
        break; // try next opening brace
      }
    }
  }

  // STRATEGY 7: Try to find JSON array
  const arrStart = content.indexOf("[");
  const arrEnd = content.lastIndexOf("]");
  if (arrStart >= 0 && arrEnd > arrStart) {
    try { return JSON.parse(content.substring(arrStart, arrEnd + 1)); } catch {}
  }

  // STRATEGY 8: Strip BOM and invisible chars as last resort
  const cleaned = content.replace(/^\uFEFF/, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  try { return JSON.parse(cleaned); } catch {}

  // STRATEGY 9: Repair truncated JSON on raw content
  const repaired = repairTruncatedJson(content, provider);
  if (repaired) return repaired;

  // STRATEGY 10: Strip fences THEN repair truncation
  const forRepair = content
    .replace(/^```\s*json?\s*\r?\n?/im, "")
    .replace(/\r?\n?```\s*$/im, "")
    .trim();
  if (forRepair !== content) {
    const repaired2 = repairTruncatedJson(forRepair, provider);
    if (repaired2) return repaired2;
  }

  // STRATEGY 11: Find first { and try to repair from there
  const braceStart = content.indexOf("{");
  if (braceStart > 0) {
    const fromBrace = content.substring(braceStart);
    const repaired3 = repairTruncatedJson(fromBrace, provider);
    if (repaired3) return repaired3;
  }

  // ALL STRATEGIES FAILED
  throw new Error(`${provider} returned unparseable response: ${content.substring(0, 200)}`);
}

/** Attempt to repair JSON that was truncated mid-generation (hit max_tokens limit) */
function repairTruncatedJson(raw: string, provider: string): any | null {
  const trimmed = raw.trim();
  const firstBrace = trimmed.indexOf("{");
  if (firstBrace < 0) return null;

  const afterBrace = trimmed.substring(firstBrace);

  // Count open vs close braces (outside strings)
  let openBraces = 0;
  let closeBraces = 0;
  let inStr = false;
  let esc = false;
  for (const ch of afterBrace) {
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") closeBraces++;
  }

  if (openBraces <= closeBraces) return null; // Not truncated

  console.log(`[MegaBot][${provider}] Detected truncated JSON (${openBraces} opens, ${closeBraces} closes). Attempting repair.`);

  // Cut back to the last complete key-value pair boundary
  let repaired = afterBrace;
  const lastComma = repaired.lastIndexOf(",");
  const lastCloseBrace = repaired.lastIndexOf("}");
  const lastCloseBracket = repaired.lastIndexOf("]");
  const cutPoint = Math.max(lastComma, lastCloseBrace, lastCloseBracket);

  if (cutPoint > 0) {
    repaired = repaired.substring(0, cutPoint + 1);
    // If we cut at a comma, remove it (trailing comma is invalid JSON)
    if (repaired.endsWith(",")) {
      repaired = repaired.slice(0, -1);
    }
  }

  // Re-count depth after cutting, then close remaining brackets
  let depth = 0;
  let arrDepth = 0;
  inStr = false;
  esc = false;
  for (const ch of repaired) {
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (ch === "[") arrDepth++;
    if (ch === "]") arrDepth--;
  }

  // Close open arrays first, then objects
  while (arrDepth > 0) { repaired += "]"; arrDepth--; }
  while (depth > 0) { repaired += "}"; depth--; }

  try {
    const parsed = JSON.parse(repaired);
    console.log(`[MegaBot][${provider}] Truncated JSON repaired successfully. Keys: ${Object.keys(parsed).length}`);
    parsed._truncated = true;
    return parsed;
  } catch {
    console.log(`[MegaBot][${provider}] JSON repair failed`);
  }

  return null;
}

// ─── 60-second timeout helper ─────────────────────────────────────────────

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

const AGENT_TIMEOUT = 90_000;   // OpenAI + Gemini: 90 seconds
const CLAUDE_TIMEOUT = 120_000; // Claude: 120s — generates most detailed responses with 16k tokens

/** Lowercase all object keys (2 levels deep) so IDENTIFICATION → identification, ITEM_NAME → item_name */
function normalizeKeys(obj: any): any {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const out: any = {};
  for (const key of Object.keys(obj)) {
    const lk = key.toLowerCase();
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const inner: any = {};
      for (const ik of Object.keys(val)) {
        inner[ik.toLowerCase()] = val[ik];
      }
      out[lk] = inner;
    } else {
      out[lk] = val;
    }
  }
  return out;
}

/** Known wrapper keys that AI agents use to wrap their entire response payload */
const KNOWN_WRAPPER_KEYS = ['identification', 'analysis', 'result', 'response', 'data', 'output', 'item', 'vehicle', 'assessment', 'evaluation'];

/** Unwrap if the parsed object has exactly one top-level key that's a known wrapper and its value is an object */
function unwrapIfNeeded(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const keys = Object.keys(obj);
  if (keys.length === 1 && KNOWN_WRAPPER_KEYS.includes(keys[0]) && typeof obj[keys[0]] === 'object' && obj[keys[0]] !== null && !Array.isArray(obj[keys[0]])) {
    console.log('[megabot] Unwrapping single wrapper key:', keys[0]);
    return obj[keys[0]] as Record<string, unknown>;
  }
  return obj;
}

/** Unwrap agent data if wrapped in a single top-level key like { "analysis": {...} } */
function unwrapAgentData(data: any): any {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  // First try known-key unwrap
  const unwrapped = unwrapIfNeeded(data);
  if (unwrapped !== data) return unwrapped;
  // Fallback: unwrap ANY single key with >= 2 inner keys
  const keys = Object.keys(data);
  if (keys.length === 1) {
    const inner = data[keys[0]];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const innerKeys = Object.keys(inner);
      if (innerKeys.length >= 2) {
        console.log(`[MegaBot] Unwrapping single-key wrapper: "${keys[0]}" (${innerKeys.length} inner keys)`);
        return inner;
      }
    }
  }
  return data;
}

const MEGABOT_DEBUG = true; // Set false to silence debug logs

/** TEMPORARY diagnostic: log the shape of each agent's parsed data */
function debugAgentShape(label: string, data: any) {
  if (!MEGABOT_DEBUG) return;
  if (!data || typeof data !== "object") {
    console.log(`[MEGABOT DEBUG][${label}] data is ${data === null ? "null" : typeof data}`);
    return;
  }
  const keys = Object.keys(data);
  // Log first 5 fields with types and sample values
  for (const k of keys.slice(0, 8)) {
    const v = data[k];
    const vType = Array.isArray(v) ? "array" : typeof v;
    let sample = "";
    if (typeof v === "string") sample = v.length > 60 ? v.slice(0, 60) + "..." : v;
    else if (typeof v === "number" || typeof v === "boolean") sample = String(v);
    else if (v === null) sample = "null";
    else if (Array.isArray(v)) sample = `[${v.length} items]`;
    else if (typeof v === "object") sample = `{${Object.keys(v).slice(0, 5).join(", ")}}`;
    console.log(`[MEGABOT DEBUG][${label}]   ${k}: (${vType}) ${sample}`);
  }
  // Check for key fields the UI needs
  const has = (f: string) => data[f] != null;
  console.log(`[MEGABOT DEBUG][${label}] KEY FIELDS: item_name=${has("item_name")} category=${has("category")} condition_score=${has("condition_score")} estimated_value_low=${has("estimated_value_low")} identification=${has("identification")} pricing=${has("pricing")} executive_summary=${has("executive_summary")}`);
}

// ─── Per-agent call functions ─────────────────────────────────────────────

async function callOpenAI(
  prompt: string,
  photoPath: string
): Promise<{ data: any; raw: string; webSources?: Array<{ url: string; title: string }> }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.length < 10) throw new Error("No OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey: key });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const { dataUrl } = fileToDataUrl(photoPath);

  let resp;
  try {
    resp = await openai.responses.create({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt + AGENT_SUFFIXES.openai },
            { type: "input_image", image_url: dataUrl, detail: "auto" },
          ],
        },
      ],
      tools: [{ type: "web_search_preview" } as any],
      text: { format: { type: "text" } },
      max_output_tokens: 16384,
    });
  } catch (searchErr: any) {
    console.warn("[MegaBot OpenAI] web search failed, retrying without:", searchErr?.message);
    resp = await openai.responses.create({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt + AGENT_SUFFIXES.openai },
            { type: "input_image", image_url: dataUrl, detail: "auto" },
          ],
        },
      ],
      text: { format: { type: "text" } },
      max_output_tokens: 16384,
    });
  }

  // Parse web sources from OpenAI response
  let openaiWebSources: Array<{ url: string; title: string }> = [];
  try {
    if (resp.output && Array.isArray(resp.output)) {
      for (const outputItem of resp.output) {
        if ((outputItem as any).type === "web_search_call" && (outputItem as any).results) {
          for (const r of (outputItem as any).results) {
            if (r.url) openaiWebSources.push({ url: r.url, title: r.title || r.url });
          }
        }
        if ((outputItem as any).type === "message" && (outputItem as any).content) {
          for (const c of (outputItem as any).content) {
            if (c.annotations) {
              for (const ann of c.annotations) {
                if (ann.type === "url_citation" && ann.url) {
                  openaiWebSources.push({ url: ann.url, title: ann.title || ann.url });
                }
              }
            }
          }
        }
      }
    }
  } catch {}
  if (openaiWebSources.length > 0) console.log(`[MegaBot OpenAI] Found ${openaiWebSources.length} web sources`);

  const raw = resp.output_text;
  console.log('[megabot][openai] Raw response preview:', JSON.stringify(raw).slice(0, 300));
  const parsed = parseAgentResponse(raw, "OpenAI");
  // normalizeKeys is 2-level deep only, so: normalize → unwrap wrapper → normalize again to catch inner keys
  const data = normalizeKeys(unwrapAgentData(normalizeKeys(parsed)));
  console.log(`[MEGABOT DEBUG][OpenAI] Top keys: ${Object.keys(data || {}).slice(0, 15).join(", ")}`);
  debugAgentShape("OpenAI", data);
  return { data, raw, webSources: openaiWebSources };
}

// Claude models to try: primary then fallback
const CLAUDE_MODELS = [
  process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
  "claude-haiku-4-5-20251001", // Haiku fallback — faster, more concise
];

async function callClaude(
  prompt: string,
  _photoPath: string // unused — Claude uses text-only in MegaBot (OpenAI + Gemini analyze photos)
): Promise<{ data: any; raw: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length < 10) throw new Error("No ANTHROPIC_API_KEY");

  // Claude: TEXT-ONLY for MegaBot — no photos
  // Photos consume context; OpenAI + Gemini already analyze photos visually.
  // Claude's specialty (craftsmanship, history, authenticity) is text-based.
  // PREFILL trick: start assistant response with { to force raw JSON output.

  const claudePrompt = prompt + AGENT_SUFFIXES.claude
    + "\n\nCRITICAL: Output ONLY a JSON object. No markdown fences. No text before or after. Start directly with {.";

  // Dedupe models list (if env var is same as fallback)
  const models = [...new Set(CLAUDE_MODELS)];

  for (const model of models) {
    const { signal, clear } = withTimeout(CLAUDE_TIMEOUT);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 16384,
          messages: [
            { role: "user", content: claudePrompt },
            { role: "assistant", content: "{" }, // PREFILL — forces raw JSON, no markdown fences
          ],
        }),
        signal,
      });
      clear();

      if (!res.ok) {
        const t = await res.text();
        // If primary model fails, try fallback
        if (models.indexOf(model) < models.length - 1) {
          console.log(`[MegaBot][Claude] ${model} failed (${res.status}), trying next model...`);
          continue;
        }
        throw new Error(`Claude ${res.status}: ${t.slice(0, 200)}`);
      }

      const json = await res.json();

      // Check for truncation via stop_reason
      if (json.stop_reason === "max_tokens") {
        console.log(`[MegaBot][Claude] Response hit max_tokens on ${model} — may be truncated`);
      }

      // Extract text from response
      let raw = "";
      if (json.content && Array.isArray(json.content)) {
        raw = json.content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text || "")
          .join("");
      } else if (typeof json === "string") {
        raw = json;
      }

      // Prepend { if prefill was consumed (Anthropic API returns text AFTER the prefill)
      raw = raw.trim();
      if (!raw.startsWith("{")) {
        raw = "{" + raw;
      }

      console.log(`[MegaBot][Claude] Model: ${model}, Response length: ${raw.length} chars, stop: ${json.stop_reason || "unknown"}`);

      const parsed = parseAgentResponse(raw, "Claude");
      const data = normalizeKeys(unwrapAgentData(normalizeKeys(parsed)));
      data._claudeMode = "text";
      data._claudeModel = model;
      console.log(`[MEGABOT DEBUG][Claude] Top keys: ${Object.keys(data || {}).slice(0, 15).join(", ")}`);
      debugAgentShape("Claude", data);
      return { data, raw };
    } catch (err: any) {
      clear();
      if (err.name === "AbortError") {
        // If primary timed out, try fallback
        if (models.indexOf(model) < models.length - 1) {
          console.log(`[MegaBot][Claude] ${model} timed out, trying next model...`);
          continue;
        }
        throw new Error("Claude timed out after 120s");
      }
      // If primary had other error, try fallback
      if (models.indexOf(model) < models.length - 1) {
        console.log(`[MegaBot][Claude] ${model} error: ${err.message}, trying next model...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All Claude models failed");
}

async function callGemini(
  prompt: string,
  photoPath: string
): Promise<{ data: any; raw: string; webSources?: Array<{ url: string; title: string }> }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.length < 10) throw new Error("No GEMINI_API_KEY");
  const { base64, mime } = fileToDataUrl(photoPath);

  const baseReqBody = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mime, data: base64 } },
          { text: prompt + AGENT_SUFFIXES.gemini },
        ],
      },
    ],
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 16384,
      thinkingConfig: { thinkingBudget: 2048 },
    },
  };
  // Two request bodies: with and without google_search grounding.
  // google_search may conflict with responseMimeType:"application/json" on some models,
  // so we try with search first and fall back to without if it fails or returns empty.
  const reqBodyWithSearch = JSON.stringify({ ...baseReqBody, tools: [{ google_search: {} }] });
  const reqBodyPlain = JSON.stringify(baseReqBody);
  let triedWithSearch = false;

  const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
  let json: any;
  let lastError = "";

  for (const tryModel of GEMINI_MODELS) {
    const tryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${tryModel}:generateContent?key=${key}`;
    let succeeded = false;

    for (let attempt = 0; attempt < 2; attempt++) {
      // Attempt 0: try with google_search. Attempt 1: retry without.
      const useSearchBody = attempt === 0;
      const currentBody = useSearchBody ? reqBodyWithSearch : reqBodyPlain;
      const { signal, clear } = withTimeout(AGENT_TIMEOUT);
      try {
        console.log(`[MegaBot][Gemini] Calling ${tryModel} (attempt ${attempt + 1}, search=${useSearchBody})...`);
        const res = await fetch(tryUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: currentBody,
          signal,
        });
        clear();

        const retryable = [429, 500, 503].includes(res.status);
        if (retryable && attempt === 0) {
          const t = await res.text().catch(() => "");
          console.log(`[MegaBot][Gemini] ${tryModel} ${res.status} — retrying in 3s... (${t.slice(0, 100)})`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          lastError = `Gemini ${tryModel} ${res.status}: ${t.slice(0, 200)}`;
          throw new Error(lastError);
        }

        json = await res.json();

        // Check for safety blocks in the response
        const candidate = json.candidates?.[0];
        if (candidate?.finishReason === "SAFETY") {
          console.log(`[MegaBot][Gemini] ${tryModel} blocked by safety filter. Finish reason: SAFETY`);
          lastError = `Gemini ${tryModel} safety-blocked`;
          json = null;
          break; // Try next model
        }
        if (candidate?.finishReason === "RECITATION") {
          console.log(`[MegaBot][Gemini] ${tryModel} blocked by recitation filter.`);
          lastError = `Gemini ${tryModel} recitation-blocked`;
          json = null;
          break; // Try next model
        }

        // Validate response has actual text content
        const responseText = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
        if (!responseText || responseText.trim().length < 10) {
          console.log(`[MegaBot][Gemini] ${tryModel} returned empty/short response (${responseText.length} chars, search=${useSearchBody})`);
          if (attempt === 0) {
            // Search body returned empty — retry without search
            json = null;
            continue;
          }
          lastError = `Gemini ${tryModel} empty response`;
          json = null;
          break;
        }

        triedWithSearch = useSearchBody;
        succeeded = true;
        break;
      } catch (err: any) {
        clear();
        if (err.name === "AbortError") {
          lastError = `Gemini ${tryModel} timed out after ${AGENT_TIMEOUT / 1000}s`;
          console.log(`[MegaBot][Gemini] ${lastError}`);
          if (attempt === 0) continue; // Try without search
          break; // Both attempts timed out, try next model
        }
        const retryableMsg = ["503", "429", "500", "ECONNRESET", "ETIMEDOUT", "fetch failed"].some(
          code => err.message?.includes(code)
        );
        if (attempt === 0) {
          console.log(`[MegaBot][Gemini] ${tryModel} error with search=${useSearchBody}: ${err.message} — retrying without search...`);
          continue;
        }
        lastError = err.message || "Unknown Gemini error";
        console.log(`[MegaBot][Gemini] ${tryModel} final error: ${lastError}`);
        break; // Try next model
      }
    }

    if (succeeded && json) {
      console.log(`[MegaBot][Gemini] Success with ${tryModel}`);
      break;
    }
    console.log(`[MegaBot][Gemini] ${tryModel} failed, trying next model...`);
  }

  if (!json) throw new Error(`Gemini failed: ${lastError}`);

  // Robust text extraction: concatenate ALL text parts (Gemini may split across multiple)
  const candidates = json.candidates || [];
  let raw = "";
  if (candidates.length > 0) {
    const parts = candidates[0]?.content?.parts || [];
    raw = parts.map((p: any) => p.text || "").join("");
  }
  if (!raw && json.text) raw = json.text; // fallback for alternate response shapes
  if (!raw) {
    const finishReason = json.candidates?.[0]?.finishReason || "NONE";
    const blockReason = json.promptFeedback?.blockReason || "NONE";
    const safetyRatings = JSON.stringify(json.candidates?.[0]?.safetyRatings || json.promptFeedback?.safetyRatings || []);
    console.error(`[MegaBot][Gemini] Empty response. finishReason: ${finishReason}, blockReason: ${blockReason}, safetyRatings: ${safetyRatings}, structure: ${JSON.stringify(json).substring(0, 400)}`);
    throw new Error(`Gemini empty response (finish: ${finishReason}, block: ${blockReason})`);
  }
  // Parse grounding web sources from Gemini response
  let geminiWebSources: Array<{ url: string; title: string }> = [];
  try {
    const candidate = json.candidates?.[0];
    if (candidate?.groundingMetadata?.groundingChunks) {
      for (const chunk of candidate.groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) geminiWebSources.push({ url: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
      }
    }
    if (candidate?.groundingMetadata?.webSearchQueries) {
      console.log(`[MegaBot Gemini] Search queries used: ${candidate.groundingMetadata.webSearchQueries.join(", ")}`);
    }
  } catch {}
  if (geminiWebSources.length > 0) console.log(`[MegaBot Gemini] Found ${geminiWebSources.length} grounding sources`);

  const parsed = parseAgentResponse(raw, "Gemini");
  const data = normalizeKeys(unwrapAgentData(normalizeKeys(parsed)));
  console.log(`[MEGABOT DEBUG][Gemini] Top keys: ${Object.keys(data || {}).slice(0, 15).join(", ")}`);
  debugAgentShape("Gemini", data);
  return { data, raw, webSources: geminiWebSources };
}

const GROK_TIMEOUT = 60_000; // 60 seconds — generous for text-only

async function callGrok(
  prompt: string,
  _photoPath: string // unused — Grok uses text-only in MegaBot (other 3 agents analyze photos)
): Promise<{ data: any; raw: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("No XAI_API_KEY");
  const baseUrl = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
  // Text-only model: much faster, no photo upload overhead
  // OpenAI, Claude, and Gemini already analyze photos — Grok's strength is social/trending data
  const textModel = process.env.XAI_MODEL_TEXT || "grok-3-fast";

  const { signal, clear } = withTimeout(GROK_TIMEOUT);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: textModel,
        messages: [
          { role: "system", content: prompt + AGENT_SUFFIXES.grok },
          {
            role: "user",
            content: "Based on the detailed item description and context in the system prompt, provide your full assessment as JSON. Focus on social media buzz, viral potential, trending conversations, and unconventional buyer angles.",
          },
        ],
        max_tokens: 8192,
        temperature: 0.7,
      }),
      signal,
    });
    clear();

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Grok ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "";
    const parsed = parseAgentResponse(raw, "Grok");
    const data = normalizeKeys(unwrapAgentData(normalizeKeys(parsed)));
    data._grokMode = "text"; // Mark as text-analysis (not a fallback — intentional)
    console.log(`[MEGABOT DEBUG][Grok] Top keys: ${Object.keys(data || {}).slice(0, 15).join(", ")}`);
    debugAgentShape("Grok", data);
    return { data, raw };
  } catch (err: any) {
    clear();
    if (err.name === "AbortError") throw new Error("Grok timed out after 60s");
    throw err;
  }
}

// ─── Consensus builder ────────────────────────────────────────────────────

function buildConsensus(agents: MegaBotAgentResult[]): { consensus: any; agreementScore: number; summary: string } {
  const successful = agents.filter((a) => a.data && !a.error);
  if (successful.length === 0) {
    return { consensus: {}, agreementScore: 0, summary: "All agents failed." };
  }

  if (successful.length === 1) {
    return {
      consensus: successful[0].data,
      agreementScore: 100,
      summary: `Based on ${successful[0].provider} analysis.`,
    };
  }

  // Merge: for any numeric field, average; for strings pick longest; for arrays union
  const merged: any = {};
  const allKeys = new Set<string>();
  for (const a of successful) {
    if (a.data && typeof a.data === "object") {
      for (const k of Object.keys(a.data)) allKeys.add(k);
    }
  }

  // Fields that represent factual agreement (short, categorical) — NOT long-form text
  const AGREEMENT_FIELDS = new Set([
    "item_name", "category", "subcategory", "brand", "manufacturer", "maker",
    "material", "materials", "era", "period", "style", "origin", "country_of_origin",
    "condition_score", "overall_score", "cosmetic_score", "functional_score",
    "condition_guess", "condition_label", "is_antique", "completeness",
    "estimated_value_low", "estimated_value_mid", "estimated_value_high",
    "confidence", "pricing_confidence",
  ]);

  // Fuzzy word-overlap agreement for short strings
  function fuzzyAgree(strs: string[]): boolean {
    const normalized = strs.map(s => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim());
    // Extract significant words (3+ chars) from first value
    const words0 = normalized[0].split(" ").filter(w => w.length >= 3);
    if (words0.length === 0) return normalized.every(n => n === normalized[0]);
    // Count words shared by ALL values
    const shared = words0.filter(w => normalized.every(n => n.includes(w)));
    return shared.length / words0.length >= 0.4;
  }

  let agreeCount = 0;
  let totalChecks = 0;

  for (const key of allKeys) {
    const values = successful.map((a) => a.data?.[key]).filter((v) => v != null);
    if (values.length === 0) continue;

    const first = values[0];
    if (typeof first === "number") {
      const nums = values.filter((v): v is number => typeof v === "number");
      merged[key] = Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 100) / 100;
      if (nums.length >= 2 && AGREEMENT_FIELDS.has(key)) {
        totalChecks++;
        const max = Math.max(...nums);
        const min = Math.min(...nums);
        if (max === 0 || (max - min) / Math.max(max, 1) <= 0.25) agreeCount++;
      }
    } else if (typeof first === "string") {
      const strs = values.filter((v): v is string => typeof v === "string");
      merged[key] = strs.sort((a, b) => b.length - a.length)[0];
      // Only check agreement on short factual fields, not long-form text
      if (strs.length >= 2 && AGREEMENT_FIELDS.has(key)) {
        totalChecks++;
        if (fuzzyAgree(strs)) agreeCount++;
      }
    } else if (Array.isArray(first)) {
      const seen = new Set<string>();
      const result: any[] = [];
      for (const v of values) {
        if (Array.isArray(v)) {
          for (const item of v) {
            const k = typeof item === "string" ? item.toLowerCase() : JSON.stringify(item);
            if (!seen.has(k)) { seen.add(k); result.push(item); }
          }
        }
      }
      merged[key] = result;
    } else if (typeof first === "object" && first !== null) {
      const objs = values.filter((v) => typeof v === "object" && v !== null);
      merged[key] = objs.sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)[0];
    } else if (typeof first === "boolean") {
      const bools = values.filter((v): v is boolean => typeof v === "boolean");
      merged[key] = bools.filter(Boolean).length >= bools.length / 2;
    } else {
      merged[key] = first;
    }
  }

  // Secondary structured agreement: extract key fields from flat+nested locations per agent
  function extractFactualField(agentData: any, ...keys: string[]): string | number | null {
    if (!agentData) return null;
    for (const k of keys) {
      if (agentData[k] != null && agentData[k] !== "" && agentData[k] !== "Unknown") return agentData[k];
    }
    // Check inside common nested objects
    const wrappers = ["identification", "condition", "condition_assessment", "pricing", "valuation"];
    for (const w of wrappers) {
      const sub = agentData[w];
      if (sub && typeof sub === "object") {
        for (const k of keys) {
          if (sub[k] != null && sub[k] !== "" && sub[k] !== "Unknown") return sub[k];
        }
      }
    }
    return null;
  }

  const STRUCTURED_CHECKS: { keys: string[]; type: "fuzzy" | "numeric" }[] = [
    { keys: ["category"], type: "fuzzy" },
    { keys: ["brand", "manufacturer", "maker"], type: "fuzzy" },
    { keys: ["material", "materials"], type: "fuzzy" },
    { keys: ["era", "period"], type: "fuzzy" },
    { keys: ["item_name", "name"], type: "fuzzy" },
    { keys: ["condition_score", "overall_score", "score"], type: "numeric" },
    { keys: ["condition_cosmetic", "cosmetic_score"], type: "numeric" },
    { keys: ["condition_functional", "functional_score"], type: "numeric" },
    { keys: ["is_antique"], type: "fuzzy" },
  ];

  for (const check of STRUCTURED_CHECKS) {
    const vals = successful
      .map(a => extractFactualField(a.data, ...check.keys))
      .filter(v => v != null);
    if (vals.length < 2) continue;
    totalChecks++;
    if (check.type === "numeric") {
      const nums = vals.map(v => Number(v)).filter(n => !isNaN(n));
      if (nums.length >= 2) {
        const max = Math.max(...nums);
        const min = Math.min(...nums);
        if (max === 0 || (max - min) / Math.max(max, 1) <= 0.25) agreeCount++;
      }
    } else {
      const strs = vals.map(v => String(v));
      if (fuzzyAgree(strs)) agreeCount++;
    }
  }

  const agreementScore = totalChecks > 0 ? Math.round((agreeCount / totalChecks) * 100) : 75;

  const summaries = successful
    .map((a) => a.data?.executive_summary)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
  const summary = summaries.length > 0
    ? summaries.sort((a, b) => b.length - a.length)[0]
    : `${successful.length} AI agents analyzed this item with ${agreementScore}% agreement.`;

  return { consensus: merged, agreementScore, summary };
}

// ─── Main entry point ─────────────────────────────────────────────────────

export async function runSpecializedMegaBot(
  botType: string,
  prompt: string,
  photoPublicUrl: string,
  itemId: string
): Promise<MegaBotResult> {
  const absPath = publicUrlToAbsPath(photoPublicUrl);

  const agentCalls = [
    { provider: "openai" as const, fn: callOpenAI },
    { provider: "claude" as const, fn: callClaude },
    { provider: "gemini" as const, fn: callGemini },
    { provider: "grok" as const, fn: callGrok },
  ];

  const results = await Promise.allSettled(
    agentCalls.map(async ({ provider, fn }) => {
      const agentStart = Date.now();
      try {
        const { data, raw } = await fn(prompt, absPath);
        return {
          provider,
          data,
          raw,
          responseTime: Date.now() - agentStart,
        } as MegaBotAgentResult;
      } catch (err: any) {
        return {
          provider,
          data: null,
          responseTime: Date.now() - agentStart,
          error: err.message || "Unknown error",
        } as MegaBotAgentResult;
      }
    })
  );

  const agentResults: MegaBotAgentResult[] = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { provider: agentCalls[i].provider, data: null, responseTime: 0, error: "Promise rejected" }
  );

  const agents = {
    openai: agentResults.find((a) => a.provider === "openai") ?? null,
    claude: agentResults.find((a) => a.provider === "claude") ?? null,
    gemini: agentResults.find((a) => a.provider === "gemini") ?? null,
    grok: agentResults.find((a) => a.provider === "grok") ?? null,
  };

  const successCount = agentResults.filter((a) => a.data && !a.error).length;
  const failCount = agentResults.filter((a) => a.error).length;

  const { consensus, agreementScore, summary } = buildConsensus(agentResults);

  return {
    botType,
    itemId,
    timestamp: new Date().toISOString(),
    agents,
    successCount,
    failCount,
    consensus,
    agreementScore,
    summary,
  };
}
