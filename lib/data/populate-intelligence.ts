/**
 * Data Foundation — Forward-Looking Intelligence Populator
 *
 * Called after bot runs to populate structured fields on Item.
 * Also creates PriceSnapshot records for pricing history.
 *
 * All functions: fire-and-forget, try/catch, never throw.
 */

import { prisma } from "@/lib/db";

/**
 * Populate structured Item fields from AI analysis output.
 * Only updates fields that are currently null.
 */
export async function populateFromAnalysis(
  itemId: string,
  aiResult: Record<string, unknown>
): Promise<void> {
  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        category: true,
        brand: true,
        era: true,
        material: true,
        maker: true,
        itemStyle: true,
        countryOfOrigin: true,
        conditionGrade: true,
      },
    });
    if (!item) return;

    const updates: Record<string, string> = {};

    if (!item.category && aiResult.category) updates.category = String(aiResult.category);
    if (!item.brand && aiResult.brand) updates.brand = String(aiResult.brand);
    if (!item.era && aiResult.era) updates.era = String(aiResult.era);
    if (!item.material && aiResult.material) updates.material = String(aiResult.material);
    if (!item.maker && aiResult.maker) updates.maker = String(aiResult.maker);
    if (!item.itemStyle && aiResult.style) updates.itemStyle = String(aiResult.style);
    if (!item.countryOfOrigin && aiResult.country_of_origin) updates.countryOfOrigin = String(aiResult.country_of_origin);
    if (!item.conditionGrade && aiResult.condition_guess) updates.conditionGrade = String(aiResult.condition_guess);

    if (Object.keys(updates).length > 0) {
      await prisma.item.update({ where: { id: itemId }, data: updates });
      console.log(`[populate] Updated ${Object.keys(updates).length} intelligence fields for item ${itemId}`);
    }

    // ─── AI Shipping Intelligence ───────────────────────────────────
    const shippingUpdates: Record<string, unknown> = {};

    const aiWeight = aiResult.weight_estimate_lbs;
    if (aiWeight && typeof aiWeight === "number" && (aiWeight as number) > 0) {
      shippingUpdates.aiWeightLbs = Math.round((aiWeight as number) * 10) / 10;
    }

    const aiDims = aiResult.dimensions_estimate;
    if (aiDims && typeof aiDims === "string" && (aiDims as string).length > 2) {
      shippingUpdates.aiDimsEstimate = aiDims as string;
      const dimMatch = (aiDims as string).match(/(\d+(?:\.\d+)?)\s*[x\u00D7X]\s*(\d+(?:\.\d+)?)\s*[x\u00D7X]\s*(\d+(?:\.\d+)?)/);
      if (dimMatch) {
        shippingUpdates.shippingLength = parseFloat(dimMatch[1]);
        shippingUpdates.shippingWidth = parseFloat(dimMatch[2]);
        shippingUpdates.shippingHeight = parseFloat(dimMatch[3]);
      }
    }

    const aiDifficulty = aiResult.shipping_difficulty;
    if (aiDifficulty && typeof aiDifficulty === "string") {
      shippingUpdates.aiShippingDifficulty = aiDifficulty as string;
      if (aiDifficulty === "Difficult") shippingUpdates.isFragile = true;
    }

    const aiNotes = aiResult.shipping_notes;
    if (aiNotes && typeof aiNotes === "string" && (aiNotes as string).length > 3) {
      shippingUpdates.aiShippingNotes = aiNotes as string;
    }

    const confidence = aiResult.confidence;
    if (confidence && typeof confidence === "number") {
      shippingUpdates.aiShippingConfidence = Math.round((confidence as number) * 100) / 100;
    }

    // Only fill empty fields — NEVER override user-entered data
    if (Object.keys(shippingUpdates).length > 0) {
      const existing = await prisma.item.findUnique({
        where: { id: itemId },
        select: { shippingWeight: true, shippingLength: true, isFragile: true },
      });
      if (shippingUpdates.aiWeightLbs && !existing?.shippingWeight) {
        shippingUpdates.shippingWeight = shippingUpdates.aiWeightLbs;
      }
      if (existing?.shippingLength) {
        delete shippingUpdates.shippingLength;
        delete shippingUpdates.shippingWidth;
        delete shippingUpdates.shippingHeight;
      }
      if (existing?.isFragile) delete shippingUpdates.isFragile;

      await prisma.item.update({ where: { id: itemId }, data: shippingUpdates });
      console.log(`[shipping-intel] Persisted for ${itemId}:`,
        Object.entries(shippingUpdates).map(([k, v]) => `${k}=${v}`).join(", "));
    }
  } catch (err: any) {
    console.error(`[populate] populateFromAnalysis failed for ${itemId}:`, err.message || err);
  }
}

/**
 * Create a PriceSnapshot from PriceBot results.
 */
export async function populateFromPriceBot(
  itemId: string,
  priceBotPayload: Record<string, unknown>
): Promise<void> {
  try {
    const pv = (priceBotPayload.price_validation || {}) as Record<string, unknown>;

    await prisma.priceSnapshot.create({
      data: {
        itemId,
        source: "PRICEBOT",
        priceLow: pv.revised_low != null ? Math.round(Number(pv.revised_low)) : null,
        priceHigh: pv.revised_high != null ? Math.round(Number(pv.revised_high)) : null,
        priceMedian: pv.revised_mid != null ? Math.round(Number(pv.revised_mid)) : null,
        confidence: priceBotPayload.data_quality ? String(priceBotPayload.data_quality).slice(0, 200) : null,
      },
    });
    console.log(`[populate] PriceSnapshot PRICEBOT created for item ${itemId}`);
  } catch (err: any) {
    console.error(`[populate] populateFromPriceBot failed for ${itemId}:`, err.message || err);
  }
}

/**
 * Create a PriceSnapshot from Rainforest/Amazon results.
 */
export async function populateFromRainforest(
  itemId: string,
  rainforestPayload: Record<string, unknown>
): Promise<void> {
  try {
    const pr = (rainforestPayload.priceRange || {}) as Record<string, unknown>;
    if (!pr.low && !pr.high) return;

    await prisma.priceSnapshot.create({
      data: {
        itemId,
        source: "RAINFOREST",
        priceLow: pr.low != null ? Math.round(Number(pr.low)) : null,
        priceHigh: pr.high != null ? Math.round(Number(pr.high)) : null,
        priceMedian: pr.avg != null ? Math.round(Number(pr.avg)) : null,
        confidence: rainforestPayload.resultCount ? `${rainforestPayload.resultCount} Amazon listings` : null,
      },
    });
    console.log(`[populate] PriceSnapshot RAINFOREST created for item ${itemId}`);
  } catch (err: any) {
    console.error(`[populate] populateFromRainforest failed for ${itemId}:`, err.message || err);
  }
}

/**
 * Record the actual sold price when an item is marked SOLD.
 */
export async function populateSoldPrice(
  itemId: string,
  soldPrice: number,
  soldAt: Date
): Promise<void> {
  try {
    await prisma.item.update({
      where: { id: itemId },
      data: {
        soldPrice: Math.round(soldPrice),
        soldAt,
      },
    });
    console.log(`[populate] Sold price $${soldPrice} recorded for item ${itemId}`);
  } catch (err: any) {
    console.error(`[populate] populateSoldPrice failed for ${itemId}:`, err.message || err);
  }
}
