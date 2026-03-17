import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code } = body as { phone?: string; code?: string };

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone and code are required." },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid phone number." },
        { status: 400 }
      );
    }

    // Find the most recent unused, non-expired OTP for this phone
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone: normalized,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired code. Please try again." },
        { status: 400 }
      );
    }

    // Check if code matches
    if (otpRecord.code !== code.trim()) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;

      if (newAttempts >= 5) {
        // Lock out this OTP
        await prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { used: true, attempts: newAttempts },
        });
        return NextResponse.json(
          { error: "Too many attempts. Please request a new code." },
          { status: 400 }
        );
      }

      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: newAttempts },
      });

      return NextResponse.json(
        { error: "That code doesn't match. Please try again." },
        { status: 400 }
      );
    }

    // Code matches — mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Find or create user by phone number
    let user = await prisma.user.findUnique({
      where: { phoneNumber: normalized },
    });

    if (!user) {
      // Phone-only user: generate placeholder email and random password hash
      const cleanedDigits = normalized.replace(/\D/g, "");
      const placeholderEmail = `phone_${cleanedDigits}@phone.legacyloop.com`;
      const randomPasswordHash = await bcrypt.hash(crypto.randomUUID(), 12);

      user = await prisma.user.create({
        data: {
          phoneNumber: normalized,
          email: placeholderEmail,
          passwordHash: randomPasswordHash,
          tier: 1,
        },
      });
    }

    // Issue session (JWT cookie)
    await authAdapter.issueSession(user.id, user.tier);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
