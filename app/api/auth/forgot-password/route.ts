import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { emailWrapper, ctaButton, ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendResetEmail(toEmail: string, resetUrl: string): Promise<void> {
  await sendEmail({
    to: toEmail,
    subject: "Reset your LegacyLoop password",
    html: emailWrapper(`
      <h1 style="font-size:22px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 16px;text-align:center">Reset your password</h1>
      <p style="font-size:15px;color:${TEXT_SECONDARY};line-height:1.7;margin:0 0 24px">
        We received a request to reset the password for your LegacyLoop account.
        Click the button below to choose a new password.
      </p>
      <div style="text-align:center;margin:28px 0">
        ${ctaButton("Reset My Password", resetUrl)}
      </div>
      <p style="font-size:14px;color:${TEXT_MUTED};line-height:1.6;margin:0 0 8px">
        Or copy and paste this link into your browser:
      </p>
      <p style="word-break:break-all;font-size:13px;color:${ACCENT};background:rgba(0,188,212,0.06);border:1px solid rgba(0,188,212,0.2);border-radius:8px;padding:10px 14px;margin:0 0 24px">
        ${resetUrl}
      </p>
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:18px">
        <p style="color:${TEXT_MUTED};font-size:13px;margin:0">
          This link expires in <strong style="color:${TEXT_SECONDARY}">1 hour</strong>. If you did not request a password reset,
          you can safely ignore this email — your password will not change.
        </p>
      </div>
    `),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) return new Response("Missing email", { status: 400 });

  // Always return 200 — don't reveal whether the email exists
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return Response.json({ ok: true });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  await sendResetEmail(email, resetUrl);

  return Response.json({ ok: true });
}
