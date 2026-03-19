import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { emailWrapper, ctaButton, ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED } from "@/lib/email/templates";
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
      html: emailWrapper(`
        <h1 style="font-size:22px;font-weight:700;color:${TEXT_PRIMARY};margin:0 0 12px;text-align:center">Sign in to LegacyLoop</h1>
        <p style="font-size:15px;color:${TEXT_SECONDARY};line-height:1.6;margin:0 0 28px;text-align:center">
          Click the button below to sign in &mdash; no password needed.
        </p>
        <div style="text-align:center;margin:0 0 28px">
          ${ctaButton("Sign In to LegacyLoop", verifyUrl)}
        </div>
        <p style="font-size:13px;color:${TEXT_MUTED};margin:0 0 8px">Or copy this link:</p>
        <p style="font-size:13px;color:${ACCENT};word-break:break-all;background:rgba(0,188,212,0.06);border:1px solid rgba(0,188,212,0.2);border-radius:8px;padding:10px 14px;margin:0 0 24px">
          ${verifyUrl}
        </p>
        <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:18px">
          <p style="font-size:13px;color:${TEXT_MUTED};margin:0 0 4px">This link expires in 1 hour.</p>
          <p style="font-size:13px;color:${TEXT_MUTED};margin:0">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `).trim(),
    });

    // Always return ok — don't leak whether the email exists
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[MAGIC-LINK SEND]", err);
    return NextResponse.json({ ok: true });
  }
}
