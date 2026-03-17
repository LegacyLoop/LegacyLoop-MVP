import { prisma } from "@/lib/db";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@legacy-loop.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendResetEmail(toEmail: string, resetUrl: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log("[forgot-password] No SENDGRID_API_KEY — reset URL:", resetUrl);
    return;
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: FROM_EMAIL, name: "LegacyLoop" },
      subject: "Reset your LegacyLoop password",
      content: [
        {
          type: "text/html",
          value: `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; background: #fafaf8; color: #1c1917;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; width: 56px; height: 56px; background: #0f766e; border-radius: 16px; color: white; font-size: 22px; font-weight: 800; line-height: 56px; text-align: center;">LL</div>
    <div style="font-size: 22px; font-weight: 700; margin-top: 12px;">LegacyLoop</div>
  </div>

  <div style="background: white; border: 1px solid #e7e5e4; border-radius: 20px; padding: 36px;">
    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 12px;">Reset your password</h1>
    <p style="color: #57534e; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
      We received a request to reset the password for your LegacyLoop account.
      Click the button below to choose a new password.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}"
         style="display: inline-block; background: #0f766e; color: white; text-decoration: none;
                font-size: 17px; font-weight: 600; padding: 14px 32px; border-radius: 12px;">
        Reset My Password
      </a>
    </div>

    <p style="color: #78716c; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="word-break: break-all; font-size: 13px; color: #0f766e; background: #f0fdfa;
              border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 14px; margin: 0 0 24px;">
      ${resetUrl}
    </p>

    <div style="border-top: 1px solid #e7e5e4; padding-top: 18px;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">
        This link expires in <strong>1 hour</strong>. If you did not request a password reset,
        you can safely ignore this email — your password will not change.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 28px; color: #a8a29e; font-size: 13px;">
    Need help? Call us at <a href="tel:2075550100" style="color: #0f766e;">(207) 555-0100</a><br>
    or email <a href="mailto:help@legacy-loop.com" style="color: #0f766e;">help@legacy-loop.com</a>
  </div>
</body>
</html>`,
        },
        {
          type: "text/plain",
          value: `Reset your LegacyLoop password\n\nClick this link to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\nNeed help? Call (207) 555-0100 or email help@legacy-loop.com`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[forgot-password] SendGrid error:", res.status, body);
    // Don't throw — we still return success to the user
  }
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
