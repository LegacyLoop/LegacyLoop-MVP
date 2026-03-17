import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authAdapter } from "@/lib/adapters/auth";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/auth/login?error=expired`);
  }

  try {
    // Find valid, unused magic link
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink || magicLink.used || magicLink.expiresAt < new Date()) {
      return NextResponse.redirect(`${APP_URL}/auth/login?error=expired`);
    }

    // Mark as used
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { used: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: magicLink.email },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
      user = await prisma.user.create({
        data: {
          email: magicLink.email,
          passwordHash,
          tier: 1,
        },
      });
    }

    // Issue session cookie
    await authAdapter.issueSession(user.id, user.tier);

    return NextResponse.redirect(`${APP_URL}/dashboard`);
  } catch (err) {
    console.error("[MAGIC-LINK VERIFY]", err);
    return NextResponse.redirect(`${APP_URL}/auth/login?error=expired`);
  }
}
