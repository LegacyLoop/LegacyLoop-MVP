import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { FEATURES } from "@/lib/feature-flags";

function buildDemoListing(aiData: any, item: any) {
  const name = aiData?.item_name || item.title || "Item";
  const brand = aiData?.brand || "";
  const model = aiData?.model || "";
  const category = aiData?.category || "General";
  const condition = aiData?.condition_guess || item.condition || "Good";
  const keywords = Array.isArray(aiData?.keywords) ? aiData.keywords : [];
  const notes = aiData?.notes || "";

  const titleParts = [brand, model, name].filter(Boolean);
  const title = titleParts.join(" ") + ` — ${condition} Condition`;

  const description = [
    `${name} in ${condition.toLowerCase()} condition.`,
    brand ? `Brand: ${brand}.` : "",
    model ? `Model: ${model}.` : "",
    notes ? notes : "",
    "Smoke-free home. Ships within 2 business days of purchase.",
    "Message me with any questions!",
  ].filter(Boolean).join(" ");

  const tags = [category, ...keywords.slice(0, 8)].map((t) => t.toLowerCase().replace(/\s+/g, "-"));

  return {
    title: title.slice(0, 80),
    description,
    tags,
    keywords: keywords.slice(0, 12),
    category,
    readinessScore: Math.min(95, 60 + keywords.length * 3 + (brand ? 10 : 0) + (notes ? 10 : 0)),
    tips: [
      keywords.length < 5 ? "Add more keywords to improve search visibility" : null,
      !brand ? "Include the brand name for better discoverability" : null,
      "Use all available photo slots — listings with 4+ photos sell 2x faster",
    ].filter(Boolean),
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await req.json();
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { aiResult: true, valuation: true, photos: true },
    });

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const aiData = item.aiResult?.rawJson ? (() => { try { return JSON.parse(item.aiResult!.rawJson); } catch { return null; } })() : null;

    // If live AI is available and we have data, we could call OpenAI for a better listing
    // For now, use intelligent template-based generation
    const listing = buildDemoListing(aiData, item);

    // Add pricing context if available
    const valuation = item.valuation as any;
    if (valuation) {
      listing.description += ` Priced competitively based on market analysis.`;
    }

    return NextResponse.json({ listing, itemId });
  } catch (e) {
    console.error("[listing/generate] error:", e);
    return NextResponse.json({ error: "Failed to generate listing" }, { status: 500 });
  }
}
