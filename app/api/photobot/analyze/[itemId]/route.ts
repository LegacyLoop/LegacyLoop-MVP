import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { canUseBotOnTier, BOT_CREDIT_COSTS } from "@/lib/constants/pricing";
import { isDemoMode } from "@/lib/bot-mode";
import { checkCredits, deductCredits, hasPriorBotRun } from "@/lib/credits";
import { loadSkillPack } from "@/lib/bots/skill-loader";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function safeJson(s: string | null | undefined): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

/**
 * POST /api/photobot/analyze/[itemId]
 * CMD-PHOTOBOT-CORE-B: Multi-photo analysis endpoint.
 *
 * Analyzes ALL uploaded photos together in a single GPT-4o Vision
 * call. Returns angle detection, per-photo ranking, hero photo
 * recommendation, platform-specific guidance, and listing readiness
 * score. Does NOT generate or edit images — that stays in the
 * enhance and edit routes.
 *
 * Separation of concerns:
 *   /api/photobot/analyze  → multi-photo diagnostic (this route)
 *   /api/photobot/enhance  → single-photo improvement + image gen
 *   /api/photobot/edit     → single-photo background removal
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    // ── Tier + Credit Gate ──
    if (!isDemoMode()) {
      if (!canUseBotOnTier(user.tier, "photoBot")) {
        return NextResponse.json({ error: "upgrade_required", message: "Upgrade your plan to access PhotoBot.", upgradeUrl: "/pricing?upgrade=true" }, { status: 403 });
      }
      const isRerun = await hasPriorBotRun(user.id, itemId, "PHOTOBOT_ANALYSIS");
      const cost = isRerun ? BOT_CREDIT_COSTS.singleBotReRun : BOT_CREDIT_COSTS.singleBotRun;
      const cc = await checkCredits(user.id, cost);
      if (!cc.hasEnough) {
        return NextResponse.json({ error: "insufficient_credits", balance: cc.balance, required: cost, buyUrl: "/credits" }, { status: 402 });
      }
      await deductCredits(user.id, cost, isRerun ? "PhotoBot Analysis re-run" : "PhotoBot Analysis run", itemId);
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        photos: { orderBy: { order: "asc" } },
        aiResult: true,
        valuation: true,
      },
    });

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.userId !== user.id) return NextResponse.json({ error: "Not your item" }, { status: 403 });

    if (!item.photos || item.photos.length === 0) {
      return NextResponse.json({ error: "No photos uploaded. Upload at least one photo before running analysis." }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    // ── Build enrichment from AnalyzeBot ──
    const ai = safeJson(item.aiResult?.rawJson);
    const itemName = ai?.item_name || item.title || "Unknown item";
    const category = ai?.category || "General";
    const isAntique = !!(ai?.is_antique);
    const isCollectible = !!(ai?.is_collectible);
    const isVehicle = !!(ai?.is_vehicle);

    // ── Build multi-photo image content ──
    const imageContent: Array<{ type: string; image_url: string; detail: string }> = [];
    const photoMap: Array<{ id: string; filePath: string; order: number; isPrimary: boolean; index: number }> = [];

    for (let i = 0; i < Math.min(item.photos.length, 10); i++) {
      const photo = item.photos[i];
      try {
        // CMD-CLOUDINARY-PHOTO-READ-FIX: read from URL or local disk
        const { readPhotoAsBuffer, guessMimeType } = await import("@/lib/adapters/storage");
        const buffer = await readPhotoAsBuffer(photo.filePath);
        if (buffer.length > 10 * 1024 * 1024) {
          console.warn(`[photobot-analyze] Skipping oversized photo: ${photo.filePath}`);
          continue;
        }
        const mime = guessMimeType(photo.filePath);
        const base64 = buffer.toString("base64");
        imageContent.push({
          type: "input_image",
          image_url: `data:${mime};base64,${base64}`,
          detail: "high",
        });
        photoMap.push({ id: photo.id, filePath: photo.filePath, order: photo.order, isPrimary: photo.isPrimary, index: i + 1 });
      } catch {
        console.warn(`[photobot-analyze] Skipping unreadable photo: ${photo.filePath}`);
      }
    }

    if (imageContent.length === 0) {
      return NextResponse.json({ error: "No readable photos found." }, { status: 400 });
    }

    const photoCount = imageContent.length;
    console.log(`[photobot-analyze] Analyzing ${photoCount} photos for item ${itemId}`);

    // ── Skill pack ──
    const skillPack = loadSkillPack("photobot");
    const skillPackPrefix = skillPack.systemPromptBlock
      ? skillPack.systemPromptBlock + "\n\n"
      : "";

    // ── Category-specific angle requirements ──
    let categoryAngles = "front, back, left side, right side, top, detail shot, maker marks, condition/flaws";
    if (isAntique) {
      categoryAngles = "front, back, left side, right side, top, bottom/underside, maker marks/hallmarks/stamps, detail of joinery/construction, condition/flaws, provenance labels/tags, scale reference";
    } else if (isCollectible) {
      categoryAngles = "front, back, corners (all 4 for cards), edges, surface close-up, centering reference, grade-relevant details, packaging/box, authentication marks";
    } else if (isVehicle) {
      categoryAngles = "front 3/4, rear 3/4, driver side, passenger side, front straight, rear straight, engine bay, interior dashboard, interior rear seat, odometer, VIN plate, tire tread, undercarriage, trunk";
    }

    // ── Multi-photo analysis prompt ──
    const systemPrompt = skillPackPrefix + `You are a world-class product photography analyst and listing optimization expert. You are analyzing ALL ${photoCount} photos of a single item together. Your job is to evaluate the COMPLETE photo set — not individual photos in isolation.

Item: ${itemName}
Category: ${category}
${isAntique ? "This is an ANTIQUE item — maker marks, construction details, and provenance photos are critical." : ""}
${isCollectible ? "This is a COLLECTIBLE — grading-relevant angles (corners, edges, surface, centering) are critical." : ""}
${isVehicle ? "This is a VEHICLE — comprehensive exterior + interior + mechanical documentation is critical." : ""}

REQUIRED ANGLES FOR THIS CATEGORY: ${categoryAngles}

The photos are numbered Photo 1 through Photo ${photoCount} in the order they were uploaded.

Analyze the COMPLETE photo set and return a JSON object with ALL of these fields:

{
  "covered_angles": ["array of angles that ARE covered by the existing photos — use the category-specific angle names above"],
  "missing_angles": ["array of angles that are NOT covered — these are photos the seller should still take"],
  "missing_angle_suggestions": [
    {"angle": "angle name", "why": "why this angle matters for selling this item", "priority": "HIGH | MEDIUM | LOW"}
  ],
  "angle_coverage_score": number 0-100 (percentage of required angles covered),

  "photos_ranked": [
    {
      "photo_number": number (1-based index matching the upload order),
      "composition_score": number 1-10,
      "lighting_score": number 1-10,
      "focus_score": number 1-10,
      "background_score": number 1-10,
      "item_coverage_score": number 1-10 (how much of the item is visible),
      "condition_visibility_score": number 1-10 (how well condition/flaws are documented),
      "overall_score": number 1-10,
      "strengths": "what this photo does well",
      "weaknesses": "what could be improved"
    }
  ],

  "hero_photo_id": number (photo_number of the best photo for cover/primary),
  "hero_photo_reasoning": "why this photo should be the cover — be specific about composition, lighting, and buyer impact",

  "platform_heroes": {
    "ebay": {"photo_number": number, "reasoning": "eBay prefers white/clean backgrounds, item-focused"},
    "etsy": {"photo_number": number, "reasoning": "Etsy rewards lifestyle/styled photos"},
    "facebook": {"photo_number": number, "reasoning": "Facebook needs bright, clear, scroll-stopping"},
    "firstdibs": {"photo_number": number, "reasoning": "1stDibs expects elegant, gallery-quality"}
  },

  "retake_recommendations": [
    {"photo_number": number, "issue": "specific problem", "fix": "specific improvement instruction"}
  ],

  "readiness_score": number 0-100,
  "readiness_tier": "GOLD | SILVER | BRONZE | NOT_READY",
  "readiness_reasoning": "why this score — cite specific angle gaps, quality issues, or strengths",

  "executive_summary": "3-5 sentences for the seller. How good is their photo set? What's the single most impactful thing they should do next? Be warm and specific."
}

SCORING RULES:
- readiness_score 90-100 = GOLD (publish ready — all critical angles covered, quality is high)
- readiness_score 75-89 = SILVER (minor improvements would help — maybe 1-2 missing angles or quality fixes)
- readiness_score 60-74 = BRONZE (needs work — multiple missing angles or several low-quality photos)
- readiness_score below 60 = NOT_READY (significant gaps — missing critical angles, poor quality, or too few photos)

HERO SELECTION RULES:
- The hero photo should have: clean background OR strong composition, good lighting, item fills 60-80% of frame, sharp focus, true colors
- For eBay: prefer clean/white backgrounds
- For Etsy: prefer styled/lifestyle staging
- For Facebook: prefer bright, eye-catching, mobile-optimized
- For 1stDibs: prefer elegant, gallery-quality, professional staging

Return ONLY valid JSON. No markdown fences. Start with {.`;

    // ── Call GPT-4o Vision with all photos ──
    let analysisResult: any = null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    try {
      const response = await openai.responses.create({
        model: "gpt-4o",
        input: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze these ${photoCount} photos together as a complete listing photo set. Score each photo individually AND evaluate the overall set coverage. Return ONLY valid JSON.`,
              },
              ...imageContent,
            ] as any,
          },
        ],
        max_output_tokens: 8192,
      }, { signal: controller.signal });

      const text = typeof response.output === "string"
        ? response.output
        : response.output_text || JSON.stringify(response.output);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        console.error("[photobot-analyze] No JSON in response");
        return NextResponse.json({ error: "Analysis returned no structured data" }, { status: 422 });
      }
    } catch (aiErr: any) {
      console.error("[photobot-analyze] GPT-4o error:", aiErr?.message);
      return NextResponse.json({ error: `Photo analysis failed: ${aiErr?.message ?? String(aiErr)}` }, { status: 422 });
    } finally {
      clearTimeout(timeoutId);
    }

    // ── Map photo_number back to photo IDs ──
    if (analysisResult && Array.isArray(analysisResult.photos_ranked)) {
      for (const ranked of analysisResult.photos_ranked) {
        const mapped = photoMap.find((p) => p.index === ranked.photo_number);
        if (mapped) {
          ranked.photo_id = mapped.id;
          ranked.file_path = mapped.filePath;
          ranked.is_current_primary = mapped.isPrimary;
        }
      }
    }

    // Map hero_photo_id (number) to actual photo ID
    if (analysisResult?.hero_photo_id) {
      const heroMapped = photoMap.find((p) => p.index === analysisResult.hero_photo_id);
      if (heroMapped) {
        analysisResult.hero_photo_db_id = heroMapped.id;
        analysisResult.hero_photo_file_path = heroMapped.filePath;
      }
    }

    // Map platform heroes
    if (analysisResult?.platform_heroes) {
      for (const [platform, hero] of Object.entries(analysisResult.platform_heroes)) {
        const h = hero as any;
        if (h?.photo_number) {
          const mapped = photoMap.find((p) => p.index === h.photo_number);
          if (mapped) h.photo_id = mapped.id;
        }
      }
    }

    // ── Store result ──
    await prisma.eventLog.create({
      data: {
        itemId,
        eventType: "PHOTOBOT_ANALYSIS",
        payload: JSON.stringify({
          ...analysisResult,
          photoCount,
          photoMap,
          analyzedAt: new Date().toISOString(),
        }),
      },
    });

    // ── PHOTOBOT_ANALYSIS_RUN telemetry ──
    try {
      await prisma.eventLog.create({
        data: {
          itemId,
          eventType: "PHOTOBOT_ANALYSIS_RUN",
          payload: JSON.stringify({
            userId: user.id,
            timestamp: new Date().toISOString(),
            skillPackVersion: skillPack.version,
            skillPackCount: skillPack.skillNames.length,
            skillPackChars: skillPack.totalChars,
            photoCount,
            angleCoverageScore: analysisResult?.angle_coverage_score ?? null,
            readinessScore: analysisResult?.readiness_score ?? null,
            readinessTier: analysisResult?.readiness_tier ?? null,
            heroPhotoNumber: analysisResult?.hero_photo_id ?? null,
            missingAngleCount: Array.isArray(analysisResult?.missing_angles) ? analysisResult.missing_angles.length : 0,
            coveredAngleCount: Array.isArray(analysisResult?.covered_angles) ? analysisResult.covered_angles.length : 0,
            retakeCount: Array.isArray(analysisResult?.retake_recommendations) ? analysisResult.retake_recommendations.length : 0,
            isDemo: false,
          }),
        },
      });
    } catch (logErr) {
      console.warn("[photobot-analyze] PHOTOBOT_ANALYSIS_RUN log failed (non-critical):", logErr);
    }

    return NextResponse.json({
      success: true,
      result: {
        ...analysisResult,
        photoCount,
        photoMap,
      },
    });
  } catch (e: any) {
    console.error("[photobot-analyze] Unexpected error:", e);
    return NextResponse.json({ error: e?.message || "Photo analysis failed" }, { status: 500 });
  }
}

/**
 * GET /api/photobot/analyze/[itemId]
 * Retrieve existing multi-photo analysis result
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await authAdapter.getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await params;

    const item = await prisma.item.findUnique({ where: { id: itemId }, select: { userId: true } });
    if (!item || item.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.eventLog.findFirst({
      where: { itemId, eventType: "PHOTOBOT_ANALYSIS" },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) return NextResponse.json({ hasResult: false, result: null });

    return NextResponse.json({
      hasResult: true,
      result: safeJson(existing.payload),
      createdAt: existing.createdAt,
    });
  } catch (e) {
    console.error("[photobot-analyze GET]", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
