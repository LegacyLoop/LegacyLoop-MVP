import type { MarketComp } from "@/lib/market-intelligence/types";

/**
 * CMD-CYLINDER-7B-OLLAMA-GATEWAY-PARSE V18: parser output contract.
 * Mirrors ScraperComp fields (prisma/schema.prisma:1232-1262) so
 * Cyl 7C can upsert directly. parsedComps fan-out feeds 7C's
 * MarketComp -> ScraperComp many-to-one persist loop.
 */
export interface ScraperParsedItem {
  // Direct ScraperComp upsert fields
  slug: string;
  sourceUrl: string;
  sourcePlatform: string;
  title: string;
  description: string | null;
  priceUsd: number | null;
  soldPrice: number | null;
  condition: string | null;
  category: string | null;
  keywordsJson: string | null;
  imageUrlsJson: string | null;
  metadataJson: string | null;

  // Comp fan-out for 7C
  parsedComps: MarketComp[];

  // Provenance (telemetry only · NOT persisted to ScraperComp)
  parsedByModel: "llama-3.2-local";
  parsedAt: string;
  parseDurationMs: number;
  parseConfidence: number; // 0-100
}

export interface ParseError {
  slug: string;
  attempts: number;
  lastError: string;
  totalDurationMs: number;
}

export interface ParseInput {
  scraperId: string; // → slug
  platform: string;
  itemUrl: string;
  rawHtml?: string | null;
  parsedFields?: Record<string, unknown>;
}
