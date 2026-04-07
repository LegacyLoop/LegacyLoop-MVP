/**
 * lib/bots/web-search-prepass.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared OpenAI web_search_preview pre-pass for bots that benefit
 * from real-time market data.
 *
 * Used by ListBot + PriceBot today (Step 4.6). Future bots that
 * want web enrichment can call this once before their primary AI
 * call. Cost: ~$0.003 per call (1 OpenAI request).
 *
 * STEP 4.6 — RYAN-APPROVED: re-add web search to ListBot AND
 * PriceBot after Step 3 removed it from ListBot for the hybrid path.
 *
 * Returns:
 *   • webEnrichment — text block to inject into the system prompt
 *   • webSources    — citations array to attach to the response payload
 * ─────────────────────────────────────────────────────────────────
 */

import OpenAI from "openai";

export interface WebSearchPrepassResult {
  webEnrichment: string;
  webSources: Array<{ url: string; title: string }>;
}

export async function runWebSearchPrepass(
  openai: OpenAI | null,
  itemName: string,
  category: string,
  sellerZip: string,
): Promise<WebSearchPrepassResult> {
  const empty: WebSearchPrepassResult = { webEnrichment: "", webSources: [] };
  if (!openai) return empty;

  try {
    const webRes = await openai.responses.create(
      {
        model: "gpt-4o-mini",
        instructions:
          "You are a web research assistant. Find current resale listings, " +
          "recent sale prices, and platform demand for the item. Return JSON: " +
          '{ "summary": "2-3 sentences", "hot_keywords": ["..."], ' +
          '"price_signals": "...", "trending_platforms": ["..."] }',
        input:
          `Find current resale market data for: ${itemName} (${category}). ` +
          `Seller is in ${sellerZip}.`,
        tools: [{ type: "web_search_preview" } as any],
        max_output_tokens: 2048,
      },
      { signal: AbortSignal.timeout(30_000) },
    );

    const text =
      typeof webRes.output === "string"
        ? webRes.output
        : webRes.output_text || "";

    let webEnrichment = "";
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const parsed = JSON.parse(m[0]);
        webEnrichment =
          `\n\n[REAL-TIME WEB INTELLIGENCE — ${new Date().toISOString().slice(0, 10)}]\n` +
          `Market summary: ${parsed.summary || "n/a"}\n` +
          `Hot keywords buyers use: ${(parsed.hot_keywords || []).join(", ")}\n` +
          `Price signals: ${parsed.price_signals || "stable"}\n` +
          `Trending platforms: ${(parsed.trending_platforms || []).join(", ")}\n`;
      } catch {
        /* parse failure non-critical */
      }
    }

    // Citation extraction — handle both response shapes
    const webSources: Array<{ url: string; title: string }> = [];
    const outputArr = Array.isArray(webRes.output) ? webRes.output : [];
    for (const outItem of outputArr) {
      const o = outItem as any;
      if (o.type === "web_search_call" && Array.isArray(o.results)) {
        for (const r of o.results) {
          if (r.url && r.title) webSources.push({ url: r.url, title: r.title });
        }
      }
      if (o.type === "message" && Array.isArray(o.content)) {
        for (const c of o.content) {
          if (c.annotations) {
            for (const ann of c.annotations) {
              if (ann.type === "url_citation" && ann.url) {
                webSources.push({ url: ann.url, title: ann.title || ann.url });
              }
            }
          }
        }
      }
    }

    return { webEnrichment, webSources };
  } catch (webErr) {
    console.warn("[web-search-prepass] failed (non-critical):", webErr);
    return empty;
  }
}
