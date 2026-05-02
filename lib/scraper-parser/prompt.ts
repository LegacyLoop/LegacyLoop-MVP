/**
 * CMD-CYLINDER-7B-OLLAMA-GATEWAY-PARSE V18: inline prompt.
 * llama-3.2-local 3B parameter target · structured JSON output.
 * V2 banked: migrate to lib/bots/skills/scraper_parser/ skill packs.
 */

export const SYSTEM_PROMPT = `You are a scraper-output parser for LegacyLoop, a US resale platform.
Your job is to take raw scraper output (HTML or pre-parsed fields from Apify)
and produce a single clean JSON object describing the item plus an array of
comparable sales found in the scrape.

CRITICAL OUTPUT RULES:
- Return ONLY a single JSON object. No markdown. No code fences. No prose.
- Output schema is FIXED — do not add fields, do not omit fields.
- For unknown fields use null, never omit.
- parseConfidence: 0-100 integer. Self-assess based on data clarity.
  - 90+: clean Apify parsedFields with all fields present
  - 60-89: some fields inferred from context
  - 30-59: heavy guessing
  - <30: nearly unparseable
`;

export function buildUserPrompt(input: {
  scraperId: string;
  platform: string;
  itemUrl: string;
  rawHtml?: string | null;
  parsedFields?: Record<string, unknown>;
}): string {
  const blocks: string[] = [
    `SCRAPER ID: ${input.scraperId}`,
    `PLATFORM: ${input.platform}`,
    `ITEM URL: ${input.itemUrl}`,
  ];
  if (input.parsedFields) {
    blocks.push(
      `PARSED FIELDS (Apify pre-parsed):\n${JSON.stringify(input.parsedFields, null, 2)}`
    );
  }
  if (input.rawHtml) {
    // Truncate to 8000 chars · 3B param model context is limited
    const truncated =
      input.rawHtml.length > 8000
        ? input.rawHtml.slice(0, 8000) + "\n[... truncated ...]"
        : input.rawHtml;
    blocks.push(`RAW HTML:\n${truncated}`);
  }

  blocks.push(`
Return JSON matching this exact shape:
{
  "title": "string · item title",
  "description": "string | null · item description",
  "priceUsd": "number | null · listed/asking price USD",
  "soldPrice": "number | null · realized sale price USD if sold",
  "condition": "string | null · Mint | Near Mint | Excellent | Very Good | Good | Fair | Poor",
  "category": "string | null · Furniture | Electronics | Jewelry | etc.",
  "keywords": ["string"],
  "imageUrls": ["string"],
  "metadata": { "year": null, "brand": null, "model": null },
  "parsedComps": [
    { "item": "string", "price": number, "date": "YYYY-MM-DD", "platform": "string", "condition": "string", "url": "string | optional", "location": "string | null" }
  ],
  "parseConfidence": 75
}`);

  return blocks.join("\n\n");
}
