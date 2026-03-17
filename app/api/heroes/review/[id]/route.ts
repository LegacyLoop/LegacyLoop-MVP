import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";

import { isAdmin } from "@/lib/constants/admin";

type Params = Promise<{ id: string }>;

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  try {
    // Auth check
    const user = await authAdapter.getSession();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const { action, notes } = body as { action?: string; notes?: string };

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await prisma.heroVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    // Update the verification record
    const updated = await prisma.heroVerification.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: user.email,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
      },
    });

    // If approved AND userId exists, update the user
    if (action === "approve" && verification.userId) {
      await prisma.user.update({
        where: { id: verification.userId },
        data: {
          heroVerified: true,
          heroCategory: verification.serviceCategory,
        },
      });
    }

    // Create notification for the applicant (if they have a userId)
    if (verification.userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: verification.userId,
            type: action === "approve" ? "HERO_APPROVED" : "HERO_REJECTED",
            title: action === "approve"
              ? "Hero verification approved! 25% discount activated."
              : "Hero verification update",
            message: action === "approve"
              ? "Your service has been verified. Your 25% hero discount is now active on all plans."
              : `Your verification application needs attention. ${notes ? `Note: ${notes}` : "Please contact heroes@legacyloop.com for details."}`,
            link: "/heroes",
          },
        });
      } catch {
        // Notification creation is non-critical
      }
    }

    return NextResponse.json({
      success: true,
      verification: updated,
    });
  } catch (err: any) {
    console.error("[heroes/review] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
