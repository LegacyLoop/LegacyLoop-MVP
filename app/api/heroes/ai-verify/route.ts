import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { isAdmin } from "@/lib/constants/admin";
import { prisma } from "@/lib/db";
import { analyzeHeroDocument } from "@/lib/services/hero-verify-ai";

/**
 * POST /api/heroes/ai-verify
 * Runs AI Vision analysis on a hero verification document.
 * Admin-only. Takes a verificationId, reads the proof file, and returns AI assessment.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authAdapter.getSession();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { verificationId } = body;

    if (!verificationId) {
      return NextResponse.json({ error: "verificationId required" }, { status: 400 });
    }

    const verification = await prisma.heroVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    if (!verification.proofFilePath) {
      return NextResponse.json({
        error: "No proof document uploaded for this application",
        result: {
          isLikelyValid: false,
          confidence: 0,
          summary: "No document was uploaded. Manual verification required.",
          flags: ["No proof document uploaded"],
        },
      }, { status: 400 });
    }

    console.log(`[HeroAI] Analyzing verification ${verificationId} for ${verification.fullName}`);

    const result = await analyzeHeroDocument(
      verification.proofFilePath,
      verification.fullName,
      verification.serviceCategory,
      verification.serviceDetail,
      verification.department
    );

    // Store the AI result in the verification record's reviewNotes (append, don't overwrite)
    const aiSummary = `[AI PRE-SCREEN] Confidence: ${result.confidence}% | Valid: ${result.isLikelyValid ? "YES" : "NO"} | Doc: ${result.documentType} | Category match: ${result.matchesCategory ? "YES" : "NO"} | Name match: ${result.nameMatchScore}% | ${result.flags.length > 0 ? "Flags: " + result.flags.join(", ") : "No flags"} | ${result.summary}`;

    await prisma.heroVerification.update({
      where: { id: verificationId },
      data: {
        reviewNotes: verification.reviewNotes
          ? `${verification.reviewNotes}\n\n${aiSummary}`
          : aiSummary,
      },
    });

    console.log(`[HeroAI] Result for ${verification.fullName}: confidence=${result.confidence}% valid=${result.isLikelyValid}`);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[HeroAI] Error:", err);
    return NextResponse.json({ error: "AI verification failed" }, { status: 500 });
  }
}
