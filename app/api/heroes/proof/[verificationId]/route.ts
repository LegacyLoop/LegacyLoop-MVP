import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { ADMIN_EMAILS } from "@/lib/constants/admin";
import { readFile } from "fs/promises";
import path from "path";

type Params = Promise<{ verificationId: string }>;

/**
 * GET /api/heroes/proof/[verificationId]
 * Serves hero proof documents through an authorized route.
 * Only admins can access these sensitive identity documents.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const { verificationId } = await params;
  const user = await authAdapter.getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Only admins can view hero proof documents
  if (!ADMIN_EMAILS.includes(user.email)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const verification = await prisma.heroVerification.findUnique({
      where: { id: verificationId },
      select: { proofFilePath: true, proofFileName: true },
    });

    if (!verification?.proofFilePath) {
      return new Response("No proof file found", { status: 404 });
    }

    // Read from the secure data/ directory (NOT public/)
    const filePath = path.join(process.cwd(), "data", verification.proofFilePath);
    const buffer = await readFile(filePath);

    // Determine content type from extension
    const ext = (verification.proofFileName || "").split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      pdf: "application/pdf",
      heic: "image/heic",
      heif: "image/heif",
    };
    const contentType = contentTypes[ext || ""] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${verification.proofFileName || "proof"}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[heroes/proof] Error serving file:", err);
    return new Response("File not found", { status: 404 });
  }
}
