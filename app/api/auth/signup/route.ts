import { NextRequest } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";
import { prisma } from "@/lib/db";
import { DISCOUNTS } from "@/lib/constants/pricing";
import { n8nNewUser, n8nNewUserCheck } from "@/lib/n8n";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, resetIn } = checkRateLimit("signup", ip);
  if (!allowed) {
    return new Response(
      "Too many attempts. Please wait a minute and try again.",
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
      }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response("Please enter your email and password.", {
        status: 400,
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return new Response("Please enter a valid email address.", {
        status: 400,
      });
    }

    if (String(password).length < 8) {
      return new Response("Password must be at least 8 characters.", {
        status: 400,
      });
    }

    await authAdapter.signup(trimmedEmail, String(password));

    // Award signup bonus credits (fire-and-forget — never block signup)
    try {
      const newUser = await prisma.user.findUnique({ where: { email: trimmedEmail }, select: { id: true } });
      if (newUser) {
        const existingCredits = await prisma.userCredits.findUnique({ where: { userId: newUser.id } });
        if (!existingCredits) {
          const uc = await prisma.userCredits.create({
            data: { userId: newUser.id, balance: DISCOUNTS.signup.credits, lifetime: DISCOUNTS.signup.credits, spent: 0 },
          });
          await prisma.creditTransaction.create({
            data: { userCreditsId: uc.id, type: "bonus", amount: DISCOUNTS.signup.credits, balance: DISCOUNTS.signup.credits, description: "Welcome bonus — thanks for joining LegacyLoop!" },
          });
        }
      }
    } catch { /* signup must not fail if credit award fails */ }

    // Send welcome email (fire-and-forget — never block signup)
    const name = trimmedEmail.split("@")[0];
    const welcome = welcomeEmail(name);
    sendEmail({ to: trimmedEmail, ...welcome });

    // n8n: WF1 drip sequence + WF12 health check (fire-and-forget)
    n8nNewUser(trimmedEmail, name);
    n8nNewUserCheck(trimmedEmail, name);

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    const msg = err?.message || "";
    if (msg.includes("already exists")) {
      return new Response(
        "That email is already registered. Try signing in instead.",
        { status: 400 }
      );
    }
    return new Response(
      "Something went wrong. Please try again.",
      { status: 400 }
    );
  }
}
