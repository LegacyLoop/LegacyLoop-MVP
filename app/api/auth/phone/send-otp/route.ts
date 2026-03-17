import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit("signup", ip);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { phone } = body as { phone?: string };

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit US phone number." },
        { status: 400 }
      );
    }

    // Generate 6-digit zero-padded OTP
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

    // Expire all old unused OTPs for this phone
    await prisma.otpCode.updateMany({
      where: { phone: normalized, used: false },
      data: { used: true },
    });

    // Create new OTP record (expires in 10 minutes)
    await prisma.otpCode.create({
      data: {
        phone: normalized,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send SMS via Twilio REST API
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (sid && authToken && fromPhone) {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const credentials = Buffer.from(`${sid}:${authToken}`).toString("base64");

      const formBody = new URLSearchParams({
        From: fromPhone,
        To: normalized,
        Body: `Your LegacyLoop code: ${code}. Expires in 10 minutes.`,
      });

      const twilioRes = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });

      if (!twilioRes.ok) {
        const err = await twilioRes.text();
        console.error("Twilio SMS error:", err);
      }
    } else {
      // Demo mode — no Twilio credentials configured
      console.log(`[DEMO] OTP for ${normalized}: ${code}`);
    }

    // Always return ok (never reveal if phone exists)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
