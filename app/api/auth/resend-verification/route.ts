import { authAdapter } from "@/lib/adapters/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { verificationEmail } from "@/lib/email/templates";
import { randomBytes } from "crypto";

/**
 * POST /api/auth/resend-verification
 * Generates a new verification token and resends the email.
 * CMD-EMAIL-VERIFICATION (follow-up)
 */
export async function POST() {
  try {
    const user = await authAdapter.getSession();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Check if already verified
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true, email: true, displayName: true },
    });

    if (!full) return Response.json({ error: "User not found" }, { status: 404 });
    if (full.emailVerified) return Response.json({ message: "Already verified" });

    // Generate new token + 24h expiry
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: token, emailVerifyExpires: expires },
    });

    // Send verification email
    const firstName = (full.displayName || full.email.split("@")[0] || "").split(" ")[0];
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.legacy-loop.com"}/api/auth/verify-email?token=${token}`;
    const email = verificationEmail(firstName, verifyUrl);
    await sendEmail({ to: full.email, ...email });

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("[resend-verification]", err.message);
    return Response.json({ error: "Failed to resend" }, { status: 500 });
  }
}
