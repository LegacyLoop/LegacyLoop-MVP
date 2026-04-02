/**
 * Item → Square CatalogObject Mapper
 * Pure TypeScript mapping layer — no API calls, no DB access.
 * Maps LegacyLoop Item fields to Square Catalog API schema.
 */

import type { Item, ItemPhoto, AiResult, Valuation, AntiqueCheck, Project } from "@prisma/client";

// ── Square Catalog Types ──────────────────────────────────────────

export interface SquareMoney {
  amount: number; // cents (bigint in Square, number here for simplicity)
  currency: string; // "USD"
}

export interface SquareItemVariation {
  id: string;
  type: "ITEM_VARIATION";
  itemVariationData: {
    name: string;
    priceMoney: SquareMoney;
    sku?: string;
  };
}

export interface SquareCatalogItem {
  id: string;
  type: "ITEM";
  itemData: {
    name: string;
    description: string;
    categoryId: string | null;
    variations: SquareItemVariation[];
    imageIds: string[];
  };
}

export interface SquareCatalogCategory {
  id: string;
  type: "CATEGORY";
  categoryData: {
    name: string;
  };
}

export interface CatalogSyncResult {
  itemId: string;
  success: boolean;
  squareCatalogId?: string;
  error?: string;
  syncedAt: string;
}

// ── Type for item with relations ──────────────────────────────────

export type ItemWithRelations = Item & {
  photos?: ItemPhoto[];
  aiResult?: AiResult | null;
  valuation?: Valuation | null;
  antiqueCheck?: AntiqueCheck | null;
  project?: Project | null;
};

// ── Helpers ───────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function dollarsToCents(dollars: number | null | undefined): number {
  if (dollars == null || isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}

function generateIdempotencyKey(prefix: string, id: string): string {
  return `${prefix}_${id}_${Date.now()}`;
}

// ── Mappers ───────────────────────────────────────────────────────

export function mapItemToCatalog(item: ItemWithRelations): SquareCatalogItem {
  let ai: Record<string, any> = {};
  if (item.aiResult?.rawJson) {
    try { ai = JSON.parse(item.aiResult.rawJson); } catch { /* empty */ }
  }

  const name = item.title || (ai.item_name as string) || "Untitled Item";
  const description = item.description || (ai.recommended_description as string) || "";
  const category = (ai.category as string) || null;
  const price = item.listingPrice ?? (item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : 0);
  const condition = item.condition || (ai.condition_guess as string) || "Good";

  const variation: SquareItemVariation = {
    id: generateIdempotencyKey("var", item.id),
    type: "ITEM_VARIATION",
    itemVariationData: {
      name: `${condition} Condition`,
      priceMoney: { amount: dollarsToCents(price), currency: "USD" },
      sku: item.id.slice(0, 12),
    },
  };

  return {
    id: generateIdempotencyKey("item", item.id),
    type: "ITEM",
    itemData: {
      name: name.slice(0, 255),
      description: description.slice(0, 4096),
      categoryId: category ? slugify(category) : null,
      variations: [variation],
      imageIds: (item.photos || []).map((p) => p.filePath),
    },
  };
}

export function mapProjectToCatalogCategory(project: Project): SquareCatalogCategory {
  return {
    id: generateIdempotencyKey("cat", project.id),
    type: "CATEGORY",
    categoryData: {
      name: project.name,
    },
  };
}

export function buildBatchUpsertPayload(items: ItemWithRelations[]): {
  idempotencyKey: string;
  batches: { objects: SquareCatalogItem[] }[];
} {
  const catalogItems = items.map(mapItemToCatalog);
  // Square batch limit is 1000 objects per batch
  const batchSize = 1000;
  const batches: { objects: SquareCatalogItem[] }[] = [];
  for (let i = 0; i < catalogItems.length; i += batchSize) {
    batches.push({ objects: catalogItems.slice(i, i + batchSize) });
  }
  return {
    idempotencyKey: generateIdempotencyKey("batch", String(Date.now())),
    batches,
  };
}
