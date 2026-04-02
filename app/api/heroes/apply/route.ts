import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { analyzeHeroDocument } from "@/lib/services/hero-verify-ai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const fullName = formData.get("fullName") as string | null;
    const email = formData.get("email") as string | null;
    const serviceCategory = formData.get("serviceCategory") as string | null;
    const serviceDetail = formData.get("serviceDetail") as string | null;
    const department = (formData.get("department") as string | null) || null;
    const proofFile = formData.get("proofFile") as File | null;

    // Validate required fields
    if (!fullName?.trim() || !email?.trim() || !serviceCategory || !serviceDetail) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, email, serviceCategory, serviceDetail" },
        { status: 400 }
      );
    }

    // Validate service category
    const validCategories = ["MILITARY", "LAW_ENFORCEMENT", "FIRE_EMS"];
    if (!validCategories.includes(serviceCategory)) {
      return NextResponse.json(
        { error: "Invalid service category" },
        { status: 400 }
      );
    }

    // Get session (optional — logged-in users get linked)
    let userId: string | null = null;
    try {
      const session = await authAdapter.getSession();
      userId = session?.id ?? null;
    } catch {
      // Not logged in — that's fine
    }

    // Save proof file if provided
    let proofFileName: string | null = null;
    let proofFilePath: string | null = null;

    if (proofFile && proofFile.size > 0) {
      // Validate file size (10 MB max)
      if (proofFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum 10 MB." },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/heic",
        "image/heif",
        "application/pdf",
      ];
      if (!allowedTypes.includes(proofFile.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Accepted: JPG, PNG, PDF, HEIC." },
          { status: 400 }
        );
      }

      const ext = proofFile.name.split(".").pop() || "bin";
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "hero-proofs");

      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });

      const buffer = Buffer.from(await proofFile.arrayBuffer());
      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      proofFileName = proofFile.name;
      proofFilePath = `/uploads/hero-proofs/${uniqueName}`;
    }

    // Create HeroVerification record
    const verification = await prisma.heroVerification.create({
      data: {
        userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        serviceCategory,
        serviceDetail,
        department,
        proofFileName,
        proofFilePath,
        status: "PENDING",
      },
    });

    // Create notification for logged-in user
    if (userId) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            type: "HERO_APPLICATION",
            title: "Hero verification application submitted",
            message: `Your ${serviceCategory.replace(/_/g, " ").toLowerCase()} verification is under review. We'll notify you within 24 hours.`,
            link: "/heroes",
          },
        });
      } catch {
        // Notification creation is non-critical
      }
    }

    // ── Auto-run AI verification if proof file was uploaded (non-blocking) ──
    if (proofFilePath) {
      analyzeHeroDocument(
        proofFilePath,
        fullName.trim(),
        serviceCategory,
        serviceDetail,
        department
      ).then(async (result) => {
        const aiSummary = `[AI PRE-SCREEN] Confidence: ${result.confidence}% | Valid: ${result.isLikelyValid ? "YES" : "NO"} | Doc: ${result.documentType} | Category match: ${result.matchesCategory ? "YES" : "NO"} | Name match: ${result.nameMatchScore}% | ${result.flags.length > 0 ? "Flags: " + result.flags.join(", ") : "No flags"} | ${result.summary}`;
        await prisma.heroVerification.update({
          where: { id: verification.id },
          data: { reviewNotes: aiSummary },
        });
        console.log(`[HeroAI] Auto-analyzed ${fullName}: confidence=${result.confidence}%`);
      }).catch((err) => {
        console.error("[HeroAI] Auto-analysis failed (non-blocking):", err);
      });
    }

    return NextResponse.json({
      success: true,
      id: verification.id,
      status: "PENDING",
    });
  } catch (err: any) {
    console.error("[heroes/apply] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
