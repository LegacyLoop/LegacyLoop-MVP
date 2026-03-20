import { NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { suggestPackage } from "@/lib/shipping/package-suggestions";
import { getMetroEstimates } from "@/lib/shipping/metro-estimates";

export async function GET() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.item.findMany({
      where: { userId: user.id },
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        aiResult: true,
        valuation: true,
        shipmentLabels: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true, carrier: true, trackingNumber: true, status: true,
            rate: true, estimatedDays: true, deliveryMethod: true, createdAt: true,
            fromAddressJson: true, toAddressJson: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Batch-fetch all shipping quotes from EventLog
    const itemIds = items.map(i => i.id);
    const quoteEvents = itemIds.length > 0
      ? await prisma.eventLog.findMany({
          where: { itemId: { in: itemIds }, eventType: "SHIPPING_QUOTED" },
          orderBy: { createdAt: "desc" },
        }).catch(() => [])
      : [];

    // Group quotes by itemId — most recent first + quote history (last 5)
    const quoteMap = new Map<string, any>();
    const quoteHistoryMap = new Map<string, any[]>();
    for (const ev of quoteEvents) {
      if (!quoteMap.has(ev.itemId)) {
        try { quoteMap.set(ev.itemId, { ...JSON.parse(ev.payload ?? "{}"), quotedAt: ev.createdAt.toISOString() }); } catch {}
      }
      const arr = quoteHistoryMap.get(ev.itemId) || [];
      if (arr.length < 5) {
        try { arr.push({ ...JSON.parse(ev.payload ?? "{}"), quotedAt: ev.createdAt.toISOString() }); } catch {}
      }
      quoteHistoryMap.set(ev.itemId, arr);
    }

    // Batch fetch selected quotes
    const selectedEvents = itemIds.length > 0
      ? await prisma.eventLog.findMany({
          where: { itemId: { in: itemIds }, eventType: "SHIPPING_QUOTE_SELECTED" },
          orderBy: { createdAt: "desc" },
        }).catch(() => [])
      : [];
    const selectedMap = new Map<string, any>();
    for (const ev of selectedEvents) {
      if (!selectedMap.has(ev.itemId)) {
        try {
          const p = JSON.parse(ev.payload ?? "{}");
          const hrs = (Date.now() - new Date(ev.createdAt).getTime()) / 3600000;
          selectedMap.set(ev.itemId, { ...p, selectedAt: ev.createdAt.toISOString(), isExpired: hrs > 24, hoursAgo: Math.round(hrs) });
        } catch {}
      }
    }

    const preSale: any[] = [];
    const readyToShip: any[] = [];
    const shipped: any[] = [];

    for (const item of items) {
      const ai = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;
      const label = item.shipmentLabels[0];
      const aiShipping = ai?.shipping_profile ?? ai?.dimensions_estimate ?? null;
      const category = ai?.category ?? null;
      const material = ai?.material ?? null;

      // Build dimension string that parseDimensions() regex can match
      let aiDimString: string | null = null;
      if (aiShipping) {
        const dims = [aiShipping.length, aiShipping.width, aiShipping.height]
          .filter((d: any) => d != null && Number(d) > 0);
        if (dims.length === 3) aiDimString = dims.join(" x ");
      }
      if (!aiDimString && ai?.dimensions) aiDimString = String(ai.dimensions);

      // AI package suggestion (from locked lib — import only)
      let pkgSuggestion: any = null;
      try {
        pkgSuggestion = suggestPackage(
          category,
          aiDimString,
          material,
          (item as any).shippingWeight ?? aiShipping?.weight ?? null,
          ai?.shipping_notes ?? null,
        );
      } catch {}

      const hasSavedDims = !!((item as any).shippingWeight || (item as any).shippingLength);
      const hasAiProfile = !!(aiShipping || pkgSuggestion);
      const lastQuote = quoteMap.get(item.id) ?? null;
      const hasLabel = !!label;

      // Shipping stage
      let shippingStage = "NO_PROFILE";
      if (hasLabel && ["SHIPPED", "COMPLETED"].includes(item.status)) {
        shippingStage = label.status === "DELIVERED" ? "DELIVERED" : "SHIPPED";
      } else if (hasLabel) shippingStage = "LABEL_GENERATED";
      else if (lastQuote) shippingStage = "QUOTED";
      else if (hasSavedDims) shippingStage = "HAS_DIMS";
      else if (hasAiProfile) shippingStage = "HAS_AI";

      // Urgency for sold items
      const soldAt = item.status === "SOLD" ? (item as any).updatedAt : null;
      const daysSinceSold = soldAt ? Math.floor((Date.now() - new Date(soldAt).getTime()) / 86400000) : 0;
      const urgencyLevel = daysSinceSold > 5 ? "urgent" : daysSinceSold > 2 ? "warn" : "ok";

      // Enrichment: antique, condition, value flags
      const valMid = item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : 0;
      const isAntique = ai?.is_antique === true || (ai?.antiqueScore ?? 0) > 50 || ai?.isAntique === true;
      const conditionScore = ai?.conditionScore ?? ai?.condition_score ?? null;
      const isHighValue = valMid > 500;
      const isPremium = valMid > 2000;

      const base = {
        id: item.id,
        title: item.title || ai?.item_name || `Item #${item.id.slice(0, 6)}`,
        photo: item.photos[0]?.filePath ?? null,
        status: item.status,
        weight: (item as any).shippingWeight ?? null,
        length: (item as any).shippingLength ?? null,
        width: (item as any).shippingWidth ?? null,
        height: (item as any).shippingHeight ?? null,
        isFragile: (item as any).isFragile ?? false,
        saleMethod: (item as any).saleMethod ?? null,
        category,
        aiShipping,
        // AI package suggestion
        aiBox: pkgSuggestion?.boxSize ?? null,
        aiBoxLabel: pkgSuggestion?.label ?? null,
        aiBoxDims: pkgSuggestion ? { length: pkgSuggestion.length, width: pkgSuggestion.width, height: pkgSuggestion.height } : null,
        aiEstWeight: pkgSuggestion?.weightEstimate ?? aiShipping?.weight ?? null,
        aiPackingTips: pkgSuggestion?.notes ?? [],
        selectedQuote: selectedMap.get(item.id) ?? null,
        // Shipping intelligence
        shippingStage,
        hasSavedDims,
        hasAiProfile,
        hasQuote: !!lastQuote,
        lastQuote: lastQuote ? {
          cheapest: lastQuote.cheapest,
          carriers: lastQuote.carriers,
          weight: lastQuote.weight,
          box: lastQuote.box,
          quotedAt: lastQuote.quotedAt,
        } : null,
        // Enrichment data
        isAntique,
        conditionScore,
        isHighValue,
        isPremium,
        pickupStatus: (item as any).pickupStatus ?? null,
        // Quote history (last 5)
        quoteHistory: quoteHistoryMap.get(item.id) ?? [],
      };

      if (label && ["SHIPPED", "COMPLETED"].includes(item.status)) {
        const safeAddr = (s: string | null) => { if (!s) return null; try { return JSON.parse(s); } catch { return null; } };
        const fromAddress = safeAddr(label.fromAddressJson);
        const toAddress = safeAddr(label.toAddressJson);
        shipped.push({ ...base, carrier: label.carrier, trackingNumber: label.trackingNumber, labelId: label.id, shipDate: label.createdAt.toISOString().slice(0, 10), estimatedDays: label.estimatedDays, deliveryStatus: label.status, deliveryMethod: label.deliveryMethod, rate: label.rate, fromAddress, toAddress });
      } else if (item.status === "SOLD") {
        readyToShip.push({ ...base, listingPrice: (item as any).listingPrice ?? null, soldPrice: (item as any).soldPrice ?? null, soldAt: soldAt?.toISOString() ?? null, daysSinceSold, urgencyLevel, valuationMid: item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : null });
      } else if (["ANALYZED", "READY", "LISTED", "INTERESTED"].includes(item.status)) {
        preSale.push({
          ...base,
          valuationLow: item.valuation?.low ?? null,
          valuationHigh: item.valuation?.high ?? null,
          valuationMid: item.valuation ? Math.round((item.valuation.low + item.valuation.high) / 2) : null,
          metroEstimates: (() => {
            const actualWeight = (item as any).shippingWeight ?? pkgSuggestion?.weightEstimate ?? 5;
            const metros = getMetroEstimates(item.saleZip || "04101", actualWeight);
            // Add realistic weight + distance variation
            return metros.map(m => ({
              ...m,
              estimatedCost: Math.round(
                (m.estimatedCost + (actualWeight * 0.5) + ((m.estimatedDays ?? 3) * 1.5)) * 100
              ) / 100,
            }));
          })(),
        });
      }
    }

    return NextResponse.json({ preSale, readyToShip, shipped });
  } catch (e) {
    console.error("[shipping/center] error:", e);
    return NextResponse.json({ error: "Failed to fetch shipping data" }, { status: 500 });
  }
}
