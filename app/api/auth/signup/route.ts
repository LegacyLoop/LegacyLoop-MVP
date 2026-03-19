import { NextRequest } from "next/server";
import { authAdapter } from "@/lib/adapters/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";

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

    // Send welcome email (fire-and-forget — never block signup)
    const name = trimmedEmail.split("@")[0];
    const welcome = welcomeEmail(name);
    sendEmail({ to: trimmedEmail, ...welcome });

    // Notify n8n for welcome drip sequence (fire-and-forget)
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/new-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, firstName: name, signupDate: new Date().toISOString() }),
      }).catch(() => {});
    }

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
