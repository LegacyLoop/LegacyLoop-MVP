import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, resetIn } = checkRateLimit("login", ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Generate a 64-char token from two UUIDs
    const token =
      crypto.randomUUID().replace(/-/g, "") +
      crypto.randomUUID().replace(/-/g, "");

    // Expire all unused magic links for this email
    await prisma.magicLink.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Create new magic link (expires in 1 hour)
    await prisma.magicLink.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const verifyUrl = `${APP_URL}/api/auth/magic-link/verify?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Your LegacyLoop sign-in link",
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0e7490,#00bcd4);padding:28px 32px;text-align:center;">
              <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                LL
              </span>
              <span style="font-size:20px;font-weight:600;color:#ffffff;margin-left:8px;vertical-align:middle;">
                LegacyLoop
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 24px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a;">
                Sign in to LegacyLoop
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">
                Click the button below to sign in &mdash; no password needed.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" target="_blank"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0e7490,#00bcd4);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Sign In to LegacyLoop
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 8px;font-size:13px;color:#71717a;">Or copy this link:</p>
              <p style="margin:0 0 24px;font-size:13px;color:#00bcd4;word-break:break-all;">
                ${verifyUrl}
              </p>
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
              <p style="margin:0 0 4px;font-size:13px;color:#a1a1aa;">
                This link expires in 1 hour.
              </p>
              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                If you didn&rsquo;t request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                Need help? Contact us at
                <a href="mailto:support@legacyloop.com" style="color:#00bcd4;text-decoration:none;">support@legacyloop.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim(),
    });

    // Always return ok — don't leak whether the email exists
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MAGIC-LINK SEND]", err);
    return NextResponse.json({ ok: true });
  }
}
