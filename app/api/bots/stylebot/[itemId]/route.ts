import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/bot-mode";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const log = await prisma.eventLog.findFirst({
    where: { itemId, eventType: "STYLEBOT_RESULT" },
    orderBy: { createdAt: "desc" },
  });

  if (!log) {
    return NextResponse.json({ hasResult: false });
  }

  let result = null;
  try { result = log.payload ? JSON.parse(log.payload) : null; } catch { /* ignore */ }

  return NextResponse.json({ hasResult: true, result, createdAt: log.createdAt });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await authAdapter.getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { aiResult: true, valuation: true, antiqueCheck: true, photos: { orderBy: { order: "asc" }, take: 10 } },
  });
  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let ai: Record<string, any> = {};
  if (item.aiResult?.rawJson) {
    try { ai = JSON.parse(item.aiResult.rawJson); } catch { /* use empty */ }
  }

  const photoCount = item.photos.length;
  const hasMultiplePhotos = photoCount >= 3;
  const hasPrimarySet = item.photos.some((p: any) => p.isPrimary);

  // Presentation Score
  const rawPhotoScore = ai.photo_quality_score ?? 5;
  const quantityBonus = photoCount >= 6 ? 15 : photoCount >= 4 ? 10 : photoCount >= 2 ? 5 : 0;
  const primaryBonus = hasPrimarySet ? 5 : 0;
  const presentationScore = Math.min(100, Math.round(rawPhotoScore * 10 + quantityBonus + primaryBonus));

  const photoTips: string[] = [];
  if (ai.photo_improvement_tips?.length) photoTips.push(...ai.photo_improvement_tips);
  if (photoCount < 3) photoTips.push("Add more photos — listings with 4+ photos sell 2x faster");
  if (photoCount < 6) photoTips.push("Aim for 6 photos: front, back, sides, detail shots, and any flaws");
  if (!hasPrimarySet && photoCount > 1) photoTips.push("Set a primary photo — this is what buyers see first in search results");

  // Listing Score
  const hasTitle = !!ai.recommended_title;
  const hasDescription = !!ai.recommended_description;
  const hasKeywords = ai.keywords?.length > 5;
  const hasPricing = ai.estimated_value_mid != null;
  const listingScore = Math.min(100, (hasTitle ? 25 : 10) + (hasDescription ? 25 : 10) + (hasKeywords ? 20 : 5) + (hasPricing ? 15 : 0) + (ai.condition_details ? 15 : 5));

  const titleSuggestion = ai.recommended_title || `${ai.brand ? ai.brand + " " : ""}${ai.item_name || item.title || "Item"} — ${ai.condition_guess || "Good"} Condition`;
  const descriptionTips: string[] = [];
  if (ai.recommended_description) descriptionTips.push(ai.recommended_description);
  if (ai.condition_details) descriptionTips.push(`Mention condition specifics: "${ai.condition_details.slice(0, 100)}"`);
  if (ai.material) descriptionTips.push(`Highlight material: ${ai.material}`);
  if (ai.era) descriptionTips.push(`Include era/period: ${ai.era}`);
  if (ai.markings) descriptionTips.push(`Mention markings/labels: ${ai.markings}`);
  if (ai.dimensions_estimate) descriptionTips.push(`Include measurements: ${ai.dimensions_estimate}`);
  if (ai.value_drivers?.length) descriptionTips.push(`Lead with value drivers: ${ai.value_drivers.slice(0, 3).join(", ")}`);

  // Staging Score
  const conditionScore = ai.condition_score ?? 5;
  const cosmeticScore = ai.condition_cosmetic ?? conditionScore;
  const stagingBase = Math.round((conditionScore + cosmeticScore) / 2 * 10);
  const positiveBonus = (ai.positive_notes?.length ?? 0) >= 2 ? 10 : 0;
  const issuesPenalty = (ai.visible_issues?.length ?? 0) >= 3 ? -10 : 0;
  const stagingScore = Math.min(100, Math.max(0, stagingBase + positiveBonus + issuesPenalty));

  const stagingSuggestions: string[] = [];
  if (ai.visible_issues?.length) stagingSuggestions.push(`Photograph honestly but minimize in primary photo: ${ai.visible_issues.slice(0, 2).join("; ")}`);
  if (ai.positive_notes?.length) stagingSuggestions.push(`Highlight strengths prominently: ${ai.positive_notes.slice(0, 3).join("; ")}`);
  if (ai.is_antique) stagingSuggestions.push("Stage with context — show patina as character, not damage. Antique buyers value authenticity.");
  if (ai.is_collectible) stagingSuggestions.push("Include proof of authenticity if available — certificates, original packaging, provenance documents");
  if (cosmeticScore < 5) stagingSuggestions.push("Consider cleaning/light restoration before photographing — first impressions matter");
  if (cosmeticScore >= 8) stagingSuggestions.push("Item presents beautifully — use lifestyle staging to help buyers envision ownership");

  // Platform Recommendations
  const platforms: { name: string; fit: string; reason: string }[] = [];
  if (ai.best_platforms?.length) {
    const fitLevels = ["Excellent", "Good", "Good", "Fair", "Fair"];
    ai.best_platforms.slice(0, 5).forEach((p: string, i: number) => {
      platforms.push({ name: p, fit: fitLevels[i] || "Fair", reason: ai.regional_best_why || `Strong ${ai.category || "item"} market` });
    });
  }
  if (platforms.length === 0) {
    platforms.push(
      { name: "Facebook Marketplace", fit: "Good", reason: "Large local buyer pool, no listing fees" },
      { name: "eBay", fit: "Good", reason: "Largest secondhand marketplace with buyer protections" },
      { name: "Craigslist", fit: "Fair", reason: "Free listings, local pickup preferred" },
    );
  }

  const overallScore = Math.round(presentationScore * 0.4 + listingScore * 0.35 + stagingScore * 0.25);
  const keywords = ai.keywords?.slice(0, 10) || [];

  const result = {
    _isDemo: false,
    overallScore,
    presentation: { score: presentationScore, photoQualityScore: rawPhotoScore, photoCount, tips: photoTips.slice(0, 5) },
    listing: { score: listingScore, titleSuggestion, descriptionTips: descriptionTips.slice(0, 5), keywords },
    staging: { score: stagingScore, conditionScore, cosmeticScore, suggestions: stagingSuggestions.slice(0, 5) },
    platforms,
    summary: `Overall presentation score: ${overallScore}/100. ${
      overallScore >= 80 ? "Strong listing — ready to publish." :
      overallScore >= 60 ? "Good foundation — a few improvements could boost buyer interest." :
      overallScore >= 40 ? "Needs work — focus on photo quality and description detail." :
      "Significant improvements needed before listing."
    } ${photoCount < 3 ? "Priority: add more photos." : ""}${!hasTitle ? " Priority: optimize your listing title." : ""}`,
    _dataSource: {
      photoQuality: ai.photo_quality_score ? "AI analysis" : "default estimate",
      title: ai.recommended_title ? "AI-generated" : "template",
      platforms: ai.best_platforms?.length ? "AI-recommended" : "default suggestions",
      condition: ai.condition_score ? "AI analysis" : "not assessed",
    },
  };

  await prisma.eventLog.create({
    data: { itemId, eventType: "STYLEBOT_RESULT", payload: JSON.stringify(result) },
  });

  return NextResponse.json({ success: true, result, isDemo: false });
}
